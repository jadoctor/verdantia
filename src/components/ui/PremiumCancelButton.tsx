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
        height: '36px',
        padding: '0 16px', 
        background: 'linear-gradient(135deg, #f43f5e, #e11d48)', 
        border: 'none', 
        borderRadius: '8px', 
        color: 'white', 
        fontWeight: 600, 
        cursor: disabled ? 'not-allowed' : 'pointer', 
        fontSize: '0.9rem',
        opacity: disabled ? 0.6 : 1,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        whiteSpace: 'nowrap',
        ...style
      }}
      onMouseOver={evt => {
        if (!disabled) {
          evt.currentTarget.style.transform = 'translateY(-2px)';
          evt.currentTarget.style.boxShadow = '0 6px 12px rgba(244, 63, 94, 0.3)';
          evt.currentTarget.style.filter = 'brightness(1.05)';
        }
      }}
      onMouseOut={evt => {
        if (!disabled) {
          evt.currentTarget.style.transform = 'translateY(0)';
          evt.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
          evt.currentTarget.style.filter = 'brightness(1)';
        }
      }}
    >
      {text}
    </button>
  );
}
