import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getUserByEmail } from '@/lib/auth';

export async function POST(request: Request) {
  const email = request.headers.get('x-user-email');
  if (!email) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const user = await getUserByEmail(email);
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  try {
    const { idcultivos, idpauta, fase, fechaEmision } = await request.json();

    // Validar que el cultivo pertenece al usuario
    const [cultivos]: any = await pool.query('SELECT idcultivos FROM cultivos WHERE idcultivos = ? AND xcultivosidusuarios = ?', [idcultivos, user.id]);
    if (cultivos.length === 0) {
      return NextResponse.json({ error: 'Cultivo no encontrado' }, { status: 404 });
    }

    const fechaRespuesta = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const fechaEmisionSql = new Date(fechaEmision).toISOString().slice(0, 19).replace('T', ' ');

    await pool.query(`
      INSERT INTO cultivosavisos (
        xcultivosavisosidcultivos, 
        xcultivosavisosidusuarios, 
        xcultivosavisosidlaborespauta, 
        cultivosavisosfechaemision, 
        cultivosavisosfecharespuesta, 
        cultivosavisosfase
      ) VALUES (?, ?, ?, ?, ?, ?)
    `, [idcultivos, user.id, idpauta, fechaEmisionSql, fechaRespuesta, fase]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error insertando aviso completado:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
