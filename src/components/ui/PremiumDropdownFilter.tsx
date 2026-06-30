import React, { useState, useRef, useEffect } from 'react';

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
  isMobile?: boolean;
}

export default function PremiumDropdownFilter({
  options,
  value,
  onChange,
  placeholder = 'Seleccionar...',
  label,
  isMobile = false
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
    <div 
      ref={dropdownRef} 
      style={{ 
        position: 'relative', 
        width: isMobile ? '100%' : 'auto',
        display: 'inline-flex',
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: isMobile ? 'stretch' : 'center',
        gap: '8px'
      }}
    >
      {label && (
        <span style={{ 
          fontSize: '0.85rem', 
          fontWeight: 700, 
          color: 'white',
          minWidth: isMobile ? '60px' : 'auto' 
        }}>
          {label}
        </span>
      )}
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: isMobile ? '100%' : 'auto',
          minWidth: '180px',
          padding: '8px 16px 8px 12px',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.25)',
          background: 'rgba(255, 255, 255, 0.15)',
          color: 'white',
          fontSize: '0.85rem',
          fontWeight: 600,
          outline: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          backdropFilter: 'blur(10px)',
          transition: 'all 0.2s ease',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
        }}
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
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          left: isMobile ? 0 : 'auto',
          marginTop: '8px',
          minWidth: '220px',
          background: 'white',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
          zIndex: 999,
          maxHeight: '260px',
          overflowY: 'auto',
          padding: '6px',
          animation: 'fadeInDown 0.15s cubic-bezier(0.16, 1, 0.3, 1) both'
        }}>
          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes fadeInDown {
              from { opacity: 0; transform: translateY(-8px) scale(0.95); }
              to { opacity: 1; transform: translateY(0) scale(1); }
            }
          `}} />
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSelect(opt.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: isSelected ? '#f1f5f9' : 'transparent',
                  color: isSelected ? '#0f766e' : '#334155',
                  fontSize: '0.85rem',
                  fontWeight: isSelected ? 700 : 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                  transition: 'background 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.background = '#f8fafc';
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.background = 'transparent';
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {opt.emoji && <span>{opt.emoji}</span>}
                  <span>{opt.label}</span>
                </span>
                {typeof opt.count === 'number' && (
                  <span style={{
                    fontSize: '0.75rem',
                    color: isSelected ? '#0f766e' : '#64748b',
                    background: '#f1f5f9',
                    padding: '2px 6px',
                    borderRadius: '999px',
                    fontWeight: 600
                  }}>
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
