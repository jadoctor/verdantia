'use client';

import { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import { auth } from '@/lib/firebase/config';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, signInWithCustomToken } from 'firebase/auth';
import { useRouter, useSearchParams } from 'next/navigation';
import './login.css';

function LoginContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetError, setResetError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  // Pre-rellenar el email si viene de un enlace de restablecimiento de contraseña
  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  const handleForgotPassword = async () => {
    const eInput = document.getElementById('email') as HTMLInputElement;
    const currentEmail = eInput?.value || email;
    setEmail(currentEmail);
    if (!currentEmail) {
      setError('Introduce tu correo electrónico para recuperar la contraseña.');
      return;
    }
    try {
      const res = await fetch('/api/auth/send-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: currentEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResetError(data.error || 'Error al enviar el correo de recuperación.');
      } else {
        setResetSent(true);
        setResetError('');
        setError('');
      }
    } catch {
      setResetError('Error de conexión al enviar el correo de recuperación.');
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError('');
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      setTimeout(() => router.push('/dashboard'), 500);
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        setError('');
      } else if (err.code === 'auth/unauthorized-domain') {
        setError('Error de seguridad: Este dominio no está autorizado en Firebase.');
      } else {
        setError(`Error: ${err.code} — ${err.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  
  const handlePasskeyDemo = async () => {
    const eInput = document.getElementById('email') as HTMLInputElement;
    const currentEmail = eInput?.value || email;
    setEmail(currentEmail);
    if (!currentEmail) {
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
        body: JSON.stringify({ email: currentEmail }),
      });
      
      if (!res.ok) {
        const errData = await res.json();
        // Error legible según código HTTP
        if (res.status === 404) {
          throw new Error('No tienes ninguna huella digital registrada para esta cuenta. Ve a Tu Perfil → Seguridad para registrar una.');
        }
        throw new Error(errData.error || 'El servidor no pudo generar el desafío biométrico');
      }
      
      const options = await res.json();

      // 2. Disparar validación nativa (Huella/FaceID/PIN)
      // SimpleWebAuthn v8+ acepta { optionsJSON } — v7 acepta el objeto directo
      // Intentamos v8 primero, fallback a v7
      let authResp;
      try {
        try {
          authResp = await (startAuthentication as any)({ optionsJSON: options });
        } catch {
          authResp = await (startAuthentication as any)(options);
        }
      } catch (err: any) {
        if (err.name === 'NotAllowedError') {
          setIsLoading(false);
          setError('No se ha encontrado una passkey válida para este dominio y este dispositivo. Si la registraste en local o en otro dominio, vuelve a vincularla desde Tu Perfil → Seguridad usando la web online.');
          return;
        }
        if (err.name === 'AbortError') {
          setIsLoading(false);
          return; // Cancelado por usuario, sin mensaje
        }
        if (err.name === 'InvalidStateError') {
          throw new Error('Este authenticator ya está registrado pero no coincide con la credencial esperada.');
        }
        throw new Error(`Error biométrico del dispositivo (${err.name}): ${err.message}`);
      }

      // 3. Verificar en servidor
      const verifyRes = await fetch('/api/auth/webauthn/authenticate/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: currentEmail, authenticationResponse: authResp }),
      });
      
      if (!verifyRes.ok) {
        const errData = await verifyRes.json();
        if (verifyRes.status === 404) {
          throw new Error('La huella se validó en el dispositivo pero no coincide con ninguna registrada en el servidor. Prueba a volver a registrar la huella en Tu Perfil → Seguridad.');
        }
        throw new Error(errData.error || 'La verificación biométrica falló en el servidor');
      }
      
      const data = await verifyRes.json();
      
      // 4. Iniciar sesión en Firebase con Custom Token
      await signInWithCustomToken(auth, data.customToken);
      setTimeout(() => router.push('/dashboard'), 500);

    } catch (err: any) {
      setError(err.message || 'Error desconocido con Passkey');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    // SYNC DOM -> REACT STATE (Parche Autocompletado Móvil)
    const eInput = document.getElementById('email') as HTMLInputElement;
    const pInput = document.getElementById('password') as HTMLInputElement;
    const finalEmail = eInput?.value || email;
    const finalPassword = pInput?.value || password;

    // Actualizamos el estado interno por si acaso
    setEmail(finalEmail);
    setPassword(finalPassword);

    if (!finalEmail || !finalPassword) {
      setError('Por favor, rellena todos los campos.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await signInWithEmailAndPassword(auth, finalEmail, finalPassword);
      // Tras el login exitoso, redirigimos al dashboard
      setTimeout(() => router.push('/dashboard'), 500);
    } catch (err: any) {
      console.error('[Login] Firebase error:', err.code, err.message);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        setError('La contraseña no es correcta. Si la cambiaste recientemente, usa la nueva.');
      } else if (err.code === 'auth/user-not-found') {
        setError('No existe ninguna cuenta con ese correo electrónico.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Demasiados intentos fallidos. Espera unos minutos o recupera tu contraseña.');
      } else if (err.code === 'auth/unauthorized-domain') {
        setError('Error de seguridad: Este dominio no está autorizado en Firebase. Ve a Firebase Console → Authentication → Settings → Authorized domains y añade el dominio de esta web.');
      } else if (err.code === 'auth/invalid-email') {
        setError('El formato del correo electrónico no es válido.');
      } else {
        setError(`Error de Firebase: ${err.code} — ${err.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="glass login-box">
        <div className="login-header">
          <Image
            src="/logo-verdantia.jpg"
            alt="Verdantia — Cultiva & Comparte Semillas"
            width={180}
            height={180}
            className="login-logo"
            priority
          />
          <p>Tu huerto inteligente, ahora en la nube (v7)</p>
        </div>

        <div className="login-form" onKeyDown={(e) => { if (e.key === 'Enter') handleLogin(); }}>
          {error && <div className="error-message" style={{ whiteSpace: 'pre-wrap' }}>{error}</div>}

          <div className="input-group">
            <label htmlFor="email">Correo Electrónico</label>
            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onInput={(e) => setEmail(e.currentTarget.value)}
              placeholder="correo@ejemplo.com"
              autoComplete="email"
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">Contraseña</label>
            <div className="password-wrapper">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onInput={(e) => setPassword(e.currentTarget.value)}
                placeholder="Escribe tu contraseña..."
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={(e) => { 
                  e.preventDefault(); 
                  const pInput = document.getElementById('password') as HTMLInputElement;
                  if (pInput?.value) {
                    setPassword(pInput.value);
                  }
                  setShowPassword(!showPassword); 
                }}
                onPointerDown={(e) => e.preventDefault()}
                tabIndex={-1}
                title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" y1="2" x2="22" y2="22" /></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
                )}
              </button>
            </div>
            <div style={{ textAlign: 'right', marginTop: '4px' }}>
              {resetSent ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
                  <span style={{ color: '#10b981', fontSize: '0.82rem', fontWeight: 600 }}>📧 Correo enviado. Revisa tu bandeja.</span>
                  <button
                    type="button"
                    onClick={() => { setResetSent(false); handleForgotPassword(); }}
                    style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.78rem', cursor: 'pointer', textDecoration: 'underline', padding: 0, fontWeight: 500 }}
                  >
                    Volver a enviar correo de recuperación
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.82rem', cursor: 'pointer', textDecoration: 'underline', padding: 0, fontWeight: 500 }}
                >
                  ¿Has olvidado tu contraseña?
                </button>
              )}
              {resetError && <div style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px' }}>{resetError}</div>}
            </div>
          </div>

          <button type="button" className="login-button" disabled={isLoading} onClick={(e) => { e.preventDefault(); handleLogin(); }}>
            {isLoading ? 'Conectando...' : 'Entrar al Huerto'}
          </button>

          {/* BOTÓN MÁGICO PARA DESARROLLADOR */}
          <button 
            type="button" 
            className="login-button" 
            style={{ marginTop: '10px', background: '#10b981', border: '2px dashed white' }}
            onClick={(e) => { 
              e.preventDefault(); 
              setIsLoading(true);
              signInWithEmailAndPassword(auth, 'jaillueca@gmail.com', 'Papaja0334')
                .then(() => {
                  alert('¡Login correcto! Redirigiendo al dashboard...');
                  window.location.href = '/dashboard';
                })
                .catch(err => { 
                  alert('Fallo Firebase: ' + err.message);
                  setError(err.message); 
                  setIsLoading(false); 
                });
            }}
            disabled={isLoading}
          >
            🚀 Entrar Directo (Modo Dev)
          </button>
          
          <div className="login-divider">
            <span>o</span>
          </div>

          <button 
            type="button" 
            className="google-login-button" 
            onClick={handleGoogleLogin}
            disabled={isLoading}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Entrar con Google
          </button>

          <button 
            type="button" 
            className="google-login-button" 
            onClick={handlePasskeyDemo}
            style={{ marginTop: '10px', background: '#f8fafc', color: '#1e293b', border: '1px solid #cbd5e1' }}
          >
            <span style={{ fontSize: '1.2rem' }}>👁️</span> Entrar con Huella (Passkey)
          </button>
        </div>
        
        <div className="login-footer">
          <p>¿No tienes cuenta? <a href="/registro">Regístrate gratis</a></p>
          <div style={{ marginTop: '1.5rem', fontSize: '0.85rem' }}>
            <a href="/politica-privacidad" style={{ color: 'var(--foreground)', opacity: 0.7, textDecoration: 'underline' }}>Política de Privacidad</a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Cargando...</div>}>
      <LoginContent />
    </Suspense>
  );
}
