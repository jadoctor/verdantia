import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const [rows]: any = await pool.query("SELECT iddatosadjuntos, datosadjuntostipo, datosadjuntosruta, xdatosadjuntosidusuarios, xdatosadjuntosidcultivos, datosadjuntosactivo, datosadjuntosfechacreacion FROM datosadjuntos WHERE xdatosadjuntosidusuarios = 22 ORDER BY iddatosadjuntos DESC LIMIT 10");
    return NextResponse.json({ rows });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
