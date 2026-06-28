'use client';
import React, { useEffect } from 'react';

interface PremiumModalProps {
  isOpen: boolean;
  onClose?: () => void;
  maxWidth?: string;
  children: React.ReactNode;
  zIndex?: number;
}

export default function PremiumModal({
  isOpen,
  onClose,
  maxWidth = '700px',
  children,
  zIndex = 9999
}: PremiumModalProps) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className="premium-modal-overlay" 
      style={{ 
        position: 'fixed', 
        top: 0, left: 0, right: 0, bottom: 0, 
        background: 'rgba(15, 23, 42, 0.75)', 
        zIndex: zIndex, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: '20px', 
        backdropFilter: 'blur(4px)' 
      }}
      onClick={(e) => {
        // Only close if clicking on the overlay itself
        if (e.target === e.currentTarget && onClose) {
          onClose();
        }
      }}
    >
      <div 
        className="premium-modal-content" 
        style={{ 
          background: 'white', 
          borderRadius: '16px', 
          width: '100%', 
          maxWidth: maxWidth, 
          maxHeight: '90vh', 
          display: 'flex', 
          flexDirection: 'column', 
          overflow: 'hidden', 
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          animation: 'modalFadeIn 0.2s ease-out'
        }}
      >
        <style>{`
          @keyframes modalFadeIn {
            from { opacity: 0; transform: scale(0.95) translateY(10px); }
            to { opacity: 1; transform: scale(1) translateY(0); }
          }
        `}</style>
        {children}
      </div>
    </div>
  );
}
