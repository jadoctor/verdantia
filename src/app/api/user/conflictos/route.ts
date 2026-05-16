import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getUserByEmail } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json({ error: 'Email requerido' }, { status: 400 });
  }

  try {
    const user = await getUserByEmail(email);
    if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

    const [rows]: any = await pool.query(
      `SELECT 
         da.iddatosadjuntos as id,
         da.datosadjuntosruta as ruta,
         da.datosadjuntosnombreoriginal as nombreOriginal,
         da.xdatosadjuntosidvariedades as variedadId,
         da.xdatosadjuntosidusuarios as ownerId,
         da.datosadjuntosfechacreacion as fechaSubida,
         i.idincidencias as incidenciaId,
         i.incidenciasmotivo as motivoRechazo,
         i.incidenciasestado as estadoIncidencia,
         i.incidenciasnotas as notasIncidencia,
         i.incidenciasfechacreacion as fechaRechazo,
         v.variedadesnombre as variedadNombre,
         e.especiesnombre as especieNombre
       FROM datosadjuntos da
       LEFT JOIN incidencias i ON i.incidenciasreferenciaid = da.iddatosadjuntos AND i.incidenciasreferenciatipo = 'datosadjuntos' AND i.incidenciastipo = 'foto_rechazada'
       LEFT JOIN variedades v ON v.idvariedades = da.xdatosadjuntosidvariedades
       LEFT JOIN especies e ON e.idespecies = v.xvariedadesidespecies
       WHERE da.datosadjuntosresultadovalidacion = 'rechazado'
         AND da.datosadjuntosfechaeliminacion IS NULL
         AND (i.incidenciasestado IS NULL OR i.incidenciasestado != 'apelada')
         AND (da.xdatosadjuntosidusuarios = ? OR v.xvariedadesidusuarios = ?)
       ORDER BY da.datosadjuntosfechacreacion DESC`,
      [user.id, user.id]
    );

    return NextResponse.json({ conflictos: rows });
  } catch (error: any) {
    console.error('Error fetching conflictos:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const photoId = searchParams.get('photoId');
  const email = searchParams.get('email');

  if (!photoId || !email) {
    return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });
  }

  try {
    const user = await getUserByEmail(email);
    if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

    // Verificar propiedad
    const [check]: any = await pool.query(
      `SELECT da.iddatosadjuntos 
       FROM datosadjuntos da
       LEFT JOIN variedades v ON da.xdatosadjuntosidvariedades = v.idvariedades
       WHERE da.iddatosadjuntos = ? 
         AND (da.xdatosadjuntosidusuarios = ? OR v.xvariedadesidusuarios = ?)`,
      [photoId, user.id, user.id]
    );

    if (check.length === 0) {
      return NextResponse.json({ error: 'No tienes permiso para eliminar esta foto' }, { status: 403 });
    }

    // Soft delete
    await pool.query(
      'UPDATE datosadjuntos SET datosadjuntosactivo = 0, datosadjuntosfechaeliminacion = NOW() WHERE iddatosadjuntos = ?',
      [photoId]
    );

    // Si es variedad, recalculamos principal
    const [varRows]: any = await pool.query('SELECT xdatosadjuntosidvariedades as vId FROM datosadjuntos WHERE iddatosadjuntos = ?', [photoId]);
    if (varRows[0]?.vId) {
      await fetch(new URL(`/api/user/plantas/${varRows[0].vId}/photos`, request.url), { method: 'GET' }).catch(() => {});
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting photo:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { email, incidenciaId, motivoRecurso } = await request.json();

    if (!email || !incidenciaId || !motivoRecurso) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });
    }

    const user = await getUserByEmail(email);
    if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

    // Verificar que la incidencia pertenece a una foto de este usuario
    const [check]: any = await pool.query(`
      SELECT i.idincidencias 
      FROM incidencias i
      JOIN datosadjuntos da ON i.incidenciasreferenciaid = da.iddatosadjuntos
      LEFT JOIN variedades v ON da.xdatosadjuntosidvariedades = v.idvariedades
      WHERE i.idincidencias = ? 
        AND i.incidenciasreferenciatipo = 'datosadjuntos'
        AND (da.xdatosadjuntosidusuarios = ? OR v.xvariedadesidusuarios = ?)
    `, [incidenciaId, user.id, user.id]);

    if (check.length === 0) {
      return NextResponse.json({ error: 'No tienes permiso para recurrir esta incidencia' }, { status: 403 });
    }

    // Actualizar la incidencia
    const notasAdicionales = `\n--- RECURSO DEL USUARIO (${new Date().toISOString().split('T')[0]}) ---\n${motivoRecurso}`;
    
    await pool.query(`
      UPDATE incidencias 
      SET incidenciasestado = 'apelada',
          incidenciasnotas = CONCAT(COALESCE(incidenciasnotas, ''), ?)
      WHERE idincidencias = ?
    `, [notasAdicionales, incidenciaId]);

    // Opcional: Podríamos enviar un email a los admins notificando el recurso.

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error recurriendo incidencia:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
