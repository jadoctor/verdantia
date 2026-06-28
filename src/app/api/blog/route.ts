import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const [rows] = await pool.query(`
      SELECT 
        b.idblog, b.blogslug, b.blogtitulo, b.blogresumen, b.blogimagen, b.blogfechapublicacion, 
        u.usuariosnombre as autor, e.especiesvegetalesnombre, v.variedadesvegetalesnombre
      FROM blog b
      LEFT JOIN usuarios u ON b.xblogidusuarios = u.idusuarios
      LEFT JOIN especiesvegetales e ON b.xblogidespeciesvegetales = e.idespeciesvegetales
      LEFT JOIN variedadesvegetales v ON b.xblogidvariedadesvegetales = v.idvariedadesvegetales
      WHERE b.blogestado = 'publicado'
      ORDER BY b.blogfechapublicacion DESC
    `);
    return NextResponse.json({ success: true, data: rows });
  } catch (error: any) {
    console.error('Error fetching blog posts:', error);
    return NextResponse.json({ error: 'Error al obtener artículos' }, { status: 500 });
  }
}
