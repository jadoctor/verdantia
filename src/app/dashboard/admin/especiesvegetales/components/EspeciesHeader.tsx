import React from 'react';
import PremiumAddButton from '@/components/ui/PremiumAddButton';
import PremiumDevInsights from '@/components/ui/PremiumDevInsights';
import PremiumSubheader from '@/components/ui/PremiumSubheader';
import PremiumFilterTabs from '@/components/ui/PremiumFilterTabs';
import PremiumBackButton from '@/components/ui/PremiumBackButton';
import PremiumDropdownFilter from '@/components/ui/PremiumDropdownFilter';
import PremiumSegmentedFilter from '@/components/ui/PremiumSegmentedFilter';

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
  /** @deprecated isMobile is handled 100% via CSS Modules */
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
  onGoHome
}: EspeciesHeaderProps) {
  return (
    <>
      {/* Forzar refresco Turbopack */}
      <div style={{ marginBottom: '16px' }}>
        <PremiumBackButton onClick={onGoHome} text="🏠 Volver al Inicio" />
      </div>

      <PremiumSubheader
        title="🌍 Gestión de Especies Vegetales"
        gradient="linear-gradient(135deg, #0f766e, #10b981)"
        actions={
          <PremiumAddButton onClick={onNewEspecie} text="➕ Nueva Especie" />
        }
      >
        {/* Insights encima de los tags */}
        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'flex-start' }}>
          <PremiumDevInsights modulePath="admin/especiesvegetales/page.tsx" />
        </div>

        {/* Tags de filtros - 100% fluido mediante gap y wrap */}
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          justifyContent: 'flex-start', 
          alignItems: 'center', 
          gap: '16px' 
        }}>
          
          <PremiumFilterTabs
            options={[
              { value: '', label: '🌱 Todas' },
              { value: 'hortaliza', label: '🥦 Hortalizas' },
              { value: 'fruta', label: '🍎 Frutas' },
              { value: 'aromatica', label: '🌿 Aromáticas' },
              { value: 'leguminosa', label: '🫘 Leguminosas' },
              { value: 'cereal', label: '🌾 Cereales' },
              { value: 'adventicia', label: '🌿 Adventicias' }
            ].map(t => ({ ...t, count: counts[t.value] || 0 }))}
            activeFilter={filterTipo}
            onSelect={setFilterTipo}
          />

          <PremiumDropdownFilter
            label="Familia:"
            placeholder="🌱 Todas las familias"
            options={[
              { value: '', label: 'Todas las familias', emoji: '🌱' },
              ...uniqueFamilias.map(f => ({
                value: f.id,
                label: f.nombre,
                emoji: f.emoji,
                count: f.count
              }))
            ]}
            value={filterFamilia}
            onChange={setFilterFamilia}
          />

          <PremiumSegmentedFilter
            options={[
              { value: 'activas', label: '🟢 Activas', count: countsStatus.activas },
              { value: 'inactivas', label: '🔴 Inactivas', count: countsStatus.inactivas },
              { value: 'todas', label: '👁️ Todas', count: countsStatus.todas }
            ]}
            value={filter}
            onChange={setFilter}
          />
        </div>
      </PremiumSubheader>
    </>
  );
}
