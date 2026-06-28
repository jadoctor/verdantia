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
    const [rows] = await pool.query('SELECT * FROM especiesanimales ORDER BY idespeciesanimales ASC');
    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching animales:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await authenticateSuperadmin(request);
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  try {
    const { especiesanimalesnombre, especiesanimalesicono, especiesanimalesdescripcion, especiesanimalesactivo } = await request.json();
    
    if (!especiesanimalesnombre) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    const [result]: any = await pool.query(`
      INSERT INTO especiesanimales (especiesanimalesnombre, especiesanimalesicono, especiesanimalesdescripcion, especiesanimalesactivo)
      VALUES (?, ?, ?, ?)
    `, [especiesanimalesnombre, especiesanimalesicono || '', especiesanimalesdescripcion || '', especiesanimalesactivo !== undefined ? especiesanimalesactivo : 1]);

    return NextResponse.json({ success: true, id: result.insertId });
  } catch (error) {
    console.error('Error creating animal:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
