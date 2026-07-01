import React from 'react';
import styles from './PremiumSegmentedFilter.module.css';

interface SegmentOption<T extends string> {
  value: T;
  label: string;
  count?: number;
}

interface PremiumSegmentedFilterProps<T extends string> {
  options: readonly SegmentOption<T>[] | SegmentOption<T>[];
  value: T;
  onChange: (val: T) => void;
  /** @deprecated isMobile is handled 100% via CSS Modules */
  isMobile?: boolean;
}

export default function PremiumSegmentedFilter<T extends string>({
  options,
  value,
  onChange
}: PremiumSegmentedFilterProps<T>) {
  return (
    <div className={styles.container}>
      {options.map((opt) => {
        const isActive = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`${styles.segmentButton} ${isActive ? styles.selected : styles.unselected}`}
          >
            <span>{opt.label}</span>
            {typeof opt.count === 'number' && (
              <span className={styles.countBadge}>
                {opt.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
