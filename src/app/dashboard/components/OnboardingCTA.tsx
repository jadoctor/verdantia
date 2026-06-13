'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase/config';

interface OnboardingCTAProps {
  profile: {
    nombre: string;
  } | null;
}

export default function OnboardingCTA({ profile }: OnboardingCTAProps) {
  const router = useRouter();

  if (!profile || (auth.currentUser?.emailVerified && profile.nombre)) {
    return null;
  }

  return (
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
      <h2 style={{ color: '#15803d', fontSize: '1.4rem', marginTop: 0 }}>
        ¡Bienvenido! Tu huerto te espera
      </h2>
      <p style={{ lineHeight: 1.6, color: '#166534', fontSize: '0.95rem', marginBottom: '1rem' }}>
        Actualmente tienes acceso al <strong>Plan Básico Gratuito</strong>.
      </p>
      
      <div style={{ backgroundColor: 'rgba(255,255,255,0.6)', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
        <p style={{ color: '#15803d', fontSize: '1rem', margin: '0 0 10px 0', fontWeight: 700 }}>
          🎁 ¡Completa tu perfil y obtén 1 MES GRATIS de Plan Premium!
        </p>
        <p style={{ color: '#166534', fontSize: '0.9rem', margin: '0 0 10px 0' }}>
          Desbloquea todas las funciones avanzadas al instante. <strong>No requiere tarjeta de crédito</strong>.
        </p>
        <p style={{ color: '#166534', fontSize: '0.85rem', margin: 0, lineHeight: 1.5 }}>
          <strong>¿Qué datos te pediremos y por qué?</strong><br/>
          Solo necesitamos tu nombre y algunos detalles sobre tu huerto (como tu nivel de experiencia o ubicación aproximada). Esto nos permite <strong>personalizar tus recomendaciones de cultivo</strong>, ajustar las alertas climáticas a tu zona y conectar mejor con la comunidad de Verdantia. ¡Tus datos siempre estarán seguros!
        </p>
      </div>
      <button
        onClick={() => router.push('/dashboard/onboarding')}
        type="button"
        style={{
          background: 'linear-gradient(to right, #10b981, #059669)',
          color: 'white', border: 'none', padding: '12px 24px',
          borderRadius: '8px', fontWeight: 700, cursor: 'pointer'
        }}
      >
        Completar mi Perfil
      </button>
    </div>
  );
}
