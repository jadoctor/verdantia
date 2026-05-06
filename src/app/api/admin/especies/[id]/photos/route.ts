import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getUserByEmail } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Error interno del servidor';

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

  const idespecies = resolvedParams.id;

  try {
    const [rows] = await pool.query(
      `SELECT iddatosadjuntos as id, datosadjuntosruta as ruta, 
              datosadjuntosesprincipal as esPrincipal, datosadjuntosresumen as resumen,
              datosadjuntosnombreoriginal as nombreOriginal
       FROM datosadjuntos 
       WHERE xdatosadjuntosidespecies = ? AND datosadjuntostipo = 'imagen' AND datosadjuntosactivo = 1 
       ORDER BY datosadjuntosesprincipal DESC, datosadjuntosorden ASC`,
      [idespecies]
    );
    return NextResponse.json({ photos: rows });
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const user = await authenticateSuperadmin(request);
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const idespecies = resolvedParams.id;

  try {
    const body = await request.json();
    const { storagePath, nombreOriginal, mimeType, fileSize, resumen } = body;

    if (!storagePath) {
      return NextResponse.json({ error: 'Ruta de archivo requerida' }, { status: 400 });
    }

    if (typeof storagePath !== 'string' || !storagePath.startsWith('uploads/especies/')) {
      return NextResponse.json({ error: 'Ruta de archivo no permitida' }, { status: 400 });
    }

    const [countResult] = await pool.query(
      "SELECT COUNT(*) as total FROM datosadjuntos WHERE xdatosadjuntosidespecies = ? AND datosadjuntostipo = 'imagen' AND datosadjuntosactivo = 1",
      [idespecies]
    );
    const total = Number((countResult as Array<{ total: number }>)[0]?.total || 0);

    const esPrimera = total === 0 ? 1 : 0;
    const initialResumen = typeof resumen === 'string' && resumen.trim()
      ? resumen
      : JSON.stringify({
          profile_object_x: 50,
          profile_object_y: 50,
          profile_object_zoom: 100,
          profile_brightness: 100,
          profile_contrast: 100,
          profile_style: '',
          seo_alt: '',
          dominant_color: null,
          vibrant_color: null,
          blurhash: null,
          exif_data: null
        });
    const safeOriginalName =
      typeof nombreOriginal === 'string' && nombreOriginal.trim()
        ? nombreOriginal.trim()
        : storagePath.split('/').pop() || 'foto-especie.jpg';
    const safeMimeType =
      typeof mimeType === 'string' && mimeType.startsWith('image/')
        ? mimeType
        : 'image/jpeg';
    const safeFileSize =
      typeof fileSize === 'number' && Number.isFinite(fileSize) && fileSize >= 0
        ? Math.round(fileSize)
        : 0;

    const [result] = await pool.query(
      `INSERT INTO datosadjuntos (
        datosadjuntostipo, datosadjuntosmime, datosadjuntosnombreoriginal,
        datosadjuntosruta, datosadjuntosesprincipal, datosadjuntosorden,
        datosadjuntosactivo, datosadjuntosfechacreacion, xdatosadjuntosidespecies,
        datosadjuntospesobytes, datosadjuntosresumen
      ) VALUES ('imagen', ?, ?, ?, ?, ?, 1, NOW(), ?, ?, ?)`,
      [
        safeMimeType, safeOriginalName, storagePath, esPrimera,
        total + 1, idespecies, safeFileSize, initialResumen
      ]
    );

    return NextResponse.json({
      success: true,
      photo: {
        id: (result as { insertId: number }).insertId,
        ruta: storagePath,
        esPrincipal: esPrimera,
        nombreOriginal: safeOriginalName,
        resumen: initialResumen
      }
    });

  } catch (error: unknown) {
    console.error('[Especie Photos API] Upload error:', error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const user = await authenticateSuperadmin(request);
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const photoId = searchParams.get('photoId');

  if (!photoId) return NextResponse.json({ error: 'photoId requerido' }, { status: 400 });

  try {
    await pool.query(
      'UPDATE datosadjuntos SET datosadjuntosactivo = 0, datosadjuntosfechaeliminacion = NOW() WHERE iddatosadjuntos = ? AND xdatosadjuntosidespecies = ?',
      [photoId, resolvedParams.id]
    );
    return NextResponse.json({ success: true, message: 'Foto eliminada' });
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const user = await authenticateSuperadmin(request);
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  try {
    const body = await request.json();
    const { photoId, action, resumen } = body;

    if (action === 'setPrimary') {
      await pool.query(
        'UPDATE datosadjuntos SET datosadjuntosesprincipal = 0 WHERE xdatosadjuntosidespecies = ? AND datosadjuntostipo = "imagen"',
        [resolvedParams.id]
      );
      await pool.query(
        'UPDATE datosadjuntos SET datosadjuntosesprincipal = 1 WHERE iddatosadjuntos = ? AND xdatosadjuntosidespecies = ?',
        [photoId, resolvedParams.id]
      );
      return NextResponse.json({ success: true, message: 'Foto principal actualizada' });
    }

    if (action === 'updateMeta' && resumen) {
      await pool.query(
        'UPDATE datosadjuntos SET datosadjuntosresumen = ? WHERE iddatosadjuntos = ? AND xdatosadjuntosidespecies = ?',
        [typeof resumen === 'string' ? resumen : JSON.stringify(resumen), photoId, resolvedParams.id]
      );
      return NextResponse.json({ success: true, message: 'Metadatos actualizados' });
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
