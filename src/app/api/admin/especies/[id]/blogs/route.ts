import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    
    // Obtenemos los blogs de esta especie
    const [rows] = await pool.query<any>(`
      SELECT 
        idblog, xblogslug, xblogtitulo, xblogestado, xblogcontenido, xblogfechapublicacion
      FROM blog 
      WHERE xblogidespecies = ?
      ORDER BY xblogfechacreacion DESC
    `, [resolvedParams.id]);

    // Parseamos el JSON para extraer el pdf_source_id
    const blogs = rows.map((row: any) => {
      let pdfSourceId = null;
      try {
        if (row.xblogcontenido) {
          const content = JSON.parse(row.xblogcontenido);
          pdfSourceId = content.pdf_source_id || null;
        }
      } catch (e) {
        // Legacy markdown, no tiene pdf_source_id
      }
      
      return {
        id: row.idblog,
        slug: row.xblogslug,
        titulo: row.xblogtitulo,
        estado: row.xblogestado,
        fecha: row.xblogfechapublicacion,
        pdfSourceId: pdfSourceId
      };
    });

    return NextResponse.json({ success: true, data: blogs });
  } catch (error: any) {
    console.error('Error obteniendo blogs de especie:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
