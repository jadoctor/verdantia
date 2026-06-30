import React, { useState } from 'react';
import { dashboards, getCategory, FRIENDLY_NAMES, getDashboardGroup, DASHBOARD_GROUPS } from '../services/analisisApi';
import { AnalisisRowDetails } from './AnalisisRowDetails';
import PremiumModal from '@/components/ui/PremiumModal';
import PremiumModalHeader from '@/components/ui/PremiumModalHeader';

interface AnalisisTableProps {
  sortedDashboards: typeof dashboards;
  maxLines: number;
  origin: string;
  isMobile: boolean;
  analysisData: Record<string, any>;
  lastAnalyzedAt: Record<string, string | null>;
  loading: Record<string, boolean>;
  expanded: Record<string, boolean>;
  completedDates: Record<string, { refactoredAt: string | null; responsiveAt: string | null; premiumAt: string | null }>;
  restored: boolean;
  focoFile: string | null;
  sortBy: string;
  sortDirection: string;
  handleSort: (field: 'ruta' | 'acceso' | 'categoria' | 'lineas') => void;
  handleTriggerAnalysis: (file: string, analyzeFile?: string) => void;
  saveAndNavigate: (path: string, file: string) => void;
}

export function AnalisisTable({
  sortedDashboards, maxLines, origin, isMobile, analysisData,
  lastAnalyzedAt, loading, expanded, completedDates, restored, focoFile,
  sortBy, sortDirection, handleSort, handleTriggerAnalysis, saveAndNavigate
}: AnalisisTableProps) {
  const [modalFile, setModalFile] = useState<string | null>(null);
  const getAnalysisKey = (d: typeof dashboards[0]) => d.analyzeFile || d.file;

  const handleOpenModal = (file: string, analyzeFile?: string) => {
    setModalFile(file);
    handleTriggerAnalysis(file, analyzeFile);
  };

  const handleCloseModal = () => {
    setModalFile(null);
  };

  // Helpers para calcular estado real de cada análisis
  const getCodeStatus = (d: typeof dashboards[0]) => {
    const analysisKey = getAnalysisKey(d);
    const data = analysisData[analysisKey];
    if (data?.code) {
      const score = data.code.score ?? 0;
      if (score === 100) return { label: '100%', icon: '✓', bg: '#dcfce7', color: '#166534', title: `Código: ${score}%` };
      if (score >= 40) return { label: `${score}%`, icon: '', bg: '#fef3c7', color: '#92400e', title: `Código: ${score}%` };
      return { label: `${score}%`, icon: '', bg: '#fee2e2', color: '#991b1b', title: `Código: ${score}%` };
    }
    if (data?.plan) {
      const clean = data.plan.every((p: string) => p.startsWith('✅'));
      const total = data.plan.length;
      const done = data.plan.filter((p: string) => p.startsWith('✅')).length;
      const score = clean ? 100 : total === 0 ? 100 : Math.round((done / total) * 100);
      if (score === 100) return { label: '100%', icon: '✓', bg: '#dcfce7', color: '#166534', title: `Código: ${score}%` };
      if (score >= 40) return { label: `${score}%`, icon: '', bg: '#fef3c7', color: '#92400e', title: `Código: ${score}%` };
      return { label: `${score}%`, icon: '', bg: '#fee2e2', color: '#991b1b', title: `Código: ${score}%` };
    }
    const dt = (restored && completedDates[analysisKey]?.refactoredAt) || (d.analyzeFile ? null : d.refactoredAt);
    if (dt) return { label: '100%', icon: '✓', bg: '#dcfce7', color: '#166534', title: `Código: ${dt}` };
    return { label: '0%', icon: '✗', bg: '#fee2e2', color: '#991b1b', title: 'Código: pendiente' };
  };

  const getResponsiveStatus = (d: typeof dashboards[0]) => {
    const analysisKey = getAnalysisKey(d);
    const data = analysisData[analysisKey];
    if (data?.responsiveness) {
      const score = data.responsiveness.score ?? 0;
      if (score === 100) return { label: '100%', icon: '✓', bg: '#dcfce7', color: '#166534', title: `Responsive: ${score}%` };
      if (score >= 40) return { label: `${score}%`, icon: '', bg: '#fef3c7', color: '#92400e', title: `Responsive: ${score}%` };
      return { label: `${score}%`, icon: '', bg: '#fee2e2', color: '#991b1b', title: `Responsive: ${score}%` };
    }
    const dt = (restored && completedDates[analysisKey]?.responsiveAt) || (d.analyzeFile ? null : d.responsiveAt);
    if (dt) return { label: '100%', icon: '✓', bg: '#dcfce7', color: '#166534', title: `Responsive: ${dt}` };
    return { label: '0%', icon: '✗', bg: '#fee2e2', color: '#991b1b', title: 'Responsive: pendiente' };
  };

  const getPremiumStatus = (d: typeof dashboards[0]) => {
    const analysisKey = getAnalysisKey(d);
    const data = analysisData[analysisKey];
    if (data?.premium) {
      const score = data.premium.score ?? 0;
      if (score === 100) return { label: '100%', icon: '✓', bg: '#dcfce7', color: '#166534', title: `Premium: ${score}%` };
      if (score >= 40) return { label: `${score}%`, icon: '', bg: '#fef3c7', color: '#92400e', title: `Premium: ${score}%` };
      return { label: `${score}%`, icon: '', bg: '#fee2e2', color: '#991b1b', title: `Premium: ${score}%` };
    }
    const dt = (restored && completedDates[analysisKey]?.premiumAt) || (d.analyzeFile ? null : d.premiumAt);
    if (dt) return { label: '100%', icon: '✓', bg: '#dcfce7', color: '#166534', title: `Premium: ${dt}` };
    return { label: '0%', icon: '✗', bg: '#fee2e2', color: '#991b1b', title: 'Premium: pendiente' };
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortBy !== field) return <span style={{ opacity: 0.3, fontSize: '0.7rem' }}>⇅</span>;
    return <span style={{ fontSize: '0.7rem' }}>{sortDirection === 'asc' ? '↑' : '↓'}</span>;
  };

  const thStyle: React.CSSProperties = { padding: '10px 4px', textAlign: 'center', fontWeight: 700, color: '#475569', whiteSpace: 'nowrap', fontSize: '0.8rem' };
  const statusCellStyle: React.CSSProperties = { padding: '6px 4px', textAlign: 'center' };
  const getLastAnalysisLabel = (d: typeof dashboards[0]) => {
    const analysisKey = getAnalysisKey(d);
    return lastAnalyzedAt[analysisKey]
      || (restored && (completedDates[analysisKey]?.premiumAt || completedDates[analysisKey]?.responsiveAt || completedDates[analysisKey]?.refactoredAt))
      || (d.analyzeFile ? null : d.premiumAt)
      || (d.analyzeFile ? null : d.responsiveAt)
      || (d.analyzeFile ? null : d.refactoredAt)
      || 'Sin analizar';
  };

  return (
    <div style={{ overflowX: 'auto', width: '100%', padding: '4px' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .premium-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          background: white;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.05), 0 2px 8px -1px rgba(15, 23, 42, 0.03);
          border: 1px solid #e2e8f0;
        }
        .premium-table th {
          background: #f8fafc;
          border-bottom: 2px solid #e2e8f0;
          padding: 14px 12px;
          font-weight: 700;
          color: #475569;
          font-size: 0.75rem;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          transition: background-color 0.2s ease, color 0.2s ease;
          user-select: none;
        }
        .premium-table th.sortable:hover {
          background: #f1f5f9;
          color: #0f766e;
        }
        .premium-table tbody tr {
          transition: all 0.2s ease-in-out;
        }
        .premium-table tbody tr:hover {
          background: #f8fafc !important;
          transform: translateY(-1px);
          box-shadow: inset 0 -1px 0 #e2e8f0, 0 6px 16px -4px rgba(15, 23, 42, 0.06);
        }
        .premium-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-weight: 700;
          border-radius: 9999px;
          transition: all 0.2s ease;
        }
        .premium-badge:hover {
          transform: translateY(-1px);
          filter: brightness(1.03);
        }
        .action-btn-premium {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          padding: 6px 14px;
          font-size: 0.75rem;
          font-weight: 700;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .action-btn-premium:hover:not(:disabled) {
          transform: translateY(-1px) scale(1.03);
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.06);
        }
        .ver-link-premium {
          cursor: pointer;
          font-size: 0.75rem;
          color: #0f766e;
          font-weight: 700;
          padding: 6px 14px;
          border-radius: 9999px;
          background: #f0fdf4;
          border: 1px solid #cbd5e1;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          text-decoration: none !important;
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
        }
        .ver-link-premium:hover {
          background: #0f766e;
          color: white !important;
          border-color: #0f766e;
          transform: translateY(-1px) scale(1.03);
          box-shadow: 0 4px 12px rgba(15, 118, 110, 0.15);
        }
      `}} />
      <table className="premium-table" style={{ fontSize: isMobile ? '0.8rem' : '0.9rem' }}>
        <thead>
          <tr>
            <th onClick={() => handleSort('ruta')} className="sortable" style={{ padding: '14px 12px', textAlign: 'left', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              💻 Dashboard <SortIcon field="ruta" />
            </th>
            <th style={{ ...thStyle, padding: '14px 4px' }} title="Último análisis">🗓️ Último</th>
            <th style={{ ...thStyle, padding: '14px 4px' }} title="Análisis de código">💻</th>
            <th style={{ ...thStyle, padding: '14px 4px' }} title="Análisis responsive">📱</th>
            <th style={{ ...thStyle, padding: '14px 4px' }} title="Criterios Premium">👑</th>

            <th onClick={() => handleSort('lineas')} className="sortable" style={{ padding: '14px 8px', textAlign: 'center', cursor: 'pointer', whiteSpace: 'nowrap', width: isMobile ? '60px' : '95px' }}>
              📏 Orquestador <SortIcon field="lineas" />
            </th>
            <th style={{ padding: '14px 8px', textAlign: 'center', fontWeight: 700, color: '#475569', whiteSpace: 'nowrap', width: isMobile ? '60px' : '95px' }} title="Líneas reales del componente (Monolito)">
              🧱 Real
            </th>
            <th style={{ padding: '14px 8px', textAlign: 'center', fontWeight: 700, color: '#475569', whiteSpace: 'nowrap' }}>
              ⚡ Acciones
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedDashboards.map((d) => {
            const analysisKey = getAnalysisKey(d);
            const liveCompLines = d.analyzeFile 
              ? (analysisData[analysisKey]?.totalLines ?? d.componentLines) 
              : (analysisData[analysisKey]?.totalLines ?? d.lines);
            const livePageLines = d.lines;
            const effLines = d.analyzeFile 
              ? ((liveCompLines || 0) + (livePageLines || 0)) 
              : (liveCompLines || 0);
            const tag = getCategory(effLines);
            const pct = (effLines / maxLines) * 100;
            const groupId = getDashboardGroup(d.path);
            const groupDef = DASHBOARD_GROUPS.find(g => g.id === groupId) || DASHBOARD_GROUPS.find(g => g.id === 'otros')!;
            const groupEmoji = groupDef.label.split(' ')[0] || '🧩';
            const friendlyName = FRIENDLY_NAMES[d.path] || d.path;
            const displayFriendlyName = friendlyName.replace(/^[\p{Emoji_Presentation}\p{Emoji}\u200d\uFE0F\s]+/gu, '');
            const isFocused = focoFile === d.file;
            const isLoading = loading[analysisKey];

            const code = getCodeStatus(d);
            const resp = getResponsiveStatus(d);
            const prem = getPremiumStatus(d);
            const lastAnalysisLabel = getLastAnalysisLabel(d);
            const allClean = code.label === '100%' && resp.label === '100%' && prem.label === '100%';
            const anyDone = code.label !== '0%' || resp.label !== '0%' || prem.label !== '0%';

            return (
              <React.Fragment key={d.file}>
                <tr
                  id={`row-${d.file.replace(/\//g, '-')}`}
                  style={{
                    borderBottom: '1px solid #e2e8f0',
                    background: isFocused ? '#fef3c7' : 'white',
                    animation: isFocused ? 'pulse 1.5s ease-in-out 2' : 'none'
                  }}
                >
                  {/* Ruta / Dashboard */}
                  <td style={{ padding: '12px 10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.9rem', padding: '6px', borderRadius: '8px', background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', fontWeight: 600, width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {groupEmoji}
                      </span>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span title={d.path} style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.85rem' }}>
                          {isMobile ? d.file.split('/').pop() : displayFriendlyName}
                        </span>
                        {!isMobile && (
                          <span style={{ fontSize: '0.7rem', color: '#64748b', fontFamily: 'monospace' }}>
                            {d.file}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  <td style={{ ...statusCellStyle, minWidth: isMobile ? '88px' : '122px' }}>
                    <span title={`Último análisis: ${lastAnalysisLabel}`} style={{ fontSize: '0.68rem', padding: '2px 6px', borderRadius: '4px', background: lastAnalysisLabel === 'Sin analizar' ? '#f8fafc' : '#eff6ff', color: lastAnalysisLabel === 'Sin analizar' ? '#64748b' : '#1d4ed8', border: `1px solid ${lastAnalysisLabel === 'Sin analizar' ? '#e2e8f0' : '#bfdbfe'}`, fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {lastAnalysisLabel}
                    </span>
                  </td>

                  {/* Columna Código */}
                  <td style={statusCellStyle}>
                    <span title={code.title} className="premium-badge" style={{ fontSize: '0.7rem', padding: '3px 8px', borderRadius: '9999px', background: code.bg, color: code.color, border: `1px solid ${code.color}20`, whiteSpace: 'nowrap' }}>
                      {code.icon && <span style={{ marginRight: '2px' }}>{code.icon}</span>}{code.label}
                    </span>
                  </td>

                  {/* Columna Responsive */}
                  <td style={statusCellStyle}>
                    <span title={resp.title} className="premium-badge" style={{ fontSize: '0.7rem', padding: '3px 8px', borderRadius: '9999px', background: resp.bg, color: resp.color, border: `1px solid ${resp.color}20`, whiteSpace: 'nowrap' }}>
                      {resp.icon && <span style={{ marginRight: '2px' }}>{resp.icon}</span>}{resp.label}
                    </span>
                  </td>

                  {/* Columna Premium */}
                  <td style={statusCellStyle}>
                    <span title={prem.title} className="premium-badge" style={{ fontSize: '0.7rem', padding: '3px 8px', borderRadius: '9999px', background: prem.bg, color: prem.color, border: `1px solid ${prem.color}20`, whiteSpace: 'nowrap' }}>
                      {prem.icon && <span style={{ marginRight: '2px' }}>{prem.icon}</span>}{prem.label}
                    </span>
                  </td>

                  {/* Líneas */}
                  <td style={{ padding: '8px', textAlign: 'center' }}>
                    {livePageLines !== undefined ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', justifyContent: 'center' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.82rem', color: '#334155' }}>
                          {livePageLines.toLocaleString()}
                        </span>
                        <span title="Categoría del Orquestador" style={{ fontSize: '0.62rem', padding: '1px 4px', borderRadius: '4px', background: getCategory(livePageLines).bg, color: getCategory(livePageLines).color, fontWeight: 700, border: `1px solid ${getCategory(livePageLines).color}20`, whiteSpace: 'nowrap' }}>
                          {getCategory(livePageLines).emoji} {getCategory(livePageLines).label}
                        </span>
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>-</span>
                    )}
                  </td>

                  {/* Columna Monolito */}
                  <td style={{ padding: '8px', textAlign: 'center' }}>
                    {liveCompLines ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', justifyContent: 'center' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.82rem', color: getCategory(liveCompLines).color, padding: '2px 6px', background: `${getCategory(liveCompLines).bg}80`, borderRadius: '4px' }} title="Líneas del componente real (Monolito)">
                          {liveCompLines.toLocaleString()}
                        </span>
                        <span title="Categoría del Componente Real" style={{ fontSize: '0.62rem', padding: '1px 4px', borderRadius: '4px', background: getCategory(liveCompLines).bg, color: getCategory(liveCompLines).color, fontWeight: 700, border: `1px solid ${getCategory(liveCompLines).color}20`, whiteSpace: 'nowrap' }}>
                          {getCategory(liveCompLines).emoji} {getCategory(liveCompLines).label}
                        </span>
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>-</span>
                    )}
                  </td>

                  {/* Acciones */}
                  <td style={{ padding: '8px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => handleOpenModal(d.file, d.analyzeFile)}
                        disabled={isLoading}
                        className="action-btn-premium"
                        style={{
                          background: allClean ? '#dcfce7' : anyDone ? '#fef3c7' : '#fee2e2',
                          color: allClean ? '#166534' : anyDone ? '#92400e' : '#991b1b',
                          border: `1px solid ${allClean ? '#86efac' : anyDone ? '#fcd34d' : '#fca5a5'}`,
                          opacity: isLoading ? 0.6 : 1,
                          cursor: isLoading ? 'wait' : 'pointer',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {isLoading ? '⏳ Analizando...' : '🔬 Analizar'}
                      </button>
                      <span
                        className="ver-link-premium"
                        tabIndex={0}
                        onClick={() => saveAndNavigate(d.path, d.file)}
                      >
                        Dashboard
                      </span>
                    </div>
                  </td>
                </tr>
              </React.Fragment>
            );
          })}
        </tbody>
      </table>

      {/* Modal de Análisis - mismo estilo que PremiumDevInsights */}
      {modalFile && (() => {
        const matched = sortedDashboards.find(d => d.file === modalFile) || dashboards.find(d => d.file === modalFile);
        const friendlyName = matched ? (FRIENDLY_NAMES[matched.path] || matched.path) : modalFile;
        const modalAnalyzeFile = matched?.analyzeFile;
        const isModalLoading = loading[modalFile];

        return (
          <PremiumModal isOpen={!!modalFile} onClose={handleCloseModal} maxWidth="900px">
            <PremiumModalHeader
              title={<>🛠️ Dashboard de Mantenimiento <span style={{ fontSize: '0.8rem', opacity: 0.8, marginLeft: '8px' }}>({friendlyName})</span></>}
              gradient="linear-gradient(135deg, #0f172a, #1e293b)"
              onClose={handleCloseModal}
              actions={
                <button
                  onClick={() => handleTriggerAnalysis(modalFile, modalAnalyzeFile)}
                  disabled={isModalLoading}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    background: isModalLoading ? '#475569' : '#0284c7',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '0.85rem',
                    cursor: isModalLoading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s'
                  }}
                >
                  {isModalLoading ? '⏳ Analizando...' : '🔄 Re-analizar'}
                </button>
              }
            />
            <div style={{ background: '#f8fafc', maxHeight: '75vh', overflowY: 'auto' }}>
              <AnalisisRowDetails
                file={modalFile}
                data={matched ? analysisData[getAnalysisKey(matched)] : analysisData[modalFile]}
                isLoading={isModalLoading}
                isMobile={false}
              />
            </div>
          </PremiumModal>
        );
      })()}
    </div>
  );
}
