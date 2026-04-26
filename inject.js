const fs = require('fs');
let code = fs.readFileSync('src/app/dashboard/perfil/page.tsx', 'utf8');

const newFunc = `
  const handleRegisterPasskey = async () => {
    if (!auth.currentUser?.email) return;
    try {
      const { startRegistration } = await import('@simplewebauthn/browser');
      alert('Se va a solicitar acceso a tu lector de huellas o reconocimiento facial. Sigue las instrucciones de tu pantalla.');
      const res = await fetch('/api/auth/webauthn/register/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: auth.currentUser.email, displayName: profile?.nombre }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Error conectando con el servidor biométrico');
      const options = await res.json();
      let attResp;
      try { attResp = await startRegistration(options); } catch (err) {
        if (err.name === 'NotAllowedError' || err.name === 'AbortError') return console.log('Cancelado');
        throw err;
      }
      const verifyRes = await fetch('/api/auth/webauthn/register/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: auth.currentUser.email, registrationResponse: attResp }),
      });
      if (verifyRes.ok) alert('✅ ¡Huella o biometría registrada con éxito!');
      else throw new Error((await verifyRes.json()).error || 'Fallo en servidor');
    } catch (err) {
      alert('Error al vincular Passkey: ' + err.message);
    }
  };
`;

if (!code.includes('const handleRegisterPasskey = async')) {
  code = code.replace(/const handlePasswordReset = async \(\) => \{[\s\S]*?\}\s*};\s*/, match => match + newFunc + '\n');
  fs.writeFileSync('src/app/dashboard/perfil/page.tsx', code);
  console.log('Injected handleRegisterPasskey');
} else {
  console.log('Already exists');
}
