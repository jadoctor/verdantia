import React from 'react';

interface AnalisisStatsProps {
  totalDashboards: number;
  totalLines: number;
  maxLines: number;
  isMobile?: boolean;
}

export function AnalisisStats({ totalDashboards, totalLines, maxLines, isMobile = false }: AnalisisStatsProps) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      gap: '16px'
    }}>
      <div style={{ background: 'linear-gradient(135deg, #4f46e5, #818cf8)', borderRadius: '14px', padding: isMobile ? '16px' : '20px 24px', color: 'white' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.85, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total de Dashboards</div>
        <div style={{ fontSize: isMobile ? '1.8rem' : '2.2rem', fontWeight: 900, lineHeight: 1.1, marginTop: '6px' }}>{totalDashboards}</div>
      </div>
      <div style={{ background: 'linear-gradient(135deg, #0ea5e9, #38bdf8)', borderRadius: '14px', padding: isMobile ? '16px' : '20px 24px', color: 'white' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.85, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total de Líneas</div>
        <div style={{ fontSize: isMobile ? '1.8rem' : '2.2rem', fontWeight: 900, lineHeight: 1.1, marginTop: '6px' }}>{totalLines.toLocaleString('es-ES')}</div>
      </div>
      <div style={{ background: 'linear-gradient(135deg, #059669, #34d399)', borderRadius: '14px', padding: isMobile ? '16px' : '20px 24px', color: 'white' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.85, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mayor archivo</div>
        <div style={{ fontSize: isMobile ? '1rem' : '1.1rem', fontWeight: 900, lineHeight: 1.2, marginTop: '6px' }}>{maxLines.toLocaleString('es-ES')} líneas</div>
        <div style={{ fontSize: '0.7rem', opacity: 0.85, marginTop: '2px' }}>bancales/[id]/page.tsx</div>
      </div>
    </div>
  );
}
