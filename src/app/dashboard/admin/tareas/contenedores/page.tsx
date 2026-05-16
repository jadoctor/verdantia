'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { Blurhash } from 'react-blurhash';
import { getMediaUrl } from '@/lib/media-url';

export default function ContenedoresPage() {
  const [contenedores, setContenedores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [filterUso, setFilterUso] = useState('todos');
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
    return () => unsubscribe();
  }, []);

  const loadContenedores = async () => {
    if (!userEmail) return;
    try {
      setLoading(true);
      const res = await fetch('/api/admin/contenedores', {
        headers: { 'x-user-email': userEmail }
      });
      const data = await res.json();
      if (data.contenedores) setContenedores(data.contenedores);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userEmail) {
      loadContenedores();
    }
  }, [userEmail]);

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este contenedor del catálogo?')) return;
    if (!userEmail) return;
    const res = await fetch(`/api/admin/contenedores/${id}`, { 
      method: 'DELETE',
      headers: { 'x-user-email': userEmail }
    });
    if (res.ok) {
      setContenedores(contenedores.filter(c => c.idcontenedores !== id));
    }
  };

  return (
    <div className="dashboard-content" style={{ padding: '20px' }}>
      <div style={{ marginBottom: '16px' }}>
        <button onClick={() => router.push('/dashboard')} style={{ background: 'white', border: '1px solid #cbd5e1', color: '#475569', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          🏠 Volver al Inicio
        </button>
      </div>

      <div style={{ background: 'linear-gradient(135deg, #0f766e, #10b981)', borderRadius: '16px', padding: '24px 28px', marginBottom: '24px', color: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800 }}>🌱 Gestión de Contenedores y Semilleros</h1>
            <p style={{ margin: '4px 0 0', opacity: 0.9, fontSize: '0.9rem' }}>
              Catálogo de bandejas, jiffys, macetas y jardineras para propagación y trasplante
            </p>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
            <button 
              onClick={() => router.push('/dashboard/admin/tareas/contenedores/nueva')}
              style={{ padding: '8px 16px', borderRadius: '8px', background: 'white', color: '#0f766e', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.95rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
            >
              ➕ Nuevo Contenedor
            </button>
          </div>
        </div>

        {/* ── Filtros por Etiquetas ── */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '20px', flexWrap: 'wrap' }}>
          {['todos', 'semillero', 'maceta', 'ambos'].map(f => (
             <button 
               key={f} 
               onClick={() => setFilterUso(f)} 
               style={{ 
                 padding: '6px 14px', 
                 borderRadius: '20px', 
                 border: filterUso === f ? 'none' : '1px solid rgba(255,255,255,0.4)', 
                 background: filterUso === f ? 'white' : 'transparent', 
                 color: filterUso === f ? '#0f766e' : 'white', 
                 cursor: 'pointer', 
                 fontWeight: 600, 
                 fontSize: '0.85rem', 
                 transition: 'all 0.2s',
                 boxShadow: filterUso === f ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
               }}>
                {f === 'todos' && '📦 Todos'}
                {f === 'semillero' && '🌱 Solo Semilleros'}
                {f === 'maceta' && '🪴 Solo Macetas'}
                {f === 'ambos' && '🌱/🪴 Mixtos'}
             </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Cargando catálogo de contenedores...</div>
      ) : (
        <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', overflowX: 'auto', border: '1px solid #e2e8f0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '8px', position: 'sticky', left: 0, zIndex: 2, background: '#f8fafc', width: '80px', minWidth: '80px' }}>📷</th>
                <th style={{ padding: '16px', color: '#475569', fontWeight: 600 }}>Nombre</th>
                <th style={{ padding: '16px', color: '#475569', fontWeight: 600 }}>Tipo</th>
                <th style={{ padding: '16px', color: '#475569', fontWeight: 600 }}>Uso</th>
                <th style={{ padding: '16px', color: '#475569', fontWeight: 600 }}>Alvéolos</th>
                <th style={{ padding: '16px', color: '#475569', fontWeight: 600 }}>Vol. Unit. (cc)</th>
                <th style={{ padding: '16px', color: '#475569', fontWeight: 600, textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {contenedores.filter(c => filterUso === 'todos' ? true : c.contenedoresclasificacion === filterUso).length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>No hay contenedores registrados que coincidan con este filtro.</td>
                </tr>
              ) : contenedores.filter(c => filterUso === 'todos' ? true : c.contenedoresclasificacion === filterUso).map((c, i) => (
                <tr key={c.idcontenedores} style={{ borderBottom: '1px solid #e2e8f0', background: i % 2 === 0 ? 'white' : '#f8fafc', transition: 'background 0.2s' }}>
                  <td style={{ padding: '8px', position: 'sticky', left: 0, zIndex: 1, background: i % 2 === 0 ? 'white' : '#f8fafc', width: '80px', minWidth: '80px', textAlign: 'center', verticalAlign: 'middle' }}>
                    {(() => {
                      if (c.primary_photo_ruta) {
                        let meta: any = {};
                        try { meta = JSON.parse(c.primary_photo_resumen || '{}'); } catch(err){}
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
                              src={getMediaUrl(c.primary_photo_ruta)} 
                              alt={c.contenedoresnombre} 
                              style={{ 
                                width: '100%', height: '100%', objectFit: 'cover', display: 'block', position: 'relative', zIndex: 1,
                                objectPosition: `${meta.profile_object_x ?? 50}% ${meta.profile_object_y ?? 50}%`,
                                transformOrigin: `${meta.profile_object_x ?? 50}% ${meta.profile_object_y ?? 50}%`,
                                transform: `scale(${(meta.profile_object_zoom ?? 100) / 100})`,
                                filter: baseFilter
                              }} 
                              crossOrigin="anonymous"
                            />
                          </div>
                        );
                      }
                      return <div style={{ width: '56px', height: '56px', borderRadius: '8px', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', color: '#94a3b8', fontSize: '1.2rem' }}>📦</div>;
                    })()}
                  </td>
                  <td style={{ padding: '16px', fontWeight: 'bold', color: '#0f172a' }}>{c.contenedoresnombre}</td>
                  <td style={{ padding: '16px' }}>
                    <span style={{ background: '#e0e7ff', color: '#3730a3', padding: '4px 10px', borderRadius: '16px', fontSize: '0.8rem', fontWeight: 500 }}>
                      {c.contenedorestipo.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '16px' }}>
                    {c.contenedoresclasificacion === 'semillero' && <span style={{ background: '#dcfce7', color: '#166534', padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem' }}>🌱 Semillero</span>}
                    {c.contenedoresclasificacion === 'maceta' && <span style={{ background: '#fef9c3', color: '#854d0e', padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem' }}>🪴 Maceta</span>}
                    {c.contenedoresclasificacion === 'ambos' && <span style={{ background: '#e2e8f0', color: '#334155', padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem' }}>🌱/🪴 Ambos</span>}
                  </td>
                  <td style={{ padding: '16px', color: '#475569' }}>{c.contenedorescantidadalveolos}</td>
                  <td style={{ padding: '16px', color: '#475569' }}>{c.contenedoresvolumenalveolocc} cc</td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <button onClick={() => router.push(`/dashboard/admin/tareas/contenedores/${c.idcontenedores}`)} style={{ background: '#f8fafc', border: '1px solid #cbd5e1', color: '#475569', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' }}>✏️ Editar</button>
                      <button onClick={() => handleDelete(c.idcontenedores)} style={{ background: 'none', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '1.2rem', display: 'flex', alignItems: 'center' }}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
