'use client';

import React from 'react';

interface PremiumSaveButtonProps {
  onClick?: () => void;
  text?: string;
  loadingText?: string;
  isLoading?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit';
  style?: React.CSSProperties;
}

export default function PremiumSaveButton({ 
  onClick, 
  text = 'Guardar', 
  loadingText = 'Guardando...',
  isLoading = false,
  disabled = false,
  type = 'submit',
  style 
}: PremiumSaveButtonProps) {
  const isButtonDisabled = disabled || isLoading;

  return (
    <button 
      type={type}
      onClick={onClick}
      disabled={isButtonDisabled}
      style={{ 
        padding: '10px 24px', 
        background: isButtonDisabled ? '#94a3b8' : 'linear-gradient(135deg, #0f766e, #10b981)', 
        border: 'none', 
        borderRadius: '8px', 
        color: 'white', 
        fontWeight: 'bold', 
        cursor: isButtonDisabled ? 'not-allowed' : 'pointer', 
        fontSize: '0.95rem',
        boxShadow: isButtonDisabled ? 'none' : '0 4px 6px rgba(0,0,0,0.1)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        ...style
      }}
      onMouseOver={evt => {
        if (!isButtonDisabled) {
          evt.currentTarget.style.transform = 'translateY(-2px)';
          evt.currentTarget.style.boxShadow = '0 6px 12px rgba(16, 185, 129, 0.3)';
          evt.currentTarget.style.filter = 'brightness(1.05)';
        }
      }}
      onMouseOut={evt => {
        if (!isButtonDisabled) {
          evt.currentTarget.style.transform = 'translateY(0)';
          evt.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
          evt.currentTarget.style.filter = 'brightness(1)';
        }
      }}
    >
      {isLoading ? (
        <>
          <span>⏳</span> {loadingText}
        </>
      ) : (
        text
      )}
    </button>
  );
}
