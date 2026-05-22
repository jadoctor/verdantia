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

    const [result]: any = await pool.query(`
      INSERT INTO cultivosavisos (
        xcultivosavisosidcultivos, 
        xcultivosavisosidusuarios, 
        xcultivosavisosidlaborespauta, 
        cultivosavisosfechaemision, 
        cultivosavisosfecharespuesta, 
        cultivosavisosfase
      ) VALUES (?, ?, ?, ?, ?, ?)
    `, [idcultivos, user.id, idpauta, fechaEmisionSql, fechaRespuesta, fase]);

    const completedAvisoId = result.insertId;

    // Vincular automáticamente todas las fotos que estaban pendientes para esta labor al nuevo aviso completado
    try {
      const [adjuntos]: any = await pool.query(
        `SELECT iddatosadjuntos, datosadjuntosresumen FROM datosadjuntos WHERE xdatosadjuntosidcultivos = ? AND xdatosadjuntosidcultivosavisos IS NULL AND datosadjuntosactivo = 1`,
        [idcultivos]
      );
      
      for (const adj of adjuntos) {
        try {
          const resumen = typeof adj.datosadjuntosresumen === 'string' ? JSON.parse(adj.datosadjuntosresumen) : adj.datosadjuntosresumen;
          if (resumen && resumen.pending_idpauta === parseInt(idpauta) && resumen.pending_fechaEmision === fechaEmision) {
            await pool.query(
              `UPDATE datosadjuntos SET xdatosadjuntosidcultivosavisos = ? WHERE iddatosadjuntos = ?`,
              [completedAvisoId, adj.iddatosadjuntos]
            );
          }
        } catch (e) {
          console.error('Error linking photo to completed task:', e);
        }
      }
    } catch (err) {
      console.error('Error in automatic photos linking:', err);
    }

    return NextResponse.json({ success: true, id: completedAvisoId });
  } catch (error) {
    console.error('Error insertando aviso completado:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
