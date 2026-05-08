import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export async function GET() {
  try {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM paises ORDER BY paisesnombre ASC');
    return NextResponse.json(rows);
  } catch (error: any) {
    console.error('Error fetching paises:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    if (!data.paisesnombre) {
      return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 });
    }
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO paises (paisesnombre, paisesisocode) VALUES (?, ?)',
      [data.paisesnombre, data.paisesisocode || null]
    );
    return NextResponse.json({ success: true, id: result.insertId });
  } catch (error: any) {
    console.error('Error creating pais:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    if (!data.idpaises || !data.paisesnombre) {
      return NextResponse.json({ error: 'ID y nombre son requeridos' }, { status: 400 });
    }
    await pool.query(
      'UPDATE paises SET paisesnombre = ?, paisesisocode = ? WHERE idpaises = ?',
      [data.paisesnombre, data.paisesisocode || null, data.idpaises]
    );
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating pais:', error);
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
    await pool.query('DELETE FROM paises WHERE idpaises = ?', [id]);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting pais:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
