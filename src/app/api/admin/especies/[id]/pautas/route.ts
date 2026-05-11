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
    const idespecies = resolvedParams.id;
    // Join with labores table to get labor details
    const query = `
      SELECT p.*, l.laboresnombre
      FROM laborespauta p
      JOIN labores l ON p.xlaborespautaidlabores = l.idlabores
      WHERE p.xlaborespautaidespecies = ?
      ORDER BY p.xlaborespautaidlabores, 
               CASE p.laborespautafase 
                 WHEN 'siembra' THEN 1 
                 WHEN 'germinacion' THEN 2 
                 WHEN 'plantula' THEN 3 
                 WHEN 'crecimiento' THEN 4 
                 WHEN 'floracion' THEN 5 
                 WHEN 'fructificacion' THEN 6 
                 WHEN 'cosecha' THEN 7
                 WHEN 'fin_ciclo' THEN 8
                 ELSE 9 END
    `;
    const [rows] = await pool.query(query, [idespecies]);
    return NextResponse.json({ pautas: rows });
  } catch (error: any) {
    console.error('Error fetching pautas:', error);
    return NextResponse.json({ error: 'Error al obtener pautas de labor', detail: error.message }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const user = await authenticateSuperadmin(request);
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const idespecies = resolvedParams.id;
    const body = await request.json();
    const { xlaborespautaidlabores, laborespautafase, laborespautafrecuenciadias, laborespautanotasia, laborespautaactivosino } = body;

    if (!xlaborespautaidlabores || !laborespautafase) {
      return NextResponse.json({ error: 'Labor y fase son obligatorios' }, { status: 400 });
    }

    const query = `
      INSERT INTO laborespauta (
        xlaborespautaidespecies, xlaborespautaidlabores, laborespautafase, 
        laborespautafrecuenciadias, laborespautanotasia, laborespautaactivosino
      ) VALUES (?, ?, ?, ?, ?, ?)
    `;

    const queryParams = [
      idespecies, xlaborespautaidlabores, laborespautafase, 
      laborespautafrecuenciadias || null, laborespautanotasia || null, 
      laborespautaactivosino !== undefined ? laborespautaactivosino : 1
    ];

    const [result]: any = await pool.query(query, queryParams);
    return NextResponse.json({ success: true, id: result.insertId });
  } catch (error: any) {
    console.error('Error creating pauta:', error);
    // Duplicate entry handling
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: 'Ya existe una pauta para esta labor en esta fase.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error al crear la pauta' }, { status: 500 });
  }
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
    const { idlaborespauta, xlaborespautaidlabores, laborespautafase, laborespautafrecuenciadias, laborespautanotasia, laborespautaactivosino } = body;

    if (idlaborespauta) {
      // Update by ID
      await pool.query(
        `UPDATE laborespauta SET 
          xlaborespautaidlabores = COALESCE(?, xlaborespautaidlabores),
          laborespautafase = COALESCE(?, laborespautafase), 
          laborespautafrecuenciadias = ?, 
          laborespautanotasia = ?, 
          laborespautaactivosino = ? 
        WHERE idlaborespauta = ? AND xlaborespautaidespecies = ?`,
        [
          xlaborespautaidlabores || null,
          laborespautafase || null, 
          laborespautafrecuenciadias ?? null, 
          laborespautanotasia || null, 
          laborespautaactivosino !== undefined ? laborespautaactivosino : 1, 
          idlaborespauta, 
          idespecies
        ]
      );
    } else if (xlaborespautaidlabores && laborespautafase) {
      // Update by labor+fase combo
      await pool.query(
        `UPDATE laborespauta SET laborespautafrecuenciadias = ?, laborespautanotasia = ?, laborespautaactivosino = ? WHERE xlaborespautaidespecies = ? AND xlaborespautaidlabores = ? AND laborespautafase = ?`,
        [laborespautafrecuenciadias ?? null, laborespautanotasia || null, laborespautaactivosino !== undefined ? laborespautaactivosino : 1, idespecies, xlaborespautaidlabores, laborespautafase]
      );
    } else {
      return NextResponse.json({ error: 'Se requiere idlaborespauta o labor+fase' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating pauta:', error);
    return NextResponse.json({ error: 'Error al actualizar la pauta', detail: error.message }, { status: 500 });
  }
}
