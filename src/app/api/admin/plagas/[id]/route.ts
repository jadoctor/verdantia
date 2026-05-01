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

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const user = await authenticateSuperadmin(request);
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const idplagas = resolvedParams.id;
    const body = await request.json();
    const {
      plagasnombre,
      plagasnombrecientifico,
      plagastipo,
      plagasdescripcion,
      plagascontrolorganico
    } = body;

    if (!plagasnombre) {
      return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 });
    }

    const query = `
      UPDATE plagas SET
        plagasnombre = ?, plagasnombrecientifico = ?, plagastipo = ?, plagasdescripcion = ?, plagascontrolorganico = ?
      WHERE idplagas = ?
    `;

    const queryParams = [
      plagasnombre,
      plagasnombrecientifico || null,
      plagastipo || null,
      plagasdescripcion || null,
      plagascontrolorganico || null,
      idplagas
    ];

    await pool.query(query, queryParams);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating plaga:', error);
    return NextResponse.json({ error: 'Error al actualizar la plaga' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const user = await authenticateSuperadmin(request);
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const idplagas = resolvedParams.id;
    await pool.query('DELETE FROM plagas WHERE idplagas = ?', [idplagas]);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting plaga:', error);
    return NextResponse.json({ error: 'Error al eliminar plaga. Es posible que esté asociada a una especie.' }, { status: 500 });
  }
}
