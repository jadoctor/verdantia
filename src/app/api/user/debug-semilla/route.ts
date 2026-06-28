import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getUserByEmail } from '@/lib/auth';

export async function GET(request: Request) {
  const user = { id: 1 };

  try {
    const [rows] = await pool.query(`
      SELECT 
        s.idsemillas,
        s.xsemillasidvariedadesvegetales,
        vu.variedadesvegetalesnombre as vu_nombre,
        vu.xvariedadesvegetalesidvariedadorigen,
        vg.variedadesvegetalesnombre as vg_nombre,
        e.especiesvegetalesnombre
      FROM semillas s
      LEFT JOIN variedadesvegetales vu ON s.xsemillasidvariedadesvegetales = vu.idvariedadesvegetales
      LEFT JOIN variedadesvegetales vg ON vu.xvariedadesvegetalesidvariedadorigen = vg.idvariedadesvegetales
      LEFT JOIN especiesvegetales e ON vg.xvariedadesvegetalesidespeciesvegetales = e.idespeciesvegetales OR vu.xvariedadesvegetalesidespeciesvegetales = e.idespeciesvegetales
      ORDER BY s.idsemillas DESC
      LIMIT 5
    `);

    return NextResponse.json({ debug: rows });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
