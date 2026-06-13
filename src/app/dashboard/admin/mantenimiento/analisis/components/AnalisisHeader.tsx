import React from 'react';
import { DASHBOARD_GROUPS } from '../services/analisisApi';

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
  return (
    <>
      {/* Botones de navegación superior (Regla 8) */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <button
          onClick={() => window.location.href = '/dashboard'}
          style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '6px 14px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'background 0.2s' }}
          onMouseOver={e => e.currentTarget.style.background = '#e2e8f0'}
          onMouseOut={e => e.currentTarget.style.background = '#f1f5f9'}
        >
          🏠 Volver al Inicio
        </button>
        <button
          onClick={() => window.location.href = '/dashboard/admin/mantenimiento'}
          style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '6px 14px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'background 0.2s' }}
          onMouseOver={e => e.currentTarget.style.background = '#e2e8f0'}
          onMouseOut={e => e.currentTarget.style.background = '#f1f5f9'}
        >
          🔙 Volver a Copias de Seguridad
        </button>
      </div>

      {/* Cabecera Principal con degradado */}
      <div style={{ 
        background: 'linear-gradient(135deg, #6366f1, #a855f7)', 
        borderRadius: '16px', 
        padding: isMobile ? '18px 20px' : '24px 28px', 
        marginBottom: '24px', 
        color: 'white',
        boxShadow: '0 4px 15px rgba(99, 102, 241, 0.2)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <h1 style={{ margin: 0, fontSize: isMobile ? '1.3rem' : '1.6rem', fontWeight: 800 }}>📊 Mantenimiento: Análisis de Dashboards</h1>
              <span style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.4)',
                color: '#e0e7ff',
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
            <p style={{ margin: '4px 0 0', opacity: 0.9, fontSize: isMobile ? '0.82rem' : '0.9rem' }}>
              Ranking de complejidad de archivos del dashboard Verdantia y herramientas de refactorización IA.
            </p>
          </div>
          <button
            onClick={handleReloadAndSaveState}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              background: 'white',
              color: '#6366f1',
              border: 'none',
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
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 12px rgba(0,0,0,0.15)';
            }}
            onMouseOut={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
            }}
          >
            🔄 Actualizar
          </button>
        </div>

        {/* Filtros rápidos integrados en la parte inferior (Regla 7) */}
        <div style={{ 
          marginTop: '20px', 
          paddingTop: '16px', 
          borderTop: '1px solid rgba(255, 255, 255, 0.2)', 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          {/* Bloque izquierdo: Píldoras de tipo */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255, 255, 255, 0.8)', textTransform: 'uppercase', letterSpacing: '0.05em', marginRight: '4px' }}>
              🏷️ Filtrar dashboards:
            </span>
            {[
              { id: 'all', label: '🏷️ Mostrar todos' },
              { id: 'superadmin', label: '🛡️ Superadmin' },
              { id: 'general', label: '👥 General' },
              { id: 'monolito', label: '🔴 Monolitos (>1000 l)' },
              { id: 'complejo', label: '🟠 Complejos (>500 l)' },
              { id: 'estandar', label: '🟡 Estándar (>200 l)' },
              { id: 'ligero_stub', label: '🟢 Ligeros / Stubs' },
              { id: 'revisado_si', label: '✅ Cód. Revisado: Sí' },
              { id: 'revisado_no', label: '❌ Cód. Revisado: No' },
              { id: 'responsive_si', label: '📱 Resp. Realizado: Sí' },
              { id: 'responsive_no', label: '📱 Resp. Realizado: No' },
            ].map(f => {
              const isActive = activeFilter === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => handleSelectFilter(f.id)}
                  style={{
                    background: isActive ? 'white' : 'rgba(255, 255, 255, 0.15)',
                    border: isActive ? '1px solid white' : '1px solid rgba(255, 255, 255, 0.25)',
                    color: isActive ? '#6366f1' : 'white',
                    padding: '6px 14px',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: isActive ? 800 : 600,
                    cursor: 'pointer',
                    boxShadow: isActive ? '0 4px 6px rgba(0,0,0,0.1)' : 'none',
                    transition: 'all 0.2s ease',
                    outline: 'none'
                  }}
                  onMouseOver={e => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)';
                    }
                  }}
                  onMouseOut={e => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
                    }
                  }}
                >
                  {f.label}
                </button>
              );
            })}
          </div>

          {/* Bloque derecho: Desplegable de Grupo funcional */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            width: isMobile ? '100%' : 'auto',
            justifyContent: isMobile ? 'space-between' : 'flex-start'
          }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255, 255, 255, 0.8)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
              📁 Grupo funcional:
            </span>
            <select
              value={activeGroupFilter}
              onChange={(e) => handleSelectGroup(e.target.value)}
              style={{
                background: 'white',
                color: '#6366f1',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                outline: 'none',
                transition: 'all 0.2s',
                width: isMobile ? '60%' : 'auto'
              }}
            >
              {DASHBOARD_GROUPS.map(g => (
                <option key={g.id} value={g.id}>{g.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </>
  );
}
