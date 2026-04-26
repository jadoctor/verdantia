import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const [rows] = await pool.query(`
      SELECT 
        b.idblog, b.xblogslug, b.xblogtitulo, b.xblogresumen, b.xblogimagen, b.xblogfechapublicacion, 
        u.usuariosnombre as autor, e.especiesnombre, v.variedadesnombre
      FROM blog b
      LEFT JOIN usuarios u ON b.xblogidusuarios = u.idusuarios
      LEFT JOIN especies e ON b.xblogidespecies = e.idespecies
      LEFT JOIN variedades v ON b.xblogidvariedades = v.idvariedades
      WHERE b.xblogestado = 'publicado'
      ORDER BY b.xblogfechapublicacion DESC
    `);
    return NextResponse.json({ success: true, data: rows });
  } catch (error: any) {
    console.error('Error fetching blog posts:', error);
    return NextResponse.json({ error: 'Error al obtener artículos' }, { status: 500 });
  }
}
