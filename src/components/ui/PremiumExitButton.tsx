'use client';

import React from 'react';

interface PremiumExitButtonProps {
  onClick: () => void;
  disabled?: boolean;
  isSaving?: boolean;
  hasChanges?: boolean;
  style?: React.CSSProperties;
}

export default function PremiumExitButton({ 
  onClick, 
  disabled = false,
  isSaving = false,
  hasChanges = false,
  style 
}: PremiumExitButtonProps) {
  return (
    <button 
      type="button"
      onClick={onClick}
      disabled={disabled || isSaving}
      style={{ 
        height: '36px',
        padding: '0 16px', 
        background: 'linear-gradient(135deg, #0f766e, #0d9488)', 
        border: 'none', 
        borderRadius: '8px', 
        color: '#ffffff', 
        fontWeight: '600', 
        cursor: disabled || isSaving ? 'not-allowed' : 'pointer', 
        fontSize: '0.85rem',
        opacity: disabled || isSaving ? 0.8 : 1,
        boxShadow: '0 2px 4px rgba(15, 118, 110, 0.2)',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        whiteSpace: 'nowrap',
        ...style
      }}
      onMouseOver={evt => {
        if (!disabled && !isSaving) {
          evt.currentTarget.style.transform = 'translateY(-1px)';
          evt.currentTarget.style.boxShadow = '0 4px 6px rgba(15, 118, 110, 0.3)';
        }
      }}
      onMouseOut={evt => {
        if (!disabled && !isSaving) {
          evt.currentTarget.style.transform = 'translateY(0)';
          evt.currentTarget.style.boxShadow = '0 2px 4px rgba(15, 118, 110, 0.2)';
        }
      }}
    >
      {isSaving ? '⏳ Guardando...' : (hasChanges ? '🚪 Salir y Guardar' : '🚪 Salir')}
    </button>
  );
}
