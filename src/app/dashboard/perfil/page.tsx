'use client';

import { useEffect, useState, useCallback } from 'react';
import { auth } from '@/lib/firebase/config';
import { onAuthStateChanged, sendPasswordResetEmail } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import './perfil.css';

interface UserProfile {
  id: number;
  nombre: string;
  apellidos: string;
  email: string;
  roles: string;
  icono: string | null;
  codigoPostal: string | null;
  poblacion: string | null;
  estadoCuenta: string;
  nombreUsuario: string | null;
  pais: string | null;
  fechaNacimiento: string | null;
}

const AVATAR_ICONS = [
  '🌱','🌿','🍀','🍃','🌾','🌻','🌷','🌹','🌵','🌴','🍄','🪴',
  '🐝','🦋','🐞','🐛','🐌','🐇','🦉','🐦','🦆','🐓','🐢','🦔',
  '🐸','🐟','🐑','🐐','🐄','🐎','🐕','🐈','🦜','🦚','🦢'
];

const MOTIVOS_BAJA = [
  'No encuentro lo que busco',
  'Dudas sobre la privacidad',
  'Faltan funcionalidades',
  'He encontrado otra solución',
  'El precio de los planes es elevado',
  'Recibo demasiadas notificaciones',
  'Solo quería probar la aplicación',
  'Voy a crear una cuenta nueva',
  'Problemas técnicos constantes',
  'Otro'
];

