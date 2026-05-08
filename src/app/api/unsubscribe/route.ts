import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import crypto from 'crypto';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');
  const hash = searchParams.get('hash');
  const avisoId = searchParams.get('avisoId');

  if (!email || !hash || !avisoId) {
    return new NextResponse('Faltan parámetros en el enlace.', { status: 400 });
  }

  const secret = process.env.NEXTAUTH_SECRET || 'verdantia_secret_salt_123';
  const expectedHash = crypto.createHmac('sha256', secret).update(email).digest('hex');

  if (hash !== expectedHash) {
    return new NextResponse('Enlace de desuscripción inválido o caducado.', { status: 403 });
  }

  try {
    const [userRows] = await pool.query<any>(`
      SELECT u.idusuarios, u.usuariosestadocuenta, 
             COALESCE(
               (SELECT s.suscripcionesnombre 
                FROM usuariossuscripciones us
                JOIN suscripciones s ON s.idsuscripciones = us.xusuariossuscripcionesidsuscripciones
                WHERE us.xusuariossuscripcionesidusuarios = u.idusuarios
                  AND us.usuariossuscripcionesestado IN ('activa','degradacion_fase1','degradacion_fase2','degradacion_fase3')
                ORDER BY us.idusuariossuscripciones DESC
                LIMIT 1), 'Gratuito'
             ) as suscripcion
      FROM usuarios u 
      WHERE u.usuariosemail = ?
    `, [email]);

    if (userRows.length === 0) {
      return new NextResponse('Usuario no encontrado.', { status: 404 });
    }

    const user = userRows[0];

    // Si ya está inactiva
    if (user.usuariosestadocuenta === 'inactiva' || user.usuariosestadocuenta === 'pausada') {
      return new NextResponse(`
        <!DOCTYPE html>
        <html lang="es">
        <head><meta charset="utf-8"><title>Cuenta en Hibernación | Verdantia</title><style>body { font-family: system-ui, sans-serif; background: #f8fafc; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; padding: 20px; text-align: center; } .card { background: white; padding: 40px; border-radius: 16px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); max-width: 450px; border-top: 6px solid #64748b; } a { display: inline-block; background: #10b981; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; margin-top: 15px; }</style></head>
        <body>
          <div class="card">
            <div style="font-size: 54px; margin-bottom: 20px;">💤</div>
            <h1 style="margin:0 0 10px; color:#0f172a;">Tu cuenta ya está pausada</h1>
            <p style="color:#475569; line-height:1.6;">No te preocupes, ya no recibirás notificaciones porque tu cuenta está en Modo Hibernación.</p>
            <a href="/login">Ir a Verdantia</a>
          </div>
        </body>
        </html>
      `, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    }

    const planGratuito = user.suscripcion.toLowerCase() === 'gratuito' || user.suscripcion.toLowerCase() === 'básica';

    if (planGratuito) {
      // Mostrar advertencia de Hibernación
      return new NextResponse(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Darse de baja | Verdantia</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; background: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
            .card { background: white; padding: 40px; border-radius: 16px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); text-align: center; max-width: 450px; width: 100%; border-top: 6px solid #f59e0b; }
            .icon { font-size: 54px; margin-bottom: 20px; }
            h1 { color: #0f172a; font-size: 26px; margin-top: 0; margin-bottom: 12px; }
            p { color: #475569; line-height: 1.6; margin-bottom: 24px; font-size: 1.05rem; }
            .btn-danger { display: inline-block; background: #ef4444; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; border: none; cursor: pointer; width: 100%; font-size: 16px; margin-bottom: 12px; }
            .btn-secondary { display: inline-block; background: #f1f5f9; color: #334155; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; transition: all 0.2s; border: 1px solid #cbd5e1; width: 100%; box-sizing: border-box; }
            .btn-secondary:hover { background: #e2e8f0; color: #0f172a; }
            .premium-box { background: #f0fdf4; border: 1px solid #10b981; padding: 15px; border-radius: 8px; margin-bottom: 24px; text-align: left; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="icon">⚠️</div>
            <h1>Modo Hibernación</h1>
            <p>Al ser usuario del <strong>Plan Gratuito</strong>, el Boletín es obligatorio. Si deseas dejar de recibir nuestras notificaciones, tu cuenta pasará a modo inactivo.</p>
            
            <div class="premium-box">
              <strong style="color:#065f46; display:block; margin-bottom:5px;">💡 ¿Quieres conservar tu cuenta?</strong>
              <span style="color:#047857; font-size: 0.9rem;">Mejora al Plan Esencial y obtén control total sobre qué correos deseas recibir sin perder el acceso a la app.</span>
            </div>

            <form method="POST" action="/api/unsubscribe">
              <input type="hidden" name="email" value="${email}">
              <input type="hidden" name="hash" value="${hash}">
              <input type="hidden" name="avisoId" value="${avisoId}">
              <input type="hidden" name="actionType" value="pause">
              <button type="submit" class="btn-danger">Pausar mi cuenta</button>
            </form>
            <a href="/login?callbackUrl=/dashboard/perfil" class="btn-secondary">Volver a mi perfil</a>
          </div>
        </body>
        </html>
      `, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    } else {
      // Es usuario de PAGO. Darse de baja directo.
      await pool.query(`
        INSERT INTO usuariosavisos (xusuariosavisosidusuarios, xusuariosavisosidtiposavisos, usuariosavisosactivo)
        VALUES (?, ?, 0)
        ON DUPLICATE KEY UPDATE usuariosavisosactivo = 0
      `, [user.idusuarios, avisoId]);

      return new NextResponse(`
        <!DOCTYPE html>
        <html lang="es">
        <head><meta charset="utf-8"><title>Baja exitosa | Verdantia</title><style>body { font-family: system-ui, sans-serif; background: #f8fafc; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; padding: 20px; text-align: center; } .card { background: white; padding: 40px; border-radius: 16px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); max-width: 450px; border-top: 6px solid #10b981; } a { display: inline-block; background: #f1f5f9; color: #334155; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; margin-top: 15px; }</style></head>
        <body>
          <div class="card">
            <div style="font-size: 54px; margin-bottom: 20px;">✅</div>
            <h1 style="margin:0 0 10px; color:#0f172a;">¡Te has dado de baja!</h1>
            <p style="color:#475569; line-height:1.6;">Como usuario Premium, tus preferencias han sido actualizadas. Ya no recibirás correos de este boletín.</p>
            <a href="/login?callbackUrl=/dashboard/perfil%23comunicaciones">Volver a tu Perfil</a>
          </div>
        </body>
        </html>
      `, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    }
  } catch (err) {
    console.error('Error in unsubscribe GET:', err);
    return new NextResponse('Error interno procesando la solicitud.', { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const email = formData.get('email') as string;
    const hash = formData.get('hash') as string;
    const actionType = formData.get('actionType') as string;

    if (!email || !hash || actionType !== 'pause') {
      return new NextResponse('Parámetros inválidos.', { status: 400 });
    }

    const secret = process.env.NEXTAUTH_SECRET || 'verdantia_secret_salt_123';
    const expectedHash = crypto.createHmac('sha256', secret).update(email).digest('hex');

    if (hash !== expectedHash) {
      return new NextResponse('Firma inválida.', { status: 403 });
    }

    const [userRows] = await pool.query<any>('SELECT idusuarios FROM usuarios WHERE usuariosemail = ?', [email]);
    if (userRows.length === 0) {
      return new NextResponse('Usuario no encontrado.', { status: 404 });
    }

    // Actualizar estado a inactiva
    await pool.query("UPDATE usuarios SET usuariosestadocuenta = 'inactiva' WHERE idusuarios = ?", [userRows[0].idusuarios]);

    return new NextResponse(`
      <!DOCTYPE html>
      <html lang="es">
      <head><meta charset="utf-8"><title>Cuenta Pausada | Verdantia</title><style>body { font-family: system-ui, sans-serif; background: #f8fafc; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; padding: 20px; text-align: center; } .card { background: white; padding: 40px; border-radius: 16px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); max-width: 450px; border-top: 6px solid #64748b; } a { display: inline-block; background: #10b981; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; margin-top: 15px; }</style></head>
      <body>
        <div class="card">
          <div style="font-size: 54px; margin-bottom: 20px;">💤</div>
          <h1 style="margin:0 0 10px; color:#0f172a;">Cuenta en Hibernación</h1>
          <p style="color:#475569; line-height:1.6;">Tu cuenta ha sido pausada correctamente. Ya no recibirás notificaciones ni correos de la aplicación.</p>
          <p style="color:#94a3b8; font-size: 0.9rem;">Si deseas volver a usar Verdantia, inicia sesión y sigue los pasos para reactivar tu cuenta.</p>
        </div>
      </body>
      </html>
    `, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });

  } catch (err) {
    console.error('Error in unsubscribe POST:', err);
    return new NextResponse('Error procesando la pausa.', { status: 500 });
  }
}
