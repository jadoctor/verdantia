import React from 'react';
import { Blurhash } from 'react-blurhash';
import { getMediaUrl } from '@/lib/media-url';

interface EspeciesTableProps {
  especies: any[];
  loading: boolean;
  focusParam: string | null;
  onEdit: (id: string) => void;
  onDelete: (id: string, hasDependencies: boolean) => void;
  onReactivate: (id: string) => void;
  isMobile: boolean;
  sortConfig?: { key: string, direction: 'asc' | 'desc' } | null;
  onSort?: (key: string) => void;
}

const STYLE_FILTERS: Record<string, string> = {
  '': 'none',
  comic: 'contrast(1.45) saturate(1.55) brightness(1.08)',
  manga: 'grayscale(1) contrast(1.85) brightness(1.1)',
  watercolor: 'saturate(1.35) contrast(0.88) brightness(1.14)',
  sketch: 'grayscale(1) contrast(2.2) brightness(1.18)',
  pop: 'saturate(1.95) contrast(1.3) brightness(1.06)',
  vintage: 'sepia(0.65) contrast(1.08) saturate(0.78) brightness(1.03)',
  cinematic: 'contrast(1.22) saturate(0.72) hue-rotate(338deg) brightness(0.98)',
  hdr: 'contrast(1.35) saturate(1.3) brightness(1.07)'
};

