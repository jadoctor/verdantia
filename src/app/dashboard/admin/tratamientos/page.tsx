'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { getMediaUrl } from '@/lib/media-url';

export default function TratamientosAdminPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [tratamientos, setTratamientos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedSort = sessionStorage.getItem('tratamientosSortConfig');
      if (savedSort) {
        try { setSortConfig(JSON.parse(savedSort)); } catch (e) {}
      }
    }
  }, []);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    const newConfig = { key, direction };
    setSortConfig(newConfig);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('tratamientosSortConfig', JSON.stringify(newConfig));
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.email) {
        setUserEmail(user.email);
      } else {
        setUserEmail(null);
        router.push('/login');
      }
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (userEmail) {
      fetchTratamientos();
    }
  }, [userEmail]);

  const fetchTratamientos = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/tratamientos', {
        headers: { 'x-user-email': userEmail || '' },
        cache: 'no-store'
      });
      if (response.ok) {
        const data = await response.json();
        setTratamientos(data.tratamientos || []);
      }
    } catch (error) {
      console.error('Error fetching tratamientos:', error);
    } finally {
      setLoading(false);
    }
  };

  const parseTags = (val: string) => (val || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);

  const getCompleteness = (t: any) => {
    const FIELDS = ['tratamientosnombre','tratamientostipo','tratamientosaccion','tratamientosdosis','tratamientosfrecuencia','tratamientoscarencia','tratamientosmecanismo','tratamientosdescripcion','tratamientospreparacion','tratamientosprecauciones'];
    let pts = 0;
    FIELDS.forEach(f => { if (t[f] && String(t[f]).trim().length > 0) pts++; });
    if (t.partes && t.partes.length > 0) pts++;
    pts += Math.min(t.photosCount || 0, 4);
    pts += Math.min(t.pdfsCount || 0, 4);
    const pct = Math.round((pts / 23) * 100);
    const color = pct < 40 ? '#ef4444' : pct < 75 ? '#f59e0b' : pct < 100 ? '#10b981' : '#8b5cf6';
    return { pct, color };
  };

  // Count helpers for multi-value fields
  const countByTag = (field: string, tag: string) => tratamientos.filter(t => parseTags(t[field]).includes(tag)).length;

  const filteredTratamientos = tratamientos.filter(t => {
    const matchSearch = !searchTerm || 
      t.tratamientosnombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.tratamientostipo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.tratamientosaccion?.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchSearch) return false;
    if (activeFilter === 'all') return true;
    // Check if activeFilter matches any tag in tipo or accion
    return parseTags(t.tratamientostipo).includes(activeFilter) || parseTags(t.tratamientosaccion).includes(activeFilter);
  });

  const sortedTratamientos = [...filteredTratamientos].sort((a, b) => {
    if (!sortConfig) return 0;
    const { key, direction } = sortConfig;
    
    let valA: any, valB: any;
    if (key === '_completeness') {
      valA = getCompleteness(a).pct;
      valB = getCompleteness(b).pct;
    } else {
      valA = a[key] || '';
      valB = b[key] || '';
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
    }
    
    if (valA < valB) return direction === 'asc' ? -1 : 1;
    if (valA > valB) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  const renderSortIndicator = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) return <span style={{ color: '#cbd5e1', marginLeft: '4px', fontSize: '0.8rem' }}>↕️</span>;
    return sortConfig.direction === 'asc' ? <span style={{ marginLeft: '4px', fontSize: '0.8rem' }}>🔼</span> : <span style={{ marginLeft: '4px', fontSize: '0.8rem' }}>🔽</span>;
  };

  const getHeaderStyle = (key: string) => ({
    padding: '12px',
    cursor: 'pointer',
    userSelect: 'none' as const,
    whiteSpace: 'nowrap' as const
  });


  const getTipoColor = (tipo: string) => {
    switch (tipo?.toLowerCase().trim()) {
      case 'ecológico': return { bg: '#dcfce7', color: '#166534' };
      case 'orgánico': return { bg: '#fef9c3', color: '#854d0e' };
      case 'químico': return { bg: '#fee2e2', color: '#991b1b' };
      case 'biológico': return { bg: '#d1fae5', color: '#065f46' };
      case 'físico': return { bg: '#f3e8ff', color: '#6b21a8' };
      default: return { bg: '#f3f4f6', color: '#475569' };
    }
  };

  const getAccionColor = (accion: string) => {
    switch (accion?.toLowerCase().trim()) {
      case 'preventivo': return { bg: '#dbeafe', color: '#1e40af' };
      case 'curativo': return { bg: '#fce7f3', color: '#9d174d' };
      case 'sistémico': return { bg: '#e0e7ff', color: '#3730a3' };
      case 'erradicante': return { bg: '#fef2f2', color: '#b91c1c' };
      default: return { bg: '#f3f4f6', color: '#475569' };
    }
  };

  const getTratamientoIcon = (nombre: string, tipo: string) => {
    const n = (nombre || '').toLowerCase();
    if (n.includes('jabón')) return '🧼';
    if (n.includes('neem')) return '💧';
    if (n.includes('diatomeas')) return '🏜️';
    if (n.includes('ajo') || n.includes('guindilla')) return '🧄';
    if (n.includes('cola de caballo')) return '🌿';
    if (n.includes('cobre')) return '🥉';
    if (n.includes('azufre')) return '🟡';
    if (n.includes('bicarbonato')) return '🧂';
    if (n.includes('bacillus') || n.includes('bt')) return '🐛';
    if (n.includes('trichoderma')) return '🦠';
    if (n.includes('nematodos')) return '🪱';
    if (n.includes('ortigas')) return '🍵';

    switch (tipo?.toLowerCase()) {
      case 'ecológico': return '🍃';
      case 'químico': return '🧪';
      case 'preventivo': return '🛡️';
      case 'físico': return '✂️';
      default: return '💊';
    }
  };

  return (
    <div style={{ width: '100%', padding: '24px', boxSizing: 'border-box', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* Subheader Global */}
      <div style={{
        background: 'linear-gradient(135deg, #0f766e 0%, #3b82f6 100%)',
        borderRadius: '16px', padding: '32px', marginBottom: '32px',
        color: 'white', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px'
      }}>
        <div>
          <h1 style={{ margin: '0 0 8px 0', fontSize: '2rem', fontWeight: '800', letterSpacing: '-0.02em' }}>
            🧪 Catálogo Maestro de Tratamientos
          </h1>
          <p style={{ margin: 0, opacity: 0.8, fontSize: '1.05rem', maxWidth: '600px' }}>
            Gestiona el catálogo global de remedios, aplicaciones y fungicidas disponibles para combatir afecciones.
          </p>
          <div style={{ display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: 'Todos', count: tratamientos.length, bg: 'rgba(255,255,255,0.2)' },
              { id: 'ecológico', label: '🍃 Ecológico', count: countByTag('tratamientostipo', 'ecológico'), bg: 'rgba(220, 252, 231, 0.3)' },
              { id: 'orgánico', label: '🌱 Orgánico', count: countByTag('tratamientostipo', 'orgánico'), bg: 'rgba(254, 249, 195, 0.3)' },
              { id: 'químico', label: '🧪 Químico', count: countByTag('tratamientostipo', 'químico'), bg: 'rgba(254, 226, 226, 0.3)' },
              { id: 'biológico', label: '🦠 Biológico', count: countByTag('tratamientostipo', 'biológico'), bg: 'rgba(209, 250, 229, 0.3)' },
              { id: 'físico', label: '✂️ Físico', count: countByTag('tratamientostipo', 'físico'), bg: 'rgba(243, 232, 255, 0.3)' },
            ].filter(f => f.id === 'all' || f.count > 0).map(f => (
              <span key={f.id} onClick={() => setActiveFilter(f.id)} style={{ 
                background: activeFilter === f.id ? 'rgba(255,255,255,0.45)' : f.bg, 
                padding: '4px 12px', borderRadius: '20px', fontSize: '0.85rem', cursor: 'pointer',
                border: activeFilter === f.id ? '2px solid white' : '2px solid transparent',
                fontWeight: activeFilter === f.id ? 'bold' : 'normal',
                transition: 'all 0.2s'
              }}>
                {f.label} ({f.count})
              </span>
            ))}
            <span style={{ opacity: 0.4, padding: '4px 2px' }}>│</span>
            {[
              { id: 'preventivo', label: '🛡️ Preventivo', count: countByTag('tratamientosaccion', 'preventivo'), bg: 'rgba(219, 234, 254, 0.3)' },
              { id: 'curativo', label: '💊 Curativo', count: countByTag('tratamientosaccion', 'curativo'), bg: 'rgba(252, 231, 243, 0.3)' },
              { id: 'sistémico', label: '🔄 Sistémico', count: countByTag('tratamientosaccion', 'sistémico'), bg: 'rgba(224, 231, 255, 0.3)' },
              { id: 'erradicante', label: '⚡ Erradicante', count: countByTag('tratamientosaccion', 'erradicante'), bg: 'rgba(254, 242, 242, 0.3)' },
            ].filter(f => f.count > 0).map(f => (
              <span key={f.id} onClick={() => setActiveFilter(f.id)} style={{ 
                background: activeFilter === f.id ? 'rgba(255,255,255,0.45)' : f.bg, 
                padding: '4px 12px', borderRadius: '20px', fontSize: '0.85rem', cursor: 'pointer',
                border: activeFilter === f.id ? '2px solid white' : '2px solid transparent',
                fontWeight: activeFilter === f.id ? 'bold' : 'normal',
                transition: 'all 0.2s'
              }}>
                {f.label} ({f.count})
              </span>
            ))}
          </div>
        </div>
        <div>
          <button 
            onClick={() => router.push('/dashboard/admin/tratamientos/nuevo')}
            style={{
              background: '#10b981', color: 'white', border: 'none',
              padding: '12px 24px', borderRadius: '12px', fontSize: '1rem',
              fontWeight: '600', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.3)',
              display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s'
            }}
          >
            <span>➕</span> Nuevo Tratamiento
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'center' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</span>
          <input 
            type="text" 
            placeholder="Buscar por nombre o tipo..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ 
              width: '100%', padding: '14px 14px 14px 44px', borderRadius: '12px', 
              border: '1px solid #e2e8f0', fontSize: '1rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', boxSizing: 'border-box'
            }}
          />
        </div>
      </div>

      <div style={{ position: 'relative', width: '100%' }}>
        {loading && (
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(255,255,255,0.65)', zIndex: 10,
            display: 'flex', justifyContent: 'center', alignItems: 'center', borderRadius: '16px'
          }}>
            <div className="loading-spinner" style={{ width: '40px', height: '40px', borderTopColor: '#3b82f6' }}></div>
          </div>
        )}

        {filteredTratamientos.length > 0 ? (
          <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', overflowX: 'auto', opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.95rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '12px', position: 'sticky', left: 0, zIndex: 2, background: '#f8fafc' }}>Icono</th>
                  <th onClick={() => handleSort('tratamientosnombre')} style={getHeaderStyle('tratamientosnombre')}>Nombre {renderSortIndicator('tratamientosnombre')}</th>
                  <th onClick={() => handleSort('tratamientostipo')} style={getHeaderStyle('tratamientostipo')}>Naturaleza {renderSortIndicator('tratamientostipo')}</th>
                  <th onClick={() => handleSort('tratamientosaccion')} style={getHeaderStyle('tratamientosaccion')}>Modo de Acción {renderSortIndicator('tratamientosaccion')}</th>
                  <th style={{ padding: '12px' }}>Vías de Aplicación</th>
                  <th onClick={() => handleSort('_completeness')} style={getHeaderStyle('_completeness')}>Completitud {renderSortIndicator('_completeness')}</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {sortedTratamientos.map((tratamiento, i) => {
                  const comp = getCompleteness(tratamiento);
                  const tipos = parseTags(tratamiento.tratamientostipo);
                  const acciones = parseTags(tratamiento.tratamientosaccion);
                  
                  return (
                    <tr key={tratamiento.idtratamientos} style={{ borderBottom: '1px solid #e2e8f0', background: i % 2 === 0 ? 'white' : '#f8fafc' }}>
                      <td style={{ padding: '8px', position: 'sticky', left: 0, zIndex: 1, background: i % 2 === 0 ? 'white' : '#f8fafc', width: '80px', minWidth: '80px', textAlign: 'center', verticalAlign: 'middle', cursor: 'pointer' }} onClick={() => router.push(`/dashboard/admin/tratamientos/${tratamiento.idtratamientos}`)} title="Editar Tratamiento">
                        <div style={{ width: '56px', height: '56px', borderRadius: '12px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', fontSize: '2rem', overflow: 'hidden' }}>
                          {tratamiento.primaryPhoto ? (
                            <img src={getMediaUrl(tratamiento.primaryPhoto)} alt={tratamiento.tratamientosnombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            getTratamientoIcon(tratamiento.tratamientosnombre, tratamiento.tratamientostipo)
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '12px', fontWeight: 'bold', color: '#1e293b' }}>
                        {tratamiento.tratamientosnombre}
                        {!tratamiento.tratamientosactivo && <span style={{ marginLeft: '8px', fontSize: '0.75rem', background: '#e2e8f0', color: '#64748b', padding: '2px 6px', borderRadius: '4px' }}>Inactivo</span>}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {tipos.length > 0 ? tipos.map(t => {
                            const c = getTipoColor(t);
                            return <span key={t} style={{ background: c.bg, color: c.color, padding: '3px 8px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 'bold', textTransform: 'uppercase' }}>{t}</span>;
                          }) : <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>—</span>}
                        </div>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {acciones.length > 0 ? acciones.map(a => {
                            const c = getAccionColor(a);
                            return <span key={a} style={{ background: c.bg, color: c.color, padding: '3px 8px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 'bold', textTransform: 'uppercase' }}>{a}</span>;
                          }) : <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>—</span>}
                        </div>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {tratamiento.partes && tratamiento.partes.length > 0 ? (
                            tratamiento.partes.map((p: any) => (
                              <span key={p.idplantasparte} title={p.plantaspartenombre} style={{
                                background: '#f1f5f9', color: '#334155', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem', border: '1px solid #e2e8f0', display: 'inline-flex', alignItems: 'center', gap: '4px'
                              }}>
                                <span>{p.plantasparteemoji}</span> {p.plantaspartenombre}
                              </span>
                            ))
                          ) : (
                            <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>Sin definir</span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '12px', minWidth: '130px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ flex: 1, height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${comp.pct}%`, height: '100%', background: comp.color, borderRadius: '4px', transition: 'width 0.3s ease' }} />
                          </div>
                          <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: comp.color, minWidth: '36px', textAlign: 'right' }}>{comp.pct}%</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '10px' }}>
                          <button 
                            onClick={() => router.push(`/dashboard/admin/tratamientos/${tratamiento.idtratamientos}`)}
                            style={{ background: '#f8fafc', border: '1px solid #cbd5e1', color: '#475569', cursor: 'pointer', fontSize: '0.85rem', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold' }}
                          >
                            Editar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          !loading && (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
              <span style={{ fontSize: '3rem' }}>🧪</span>
              <h3 style={{ color: '#475569', marginTop: '16px' }}>No hay tratamientos registrados</h3>
            </div>
          )
        )}
      </div>
    </div>
  );
}
