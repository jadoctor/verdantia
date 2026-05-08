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

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const user = await authenticateSuperadmin(request);
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const idlabores = resolvedParams.id;

  try {
    const { title, url, summary, apuntes } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL requerida' }, { status: 400 });
    }

    const [countResult] = await pool.query(
      "SELECT COUNT(*) as total FROM datosadjuntos WHERE xdatosadjuntosidlabores = ? AND datosadjuntostipo = 'documento' AND datosadjuntosactivo = 1",
      [idlabores]
    );
    const total = (countResult as any[])[0].total;

    const [result] = await pool.query(
      `INSERT INTO datosadjuntos (
        datosadjuntostipo, datosadjuntosmime, datosadjuntosnombreoriginal,
        datosadjuntosruta, datosadjuntosesprincipal, datosadjuntosorden,
        datosadjuntosactivo, datosadjuntosfechacreacion, xdatosadjuntosidlabores,
        datosadjuntospesobytes, datosadjuntostitulo, datosadjuntosresumen, datosadjuntosapuntes
      ) VALUES ('documento', 'application/pdf', ?, ?, 0, ?, 1, NOW(), ?, 0, ?, ?, ?)`,
      [title || 'Documento IA', url, total + 1, idlabores, title || 'Documento IA', summary || '', apuntes || '']
    );

    return NextResponse.json({
      success: true,
      pdf: {
        id: (result as any).insertId,
        ruta: url,
        nombreOriginal: title || 'Documento IA',
        titulo: title || 'Documento IA',
        resumen: summary || '',
        apuntes: apuntes || '',
        portada: null
      }
    });

  } catch (error: any) {
    console.error('[Labor PDFs Link API] error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
