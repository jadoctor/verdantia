'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';

interface Consumidor {
  idconsumidores: number;
  consumidoresnombre: string;
  consumidoresicono: string;
  consumidoresdescripcion: string;
  consumidoresactivo: number;
}

type SortKey = 'idconsumidores' | 'consumidoresnombre' | 'consumidoresactivo';
type SortOrder = 'asc' | 'desc';

export default function ConsumidoresDashboard() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [consumidores, setConsumidores] = useState<Consumidor[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterActive, setFilterActive] = useState<string>('all');
  
  // Sort state with sessionStorage persistence (Rule 7)
  const [sortKey, setSortKey] = useState<SortKey>('idconsumidores');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  useEffect(() => {
    const savedSortKey = sessionStorage.getItem('consumidoresSortKey') as SortKey | null;
    const savedSortOrder = sessionStorage.getItem('consumidoresSortOrder') as SortOrder | null;
    if (savedSortKey) setSortKey(savedSortKey);
    if (savedSortOrder) setSortOrder(savedSortOrder);

    const savedFilter = sessionStorage.getItem('consumidoresFilterActive');
    if (savedFilter) setFilterActive(savedFilter);
  }, []);

  const handleSort = (key: SortKey) => {
    const newOrder = sortKey === key && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortKey(key);
    setSortOrder(newOrder);
    sessionStorage.setItem('consumidoresSortKey', key);
    sessionStorage.setItem('consumidoresSortOrder', newOrder);
  };

  const handleFilter = (filter: string) => {
    setFilterActive(filter);
    sessionStorage.setItem('consumidoresFilterActive', filter);
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user?.email) {
        setUserEmail(user.email);
        fetchData(user.email);
      } else {
        router.push('/login');
      }
    });
    return () => unsub();
  }, [router]);

  const fetchData = async (email: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/consumidores', {
        headers: { 'x-user-email': email }
      });
      const data = await res.json();
      if (data.success) {
        setConsumidores(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Seguro que quieres eliminar este animal de granja?')) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/consumidores/${id}`, {
        method: 'DELETE',
        headers: { 'x-user-email': userEmail || '' }
      });
      const data = await res.json();
      if (data.success) {
        setConsumidores(prev => prev.filter(c => c.idconsumidores !== id));
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const visibleConsumidores = useMemo(() => consumidores.filter(c => c.idconsumidores !== 1), [consumidores]);

  const filteredData = useMemo(() => {
    let data = [...visibleConsumidores];
    if (filterActive === 'active') data = data.filter(c => c.consumidoresactivo === 1);
    if (filterActive === 'inactive') data = data.filter(c => c.consumidoresactivo === 0);

    data.sort((a, b) => {
      const valA = a[sortKey];
      const valB = b[sortKey];
      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortOrder === 'asc' ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
    });

    return data;
  }, [visibleConsumidores, filterActive, sortKey, sortOrder]);

  const countActive = visibleConsumidores.filter(c => c.consumidoresactivo === 1).length;
  const countInactive = visibleConsumidores.filter(c => c.consumidoresactivo === 0).length;

  return (
    <div style={{ width: '100%', boxSizing: 'border-box', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Subheader Global (Rule 7) */}
      <div style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', padding: '24px', borderRadius: '16px', marginBottom: '24px', color: 'white', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '12px' }}>
              🐰 Especies de granja
            </h1>
            <p style={{ margin: '8px 0 0', opacity: 0.9, fontSize: '1rem' }}>
              Gestión de animales que consumen especies de Verdantia
            </p>
          </div>
          <button 
            onClick={() => router.push('/dashboard/admin/consumidores/nuevo')}
            style={{ background: 'white', color: '#d97706', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
          >
            <span>➕</span> Nuevo Animal de Granja
          </button>
        </div>
        
        {/* Filtros Rápidos (Tags/Pills) */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '24px', overflowX: 'auto', paddingBottom: '4px' }}>
          <button onClick={() => handleFilter('all')} style={{ background: filterActive === 'all' ? 'rgba(255,255,255,0.2)' : 'transparent', color: 'white', border: '1px solid rgba(255,255,255,0.4)', padding: '6px 16px', borderRadius: '20px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
            Todos ({visibleConsumidores.length})
          </button>
          <button onClick={() => handleFilter('active')} style={{ background: filterActive === 'active' ? 'rgba(255,255,255,0.2)' : 'transparent', color: 'white', border: '1px solid rgba(255,255,255,0.4)', padding: '6px 16px', borderRadius: '20px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
            Activos ({countActive})
          </button>
          <button onClick={() => handleFilter('inactive')} style={{ background: filterActive === 'inactive' ? 'rgba(255,255,255,0.2)' : 'transparent', color: 'white', border: '1px solid rgba(255,255,255,0.4)', padding: '6px 16px', borderRadius: '20px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
            Inactivos ({countInactive})
          </button>
        </div>
      </div>

      {/* Carga sin Flickering (Overlay) y Tabla Zebra (Rule 7) */}
      <div style={{ position: 'relative', background: 'white', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        
        {loading && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(255,255,255,0.65)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="spinner" style={{ width: '50px', height: '50px', border: '4px solid rgba(217, 119, 6, 0.2)', borderLeftColor: '#d97706', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            <style dangerouslySetInnerHTML={{__html: `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}} />
          </div>
        )}

        <div style={{ overflowX: 'auto', opacity: loading ? 0.6 : 1, transition: 'opacity 0.3s' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0', background: '#f8fafc' }}>
                <th style={{ width: '80px', minWidth: '80px', padding: '16px', textAlign: 'center', position: 'sticky', left: 0, zIndex: 2, background: '#f8fafc', borderRight: '1px solid #e2e8f0' }}>Icono</th>
                <th onClick={() => handleSort('idconsumidores')} style={{ padding: '16px', textAlign: 'left', fontWeight: 600, color: '#475569', cursor: 'pointer' }}>ID {sortKey === 'idconsumidores' ? (sortOrder === 'asc' ? '🔼' : '🔽') : ''}</th>
                <th onClick={() => handleSort('consumidoresnombre')} style={{ padding: '16px', textAlign: 'left', fontWeight: 600, color: '#475569', cursor: 'pointer' }}>Nombre {sortKey === 'consumidoresnombre' ? (sortOrder === 'asc' ? '🔼' : '🔽') : ''}</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Descripción</th>
                <th onClick={() => handleSort('consumidoresactivo')} style={{ padding: '16px', textAlign: 'center', fontWeight: 600, color: '#475569', cursor: 'pointer' }}>Estado {sortKey === 'consumidoresactivo' ? (sortOrder === 'asc' ? '🔼' : '🔽') : ''}</th>
                <th style={{ padding: '16px', textAlign: 'right', fontWeight: 600, color: '#475569' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 && !loading && (
                <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>No hay animales de granja registrados.</td></tr>
              )}
              {filteredData.map((c, idx) => (
                <tr key={c.idconsumidores} style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 0 ? 'white' : '#f8fafc' }}>
                  {/* Columna Fija (Rule 7) */}
                  <td style={{ width: '80px', minWidth: '80px', padding: '8px', textAlign: 'center', position: 'sticky', left: 0, zIndex: 1, background: idx % 2 === 0 ? 'white' : '#f8fafc', borderRight: '1px solid #e2e8f0' }}>
                    <div 
                      onClick={() => router.push(`/dashboard/admin/consumidores/${c.idconsumidores}`)}
                      style={{ width: '56px', height: '56px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: '#f1f5f9', fontSize: '2rem', cursor: 'pointer', margin: '0 auto' }}
                      title="Editar animal de granja"
                    >
                      {c.consumidoresicono}
                    </div>
                  </td>
                  <td style={{ padding: '16px', color: '#64748b', fontWeight: 500 }}>#{c.idconsumidores}</td>
                  <td style={{ padding: '16px', fontWeight: 'bold', color: '#1e293b' }}>{c.consumidoresnombre}</td>
                  <td style={{ padding: '16px', color: '#475569', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.consumidoresdescripcion}</td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    <span style={{ background: c.consumidoresactivo ? '#dcfce7' : '#fee2e2', color: c.consumidoresactivo ? '#166534' : '#991b1b', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                      {c.consumidoresactivo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button onClick={() => router.push(`/dashboard/admin/consumidores/${c.idconsumidores}`)} style={{ background: 'white', color: '#475569', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
                        Editar
                      </button>
                      <button onClick={() => handleDelete(c.idconsumidores)} style={{ background: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
                        Eliminar
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
