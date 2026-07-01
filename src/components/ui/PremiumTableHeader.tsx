import React from 'react';

interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

interface PremiumTableHeaderProps {
  sortKey?: string;
  currentSortConfig?: SortConfig | null;
  onSort?: (key: string) => void;
  label: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
  sortable?: boolean;
}

export default function PremiumTableHeader({
  sortKey,
  currentSortConfig,
  onSort,
  label,
  style,
  className,
  sortable = true
}: PremiumTableHeaderProps) {
  const isSorted = sortable && currentSortConfig?.key === sortKey;
  const isAsc = isSorted && currentSortConfig?.direction === 'asc';
  
  const handleSort = () => {
    if (sortable && onSort && sortKey) {
      onSort(sortKey);
    }
  };

  return (
    <th 
      onClick={handleSort}
      className={className}
      style={{
        padding: '12px',
        cursor: sortable ? 'pointer' : 'default',
        userSelect: 'none',
        whiteSpace: 'nowrap',
        color: isSorted ? '#0f766e' : '#475569',
        borderBottom: '2px solid #e2e8f0',
        transition: 'color 0.2s ease',
        ...style
      }}
      onMouseOver={(e) => {
        if (sortable && !isSorted) e.currentTarget.style.color = '#0f766e';
      }}
      onMouseOut={(e) => {
        if (sortable && !isSorted) e.currentTarget.style.color = '#475569';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: style?.textAlign === 'center' ? 'center' : (style?.textAlign === 'right' ? 'flex-end' : 'flex-start') }}>
        {label}
        {sortable && (
          <span style={{ 
            fontSize: '0.75rem', 
            color: isSorted ? '#0f766e' : '#cbd5e1',
            display: 'inline-flex',
            flexDirection: 'column',
            lineHeight: 1
          }}>
            {isSorted ? (isAsc ? '🔼' : '🔽') : '↕️'}
          </span>
        )}
      </div>
    </th>
  );
}
