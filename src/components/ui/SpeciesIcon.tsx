import React from 'react';

export const SpeciesIcon = ({ icon, size = '1rem', className = '' }: { icon?: string | null, size?: string | number, className?: string }) => {
  const sizeValue = typeof size === 'number' ? `${size}rem` : size;

  if (!icon || !icon.startsWith('/')) {
    return <span className={className} style={{ fontSize: sizeValue, lineHeight: '1.2', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{icon || '🌱'}</span>;
  }

  const name = icon.split('/').pop();

  if (name === 'tomate') {
    return (
      <svg className={className} width={sizeValue} height={sizeValue} viewBox="0 0 32 32" style={{ display: 'inline-block' }}>
        <circle cx={16} cy={17} r={12} fill="#e53e3e" />
        <circle cx={13} cy={14} r={10} fill="#f56565" opacity={0.5} />
        <line x1={16} y1={8} x2={16} y2={3} stroke="#276749" strokeWidth={2.5} strokeLinecap="round" />
        <ellipse cx={20} cy={4} rx={5} ry={2.2} fill="#38a169" transform="rotate(-30 20 4)" />
      </svg>
    );
  }

  if (name === 'calabacin') {
    return (
      <svg className={className} width={sizeValue} height={sizeValue} viewBox="0 0 32 32" style={{ display: 'inline-block' }}>
        <g transform="rotate(-25 16 16)">
          <ellipse cx={16} cy={16} rx={14} ry={5.5} fill="#48bb78" />
          <ellipse cx={25} cy={16} rx={4} ry={5.5} fill="#2f855a" />
          <ellipse cx={14} cy={14} rx={7} ry={2} fill="#68d391" opacity={0.5} />
          <line x1={2} y1={16} x2={-2} y2={13} stroke="#276749" strokeWidth={1.8} strokeLinecap="round" />
        </g>
      </svg>
    );
  }

  // Fallback para rutas sin un SVG explícito
  return <span className={className} style={{ fontSize: sizeValue, lineHeight: '1.2', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>🌱</span>;
};
