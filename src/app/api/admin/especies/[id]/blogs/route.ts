import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    
    // Obtenemos los blogs de esta especie
    const [rows] = await pool.query<any>(`
      SELECT 
        b.idblog, b.blogslug, b.blogtitulo, b.blogresumen, b.blogimagen, 
        b.blogestado, b.blogcontenido, b.blogfechacreacion, b.blogfechapublicacion,
        u.nombre as autor_nombre
      FROM blog b
      LEFT JOIN usuarios u ON b.xblogidusuarios = u.idusuarios
      WHERE b.xblogidespecies = ?
      ORDER BY b.idblog DESC
    `, [resolvedParams.id]);

    // Parseamos el JSON para extraer el pdf_source_id
    const blogs = rows.map((row: any) => {
      let pdfSourceId = null;
      let heroAlt = '';
      try {
        if (row.blogcontenido) {
          const content = JSON.parse(row.blogcontenido);
          pdfSourceId = content.pdf_source_id || null;
          heroAlt = content.hero_imagen_alt || '';
        }
      } catch (e) {
        // Legacy markdown, no tiene pdf_source_id
      }
      
      return {
        id: row.idblog,
        slug: row.blogslug,
        titulo: row.blogtitulo,
        resumen: row.blogresumen,
        hero_imagen: row.blogimagen,
        hero_imagen_alt: heroAlt,
        estado: row.blogestado,
        fechaCreacion: row.blogfechacreacion,
        fechaPublicacion: row.blogfechapublicacion,
        autor: row.autor_nombre || 'IA Verdantia',
        pdfSourceId: pdfSourceId
      };
    });

    return NextResponse.json({ success: true, data: blogs });
  } catch (error: any) {
    console.error('Error obteniendo blogs de especie:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
