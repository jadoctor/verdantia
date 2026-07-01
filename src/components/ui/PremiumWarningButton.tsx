'use client';

import React from 'react';
import styles from './PremiumWarningButton.module.css';

interface PremiumWarningButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  text?: string;
  icon?: string;
}

export default function PremiumWarningButton({ 
  text = 'Advertencia', 
  icon,
  className,
  disabled,
  ...props 
}: PremiumWarningButtonProps) {
  return (
    <button 
      className={`${styles.warningButton} ${className || ''}`}
      disabled={disabled}
      {...props}
    >
      {icon && <span className={styles.icon}>{icon}</span>}
      {text && <span>{text}</span>}
    </button>
  );
}
