'use client';

import React from 'react';

interface PremiumDeleteButtonProps {
  onClick: () => void;
  text?: string;
  isMobile?: boolean;
}

export default function PremiumDeleteButton({ onClick, text = 'Eliminar', isMobile = false }: PremiumDeleteButtonProps) {
  return (
    <button 
      onClick={onClick}
      style={{
        height: '36px',
        padding: '0 16px', 
        borderRadius: '8px', 
        background: 'rgba(255, 255, 255, 0.95)', 
        color: '#dc2626',
        border: '1px solid rgba(255, 255, 255, 0.4)',
        backdropFilter: 'blur(10px)',
        cursor: 'pointer', 
        fontWeight: '800', 
        fontSize: '0.85rem',
        letterSpacing: '0.03em',
        whiteSpace: 'nowrap',
        boxShadow: '0 4px 14px 0 rgba(0, 0, 0, 0.15)', 
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
        display: 'flex',
        alignItems: 'center', 
        gap: '8px', 
        width: isMobile ? '100%' : 'auto', 
        justifyContent: 'center'
      }}
      onMouseOver={e => {
        e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
        e.currentTarget.style.boxShadow = '0 6px 20px rgba(220, 38, 38, 0.3)';
        e.currentTarget.style.background = '#ffffff';
      }}
      onMouseOut={e => {
        e.currentTarget.style.transform = 'translateY(0) scale(1)';
        e.currentTarget.style.boxShadow = '0 4px 14px 0 rgba(0, 0, 0, 0.15)';
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.95)';
      }}
    >
      {text}
    </button>
  );
}
