'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { getMediaUrl } from '@/lib/media-url';

const PLAN_CONFIG: Record<string, { color: string; bg: string; border: string; icon: string; label: string }> = {
  premium:  { color: '#d97706', bg: '#fffbeb', border: '#fde68a', icon: '4 👑', label: 'Premium' },
  avanzado: { color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', icon: '3 🌳', label: 'Avanzado' },
  esencial: { color: '#059669', bg: '#f0fdf4', border: '#a7f3d0', icon: '2 🌿', label: 'Esencial' },
  gratuito: { color: '#64748b', bg: '#f8fafc', border: '#e2e8f0', icon: '1 🍃', label: 'Gratuito' },
};

function getPlanCfg(plan?: string) {
  return PLAN_CONFIG[(plan || '').toLowerCase()] || PLAN_CONFIG['gratuito'];
}

export default function UsuarioDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const router = useRouter();
  const [data, setData] = useState<{ usuario: any; logros: any[]; fotos: any[]; historialSuscripciones?: any[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [fromAsuntos, setFromAsuntos] = useState(false);
  const [tab, setTab] = useState('perfil');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setFromAsuntos(new URLSearchParams(window.location.search).get('from') === 'asuntos');
    }
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) { router.push('/login'); return; }
      setAuthReady(true);
    });
    return () => unsub();
  }, [router]);

  useEffect(() => {
    if (!authReady) return;
    fetch(`/api/admin/usuarios/${id}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id, authReady]);

  const handlePatch = async (field: string, value: any) => {
    setSaving(true);
    const res = await fetch(`/api/admin/usuarios/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: value }),
    });
    setSaving(false);
    if (res.ok) {
      showToast('✅ Guardado');
      setData(prev => prev ? { ...prev, usuario: { ...prev.usuario, [field]: field === 'esPrueba' ? Number(value) : value } } : null);
    } else {
      showToast('❌ Error al guardar');
    }
  };

  if (!authReady || loading) return (
    <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
      <div className="loading-spinner" style={{ margin: '0 auto 16px' }} />
      <p>Cargando perfil de usuario...</p>
    </div>
  );

  if (!data?.usuario) return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <h2 style={{ color: '#64748b' }}>Usuario no encontrado</h2>
      <button onClick={() => router.push('/dashboard/admin/usuarios')} style={{ marginTop: '16px', padding: '10px 20px', background: '#0056b3', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>
        ← Volver a Usuarios
      </button>
    </div>
  );

  const { usuario: u, logros, fotos, historialSuscripciones } = data;
  const planCfg = getPlanCfg(u.suscripcion);

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 24, right: 24, zIndex: 9999, padding: '12px 20px', background: 'white', border: '1px solid #e2e8f0', borderLeft: '4px solid #0056b3', borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', fontWeight: 600, fontSize: '0.9rem' }}>
          {toast}
        </div>
      )}

      {/* ── Navigation ── */}
      <div style={{ marginBottom: '16px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button onClick={() => router.push('/dashboard')} style={{ background: 'white', border: '1px solid #cbd5e1', color: '#475569', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          🏠 Volver al Inicio
        </button>
        {fromAsuntos ? (
          <button onClick={() => router.push('/dashboard/admin/asuntos-pendientes')} style={{ background: '#f8fafc', border: '1px solid #cbd5e1', color: '#0f172a', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            🔙 Volver a Asuntos Pendientes
          </button>
        ) : (
          <button onClick={() => router.push('/dashboard/admin/usuarios')} style={{ background: 'white', border: '1px solid #cbd5e1', color: '#475569', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            👥 Volver a Usuarios Globales
          </button>
        )}
      </div>

      {/* ── Hero ── */}
      <div style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 60%, #0ea5e9 100%)', borderRadius: '20px', padding: '28px', marginBottom: '24px', color: 'white', display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
        {/* Avatar */}
        <div style={{ width: '80px', height: '106px', borderRadius: '14px', overflow: 'hidden', border: '3px solid rgba(255,255,255,0.4)', background: '#e0f2fe', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {u.fotoPrincipal ? (
            <img src={getMediaUrl(u.fotoPrincipal)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}  crossOrigin="anonymous" />
          ) : u.icono ? (
            <span style={{ fontSize: '2.5rem' }}>{u.icono}</span>
          ) : (
            <span style={{ fontSize: '2rem' }}>👤</span>
          )}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: '200px' }}>
          <h1 style={{ margin: '0 0 4px', fontSize: '1.5rem', fontWeight: 800 }}>
            {u.nombre || '—'} {u.apellidos || ''}
          </h1>
          <div style={{ opacity: 0.8, fontSize: '0.9rem', marginBottom: '10px' }}>@{u.nombreUsuario || '—'} · {u.email}</div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ background: planCfg.bg, color: planCfg.color, border: `1px solid ${planCfg.border}`, padding: '4px 12px', borderRadius: '20px', fontWeight: 700, fontSize: '0.78rem' }}>
              {planCfg.icon} {planCfg.label} {u.suscripcion && u.suscripcion !== 'Gratuito' ? (u.esPrueba ? '(De Regalo 🎁)' : '(De Pago 💳)') : ''}
            </span>
            {(u.roles || '').split(',').map((r: string) => (
              <span key={r} style={{ background: 'rgba(255,255,255,0.15)', padding: '4px 12px', borderRadius: '20px', fontWeight: 600, fontSize: '0.78rem' }}>
                {r.trim()}
              </span>
            ))}
          </div>
        </div>

      </div>

      {/* ── Tabs Navigation ── */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '2px solid #e2e8f0', paddingBottom: '0px' }}>
        {['perfil', 'suscripciones', 'actividad'].map(t => (
          <button 
            key={t}
            onClick={() => setTab(t)}
            style={{ 
              background: 'transparent',
              border: 'none',
              padding: '12px 20px',
              cursor: 'pointer',
              fontWeight: tab === t ? 800 : 600,
              color: tab === t ? '#2563eb' : '#64748b',
              borderBottom: tab === t ? '3px solid #2563eb' : '3px solid transparent',
              marginBottom: '-2px',
              fontSize: '0.95rem',
              transition: 'all 0.2s ease'
            }}
          >
            {t === 'perfil' ? '👤 Información Personal' : t === 'suscripciones' ? '💳 Suscripciones y Planes' : '📸 Logros y Galería'}
          </button>
        ))}
      </div>

      {/* ── TAB: PERFIL ── */}
      {tab === 'perfil' && (
        <>
          {/* Acciones de Cuenta */}
          <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '20px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <h3 style={{ margin: '0 0 16px', color: '#1e293b', fontWeight: 700, fontSize: '1rem' }}>⚡ Acciones de la Cuenta</h3>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Cambiar Rol</label>
                <select defaultValue={u.roles?.split(',')[0].trim() || 'visitante'}
                  onChange={e => handlePatch('roles', e.target.value)}
                  style={{ padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>
                  <option value="visitante">Visitante</option>
                  <option value="usuario">Usuario</option>
                  <option value="administrador">Administrador</option>
                  <option value="superadministrador">Superadministrador</option>
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Estado Cuenta</label>
                <select defaultValue={u.estadoCuenta || 'activa'}
                  onChange={e => handlePatch('estado', e.target.value)}
                  style={{ padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>
                  <option value="activa">✅ Activo</option>
                  <option value="suspendido">⛔ Suspendido</option>
                  <option value="baja">🗑️ Baja solicitada</option>
                </select>
              </div>
              {saving && <div style={{ padding: '8px 14px', color: '#0056b3', fontWeight: 600, fontSize: '0.85rem' }}>Guardando...</div>}
            </div>
          </div>

          {/* Datos Personales */}
          <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', marginBottom: '16px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ padding: '16px 20px', fontWeight: 700, fontSize: '1rem', color: '#1e293b', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              👤 Datos Personales
            </div>
            <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
              {[
                ['Nombre', u.nombre], ['Apellidos', u.apellidos], ['Usuario', u.nombreUsuario],
                ['Email', u.email], ['País', u.pais], ['CP', u.codigoPostal],
                ['Población', u.poblacion], ['F. Nacimiento', u.fechaNacimiento ? new Date(u.fechaNacimiento).toLocaleDateString('es-ES') : '—'],
                ['Registro', u.fechaRegistro ? new Date(u.fechaRegistro).toLocaleDateString('es-ES') : '—'],
              ].map(([label, value]) => (
                <div key={label} style={{ padding: '12px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>{label}</div>
                  <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.9rem', wordBreak: 'break-all' }}>{value || '—'}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── TAB: SUSCRIPCIONES ── */}
      {tab === 'suscripciones' && (
        <>
          {/* Controles de Suscripción */}
          <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '24px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
              <div>
                <h3 style={{ margin: '0 0 8px', color: '#1e293b', fontWeight: 800, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {planCfg.icon} Plan Actual: {planCfg.label}
                </h3>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '16px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b', background: '#f1f5f9', padding: '4px 10px', borderRadius: '6px' }}>
                    Origen: {
                      u.suscripcionOrigen === 'pago_directo' ? 'Pago Directo' :
                      u.suscripcionOrigen === 'trial_inicial' ? 'Trial Inicial' :
                      u.suscripcionOrigen === 'degradacion_trial' ? 'Degradación de Trial' :
                      u.suscripcionOrigen === 'degradacion_pago' ? 'Degradación de Pago' :
                      u.suscripcionOrigen === 'asignado_admin' ? 'Asignado Manualmente' :
                      (u.suscripcionOrigen || 'Desconocido')
                    }
                  </span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b', background: '#f1f5f9', padding: '4px 10px', borderRadius: '6px' }}>
                    Estado: {u.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Forzar Cambio de Plan</label>
                  <select defaultValue={u.suscripcion || 'Gratuito'}
                    onChange={e => handlePatch('suscripcion', e.target.value)}
                    style={{ padding: '8px 12px', border: '1.5px solid #cbd5e1', borderRadius: '8px', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', background: 'white' }}>
                    <option value="Gratuito">1 🍃 Gratuito</option>
                    <option value="Esencial">2 🌿 Esencial</option>
                    <option value="Avanzado">3 🌳 Avanzado</option>
                    <option value="Premium">4 👑 Premium</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', justifyContent: 'center' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Etiqueta Trial</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', height: '38px', padding: '0 12px', background: 'white', borderRadius: '8px', border: '1.5px solid #cbd5e1' }}>
                    <input 
                      type="checkbox" 
                      defaultChecked={!!u.esPrueba}
                      onChange={e => handlePatch('esPrueba', e.target.checked)}
                      style={{ accentColor: '#2563eb', width: '16px', height: '16px' }}
                    />
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b' }}>Es de Regalo 🎁</span>
                  </label>
                </div>
                {saving && <div style={{ padding: '8px', color: '#0056b3', fontWeight: 600, fontSize: '0.85rem' }}>Guardando...</div>}
              </div>
            </div>
          </div>

          {/* Historial de Planes */}
          <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', marginBottom: '16px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ padding: '16px 20px', fontWeight: 700, fontSize: '1rem', color: '#1e293b', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>📜 Historial de Suscripciones</span>
              <span style={{ fontSize: '0.8rem', background: '#e2e8f0', padding: '2px 8px', borderRadius: '10px', color: '#475569' }}>
                {historialSuscripciones?.length || 0} registros
              </span>
            </div>
            
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem' }}>
                    <th style={{ padding: '12px 20px', borderBottom: '1px solid #e2e8f0' }}>Plan</th>
                    <th style={{ padding: '12px 20px', borderBottom: '1px solid #e2e8f0' }}>Inicio</th>
                    <th style={{ padding: '12px 20px', borderBottom: '1px solid #e2e8f0' }}>Fin</th>
                    <th style={{ padding: '12px 20px', borderBottom: '1px solid #e2e8f0' }}>Estado</th>
                    <th style={{ padding: '12px 20px', borderBottom: '1px solid #e2e8f0' }}>Origen</th>
                  </tr>
                </thead>
                <tbody>
                  {historialSuscripciones && historialSuscripciones.length > 0 ? historialSuscripciones.map((h: any) => (
                    <tr key={h.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 20px', fontWeight: 600, color: '#0f172a' }}>
                        {getPlanCfg(h.plan).icon} {h.plan}
                      </td>
                      <td style={{ padding: '12px 20px', color: '#475569' }}>
                        {new Date(h.fechaInicio).toLocaleDateString('es-ES')}
                      </td>
                      <td style={{ padding: '12px 20px', color: '#475569' }}>
                        {h.fechaFin ? new Date(h.fechaFin).toLocaleDateString('es-ES') : '—'}
                      </td>
                      <td style={{ padding: '12px 20px' }}>
                        <span style={{ 
                          background: h.estado === 'activa' ? '#dcfce7' : '#f1f5f9', 
                          color: h.estado === 'activa' ? '#166534' : '#475569', 
                          padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, textTransform: 'capitalize' 
                        }}>
                          {h.estado.replace('_', ' ')}
                        </span>
                      </td>
                      <td style={{ padding: '12px 20px', color: '#64748b', fontSize: '0.85rem' }}>
                        {
                          h.origen === 'pago_directo' ? 'Pago Directo' :
                          h.origen === 'trial_inicial' ? 'Trial Inicial' :
                          h.origen === 'degradacion_trial' ? 'Degradado de Trial' :
                          h.origen === 'degradacion_pago' ? 'Degradado de Pago' :
                          h.origen === 'asignado_admin' ? 'Manual' : h.origen
                        }
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                        No hay historial de suscripciones registrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── TAB: ACTIVIDAD ── */}
      {tab === 'actividad' && (
        <>
          {/* Logros */}
          {logros?.length > 0 ? (
            <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', marginBottom: '16px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <div style={{ padding: '16px 20px', fontWeight: 700, fontSize: '1rem', color: '#1e293b', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                🏆 Logros Desbloqueados ({logros.length})
              </div>
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {logros.map((l: any, i: number) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#fffbeb', borderRadius: '10px', border: '1px solid #fde68a' }}>
                    <span style={{ fontWeight: 600, color: '#92400e' }}>⭐ {l.nombre_logro}</span>
                    <span style={{ fontSize: '0.78rem', color: '#b45309', display: 'flex', gap: '8px' }}>
                      <span>Inicio: {new Date(l.fecha_desbloqueo).toLocaleDateString('es-ES')}</span>
                      <span>—</span>
                      <span>Fin: {l.fecha_fin ? new Date(l.fecha_fin).toLocaleDateString('es-ES') : 'En curso'}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', background: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
              Sin logros desbloqueados.
            </div>
          )}

          {/* Fotos */}
          {fotos?.length > 0 ? (
            <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', marginBottom: '16px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <div style={{ padding: '16px 20px', fontWeight: 700, fontSize: '1rem', color: '#1e293b', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                📸 Fotos de Perfil ({fotos.length})
              </div>
              <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '12px' }}>
                {fotos.map((f: any) => (
                  <div key={f.id} style={{ aspectRatio: '3/4', borderRadius: '10px', overflow: 'hidden', border: f.esPrincipal ? '3px solid #f59e0b' : '2px solid #e2e8f0', boxShadow: f.esPrincipal ? '0 0 0 2px rgba(245,158,11,0.3)' : 'none' }}>
                    <img src={getMediaUrl(f.ruta)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} crossOrigin="anonymous" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
             <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', background: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
               Sin fotos subidas en galería.
             </div>
          )}
        </>
      )}
    </div>
  );
}
