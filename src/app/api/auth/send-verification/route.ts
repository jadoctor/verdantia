import { NextResponse } from 'next/server';
// Lazy load: NO importar firebase/admin estáticamente (causa hash corrupto en Turbopack)
import { Resend } from 'resend';
import { VerificationEmail } from '@/emails/VerificationEmail';

// Asegúrate de poner RESEND_API_KEY en tu .env.local
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.error('[send-verification] RESEND_API_KEY no está configurada en .env.local');
      return NextResponse.json({ error: 'El servicio de correo no está configurado. Contacta al administrador.' }, { status: 500 });
    }

    const { email, nombre, sexo } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email es requerido' }, { status: 400 });
    }

    const host = request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    
    // 1. Generar el enlace mágico de verificación con Firebase Admin, indicando que vuelva al perfil
    const { getAdminAuth } = await import('@/lib/firebase/admin');
    const adminAuth = getAdminAuth();
    let firebaseVerificationLink: string;
    try {
      const actionCodeSettings = {
        url: `${host}/dashboard/perfil`,
      };
      firebaseVerificationLink = await adminAuth.generateEmailVerificationLink(email, actionCodeSettings);
    } catch (fbErr: any) {
      console.error('[send-verification] Error Firebase Admin:', fbErr);
      if (fbErr.message?.includes('TOO_MANY_ATTEMPTS')) {
        return NextResponse.json({ error: 'Has enviado demasiados correos de verificación. Espera unos minutos antes de intentarlo de nuevo.' }, { status: 429 });
      }
      return NextResponse.json({ error: 'Error al generar el enlace de verificación. Asegúrate de que el email existe en Firebase.' }, { status: 500 });
    }

    // Interceptar la URL de Firebase para manejarla en nuestra propia página Next.js
    const urlObj = new URL(firebaseVerificationLink);
    const customVerificationLink = `${host}/auth/action${urlObj.search}`;

    // 2. Enviar el correo bonito usando Resend y React Email
    const resendResult = await resend.emails.send({
      from: 'Verdantia Seguridad <admin@verdantia.life>',
      to: email,
      subject: '✉️ Verifica tu correo electrónico — Verdantia',
      react: VerificationEmail({ 
        nombre: nombre || 'Agricultor', 
        verificationLink: customVerificationLink,
        sexo
      }),
    });

    if (resendResult.error) {
      console.error('[send-verification] Error Resend:', resendResult.error);
      throw new Error(resendResult.error.message);
    }

    return NextResponse.json({ success: true, data: resendResult.data });
  } catch (error: any) {
    console.error('Error enviando correo de verificación:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
