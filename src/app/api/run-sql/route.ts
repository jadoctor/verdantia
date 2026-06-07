import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// Endpoint para investigar las semillas
export async function GET() {
  try {
    const [rows]: any = await pool.query(`
      SELECT s.idsemillas, s.semillasnumerocoleccion, s.semillasactivosino, s.xsemillasidusuarios, u.usuariosemail 
      FROM semillas s 
      JOIN usuarios u ON s.xsemillasidusuarios = u.idusuarios 
      WHERE u.usuariosemail LIKE '%jadoctor%'
    `);
    return NextResponse.json({ success: true, data: rows });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
