'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { Blurhash } from 'react-blurhash';
import { getMediaUrl } from '@/lib/media-url';

export default function PlantasPartePage() {
  const [plantaspartes, setPlantasPartes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [filterActivo, setFilterActivo] = useState<string>('todas');
  
  // Sorting states
  const [sortField, setSortField] = useState<string>('plantaspartenombre');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const router = useRouter();

  const STYLE_FILTERS: Record<string, string> = {
    '': 'none',
    comic: 'contrast(1.45) saturate(1.55) brightness(1.08)',
    manga: 'grayscale(1) contrast(1.85) brightness(1.1)',
    watercolor: 'saturate(1.35) contrast(0.88) brightness(1.14)',
    sketch: 'grayscale(1) contrast(2.2) brightness(1.18)',
    pop: 'saturate(1.95) contrast(1.3) brightness(1.06)',
    vintage: 'sepia(0.65) contrast(1.08) saturate(0.78) brightness(1.03)',
    cinematic: 'contrast(1.22) saturate(0.72) hue-rotate(338deg) brightness(0.98)',
    hdr: 'contrast(1.35) saturate(1.3) brightness(1.07)'
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.email) {
        setUserEmail(user.email);
      } else {
        setUserEmail(null);
        setLoading(false);
      }
    });

    // Restore sort states from sessionStorage
    if (typeof window !== 'undefined') {
      const savedField = sessionStorage.getItem('plantasparte_sortField');
      const savedOrder = sessionStorage.getItem('plantasparte_sortOrder');
      const savedFilter = sessionStorage.getItem('plantasparte_filterActivo');
      if (savedField) setSortField(savedField);
      if (savedOrder) setSortOrder(savedOrder as 'asc' | 'desc');
      if (savedFilter) setFilterActivo(savedFilter);
    }

    return () => unsubscribe();
  }, []);

  const loadPlantasPartes = async () => {
    if (!userEmail) return;
    try {
      setLoading(true);
      const res = await fetch('/api/admin/plantasparte', {
        headers: { 'x-user-email': userEmail }
      });
      const data = await res.json();
      if (data.plantaspartes) setPlantasPartes(data.plantaspartes);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userEmail) {
      loadPlantasPartes();
    }
  }, [userEmail]);

  const handleSort = (field: string) => {
    let nextOrder: 'asc' | 'desc' = 'asc';
    if (sortField === field) {
      nextOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    }
    setSortField(field);
    setSortOrder(nextOrder);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('plantasparte_sortField', field);
      sessionStorage.setItem('plantasparte_sortOrder', nextOrder);
    }
  };

  const handleFilterChange = (filter: string) => {
    setFilterActivo(filter);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('plantasparte_filterActivo', filter);
    }
  };

  const handleToggleActivo = async (item: any) => {
    if (!userEmail) return;
    const nextActivo = item.plantasparteactivo === 1 ? 0 : 1;
    try {
      const res = await fetch(`/api/admin/plantasparte/${item.idplantasparte}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-email': userEmail 
        },
        body: JSON.stringify({
          ...item,
          plantasparteactivo: nextActivo
        })
      });
      if (res.ok) {
        setPlantasPartes(plantaspartes.map(p => 
          p.idplantasparte === item.idplantasparte 
            ? { ...p, plantasparteactivo: nextActivo } 
            : p
        ));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta parte de planta del catálogo? Todos los consumos y fotos asociados se verán afectados.')) return;
    if (!userEmail) return;
    try {
      const res = await fetch(`/api/admin/plantasparte/${id}`, { 
        method: 'DELETE',
        headers: { 'x-user-email': userEmail }
      });
      if (res.ok) {
        setPlantasPartes(plantaspartes.filter(p => p.idplantasparte !== id));
      } else {
        const err = await res.json();
        alert(err.error || 'No se puede eliminar la parte. Asegúrate de que no esté en uso en consumos de especies.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Counting values for filters
  const countAll = plantaspartes.length;
  const countActivas = plantaspartes.filter(p => p.plantasparteactivo === 1).length;
  const countInactivas = plantaspartes.filter(p => p.plantasparteactivo === 0).length;

  // Filtering
  const filteredData = plantaspartes.filter(p => {
    if (filterActivo === 'activas') return p.plantasparteactivo === 1;
    if (filterActivo === 'inactivas') return p.plantasparteactivo === 0;
    return true;
  });

  // Sorting
  const sortedData = [...filteredData].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];

    if (aVal == null) aVal = '';
    if (bVal == null) bVal = '';

    if (typeof aVal === 'string') {
      return sortOrder === 'asc' 
        ? aVal.localeCompare(bVal) 
        : bVal.localeCompare(aVal);
    } else {
      return sortOrder === 'asc'
        ? (aVal > bVal ? 1 : -1)
        : (bVal > aVal ? 1 : -1);
    }
  });

  return (
    <div className="dashboard-content" style={{ padding: '24px', width: '100%', boxSizing: 'border-box' }}>
      <div style={{ marginBottom: '16px', display: 'flex', gap: '8px' }}>
        <button onClick={() => router.push('/dashboard')} style={{ background: 'white', border: '1px solid #cbd5e1', color: '#475569', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          🏠 Volver al Inicio
        </button>
      </div>

      <div style={{ background: 'linear-gradient(135deg, #14532d, #16a34a)', borderRadius: '16px', padding: '24px 28px', marginBottom: '24px', color: 'white', boxShadow: '0 4px 15px rgba(22, 163, 74, 0.15)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.7rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span>🍃</span> Partes de la Planta
            </h1>
            <p style={{ margin: '4px 0 0', opacity: 0.9, fontSize: '0.92rem' }}>
              Catálogo maestro de partes anatómicas de plantas para control de comestibilidad y alimentación animal
            </p>
          </div>
          <div>
            <button 
              onClick={() => router.push('/dashboard/admin/tareas/plantasparte/nueva')}
              style={{ padding: '10px 20px', borderRadius: '10px', background: 'white', color: '#14532d', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.95rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', display: 'inline-flex', alignItems: 'center', gap: '6px', transition: 'transform 0.2s' }}
              onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              ➕ Nueva Parte
            </button>
          </div>
        </div>

        {/* ── Filtros Rápidos por Tags con Contadores ── */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '24px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => handleFilterChange('todas')} 
            style={{ 
              padding: '6px 14px', 
              borderRadius: '20px', 
              border: filterActivo === 'todas' ? 'none' : '1px solid rgba(255,255,255,0.4)', 
              background: filterActivo === 'todas' ? 'white' : 'transparent', 
              color: filterActivo === 'todas' ? '#14532d' : 'white', 
              cursor: 'pointer', 
              fontWeight: 600, 
              fontSize: '0.85rem', 
              transition: 'all 0.2s'
            }}
          >
            📦 Todas ({countAll})
          </button>
          <button 
            onClick={() => handleFilterChange('activas')} 
            style={{ 
              padding: '6px 14px', 
              borderRadius: '20px', 
              border: filterActivo === 'activas' ? 'none' : '1px solid rgba(255,255,255,0.4)', 
              background: filterActivo === 'activas' ? 'white' : 'transparent', 
              color: filterActivo === 'activas' ? '#14532d' : 'white', 
              cursor: 'pointer', 
              fontWeight: 600, 
              fontSize: '0.85rem', 
              transition: 'all 0.2s'
            }}
          >
            🟢 Activas ({countActivas})
          </button>
          <button 
            onClick={() => handleFilterChange('inactivas')} 
            style={{ 
              padding: '6px 14px', 
              borderRadius: '20px', 
              border: filterActivo === 'inactivas' ? 'none' : '1px solid rgba(255,255,255,0.4)', 
              background: filterActivo === 'inactivas' ? 'white' : 'transparent', 
              color: filterActivo === 'inactivas' ? '#14532d' : 'white', 
              cursor: 'pointer', 
              fontWeight: 600, 
              fontSize: '0.85rem', 
              transition: 'all 0.2s'
            }}
          >
            🔴 Inactivas ({countInactivas})
          </button>
        </div>
      </div>

      {/* Contenedor Principal Relativo para evitar flickering con overlay */}
      <div style={{ position: 'relative', minHeight: '300px', background: 'white', borderRadius: '12px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        
        {/* Loader Overlay sin desmontar tabla */}
        {loading && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 10, background: 'rgba(255,255,255,0.65)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
            <div className="loading-spinner" style={{ width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid #16a34a', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            <span style={{ fontSize: '0.9rem', color: '#475569', fontWeight: 600 }}>Cargando partes de la planta...</span>
          </div>
        )}

        <div style={{ overflowX: 'auto', opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '12px 8px', position: 'sticky', left: 0, zIndex: 2, background: '#f8fafc', width: '80px', minWidth: '80px', textAlign: 'center', color: '#475569', fontWeight: 600 }}>📷 / Emo</th>
                <th 
                  onClick={() => handleSort('plantaspartenombre')} 
                  style={{ padding: '16px', color: '#475569', fontWeight: 600, cursor: 'pointer', userSelect: 'none' }}
                >
                  Nombre {sortField === 'plantaspartenombre' ? (sortOrder === 'asc' ? '🔼' : '🔽') : ''}
                </th>
                <th 
                  onClick={() => handleSort('plantasparteemoji')} 
                  style={{ padding: '16px', color: '#475569', fontWeight: 600, cursor: 'pointer', userSelect: 'none' }}
                >
                  Emoji {sortField === 'plantasparteemoji' ? (sortOrder === 'asc' ? '🔼' : '🔽') : ''}
                </th>
                <th style={{ padding: '16px', color: '#475569', fontWeight: 600 }}>Descripción</th>
                <th 
                  onClick={() => handleSort('plantasparteactivo')} 
                  style={{ padding: '16px', color: '#475569', fontWeight: 600, cursor: 'pointer', userSelect: 'none' }}
                >
                  Estado {sortField === 'plantasparteactivo' ? (sortOrder === 'asc' ? '🔼' : '🔽') : ''}
                </th>
                <th style={{ padding: '16px', color: '#475569', fontWeight: 600, textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {sortedData.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '0.95rem' }}>
                    No se encontraron partes de plantas registradas.
                  </td>
                </tr>
              ) : sortedData.map((item, i) => (
                <tr 
                  key={item.idplantasparte} 
                  style={{ 
                    borderBottom: '1px solid #e2e8f0', 
                    background: i % 2 === 0 ? 'white' : '#f8fafc', 
                    transition: 'background 0.2s' 
                  }}
                >
                  {/* Columna Fija (Sticky) */}
                  <td 
                    style={{ 
                      padding: '8px', 
                      position: 'sticky', 
                      left: 0, 
                      zIndex: 1, 
                      background: i % 2 === 0 ? 'white' : '#f8fafc', 
                      width: '80px', 
                      minWidth: '80px', 
                      textAlign: 'center', 
                      verticalAlign: 'middle', 
                      cursor: 'pointer' 
                    }} 
                    onClick={() => router.push(`/dashboard/admin/tareas/plantasparte/${item.idplantasparte}`)}
                    title="Editar Parte"
                  >
                    {item.primary_photo_ruta ? (
                      (() => {
                        let meta: any = {};
                        try { meta = JSON.parse(item.primary_photo_resumen || '{}'); } catch(err){}
                        let baseFilter = meta.profile_style ? STYLE_FILTERS[meta.profile_style] : 'none';
                        if (meta.profile_brightness !== undefined || meta.profile_contrast !== undefined) {
                          baseFilter = `brightness(${meta.profile_brightness ?? 100}%) contrast(${meta.profile_contrast ?? 100}%) ${meta.profile_style ? STYLE_FILTERS[meta.profile_style] : ''}`.trim();
                        }
                        return (
                          <div style={{ width: '56px', height: '56px', borderRadius: '12px', overflow: 'hidden', margin: '0 auto', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', backgroundColor: meta.dominant_color || '#f1f5f9', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {meta.blurhash && (
                              <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
                                <Blurhash hash={meta.blurhash} width="100%" height="100%" resolutionX={32} resolutionY={32} punch={1} />
                              </div>
                            )}
                            <img 
                              src={getMediaUrl(item.primary_photo_ruta)} 
                              alt={item.plantaspartenombre} 
                              style={{ 
                                width: '100%', height: '100%', objectFit: 'cover', display: 'block', position: 'relative', zIndex: 1,
                                objectPosition: `${meta.profile_object_x ?? 50}% ${meta.profile_object_y ?? 50}%`,
                                transform: `scale(${(meta.profile_object_zoom ?? 100) / 100})`,
                                filter: baseFilter
                              }} 
                              crossOrigin="anonymous"
                            />
                          </div>
                        );
                      })()
                    ) : (
                      <div style={{ width: '56px', height: '56px', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', fontSize: '1.8rem' }}>
                        {item.plantasparteemoji || '🌱'}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '16px', fontWeight: 'bold', color: '#0f172a' }}>{item.plantaspartenombre}</td>
                  <td style={{ padding: '16px', fontSize: '1.4rem' }}>{item.plantasparteemoji || '🌱'}</td>
                  <td style={{ padding: '16px', color: '#475569', fontSize: '0.88rem', maxWidth: '350px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.plantaspartedescripcion || '—'}
                  </td>
                  <td style={{ padding: '16px' }}>
                    {item.plantasparteactivo === 1 ? (
                      <span style={{ background: '#dcfce7', color: '#15803d', padding: '4px 10px', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 600 }}>🟢 Activo</span>
                    ) : (
                      <span style={{ background: '#fee2e2', color: '#b91c1c', padding: '4px 10px', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 600 }}>🔴 Inactivo</span>
                    )}
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', alignItems: 'center' }}>
                      <button 
                        onClick={() => router.push(`/dashboard/admin/tareas/plantasparte/${item.idplantasparte}`)} 
                        style={{ background: 'white', border: '1px solid #cbd5e1', color: '#475569', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 'bold', transition: 'all 0.2s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'white'; }}
                      >
                        Editar
                      </button>
                      <button 
                        onClick={() => handleToggleActivo(item)} 
                        style={{ 
                          background: item.plantasparteactivo === 1 ? '#fef9c3' : '#dcfce7', 
                          border: `1px solid ${item.plantasparteactivo === 1 ? '#fef08a' : '#bbf7d0'}`, 
                          color: item.plantasparteactivo === 1 ? '#854d0e' : '#166534', 
                          padding: '6px 12px', 
                          borderRadius: '6px', 
                          cursor: 'pointer', 
                          fontSize: '0.82rem', 
                          fontWeight: 'bold',
                          transition: 'all 0.2s'
                        }}
                      >
                        {item.plantasparteactivo === 1 ? '⚠️ Inhabilitar' : '🟢 Activar'}
                      </button>
                      <button 
                        onClick={() => handleDelete(item.idplantasparte)} 
                        style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#991b1b', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 'bold', transition: 'all 0.2s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#fecaca'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = '#fee2e2'; }}
                      >
                        🗑️ Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
