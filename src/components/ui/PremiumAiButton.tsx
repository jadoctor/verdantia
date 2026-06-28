'use client';

import React from 'react';

interface PremiumAiButtonProps {
  onClick: () => void;
  text?: string;
  loadingText?: string;
  isLoading?: boolean;
  disabled?: boolean;
  style?: React.CSSProperties;
}

export default function PremiumAiButton({ 
  onClick, 
  text = '✨ Asistente IA', 
  loadingText = '⏳ Analizando...',
  isLoading = false,
  disabled = false,
  style 
}: PremiumAiButtonProps) {
  const isButtonDisabled = disabled || isLoading;

  return (
    <button 
      type="button"
      onClick={onClick}
      disabled={isButtonDisabled}
      style={{ 
        padding: '10px 20px', 
        background: isButtonDisabled ? 'linear-gradient(135deg, #64748b, #475569)' : 'linear-gradient(135deg, #8b5cf6, #6d28d9)', 
        border: isButtonDisabled ? '1px solid #475569' : '1px solid rgba(255,255,255,0.2)',
        borderRadius: '12px', 
        color: 'white', 
        fontWeight: 'bold', 
        cursor: isButtonDisabled ? 'not-allowed' : 'pointer', 
        fontSize: '0.95rem',
        boxShadow: isButtonDisabled ? 'none' : '0 4px 14px rgba(139, 92, 246, 0.3)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        ...style
      }}
      onMouseOver={evt => {
        if (!isButtonDisabled) {
          evt.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
          evt.currentTarget.style.boxShadow = '0 6px 20px rgba(139, 92, 246, 0.4)';
          evt.currentTarget.style.filter = 'brightness(1.1)';
        }
      }}
      onMouseOut={evt => {
        if (!isButtonDisabled) {
          evt.currentTarget.style.transform = 'translateY(0) scale(1)';
          evt.currentTarget.style.boxShadow = '0 4px 14px rgba(139, 92, 246, 0.3)';
          evt.currentTarget.style.filter = 'brightness(1)';
        }
      }}
    >
      {isLoading ? loadingText : text}
    </button>
  );
}
