'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { getMediaUrl } from '@/lib/media-url';

const PLAN_CONFIG: Record<string, { color: string; bg: string; icon: string; label: string }> = {
  premium:  { color: '#d97706', bg: '#fffbeb', icon: '🌳', label: 'Premium' },
  avanzado: { color: '#2563eb', bg: '#eff6ff', icon: '🌿', label: 'Avanzado' },
  pro:      { color: '#2563eb', bg: '#eff6ff', icon: '🌿', label: 'Pro' },
  esencial: { color: '#059669', bg: '#f0fdf4', icon: '🌱', label: 'Esencial' },
  plus:     { color: '#059669', bg: '#f0fdf4', icon: '🌱', label: 'Plus' },
  gratuito: { color: '#64748b', bg: '#f8fafc', icon: '🌰', label: 'Gratuito' },
  free:     { color: '#64748b', bg: '#f8fafc', icon: '🌰', label: 'Free' },
};

const ROL_CONFIG: Record<string, { color: string; bg: string }> = {
  superadministrador: { color: '#9f1239', bg: '#fff1f2' },
  administrador:      { color: '#0f766e', bg: '#f0fdfa' },
  usuario:            { color: '#1d4ed8', bg: '#eff6ff' },
  visitante:          { color: '#64748b', bg: '#f8fafc' },
};

function getPlanConfig(plan?: string) {
  return PLAN_CONFIG[(plan || '').toLowerCase()] || PLAN_CONFIG['gratuito'];
}

function getRolConfig(rol?: string) {
  const r = (rol || '').toLowerCase().split(',')[0].trim();
  return ROL_CONFIG[r] || ROL_CONFIG['visitante'];
}

