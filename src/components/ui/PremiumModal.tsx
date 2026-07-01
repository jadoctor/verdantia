'use client';
import React, { useEffect } from 'react';

import styles from './PremiumModal.module.css';

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
      className={styles.overlay} 
      style={{ zIndex: zIndex }}
      onClick={(e) => {
        // Only close if clicking on the overlay itself
        if (e.target === e.currentTarget && onClose) {
          onClose();
        }
      }}
    >
      <div 
        className={styles.content}
        style={{ maxWidth: maxWidth }}
      >
        {children}
      </div>
    </div>
  );
}
