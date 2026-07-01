'use client';
import React from 'react';
import styles from './PremiumFilterTabs.module.css';

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
  /** @deprecated isMobile is handled 100% via CSS Modules */
  isMobile?: boolean;
  style?: React.CSSProperties;
}

export default function PremiumFilterTabs({
  options,
  activeFilter,
  onSelect,
  themeColor = '#0f766e',
  style
}: PremiumFilterTabsProps) {
  return (
    <div 
      className={styles.container} 
      style={style}
    >
      {options.map((tag) => {
        const isSelected = activeFilter === tag.value;
        const displayText = tag.count !== undefined ? `${tag.label} (${tag.count})` : tag.label;
        
        return (
          <button
            key={tag.value}
            type="button"
            onClick={() => onSelect(tag.value)}
            className={`${styles.tab} ${isSelected ? styles.selected : styles.unselected}`}
            style={{
              color: isSelected ? themeColor : 'white',
            }}
          >
            {displayText}
          </button>
        );
      })}
    </div>
  );
}
