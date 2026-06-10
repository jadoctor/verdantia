import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getUserByEmail } from '@/lib/auth';

export async function GET(request: Request) {
  const email = request.headers.get('x-user-email');
  if (!email) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const user = await getUserByEmail(email);
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  try {
    const userIdStr = user.id.toString();

    const sql = `
      SELECT 
        c.idchatconversaciones AS id,
        c.chatconversacionestipo AS tipo,
        c.chatconversacionesnombre AS nombre,
        c.chatconversacionesclaveunica AS codigo,
        (
          SELECT IF(m.xchatmensajesidusuarios = ?, CONCAT('Tú: ', m.chatmensajestexto), IF(c.chatconversacionestipo = 'grupo', CONCAT(u2.usuariosnombre, ': ', m.chatmensajestexto), m.chatmensajestexto))
          FROM chatmensajes m
          LEFT JOIN usuarios u2 ON m.xchatmensajesidusuarios = u2.idusuarios
          WHERE m.xchatmensajesidchatconversaciones = c.idchatconversaciones
          ORDER BY m.chatmensajesfechacreacion DESC
          LIMIT 1
        ) AS ultimo_mensaje,
        (
          SELECT DATE_ADD(m.chatmensajesfechacreacion, INTERVAL 2 HOUR)
          FROM chatmensajes m
          WHERE m.xchatmensajesidchatconversaciones = c.idchatconversaciones
          ORDER BY m.chatmensajesfechacreacion DESC
          LIMIT 1
        ) AS fecha_ultimo_mensaje
      FROM chatconversaciones c
      WHERE c.chatconversacionesclaveunica = 'grupo:comunidad:general'
         OR (c.chatconversacionestipo = 'directo' AND (
               c.chatconversacionesclaveunica LIKE CONCAT('privado:', ?, ':%') OR
               c.chatconversacionesclaveunica LIKE CONCAT('privado:%:', ?) OR
               c.chatconversacionesclaveunica = CONCAT('privado:', ?, ':', ?)
             ))
      ORDER BY fecha_ultimo_mensaje DESC
    `;

    const [rows]: any = await pool.query(sql, [user.id, userIdStr, userIdStr, userIdStr, userIdStr]);

    // Procesar chats privados para inyectar nombre/avatar del otro usuario si lo necesitamos luego
    // (Podemos hacerlo desde el front extrayendo el ID del codigo: privado:id1:id2)

    return NextResponse.json({ chats: rows });
  } catch (error: any) {
    console.error('Error obteniendo chats:', error);
    return NextResponse.json({ error: 'Error al obtener chats' }, { status: 500 });
  }
}
