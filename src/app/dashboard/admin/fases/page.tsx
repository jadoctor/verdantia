'use client';
// Force compilation refresh for 100% unique database phase icons
// Refresh

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';

// Se eliminan los mapeos estáticos para usar los nombres enteros reales de la base de datos

export default function FasesCultivoAdminPage() {
  const router = useRouter();
  const [fases, setFases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedSort = sessionStorage.getItem('fasesSortConfig');
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
      sessionStorage.setItem('fasesSortConfig', JSON.stringify(newConfig));
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleResize = () => {
        setIsMobile(window.innerWidth < 768);
      };
      handleResize();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.email) {
        setUserEmail(user.email);
      } else {
        setUserEmail(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const loadFases = async () => {
    if (!userEmail) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/fases`, {
        headers: { 'x-user-email': userEmail }
      });
      const data = await res.json();
      setFases(data.fases || []);
    } catch (e) {
      console.error(e);
    } finally {
      loading && setLoading(false);
    }
  };

  const formatHitos = (hitosString: string) => {
    if (!hitosString) return '—';
    return hitosString.split(',').map(key => {
      const cleanKey = key.trim();
      const found = fases.find(f => f.fasescultivoclave === cleanKey);
      if (found) {
        return `${found.fasescultivoicono || '📍'} ${found.fasescultivonombre}`;
      }
      return cleanKey;
    }).join(' o ');
  };

  const getFasesIniciadasPorHito = (hitoClave: string) => {
    const iniciadas = fases.filter(f => 
      f.fasescultivotipo === 'Fase' && 
      (f.fasescultivodesde || '').split(',').map((k: any) => k.trim()).includes(hitoClave)
    );
    if (iniciadas.length === 0) return '—';
    return iniciadas.map(f => `${f.fasescultivoicono || '🌱'} ${f.fasescultivonombre}`).join(', ');
  };

  const getFasesFinalizadasPorHito = (hitoClave: string) => {
    const finalizadas = fases.filter(f => 
      f.fasescultivotipo === 'Fase' && 
      (f.fasescultivohasta || '').split(',').map((k: any) => k.trim()).includes(hitoClave)
    );
    if (finalizadas.length === 0) return '—';
    return finalizadas.map(f => `${f.fasescultivoicono || '🌱'} ${f.fasescultivonombre}`).join(', ');
  };

  useEffect(() => {
    if (userEmail) {
      loadFases();
    }
  }, [userEmail]);

  const handleEdit = (id: string | null) => {
    if (id) {
      router.push(`/dashboard/admin/fases/${id}`);
    } else {
      router.push(`/dashboard/admin/fases/nueva`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta fase de cultivo?')) return;
    if (!userEmail) return;
    try {
      const res = await fetch(`/api/admin/fases/${id}`, { 
        method: 'DELETE',
        headers: { 'x-user-email': userEmail }
      });
      const data = await res.json();
      if (data.success) {
        loadFases();
      } else {
        alert('Error: ' + data.error);
      }
    } catch (e) {
      alert('Error eliminando la fase');
    }
  };

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

  const sortedFases = [...fases].sort((a, b) => {
    if (!sortConfig) return 0;
    const { key, direction } = sortConfig;
    let valA = a[key];
    let valB = b[key];
    
    // Convert to number for `fasescultivoorden`
    if (key === 'fasescultivoorden') {
      valA = Number(valA) || 0;
      valB = Number(valB) || 0;
    } else {
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
    }
    
    if (valA < valB) return direction === 'asc' ? -1 : 1;
    if (valA > valB) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <div className="dashboard-content" style={{ padding: isMobile ? '10px 0' : '20px', width: '100%' }}>
      <div style={{ marginBottom: '16px', paddingLeft: isMobile ? '10px' : 0 }}>
        <button onClick={() => router.push('/dashboard')} style={{ background: 'white', border: '1px solid #cbd5e1', color: '#475569', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          🏠 Volver al Inicio
        </button>
      </div>
      
      {/* ── Header responsivo ── */}
      <div style={{ 
        background: 'linear-gradient(135deg, #0f766e, #10b981)', 
        borderRadius: isMobile ? '12px' : '16px', 
        padding: isMobile ? '20px' : '24px 28px', 
        marginBottom: '24px', 
        color: 'white',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center', flexDirection: isMobile ? 'column' : 'row', gap: '16px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: isMobile ? '1.35rem' : '1.6rem', fontWeight: 800 }}>🌱 Gestión de Fases de Cultivo</h1>
            <p style={{ margin: '4px 0 0', opacity: 0.9, fontSize: '0.85rem' }}>
              Catálogo centralizado del ciclo de vida para toda la comunidad Verdantia
            </p>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', width: isMobile ? '100%' : 'auto' }}>
            <button 
              onClick={() => handleEdit(null)}
              style={{ width: isMobile ? '100%' : 'auto', textAlign: 'center', padding: '8px 16px', borderRadius: '8px', background: 'white', color: '#0f766e', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.95rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
            >
              ➕ Nueva Fase
            </button>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: '@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }' }} />
      
      {/* Envoltura scrollable */}
      <div style={{ position: 'relative', background: 'white', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0', minHeight: '200px', width: '100%' }}>
        {/* Loading Overlay */}
        {loading && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(255, 255, 255, 0.65)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            backdropFilter: 'blur(1px)'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '4px solid #cbd5e1',
              borderTopColor: '#0f766e',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite'
            }} />
            <span style={{ marginTop: '10px', fontSize: '0.85rem', color: '#0f766e', fontWeight: 'bold' }}>Cargando fases...</span>
          </div>
        )}

        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s ease-in-out', minWidth: isMobile ? '900px' : '100%' }}>
            <thead style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              <tr>
                <th style={{ padding: '12px', width: '80px', textAlign: 'center', position: 'sticky', left: 0, zIndex: 2, background: '#f8fafc' }}>Icono</th>
                <th onClick={() => handleSort('fasescultivoorden')} style={{ ...getHeaderStyle('fasescultivoorden'), width: '60px', textAlign: 'center' }}>Orden {renderSortIndicator('fasescultivoorden')}</th>
                <th onClick={() => handleSort('fasescultivonombre')} style={getHeaderStyle('fasescultivonombre')}>Nombre {renderSortIndicator('fasescultivonombre')}</th>
                <th onClick={() => handleSort('fasescultivoclave')} style={getHeaderStyle('fasescultivoclave')}>Clave Interna {renderSortIndicator('fasescultivoclave')}</th>
                <th onClick={() => handleSort('fasescultivotipo')} style={getHeaderStyle('fasescultivotipo')}>Tipo {renderSortIndicator('fasescultivotipo')}</th>
                <th style={{ padding: '12px' }}>Desde</th>
                <th style={{ padding: '12px' }}>Hasta</th>
                <th style={{ padding: '12px' }}>Descripción</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {sortedFases.map((f, i) => (
                <tr 
                  key={f.idfasescultivo} 
                  style={{ 
                    borderBottom: '1px solid #e2e8f0', 
                    background: i % 2 === 0 ? 'white' : '#f8fafc',
                    transition: 'all 0.5s ease'
                  }}
                >
                  <td style={{ padding: '8px', textAlign: 'center', position: 'sticky', left: 0, zIndex: 1, background: 'inherit', width: '80px', minWidth: '80px', cursor: 'pointer' }} onClick={() => handleEdit(f.idfasescultivo.toString())} title="Editar Fase">
                    <div style={{ width: '56px', height: '56px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', margin: '0 auto', fontSize: '2rem', background: '#f1f5f9' }}>
                      {f.fasescultivoicono}
                    </div>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', color: '#64748b' }}>
                    {f.fasescultivoorden}
                  </td>
                  <td style={{ padding: '12px', fontWeight: 'bold', color: '#1e293b' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      {f.fasescultivonombre}
                      {f.fasescultivoesfin ? (
                        <span style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fca5a5', padding: '2px 6px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 'bold' }}>
                          🛑 Fase Final
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ fontFamily: 'monospace', color: '#0f766e', background: '#ccfbf1', borderRadius: '4px', padding: '4px 8px', fontSize: '0.85rem' }}>
                      {f.fasescultivoclave}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      background: f.fasescultivotipo === 'Hito' || f.fasescultivotipo === 'Hito Final' ? '#e0e7ff' : '#fef3c7',
                      color: f.fasescultivotipo === 'Hito' || f.fasescultivotipo === 'Hito Final' ? '#4338ca' : '#d97706',
                      padding: '4px 8px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 'bold'
                    }}>
                      {f.fasescultivotipo || 'Fase'}
                    </span>
                  </td>
                  <td style={{ padding: '12px', color: '#334155', fontSize: '0.85rem' }}>
                    {f.fasescultivotipo === 'Fase' ? (
                      formatHitos(f.fasescultivodesde)
                    ) : (
                      <div style={{ color: '#0f766e', fontSize: '0.78rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontWeight: 'bold', fontSize: '0.72rem', textTransform: 'uppercase', color: '#0d9488' }}>Inicia:</span>
                        <span>{getFasesIniciadasPorHito(f.fasescultivoclave)}</span>
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '12px', color: '#334155', fontSize: '0.85rem' }}>
                    {f.fasescultivotipo === 'Fase' ? (
                      formatHitos(f.fasescultivohasta)
                    ) : (
                      <div style={{ color: '#b91c1c', fontSize: '0.78rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontWeight: 'bold', fontSize: '0.72rem', textTransform: 'uppercase', color: '#dc2626' }}>Finaliza:</span>
                        <span>{getFasesFinalizadasPorHito(f.fasescultivoclave)}</span>
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '12px', color: '#64748b', fontSize: '0.9rem', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {f.fasescultivodescripcion || '-'}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '10px' }}>
                      <button 
                        onClick={() => handleEdit(f.idfasescultivo.toString())} 
                        style={{ background: '#f8fafc', border: '1px solid #cbd5e1', color: '#475569', cursor: 'pointer', fontSize: '0.85rem', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold' }}
                      >
                        Editar
                      </button>
                      <button onClick={() => handleDelete(f.idfasescultivo.toString())} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', display: 'flex', alignItems: 'center' }}>
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {fases.length === 0 && !loading && (
                <tr>
                  <td colSpan={9} style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>No hay fases de cultivo registradas.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
