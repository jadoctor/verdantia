'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface Familia {
  idfamilias: number;
  familiasnombre: string;
  familiasnombrecientifico: string | null;
  familiasgruporotacion: string;
  familiasanosdescanso: number;
  familiascolor: string;
  familiasemoji: string;
  familiasdescripcion: string | null;
  familiasnotas: string | null;
  familiasprecedentes: string | any[] | null;
  familiassucesores: string | any[] | null;
  familiasactivosino: number;
  total_especies: number;
}

export default function FamiliasPage() {
  const router = useRouter();
  const [familias, setFamilias] = useState<Familia[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'activas' | 'inactivas'>('all');
  const [showNewForm, setShowNewForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newFamilia, setNewFamilia] = useState({
    familiasnombre: '',
    familiasnombrecientifico: '',
    familiasgruporotacion: '',
    familiasanosdescanso: 3,
    familiascolor: '#64748b',
    familiasemoji: '🌿',
    familiasnotas: ''
  });

  const [focusedRowId, setFocusedRowId] = useState<number | null>(null);

  // ═══ Restauración de estado (Regla 11) ═══
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get('clean') === 'true') {
      sessionStorage.removeItem('familias_filter');
      sessionStorage.removeItem('familias_scroll');
      sessionStorage.removeItem('familias_focus_id');
      return;
    }
    const savedFilter = sessionStorage.getItem('familias_filter');
    if (savedFilter) setFilter(savedFilter as any);
    const savedFocusId = sessionStorage.getItem('familias_focus_id');
    if (savedFocusId) {
      setFocusedRowId(parseInt(savedFocusId));
      sessionStorage.removeItem('familias_focus_id');
      // Auto-clear highlight after 3s
      setTimeout(() => setFocusedRowId(null), 3000);
    }
  }, []);

  useEffect(() => {
    sessionStorage.setItem('familias_filter', filter);
  }, [filter]);

  useEffect(() => {
    const savedScroll = sessionStorage.getItem('familias_scroll');
    if (savedScroll && !loading) {
      setTimeout(() => window.scrollTo(0, parseInt(savedScroll)), 100);
      sessionStorage.removeItem('familias_scroll');
    }
  }, [loading]);

  const fetchFamilias = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/familias');
      if (res.ok) {
        const data = await res.json();
        setFamilias(data.familias || []);
      }
    } catch (err) {
      console.error('Error fetching familias:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchFamilias(); }, [fetchFamilias]);

  const filteredFamilias = familias.filter(f => {
    if (filter === 'activas') return f.familiasactivosino === 1;
    if (filter === 'inactivas') return f.familiasactivosino === 0;
    return true;
  });

  const handleEdit = (id: number) => {
    sessionStorage.setItem('familias_scroll', String(window.scrollY));
    sessionStorage.setItem('familias_focus_id', String(id));
    router.push(`/dashboard/admin/familias/${id}`);
  };

  const handleToggleActive = async (id: number, currentActive: number) => {
    try {
      if (currentActive === 1) {
        await fetch(`/api/admin/familias/${id}`, { method: 'DELETE' });
      } else {
        await fetch(`/api/admin/familias/${id}`, { method: 'PATCH' });
      }
      fetchFamilias();
    } catch (err) {
      console.error('Error toggling familia:', err);
    }
  };

  const handleHardDelete = async (id: number, nombre: string) => {
    if (!confirm(`⚠️ ¿Eliminar definitivamente la familia "${nombre}"?\n\nLas especies asociadas perderán su familia asignada.`)) return;
    try {
      await fetch(`/api/admin/familias/${id}?hard=true`, { method: 'DELETE' });
      fetchFamilias();
    } catch (err) {
      console.error('Error deleting familia:', err);
    }
  };

  const handleCreateNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFamilia.familiasnombre || !newFamilia.familiasgruporotacion) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/familias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newFamilia)
      });
      if (res.ok) {
        setShowNewForm(false);
        setNewFamilia({ familiasnombre: '', familiasnombrecientifico: '', familiasgruporotacion: '', familiasanosdescanso: 3, familiascolor: '#64748b', familiasemoji: '🌿', familiasnotas: '' });
        fetchFamilias();
      } else {
        const data = await res.json();
        alert(data.error || 'Error al crear familia');
      }
    } catch (err) {
      console.error('Error creating familia:', err);
    } finally {
      setSaving(false);
    }
  };

  const filterCounts = {
    all: familias.length,
    activas: familias.filter(f => f.familiasactivosino === 1).length,
    inactivas: familias.filter(f => f.familiasactivosino === 0).length,
  };

  const calculateCompletion = (f: Familia) => {
    const parseArrayField = (val: any) => {
      if (!val) return [];
      if (Array.isArray(val)) return val;
      if (typeof val === 'string') return val.replace(/[\[\]"]/g, '').split(',').filter(Boolean);
      return [val];
    };

    const validFields = [
      !!f.familiasnombrecientifico,
      !!f.familiasgruporotacion,
      typeof f.familiasanosdescanso === 'number' && f.familiasanosdescanso > 0,
      !!f.familiasemoji,
      !!f.familiascolor,
      !!f.familiasdescripcion,
      parseArrayField(f.familiasprecedentes).length > 0,
      parseArrayField(f.familiassucesores).length > 0,
      !!f.familiasnotas
    ];
    const validCount = validFields.filter(Boolean).length;
    return Math.round((validCount / validFields.length) * 100);
  };

  return (
    <div style={{ width: '100%', padding: '0' }}>
      {/* ═══ Navegación Superior (Regla 11) ═══ */}
      <div style={{ display: 'flex', gap: '8px', padding: '12px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
        <button onClick={() => router.push('/dashboard')}
          style={{ padding: '6px 14px', borderRadius: '8px', border: '1px solid #d1d5db', background: 'white', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
          🏠 Volver al Inicio
        </button>
      </div>

      {/* ═══ Subheader (Regla 7) ═══ */}
      <div style={{
        background: 'linear-gradient(135deg, #059669, #10b981)',
        padding: '20px 28px',
        color: 'white',
        marginBottom: '0',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
              🧬 Familias Botánicas
            </h1>
            <p style={{ margin: '4px 0 0', opacity: 0.85, fontSize: '0.85rem' }}>
              Gestión de familias para rotación de cultivos
            </p>
          </div>
          <button
            onClick={() => setShowNewForm(true)}
            style={{
              background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)',
              color: 'white', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer',
              fontWeight: 600, fontSize: '0.9rem', transition: 'all 0.2s',
              backdropFilter: 'blur(4px)',
            }}
            onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.35)'; }}
            onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; }}
          >
            ➕ Nueva Familia
          </button>
        </div>

        {/* Filtros píldora */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
          {(['all', 'activas', 'inactivas'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '6px 16px', borderRadius: '20px', border: 'none', cursor: 'pointer',
                fontWeight: 600, fontSize: '0.8rem', transition: 'all 0.2s',
                background: filter === f ? 'white' : 'rgba(255,255,255,0.2)',
                color: filter === f ? '#059669' : 'white',
              }}
            >
              {f === 'all' ? '📋 Todas' : f === 'activas' ? '✅ Activas' : '⛔ Inactivas'} ({filterCounts[f]})
            </button>
          ))}
        </div>
      </div>

      {/* ═══ Formulario nueva familia (modal inline) ═══ */}
      {showNewForm && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center',
          zIndex: 1000, padding: '20px',
        }}>
          <form onSubmit={handleCreateNew} style={{
            background: 'white', borderRadius: '16px', padding: '28px', maxWidth: '500px',
            width: '100%', boxShadow: '0 25px 50px rgba(0,0,0,0.2)',
          }}>
            <h2 style={{ margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🧬 Nueva Familia Botánica
            </h2>
            <div style={{ display: 'grid', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151' }}>Nombre *</label>
                  <input type="text" value={newFamilia.familiasnombre} onChange={e => setNewFamilia(p => ({ ...p, familiasnombre: e.target.value }))}
                    placeholder="Solanáceas" required
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.9rem', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151' }}>N. Científico</label>
                  <input type="text" value={newFamilia.familiasnombrecientifico} onChange={e => setNewFamilia(p => ({ ...p, familiasnombrecientifico: e.target.value }))}
                    placeholder="Solanaceae"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.9rem', boxSizing: 'border-box' }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151' }}>Grupo Rotación *</label>
                  <input type="text" value={newFamilia.familiasgruporotacion} onChange={e => setNewFamilia(p => ({ ...p, familiasgruporotacion: e.target.value }))}
                    placeholder="solanaceas" required
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.9rem', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151' }}>Años Descanso</label>
                  <input type="number" value={newFamilia.familiasanosdescanso} onChange={e => setNewFamilia(p => ({ ...p, familiasanosdescanso: parseInt(e.target.value) || 3 }))}
                    min="1" max="10"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.9rem', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151' }}>Emoji</label>
                  <input type="text" value={newFamilia.familiasemoji} onChange={e => setNewFamilia(p => ({ ...p, familiasemoji: e.target.value }))}
                    maxLength={4}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '1.2rem', textAlign: 'center', boxSizing: 'border-box' }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '10px', alignItems: 'end' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151' }}>Notas</label>
                  <input type="text" value={newFamilia.familiasnotas || ''} onChange={e => setNewFamilia(p => ({ ...p, familiasnotas: e.target.value }))}
                    placeholder="Notas sobre rotación..."
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.9rem', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151' }}>Color</label>
                  <input type="color" value={newFamilia.familiascolor} onChange={e => setNewFamilia(p => ({ ...p, familiascolor: e.target.value }))}
                    style={{ width: '48px', height: '38px', border: '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer', padding: '2px' }} />
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowNewForm(false)}
                style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #d1d5db', background: 'white', cursor: 'pointer', fontWeight: 600 }}>
                Cancelar
              </button>
              <button type="submit" disabled={saving}
                style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#059669', color: 'white', cursor: 'pointer', fontWeight: 600, opacity: saving ? 0.6 : 1 }}>
                {saving ? 'Creando...' : '✅ Crear Familia'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ═══ Tabla (Regla 7) ═══ */}
      <div style={{ position: 'relative', padding: '0 20px 20px' }}>
        {/* Overlay de carga (Regla 7: sin desmontar tabla) */}
        {loading && (
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(255,255,255,0.65)', display: 'flex', justifyContent: 'center', alignItems: 'center',
            zIndex: 10, borderRadius: '12px',
          }}>
            <div style={{
              width: '40px', height: '40px', border: '4px solid #e5e7eb', borderTopColor: '#059669',
              borderRadius: '50%', animation: 'spin 0.8s linear infinite',
            }} />
          </div>
        )}

        <div style={{ overflowX: 'auto', opacity: loading ? 0.6 : 1, transition: 'opacity 0.3s' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '16px', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#374151', whiteSpace: 'nowrap' }}></th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#374151', whiteSpace: 'nowrap' }}>Familia</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#374151', whiteSpace: 'nowrap' }}>N. Científico</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#374151', whiteSpace: 'nowrap' }}>Grupo Rotación</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 700, color: '#374151', whiteSpace: 'nowrap' }}>Años</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 700, color: '#374151', whiteSpace: 'nowrap' }}>Completado</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 700, color: '#374151', whiteSpace: 'nowrap' }}>Especies</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 700, color: '#374151', whiteSpace: 'nowrap' }}>Color</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: '#374151', whiteSpace: 'nowrap' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredFamilias.length === 0 && !loading && (
                <tr>
                  <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🧬</div>
                    No hay familias para mostrar
                  </td>
                </tr>
              )}
              {filteredFamilias.map((f, idx) => (
                <tr key={f.idfamilias}
                  id={`familia-row-${f.idfamilias}`}
                  style={{
                    background: focusedRowId === f.idfamilias ? '#d1fae5' : (idx % 2 === 0 ? 'white' : '#f8fafc'),
                    borderBottom: '1px solid #f1f5f9',
                    opacity: f.familiasactivosino === 0 ? 0.55 : 1,
                    transition: 'background 0.5s',
                    boxShadow: focusedRowId === f.idfamilias ? 'inset 0 0 0 2px #10b981' : 'none',
                  }}
                  onMouseOver={e => { if (focusedRowId !== f.idfamilias) e.currentTarget.style.background = '#f0fdf4'; }}
                  onMouseOut={e => { if (focusedRowId !== f.idfamilias) e.currentTarget.style.background = idx % 2 === 0 ? 'white' : '#f8fafc'; }}
                >
                  {/* Emoji */}
                  <td style={{ padding: '12px 16px', fontSize: '1.4rem', textAlign: 'center', width: '48px' }}>
                    {f.familiasemoji}
                  </td>
                  {/* Nombre */}
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: '#0f172a' }}>
                    {f.familiasnombre}
                    {f.familiasactivosino === 0 && (
                      <span style={{ marginLeft: '8px', fontSize: '0.7rem', background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: '10px' }}>Inactiva</span>
                    )}
                  </td>
                  {/* Científico */}
                  <td style={{ padding: '12px 16px', color: '#64748b', fontStyle: 'italic' }}>
                    {f.familiasnombrecientifico || '—'}
                  </td>
                  {/* Grupo */}
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      background: '#f1f5f9', padding: '4px 10px', borderRadius: '12px',
                      fontSize: '0.8rem', fontWeight: 600, color: '#475569',
                    }}>
                      {f.familiasgruporotacion}
                    </span>
                  </td>
                  {/* Años */}
                  <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 700, color: '#0f172a' }}>
                    {f.familiasanosdescanso}
                  </td>
                  {/* Completado */}
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    {(() => {
                      const pct = calculateCompletion(f);
                      const is100 = pct === 100;
                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: is100 ? '#047857' : '#b45309' }}>
                            {pct}%
                          </span>
                          <div style={{ width: '40px', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: is100 ? '#10b981' : 'linear-gradient(90deg, #f59e0b, #fbbf24)', borderRadius: '3px' }} />
                          </div>
                        </div>
                      );
                    })()}
                  </td>
                  {/* Especies */}
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <span style={{
                      background: f.total_especies > 0 ? '#dbeafe' : '#f1f5f9',
                      color: f.total_especies > 0 ? '#1d4ed8' : '#94a3b8',
                      padding: '4px 12px', borderRadius: '12px', fontWeight: 700, fontSize: '0.85rem',
                    }}>
                      {f.total_especies}
                    </span>
                  </td>
                  {/* Color */}
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <div style={{
                      width: '28px', height: '28px', borderRadius: '50%', background: f.familiascolor,
                      margin: '0 auto', border: '2px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                    }} title={f.familiascolor} />
                  </td>
                  {/* Acciones (Regla 7: botonera estandarizada) */}
                  <td style={{ padding: '12px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                      <button onClick={() => handleEdit(f.idfamilias)} title="Editar"
                        style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #d1d5db', background: 'white', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, color: '#374151' }}>
                        ✏️ Editar
                      </button>
                      {f.familiasactivosino === 1 ? (
                        <button onClick={() => handleToggleActive(f.idfamilias, 1)} title="Inhabilitar"
                          style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #fbbf24', background: '#fef3c7', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, color: '#92400e' }}>
                          ⏸️
                        </button>
                      ) : (
                        <button onClick={() => handleToggleActive(f.idfamilias, 0)} title="Reactivar"
                          style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #34d399', background: '#d1fae5', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, color: '#065f46' }}>
                          ▶️
                        </button>
                      )}
                      <button onClick={() => handleHardDelete(f.idfamilias, f.familiasnombre)} title="Eliminar"
                        style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #fca5a5', background: '#fee2e2', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, color: '#991b1b' }}>
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Spinner animation */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
