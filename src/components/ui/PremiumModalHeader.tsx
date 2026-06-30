'use client'; // Hot reload for centering buttons
import React from 'react';

interface PremiumModalHeaderProps {
  title: React.ReactNode;
  gradient?: string;
  onClose?: () => void;
  actions?: React.ReactNode;
}

export default function PremiumModalHeader({
  title,
  gradient = 'linear-gradient(135deg, #8b5cf6, #6d28d9)', // Default to AI purple
  onClose,
  actions
}: PremiumModalHeaderProps) {
  return (
    <div style={{
      background: gradient,
      padding: '20px 24px',
      display: 'flex',
      justifyContent: title ? 'space-between' : 'center',
      alignItems: 'center',
      gap: '12px',
      flexShrink: 0
    }}>
      {title && (
        <h2 style={{
          color: 'white',
          margin: 0,
          fontSize: '1.2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {title}
        </h2>
      )}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        {actions}
        
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px',
              background: 'linear-gradient(135deg, #64748b, #475569)',
              color: 'white',
              border: 'none',
              borderRadius: '50%', // Circular button for the 'X'
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.2), 0 2px 4px rgba(0,0,0,0.2)',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = 'inset 0 1px 1px rgba(255,255,255,0.2), 0 4px 12px rgba(71, 85, 105, 0.4)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'inset 0 1px 1px rgba(255,255,255,0.2), 0 2px 4px rgba(0,0,0,0.2)';
            }}
            title="Cerrar"
          >
            ✖
          </button>
        )}
      </div>
    </div>
  );
}
