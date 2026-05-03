import { NextResponse } from 'next/server';
// Lazy load: NO importar firebase/admin estáticamente (causa hash corrupto en Turbopack)
import pool from '@/lib/db';

/**
 * PUT /api/auth/update-email
 * Actualiza el email del usuario en Firebase Auth y en Cloud SQL.
 * Solo se permite si el email actual NO está verificado.
 */
export async function PUT(request: Request) {
  try {
    const { currentEmail, newEmail } = await request.json();

    if (!currentEmail || !newEmail) {
      return NextResponse.json({ error: 'Email actual y nuevo son requeridos' }, { status: 400 });
    }

    if (currentEmail === newEmail) {
      return NextResponse.json({ success: true, message: 'El email no ha cambiado' });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      return NextResponse.json({ error: 'El formato del nuevo email no es válido' }, { status: 400 });
    }

    // 1. Verificar que el email actual NO está verificado en Firebase
    const { adminAuth } = await import('@/lib/firebase/admin');
    let firebaseUser;
    try {
      firebaseUser = await adminAuth.getUserByEmail(currentEmail);
    } catch {
      return NextResponse.json({ error: 'Usuario no encontrado en Firebase' }, { status: 404 });
    }

    if (firebaseUser.emailVerified) {
      return NextResponse.json({ error: 'No se puede cambiar un email ya verificado' }, { status: 403 });
    }

    // 2. Verificar que el nuevo email no está en uso
    try {
      await adminAuth.getUserByEmail(newEmail);
      return NextResponse.json({ error: 'Ese correo ya está registrado en otra cuenta' }, { status: 409 });
    } catch {
      // OK: el email no existe, podemos usarlo
    }

    // 3. Actualizar en Firebase Auth
    await adminAuth.updateUser(firebaseUser.uid, { email: newEmail });

    // 4. Actualizar en Cloud SQL
    await pool.query(
      'UPDATE usuarios SET usuariosemail = ? WHERE usuariosemail = ?',
      [newEmail, currentEmail]
    );

    return NextResponse.json({ success: true, message: 'Email actualizado correctamente' });

  } catch (error: any) {
    console.error('[update-email API] Error:', error);
    return NextResponse.json(
      { error: 'Error al actualizar email', details: error.message },
      { status: 500 }
    );
  }
}
