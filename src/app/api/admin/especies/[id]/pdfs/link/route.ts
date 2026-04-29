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
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const idespecies = resolvedParams.id;

  try {
    const { url, title, summary, apuntes } = await request.json();

    if (!url || !title) {
      return NextResponse.json({ error: 'URL y título requeridos' }, { status: 400 });
    }

    const [countResult] = await pool.query(
      "SELECT COUNT(*) as total FROM datosadjuntos WHERE xdatosadjuntosidespecies = ? AND datosadjuntostipo = 'documento' AND datosadjuntosactivo = 1",
      [idespecies]
    );
    const total = (countResult as any[])[0].total;

    // Convert to Archive.org URL to prevent Link Rot
    let finalUrl = url;
    if (!url.includes('web.archive.org')) {
      finalUrl = `https://web.archive.org/web/2/${url}`;
    }

    const safeTitle = Array.isArray(title) ? title.join(' ') : (title || '');
    const safeSummary = Array.isArray(summary) ? summary.join(' ') : (summary || '');
    const safeApuntes = Array.isArray(apuntes) ? apuntes.join('\n') : (apuntes || '');

    const [result] = await pool.query(
      `INSERT INTO datosadjuntos (
        datosadjuntostipo, datosadjuntosmime, datosadjuntosnombreoriginal,
        datosadjuntosruta, datosadjuntosesprincipal, datosadjuntosorden,
        datosadjuntosactivo, datosadjuntosfechacreacion, xdatosadjuntosidespecies,
        datosadjuntospesobytes, datosadjuntostitulo, datosadjuntosresumen, datosadjuntosapuntes
      ) VALUES ('documento', 'application/pdf', ?, ?, 0, ?, 1, NOW(), ?, 0, ?, ?, ?)`,
      ['Documento_Web', finalUrl, total + 1, idespecies, safeTitle, safeSummary, safeApuntes]
    );

    return NextResponse.json({
      success: true,
      pdf: {
        id: (result as any).insertId,
        ruta: finalUrl,
        nombreOriginal: 'Documento_Web',
        titulo: title,
        resumen: summary || '',
        apuntes: apuntes || ''
      }
    });

  } catch (error: any) {
    console.error('[Especie PDFs Link API] error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
