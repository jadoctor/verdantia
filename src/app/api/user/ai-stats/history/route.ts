import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getUserByEmail } from '@/lib/auth';

export async function GET(request: Request) {
  const email = request.headers.get('x-user-email');
  if (!email) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const user = await getUserByEmail(email);
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  try {
    // Obtener el historial de este usuario del mes en curso, ordenado por más reciente primero
    const [rows]: any = await pool.query(`
      SELECT 
        idhistorialia, 
        historialiafecha, 
        historialiamodulo, 
        historialiaprompt, 
        historialiarespuesta, 
        historialiaexito 
      FROM historialia 
      WHERE xhistorialiaidusuarios = ? 
        AND MONTH(historialiafecha) = MONTH(CURRENT_DATE())
        AND YEAR(historialiafecha) = YEAR(CURRENT_DATE())
      ORDER BY historialiafecha DESC
      LIMIT 100
    `, [user.id]);

    return NextResponse.json({ history: rows });
  } catch (error) {
    console.error('Error obteniendo historial de IA:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
