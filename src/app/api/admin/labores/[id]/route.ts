import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getUserByEmail } from '@/lib/auth';

// Helper for authentication and authorization
async function authenticateSuperadmin(request: NextRequest) {
  const email = request.headers.get('x-user-email');
  if (!email) return null;
  const user = await getUserByEmail(email);
  if (!user || !user.roles?.includes('superadministrador')) return null;
  return user;
}

// GET /api/admin/labores/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const isAdmin = await authenticateSuperadmin(req);
    if (!isAdmin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const resolvedParams = await params;
    const { id } = resolvedParams;

    const [rows]: any = await pool.query('SELECT * FROM labores WHERE idlabores = ?', [id]);

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Labor no encontrada' }, { status: 404 });
    }

    return NextResponse.json({ success: true, labor: rows[0] });
  } catch (error: any) {
    console.error('Error fetching labor:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}

// PUT /api/admin/labores/[id]
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const isAdmin = await authenticateSuperadmin(req);
    if (!isAdmin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const resolvedParams = await params;
    const { id } = resolvedParams;
    const data = await req.json();
    const { laboresnombre, laboresdescripcion, laboresicono, laborescolor, laboresactivosino } = data;

    if (!laboresnombre) {
      return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 });
    }

    await pool.query(
      `UPDATE labores SET 
       laboresnombre = ?, 
       laboresdescripcion = ?, 
       laboresicono = ?, 
       laborescolor = ?, 
       laboresactivosino = ? 
       WHERE idlabores = ?`,
      [laboresnombre, laboresdescripcion || '', laboresicono || '', laborescolor || '#64748b', laboresactivosino !== undefined ? laboresactivosino : 1, id]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating labor:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}

// DELETE /api/admin/labores/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const isAdmin = await authenticateSuperadmin(req);
    if (!isAdmin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const resolvedParams = await params;
    const { id } = resolvedParams;

    // Optional: check if the labor is being used in laboresrealizadas before deleting
    const [usage]: any = await pool.query('SELECT COUNT(*) as count FROM laboresrealizadas WHERE xlaboresrealizadasidlabores = ?', [id]);
    if (usage[0].count > 0) {
      return NextResponse.json({ error: 'No se puede eliminar porque esta labor ya ha sido utilizada en registros de usuarios.' }, { status: 400 });
    }

    await pool.query('DELETE FROM labores WHERE idlabores = ?', [id]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting labor:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
