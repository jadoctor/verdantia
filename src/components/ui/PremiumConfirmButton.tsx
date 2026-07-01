'use client';

import React from 'react';
import styles from './PremiumConfirmButton.module.css';

interface PremiumConfirmButtonProps {
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  text?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
}

export default function PremiumConfirmButton({ 
  onClick, 
  text = '✓ Confirmar', 
  disabled = false,
  style
}: PremiumConfirmButtonProps) {
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={styles.button}
      style={style}
      type="button"
    >
      {text}
    </button>
  );
}
