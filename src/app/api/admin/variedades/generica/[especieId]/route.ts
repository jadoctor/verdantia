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

export async function GET(request: Request, { params }: { params: Promise<{ especieId: string }> }) {
  const resolvedParams = await params;
  const user = await authenticateSuperadmin(request);
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const [rows]: any = await pool.query(`
      SELECT v.*, e.especiesnombre, e.especiesicono 
      FROM variedades v
      LEFT JOIN especies e ON v.xvariedadesidespecies = e.idespecies
      WHERE v.xvariedadesidespecies = ? AND v.variedadesesgenerica = 1
      LIMIT 1
    `, [resolvedParams.especieId]);
    
    if (!rows || rows.length === 0) {
      return NextResponse.json({ generica: null });
    }

    return NextResponse.json({ generica: rows[0] });
  } catch (error: any) {
    console.error('Error fetching generica:', error);
    return NextResponse.json({ error: 'Error al obtener variedad genérica' }, { status: 500 });
  }
}
