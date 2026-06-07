import React from 'react';

interface RangoBadgeProps {
  icono: string;
  nivel?: number | null;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

// Mapeo de nivel a emoji numérico
const NIVEL_EMOJI: Record<number, string> = {
  1: '1️⃣', 2: '2️⃣', 3: '3️⃣', 4: '4️⃣', 5: '5️⃣',
  6: '6️⃣', 7: '7️⃣', 8: '8️⃣', 9: '9️⃣', 10: '🔟'
};

export default function RangoBadge({ icono, nivel, size = 48, className = '', style = {} }: RangoBadgeProps) {
  const showBadge = typeof nivel === 'number' && nivel > 0;
  const nivelEmoji = showBadge ? (NIVEL_EMOJI[nivel] || `${nivel}`) : '';

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
        background: 'linear-gradient(135deg, #f8fafc, #e2e8f0)',
        borderRadius: '50%',
        border: '2px solid #cbd5e1',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
        flexShrink: 0,
        ...style
      }}
      title={showBadge ? `Nivel ${nivel}` : undefined}
    >
      {/* Cara grande - ocupa ~80% del círculo */}
      <span style={{ 
        fontSize: `${size * 0.65}px`, 
        lineHeight: 1,
        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' 
      }}>
        {icono}
      </span>
      {/* Número emoji como "oreja" en esquina superior-derecha */}
      {showBadge && (
        <span style={{
          position: 'absolute',
          top: `${size * -0.12}px`,
          right: `${size * -0.12}px`,
          fontSize: `${size * 0.38}px`,
          lineHeight: 1,
          filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))',
          zIndex: 2
        }}>
          {nivelEmoji}
        </span>
      )}
    </div>
  );
}
