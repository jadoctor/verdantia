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
    const idespecies = resolvedParams.id;
    const body = await request.json();
    const { fases_duracion } = body; // Expected to be an object: { "idFase": duracionEnDias, "2": 15, ... }

    if (!fases_duracion || typeof fases_duracion !== 'object') {
      return NextResponse.json({ error: 'Formato de fases incorrecto' }, { status: 400 });
    }

    // 1. Borrar todas las fases previas para esta especie
    await pool.query('DELETE FROM especiesfases WHERE xespeciesfasesidespecies = ?', [idespecies]);

    // 2. Insertar las nuevas fases que tengan una duración > 0 o no nula
    const insertValues = [];
    const queryParams = [];

    for (const [idFaseStr, duracion] of Object.entries(fases_duracion)) {
      const idFase = parseInt(idFaseStr);
      const dias = parseInt(String(duracion));
      if (!isNaN(idFase) && !isNaN(dias)) {
        insertValues.push('(?, ?, ?)');
        queryParams.push(idespecies, idFase, dias);
      }
    }

    if (insertValues.length > 0) {
      await pool.query(
        `INSERT INTO especiesfases (xespeciesfasesidespecies, xespeciesfasesidfasescultivo, especiesfasesduraciondias) VALUES ${insertValues.join(', ')}`,
        queryParams
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating especiesfases:', error);
    return NextResponse.json({ error: 'Error al actualizar las fases de la especie' }, { status: 500 });
  }
}
