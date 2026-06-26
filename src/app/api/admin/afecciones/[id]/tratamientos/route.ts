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
    const idafecciones = resolvedParams.id;
    const [rows] = await pool.query(`
      SELECT a_t.*, t.tratamientosnombre, t.tratamientostipo 
      FROM afeccionestratamientos a_t
      JOIN tratamientos t ON a_t.xafeccionestratamientosidtratamientos = t.idtratamientos
      WHERE a_t.xafeccionestratamientosidafecciones = ?
      ORDER BY t.tratamientosnombre
    `, [idafecciones]);
    
    return NextResponse.json({ afeccionestratamientos: rows });
  } catch (error: any) {
    console.error('Error fetching afeccionestratamientos:', error);
    return NextResponse.json({ error: 'Error al obtener los tratamientos de la afección' }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const user = await authenticateSuperadmin(request);
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const idafecciones = resolvedParams.id;
    const body = await request.json();
    const {
      xafeccionestratamientosidtratamientos,
      afeccionestratamientosdosis,
      afeccionestratamientosaplicacion,
      afeccionestratamientoseficacia
    } = body;

    if (!xafeccionestratamientosidtratamientos) {
      return NextResponse.json({ error: 'El ID del tratamiento es obligatorio' }, { status: 400 });
    }

    const [existing] = await pool.query<any[]>(
      'SELECT idafeccionestratamientos FROM afeccionestratamientos WHERE xafeccionestratamientosidafecciones = ? AND xafeccionestratamientosidtratamientos = ?', 
      [idafecciones, xafeccionestratamientosidtratamientos]
    );

    if (existing.length > 0) {
      return NextResponse.json({ error: 'Este tratamiento ya está asignado a esta afección.' }, { status: 400 });
    }

    const query = `
      INSERT INTO afeccionestratamientos (
        xafeccionestratamientosidafecciones, xafeccionestratamientosidtratamientos,
        afeccionestratamientosdosis, afeccionestratamientosaplicacion, afeccionestratamientoseficacia
      ) VALUES (?, ?, ?, ?, ?)
    `;

    const queryParams = [
      idafecciones,
      xafeccionestratamientosidtratamientos,
      afeccionestratamientosdosis || null,
      afeccionestratamientosaplicacion || null,
      afeccionestratamientoseficacia || null
    ];

    const [result]: any = await pool.query(query, queryParams);

    return NextResponse.json({ success: true, id: result.insertId });
  } catch (error: any) {
    console.error('Error adding tratamiento to afección:', error);
    return NextResponse.json({ error: 'Error al asignar el tratamiento' }, { status: 500 });
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
    const { searchParams } = new URL(request.url);
    const idtratamientos = searchParams.get('idtratamiento');

    if (idtratamientos) {
      await pool.query('DELETE FROM afeccionestratamientos WHERE xafeccionestratamientosidafecciones = ? AND xafeccionestratamientosidtratamientos = ?', [idafecciones, idtratamientos]);
    } else {
      const idRel = searchParams.get('id');
      if (idRel) {
        await pool.query('DELETE FROM afeccionestratamientos WHERE idafeccionestratamientos = ?', [idRel]);
      }
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error removing tratamiento from afección:', error);
    return NextResponse.json({ error: 'Error al quitar el tratamiento' }, { status: 500 });
  }
}
