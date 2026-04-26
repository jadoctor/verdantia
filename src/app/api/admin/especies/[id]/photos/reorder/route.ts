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

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await authenticateSuperadmin(request);
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const { id } = await params;

  try {
    const { photos } = await request.json();

    if (!Array.isArray(photos)) {
      return NextResponse.json({ error: 'Formato inválido' }, { status: 400 });
    }

    // Actualizar el orden de cada foto de la especie en la BBDD
    for (const photo of photos) {
      if (photo.id && photo.orden) {
        await pool.query(
          'UPDATE datosadjuntos SET datosadjuntosorden = ? WHERE iddatosadjuntos = ? AND xdatosadjuntosidespecies = ?',
          [photo.orden, photo.id, id]
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error reordering photos:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
