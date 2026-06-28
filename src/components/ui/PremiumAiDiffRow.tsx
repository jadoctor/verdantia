'use client';
import React from 'react';

export function PremiumAiDiffBadge({ isOld, isNew }: { isOld: boolean; isNew: boolean }) {
  if (isOld && isNew) {
    return <span style={{ fontSize: '0.7rem', background: '#f1f5f9', color: '#64748b', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>COINCIDE</span>;
  }
  if (isNew && !isOld) {
    return <span style={{ fontSize: '0.7rem', background: '#dcfce7', color: '#166534', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>NUEVO DE IA</span>;
  }
  if (isOld && !isNew) {
    return <span style={{ fontSize: '0.7rem', background: '#ffe4e6', color: '#be123c', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>IA SUGIERE ELIMINAR</span>;
  }
  return null;
}

interface PremiumAiDiffRowProps {
  label: React.ReactNode;
  isOld: boolean;
  isNew: boolean;
  isSelected: boolean;
  onToggle: () => void;
}

export default function PremiumAiDiffRow({
  label,
  isOld,
  isNew,
  isSelected,
  onToggle
}: PremiumAiDiffRowProps) {
  let actionLabel = null;
  if (isOld && isNew) {
    actionLabel = isSelected ? <span style={{ color: '#166534', fontWeight: 'bold' }}>✅ Mantener</span> : <span style={{ color: '#be123c', fontWeight: 'bold' }}>❌ Quitar</span>;
  } else if (isNew && !isOld) {
    actionLabel = isSelected ? <span style={{ color: '#166534', fontWeight: 'bold' }}>✨ Añadir</span> : <span style={{ color: '#64748b', fontWeight: 'bold' }}>❌ Ignorar</span>;
  } else if (isOld && !isNew) {
    actionLabel = isSelected ? <span style={{ color: '#ca8a04', fontWeight: 'bold' }}>⚠️ Mantener</span> : <span style={{ color: '#be123c', fontWeight: 'bold' }}>🗑️ Borrar</span>;
  }

  const isCoincide = isOld && isNew;
  const isSuggested = isNew && !isOld;
  
  // Background logic from AiModal
  let rowBg = '#ffffff';
  let rowBorder = '1px solid #e2e8f0';
  if (isSelected) {
    if (isCoincide) { rowBg = '#f8fafc'; rowBorder = '1px solid #cbd5e1'; }
    if (isSuggested) { rowBg = '#f0fdf4'; rowBorder = '1px solid #bbf7d0'; }
    if (isOld && !isNew) { rowBg = '#fefce8'; rowBorder = '1px solid #fef08a'; }
  } else {
    rowBg = '#f8fafc';
    if (isOld && !isNew) { rowBg = '#fef2f2'; rowBorder = '1px solid #fecaca'; }
  }

  return (
    <div
      onClick={onToggle}
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 16px',
        background: rowBg,
        border: rowBorder,
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'all 0.2s'
      }}
      onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.05)'; }}
      onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      <div>
        <div style={{ fontWeight: 'bold', color: '#1e293b', marginBottom: '4px' }}>{label}</div>
        <PremiumAiDiffBadge isOld={isOld} isNew={isNew} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <span style={{ fontSize: '0.85rem', width: '90px', textAlign: 'right' }}>{actionLabel}</span>
        <input 
          type="checkbox" 
          checked={isSelected} 
          readOnly 
          style={{ cursor: 'pointer', transform: 'scale(1.2)' }} 
        />
      </div>
    </div>
  );
}
