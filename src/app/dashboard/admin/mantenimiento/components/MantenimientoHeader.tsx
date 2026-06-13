'use client';

import React from 'react';

interface MantenimientoHeaderProps {
  isMobile?: boolean;
}

export function MantenimientoHeader({ isMobile = false }: MantenimientoHeaderProps) {
  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #4f46e5, #8b5cf6)',
        borderRadius: '16px',
        padding: isMobile ? '18px 20px' : '24px 28px',
        marginBottom: '24px',
        color: 'white',
        boxShadow: '0 4px 15 rgba(79, 70, 229, 0.2)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0, fontSize: isMobile ? '1.3rem' : '1.6rem', fontWeight: 800 }}>📁 Copias de Seguridad</h1>
        <span
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.4)',
            color: '#e0e7ff',
            padding: '3px 10px',
            borderRadius: '9999px',
            fontSize: '0.72rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          🛡️ Superadministrador
        </span>
      </div>
      <p style={{ margin: '4px 0 0', opacity: 0.9, fontSize: isMobile ? '0.82rem' : '0.9rem' }}>
        Consola centralizada para realizar copias de seguridad de base de datos, commits a GitHub y despliegues a producción.
      </p>
    </div>
  );
}
