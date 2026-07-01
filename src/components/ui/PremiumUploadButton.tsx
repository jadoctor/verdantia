'use client';

import React from 'react';
import styles from './PremiumUploadButton.module.css';

interface PremiumUploadButtonProps {
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  text?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
}

export default function PremiumUploadButton({ 
  onClick, 
  text = '⬆️ Subir', 
  disabled = false,
  style
}: PremiumUploadButtonProps) {
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
