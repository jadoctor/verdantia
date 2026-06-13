'use client';
import React from 'react';

interface Props {
  motivoRechazoRecurso: string;
  setMotivoRechazoRecurso: (v: string) => void;
  onConfirmar: () => void;
  onCancelar: () => void;
}

export function ModalRecurso({ motivoRechazoRecurso, setMotivoRechazoRecurso, onConfirmar, onCancelar }: Props) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'white', padding: '32px', borderRadius: '16px', width: '90%', maxWidth: '500px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '1.25rem', color: '#0f172a' }}>Denegar Recurso</h3>
        <p style={{ margin: '0 0 16px', fontSize: '0.9rem', color: '#475569' }}>Escribe el motivo por el cual se deniega el recurso. Este mensaje será visible para el usuario.</p>
        <textarea
          value={motivoRechazoRecurso}
          onChange={e => setMotivoRechazoRecurso(e.target.value)}
          placeholder="Ej: La normativa indica claramente que no se permite..."
          style={{ width: '100%', minHeight: '100px', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.95rem', fontFamily: 'inherit', resize: 'vertical' }}
        />
        <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
          <button onClick={onCancelar} style={{ flex: 1, padding: '12px', background: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Cancelar</button>
          <button onClick={onConfirmar} disabled={!motivoRechazoRecurso.trim()}
            style={{ flex: 1, padding: '12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', cursor: motivoRechazoRecurso.trim() ? 'pointer' : 'not-allowed', fontWeight: 700, opacity: motivoRechazoRecurso.trim() ? 1 : 0.5 }}>
            Denegar y Enviar
          </button>
        </div>
      </div>
    </div>
  );
}
