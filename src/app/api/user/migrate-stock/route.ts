import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
  try {
    await pool.query('ALTER TABLE semillas ADD COLUMN semillasstockinicial INT NULL DEFAULT NULL;');
    return NextResponse.json({ success: true, message: 'Columna semillasstockinicial añadida' });
  } catch (error: any) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      return NextResponse.json({ success: true, message: 'La columna ya existe' });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
