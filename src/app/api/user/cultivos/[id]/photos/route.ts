import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getUserByEmail } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const email = request.headers.get('x-user-email');
  if (!email) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const user = await getUserByEmail(email);
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  const cultivoId = resolvedParams.id;

  try {
    const [ownerCheck]: any = await pool.query(
      `SELECT idcultivos FROM cultivos WHERE idcultivos = ? AND xcultivosidusuarios = ?`,
      [cultivoId, user.id]
    );

    if (ownerCheck.length === 0) {
      return NextResponse.json({ error: 'Cultivo no encontrado o no autorizado' }, { status: 404 });
    }

    const [rows]: any = await pool.query(
      `SELECT da.iddatosadjuntos as id, da.datosadjuntosruta as ruta, 
              da.datosadjuntosesprincipal as esPrincipal, da.datosadjuntosresumen as resumen,
              da.datosadjuntosnombreoriginal as nombreOriginal,
              da.datosadjuntostipo as tipo,
              'cultivo' AS origen
       FROM datosadjuntos da
       WHERE da.xdatosadjuntosidcultivos = ? 
       AND da.datosadjuntosfechaeliminacion IS NULL
       AND da.datosadjuntostipo = 'imagen' 
       AND da.datosadjuntosactivo = 1
       ORDER BY 
         da.datosadjuntosesprincipal DESC, 
         da.datosadjuntosorden ASC,
         da.datosadjuntosfechacreacion DESC`,
      [cultivoId]
    );

    return NextResponse.json({ photos: rows });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const email = request.headers.get('x-user-email');
  if (!email) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const user = await getUserByEmail(email);
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  const cultivoId = resolvedParams.id;

  try {
    const body = await request.json();
    const { rawStoragePath, originalFilename, idAviso, fase } = body;

    if (!rawStoragePath) return NextResponse.json({ error: 'Ruta requerida' }, { status: 400 });

    const [ownerCheck]: any = await pool.query(
      `SELECT idcultivos FROM cultivos WHERE idcultivos = ? AND xcultivosidusuarios = ?`,
      [cultivoId, user.id]
    );

    if (ownerCheck.length === 0) {
      return NextResponse.json({ error: 'Cultivo no encontrado' }, { status: 404 });
    }

    const { getAdminBucket } = await import('@/lib/firebase/admin');
    const bucket = getAdminBucket();
    const fileRef = bucket.file(rawStoragePath);
    let downloadedFile: Buffer;
    try {
      [downloadedFile] = await fileRef.download();
    } catch (e) {
      return NextResponse.json({ error: 'Archivo no encontrado' }, { status: 404 });
    }

    const sharp = eval(`require('sharp')`);
    const { uploadToStorage } = await import('@/lib/firebase/storage');
    const { encode } = eval(`require('blurhash')`);

    const [countResult] = await pool.query(
      "SELECT COUNT(*) as total FROM datosadjuntos WHERE xdatosadjuntosidcultivos = ? AND datosadjuntostipo = 'imagen' AND datosadjuntosactivo = 1",
      [cultivoId]
    );
    const total = (countResult as any[])[0].total;
    const esPrimera = total === 0 ? 1 : 0;

    const storagePath = `uploads/cultivos/user-${user.id}-${cultivoId}-${Date.now()}.webp`;

    const sharpInstance = sharp(Buffer.from(downloadedFile));
    let blurhashStr = null;
    try {
      const { data, info } = await sharpInstance.clone().resize(32, 32, { fit: 'inside' }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      blurhashStr = encode(new Uint8ClampedArray(data), info.width, info.height, 4, 3);
    } catch (e) {}

    const resizedBuffer = await sharpInstance
      .clone()
      .rotate()
      .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
      .toBuffer();

    const cleanBuffer = await sharp(resizedBuffer).webp({ quality: 80 }).toBuffer();
    await uploadToStorage(cleanBuffer, storagePath, 'image/webp');

    const initialResumen = JSON.stringify({
      profile_object_x: 50,
      profile_object_y: 50,
      profile_object_zoom: 100,
      profile_brightness: 100,
      profile_contrast: 100,
      blurhash: blurhashStr,
      ...(fase ? { fase } : {})
    });

    const [result] = await pool.query(
      `INSERT INTO datosadjuntos (
        datosadjuntostipo, datosadjuntosmime, datosadjuntosnombreoriginal,
        datosadjuntosruta, datosadjuntosesprincipal, datosadjuntosorden,
        datosadjuntosactivo, datosadjuntosfechacreacion, xdatosadjuntosidcultivos, xdatosadjuntosidcultivosavisos,
        datosadjuntospesobytes, datosadjuntosresumen, datosadjuntosvalidado
      ) VALUES ('imagen', 'image/webp', ?, ?, ?, ?, 1, NOW(), ?, ?, ?, ?, 0)`,
      [originalFilename || 'foto.jpg', storagePath, esPrimera, total + 1, cultivoId, idAviso || null, downloadedFile.byteLength, initialResumen]
    );

    if (rawStoragePath.startsWith('uploads/temp/')) {
      await fileRef.delete().catch(() => {});
    }

    return NextResponse.json({ success: true, photo: { id: (result as any).insertId, ruta: storagePath } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const email = request.headers.get('x-user-email');
  if (!email) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const user = await getUserByEmail(email);
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  const { searchParams } = new URL(request.url);
  const photoId = searchParams.get('photoId');
  if (!photoId) return NextResponse.json({ error: 'photoId requerido' }, { status: 400 });

  try {
    await pool.query(
      'UPDATE datosadjuntos SET datosadjuntosactivo = 0, datosadjuntosfechaeliminacion = NOW() WHERE iddatosadjuntos = ? AND xdatosadjuntosidcultivos = ?',
      [photoId, resolvedParams.id]
    );

    const [activePhotos]: any = await pool.query(
      "SELECT iddatosadjuntos, datosadjuntosesprincipal FROM datosadjuntos WHERE xdatosadjuntosidcultivos = ? AND datosadjuntosactivo = 1 AND datosadjuntostipo = 'imagen' ORDER BY datosadjuntosorden ASC, datosadjuntosfechacreacion DESC",
      [resolvedParams.id]
    );
    if (activePhotos.length > 0) {
      const hasPrincipal = activePhotos.some((p: any) => p.datosadjuntosesprincipal === 1);
      if (!hasPrincipal) {
        await pool.query(
          "UPDATE datosadjuntos SET datosadjuntosesprincipal = 1 WHERE iddatosadjuntos = ?",
          [activePhotos[0].iddatosadjuntos]
        );
      }
    }

    return NextResponse.json({ success: true, message: 'Foto eliminada (soft delete)' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const email = request.headers.get('x-user-email');
  if (!email) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const user = await getUserByEmail(email);
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  try {
    const body = await request.json();
    const { photoId, action, resumen } = body;

    if (action === 'setPrimary') {
      await pool.query(
        'UPDATE datosadjuntos SET datosadjuntosesprincipal = 0 WHERE xdatosadjuntosidcultivos = ? AND datosadjuntostipo = "imagen"',
        [resolvedParams.id]
      );
      await pool.query(
        'UPDATE datosadjuntos SET datosadjuntosesprincipal = 1 WHERE iddatosadjuntos = ? AND xdatosadjuntosidcultivos = ?',
        [photoId, resolvedParams.id]
      );
      return NextResponse.json({ success: true });
    }

    if (action === 'updateMeta' && resumen) {
      await pool.query(
        'UPDATE datosadjuntos SET datosadjuntosresumen = ? WHERE iddatosadjuntos = ? AND xdatosadjuntosidcultivos = ?',
        [typeof resumen === 'string' ? resumen : JSON.stringify(resumen), photoId, resolvedParams.id]
      );
      return NextResponse.json({ success: true });
    }

    if (action === 'reorder' && Array.isArray(body.photoIds)) {
      const { photoIds } = body;
      for (let i = 0; i < photoIds.length; i++) {
        await pool.query(
          'UPDATE datosadjuntos SET datosadjuntosorden = ? WHERE iddatosadjuntos = ? AND xdatosadjuntosidcultivos = ?',
          [i, photoIds[i], resolvedParams.id]
        );
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Acción inválida' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
