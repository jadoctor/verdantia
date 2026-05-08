import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { Resend } from 'resend';
import { NewPostEmail } from '@/emails/NewPostEmail';
import { getMediaUrl } from '@/lib/media-url';
import crypto from 'crypto';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: 'Resend no está configurado (falta API Key)' }, { status: 500 });
    }

    const { emailDestino } = await request.json();
    if (!emailDestino) {
      return NextResponse.json({ error: 'Falta el email de destino para la prueba' }, { status: 400 });
    }

    const resolvedParams = await params;
    const blogId = resolvedParams.id;

    // Obtener información del post
    const [blogRows] = await pool.query<any>('SELECT * FROM blog WHERE idblog = ?', [blogId]);
    if (blogRows.length === 0) {
      return NextResponse.json({ error: 'Blog no encontrado' }, { status: 404 });
    }

    const blog = blogRows[0];

    // Averiguar ID del aviso "Boletín Agrícola"
    const [avisoRows] = await pool.query<any>("SELECT idtiposavisos FROM tiposavisos WHERE tiposavisosnombre LIKE '%Boletín%' LIMIT 1");
    const idAviso = avisoRows.length > 0 ? avisoRows[0].idtiposavisos : 0;

    // Averiguar suscripción del usuario de prueba
    const [userRows] = await pool.query<any>(`
      SELECT COALESCE(
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
    `, [emailDestino]);

    let planGratuito = true;
    if (userRows.length > 0) {
      planGratuito = userRows[0].suscripcion.toLowerCase() === 'gratuito' || userRows[0].suscripcion.toLowerCase() === 'básica';
    }

    const host = request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const postUrl = `${host}/blog/${blog.blogslug}`;
    const imagenAbsoluta = blog.blogimagen ? getMediaUrl(blog.blogimagen) : '';

    const secret = process.env.NEXTAUTH_SECRET || 'verdantia_secret_salt_123';
    const hash = crypto.createHmac('sha256', secret).update(emailDestino).digest('hex');
    const unsubscribeUrl = `${host}/api/unsubscribe?email=${encodeURIComponent(emailDestino)}&hash=${hash}&avisoId=${idAviso}`;

    const result = await resend.emails.send({
      from: 'Verdantia Boletín <admin@verdantia.life>',
      to: emailDestino,
      subject: `🧪 [PRUEBA] Nuevo artículo: ${blog.blogtitulo}`,
      react: NewPostEmail({
        nombre: 'Administrador',
        blogTitulo: blog.blogtitulo,
        blogResumen: blog.blogresumen || 'Descubre nuestro nuevo artículo en el blog.',
        blogUrl: postUrl,
        blogImagenUrl: imagenAbsoluta || '',
        unsubscribeUrl: unsubscribeUrl,
        planGratuito: planGratuito
      })
    });

    if (result.error) {
      throw new Error(result.error.message);
    }

    return NextResponse.json({ success: true, message: `Prueba enviada a ${emailDestino}` });
  } catch (error: any) {
    console.error('Error en prueba notify blog:', error);
    return NextResponse.json({ error: error.message || 'Error al enviar prueba' }, { status: 500 });
  }
}
