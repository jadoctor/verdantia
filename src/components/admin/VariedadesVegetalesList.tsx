// src/components/admin/VariedadesVegetalesList.tsx
'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getMediaUrl } from '@/lib/media-url';

interface VariedadesVegetalesListProps {
  especieId?: string | null;
  userEmail: string | null;
  focusVariedadId?: string | null;
  especieNombre?: string;
}

export default function VariedadesVegetalesList({ especieId, userEmail, focusVariedadId, especieNombre }: VariedadesVegetalesListProps) {
  const router = useRouter();
  const [variedades, setVariedades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'activas' | 'inactivas' | 'todas'>('activas');

  const loadVariedades = async () => {
    if (!userEmail) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/variedadesvegetales?filter=${filter}`, {
        headers: { 'x-user-email': userEmail },
      });
      const data = await res.json();
      const filtered = especieId
        ? (data.variedades || []).filter((v: any) => v.xvariedadesvegetalesidespeciesvegetales == especieId)
        : data.variedades || [];
      setVariedades(filtered);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userEmail) loadVariedades();
  }, [userEmail, especieId, filter]);

  useEffect(() => {
    if (!loading && focusVariedadId) {
      setTimeout(() => {
        const element = document.getElementById(`variedad-row-${focusVariedadId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 500);
    }
  }, [loading, focusVariedadId]);

  const handleEdit = (id: string | null) => {
    if (id) router.push(`/dashboard/admin/variedadesvegetales/${id}`);
    else router.push(`/dashboard/admin/variedadesvegetales/nueva?especieId=${especieId}`);
  };

  const handleDelete = async (id: string) => {
    const variety = variedades.find(v => v.idvariedadesvegetales.toString() === id);
    const isUsed = variety && (
      (variety.total_asociaciones || 0) > 0 || 
      (variety.total_semillas || 0) > 0 || 
      (variety.total_cultivos || 0) > 0
    );

    const message = isUsed 
      ? 'Esta variedad está siendo utilizada por usuarios, cultivos o inventarios de semillas.\n\nNo se puede eliminar físicamente de la base de datos para no dañar sus registros, pero se INHABILITARÁ (dejará de estar visible en el catálogo general).\n\n¿Quieres inhabilitarla?'
      : '¿Estás seguro de que quieres eliminar esta variedad?';

    if (!confirm(message)) return;
    if (!userEmail) return;
    try {
      const res = await fetch(`/api/admin/variedadesvegetales/${id}`, {
        method: 'DELETE',
        headers: { 'x-user-email': userEmail },
      });
      const data = await res.json();
      if (data.success) {
        loadVariedades();
      } else {
        alert('Error: ' + data.error);
      }
    } catch (e) {
      alert('Error al realizar la operación');
    }
  };

  const handleReactivate = async (id: string) => {
    if (!userEmail) return;
    try {
      const res = await fetch(`/api/admin/variedadesvegetales/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-email': userEmail 
        },
        body: JSON.stringify({ variedadesvegetalesvisibilidadsino: 1 })
      });
      if (res.ok) {
        loadVariedades();
      } else {
        alert('Error al reactivar la variedad');
      }
    } catch (e) {
      alert('Error de red al reactivar la variedad');
    }
  };

  if (!especieId) {
    return (
      <div style={{ background: '#f8fafc', padding: '30px', textAlign: 'center', borderRadius: '12px', border: '1px dashed #cbd5e1', color: '#64748b' }}>
        <p>Debes guardar la especie primero para gestionar sus variedades.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
      {/* Barra de acciones: Filtros primero, luego botón añadir */}
      <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <div style={{ display: 'inline-flex', background: '#f1f5f9', padding: '4px', borderRadius: '8px', border: '1px solid #cbd5e1', gap: '4px' }}>
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
                  color: isActive ? '#1e293b' : '#475569',
                  fontWeight: 'bold',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
                }}
              >
                {labels[opt]}
              </button>
            );
          })}
        </div>
        <button
          onClick={() => handleEdit(null)}
          style={{ padding: '8px 16px', borderRadius: '8px', background: '#10b981', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem', boxShadow: '0 4px 6px rgba(16, 185, 129, 0.2)' }}
        >
          ➕ Nueva Variedad
        </button>
      </div>

      <div style={{ position: 'relative', minHeight: '200px', marginTop: '20px' }}>
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
                borderTop: '3px solid #7c3aed',
                borderRadius: '50%',
                animation: 'spin-loader 0.8s linear infinite'
              }} />
              <span style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 'bold' }}>Cargando variedades...</span>
            </div>
          </div>
        )}

        {variedades.length === 0 && !loading ? (
          <div style={{ padding: '40px', textAlign: 'center', background: '#f8fafc', borderRadius: '12px', border: '2px dashed #cbd5e1' }}>
            <p style={{ color: '#64748b', fontSize: '1.1rem', margin: '0 0 10px 0' }}>No hay variedades registradas para esta especie.</p>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0 }}>Usa el botón &quot;✨ Asistente IA&quot; de la barra superior para que la IA proponga variedades, o añade una manualmente.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s ease' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <tr>
                  <th style={{ padding: '12px', color: '#475569', fontSize: '0.85rem' }}>Nombre de Variedad</th>
                  <th style={{ padding: '12px', color: '#475569', fontSize: '0.85rem' }}>Tamaño</th>
                  <th style={{ padding: '12px', color: '#475569', fontSize: '0.85rem' }}>Germinación</th>
                  <th style={{ padding: '12px', textAlign: 'right', color: '#475569', fontSize: '0.85rem' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {variedades.map((v, i) => {
                  const isFocused = focusVariedadId && v.idvariedadesvegetales.toString() === focusVariedadId.toString();
                  return (
                    <tr 
                      key={v.idvariedadesvegetales} 
                      id={`variedad-row-${v.idvariedadesvegetales}`}
                      style={{ 
                        borderBottom: '1px solid #e2e8f0', 
                        background: isFocused ? '#f5f3ff' : (v.variedadesvegetalesvisibilidadsino === 0 ? '#f1f5f9' : (i % 2 === 0 ? 'white' : '#f8fafc')),
                        opacity: v.variedadesvegetalesvisibilidadsino === 0 ? 0.65 : 1,
                        outline: isFocused ? '2px solid #7c3aed' : 'none',
                        outlineOffset: '-2px',
                        transition: 'all 0.5s ease'
                      }}
                    >
                      <td style={{ padding: '12px', fontWeight: 'bold', color: '#1e293b' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {v.primary_photo_ruta ? (
                            <img 
                              src={getMediaUrl(v.primary_photo_ruta)} 
                              alt={v.variedadesvegetalesnombre} 
                              style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }} 
                              crossOrigin="anonymous"
                            />
                          ) : (
                            <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'linear-gradient(135deg, #f1f5f9, #e2e8f0)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', color: '#94a3b8', border: '1px dashed #cbd5e1' }} title="Sin foto">
                              🌱
                            </div>
                          )}
                          <span>{v.variedadesvegetalesnombre}</span>
                          {v.variedadesvegetalesvisibilidadsino === 0 && (
                            <span style={{ fontSize: '0.7rem', background: '#fee2e2', color: '#b91c1c', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              Inactiva
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '12px', textTransform: 'capitalize', color: '#475569' }}>{v.variedadesvegetalestamano || '-'}</td>
                      <td style={{ padding: '12px', color: '#475569' }}>{v.variedadesvegetalesdiasgerminacion ? `${v.variedadesvegetalesdiasgerminacion} d` : '-'}</td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                          <button
                            onClick={() => handleEdit(v.idvariedadesvegetales.toString())}
                            style={{ background: '#f8fafc', border: '1px solid #cbd5e1', color: '#475569', cursor: 'pointer', fontSize: '0.8rem', padding: '4px 10px', borderRadius: '6px', fontWeight: 'bold' }}
                          >
                            Editar
                          </button>
                          {v.variedadesvegetalesvisibilidadsino === 0 ? (
                            <button
                              onClick={() => handleReactivate(v.idvariedadesvegetales.toString())}
                              style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#059669', cursor: 'pointer', fontSize: '0.8rem', padding: '4px 10px', borderRadius: '6px', fontWeight: 'bold' }}
                            >
                              Reactivar
                            </button>
                          ) : (
                            <button
                              onClick={() => handleDelete(v.idvariedadesvegetales.toString())}
                              style={{ 
                                background: ((v.total_asociaciones || 0) > 0 || (v.total_semillas || 0) > 0 || (v.total_cultivos || 0) > 0) ? '#fef3c7' : '#fee2e2', 
                                border: ((v.total_asociaciones || 0) > 0 || (v.total_semillas || 0) > 0 || (v.total_cultivos || 0) > 0) ? '1px solid #fde68a' : '1px solid #fca5a5', 
                                color: ((v.total_asociaciones || 0) > 0 || (v.total_semillas || 0) > 0 || (v.total_cultivos || 0) > 0) ? '#d97706' : '#ef4444', 
                                cursor: 'pointer', 
                                fontSize: '0.8rem', 
                                padding: '4px 10px', 
                                borderRadius: '6px', 
                                fontWeight: 'bold' 
                              }}
                            >
                              {((v.total_asociaciones || 0) > 0 || (v.total_semillas || 0) > 0 || (v.total_cultivos || 0) > 0) ? 'Inhabilitar' : 'Eliminar'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {variedades.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>No hay variedades registradas para esta especie.</td>
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
