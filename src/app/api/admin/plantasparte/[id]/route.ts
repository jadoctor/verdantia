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
    const [rows]: any = await pool.query('SELECT * FROM plantasparte WHERE idplantasparte = ?', [resolvedParams.id]);
    if (rows.length === 0) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    return NextResponse.json({ plantasparte: rows[0] });
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
      UPDATE plantasparte SET
        plantaspartenombre = ?, plantasparteemoji = ?, plantaspartedescripcion = ?, plantasparteactivo = ?
      WHERE idplantasparte = ?
    `;
    const queryParams = [
      body.plantaspartenombre,
      body.plantasparteemoji || '🌱',
      body.plantaspartedescripcion || '',
      body.plantasparteactivo !== undefined ? body.plantasparteactivo : 1,
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
    await pool.query('DELETE FROM plantasparte WHERE idplantasparte = ?', [resolvedParams.id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}
