'use client';
import React from 'react';
import { MOTIVOS_RECHAZO_LEVE, MOTIVOS_SANCION_GRAVE } from '../hooks/useRechazos';

interface Props {
  foto: any;
  motivoSeleccionado: string;
  setMotivoSeleccionado: (m: string) => void;
  motivoExtra: string;
  setMotivoExtra: (v: string) => void;
  processing: number | null;
  onConfirmar: () => void;
  onCancelar: () => void;
  getMediaUrl: (ruta: string) => string;
}

export function ModalRechazo({
  foto, motivoSeleccionado, setMotivoSeleccionado,
  motivoExtra, setMotivoExtra, processing,
  onConfirmar, onCancelar, getMediaUrl,
}: Props) {
  const esGrave = MOTIVOS_SANCION_GRAVE.includes(motivoSeleccionado);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: 'white', borderRadius: '20px', maxWidth: 540, width: '100%', boxShadow: '0 24px 60px rgba(0,0,0,0.3)', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: '#fef2f2', padding: '8px', borderRadius: '10px' }}><span style={{ fontSize: '1.2rem' }}>🚫</span></div>
              <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#0f172a' }}>Denegar o Sancionar Foto</h2>
            </div>
            <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ background: '#f1f5f9', padding: '2px 8px', borderRadius: '12px', fontWeight: 600, color: '#475569' }}>👤 {foto.usuarioNombre}</span>
              <span style={{ background: '#ecfdf5', padding: '2px 8px', borderRadius: '12px', fontWeight: 600, color: '#047857' }}>🌱 {foto.especieNombre || 'Perfil'}{foto.variedadNombre ? ` - ${foto.variedadNombre}` : ''}</span>
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={onCancelar} style={{ background: 'white', border: '1px solid #cbd5e1', color: '#475569', padding: '8px 16px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}>Cancelar</button>
            <button onClick={onConfirmar} disabled={!motivoSeleccionado || processing !== null}
              style={{ background: motivoSeleccionado ? '#dc2626' : '#f1f5f9', color: motivoSeleccionado ? 'white' : '#94a3b8', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 700, cursor: motivoSeleccionado ? 'pointer' : 'not-allowed', fontSize: '0.85rem' }}>
              {processing !== null ? '⏳...' : 'Confirmar'}
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '24px 28px', maxHeight: '70vh', overflowY: 'auto' }}>
          <div style={{ width: '100%', height: '200px', marginBottom: '20px', borderRadius: '12px', overflow: 'hidden', background: '#f1f5f9', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <img src={getMediaUrl(foto.ruta)} alt="Foto a rechazar" crossOrigin="anonymous" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
          </div>
          <p style={{ margin: '0 0 16px', color: '#475569', fontSize: '0.9rem' }}>Selecciona el motivo del rechazo. El usuario lo verá en su galería y podrá recurrir la decisión.</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '16px' }}>
            {/* Leve */}
            <div>
              <h4 style={{ margin: '0 0 8px', fontSize: '0.9rem', color: '#475569', fontWeight: 700 }}>Rechazo Leve (Aviso por email, sin sanción)</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {MOTIVOS_RECHAZO_LEVE.map((motivo, i) => (
                  <label key={`leve-${i}`} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', padding: '10px 12px', borderRadius: '8px', border: `1.5px solid ${motivoSeleccionado === motivo ? '#ef4444' : '#e2e8f0'}`, background: motivoSeleccionado === motivo ? '#fef2f2' : 'white', transition: 'all 0.15s' }}>
                    <input type="radio" name="motivo" value={motivo} checked={motivoSeleccionado === motivo} onChange={() => setMotivoSeleccionado(motivo)} style={{ marginTop: '2px', accentColor: '#ef4444', flexShrink: 0 }} />
                    <span style={{ fontSize: '0.85rem', color: '#334155', lineHeight: 1.4 }}>{motivo}</span>
                  </label>
                ))}
              </div>
            </div>
            {/* Grave */}
            <div>
              <h4 style={{ margin: '0 0 8px', fontSize: '0.9rem', color: '#7f1d1d', fontWeight: 700 }}>⚠️ Infracción Grave (Sanción disciplinaria)</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {MOTIVOS_SANCION_GRAVE.map((motivo, i) => (
                  <label key={`grave-${i}`} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', padding: '10px 12px', borderRadius: '8px', border: `1.5px solid ${motivoSeleccionado === motivo ? '#7f1d1d' : '#e2e8f0'}`, background: motivoSeleccionado === motivo ? '#fef2f2' : 'white', transition: 'all 0.15s' }}>
                    <input type="radio" name="motivo" value={motivo} checked={motivoSeleccionado === motivo} onChange={() => setMotivoSeleccionado(motivo)} style={{ marginTop: '2px', accentColor: '#7f1d1d', flexShrink: 0 }} />
                    <span style={{ fontSize: '0.85rem', color: '#334155', lineHeight: 1.4 }}>{motivo}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {motivoSeleccionado === 'Otro motivo — ver nota adicional' && (
            <textarea placeholder="Describe el motivo específico..." value={motivoExtra} onChange={e => setMotivoExtra(e.target.value)} rows={3}
              style={{ width: '100%', border: '1.5px solid #fca5a5', borderRadius: '8px', padding: '10px 12px', fontSize: '0.85rem', resize: 'vertical', fontFamily: 'inherit', marginBottom: '8px', boxSizing: 'border-box' }} />
          )}

          {esGrave ? (
            <div style={{ background: '#fef2f2', border: '1.5px solid #fca5a5', borderRadius: '8px', padding: '10px 12px', fontSize: '0.8rem', color: '#991b1b' }}>
              ⛔ <strong>Atención:</strong> La foto será eliminada permanentemente y el usuario recibirá una sanción disciplinaria.
            </div>
          ) : (
            <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '8px', padding: '10px 12px', fontSize: '0.8rem', color: '#9a3412' }}>
              ℹ️ La foto <strong>no se borra</strong>. El usuario la verá marcada como rechazada en su galería y podrá recurrir.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
