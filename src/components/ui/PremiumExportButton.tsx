'use client';

import React from 'react';
import styles from './PremiumExportButton.module.css';

interface PremiumExportButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  text?: string;
  icon?: string;
}

export default function PremiumExportButton({ 
  text = 'Exportar', 
  icon,
  className,
  disabled,
  ...props 
}: PremiumExportButtonProps) {
  return (
    <button 
      className={`${styles.exportButton} ${className || ''}`}
      disabled={disabled}
      {...props}
    >
      {icon && <span className={styles.icon}>{icon}</span>}
      {text && <span>{text}</span>}
    </button>
  );
}
