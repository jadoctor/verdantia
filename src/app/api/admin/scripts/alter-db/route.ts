import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    let result = '';
    try {
      await pool.query('ALTER TABLE datosadjuntos ADD COLUMN datosadjuntosautores VARCHAR(255) DEFAULT NULL;');
      result += 'Added datosadjuntosautores. ';
    } catch(e: any) {
      result += `Autores error: ${e.message}. `;
    }

    try {
      await pool.query('ALTER TABLE datosadjuntos ADD COLUMN datosadjuntosidentificacion VARCHAR(150) DEFAULT NULL;');
      result += 'Added datosadjuntosidentificacion.';
    } catch(e: any) {
      result += `ID error: ${e.message}.`;
    }

    return NextResponse.json({ result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
