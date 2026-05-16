import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getUserByEmail } from '@/lib/auth';

export async function GET(request: Request) {
  const email = request.headers.get('x-user-email');
  if (!email) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const user = await getUserByEmail(email);
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  try {
    const [rows]: any = await pool.query(`
      SELECT MAX(CAST(semillasnumerocoleccion AS UNSIGNED)) as maxNum 
      FROM semillas 
      WHERE xsemillasidusuarios = ? AND semillasactivosino = 1
    `, [user.id]);

    const maxNum = rows[0]?.maxNum || 0;
    const nextNum = maxNum + 1;

    return NextResponse.json({ nextNumero: nextNum });
  } catch (e: any) {
    console.error('Error getting next seed number:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
