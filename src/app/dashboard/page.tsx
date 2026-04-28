'use client';

import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';

interface UserProfile {
  id: number;
  nombre: string;
  apellidos: string;
  email: string;
  roles: string;
  icono: string | null;
  estadoCuenta: string;
  nombreUsuario: string | null;
}

export default function DashboardHome() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [setupMessage, setSetupMessage] = useState('');
  const router = useRouter();

  const loadProfile = async (email: string, uid: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/auth/profile?email=${encodeURIComponent(email)}`);
      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile);
        setSetupMessage('');
      } else if (res.status === 404) {
        // Usuario en Firebase pero no en MySQL → Auto-Healing
        try {
          await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uid, email, nombre: '', apellidos: '' }),
          });
          const resRetry = await fetch(`/api/auth/profile?email=${encodeURIComponent(email)}`);
          if (resRetry.ok) {
            const dataRetry = await resRetry.json();
            setProfile(dataRetry.profile);
            setSetupMessage('');
          } else {
            setSetupMessage('Estamos configurando tu huerto. Por favor, recarga la página en unos segundos.');
          }
        } catch {
          setSetupMessage('No se pudo sincronizar tu perfil con la base de datos.');
        }
      } else {
        // Error de servidor (500, timeout, etc.) → no auto-heal
        setSetupMessage('Error de conexión con el servidor. Pulsa "Reintentar" o recarga la página.');
      }
    } catch (err) {
      console.error('Error cargando perfil:', err);
      setSetupMessage('Error de red. Comprueba tu conexión y pulsa "Reintentar".');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login');
        return;
      }
      loadProfile(user.email!, user.uid);
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) return <p className="loading-text">Cargando tu huerto...</p>;

  const isSuperAdmin = profile?.roles?.includes('superadministrador');
  const displayName = profile?.nombreUsuario || profile?.nombre || auth.currentUser?.email?.split('@')[0] || 'Agricultor';

  return (
    <div className="welcome-section">
      <div className="welcome-header">
        <h1>¡Bienvenido al huerto, {displayName}! 🌿</h1>
        <p className="subtitle">
          Sesión iniciada como <strong>{auth.currentUser?.email}</strong>
          {isSuperAdmin && <> · <span style={{ color: 'var(--danger)', fontWeight: 800 }}>🛡️ SUPERADMIN</span></>}
        </p>
      </div>

      {/* Onboarding Call to Action */}
      {profile && (!auth.currentUser?.emailVerified || !profile.nombre) && (
        <div className="card-storm" style={{ 
          background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', 
          color: '#064e3b', 
          border: '2px solid #22c55e',
          padding: '2rem',
          marginBottom: '2rem',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 10px 25px rgba(34, 197, 94, 0.15)'
        }}>
          <div style={{ position: 'absolute', top: '-20px', right: '-10px', fontSize: '8rem', opacity: 0.1, transform: 'rotate(15deg)' }}>🌟</div>
          
          <h2 style={{ color: '#15803d', fontSize: '1.4rem', marginTop: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>🌱</span> ¡Bienvenido! Tu huerto te espera
          </h2>

          <p style={{ lineHeight: 1.6, color: '#166534', fontSize: '0.95rem' }}>
            Actualmente tienes acceso al <strong>Plan Básico Gratuito</strong>, que es permanente y sin compromiso. Con él puedes:
          </p>
          <ul style={{ color: '#14532d', fontSize: '0.9rem', marginBottom: '15px', paddingLeft: '20px', lineHeight: 1.7 }}>
            <li>🌱 Gestionar hasta <strong>10 plantas activas</strong></li>
            <li>📷 Subir <strong>1 foto de perfil</strong></li>
            <li>🔄 Publicar <strong>1 oferta de intercambio</strong> de semillas</li>
            <li>💬 Participar en el chat de la comunidad</li>
          </ul>

          <div style={{ 
            background: 'rgba(255,255,255,0.7)', 
            borderRadius: '12px', 
            padding: '16px', 
            border: '1px solid rgba(34, 197, 94, 0.3)',
            marginBottom: '20px'
          }}>
            <h3 style={{ color: '#d97706', fontSize: '1.1rem', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🚀</span> ¡Desbloquea 2 meses de Premium GRATIS!
            </h3>
            <p style={{ lineHeight: 1.6, color: '#166534', fontSize: '0.9rem', margin: 0 }}>
              Solo necesitas <strong>completar tus datos básicos</strong> (nombre, ubicación, fecha de nacimiento) y <strong>verificar tu correo</strong>. Así activarás automáticamente el <strong>periodo de prueba Premium</strong> durante 2 meses completos, sin pedirte tarjeta ni cobro alguno. Al finalizar, tu cuenta vuelve al plan Básico sin perder ningún dato.
            </p>
          </div>
          
          <style>{`
            @keyframes pulseCTA {
              0% { box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4), 0 0 0 0 rgba(16, 185, 129, 0.6); }
              70% { box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4), 0 0 0 15px rgba(16, 185, 129, 0); }
              100% { box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4), 0 0 0 0 rgba(16, 185, 129, 0); }
            }
          `}</style>
          
          <button 
            onClick={() => router.push('/dashboard/perfil')}
            type="button"
            style={{ 
              background: 'linear-gradient(to right, #10b981, #059669)', 
              color: 'white', 
              border: 'none', 
              padding: '12px 24px', 
              borderRadius: '8px', 
              fontWeight: 700, 
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              animation: 'pulseCTA 2s infinite',
              transition: 'transform 0.2s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            Completar mi Perfil y Activar Premium ➔
          </button>
        </div>
      )}

      {/* Mensaje de estado si hay problemas de sincronización */}
      {setupMessage && !profile && (
        <div className="status-message glass" style={{ padding: '1.5rem', borderLeft: '4px solid var(--primary)', marginBottom: '2rem' }}>
          <p>{setupMessage}</p>
          <button 
            type="button"
            onClick={() => {
              const user = auth.currentUser;
              if (user) loadProfile(user.email!, user.uid);
            }}
            style={{ 
              marginTop: '10px', padding: '8px 20px', borderRadius: '8px', 
              background: 'var(--primary)', color: 'white', border: 'none', 
              cursor: 'pointer', fontWeight: 700 
            }}
          >
            🔄 Reintentar
          </button>
        </div>
      )}

      {/* Tarjetas de estadísticas */}
      {profile && (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="card-icon">🌱</div>
              <div className="card-info">
                <h3>Plantas Activas</h3>
                <div className="value">—</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="card-icon">📦</div>
              <div className="card-info">
                <h3>Semillas en Inventario</h3>
                <div className="value">—</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="card-icon">📋</div>
              <div className="card-info">
                <h3>Tareas Pendientes</h3>
                <div className="value">—</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="card-icon">🌡️</div>
              <div className="card-info">
                <h3>Meteo Local</h3>
                <div className="value">—</div>
              </div>
            </div>
          </div>

          {/* Vitrina de Logros (Mockup Visual) */}
          <div className="logros-section" style={{ marginTop: '2rem', padding: '1.5rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', boxShadow: 'var(--glass-shadow)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', margin: 0 }}>🏆 Mis Logros</h2>
              <a href="/dashboard/perfil" style={{ fontSize: '0.85rem', color: 'var(--storm-primary)', textDecoration: 'none', fontWeight: 600 }}>Ver todos →</a>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              {/* Logro Desbloqueado */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', width: '100px', textAlign: 'center' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'linear-gradient(135deg, #fef3c7, #fde68a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', border: '3px solid #f59e0b', boxShadow: '0 4px 6px -1px rgba(245, 158, 11, 0.2)' }}>
                  {profile.roles?.includes('visitante') ? '🧳' : '🧑‍🌾'}
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block' }}>{profile.roles?.includes('visitante') ? 'Visitante' : 'Aprendiz'}</span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Desbloqueado</span>
                </div>
              </div>

              {/* Logro Bloqueado 1 */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', width: '100px', textAlign: 'center', opacity: 0.5, filter: 'grayscale(100%)' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', border: '3px solid #cbd5e1' }}>
                  🌱
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block' }}>Primer Brote</span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Bloqueado</span>
                </div>
              </div>

              {/* Logro Bloqueado 2 */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', width: '100px', textAlign: 'center', opacity: 0.5, filter: 'grayscale(100%)' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', border: '3px solid #cbd5e1' }}>
                  🌤️
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block' }}>Meteorólogo</span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Bloqueado</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
