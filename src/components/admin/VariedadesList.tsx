// src/components/admin/VariedadesList.tsx
'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface VariedadesListProps {
  especieId?: string | null;
  userEmail: string | null;
  focusVariedadId?: string | null;
}

export default function VariedadesList({ especieId, userEmail, focusVariedadId }: VariedadesListProps) {
  const router = useRouter();
  const [variedades, setVariedades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadVariedades = async () => {
    if (!userEmail) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/variedades`, {
        headers: { 'x-user-email': userEmail },
      });
      const data = await res.json();
      const filtered = especieId
        ? (data.variedades || []).filter((v: any) => v.xvariedadesidespecies == especieId)
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
  }, [userEmail, especieId]);

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
    if (id) router.push(`/dashboard/admin/variedades/${id}`);
    else router.push(`/dashboard/admin/variedades/nueva?especieId=${especieId}`);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta variedad?')) return;
    if (!userEmail) return;
    try {
      const res = await fetch(`/api/admin/variedades/${id}`, {
        method: 'DELETE',
        headers: { 'x-user-email': userEmail },
      });
      const data = await res.json();
      if (data.success) loadVariedades();
      else alert('Error: ' + data.error);
    } catch (e) {
      alert('Error eliminando la variedad');
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ margin: 0, color: '#1e293b' }}>Variedades de esta Especie</h3>
        <button
          onClick={() => handleEdit(null)}
          style={{ padding: '8px 16px', borderRadius: '8px', background: '#7c3aed', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem', boxShadow: '0 4px 6px rgba(124, 58, 237, 0.2)' }}
        >
          ➕ Nueva Variedad
        </button>
      </div>
      {loading ? (
        <p style={{ color: '#64748b', textAlign: 'center', padding: '20px' }}>Cargando variedades...</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
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
                const isFocused = focusVariedadId && v.idvariedades.toString() === focusVariedadId.toString();
                return (
                  <tr 
                    key={v.idvariedades} 
                    id={`variedad-row-${v.idvariedades}`}
                    style={{ 
                      borderBottom: '1px solid #e2e8f0', 
                      background: isFocused ? '#f5f3ff' : (i % 2 === 0 ? 'white' : '#f8fafc'),
                      outline: isFocused ? '2px solid #7c3aed' : 'none',
                      outlineOffset: '-2px',
                      transition: 'all 0.5s ease'
                    }}
                  >
                  <td style={{ padding: '12px', fontWeight: 'bold', color: '#1e293b' }}>{v.variedadesnombre}</td>
                  <td style={{ padding: '12px', textTransform: 'capitalize', color: '#475569' }}>{v.variedadestamano || '-'}</td>
                  <td style={{ padding: '12px', color: '#475569' }}>{v.variedadesdiasgerminacion ? `${v.variedadesdiasgerminacion} d` : '-'}</td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <button
                        onClick={() => handleEdit(v.idvariedades.toString())}
                        style={{ background: '#f8fafc', border: '1px solid #cbd5e1', color: '#475569', cursor: 'pointer', fontSize: '0.8rem', padding: '4px 10px', borderRadius: '6px', fontWeight: 'bold' }}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(v.idvariedades.toString())}
                        style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem', padding: '4px 10px', borderRadius: '6px', fontWeight: 'bold' }}
                      >
                        Eliminar
                      </button>
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
  );
}
