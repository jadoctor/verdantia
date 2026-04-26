import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, nombre, apellidos } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email requerido' }, { status: 400 });
    }

    // Verificar si el usuario ya existe en Cloud SQL
    const [existing] = await pool.query(
      'SELECT idusuarios FROM usuarios WHERE usuariosemail = ? LIMIT 1',
      [email]
    );

    const rows = existing as any[];

    if (rows.length > 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'El usuario ya existía en la base de datos.', 
        userId: rows[0].idusuarios 
      });
    }

    // Todo usuario nuevo entra SIEMPRE como visitante, sin plan.
    // El rol 'usuario' (Campesino Aprendiz) se adquiere al verificar el email.
    const [result] = await pool.query(
      `INSERT INTO usuarios (
        usuariosemail, 
        usuariosnombre, 
        usuariosapellidos, 
        usuariosroles, 
        usuarioscontrasena, 
        usuariosestadocuenta,
        usuariosnombreusuario
      ) VALUES (?, ?, ?, 'visitante', 'firebase_auth', 'activa', ?)`,
      [
        email, 
        nombre || '', 
        apellidos || '', 
        nombre || email.split('@')[0] // nombreUsuario por defecto
      ]
    );

    const insertResult = result as any;

    return NextResponse.json({
      success: true,
      message: 'Perfil creado correctamente.',
      userId: insertResult.insertId
    });

  } catch (error: any) {
    console.error('Error en /api/auth/register:', error);
    return NextResponse.json({
      error: 'Error de base de datos al crear perfil',
      details: error.message
    }, { status: 500 });
  }
}
