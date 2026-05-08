import { NextResponse } from 'next/server';
import { render } from '@react-email/render';
import { NewPostEmail } from '@/emails/NewPostEmail';
import crypto from 'crypto';
import * as React from 'react';

export async function GET() {
  try {
    const secret = process.env.NEXTAUTH_SECRET || 'verdantia_secret_salt_123';
    const testEmail = 'test@verdantia.life';
    const hash = crypto.createHmac('sha256', secret).update(testEmail).digest('hex');

    const emailHtml = await render(
      React.createElement(NewPostEmail, {
        nombre: 'Jaime',
        blogTitulo: 'Cómo podar tomates cherry para triplicar la cosecha',
        blogResumen: 'Descubre el secreto de los agricultores biodinámicos para evitar hongos y maximizar la producción en espacios pequeños usando la técnica de doble tallo.',
        blogUrl: 'http://localhost:3000/blog/podar-tomates-cherry',
        blogImagenUrl: 'https://images.unsplash.com/photo-1592841200221-a6898f307baa?q=80&w=600&auto=format&fit=crop',
        unsubscribeUrl: `http://localhost:3000/api/unsubscribe?email=${encodeURIComponent(testEmail)}&hash=${hash}&avisoId=0`,
        planGratuito: true
      })
    );

    return new NextResponse(emailHtml, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8'
      }
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message });
  }
}
