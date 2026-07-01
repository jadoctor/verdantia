'use client'; // Hot reload for centering buttons
import React from 'react';

import styles from './PremiumModalHeader.module.css';

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
    <div 
      className={styles.header}
      style={{
        background: gradient,
        justifyContent: title ? 'space-between' : 'center',
      }}
    >
      {title && (
        <h2 className={styles.title}>
          {title}
        </h2>
      )}
      <div className={styles.actionsContainer}>
        {actions}
        
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className={styles.closeButton}
            title="Cerrar"
          >
            ✖
          </button>
        )}
      </div>
    </div>
  );
}
