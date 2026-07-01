'use client';

import React from 'react';
import styles from './PremiumAddButton.module.css';

interface PremiumAddButtonProps {
  onClick: () => void;
  text?: string;
  /** @deprecated isMobile ya no es necesario (Responsivo 100% por CSS) */
  isMobile?: boolean;
}

export default function PremiumAddButton({ onClick, text = 'Nuevo' }: PremiumAddButtonProps) {
  return (
    <button 
      className={styles.addButton}
      onClick={onClick}
    >
      {text}
    </button>
  );
}