export default function UsuariosAdminPage() {
  const router = useRouter();
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);
  const [search, setSearch] = useState('');
  const [filterRol, setFilterRol] = useState('');
  const [filterPlan, setFilterPlan] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  const [actionMsg, setActionMsg] = useState('');

  // Auth guard
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) { router.push('/login'); return; }
      setAuthReady(true);
    });
    return () => unsub();
  }, [router]);

  const loadUsuarios = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      if (filterRol) params.set('rol', filterRol);
      if (filterPlan) params.set('plan', filterPlan);
      const res = await fetch(`/api/admin/usuarios?${params}`);
      const data = await res.json();
      setUsuarios(data.usuarios || []);
      setPagination(data.pagination || { total: 0, pages: 1 });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, search, filterRol, filterPlan]);

  useEffect(() => {
    if (authReady) loadUsuarios();
  }, [authReady, loadUsuarios]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); loadUsuarios(); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const toast = (msg: string) => { setActionMsg(msg); setTimeout(() => setActionMsg(''), 3000); };

  const handleChangeRol = async (id: number, newRol: string) => {
    const res = await fetch(`/api/admin/usuarios/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roles: newRol }),
    });
    if (res.ok) { toast('✅ Rol actualizado'); loadUsuarios(); }
    else toast('❌ Error al cambiar rol');
  };

  const handleChangePlan = async (id: number, newPlan: string) => {
    const res = await fetch(`/api/admin/usuarios/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ suscripcion: newPlan }),
    });
    if (res.ok) { toast('✅ Plan actualizado'); loadUsuarios(); }
    else toast('❌ Error al cambiar plan');
  };

  if (!authReady) return (
    <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
      <div className="loading-spinner" />
      <p>Verificando acceso...</p>
    </div>
  );

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Toast */}
      {actionMsg && (
        <div style={{ position: 'fixed', top: 24, right: 24, zIndex: 9999, padding: '12px 20px', background: 'white', border: '1px solid #e2e8f0', borderLeft: '4px solid #0056b3', borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', fontWeight: 600, fontSize: '0.9rem' }}>
          {actionMsg}
        </div>
      )}

      {/* ── Navigation ── */}
      <div style={{ marginBottom: '16px' }}>
        <button onClick={() => router.push('/dashboard')} style={{ background: 'white', border: '1px solid #cbd5e1', color: '#475569', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          🏠 Volver al Inicio
        </button>
      </div>

      {/* ── Header Integrado ── */}
      <div style={{ background: 'linear-gradient(135deg, #1e3a8a, #2563eb)', borderRadius: '16px', padding: '24px 28px', marginBottom: '24px', color: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ flex: '1 1 300px' }}>
            <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800 }}>👥 Gestión de Usuarios</h1>
            <p style={{ margin: '4px 0 0', opacity: 0.9, fontSize: '0.9rem', display: 'flex', gap: '10px', alignItems: 'center' }}>
              <span>{pagination.total} usuarios registrados</span>
              <span style={{ background: 'rgba(255,255,255,0.15)', padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold' }}>📄 Pág {page} de {pagination.pages}</span>
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', flex: '2 1 500px', justifyContent: 'flex-end' }}>
            <input
              type="text"
              placeholder="🔍 Buscar nombre o email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ flex: 1, minWidth: '180px', padding: '8px 12px', border: 'none', borderRadius: '8px', fontSize: '0.85rem', outline: 'none', color: '#0f172a' }}
            />
            <select value={filterRol} onChange={e => { setFilterRol(e.target.value); setPage(1); }}
              style={{ padding: '8px 12px', border: 'none', borderRadius: '8px', fontSize: '0.85rem', background: 'white', color: '#0f172a', fontWeight: 'bold' }}>
              <option value="">Todos los roles</option>
              <option value="superadministrador">Superadministrador</option>
              <option value="administrador">Administrador</option>
              <option value="usuario">Usuario</option>
              <option value="visitante">Visitante</option>
            </select>
            <select value={filterPlan} onChange={e => { setFilterPlan(e.target.value); setPage(1); }}
              style={{ padding: '8px 12px', border: 'none', borderRadius: '8px', fontSize: '0.85rem', background: 'white', color: '#0f172a', fontWeight: 'bold' }}>
              <option value="">Todos los planes</option>
              <option value="Premium">🌳 Premium</option>
              <option value="Avanzado">🌿 Avanzado</option>
              <option value="Esencial">🌱 Esencial</option>
              <option value="Gratuito">🌰 Gratuito</option>
            </select>
            <button onClick={loadUsuarios} style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.4)', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}>
              🔄
            </button>
          </div>
        </div>
      </div>

      {/* ── Tabla ── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
          <div className="loading-spinner" style={{ margin: '0 auto 16px' }} />
          <p>Cargando usuarios...</p>
        </div>
      ) : usuarios.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '3rem', marginBottom: '12px' }}>👤</div>
          <p>No se encontraron usuarios con los filtros actuales.</p>
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          {/* Scroll horizontal en móvil */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  {['Avatar', 'Nombre', 'Email', 'Rol', 'Plan', 'Registro', 'Acciones'].map(h => (
                    <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, color: '#475569', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {usuarios.map((u, i) => {
                  const planCfg = getPlanConfig(u.suscripcion);
                  const rolCfg = getRolConfig(u.roles);
                  const firstRol = (u.roles || '').split(',')[0].trim();
                  return (
                    <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? 'white' : '#fafafa', transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#f0f7ff')}
                      onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? 'white' : '#fafafa')}>

                      {/* Avatar */}
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ width: '36px', height: '48px', borderRadius: '8px', overflow: 'hidden', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #93c5fd', flexShrink: 0 }}>
                          {u.fotoPrincipal ? (
                            <img src={getMediaUrl(u.fotoPrincipal)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : u.icono ? (
                            <span style={{ fontSize: '1.4rem' }}>{u.icono}</span>
                          ) : (
                            <span style={{ fontSize: '1rem' }}>👤</span>
                          )}
                        </div>
                      </td>

                      {/* Nombre */}
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap' }}>{u.nombre || '—'} {u.apellidos || ''}</div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>@{u.nombreUsuario || '—'}</div>
                      </td>

                      {/* Email */}
                      <td style={{ padding: '10px 14px', color: '#475569', whiteSpace: 'nowrap', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {u.email}
                      </td>

                      {/* Rol — select inline */}
                      <td style={{ padding: '10px 14px' }}>
                        <select
                          value={firstRol}
                          onChange={e => handleChangeRol(u.id, e.target.value)}
                          style={{ padding: '4px 8px', borderRadius: '8px', border: `1.5px solid ${rolCfg.color}40`, background: rolCfg.bg, color: rolCfg.color, fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer' }}
                        >
                          <option value="visitante">Visitante</option>
                          <option value="usuario">Usuario</option>
                          <option value="administrador">Administrador</option>
                          <option value="superadministrador">Superadministrador</option>
                        </select>
                      </td>

                      {/* Plan — select inline */}
                      <td style={{ padding: '10px 14px' }}>
                        <select
                          value={u.suscripcion || 'Gratuito'}
                          onChange={e => handleChangePlan(u.id, e.target.value)}
                          style={{ padding: '4px 8px', borderRadius: '8px', border: `1.5px solid ${planCfg.color}40`, background: planCfg.bg, color: planCfg.color, fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer' }}
                        >
                          <option value="Gratuito">🌰 Gratuito</option>
                          <option value="Esencial">🌱 Esencial</option>
                          <option value="Avanzado">🌿 Avanzado</option>
                          <option value="Premium">🌳 Premium</option>
                        </select>
                        {u.esPrueba ? <span style={{ display: 'block', fontSize: '0.65rem', color: '#d97706', marginTop: '2px' }}>⏳ Prueba</span> : null}
                      </td>

                      {/* Fecha */}
                      <td style={{ padding: '10px 14px', color: '#94a3b8', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                        {u.fechaRegistro ? new Date(u.fechaRegistro).toLocaleDateString('es-ES') : '—'}
                      </td>

                      {/* Acciones */}
                      <td style={{ padding: '10px 14px' }}>
                        <button
                          onClick={() => router.push(`/dashboard/admin/usuarios/${u.id}`)}
                          style={{ padding: '5px 10px', background: '#0056b3', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, whiteSpace: 'nowrap' }}
                        >
                          👁️ Ver perfil
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {pagination.pages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', padding: '16px', borderTop: '1px solid #f1f5f9' }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                style={{ padding: '6px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: page === 1 ? '#f8fafc' : 'white', cursor: page === 1 ? 'default' : 'pointer', fontWeight: 600, color: '#475569' }}>
                ← Anterior
              </button>
              <span style={{ padding: '6px 14px', fontWeight: 600, color: '#64748b', fontSize: '0.85rem' }}>
                {page} / {pagination.pages}
              </span>
              <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages}
                style={{ padding: '6px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: page === pagination.pages ? '#f8fafc' : 'white', cursor: page === pagination.pages ? 'default' : 'pointer', fontWeight: 600, color: '#475569' }}>
                Siguiente →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