export default function PerfilPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const router = useRouter();

  // Form state
  const [nombre, setNombre] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [pais, setPais] = useState('');
  const [codigoPostal, setCodigoPostal] = useState('');
  const [poblacion, setPoblacion] = useState('');
  const [icono, setIcono] = useState('');

  // Privacy & Danger Zone
  const [privacidadAceptada, setPrivacidadAceptada] = useState(true);
  const [motivoBaja, setMotivoBaja] = useState('');
  const [motivoLibre, setMotivoLibre] = useState('');

  // Password
  const [passwordResetSent, setPasswordResetSent] = useState(false);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.push('/login'); return; }

      try {
        const res = await fetch(`/api/auth/profile?email=${encodeURIComponent(user.email!)}`);
        if (res.ok) {
          const data = await res.json();
          const p = data.profile;
          setProfile(p);
          setNombre(p.nombre || '');
          setApellidos(p.apellidos || '');
          setNombreUsuario(p.nombreUsuario || '');
          setFechaNacimiento(p.fechaNacimiento || '');
          setPais(p.pais || '');
          setCodigoPostal(p.codigoPostal || '');
          setPoblacion(p.poblacion || '');
          setIcono(p.icono || '');
        }
      } catch (err) {
        console.error('Error cargando perfil:', err);
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  // ── Auto-save: Icono (al hacer clic, se guarda solo) ──
  const autoSaveIcon = async (newIcon: string) => {
    if (!profile) return;
    setIcono(newIcon);
    try {
      await fetch('/api/perfil', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: profile.email, icono: newIcon })
      });
      showToast('✅ Icono de perfil actualizado');
    } catch { /* silencioso */ }
  };

  // ── Auto-save: Población (al salir del campo) ──
  const autoSavePoblacion = async () => {
    if (!profile) return;
    try {
      await fetch('/api/perfil', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: profile.email, poblacion })
      });
    } catch { /* silencioso */ }
  };

  // ── Guardar todo el perfil ──
  const handleSave = async () => {
    if (!profile) return;
    if (!privacidadAceptada) {
      showToast('⚠️ Debes aceptar la Política de Privacidad para guardar.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/perfil', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: profile.email, nombre, apellidos, nombreUsuario,
          fechaNacimiento, pais, codigoPostal, poblacion, icono
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast('✅ Perfil actualizado correctamente');
        // Actualizar nombre en la cabecera en tiempo real
        const headerName = document.querySelector('.header-greeting strong');
        const sidebarName = document.querySelector('.profile-name');
        const displayN = nombreUsuario || nombre || 'Agricultor';
        if (headerName) headerName.textContent = displayN;
        if (sidebarName) sidebarName.textContent = displayN;
      } else {
        showToast('❌ Error: ' + (data.error || 'Algo salió mal'));
      }
    } catch (err: any) {
      showToast('❌ Error de conexión: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Restablecer contraseña via Firebase ──
  const handlePasswordReset = async () => {
    if (!profile?.email) return;
    try {
      await sendPasswordResetEmail(auth, profile.email);
      setPasswordResetSent(true);
      showToast('📧 Email de restablecimiento enviado a ' + profile.email);
    } catch (err: any) {
      showToast('❌ Error al enviar email: ' + err.message);
    }
  };

  // ── Cancelar cuenta ──
  const handleCancelAccount = () => {
    if (!motivoBaja) {
      showToast('⚠️ Selecciona un motivo de baja.');
      return;
    }
    const paso1 = confirm('⚠️ ¿Estás seguro de que quieres eliminar tu cuenta?\n\nTus datos personales se destruirán tras 30 días. Esta acción es irreversible pasado ese plazo.');
    if (!paso1) return;
    const paso2 = confirm('🔴 ÚLTIMA CONFIRMACIÓN\n\nEsta acción significará la pérdida permanente de tu identidad en la plataforma.\n\n¿Realmente deseas continuar?');
    if (!paso2) return;
    showToast('🔴 Solicitud de borrado enviada. Tu cuenta entrará en periodo de gracia de 30 días.');
  };

  // ── Seleccionar icono ──
  const selectIcon = (icon: string) => {
    const newIcon = icono === icon ? '' : icon;
    autoSaveIcon(newIcon);
  };

  const calcularEdad = () => {
    if (!fechaNacimiento) return '';
    const nacimiento = new Date(fechaNacimiento);
    const hoy = new Date();
    let years = hoy.getFullYear() - nacimiento.getFullYear();
    const m = hoy.getMonth() - nacimiento.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) years--;
    return `📅 ${years} años`;
  };

  // Actualización en vivo del nombre en la cabecera
  const updateLiveHeaderName = () => {
    const displayN = nombreUsuario || nombre || 'Agricultor';
    const headerName = document.querySelector('.header-greeting strong');
    if (headerName) headerName.textContent = displayN;
  };

  if (loading) return <div className="loading-screen"><div className="loading-spinner"></div><p>Cargando perfil...</p></div>;
  if (!profile) return <p>No se pudo cargar el perfil.</p>;

  const roles = profile.roles.split(',').map(r => r.trim());
  const isFirebaseVerified = auth.currentUser?.emailVerified ?? false;

  return (
    <div className="perfil-page">
      {toast && <div className="perfil-toast">{toast}</div>}

      {/* ═══════════════════════════════════════════ */}
      {/* 1. FOTOGRAFÍA E ICONOS                      */}
      {/* ═══════════════════════════════════════════ */}
      <details open>
        <summary>📸 Fotografía e Iconos</summary>
        <div className="accordion-body">
          <label className="section-label">Icono de Perfil Alternativo</label>
          <div className="icon-grid">
            {AVATAR_ICONS.map((icon) => (
              <button
                key={icon}
                type="button"
                className={`icon-btn ${icono === icon ? 'selected' : ''}`}
                onClick={() => selectIcon(icon)}
              >
                {icon}
              </button>
            ))}
          </div>
          <small className="help-text">
            Este icono se mostrará como emoji cuando no tengas fotografía. Su guardado es automático al clicar uno.
          </small>
        </div>
      </details>

      {/* ═══════════════════════════════════════════ */}
      {/* 2. DATOS PERSONALES                          */}
      {/* ═══════════════════════════════════════════ */}
      <details open>
        <summary>
          👤 Datos Personales
          <span className="accordion-preview">({nombre} {apellidos})</span>
        </summary>
        <div className="accordion-body">
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="nombre">Nombre *</label>
              <input id="nombre" type="text" className="form-input" value={nombre}
                onChange={e => { setNombre(e.target.value); }}
                onInput={updateLiveHeaderName}
                required placeholder="Tu nombre" />
            </div>
            <div className="form-group">
              <label htmlFor="apellidos">Apellidos *</label>
              <input id="apellidos" type="text" className="form-input" value={apellidos}
                onChange={e => setApellidos(e.target.value)} required placeholder="Tus apellidos" />
            </div>
            <div className="form-group">
              <label htmlFor="nombre_usuario">Nombre de Usuario</label>
              <input id="nombre_usuario" type="text" className="form-input" value={nombreUsuario}
                onChange={e => { setNombreUsuario(e.target.value); }}
                onInput={updateLiveHeaderName}
                placeholder="Nombre público visible" maxLength={100} />
              <small className="help-text">Nombre visible para los demás usuarios.</small>
            </div>
            <div className="form-group">
              <label htmlFor="fecha_nacimiento">Fecha de Nacimiento</label>
              <input id="fecha_nacimiento" type="date" className="form-input" value={fechaNacimiento}
                onChange={e => setFechaNacimiento(e.target.value)} />
              <small className="help-text">{calcularEdad() || 'Necesaria para verificar la mayoría de edad.'}</small>
            </div>
            <div className="form-group">
              <label htmlFor="pais">País</label>
              <input id="pais" type="text" className="form-input" value={pais}
                onChange={e => setPais(e.target.value)} placeholder="Ej: España" />
            </div>
            <div className="form-group">
              <label htmlFor="codigo_postal">Código Postal</label>
              <input id="codigo_postal" type="text" className="form-input" value={codigoPostal}
                onChange={e => setCodigoPostal(e.target.value)} placeholder="Tu código postal local" />
            </div>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label htmlFor="poblacion">Población (Ciudad / Municipio)</label>
              <input id="poblacion" type="text" className="form-input" value={poblacion}
                onChange={e => setPoblacion(e.target.value)}
                onBlur={autoSavePoblacion}
                placeholder="Para mayor precisión climática" />
            </div>
          </div>
        </div>
      </details>

      {/* ═══════════════════════════════════════════ */}
      {/* 3. SEGURIDAD                                 */}
      {/* ═══════════════════════════════════════════ */}
      <details open>
        <summary>🔒 Seguridad</summary>
        <div className="accordion-body">
          <div className="form-grid">
            {/* Email + Badge de verificación */}
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <div className="email-label-row">
                <label>Correo Electrónico *</label>
                {isFirebaseVerified ? (
                  <span className="verification-badge verified">✅ Verificado</span>
                ) : (
                  <span className="verification-badge unverified">⚠️ No Verificado</span>
                )}
              </div>
              <input type="email" className="form-input" value={profile.email} readOnly
                style={{ background: '#f8fafc', cursor: 'not-allowed' }} />
              <small className="help-text">El correo electrónico no se puede modificar.</small>
            </div>

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
          </div>
        </div>
      </details>

      {/* ═══════════════════════════════════════════ */}
      {/* 4. ROLES Y SUSCRIPCIONES                     */}
      {/* ═══════════════════════════════════════════ */}
      <details open>
        <summary>⭐ Roles y Suscripciones</summary>
        <div className="accordion-body">
          <label className="section-label">Roles Actuales Aprobados</label>
          <div className="roles-display">
            {roles.map((rol) => (
              <span key={rol} className="role-tag">✅ {rol}</span>
            ))}
          </div>
          <small className="help-text" style={{ marginTop: '10px' }}>
            Cualquier alta o baja en membresías debe cursarse desde la administración.
          </small>
        </div>
      </details>

      {/* ═══════════════════════════════════════════ */}
      {/* 5. POLÍTICA DE PRIVACIDAD (RGPD)             */}
      {/* ═══════════════════════════════════════════ */}
      <details open>
        <summary>📋 Política de Privacidad</summary>
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
      </details>

      {/* ═══════════════════════════════════════════ */}
      {/* 6. ZONA DE PELIGRO — CANCELAR CUENTA         */}
      {/* ═══════════════════════════════════════════ */}
      <details>
        <summary className="danger-summary">⚠️ Zona de Peligro — Cancelar Cuenta</summary>
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
      </details>

      {/* ═══════════════════════════════════════════ */}
      {/* BOTÓN GUARDAR                                */}
      {/* ═══════════════════════════════════════════ */}
      <div className="perfil-save-bar">
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleSave}
          disabled={saving || !privacidadAceptada}
        >
          {saving ? '⏳ Guardando...' : '💾 Guardar Cambios del Perfil'}
        </button>
      </div>
    </div>
  );
}
