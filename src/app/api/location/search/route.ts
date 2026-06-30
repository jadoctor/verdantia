import { NextResponse } from 'next/server';
import pool from '@/lib/db';

/**
 * GET /api/location/search?q=texto&type=cp|ciudad
 * Búsqueda bidireccional: por código postal o por nombre de ciudad.
 * Devuelve máximo 5 resultados desde la base de datos MySQL.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get('q') || '').trim();
    const type = searchParams.get('type') || 'cp'; // 'cp' o 'ciudad'

    if (q.length === 0) {
      // Return first 5 entries as initial suggestions
      const [rows]: any = await pool.query(
        `SELECT poblacionescodigopostal as cp, poblacionesnombre as ciudad 
         FROM poblaciones 
         LIMIT 5`
      );
      return NextResponse.json({ results: rows });
    }

    let query = '';
    let params: any[] = [];

    if (type === 'cp') {
      query = `SELECT poblacionescodigopostal as cp, poblacionesnombre as ciudad 
               FROM poblaciones 
               WHERE poblacionescodigopostal LIKE ? 
               LIMIT 5`;
      params = [`${q}%`];
    } else {
      query = `SELECT poblacionescodigopostal as cp, poblacionesnombre as ciudad 
               FROM poblaciones 
               WHERE poblacionesnombre LIKE ? 
               LIMIT 5`;
      params = [`%${q}%`];
    }

    const [rows]: any = await pool.query(query, params);
    return NextResponse.json({ results: rows });

  } catch (error: any) {
    console.error('[Location Search API] Error:', error);
    return NextResponse.json({ error: 'Error interno del servidor', results: [] }, { status: 500 });
  }
}
