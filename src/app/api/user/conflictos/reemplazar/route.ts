import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const oldId = formData.get('oldId');
    const file = formData.get('file') as File;
    const userEmail = formData.get('userEmail');

    if (!oldId || !file || !userEmail) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
    }

    // 1. Obtener datos del antiguo adjunto
    const [rows]: any = await pool.query('SELECT * FROM datosadjuntos WHERE iddatosadjuntos = ? AND datosadjuntosfechaeliminacion IS NULL', [oldId]);
    if (!rows.length) {
      return NextResponse.json({ error: 'Foto original no encontrada' }, { status: 404 });
    }
    const oldAdjunto = rows[0];

    // 2. Guardar el nuevo archivo
    const bytes = await file.arrayBuffer();
    let processedBuffer = Buffer.from(bytes);
    const timestamp = Date.now();
    let extension = file.name.split('.').pop() || 'jpg';
    let mimeType = file.type || 'image/jpeg';
    
    const isProfilePhoto = oldAdjunto.xdatosadjuntosidusuarios && 
      !oldAdjunto.xdatosadjuntosidespecies && 
      !oldAdjunto.xdatosadjuntosidvariedades && 
      !oldAdjunto.xdatosadjuntosidplagas && 
      !oldAdjunto.xdatosadjuntosidlabores &&
      !oldAdjunto.xdatosadjuntosidplantaciones;

    let jsonResumen = oldAdjunto.datosadjuntosresumen;

    if (isProfilePhoto) {
      try {
        const sharp = eval(`require('sharp')`);
        // Aplicar fondo blanco y convertir a JPEG
        processedBuffer = await sharp(processedBuffer)
          .flatten({ background: '#FFFFFF' })
          .jpeg({ quality: 90 })
          .toBuffer();
        
        extension = 'jpg';
        mimeType = 'image/jpeg';
        
        // Centrado automático por defecto (similar al fallback de la IA)
        jsonResumen = JSON.stringify({ profile_object_x: 50, profile_object_y: 38, profile_object_zoom: 100, profile_style: '' });
      } catch (e) {
        console.error("Error procesando foto con sharp:", e);
      }
    }

    // Extraer carpeta de destino de la ruta antigua (ej: "uploads/usuario/..." -> "uploads/usuario")
    const dirMatch = oldAdjunto.datosadjuntosruta.match(/^(uploads\/[^\/]+)\//);
    const directory = dirMatch ? dirMatch[1] : 'uploads/reemplazos';
    const filename = `reemplazo_${timestamp}.${extension}`;
    const newPath = `${directory}/${filename}`;
    
    // Guardar en Firebase Storage (Verdantia system)
    const { uploadToStorage } = await import('@/lib/firebase/storage');
    await uploadToStorage(processedBuffer, newPath, mimeType);

    // Contar si quedan otras fotos activas para asignar "esPrincipal"
    let entityWhere = '';
    let entityId = null;
    if (isProfilePhoto) {
      entityWhere = 'xdatosadjuntosidusuarios = ? AND xdatosadjuntosidespecies IS NULL AND xdatosadjuntosidvariedades IS NULL AND xdatosadjuntosidplagas IS NULL';
      entityId = oldAdjunto.xdatosadjuntosidusuarios;
    } else if (oldAdjunto.xdatosadjuntosidespecies) {
      entityWhere = 'xdatosadjuntosidespecies = ?'; entityId = oldAdjunto.xdatosadjuntosidespecies;
    } else if (oldAdjunto.xdatosadjuntosidvariedades) {
      entityWhere = 'xdatosadjuntosidvariedades = ?'; entityId = oldAdjunto.xdatosadjuntosidvariedades;
    } else if (oldAdjunto.xdatosadjuntosidplagas) {
      entityWhere = 'xdatosadjuntosidplagas = ?'; entityId = oldAdjunto.xdatosadjuntosidplagas;
    } else if (oldAdjunto.xdatosadjuntosidlabores) {
      entityWhere = 'xdatosadjuntosidlabores = ?'; entityId = oldAdjunto.xdatosadjuntosidlabores;
    } else if (oldAdjunto.xdatosadjuntosidplantaciones) {
      entityWhere = 'xdatosadjuntosidplantaciones = ?'; entityId = oldAdjunto.xdatosadjuntosidplantaciones;
    }

    let isPrincipal = oldAdjunto.datosadjuntosesprincipal;
    if (entityId) {
      const [cRows]: any = await pool.query(`SELECT COUNT(*) as c FROM datosadjuntos WHERE ${entityWhere} AND datosadjuntosactivo = 1 AND datosadjuntosfechaeliminacion IS NULL AND iddatosadjuntos != ?`, [entityId, oldId]);
      if (cRows[0].c === 0) {
        isPrincipal = 1; // Es la única, se convierte en principal
      }
    }

    // 3. Insertar nuevo registro clonando las claves foráneas y marcando como pendiente de revisión (validado=0)
    await pool.query(`
      INSERT INTO datosadjuntos (
        datosadjuntostipo, datosadjuntosmime, datosadjuntosnombreoriginal, datosadjuntosruta, 
        datosadjuntospesobytes, datosadjuntosactivo, datosadjuntosresumen,
        xdatosadjuntosidespecies, xdatosadjuntosidvariedades, xdatosadjuntosidplagas,
        xdatosadjuntosidlabores, xdatosadjuntosidusuarios, xdatosadjuntosidplantaciones,
        xdatosadjuntosidsemillas, xdatosadjuntosidrecolecciones,
        datosadjuntosesprincipal, datosadjuntosorden, datosadjuntosvalidado, datosadjuntosresultadovalidacion
      ) VALUES ('imagen', ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NULL)
    `, [
      mimeType, file.name, newPath,
      processedBuffer.length, jsonResumen,
      oldAdjunto.xdatosadjuntosidespecies, oldAdjunto.xdatosadjuntosidvariedades, oldAdjunto.xdatosadjuntosidplagas,
      oldAdjunto.xdatosadjuntosidlabores, oldAdjunto.xdatosadjuntosidusuarios, 
      oldAdjunto.xdatosadjuntosidplantaciones, oldAdjunto.xdatosadjuntosidsemillas, oldAdjunto.xdatosadjuntosidrecolecciones,
      isPrincipal, oldAdjunto.datosadjuntosorden
    ]);

    // 4. Marcar la foto antigua como eliminada
    await pool.query('UPDATE datosadjuntos SET datosadjuntosfechaeliminacion = NOW() WHERE iddatosadjuntos = ?', [oldId]);

    // 5. Marcar la incidencia como resuelta para que desaparezca
    await pool.query(`
      UPDATE incidencias 
      SET incidenciasestado = 'resuelta', incidenciasnotas = CONCAT(IFNULL(incidenciasnotas, ''), '\n\n--- FOTO REEMPLAZADA POR EL USUARIO ---')
      WHERE incidenciasreferenciaid = ? AND incidenciasreferenciatipo = 'datosadjuntos'
    `, [oldId]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error reemplazando foto:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
