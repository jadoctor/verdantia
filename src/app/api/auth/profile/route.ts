import { NextResponse } from 'next/server';
import { getUserByEmail } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/profile?email=xxx
 * Busca el perfil del usuario en Cloud SQL por su email de Firebase.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json({ error: 'Email requerido' }, { status: 400 });
  }

  const profile = await getUserByEmail(email);

  if (!profile) {
    return NextResponse.json({ error: 'Usuario no encontrado en la base de datos', email }, { status: 404 });
  }

  return NextResponse.json({ profile });
}
