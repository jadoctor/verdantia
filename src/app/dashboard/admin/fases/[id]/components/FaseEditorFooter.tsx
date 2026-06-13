import React from 'react';

interface FaseEditorFooterProps {
  isNew: boolean;
  saving: boolean;
  onSaveManual: () => void;
  onCancel: () => void;
}

export function FaseEditorFooter({ isNew, saving, onSaveManual, onCancel }: FaseEditorFooterProps) {
  return (
    <>
      {!isNew ? (
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', borderTop: '2px solid #f1f5f9', paddingTop: '20px', color: '#64748b', fontSize: '0.85rem' }}>
          <span>⚡ Los cambios se guardan automáticamente al escribir.</span>
        </div>
      ) : (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '2px solid #f1f5f9', paddingTop: '20px', flexWrap: 'wrap' }}>
          <button 
            type="button"
            onClick={onCancel} 
            style={{ padding: '10px 20px', borderRadius: '8px', background: 'white', color: '#64748b', border: '1px solid #cbd5e1', fontWeight: 'bold', cursor: 'pointer' }}
          >
            Cancelar
          </button>
          <button 
            type="button"
            onClick={onSaveManual} 
            disabled={saving}
            style={{ padding: '10px 24px', borderRadius: '8px', background: '#10b981', color: 'white', border: 'none', fontWeight: 'bold', cursor: saving ? 'not-allowed' : 'pointer', boxShadow: '0 4px 6px rgba(16, 185, 129, 0.2)' }}
          >
            {saving ? 'Creando...' : '🌱 Crear Fase'}
          </button>
        </div>
      )}
    </>
  );
}
