'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { getMediaUrl } from '@/lib/media-url';
import '@/app/dashboard/dashboard.css';

const MDI_TO_EMOJI: Record<string, string> = {
  'mdi-water': '💧',
  'mdi-shovel': '⛏️',
  'mdi-bottle-tonic-plus': '✨',
  'mdi-content-cut': '✂️',
  'mdi-format-line-spacing': '🎋',
  'mdi-bug-check': '🛡️',
  'mdi-vector-difference': '🖐️',
  'mdi-layers': '🍂',
  'mdi-basket': '🧺',
  'mdi-agriculture': '🚜',
  'mdi-tractor': '🚜',
  'mdi-tag-outline': '🏷️'
};

export default function LaboresAdminPage() {
  const router = useRouter();
  const [labores, setLabores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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

  const loadLabores = async () => {
    if (!userEmail) return;
    try {
      setLoading(true);
      const res = await fetch('/api/admin/labores', { headers: { 'x-user-email': userEmail } });
      const data = await res.json();
      if (data.success) {
        setLabores(data.labores || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userEmail) loadLabores();
  }, [userEmail]);

  const handleDelete = async (id: number) => {
    if (!confirm('¿Seguro que quieres eliminar esta labor? Se desvinculará de todas las tareas.')) return;
    try {
      const res = await fetch(`/api/admin/labores/${id}`, {
        method: 'DELETE',
        headers: { 'x-user-email': userEmail! }
      });
      const data = await res.json();
      if (data.success) {
        loadLabores();
      } else {
        alert('Error: ' + data.error);
      }
    } catch (e) {
      alert('Error eliminando la labor.');
    }
  };

  if (loading) {
    return <div style={{ padding: '50px', textAlign: 'center' }}>Cargando Catálogo de Labores...</div>;
  }

  return (
    <div className="dashboard-content" style={{ padding: '20px' }}>
      <div style={{ marginBottom: '16px' }}>
        <button onClick={() => router.push('/dashboard')} style={{ background: 'white', border: '1px solid #cbd5e1', color: '#475569', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          🏠 Volver al Inicio
        </button>
      </div>
      {/* ── Header Integrado ── */}
      <div style={{ background: 'linear-gradient(135deg, #b45309, #f59e0b)', borderRadius: '16px', padding: '24px 28px', marginBottom: '24px', color: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800 }}>🚜 Catálogo de Labores</h1>
            <p style={{ margin: '4px 0 0', opacity: 0.9, fontSize: '0.9rem' }}>
              Gestión de labores agrícolas globales para la comunidad
            </p>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
            <button 
              style={{ padding: '8px 16px', borderRadius: '8px', background: 'white', color: '#b45309', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.95rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
              onClick={() => router.push('/dashboard/admin/labores/nueva')}
            >
              ➕ Nueva Labor
            </button>
          </div>
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: '12px', overflowX: 'auto', border: '1px solid #e2e8f0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
            <tr>
              <th style={{ padding: '12px', width: '80px', textAlign: 'center', position: 'sticky', left: 0, zIndex: 2, background: '#f8fafc' }}>Icono</th>
              <th style={{ padding: '12px' }}>Nombre</th>
              <th style={{ padding: '12px' }}>Descripción</th>
              <th style={{ padding: '12px' }}>Estado</th>
              <th style={{ padding: '12px', textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {labores.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '20px' }}>No hay labores definidas</td></tr>
            ) : (
                labores.map(labor => {
                  let icono = labor.laboresicono || '🌱';
                  if (icono.startsWith('mdi-')) icono = MDI_TO_EMOJI[icono] || '🌱';

                  return (
                    <tr key={labor.idlabores} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '8px', textAlign: 'center', verticalAlign: 'middle', position: 'sticky', left: 0, zIndex: 1, background: 'white', width: '80px', minWidth: '80px' }}>
                        {(() => {
                          if (labor.primary_photo_ruta) {
                            let meta: any = {};
                            try { meta = JSON.parse(labor.primary_photo_resumen || '{}'); } catch(err){}
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
                              <div style={{ width: '56px', height: '56px', borderRadius: '8px', overflow: 'hidden', margin: '0 auto', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', backgroundColor: meta.dominant_color || '#f1f5f9', position: 'relative' }}>
                                <img 
                                  src={getMediaUrl(labor.primary_photo_ruta)} 
                                  alt={labor.laboresnombre}
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
                          return <span style={{ fontSize: '2rem' }}>{icono}</span>;
                        })()}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ 
                            display: 'inline-block', width: '12px', height: '12px', 
                            borderRadius: '50%', backgroundColor: labor.laborescolor || '#64748b' 
                          }}></span>
                          <strong style={{ color: '#1e293b' }}>{labor.laboresnombre}</strong>
                        </div>
                      </td>
                      <td style={{ padding: '12px', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#64748b' }}>
                        {labor.laboresdescripcion}
                      </td>
                      <td style={{ padding: '12px' }}>
                        {labor.laboresactivosino === 1 
                          ? <span style={{ background: '#dcfce7', color: '#16a34a', padding: '4px 8px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 'bold' }}>Activo</span>
                          : <span style={{ background: '#f1f5f9', color: '#64748b', padding: '4px 8px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 'bold' }}>Inactivo</span>}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                          <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }} onClick={() => router.push(`/dashboard/admin/labores/${labor.idlabores}`)} title="Editar">✏️</button>
                          <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }} onClick={() => handleDelete(labor.idlabores)} title="Eliminar">🗑️</button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
    </div>
  );
}
