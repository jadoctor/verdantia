import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getUserByEmail } from '@/lib/auth';

// Helper for authentication and authorization
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
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const { id } = resolvedParams;

  try {
    const [rows]: any = await pool.query(`
      SELECT v.*, e.especiesnombre, e.especiesicono 
      FROM variedades v
      LEFT JOIN especies e ON v.xvariedadesidespecies = e.idespecies
      WHERE v.idvariedades = ?
    `, [resolvedParams.id]);
    
    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: 'Variedad no encontrada' }, { status: 404 });
    }

    return NextResponse.json({ variedad: rows[0] });
  } catch (error: any) {
    console.error('Error fetching variedad:', error);
    return NextResponse.json({ error: 'Error al obtener la variedad' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const user = await authenticateSuperadmin(request);
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const body = await request.json();
    // Dynamically build the update query to allow partial saves (auto-save feature)
    if (Object.keys(body).length === 0) {
      return NextResponse.json({ success: true });
    }

    const setClauses = [];
    const queryParams = [];

    for (const [key, value] of Object.entries(body)) {
      setClauses.push(`${key} = ?`);
      queryParams.push(value === '' ? null : value);
    }
    queryParams.push(resolvedParams.id);

    const query = `UPDATE variedades SET ${setClauses.join(', ')} WHERE idvariedades = ?`;
    await pool.query(query, queryParams);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating variedad:', error);
    return NextResponse.json({ error: 'Error al actualizar la variedad' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const user = await authenticateSuperadmin(request);
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const { id } = resolvedParams;

  try {
    // Delete the variety
    await pool.query('DELETE FROM variedades WHERE idvariedades = ?', [resolvedParams.id]);
    
    // Also delete any seeds or other dependencies here if needed, but usually foreign keys with CASCADE handle it
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting variedad:', error);
    // If it's a foreign key constraint error, provide a nicer message
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
        return NextResponse.json({ error: 'No se puede eliminar la variedad porque está siendo utilizada en huertos o inventarios.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error al eliminar la variedad' }, { status: 500 });
  }
}
