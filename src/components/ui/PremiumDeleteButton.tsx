'use client';

import React from 'react';

import styles from './PremiumDeleteButton.module.css';

interface PremiumDeleteButtonProps {
  onClick: () => void;
  onConfirm?: () => void;
  text?: string;
  /** @deprecated isMobile is handled 100% via CSS Modules */
  isMobile?: boolean;
  style?: React.CSSProperties;
  title?: string;
  disabled?: boolean;
}

export default function PremiumDeleteButton({ onClick, onConfirm, text = 'Eliminar', isMobile, style, title, disabled = false }: PremiumDeleteButtonProps) {
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={styles.button}
      style={style}
      title={title}
    >
      {text}
    </button>
  );
}
