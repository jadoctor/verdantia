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
      SELECT v.*, e.especiesvegetalesnombre, e.especiesvegetalesicono 
      FROM variedadesvegetales v
      LEFT JOIN especiesvegetales e ON v.xvariedadesvegetalesidespeciesvegetales = e.idespeciesvegetales
      WHERE v.idvariedadesvegetales = ?
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

    const query = `UPDATE variedadesvegetales SET ${setClauses.join(', ')} WHERE idvariedadesvegetales = ?`;
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
    // 1. Check direct/indirect seeds
    const [seeds]: any = await pool.query(`
      SELECT 1 FROM semillas WHERE xsemillasidvariedadesvegetales = ? 
      UNION 
      SELECT 1 FROM semillas s JOIN variedadesvegetales v ON s.xsemillasidvariedadesvegetales = v.idvariedadesvegetales WHERE v.xvariedadesvegetalesidvariedadorigen = ?
      LIMIT 1
    `, [id, id]);

    // 2. Check direct/indirect crops
    const [crops]: any = await pool.query(`
      SELECT 1 FROM cultivos WHERE xcultivosidvariedadesvegetales = ? 
      UNION 
      SELECT 1 FROM cultivos c JOIN variedadesvegetales v ON c.xcultivosidvariedadesvegetales = v.idvariedadesvegetales WHERE v.xvariedadesvegetalesidvariedadorigen = ?
      LIMIT 1
    `, [id, id]);

    // 3. Check if assumed by a user (has user-created varieties referring to this as origin)
    const [assumed]: any = await pool.query(`
      SELECT 1 FROM variedadesvegetales WHERE xvariedadesvegetalesidvariedadorigen = ? LIMIT 1
    `, [id]);

    const hasSeeds = seeds.length > 0;
    const hasCrops = crops.length > 0;
    const isAssumed = assumed.length > 0;

    if (hasSeeds || hasCrops || isAssumed) {
      // Inactivate instead of physical delete
      await pool.query('UPDATE variedadesvegetales SET variedadesvegetalesvisibilidadsino = 0 WHERE idvariedadesvegetales = ?', [id]);
      return NextResponse.json({ success: true, inactivated: true, message: 'La variedad está asociada a usuarios, cultivos o semillas, por lo que ha sido inhabilitada en lugar de eliminada.' });
    }

    // Otherwise, perform physical delete
    await pool.query('DELETE FROM variedadesvegetales WHERE idvariedadesvegetales = ?', [id]);
    
    return NextResponse.json({ success: true, inactivated: false, message: 'Variedad eliminada correctamente.' });
  } catch (error: any) {
    console.error('Error deleting variedad:', error);
    // If it's a foreign key constraint error, provide a nicer message
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
        return NextResponse.json({ error: 'No se puede eliminar la variedad porque está siendo utilizada en huertos o inventarios.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error al eliminar la variedad' }, { status: 500 });
  }
}
