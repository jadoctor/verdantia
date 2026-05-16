import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getUserByEmail } from '@/lib/auth';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const email = request.headers.get('x-user-email');
  if (!email) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const user = await getUserByEmail(email);
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  const { id: semillaId } = await params;

  try {
    // Verificar que la semilla pertenezca al usuario
    const [rows]: any = await pool.query(
      'SELECT idsemillas FROM semillas WHERE idsemillas = ? AND xsemillasidusuarios = ?',
      [semillaId, user.id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Semilla no encontrada o no autorizada' }, { status: 404 });
    }

    // Soft Delete: semillasactivosino = 0
    await pool.query(
      'UPDATE semillas SET semillasactivosino = 0 WHERE idsemillas = ?',
      [semillaId]
    );

    return NextResponse.json({ success: true, message: 'Semilla eliminada correctamente' });
  } catch (error: any) {
    console.error('Error eliminando semilla:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const email = request.headers.get('x-user-email');
  if (!email) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const user = await getUserByEmail(email);
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  const { id: semillaId } = await params;

  try {
    const body = await request.json();
    const {
      semillasnumerocoleccion, semillasorigen, semillaslugarcompra, semillasmarca,
      semillasfecharecoleccion, semillasfechaenvasado, semillasfechacaducidad,
      semillaslote, semillasstockinicial, semillasstockactual, semillasobservaciones
    } = body;

    // Verificar que la semilla pertenezca al usuario
    const [rows]: any = await pool.query(
      'SELECT idsemillas FROM semillas WHERE idsemillas = ? AND xsemillasidusuarios = ?',
      [semillaId, user.id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Semilla no encontrada o no autorizada' }, { status: 404 });
    }

    await pool.query(
      `UPDATE semillas SET 
        semillasnumerocoleccion = ?,
        semillasorigen = ?,
        semillaslugarcompra = ?,
        semillasmarca = ?,
        semillasfecharecoleccion = ?,
        semillasfechaenvasado = ?,
        semillasfechacaducidad = ?,
        semillaslote = ?,
        semillasstockinicial = ?,
        semillasstockactual = ?,
        semillasobservaciones = ?
       WHERE idsemillas = ? AND xsemillasidusuarios = ?`,
      [
        semillasnumerocoleccion || null,
        semillasorigen || null,
        semillaslugarcompra || null,
        semillasmarca || null,
        semillasfecharecoleccion || null,
        semillasfechaenvasado || null,
        semillasfechacaducidad || null,
        semillaslote || null,
        semillasstockinicial || 0,
        semillasstockactual || 0,
        semillasobservaciones || null,
        semillaId,
        user.id
      ]
    );

    return NextResponse.json({ success: true, message: 'Semilla actualizada correctamente' });
  } catch (error: any) {
    console.error('Error actualizando semilla:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
