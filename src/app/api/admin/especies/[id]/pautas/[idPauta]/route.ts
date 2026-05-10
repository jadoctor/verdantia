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

export async function PUT(request: Request, { params }: { params: Promise<{ id: string, idPauta: string }> }) {
  const resolvedParams = await params;
  const user = await authenticateSuperadmin(request);
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const idlaborespauta = resolvedParams.idPauta;
    const body = await request.json();
    const { xlaborespautaidlabores, laborespautafase, laborespautafrecuenciadias, laborespautanotasia, laborespautaactivosino } = body;

    const query = `
      UPDATE laborespauta SET
        xlaborespautaidlabores = ?, laborespautafase = ?, laborespautafrecuenciadias = ?, 
        laborespautanotasia = ?, laborespautaactivosino = ?
      WHERE idlaborespauta = ? AND xlaborespautaidespecies = ?
    `;

    const queryParams = [
      xlaborespautaidlabores, laborespautafase, laborespautafrecuenciadias || null, 
      laborespautanotasia || null, laborespautaactivosino, idlaborespauta, resolvedParams.id
    ];

    await pool.query(query, queryParams);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating pauta:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: 'Ya existe una pauta para esta labor en esta fase.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error al actualizar la pauta' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string, idPauta: string }> }) {
  const resolvedParams = await params;
  const user = await authenticateSuperadmin(request);
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const idlaborespauta = resolvedParams.idPauta;
    await pool.query('DELETE FROM laborespauta WHERE idlaborespauta = ? AND xlaborespautaidespecies = ?', [idlaborespauta, resolvedParams.id]);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting pauta:', error);
    return NextResponse.json({ error: 'Error al eliminar la pauta' }, { status: 500 });
  }
}
