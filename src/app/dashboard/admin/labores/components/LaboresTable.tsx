import React from 'react';
import { useRouter } from 'next/navigation';
import { getMediaUrl } from '@/lib/media-url';

const MDI_TO_EMOJI: Record<string, string> = {
  'mdi-water': '💧',
  'mdi-shovel': '⛏️',
  'mdi-bottle-tonic-plus': '✨',
  'mdi-content-cut': '✂️',
  'mdi-format-line-spacing': '🎋',
  'mdi-bug-check': '🛡️',
  'mdi-vector-difference': '🖐️',
  'mdi-layers': '🍂',
  'mdi-basket': '🧺',
  'mdi-agriculture': '🚜',
  'mdi-tractor': '🚜',
  'mdi-tag-outline': '🏷️'
};

interface LaboresTableProps {
  labores: any[];
  handleDelete: (id: number) => void;
  isMobile?: boolean;
  sortConfig?: { key: string, direction: 'asc' | 'desc' } | null;
  onSort?: (key: string) => void;
}

export function LaboresTable({ labores, handleDelete, isMobile = false, sortConfig, onSort }: LaboresTableProps) {
  const router = useRouter();

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
    <div style={{ background: 'white', borderRadius: '12px', overflowX: 'auto', border: '1px solid #e2e8f0' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
          <tr>
            <th style={{ padding: '12px', width: '80px', textAlign: 'center', position: 'sticky', left: 0, zIndex: 2, background: '#f8fafc' }}>Icono</th>
            <th onClick={() => onSort && onSort('laboresnombre')} style={getHeaderStyle('laboresnombre')}>Nombre {renderSortIndicator('laboresnombre')}</th>
            {!isMobile && <th onClick={() => onSort && onSort('laboresdescripcion')} style={getHeaderStyle('laboresdescripcion')}>Descripción {renderSortIndicator('laboresdescripcion')}</th>}
            <th style={{ padding: '12px', textAlign: 'center' }}>Aplica a</th>
            <th onClick={() => onSort && onSort('laboresactivosino')} style={getHeaderStyle('laboresactivosino')}>Estado {renderSortIndicator('laboresactivosino')}</th>
            <th style={{ padding: '12px', textAlign: 'right' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {labores.length === 0 ? (
            <tr><td colSpan={6} style={{ textAlign: 'center', padding: '20px' }}>No hay labores definidas</td></tr>
          ) : (
            labores.map(labor => {
              let icono = labor.laboresicono || '🌱';
              if (icono.startsWith('mdi-')) icono = MDI_TO_EMOJI[icono] || '🌱';

              return (
                <tr key={labor.idlabores} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '8px', textAlign: 'center', verticalAlign: 'middle', position: 'sticky', left: 0, zIndex: 1, background: 'white', width: '80px', minWidth: '80px', cursor: 'pointer' }} onClick={() => router.push(`/dashboard/admin/labores/${labor.idlabores}`)} title="Editar Labor">
                    <div style={{ width: '56px', height: '56px', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', fontSize: '1.8rem', border: '1px solid #e2e8f0' }}>
                      {(() => {
                        if (labor.primary_photo_ruta) {
                          let meta: any = {};
                          try { meta = JSON.parse(labor.primary_photo_resumen || '{}'); } catch(err){}
                          const STYLE_FILTERS: Record<string, string> = {
                            none: 'none', vivid: 'saturate(1.3) contrast(1.1)', warm: 'sepia(0.25) saturate(1.2)',
                            cool: 'saturate(0.9) hue-rotate(15deg)', bw: 'grayscale(1)', vintage: 'sepia(0.4) contrast(0.9) brightness(1.1)',
                            dramatic: 'contrast(1.4) saturate(1.2)', soft: 'brightness(1.1) contrast(0.9) saturate(0.9)',
                          };
                          let baseFilter = meta.profile_style ? STYLE_FILTERS[meta.profile_style] : 'none';
                          if (meta.profile_brightness !== undefined || meta.profile_contrast !== undefined) {
                            baseFilter = `brightness(${meta.profile_brightness ?? 100}%) contrast(${meta.profile_contrast ?? 100}%) ${meta.profile_style ? STYLE_FILTERS[meta.profile_style] : ''}`.trim();
                          }
                          return (
                            <div style={{ width: '100%', height: '100%', borderRadius: '12px', overflow: 'hidden', margin: '0 auto', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', backgroundColor: meta.dominant_color || '#f1f5f9', position: 'relative' }}>
                              <img 
                                src={getMediaUrl(labor.primary_photo_ruta)} 
                                alt={labor.laboresnombre}
                                crossOrigin="anonymous"
                                loading="lazy"
                                style={{ 
                                  width: '100%', height: '100%', objectFit: 'cover',
                                  filter: baseFilter,
                                  objectPosition: `${meta.profile_object_x ?? 50}% ${meta.profile_object_y ?? 50}%`,
                                  transformOrigin: `${meta.profile_object_x ?? 50}% ${meta.profile_object_y ?? 50}%`,
                                  transform: `scale(${(meta.profile_object_zoom ?? 100) / 100})`,
                                  position: 'absolute', top: 0, left: 0, zIndex: 1
                                }} 
                              />
                            </div>
                          );
                        }
                        return <span style={{ fontSize: '2rem' }}>{icono}</span>;
                      })()}
                    </div>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ 
                        display: 'inline-block', width: '12px', height: '12px', 
                        borderRadius: '50%', backgroundColor: labor.laborescolor || '#64748b' 
                      }}></span>
                      <strong style={{ color: '#1e293b' }}>{labor.laboresnombre}</strong>
                    </div>
                  </td>
                  {!isMobile && (
                    <td style={{ padding: '12px', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#64748b' }}>
                      {labor.laboresdescripcion}
                    </td>
                  )}
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                      {labor.laboresaplicaconvencional === 1 && <span title="Convencional">🚜</span>}
                      {labor.laboresaplicaminimo === 1 && <span title="Mínimo">⛏️</span>}
                      {labor.laboresaplicanolaboreo === 1 && <span title="No laboreo">🚫</span>}
                    </div>
                  </td>
                  <td style={{ padding: '12px' }}>
                    {labor.laboresactivosino === 1 
                      ? <span style={{ background: '#dcfce7', color: '#16a34a', padding: '4px 8px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 'bold' }}>Activo</span>
                      : <span style={{ background: '#f1f5f9', color: '#64748b', padding: '4px 8px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 'bold' }}>Inactivo</span>}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }} onClick={() => router.push(`/dashboard/admin/labores/${labor.idlabores}`)} title="Editar">✏️</button>
                      <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }} onClick={() => handleDelete(labor.idlabores)} title="Eliminar">🗑️</button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
