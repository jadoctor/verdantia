'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase/config';
import { onAuthStateChanged, sendEmailVerification } from 'firebase/auth';

const PAISES = [
  'España', 'Andorra', 'Argentina', 'Bolivia', 'Brasil', 'Chile', 'Colombia',
  'Costa Rica', 'Cuba', 'Ecuador', 'El Salvador', 'Estados Unidos', 'Guatemala',
  'Honduras', 'México', 'Nicaragua', 'Panamá', 'Paraguay', 'Perú', 'Portugal',
  'Puerto Rico', 'República Dominicana', 'Uruguay', 'Venezuela', 'Otro...'
];

export default function OnboardingPremium() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState<number | null>(null);

  // Campos
  const [nombre, setNombre] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  
  const [pais, setPais] = useState('España');
  const [codigoPostal, setCodigoPostal] = useState('');
  const [poblacion, setPoblacion] = useState('');

  // Autocomplete Location
  const [cpSuggestions, setCpSuggestions] = useState<{cp: string; ciudad: string}[]>([]);
  const [ciudadSuggestions, setCiudadSuggestions] = useState<{cp: string; ciudad: string}[]>([]);
  const [showCpDropdown, setShowCpDropdown] = useState(false);
  const [showCiudadDropdown, setShowCiudadDropdown] = useState(false);
  const cpTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const ciudadTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Verificación Email
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login');
        return;
      }
      
      try {
        const res = await fetch(`/api/auth/profile?email=${encodeURIComponent(user.email!)}`);
        if (res.ok) {
          const data = await res.json();
          const p = data.profile;
          setUserId(p.id);
          if (p.nombre) setNombre(p.nombre);
          if (p.fechaNacimiento) setFechaNacimiento(p.fechaNacimiento.split('T')[0]);
          if (p.pais) setPais(p.pais);
          if (p.codigoPostal) setCodigoPostal(p.codigoPostal);
          if (p.poblacion) setPoblacion(p.poblacion);
        }
      } catch (err) {
        console.error("Error loading profile:", err);
      }
      setLoading(false);
    });
    return () => unsub();
  }, [router]);

  const searchLocation = async (query: string, type: 'cp' | 'ciudad') => {
    try {
      const res = await fetch(`/api/location/search?q=${encodeURIComponent(query)}&type=${type}`);
      const data = await res.json();
      if (type === 'cp') { 
        setCpSuggestions(data.results); 
        setShowCpDropdown(data.results.length > 0);
      } else { 
        setCiudadSuggestions(data.results); 
        setShowCiudadDropdown(data.results.length > 0);
      }
    } catch { /* ignore */ }
  };

  const handleNextStep = async () => {
    setError('');
    if (step === 2) {
      if (!nombre.trim() || !fechaNacimiento) {
        setError('Por favor, completa tu nombre y fecha de nacimiento.');
        return;
      }
    }
    if (step === 3) {
      if (!pais || !codigoPostal.trim() || !poblacion.trim()) {
        setError('Por favor, completa tu país, código postal y población.');
        return;
      }
      await guardarDatos(); // Guardar al pasar del 3 al 4
      
      // Enviar correo automáticamente al llegar al paso 4
      if (auth.currentUser && !auth.currentUser.emailVerified && !emailSent) {
        await enviarCorreo();
      }
    }
    setStep(prev => prev + 1);
  };

  const guardarDatos = async () => {
    if (!userId) return;
    setSaving(true);
    try {
      await fetch('/api/perfil', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: auth.currentUser?.email,
          nombre,
          fechaNacimiento,
          pais,
          codigoPostal,
          poblacion
        })
      });
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const enviarCorreo = async () => {
    if (auth.currentUser && !auth.currentUser.emailVerified) {
      setSaving(true);
      try {
        // Intentar usar la API personalizada (Resend) primero
        const res = await fetch('/api/auth/send-verification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: auth.currentUser.email, nombre: nombre || 'Usuario' }),
        });
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error || 'Error desconocido de la API');
        }
        
        setEmailSent(true);
      } catch (err: any) {
        console.warn('Fallo en Resend, usando fallback de Firebase:', err);
        // Fallback a la verificación nativa de Firebase si no hay API Key o falla Resend
        try {
          await sendEmailVerification(auth.currentUser);
          setEmailSent(true);
        } catch (fbErr: any) {
          console.error('Fallo en el fallback de Firebase:', fbErr);
          setError(`No se pudo enviar el correo: ${fbErr.message || err.message}`);
        }
      }
      setSaving(false);
    }
  };

  const comprobarVerificacion = async () => {
    if (!auth.currentUser) return;
    setSaving(true);
    setError('');
    await auth.currentUser.reload();
    
    if (auth.currentUser.emailVerified) {
      // Registrar activación en BD
      try {
        await fetch('/api/auth/on-verified', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            email: auth.currentUser.email,
            uid: auth.currentUser.uid 
          })
        });
        setStep(5);
        setTimeout(() => router.push('/dashboard'), 3000);
      } catch (err) {
        console.error(err);
        setError('Hubo un error activando tu cuenta.');
      }
    } else {
      setError('El correo aún no ha sido verificado. Revisa tu bandeja de entrada o Spam.');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <p style={{ color: '#64748b', fontSize: '1.2rem', fontWeight: 600 }}>Preparando asistente...</p>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      background: 'url(/images/background-pattern.svg) center/cover, linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
    }}>
      <style>{`
        .wizard-card {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.4);
          border-radius: 24px;
          padding: 40px;
          max-width: 600px;
          width: 100%;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0,0,0,0.05);
          animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .wizard-input {
          width: 100%;
          padding: 14px 16px;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          font-size: 1rem;
          color: #334155;
          transition: all 0.2s;
          background: rgba(255, 255, 255, 0.9);
        }
        .wizard-input:focus {
          outline: none;
          border-color: #10b981;
          box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1);
        }
        .wizard-btn {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          border: none;
          padding: 16px 32px;
          font-size: 1.1rem;
          font-weight: 700;
          border-radius: 14px;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
          box-shadow: 0 4px 14px rgba(16, 185, 129, 0.3);
          width: 100%;
        }
        .wizard-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
        }
        .wizard-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }
        .explanation {
          background: #f8fafc;
          border-left: 4px solid #3b82f6;
          padding: 16px;
          border-radius: 0 12px 12px 0;
          font-size: 0.9rem;
          color: #475569;
          margin-bottom: 24px;
          line-height: 1.5;
        }
      `}</style>

      <div className="wizard-card">
        {/* PROGRESS INDICATOR */}
        {step < 5 && (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '32px' }}>
            {[1, 2, 3, 4].map(s => (
              <div key={s} style={{
                height: '6px',
                flex: 1,
                borderRadius: '3px',
                background: s <= step ? '#10b981' : '#e2e8f0',
                transition: 'background 0.3s ease'
              }} />
            ))}
          </div>
        )}

        {/* STEP 1: WELCOME */}
        {step === 1 && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🚀</div>
            <h1 style={{ color: '#0f172a', fontSize: '2rem', marginBottom: '16px', fontWeight: 800 }}>
              ¡Desbloquea tu mes Premium!
            </h1>
            <p style={{ color: '#475569', fontSize: '1.1rem', lineHeight: 1.6, marginBottom: '32px' }}>
              Para activar tus 30 días gratuitos, solo necesitamos conocerte un poco mejor y comprobar que eres una persona real (verificando tu correo).
              <br/><br/>
              <strong style={{ color: '#b45309', background: '#fef3c7', padding: '6px 12px', borderRadius: '8px', display: 'inline-block' }}>
                💳 No pedimos tarjeta de crédito ni habrá cobros automáticos.
              </strong>
            </p>
            <button className="wizard-btn" onClick={handleNextStep}>
              Comenzar Asistente ➔
            </button>
            <button onClick={() => router.push('/dashboard')} style={{ background: 'transparent', border: 'none', color: '#64748b', marginTop: '16px', cursor: 'pointer', fontWeight: 600 }}>
              Saltar y volver al huerto
            </button>
          </div>
        )}

        {/* STEP 2: PERSONAL */}
        {step === 2 && (
          <div style={{ animation: 'slideUp 0.4s' }}>
            <h2 style={{ color: '#0f172a', fontSize: '1.6rem', marginBottom: '16px', fontWeight: 800 }}>
              Sobre ti 🌱
            </h2>
            
            <div className="explanation">
              <strong>¿Por qué pedimos esto?</strong> Queremos saber cómo llamarte en el huerto. Además, la fecha de nacimiento es obligatoria por ley para asegurar que tienes edad suficiente para usar la red social, ¡y nos servirá para prepararte un regalo por tu cumpleaños! 🎁
            </div>

            {error && <div style={{ color: '#ef4444', marginBottom: '16px', fontWeight: 600 }}>{error}</div>}

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#334155', fontWeight: 600 }}>Nombre *</label>
              <input type="text" className="wizard-input" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Laura" />
            </div>

            <div style={{ marginBottom: '32px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#334155', fontWeight: 600 }}>Fecha de Nacimiento *</label>
              <input type="date" className="wizard-input" value={fechaNacimiento} onChange={e => setFechaNacimiento(e.target.value)} max={new Date().toISOString().split("T")[0]} />
            </div>

            <button className="wizard-btn" onClick={handleNextStep}>Continuar</button>
          </div>
        )}

        {/* STEP 3: LOCATION */}
        {step === 3 && (
          <div style={{ animation: 'slideUp 0.4s' }}>
            <h2 style={{ color: '#0f172a', fontSize: '1.6rem', marginBottom: '16px', fontWeight: 800 }}>
              Tu Ubicación 📍
            </h2>
            
            <div className="explanation">
              <strong>¿Por qué pedimos esto?</strong> Verdantia utiliza inteligencia artificial y un asistente meteorológico para enviarte alertas de heladas, calor extremo y recomendarte el mejor momento para sembrar según tu zona climática.
            </div>

            {error && <div style={{ color: '#ef4444', marginBottom: '16px', fontWeight: 600 }}>{error}</div>}

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#334155', fontWeight: 600 }}>País *</label>
              <select className="wizard-input" value={pais} onChange={e => setPais(e.target.value)}>
                <option value="">Selecciona tu país...</option>
                {PAISES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#334155', fontWeight: 600 }}>Código Postal *</label>
                <input 
                  type="text" className="wizard-input" value={codigoPostal} 
                  onChange={e => {
                    setCodigoPostal(e.target.value);
                    if(cpTimeoutRef.current) clearTimeout(cpTimeoutRef.current);
                    cpTimeoutRef.current = setTimeout(() => searchLocation(e.target.value, 'cp'), 500);
                  }} 
                  onBlur={() => setTimeout(() => setShowCpDropdown(false), 200)}
                  onFocus={() => { if (cpSuggestions.length > 0) setShowCpDropdown(true); }}
                  placeholder="Ej: 28001" 
                />
                {showCpDropdown && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', zIndex: 10, maxHeight: '200px', overflowY: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                    {cpSuggestions.map((s, i) => (
                      <div key={i} onClick={() => { setCodigoPostal(s.cp); setPoblacion(s.ciudad); setShowCpDropdown(false); }} style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}>
                        <strong>{s.cp}</strong> - {s.ciudad}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div style={{ flex: 1, position: 'relative' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#334155', fontWeight: 600 }}>Población *</label>
                <input 
                  type="text" className="wizard-input" value={poblacion} 
                  onChange={e => {
                    setPoblacion(e.target.value);
                    if(ciudadTimeoutRef.current) clearTimeout(ciudadTimeoutRef.current);
                    ciudadTimeoutRef.current = setTimeout(() => searchLocation(e.target.value, 'ciudad'), 500);
                  }}
                  onBlur={() => setTimeout(() => setShowCiudadDropdown(false), 200)}
                  onFocus={() => { if (ciudadSuggestions.length > 0) setShowCiudadDropdown(true); }}
                  placeholder="Ej: Madrid" 
                />
                {showCiudadDropdown && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', zIndex: 10, maxHeight: '200px', overflowY: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                    {ciudadSuggestions.map((s, i) => (
                      <div key={i} onClick={() => { setCodigoPostal(s.cp); setPoblacion(s.ciudad); setShowCiudadDropdown(false); }} style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}>
                        {s.ciudad} ({s.cp})
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button className="wizard-btn" onClick={handleNextStep} disabled={saving}>
              {saving ? 'Guardando y enviando correo...' : `Verificar correo: ${auth.currentUser?.email || ''}`}
            </button>
            <button onClick={() => setStep(2)} style={{ background: 'transparent', border: 'none', color: '#64748b', marginTop: '16px', cursor: 'pointer', fontWeight: 600, width: '100%' }}>
              ← Volver atrás
            </button>
          </div>
        )}

        {/* STEP 4: VERIFICATION */}
        {step === 4 && (
          <div style={{ animation: 'slideUp 0.4s', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>✉️</div>
            <h2 style={{ color: '#0f172a', fontSize: '1.6rem', marginBottom: '16px', fontWeight: 800 }}>
              Ya casi terminamos
            </h2>
            
            <p style={{ color: '#475569', fontSize: '1.05rem', lineHeight: 1.6, marginBottom: '24px' }}>
              Para activar el Premium y asegurar que eres una persona real, verifica tu cuenta pulsando en el enlace que enviamos a <strong>{auth.currentUser?.email}</strong>.
            </p>

            {error && <div style={{ color: '#ef4444', marginBottom: '16px', fontWeight: 600, background: '#fef2f2', padding: '12px', borderRadius: '8px' }}>{error}</div>}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button className="wizard-btn" onClick={comprobarVerificacion} disabled={saving}>
                {saving ? 'Comprobando...' : '✅ Ya he hecho clic en el enlace'}
              </button>
              
              <button 
                onClick={enviarCorreo} 
                disabled={saving || emailSent}
                style={{ background: emailSent ? '#f1f5f9' : 'white', color: emailSent ? '#94a3b8' : '#3b82f6', border: '2px solid', borderColor: emailSent ? '#e2e8f0' : '#bfdbfe', padding: '14px', borderRadius: '12px', fontWeight: 700, cursor: emailSent ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}
              >
                {emailSent ? 'Correo enviado' : 'Reenviar correo de verificación'}
              </button>
            </div>
            
            <button onClick={() => setStep(3)} style={{ background: 'transparent', border: 'none', color: '#64748b', marginTop: '24px', cursor: 'pointer', fontWeight: 600 }}>
              ← Volver atrás
            </button>
          </div>
        )}

        {/* STEP 5: SUCCESS */}
        {step === 5 && (
          <div style={{ animation: 'slideUp 0.4s', textAlign: 'center' }}>
            <div style={{ fontSize: '5rem', marginBottom: '16px', animation: 'bounce 2s infinite' }}>👑</div>
            <h2 style={{ color: '#059669', fontSize: '2rem', marginBottom: '16px', fontWeight: 800 }}>
              ¡Todo listo, {nombre}!
            </h2>
            <p style={{ color: '#334155', fontSize: '1.1rem', lineHeight: 1.6, marginBottom: '32px' }}>
              Tu perfil está completo y has desbloqueado tu mes de Premium. Disfruta de herramientas avanzadas para tu huerto.
            </p>
            <div className="loading-spinner" style={{ margin: '0 auto', width: '30px', height: '30px', borderTopColor: '#059669' }} />
            <p style={{ marginTop: '16px', color: '#64748b', fontSize: '0.9rem' }}>Redirigiendo a tu huerto...</p>
            
            <style>{`
              @keyframes bounce {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-10px); }
              }
              .loading-spinner {
                border: 3px solid rgba(0,0,0,0.1);
                border-radius: 50%;
                border-top: 3px solid #059669;
                width: 30px;
                height: 30px;
                animation: spin 1s linear infinite;
              }
              @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            `}</style>
          </div>
        )}
      </div>
    </div>
  );
}
