import { NextResponse } from 'next/server';
import { getUserByEmail } from '@/lib/auth';
import pool from '@/lib/db';

async function authenticateSuperadmin(request: Request) {
  const email = request.headers.get('x-user-email');
  if (!email) return null;
  const user = await getUserByEmail(email);
  if (!user || !user.roles?.includes('superadministrador')) return null;
  return user;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await authenticateSuperadmin(request);
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  try {
    const resolvedParams = await params;
    const [rows]: any = await pool.query('SELECT * FROM especiesanimales WHERE idespeciesanimales = ?', [resolvedParams.id]);
    
    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: 'Animal no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Error fetching animal:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await authenticateSuperadmin(request);
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  try {
    const resolvedParams = await params;
    const { especiesanimalesnombre, especiesanimalesicono, especiesanimalesdescripcion, especiesanimalesactivo } = await request.json();

    if (!especiesanimalesnombre) {
      return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 });
    }

    await pool.query(`
      UPDATE especiesanimales 
      SET especiesanimalesnombre = ?, especiesanimalesicono = ?, especiesanimalesdescripcion = ?, especiesanimalesactivo = ?
      WHERE idespeciesanimales = ?
    `, [especiesanimalesnombre, especiesanimalesicono || '', especiesanimalesdescripcion || '', especiesanimalesactivo !== undefined ? especiesanimalesactivo : 1, resolvedParams.id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating animal:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await authenticateSuperadmin(request);
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  try {
    const resolvedParams = await params;
    await pool.query('DELETE FROM especiesanimales WHERE idespeciesanimales = ?', [resolvedParams.id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting animal:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
