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

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const user = await authenticateSuperadmin(request);
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  try {
    const [rows]: any = await pool.query('SELECT * FROM consumidores WHERE idconsumidores = ?', [resolvedParams.id]);
    if (rows.length === 0) return NextResponse.json({ error: 'Consumidor no encontrado' }, { status: 404 });
    return NextResponse.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Error fetching consumidor:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const user = await authenticateSuperadmin(request);
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  try {
    const { consumidoresnombre, consumidoresicono, consumidoresdescripcion, consumidoresactivo } = await request.json();
    
    await pool.query(`
      UPDATE consumidores 
      SET consumidoresnombre = ?, consumidoresicono = ?, consumidoresdescripcion = ?, consumidoresactivo = ?
      WHERE idconsumidores = ?
    `, [consumidoresnombre, consumidoresicono || '', consumidoresdescripcion || '', consumidoresactivo !== undefined ? consumidoresactivo : 1, resolvedParams.id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating consumidor:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const user = await authenticateSuperadmin(request);
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  try {
    await pool.query('DELETE FROM consumidores WHERE idconsumidores = ?', [resolvedParams.id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting consumidor:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
