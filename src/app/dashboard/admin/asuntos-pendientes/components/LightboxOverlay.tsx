'use client';
import React from 'react';

interface Props {
  url: string;
  onClose: () => void;
}

export function LightboxOverlay({ url, onClose }: Props) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div style={{ position: 'relative', maxWidth: '95vw', maxHeight: '95vh', display: 'flex', justifyContent: 'center' }}>
        <img
          src={url}
          alt="Vista ampliada"
          crossOrigin="anonymous"
          style={{ maxWidth: '100%', maxHeight: '95vh', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}
          onClick={e => e.stopPropagation()}
        />
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: '-15px', right: '-15px', background: 'white', color: 'black', border: 'none', borderRadius: '50%', width: '40px', height: '40px', fontSize: '1.2rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}
        >✕</button>
      </div>
    </div>
  );
}
