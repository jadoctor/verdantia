'use client';

import React from 'react';

interface PremiumUndoButtonProps {
  onClick: () => void;
  text?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
}

export default function PremiumUndoButton({
  onClick,
  text = 'Deshacer Cambios',
  style,
  disabled = false
}: PremiumUndoButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        background: 'rgba(255, 255, 255, 0.2)',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        color: '#ffffff',
        height: '36px',
        padding: '0 16px',
        borderRadius: '8px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        fontSize: '0.85rem',
        fontWeight: 600,
        letterSpacing: '0.3px',
        whiteSpace: 'nowrap',
        backdropFilter: 'blur(8px)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.1)',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        opacity: disabled ? 0.6 : 1,
        ...style
      }}
      onMouseOver={(e) => {
        if (disabled) return;
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)';
        e.currentTarget.style.transform = 'translateY(-1px)';
        e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.2)';
      }}
      onMouseOut={(e) => {
        if (disabled) return;
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.1)';
      }}
    >
      <span style={{ fontSize: '1.1rem', filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.2))' }}>↺</span> {text}
    </button>
  );
}
