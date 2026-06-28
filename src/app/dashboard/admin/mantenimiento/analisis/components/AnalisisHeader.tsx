import React from 'react';
import { useRouter } from 'next/navigation';
import { DASHBOARD_GROUPS } from '../services/analisisApi';
import PremiumSubheader from '@/components/ui/PremiumSubheader';
import PremiumBackButton from '@/components/ui/PremiumBackButton';
import PremiumDevInsights from '@/components/ui/PremiumDevInsights';
import PremiumFilterTabs from '@/components/ui/PremiumFilterTabs';

interface AnalisisHeaderProps {
  activeFilter: string;
  activeGroupFilter: string;
  handleSelectFilter: (filterId: string) => void;
  handleSelectGroup: (groupId: string) => void;
  handleReloadAndSaveState: () => void;
  isMobile?: boolean;
}

export function AnalisisHeader({
  activeFilter,
  activeGroupFilter,
  handleSelectFilter,
  handleSelectGroup,
  handleReloadAndSaveState,
  isMobile = false
}: AnalisisHeaderProps) {
  const router = useRouter();
  
  const filterTabs = [
    { value: 'all', label: '🏷️ Todos' },
    { value: 'superadmin', label: '🛡️ Superadmin' },
    { value: 'general', label: '👥 General' },
    { value: 'monolito', label: '🔴 >1000L' },
    { value: 'complejo', label: '🟠 >500L' },
    { value: 'estandar', label: '🟡 >200L' },
    { value: 'ligero_stub', label: '🟢 Ligeros' },
    { value: 'revisado_si', label: '✅ Rev.' },
    { value: 'revisado_no', label: '❌ No Rev.' },
    { value: 'responsive_si', label: '📱 Resp.' },
    { value: 'responsive_no', label: '📱 No Resp.' },
    { value: 'premium_si', label: '👑 Prem.' },
    { value: 'premium_no', label: '👑 No Prem.' },
  ];

  return (
    <>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <PremiumBackButton text="🏠 Volver al Inicio" onClick={() => router.push('/dashboard')} />
      </div>

      <PremiumSubheader
        title="📊 Mantenimiento: Análisis de Dashboards"
        gradient="linear-gradient(135deg, #6366f1, #a855f7)"
        isMobile={isMobile}
        actions={
          <button
            onClick={handleReloadAndSaveState}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.3)',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '0.9rem',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: isMobile ? '100%' : 'auto',
              gap: '6px'
            }}
            onMouseOver={e => {
              e.currentTarget.style.background = 'white';
              e.currentTarget.style.color = '#6366f1';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseOut={e => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              e.currentTarget.style.color = 'white';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            🔄 Actualizar
          </button>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Fila 1: Insights y Grupo funcional */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <PremiumDevInsights modulePath="admin/mantenimiento/analisis/page.tsx" />
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: isMobile ? '100%' : 'auto', justifyContent: isMobile ? 'space-between' : 'flex-end' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255, 255, 255, 0.8)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                📁 Grupo funcional:
              </span>
              <select
                value={activeGroupFilter}
                onChange={(e) => handleSelectGroup(e.target.value)}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  padding: '6px 14px',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  outline: 'none',
                  transition: 'all 0.2s',
                  width: isMobile ? '60%' : 'auto'
                }}
              >
                {DASHBOARD_GROUPS.map(g => (
                  <option key={g.id} value={g.id} style={{ color: 'black' }}>{g.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Fila 2: Filtros de etiquetas */}
          <div>
            <PremiumFilterTabs
              activeFilter={activeFilter}
              onSelect={handleSelectFilter}
              options={filterTabs}
              themeColor="#6366f1"
              isMobile={isMobile}
            />
          </div>
        </div>
      </PremiumSubheader>
    </>
  );
}
