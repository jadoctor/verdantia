import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getUserByEmail } from '@/lib/auth';

export async function GET(request: Request) {
  const user = { id: 1 };

  try {
    const [rows] = await pool.query(`
      SELECT 
        s.idsemillas,
        s.xsemillasidvariedades,
        vu.variedadesnombre as vu_nombre,
        vu.xvariedadesidvariedadorigen,
        vg.variedadesnombre as vg_nombre,
        e.especiesnombre
      FROM semillas s
      LEFT JOIN variedades vu ON s.xsemillasidvariedades = vu.idvariedades
      LEFT JOIN variedades vg ON vu.xvariedadesidvariedadorigen = vg.idvariedades
      LEFT JOIN especies e ON vg.xvariedadesidespecies = e.idespecies OR vu.xvariedadesidespecies = e.idespecies
      ORDER BY s.idsemillas DESC
      LIMIT 5
    `);

    return NextResponse.json({ debug: rows });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
