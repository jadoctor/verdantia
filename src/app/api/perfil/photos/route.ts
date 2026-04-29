import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { uploadToStorage } from '@/lib/firebase/storage';

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
      `SELECT iddatosadjuntos as id, datosadjuntosruta as ruta, 
              datosadjuntosesprincipal as esPrincipal, datosadjuntosresumen as resumen,
              datosadjuntosnombreoriginal as nombreOriginal
       FROM datosadjuntos 
       WHERE xdatosadjuntosidusuarios = ? AND datosadjuntostipo = 'imagen' AND datosadjuntosactivo = 1 
       ORDER BY datosadjuntosesprincipal DESC, datosadjuntosorden ASC`,
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
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;
    const faceX = Number(formData.get('faceX')) || 50;
    const faceY = Number(formData.get('faceY')) || 38;
    const faceZoom = Number(formData.get('faceZoom')) || 100;

    if (!file || !userId) {
      return NextResponse.json({ error: 'Archivo y userId requeridos' }, { status: 400 });
    }

    // Generar nombre único
    const ext = (file.name.match(/\.\w+$/) || ['.jpg'])[0];
    const filename = `usuario_${userId}_${Date.now()}${ext}`;
    const storagePath = `uploads/usuario/${filename}`;

    // Subir a Firebase Storage
    const bytes = await file.arrayBuffer();
    const publicUrl = await uploadToStorage(
      Buffer.from(bytes),
      storagePath,
      file.type || 'image/jpeg'
    );

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
    // getMediaUrl() la convertirá a /api/media?path=... al renderizar.
    const fileSize = bytes.byteLength;
    const [result] = await pool.query(
      `INSERT INTO datosadjuntos (
        datosadjuntostipo, datosadjuntosmime, datosadjuntosnombreoriginal,
        datosadjuntosruta, datosadjuntosesprincipal, datosadjuntosorden,
        datosadjuntosactivo, datosadjuntosfechacreacion, xdatosadjuntosidusuarios,
        datosadjuntosresumen, datosadjuntospesobytes
      ) VALUES ('imagen', ?, ?, ?, ?, ?, 1, NOW(), ?, ?, ?)`,
      [
        file.type || 'image/jpeg', file.name, storagePath, esPrimera,
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
        nombreOriginal: file.name
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
    await pool.query(
      'UPDATE datosadjuntos SET datosadjuntosactivo = 0, datosadjuntosfechaeliminacion = NOW() WHERE iddatosadjuntos = ?',
      [photoId]
    );
    return NextResponse.json({ success: true, message: 'Foto eliminada' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
