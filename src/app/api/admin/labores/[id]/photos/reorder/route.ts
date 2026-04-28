import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getUserByEmail } from '@/lib/auth';

export const dynamic = 'force-dynamic';

async function authenticateSuperadmin(request: Request) {
  const email = request.headers.get('x-user-email');
  if (!email) return null;
  const user = await getUserByEmail(email);
  if (!user || !user.roles?.includes('superadministrador')) return null;
  return user;
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const user = await authenticateSuperadmin(request);
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const idlabores = resolvedParams.id;

  try {
    const { photos } = await request.json();

    if (!Array.isArray(photos)) {
      return NextResponse.json({ error: 'Formato inválido' }, { status: 400 });
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      for (const p of photos) {
        if (!p.id || p.orden === undefined) continue;
        await connection.query(
          'UPDATE datosadjuntos SET datosadjuntosorden = ? WHERE iddatosadjuntos = ? AND xdatosadjuntosidlabores = ?',
          [p.orden, p.id, idlabores]
        );
      }

      await connection.commit();
      return NextResponse.json({ success: true });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error('Error reordering photos:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
