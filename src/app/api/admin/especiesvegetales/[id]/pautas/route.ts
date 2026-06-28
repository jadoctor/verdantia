import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getUserByEmail } from '@/lib/auth';

async function authenticateSuperadmin(request: Request) {
  const email = request.headers.get('x-user-email');
  if (!email) return null;
  const user = await getUserByEmail(email);
  if (!user || !user.roles?.includes('superadministrador')) return null;
  return user;
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const user = await authenticateSuperadmin(request);
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const idespeciesvegetales = resolvedParams.id;
    // Join with labores table to get labor details
    const query = `
      SELECT p.*, l.laboresnombre, l.laboresaplicaconvencional, l.laboresaplicaminimo, l.laboresaplicanolaboreo
      FROM laborespauta p
      JOIN labores l ON p.xlaborespautaidlabores = l.idlabores
      WHERE p.xlaborespautaidespeciesvegetales = ? AND p.xlaborespautaidusuarios IS NULL 
        AND (p.laborespautaactivosino = 1 OR p.laborespautaactivosino IS NULL)
      ORDER BY CASE p.laborespautafase 
                 WHEN 'planificacion' THEN 1
                 WHEN 'adquisicion' THEN 2
                 WHEN 'siembra' THEN 3
                 WHEN 'pregerminacion' THEN 4
                 WHEN 'germinacion' THEN 5
                 WHEN 'postgerminacion' THEN 6
                 WHEN 'hitoplanton' THEN 7
                 WHEN 'semillero' THEN 8
                 WHEN 'trasplante' THEN 9
                 WHEN 'enraizamiento' THEN 10
                 WHEN 'inicio_crecimiento' THEN 11
                 WHEN 'crecimiento' THEN 12
                 WHEN 'primeras_flores' THEN 13
                 WHEN 'floracion' THEN 14
                 WHEN 'primera_cosecha' THEN 15
                 WHEN 'cosecha' THEN 16
                 WHEN 'finalizado' THEN 17
                 ELSE 18 END,
                 p.laborespautaoffset ASC,
                 CASE l.laboresnombre
                   WHEN 'Laboreo' THEN 1
                   WHEN 'Abonado' THEN 2
                   WHEN 'Siembra' THEN 3
                   WHEN 'Transplante' THEN 3
                   WHEN 'Trasplante' THEN 3
                   WHEN 'Acolchado' THEN 4
                   WHEN 'Riego' THEN 5
                   ELSE 10 END ASC,
                 l.laboresnombre ASC
    `;
    const [rows]: any = await pool.query(query, [idespeciesvegetales]);
    
    // Fetch crops of this species to approximate chronologically emitted alerts
    let crops = [];
    try {
      const [c]: any = await pool.query(`
        SELECT c.idcultivos, c.cultivosfechacreacion, c.cultivosfechainicio 
        FROM cultivos c 
        JOIN variedadesvegetales vu ON c.xcultivosidvariedadesvegetales = vu.idvariedadesvegetales
        LEFT JOIN variedadesvegetales vg ON vu.xvariedadesvegetalesidvariedadorigen = vg.idvariedadesvegetales
        WHERE (vu.xvariedadesvegetalesidespeciesvegetales = ? OR vg.xvariedadesvegetalesidespeciesvegetales = ?)
      `, [idespeciesvegetales, idespeciesvegetales]);
      crops = c || [];
    } catch (e) {
      console.error('Error fetching crops for pautas GET:', e);
    }

    // Fetch already completed labores for this species
    let real = [];
    try {
      const [r]: any = await pool.query(`
        SELECT lr.xlaboresrealizadasidlabores 
        FROM laboresrealizadas lr
        JOIN cultivos c ON lr.xlaboresrealizadasidcultivos = c.idcultivos
        JOIN variedadesvegetales vu ON c.xcultivosidvariedadesvegetales = vu.idvariedadesvegetales
        LEFT JOIN variedadesvegetales vg ON vu.xvariedadesvegetalesidvariedadorigen = vg.idvariedadesvegetales
        WHERE (vu.xvariedadesvegetalesidespeciesvegetales = ? OR vg.xvariedadesvegetalesidespeciesvegetales = ?)
      `, [idespeciesvegetales, idespeciesvegetales]);
      real = (r || []).map((row: any) => row.xlaboresrealizadasidlabores);
    } catch(e) {
      console.error('Error fetching laboresrealizadas:', e);
    }

    const now = Date.now();
    const DAY_MS = 86400000;

    const enhancedRows = rows.map((p: any) => {
      // 1. If it was already marked as completed by any crop, it's definitely in use
      if (real.includes(p.xlaborespautaidlabores)) return { ...p, inUse: true };
      
      // 2. If it has likely been emitted chronologically based on crop start dates
      let isEmitted = false;
      for (const c of crops) {
        const tRegistro = new Date(c.cultivosfechacreacion).getTime();
        // Fallback approximation: use fechainicio if exists, else registro
        const baseTs = c.cultivosfechainicio ? new Date(c.cultivosfechainicio).getTime() : tRegistro;
        const pautaTs = Math.max(tRegistro, baseTs + (p.laborespautaoffset || 0) * DAY_MS);
        
        if (now >= pautaTs) {
           isEmitted = true;
           break;
        }
      }
      return { ...p, inUse: isEmitted };
    });
    return NextResponse.json({ pautas: enhancedRows });
  } catch (error: any) {
    console.error('Error fetching pautas:', error);
    return NextResponse.json({ error: 'Error al obtener pautas de labor', detail: error.message }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const user = await authenticateSuperadmin(request);
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const idespeciesvegetales = resolvedParams.id;
    const body = await request.json();
    const { xlaborespautaidlabores, laborespautafase, laborespautafrecuenciadias, laborespautaoffset, laborespautanotasia, laborespautaactivosino } = body;

    if (!xlaborespautaidlabores || !laborespautafase) {
      console.log('Missing labor or fase:', body);
      return NextResponse.json({ error: 'Labor y fase son obligatorios' }, { status: 400 });
    }

    console.log('Inserting pauta:', body);

    const query = `
      INSERT INTO laborespauta (
        xlaborespautaidespeciesvegetales, xlaborespautaidlabores, laborespautafase, 
        laborespautafrecuenciadias, laborespautaoffset, laborespautanotasia, laborespautaactivosino
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        laborespautaactivosino = VALUES(laborespautaactivosino),
        laborespautafrecuenciadias = VALUES(laborespautafrecuenciadias),
        laborespautaoffset = VALUES(laborespautaoffset),
        laborespautanotasia = VALUES(laborespautanotasia)
    `;

    const queryParams = [
      idespeciesvegetales, xlaborespautaidlabores, laborespautafase, 
      laborespautafrecuenciadias || null, laborespautaoffset || 0, laborespautanotasia || null, 
      laborespautaactivosino !== undefined ? laborespautaactivosino : 1
    ];

    const [result]: any = await pool.query(query, queryParams);
    return NextResponse.json({ success: true, id: result.insertId });
  } catch (error: any) {
    console.error('Error creating pauta:', error);
    // Duplicate entry is now handled by ON DUPLICATE KEY UPDATE, 
    // but keep standard fallback just in case
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: 'Ya existe una pauta para esta labor en esta fase.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error al crear la pauta' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const user = await authenticateSuperadmin(request);
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const idespeciesvegetales = resolvedParams.id;
    const body = await request.json();
    const { idlaborespauta, xlaborespautaidlabores, laborespautafase, laborespautafrecuenciadias, laborespautaoffset, laborespautanotasia, laborespautaactivosino } = body;

    if (idlaborespauta) {
      // Update by ID
      await pool.query(
        `UPDATE laborespauta SET 
          xlaborespautaidlabores = COALESCE(?, xlaborespautaidlabores),
          laborespautafase = COALESCE(?, laborespautafase), 
          laborespautafrecuenciadias = ?, 
          laborespautaoffset = ?,
          laborespautanotasia = ?, 
          laborespautaactivosino = ? 
        WHERE idlaborespauta = ? AND xlaborespautaidespeciesvegetales = ?`,
        [
          xlaborespautaidlabores || null,
          laborespautafase || null, 
          laborespautafrecuenciadias ?? null, 
          laborespautaoffset || 0,
          laborespautanotasia || null, 
          laborespautaactivosino !== undefined ? laborespautaactivosino : 1, 
          idlaborespauta, 
          idespeciesvegetales
        ]
      );
    } else if (xlaborespautaidlabores && laborespautafase) {
      // Update by labor+fase combo
      await pool.query(
        `UPDATE laborespauta SET laborespautafrecuenciadias = ?, laborespautaoffset = ?, laborespautanotasia = ?, laborespautaactivosino = ? WHERE xlaborespautaidespeciesvegetales = ? AND xlaborespautaidlabores = ? AND laborespautafase = ?`,
        [laborespautafrecuenciadias ?? null, laborespautaoffset || 0, laborespautanotasia || null, laborespautaactivosino !== undefined ? laborespautaactivosino : 1, idespeciesvegetales, xlaborespautaidlabores, laborespautafase]
      );
    } else {
      return NextResponse.json({ error: 'Se requiere idlaborespauta o labor+fase' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating pauta:', error);
    return NextResponse.json({ error: 'Error al actualizar la pauta', detail: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const user = await authenticateSuperadmin(request);
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const idespeciesvegetales = resolvedParams.id;
    // Hard delete all pautas for the species
    await pool.query('DELETE FROM laborespauta WHERE xlaborespautaidespeciesvegetales = ?', [idespeciesvegetales]);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting all pautas:', error);
    return NextResponse.json({ error: 'Error al eliminar las pautas' }, { status: 500 });
  }
}

