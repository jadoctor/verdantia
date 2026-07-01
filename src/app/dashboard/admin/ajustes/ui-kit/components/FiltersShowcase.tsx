import React from 'react';
import PremiumSegmentedFilter from '@/components/ui/PremiumSegmentedFilter';
import PremiumDropdownFilter from '@/components/ui/PremiumDropdownFilter';
import PremiumLoadingOverlay from '@/components/ui/PremiumLoadingOverlay';

interface FiltersShowcaseProps {
  activeSegment: string;
  setActiveSegment: (val: string) => void;
  activeDropdown: string;
  setActiveDropdown: (val: string) => void;
  cardStyle: React.CSSProperties;
  titleStyle: React.CSSProperties;
  containerStyle: React.CSSProperties;
}

export default function FiltersShowcase({
  activeSegment,
  setActiveSegment,
  activeDropdown,
  setActiveDropdown,
  cardStyle,
  titleStyle,
  containerStyle
}: FiltersShowcaseProps) {
  return (
    <>
      <div style={{ marginTop: '48px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#1e293b' }}>🎛️ Filtros y Overlays (Nuevos)</h2>
        <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to right, #e2e8f0, transparent)' }}></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '20px' }}>
        <div className="card-showcase" style={cardStyle}>
          <h3 style={titleStyle}>PremiumSegmentedFilter</h3>
          <div style={containerStyle}>
            <PremiumSegmentedFilter
              options={[
                { value: 'todos', label: 'Todos', count: 12 },
                { value: 'activos', label: 'Activos', count: 8 },
                { value: 'inactivos', label: 'Inactivos', count: 4 }
              ]}
              value={activeSegment}
              onChange={(val) => setActiveSegment(val as string)}
            />
          </div>
        </div>

        <div className="card-showcase" style={cardStyle}>
          <h3 style={titleStyle}>PremiumDropdownFilter</h3>
          <div style={containerStyle}>
            <PremiumDropdownFilter
              options={[
                { value: 'opcion1', label: 'Opción 1', emoji: '🟢' },
                { value: 'opcion2', label: 'Opción 2', emoji: '🔴' }
              ]}
              value={activeDropdown}
              onChange={setActiveDropdown}
              label="Filtro Principal"
            />
          </div>
        </div>

        <div className="card-showcase" style={cardStyle}>
          <h3 style={titleStyle}>PremiumLoadingOverlay</h3>
          <div style={{ ...containerStyle, position: 'relative', height: '150px', background: '#f1f5f9', borderRadius: '8px', padding: '16px' }}>
            <p style={{ color: '#94a3b8', margin: 0 }}>Contenido simulado...</p>
            <PremiumLoadingOverlay isLoading={true} message="Cargando filtros..." />
          </div>
        </div>
      </div>
    </>
  );
}
