'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { Blurhash } from 'react-blurhash';
import { getMediaUrl } from '@/lib/media-url';

export default function EspeciesAdminPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const focusParam = searchParams.get('focus');
  const [especies, setEspecies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTipo, setFilterTipo] = useState('');
  const [filter, setFilter] = useState<'activas' | 'inactivas' | 'todas'>('activas');
  const [userEmail, setUserEmail] = useState<string | null>(null);

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

  const loadEspecies = async () => {
    if (!userEmail) return;
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (filterTipo) queryParams.set('tipo', filterTipo);
      queryParams.set('filter', filter);
      const res = await fetch(`/api/admin/especies?${queryParams.toString()}`, {
        headers: { 'x-user-email': userEmail }
      });
      const data = await res.json();
      setEspecies(data.especies || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userEmail) {
      loadEspecies();
    }
  }, [filterTipo, filter, userEmail]);

  useEffect(() => {
    if (!loading && focusParam) {
      setTimeout(() => {
        const element = document.getElementById(`especie-row-${focusParam}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 500);
    }
  }, [loading, focusParam]);

  const handleEdit = (id: string | null) => {
    if (id) {
      router.push(`/dashboard/admin/especies/${id}`);
    } else {
      router.push(`/dashboard/admin/especies/nueva`);
    }
  };

  const handleDelete = async (id: string, hasDependencies: boolean) => {
    const message = hasDependencies
      ? 'Esta especie tiene variedades específicas, semillas o cultivos asociados.\n\nNo se puede eliminar físicamente de la base de datos para no dañar sus registros, pero se INHABILITARÁ (dejará de estar visible en el catálogo general).\n\n¿Quieres inhabilitarla?'
      : '¿Estás seguro de que quieres eliminar esta especie?';

    if (!confirm(message)) return;
    if (!userEmail) return;
    try {
      const res = await fetch(`/api/admin/especies/${id}`, { 
        method: 'DELETE',
        headers: { 'x-user-email': userEmail }
      });
      const data = await res.json();
      if (data.success) {
        loadEspecies();
      } else {
        alert('Error: ' + data.error);
      }
    } catch (e) {
      alert('Error eliminando la especie');
    }
  };

  const handleReactivate = async (id: string) => {
    if (!userEmail) return;
    try {
      const res = await fetch(`/api/admin/especies/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-email': userEmail 
        },
        body: JSON.stringify({ especiesvisibilidadsino: 1 })
      });
      if (res.ok) {
        loadEspecies();
      } else {
        alert('Error al reactivar la especie');
      }
    } catch (e) {
      alert('Error de red al reactivar la especie');
    }
  };

  return (
    <div className="dashboard-content" style={{ padding: '20px' }}>
      <div style={{ marginBottom: '16px' }}>
        <button onClick={() => router.push('/dashboard')} style={{ background: 'white', border: '1px solid #cbd5e1', color: '#475569', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          🏠 Volver al Inicio
        </button>
      </div>
      {/* ── Header ── */}
      <div style={{ background: 'linear-gradient(135deg, #0f766e, #10b981)', borderRadius: '16px', padding: '24px 28px', marginBottom: '24px', color: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', flexWrap: 'wrap', gap: '32px', marginBottom: '20px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800 }}>🌍 Gestión de Especies Globales</h1>
            <p style={{ margin: '4px 0 0', opacity: 0.9, fontSize: '0.9rem' }}>
              Catálogo centralizado para toda la comunidad Verdantia
            </p>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
            <button 
              onClick={() => router.push('/dashboard/admin/blog')}
              style={{
                padding: '8px 16px', borderRadius: '8px', background: 'rgba(255,255,255,0.2)', color: 'white',
                border: '1px solid rgba(255,255,255,0.4)', cursor: 'pointer', fontWeight: 'bold',
                display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s'
              }}
              onMouseOver={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseOut={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              📝 Gestor de Blogs IA
            </button>
            <button 
              onClick={() => handleEdit(null)}
              style={{
                padding: '8px 16px', borderRadius: '8px', background: 'white', color: '#0f766e',
                border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.95rem',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)', transition: 'all 0.2s', display: 'flex',
                alignItems: 'center', gap: '6px'
              }}
              onMouseOver={e => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 12px rgba(0,0,0,0.15)';
              }}
              onMouseOut={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
              }}
            >
              ➕ Nueva Especie
            </button>
          </div>
        </div>

        {/* Tags de filtros */}
        <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', flexWrap: 'wrap', gap: '24px', borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '16px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {[
              { value: '', label: '🌱 Todas' },
              { value: 'hortaliza', label: '🥦 Hortalizas' },
              { value: 'fruta', label: '🍎 Frutas' },
              { value: 'aromatica', label: '🌿 Aromáticas' },
              { value: 'leguminosa', label: '🫘 Leguminosas' },
              { value: 'cereal', label: '🌾 Cereales' },
              { value: 'otra', label: '🌼 Otras' }
            ].map((tag) => {
              const isSelected = filterTipo === tag.value;
              return (
                <button
                  key={tag.value}
                  type="button"
                  onClick={() => setFilterTipo(tag.value)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    border: isSelected ? '1px solid white' : '1px solid rgba(255,255,255,0.3)',
                    background: isSelected ? 'white' : 'rgba(255,255,255,0.1)',
                    color: isSelected ? '#0f766e' : 'white',
                    fontWeight: 'bold',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: isSelected ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
                  }}
                  onMouseOver={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.6)';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
                    }
                  }}
                >
                  {tag.label}
                </button>
              );
            })}
          </div>

          {/* Filtro Activo/Inactivo */}
          <div style={{ display: 'inline-flex', background: 'rgba(255, 255, 255, 0.15)', padding: '4px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.25)', gap: '4px' }}>
            {(['activas', 'inactivas', 'todas'] as const).map((opt) => {
              const isActive = filter === opt;
              const labels = {
                activas: '🟢 Activas',
                inactivas: '🔴 Inactivas',
                todas: '👁️ Todas'
              };
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setFilter(opt)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '6px',
                    border: 'none',
                    background: isActive ? 'white' : 'transparent',
                    color: isActive ? '#0f766e' : 'white',
                    fontWeight: 'bold',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                  }}
                >
                  {labels[opt]}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ position: 'relative', minHeight: '200px' }}>
        {loading && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(255, 255, 255, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            borderRadius: '12px',
            backdropFilter: 'blur(1px)'
          }}>
            <style>{`
              @keyframes spin-loader {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                border: '3px solid #cbd5e1',
                borderTop: '3px solid #0f766e',
                borderRadius: '50%',
                animation: 'spin-loader 0.8s linear infinite'
              }} />
              <span style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 'bold' }}>Cargando especies...</span>
            </div>
          </div>
        )}

        {especies.length === 0 && !loading ? (
          <p style={{ color: '#64748b', textAlign: 'center', padding: '40px', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>No hay especies registradas.</p>
        ) : (
          <div style={{ background: 'white', borderRadius: '12px', overflowX: 'auto', border: '1px solid #e2e8f0', opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s ease' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <tr>
                  <th style={{ padding: '8px', position: 'sticky', left: 0, zIndex: 2, background: '#f8fafc', width: '80px', minWidth: '80px' }}>📷</th>
                  <th style={{ padding: '12px' }}>Nombre</th>
                  <th style={{ padding: '12px' }}>Científico</th>
                  <th style={{ padding: '12px' }}>Familia</th>
                  <th style={{ padding: '12px' }}>Tipo</th>
                  <th style={{ padding: '12px' }}>Germinación</th>
                  <th style={{ padding: '12px' }}>🌙 Biodinámica</th>
                  <th style={{ padding: '12px' }}>Variedades</th>
                  <th style={{ padding: '12px' }}>Global</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {especies.map((e, i) => {
                  const isFocused = focusParam && e.idespecies.toString() === focusParam.toString();
                  const hasDependencies = e.total_variedades > 0 || 
                                          (e.total_semillas || 0) > 0 || 
                                          (e.total_cultivos || 0) > 0 ||
                                          e.xespeciesidusuarios !== null ||
                                          (e.total_especiesusuarios || 0) > 0 ||
                                          (e.total_variedadesusuarios || 0) > 0 ||
                                          (e.total_asociacionesbeneficiosas || 0) > 0 ||
                                          (e.total_asociacionesperjudiciales || 0) > 0 ||
                                          (e.total_especiesplagas || 0) > 0;
                  return (
                    <tr 
                      key={e.idespecies} 
                      id={`especie-row-${e.idespecies}`}
                      style={{ 
                        borderBottom: '1px solid #e2e8f0', 
                        background: isFocused ? '#f0fdf4' : (e.especiesvisibilidadsino === 0 ? '#f1f5f9' : (i % 2 === 0 ? 'white' : '#f8fafc')),
                        opacity: e.especiesvisibilidadsino === 0 ? 0.65 : 1,
                        outline: isFocused ? '2px solid #10b981' : 'none',
                        outlineOffset: '-2px',
                        transition: 'all 0.5s ease'
                      }}
                    >
                    <td style={{ padding: '8px', position: 'sticky', left: 0, zIndex: 1, background: i % 2 === 0 ? 'white' : '#f8fafc', width: '80px', minWidth: '80px', textAlign: 'center', verticalAlign: 'middle' }}>
                      {(() => {
                        if (e.primary_photo_ruta) {
                          let meta: any = {};
                          try { meta = JSON.parse(e.primary_photo_resumen || '{}'); } catch(err){}
                          let baseFilter = meta.profile_style ? STYLE_FILTERS[meta.profile_style] : 'none';
                          if (meta.profile_brightness !== undefined || meta.profile_contrast !== undefined) {
                            baseFilter = `brightness(${meta.profile_brightness ?? 100}%) contrast(${meta.profile_contrast ?? 100}%) ${meta.profile_style ? STYLE_FILTERS[meta.profile_style] : ''}`.trim();
                          }
                          return (
                            <div style={{ width: '56px', height: '56px', borderRadius: '8px', overflow: 'hidden', margin: '0 auto', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', backgroundColor: meta.dominant_color || '#f1f5f9', position: 'relative' }}>
                              {meta.blurhash && (
                                <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
                                  <Blurhash hash={meta.blurhash} width="100%" height="100%" resolutionX={32} resolutionY={32} punch={1} />
                                </div>
                              )}
                              <img 
                                src={getMediaUrl(e.primary_photo_ruta)} 
                                alt={e.especiesnombre} 
                                crossOrigin="anonymous"
                                loading="lazy"
                                style={{ 
                                  width: '100%', 
                                  height: '100%', 
                                  objectFit: 'cover',
                                  filter: baseFilter,
                                  objectPosition: `${meta.profile_object_x ?? 50}% ${meta.profile_object_y ?? 50}%`,
                                  transformOrigin: `${meta.profile_object_x ?? 50}% ${meta.profile_object_y ?? 50}%`,
                                  transform: `scale(${(meta.profile_object_zoom ?? 100) / 100})`,
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  zIndex: 1
                                }} 
                              />
                            </div>
                          );
                        }
                        return e.especiesicono ? <span style={{ fontSize: '2rem' }}>{e.especiesicono}</span> : <div style={{ width: '56px', height: '56px' }} />;
                      })()}
                    </td>
                    <td style={{ padding: '12px', fontWeight: 'bold', color: '#1e293b' }}>
                      <span>{e.especiesnombre}</span>
                    </td>
                    <td style={{ padding: '12px', fontStyle: 'italic', color: '#64748b' }}>{e.especiesnombrecientifico || '-'}</td>
                    <td style={{ padding: '12px' }}>{e.especiesfamilia || '-'}</td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {e.especiestipo?.split(',').map((t: string) => (
                          <span key={t} style={{ background: '#dcfce7', color: '#16a34a', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem' }}>{t}</span>
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: '12px' }}>{e.especiesdiasgerminacion ? `${e.especiesdiasgerminacion} d` : '-'}</td>
                    <td style={{ padding: '12px' }}>
                      {e.especiesbiodinamicacategoria ? (
                        <span style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', padding: '2px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600 }}>
                          {({ fruto: '🍅 Fruto', raiz: '🥕 Raíz', hoja: '🥬 Hoja', flor: '🌸 Flor' } as Record<string, string>)[e.especiesbiodinamicacategoria] || e.especiesbiodinamicacategoria}
                        </span>
                      ) : <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>—</span>}
                    </td>
                    <td style={{ padding: '12px', fontWeight: 'bold' }}>{e.total_variedades}</td>
                    <td style={{ padding: '12px' }}>
                      {e.especiesvisibilidadsino ? (
                        <span style={{ background: '#dcfce7', color: '#16a34a', padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem' }}>🌍 Global</span>
                      ) : (
                        <span style={{ background: '#fef3c7', color: '#d97706', padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem' }}>👤 Privada</span>
                      )}
                    </td>
                    <td style={{ padding: '12px', width: '295px', minWidth: '295px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '85px 95px 85px', gap: '8px', alignItems: 'center' }}>
                        {/* Col 1: Editor */}
                        <button 
                          onClick={() => handleEdit(e.idespecies.toString())} 
                          style={{ background: '#f8fafc', border: '1px solid #cbd5e1', color: '#475569', cursor: 'pointer', fontSize: '0.8rem', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold', width: '100%', textAlign: 'center' }}
                        >
                          Editar
                        </button>

                        {/* Col 2: Reactivar / Inhabilitar */}
                        {e.especiesvisibilidadsino === 0 ? (
                          <button
                            onClick={() => handleReactivate(e.idespecies.toString())}
                            style={{
                              background: '#ecfdf5',
                              border: '1px solid #a7f3d0',
                              color: '#059669',
                              cursor: 'pointer',
                              fontSize: '0.8rem',
                              padding: '6px 12px',
                              borderRadius: '6px',
                              fontWeight: 'bold',
                              transition: 'all 0.2s ease',
                              width: '100%',
                              textAlign: 'center'
                            }}
                            onMouseOver={evt => evt.currentTarget.style.background = '#d1fae5'}
                            onMouseOut={evt => evt.currentTarget.style.background = '#ecfdf5'}
                          >
                            Reactivar
                          </button>
                        ) : hasDependencies ? (
                          <button
                            onClick={() => handleDelete(e.idespecies.toString(), true)}
                            style={{
                              background: '#fef3c7',
                              border: '1px solid #fde68a',
                              color: '#d97706',
                              cursor: 'pointer',
                              fontSize: '0.8rem',
                              padding: '6px 12px',
                              borderRadius: '6px',
                              fontWeight: 'bold',
                              transition: 'all 0.2s ease',
                              width: '100%',
                              textAlign: 'center'
                            }}
                            onMouseOver={evt => evt.currentTarget.style.background = '#fef08a'}
                            onMouseOut={evt => evt.currentTarget.style.background = '#fef3c7'}
                          >
                            Inhabilitar
                          </button>
                        ) : (
                          <div />
                        )}

                        {/* Col 3: Eliminar */}
                        {!hasDependencies ? (
                          <button
                            onClick={() => handleDelete(e.idespecies.toString(), false)}
                            style={{
                              background: '#fee2e2',
                              border: '1px solid #fca5a5',
                              color: '#ef4444',
                              cursor: 'pointer',
                              fontSize: '0.8rem',
                              padding: '6px 12px',
                              borderRadius: '6px',
                              fontWeight: 'bold',
                              transition: 'all 0.2s ease',
                              width: '100%',
                              textAlign: 'center'
                            }}
                            onMouseOver={evt => evt.currentTarget.style.background = '#fecaca'}
                            onMouseOut={evt => evt.currentTarget.style.background = '#fee2e2'}
                          >
                            Eliminar
                          </button>
                        ) : (
                          <div />
                        )}
                      </div>
                    </td>
                  </tr>
                  );
                })}
                {especies.length === 0 && (
                  <tr>
                    <td colSpan={10} style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>No hay especies registradas.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
