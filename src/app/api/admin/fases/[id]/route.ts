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
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const [rows]: any = await pool.query('SELECT * FROM fasescultivo WHERE idfasescultivo = ?', [resolvedParams.id]);
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Fase no encontrada' }, { status: 404 });
    }
    return NextResponse.json({ fase: rows[0] });
  } catch (error: any) {
    console.error('Error fetching fase:', error);
    return NextResponse.json({ error: 'Error al obtener fase' }, { status: 500 });
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
    const { 
      fasescultivoclave, 
      fasescultivonombre, 
      fasescultivoorden, 
      fasescultivocolor, 
      fasescultivoicono, 
      fasescultivodescripcion, 
      fasescultivoesfin, 
      fasescultivotipo,
      fasescultivodesde,
      fasescultivohasta
    } = body;

    if (!fasescultivoclave || !fasescultivonombre || !fasescultivoorden) {
      return NextResponse.json({ error: 'Clave, nombre y orden son obligatorios' }, { status: 400 });
    }

    const query = `
      UPDATE fasescultivo 
      SET 
        fasescultivoclave = ?, 
        fasescultivonombre = ?, 
        fasescultivoorden = ?, 
        fasescultivocolor = ?, 
        fasescultivoicono = ?, 
        fasescultivodescripcion = ?, 
        fasescultivoesfin = ?, 
        fasescultivotipo = ?,
        fasescultivodesde = ?,
        fasescultivohasta = ?
      WHERE idfasescultivo = ?
    `;
    const queryParams = [
      fasescultivoclave, 
      fasescultivonombre, 
      fasescultivoorden, 
      fasescultivocolor || '#3b82f6', 
      fasescultivoicono || '🌱', 
      fasescultivodescripcion || null,
      fasescultivoesfin ? 1 : 0,
      fasescultivotipo || 'Fase',
      fasescultivodesde || null,
      fasescultivohasta || null,
      resolvedParams.id
    ];

    await pool.query(query, queryParams);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating fase:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: 'Ya existe otra fase con esa clave.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error al actualizar fase' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const user = await authenticateSuperadmin(request);
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    // Check if any cultivos are using this phase
    const [cultivosCheck]: any = await pool.query('SELECT COUNT(*) as count FROM cultivos WHERE xcultivosidfasescultivo = ?', [resolvedParams.id]);
    if (cultivosCheck[0].count > 0) {
      return NextResponse.json({ error: 'No se puede eliminar la fase porque hay cultivos asociados a ella.' }, { status: 400 });
    }

    await pool.query('DELETE FROM fasescultivo WHERE idfasescultivo = ?', [resolvedParams.id]);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting fase:', error);
    return NextResponse.json({ error: 'Error al eliminar fase' }, { status: 500 });
  }
}
