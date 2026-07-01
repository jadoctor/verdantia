'use client';

import styles from './PremiumEditButton.module.css';

interface PremiumEditButtonProps {
  onClick: () => void;
  text?: string;
  title?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
}

export default function PremiumEditButton({ onClick, text = 'Editar', title = 'Editar', style, disabled = false }: PremiumEditButtonProps) {
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={styles.button}
      style={style}
    >
      {text}
    </button>
  );
}
