import { NextResponse } from 'next/server';
import pool from '@/lib/db';

/**
 * PUT /api/perfil — Actualiza los datos del perfil en Cloud SQL.
 */
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { email, nombre, apellidos, nombreUsuario, fechaNacimiento, pais, codigoPostal, poblacion, icono } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email requerido' }, { status: 400 });
    }

    const fields: string[] = [];
    const values: any[] = [];

    if (nombre !== undefined) { fields.push('usuariosnombre = ?'); values.push(nombre); }
    if (apellidos !== undefined) { fields.push('usuariosapellidos = ?'); values.push(apellidos); }
    if (nombreUsuario !== undefined) { fields.push('usuariosnombreusuario = ?'); values.push(nombreUsuario); }
    if (fechaNacimiento !== undefined) { fields.push('usuariosfechadenacimiento = ?'); values.push(fechaNacimiento || null); }
    if (pais !== undefined) { fields.push('usuariospais = ?'); values.push(pais); }
    if (codigoPostal !== undefined) { fields.push('usuarioscodigopostal = ?'); values.push(codigoPostal); }
    if (poblacion !== undefined) { fields.push('usuariospoblacion = ?'); values.push(poblacion); }
    if (icono !== undefined) { fields.push('usuariosicono = ?'); values.push(icono || null); }

    if (fields.length === 0) {
      return NextResponse.json({ error: 'No hay campos para actualizar' }, { status: 400 });
    }

    values.push(email);

    await pool.query(
      `UPDATE usuarios SET ${fields.join(', ')} WHERE usuariosemail = ?`,
      values
    );

    return NextResponse.json({ success: true, message: 'Perfil actualizado correctamente' });

  } catch (error: any) {
    console.error('[Perfil API] Error:', error);
    return NextResponse.json({ error: 'Error de base de datos', details: error.message }, { status: 500 });
  }
}
