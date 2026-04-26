const fs = require('fs');
let code = fs.readFileSync('src/app/login/page.tsx', 'utf8');

// Also need to import signInWithCustomToken
code = code.replace(/signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup/g, 'signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, signInWithCustomToken');

const newFunc = `
  const handlePasskeyDemo = async () => {
    if (!email) {
      setError('Por favor, introduce tu correo electrónico primero para buscar tus huellas.');
      return;
    }
    
    setIsLoading(true);
    setError('');

    try {
      const { startAuthentication } = await import('@simplewebauthn/browser');

      // 1. Obtener desafío del servidor
      const res = await fetch('/api/auth/webauthn/authenticate/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Error al conectar con el servidor biométrico');
      }
      
      const options = await res.json();

      // 2. Disparar validación nativa (Huella/Cara)
      let authResp;
      try {
        authResp = await startAuthentication(options);
      } catch (err) {
        if (err.name === 'NotAllowedError' || err.name === 'AbortError') {
          setIsLoading(false);
          return; // Cancelado por usuario
        }
        throw err;
      }

      // 3. Verificar y obtener Custom Token de Firebase
      const verifyRes = await fetch('/api/auth/webauthn/authenticate/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, authenticationResponse: authResp }),
      });
      
      if (!verifyRes.ok) {
        const errData = await verifyRes.json();
        throw new Error(errData.error || 'Verificación fallida en el servidor');
      }
      
      const data = await verifyRes.json();
      
      // 4. Mágia final: Iniciamos sesión en Firebase con el Custom Token
      await signInWithCustomToken(auth, data.customToken);
      
      setTimeout(() => router.push('/dashboard'), 500);

    } catch (err) {
      setError('Error Passkey: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };
`;

code = code.replace(/const handlePasskeyDemo = async \(\) => \{[\s\S]*?\} catch \(err: any\) \{[\s\S]*?setError\(\`Error Passkey: \$\{err\.message\}\`\);\s*\}\s*\}\s*\};\s*/, match => newFunc + '\n');

fs.writeFileSync('src/app/login/page.tsx', code);
console.log('Login Injected');
