'use client';
import React from 'react';

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', ...style }}>
      <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: '600', color: '#334155', fontSize: '0.9rem' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {icon} {label}
        </span>
        <span style={{ color: '#0f766e', fontWeight: 'bold' }}>
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
        style={{
          WebkitAppearance: 'none',
          width: '100%',
          height: '6px',
          background: `linear-gradient(90deg, #0f766e ${percentage}%, #e2e8f0 ${percentage}%)`,
          borderRadius: '4px',
          outline: 'none',
          cursor: 'pointer',
          // Note: using custom css for the thumb requires styled-components or global css, 
          // but we can inline standard properties. The thumb style will fallback to browser default if not customized via CSS class.
        }}
      />
      <style>{`
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #ffffff;
          border: 2px solid #0f766e;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          transition: transform 0.1s;
        }
        input[type=range]::-webkit-slider-thumb:hover {
          transform: scale(1.15);
        }
        input[type=range]::-webkit-slider-thumb:active {
          transform: scale(0.95);
          background: #f0fdf4;
        }
        input[type=range]::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #ffffff;
          border: 2px solid #0f766e;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          transition: transform 0.1s;
        }
        input[type=range]::-moz-range-thumb:hover {
          transform: scale(1.15);
        }
      `}</style>
    </div>
  );
}
