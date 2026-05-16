import { NextResponse } from 'next/server';
import pool from '@/lib/db';
// Lazy load: NO importar firebase/storage estáticamente (causa hash corrupto en Turbopack)

/**
 * GET /api/perfil/photos?userId=X
 * Lista las fotos del usuario.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'userId requerido' }, { status: 400 });
  }

  try {
    const [rows] = await pool.query(
      `SELECT da.iddatosadjuntos as id, da.datosadjuntosruta as ruta, 
              da.datosadjuntosesprincipal as esPrincipal, da.datosadjuntosresumen as resumen,
              da.datosadjuntosnombreoriginal as nombreOriginal,
              da.datosadjuntosvalidado as validado,
              da.datosadjuntosresultadovalidacion as resultadoValidacion,
              inc.incidenciasmotivo as motivoRechazo
       FROM datosadjuntos da
       LEFT JOIN incidencias inc ON inc.incidenciasreferenciaid = da.iddatosadjuntos AND inc.incidenciastipo IN ('foto_rechazada', 'foto_sancionada')
       WHERE da.xdatosadjuntosidusuarios = ? 
         AND da.datosadjuntostipo = 'imagen' 
         AND da.datosadjuntosfechaeliminacion IS NULL
         AND (da.datosadjuntosactivo = 1 OR da.datosadjuntosresultadovalidacion = 'rechazado')
       ORDER BY 
         CASE WHEN da.datosadjuntosresultadovalidacion = 'rechazado' THEN 1 ELSE 0 END ASC,
         da.datosadjuntosesprincipal DESC, 
         da.datosadjuntosorden ASC`,
      [userId]
    );
    return NextResponse.json({ photos: rows });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/perfil/photos
 * Sube una nueva foto de perfil a Firebase Storage.
 */
export async function POST(request: Request) {
  try {
    const dataPayload = await request.json();
    const { userId, storagePath, faceX = 50, faceY = 38, faceZoom = 100, nombreOriginal = 'foto.jpg' } = dataPayload;

    if (!userId || !storagePath) {
      return NextResponse.json({ error: 'Faltan datos de la foto' }, { status: 400 });
    }

    // Contar fotos existentes para el orden
    const [countResult] = await pool.query(
      "SELECT COUNT(*) as total FROM datosadjuntos WHERE xdatosadjuntosidusuarios = ? AND datosadjuntostipo = 'imagen' AND datosadjuntosactivo = 1",
      [userId]
    );
    const total = (countResult as any[])[0].total;

    // Si es la primera foto, marcarla como principal
    const esPrimera = total === 0 ? 1 : 0;

    // Insertar en la base de datos (con centrado IA)
    // Guardamos la ruta relativa (uploads/usuario/...) en la DB.
    const fileSize = 0; // We no longer know the exact file size on the server
    const mimeType = nombreOriginal.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
    
    const [result] = await pool.query(
      `INSERT INTO datosadjuntos (
        datosadjuntostipo, datosadjuntosmime, datosadjuntosnombreoriginal,
        datosadjuntosruta, datosadjuntosesprincipal, datosadjuntosorden,
        datosadjuntosactivo, datosadjuntosfechacreacion, xdatosadjuntosidusuarios,
        datosadjuntosresumen, datosadjuntospesobytes, datosadjuntosvalidado
      ) VALUES ('imagen', ?, ?, ?, ?, ?, 1, NOW(), ?, ?, ?, 0)`,
      [
        mimeType, nombreOriginal, storagePath, esPrimera,
        total + 1, userId,
        JSON.stringify({ profile_object_x: faceX, profile_object_y: faceY, profile_object_zoom: faceZoom, profile_style: '' }),
        fileSize
      ]
    );

    return NextResponse.json({
      success: true,
      photo: {
        id: (result as any).insertId,
        ruta: storagePath,
        esPrincipal: esPrimera,
        nombreOriginal: nombreOriginal
      }
    });

  } catch (error: any) {
    console.error('[Photos API] Upload error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * PUT /api/perfil/photos
 * Actualiza una foto (marcar como principal, actualizar metadatos).
 */
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { photoId, userId, action, resumen } = body;
    console.log('[Photos API] PUT recibido:', { photoId, userId, action });

    if (!photoId || !userId) {
      return NextResponse.json({ error: 'photoId y userId requeridos' }, { status: 400 });
    }

    if (action === 'setPrincipal') {
      // Quitar principal de todas las fotos del usuario
      const [r1] = await pool.query(
        "UPDATE datosadjuntos SET datosadjuntosesprincipal = 0 WHERE xdatosadjuntosidusuarios = ? AND datosadjuntostipo = 'imagen'",
        [userId]
      );
      console.log('[Photos API] Reset principal:', (r1 as any).affectedRows, 'filas afectadas');
      // Marcar la nueva como principal
      const [r2] = await pool.query(
        'UPDATE datosadjuntos SET datosadjuntosesprincipal = 1 WHERE iddatosadjuntos = ?',
        [photoId]
      );
      console.log('[Photos API] Set principal photoId=', photoId, ':', (r2 as any).affectedRows, 'filas afectadas');
      return NextResponse.json({ success: true, message: 'Foto preferida actualizada' });
    }

    if (action === 'updateMeta' && resumen) {
      await pool.query(
        'UPDATE datosadjuntos SET datosadjuntosresumen = ? WHERE iddatosadjuntos = ?',
        [typeof resumen === 'string' ? resumen : JSON.stringify(resumen), photoId]
      );
      return NextResponse.json({ success: true, message: 'Metadatos actualizados' });
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/perfil/photos?photoId=X
 * Elimina (soft delete) una foto de perfil.
 */
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const photoId = searchParams.get('photoId');

  if (!photoId) {
    return NextResponse.json({ error: 'photoId requerido' }, { status: 400 });
  }

  try {
    const [rows]: any = await pool.query('SELECT datosadjuntosruta FROM datosadjuntos WHERE iddatosadjuntos = ?', [photoId]);
    const ruta = rows[0]?.datosadjuntosruta;

    await pool.query(
      'UPDATE datosadjuntos SET datosadjuntosactivo = 0, datosadjuntosfechaeliminacion = NOW() WHERE iddatosadjuntos = ?',
      [photoId]
    );

    // Si solo queda 1 foto, hacerla principal automáticamente
    let newPrincipal = null;
    const [userIdRows]: any = await pool.query('SELECT xdatosadjuntosidusuarios as userId FROM datosadjuntos WHERE iddatosadjuntos = ?', [photoId]);
    const userId = userIdRows[0]?.userId;
    if (userId) {
      const [activePhotos]: any = await pool.query(
        "SELECT iddatosadjuntos, datosadjuntosesprincipal, datosadjuntosruta as ruta, datosadjuntosresumen as resumen FROM datosadjuntos WHERE xdatosadjuntosidusuarios = ? AND datosadjuntosactivo = 1 AND datosadjuntostipo = 'imagen' AND xdatosadjuntosidvariedades IS NULL ORDER BY datosadjuntosorden ASC, datosadjuntosfechacreacion DESC",
        [userId]
      );
      if (activePhotos.length > 0) {
        let principalRow = activePhotos.find((p: any) => p.datosadjuntosesprincipal === 1);
        if (!principalRow) {
          await pool.query(
            "UPDATE datosadjuntos SET datosadjuntosesprincipal = 1 WHERE iddatosadjuntos = ?",
            [activePhotos[0].iddatosadjuntos]
          );
          principalRow = activePhotos[0];
        }
        newPrincipal = principalRow;
      }
    }

    return NextResponse.json({ success: true, message: 'Foto eliminada (soft delete)', newPrincipal });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
