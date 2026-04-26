import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }

  try {
    const [rows] = await pool.query(
      'SELECT nombre_logro, fecha_desbloqueo FROM usuarios_logros WHERE idusuarios = ? ORDER BY fecha_desbloqueo ASC',
      [userId]
    );

    return NextResponse.json({ success: true, logros: rows });
  } catch (error: any) {
    console.error('[Logros API] Error fetching:', error);
    return NextResponse.json({ error: 'Error fetching achievements' }, { status: 500 });
  }
}
