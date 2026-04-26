import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import pool from '@/lib/db';
import { adminAuth } from '@/lib/firebase/admin';


export async function POST(req: NextRequest) {
  try {

    const origin = req.headers.get('origin') || 'http://localhost:3000';
    const rpID = new URL(origin).hostname;

    const { email, authenticationResponse } = await req.json();
    if (!email || !authenticationResponse) return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });

    // Obtener el challenge esperado de la DB
    const [challenges]: any = await pool.execute(`SELECT challenge FROM webauthn_challenges WHERE email = ?`, [email]);
    if (!challenges || challenges.length === 0) {
      return NextResponse.json({ error: 'Challenge expirado o inválido' }, { status: 400 });
    }
    const expectedChallenge = challenges[0].challenge;

    // Obtener la llave pública de esta credencial desde MySQL
    const [keys]: any = await pool.execute(
      `SELECT publicKey, counter FROM usuarios_passkeys WHERE userEmail = ? AND credentialID = ?`, 
      [email, authenticationResponse.id]
    );

    if (!keys || keys.length === 0) {
      return NextResponse.json({ error: 'Credencial no registrada en el sistema' }, { status: 404 });
    }

    const { publicKey, counter } = keys[0];

    let verification;
    try {
      verification = await verifyAuthenticationResponse({
        response: authenticationResponse,
        expectedChallenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
        credential: {
          id: authenticationResponse.id,
          publicKey: new Uint8Array(Buffer.from(publicKey, 'base64')),
          counter: Number(counter),
        },
      });
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }

    if (verification.verified && verification.authenticationInfo) {
      const { newCounter } = verification.authenticationInfo;

      // Actualizar el contador (protección contra replay attacks)
      await pool.execute(
        `UPDATE usuarios_passkeys SET counter = ? WHERE credentialID = ?`,
        [newCounter, authenticationResponse.id]
      );
      // Borrar challenge utilizado
      await pool.execute(`DELETE FROM webauthn_challenges WHERE email = ?`, [email]);

      // 💥 MAGIA DE FIREBASE: Obtener el UID del usuario en Firebase mediante su email
      let userRecord;
      try {
        userRecord = await adminAuth.getUserByEmail(email);
      } catch (e: any) {
         return NextResponse.json({ error: 'El usuario no está vinculado con Firebase' }, { status: 404 });
      }

      // 💥 Forjamos el Custom Token (VIP Pass)
      const customToken = await adminAuth.createCustomToken(userRecord.uid);

      return NextResponse.json({ success: true, customToken });
    }

    return NextResponse.json({ error: 'Verificación biométrica fallida' }, { status: 400 });
  } catch (error: any) {
    console.error('Error verify authentication:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
