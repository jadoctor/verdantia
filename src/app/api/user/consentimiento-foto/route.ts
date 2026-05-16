import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getUserByEmail } from '@/lib/auth';

// GET /api/user/consentimiento-foto — Consultar estado del consentimiento
export async function GET(request: Request) {
  const email = request.headers.get('x-user-email');
  if (!email) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const user = await getUserByEmail(email);
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  const [rows]: any = await pool.query(
    'SELECT usuariosconsentimientofoto FROM usuarios WHERE idusuarios = ?',
    [user.id]
  );

  const valor = rows[0]?.usuariosconsentimientofoto;
  return NextResponse.json({
    consentimiento: valor, // null = no preguntado, 1 = aceptado, 0 = rechazado
    puedeSubirFotos: valor === 1
  });
}

// POST /api/user/consentimiento-foto — Guardar respuesta del usuario
export async function POST(request: Request) {
  const email = request.headers.get('x-user-email');
  if (!email) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const user = await getUserByEmail(email);
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  const body = await request.json();
  const { acepta } = body; // true o false

  if (typeof acepta !== 'boolean') {
    return NextResponse.json({ error: 'Valor inválido' }, { status: 400 });
  }

  await pool.query(
    'UPDATE usuarios SET usuariosconsentimientofoto = ? WHERE idusuarios = ?',
    [acepta ? 1 : 0, user.id]
  );

  return NextResponse.json({
    success: true,
    consentimiento: acepta ? 1 : 0,
    puedeSubirFotos: acepta
  });
}
