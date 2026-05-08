import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const [users] = await pool.query<any>("SELECT usuariosemail, usuariosroles, usuariosestadocuenta FROM usuarios WHERE usuariosemail = 'jaillueca@gmail.com'");
    return NextResponse.json({ users });
  } catch (error: any) {
    return NextResponse.json({ error: error.message });
  }
}
