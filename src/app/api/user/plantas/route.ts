import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getUserByEmail } from '@/lib/auth';

// GET /api/user/plantas — Listar plantas (variedades) del usuario
export async function GET(request: Request) {
  const email = request.headers.get('x-user-email');
  if (!email) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const user = await getUserByEmail(email);
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  try {
    // Cada planta del usuario con herencia COALESCE para el listado
    const [plantas] = await pool.query(`
      SELECT 
        vu.idvariedades,
        vu.xvariedadesidvariedadorigen,
        vu.xvariedadesidespecies,
        COALESCE(vu.variedadesnombre, vg.variedadesnombre) AS nombre,
        COALESCE(vu.variedadesdescripcion, vg.variedadesdescripcion, e.especiesdescripcion) AS descripcion,
        COALESCE(vu.variedadesicono, vg.variedadesicono, e.especiesicono) AS icono,
        COALESCE(vu.variedadesdificultad, vg.variedadesdificultad, e.especiesdificultad) AS dificultad,
        e.especiesnombre,
        e.especiesicono,
        vg.variedadesnombre AS nombre_gold,
        vg.variedadesesgenerica AS es_generica,
        -- Foto: primero la del usuario, luego la de la variedad gold, luego la de la especie
        COALESCE(
          (SELECT datosadjuntosruta FROM datosadjuntos 
           WHERE xdatosadjuntosidvariedades = vu.idvariedades AND datosadjuntostipo = 'imagen' 
           AND datosadjuntosactivo = 1 ORDER BY datosadjuntosesprincipal DESC LIMIT 1),
          (SELECT datosadjuntosruta FROM datosadjuntos 
           WHERE xdatosadjuntosidvariedades = vg.idvariedades AND datosadjuntostipo = 'imagen' 
           AND datosadjuntosactivo = 1 ORDER BY datosadjuntosesprincipal DESC LIMIT 1),
          (SELECT datosadjuntosruta FROM datosadjuntos 
           WHERE xdatosadjuntosidespecies = e.idespecies AND datosadjuntostipo = 'imagen' 
           AND datosadjuntosactivo = 1 ORDER BY datosadjuntosesprincipal DESC LIMIT 1)
        ) AS foto,
        -- Contar campos personalizados (no nulos y no vacíos)
        (
          (vu.variedadesnombre IS NOT NULL AND vu.variedadesnombre != '') +
          (vu.variedadesdescripcion IS NOT NULL AND vu.variedadesdescripcion != '') +
          (vu.variedadestemperaturaminima IS NOT NULL) +
          (vu.variedadestemperaturaoptima IS NOT NULL) +
          (vu.variedadestemperaturamaxima IS NOT NULL) +
          (vu.variedadescolor IS NOT NULL AND vu.variedadescolor != '') +
          (vu.variedadestamano IS NOT NULL AND vu.variedadestamano != '')
        ) AS campos_personalizados
      FROM variedades vu
      JOIN variedades vg ON vu.xvariedadesidvariedadorigen = vg.idvariedades
      JOIN especies e ON vg.xvariedadesidespecies = e.idespecies
      WHERE vu.xvariedadesidusuarios = ?
      ORDER BY e.especiesnombre, COALESCE(vu.variedadesnombre, vg.variedadesnombre)
    `, [user.id]);

    return NextResponse.json({ plantas });
  } catch (error: any) {
    console.error('Error fetching plantas del usuario:', error);
    return NextResponse.json({ error: 'Error al obtener plantas' }, { status: 500 });
  }
}

// POST /api/user/plantas — Adquirir una nueva planta (INSERT vacío con FK)
export async function POST(request: Request) {
  const email = request.headers.get('x-user-email');
  if (!email) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const user = await getUserByEmail(email);
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  try {
    const body = await request.json();
    const { especieId, variedadId } = body;

    if (!especieId) {
      return NextResponse.json({ error: 'La especie es obligatoria' }, { status: 400 });
    }

    // Si no se pasa variedadId, buscar la variedad genérica (Gold) de esa especie
    let targetVariedadId = variedadId;
    if (!targetVariedadId) {
      const [goldRows]: any = await pool.query(
        `SELECT idvariedades FROM variedades 
         WHERE xvariedadesidespecies = ? AND variedadesesgenerica = 1 AND xvariedadesidusuarios IS NULL 
         LIMIT 1`,
        [especieId]
      );
      if (goldRows.length === 0) {
        return NextResponse.json({ error: 'No se encontró variedad Gold para esta especie' }, { status: 404 });
      }
      targetVariedadId = goldRows[0].idvariedades;
    }

    // Verificar que la variedad existe y es global
    const [varCheck]: any = await pool.query(
      `SELECT idvariedades, xvariedadesidespecies FROM variedades WHERE idvariedades = ? AND xvariedadesidusuarios IS NULL`,
      [targetVariedadId]
    );
    if (varCheck.length === 0) {
      return NextResponse.json({ error: 'Variedad no encontrada o no disponible' }, { status: 404 });
    }

    // Verificar que no la tenga ya adquirida (misma variedad origen para el mismo usuario)
    const [duplicateCheck]: any = await pool.query(
      `SELECT idvariedades FROM variedades 
       WHERE xvariedadesidusuarios = ? AND xvariedadesidvariedadorigen = ?`,
      [user.id, targetVariedadId]
    );
    if (duplicateCheck.length > 0) {
      return NextResponse.json({ error: 'Ya tienes esta variedad en tu huerto' }, { status: 409 });
    }

    // INSERT vacío: solo las FK, todo lo demás NULL (hereda)
    const [result]: any = await pool.query(
      `INSERT INTO variedades (
        xvariedadesidespecies, xvariedadesidusuarios, xvariedadesidvariedadorigen, variedadesesgenerica
      ) VALUES (?, ?, ?, 0)`,
      [varCheck[0].xvariedadesidespecies, user.id, targetVariedadId]
    );

    return NextResponse.json({ 
      success: true, 
      id: result.insertId,
      message: '¡Planta añadida a tu huerto!'
    });
  } catch (error: any) {
    console.error('Error adquiriendo planta:', error);
    return NextResponse.json({ error: 'Error al adquirir la planta' }, { status: 500 });
  }
}
