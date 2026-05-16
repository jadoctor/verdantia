import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getUserByEmail } from '@/lib/auth';

// POST /api/user/incidencias/recurso — El usuario recurre una incidencia
export async function POST(request: Request) {
  const email = request.headers.get('x-user-email');
  if (!email) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const user = await getUserByEmail(email);
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  try {
    const { incidenciaId, recurso } = await request.json();

    if (!incidenciaId || !recurso?.trim()) {
      return NextResponse.json({ error: 'incidenciaId y recurso son obligatorios' }, { status: 400 });
    }

    // Verificar que la incidencia pertenece al usuario y está en estado 'resuelta'
    const [rows]: any = await pool.query(
      'SELECT idincidencias, incidenciasestado FROM incidencias WHERE idincidencias = ? AND xincidenciasidusuarios = ?',
      [incidenciaId, user.id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Incidencia no encontrada' }, { status: 404 });
    }

    if (!['resuelta', 'abierta'].includes(rows[0].incidenciasestado)) {
      return NextResponse.json({ error: 'Esta incidencia no puede ser recurrida en su estado actual' }, { status: 400 });
    }

    await pool.query(
      'UPDATE incidencias SET incidenciasestado = ?, incidenciasrecurso = ? WHERE idincidencias = ?',
      ['recurrida', recurso.trim(), incidenciaId]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET /api/user/incidencias/recurso — El usuario consulta sus incidencias
export async function GET(request: Request) {
  const email = request.headers.get('x-user-email');
  if (!email) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const user = await getUserByEmail(email);
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  try {
    const [rows]: any = await pool.query(
      `SELECT 
        idincidencias, incidenciastipo, incidenciasestado,
        incidenciasmotivo, incidenciasrecurso,
        incidenciasfechacreacion
       FROM incidencias
       WHERE xincidenciasidusuarios = ?
       ORDER BY incidenciasfechacreacion DESC`,
      [user.id]
    );

    return NextResponse.json({ incidencias: rows });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
