'use client';

import React, { useState, useEffect } from 'react';

interface Props {
  userEmail: string;
  onAcepta: () => void;   // Usuario aceptó → continuar con la subida
  onRechaza: () => void;  // Usuario rechazó → cerrar sin subir
  onCargando?: (v: boolean) => void;
}

/**
 * Modal de consentimiento de fotos.
 * Aparece la PRIMERA vez que un usuario intenta subir una foto.
 * Si el usuario acepta → puede subir fotos (consentimientofoto=1).
 * Si rechaza → no puede subir fotos (consentimientofoto=0).
 *
 * Uso:
 *   const [mostrarConsentimiento, setMostrarConsentimiento] = useState(false);
 *   // Antes de abrir el input de foto, comprobar si tiene consentimiento:
 *   const handleClickSubir = async () => {
 *     const res = await fetch('/api/user/consentimiento-foto', { headers: {'x-user-email': email} });
 *     const data = await res.json();
 *     if (data.consentimiento === null) setMostrarConsentimiento(true);
 *     else if (data.puedeSubirFotos) abrirInput();
 *     else alert('No tienes activada la galería de fotos.');
 *   };
 */
export default function ConsentimientoFotoModal({ userEmail, onAcepta, onRechaza }: Props) {
  const [guardando, setGuardando] = useState(false);

  const guardar = async (acepta: boolean) => {
    setGuardando(true);
    try {
      await fetch('/api/user/consentimiento-foto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail },
        body: JSON.stringify({ acepta })
      });
      if (acepta) onAcepta();
      else onRechaza();
    } catch (e) {
      console.error('Error guardando consentimiento:', e);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.65)',
      zIndex: 99999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        maxWidth: 520,
        width: '100%',
        boxShadow: '0 24px 60px rgba(0,0,0,0.3)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #10b981, #059669)',
          padding: '28px 32px',
          color: 'white'
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>📸</div>
          <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800 }}>
            Activar galería de fotos
          </h2>
          <p style={{ margin: '6px 0 0', opacity: 0.9, fontSize: '0.9rem' }}>
            Funcionalidad opcional — Consentimiento requerido
          </p>
        </div>

        {/* Body */}
        <div style={{ padding: '28px 32px' }}>
          <p style={{ color: '#334155', lineHeight: 1.7, marginTop: 0 }}>
            Para usar la galería de fotos en Verdantia, necesitas aceptar las siguientes condiciones:
          </p>

          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              'Tus fotos recibirán automáticamente una marca de agua de Verdantia.',
              'Verdantia podrá usar tus fotos de cultivos con fines educativos y divulgativos, nunca con datos personales visibles.',
              'Puedes eliminar tus fotos en cualquier momento desde tu perfil.',
              'Al cancelar tu cuenta, podrás elegir eliminarlas o donarlas a la comunidad.',
            ].map((texto, i) => (
              <li key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <span style={{
                  flexShrink: 0,
                  width: 22, height: 22,
                  background: '#dcfce7',
                  borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.75rem', color: '#166534', fontWeight: 800
                }}>✓</span>
                <span style={{ color: '#475569', fontSize: '0.9rem', lineHeight: 1.5 }}>{texto}</span>
              </li>
            ))}
          </ul>

          <div style={{
            background: '#f8fafc',
            borderRadius: '10px',
            padding: '12px 16px',
            fontSize: '0.8rem',
            color: '#64748b',
            marginBottom: '24px',
            borderLeft: '3px solid #10b981'
          }}>
            <strong>Nota:</strong> Si no aceptas, podrás seguir usando Verdantia con todas sus funcionalidades, excepto la subida de fotos.
          </div>

          {/* Botones */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              onClick={() => guardar(true)}
              disabled={guardando}
              style={{
                background: guardando ? '#94a3b8' : 'linear-gradient(135deg, #10b981, #059669)',
                color: 'white', border: 'none',
                padding: '14px 20px', borderRadius: '12px',
                fontWeight: 700, fontSize: '1rem',
                cursor: guardando ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 12px rgba(16,185,129,0.3)',
                transition: 'all 0.2s'
              }}
            >
              {guardando ? '⏳ Guardando...' : '✅ Acepto — Activar galería de fotos'}
            </button>
            <button
              onClick={() => guardar(false)}
              disabled={guardando}
              style={{
                background: 'white', color: '#64748b',
                border: '1.5px solid #e2e8f0',
                padding: '12px 20px', borderRadius: '12px',
                fontWeight: 600, fontSize: '0.9rem',
                cursor: guardando ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s'
              }}
            >
              ❌ No acepto — Usar Verdantia sin fotos
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
