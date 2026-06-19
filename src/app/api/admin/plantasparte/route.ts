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
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  try {
    const [rows]: any = await pool.query(`
      SELECT 
        p.*,
        d.datosadjuntosruta AS primary_photo_ruta,
        d.datosadjuntosresumen AS primary_photo_resumen
      FROM plantasparte p
      LEFT JOIN datosadjuntos d ON d.xdatosadjuntosidplantasparte = p.idplantasparte 
        AND d.datosadjuntostipo = 'imagen' 
        AND d.datosadjuntosesprincipal = 1
      ORDER BY p.plantaspartenombre ASC
    `);
    return NextResponse.json({ plantaspartes: rows });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await authenticateSuperadmin(request);
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  try {
    const body = await request.json();
    const query = `
      INSERT INTO plantasparte (
        plantaspartenombre, plantasparteemoji, plantaspartedescripcion, plantasparteactivo
      ) VALUES (?, ?, ?, ?)
    `;
    const params = [
      body.plantaspartenombre, 
      body.plantasparteemoji || '🌱', 
      body.plantaspartedescripcion || '', 
      body.plantasparteactivo !== undefined ? body.plantasparteactivo : 1
    ];
    const [result]: any = await pool.query(query, params);
    return NextResponse.json({ success: true, id: result.insertId });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}
