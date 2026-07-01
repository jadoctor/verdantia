'use client';

import React from 'react';
import styles from './PremiumNextButton.module.css';

interface PremiumNextButtonProps {
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  text?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
  title?: string;
}

export default function PremiumNextButton({ 
  onClick, 
  text = 'Siguiente ➡️', 
  disabled = false,
  style,
  title
}: PremiumNextButtonProps) {
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={styles.button}
      style={style}
      type="button"
      title={title}
    >
      {text}
    </button>
  );
}
