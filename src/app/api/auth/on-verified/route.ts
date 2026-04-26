import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import pool from '@/lib/db';

/**
 * POST /api/auth/on-verified
 * Se llama tras verificar el email. Asigna:
 * - Rol "usuario" (Campesino Aprendiz)
 * - Logro "Campesino Aprendiz"
 * - Suscripción Premium de prueba (60 días)
 */
export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email requerido' }, { status: 400 });
    }

    // 1. Verificar con Firebase Admin que el email está realmente verificado
    let firebaseUser;
    try {
      firebaseUser = await adminAuth.getUserByEmail(email);
    } catch {
      return NextResponse.json({ error: 'Usuario no encontrado en Firebase' }, { status: 404 });
    }

    if (!firebaseUser.emailVerified) {
      return NextResponse.json({ error: 'El email no está verificado en Firebase' }, { status: 403 });
    }

    // 2. Obtener el usuario de Cloud SQL
    const [rows] = await pool.query(
      'SELECT idusuarios, usuariosroles FROM usuarios WHERE usuariosemail = ? LIMIT 1',
      [email]
    );
    const user = (rows as any[])[0];

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado en la base de datos' }, { status: 404 });
    }

    // Solo proceder si el usuario es visitante (evitar dobles ejecuciones)
    if (user.usuariosroles !== 'visitante') {
      return NextResponse.json({ 
        success: true, 
        message: 'El usuario ya tiene rol superior a visitante.',
        alreadyUpgraded: true
      });
    }

    const userId = user.idusuarios;

    // 3. Subir rol: visitante → usuario
    await pool.query(
      'UPDATE usuarios SET usuariosroles = ? WHERE idusuarios = ?',
      ['usuario', userId]
    );

    // 4. Registrar logro "Campesino Aprendiz"
    await pool.query(
      'INSERT IGNORE INTO usuarios_logros (idusuarios, nombre_logro) VALUES (?, ?)',
      [userId, 'Campesino Aprendiz']
    );

    // 5. Crear suscripción Premium de prueba (60 días)
    // Primero obtener el ID de la suscripción Premium
    const [subRows] = await pool.query(
      "SELECT idsuscripciones FROM suscripciones WHERE suscripcionesnombre = 'Premium' LIMIT 1"
    );
    const premiumPlan = (subRows as any[])[0];

    if (premiumPlan) {
      // Verificar que no tenga ya una suscripción activa
      const [existingSub] = await pool.query(
        `SELECT idusuariossuscripciones FROM usuariossuscripciones 
         WHERE xusuariossuscripcionesidusuarios = ? 
         AND usuariossuscripcionesestado IN ('activa','degradacion_fase1','degradacion_fase2','degradacion_fase3')
         LIMIT 1`,
        [userId]
      );

      if ((existingSub as any[]).length === 0) {
        const fechaInicio = new Date();
        const fechaFin = new Date();
        fechaFin.setDate(fechaFin.getDate() + 60); // 60 días de prueba

        await pool.query(
          `INSERT INTO usuariossuscripciones (
            xusuariossuscripcionesidusuarios, 
            xusuariossuscripcionesidsuscripciones, 
            usuariossuscripcionesfechainicio, 
            usuariossuscripcionesfechafin, 
            usuariossuscripcionesestado
          ) VALUES (?, ?, ?, ?, 'activa')`,
          [userId, premiumPlan.idsuscripciones, fechaInicio, fechaFin]
        );
      }
    }

    // 6. Comprobar si es menor de edad para devolver la limitación
    let isUnderageLimitation = false;
    const [userDataRows] = await pool.query(
      'SELECT usuariosfechadenacimiento FROM usuarios WHERE idusuarios = ?',
      [userId]
    );
    const userData = (userDataRows as any[])[0];
    if (userData?.usuariosfechadenacimiento) {
      const birthDate = new Date(userData.usuariosfechadenacimiento);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      if (age >= 16 && age < 18) {
        isUnderageLimitation = true;
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Usuario verificado y actualizado correctamente.',
      unlockedAchievement: 'Campesino Aprendiz',
      isUnderageLimitation
    });

  } catch (error: any) {
    console.error('[on-verified API] Error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    );
  }
}
