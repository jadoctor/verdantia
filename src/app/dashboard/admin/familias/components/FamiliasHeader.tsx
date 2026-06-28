import React from 'react';
import PremiumAddButton from '@/components/ui/PremiumAddButton';
import PremiumBackButton from '@/components/ui/PremiumBackButton';
import PremiumSubheader from '@/components/ui/PremiumSubheader';
import PremiumDevInsights from '@/components/ui/PremiumDevInsights';
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
      {/* ═══ Navegación Superior ═══ */}
      <div style={{ marginBottom: '16px', padding: '0 4px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <PremiumBackButton onClick={() => router.push('/dashboard')} text="🏠 Volver al Inicio" />
      </div>

      {/* ═══ Encabezado Premium (Regla 7) ═══ */}
      <PremiumSubheader
        title="🧬 Familias Botánicas"
        gradient="linear-gradient(135deg, #059669, #10b981)"
        isMobile={isMobile}
        actions={
          <PremiumAddButton onClick={() => setShowNewForm(true)} text="➕ Nueva Familia" isMobile={isMobile} />
        }
      >
        {/* Analizador de Código */}
        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'flex-start' }}>
          <PremiumDevInsights modulePath="admin/familias/page.tsx" />
        </div>

        {/* Filtros Rápidos */}
        <div style={{ display: 'inline-flex', background: 'rgba(255, 255, 255, 0.15)', padding: '4px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.25)', gap: '4px', width: isMobile ? '100%' : 'auto', justifyContent: isMobile ? 'space-between' : 'flex-start' }}>
          {(['all', 'activas', 'inactivas'] as const).map((opt) => {
            const isActive = filter === opt;
            const labels = {
              all: `📋 Todas (${filterCounts.all})`,
              activas: `🟢 Activas (${filterCounts.activas})`,
              inactivas: `🔴 Inactivas (${filterCounts.inactivas})`
            };
            return (
              <button
                key={opt}
                type="button"
                onClick={() => setFilter(opt)}
                style={{
                  flex: isMobile ? 1 : 'none',
                  padding: isMobile ? '8px 4px' : '6px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  background: isActive ? 'white' : 'transparent',
                  color: isActive ? '#059669' : 'white',
                  fontWeight: 'bold',
                  fontSize: isMobile ? '0.8rem' : '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  textAlign: 'center'
                }}
              >
                {labels[opt]}
              </button>
            );
          })}
        </div>
      </PremiumSubheader>
    </>
  );
}
