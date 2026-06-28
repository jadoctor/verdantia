'use client';

import React from 'react';

interface PremiumCancelButtonProps {
  onClick: () => void;
  text?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
}

export default function PremiumCancelButton({ 
  onClick, 
  text = 'Cancelar', 
  disabled = false,
  style 
}: PremiumCancelButtonProps) {
  return (
    <button 
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{ 
        padding: '8px 16px', 
        background: '#ffffff', 
        border: '1px solid #e2e8f0', 
        borderRadius: '8px', 
        color: '#475569', 
        fontWeight: '600', 
        cursor: disabled ? 'not-allowed' : 'pointer', 
        fontSize: '0.9rem',
        opacity: disabled ? 0.6 : 1,
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style
      }}
      onMouseOver={evt => {
        if (!disabled) {
          evt.currentTarget.style.background = '#f8fafc';
          evt.currentTarget.style.color = '#334155';
          evt.currentTarget.style.borderColor = '#cbd5e1';
        }
      }}
      onMouseOut={evt => {
        if (!disabled) {
          evt.currentTarget.style.background = '#ffffff';
          evt.currentTarget.style.color = '#475569';
          evt.currentTarget.style.borderColor = '#e2e8f0';
        }
      }}
    >
      {text}
    </button>
  );
}
