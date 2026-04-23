import { NextResponse } from 'next/server';
import pool from '@/lib/db';

/**
 * GET /api/setup-admin?email=xxx
 * 
 * Endpoint de configuración inicial (solo usar UNA VEZ).
 * Crea un registro de superadministrador en la tabla usuarios de Cloud SQL
 * vinculado al email de Firebase Auth.
 * 
 * Si el email ya existe, simplemente le asigna el rol de superadministrador.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json({ error: 'Parámetro email requerido. Uso: /api/setup-admin?email=tu@email.com' }, { status: 400 });
  }

  try {
    // Verificar si ya existe el usuario
    const [existing] = await pool.query(
      'SELECT idusuarios, usuariosroles FROM usuarios WHERE usuariosemail = ? LIMIT 1',
      [email]
    );

    const rows = existing as any[];

    if (rows.length > 0) {
      // Ya existe: actualizar su rol a superadministrador
      await pool.query(
        "UPDATE usuarios SET usuariosroles = 'superadministrador' WHERE idusuarios = ?",
        [rows[0].idusuarios]
      );

      return NextResponse.json({
        success: true,
        message: `Usuario existente (ID: ${rows[0].idusuarios}) actualizado a superadministrador.`,
        action: 'updated'
      });
    }

    // No existe: crear nuevo usuario superadministrador
    const [result] = await pool.query(
      `INSERT INTO usuarios (
        usuariosemail, 
        usuariosnombre, 
        usuariosapellidos, 
        usuariosroles, 
        usuarioscontrasena, 
        usuariosestadocuenta,
        usuariosnombreusuario
      ) VALUES (?, ?, ?, 'superadministrador', 'firebase_auth', 'activa', ?)`,
      [email, 'Jaime', 'Admin', 'SuperAdmin']
    );

    const insertResult = result as any;

    return NextResponse.json({
      success: true,
      message: `Superadministrador creado con ID: ${insertResult.insertId}`,
      action: 'created',
      userId: insertResult.insertId
    });

  } catch (error: any) {
    return NextResponse.json({
      error: 'Error de base de datos',
      details: error.message
    }, { status: 500 });
  }
}
