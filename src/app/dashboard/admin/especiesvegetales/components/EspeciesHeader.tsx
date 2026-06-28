import React from 'react';
import PremiumAddButton from '@/components/ui/PremiumAddButton';
import PremiumDevInsights from '@/components/ui/PremiumDevInsights';
import PremiumSubheader from '@/components/ui/PremiumSubheader';
import PremiumFilterTabs, { FilterOption } from '@/components/ui/PremiumFilterTabs';
import PremiumBackButton from '@/components/ui/PremiumBackButton';
interface EspeciesHeaderProps {
  filterTipo: string;
  setFilterTipo: (t: string) => void;
  filterFamilia: string;
  setFilterFamilia: (f: string) => void;
  filter: 'activas' | 'inactivas' | 'todas';
  setFilter: (f: 'activas' | 'inactivas' | 'todas') => void;
  counts: Record<string, number>;
  countsStatus: Record<string, number>;
  uniqueFamilias: any[];
  onNewEspecie: () => void;
  onGoHome: () => void;
  isMobile?: boolean;
}

export default function EspeciesHeader({
  filterTipo,
  setFilterTipo,
  filterFamilia,
  setFilterFamilia,
  filter,
  setFilter,
  counts,
  countsStatus,
  uniqueFamilias,
  onNewEspecie,
  onGoHome,
  isMobile = false
}: EspeciesHeaderProps) {
  return (
    <>
      <div style={{ marginBottom: '16px' }}>
        <PremiumBackButton onClick={onGoHome} text="🏠 Volver al Inicio" />
      </div>

      <PremiumSubheader
        title="🌍 Gestión de Especies Vegetales"
        gradient="linear-gradient(135deg, #0f766e, #10b981)"
        isMobile={isMobile}
        actions={
          <PremiumAddButton onClick={onNewEspecie} text="➕ Nueva Especie" isMobile={isMobile} />
        }
      >
        {/* Insights encima de los tags */}
        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'flex-start' }}>
          <PremiumDevInsights modulePath="admin/especiesvegetales/page.tsx" />
        </div>

        {/* Tags de filtros */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-start', alignItems: isMobile ? 'stretch' : 'center', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? '12px' : '24px' }}>
          
          <PremiumFilterTabs
            options={[
              { value: '', label: '🌱 Todas' },
              { value: 'hortaliza', label: '🥦 Hortalizas' },
              { value: 'fruta', label: '🍎 Frutas' },
              { value: 'aromatica', label: '🌿 Aromáticas' },
              { value: 'leguminosa', label: '🫘 Leguminosas' },
              { value: 'cereal', label: '🌾 Cereales' },
              { value: 'adventicia', label: '🌿 Adventicias' },
              { value: 'otra', label: '🌼 Otras' }
            ].map(t => ({ ...t, count: counts[t.value] || 0 }))}
            activeFilter={filterTipo}
            onSelect={setFilterTipo}
            isMobile={isMobile}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: isMobile ? '100%' : 'auto' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 'bold', minWidth: isMobile ? '60px' : 'auto' }}>Familia:</span>
            <select
              value={filterFamilia}
              onChange={(e) => setFilterFamilia(e.target.value)}
              style={{
                width: isMobile ? '100%' : 'auto',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.3)',
                background: 'rgba(255,255,255,0.1)',
                color: 'white',
                fontSize: '0.85rem',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="" style={{ color: 'black' }}>🌱 Todas las familias</option>
              {uniqueFamilias.map(f => (
                <option key={f.id} value={f.id} style={{ color: 'black' }}>
                  {f.emoji} {f.nombre} ({f.count})
                </option>
              ))}
            </select>
          </div>

          {/* Filtro Activo/Inactivo */}
          <div style={{ display: 'inline-flex', background: 'rgba(255, 255, 255, 0.15)', padding: '4px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.25)', gap: '4px', width: isMobile ? '100%' : 'auto', justifyContent: isMobile ? 'space-between' : 'flex-start' }}>
            {(['activas', 'inactivas', 'todas'] as const).map((opt) => {
              const isActive = filter === opt;
              const labels = {
                activas: `🟢 Activas (${countsStatus.activas || 0})`,
                inactivas: `🔴 Inactivas (${countsStatus.inactivas || 0})`,
                todas: `👁️ Todas (${countsStatus.todas || 0})`
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
                    color: isActive ? '#0f766e' : 'white',
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
        </div>
      </PremiumSubheader>
    </>
  );
}
