import { NextRequest, NextResponse } from 'next/server';
import { generateRegistrationOptions } from '@simplewebauthn/server';
import pool from '@/lib/db';
import { getWebAuthnSettings } from '@/lib/webauthn';

export async function POST(req: NextRequest) {
  try {

    const { rpName, rpID } = getWebAuthnSettings(req);

    const { email, displayName } = await req.json();
    if (!email) return NextResponse.json({ error: 'Email requerido' }, { status: 400 });

    // Generar opciones de registro
    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userID: new Uint8Array(Buffer.from(email)), // Identificador único de usuario
      userName: email,
      userDisplayName: displayName || 'Agricultor Verdantia',
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
      },
      attestationType: 'none',
    });

    // Guardar el challenge en la base de datos para la posterior verificación
    await pool.execute(
      `INSERT INTO webauthn_challenges (email, challenge) VALUES (?, ?) 
       ON DUPLICATE KEY UPDATE challenge = ?`,
      [email, options.challenge, options.challenge]
    );

    return NextResponse.json(options);
  } catch (error: any) {
    console.error('Error generating register options:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
