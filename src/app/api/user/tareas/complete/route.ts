import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getUserByEmail } from '@/lib/auth';

// POST /api/user/tareas/complete — Marcar una labor como realizada
export async function POST(request: Request) {
  const email = request.headers.get('x-user-email');
  if (!email) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const user = await getUserByEmail(email);
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  try {
    const body = await request.json();
    const { idcultivo, idlabor, fecha, observaciones } = body;

    if (!idcultivo || !idlabor) {
      return NextResponse.json({ error: 'Faltan parámetros obligatorios (idcultivo, idlabor)' }, { status: 400 });
    }

    // Verificar que el cultivo pertenece al usuario
    const [cultivoCheck]: any = await pool.query(
      `SELECT idcultivos FROM cultivos WHERE idcultivos = ? AND xcultivosidusuarios = ?`,
      [idcultivo, user.id]
    );

    if (cultivoCheck.length === 0) {
      return NextResponse.json({ error: 'Cultivo no encontrado o acceso denegado' }, { status: 404 });
    }

    // Insertar en laboresrealizadas
    const fechaRealizacion = fecha || new Date().toISOString().split('T')[0];

    const [result]: any = await pool.query(
      `INSERT INTO laboresrealizadas (
        xlaboresrealizadasidcultivos,
        xlaboresrealizadasidlabores,
        laboresrealizadasfecha,
        laboresrealizadasobservaciones
      ) VALUES (?, ?, ?, ?)`,
      [idcultivo, idlabor, fechaRealizacion, observaciones || null]
    );

    return NextResponse.json({ 
      success: true, 
      id: result.insertId,
      message: '¡Labor registrada con éxito!'
    });
  } catch (error: any) {
    console.error('Error registrando labor realizada:', error);
    return NextResponse.json({ error: 'Error interno al registrar la labor' }, { status: 500 });
  }
}
