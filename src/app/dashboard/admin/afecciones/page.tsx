'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { getMediaUrl } from '@/lib/media-url';

export default function AfeccionesAdminPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [afecciones, setAfecciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedSort = sessionStorage.getItem('afeccionesSortConfig');
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
      sessionStorage.setItem('afeccionesSortConfig', JSON.stringify(newConfig));
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
      fetchAfecciones();
    }
  }, [userEmail]);

  const fetchAfecciones = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/afecciones', {
        headers: { 'x-user-email': userEmail || '' }
      });
      if (response.ok) {
        const data = await response.json();
        setAfecciones(data.afecciones || []);
      }
    } catch (error) {
      console.error('Error fetching afecciones:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/afecciones/${id}`, {
        method: 'DELETE',
        headers: { 'x-user-email': userEmail || '' }
      });
      if (response.ok) {
        setAfecciones(afecciones.filter(a => a.idafecciones !== id));
        setDeleteConfirmId(null);
      } else {
        alert('Error al eliminar. Puede que la afección esté vinculada a alguna especie.');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const filteredAfecciones = afecciones.filter(a => 
    a.afeccionesnombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.afeccionesnombrecientifico?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedAfecciones = [...filteredAfecciones].sort((a, b) => {
    if (!sortConfig) return 0;
    const { key, direction } = sortConfig;
    let valA = a[key] || '';
    let valB = b[key] || '';
    
    if (typeof valA === 'string') valA = valA.toLowerCase();
    if (typeof valB === 'string') valB = valB.toLowerCase();
    
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

  const getAfeccionIcon = (nombre: string, categoria: string, agente: string) => {
    const nameLower = (nombre || '').toLowerCase();
    
    if (nameLower.includes('araña') || nameLower.includes('ácaro')) return '🕷️';
    if (nameLower.includes('caracol') || nameLower.includes('babosa')) return '🐌';
    if (nameLower.includes('hormiga')) return '🐜';
    if (nameLower.includes('mosca') || nameLower.includes('mosquito')) return '🦟';
    if (nameLower.includes('gusano') || nameLower.includes('oruga') || nameLower.includes('polilla')) return '🐛';
    if (nameLower.includes('pulgón') || nameLower.includes('cochinilla') || nameLower.includes('chinche')) return '🐞';
    if (nameLower.includes('nematodo') || nameLower.includes('lombriz')) return '🪱';
    if (nameLower.includes('pájaro') || nameLower.includes('ave') || nameLower.includes('cuervo')) return '🐦';
    if (nameLower.includes('ratón') || nameLower.includes('rata') || nameLower.includes('roedor')) return '🐁';
    if (nameLower.includes('conejo') || nameLower.includes('liebre')) return '🐇';
    if (nameLower.includes('topo')) return '🦡';
    if (nameLower.includes('jabalí')) return '🐗';
    if (nameLower.includes('ciervo') || nameLower.includes('venado')) return '🦌';
    if (nameLower.includes('mildiu') || nameLower.includes('oídio') || nameLower.includes('roya') || nameLower.includes('botrytis')) return '🌫️';

    if (categoria === 'deficiencia') return '📉';
    if (categoria === 'enfermedad') {
      if (agente?.toLowerCase().includes('hongo')) return '🍄';
      if (agente?.toLowerCase().includes('bacteria')) return '🦠';
      if (agente?.toLowerCase().includes('virus')) return '🧬';
      return '🤒';
    }
    
    return '⚠️';
  };

  const getCategoryColor = (categoria: string) => {
    switch (categoria) {
      case 'plaga': return { bg: '#dbeafe', color: '#1e40af' };
      case 'enfermedad': return { bg: '#fee2e2', color: '#991b1b' };
      case 'deficiencia': return { bg: '#fef3c7', color: '#92400e' };
      default: return { bg: '#f3f4f6', color: '#475569' };
    }
  };

  const getGravityColor = (gravedad: string) => {
    switch (gravedad) {
      case 'baja': return { bg: '#dcfce7', color: '#166534' };
      case 'media': return { bg: '#fef9c3', color: '#854d0e' };
      case 'alta': return { bg: '#ffedd5', color: '#9a3412' };
      case 'critica': return { bg: '#fee2e2', color: '#991b1b' };
      default: return { bg: '#f3f4f6', color: '#475569' };
    }
  };

  return (
    <div style={{ width: '100%', padding: '24px', boxSizing: 'border-box', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* Subheader Global */}
      <div style={{
        background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
        borderRadius: '16px', padding: '32px', marginBottom: '32px',
        color: 'white', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px'
      }}>
        <div>
          <h1 style={{ margin: '0 0 8px 0', fontSize: '2rem', fontWeight: '800', letterSpacing: '-0.02em' }}>
            🦠 Catálogo Maestro de Afecciones
          </h1>
          <p style={{ margin: 0, opacity: 0.8, fontSize: '1.05rem', maxWidth: '600px' }}>
            Gestiona el diccionario global de plagas, hongos, enfermedades y deficiencias.
          </p>
          <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.85rem' }}>
              Totales ({afecciones.length})
            </span>
            <span style={{ background: 'rgba(219, 234, 254, 0.3)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.85rem' }}>
              Plagas ({afecciones.filter(a => a.afeccionescategoria === 'plaga').length})
            </span>
            <span style={{ background: 'rgba(254, 226, 226, 0.3)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.85rem' }}>
              Enfermedades ({afecciones.filter(a => a.afeccionescategoria === 'enfermedad').length})
            </span>
            <span style={{ background: 'rgba(254, 243, 199, 0.3)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.85rem' }}>
              Deficiencias ({afecciones.filter(a => a.afeccionescategoria === 'deficiencia').length})
            </span>
          </div>
        </div>
        <div>
          <button 
            onClick={() => router.push('/dashboard/admin/afecciones/nueva')}
            style={{
              background: '#10b981', color: 'white', border: 'none',
              padding: '12px 24px', borderRadius: '12px', fontSize: '1rem',
              fontWeight: '600', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.3)',
              display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s'
            }}
          >
            <span>➕</span> Nueva Afección
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'center' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</span>
          <input 
            type="text" 
            placeholder="Buscar por nombre común o científico..." 
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

        {filteredAfecciones.length > 0 ? (
          <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', overflowX: 'auto', opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.95rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '12px', position: 'sticky', left: 0, zIndex: 2, background: '#f8fafc' }}>Foto</th>
                  <th onClick={() => handleSort('afeccionesnombre')} style={getHeaderStyle('afeccionesnombre')}>Nombre {renderSortIndicator('afeccionesnombre')}</th>
                  <th onClick={() => handleSort('afeccionesnombrecientifico')} style={getHeaderStyle('afeccionesnombrecientifico')}>Nombre Científico {renderSortIndicator('afeccionesnombrecientifico')}</th>
                  <th onClick={() => handleSort('afeccionescategoria')} style={getHeaderStyle('afeccionescategoria')}>Categoría {renderSortIndicator('afeccionescategoria')}</th>
                  <th onClick={() => handleSort('afeccionesgravedad')} style={getHeaderStyle('afeccionesgravedad')}>Gravedad {renderSortIndicator('afeccionesgravedad')}</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {sortedAfecciones.map((afeccion, i) => {
                  const catColor = getCategoryColor(afeccion.afeccionescategoria);
                  const gravColor = getGravityColor(afeccion.afeccionesgravedad);
                  
                  return (
                    <tr key={afeccion.idafecciones} style={{ borderBottom: '1px solid #e2e8f0', background: i % 2 === 0 ? 'white' : '#f8fafc' }}>
                      <td style={{ padding: '8px', position: 'sticky', left: 0, zIndex: 1, background: i % 2 === 0 ? 'white' : '#f8fafc', width: '80px', minWidth: '80px', textAlign: 'center', verticalAlign: 'middle', cursor: 'pointer' }} onClick={() => router.push(`/dashboard/admin/afecciones/${afeccion.idafecciones}`)} title="Editar Afección">
                        {(() => {
                          if (afeccion.primary_photo_ruta) {
                            let meta: any = {};
                            try { meta = JSON.parse(afeccion.primary_photo_resumen || '{}'); } catch(err){}
                            const STYLE_FILTERS: Record<string, string> = {
                              none: 'none', vivid: 'saturate(1.3) contrast(1.1)', warm: 'sepia(0.25) saturate(1.2)',
                              cool: 'saturate(0.9) hue-rotate(15deg)', bw: 'grayscale(1)', vintage: 'sepia(0.4) contrast(0.9) brightness(1.1)',
                              dramatic: 'contrast(1.4) saturate(1.2)', soft: 'brightness(1.1) contrast(0.9) saturate(0.9)',
                            };
                            let baseFilter = meta.profile_style ? STYLE_FILTERS[meta.profile_style] : 'none';
                            if (meta.profile_brightness !== undefined || meta.profile_contrast !== undefined) {
                              baseFilter = `brightness(${meta.profile_brightness ?? 100}%) contrast(${meta.profile_contrast ?? 100}%) ${meta.profile_style ? STYLE_FILTERS[meta.profile_style] : ''}`.trim();
                            }
                            return (
                              <div style={{ width: '56px', height: '56px', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', position: 'relative' }}>
                                <img 
                                  src={getMediaUrl(afeccion.primary_photo_ruta)} 
                                  alt={afeccion.afeccionesnombre}
                                  crossOrigin="anonymous"
                                  loading="lazy"
                                  style={{ 
                                    width: '100%', height: '100%', objectFit: 'cover',
                                    filter: baseFilter,
                                    objectPosition: `${meta.profile_object_x ?? 50}% ${meta.profile_object_y ?? 50}%`,
                                    transformOrigin: `${meta.profile_object_x ?? 50}% ${meta.profile_object_y ?? 50}%`,
                                    transform: `scale(${(meta.profile_object_zoom ?? 100) / 100})`,
                                    position: 'absolute', top: 0, left: 0, zIndex: 1
                                  }} 
                                />
                              </div>
                            );
                          }
                          return (
                            <div style={{ width: '56px', height: '56px', borderRadius: '12px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', fontSize: '2rem' }}>
                              {getAfeccionIcon(afeccion.afeccionesnombre, afeccion.afeccionescategoria, afeccion.afeccionesagente)}
                            </div>
                          );
                        })()}
                      </td>
                      <td style={{ padding: '12px', fontWeight: 'bold', color: '#1e293b' }}>
                        {afeccion.afeccionesnombre}
                        {!afeccion.afeccionesactivo && <span style={{ marginLeft: '8px', fontSize: '0.75rem', background: '#e2e8f0', color: '#64748b', padding: '2px 6px', borderRadius: '4px' }}>Inactivo</span>}
                      </td>
                      <td style={{ padding: '12px', fontStyle: 'italic', color: '#64748b' }}>
                        {afeccion.afeccionesnombrecientifico || '-'}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ 
                          background: catColor.bg, color: catColor.color, 
                          padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase'
                        }}>
                          {afeccion.afeccionescategoria || 'Plaga'}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ 
                          background: gravColor.bg, color: gravColor.color, 
                          padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase'
                        }}>
                          {afeccion.afeccionesgravedad || 'Media'}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '10px' }}>
                          <button 
                            onClick={() => router.push(`/dashboard/admin/afecciones/${afeccion.idafecciones}`)}
                            style={{ background: '#f8fafc', border: '1px solid #cbd5e1', color: '#475569', cursor: 'pointer', fontSize: '0.85rem', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold' }}
                          >
                            Editar
                          </button>
                          
                          {deleteConfirmId === afeccion.idafecciones ? (
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <button onClick={() => handleDelete(afeccion.idafecciones)} style={{ padding: '4px 8px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>✓</button>
                              <button onClick={() => setDeleteConfirmId(null)} style={{ padding: '4px 8px', background: '#e2e8f0', color: '#334155', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>✕</button>
                            </div>
                          ) : (
                            <button onClick={() => setDeleteConfirmId(afeccion.idafecciones)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', display: 'flex', alignItems: 'center' }}>🗑️</button>
                          )}
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
              <span style={{ fontSize: '3rem' }}>🦠</span>
              <h3 style={{ color: '#475569', marginTop: '16px' }}>No hay afecciones registradas</h3>
            </div>
          )
        )}
      </div>
    </div>
  );
}
