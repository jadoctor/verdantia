import React from 'react';
import { useProfileData } from '../hooks/useProfileData';

interface ProfileHeaderProps {
  profileData: ReturnType<typeof useProfileData>;
  onBackToInicio: () => void;
}

export function ProfileHeader({ profileData, onBackToInicio }: ProfileHeaderProps) {
  const { profile, nombre, apellidos, nombreUsuario } = profileData;
  if (!profile) return null;

  return (
    <>
      {/* ── Navegación (Estándar de Especies) ── */}
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

      {/* ── Subheader Integrado (Estándar de Especies) ── */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0f766e, #10b981)',
          borderRadius: '16px',
          padding: '24px 28px',
          marginBottom: '24px',
          color: 'white',
          boxShadow: '0 4px 15px rgba(15, 118, 110, 0.15)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '12px' }}>
              {nombre || 'Mi Perfil'} {apellidos || ''}
            </h1>
            <p style={{ margin: '6px 0 0', opacity: 0.9, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>@{nombreUsuario || 'usuario'}</span>
              <span>·</span>
              <span>{profile.email}</span>
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                padding: '6px 14px',
                borderRadius: '20px',
                fontWeight: 750,
                fontSize: '0.78rem',
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}
            >
              👑 {profile.suscripcion || 'Gratuito'}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
