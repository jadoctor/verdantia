'use client';

import { useState } from 'react';
import { auth } from '@/lib/firebase/config';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import './login.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [debug, setDebug] = useState('');
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Por favor, rellena todos los campos.');
      return;
    }

    setIsLoading(true);
    setError('');
    setDebug('Conectando con Firebase...');

    try {
      setDebug('Enviando credenciales...');
      const result = await signInWithEmailAndPassword(auth, email, password);
      setDebug(`¡Login OK! UID: ${result.user.uid}. Redirigiendo...`);
      // Tras el login exitoso, redirigimos al dashboard
      setTimeout(() => router.push('/dashboard'), 500);
    } catch (err: any) {
      setDebug(`Error capturado: code=${err.code}, message=${err.message}`);
      if (err.code === 'auth/invalid-credential') {
        setError('El correo o la contraseña no son correctos.');
      } else if (err.code === 'auth/unauthorized-domain') {
        setError('Error de seguridad: Este dominio no está autorizado en Firebase. Ve a Firebase Console → Authentication → Settings → Authorized domains y añade el dominio de esta web.');
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
          <h1>Verdantia</h1>
          <p>Tu huerto inteligente, ahora en la nube</p>
        </div>

        {/* SIN <form> para evitar que el navegador recargue la página */}
        <div className="login-form">
          {error && <div className="error-message" style={{ whiteSpace: 'pre-wrap' }}>{error}</div>}
          {debug && <div style={{ padding: '0.5rem', borderRadius: '6px', background: '#e0f2fe', color: '#0369a1', fontSize: '0.8rem', marginBottom: '0.5rem' }}>{debug}</div>}

          <div className="input-group">
            <label htmlFor="email">Correo Electrónico</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="agricultor@verdantia.life"
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              onKeyDown={(e) => { if (e.key === 'Enter') handleLogin(); }}
            />
          </div>

          <button type="button" className="login-button" disabled={isLoading} onClick={handleLogin}>
            {isLoading ? 'Conectando...' : 'Entrar al Huerto'}
          </button>
        </div>
        
        <div className="login-footer">
          <p>¿No tienes cuenta? <a href="/registro">Regístrate gratis</a></p>
        </div>
      </div>
    </div>
  );
}
