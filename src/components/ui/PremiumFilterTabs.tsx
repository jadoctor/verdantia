'use client';
import React from 'react';

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

interface PremiumFilterTabsProps {
  options: FilterOption[];
  activeFilter: string;
  onSelect: (value: string) => void;
  themeColor?: string;
  isMobile?: boolean;
  style?: React.CSSProperties;
}

export default function PremiumFilterTabs({
  options,
  activeFilter,
  onSelect,
  themeColor = '#0f766e',
  isMobile = false,
  style
}: PremiumFilterTabsProps) {
  return (
    <div style={{
      display: 'flex',
      flexWrap: isMobile ? 'nowrap' : 'wrap',
      gap: '8px',
      width: isMobile ? '100%' : 'auto',
      overflowX: isMobile ? 'auto' : 'visible',
      paddingBottom: isMobile ? '4px' : '0',
      scrollbarWidth: 'none',
      WebkitOverflowScrolling: 'touch',
      ...style
    }}>
      {options.map((tag) => {
        const isSelected = activeFilter === tag.value;
        const displayText = tag.count !== undefined ? `${tag.label} (${tag.count})` : tag.label;
        
        return (
          <button
            key={tag.value}
            type="button"
            onClick={() => onSelect(tag.value)}
            style={{
              flexShrink: 0,
              padding: isMobile ? '6px 12px' : '6px 16px',
              borderRadius: '20px',
              border: isSelected ? '1px solid white' : '1px solid rgba(255,255,255,0.3)',
              background: isSelected ? 'white' : 'rgba(255,255,255,0.1)',
              color: isSelected ? themeColor : 'white',
              fontWeight: 'bold',
              fontSize: isMobile ? '0.8rem' : '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: isSelected ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
            }}
            onMouseOver={(e) => {
              if (!isSelected) {
                e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.6)';
              }
            }}
            onMouseOut={(e) => {
              if (!isSelected) {
                e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
              }
            }}
          >
            {displayText}
          </button>
        );
      })}
    </div>
  );
}
