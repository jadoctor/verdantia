import React from 'react';

interface PremiumReanalyzeButtonProps {
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  isAnalyzing?: boolean;
}

export default function PremiumReanalyzeButton({ onClick, isAnalyzing = false }: PremiumReanalyzeButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={isAnalyzing}
      onMouseEnter={(e) => {
        if (!isAnalyzing) {
          e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
          e.currentTarget.style.boxShadow = '0 6px 15px rgba(2, 132, 199, 0.4)';
          e.currentTarget.style.background = 'linear-gradient(135deg, #0284c7, #0369a1)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isAnalyzing) {
          e.currentTarget.style.transform = 'none';
          e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
          e.currentTarget.style.background = 'linear-gradient(135deg, #0ea5e9, #0284c7)';
        }
      }}
      style={{
        height: '36px',
        padding: '0 16px',
        borderRadius: '8px',
        border: 'none',
        background: isAnalyzing ? '#475569' : 'linear-gradient(135deg, #0ea5e9, #0284c7)',
        color: 'white',
        fontWeight: 600,
        fontSize: '0.9rem',
        cursor: isAnalyzing ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: isAnalyzing ? 'none' : '0 4px 6px rgba(0,0,0,0.1)'
      }}
    >
      {isAnalyzing ? '⏳ Analizando...' : '🔄 Re-analizar'}
    </button>
  );
}
