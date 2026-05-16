import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getUserByEmail } from '@/lib/auth';

async function authenticateSuperadmin(request: Request) {
  const email = request.headers.get('x-user-email');
  if (!email) return null;
  const user = await getUserByEmail(email);
  if (!user || !user.roles?.includes('superadministrador')) return null;
  return user;
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const user = await authenticateSuperadmin(request);
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  try {
    const [rows]: any = await pool.query('SELECT * FROM contenedores WHERE idcontenedores = ?', [resolvedParams.id]);
    if (rows.length === 0) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    return NextResponse.json({ contenedor: rows[0] });
  } catch (error) {
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const user = await authenticateSuperadmin(request);
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  try {
    const body = await request.json();
    const query = `
      UPDATE contenedores SET
        contenedoresnombre = ?, contenedorestipo = ?, contenedoresclasificacion = ?, contenedorescantidadalveolos = ?, contenedoresvolumenalveolocc = ?,
        contenedoresvolumentotallitros = ?, contenedoresdimensiones = ?, contenedoresformaalveolo = ?,
        contenedoresantiespiralizacion = ?, contenedoresmaterial = ?, contenedoresreutilizable = ?, contenedoresobservaciones = ?, contenedoresactivo = ?
      WHERE idcontenedores = ?
    `;
    const queryParams = [
      body.contenedoresnombre, body.contenedorestipo, body.contenedoresclasificacion || 'ambos', body.contenedorescantidadalveolos || 1, body.contenedoresvolumenalveolocc || 0,
      body.contenedoresvolumentotallitros || 0, body.contenedoresdimensiones || '', body.contenedoresformaalveolo || '',
      body.contenedoresantiespiralizacion ? 1 : 0, body.contenedoresmaterial || '', body.contenedoresreutilizable ? 1 : 0, body.contenedoresobservaciones || '', body.contenedoresactivo !== undefined ? body.contenedoresactivo : 1,
      resolvedParams.id
    ];
    await pool.query(query, queryParams);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const user = await authenticateSuperadmin(request);
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  try {
    await pool.query('DELETE FROM contenedores WHERE idcontenedores = ?', [resolvedParams.id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}
