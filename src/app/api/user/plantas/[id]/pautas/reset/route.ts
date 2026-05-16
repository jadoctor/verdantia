import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getUserByEmail } from '@/lib/auth';

// POST /api/user/plantas/[id]/pautas/reset — Restaurar una pauta al valor heredado (borrar override)
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const email = request.headers.get('x-user-email');
  if (!email) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const user = await getUserByEmail(email);
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  try {
    const plantaId = resolvedParams.id;
    const body = await request.json();
    const { xlaborespautaidlabores, laborespautafase } = body;

    if (!xlaborespautaidlabores || !laborespautafase) {
      return NextResponse.json({ error: 'Labor y fase son obligatorios' }, { status: 400 });
    }

    // Verificar propiedad
    const [ownerCheck]: any = await pool.query(
      `SELECT idvariedades FROM variedades WHERE idvariedades = ? AND xvariedadesidusuarios = ?`,
      [plantaId, user.id]
    );
    if (ownerCheck.length === 0) {
      return NextResponse.json({ error: 'Planta no encontrada' }, { status: 404 });
    }

    // Borrar el override → la pauta volverá a heredar de la especie
    await pool.query(
      `DELETE FROM laborespauta 
       WHERE xlaborespautaidusuarios = ? AND xlaborespautaidvariedades = ? 
       AND xlaborespautaidlabores = ? AND laborespautafase = ?`,
      [user.id, plantaId, xlaborespautaidlabores, laborespautafase]
    );

    return NextResponse.json({ success: true, message: 'Pauta restaurada al valor heredado' });
  } catch (error: any) {
    console.error('Error resetting pauta:', error);
    return NextResponse.json({ error: 'Error al restaurar la pauta' }, { status: 500 });
  }
}
