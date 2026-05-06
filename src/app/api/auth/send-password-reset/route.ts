import { NextResponse } from 'next/server';
// Lazy load: NO importar firebase/admin estáticamente (causa hash corrupto en Turbopack)
import { Resend } from 'resend';
import { PasswordResetEmail } from '@/emails/PasswordResetEmail';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.error('[send-password-reset] RESEND_API_KEY no está configurada');
      return NextResponse.json({ error: 'El servicio de correo no está configurado.' }, { status: 500 });
    }

    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email es requerido' }, { status: 400 });
    }

    // Verificar que el usuario existe en Firebase
    const { getAdminAuth } = await import('@/lib/firebase/admin');
    const adminAuth = getAdminAuth();
    let userRecord;
    try {
      userRecord = await adminAuth.getUserByEmail(email);
    } catch {
      // No revelar si el email existe o no (seguridad)
      return NextResponse.json({ success: true });
    }

    const host = request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    // Generar el enlace de restablecimiento con Firebase Admin
    const actionCodeSettings = {
      url: `${host}/login?email=${encodeURIComponent(email)}`,
    };
    const firebaseResetLink = await adminAuth.generatePasswordResetLink(email, actionCodeSettings);

    // Interceptar la URL de Firebase para manejarla en nuestra propia página Next.js
    const urlObj = new URL(firebaseResetLink);
    const customResetLink = `${host}/auth/action${urlObj.search}`;

    // Obtener nombre del usuario desde Firebase o usar fallback
    const nombre = userRecord.displayName || email.split('@')[0];

    // Enviar correo personalizado con Resend
    const resendResult = await resend.emails.send({
      from: 'Verdantia Seguridad <admin@verdantia.life>',
      to: email,
      subject: '🔑 Restablece tu contraseña — Verdantia',
      react: PasswordResetEmail({
        nombre,
        email,
        resetLink: customResetLink,
      }),
    });

    if (resendResult.error) {
      console.error('[send-password-reset] Error Resend:', resendResult.error);
      throw new Error(resendResult.error.message);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error enviando correo de restablecimiento:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
