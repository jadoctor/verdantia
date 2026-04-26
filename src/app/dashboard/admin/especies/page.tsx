'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { Blurhash } from 'react-blurhash';

export default function EspeciesAdminPage() {
  const router = useRouter();
  const [especies, setEspecies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTipo, setFilterTipo] = useState('');
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
      const res = await fetch(`/api/admin/especies${filterTipo ? `?tipo=${filterTipo}` : ''}`, {
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
  }, [filterTipo, userEmail]);

  const handleEdit = (id: string | null) => {
    if (id) {
      router.push(`/dashboard/admin/especies/${id}`);
    } else {
      router.push(`/dashboard/admin/especies/nueva`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta especie?')) return;
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

  return (
    <div className="dashboard-content" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Cuarentena de Especies</h2>
        <div style={{ display: 'flex', gap: '15px' }}>
          <select 
            value={filterTipo} 
            onChange={(e) => setFilterTipo(e.target.value)}
            style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
          >
            <option value="">Todos los tipos</option>
            <option value="hortaliza">Hortaliza</option>
            <option value="fruta">Fruta</option>
            <option value="aromatica">Aromática</option>
            <option value="leguminosa">Leguminosa</option>
            <option value="cereal">Cereal</option>
            <option value="otra">Otra</option>
          </select>
          <button 
            onClick={() => handleEdit(null)}
            style={{ padding: '8px 16px', borderRadius: '8px', background: '#10b981', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
          >
            + Nueva Especie Global
          </button>
          <button 
            onClick={() => router.push('/dashboard/admin/blog')}
            style={{ padding: '8px 16px', borderRadius: '8px', background: '#f59e0b', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            📝 Gestor de Blogs IA
          </button>
        </div>
      </div>

      {loading ? (
        <p>Cargando especies...</p>
      ) : (
        <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              <tr>
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
              {especies.map((e, i) => (
                <tr key={e.idespecies} style={{ borderBottom: '1px solid #e2e8f0', background: i % 2 === 0 ? 'white' : '#f8fafc' }}>
                  <td style={{ padding: '12px', fontWeight: 'bold', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {(() => {
                      if (e.primary_photo_ruta) {
                        let meta: any = {};
                        try { meta = JSON.parse(e.primary_photo_resumen || '{}'); } catch(err){}
                        let baseFilter = meta.profile_style ? STYLE_FILTERS[meta.profile_style] : 'none';
                        if (meta.profile_brightness !== undefined || meta.profile_contrast !== undefined) {
                          baseFilter = `brightness(${meta.profile_brightness ?? 100}%) contrast(${meta.profile_contrast ?? 100}%) ${meta.profile_style ? STYLE_FILTERS[meta.profile_style] : ''}`.trim();
                        }
                        const thumbPath = e.primary_photo_ruta.endsWith('.webp') ? e.primary_photo_ruta.replace('especies/', 'especies/thumb-') : e.primary_photo_ruta;
                        return (
                          <div style={{ width: '64px', height: '64px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, boxShadow: '0 2px 4px rgba(0,0,0,0.1)', backgroundColor: meta.dominant_color || '#f1f5f9', position: 'relative' }}>
                            {meta.blurhash && (
                              <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
                                <Blurhash hash={meta.blurhash} width="100%" height="100%" resolutionX={32} resolutionY={32} punch={1} />
                              </div>
                            )}
                            <img 
                              src={`/${thumbPath}`} 
                              onError={(ev) => {
                                if (ev.currentTarget.src.includes('thumb-')) {
                                  ev.currentTarget.src = `/${e.primary_photo_ruta}`;
                                }
                              }}
                              alt={e.especiesnombre} 
                              loading="lazy"
                              style={{ 
                                width: '100%', 
                                height: '100%', 
                                objectFit: 'cover',
                                filter: baseFilter,
                                objectPosition: `${meta.profile_object_x ?? 50}% ${meta.profile_object_y ?? 50}%`,
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
                      return e.especiesicono ? <span style={{ fontSize: '2.5rem', width: '64px', textAlign: 'center' }}>{e.especiesicono}</span> : <div style={{ width: '64px' }} />;
                    })()}
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
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    <button 
                      onClick={() => handleEdit(e.idespecies.toString())} 
                      style={{ background: '#f8fafc', border: '1px solid #cbd5e1', color: '#475569', cursor: 'pointer', fontSize: '0.85rem', padding: '6px 12px', borderRadius: '6px', marginRight: '10px', fontWeight: 'bold' }}
                    >
                      Editor de Especie Global
                    </button>
                    <button onClick={() => handleDelete(e.idespecies.toString())} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', verticalAlign: 'middle' }}>🗑️</button>
                  </td>
                </tr>
              ))}
              {especies.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>No hay especies registradas.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}
