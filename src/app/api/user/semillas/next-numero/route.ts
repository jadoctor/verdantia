import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getUserByEmail } from '@/lib/auth';

export async function GET(request: Request) {
  const email = request.headers.get('x-user-email');
  if (!email) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const user = await getUserByEmail(email);
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  try {
    const currentYear = new Date().getFullYear();
    const [rows]: any = await pool.query(`
      SELECT semillasnumerocoleccion 
      FROM semillas 
      WHERE xsemillasidusuarios = ? 
        AND YEAR(semillasfechacreacion) = ?
        AND semillasnumerocoleccion IS NOT NULL
    `, [user.id, currentYear]);

    const numbers = rows
      .map((r: any) => parseInt(r.semillasnumerocoleccion))
      .filter((n: number) => !isNaN(n))
      .sort((a: number, b: number) => a - b);

    let nextNum = 1;
    for (const num of numbers) {
      if (num === nextNum) {
        nextNum++;
      } else if (num > nextNum) {
        break;
      }
    }

    return NextResponse.json({ nextNumero: nextNum });
  } catch (e: any) {
    console.error('Error getting next seed number:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
