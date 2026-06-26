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
    const idtratamientos = resolvedParams.id;
    const body = await request.json();
    const {
      tratamientosactivo,
      tratamientosnombre,
      tratamientostipo,
      tratamientosdescripcion,
      tratamientospreparacion,
      tratamientosprecauciones,
      tratamientosfrecuencia,
      tratamientosdosis,
      tratamientosaccion,
      tratamientoscarencia,
      tratamientosmecanismo,
      partes
    } = body;

    if (!tratamientosnombre) {
      return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 });
    }

    if (!tratamientostipo) {
      return NextResponse.json({ error: 'El tipo es obligatorio' }, { status: 400 });
    }

    const [existing] = await pool.query<any[]>('SELECT idtratamientos FROM tratamientos WHERE tratamientosnombre = ? AND idtratamientos != ?', [tratamientosnombre, idtratamientos]);
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Ya existe otro tratamiento con ese nombre en el catálogo maestro.' }, { status: 400 });
    }

    const query = `
      UPDATE tratamientos SET
        tratamientosactivo = ?, tratamientosnombre = ?, tratamientostipo = ?,
        tratamientosdescripcion = ?, tratamientospreparacion = ?, tratamientosprecauciones = ?,
        tratamientosfrecuencia = ?, tratamientosdosis = ?, tratamientosaccion = ?,
        tratamientoscarencia = ?, tratamientosmecanismo = ?
      WHERE idtratamientos = ?
    `;

    const queryParams = [
      tratamientosactivo !== undefined ? tratamientosactivo : 1,
      tratamientosnombre,
      tratamientostipo,
      tratamientosdescripcion || null,
      tratamientospreparacion || null,
      tratamientosprecauciones || null,
      tratamientosfrecuencia || null,
      tratamientosdosis || null,
      tratamientosaccion || null,
      tratamientoscarencia || null,
      tratamientosmecanismo || null,
      idtratamientos
    ];

    await pool.query(query, queryParams);

    if (partes && Array.isArray(partes)) {
      await pool.query('DELETE FROM tratamientosplantasparte WHERE xtratamientosplantasparteidtratamientos = ?', [idtratamientos]);
      if (partes.length > 0) {
        const values = partes.map((id: number) => [idtratamientos, id]);
        await pool.query('INSERT INTO tratamientosplantasparte (xtratamientosplantasparteidtratamientos, xtratamientosplantasparteidplantasparte) VALUES ?', [values]);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating tratamiento:', error);
    return NextResponse.json({ error: 'Error al actualizar el tratamiento' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const user = await authenticateSuperadmin(request);
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const idtratamientos = resolvedParams.id;
    await pool.query('DELETE FROM tratamientos WHERE idtratamientos = ?', [idtratamientos]);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting tratamiento:', error);
    return NextResponse.json({ error: 'Error al eliminar tratamiento. Es posible que esté asociado a una afección.' }, { status: 500 });
  }
}
