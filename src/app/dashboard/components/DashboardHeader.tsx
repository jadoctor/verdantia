'use client';

import React from 'react';

interface DashboardHeaderProps {
  displayName: string;
  onOpenCropWizard: () => void;
}

export default function DashboardHeader({ displayName, onOpenCropWizard }: DashboardHeaderProps) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #059669, #34d399)',
      borderRadius: '16px', padding: '24px 28px', marginBottom: '24px',
      color: 'white', boxShadow: '0 4px 15px rgba(5, 150, 105, 0.15)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>👋</span> Hola, {displayName}
          </h1>
          <p style={{ margin: '4px 0 0', opacity: 0.9, fontSize: '0.9rem' }}>
            Bienvenido al resumen de tu huerto digital en Verdantia.
          </p>
        </div>
        <button
          onClick={onOpenCropWizard}
          style={{
            background: 'white', color: '#059669', border: 'none',
            padding: '12px 24px', borderRadius: '12px', fontWeight: 800,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
            fontSize: '0.95rem', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.2s'
          }}
          onMouseOver={e => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.15)';
          }}
          onMouseOut={e => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
          }}
        >
          🌱 Sembrar Cultivo
        </button>
      </div>
    </div>
  );
}
