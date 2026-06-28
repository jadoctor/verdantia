'use client';

import React from 'react';

interface PremiumBackButtonProps {
  onClick: () => void;
  text?: string;
  style?: React.CSSProperties;
}

export default function PremiumBackButton({ 
  onClick, 
  text = '🏠 Volver al Inicio', 
  style 
}: PremiumBackButtonProps) {
  return (
    <button 
      type="button"
      onClick={onClick}
      style={{ 
        background: '#ffffff', 
        border: '1px solid #cbd5e1', 
        color: '#475569', 
        padding: '6px 14px', 
        borderRadius: '8px', 
        cursor: 'pointer', 
        fontWeight: '600', 
        fontSize: '0.85rem', 
        display: 'inline-flex', 
        alignItems: 'center', 
        gap: '6px',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
        ...style
      }}
      onMouseOver={evt => {
        evt.currentTarget.style.background = '#f1f5f9';
        evt.currentTarget.style.borderColor = '#94a3b8';
        evt.currentTarget.style.color = '#334155';
        evt.currentTarget.style.transform = 'translateX(-2px)';
      }}
      onMouseOut={evt => {
        evt.currentTarget.style.background = '#ffffff';
        evt.currentTarget.style.borderColor = '#cbd5e1';
        evt.currentTarget.style.color = '#475569';
        evt.currentTarget.style.transform = 'translateX(0)';
      }}
    >
      {text}
    </button>
  );
}
