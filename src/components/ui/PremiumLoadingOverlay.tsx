import React from 'react';

interface PremiumLoadingOverlayProps {
  isLoading: boolean;
  message?: string;
}

export default function PremiumLoadingOverlay({ isLoading, message = 'Cargando datos...' }: PremiumLoadingOverlayProps) {
  if (!isLoading) return null;

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      background: 'rgba(255, 255, 255, 0.65)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10,
      borderRadius: '12px',
      backdropFilter: 'blur(1px)',
      transition: 'opacity 0.25s ease'
    }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin-loader {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}} />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
        <div style={{
          width: '32px',
          height: '32px',
          border: '3px solid #cbd5e1',
          borderTop: '3px solid #0f766e',
          borderRadius: '50%',
          animation: 'spin-loader 0.8s linear infinite'
        }} />
        {message && (
          <span style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 'bold' }}>
            {message}
          </span>
        )}
      </div>
    </div>
  );
}
