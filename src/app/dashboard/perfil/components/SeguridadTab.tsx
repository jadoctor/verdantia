import React from 'react';
import { useProfileData } from '../hooks/useProfileData';
import { useProfileSecurity } from '../hooks/useProfileSecurity';

interface SeguridadTabProps {
  profileData: ReturnType<typeof useProfileData>;
  securityData: ReturnType<typeof useProfileSecurity>;
}

export function SeguridadTab({ profileData, securityData }: SeguridadTabProps) {
  const { profile } = profileData;
  const {
    privacidadAceptada,
    setPrivacidadAceptada,
    passwordResetSent,
    handlePasswordReset,
    handleRegisterPasskey
  } = securityData;

  if (!profile) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* ── SEGURIDAD ── */}
      <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', animation: 'fadeIn 0.3s ease' }}>
        <h3 style={{ margin: '0 0 16px 0', color: '#0f766e', fontSize: '1.1rem', fontWeight: 800 }}>🔒 Seguridad</h3>
        <div className="accordion-body">
          <div className="form-grid">
            {/* Restablecer contraseña */}
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label>Contraseña</label>
              <div className="password-reset-box">
                <p>Con Firebase Authentication, las contraseñas se gestionan de forma segura. Pulsa el botón para recibir un email de restablecimiento.</p>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={handlePasswordReset}
                  disabled={passwordResetSent}
                  style={{ marginTop: '8px' }}
                >
                  {passwordResetSent ? '📧 Email enviado — revisa tu bandeja' : '🔑 Enviar email de restablecimiento de contraseña'}
                </button>
              </div>
            </div>

            {/* Passkeys (WebAuthn) */}
            <div className="form-group" style={{ gridColumn: 'span 2', marginTop: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                Huella Digital o FaceID (Passkey)
                {profile.passkeysCount && profile.passkeysCount > 0 ? (
                  <span style={{ fontSize: '0.75rem', background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold' }}>
                    ✅ Activada ({profile.passkeysCount})
                  </span>
                ) : (
                  <span style={{ fontSize: '0.75rem', background: '#f1f5f9', color: '#64748b', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold' }}>
                    Inactiva
                  </span>
                )}
              </label>
              <div className="password-reset-box" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                {profile.passkeysCount && profile.passkeysCount > 0 ? (
                  <p style={{ color: '#15803d', fontWeight: 500 }}>¡Genial! Tienes la biometría configurada. Puedes iniciar sesión de forma rápida y segura en tus dispositivos registrados.</p>
                ) : (
                  <p>Usa la biometría nativa de tu dispositivo para iniciar sesión sin contraseña, con la máxima seguridad y comodidad.</p>
                )}
                <button
                  type="button"
                  onClick={handleRegisterPasskey}
                  style={{ marginTop: '8px', padding: '8px 16px', background: '#f8fafc', color: '#1e293b', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  <span style={{ fontSize: '1.2rem' }}>👁️</span> {profile.passkeysCount && profile.passkeysCount > 0 ? 'Vincular otro dispositivo' : 'Vincular Nueva Huella / Dispositivo'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── POLÍTICA DE PRIVACIDAD (RGPD) ── */}
      <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', animation: 'fadeIn 0.3s ease' }}>
        <h3 style={{ margin: '0 0 16px 0', color: '#0f766e', fontSize: '1.1rem', fontWeight: 800 }}>📋 Política de Privacidad</h3>
        <div className="accordion-body">
          <div className="privacy-box">
            <label className="section-label">🛡️ Tratamiento de Datos Personales (RGPD)</label>
            <label className="privacy-check">
              <input
                type="checkbox"
                checked={privacidadAceptada}
                onChange={e => {
                  if (!e.target.checked) {
                    const confirmar = confirm('⚠️ ATENCIÓN: La aceptación de la Política de Privacidad es obligatoria para usar Verdantia.\n\nSi decides retirarla, tu cuenta debe ser cancelada inmediatamente por imperativo legal (RGPD).\n\n¿Deseas proceder con la cancelación de tu cuenta?');
                    if (!confirmar) { e.preventDefault(); return; }
                  }
                  setPrivacidadAceptada(e.target.checked);
                }}
              />
              <span>
                Acepto la <a href="/politica-privacidad" target="_blank" style={{ color: 'var(--storm-primary)', fontWeight: 600 }}>Política de Privacidad</a> y los Términos de Uso de Verdantia. Entiendo que mis datos serán tratados conforme a lo descrito.
              </span>
            </label>
            <div className="privacy-status signed">
              ✅ Firma electrónica registrada
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
