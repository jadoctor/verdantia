import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getUserByEmail } from '@/lib/auth';

export async function GET(request: Request) {
  const email = request.headers.get('x-user-email');
  if (!email) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const user = await getUserByEmail(email);
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
  try {
    const { searchParams } = new URL(request.url);
    const ubicacion = searchParams.get('ubicacion') || '';

    let query = '';
    let queryParams = [];

    if (ubicacion.trim() === '') {
      query = `
        SELECT semillasnumerocoleccion 
        FROM semillas 
        WHERE xsemillasidusuarios = ? 
          AND (semillascoleccion IS NULL OR TRIM(semillascoleccion) = '')
          AND semillasnumerocoleccion IS NOT NULL
      `;
      queryParams = [user.id];
    } else {
      query = `
        SELECT semillasnumerocoleccion 
        FROM semillas 
        WHERE xsemillasidusuarios = ? 
          AND TRIM(semillascoleccion) = ?
          AND semillasnumerocoleccion IS NOT NULL
      `;
      queryParams = [user.id, ubicacion.trim()];
    }

    const [rows]: any = await pool.query(query, queryParams);

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
