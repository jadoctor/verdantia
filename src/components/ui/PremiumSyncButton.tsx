'use client';

import React from 'react';
import styles from './PremiumSyncButton.module.css';

interface PremiumSyncButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  text?: string;
  isSyncing?: boolean;
}

export default function PremiumSyncButton({ 
  text = 'Sincronizar', 
  isSyncing = false,
  className,
  disabled,
  ...props 
}: PremiumSyncButtonProps) {
  return (
    <button 
      className={`${styles.syncButton} ${className || ''}`}
      disabled={disabled || isSyncing}
      {...props}
    >
      <span className={`${styles.icon} ${isSyncing ? styles.spinning : ''}`}>🔄</span>
      {text && <span>{isSyncing ? 'Sincronizando...' : text}</span>}
    </button>
  );
}
