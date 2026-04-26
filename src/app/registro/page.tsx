'use client';

import { useState } from 'react';
import Image from 'next/image';
import { auth } from '@/lib/firebase/config';
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import '../login/login.css';

export default function RegistroPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleGoogleRegister = async () => {
    setIsLoading(true);
    setError('');
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      
      // Intentar guardar el perfil en SQL
      try {
        await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uid: result.user.uid,
            email: result.user.email,
            nombre: result.user.displayName?.split(' ')[0] || '',
            apellidos: result.user.displayName?.split(' ').slice(1).join(' ') || '',
          }),
        });
      } catch (dbErr) {
        console.error('Error al crear perfil en DB:', dbErr);
      }

      router.push('/dashboard');
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



  const handleRegister = async () => {
    if (!email || !password) {
      setError('Por favor, rellena tu correo y contraseña.');
      return;
    }

    if (!acceptedPrivacy) {
      setError('Debes aceptar la Política de Privacidad para registrarte.');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // 1. Crear usuario en Firebase Auth
      const result = await createUserWithEmailAndPassword(auth, email, password);

      // 2. Guardar el perfil mínimo en SQL (como visitante)
      try {
        await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uid: result.user.uid,
            email: email,
          }),
        });
      } catch (dbErr) {
        console.error('Error al crear perfil en DB:', dbErr);
      }

      // 3. Redirigir al dashboard
      router.push('/dashboard');
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError('Ya existe una cuenta con este correo electrónico.');
      } else if (err.code === 'auth/invalid-email') {
        setError('El formato del correo electrónico no es válido.');
      } else if (err.code === 'auth/unauthorized-domain') {
        setError('Error de seguridad: Este dominio no está autorizado en Firebase.');
      } else {
        setError(`Error: ${err.code} — ${err.message}`);
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
            width={140}
            height={140}
            className="login-logo"
            priority
          />
          <p>Crea tu cuenta gratuita</p>
        </div>

        <form className="login-form" onSubmit={(e) => { e.preventDefault(); handleRegister(); }}>
          {error && <div className="error-message" style={{ whiteSpace: 'pre-wrap' }}>{error}</div>}

          <div className="input-group">
            <label htmlFor="reg-email" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Correo Electrónico</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>* Requerido</span>
            </label>
            <input
              id="reg-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              style={{ borderLeft: '3px solid var(--primary)' }}
            />
          </div>

          <div className="input-group">
            <label htmlFor="reg-password" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Contraseña</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>* Requerido</span>
            </label>
            <div className="password-wrapper">
              <input
                id="reg-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                style={{ borderLeft: '3px solid var(--primary)' }}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
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
          </div>



          <div className="checkbox-group" style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', marginTop: '0.5rem', marginBottom: '0.5rem' }}>
            <input
              type="checkbox"
              id="privacy"
              checked={acceptedPrivacy}
              onChange={(e) => setAcceptedPrivacy(e.target.checked)}
              style={{ marginTop: '0.2rem', cursor: 'pointer' }}
            />
            <label htmlFor="privacy" style={{ fontSize: '0.85rem', color: 'var(--foreground)', opacity: 0.8, lineHeight: 1.4, cursor: 'pointer' }}>
              He leído y acepto la{' '}
              <a href="/politica-privacidad" target="_blank" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'underline' }}>
                Política de Privacidad
              </a> *
            </label>
          </div>

          <button type="submit" className="login-button" disabled={isLoading}>
            {isLoading ? 'Creando cuenta...' : '🌱 Crear mi Huerto'}
          </button>

          <div className="login-divider">
            <span>o</span>
          </div>

          <button 
            type="button" 
            className="google-login-button" 
            onClick={handleGoogleRegister}
            disabled={isLoading}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Registrarse con Google
          </button>
        </form>

        <div className="login-footer">
          <p>¿Ya tienes cuenta? <a href="/login">Inicia sesión</a></p>
        </div>
      </div>
    </div>
  );
}
