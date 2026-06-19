import React from 'react';

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
        <button onClick={onGoHome} style={{ background: 'white', border: '1px solid #cbd5e1', color: '#475569', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          🏠 Volver al Inicio
        </button>
      </div>
      {/* ── Header ── */}
      <div style={{ background: 'linear-gradient(135deg, #0f766e, #10b981)', borderRadius: '16px', padding: isMobile ? '16px 20px' : '24px 28px', marginBottom: '24px', color: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? '16px' : '32px', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h1 style={{ margin: 0, fontSize: isMobile ? '1.3rem' : '1.6rem', fontWeight: 800 }}>🌍 Gestión de Especies Globales</h1>
              <span style={{
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
                gap: '4px'
              }}>
                🛡️ Superadministrador
              </span>
            </div>
            <p style={{ margin: '4px 0 0', opacity: 0.9, fontSize: isMobile ? '0.8rem' : '0.9rem' }}>
              Catálogo centralizado para toda la comunidad Verdantia
            </p>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', width: isMobile ? '100%' : 'auto' }}>
            <button 
              onClick={onNewEspecie}
              style={{
                padding: '8px 16px', borderRadius: '8px', background: 'white', color: '#0f766e',
                border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.95rem',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)', transition: 'all 0.2s', display: 'flex',
                alignItems: 'center', gap: '6px', width: isMobile ? '100%' : 'auto', justifyContent: 'center'
              }}
              onMouseOver={e => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 12px rgba(0,0,0,0.15)';
              }}
              onMouseOut={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
              }}
            >
              ➕ Nueva Especie
            </button>
          </div>
        </div>

        {/* Tags de filtros */}
        <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: isMobile ? 'stretch' : 'center', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? '16px' : '24px', borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '16px' }}>
          <div style={{ display: 'flex', flexWrap: isMobile ? 'nowrap' : 'wrap', gap: '8px', width: isMobile ? '100%' : 'auto', overflowX: isMobile ? 'auto' : 'visible', paddingBottom: isMobile ? '4px' : '0', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
            {[
              { value: '', label: '🌱 Todas' },
              { value: 'hortaliza', label: '🥦 Hortalizas' },
              { value: 'fruta', label: '🍎 Frutas' },
              { value: 'aromatica', label: '🌿 Aromáticas' },
              { value: 'leguminosa', label: '🫘 Leguminosas' },
              { value: 'cereal', label: '🌾 Cereales' },
              { value: 'adventicia', label: '🌿 Adventicias' },
              { value: 'otra', label: '🌼 Otras' }
            ].map((tag) => {
              const isSelected = filterTipo === tag.value;
              return (
                <button
                  key={tag.value}
                  type="button"
                  onClick={() => setFilterTipo(tag.value)}
                  style={{
                    flexShrink: 0,
                    padding: isMobile ? '6px 12px' : '6px 14px',
                    borderRadius: '20px',
                    border: isSelected ? '1px solid white' : '1px solid rgba(255,255,255,0.3)',
                    background: isSelected ? 'white' : 'rgba(255,255,255,0.1)',
                    color: isSelected ? '#0f766e' : 'white',
                    fontWeight: 'bold',
                    fontSize: isMobile ? '0.8rem' : '0.85rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: isSelected ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
                  }}
                  onMouseOver={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.6)';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
                    }
                  }}
                >
                  {tag.label} ({counts[tag.value] || 0})
                </button>
              );
            })}
          </div>

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
      </div>
    </>
  );
}
