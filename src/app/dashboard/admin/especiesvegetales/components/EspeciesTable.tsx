import React, { useState } from 'react';
import PremiumEditButton from '@/components/ui/PremiumEditButton';
import PremiumTableHeader from '@/components/ui/PremiumTableHeader';
import StatusBadge from '@/components/ui/StatusBadge';
import { Blurhash } from 'react-blurhash';
import { getMediaUrl } from '@/lib/media-url';
import PremiumLoadingOverlay from '@/components/ui/PremiumLoadingOverlay';
import styles from './EspeciesTable.module.css';

interface EspeciesTableProps {
  especies: any[];
  loading: boolean;
  focusParam: string | null;
  onEdit: (id: string) => void;
  onDelete: (id: string, hasDependencies: boolean) => void;
  onReactivate: (id: string) => void;
  /** @deprecated isMobile is handled 100% via CSS Modules */
  isMobile?: boolean;
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
  sortConfig,
  onSort
}: EspeciesTableProps) {
  return (
    <div style={{ position: 'relative', minHeight: '200px', width: '100%' }}>
      <PremiumLoadingOverlay isLoading={loading} message="Cargando especies..." />

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
                <PremiumTableHeader sortKey="especiesvegetalesnombre" currentSortConfig={sortConfig} onSort={onSort} label="Nombre" />
                <PremiumTableHeader className={styles.hideOnMobile} sortKey="especiesvegetalesnombrecientifico" currentSortConfig={sortConfig} onSort={onSort} label="Científico" />
                <PremiumTableHeader className={styles.hideOnMobile} sortKey="familiasnombre" currentSortConfig={sortConfig} onSort={onSort} label="Familia" />
                <PremiumTableHeader sortKey="especiestipo" currentSortConfig={sortConfig} onSort={onSort} label="Tipo" />
                <PremiumTableHeader className={styles.hideOnMobile} sortKey="total_variedades" currentSortConfig={sortConfig} onSort={onSort} label="Variedades" />
                <PremiumTableHeader className={styles.hideOnMobile} sortKey="especiesvegetalesvisibilidadsino" currentSortConfig={sortConfig} onSort={onSort} label="Global" />
                <th style={{ padding: '12px', textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {especies.map((e, i) => {
                const isFocused = focusParam && e.idespeciesvegetales.toString() === focusParam.toString();
                const isEven = i % 2 === 0;
                return (
                  <tr 
                    key={e.idespeciesvegetales} 
                    id={`especie-row-${e.idespeciesvegetales}`}
                    style={{ 
                      borderBottom: '1px solid #e2e8f0', 
                      background: isFocused ? '#f0fdf4' : (e.especiesvegetalesvisibilidadsino === 0 ? '#f1f5f9' : (isEven ? 'white' : '#f8fafc')),
                      opacity: e.especiesvegetalesvisibilidadsino === 0 ? 0.65 : 1,
                      outline: isFocused ? '2px solid #10b981' : 'none',
                      outlineOffset: '-2px',
                      transition: 'all 0.5s ease'
                    }}
                  >
                    <td style={{ padding: '8px', position: 'sticky', left: 0, zIndex: 1, background: isEven ? 'white' : '#f8fafc', width: '80px', minWidth: '80px', textAlign: 'center', verticalAlign: 'middle', cursor: 'pointer' }} onClick={() => onEdit(e.idespeciesvegetales.toString())} title="Editar Especie">
                      {(() => {
                        if (e.primary_photo_ruta) {
                          let meta: any = {};
                          try { meta = JSON.parse(e.primary_photo_resumen || '{}'); } catch(err){}
                          let baseFilter = meta.profile_style ? STYLE_FILTERS[meta.profile_style] : 'none';
                          if (meta.profile_brightness !== undefined || meta.profile_contrast !== undefined) {
                            baseFilter = `brightness(${meta.profile_brightness ?? 100}%) contrast(${meta.profile_contrast ?? 100}%) ${meta.profile_style ? STYLE_FILTERS[meta.profile_style] : ''}`.trim();
                          }
                          return (
                            <div className={styles.photoContainer} style={{ backgroundColor: meta.dominant_color || '#f1f5f9' }}>
                              {meta.blurhash && (
                                <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
                                  <Blurhash hash={meta.blurhash} width="100%" height="100%" resolutionX={32} resolutionY={32} punch={1} />
                                </div>
                              )}
                              <img 
                                src={getMediaUrl(e.primary_photo_ruta)} 
                                alt={e.especiesvegetalesnombre} 
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
                        return (
                          <div className={styles.photoContainer} style={{ backgroundColor: '#f1f5f9' }}>
                            <span className={styles.emojiFallback}>{e.especiesvegetalesicono || '🌱'}</span>
                          </div>
                        );
                      })()}
                    </td>
                    <td style={{ padding: '12px', fontWeight: 'bold', color: '#1e293b' }}>
                      <span>{e.especiesvegetalesnombre}</span>
                    </td>
                    <td className={styles.hideOnMobile} style={{ padding: '12px', fontStyle: 'italic', color: '#64748b' }}>
                      {e.especiesvegetalesnombrecientifico || '-'}
                    </td>
                    <td className={styles.hideOnMobile} style={{ padding: '12px' }}>
                      {e.familiasnombre ? `${e.familiasemoji || '🌿'} ${e.familiasnombre}` : '-'}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {e.especiesvegetalestipo?.split(',').map((t: string) => (
                          <span key={t} style={{ background: '#dcfce7', color: '#16a34a', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem' }}>{t}</span>
                        ))}
                      </div>
                    </td>
                    <td className={styles.hideOnMobile} style={{ padding: '12px', fontWeight: 'bold' }}>
                      {e.total_variedades}
                    </td>
                    <td className={styles.hideOnMobile} style={{ padding: '12px' }}>
                      {e.especiesvegetalesvisibilidadsino ? (
                        <StatusBadge status="active" label="Global" icon="🌍" />
                      ) : (
                        <StatusBadge status="warning" label="Privada" icon="👤" />
                      )}
                    </td>
                    <td className={styles.actionColumn}>
                      <div className={styles.actionContainer}>
                        <PremiumEditButton onClick={() => onEdit(e.idespeciesvegetales.toString())} />
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
