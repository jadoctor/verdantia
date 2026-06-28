import { NextResponse } from 'next/server';
import { getUserByEmail } from '@/lib/auth';
import pool from '@/lib/db';

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
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  try {
    const [rows]: any = await pool.query(`
      SELECT 
        ec.idespeciesanimales,
        ec.xespeciesvegetalesanimalesidespeciesvegetales,
        ec.xespeciesvegetalesanimalesidespeciesanimales,
        ec.especiesanimalesesapto,
        pp.plantaspartenombre AS especiesanimalespartes,
        pp.plantasparteemoji AS especiesanimalesemoji,
        ec.especiesanimalesnotas,
        e.especiesvegetalesnombre,
        e.especiesvegetalesicono,
        (SELECT datosadjuntosruta FROM datosadjuntos WHERE xdatosadjuntosidespeciesvegetales = e.idespeciesvegetales AND datosadjuntostipo = 'imagen' AND datosadjuntosactivo = 1 ORDER BY datosadjuntosesprincipal DESC LIMIT 1) as primary_photo_ruta
      FROM especiesanimales ec
      JOIN especiesvegetales e ON ec.xespeciesvegetalesanimalesidespeciesvegetales = e.idespeciesvegetales
      LEFT JOIN plantasparte pp ON ec.xespeciesvegetalesanimalesidplantasparte = pp.idplantasparte
      WHERE ec.xespeciesvegetalesanimalesidespeciesanimales = ?
    `, [resolvedParams.id]);

    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching alimentacion:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
