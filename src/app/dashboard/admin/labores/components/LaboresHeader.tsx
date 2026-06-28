import React from 'react';
import { useRouter } from 'next/navigation';
import PremiumAddButton from '@/components/ui/PremiumAddButton';

interface LaboresHeaderProps {
  isMobile?: boolean;
  filter: 'todos' | 'convencional' | 'minimo' | 'nolaboreo';
  setFilter: (f: 'todos' | 'convencional' | 'minimo' | 'nolaboreo') => void;
  filterCounts: { todos: number; convencional: number; minimo: number; nolaboreo: number };
}

export function LaboresHeader({ isMobile = false, filter, setFilter, filterCounts }: LaboresHeaderProps) {
  const router = useRouter();

  return (
    <>
      <div style={{ marginBottom: '16px', display: 'flex', flexWrap: 'wrap' }}>
        <button onClick={() => router.push('/dashboard')} style={{ flex: isMobile ? 1 : 'none', background: 'white', border: '1px solid #cbd5e1', color: '#475569', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', textAlign: 'center' }}>
          🏠 Volver al Inicio
        </button>
      </div>
      {/* ── Header Integrado ── */}
      <div style={{ background: 'linear-gradient(135deg, #b45309, #f59e0b)', borderRadius: '16px', padding: isMobile ? '16px 20px' : '24px 28px', marginBottom: '24px', color: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'flex-start', flexDirection: isMobile ? 'column' : 'row', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: isMobile ? '1.4rem' : '1.6rem', fontWeight: 800 }}>🚜 Catálogo de Labores</h1>
            <p style={{ margin: '4px 0 0', opacity: 0.9, fontSize: '0.9rem' }}>
              Gestión de labores agrícolas globales para la comunidad
            </p>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
            <PremiumAddButton 
              onClick={() => router.push('/dashboard/admin/labores/nueva')}
              text="➕ Nueva Labor"
              isMobile={isMobile}
            />
          </div>
        </div>

        {/* Filtros de método de trabajo de la tierra */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '16px', flexWrap: isMobile ? 'nowrap' : 'wrap', overflowX: isMobile ? 'auto' : 'visible', paddingBottom: isMobile ? '4px' : '0', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
          {(['todos', 'convencional', 'minimo', 'nolaboreo'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                flexShrink: 0,
                padding: '6px 16px', borderRadius: '20px', border: 'none', cursor: 'pointer',
                fontWeight: 600, fontSize: '0.8rem', transition: 'all 0.2s',
                background: filter === f ? 'white' : 'rgba(255,255,255,0.2)',
                color: filter === f ? '#b45309' : 'white',
              }}
            >
              {f === 'todos' ? '📋 Todas' : f === 'convencional' ? '🚜 Convencional' : f === 'minimo' ? '⛏️ Mínimo' : '🚫 No laboreo'} ({filterCounts[f]})
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
