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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login');
        return;
      }

      // Buscar perfil en Cloud SQL
      try {
        const res = await fetch(`/api/auth/profile?email=${encodeURIComponent(user.email!)}`);
        if (res.ok) {
          const data = await res.json();
          setProfile(data.profile);
        } else {
          // Usuario no existe en MySQL: mostrar mensaje
          setSetupMessage(`Tu email (${user.email}) no está registrado en la base de datos. Usa el botón de abajo para crear tu perfil.`);
        }
      } catch (err) {
        console.error('Error cargando perfil:', err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleSetupAdmin = async () => {
    const user = auth.currentUser;
    if (!user?.email) return;

    try {
      const res = await fetch(`/api/setup-admin?email=${encodeURIComponent(user.email)}`);
      const data = await res.json();
      if (data.success) {
        setSetupMessage(`✅ ${data.message}. Recargando...`);
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setSetupMessage(`❌ Error: ${data.error}`);
      }
    } catch (err: any) {
      setSetupMessage(`❌ Error de conexión: ${err.message}`);
    }
  };

  if (loading) return <p>Cargando tu huerto...</p>;

  const isSuperAdmin = profile?.roles?.includes('superadministrador');
  const displayName = profile?.nombreUsuario || profile?.nombre || auth.currentUser?.email || 'Agricultor';

  return (
    <div className="welcome-section">
      <h1>¡Bienvenido de vuelta, {displayName}!</h1>
      <p className="subtitle">
        Sesión iniciada como <strong>{auth.currentUser?.email}</strong>
        {isSuperAdmin && <> · <span style={{ color: '#9f1239', fontWeight: 800 }}>🛡️ SUPERADMINISTRADOR</span></>}
      </p>

      {/* Si el perfil NO existe en MySQL, mostrar botón de configuración */}
      {!profile && (
        <div style={{ marginBottom: '2rem', padding: '1.5rem', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
          <p style={{ marginBottom: '1rem', color: '#92400e', fontWeight: 600 }}>{setupMessage || 'Tu perfil no está vinculado en la base de datos.'}</p>
          <button
            onClick={handleSetupAdmin}
            style={{ padding: '0.8rem 2rem', background: 'linear-gradient(135deg, #9f1239, #be123c)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }}
          >
            🛡️ Crear perfil Superadministrador
          </button>
        </div>
      )}

      {/* Tarjetas de estadísticas */}
      {profile && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="card-icon">🌱</div>
            <h3>Plantas Activas</h3>
            <div className="value">—</div>
          </div>
          <div className="stat-card">
            <div className="card-icon">📦</div>
            <h3>Semillas en Inventario</h3>
            <div className="value">—</div>
          </div>
          <div className="stat-card">
            <div className="card-icon">📋</div>
            <h3>Tareas Pendientes</h3>
            <div className="value">—</div>
          </div>
          <div className="stat-card">
            <div className="card-icon">🌡️</div>
            <h3>Meteo Local</h3>
            <div className="value">—</div>
          </div>
        </div>
      )}

      {/* Panel de depuración técnica (temporal) */}
      {profile && (
        <div className="debug-profile">
          <strong>🔍 Debug — Perfil cargado desde Cloud SQL:</strong>
          <code>{JSON.stringify(profile, null, 2)}</code>
        </div>
      )}
    </div>
  );
}