export default function EspeciesTable({
  especies,
  loading,
  focusParam,
  onEdit,
  onDelete,
  onReactivate,
  isMobile,
  sortConfig,
  onSort
}: EspeciesTableProps) {
  const renderSortIndicator = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) return <span style={{ color: '#cbd5e1', marginLeft: '4px', fontSize: '0.8rem' }}>↕️</span>;
    return sortConfig.direction === 'asc' ? <span style={{ marginLeft: '4px', fontSize: '0.8rem' }}>🔼</span> : <span style={{ marginLeft: '4px', fontSize: '0.8rem' }}>🔽</span>;
  };

  const getHeaderStyle = (key: string) => ({
    padding: '12px',
    cursor: 'pointer',
    userSelect: 'none' as const,
    whiteSpace: 'nowrap' as const
  });

  return (
    <div style={{ position: 'relative', minHeight: '200px', width: '100%' }}>
      {/* Carga sin Flickering (Overlay) - Regla 7 */}
      {loading && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(255, 255, 255, 0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
          borderRadius: '12px',
          backdropFilter: 'blur(1px)'
        }}>
          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes spin-loader {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}} />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              border: '3px solid #cbd5e1',
              borderTop: '3px solid #0f766e',
              borderRadius: '50%',
              animation: 'spin-loader 0.8s linear infinite'
            }} />
            <span style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 'bold' }}>Cargando especies...</span>
          </div>
        </div>
      )}

      {especies.length === 0 && !loading ? (
        <p style={{ color: '#64748b', textAlign: 'center', padding: '40px', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', width: '100%' }}>
          No hay especies registradas.
        </p>
      ) : (
        <div style={{ background: 'white', borderRadius: '12px', overflowX: 'auto', border: '1px solid #e2e8f0', opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s ease', width: '100%' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              <tr>
                <th style={{ padding: '8px', position: 'sticky', left: 0, zIndex: 2, background: '#f8fafc', width: '80px', minWidth: '80px' }}>📷</th>
                <th onClick={() => onSort && onSort('especiesnombre')} style={getHeaderStyle('especiesnombre')}>Nombre {renderSortIndicator('especiesnombre')}</th>
                {!isMobile && <th onClick={() => onSort && onSort('especiesnombrecientifico')} style={getHeaderStyle('especiesnombrecientifico')}>Científico {renderSortIndicator('especiesnombrecientifico')}</th>}
                {!isMobile && <th onClick={() => onSort && onSort('familiasnombre')} style={getHeaderStyle('familiasnombre')}>Familia {renderSortIndicator('familiasnombre')}</th>}
                <th onClick={() => onSort && onSort('especiestipo')} style={getHeaderStyle('especiestipo')}>Tipo {renderSortIndicator('especiestipo')}</th>
                {!isMobile && <th onClick={() => onSort && onSort('total_variedades')} style={getHeaderStyle('total_variedades')}>Variedades {renderSortIndicator('total_variedades')}</th>}
                {!isMobile && <th onClick={() => onSort && onSort('especiesvisibilidadsino')} style={getHeaderStyle('especiesvisibilidadsino')}>Global {renderSortIndicator('especiesvisibilidadsino')}</th>}
                <th style={{ padding: '12px', textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {especies.map((e, i) => {
                const isFocused = focusParam && e.idespecies.toString() === focusParam.toString();
                const hasDependencies = e.total_variedades > 0 || 
                                        (e.total_semillas || 0) > 0 || 
                                        (e.total_cultivos || 0) > 0 ||
                                        e.xespeciesidusuarios !== null ||
                                        (e.total_especiesusuarios || 0) > 0 ||
                                        (e.total_variedadesusuarios || 0) > 0 ||
                                        (e.total_asociacionesbeneficiosas || 0) > 0 ||
                                        (e.total_asociacionesperjudiciales || 0) > 0 ||
                                        (e.total_especiesplagas || 0) > 0;
                const isEven = i % 2 === 0;
                return (
                  <tr 
                    key={e.idespecies} 
                    id={`especie-row-${e.idespecies}`}
                    style={{ 
                      borderBottom: '1px solid #e2e8f0', 
                      background: isFocused ? '#f0fdf4' : (e.especiesvisibilidadsino === 0 ? '#f1f5f9' : (isEven ? 'white' : '#f8fafc')),
                      opacity: e.especiesvisibilidadsino === 0 ? 0.65 : 1,
                      outline: isFocused ? '2px solid #10b981' : 'none',
                      outlineOffset: '-2px',
                      transition: 'all 0.5s ease'
                    }}
                  >
                    <td style={{ padding: '8px', position: 'sticky', left: 0, zIndex: 1, background: isEven ? 'white' : '#f8fafc', width: '80px', minWidth: '80px', textAlign: 'center', verticalAlign: 'middle', cursor: 'pointer' }} onClick={() => onEdit(e.idespecies.toString())} title="Editar Especie">
                      {(() => {
                        if (e.primary_photo_ruta) {
                          let meta: any = {};
                          try { meta = JSON.parse(e.primary_photo_resumen || '{}'); } catch(err){}
                          let baseFilter = meta.profile_style ? STYLE_FILTERS[meta.profile_style] : 'none';
                          if (meta.profile_brightness !== undefined || meta.profile_contrast !== undefined) {
                            baseFilter = `brightness(${meta.profile_brightness ?? 100}%) contrast(${meta.profile_contrast ?? 100}%) ${meta.profile_style ? STYLE_FILTERS[meta.profile_style] : ''}`.trim();
                          }
                          return (
                            <div style={{ width: '56px', height: '56px', borderRadius: '12px', overflow: 'hidden', margin: '0 auto', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', backgroundColor: meta.dominant_color || '#f1f5f9', position: 'relative' }}>
                              {meta.blurhash && (
                                <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
                                  <Blurhash hash={meta.blurhash} width="100%" height="100%" resolutionX={32} resolutionY={32} punch={1} />
                                </div>
                              )}
                              <img 
                                src={getMediaUrl(e.primary_photo_ruta)} 
                                alt={e.especiesnombre} 
                                crossOrigin="anonymous"
                                loading="lazy"
                                style={{ 
                                  width: '100%', 
                                  height: '100%', 
                                  objectFit: 'cover',
                                  filter: baseFilter,
                                  objectPosition: `${meta.profile_object_x ?? 50}% ${meta.profile_object_y ?? 50}%`,
                                  transformOrigin: `${meta.profile_object_x ?? 50}% ${meta.profile_object_y ?? 50}%`,
                                  transform: `scale(${(meta.profile_object_zoom ?? 100) / 100})`,
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  zIndex: 1
                                }} 
                              />
                            </div>
                          );
                        }
                        return e.especiesicono ? <span style={{ fontSize: '2rem' }}>{e.especiesicono}</span> : <div style={{ width: '56px', height: '56px' }} />;
                      })()}
                    </td>
                    <td style={{ padding: '12px', fontWeight: 'bold', color: '#1e293b' }}>
                      <span>{e.especiesnombre}</span>
                    </td>
                    {!isMobile && <td style={{ padding: '12px', fontStyle: 'italic', color: '#64748b' }}>{e.especiesnombrecientifico || '-'}</td>}
                    {!isMobile && <td style={{ padding: '12px' }}>{e.familiasnombre ? `${e.familiasemoji || '🌿'} ${e.familiasnombre}` : '-'}</td>}
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {e.especiestipo?.split(',').map((t: string) => (
                          <span key={t} style={{ background: '#dcfce7', color: '#16a34a', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem' }}>{t}</span>
                        ))}
                      </div>
                    </td>
                    {!isMobile && <td style={{ padding: '12px', fontWeight: 'bold' }}>{e.total_variedades}</td>}
                    {!isMobile && <td style={{ padding: '12px' }}>
                      {e.especiesvisibilidadsino ? (
                        <span style={{ background: '#dcfce7', color: '#16a34a', padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem' }}>🌍 Global</span>
                      ) : (
                        <span style={{ background: '#fef3c7', color: '#d97706', padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem' }}>👤 Privada</span>
                      )}
                    </td>}
                    <td style={{ padding: '12px', width: isMobile ? 'auto' : '295px', minWidth: isMobile ? 'auto' : '295px' }}>
                      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '6px', justifyContent: 'flex-end', alignItems: 'stretch' }}>
                        {/* Col 1: Editor */}
                        <button 
                          onClick={() => onEdit(e.idespecies.toString())} 
                          style={{ background: '#f8fafc', border: '1px solid #cbd5e1', color: '#475569', cursor: 'pointer', fontSize: '0.8rem', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold', width: '100%', textAlign: 'center' }}
                        >
                          Editar
                        </button>

                        {/* Col 2: Reactivar / Inhabilitar */}
                        {e.especiesvisibilidadsino === 0 ? (
                          <button
                            onClick={() => onReactivate(e.idespecies.toString())}
                            style={{
                              background: '#ecfdf5',
                              border: '1px solid #a7f3d0',
                              color: '#059669',
                              cursor: 'pointer',
                              fontSize: '0.8rem',
                              padding: '6px 12px',
                              borderRadius: '6px',
                              fontWeight: 'bold',
                              transition: 'all 0.2s ease',
                              width: '100%',
                              textAlign: 'center'
                            }}
                            onMouseOver={evt => evt.currentTarget.style.background = '#d1fae5'}
                            onMouseOut={evt => evt.currentTarget.style.background = '#ecfdf5'}
                          >
                            Reactivar
                          </button>
                        ) : hasDependencies ? (
                          <button
                            onClick={() => onDelete(e.idespecies.toString(), true)}
                            style={{
                              background: '#fef3c7',
                              border: '1px solid #fde68a',
                              color: '#d97706',
                              cursor: 'pointer',
                              fontSize: '0.8rem',
                              padding: '6px 12px',
                              borderRadius: '6px',
                              fontWeight: 'bold',
                              transition: 'all 0.2s ease',
                              width: '100%',
                              textAlign: 'center'
                            }}
                            onMouseOver={evt => evt.currentTarget.style.background = '#fef08a'}
                            onMouseOut={evt => evt.currentTarget.style.background = '#fef3c7'}
                          >
                            Inhabilitar
                          </button>
                        ) : (
                          <div />
                        )}

                        {/* Col 3: Eliminar */}
                        {!hasDependencies ? (
                          <button
                            onClick={() => onDelete(e.idespecies.toString(), false)}
                            style={{
                              background: '#fee2e2',
                              border: '1px solid #fca5a5',
                              color: '#ef4444',
                              cursor: 'pointer',
                              fontSize: '0.8rem',
                              padding: '6px 12px',
                              borderRadius: '6px',
                              fontWeight: 'bold',
                              transition: 'all 0.2s ease',
                              width: '100%',
                              textAlign: 'center'
                            }}
                            onMouseOver={evt => evt.currentTarget.style.background = '#fecaca'}
                            onMouseOut={evt => evt.currentTarget.style.background = '#fee2e2'}
                          >
                            Eliminar
                          </button>
                        ) : (
                          <div />
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
