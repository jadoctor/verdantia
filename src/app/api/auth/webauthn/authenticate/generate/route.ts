import { NextRequest, NextResponse } from 'next/server';
import { generateAuthenticationOptions } from '@simplewebauthn/server';
import type { AuthenticatorTransportFuture } from '@simplewebauthn/server';
import pool from '@/lib/db';


export async function POST(req: NextRequest) {
  try {

    const origin = req.headers.get('origin') || 'http://localhost:3000';
    const rpID = new URL(origin).hostname;

    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: 'Email requerido' }, { status: 400 });

    // Obtener las llaves registradas de este usuario
    const [rows]: any = await pool.execute(`SELECT credentialID, transports FROM usuarios_passkeys WHERE userEmail = ?`, [email]);
    
    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: 'El usuario no tiene huellas biométricas registradas' }, { status: 404 });
    }

    const allowCredentials = rows.map((row: any) => ({
      id: row.credentialID,
      type: 'public-key' as const,
      transports: row.transports ? row.transports.split(',') as AuthenticatorTransportFuture[] : [],
    }));

    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials,
      userVerification: 'preferred',
    });

    // Guardar el challenge en la DB para este intento de login
    await pool.execute(
      `INSERT INTO webauthn_challenges (email, challenge) VALUES (?, ?) 
       ON DUPLICATE KEY UPDATE challenge = ?`,
      [email, options.challenge, options.challenge]
    );

    return NextResponse.json(options);
  } catch (error: any) {
    console.error('Error generating auth options:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
