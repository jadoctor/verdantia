import React from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase/config';
import { signOut } from 'firebase/auth';
import { useProfileData } from '../hooks/useProfileData';
import PremiumSubheader from '@/components/ui/PremiumSubheader';
import PremiumDevInsights from '@/components/ui/PremiumDevInsights';

interface ProfileHeaderProps {
  profileData: ReturnType<typeof useProfileData>;
  onBackToInicio: () => void;
}

export function ProfileHeader({ profileData, onBackToInicio }: ProfileHeaderProps) {
  const router = useRouter();
  const { profile, nombre, apellidos, nombreUsuario, saving } = profileData;
  if (!profile) return null;

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (e) {
      console.error('Error al cerrar sesión', e);
    }
  };

  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

  return (
    <>
      {/* ── Navegación Hierárquica Superior ── */}
      <div style={{ marginBottom: '16px', padding: '0 4px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={onBackToInicio}
          style={{
            background: 'white',
            border: '1px solid #cbd5e1',
            color: '#475569',
            padding: '6px 14px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '0.85rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s'
          }}
        >
          🏠 Volver al Inicio
        </button>
      </div>

      {/* ── Encabezado Premium Contextual ── */}
      <PremiumSubheader
        title={
          <>
            {profile.icono && !profile.icono.startsWith('mdi-') ? profile.icono : '👤'} {nombre || 'Mi Perfil'} {apellidos || ''}
          </>
        }
        isMobile={isMobile}
        actions={
          <>
            <button
              onClick={handleLogout}
              style={{
                background: 'rgba(255, 255, 255, 0.95)',
                color: '#dc2626',
                border: 'none',
                borderRadius: '12px',
                padding: '8px 16px',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                e.currentTarget.style.boxShadow = '0 6px 12px rgba(0,0,0,0.15)';
                e.currentTarget.style.background = '#ffffff';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.95)';
              }}
            >
              🚪 Cerrar Sesión
            </button>
          </>
        }
      >
        <PremiumDevInsights modulePath="dashboard/perfil/page.tsx" />
      </PremiumSubheader>
    </>
  );
}
