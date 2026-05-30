import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

/**
 * GET /api/admin/usuarios/[id] — Perfil completo de un usuario
 * PATCH /api/admin/usuarios/[id] — Modificar rol, plan o estado
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const [rows] = await pool.query(
      `SELECT 
        u.idusuarios AS id,
        u.usuariosnombre AS nombre,
        u.usuariosapellidos AS apellidos,
        u.usuariosnombreusuario AS nombreUsuario,
        u.usuariosemail AS email,
        u.usuariosroles AS roles,
        s.suscripcionesnombre AS suscripcion,
        us.usuariossuscripcionesorigen AS suscripcionOrigen,
        u.usuariosactivo AS activo,
        u.usuariosestadocuenta AS estadoCuenta,
        u.usuariossuspensionfin AS suspensionfin,
        u.usuariosemailverificado AS emailVerificado,
        u.usuariosicono AS icono,
        (SELECT datosadjuntosruta 
         FROM datosadjuntos 
         WHERE xdatosadjuntosidusuarios = u.idusuarios 
           AND datosadjuntostipo = 'imagen' 
           AND datosadjuntosactivo = 1 
           AND (datosadjuntosresultadovalidacion IS NULL OR datosadjuntosresultadovalidacion != 'rechazado')
           AND xdatosadjuntosidvariedades IS NULL
         ORDER BY datosadjuntosesprincipal DESC, datosadjuntosorden ASC, datosadjuntosfechacreacion DESC 
         LIMIT 1) AS fotoPrincipal,
        u.usuarioscodigopostal AS codigoPostal,
        u.usuariospoblacion AS poblacion,
        u.usuariospais AS pais,
        u.usuariosfechadenacimiento AS fechaNacimiento,
        u.usuariosfechacreacion AS fechaRegistro,
        u.usuariosconsentimientofoto AS consentimientoFoto,
        u.usuariosespruebasuscripcion AS esPrueba,
        u.usuariostipocalendario AS tipoCalendario,
        u.usuariostipolaboreo AS tipoLaboreo,
        u.usuarioscamacultivobilateral AS camaCultivoBilateral,
        u.usuarioscamacultivounilateral AS camaCultivoUnilateral,
        u.usuariospasillo AS pasillo
       FROM usuarios u
       LEFT JOIN usuariossuscripciones us ON u.idusuarios = us.xusuariossuscripcionesidusuarios AND us.usuariossuscripcionesestado = 'activa'
       LEFT JOIN suscripciones s ON us.xusuariossuscripcionesidsuscripciones = s.idsuscripciones
       WHERE u.idusuarios = ?
       LIMIT 1`,
      [id]
    );

    const usuario = (rows as any[])[0];
    if (!usuario) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

    // Logros
    const [logros] = await pool.query(
      `SELECT l.logrosnombre as nombre_logro, u.usuarioslogrosfechainicio as fecha_desbloqueo, u.usuarioslogrosfechafin as fecha_fin 
       FROM usuarioslogros u
       JOIN logros l ON u.xusuarioslogrosidlogros = l.idlogros
       WHERE u.xusuarioslogrosidusuarios = ? 
       ORDER BY u.usuarioslogrosfechainicio DESC`,
      [id]
    );

    // Fotos
    const [fotos] = await pool.query(
      `SELECT iddatosadjuntos AS id, datosadjuntosruta AS ruta, datosadjuntosesprincipal AS esPrincipal, datosadjuntosresumen AS resumen, datosadjuntosvalidado AS validado, datosadjuntosresultadovalidacion AS resultado 
       FROM datosadjuntos 
       WHERE xdatosadjuntosidusuarios = ? AND datosadjuntostipo = 'imagen' AND datosadjuntosactivo = 1 AND xdatosadjuntosidvariedades IS NULL
       ORDER BY datosadjuntosesprincipal DESC`,
      [id]
    );

    // Historial Suscripciones
    const [historialSuscripciones] = await pool.query(
      `SELECT 
        us.idusuariossuscripciones AS id,
        s.suscripcionesnombre AS plan,
        us.usuariossuscripcionesfechainicio AS fechaInicio,
        us.usuariossuscripcionesfechafin AS fechaFin,
        us.usuariossuscripcionesestado AS estado,
        us.usuariossuscripcionesorigen AS origen
       FROM usuariossuscripciones us
       JOIN suscripciones s ON us.xusuariossuscripcionesidsuscripciones = s.idsuscripciones
       WHERE us.xusuariossuscripcionesidusuarios = ?
       ORDER BY us.usuariossuscripcionesfechainicio DESC`,
      [id]
    );

    return NextResponse.json({ usuario, logros, fotos, historialSuscripciones });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { roles, estado, esPrueba, emailVerificado, tipoCalendario, tipoLaboreo, camaCultivoBilateral, camaCultivoUnilateral, pasillo } = body;

    const updates: string[] = [];
    const values: any[] = [];

    if (roles !== undefined) { updates.push('usuariosroles = ?'); values.push(roles); }
    if (estado !== undefined) { updates.push('usuariosestadocuenta = ?'); values.push(estado); }
    if (esPrueba !== undefined) { updates.push('usuariosespruebasuscripcion = ?'); values.push(esPrueba === true || esPrueba === '1' || esPrueba === 1 ? 1 : 0); }
    if (emailVerificado !== undefined) { updates.push('usuariosemailverificado = ?'); values.push(emailVerificado === true || emailVerificado === '1' || emailVerificado === 1 ? 1 : 0); }
    
    if (tipoCalendario !== undefined) {
      if (!['Normal', 'Lunar', 'Biodinámico'].includes(tipoCalendario)) {
        return NextResponse.json({ error: 'Tipo de calendario no válido' }, { status: 400 });
      }
      updates.push('usuariostipocalendario = ?');
      values.push(tipoCalendario);
    }

    if (tipoLaboreo !== undefined) {
      if (!['Convencional', 'Mínimo', 'No laboreo'].includes(tipoLaboreo)) {
        return NextResponse.json({ error: 'Tipo de laboreo no válido' }, { status: 400 });
      }
      updates.push('usuariostipolaboreo = ?');
      values.push(tipoLaboreo);
    }

    if (camaCultivoBilateral !== undefined) {
      const val = parseFloat(camaCultivoBilateral);
      if (isNaN(val) || val <= 0) {
        return NextResponse.json({ error: 'La anchura de la cama de cultivo bilateral debe ser un número válido mayor que 0.' }, { status: 400 });
      }
      updates.push('usuarioscamacultivobilateral = ?');
      values.push(val);
    }

    if (camaCultivoUnilateral !== undefined) {
      const val = parseFloat(camaCultivoUnilateral);
      if (isNaN(val) || val <= 0) {
        return NextResponse.json({ error: 'La anchura de la cama de cultivo unilateral debe ser un número válido mayor que 0.' }, { status: 400 });
      }
      updates.push('usuarioscamacultivounilateral = ?');
      values.push(val);
    }

    if (pasillo !== undefined) {
      const val = parseFloat(pasillo);
      if (isNaN(val) || val <= 0) {
        return NextResponse.json({ error: 'El ancho del pasillo debe ser un número válido mayor que 0.' }, { status: 400 });
      }
      updates.push('usuariospasillo = ?');
      values.push(val);
    }

    if (updates.length === 0) return NextResponse.json({ error: 'Nada que actualizar' }, { status: 400 });

    values.push(id);
    await pool.query(`UPDATE usuarios SET ${updates.join(', ')} WHERE idusuarios = ?`, values);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
