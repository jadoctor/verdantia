import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

/**
 * GET /api/admin/usuarios
 * Lista paginada de usuarios — solo superadministradores.
 * Query params: page, limit, search, rol, plan, estado
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const rol = searchParams.get('rol') || '';
    const plan = searchParams.get('plan') || '';
    const offset = (page - 1) * limit;

    let where = 'WHERE 1=1';
    const params: any[] = [];

    if (search) {
      where += ' AND (u.usuariosnombre LIKE ? OR u.usuariosemail LIKE ? OR u.usuariosnombreusuario LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (rol) {
      where += ' AND u.usuariosroles LIKE ?';
      params.push(`%${rol}%`);
    }
    if (plan) {
      where += ' AND s.suscripcionesnombre = ?';
      params.push(plan);
    }

    const [rows] = await pool.query(
      `SELECT 
        u.idusuarios AS id,
        u.usuariosnombre AS nombre,
        u.usuariosapellidos AS apellidos,
        u.usuariosnombreusuario AS nombreUsuario,
        u.usuariosemail AS email,
        u.usuariosroles AS roles,
        s.suscripcionesnombre AS suscripcion,
        u.usuariosespruebasuscripcion AS esPrueba,
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
           AND xdatosadjuntosidvariedadesvegetales IS NULL
         ORDER BY datosadjuntosesprincipal DESC, datosadjuntosorden ASC, datosadjuntosfechacreacion DESC 
         LIMIT 1) AS fotoPrincipal,
        (SELECT datosadjuntosvalidado 
         FROM datosadjuntos 
         WHERE xdatosadjuntosidusuarios = u.idusuarios 
           AND datosadjuntostipo = 'imagen' 
           AND datosadjuntosactivo = 1 
           AND (datosadjuntosresultadovalidacion IS NULL OR datosadjuntosresultadovalidacion != 'rechazado')
           AND xdatosadjuntosidvariedadesvegetales IS NULL
         ORDER BY datosadjuntosesprincipal DESC, datosadjuntosorden ASC, datosadjuntosfechacreacion DESC 
         LIMIT 1) AS fotoValidada,
        u.usuariosfechacreacion AS fechaRegistro,
        u.usuariosfechadenacimiento AS fechaNacimiento,
        COALESCE(pa.paisesnombre, d.direccionespais) AS pais,
        COALESCE(p.poblacionesnombre, d.direccionespoblacion) AS poblacion,
        u.usuariosconsentimientofoto AS consentimientoFoto
       FROM usuarios u
       LEFT JOIN usuariossuscripciones us ON u.idusuarios = us.xusuariossuscripcionesidusuarios AND us.usuariossuscripcionesestado = 'activa'
       LEFT JOIN suscripciones s ON us.xusuariossuscripcionesidsuscripciones = s.idsuscripciones
       LEFT JOIN direcciones d ON d.xdireccionesidusuarios = u.idusuarios AND d.direccionestipo = 'personal' AND d.direccionesesprincipal = 1
       LEFT JOIN poblaciones p ON d.xdireccionesidpoblaciones = p.idpoblaciones
       LEFT JOIN provincias pr ON p.xpoblacionesidprovincias = pr.idprovincias
       LEFT JOIN paises pa ON pr.xprovinciasidpaises = pa.idpaises
       ${where}
       ORDER BY u.usuariosfechacreacion DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const [countRows] = await pool.query(
      `SELECT COUNT(DISTINCT u.idusuarios) AS total 
       FROM usuarios u
       LEFT JOIN usuariossuscripciones us ON u.idusuarios = us.xusuariossuscripcionesidusuarios AND us.usuariossuscripcionesestado = 'activa'
       LEFT JOIN suscripciones s ON us.xusuariossuscripcionesidsuscripciones = s.idsuscripciones
       ${where}`,
      params
    );
    const total = (countRows as any[])[0]?.total || 0;

    return NextResponse.json({
      usuarios: rows,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (error: any) {
    console.error('[admin/usuarios GET]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
