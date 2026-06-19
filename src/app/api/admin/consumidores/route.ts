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

export async function GET(request: Request) {
  const user = await authenticateSuperadmin(request);
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  try {
    const [rows] = await pool.query('SELECT * FROM consumidores ORDER BY idconsumidores ASC');
    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching consumidores:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await authenticateSuperadmin(request);
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  try {
    const { consumidoresnombre, consumidoresicono, consumidoresdescripcion, consumidoresactivo } = await request.json();
    
    if (!consumidoresnombre) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    const [result]: any = await pool.query(`
      INSERT INTO consumidores (consumidoresnombre, consumidoresicono, consumidoresdescripcion, consumidoresactivo)
      VALUES (?, ?, ?, ?)
    `, [consumidoresnombre, consumidoresicono || '', consumidoresdescripcion || '', consumidoresactivo !== undefined ? consumidoresactivo : 1]);

    return NextResponse.json({ success: true, id: result.insertId });
  } catch (error) {
    console.error('Error creating consumidor:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
