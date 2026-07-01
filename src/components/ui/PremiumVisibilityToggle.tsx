'use client';
import React from 'react';
import styles from './PremiumVisibilityToggle.module.css';

interface PremiumVisibilityToggleProps {
  label: React.ReactNode;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  name?: string;
  className?: string;
}

export default function PremiumVisibilityToggle({
  label,
  checked,
  onChange,
  name,
  className = ''
}: PremiumVisibilityToggleProps) {
  return (
    <div className={`${styles.container} ${checked ? styles.active : styles.inactive} ${className}`}>
      <label className={styles.label}>
        <input
          type="checkbox"
          name={name}
          checked={checked}
          onChange={onChange}
          className={styles.checkbox}
        />
        {label}
      </label>
    </div>
  );
}
