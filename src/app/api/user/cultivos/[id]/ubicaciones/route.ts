import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getUserByEmail } from '@/lib/auth';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const email = request.headers.get('x-user-email');
  if (!email) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const user = await getUserByEmail(email);
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  const { id: cultivoId } = await params;

  try {
    const body = await request.json();
    const { xcultivosubicacionesidbancales, posicionx, posiciony } = body;

    if (!xcultivosubicacionesidbancales || posicionx === undefined || posiciony === undefined) {
      return NextResponse.json({ error: 'Faltan datos de ubicación' }, { status: 400 });
    }

    // Verify crop belongs to user
    const [cropRows]: any = await pool.query(
      'SELECT idcultivos FROM cultivos WHERE idcultivos = ? AND xcultivosidusuarios = ?',
      [cultivoId, user.id]
    );

    if (cropRows.length === 0) {
      return NextResponse.json({ error: 'Cultivo no encontrado o no autorizado' }, { status: 404 });
    }

    // Insert new location
    const [result]: any = await pool.query(
      `INSERT INTO cultivosubicaciones (xcultivosubicacionesidcultivos, xcultivosubicacionesidbancales, cultivosubicacionesposicionx, cultivosubicacionesposiciony) 
       VALUES (?, ?, ?, ?)`,
      [cultivoId, xcultivosubicacionesidbancales, posicionx, posiciony]
    );

    return NextResponse.json({ 
      success: true, 
      id: result.insertId,
      message: 'Ubicación añadida correctamente'
    });
  } catch (error: any) {
    console.error('Error añadiendo ubicación:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
