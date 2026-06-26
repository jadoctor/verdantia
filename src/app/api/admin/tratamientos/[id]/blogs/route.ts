import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getUserByEmail } from '@/lib/auth';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const email = request.headers.get('x-user-email');
  if (!email) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }
  const user = await getUserByEmail(email);
  if (!user || !user.roles?.includes('superadministrador')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const id = resolvedParams.id;
    // Get blogs where pdfSourceId is related to this tratamiento OR any direct blogs if they existed
    // Currently blogs only have pdfSourceId. 
    // We get the PDFs for this tratamiento first:
    const [pdfs]: any = await pool.query(`SELECT iddatosadjuntos as id FROM datosadjuntos WHERE xdatosadjuntosidtratamientos = ? AND datosadjuntostipo = 'documento' AND datosadjuntosactivo = 1`, [id]);
    
    if (!pdfs || pdfs.length === 0) {
      return NextResponse.json({ blogs: [] });
    }
    
    const pdfIds = pdfs.map((p: any) => p.id);
    const placeholders = pdfIds.map(() => '?').join(',');
    
    const [blogs]: any = await pool.query(`
      SELECT 
        idblog as id, 
        blogtitulo as titulo, 
        blogslug as slug, 
        blogimagen as hero_imagen, 
        blogestado as estado, 
        blogfechacreacion as fechaCreacion, 
        blogfechapublicacion as fechaPublicacion, 
        JSON_UNQUOTE(JSON_EXTRACT(blogcontenido, '$.pdf_source_id')) as pdfSourceId
      FROM blog 
      WHERE JSON_UNQUOTE(JSON_EXTRACT(blogcontenido, '$.pdf_source_id')) IN (${placeholders})
      ORDER BY blogfechacreacion DESC
    `, pdfIds);

    return NextResponse.json({ blogs: blogs || [] });
  } catch (error: any) {
    console.error('Error fetching blogs:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
