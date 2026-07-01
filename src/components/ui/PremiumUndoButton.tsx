'use client';

import styles from './PremiumUndoButton.module.css';

interface PremiumUndoButtonProps {
  onClick: () => void;
  text?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
}

export default function PremiumUndoButton({
  onClick,
  text = 'Deshacer',
  style,
  disabled = false
}: PremiumUndoButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={styles.button}
      style={style}
    >
      {text}
    </button>
  );
}
