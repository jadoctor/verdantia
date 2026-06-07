import React from 'react';

export const WheatSeedIcon = ({ size = '1em', className = '' }: { size?: string | number, className?: string }) => {
  const sizeValue = typeof size === 'number' ? `${size}rem` : size;
  return (
    <svg className={className} width={sizeValue} height={sizeValue} viewBox="0 0 32 32" style={{ display: 'inline-block', verticalAlign: 'middle', transform: 'translateY(-1px)' }}>
      <g transform="rotate(-30 16 16)">
        {/* Sombra base / cuerpo exterior */}
        <ellipse cx="16" cy="16" rx="8" ry="13" fill="#b47836" />
        {/* Cuerpo principal (más claro) */}
        <ellipse cx="15.5" cy="16" rx="7" ry="12" fill="#d09652" />
        {/* Brillo para volumen */}
        <ellipse cx="14" cy="16" rx="4" ry="10" fill="#e8b87d" opacity={0.8} />
        {/* Hendidura central característica del trigo */}
        <path d="M 15 4.5 Q 12.5 16 15 27.5" stroke="#784818" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      </g>
    </svg>
  );
};
