'use client';

import React from 'react';

interface PremiumEditButtonProps {
  onClick: () => void;
  text?: string;
  title?: string;
  style?: React.CSSProperties;
}

export default function PremiumEditButton({ onClick, text = 'Editar', title = 'Editar', style }: PremiumEditButtonProps) {
  return (
    <button 
      onClick={onClick}
      title={title}
      style={{ 
        background: '#f8fafc', 
        border: '1px solid transparent', 
        color: '#334155', 
        cursor: 'pointer', 
        fontSize: '0.8rem', 
        padding: '4px 14px', 
        borderRadius: '999px', 
        fontWeight: '700', 
        width: 'auto', 
        textAlign: 'center',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        ...style
      }}
      onMouseOver={evt => {
        evt.currentTarget.style.background = '#ffffff';
        evt.currentTarget.style.borderColor = '#cbd5e1';
        evt.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.06)';
        evt.currentTarget.style.color = '#0f766e';
        evt.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseOut={evt => {
        evt.currentTarget.style.background = '#f8fafc';
        evt.currentTarget.style.borderColor = 'transparent';
        evt.currentTarget.style.boxShadow = 'none';
        evt.currentTarget.style.color = '#334155';
        evt.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <span>✏️</span> {text}
    </button>
  );
}
