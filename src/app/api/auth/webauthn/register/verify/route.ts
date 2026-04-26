import { NextRequest, NextResponse } from 'next/server';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import pool from '@/lib/db';


export async function POST(req: NextRequest) {
  try {

    const origin = req.headers.get('origin') || 'http://localhost:3000';
    const rpID = new URL(origin).hostname;

    const { email, registrationResponse } = await req.json();
    if (!email || !registrationResponse) return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });

    // Obtener el challenge esperado de la DB
    const [rows]: any = await pool.execute(`SELECT challenge FROM webauthn_challenges WHERE email = ?`, [email]);
    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: 'Challenge no encontrado o expirado' }, { status: 400 });
    }
    const expectedChallenge = rows[0].challenge;

    let verification;
    try {
      verification = await verifyRegistrationResponse({
        response: registrationResponse,
        expectedChallenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
      });
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }

    if (verification.verified && verification.registrationInfo) {
      const { credential } = verification.registrationInfo;
      const { publicKey, id: credentialID, counter } = credential;

      // Borrar challenge utilizado
      await pool.execute(`DELETE FROM webauthn_challenges WHERE email = ?`, [email]);

      // Guardar Passkey (Convertimos Uint8Array a Base64 para almacenar como TEXT/VARCHAR)
      const credentialIDBase64 = Buffer.from(credentialID).toString('base64url');
      const publicKeyBase64 = Buffer.from(publicKey).toString('base64');
      const transportsStr = registrationResponse.response.transports 
        ? registrationResponse.response.transports.join(',')
        : '';

      await pool.execute(
        `INSERT INTO usuarios_passkeys (userEmail, credentialID, publicKey, counter, transports) 
         VALUES (?, ?, ?, ?, ?)`,
        [email, credentialIDBase64, publicKeyBase64, counter, transportsStr]
      );

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Verificación biométrica fallida' }, { status: 400 });
  } catch (error: any) {
    console.error('Error verify registration:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
