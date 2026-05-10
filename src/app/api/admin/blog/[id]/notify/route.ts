import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { Resend } from 'resend';

import { getMediaUrl } from '@/lib/media-url';
import crypto from 'crypto';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: 'Resend no está configurado (falta API Key)' }, { status: 500 });
    }

    const resolvedParams = await params;
    const blogId = resolvedParams.id;

    // Obtener información del post
    const [blogRows] = await pool.query<any>('SELECT * FROM blog WHERE idblog = ?', [blogId]);
    if (blogRows.length === 0) {
      return NextResponse.json({ error: 'Blog no encontrado' }, { status: 404 });
    }

    const blog = blogRows[0];
    if (blog.blogestado !== 'publicado') {
      return NextResponse.json({ error: 'El blog debe estar publicado para poder notificar' }, { status: 400 });
    }

    // Averiguar ID del aviso "Boletín Agrícola"
    const [avisoRows] = await pool.query<any>("SELECT idtiposavisos FROM tiposavisos WHERE tiposavisosnombre LIKE '%Boletín%' LIMIT 1");
    if (avisoRows.length === 0) {
      return NextResponse.json({ error: 'No existe el tipo de aviso de Boletín en la matriz' }, { status: 400 });
    }
    const idAviso = avisoRows[0].idtiposavisos;

    // Obtener usuarios a los que notificar:
    // - Que tengan email válido
    // - Que su cuenta esté activa (no en hibernación)
    // - Que no hayan desactivado explícitamente el Boletín (usuariosavisosactivo = 0)
    const [usuariosRows] = await pool.query<any>(`
      SELECT u.usuariosnombre, u.usuariosemail,
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
      LEFT JOIN usuariosavisos ua ON ua.xusuariosavisosidusuarios = u.idusuarios AND ua.xusuariosavisosidtiposavisos = ?
      WHERE u.usuariosemail IS NOT NULL 
        AND u.usuariosemail != '' 
        AND u.usuariosestadocuenta = 'activa'
        AND (ua.usuariosavisosactivo IS NULL OR ua.usuariosavisosactivo = 1)
    `, [idAviso]);

    if (usuariosRows.length === 0) {
      return NextResponse.json({ success: true, sent: 0, message: 'No hay usuarios elegibles para notificar' });
    }

    const host = request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const postUrl = `${host}/blog/${blog.blogslug}`;
    const imagenAbsoluta = blog.blogimagen ? getMediaUrl(blog.blogimagen) : '';

    const secret = process.env.NEXTAUTH_SECRET || 'verdantia_secret_salt_123';
    const { NewPostEmail_Free_HTML, NewPostEmail_Premium_HTML } = await import('@/emails/templates/NewPostEmailStatic');

    const emailsToSend = usuariosRows.map((u: any) => {
      const hash = crypto.createHmac('sha256', secret).update(u.usuariosemail).digest('hex');
      const unsubscribeUrl = `${host}/api/unsubscribe?email=${encodeURIComponent(u.usuariosemail)}&hash=${hash}&avisoId=${idAviso}`;
      const planGratuito = u.suscripcion.toLowerCase() === 'gratuito' || u.suscripcion.toLowerCase() === 'básica';

      let template = planGratuito ? NewPostEmail_Free_HTML : NewPostEmail_Premium_HTML;

      // Logic for if blogImagenUrl
      if (!imagenAbsoluta) {
        template = template.replace(/\{\{#if blogImagenUrl\}\}[\s\S]*?\{\{\/if\}\}/g, '');
      } else {
        template = template.replace(/\{\{#if blogImagenUrl\}\}/g, '').replace(/\{\{\/if\}\}/g, '');
      }

      const html = template
        .replace(/\{\{nombre\}\}/g, u.usuariosnombre || 'Lector')
        .replace(/\{\{blogTitulo\}\}/g, blog.blogtitulo)
        .replace(/\{\{blogResumen\}\}/g, blog.blogresumen || '')
        .replace(/\{\{blogUrl\}\}/g, postUrl)
        .replace(/\{\{blogImagenUrl\}\}/g, imagenAbsoluta)
        .replace(/\{\{unsubscribeUrl\}\}/g, unsubscribeUrl)
        .replace(/\{\{loginUrl\}\}/g, `${host}/login?callbackUrl=/dashboard/perfil%23planes`)
        .replace(/\{\{profileUrl\}\}/g, `${host}/login?callbackUrl=/dashboard/perfil%23comunicaciones`);

      return {
        from: 'Verdantia Boletín <admin@verdantia.life>',
        to: u.usuariosemail,
        subject: `🌱 Nuevo artículo: ${blog.blogtitulo}`,
        html
      };
    });

    // Enviar en batch (Resend permite max 100)
    let totalSent = 0;
    for (let i = 0; i < emailsToSend.length; i += 100) {
      const batch = emailsToSend.slice(i, i + 100);
      const result = await resend.batch.send(batch);
      if (result.error) {
        console.error('Error enviando batch de Resend:', result.error);
        throw new Error(result.error.message);
      }
      totalSent += batch.length;
    }

    return NextResponse.json({ success: true, sent: totalSent });
  } catch (error: any) {
    console.error('Error en endpoint notify blog:', error);
    return NextResponse.json({ error: error.message || 'Error al notificar suscriptores' }, { status: 500 });
  }
}
