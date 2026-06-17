'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { getMediaUrl } from '@/lib/media-url';
import { SeedWizardModal } from '@/components/SeedWizardModal';
import { SpeciesIcon } from '@/components/ui/SpeciesIcon';

type FilterMode = 'todas' | 'activas' | 'inactivas' | 'caducidad_proxima' | 'stock_bajo' | 'sin_cultivo';

// ── helpers ──────────────────────────────────────────────────────────────────
function getExpiryStatus(fecha: string | null): 'vencida' | 'proxima' | 'ok' | 'sin_fecha' {
  if (!fecha) return 'sin_fecha';
  const d = new Date(fecha);
  const now = new Date();
  if (d < now) return 'vencida';
  const diffMs = d.getTime() - now.getTime();
  const diffMonths = diffMs / (1000 * 60 * 60 * 24 * 30);
  if (diffMonths <= 6) return 'proxima';
  return 'ok';
}

function formatDate(fecha: string | null): string {
  if (!fecha) return '-';
  const d = new Date(fecha);
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function getStockLevel(actual: number, inicial: number): 'alto' | 'medio' | 'bajo' | 'vacio' {
  if (!inicial || inicial === 0) return 'alto';
  const ratio = actual / inicial;
  if (actual <= 0) return 'vacio';
  if (ratio > 0.5) return 'alto';
  if (ratio > 0.2) return 'medio';
  return 'bajo';
}

const EXPIRY_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  vencida:   { bg: '#fee2e2', color: '#991b1b', label: '🔴 Vencida' },
  proxima:   { bg: '#fef3c7', color: '#92400e', label: '🟡 Próxima' },
  ok:        { bg: '#dcfce7', color: '#166534', label: '🟢 OK' },
  sin_fecha: { bg: '#f1f5f9', color: '#64748b', label: '-' },
};

const STOCK_COLORS: Record<string, string> = {
  alto:  '#10b981',
  medio: '#f59e0b',
  bajo:  '#ef4444',
  vacio: '#dc2626',
};

