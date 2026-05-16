import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getUserByEmail } from '@/lib/auth';

// GET /api/user/plantas/[id]/pautas — Listar pautas con herencia
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const email = request.headers.get('x-user-email');
  if (!email) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const user = await getUserByEmail(email);
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  try {
    const plantaId = resolvedParams.id;

    // Verificar propiedad y obtener especieId
    const [ownerCheck]: any = await pool.query(
      `SELECT vu.idvariedades, vu.xvariedadesidespecies 
       FROM variedades vu
       WHERE vu.idvariedades = ? AND vu.xvariedadesidusuarios = ?`,
      [plantaId, user.id]
    );
    if (ownerCheck.length === 0) {
      return NextResponse.json({ error: 'Planta no encontrada' }, { status: 404 });
    }

    const especieId = ownerCheck[0].xvariedadesidespecies;

    // Pautas de la especie (base) + LEFT JOIN con overrides del usuario
    const [pautas] = await pool.query(`
      SELECT 
        pe.idlaborespauta AS idlaborespauta_base,
        pe.xlaborespautaidlabores,
        pe.laborespautafase,
        l.laboresnombre,
        l.laboresicono,
        -- Herencia COALESCE
        COALESCE(pu.laborespautafrecuenciadias, pe.laborespautafrecuenciadias) AS frecuenciadias,
        COALESCE(pu.laborespautanotasia, pe.laborespautanotasia) AS notasia,
        COALESCE(pu.laborespautaactivosino, pe.laborespautaactivosino) AS activosino,
        -- Flags de personalización
        pu.idlaborespauta IS NOT NULL AS personalizada,
        pu.idlaborespauta AS idlaborespauta_usuario,
        -- Valores originales (para mostrar "heredado de")
        pe.laborespautafrecuenciadias AS frecuencia_original,
        pe.laborespautanotasia AS notas_original
      FROM laborespauta pe
      JOIN labores l ON pe.xlaborespautaidlabores = l.idlabores
      LEFT JOIN laborespauta pu 
        ON pu.xlaborespautaidlabores = pe.xlaborespautaidlabores
        AND pu.laborespautafase = pe.laborespautafase
        AND pu.xlaborespautaidusuarios = ?
        AND pu.xlaborespautaidvariedades = ?
      WHERE pe.xlaborespautaidespecies = ? 
        AND pe.xlaborespautaidusuarios IS NULL
      ORDER BY pe.xlaborespautaidlabores, 
               CASE pe.laborespautafase 
                 WHEN 'siembra' THEN 1 
                 WHEN 'germinacion' THEN 2 
                 WHEN 'plantula' THEN 3 
                 WHEN 'crecimiento' THEN 4 
                 WHEN 'floracion' THEN 5 
                 WHEN 'fructificacion' THEN 6 
                 WHEN 'cosecha' THEN 7
                 WHEN 'fin_ciclo' THEN 8
                 ELSE 9 END
    `, [user.id, plantaId, especieId]);

    // También traer pautas extra que el usuario haya añadido (que no existen en la especie)
    const [pautasExtra] = await pool.query(`
      SELECT 
        pu.idlaborespauta AS idlaborespauta_usuario,
        pu.xlaborespautaidlabores,
        pu.laborespautafase,
        l.laboresnombre,
        l.laboresicono,
        pu.laborespautafrecuenciadias AS frecuenciadias,
        pu.laborespautanotasia AS notasia,
        pu.laborespautaactivosino AS activosino,
        1 AS personalizada,
        1 AS es_extra,
        NULL AS frecuencia_original,
        NULL AS notas_original
      FROM laborespauta pu
      JOIN labores l ON pu.xlaborespautaidlabores = l.idlabores
      WHERE pu.xlaborespautaidusuarios = ?
        AND pu.xlaborespautaidvariedades = ?
        AND NOT EXISTS (
          SELECT 1 FROM laborespauta pe2
          WHERE pe2.xlaborespautaidespecies = ?
            AND pe2.xlaborespautaidusuarios IS NULL
            AND pe2.xlaborespautaidlabores = pu.xlaborespautaidlabores
            AND pe2.laborespautafase = pu.laborespautafase
        )
    `, [user.id, plantaId, especieId]);

    return NextResponse.json({ 
      pautas: [...(pautas as any[]), ...(pautasExtra as any[])]
    });
  } catch (error: any) {
    console.error('Error fetching pautas del usuario:', error);
    return NextResponse.json({ error: 'Error al obtener pautas' }, { status: 500 });
  }
}

// PATCH /api/user/plantas/[id]/pautas — Personalizar una pauta (crear/actualizar override)
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const email = request.headers.get('x-user-email');
  if (!email) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const user = await getUserByEmail(email);
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  try {
    const plantaId = resolvedParams.id;
    const body = await request.json();
    const { xlaborespautaidlabores, laborespautafase, laborespautafrecuenciadias, laborespautanotasia, laborespautaactivosino } = body;

    if (!xlaborespautaidlabores || !laborespautafase) {
      return NextResponse.json({ error: 'Labor y fase son obligatorios' }, { status: 400 });
    }

    // Verificar propiedad
    const [ownerCheck]: any = await pool.query(
      `SELECT idvariedades, xvariedadesidespecies FROM variedades WHERE idvariedades = ? AND xvariedadesidusuarios = ?`,
      [plantaId, user.id]
    );
    if (ownerCheck.length === 0) {
      return NextResponse.json({ error: 'Planta no encontrada' }, { status: 404 });
    }

    // ¿Ya existe un override del usuario para esta labor+fase+planta?
    const [existing]: any = await pool.query(
      `SELECT idlaborespauta FROM laborespauta 
       WHERE xlaborespautaidusuarios = ? AND xlaborespautaidvariedades = ? 
       AND xlaborespautaidlabores = ? AND laborespautafase = ?`,
      [user.id, plantaId, xlaborespautaidlabores, laborespautafase]
    );

    if (existing.length > 0) {
      // UPDATE override existente
      await pool.query(
        `UPDATE laborespauta SET 
          laborespautafrecuenciadias = ?, laborespautanotasia = ?, laborespautaactivosino = ?
         WHERE idlaborespauta = ?`,
        [
          laborespautafrecuenciadias ?? null,
          laborespautanotasia || null,
          laborespautaactivosino !== undefined ? laborespautaactivosino : 1,
          existing[0].idlaborespauta
        ]
      );
    } else {
      // INSERT nuevo override
      await pool.query(
        `INSERT INTO laborespauta (
          xlaborespautaidusuarios, xlaborespautaidvariedades, xlaborespautaidespecies,
          xlaborespautaidlabores, laborespautafase, 
          laborespautafrecuenciadias, laborespautanotasia, laborespautaactivosino
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          user.id, plantaId, ownerCheck[0].xvariedadesidespecies,
          xlaborespautaidlabores, laborespautafase,
          laborespautafrecuenciadias ?? null,
          laborespautanotasia || null,
          laborespautaactivosino !== undefined ? laborespautaactivosino : 1
        ]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating pauta del usuario:', error);
    return NextResponse.json({ error: 'Error al personalizar la pauta' }, { status: 500 });
  }
}
