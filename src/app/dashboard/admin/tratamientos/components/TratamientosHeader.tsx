import React from 'react';
import PremiumSubheader from '@/components/ui/PremiumSubheader';
import PremiumDevInsights from '@/components/ui/PremiumDevInsights';
import PremiumAddButton from '@/components/ui/PremiumAddButton';
import PremiumFilterTabs from '@/components/ui/PremiumFilterTabs';

interface TratamientosHeaderProps {
  tratamientosLength: number;
  activeFilter: string;
  setActiveFilter: (filter: string) => void;
  countByTag: (field: string, tag: string) => number;
  isMobile: boolean;
  router: any;
}

export function TratamientosHeader({
  tratamientosLength,
  activeFilter,
  setActiveFilter,
  countByTag,
  isMobile,
  router
}: TratamientosHeaderProps) {
  return (
    <PremiumSubheader
      title="🧪 Catálogo Maestro de Tratamientos"
      gradient="linear-gradient(135deg, #0f766e 0%, #3b82f6 100%)"
      isMobile={isMobile}
      actions={
        <PremiumAddButton onClick={() => router.push('/dashboard/admin/tratamientos/nuevo')} text="➕ Nuevo Tratamiento" isMobile={isMobile} />
      }
    >
      {/* Analizador de Código (Regla 7) */}
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'flex-start' }}>
        <PremiumDevInsights modulePath="admin/tratamientos/page.tsx" />
      </div>

      {/* Filtros Rápidos — Naturaleza (Regla 7: PremiumFilterTabs) */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-start', alignItems: isMobile ? 'stretch' : 'center', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? '12px' : '16px' }}>
        <PremiumFilterTabs
          options={[
            { value: 'all', label: '📋 Todos', count: tratamientosLength },
            { value: 'ecológico', label: '🍃 Ecológico', count: countByTag('tratamientostipo', 'ecológico') },
            { value: 'orgánico', label: '🌱 Orgánico', count: countByTag('tratamientostipo', 'orgánico') },
            { value: 'químico', label: '🧪 Químico', count: countByTag('tratamientostipo', 'químico') },
            { value: 'biológico', label: '🦠 Biológico', count: countByTag('tratamientostipo', 'biológico') },
            { value: 'físico', label: '✂️ Físico', count: countByTag('tratamientostipo', 'físico') },
          ].filter(f => f.value === 'all' || f.count > 0)}
          activeFilter={activeFilter}
          onSelect={setActiveFilter}
          themeColor="#0f766e"
          isMobile={isMobile}
        />

        {/* Filtros de Modo de Acción (Regla 7: PremiumFilterTabs) */}
        <PremiumFilterTabs
          options={[
            { value: 'preventivo', label: '🛡️ Preventivo', count: countByTag('tratamientosaccion', 'preventivo') },
            { value: 'curativo', label: '💊 Curativo', count: countByTag('tratamientosaccion', 'curativo') },
            { value: 'sistémico', label: '🔄 Sistémico', count: countByTag('tratamientosaccion', 'sistémico') },
            { value: 'erradicante', label: '⚡ Erradicante', count: countByTag('tratamientosaccion', 'erradicante') },
          ].filter(f => f.count > 0)}
          activeFilter={activeFilter}
          onSelect={setActiveFilter}
          themeColor="#0f766e"
          isMobile={isMobile}
        />
      </div>
    </PremiumSubheader>
  );
}
