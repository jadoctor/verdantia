'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';

export default function VariedadesAdminPage() {
  const router = useRouter();
  const [variedades, setVariedades] = useState<any[]>([]);
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

  const loadVariedades = async () => {
    if (!userEmail) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/variedades`, {
        headers: { 'x-user-email': userEmail }
      });
      const data = await res.json();
      setVariedades(data.variedades || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userEmail) {
      loadVariedades();
    }
  }, [userEmail]);

  const handleEdit = (id: string | null) => {
    if (id) {
      router.push(`/dashboard/admin/variedades/${id}`);
    } else {
      router.push(`/dashboard/admin/variedades/nueva`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta variedad?')) return;
    if (!userEmail) return;
    try {
      const res = await fetch(`/api/admin/variedades/${id}`, { 
        method: 'DELETE',
        headers: { 'x-user-email': userEmail }
      });
      const data = await res.json();
      if (data.success) {
        loadVariedades();
      } else {
        alert('Error: ' + data.error);
      }
    } catch (e) {
      alert('Error eliminando la variedad');
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
      <div style={{ background: 'linear-gradient(135deg, #7c3aed, #db2777)', borderRadius: '16px', padding: '24px 28px', marginBottom: '24px', color: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800 }}>🧬 Gestión de Variedades Globales</h1>
            <p style={{ margin: '4px 0 0', opacity: 0.9, fontSize: '0.9rem' }}>
              Catálogo de cultivares específicos con entidad propia (ej. Tomate Cherry, Lechuga Romana)
            </p>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
            <button 
              onClick={() => handleEdit(null)}
              style={{ padding: '8px 16px', borderRadius: '8px', background: 'white', color: '#7c3aed', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.95rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
            >
              ➕ Nueva Variedad
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <p>Cargando variedades...</p>
      ) : (
        <div style={{ background: 'white', borderRadius: '12px', overflowX: 'auto', border: '1px solid #e2e8f0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              <tr>
                <th style={{ padding: '8px', position: 'sticky', left: 0, zIndex: 2, background: '#f8fafc', width: '80px', minWidth: '80px', textAlign: 'center' }}>📷</th>
                <th style={{ padding: '12px' }}>Nombre de Variedad</th>
                <th style={{ padding: '12px' }}>Especie Padre</th>
                <th style={{ padding: '12px' }}>Tamaño</th>
                <th style={{ padding: '12px' }}>Germinación</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {variedades.map((v, i) => (
                <tr key={v.idvariedades} style={{ borderBottom: '1px solid #e2e8f0', background: i % 2 === 0 ? 'white' : '#f8fafc' }}>
                  <td style={{ padding: '8px', position: 'sticky', left: 0, zIndex: 1, background: i % 2 === 0 ? 'white' : '#f8fafc', width: '80px', minWidth: '80px', textAlign: 'center', verticalAlign: 'middle' }}>
                    {v.especiesicono ? <span style={{ fontSize: '2rem' }}>{v.especiesicono}</span> : <span style={{ fontSize: '2rem' }}>🌱</span>}
                  </td>
                  <td style={{ padding: '12px', fontWeight: 'bold', color: '#1e293b' }}>
                    <span>{v.variedadesnombre}</span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#475569', padding: '4px 10px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 600 }}>
                      {v.especiesnombre || 'Desconocida'}
                    </span>
                  </td>
                  <td style={{ padding: '12px', textTransform: 'capitalize' }}>{v.variedadestamano || '-'}</td>
                  <td style={{ padding: '12px' }}>{v.variedadesdiasgerminacion ? `${v.variedadesdiasgerminacion} d` : '-'}</td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <button 
                        onClick={() => handleEdit(v.idvariedades.toString())} 
                        style={{ background: '#f8fafc', border: '1px solid #cbd5e1', color: '#475569', cursor: 'pointer', fontSize: '0.85rem', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold' }}
                      >
                        Editar
                      </button>
                      <button onClick={() => handleDelete(v.idvariedades.toString())} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', display: 'flex', alignItems: 'center' }}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
              {variedades.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>No hay variedades con entidad propia registradas. (Las genéricas se ocultan).</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
