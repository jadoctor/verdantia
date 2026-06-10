import React from 'react';

interface RangoBadgeProps {
  icono: string;
  nivel?: number | null;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export default function RangoBadge({ icono, nivel, size = 48, className = '', style = {} }: RangoBadgeProps) {
  const showBadge = typeof nivel === 'number' && nivel > 0;
  const isHighLevel = showBadge && nivel! >= 8;

  // Calculamos medidas relativas
  const borderRadius = Math.max(4, Math.round(size * 0.25));
  const fontSizeIcon = size * 0.65;
  const badgeSize = Math.max(10, Math.round(size * 0.45));
  
  // badgeFontSize en rem o px. Si badgeSize es 10px, font = 6px.
  // Es mejor usar px aquí para más precisión.
  const badgeFontSizePx = Math.max(7, Math.round(badgeSize * 0.6)); 
  const badgeBorder = Math.max(1, Math.round(size * 0.05));
  const offset = -Math.max(2, Math.round(size * 0.15));

  // Parseamos el emoji viejo si accidentalmente se pasó, pero ahora queremos usar solo el número
  // (Aunque la BD tiene emojis antiguos, 'nivel' siempre es un número).
  
  return (
    <div 
      className={`rango-badge-container ${className}`}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: `${size}px`,
        height: `${size}px`,
        background: isHighLevel ? '#fefce8' : '#f8fafc',
        borderRadius: `${borderRadius}px`,
        border: `${Math.max(1.5, Math.round(size * 0.04))}px solid ${isHighLevel ? '#fde047' : '#e2e8f0'}`,
        flexShrink: 0,
        ...style
      }}
      title={showBadge ? `Nivel ${nivel}` : undefined}
    >
      <span style={{ 
        fontSize: `${fontSizeIcon}px`, 
        lineHeight: 1
      }}>
        {icono}
      </span>
      {showBadge && (
        <span style={{
          position: 'absolute',
          bottom: `${offset}px`,
          right: `${offset}px`,
          background: isHighLevel ? '#ca8a04' : '#64748b',
          color: 'white',
          width: `${badgeSize}px`,
          height: `${badgeSize}px`,
          borderRadius: '50%',
          fontSize: `${badgeFontSizePx}px`,
          fontWeight: 900,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: `${badgeBorder}px solid white`,
          zIndex: 2
        }}>
          {nivel}
        </span>
      )}
    </div>
  );
}
