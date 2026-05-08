import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getUserByEmail } from '@/lib/auth';

export async function GET(request: Request) {

  try {
    const [rows] = await pool.query('SELECT * FROM tiposavisos ORDER BY idtiposavisos ASC');
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching tiposavisos:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}

export async function POST(request: Request) {

  try {
    const body = await request.json();
    const { tiposavisoscodigo, tiposavisosnombre, tiposavisosdescripcion, tiposavisosmetodo } = body;
    
    const [result] = await pool.query(
      'INSERT INTO tiposavisos (tiposavisoscodigo, tiposavisosnombre, tiposavisosdescripcion, tiposavisosmetodo, tiposavisosactivo) VALUES (?, ?, ?, ?, 1)',
      [tiposavisoscodigo, tiposavisosnombre, tiposavisosdescripcion, tiposavisosmetodo || 'in-app']
    );
    return NextResponse.json({ id: (result as any).insertId });
  } catch (error) {
    console.error('Error creating tipoaviso:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}

export async function PUT(request: Request) {

  try {
    const body = await request.json();
    const { idtiposavisos, tiposavisoscodigo, tiposavisosnombre, tiposavisosdescripcion, tiposavisosmetodo } = body;
    
    await pool.query(
      'UPDATE tiposavisos SET tiposavisoscodigo = ?, tiposavisosnombre = ?, tiposavisosdescripcion = ?, tiposavisosmetodo = ? WHERE idtiposavisos = ?',
      [tiposavisoscodigo, tiposavisosnombre, tiposavisosdescripcion, tiposavisosmetodo || 'in-app', idtiposavisos]
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating tipoaviso:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });

  try {
    // Delete related rules first
    await pool.query('DELETE FROM suscripcionestiposavisos WHERE xsuscripcionestiposavisosidtiposavisos = ?', [id]);
    await pool.query('DELETE FROM usuariosavisos WHERE xusuariosavisosidtiposavisos = ?', [id]);
    await pool.query('DELETE FROM tiposavisos WHERE idtiposavisos = ?', [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting tipoaviso:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
