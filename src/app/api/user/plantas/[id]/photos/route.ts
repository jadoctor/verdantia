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

  const plantaId = resolvedParams.id;

  try {
    // Check if user owns this plant
    const [ownerCheck]: any = await pool.query(
      `SELECT vu.idvariedades, vg.idvariedades AS idgold, e.idespecies 
       FROM variedades vu
       JOIN variedades vg ON vu.xvariedadesidvariedadorigen = vg.idvariedades
       JOIN especies e ON vg.xvariedadesidespecies = e.idespecies
       WHERE vu.idvariedades = ? AND vu.xvariedadesidusuarios = ?`,
      [plantaId, user.id]
    );

    if (ownerCheck.length === 0) {
      return NextResponse.json({ error: 'Planta no encontrada o no te pertenece' }, { status: 404 });
    }

    const { idvariedades, idgold, idespecies } = ownerCheck[0];

    // Get photos: User photos (including sanctioned placeholders), Gold photos, Especie photos
    const [rows]: any = await pool.query(
      `SELECT da.iddatosadjuntos as id, da.datosadjuntosruta as ruta, 
              da.datosadjuntosesprincipal as esPrincipal, da.datosadjuntosresumen as resumen,
              da.datosadjuntosnombreoriginal as nombreOriginal,
              da.datosadjuntosvalidado as validado,
              da.datosadjuntosresultadovalidacion as resultadoValidacion,
              da.datosadjuntostipo as tipo,
              inc.incidenciasmotivo as motivoRechazo,
              CASE 
                WHEN da.xdatosadjuntosidvariedades = ? THEN 'usuario'
                WHEN da.xdatosadjuntosidvariedades = ? THEN 'gold'
                WHEN da.xdatosadjuntosidespecies = ? THEN 'especie'
              END AS origen
       FROM datosadjuntos da
       LEFT JOIN incidencias inc ON inc.incidenciasreferenciaid = da.iddatosadjuntos AND inc.incidenciastipo IN ('foto_rechazada', 'foto_sancionada')
       WHERE (da.xdatosadjuntosidvariedades = ? OR da.xdatosadjuntosidvariedades = ? OR da.xdatosadjuntosidespecies = ?) 
       AND da.datosadjuntosfechaeliminacion IS NULL
       AND (
         (da.datosadjuntostipo = 'imagen' AND (da.datosadjuntosactivo = 1 OR da.datosadjuntosresultadovalidacion = 'rechazado'))
         OR
         (da.datosadjuntostipo = 'sancionada' AND da.xdatosadjuntosidvariedades = ?)
       )
       ORDER BY 
         CASE WHEN da.datosadjuntosresultadovalidacion = 'rechazado' THEN 1 ELSE 0 END ASC,
         CASE origen WHEN 'usuario' THEN 1 WHEN 'gold' THEN 2 ELSE 3 END ASC,
         da.datosadjuntosesprincipal DESC, 
         da.datosadjuntosorden ASC`,
      [idvariedades, idgold, idespecies, idvariedades, idgold, idespecies, idvariedades]
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

  const idvariedades = resolvedParams.id;

  try {
    const body = await request.json();
    const { rawStoragePath, originalFilename, variedadNombre } = body;

    if (!rawStoragePath) return NextResponse.json({ error: 'Ruta requerida' }, { status: 400 });

    const [ownerCheck]: any = await pool.query(
      `SELECT idvariedades FROM variedades WHERE idvariedades = ? AND xvariedadesidusuarios = ?`,
      [idvariedades, user.id]
    );

    if (ownerCheck.length === 0) {
      return NextResponse.json({ error: 'Planta no encontrada' }, { status: 404 });
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

    const ext = (rawStoragePath.match(/\.\w+$/) || ['.jpg'])[0];
    const sharp = eval(`require('sharp')`);
    const { uploadToStorage } = await import('@/lib/firebase/storage');
    const { encode } = eval(`require('blurhash')`);

    // Cuenta cuántas fotos tiene el usuario (no las de la especie)
    const [countResult] = await pool.query(
      "SELECT COUNT(*) as total FROM datosadjuntos WHERE xdatosadjuntosidvariedades = ? AND datosadjuntostipo = 'imagen' AND datosadjuntosactivo = 1",
      [idvariedades]
    );
    const total = (countResult as any[])[0].total;
    const esPrimera = total === 0 ? 1 : 0;

    const storagePath = `uploads/variedades/user-${user.id}-${idvariedades}-${Date.now()}.webp`;

    const sharpInstance = sharp(Buffer.from(downloadedFile));
    let blurhashStr = null;
    try {
      const { data, info } = await sharpInstance.clone().resize(32, 32, { fit: 'inside' }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      blurhashStr = encode(new Uint8ClampedArray(data), info.width, info.height, 4, 3);
    } catch (e) {}

    const watermarkSvg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="300" height="60">
      <rect x="0" y="0" width="300" height="60" fill="black" fill-opacity="0.8" stroke="white" stroke-width="2" rx="8" />
      <text x="280" y="40" text-anchor="end"
        font-family="system-ui, -apple-system, sans-serif" font-size="28" font-weight="bold"
        fill="white" fill-opacity="1" letter-spacing="2">
        VERDANTIA
      </text>
    </svg>`);

    const metadata = await sharpInstance.metadata();
    const targetWidth = Math.min(metadata.width || 1920, 1920);
    const targetHeight = Math.min(metadata.height || 1080, 1080);

    // 1) Redimensionar a buffer (sharp pipelines son single-use)
    const resizedBuffer = await sharpInstance
      .clone()
      .rotate()
      .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
      .toBuffer();

    // 2) Subir versión LIMPIA (sin marca) para la app
    const filename = storagePath.split('/').pop() || 'image.webp';
    const cleanBuffer = await sharp(resizedBuffer).webp({ quality: 80 }).toBuffer();
    const cleanStoragePath = `uploads/variedades/clean-${filename}`;
    await uploadToStorage(cleanBuffer, cleanStoragePath, 'image/webp');

    // 3) Generar marca de agua proporcional y subir versión PROTEGIDA
    const resizedMeta = await sharp(resizedBuffer).metadata();
    const rw = resizedMeta.width || 0;
    const rh = resizedMeta.height || 0;

    const wmWidth = Math.min(rw, Math.max(150, Math.floor(rw * 0.35)));
    const wmHeight = Math.min(rh, Math.max(30, Math.floor(wmWidth * 0.2)));
    const fontSize = Math.max(10, Math.floor(wmWidth * 0.1));

    const dynamicWatermarkSvg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${wmWidth}" height="${wmHeight}">
      <text x="${wmWidth - 6}" y="${wmHeight * 0.75}" text-anchor="end"
        font-family="system-ui, -apple-system, sans-serif" font-size="${fontSize}" font-weight="600"
        fill="white" fill-opacity="0.55" letter-spacing="1">
        VERDANTIA
      </text>
    </svg>`);

    const mainBuffer = await sharp(resizedBuffer)
      .composite([{ input: dynamicWatermarkSvg, gravity: 'southeast' }])
      .webp({ quality: 80 })
      .toBuffer();
    await uploadToStorage(mainBuffer, storagePath, 'image/webp');

    const initialResumen = JSON.stringify({
      profile_object_x: 50,
      profile_object_y: 50,
      profile_object_zoom: 100,
      profile_brightness: 100,
      profile_contrast: 100,
      blurhash: blurhashStr
    });

    const [result] = await pool.query(
      `INSERT INTO datosadjuntos (
        datosadjuntostipo, datosadjuntosmime, datosadjuntosnombreoriginal,
        datosadjuntosruta, datosadjuntosesprincipal, datosadjuntosorden,
        datosadjuntosactivo, datosadjuntosfechacreacion, xdatosadjuntosidvariedades,
        datosadjuntospesobytes, datosadjuntosresumen, datosadjuntosvalidado
      ) VALUES ('imagen', 'image/webp', ?, ?, ?, ?, 1, NOW(), ?, ?, ?, 0)`,
      [originalFilename || 'foto.jpg', storagePath, esPrimera, total + 1, idvariedades, downloadedFile.byteLength, initialResumen]
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
    // Only delete if it belongs to this variety, which we already checked is owned by the user
    const [rows]: any = await pool.query('SELECT datosadjuntosruta FROM datosadjuntos WHERE iddatosadjuntos = ? AND xdatosadjuntosidvariedades = ?', [photoId, resolvedParams.id]);
    const ruta = rows[0]?.datosadjuntosruta;

    await pool.query(
      'UPDATE datosadjuntos SET datosadjuntosactivo = 0, datosadjuntosfechaeliminacion = NOW() WHERE iddatosadjuntos = ? AND xdatosadjuntosidvariedades = ?',
      [photoId, resolvedParams.id]
    );

    // Si solo queda 1 foto activa, hacerla principal
    const [activePhotos]: any = await pool.query(
      "SELECT iddatosadjuntos, datosadjuntosesprincipal FROM datosadjuntos WHERE xdatosadjuntosidvariedades = ? AND datosadjuntosactivo = 1 AND datosadjuntostipo = 'imagen' ORDER BY datosadjuntosorden ASC, datosadjuntosfechacreacion DESC",
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
        'UPDATE datosadjuntos SET datosadjuntosesprincipal = 0 WHERE xdatosadjuntosidvariedades = ? AND datosadjuntostipo = "imagen"',
        [resolvedParams.id]
      );
      await pool.query(
        'UPDATE datosadjuntos SET datosadjuntosesprincipal = 1 WHERE iddatosadjuntos = ? AND xdatosadjuntosidvariedades = ?',
        [photoId, resolvedParams.id]
      );
      return NextResponse.json({ success: true });
    }

    if (action === 'updateMeta' && resumen) {
      await pool.query(
        'UPDATE datosadjuntos SET datosadjuntosresumen = ? WHERE iddatosadjuntos = ? AND xdatosadjuntosidvariedades = ?',
        [typeof resumen === 'string' ? resumen : JSON.stringify(resumen), photoId, resolvedParams.id]
      );
      return NextResponse.json({ success: true });
    }

    if (action === 'reorder' && Array.isArray(body.photoIds)) {
      const { photoIds } = body;
      for (let i = 0; i < photoIds.length; i++) {
        await pool.query(
          'UPDATE datosadjuntos SET datosadjuntosorden = ? WHERE iddatosadjuntos = ? AND xdatosadjuntosidvariedades = ?',
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
