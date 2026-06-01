'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';

export default function FasesCultivoAdminPage() {
  const router = useRouter();
  const [fases, setFases] = useState<any[]>([]);
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
      setLoading(false);
    }
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

  return (
    <div className="dashboard-content" style={{ padding: '20px' }}>
      <div style={{ marginBottom: '16px' }}>
        <button onClick={() => router.push('/dashboard')} style={{ background: 'white', border: '1px solid #cbd5e1', color: '#475569', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          🏠 Volver al Inicio
        </button>
      </div>
      
      {/* ── Header ── */}
      <div style={{ background: 'linear-gradient(135deg, #0f766e, #10b981)', borderRadius: '16px', padding: '24px 28px', marginBottom: '24px', color: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800 }}>🌱 Gestión de Fases de Cultivo</h1>
            <p style={{ margin: '4px 0 0', opacity: 0.9, fontSize: '0.9rem' }}>
              Catálogo centralizado del ciclo de vida para toda la comunidad Verdantia
            </p>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
            <button 
              onClick={() => handleEdit(null)}
              style={{ padding: '8px 16px', borderRadius: '8px', background: 'white', color: '#0f766e', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.95rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
            >
              ➕ Nueva Fase
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <p>Cargando fases...</p>
      ) : (
        <div style={{ background: 'white', borderRadius: '12px', overflowX: 'auto', border: '1px solid #e2e8f0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              <tr>
                <th style={{ padding: '12px', width: '60px', textAlign: 'center' }}>Orden</th>
                <th style={{ padding: '12px', width: '60px', textAlign: 'center' }}>Icono</th>
                <th style={{ padding: '12px' }}>Nombre</th>
                <th style={{ padding: '12px' }}>Clave Interna</th>
                <th style={{ padding: '12px' }}>Color UI</th>
                <th style={{ padding: '12px' }}>Descripción</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {fases.map((f, i) => (
                <tr 
                  key={f.idfasescultivo} 
                  style={{ 
                    borderBottom: '1px solid #e2e8f0', 
                    background: i % 2 === 0 ? 'white' : '#f8fafc',
                    transition: 'all 0.5s ease'
                  }}
                >
                  <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', color: '#64748b' }}>
                    {f.fasescultivoorden}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center', fontSize: '1.5rem' }}>
                    {f.fasescultivoicono}
                  </td>
                  <td style={{ padding: '12px', fontWeight: 'bold', color: '#1e293b' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ 
                        width: '12px', height: '12px', borderRadius: '50%', 
                        backgroundColor: f.fasescultivocolor, display: 'inline-block' 
                      }}></span>
                      {f.fasescultivonombre}
                      {f.fasescultivoesfin ? (
                        <span style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fca5a5', padding: '2px 6px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 'bold' }}>
                          🏁 Fase Final
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td style={{ fontFamily: 'monospace', color: '#0f766e', background: '#ccfbf1', borderRadius: '4px', padding: '4px 8px', display: 'inline-block', margin: '8px 12px' }}>
                    {f.fasescultivoclave}
                  </td>
                  <td style={{ padding: '12px', color: '#64748b' }}>
                    {f.fasescultivocolor}
                  </td>
                  <td style={{ padding: '12px', color: '#64748b', fontSize: '0.9rem', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
              {fases.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>No hay fases de cultivo registradas.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
