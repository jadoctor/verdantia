'use client';

import React from 'react';
import styles from './PremiumFilterButton.module.css';

interface PremiumFilterButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  text?: string;
  icon?: string;
  activeCount?: number;
}

export default function PremiumFilterButton({ 
  text = 'Filtros', 
  icon,
  activeCount = 0,
  className,
  disabled,
  ...props 
}: PremiumFilterButtonProps) {
  return (
    <button 
      className={`${styles.filterButton} ${activeCount > 0 ? styles.hasFilters : ''} ${className || ''}`}
      disabled={disabled}
      {...props}
    >
      {icon && <span className={styles.icon}>{icon}</span>}
      {text && <span>{text}</span>}
      {activeCount > 0 && (
        <span className={styles.badge}>{activeCount}</span>
      )}
    </button>
  );
}
