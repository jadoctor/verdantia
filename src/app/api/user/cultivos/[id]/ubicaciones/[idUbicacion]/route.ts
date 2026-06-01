import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getUserByEmail } from '@/lib/auth';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string, idUbicacion: string }> }
) {
  const email = request.headers.get('x-user-email');
  if (!email) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const user = await getUserByEmail(email);
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  const { id: cultivoId, idUbicacion } = await params;

  try {
    const body = await request.json();
    const { xcultivosubicacionesidbancales, cultivosubicacionesposicionx, cultivosubicacionesposiciony } = body;

    // Verify crop belongs to user
    const [cropRows]: any = await pool.query(
      'SELECT idcultivos FROM cultivos WHERE idcultivos = ? AND xcultivosidusuarios = ?',
      [cultivoId, user.id]
    );

    if (cropRows.length === 0) {
      return NextResponse.json({ error: 'Cultivo no encontrado o no autorizado' }, { status: 404 });
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (xcultivosubicacionesidbancales !== undefined) {
      updates.push('xcultivosubicacionesidbancales = ?');
      values.push(xcultivosubicacionesidbancales);
    }
    if (cultivosubicacionesposicionx !== undefined) {
      updates.push('cultivosubicacionesposicionx = ?');
      values.push(cultivosubicacionesposicionx);
    }
    if (cultivosubicacionesposiciony !== undefined) {
      updates.push('cultivosubicacionesposiciony = ?');
      values.push(cultivosubicacionesposiciony);
    }

    if (updates.length > 0) {
      values.push(idUbicacion, cultivoId);
      await pool.query(
        `UPDATE cultivosubicaciones SET ${updates.join(', ')} WHERE idcultivosubicaciones = ? AND xcultivosubicacionesidcultivos = ?`,
        values
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error actualizando ubicación:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string, idUbicacion: string }> }
) {
  const email = request.headers.get('x-user-email');
  if (!email) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const user = await getUserByEmail(email);
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  const { id: cultivoId, idUbicacion } = await params;

  try {
    // Verify crop belongs to user
    const [cropRows]: any = await pool.query(
      'SELECT idcultivos FROM cultivos WHERE idcultivos = ? AND xcultivosidusuarios = ?',
      [cultivoId, user.id]
    );

    if (cropRows.length === 0) {
      return NextResponse.json({ error: 'Cultivo no encontrado o no autorizado' }, { status: 404 });
    }

    await pool.query(
      `DELETE FROM cultivosubicaciones WHERE idcultivosubicaciones = ? AND xcultivosubicacionesidcultivos = ?`,
      [idUbicacion, cultivoId]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error borrando ubicación:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
