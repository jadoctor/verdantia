import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getUserByEmail } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const email = request.headers.get('x-user-email');
  if (!email) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const user = await getUserByEmail(email);
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  const cultivoId = resolvedParams.id;

  try {
    // Verificar propiedad
    const [ownerCheck]: any = await pool.query(
      `SELECT * FROM cultivos WHERE idcultivos = ? AND xcultivosidusuarios = ?`,
      [cultivoId, user.id]
    );
    if (ownerCheck.length === 0) {
      return NextResponse.json({ error: 'Cultivo no encontrado o no autorizado' }, { status: 404 });
    }

    const original = ownerCheck[0];

    // Calcular número de colección para el nuevo cultivo
    const [maxResult]: any = await pool.query(
      `SELECT MAX(cultivosnumerocoleccion) as maxNum FROM cultivos WHERE xcultivosidusuarios = ?`,
      [user.id]
    );
    const nextNum = (maxResult[0].maxNum || 0) + 1;

    // Crear el clon con los mismos metadatos pero sin fechas
    const [result]: any = await pool.query(
      `INSERT INTO cultivos (
        xcultivosidusuarios, xcultivosidvariedadesvegetales, xcultivosidsemillas,
        xcultivosidbancales, cultivosposicionx, cultivosposiciony,
        cultivosorigen, cultivosmetodo, cultivosestado, 
        cultivoscantidad, cultivosubicacion, cultivosobservaciones,
        cultivosnumerocoleccion, xcultivosidloteorigen, cultivosactivosino
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'en_espera', ?, ?, ?, ?, ?, 1)`,
      [
        user.id,
        original.xcultivosidvariedadesvegetales,
        original.xcultivosidsemillas,
        original.xcultivosidbancales,
        original.cultivosposicionx,
        original.cultivosposiciony,
        original.cultivosorigen,
        original.cultivosmetodo,
        original.cultivoscantidad,
        original.cultivosubicacion,
        `[🔁 Repetición del cultivo #${original.cultivosnumerocoleccion || cultivoId}]`,
        nextNum,
        original.xcultivosidloteorigen
      ]
    );

    const newCultivoId = (result as any).insertId;

    return NextResponse.json({ success: true, newCultivoId, newNum: nextNum });
  } catch (error: any) {
    console.error('Error cloning cultivo:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
