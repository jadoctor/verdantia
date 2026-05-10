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
    const [rows] = await pool.query(`
      SELECT p.*, 
             d.datosadjuntosruta as primary_photo_ruta, 
             d.datosadjuntosresumen as primary_photo_resumen 
      FROM plagas p
      LEFT JOIN datosadjuntos d 
        ON d.iddatosadjuntos = (
          SELECT d2.iddatosadjuntos 
          FROM datosadjuntos d2 
          WHERE d2.xdatosadjuntosidplagas = p.idplagas 
            AND d2.datosadjuntostipo = 'imagen' 
            AND d2.datosadjuntosactivo = 1 
          ORDER BY d2.datosadjuntosesprincipal DESC, d2.iddatosadjuntos ASC 
          LIMIT 1
        )
      ORDER BY p.plagasnombre
    `);
    return NextResponse.json({ plagas: rows });
  } catch (error: any) {
    console.error('Error fetching plagas:', error);
    return NextResponse.json({ error: 'Error al obtener el catálogo de plagas' }, { status: 500 });
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
      plagasnombre,
      plagasnombrecientifico,
      plagastipo,
      plagasdescripcion,
      plagascontrolorganico
    } = body;

    if (!plagasnombre) {
      return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 });
    }

    const [existing] = await pool.query<any[]>('SELECT idplagas FROM plagas WHERE plagasnombre = ?', [plagasnombre]);
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Ya existe una plaga con ese nombre en el catálogo maestro.' }, { status: 400 });
    }

    const query = `
      INSERT INTO plagas (
        plagasnombre, plagasnombrecientifico, plagastipo, plagasdescripcion, plagascontrolorganico
      ) VALUES (?, ?, ?, ?, ?)
    `;

    const params = [
      plagasnombre,
      plagasnombrecientifico || null,
      plagastipo || null,
      plagasdescripcion || null,
      plagascontrolorganico || null
    ];

    const [result]: any = await pool.query(query, params);

    return NextResponse.json({ success: true, id: result.insertId });
  } catch (error: any) {
    console.error('Error creating plaga:', error);
    return NextResponse.json({ error: 'Error al registrar la plaga' }, { status: 500 });
  }
}
