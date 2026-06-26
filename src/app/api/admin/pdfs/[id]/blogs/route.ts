import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getUserByEmail } from '@/lib/auth';

async function authenticateSuperadmin(request: Request) {
  const email = request.headers.get('x-user-email');
  if (!email) return null;
  const user = await getUserByEmail(email);
  if (!user || !user.roles?.includes('superadministrador')) return null;
  return user;
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const user = await authenticateSuperadmin(request);
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const pdfId = resolvedParams.id;

  try {
    const [rows] = await pool.query(
      `SELECT 
        idblog as id, 
        blogslug as slug, 
        blogtitulo as titulo, 
        blogestado as estado, 
        blogfechacreacion as fechaCreacion, 
        JSON_UNQUOTE(JSON_EXTRACT(blogcontenido, '$.hero_imagen')) as hero_imagen,
        JSON_UNQUOTE(JSON_EXTRACT(blogcontenido, '$.pdf_source_id')) as pdfSourceId
       FROM blog 
       WHERE JSON_UNQUOTE(JSON_EXTRACT(blogcontenido, '$.pdf_source_id')) = ?
       ORDER BY blogfechacreacion DESC`,
      [pdfId]
    );

    return NextResponse.json({ blogs: rows });
  } catch (error: any) {
    console.error('Error fetching blogs for PDF:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
