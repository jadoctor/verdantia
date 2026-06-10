import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getUserByEmail } from '@/lib/auth';

export async function POST(request: Request) {
  const email = request.headers.get('x-user-email');
  if (!email) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const user = await getUserByEmail(email);
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  try {
    const body = await request.json();
    const { targetUserId } = body;

    if (!targetUserId) {
      return NextResponse.json({ error: 'Falta targetUserId' }, { status: 400 });
    }

    // Ordenar IDs para garantizar unicidad en el código del chat (privado:min:max)
    const id1 = Math.min(user.id, targetUserId);
    const id2 = Math.max(user.id, targetUserId);
    const chatCode = `privado:${id1}:${id2}`;

    // Buscar si ya existe
    const [rows]: any = await pool.query(
      'SELECT idchatconversaciones FROM chatconversaciones WHERE chatconversacionesclaveunica = ? LIMIT 1',
      [chatCode]
    );

    let chatId;

    if (rows.length > 0) {
      chatId = rows[0].idchatconversaciones;
    } else {
      // Buscar datos del otro usuario para nombre del chat (aunque luego la UI lo sobrescribe con el nombre del contacto)
      const [targetRows]: any = await pool.query('SELECT usuariosnombre FROM usuarios WHERE idusuarios = ?', [targetUserId]);
      const targetName = targetRows.length > 0 ? targetRows[0].usuariosnombre : 'Usuario';

      const [result]: any = await pool.query(
        `INSERT INTO chatconversaciones (chatconversacionestipo, chatconversacionesnombre, chatconversacionesdescripcion, chatconversacionesclaveunica, chatconversacionesactivosino, xchatconversacionesidusuariocreador) 
         VALUES ('directo', ?, 'Chat Privado', ?, 1, ?)`,
        [`Chat con ${targetName}`, chatCode, user.id]
      );
      chatId = result.insertId;
    }

    return NextResponse.json({ chatId, chatCode });
  } catch (error: any) {
    console.error('Error creando/obteniendo chat privado:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
