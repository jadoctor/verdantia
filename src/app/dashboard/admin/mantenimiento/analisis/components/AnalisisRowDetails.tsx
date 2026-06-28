import React, { useEffect } from 'react';

interface AnalisisRowDetailsProps {
  file: string;
  data: any;
  isLoading: boolean;
  isMobile: boolean;
}

export function AnalisisRowDetails({ file, data, isLoading, isMobile }: AnalisisRowDetailsProps) {
  useEffect(() => {
    if (!isLoading && data) {
      let combinedPrompt = '';
      if (data.responsiveness?.improvementsForAgent) combinedPrompt += data.responsiveness.improvementsForAgent + '\n\n';
      if (data.premium?.improvementsForAgent) combinedPrompt += data.premium.improvementsForAgent + '\n\n';
      if (data.plan && data.plan.length > 0) combinedPrompt += 'Plan de refactorización de código:\n' + data.plan.join('\n') + '\n\n';
      
      if (combinedPrompt) {
        navigator.clipboard.writeText(combinedPrompt).catch(err => console.error('Error al copiar al portapapeles:', err));
      }
    }
  }, [isLoading, data]);

  if (isLoading || !data) {
    return (
      <div style={{ padding: '20px', background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'center' }}>
        <span style={{ fontSize: '1.2rem' }}>⏳</span> Ejecutando análisis unificado (Código + Responsive + Premium)...
      </div>
    );
  }

  const sectionStyle: React.CSSProperties = {
    background: 'white',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    padding: isMobile ? '12px' : '16px',
    marginBottom: '12px'
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '1rem',
    fontWeight: 800,
    marginBottom: '10px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  };

  const scoreBar = (score: number, color: string) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
      <div style={{ flex: 1, height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
        <div style={{ width: `${score}%`, height: '100%', background: color, borderRadius: '4px', transition: 'width 0.5s ease' }} />
      </div>
      <span style={{ fontWeight: 800, fontSize: '0.9rem', color }}>{score}%</span>
    </div>
  );

  const isCodeClean = data.plan?.every((p: string) => p.startsWith('✅'));
  const responsiveScore = data.responsiveness?.score ?? 0;
  const premiumScore = data.premium?.score ?? 0;

  return (
    <div style={{ padding: isMobile ? '12px' : '16px 20px', background: '#f1f5f9', borderBottom: '2px solid #e2e8f0' }}>

      {/* ══════ 💻 CÓDIGO ══════ */}
      <div style={sectionStyle}>
        <div style={titleStyle}>
          <span>💻</span>
          <span>Análisis de Código</span>
          <span style={{ marginLeft: 'auto', fontSize: '0.75rem', padding: '2px 8px', borderRadius: '6px', background: isCodeClean ? '#dcfce7' : '#fef3c7', color: isCodeClean ? '#166534' : '#92400e', fontWeight: 700 }}>
            {isCodeClean ? '✅ Limpio' : '⚠️ Pendiente'}
          </span>
        </div>

        {/* Métricas */}
        {data.metrics && (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(min(100%, 120px), 1fr))', gap: '8px', marginBottom: '12px' }}>
            {[
              { label: 'useState', value: data.metrics.useState, icon: '🔄' },
              { label: 'useEffect', value: data.metrics.useEffect, icon: '⚡' },
              { label: 'fetch', value: data.metrics.fetchCalls, icon: '🌐' },
              { label: 'Funciones', value: data.metrics.functions, icon: '⚙️' },
              { label: 'JSX', value: data.metrics.jsxBlocks, icon: '🧩' },
              { label: 'Líneas', value: data.totalLines, icon: '📏' }
            ].map(m => (
              <div key={m.label} style={{ background: '#f8fafc', borderRadius: '8px', padding: '8px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '1.1rem' }}>{m.icon}</div>
                <div style={{ fontWeight: 800, fontSize: '1rem', color: '#1e293b' }}>{m.value}</div>
                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{m.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Plan */}
        {data.plan && (
          <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '10px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>📋 Plan de refactorización:</div>
            {data.plan.map((step: string, i: number) => (
              <div key={i} style={{ fontSize: '0.8rem', color: '#334155', padding: '3px 0', borderBottom: i < data.plan.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                {step}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ══════ 📱 RESPONSIVE ══════ */}
      {data.responsiveness && (
        <div style={sectionStyle}>
          <div style={titleStyle}>
            <span>📱</span>
            <span>Análisis Responsive</span>
            <span style={{ marginLeft: 'auto', fontSize: '0.75rem', padding: '2px 8px', borderRadius: '6px', background: responsiveScore >= 80 ? '#dcfce7' : responsiveScore >= 50 ? '#fef3c7' : '#fee2e2', color: responsiveScore >= 80 ? '#166534' : responsiveScore >= 50 ? '#92400e' : '#991b1b', fontWeight: 700 }}>
              {responsiveScore >= 100 ? '✅ Perfecto' : `Score: ${responsiveScore}%`}
            </span>
          </div>

          {scoreBar(responsiveScore, responsiveScore >= 80 ? '#22c55e' : responsiveScore >= 50 ? '#eab308' : '#ef4444')}

          {data.responsiveness.diagnostics && data.responsiveness.diagnostics.length > 0 && (
            <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>🔍 Diagnósticos:</div>
              {data.responsiveness.diagnostics.map((diag: string, i: number) => (
                <div key={i} style={{ fontSize: '0.8rem', color: '#334155', padding: '3px 0', borderBottom: i < data.responsiveness.diagnostics.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                  {diag}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════ 👑 PREMIUM ══════ */}
      {data.premium && (
        <div style={sectionStyle}>
          <div style={titleStyle}>
            <span>👑</span>
            <span>Criterios Premium</span>
            <span style={{ marginLeft: 'auto', fontSize: '0.75rem', padding: '2px 8px', borderRadius: '6px', background: premiumScore >= 80 ? '#dcfce7' : premiumScore >= 50 ? '#fef3c7' : '#fee2e2', color: premiumScore >= 80 ? '#166534' : premiumScore >= 50 ? '#92400e' : '#991b1b', fontWeight: 700 }}>
              {premiumScore >= 100 ? '✅ Cumple' : `Score: ${premiumScore}%`}
            </span>
          </div>

          {scoreBar(premiumScore, premiumScore >= 80 ? '#22c55e' : premiumScore >= 50 ? '#eab308' : '#ef4444')}

          {/* Componentes usados vs disponibles */}
          {data.premium.availablePremium && (
            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>Componentes:</span>
              {data.premium.availablePremium.map((comp: string) => {
                const used = data.premium.usedPremium?.includes(comp);
                return (
                  <span key={comp} style={{
                    fontSize: '0.65rem', padding: '1px 6px', borderRadius: '4px',
                    background: used ? '#dcfce7' : '#fee2e2',
                    color: used ? '#166534' : '#991b1b',
                    border: `1px solid ${used ? '#86efac' : '#fca5a5'}`,
                    fontWeight: 600
                  }}>
                    {used ? '✓' : '✗'} {comp.replace('Premium', '')}
                  </span>
                );
              })}
            </div>
          )}

          {/* Diagnósticos */}
          {data.premium.diagnostics && data.premium.diagnostics.length > 0 && (
            <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>🔍 Diagnósticos:</div>
              {data.premium.diagnostics.map((diag: string, i: number) => (
                <div key={i} style={{ fontSize: '0.8rem', color: '#334155', padding: '3px 0', borderBottom: i < data.premium.diagnostics.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                  {diag}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Nota de portapapeles */}
      <div style={{ textAlign: 'center', fontSize: '0.75rem', color: '#94a3b8', padding: '4px 0' }}>
        📋 El comando combinado (Código + Responsive + Premium) se ha copiado al portapapeles automáticamente.
      </div>
    </div>
  );
}
