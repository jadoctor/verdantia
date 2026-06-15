import React from 'react';
import { useRouter } from 'next/navigation';

interface FamiliasHeaderProps {
  filter: 'all' | 'activas' | 'inactivas';
  setFilter: (f: 'all' | 'activas' | 'inactivas') => void;
  filterCounts: { all: number; activas: number; inactivas: number; };
  setShowNewForm: (val: boolean) => void;
  isMobile?: boolean;
}

export function FamiliasHeader({ filter, setFilter, filterCounts, setShowNewForm, isMobile = false }: FamiliasHeaderProps) {
  const router = useRouter();

  return (
    <>
      {/* ═══ Navegación Superior (Regla 11) ═══ */}
      <div style={{ display: 'flex', gap: '8px', padding: isMobile ? '12px 14px' : '12px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', flexWrap: 'wrap' }}>
        <button onClick={() => router.push('/dashboard')}
          style={{ flex: isMobile ? 1 : 'none', padding: '8px 14px', borderRadius: '8px', border: '1px solid #d1d5db', background: 'white', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, textAlign: 'center' }}>
          🏠 Volver al Inicio
        </button>
      </div>

      {/* ═══ Subheader (Regla 7) ═══ */}
      <div style={{
        background: 'linear-gradient(135deg, #059669, #10b981)',
        padding: isMobile ? '16px 20px' : '20px 28px',
        color: 'white',
        marginBottom: '0',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center', flexDirection: isMobile ? 'column' : 'row', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: isMobile ? '1.3rem' : '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
              🧬 Familias Botánicas
            </h1>
            <p style={{ margin: '4px 0 0', opacity: 0.85, fontSize: '0.85rem' }}>
              Gestión de familias para rotación de cultivos
            </p>
          </div>
          <button
            onClick={() => setShowNewForm(true)}
            style={{
              background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)',
              color: 'white', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer',
              fontWeight: 600, fontSize: '0.9rem', transition: 'all 0.2s',
              backdropFilter: 'blur(4px)', width: isMobile ? '100%' : 'auto', textAlign: 'center',
              display: 'flex', justifyContent: 'center', alignItems: 'center'
            }}
            onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.35)'; }}
            onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; }}
          >
            ➕ Nueva Familia
          </button>
        </div>

        {/* Filtros píldora */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '16px', flexWrap: isMobile ? 'nowrap' : 'wrap', overflowX: isMobile ? 'auto' : 'visible', paddingBottom: isMobile ? '4px' : '0', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
          {(['all', 'activas', 'inactivas'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                flexShrink: 0,
                padding: '6px 16px', borderRadius: '20px', border: 'none', cursor: 'pointer',
                fontWeight: 600, fontSize: '0.8rem', transition: 'all 0.2s',
                background: filter === f ? 'white' : 'rgba(255,255,255,0.2)',
                color: filter === f ? '#059669' : 'white',
              }}
            >
              {f === 'all' ? '📋 Todas' : f === 'activas' ? '✅ Activas' : '⛔ Inactivas'} ({filterCounts[f]})
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
