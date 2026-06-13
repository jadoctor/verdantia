import React from 'react';
import { DashboardItem, FRIENDLY_NAMES, getCategory } from '../services/analisisApi';
import { AnalisisRowDetails } from './AnalisisRowDetails';

interface AnalisisTableProps {
  sortedDashboards: DashboardItem[];
  sortBy: 'ruta' | 'acceso' | 'categoria' | 'lineas';
  sortDirection: 'desc' | 'asc';
  handleSort: (field: 'ruta' | 'acceso' | 'categoria' | 'lineas') => void;
  maxLines: number;
  loadingCode: Record<string, boolean>;
  loadingResponsive: Record<string, boolean>;
  expandedCode: Record<string, boolean>;
  expandedResponsive: Record<string, boolean>;
  analysisData: Record<string, any>;
  changesInfo: any;
  completedDates: Record<string, { refactoredAt: string | null; responsiveAt: string | null }>;
  restored: boolean;
  focoFile: string | null;
  setLastFocusedFile: (file: string | null) => void;
  handleTriggerAnalysis: (file: string, type: 'code' | 'responsive') => void;
  saveAndNavigate: (path: string, file: string) => void;
  isMobile?: boolean;
}

export function AnalisisTable({
  sortedDashboards,
  sortBy,
  sortDirection,
  handleSort,
  maxLines,
  loadingCode,
  loadingResponsive,
  expandedCode,
  expandedResponsive,
  analysisData,
  changesInfo,
  completedDates,
  restored,
  focoFile,
  setLastFocusedFile,
  handleTriggerAnalysis,
  saveAndNavigate,
  isMobile = false
}: AnalisisTableProps) {
  const renderSortIcon = (field: 'ruta' | 'acceso' | 'categoria' | 'lineas') => {
    if (sortBy !== field) return <span style={{ marginLeft: '4px', opacity: 0.35 }}>↕</span>;
    return <span style={{ marginLeft: '4px', color: '#6366f1', fontWeight: 900 }}>{sortDirection === 'asc' ? '▲' : '▼'}</span>;
  };
  return (
    <div style={{ overflowX: 'auto', width: '100%' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: isMobile ? '800px' : '1000px' }}>
        <thead>
          <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
            <th style={{ padding: '10px 8px', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', width: '50px' }}>#</th>
            <th
              onClick={() => handleSort('ruta')}
              style={{
                padding: '10px 16px',
                textAlign: 'left',
                fontSize: '0.72rem',
                fontWeight: 700,
                color: sortBy === 'ruta' ? '#4f46e5' : '#64748b',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                width: '18%',
                cursor: 'pointer',
                userSelect: 'none',
                transition: 'all 0.2s'
              }}
              onMouseOver={e => e.currentTarget.style.background = '#e2e8f0'}
              onMouseOut={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ display: 'flex', alignItems: 'center' }}>
                Dashboard {renderSortIcon('ruta')}
              </div>
            </th>
            <th
              onClick={() => handleSort('acceso')}
              style={{
                padding: '10px 16px',
                textAlign: 'left',
                fontSize: '0.72rem',
                fontWeight: 700,
                color: sortBy === 'acceso' ? '#4f46e5' : '#64748b',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                width: '12%',
                cursor: 'pointer',
                userSelect: 'none',
                transition: 'all 0.2s'
              }}
              onMouseOver={e => e.currentTarget.style.background = '#e2e8f0'}
              onMouseOut={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ display: 'flex', alignItems: 'center' }}>
                Acceso {renderSortIcon('acceso')}
              </div>
            </th>
            <th
              onClick={() => handleSort('categoria')}
              style={{
                padding: '10px 16px',
                textAlign: 'left',
                fontSize: '0.72rem',
                fontWeight: 700,
                color: sortBy === 'categoria' ? '#4f46e5' : '#64748b',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                width: '12%',
                cursor: 'pointer',
                userSelect: 'none',
                transition: 'all 0.2s'
              }}
              onMouseOver={e => e.currentTarget.style.background = '#e2e8f0'}
              onMouseOut={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ display: 'flex', alignItems: 'center' }}>
                Categoría {renderSortIcon('categoria')}
              </div>
            </th>
            <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', width: '18%' }}>Peso Visual</th>
            <th
              onClick={() => handleSort('lineas')}
              style={{
                padding: '10px 16px',
                textAlign: 'right',
                fontSize: '0.72rem',
                fontWeight: 700,
                color: sortBy === 'lineas' ? '#4f46e5' : '#64748b',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                width: '6%',
                cursor: 'pointer',
                userSelect: 'none',
                transition: 'all 0.2s'
              }}
              onMouseOver={e => e.currentTarget.style.background = '#e2e8f0'}
              onMouseOut={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                Líneas {renderSortIcon('lineas')}
              </div>
            </th>
            <th style={{ padding: '10px 16px', textAlign: 'center', fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', width: isMobile ? '240px' : '32%', minWidth: isMobile ? '240px' : '570px' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {sortedDashboards.map((d, i) => {
            const pct = Math.round((d.lines / maxLines) * 100);
            const isEven = i % 2 === 0;
            const barColor = pct > 60 ? '#ef4444' : pct > 30 ? '#f59e0b' : '#22c55e';
            const cat = getCategory(d.lines);
            const isCodeLoading = loadingCode[d.file];
            const isResponsiveLoading = loadingResponsive[d.file];
            const isExpanded = expandedCode[d.file] || expandedResponsive[d.file];
            const isLoadingCurrent = expandedCode[d.file] ? isCodeLoading : isResponsiveLoading;
            const analysis = analysisData[d.file];
            const isMod = changesInfo?.modified?.includes(`src/app/dashboard/${d.file}`) || 
                          changesInfo?.added?.includes(`src/app/dashboard/${d.file}`) || 
                          changesInfo?.deleted?.includes(`src/app/dashboard/${d.file}`);

            const effectiveRefactoredAt = (restored && completedDates[d.file] && completedDates[d.file].refactoredAt) || d.refactoredAt;
            const effectiveResponsiveAt = (restored && completedDates[d.file] && completedDates[d.file].responsiveAt) || d.responsiveAt;

            // Estilo dinámico para Análisis de código
            const codeBtnStyle: React.CSSProperties = {
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '0.72rem',
              fontWeight: 700,
              cursor: (isCodeLoading || isResponsiveLoading) ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap',
              width: isMobile ? '100%' : '255px',
              transition: 'all 0.2s',
              background: '#fef2f2',
              color: '#dc2626',
              border: '1px solid #fca5a5'
            };

            if (isCodeLoading) {
              codeBtnStyle.background = '#f1f5f9';
              codeBtnStyle.color = '#64748b';
              codeBtnStyle.border = '1px solid #cbd5e1';
            } else if (effectiveRefactoredAt) {
              if (isMod) {
                codeBtnStyle.background = '#f0fdf4';
                codeBtnStyle.color = '#16a34a';
                codeBtnStyle.border = '1px solid #bbf7d0';
              } else {
                codeBtnStyle.background = '#15803d';
                codeBtnStyle.color = '#ffffff';
                codeBtnStyle.border = '1px solid #166534';
              }
            }

            // Estilo dinámico para Análisis responsive
            const respBtnStyle: React.CSSProperties = {
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '0.72rem',
              fontWeight: 700,
              cursor: (isCodeLoading || isResponsiveLoading) ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap',
              width: isMobile ? '100%' : '235px',
              transition: 'all 0.2s',
              background: '#fef2f2',
              color: '#dc2626',
              border: '1px solid #fca5a5'
            };

            if (isResponsiveLoading) {
              respBtnStyle.background = '#f1f5f9';
              respBtnStyle.color = '#64748b';
              respBtnStyle.border = '1px solid #cbd5e1';
            } else if (effectiveResponsiveAt) {
              if (isMod) {
                respBtnStyle.background = '#f0fdf4';
                respBtnStyle.color = '#16a34a';
                respBtnStyle.border = '1px solid #bbf7d0';
              } else {
                respBtnStyle.background = '#15803d';
                respBtnStyle.color = '#ffffff';
                respBtnStyle.border = '1px solid #166534';
              }
            }

            return (
              <React.Fragment key={d.path}>
                <tr
                  id={`row-${d.file.replace(/\//g, '-')}`}
                  onFocusCapture={() => setLastFocusedFile(d.file)}
                  onClick={() => setLastFocusedFile(d.file)}
                  style={{
                    background: focoFile === d.file ? '#e0e7ff' : (isEven ? 'white' : '#f8fafc'),
                    outline: focoFile === d.file ? '2px solid #6366f1' : 'none',
                    outlineOffset: '-2px',
                    transition: 'all 0.5s ease-in-out'
                  }}
                  onMouseEnter={e => {
                    if (focoFile !== d.file) e.currentTarget.style.background = '#eff6ff';
                  }}
                  onMouseLeave={e => {
                    if (focoFile !== d.file) e.currentTarget.style.background = isEven ? 'white' : '#f8fafc';
                  }}
                >
                  <td style={{ padding: '10px 8px', fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', width: '50px' }}>{i + 1}</td>
                  <td style={{ padding: '10px 16px' }}>
                    <span style={{ fontSize: '0.98rem', fontWeight: 800, color: '#1e293b', display: 'inline-block', marginBottom: '4px' }}>
                      {FRIENDLY_NAMES[d.path] || 'Página'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    {d.path.startsWith('/dashboard/admin/') ? (
                      <span style={{
                        background: '#fee2e2',
                        border: '1px solid #fca5a5',
                        color: '#991b1b',
                        padding: '3px 10px',
                        borderRadius: '999px',
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        whiteSpace: 'nowrap'
                      }}>
                        🛡️ Superadmin
                      </span>
                    ) : (
                      <span style={{
                        background: '#f1f5f9',
                        border: '1px solid #e2e8f0',
                        color: '#475569',
                        padding: '3px 10px',
                        borderRadius: '999px',
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        whiteSpace: 'nowrap'
                      }}>
                        👥 General
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '5px',
                      padding: '3px 10px', borderRadius: '999px',
                      background: cat.bg, color: cat.color,
                      fontSize: '0.72rem', fontWeight: 700, whiteSpace: 'nowrap'
                    }}>
                      {cat.emoji} {cat.label}
                    </span>
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ flex: 1, background: '#f1f5f9', borderRadius: '999px', height: '8px', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: barColor, borderRadius: '999px', transition: 'width 0.4s ease' }} />
                      </div>
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, color: barColor, minWidth: '32px', textAlign: 'right' }}>{pct}%</span>
                    </div>
                  </td>
                  <td style={{ padding: '10px 16px', textAlign: 'right', fontSize: '0.88rem', fontWeight: 800, color: '#1e293b', fontFamily: 'monospace' }}>
                    {d.lines.toLocaleString('es-ES')}
                  </td>
                  <td style={{ padding: '8px 16px', textAlign: 'center', width: isMobile ? '240px' : '32%', minWidth: isMobile ? '240px' : '570px' }}>
                    <div style={{ 
                      display: 'flex', 
                      gap: '6px', 
                      justifyContent: 'center', 
                      flexWrap: 'wrap',
                      flexDirection: isMobile ? 'column' : 'row',
                      alignItems: isMobile ? 'stretch' : 'center'
                    }}>
                      <button
                        onClick={() => handleTriggerAnalysis(d.file, 'code')}
                        disabled={isCodeLoading || isResponsiveLoading}
                        style={codeBtnStyle}
                      >
                        {isCodeLoading ? '⏳ Analizando...' : (
                          effectiveRefactoredAt ? (
                            isMod ? `🔍 Análisis de código (${effectiveRefactoredAt} ⚠️ Modif.)` : `🔍 Análisis de código (${effectiveRefactoredAt})`
                          ) : '🔍 Análisis de código'
                        )}
                      </button>
                      <button
                        onClick={() => handleTriggerAnalysis(d.file, 'responsive')}
                        disabled={isCodeLoading || isResponsiveLoading}
                        style={respBtnStyle}
                      >
                        {isResponsiveLoading ? '⏳ Analizando...' : (
                          effectiveResponsiveAt ? (
                            isMod ? (
                              <span>
                                📱 Análisis responsive (<span style={{ color: '#ef4444', fontWeight: 'bold' }}>{effectiveResponsiveAt}</span>)
                              </span>
                            ) : `📱 Análisis responsive (${effectiveResponsiveAt})`
                          ) : '📱 Análisis responsive'
                        )}
                      </button>
                      <a
                        href={d.path}
                        className="ver-link"
                        onClick={e => { e.preventDefault(); saveAndNavigate(d.path, d.file); }}
                        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '3px', padding: '4px 9px', borderRadius: '6px', background: '#eff6ff', color: '#2563eb', fontSize: '0.72rem', fontWeight: 700, textDecoration: 'none', border: '1px solid #bfdbfe', whiteSpace: 'nowrap', cursor: 'pointer', width: isMobile ? '100%' : '60px' }}
                      >🔗 Ver</a>
                    </div>
                  </td>
                </tr>
                {isExpanded && (
                  <tr 
                    style={{ background: '#f8fafc' }}
                    onFocusCapture={() => setLastFocusedFile(d.file)}
                    onClick={() => setLastFocusedFile(d.file)}
                  >
                    <td colSpan={7} style={{ padding: 0, background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                      <AnalisisRowDetails
                        d={d}
                        analysis={analysis}
                        isLoadingCurrent={isLoadingCurrent}
                        expandedCode={expandedCode}
                        expandedResponsive={expandedResponsive}
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
