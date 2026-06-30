import React from 'react';
import PremiumModal from '@/components/ui/PremiumModal';

interface DeleteConfirmModalProps {
  deleteConfirm: any;
  setDeleteConfirm: (val: any) => void;
  confirmDelete: () => Promise<void>;
}

export default function DeleteConfirmModal({
  deleteConfirm,
  setDeleteConfirm,
  confirmDelete
}: DeleteConfirmModalProps) {
  if (!deleteConfirm) return null;

  return (
    <PremiumModal isOpen={deleteConfirm !== null} onClose={() => setDeleteConfirm(null)} maxWidth="380px" zIndex={9999}>
      <div style={{ padding: '32px', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🗑️</div>
        <h3 style={{ margin: '0 0 8px', color: '#1e293b', fontSize: '1.1rem' }}>
          Eliminar {deleteConfirm.type === 'photos' ? 'foto' : 'documento'}
        </h3>
        <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '24px', lineHeight: 1.5 }}>
          Esta acción no se puede deshacer. ¿Confirmas que quieres eliminar este {deleteConfirm.type === 'photos' ? 'archivo de imagen' : 'documento PDF'}?
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button type="button" onClick={() => setDeleteConfirm(null)}
            style={{ padding: '10px 22px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white', color: '#334155', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' }}>
            Cancelar
          </button>
          <button type="button" onClick={confirmDelete}
            style={{ padding: '10px 22px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem', boxShadow: '0 4px 12px rgba(239,68,68,0.35)' }}>
            Sí, eliminar
          </button>
        </div>
      </div>
    </PremiumModal>
  );
}
