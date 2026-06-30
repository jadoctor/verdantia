import React from 'react';

interface SegmentOption<T extends string> {
  value: T;
  label: string;
  count?: number;
}

interface PremiumSegmentedFilterProps<T extends string> {
  options: readonly SegmentOption<T>[] | SegmentOption<T>[];
  value: T;
  onChange: (val: T) => void;
  isMobile?: boolean;
}

export default function PremiumSegmentedFilter<T extends string>({
  options,
  value,
  onChange,
  isMobile = false
}: PremiumSegmentedFilterProps<T>) {
  return (
    <div style={{
      display: 'inline-flex',
      background: 'rgba(255, 255, 255, 0.15)',
      padding: '4px',
      borderRadius: '10px',
      border: '1px solid rgba(255, 255, 255, 0.25)',
      gap: '4px',
      width: isMobile ? '100%' : 'auto',
      justifyContent: isMobile ? 'space-between' : 'flex-start',
      backdropFilter: 'blur(10px)',
      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
    }}>
      {options.map((opt) => {
        const isActive = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            style={{
              flex: isMobile ? 1 : 'none',
              padding: isMobile ? '8px 4px' : '6px 14px',
              borderRadius: '8px',
              border: 'none',
              background: isActive ? 'white' : 'transparent',
              color: isActive ? '#0f766e' : 'white',
              fontWeight: 700,
              fontSize: isMobile ? '0.8rem' : '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: isActive ? '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)' : 'none',
              textAlign: 'center',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              whiteSpace: 'nowrap'
            }}
          >
            <span>{opt.label}</span>
            {typeof opt.count === 'number' && (
              <span style={{
                fontSize: '0.7rem',
                opacity: 0.8,
                background: isActive ? 'rgba(15, 118, 110, 0.1)' : 'rgba(255,255,255,0.2)',
                padding: '1px 6px',
                borderRadius: '999px',
                marginLeft: '2px',
                fontWeight: 600
              }}>
                {opt.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
