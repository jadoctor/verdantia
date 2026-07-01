'use client';

import styles from './PremiumExitButton.module.css';

interface PremiumExitButtonProps {
  onClick: () => void;
  disabled?: boolean;
  isSaving?: boolean;
  hasChanges?: boolean;
  style?: React.CSSProperties;
  text?: string;
}

export default function PremiumExitButton({ 
  onClick, 
  disabled = false,
  isSaving = false,
  hasChanges = false,
  style,
  text
}: PremiumExitButtonProps) {
  return (
    <button 
      type="button"
      onClick={onClick}
      disabled={disabled || isSaving}
      className={styles.button}
      style={style}
    >
      {text ? text : (isSaving ? 'Guardando...' : (hasChanges ? 'Salir y Guardar' : 'Salir'))}
    </button>
  );
}
