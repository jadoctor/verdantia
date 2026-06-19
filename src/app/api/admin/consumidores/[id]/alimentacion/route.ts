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
        ec.idespeciesconsumidores,
        ec.xespeciesconsumidoresidespecies,
        ec.xespeciesconsumidoresidconsumidores,
        ec.especiesconsumidoresesapto,
        pp.plantaspartenombre AS especiesconsumidorespartes,
        pp.plantasparteemoji AS especiesconsumidoresemoji,
        ec.especiesconsumidoresnotas,
        e.especiesnombre,
        e.especiesicono,
        (SELECT datosadjuntosruta FROM datosadjuntos WHERE xdatosadjuntosidespecies = e.idespecies AND datosadjuntostipo = 'imagen' AND datosadjuntosactivo = 1 ORDER BY datosadjuntosesprincipal DESC LIMIT 1) as primary_photo_ruta
      FROM especiesconsumidores ec
      JOIN especies e ON ec.xespeciesconsumidoresidespecies = e.idespecies
      LEFT JOIN plantasparte pp ON ec.xespeciesconsumidoresidplantasparte = pp.idplantasparte
      WHERE ec.xespeciesconsumidoresidconsumidores = ?
    `, [resolvedParams.id]);

    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching alimentacion:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
