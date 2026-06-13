import React from 'react';
import { MOTIVOS_BAJA } from '../constants/profileConstants';
import { useProfileSecurity } from '../hooks/useProfileSecurity';

interface DangerZoneTabProps {
  securityData: ReturnType<typeof useProfileSecurity>;
}

export function DangerZoneTab({ securityData }: DangerZoneTabProps) {
  const {
    motivoBaja,
    setMotivoBaja,
    motivoLibre,
    setMotivoLibre,
    handleCancelAccount
  } = securityData;
  return (
    <div style={{ background: 'white', border: '1.5px solid #fca5a5', borderRadius: '16px', padding: '24px', boxShadow: '0 10px 25px rgba(239, 68, 68, 0.05)', animation: 'fadeIn 0.3s ease' }}>
      <h3 style={{ margin: '0 0 16px 0', color: '#ef4444', fontSize: '1.1rem', fontWeight: 800 }}>⚠️ Zona de Peligro — Cancelar Cuenta</h3>
      <div className="accordion-body">
        <div className="danger-zone">
          <h4>🗑️ Eliminar mi cuenta permanentemente</h4>
          <p className="danger-text">
            Antes de irte, por favor indícanos el motivo:
          </p>

          <select
            className="form-input danger-select"
            value={motivoBaja}
            onChange={e => setMotivoBaja(e.target.value)}
          >
            <option value="" disabled>— Selecciona un motivo —</option>
            {MOTIVOS_BAJA.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          {motivoBaja === 'Otro' && (
            <textarea
              className="form-textarea"
              placeholder="Cuéntanos más para poder mejorar..."
              value={motivoLibre}
              onChange={e => setMotivoLibre(e.target.value)}
              style={{ marginTop: '12px', borderColor: '#fca5a5' }}
            />
          )}

          <ul className="danger-list">
            <li>Tu perfil se ocultará de inmediato.</li>
            <li>Tienes 30 días para reactivarla.</li>
            <li>Pasados 30 días, la eliminación es irreversible.</li>
          </ul>

          <button
            type="button"
            className="btn-danger"
            onClick={handleCancelAccount}
          >
            🗑️ Solicitar Borrado de Cuenta
          </button>
        </div>
      </div>
    </div>
  );
}
