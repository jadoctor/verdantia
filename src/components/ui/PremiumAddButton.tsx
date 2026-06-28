'use client';

import React from 'react';

interface PremiumAddButtonProps {
  onClick: () => void;
  text?: string;
  isMobile?: boolean;
}

export default function PremiumAddButton({ onClick, text = '➕ Nuevo', isMobile = false }: PremiumAddButtonProps) {
  return (
    <button 
      onClick={onClick}
      style={{
        padding: '10px 20px', 
        borderRadius: '12px', 
        background: 'rgba(255, 255, 255, 0.95)', 
        color: '#064e3b',
        border: '1px solid rgba(255, 255, 255, 0.4)',
        backdropFilter: 'blur(10px)',
        cursor: 'pointer', 
        fontWeight: '800', 
        fontSize: '0.9rem',
        letterSpacing: '0.03em',
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
        e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.2)';
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
