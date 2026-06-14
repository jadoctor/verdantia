import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET /api/admin/familias/[id] — Detalle de familia + especies asociadas
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const [rows]: any[] = await pool.query(`SELECT * FROM familias WHERE idfamilias = ?`, [id]);
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Familia no encontrada' }, { status: 404 });
    }

    // Especies asociadas
    const [especies]: any[] = await pool.query(`
      SELECT idespecies, especiesnombre, especiesicono, especiesvisibilidadsino
      FROM especies
      WHERE xespeciesidfamilias = ?
      ORDER BY especiesnombre ASC
    `, [id]);

    // Todas las familias para selectores de rotación
    const [todasFamilias]: any[] = await pool.query(`
      SELECT idfamilias, familiasnombre, familiasgruporotacion, familiasemoji, familiascolor 
      FROM familias 
      ORDER BY familiasnombre ASC
    `);

    return NextResponse.json({ familia: rows[0], especies, todasFamilias });
  } catch (error: any) {
    console.error('Error fetching familia:', error);
    return NextResponse.json({ error: 'Error al obtener familia' }, { status: 500 });
  }
}

// PUT /api/admin/familias/[id] — Actualizar familia (auto-save)
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await request.json();
    const {
      familiasnombre,
      familiasnombrecientifico,
      familiasgruporotacion,
      familiasanosdescanso,
      familiascolor,
      familiasemoji,
      familiasdescripcion,
      familiasnotas,
      familiasprecedentes,
      familiassucesores
    } = body;

    // Verificar que existe
    const [existing]: any[] = await pool.query(`SELECT idfamilias FROM familias WHERE idfamilias = ?`, [id]);
    if (existing.length === 0) {
      return NextResponse.json({ error: 'Familia no encontrada' }, { status: 404 });
    }

    // Verificar nombre único (excluyendo la propia)
    if (familiasnombre) {
      const [dup]: any[] = await pool.query(
        `SELECT idfamilias FROM familias WHERE LOWER(familiasnombre) = LOWER(?) AND idfamilias != ?`,
        [familiasnombre.trim(), id]
      );
      if (dup.length > 0) {
        return NextResponse.json({ error: 'Ya existe otra familia con ese nombre' }, { status: 409 });
      }
    }

    await pool.query(`
      UPDATE familias SET
        familiasnombre = COALESCE(?, familiasnombre),
        familiasnombrecientifico = ?,
        familiasgruporotacion = COALESCE(?, familiasgruporotacion),
        familiasanosdescanso = ?,
        familiascolor = ?,
        familiasemoji = ?,
        familiasdescripcion = ?,
        familiasnotas = ?,
        familiasprecedentes = ?,
        familiassucesores = ?
      WHERE idfamilias = ?
    `, [
      familiasnombre?.trim(),
      familiasnombrecientifico?.trim() || null,
      familiasgruporotacion?.trim(),
      familiasanosdescanso ?? 3,
      familiascolor || '#64748b',
      familiasemoji || '🌿',
      familiasdescripcion || null,
      familiasnotas || null,
      familiasprecedentes ? JSON.stringify(familiasprecedentes) : null,
      familiassucesores ? JSON.stringify(familiassucesores) : null,
      id
    ]);

    return NextResponse.json({ success: true, message: 'Familia actualizada' });
  } catch (error: any) {
    console.error('Error updating familia:', error);
    return NextResponse.json({ error: 'Error al actualizar familia' }, { status: 500 });
  }
}

// DELETE /api/admin/familias/[id] — Soft-delete o hard-delete
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const url = new URL(request.url);
    const hard = url.searchParams.get('hard') === 'true';

    // Verificar especies asociadas
    const [especies]: any[] = await pool.query(
      `SELECT COUNT(*) as c FROM especies WHERE xespeciesidfamilias = ?`,
      [id]
    );

    if (hard) {
      if (especies[0].c > 0) {
        // Desasociar especies antes de eliminar
        await pool.query(`UPDATE especies SET xespeciesidfamilias = NULL WHERE xespeciesidfamilias = ?`, [id]);
      }
      await pool.query(`DELETE FROM familias WHERE idfamilias = ?`, [id]);
      return NextResponse.json({ success: true, message: 'Familia eliminada definitivamente' });
    } else {
      // Soft-delete: inhabilitar
      await pool.query(`UPDATE familias SET familiasactivosino = 0 WHERE idfamilias = ?`, [id]);
      return NextResponse.json({ success: true, message: 'Familia inhabilitada' });
    }
  } catch (error: any) {
    console.error('Error deleting familia:', error);
    return NextResponse.json({ error: 'Error al eliminar familia' }, { status: 500 });
  }
}

// PATCH /api/admin/familias/[id] — Reactivar familia
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await pool.query(`UPDATE familias SET familiasactivosino = 1 WHERE idfamilias = ?`, [id]);
    return NextResponse.json({ success: true, message: 'Familia reactivada' });
  } catch (error: any) {
    console.error('Error reactivating familia:', error);
    return NextResponse.json({ error: 'Error al reactivar familia' }, { status: 500 });
  }
}
