'use client';
import React from 'react';

import styles from './PremiumSlider.module.css';

interface PremiumSliderProps {
  label: string;
  icon?: React.ReactNode;
  value: number;
  onChange: (val: number) => void;
  min: number;
  max: number;
  step?: number;
  formatValue?: (val: number) => string;
  style?: React.CSSProperties;
}

export default function PremiumSlider({
  label,
  icon,
  value,
  onChange,
  min,
  max,
  step = 1,
  formatValue = (v) => `${v}%`,
  style
}: PremiumSliderProps) {
  // Calculate percentage for styling the track
  const percentage = ((value - min) / (max - min)) * 100;
  
  return (
    <div className={styles.container} style={style}>
      <label className={styles.header}>
        <span className={styles.labelWrapper}>
          {icon} {label}
        </span>
        <span className={styles.valueDisplay}>
          {formatValue(value)}
        </span>
      </label>
      
      <input 
        type="range" 
        min={min} 
        max={max} 
        step={step}
        value={value} 
        onChange={(e) => onChange(Number(e.target.value))} 
        className={styles.sliderInput}
        style={{
          background: `linear-gradient(90deg, #0f766e ${percentage}%, #e2e8f0 ${percentage}%)`
        }}
      />
    </div>
  );
}
