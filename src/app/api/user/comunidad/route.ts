import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getUserByEmail } from '@/lib/auth';
import { checkAndUpgradeRank } from '@/lib/logros';

// Constante para el canal general
const COMUNIDAD_CODIGO = 'grupo:comunidad:general';

async function getComunidadChatId() {
  const [rows]: any = await pool.query(
    'SELECT idchatconversaciones FROM chatconversaciones WHERE chatconversacionesclaveunica = ? LIMIT 1',
    [COMUNIDAD_CODIGO]
  );
  if (rows.length > 0) return rows[0].idchatconversaciones;
  
  // Si no existe, creamos el grupo general de la comunidad
  const [result]: any = await pool.query(
    `INSERT INTO chatconversaciones (chatconversacionestipo, chatconversacionesnombre, chatconversacionesdescripcion, chatconversacionesclaveunica, chatconversacionesactivosino, xchatconversacionesidusuariocreador) 
     VALUES ('grupo', 'Comunidad Verdantia', 'Muro global de la comunidad', ?, 1, 1)`,
    [COMUNIDAD_CODIGO]
  );
  return result.insertId;
}

export async function GET(request: Request) {
  const email = request.headers.get('x-user-email');
  if (!email) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const user = await getUserByEmail(email);
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  try {
    const { searchParams } = new URL(request.url);
    const queryChatId = searchParams.get('chatId');
    
    const chatId = queryChatId ? parseInt(queryChatId) : await getComunidadChatId();
    if (!chatId) return NextResponse.json({ error: 'Comunidad no encontrada' }, { status: 404 });

    const sql = `
      SELECT 
        m.idchatmensajes AS id,
        m.chatmensajestexto AS texto,
        DATE_ADD(m.chatmensajesfechacreacion, INTERVAL 2 HOUR) AS fecha,
        m.xchatmensajesidusuarios AS usuario_id,
        u.usuariosnombre AS usuario_nombre,
        COALESCE(p.poblacionesnombre, d.direccionespoblacion) AS usuario_poblacion,
        u.usuariosicono AS usuario_avatar,
        (
          SELECT datosadjuntosruta
          FROM datosadjuntos
          WHERE xdatosadjuntosidusuarios = m.xchatmensajesidusuarios
            AND datosadjuntostipo = 'imagen'
            AND datosadjuntosactivo = 1
            AND datosadjuntosvalidado = 1
            AND (datosadjuntosresultadovalidacion IS NULL OR datosadjuntosresultadovalidacion != 'rechazado')
          ORDER BY datosadjuntosesprincipal DESC, datosadjuntosorden ASC, datosadjuntosfechacreacion DESC
          LIMIT 1
        ) AS usuario_foto,
        (
          SELECT datosadjuntosresumen
          FROM datosadjuntos
          WHERE xdatosadjuntosidusuarios = m.xchatmensajesidusuarios
            AND datosadjuntostipo = 'imagen'
            AND datosadjuntosactivo = 1
            AND datosadjuntosvalidado = 1
            AND (datosadjuntosresultadovalidacion IS NULL OR datosadjuntosresultadovalidacion != 'rechazado')
          ORDER BY datosadjuntosesprincipal DESC, datosadjuntosorden ASC, datosadjuntosfechacreacion DESC
          LIMIT 1
        ) AS usuario_foto_meta,
        r.logrosnombre AS rango_nombre,
        r.logrosicono AS rango_icono,
        r.logrosnivel AS rango_nivel,
        IF(m.xchatmensajesidusuarios = ?, 1, 0) AS is_mine
      FROM chatmensajes m
      LEFT JOIN usuarios u ON m.xchatmensajesidusuarios = u.idusuarios
      LEFT JOIN direcciones d ON d.xdireccionesidusuarios = u.idusuarios AND d.direccionestipo = 'personal' AND d.direccionesesprincipal = 1
      LEFT JOIN poblaciones p ON d.xdireccionesidpoblaciones = p.idpoblaciones
      LEFT JOIN usuarioslogros ul ON u.idusuarios = ul.xusuarioslogrosidusuarios AND ul.usuarioslogrosfechafin IS NULL
      LEFT JOIN logros r ON ul.xusuarioslogrosidlogros = r.idlogros
      WHERE m.xchatmensajesidchatconversaciones = ? AND m.chatmensajeseliminadosino = 0
      ORDER BY m.chatmensajesfechacreacion ASC
      LIMIT 100
    `;
    
    const [mensajes] = await pool.query(sql, [user.id, chatId]);
    return NextResponse.json({ mensajes });
  } catch (error: any) {
    console.error('Error fetching comunidad:', error);
    return NextResponse.json({ error: 'Error al obtener mensajes de la comunidad' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const email = request.headers.get('x-user-email');
  if (!email) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const user = await getUserByEmail(email);
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  try {
    const body = await request.json();
    const { texto, chatId: bodyChatId } = body;

    if (!texto || texto.trim() === '') {
      return NextResponse.json({ error: 'El mensaje no puede estar vaco' }, { status: 400 });
    }

    const chatId = bodyChatId ? parseInt(bodyChatId) : await getComunidadChatId();
    if (!chatId) return NextResponse.json({ error: 'Comunidad no encontrada' }, { status: 404 });

    const [result]: any = await pool.query(
      `INSERT INTO chatmensajes (
        xchatmensajesidchatconversaciones,
        xchatmensajesidusuarios,
        chatmensajestipo,
        chatmensajestexto
      ) VALUES (?, ?, 'texto', ?)`,
      [chatId, user.id, texto.trim()]
    );

    // Evaluamos rango asincronamente
    checkAndUpgradeRank(user.id, { type: 'chat' }).catch(console.error);

    return NextResponse.json({ 
      success: true, 
      id: result.insertId,
      message: 'Mensaje publicado'
    });
  } catch (error: any) {
    console.error('Error enviando mensaje:', error);
    return NextResponse.json({ error: 'Error al enviar mensaje' }, { status: 500 });
  }
}
