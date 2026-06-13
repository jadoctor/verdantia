import React from 'react';
import { DashboardItem } from '../services/analisisApi';

interface AnalisisRowDetailsProps {
  d: DashboardItem;
  analysis: any;
  isLoadingCurrent: boolean;
  expandedCode: Record<string, boolean>;
  expandedResponsive: Record<string, boolean>;
  isMobile?: boolean;
}

export function AnalisisRowDetails({
  d,
  analysis,
  isLoadingCurrent,
  expandedCode,
  expandedResponsive,
  isMobile = false
}: AnalisisRowDetailsProps) {
  return (
    <div style={{ padding: isMobile ? '16px 12px' : '20px 24px' }}>
      {isLoadingCurrent ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#64748b', fontSize: '0.85rem' }}>
          <span style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid #e2e8f0', borderTop: '2px solid #4f46e5', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          Analizando {d.file}...
        </div>
      ) : analysis?.error ? (
        <div style={{ color: '#ef4444', fontSize: '0.85rem' }}>⚠️ {analysis.error}</div>
      ) : analysis ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Pestaña: Código (Métricas + Plan) */}
          {expandedCode[d.file] && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#1e293b', marginBottom: '12px' }}>📊 Métricas del Archivo</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '8px' }}>
                  {[
                    { label: 'useState', value: analysis.metrics.useState, icon: '🔵', warn: analysis.metrics.useState > 8 },
                    { label: 'useEffect', value: analysis.metrics.useEffect, icon: '⚡', warn: analysis.metrics.useEffect > 3 },
                    { label: 'fetch()', value: analysis.metrics.fetchCalls, icon: '🌐', warn: analysis.metrics.fetchCalls > 4 },
                    { label: 'Funciones', value: analysis.metrics.functions, icon: '⚙️', warn: false },
                    { label: 'useMemo', value: analysis.metrics.useMemo, icon: '💡', warn: false },
                    { label: 'TODOs', value: analysis.metrics.todos, icon: '📝', warn: analysis.metrics.todos > 0 },
                  ].map(m => (
                    <div key={m.label} style={{ background: m.warn ? '#fef2f2' : 'white', border: `1px solid ${m.warn ? '#fca5a5' : '#e2e8f0'}`, borderRadius: '8px', padding: '8px 12px' }}>
                      <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', display: 'block' }}>{m.icon} {m.label}</span>
                      <span style={{ fontSize: '1.2rem', fontWeight: 900, color: m.warn ? '#b91c1c' : '#1e293b', fontFamily: 'monospace' }}>{m.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#1e293b', marginBottom: '12px' }}>📋 Plan de Refactorización</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {analysis.plan.map((step: string, si: number) => (
                    <div key={si} style={{ background: 'white', border: '1px solid #e2e8f0', borderLeft: '3px solid #4f46e5', borderRadius: '6px', padding: '8px 12px', fontSize: '0.78rem', color: '#334155', lineHeight: '1.5' }}>{step}</div>
                  ))}
                  {analysis.plan.length > 0 && !analysis.plan[0].includes('✅') ? (
                    <div style={{
                      background: '#fffbeb',
                      border: '1px solid #fde68a',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      color: '#b45309',
                      fontSize: '0.78rem',
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      marginTop: '4px'
                    }}>
                      📋 Comando de refactorización copiado automáticamente al portapapeles. ¡Pégalo en el chat de Antigravity!
                    </div>
                  ) : (
                    <div style={{
                      background: '#f0fdf4',
                      border: '1px solid #bbf7d0',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      color: '#15803d',
                      fontSize: '0.78rem',
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      marginTop: '4px'
                    }}>
                      <span>✓</span> Este dashboard ya está completamente refactorizado y optimizado.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Pestaña: Responsivo (Regla 16) */}
          {expandedResponsive[d.file] && analysis.responsiveness && (
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1e293b', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                📱 Diagnóstico de Responsividad Móvil (Regla 16)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                {/* Score */}
                <div style={{
                  background: analysis.responsiveness.score >= 85 
                    ? 'linear-gradient(135deg, #f0fdf4, #dcfce7)' 
                    : analysis.responsiveness.score >= 50 
                      ? 'linear-gradient(135deg, #fffbeb, #fef3c7)' 
                      : 'linear-gradient(135deg, #fef2f2, #fee2e2)',
                  border: `1px solid ${
                    analysis.responsiveness.score >= 85 
                      ? '#bbf7d0' 
                      : analysis.responsiveness.score >= 50 
                        ? '#fde68a' 
                        : '#fca5a5'
                  }`,
                  borderRadius: '12px',
                  padding: '20px',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                }}>
                  <div style={{ fontSize: '2.5rem', fontWeight: 900, color: analysis.responsiveness.score >= 85 ? '#15803d' : analysis.responsiveness.score >= 50 ? '#b45309' : '#b91c1c', fontFamily: 'monospace' }}>
                    {analysis.responsiveness.score}%
                  </div>
                  <div style={{ 
                    fontSize: '0.78rem', 
                    fontWeight: 800, 
                    marginTop: '8px',
                    padding: '4px 10px',
                    borderRadius: '999px',
                    background: analysis.responsiveness.score >= 85 ? '#22c55e' : analysis.responsiveness.score >= 50 ? '#f59e0b' : '#ef4444',
                    color: 'white',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    {analysis.responsiveness.score >= 85 ? '📱 Apto' : analysis.responsiveness.score >= 50 ? '⚠️ Detalles' : '🚨 No Apto'}
                  </div>
                  <p style={{ fontSize: '0.72rem', color: '#64748b', margin: '12px 0 0 0', lineHeight: 1.4 }}>
                    {analysis.responsiveness.score >= 85 
                      ? 'El componente tiene buenas bases responsivas y evita anchos fijos.' 
                      : analysis.responsiveness.score >= 50 
                        ? 'Se encontraron algunos anchos rígidos o tablas propensas a desbordar.' 
                        : 'Se requiere optimizar anchos, envolturas y adaptabilidad móvil.'}
                  </p>
                </div>

                {/* Sugerencias */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Diagnósticos Encontrados:</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {analysis.responsiveness.diagnostics.map((diag: string, di: number) => (
                        <div key={di} style={{ 
                          background: 'white', 
                          border: '1px solid #e2e8f0', 
                          borderLeft: `3px solid ${
                            diag.startsWith('✅') 
                              ? '#22c55e' 
                              : diag.startsWith('📏') 
                                ? '#3b82f6' 
                                : diag.startsWith('📊') 
                                  ? '#f59e0b' 
                                  : '#ef4444'
                          }`,
                          borderRadius: '6px', 
                          padding: '8px 12px', 
                          fontSize: '0.76rem', 
                          color: '#334155', 
                          lineHeight: '1.4' 
                        }}>
                          {diag}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Instrucciones de responsividad para la IA:</span>
                    <div style={{
                      background: '#0f172a',
                      color: '#e2e8f0',
                      borderRadius: '8px',
                      padding: '12px 14px',
                      fontSize: '0.75rem',
                      fontFamily: 'Consolas, Monaco, monospace',
                      lineHeight: 1.4,
                      whiteSpace: 'pre-wrap',
                      border: '1px solid #334155',
                      maxHeight: '130px',
                      overflowY: 'auto'
                    }}>
                      {analysis.responsiveness.improvementsForAgent}
                    </div>
                    <div style={{
                      background: '#f0f9ff',
                      border: '1px solid #bae6fd',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      color: '#0284c7',
                      fontSize: '0.78rem',
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      marginTop: '6px',
                      alignSelf: 'flex-start'
                    }}>
                      📱 Instrucciones de responsividad copiadas automáticamente al portapapeles. ¡Pégalas en el chat de Antigravity!
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      ) : null}
    </div>
  );
}
