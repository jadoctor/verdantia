'use client';

import React from 'react';

interface PremiumAutoEnhanceButtonProps {
  onClick: () => void;
  text?: string;
  disabled?: boolean;
}

export default function PremiumAutoEnhanceButton({ 
  onClick, 
  text = 'Auto Ajuste', 
  disabled = false 
}: PremiumAutoEnhanceButtonProps) {
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      type="button"
      style={{
        height: '36px',
        padding: '0 16px',
        borderRadius: '8px',
        background: 'linear-gradient(135deg, #d946ef, #c026d3)',
        color: '#ffffff',
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        fontSize: '0.9rem',
        fontWeight: 600,
        letterSpacing: '0.3px',
        whiteSpace: 'nowrap',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        opacity: disabled ? 0.6 : 1,
      }}
      onMouseOver={(e) => {
        if (!disabled) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 6px 12px rgba(217, 70, 239, 0.3)';
          e.currentTarget.style.filter = 'brightness(1.05)';
        }
      }}
      onMouseOut={(e) => {
        if (!disabled) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
          e.currentTarget.style.filter = 'brightness(1)';
        }
      }}
      onMouseDown={(e) => {
        if (!disabled) {
          e.currentTarget.style.transform = 'translateY(0) scale(0.98)';
        }
      }}
      onMouseUp={(e) => {
        if (!disabled) {
          e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
        }
      }}
      title="Mejora automática (Brillo, Contraste y Encuadre)"
    >
      {text}
    </button>
  );
}
