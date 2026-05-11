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
    const idvariedades = resolvedParams.id;

    const [rows] = await pool.query(
      `SELECT idblog as id, blogtitulo as titulo, blogslug as slug, blogestado as estado, 
              blogfecha_creacion as fechaCreacion, blogimagen as hero_imagen, pdf_source_id as pdfSourceId
       FROM blog 
       WHERE xblogidvariedades = ? 
       ORDER BY blogfecha_creacion DESC`,
      [idvariedades]
    );

    return NextResponse.json({ blogs: rows });
  } catch (error: any) {
    console.error('Error fetching blogs for variedad:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
