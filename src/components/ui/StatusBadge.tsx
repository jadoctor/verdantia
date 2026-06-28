import React from 'react';

type BadgeStatus = 'active' | 'inactive' | 'warning' | 'info' | 'error';

interface StatusBadgeProps {
  status: BadgeStatus;
  label?: string;
  icon?: string;
  style?: React.CSSProperties;
}

export default function StatusBadge({ status, label, icon, style }: StatusBadgeProps) {
  const getColors = () => {
    switch (status) {
      case 'active': return { bg: '#dcfce7', text: '#16a34a' };
      case 'warning': return { bg: '#fef3c7', text: '#d97706' };
      case 'error': return { bg: '#fee2e2', text: '#dc2626' };
      case 'info': return { bg: '#e0f2fe', text: '#0284c7' };
      case 'inactive':
      default: return { bg: '#f1f5f9', text: '#64748b' };
    }
  };

  const colors = getColors();

  return (
    <span style={{
      background: colors.bg,
      color: colors.text,
      padding: '4px 10px',
      borderRadius: '12px',
      fontSize: '0.85rem',
      fontWeight: 'bold',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      whiteSpace: 'nowrap',
      ...style
    }}>
      {icon && <span>{icon}</span>}
      {label}
    </span>
  );
}
