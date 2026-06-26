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

export async function GET(request: Request) {
  const user = await authenticateSuperadmin(request);
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const [rows]: any = await pool.query(`
      SELECT t.*,
        (SELECT COUNT(*) FROM datosadjuntos WHERE xdatosadjuntosidtratamientos = t.idtratamientos AND datosadjuntostipo = 'imagen' AND datosadjuntosactivo = 1) as photosCount,
        (SELECT COUNT(*) FROM datosadjuntos WHERE xdatosadjuntosidtratamientos = t.idtratamientos AND datosadjuntostipo = 'documento' AND datosadjuntosactivo = 1) as pdfsCount,
        (SELECT datosadjuntosruta FROM datosadjuntos WHERE xdatosadjuntosidtratamientos = t.idtratamientos AND datosadjuntostipo = 'imagen' AND datosadjuntosactivo = 1 ORDER BY datosadjuntosesprincipal DESC, datosadjuntosorden ASC LIMIT 1) as primaryPhoto
      FROM tratamientos t
      ORDER BY t.tratamientosnombre
    `);

    const [partesRows]: any = await pool.query(`
      SELECT tp.xtratamientosplantasparteidtratamientos as idtratamientos, p.idplantasparte, p.plantaspartenombre, p.plantasparteemoji
      FROM tratamientosplantasparte tp
      JOIN plantasparte p ON tp.xtratamientosplantasparteidplantasparte = p.idplantasparte
    `);

    const tratamientos = rows.map((t: any) => ({
      ...t,
      partes: partesRows.filter((p: any) => p.idtratamientos === t.idtratamientos)
    }));

    return NextResponse.json({ tratamientos });
  } catch (error: any) {
    console.error('Error fetching tratamientos:', error);
    return NextResponse.json({ error: 'Error al obtener el catálogo de tratamientos' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await authenticateSuperadmin(request);
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const {
      tratamientosnombre,
      tratamientostipo,
      tratamientosdescripcion,
      tratamientospreparacion,
      tratamientosprecauciones,
      tratamientosfrecuencia,
      tratamientosdosis,
      tratamientosaccion,
      tratamientoscarencia,
      tratamientosmecanismo,
      partes
    } = body;

    if (!tratamientosnombre) {
      return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 });
    }

    if (!tratamientostipo) {
      return NextResponse.json({ error: 'El tipo es obligatorio' }, { status: 400 });
    }

    const [existing] = await pool.query<any[]>('SELECT idtratamientos FROM tratamientos WHERE tratamientosnombre = ?', [tratamientosnombre]);
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Ya existe un tratamiento con ese nombre en el catálogo maestro.' }, { status: 400 });
    }

    const query = `
      INSERT INTO tratamientos (
        tratamientosnombre, tratamientostipo, tratamientosdescripcion,
        tratamientospreparacion, tratamientosprecauciones,
        tratamientosfrecuencia, tratamientosdosis, tratamientosaccion,
        tratamientoscarencia, tratamientosmecanismo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      tratamientosnombre,
      tratamientostipo,
      tratamientosdescripcion || null,
      tratamientospreparacion || null,
      tratamientosprecauciones || null,
      tratamientosfrecuencia || null,
      tratamientosdosis || null,
      tratamientosaccion || null,
      tratamientoscarencia || null,
      tratamientosmecanismo || null
    ];

    const [result]: any = await pool.query(query, params);
    const insertId = result.insertId;

    if (partes && Array.isArray(partes) && partes.length > 0) {
      const values = partes.map((id: number) => [insertId, id]);
      await pool.query('INSERT INTO tratamientosplantasparte (xtratamientosplantasparteidtratamientos, xtratamientosplantasparteidplantasparte) VALUES ?', [values]);
    }

    return NextResponse.json({ success: true, id: insertId });
  } catch (error: any) {
    console.error('Error creating tratamiento:', error);
    return NextResponse.json({ error: 'Error al registrar el tratamiento' }, { status: 500 });
  }
}
