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

export async function GET(request: Request) {
  const user = await authenticateSuperadmin(request);
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const [rows] = await pool.query('SELECT * FROM fasescultivo ORDER BY fasescultivoorden ASC');
    return NextResponse.json({ fases: rows });
  } catch (error: any) {
    console.error('Error fetching fases:', error);
    return NextResponse.json({ error: 'Error al obtener fases' }, { status: 500 });
  }
}

export async function POST(request: Request) {
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
      INSERT INTO fasescultivo (
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
      ) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      fasescultivoclave, 
      fasescultivonombre, 
      fasescultivoorden, 
      fasescultivocolor || '#3b82f6', 
      fasescultivoicono || '🌱', 
      fasescultivodescripcion || null,
      fasescultivoesfin ? 1 : 0,
      fasescultivotipo || 'Fase',
      fasescultivodesde || null,
      fasescultivohasta || null
    ];

    const [result]: any = await pool.query(query, params);
    return NextResponse.json({ success: true, id: result.insertId });
  } catch (error: any) {
    console.error('Error creating fase:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: 'Ya existe una fase con esa clave.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error al crear fase' }, { status: 500 });
  }
}
