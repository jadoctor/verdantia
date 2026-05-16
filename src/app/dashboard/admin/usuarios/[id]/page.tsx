'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { getMediaUrl } from '@/lib/media-url';

const PLAN_CONFIG: Record<string, { color: string; bg: string; border: string; icon: string; label: string }> = {
  premium:  { color: '#d97706', bg: '#fffbeb', border: '#fde68a', icon: '🌳', label: 'Premium' },
  avanzado: { color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', icon: '🌿', label: 'Avanzado' },
  esencial: { color: '#059669', bg: '#f0fdf4', border: '#a7f3d0', icon: '🌱', label: 'Esencial' },
  gratuito: { color: '#64748b', bg: '#f8fafc', border: '#e2e8f0', icon: '🌰', label: 'Gratuito' },
};

function getPlanCfg(plan?: string) {
  return PLAN_CONFIG[(plan || '').toLowerCase()] || PLAN_CONFIG['gratuito'];
}

export default function UsuarioDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const router = useRouter();
  const [data, setData] = useState<{ usuario: any; logros: any[]; fotos: any[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

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

  const { usuario: u, logros, fotos } = data;
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
        <button onClick={() => router.push('/dashboard/admin/usuarios')} style={{ background: 'white', border: '1px solid #cbd5e1', color: '#475569', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          👥 Volver a Usuarios Globales
        </button>
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

      {/* ── Acciones Rápidas ── */}
      <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '20px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <h3 style={{ margin: '0 0 16px', color: '#1e293b', fontWeight: 700, fontSize: '1rem' }}>⚡ Acciones Administrativas</h3>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
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
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Cambiar Plan</label>
            <select defaultValue={u.suscripcion || 'Gratuito'}
              onChange={e => handlePatch('suscripcion', e.target.value)}
              style={{ padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>
              <option value="Gratuito">🌰 Gratuito</option>
              <option value="Esencial">🌱 Esencial</option>
              <option value="Avanzado">🌿 Avanzado</option>
              <option value="Premium">🌳 Premium</option>
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Estado Cuenta</label>
            <select defaultValue={u.estado || 'activo'}
              onChange={e => handlePatch('estado', e.target.value)}
              style={{ padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>
              <option value="activo">✅ Activo</option>
              <option value="suspendido">⛔ Suspendido</option>
              <option value="baja">🗑️ Baja solicitada</option>
            </select>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', justifyContent: 'center' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Tipo Suscripción</label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', height: '36px', padding: '0 8px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <input 
                type="checkbox" 
                defaultChecked={!!u.esPrueba}
                onChange={e => handlePatch('esPrueba', e.target.checked)}
                style={{ accentColor: '#2563eb', width: '16px', height: '16px' }}
              />
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Es de Regalo 🎁</span>
            </label>
          </div>

          {saving && <div style={{ alignSelf: 'flex-end', padding: '8px 14px', color: '#0056b3', fontWeight: 600, fontSize: '0.85rem' }}>Guardando...</div>}
        </div>
      </div>

      {/* ── Datos Personales ── */}
      <details open style={{ background: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', marginBottom: '16px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <summary style={{ padding: '16px 20px', fontWeight: 700, fontSize: '1rem', color: '#1e293b', cursor: 'pointer', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
          👤 Datos Personales
        </summary>
        <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
          {[
            ['Nombre', u.nombre], ['Apellidos', u.apellidos], ['Usuario', u.nombreUsuario],
            ['Email', u.email], ['País', u.pais], ['CP', u.codigoPostal],
            ['Población', u.poblacion], ['F. Nacimiento', u.fechaNacimiento ? new Date(u.fechaNacimiento).toLocaleDateString('es-ES') : '—'],
            ['Registro', u.fechaRegistro ? new Date(u.fechaRegistro).toLocaleDateString('es-ES') : '—'],
            ['Caducidad plan', u.fechaCaducidad ? new Date(u.fechaCaducidad).toLocaleDateString('es-ES') : '—'],
          ].map(([label, value]) => (
            <div key={label} style={{ padding: '12px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>{label}</div>
              <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.9rem', wordBreak: 'break-all' }}>{value || '—'}</div>
            </div>
          ))}
        </div>
      </details>

      {/* ── Logros ── */}
      {logros?.length > 0 && (
        <details open style={{ background: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', marginBottom: '16px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <summary style={{ padding: '16px 20px', fontWeight: 700, fontSize: '1rem', color: '#1e293b', cursor: 'pointer', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
            🏆 Logros Desbloqueados ({logros.length})
          </summary>
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {logros.map((l, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#fffbeb', borderRadius: '10px', border: '1px solid #fde68a' }}>
                <span style={{ fontWeight: 600, color: '#92400e' }}>⭐ {l.nombre_logro}</span>
                <span style={{ fontSize: '0.78rem', color: '#b45309' }}>{new Date(l.fecha_desbloqueo).toLocaleDateString('es-ES')}</span>
              </div>
            ))}
          </div>
        </details>
      )}

      {/* ── Fotos ── */}
      {fotos?.length > 0 && (
        <details style={{ background: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', marginBottom: '16px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <summary style={{ padding: '16px 20px', fontWeight: 700, fontSize: '1rem', color: '#1e293b', cursor: 'pointer', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
            📸 Fotos de Perfil ({fotos.length})
          </summary>
          <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '12px' }}>
            {fotos.map((f: any) => (
              <div key={f.id} style={{ aspectRatio: '3/4', borderRadius: '10px', overflow: 'hidden', border: f.esPrincipal ? '3px solid #f59e0b' : '2px solid #e2e8f0', boxShadow: f.esPrincipal ? '0 0 0 2px rgba(245,158,11,0.3)' : 'none' }}>
                <img src={getMediaUrl(f.ruta)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}  crossOrigin="anonymous" />
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
