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

  const idtratamientos = resolvedParams.id;

  try {
    const { url, title, summary, apuntes, autores, identificacion } = await request.json();

    if (!url || !title) {
      return NextResponse.json({ error: 'URL y título requeridos' }, { status: 400 });
    }

    const [countResult] = await pool.query(
      "SELECT COUNT(*) as total FROM datosadjuntos WHERE xdatosadjuntosidtratamientos = ? AND datosadjuntostipo = 'documento' AND datosadjuntosactivo = 1",
      [idtratamientos]
    );
    const total = (countResult as any[])[0].total;

    let finalUrl = url;

    const safeTitle = Array.isArray(title) ? title.join(' ') : (title || '');
    const safeSummary = Array.isArray(summary) ? summary.join(' ') : (summary || '');
    const safeApuntes = Array.isArray(apuntes) ? apuntes.join('\n') : (apuntes || '');
    const safeAutores = Array.isArray(autores) ? autores.join(' ') : (autores || '');
    const safeIdentificacion = Array.isArray(identificacion) ? identificacion.join(' ') : (identificacion || '');

    const [result] = await pool.query(
      `INSERT INTO datosadjuntos (
        datosadjuntostipo, datosadjuntosmime, datosadjuntosnombreoriginal,
        datosadjuntosruta, datosadjuntosesprincipal, datosadjuntosorden,
        datosadjuntosactivo, datosadjuntosfechacreacion, xdatosadjuntosidtratamientos,
        datosadjuntospesobytes, datosadjuntostitulo, datosadjuntosresumen, datosadjuntosapuntes, datosadjuntosautores, datosadjuntosidentificacion
      ) VALUES ('documento', 'application/pdf', ?, ?, 0, ?, 1, NOW(), ?, 0, ?, ?, ?, ?, ?)`,
      ['Documento_Web', finalUrl, total + 1, idtratamientos, safeTitle, safeSummary, safeApuntes, safeAutores, safeIdentificacion]
    );

    return NextResponse.json({
      success: true,
      pdf: {
        id: (result as any).insertId,
        ruta: finalUrl,
        nombreOriginal: 'Documento_Web',
        titulo: title,
        resumen: summary || '',
        apuntes: apuntes || '',
        autores: autores || '',
        identificacion: identificacion || ''
      }
    });

  } catch (error: any) {
    console.error('[Tratamiento PDFs Link API] error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
