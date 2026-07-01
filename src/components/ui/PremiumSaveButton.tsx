'use client';

import styles from './PremiumSaveButton.module.css';

interface PremiumSaveButtonProps {
  onClick?: () => void;
  text?: string;
  loadingText?: string;
  isLoading?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit';
  style?: React.CSSProperties;
}

export default function PremiumSaveButton({ 
  onClick, 
  text = 'Guardar', 
  loadingText = 'Guardando...',
  isLoading = false,
  disabled = false,
  type = 'submit',
  style 
}: PremiumSaveButtonProps) {
  const isButtonDisabled = disabled || isLoading;

  return (
    <button 
      type={type}
      onClick={onClick}
      disabled={isButtonDisabled}
      className={styles.button}
      style={style}
    >
      {isLoading ? (
        <>{loadingText}</>
      ) : (
        text
      )}
    </button>
  );
}
