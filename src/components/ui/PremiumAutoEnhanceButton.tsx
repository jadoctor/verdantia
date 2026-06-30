'use client';

import React from 'react';

interface PremiumAutoEnhanceButtonProps {
  onClick: () => void;
  text?: string;
  disabled?: boolean;
}

export default function PremiumAutoEnhanceButton({ 
  onClick, 
  text = '🪄 Auto Ajuste', 
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
        background: 'linear-gradient(135deg, #0ea5e9, #0284c7)', // Blue magic theme
        color: '#ffffff',
        border: '1px solid rgba(255, 255, 255, 0.4)',
        backdropFilter: 'blur(10px)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        fontSize: '0.85rem',
        fontWeight: 600,
        letterSpacing: '0.3px',
        whiteSpace: 'nowrap',
        boxShadow: '0 4px 14px 0 rgba(14, 165, 233, 0.3)',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        opacity: disabled ? 0.6 : 1,
      }}
      onMouseOver={(e) => {
        if (!disabled) {
          e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
          e.currentTarget.style.boxShadow = '0 6px 20px 0 rgba(14, 165, 233, 0.4)';
          e.currentTarget.style.background = 'linear-gradient(135deg, #38bdf8, #0ea5e9)';
        }
      }}
      onMouseOut={(e) => {
        if (!disabled) {
          e.currentTarget.style.transform = 'translateY(0) scale(1)';
          e.currentTarget.style.boxShadow = '0 4px 14px 0 rgba(14, 165, 233, 0.3)';
          e.currentTarget.style.background = 'linear-gradient(135deg, #0ea5e9, #0284c7)';
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
