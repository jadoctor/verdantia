import React from 'react';

interface DeleteConfirmModalProps {
  onCancel: () => void;
  onConfirm: () => void;
}

export function DeleteConfirmModal({ onCancel, onConfirm }: DeleteConfirmModalProps) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '20px' }}>
      <div style={{ background: 'white', borderRadius: '16px', padding: '24px', width: 'min(100%, 420px)', boxShadow: '0 20px 40px rgba(15, 23, 42, 0.2)' }}>
        <h3 style={{ margin: '0 0 12px', fontSize: '1.2rem', color: '#0f172a' }}>Eliminar tratamiento</h3>
        <p style={{ margin: '0 0 20px', color: '#475569' }}>Esta acción no se puede deshacer.</p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button type="button" onClick={onCancel} style={{ padding: '8px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', background: 'white', color: '#475569', cursor: 'pointer', fontWeight: 600 }}>
            Cancelar
          </button>
          <button type="button" onClick={onConfirm} style={{ padding: '8px 14px', borderRadius: '10px', border: 'none', background: '#dc2626', color: 'white', cursor: 'pointer', fontWeight: 700 }}>
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}