export default function SemillasDashboard() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [semillas, setSemillas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSeedModal, setShowSeedModal] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<FilterMode>('activas');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedSort = sessionStorage.getItem('semillasSortConfig');
      if (savedSort) { try { setSortConfig(JSON.parse(savedSort)); } catch (e) {} }
      const savedFilter = sessionStorage.getItem('semillasFilter');
      if (savedFilter) setSelectedFilter(savedFilter as FilterMode);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') sessionStorage.setItem('semillasFilter', selectedFilter);
  }, [selectedFilter]);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    const newConfig = { key, direction };
    setSortConfig(newConfig);
    if (typeof window !== 'undefined') sessionStorage.setItem('semillasSortConfig', JSON.stringify(newConfig));
  };

  const [uiModal, setUiModal] = useState<{ show: boolean; type: 'confirm' | 'error'; title: string; message: string; confirmText?: string; onConfirm?: () => void }>({
    show: false, type: 'error', title: '', message: ''
  });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user && user.email) {
        setUserEmail(user.email);
        loadSemillas(user.email);
      } else {
        router.push('/login');
      }
    });
    return () => unsub();
  }, [router]);

  const loadSemillas = async (email: string) => {
    try {
      setLoading(true);
      const res = await fetch('/api/user/semillas', { headers: { 'x-user-email': email } });
      if (res.ok) {
        const data = await res.json();
        setSemillas(data.semillas || []);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const reactivateSemilla = async (s: any) => {
    try {
      const res = await fetch(`/api/user/semillas/${s.idsemillas}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail! },
        body: JSON.stringify({ ...s, semillasactivosino: 1 })
      });
      if (res.ok) loadSemillas(userEmail!);
      else { const e = await res.json().catch(() => ({})); setUiModal({ show: true, type: 'error', title: 'Error', message: e.error || 'Error al reactivar' }); }
    } catch { setUiModal({ show: true, type: 'error', title: 'Error', message: 'Error de red' }); }
  };

  const triggerDelete = (s: any) => {
    if (s.cultivos_activos_count && s.cultivos_activos_count > 0) {
      const lista = s.cultivos_activos_lista ? s.cultivos_activos_lista.split('|') : [];
      setUiModal({ show: true, type: 'error', title: 'Semilla con Cultivos Asociados', message: `No se puede eliminar porque tiene cultivos asociados:\n\n${lista.map((c: string) => `• Cultivo ${c}`).join('\n')}\n\nElimina primero los cultivos.` });
      return;
    }
    setUiModal({ show: true, type: 'confirm', title: 'Eliminar Semilla', message: '¿Seguro que quieres eliminar este lote? Esta acción es permanente.', confirmText: 'Sí, Eliminar', onConfirm: () => executeDelete(s.idsemillas) });
  };

  const executeDelete = async (id: string) => {
    setUiModal(prev => ({ ...prev, show: false }));
    try {
      const res = await fetch(`/api/user/semillas/${id}`, { method: 'DELETE', headers: { 'x-user-email': userEmail! } });
      if (res.ok) loadSemillas(userEmail!);
      else { const e = await res.json().catch(() => ({})); setUiModal({ show: true, type: 'error', title: 'Error', message: e.error || 'Error al eliminar' }); }
    } catch { setUiModal({ show: true, type: 'error', title: 'Error', message: 'Error de red' }); }
  };

  // ── computed counts for filter badges ────────────────────────────────────
  const counts = {
    todas: semillas.length,
    activas: semillas.filter(s => s.semillasactivosino === 1).length,
    inactivas: semillas.filter(s => s.semillasactivosino !== 1).length,
    caducidad_proxima: semillas.filter(s => ['vencida', 'proxima'].includes(getExpiryStatus(s.semillasfechacaducidad))).length,
    stock_bajo: semillas.filter(s => getStockLevel(Number(s.semillasstockactual), Number(s.semillasstockinicial)) === 'bajo' || getStockLevel(Number(s.semillasstockactual), Number(s.semillasstockinicial)) === 'vacio').length,
    sin_cultivo: semillas.filter(s => !s.cultivos_activos_count || s.cultivos_activos_count === 0).length,
  };

  const FILTERS: { key: FilterMode; label: string }[] = [
    { key: 'todas', label: '📋 Todas' },
    { key: 'activas', label: '✅ Activas' },
    { key: 'inactivas', label: '💤 Inactivas' },
    { key: 'caducidad_proxima', label: '📅 Caducidad próxima' },
    { key: 'stock_bajo', label: '⚠️ Stock bajo' },
    { key: 'sin_cultivo', label: '🔴 Sin cultivo' },
  ];

  return (
    <div style={{ padding: '40px', width: '100%', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @media print {
          body * { visibility: hidden; }
          .print-label, .print-label * { visibility: visible; }
          .print-label { position: fixed; top: 0; left: 0; width: 100%; }
        }
      ` }} />

      <div style={{ marginBottom: '16px' }}>
        <button onClick={() => router.push('/dashboard')} style={{ background: 'white', border: '1px solid #cbd5e1', color: '#475569', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          🏠 Volver al Inicio
        </button>
      </div>

      {/* SUBHEADER */}
      <div style={{ background: 'linear-gradient(135deg, #0f766e, #10b981)', borderRadius: '16px', padding: '24px 28px', marginBottom: '24px', color: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800 }}>🌾 Banco de Semillas</h1>
            <p style={{ margin: '4px 0 0', opacity: 0.9, fontSize: '0.9rem' }}>Tu inventario personal de semillas propias y compradas</p>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
            <button
              onClick={() => setShowSeedModal(true)}
              style={{ padding: '8px 16px', borderRadius: '8px', background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.95rem', boxShadow: '0 4px 12px rgba(109,40,217,0.4)', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <span style={{ fontSize: '1.25rem' }}>🧙‍♂️</span> Asistente de Semillas
            </button>
          </div>
        </div>

        {/* FILTROS */}
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.15)', padding: '12px', borderRadius: '12px' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {FILTERS.map(({ key, label }) => {
              const isActive = selectedFilter === key;
              return (
                <button key={key} type="button" onClick={() => setSelectedFilter(key)}
                  style={{ padding: '5px 12px', borderRadius: '20px', border: 'none', background: isActive ? 'white' : 'rgba(255,255,255,0.2)', color: isActive ? '#0f766e' : 'white', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.82rem', transition: 'all 0.2s', boxShadow: isActive ? '0 2px 4px rgba(0,0,0,0.1)' : 'none' }}
                >
                  {label} ({counts[key]})
                </button>
              );
            })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', position: 'relative', width: '280px', maxWidth: '100%' }}>
            <span style={{ position: 'absolute', left: '12px', color: '#0f766e' }}>🔍</span>
            <input type="text" placeholder="Buscar especie, variedad, marca..." value={filterSearch} onChange={(e) => setFilterSearch(e.target.value)}
              style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: '8px', border: 'none', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }} />
            {filterSearch && (
              <button onClick={() => setFilterSearch('')} style={{ position: 'absolute', right: '12px', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1rem' }}>×</button>
            )}
          </div>
        </div>
      </div>

      {semillas.length === 0 && !loading ? (
        <div style={{ padding: '40px', textAlign: 'center', background: '#f8fafc', borderRadius: '16px', border: '2px dashed #cbd5e1' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🌱</div>
          <h3 style={{ margin: '0 0 8px', color: '#334155' }}>Aún no tienes semillas guardadas</h3>
          <p style={{ color: '#64748b', margin: 0 }}>Usa el asistente para añadir tu primer lote.</p>
        </div>
      ) : (
        <>
          {(() => {
            // ── FILTRADO ──
            const filteredSemillas = semillas.filter((s) => {
              const expiry = getExpiryStatus(s.semillasfechacaducidad);
              const stockLevel = getStockLevel(Number(s.semillasstockactual), Number(s.semillasstockinicial));

              if (selectedFilter === 'activas' && s.semillasactivosino !== 1) return false;
              if (selectedFilter === 'inactivas' && s.semillasactivosino === 1) return false;
              if (selectedFilter === 'caducidad_proxima' && !['vencida', 'proxima'].includes(expiry)) return false;
              if (selectedFilter === 'stock_bajo' && !['bajo', 'vacio'].includes(stockLevel)) return false;
              if (selectedFilter === 'sin_cultivo' && s.cultivos_activos_count > 0) return false;

              if (filterSearch.trim() !== '') {
                const term = filterSearch.toLowerCase();
                return (
                  s.especiesnombre?.toLowerCase().includes(term) ||
                  s.variedad_nombre?.toLowerCase().includes(term) ||
                  s.semillasmarca?.toLowerCase().includes(term) ||
                  s.semillaslugarcompra?.toLowerCase().includes(term)
                );
              }
              return true;
            });

            // ── ORDENACIÓN ──
            const sortedSemillas = [...filteredSemillas].sort((a, b) => {
              if (!sortConfig) return 0;
              const { key, direction } = sortConfig;
              let valA: any = a[key];
              let valB: any = b[key];

              if (key === 'semillasstockactual' || key === 'semillasstockinicial') {
                valA = Number(valA) || 0;
                valB = Number(valB) || 0;
              } else if (key === 'semillasfechacaducidad') {
                valA = valA ? new Date(valA).getTime() : Infinity;
                valB = valB ? new Date(valB).getTime() : Infinity;
              } else {
                if (typeof valA === 'string') valA = valA.toLowerCase();
                if (typeof valB === 'string') valB = valB.toLowerCase();
              }

              if (valA < valB) return direction === 'asc' ? -1 : 1;
              if (valA > valB) return direction === 'asc' ? 1 : -1;
              return 0;
            });

            const sortIcon = (key: string) => {
              if (!sortConfig || sortConfig.key !== key) return <span style={{ color: '#cbd5e1', marginLeft: '4px', fontSize: '0.75rem' }}>↕</span>;
              return sortConfig.direction === 'asc' ? <span style={{ marginLeft: '4px' }}>🔼</span> : <span style={{ marginLeft: '4px' }}>🔽</span>;
            };

            const thStyle = (key: string): React.CSSProperties => ({
              padding: '12px 10px', cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap',
              color: sortConfig?.key === key ? '#0f766e' : '#475569', fontSize: '0.85rem', fontWeight: 700
            });

            return (
              <div style={{ position: 'relative', width: '100%', minHeight: '300px' }}>
                {loading && (
                  <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(255,255,255,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, borderRadius: '12px' }}>
                    <div style={{ fontSize: '2.5rem', animation: 'spin 1s linear infinite' }}>⏳</div>
                  </div>
                )}
                <div style={{ opacity: loading ? 0.6 : 1, transition: 'opacity 0.3s ease' }}>
                  {sortedSemillas.length === 0 && !loading ? (
                    <div style={{ padding: '40px', textAlign: 'center', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0', color: '#64748b' }}>
                      No hay semillas que coincidan con el filtro seleccionado.
                    </div>
                  ) : (
                    <div style={{ background: 'white', borderRadius: '12px', overflowX: 'auto', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                          <tr>
                            <th style={{ padding: '12px', position: 'sticky', left: 0, zIndex: 2, background: '#f8fafc', width: '80px', minWidth: '80px', textAlign: 'center', fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>Foto</th>
                            <th onClick={() => handleSort('idsemillas')} style={thStyle('idsemillas')}>Nº {sortIcon('idsemillas')}</th>
                            <th onClick={() => handleSort('especiesnombre')} style={thStyle('especiesnombre')}>Especie {sortIcon('especiesnombre')}</th>
                            <th onClick={() => handleSort('variedad_nombre')} style={thStyle('variedad_nombre')}>Variedad {sortIcon('variedad_nombre')}</th>
                            <th onClick={() => handleSort('semillasorigen')} style={thStyle('semillasorigen')}>Origen {sortIcon('semillasorigen')}</th>
                            <th onClick={() => handleSort('semillasstockactual')} style={thStyle('semillasstockactual')}>Stock {sortIcon('semillasstockactual')}</th>
                            <th onClick={() => handleSort('semillasfechacaducidad')} style={thStyle('semillasfechacaducidad')}>Caducidad {sortIcon('semillasfechacaducidad')}</th>
                            <th style={{ padding: '12px 10px', fontSize: '0.85rem', fontWeight: 700, color: '#475569', whiteSpace: 'nowrap' }}>Estado</th>
                            <th style={{ padding: '12px 10px', fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sortedSemillas.map((s, i) => {
                            const expiry = getExpiryStatus(s.semillasfechacaducidad);
                            const expiryStyle = EXPIRY_STYLES[expiry];
                            const stockActual = Number(s.semillasstockactual) || 0;
                            const stockInicial = Number(s.semillasstockinicial) || 0;
                            const stockLevel = getStockLevel(stockActual, stockInicial);
                            const stockPct = stockInicial > 0 ? Math.min(100, Math.round((stockActual / stockInicial) * 100)) : 0;
                            const isExpired = expiry === 'vencida';
                            const isOutOfStock = stockActual <= 0;
                            const needsArchiving = isExpired || isOutOfStock;
                            const rowBg = needsArchiving ? '#fef2f2' : (i % 2 === 0 ? 'white' : '#f8fafc');
                            const enCultivo = s.cultivos_activos_count && s.cultivos_activos_count > 0;

                            return (
                              <tr key={s.idsemillas} style={{ borderBottom: '1px solid #e2e8f0', background: rowBg, transition: 'background 0.15s' }}>

                                {/* FOTO STICKY */}
                                <td style={{ padding: '8px', position: 'sticky', left: 0, zIndex: 1, background: rowBg, width: '80px', minWidth: '80px', textAlign: 'center', verticalAlign: 'middle', cursor: 'pointer' }}
                                  onClick={() => router.push(`/dashboard/semillas/${s.idsemillas}`)} title="Editar Semilla">
                                  <div style={{ width: '56px', height: '56px', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                                    {s.foto ? (
                                      <img src={getMediaUrl(s.foto)} alt={s.variedad_nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} crossOrigin="anonymous" loading="lazy" />
                                    ) : (
                                      <SpeciesIcon icon={s.especiesicono || '🌱'} size="1.5rem" />
                                    )}
                                  </div>
                                </td>

                                {/* Nº COLECCIÓN */}
                                <td style={{ padding: '10px', fontWeight: 'bold', color: '#0f766e', whiteSpace: 'nowrap' }}>
                                  {s.semillascoleccion ? `${s.semillascoleccion} (${s.semillasnumerocoleccion || s.idsemillas})` : `Nº ${s.semillasnumerocoleccion || s.idsemillas}`}
                                </td>

                                {/* ESPECIE */}
                                <td style={{ padding: '10px', fontWeight: 'bold', color: '#1e293b' }}>{s.especiesnombre}</td>

                                {/* VARIEDAD + badges */}
                                <td style={{ padding: '10px', color: '#475569' }}>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <span>{s.variedad_nombre || s.especiesnombre}</span>
                                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                      {s.semillasactivosino === 0 && <span style={{ fontSize: '0.68rem', color: '#475569', background: '#cbd5e1', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>💤 Inactiva</span>}
                                      {needsArchiving && <span style={{ fontSize: '0.68rem', color: '#b91c1c', background: '#fee2e2', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>⚠️ {isOutOfStock ? 'Sin Stock' : 'Caducada'}</span>}
                                      {s.semillascompartir === 1 && <span style={{ fontSize: '0.68rem', color: '#1d4ed8', background: '#dbeafe', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>🤝 Compartida</span>}
                                    </div>
                                  </div>
                                </td>

                                {/* ORIGEN */}
                                <td style={{ padding: '10px' }}>
                                  <span style={{ background: s.semillasorigen === 'por_definir' ? '#f1f5f9' : '#dcfce7', color: s.semillasorigen === 'por_definir' ? '#475569' : '#16a34a', padding: '3px 8px', borderRadius: '10px', fontSize: '0.78rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                    {s.semillasorigen === 'por_definir' ? 'PENDIENTE' :
                                     s.semillasorigen === 'sobre_comprado' ? 'SOBRE' :
                                     s.semillasorigen?.replace(/_/g, ' ').toUpperCase()}
                                  </span>
                                </td>

                                {/* STOCK con barra visual */}
                                <td style={{ padding: '10px', minWidth: '120px' }}>
                                  {stockInicial > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                                        <span style={{ fontWeight: 'bold', color: STOCK_COLORS[stockLevel] }}>{stockActual}</span>
                                        <span style={{ color: '#94a3b8' }}>/ {stockInicial}</span>
                                      </div>
                                      <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                                        <div style={{ height: '100%', width: `${stockPct}%`, background: STOCK_COLORS[stockLevel], borderRadius: '3px', transition: 'width 0.4s ease' }} />
                                      </div>
                                      <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{stockPct}% restante</span>
                                    </div>
                                  ) : (
                                    <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>-</span>
                                  )}
                                </td>

                                {/* CADUCIDAD con semáforo */}
                                <td style={{ padding: '10px', whiteSpace: 'nowrap' }}>
                                  {s.semillasfechacaducidad ? (
                                    <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '3px', alignItems: 'flex-start' }}>
                                      <span style={{ background: expiryStyle.bg, color: expiryStyle.color, padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 700 }}>
                                        {expiryStyle.label}
                                      </span>
                                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{formatDate(s.semillasfechacaducidad)}</span>
                                    </div>
                                  ) : <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>-</span>}
                                </td>

                                {/* ESTADO */}
                                <td style={{ padding: '10px', whiteSpace: 'nowrap' }}>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <span style={{ background: enCultivo ? '#dcfce7' : '#f1f5f9', color: enCultivo ? '#16a34a' : '#64748b', padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 700 }}>
                                      {enCultivo ? `🌿 En cultivo (${s.cultivos_activos_count})` : '🌱 Libre'}
                                    </span>
                                    <span style={{ background: STOCK_COLORS[stockLevel] + '20', color: STOCK_COLORS[stockLevel], padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 700 }}>
                                      {stockLevel === 'alto' ? '🟢 Stock OK' : stockLevel === 'medio' ? '🟡 Stock medio' : stockLevel === 'bajo' ? '🔴 Stock bajo' : '⛔ Sin stock'}
                                    </span>
                                  </div>
                                </td>

                                {/* ACCIONES */}
                                <td style={{ padding: '10px' }}>
                                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                                    <button
                                      style={{ background: '#f8fafc', border: '1px solid #cbd5e1', color: '#475569', cursor: 'pointer', fontSize: '0.82rem', padding: '5px 10px', borderRadius: '6px', fontWeight: 'bold' }}
                                      onClick={() => router.push(`/dashboard/semillas/${s.idsemillas}`)}
                                    >✏️ Editar</button>
                                    {s.semillasactivosino === 0 ? (
                                      <button
                                        style={{ background: '#dcfce7', border: '1px solid #86efac', color: '#166534', cursor: 'pointer', fontSize: '0.82rem', padding: '5px 10px', borderRadius: '6px', fontWeight: 'bold' }}
                                        onClick={() => reactivateSemilla(s)}
                                      >🔋 Reactivar</button>
                                    ) : (
                                      !enCultivo && (
                                        <button
                                          style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', cursor: 'pointer', fontSize: '0.82rem', padding: '5px 10px', borderRadius: '6px', fontWeight: 'bold' }}
                                          onClick={() => triggerDelete(s)}
                                        >🗑️ Eliminar</button>
                                      )
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </>
      )}

      {/* MODAL */}
      {uiModal.show && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: 'white', borderRadius: '16px', width: '90%', maxWidth: '400px', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ background: uiModal.type === 'error' ? '#fef2f2' : '#f0fdf4', padding: '16px 24px', borderBottom: `1px solid ${uiModal.type === 'error' ? '#fee2e2' : '#dcfce7'}` }}>
              <h3 style={{ margin: 0, color: uiModal.type === 'error' ? '#991b1b' : '#166534', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {uiModal.type === 'error' ? '⚠️' : 'ℹ️'} {uiModal.title}
              </h3>
            </div>
            <div style={{ padding: '24px' }}>
              <p style={{ margin: 0, color: '#475569', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>{uiModal.message}</p>
            </div>
            <div style={{ padding: '16px 24px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              {uiModal.type === 'confirm' ? (
                <>
                  <button onClick={() => setUiModal(p => ({ ...p, show: false }))} style={{ padding: '8px 16px', border: '1px solid #cbd5e1', background: 'white', borderRadius: '8px', color: '#475569', fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
                  <button onClick={uiModal.onConfirm} style={{ padding: '8px 16px', border: 'none', background: '#ef4444', color: 'white', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>{uiModal.confirmText || 'Sí, Eliminar'}</button>
                </>
              ) : (
                <button onClick={() => setUiModal(p => ({ ...p, show: false }))} style={{ padding: '8px 16px', border: 'none', background: '#3b82f6', color: 'white', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>Entendido</button>
              )}
            </div>
          </div>
        </div>
      )}

      <SeedWizardModal
        show={showSeedModal}
        onClose={() => setShowSeedModal(false)}
        onSuccess={() => { if (userEmail) loadSemillas(userEmail); }}
      />
    </div>
  );
}

// FORCE REFRESH
