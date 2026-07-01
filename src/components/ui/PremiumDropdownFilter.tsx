import React, { useState, useRef, useEffect } from 'react';
import styles from './PremiumDropdownFilter.module.css';

interface DropdownOption {
  value: string;
  label: string;
  emoji?: string;
  count?: number;
}

interface PremiumDropdownFilterProps {
  options: DropdownOption[];
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  label?: string;
  /** @deprecated isMobile is handled 100% via CSS Modules */
  isMobile?: boolean;
}

export default function PremiumDropdownFilter({
  options,
  value,
  onChange,
  placeholder = 'Seleccionar...',
  label
}: PremiumDropdownFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(o => o.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className={styles.container}>
      {label && (
        <span className={styles.label}>
          {label}
        </span>
      )}
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={styles.dropdownButton}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {selectedOption ? (
            <>
              {selectedOption.emoji && <span>{selectedOption.emoji}</span>}
              <span>{selectedOption.label}</span>
              {typeof selectedOption.count === 'number' && (
                <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>({selectedOption.count})</span>
              )}
            </>
          ) : (
            placeholder
          )}
        </span>
        <span style={{ 
          fontSize: '0.65rem', 
          transition: 'transform 0.2s ease',
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)'
        }}>
          ▼
        </span>
      </button>

      {isOpen && (
        <div className={styles.dropdownMenu}>
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSelect(opt.value)}
                className={`${styles.optionButton} ${isSelected ? styles.selected : styles.unselected}`}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {opt.emoji && <span>{opt.emoji}</span>}
                  <span>{opt.label}</span>
                </span>
                {typeof opt.count === 'number' && (
                  <span className={styles.optionCount}>
                    {opt.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
