import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST() {
  try {
    await pool.query("ALTER TABLE usuarios MODIFY COLUMN usuariosestadocuenta ENUM('activa','inactiva','pausada','borrado_pendiente','anonimizada','revision_manual') NOT NULL DEFAULT 'activa'");
    await pool.query("UPDATE usuarios SET usuariosestadocuenta = 'inactiva' WHERE usuariosemail = 'jaillueca@gmail.com'");
    const [users] = await pool.query<any>("SELECT usuariosemail, usuariosestadocuenta FROM usuarios WHERE usuariosemail = 'jaillueca@gmail.com'");
    return NextResponse.json({ success: true, users });
  } catch (error: any) {
    return NextResponse.json({ error: error.message });
  }
}
