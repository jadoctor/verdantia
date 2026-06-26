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
    const idafecciones = resolvedParams.id;
    const body = await request.json();
    const {
      afeccionesactivo,
      afeccionesnombre,
      afeccionesnombrecientifico,
      afeccionescategoria,
      afeccionesagente,
      afeccionesgravedad,
      afeccionesorganosafectados,
      afeccionesmesesriesgo,
      afeccionessintomas,
      afeccionescondiciones,
      afeccionesprevencion
    } = body;

    if (!afeccionesnombre) {
      return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 });
    }

    const [existing] = await pool.query<any[]>('SELECT idafecciones FROM afecciones WHERE afeccionesnombre = ? AND idafecciones != ?', [afeccionesnombre, idafecciones]);
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Ya existe otra afección con ese nombre en el catálogo maestro.' }, { status: 400 });
    }

    const query = `
      UPDATE afecciones SET
        afeccionesactivo = ?, afeccionesnombre = ?, afeccionesnombrecientifico = ?,
        afeccionescategoria = ?, afeccionesagente = ?, afeccionesgravedad = ?,
        afeccionesorganosafectados = ?, afeccionesmesesriesgo = ?,
        afeccionessintomas = ?, afeccionescondiciones = ?, afeccionesprevencion = ?
      WHERE idafecciones = ?
    `;

    const queryParams = [
      afeccionesactivo !== undefined ? afeccionesactivo : 1,
      afeccionesnombre,
      afeccionesnombrecientifico || null,
      afeccionescategoria || 'plaga',
      afeccionesagente || null,
      afeccionesgravedad || 'media',
      afeccionesorganosafectados || null,
      afeccionesmesesriesgo || null,
      afeccionessintomas || null,
      afeccionescondiciones || null,
      afeccionesprevencion || null,
      idafecciones
    ];

    await pool.query(query, queryParams);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating afección:', error);
    return NextResponse.json({ error: 'Error al actualizar la afección' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const user = await authenticateSuperadmin(request);
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const idafecciones = resolvedParams.id;
    await pool.query('DELETE FROM afecciones WHERE idafecciones = ?', [idafecciones]);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting afección:', error);
    return NextResponse.json({ error: 'Error al eliminar afección. Es posible que esté asociada a una especie.' }, { status: 500 });
  }
}
