'use client';

import React from 'react';

interface PremiumBackButtonProps {
  onClick: () => void;
  text?: string;
  style?: React.CSSProperties;
}

export default function PremiumBackButton({ 
  onClick, 
  text = 'Volver al Inicio', 
  style 
}: PremiumBackButtonProps) {
  return (
    <button 
      type="button"
      onClick={onClick}
      style={{ 
        height: '36px',
        padding: '0 16px', 
        background: 'linear-gradient(135deg, #6366f1, #4f46e5)', 
        border: 'none', 
        color: 'white', 
        borderRadius: '8px',
        cursor: 'pointer', 
        fontWeight: 600, 
        fontSize: '0.9rem', 
        display: 'inline-flex', 
        alignItems: 'center', 
        gap: '6px',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        ...style
      }}
      onMouseOver={evt => {
        evt.currentTarget.style.transform = 'translateY(-2px)';
        evt.currentTarget.style.boxShadow = '0 6px 12px rgba(99, 102, 241, 0.3)';
        evt.currentTarget.style.filter = 'brightness(1.1)';
      }}
      onMouseOut={evt => {
        evt.currentTarget.style.transform = 'translateY(0)';
        evt.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
        evt.currentTarget.style.filter = 'brightness(1)';
      }}
    >
      {text}
    </button>
  );
}
