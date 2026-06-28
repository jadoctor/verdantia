import React from 'react';
import { dashboards, getCategory, FRIENDLY_NAMES, getDashboardGroup, DASHBOARD_GROUPS } from '../services/analisisApi';
import { AnalisisRowDetails } from './AnalisisRowDetails';

interface AnalisisTableProps {
  sortedDashboards: typeof dashboards;
  maxLines: number;
  origin: string;
  isMobile: boolean;
  analysisData: Record<string, any>;
  loading: Record<string, boolean>;
  expanded: Record<string, boolean>;
  completedDates: Record<string, { refactoredAt: string | null; responsiveAt: string | null; premiumAt: string | null }>;
  restored: boolean;
  focoFile: string | null;
  sortBy: string;
  sortDirection: string;
  handleSort: (field: 'ruta' | 'acceso' | 'categoria' | 'lineas') => void;
  handleTriggerAnalysis: (file: string) => void;
  saveAndNavigate: (path: string, file: string) => void;
}

export function AnalisisTable({
  sortedDashboards, maxLines, origin, isMobile, analysisData,
  loading, expanded, completedDates, restored, focoFile,
  sortBy, sortDirection, handleSort, handleTriggerAnalysis, saveAndNavigate
}: AnalisisTableProps) {

  const SortIcon = ({ field }: { field: string }) => {
    if (sortBy !== field) return <span style={{ opacity: 0.3, fontSize: '0.7rem' }}>⇅</span>;
    return <span style={{ fontSize: '0.7rem' }}>{sortDirection === 'asc' ? '↑' : '↓'}</span>;
  };

  return (
    <div style={{ overflowX: 'auto', width: '100%' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: isMobile ? '0.8rem' : '0.9rem' }}>
        <thead>
          <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #e2e8f0' }}>
            <th onClick={() => handleSort('ruta')} style={{ padding: '10px 8px', textAlign: 'left', fontWeight: 700, cursor: 'pointer', userSelect: 'none', color: '#475569', whiteSpace: 'nowrap' }}>
              📄 Ruta <SortIcon field="ruta" />
            </th>
            {!isMobile && (
              <th onClick={() => handleSort('acceso')} style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 700, cursor: 'pointer', userSelect: 'none', color: '#475569', whiteSpace: 'nowrap' }}>
                🔑 Acceso <SortIcon field="acceso" />
              </th>
            )}
            <th onClick={() => handleSort('categoria')} style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 700, cursor: 'pointer', userSelect: 'none', color: '#475569', whiteSpace: 'nowrap' }}>
              🏷️ Cat. <SortIcon field="categoria" />
            </th>
            <th onClick={() => handleSort('lineas')} style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 700, cursor: 'pointer', userSelect: 'none', color: '#475569', whiteSpace: 'nowrap', width: isMobile ? '60px' : '90px' }}>
              📏 Líneas <SortIcon field="lineas" />
            </th>
            <th style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 700, color: '#475569', whiteSpace: 'nowrap' }}>
              ⚡ Acciones
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedDashboards.map((d) => {
            const tag = getCategory(d.lines);
            const pct = (d.lines / maxLines) * 100;
            const groupId = getDashboardGroup(d.path);
            const groupDef = DASHBOARD_GROUPS.find(g => g.id === groupId) || DASHBOARD_GROUPS.find(g => g.id === 'otros')!;
            const groupEmoji = groupDef.label.split(' ')[0] || '🧩';
            const friendlyName = FRIENDLY_NAMES[d.path] || d.path;
            const isFocused = focoFile === d.file;

            const effectiveRefactoredAt = (restored && completedDates[d.file]?.refactoredAt) || d.refactoredAt;
            const effectiveResponsiveAt = (restored && completedDates[d.file]?.responsiveAt) || d.responsiveAt;
            const effectivePremiumAt = (restored && completedDates[d.file]?.premiumAt) || d.premiumAt;

            const allClean = !!effectiveRefactoredAt && !!effectiveResponsiveAt && !!effectivePremiumAt;
            const anyDone = !!effectiveRefactoredAt || !!effectiveResponsiveAt || !!effectivePremiumAt;
            const isLoading = loading[d.file];
            const isExpanded = expanded[d.file];

            return (
              <React.Fragment key={d.file}>
                <tr
                  id={`row-${d.file.replace(/\//g, '-')}`}
                  style={{
                    borderBottom: '1px solid #e2e8f0',
                    transition: 'all 0.3s ease',
                    background: isFocused ? '#fef3c7' : 'white',
                    animation: isFocused ? 'pulse 1.5s ease-in-out 2' : 'none'
                  }}
                >
                  {/* Ruta */}
                  <td style={{ padding: '8px', maxWidth: isMobile ? '140px' : '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '0.65rem', padding: '1px 5px', borderRadius: '4px', background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {groupEmoji}
                      </span>
                      <span title={d.path} style={{ fontWeight: 500 }}>
                        {isMobile ? d.file.split('/').pop() : friendlyName}
                      </span>
                    </div>
                    {/* Indicadores de estado */}
                    <div style={{ display: 'flex', gap: '4px', marginTop: '3px' }}>
                      <span title={effectiveRefactoredAt ? `Código: ${effectiveRefactoredAt}` : 'Código: pendiente'} style={{ fontSize: '0.6rem', padding: '0px 4px', borderRadius: '3px', background: effectiveRefactoredAt ? '#dcfce7' : '#fee2e2', color: effectiveRefactoredAt ? '#166534' : '#991b1b' }}>
                        💻{effectiveRefactoredAt ? '✓' : '✗'}
                      </span>
                      <span title={effectiveResponsiveAt ? `Responsive: ${effectiveResponsiveAt}` : 'Responsive: pendiente'} style={{ fontSize: '0.6rem', padding: '0px 4px', borderRadius: '3px', background: effectiveResponsiveAt ? '#dcfce7' : '#fee2e2', color: effectiveResponsiveAt ? '#166534' : '#991b1b' }}>
                        📱{effectiveResponsiveAt ? '✓' : '✗'}
                      </span>
                      <span title={effectivePremiumAt ? `Premium: ${effectivePremiumAt}` : 'Premium: pendiente'} style={{ fontSize: '0.6rem', padding: '0px 4px', borderRadius: '3px', background: effectivePremiumAt ? '#dcfce7' : '#fee2e2', color: effectivePremiumAt ? '#166534' : '#991b1b' }}>
                        👑{effectivePremiumAt ? '✓' : '✗'}
                      </span>
                    </div>
                  </td>

                  {/* Acceso */}
                  {!isMobile && (
                    <td style={{ padding: '8px', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '6px', background: d.path.startsWith('/dashboard/admin/') ? '#fef3c7' : '#e0f2fe', color: d.path.startsWith('/dashboard/admin/') ? '#92400e' : '#0369a1', fontWeight: 600 }}>
                        {d.path.startsWith('/dashboard/admin/') ? '🛡️ Admin' : '👤 User'}
                      </span>
                    </td>
                  )}

                  {/* Categoría */}
                  <td style={{ padding: '8px', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '6px', background: tag.bg, color: tag.color, fontWeight: 700 }}>
                      {tag.emoji} {tag.label}
                    </span>
                  </td>

                  {/* Líneas con barra */}
                  <td style={{ padding: '8px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                      <div style={{ width: isMobile ? '30px' : '50px', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: tag.color, borderRadius: '3px', transition: 'width 0.5s ease' }} />
                      </div>
                      <span style={{ fontWeight: 700, fontSize: '0.8rem', color: '#334155' }}>{d.lines.toLocaleString()}</span>
                    </div>
                  </td>

                  {/* Acciones: botón único + ver */}
                  <td style={{ padding: '8px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => handleTriggerAnalysis(d.file)}
                        disabled={isLoading}
                        style={{
                          background: allClean ? '#dcfce7' : anyDone ? '#fef3c7' : '#fee2e2',
                          color: allClean ? '#166534' : anyDone ? '#92400e' : '#991b1b',
                          border: `1px solid ${allClean ? '#86efac' : anyDone ? '#fcd34d' : '#fca5a5'}`,
                          padding: isMobile ? '4px 8px' : '5px 12px',
                          borderRadius: '8px',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: isLoading ? 'wait' : 'pointer',
                          transition: 'all 0.2s ease',
                          opacity: isLoading ? 0.6 : 1,
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {isLoading ? '⏳ Analizando...' : '🔬 Analizar'}
                      </button>
                      <span
                        className="ver-link"
                        tabIndex={0}
                        onClick={() => saveAndNavigate(d.path, d.file)}
                        style={{ cursor: 'pointer', fontSize: '0.78rem', color: '#6366f1', fontWeight: 600, textDecoration: 'underline', whiteSpace: 'nowrap' }}
                      >
                        👁️ Ver
                      </span>
                    </div>
                  </td>
                </tr>

                {/* Panel expandible con los 3 análisis */}
                {isExpanded && (
                  <tr>
                    <td colSpan={isMobile ? 4 : 5} style={{ padding: 0 }}>
                      <AnalisisRowDetails
                        file={d.file}
                        data={analysisData[d.file]}
                        isLoading={isLoading}
                        isMobile={isMobile}
                      />
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
