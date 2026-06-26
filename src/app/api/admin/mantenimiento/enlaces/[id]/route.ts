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

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const user = await authenticateSuperadmin(request);
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action'); // 'delete' or 'deactivate'

  try {
    if (action === 'deactivate') {
      await pool.query('UPDATE datosadjuntos SET datosadjuntosactivo = 0 WHERE iddatosadjuntos = ?', [resolvedParams.id]);
      return NextResponse.json({ success: true, message: 'Enlace inactivado correctamente' });
    } else {
      await pool.query('DELETE FROM datosadjuntos WHERE iddatosadjuntos = ?', [resolvedParams.id]);
      return NextResponse.json({ success: true, message: 'Enlace eliminado correctamente' });
    }
  } catch (error: any) {
    console.error('Error al procesar enlace:', error);
    return NextResponse.json({ error: 'Error al procesar la solicitud' }, { status: 500 });
  }
}
