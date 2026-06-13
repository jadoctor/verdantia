'use client';
import React, { useState, useMemo } from 'react';

interface CultivoHistorialProps {
  avisosCompletados: any[];
  pautas: any[];
}

const FILTER_TYPES = [
  { key: 'all', label: 'Todas', icon: '📋' },
  { key: 'Riego', label: 'Riego', icon: '💧' },
  { key: 'Abono', label: 'Abono', icon: '🌿' },
  { key: 'Poda', label: 'Poda', icon: '✂️' },
  { key: 'Trasplante', label: 'Trasplante', icon: '🪴' },
  { key: 'Plaga', label: 'Plaga', icon: '🧪' },
];

export default function CultivoHistorial({ avisosCompletados, pautas }: CultivoHistorialProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [activeFilter, setActiveFilter] = useState('all');

  const getPauta = (idpauta: number) => pautas.find(p => p.idlaborespauta === idpauta || p.xlaborespautaidlabores === idpauta);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  const getTaskIcon = (nombre: string) => {
    if (!nombre) return '🌾';
    if (nombre.includes('Riego')) return '💧';
    if (nombre.includes('Abono') || nombre.includes('Fertiliz')) return '🌿';
    if (nombre.includes('Siembra')) return '🌱';
    if (nombre.includes('Trasplante')) return '🪴';
    if (nombre.includes('Poda')) return '✂️';
    if (nombre.includes('Plaga') || nombre.includes('Tratam')) return '🧪';
    return '🌾';
  };

  // Filtrar avisos según el filtro activo
  const filteredAvisos = useMemo(() => {
    if (activeFilter === 'all') return avisosCompletados;
    return avisosCompletados.filter(aviso => {
      const pauta = getPauta(aviso.idpauta);
      const nombre = pauta?.laboresnombre || '';
      return nombre.includes(activeFilter);
    });
  }, [avisosCompletados, activeFilter, pautas]);

  // Contar por tipo para mostrar en los filtros
  const countByType = useMemo(() => {
    const counts: Record<string, number> = { all: avisosCompletados.length };
    for (const aviso of avisosCompletados) {
      const pauta = getPauta(aviso.idpauta);
      const nombre = pauta?.laboresnombre || '';
      for (const ft of FILTER_TYPES) {
        if (ft.key !== 'all' && nombre.includes(ft.key)) {
          counts[ft.key] = (counts[ft.key] || 0) + 1;
        }
      }
    }
    return counts;
  }, [avisosCompletados, pautas]);

  if (avisosCompletados.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <div style={{ fontSize: '4rem', marginBottom: '16px' }}>📋</div>
        <h3 style={{ margin: '0 0 8px', color: '#1e293b', fontSize: '1.4rem' }}>Sin historial aún</h3>
        <p style={{ margin: 0, color: '#64748b' }}>Las tareas que completes desde la pestaña &quot;Tareas Pendientes&quot; quedarán registradas aquí.</p>
      </div>
    );
  }

  const sortedAvisos = [...filteredAvisos].sort((a, b) => {
    const ta = new Date(a.fechaRealizacion || a.fechaEmision || 0).getTime();
    const tb = new Date(b.fechaRealizacion || b.fechaEmision || 0).getTime();
    return tb - ta;
  });

  const grouped: Record<string, any[]> = {};
  for (const aviso of sortedAvisos) {
    const d = new Date(aviso.fechaRealizacion || aviso.fechaEmision || Date.now());
    const key = d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(aviso);
  }

  return (
    <div>
      {/* Resumen header */}
      <div style={{
        background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
        border: '1px solid #86efac', borderRadius: '16px',
        padding: '20px 24px', marginBottom: '16px',
        display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap'
      }}>
        <div style={{ fontSize: '3rem' }}>🏅</div>
        <div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#15803d' }}>{avisosCompletados.length}</div>
          <div style={{ color: '#166534', fontWeight: 600 }}>
            {avisosCompletados.length === 1 ? 'tarea completada' : 'tareas completadas'} en total
          </div>
        </div>
      </div>

      {/* Filtros rápidos */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '20px' }}>
        {FILTER_TYPES.map(ft => {
          const count = countByType[ft.key] || 0;
          if (ft.key !== 'all' && count === 0) return null;
          const isActive = activeFilter === ft.key;
          return (
            <button
              key={ft.key}
              onClick={() => setActiveFilter(ft.key)}
              style={{
                background: isActive ? '#10b981' : 'white',
                color: isActive ? 'white' : '#475569',
                border: isActive ? '1px solid #10b981' : '1px solid #e2e8f0',
                borderRadius: '20px', padding: '6px 14px',
                cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: '5px',
                transition: 'all 0.15s'
              }}
            >
              {ft.icon} {ft.label}
              {count > 0 && (
                <span style={{
                  background: isActive ? 'rgba(255,255,255,0.3)' : '#f1f5f9',
                  borderRadius: '10px', padding: '1px 7px',
                  fontSize: '0.72rem', fontWeight: 700
                }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Resultado vacío del filtro */}
      {sortedAvisos.length === 0 && activeFilter !== 'all' && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🔍</div>
          <p style={{ margin: 0 }}>No hay tareas de tipo &quot;{activeFilter}&quot; completadas.</p>
        </div>
      )}

      {/* Lista agrupada por mes */}
      {Object.entries(grouped).map(([mes, avisos]) => (
        <div key={mes} style={{ marginBottom: '28px' }}>
          <h3 style={{
            margin: '0 0 12px', fontSize: '0.85rem', fontWeight: 700,
            color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em',
            display: 'flex', alignItems: 'center', gap: '8px'
          }}>
            <span style={{ flex: 1, height: '1px', background: '#e2e8f0', display: 'block' }} />
            📅 {mes}
            <span style={{ flex: 3, height: '1px', background: '#e2e8f0', display: 'block' }} />
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {avisos.map((aviso: any) => {
              const pauta = getPauta(aviso.idpauta);
              const nombre = pauta?.laboresnombre || `Tarea #${aviso.idpauta}`;
              const isExpanded = expandedId === aviso.id;

              return (
                <div
                  key={aviso.id}
                  onClick={() => setExpandedId(isExpanded ? null : aviso.id)}
                  style={{
                    background: 'white', border: '1px solid #e2e8f0',
                    borderRadius: '12px', padding: '16px', cursor: 'pointer',
                    transition: 'all 0.15s', display: 'flex', gap: '14px',
                    alignItems: 'flex-start', boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                  }}
                >
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '50%',
                    background: '#dcfce7', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0
                  }}>
                    {getTaskIcon(nombre)}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.95rem' }}>
                        ✅ {nombre}
                      </span>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                        {aviso.fase && (
                          <span style={{ background: '#f1f5f9', color: '#475569', fontSize: '0.75rem', padding: '2px 8px', borderRadius: '10px', fontWeight: 500 }}>
                            {aviso.fase}
                          </span>
                        )}
                        <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                          {formatDate(aviso.fechaRealizacion || aviso.fechaEmision)}
                        </span>
                        <span style={{ color: '#cbd5e1', fontSize: '0.7rem' }}>{isExpanded ? '▲' : '▼'}</span>
                      </div>
                    </div>

                    {isExpanded && pauta?.laboresdescripcion && (
                      <p style={{ margin: '10px 0 0', color: '#64748b', fontSize: '0.875rem', lineHeight: 1.6 }}>
                        {pauta.laboresdescripcion}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
