import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export async function GET() {
  try {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM idiomas ORDER BY idiomasnombre ASC');
    return NextResponse.json(rows);
  } catch (error: any) {
    console.error('Error fetching idiomas:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    if (!data.idiomasnombre) {
      return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 });
    }
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO idiomas (idiomasnombre, idiomasiso) VALUES (?, ?)',
      [data.idiomasnombre, data.idiomasiso || null]
    );
    return NextResponse.json({ success: true, id: result.insertId });
  } catch (error: any) {
    console.error('Error creating idioma:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    if (!data.ididiomas || !data.idiomasnombre) {
      return NextResponse.json({ error: 'ID y nombre son requeridos' }, { status: 400 });
    }
    await pool.query(
      'UPDATE idiomas SET idiomasnombre = ?, idiomasiso = ? WHERE ididiomas = ?',
      [data.idiomasnombre, data.idiomasiso || null, data.ididiomas]
    );
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating idioma:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID es requerido' }, { status: 400 });
    }
    await pool.query('DELETE FROM idiomas WHERE ididiomas = ?', [id]);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting idioma:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
