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
      where += ' AND (u.usuariosnombre LIKE ? OR u.usuariosemail LIKE ? OR u.usuariosnombredeusuario LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (rol) {
      where += ' AND u.usuariosroles LIKE ?';
      params.push(`%${rol}%`);
    }
    if (plan) {
      where += ' AND u.usuariossuscripcion = ?';
      params.push(plan);
    }

    const [rows] = await pool.query(
      `SELECT 
        u.idusuarios AS id,
        u.usuariosnombre AS nombre,
        u.usuariosapellidos AS apellidos,
        u.usuariosnombredeusuario AS nombreUsuario,
        u.usuariosemail AS email,
        u.usuariosroles AS roles,
        u.usuariossuscripcion AS suscripcion,
        u.usuariosespruebasuscripcion AS esPrueba,
        u.usuariosfechacaducidadsuscripcion AS fechaCaducidad,
        u.usuariosicono AS icono,
        u.usuariosfotoprincipal AS fotoPrincipal,
        u.usuariosestado AS estado,
        u.created_at AS fechaRegistro
       FROM usuarios u
       ${where}
       ORDER BY u.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total FROM usuarios u ${where}`,
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
