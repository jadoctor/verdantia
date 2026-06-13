'use client';

import { useSearchParams } from 'next/navigation';
import React from 'react';

interface BibliaHeaderProps {
  isMobile?: boolean;
}

export function BibliaHeader({ isMobile: propIsMobile }: BibliaHeaderProps = {}) {
  const searchParams = useSearchParams();
  const from = searchParams ? searchParams.get('from') : null;
  const isFromAnalisis = from === 'analisis';

  const [internalIsMobile, setInternalIsMobile] = React.useState(false);
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const checkResize = () => setInternalIsMobile(window.innerWidth <= 768);
    checkResize();
    window.addEventListener('resize', checkResize);
    return () => window.removeEventListener('resize', checkResize);
  }, []);

  const isMobile = propIsMobile !== undefined ? propIsMobile : internalIsMobile;

  return (
    <>
      {/* Botones de navegación superior (Regla 8) */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <button
          onClick={() => window.location.href = '/dashboard'}
          style={{
            background: '#f1f5f9',
            color: '#475569',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            padding: '6px 14px',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'background 0.2s',
          }}
          onMouseOver={(e) => (e.currentTarget.style.background = '#e2e8f0')}
          onMouseOut={(e) => (e.currentTarget.style.background = '#f1f5f9')}
        >
          🏠 Volver al Inicio
        </button>
        <button
          onClick={() => {
            window.location.href = isFromAnalisis
              ? '/dashboard/admin/mantenimiento/analisis'
              : '/dashboard/admin/mantenimiento';
          }}
          style={{
            background: '#f1f5f9',
            color: isFromAnalisis ? '#6366f1' : '#475569',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            padding: '6px 14px',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'background 0.2s',
          }}
          onMouseOver={(e) => (e.currentTarget.style.background = '#e2e8f0')}
          onMouseOut={(e) => (e.currentTarget.style.background = '#f1f5f9')}
        >
          {isFromAnalisis ? '🔄 Actualizar' : '🔙 Volver a Copias de Seguridad'}
        </button>
      </div>

      {/* Cabecera Principal con degradado */}
      <div
        style={{
          background: 'linear-gradient(135deg, #10b981, #059669)',
          borderRadius: '16px',
          padding: isMobile ? '18px 20px' : '24px 28px',
          marginBottom: '24px',
          color: 'white',
          boxShadow: '0 4px 15px rgba(16, 185, 129, 0.2)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <h1 style={{ margin: 0, fontSize: isMobile ? '1.3rem' : '1.6rem', fontWeight: 800 }}>📜 La Biblia (Normas de la IA)</h1>
          <span
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.4)',
              color: '#e2f0d9',
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
          Define las reglas inquebrantables de funcionamiento de la Inteligencia Artificial en tiempo real.
        </p>
      </div>

      {/* Cabecera explicativa */}
      <div
        style={{
          background: '#f8fafc',
          borderRadius: '16px',
          padding: isMobile ? '16px' : '24px',
          border: '1px solid #cbd5e1',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.02)',
          marginBottom: '24px',
        }}
      >
        <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2rem', color: '#0f172a', fontWeight: 'bold' }}>
          📜 Biblia de Normas de la IA (`AGENTS.md`)
        </h3>
        <p style={{ margin: 0, color: '#475569', fontSize: '0.9rem', lineHeight: '1.6' }}>
          Aquí puedes definir y refinar el conjunto de reglas e instrucciones que el asistente de Inteligencia
          Artificial (yo) debe acatar obligatoriamente en cada turno. Al guardar los cambios, la base de
          conocimientos se actualiza inmediatamente en tiempo real y guiará mis futuras decisiones.
        </p>
      </div>
    </>
  );
}
