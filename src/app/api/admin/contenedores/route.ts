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
        c.*,
        d.datosadjuntosruta AS primary_photo_ruta,
        d.datosadjuntosresumen AS primary_photo_resumen
      FROM contenedores c
      LEFT JOIN datosadjuntos d ON d.xdatosadjuntosidcontenedores = c.idcontenedores 
        AND d.datosadjuntostipo = 'imagen' 
        AND d.datosadjuntosesprincipal = 1
      ORDER BY c.contenedoresnombre ASC
    `);
    return NextResponse.json({ contenedores: rows });
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
      INSERT INTO contenedores (
        contenedoresnombre, contenedorestipo, contenedoresclasificacion, contenedorescantidadalveolos, contenedoresvolumenalveolocc,
        contenedoresvolumentotallitros, contenedoresdimensiones, contenedoresformaalveolo,
        contenedoresantiespiralizacion, contenedoresmaterial, contenedoresreutilizable, contenedoresobservaciones, contenedoresactivo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      body.contenedoresnombre, body.contenedorestipo, body.contenedoresclasificacion || 'ambos', body.contenedorescantidadalveolos || 1, body.contenedoresvolumenalveolocc || 0,
      body.contenedoresvolumentotallitros || 0, body.contenedoresdimensiones || '', body.contenedoresformaalveolo || '',
      body.contenedoresantiespiralizacion ? 1 : 0, body.contenedoresmaterial || '', body.contenedoresreutilizable ? 1 : 0, body.contenedoresobservaciones || '', body.contenedoresactivo !== undefined ? body.contenedoresactivo : 1
    ];
    const [result]: any = await pool.query(query, params);
    return NextResponse.json({ success: true, id: result.insertId });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}
