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
           AND datosadjuntosvalidado = 1
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
        u.usuariosespruebasuscripcion AS esPrueba
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
      `SELECT nombre_logro, fecha_desbloqueo FROM usuarios_logros WHERE idusuarios = ? ORDER BY fecha_desbloqueo DESC`,
      [id]
    );

    // Fotos
    const [fotos] = await pool.query(
      `SELECT iddatosadjuntos AS id, datosadjuntosruta AS ruta, datosadjuntosesprincipal AS esPrincipal, datosadjuntosresumen AS resumen 
       FROM datosadjuntos 
       WHERE xdatosadjuntosidusuarios = ? AND datosadjuntostipo = 'imagen' AND datosadjuntosactivo = 1 AND xdatosadjuntosidvariedades IS NULL
       ORDER BY datosadjuntosesprincipal DESC`,
      [id]
    );

    return NextResponse.json({ usuario, logros, fotos });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { roles, estado, esPrueba } = body;

    const updates: string[] = [];
    const values: any[] = [];

    if (roles !== undefined) { updates.push('usuariosroles = ?'); values.push(roles); }
    if (estado !== undefined) { updates.push('usuariosestadocuenta = ?'); values.push(estado); }
    if (esPrueba !== undefined) { updates.push('usuariosespruebasuscripcion = ?'); values.push(esPrueba === true || esPrueba === '1' || esPrueba === 1 ? 1 : 0); }

    if (updates.length === 0) return NextResponse.json({ error: 'Nada que actualizar' }, { status: 400 });

    values.push(id);
    await pool.query(`UPDATE usuarios SET ${updates.join(', ')} WHERE idusuarios = ?`, values);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
