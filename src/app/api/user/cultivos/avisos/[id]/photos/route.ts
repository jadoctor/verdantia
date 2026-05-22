import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getUserByEmail } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET: Obtener todas las fotos activas asociadas a una labor completada (cultivosavisos)
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const email = request.headers.get('x-user-email');
  if (!email) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const user = await getUserByEmail(email);
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  const cultivosAvisosId = resolvedParams.id;

  try {
    if (cultivosAvisosId === 'pending') {
      const { searchParams } = new URL(request.url);
      const idcultivos = searchParams.get('idcultivos');
      const idpauta = searchParams.get('idpauta');
      const fechaEmision = searchParams.get('fechaEmision');

      if (!idcultivos || !idpauta || !fechaEmision) {
        return NextResponse.json({ error: 'Parámetros idcultivos, idpauta y fechaEmision son requeridos para tareas pendientes' }, { status: 400 });
      }

      // Validar propiedad del cultivo
      const [cropCheck]: any = await pool.query(
        `SELECT xcultivosidusuarios FROM cultivos WHERE idcultivos = ?`,
        [idcultivos]
      );
      if (cropCheck.length === 0 || cropCheck[0].xcultivosidusuarios !== user.id) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
      }

      const [rows]: any = await pool.query(
        `SELECT iddatosadjuntos as id, datosadjuntosruta as ruta, 
                datosadjuntosesprincipal as esPrincipal, datosadjuntosresumen as resumen,
                datosadjuntosnombreoriginal as nombreOriginal,
                datosadjuntosvalidado as validado,
                datosadjuntosresultadovalidacion as resultadoValidacion
         FROM datosadjuntos
         WHERE xdatosadjuntosidcultivos = ? 
           AND xdatosadjuntosidcultivosavisos IS NULL 
           AND datosadjuntosactivo = 1 
           AND datosadjuntostipo = 'imagen'
         ORDER BY datosadjuntosorden ASC, datosadjuntosfechacreacion DESC`,
        [idcultivos]
      );

      const filteredPhotos = rows.filter((row: any) => {
        try {
          const resObj = typeof row.resumen === 'string' ? JSON.parse(row.resumen) : row.resumen;
          return resObj && 
                 resObj.pending_idpauta === parseInt(idpauta) && 
                 resObj.pending_fechaEmision === fechaEmision;
        } catch (e) {
          return false;
        }
      });

      return NextResponse.json({ photos: filteredPhotos });
    }

    // Validar que el aviso completado pertenece al usuario
    const [ownerCheck]: any = await pool.query(
      `SELECT xcultivosavisosidusuarios FROM cultivosavisos WHERE idcultivosavisos = ?`,
      [cultivosAvisosId]
    );

    if (ownerCheck.length === 0) {
      return NextResponse.json({ error: 'Labor completada no encontrada' }, { status: 404 });
    }

    if (ownerCheck[0].xcultivosavisosidusuarios !== user.id) {
      return NextResponse.json({ error: 'No autorizado para ver estas fotos' }, { status: 403 });
    }

    const [rows]: any = await pool.query(
      `SELECT iddatosadjuntos as id, datosadjuntosruta as ruta, 
              datosadjuntosesprincipal as esPrincipal, datosadjuntosresumen as resumen,
              datosadjuntosnombreoriginal as nombreOriginal,
              datosadjuntosvalidado as validado,
              datosadjuntosresultadovalidacion as resultadoValidacion
       FROM datosadjuntos
       WHERE xdatosadjuntosidcultivosavisos = ? 
         AND datosadjuntosactivo = 1 
         AND datosadjuntostipo = 'imagen'
       ORDER BY datosadjuntosorden ASC, datosadjuntosfechacreacion DESC`,
      [cultivosAvisosId]
    );

    return NextResponse.json({ photos: rows });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Procesar y guardar una foto subida asociada a la labor completada
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const email = request.headers.get('x-user-email');
  if (!email) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const user = await getUserByEmail(email);
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  const cultivosAvisosId = resolvedParams.id;

    if (cultivosAvisosId === 'pending') {
      try {
        const body = await request.json();
        const { rawStoragePath, originalFilename, idcultivos, idpauta, fechaEmision } = body;

        if (!rawStoragePath) return NextResponse.json({ error: 'Ruta temporal requerida' }, { status: 400 });
        if (!idcultivos || !idpauta || !fechaEmision) return NextResponse.json({ error: 'idcultivos, idpauta y fechaEmision requeridos para tareas pendientes' }, { status: 400 });

        // Validar propiedad del cultivo
        const [cropCheck]: any = await pool.query(
          `SELECT xcultivosidusuarios FROM cultivos WHERE idcultivos = ?`,
          [idcultivos]
        );
        if (cropCheck.length === 0 || cropCheck[0].xcultivosidusuarios !== user.id) {
          return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
        }

        // Descargar archivo temporal
        const { getAdminBucket } = await import('@/lib/firebase/admin');
        const bucket = getAdminBucket();
        const fileRef = bucket.file(rawStoragePath);
        let downloadedFile: Buffer;
        try {
          [downloadedFile] = await fileRef.download();
        } catch (e) {
          return NextResponse.json({ error: 'Archivo temporal no encontrado' }, { status: 404 });
        }

        const sharp = eval(`require('sharp')`);
        const { uploadToStorage } = await import('@/lib/firebase/storage');
        const { encode } = eval(`require('blurhash')`);

        // Contar cuántas fotos tiene este aviso pendiente
        const [rows]: any = await pool.query(
          "SELECT iddatosadjuntos, datosadjuntosresumen FROM datosadjuntos WHERE xdatosadjuntosidcultivos = ? AND xdatosadjuntosidcultivosavisos IS NULL AND datosadjuntostipo = 'imagen' AND datosadjuntosactivo = 1",
          [idcultivos]
        );

        const pendingPhotos = rows.filter((row: any) => {
          try {
            const resObj = typeof row.datosadjuntosresumen === 'string' ? JSON.parse(row.datosadjuntosresumen) : row.datosadjuntosresumen;
            return resObj && 
                   resObj.pending_idpauta === parseInt(idpauta) && 
                   resObj.pending_fechaEmision === fechaEmision;
          } catch (e) {
            return false;
          }
        });

        const total = pendingPhotos.length;
        if (total >= 4) {
          return NextResponse.json({ error: 'Límite alcanzado: máximo 4 fotos por labor.' }, { status: 400 });
        }
        const esPrimera = total === 0 ? 1 : 0;

        const storagePath = `uploads/cultivosavisos/user-${user.id}-pending-${idpauta}-${Date.now()}.webp`;

        const sharpInstance = sharp(Buffer.from(downloadedFile));
        let blurhashStr = null;
        try {
          const { data, info } = await sharpInstance.clone().resize(32, 32, { fit: 'inside' }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
          blurhashStr = encode(new Uint8ClampedArray(data), info.width, info.height, 4, 3);
        } catch (e) {
          console.error('Error generando blurhash:', e);
        }

        // Procesar dimensiones
        const metadata = await sharpInstance.metadata();
        const targetWidth = Math.min(metadata.width || 1920, 1920);
        const targetHeight = Math.min(metadata.height || 1080, 1080);

        // Redimensionar
        const resizedBuffer = await sharpInstance
          .clone()
          .rotate()
          .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
          .toBuffer();

        // Guardar versión limpia
        const filename = storagePath.split('/').pop() || 'image.webp';
        const cleanBuffer = await sharp(resizedBuffer).webp({ quality: 80 }).toBuffer();
        const cleanStoragePath = `uploads/cultivosavisos/clean-${filename}`;
        await uploadToStorage(cleanBuffer, cleanStoragePath, 'image/webp');

        // Agregar marca de agua
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
          blurhash: blurhashStr,
          pending_idpauta: parseInt(idpauta),
          pending_fechaEmision: fechaEmision
        });

        // Guardar registro
        const [result] = await pool.query(
          `INSERT INTO datosadjuntos (
            datosadjuntostipo, datosadjuntosmime, datosadjuntosnombreoriginal,
            datosadjuntosruta, datosadjuntosesprincipal, datosadjuntosorden,
            datosadjuntosactivo, datosadjuntosfechacreacion, xdatosadjuntosidusuarios,
            xdatosadjuntosidcultivos, xdatosadjuntosidcultivosavisos,
            datosadjuntospesobytes, datosadjuntosresumen, datosadjuntosvalidado
          ) VALUES ('imagen', 'image/webp', ?, ?, ?, ?, 1, NOW(), ?, ?, NULL, ?, ?, 0)`,
          [originalFilename || 'foto.jpg', storagePath, esPrimera, total + 1, user.id, idcultivos, downloadedFile.byteLength, initialResumen]
        );

        if (rawStoragePath.startsWith('uploads/temp/')) {
          await fileRef.delete().catch(() => {});
        }

        return NextResponse.json({ success: true, photo: { id: (result as any).insertId, ruta: storagePath } });
      } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

  try {
    const body = await request.json();
    const { rawStoragePath, originalFilename } = body;

    if (!rawStoragePath) return NextResponse.json({ error: 'Ruta temporal requerida' }, { status: 400 });

    // Validar que el aviso completado pertenece al usuario y obtener el idcultivo
    const [ownerCheck]: any = await pool.query(
      `SELECT xcultivosavisosidusuarios, xcultivosavisosidcultivos FROM cultivosavisos WHERE idcultivosavisos = ?`,
      [cultivosAvisosId]
    );

    if (ownerCheck.length === 0) {
      return NextResponse.json({ error: 'Labor completada no encontrada' }, { status: 404 });
    }

    const completedTask = ownerCheck[0];
    if (completedTask.xcultivosavisosidusuarios !== user.id) {
      return NextResponse.json({ error: 'No autorizado para subir fotos a esta labor' }, { status: 403 });
    }

    const idcultivo = completedTask.xcultivosavisosidcultivos;

    // Descargar el archivo temporal desde Firebase Storage
    const { getAdminBucket } = await import('@/lib/firebase/admin');
    const bucket = getAdminBucket();
    const fileRef = bucket.file(rawStoragePath);
    let downloadedFile: Buffer;
    try {
      [downloadedFile] = await fileRef.download();
    } catch (e) {
      return NextResponse.json({ error: 'Archivo temporal no encontrado en Storage' }, { status: 404 });
    }

    // Inicializar Sharp y Blurhash con eval/require para evitar problemas en NextJS
    const sharp = eval(`require('sharp')`);
    const { uploadToStorage } = await import('@/lib/firebase/storage');
    const { encode } = eval(`require('blurhash')`);

    // Contar cuántas fotos tiene esta labor
    const [countResult] = await pool.query(
      "SELECT COUNT(*) as total FROM datosadjuntos WHERE xdatosadjuntosidcultivosavisos = ? AND datosadjuntostipo = 'imagen' AND datosadjuntosactivo = 1",
      [cultivosAvisosId]
    );
    const total = (countResult as any[])[0].total;
    if (total >= 4) {
      return NextResponse.json({ error: 'Límite alcanzado: máximo 4 fotos por labor realizada.' }, { status: 400 });
    }
    const esPrimera = total === 0 ? 1 : 0;

    const storagePath = `uploads/cultivosavisos/user-${user.id}-${cultivosAvisosId}-${Date.now()}.webp`;

    const sharpInstance = sharp(Buffer.from(downloadedFile));
    let blurhashStr = null;
    try {
      const { data, info } = await sharpInstance.clone().resize(32, 32, { fit: 'inside' }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      blurhashStr = encode(new Uint8ClampedArray(data), info.width, info.height, 4, 3);
    } catch (e) {
      console.error('Error generando blurhash:', e);
    }

    // Procesar dimensiones
    const metadata = await sharpInstance.metadata();
    const targetWidth = Math.min(metadata.width || 1920, 1920);
    const targetHeight = Math.min(metadata.height || 1080, 1080);

    // Redimensionar
    const resizedBuffer = await sharpInstance
      .clone()
      .rotate()
      .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
      .toBuffer();

    // Guardar versión limpia
    const filename = storagePath.split('/').pop() || 'image.webp';
    const cleanBuffer = await sharp(resizedBuffer).webp({ quality: 80 }).toBuffer();
    const cleanStoragePath = `uploads/cultivosavisos/clean-${filename}`;
    await uploadToStorage(cleanBuffer, cleanStoragePath, 'image/webp');

    // Agregar marca de agua
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
      blurhash: blurhashStr
    });

    // Guardar registro en la base de datos
    const [result] = await pool.query(
      `INSERT INTO datosadjuntos (
        datosadjuntostipo, datosadjuntosmime, datosadjuntosnombreoriginal,
        datosadjuntosruta, datosadjuntosesprincipal, datosadjuntosorden,
        datosadjuntosactivo, datosadjuntosfechacreacion, xdatosadjuntosidusuarios,
        xdatosadjuntosidcultivos, xdatosadjuntosidcultivosavisos,
        datosadjuntospesobytes, datosadjuntosresumen, datosadjuntosvalidado
      ) VALUES ('imagen', 'image/webp', ?, ?, ?, ?, 1, NOW(), ?, ?, ?, ?, ?, 0)`,
      [originalFilename || 'foto.jpg', storagePath, esPrimera, total + 1, user.id, idcultivo, cultivosAvisosId, downloadedFile.byteLength, initialResumen]
    );

    // Limpiar archivo temporal de Storage
    if (rawStoragePath.startsWith('uploads/temp/')) {
      await fileRef.delete().catch(() => {});
    }

    return NextResponse.json({ success: true, photo: { id: (result as any).insertId, ruta: storagePath } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Borrado lógico de una foto de la labor realizada
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const email = request.headers.get('x-user-email');
  if (!email) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const user = await getUserByEmail(email);
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  const cultivosAvisosId = resolvedParams.id;

  const { searchParams } = new URL(request.url);
  const photoId = searchParams.get('photoId');
  if (!photoId) return NextResponse.json({ error: 'photoId requerido' }, { status: 400 });

  try {
    if (cultivosAvisosId === 'pending') {
      const { searchParams } = new URL(request.url);
      const photoId = searchParams.get('photoId');
      if (!photoId) return NextResponse.json({ error: 'photoId requerido' }, { status: 400 });

      try {
        const [photoCheck]: any = await pool.query(
          `SELECT xdatosadjuntosidusuarios, xdatosadjuntosidcultivos, datosadjuntosresumen FROM datosadjuntos WHERE iddatosadjuntos = ? AND datosadjuntosactivo = 1`,
          [photoId]
        );
        if (photoCheck.length === 0) {
          return NextResponse.json({ error: 'Foto no encontrada' }, { status: 404 });
        }
        if (photoCheck[0].xdatosadjuntosidusuarios !== user.id) {
          return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
        }

        const idcultivo = photoCheck[0].xdatosadjuntosidcultivos;
        const resumenStr = photoCheck[0].datosadjuntosresumen;

        await pool.query(
          'UPDATE datosadjuntos SET datosadjuntosactivo = 0, datosadjuntosfechaeliminacion = NOW() WHERE iddatosadjuntos = ?',
          [photoId]
        );

        // Reorganizar principalidad
        let pending_idpauta = null;
        let pending_fechaEmision = null;
        try {
          const resObj = typeof resumenStr === 'string' ? JSON.parse(resumenStr) : resumenStr;
          pending_idpauta = resObj.pending_idpauta;
          pending_fechaEmision = resObj.pending_fechaEmision;
        } catch(e) {}

        if (pending_idpauta !== null && pending_fechaEmision !== null) {
          const [rows]: any = await pool.query(
            "SELECT iddatosadjuntos, datosadjuntosesprincipal, datosadjuntosresumen FROM datosadjuntos WHERE xdatosadjuntosidcultivos = ? AND xdatosadjuntosidcultivosavisos IS NULL AND datosadjuntosactivo = 1 AND datosadjuntostipo = 'imagen'",
            [idcultivo]
          );
          const activePhotos = rows.filter((row: any) => {
            try {
              const resObj = typeof row.datosadjuntosresumen === 'string' ? JSON.parse(row.datosadjuntosresumen) : row.datosadjuntosresumen;
              return resObj && 
                     resObj.pending_idpauta === pending_idpauta && 
                     resObj.pending_fechaEmision === pending_fechaEmision;
            } catch(e) { return false; }
          });

          if (activePhotos.length > 0) {
            const hasPrincipal = activePhotos.some((p: any) => p.datosadjuntosesprincipal === 1);
            if (!hasPrincipal) {
              await pool.query(
                "UPDATE datosadjuntos SET datosadjuntosesprincipal = 1 WHERE iddatosadjuntos = ?",
                [activePhotos[0].iddatosadjuntos]
              );
            }
          }
        }

        return NextResponse.json({ success: true, message: 'Foto eliminada correctamente' });
      } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    // Validar que el aviso completado pertenece al usuario
    const [ownerCheck]: any = await pool.query(
      `SELECT xcultivosavisosidusuarios FROM cultivosavisos WHERE idcultivosavisos = ?`,
      [cultivosAvisosId]
    );

    if (ownerCheck.length === 0) {
      return NextResponse.json({ error: 'Labor completada no encontrada' }, { status: 404 });
    }

    if (ownerCheck[0].xcultivosavisosidusuarios !== user.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Realizar soft-delete en datosadjuntos
    await pool.query(
      'UPDATE datosadjuntos SET datosadjuntosactivo = 0, datosadjuntosfechaeliminacion = NOW() WHERE iddatosadjuntos = ? AND xdatosadjuntosidcultivosavisos = ?',
      [photoId, cultivosAvisosId]
    );

    // Ajustar principalidad de las fotos restantes si aplica
    const [activePhotos]: any = await pool.query(
      "SELECT iddatosadjuntos, datosadjuntosesprincipal FROM datosadjuntos WHERE xdatosadjuntosidcultivosavisos = ? AND datosadjuntosactivo = 1 AND datosadjuntostipo = 'imagen' ORDER BY datosadjuntosorden ASC, datosadjuntosfechacreacion DESC",
      [cultivosAvisosId]
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

    return NextResponse.json({ success: true, message: 'Foto eliminada correctamente' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT: Actualizar metadatos de una foto (posición, zoom, brillo, contraste, estilo, alt SEO)
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const email = request.headers.get('x-user-email');
  if (!email) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const user = await getUserByEmail(email);
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  const cultivosAvisosId = resolvedParams.id;

  try {
    const body = await request.json();
    const { photoId, action, resumen } = body;

    if (!photoId) return NextResponse.json({ error: 'photoId requerido' }, { status: 400 });
    if (action !== 'updateMeta' && action !== 'setPrincipal') return NextResponse.json({ error: 'Acción no soportada' }, { status: 400 });
    if (action === 'updateMeta' && !resumen) return NextResponse.json({ error: 'resumen requerido' }, { status: 400 });

    // Validar propiedad de la foto
    const [photoRows]: any = await pool.query(
      `SELECT xdatosadjuntosidusuarios, datosadjuntosresumen FROM datosadjuntos WHERE iddatosadjuntos = ? AND datosadjuntosactivo = 1`,
      [photoId]
    );

    if (photoRows.length === 0) {
      return NextResponse.json({ error: 'Foto no encontrada o inactiva' }, { status: 404 });
    }

    const photo = photoRows[0];
    if (photo.xdatosadjuntosidusuarios !== user.id) {
      return NextResponse.json({ error: 'No autorizado para modificar esta foto' }, { status: 403 });
    }

    if (action === 'setPrincipal') {
      if (cultivosAvisosId === 'pending') {
        const { searchParams } = new URL(request.url);
        const idcultivos = searchParams.get('idcultivos');
        if (idcultivos) {
          // It's tricky to clear others because we only want to clear others for THIS specific pending aviso.
          // Since it's a bit complex with JSON logic, we can just clear esPrincipal for all pending of this crop, 
          // or just execute a simpler query. But since photos are grouped by pending_idpauta, we do it in code.
          const [allPending]: any = await pool.query(
            "SELECT iddatosadjuntos, datosadjuntosresumen FROM datosadjuntos WHERE xdatosadjuntosidcultivos = ? AND xdatosadjuntosidcultivosavisos IS NULL AND datosadjuntostipo = 'imagen'",
            [idcultivos]
          );
          
          let targetPauta: number | null = null;
          let targetFecha: string | null = null;
          try {
            const pRes = typeof photo.datosadjuntosresumen === 'string' ? JSON.parse(photo.datosadjuntosresumen) : photo.datosadjuntosresumen;
            targetPauta = pRes.pending_idpauta;
            targetFecha = pRes.pending_fechaEmision;
          } catch(e) {}

          if (targetPauta && targetFecha) {
            for (const row of allPending) {
              try {
                const rRes = typeof row.datosadjuntosresumen === 'string' ? JSON.parse(row.datosadjuntosresumen) : row.datosadjuntosresumen;
                if (rRes && rRes.pending_idpauta === targetPauta && rRes.pending_fechaEmision === targetFecha) {
                  await pool.query("UPDATE datosadjuntos SET datosadjuntosesprincipal = 0 WHERE iddatosadjuntos = ?", [row.iddatosadjuntos]);
                }
              } catch(e) {}
            }
          }
        }
      } else {
        await pool.query(
          "UPDATE datosadjuntos SET datosadjuntosesprincipal = 0 WHERE xdatosadjuntosidcultivosavisos = ? AND datosadjuntostipo = 'imagen'",
          [cultivosAvisosId]
        );
      }
      
      await pool.query(
        "UPDATE datosadjuntos SET datosadjuntosesprincipal = 1 WHERE iddatosadjuntos = ?",
        [photoId]
      );
      return NextResponse.json({ success: true });
    }

    // Fusionar metadatos para preservar datos críticos (ej. pending_idpauta, pending_fechaEmision, etc.)
    let currentMeta: any = {};
    try {
      currentMeta = typeof photo.datosadjuntosresumen === 'string'
        ? JSON.parse(photo.datosadjuntosresumen)
        : (photo.datosadjuntosresumen || {});
    } catch (e) {
      currentMeta = {};
    }

    let inputMeta: any = {};
    try {
      inputMeta = typeof resumen === 'string' ? JSON.parse(resumen) : (resumen || {});
    } catch (e) {
      inputMeta = {};
    }

    const mergedMeta = {
      ...currentMeta,
      ...inputMeta
    };

    const finalResumenStr = JSON.stringify(mergedMeta);

    await pool.query(
      `UPDATE datosadjuntos SET datosadjuntosresumen = ? WHERE iddatosadjuntos = ?`,
      [finalResumenStr, photoId]
    );

    return NextResponse.json({ success: true, resumen: mergedMeta });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

