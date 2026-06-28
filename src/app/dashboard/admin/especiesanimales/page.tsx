'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import PremiumAddButton from '@/components/ui/PremiumAddButton';
import PremiumEditButton from '@/components/ui/PremiumEditButton';

interface Animal {
  idespeciesanimales: number;
  especiesanimalesnombre: string;
  especiesanimalesicono: string;
  especiesanimalesdescripcion: string;
  especiesanimalesactivo: number;
}

type SortKey = 'idespeciesanimales' | 'especiesanimalesnombre' | 'especiesanimalesactivo';
type SortOrder = 'asc' | 'desc';

export default function AnimalesDashboard() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [animales, setAnimales] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterActive, setFilterActive] = useState<string>('all');
  
  // Sort state with sessionStorage persistence (Rule 7)
  const [sortKey, setSortKey] = useState<SortKey>('idespeciesanimales');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  useEffect(() => {
    const savedSortKey = sessionStorage.getItem('animalesSortKey') as SortKey | null;
    const savedSortOrder = sessionStorage.getItem('animalesSortOrder') as SortOrder | null;
    if (savedSortKey) setSortKey(savedSortKey);
    if (savedSortOrder) setSortOrder(savedSortOrder);

    const savedFilter = sessionStorage.getItem('animalesFilterActive');
    if (savedFilter) setFilterActive(savedFilter);
  }, []);

  const handleSort = (key: SortKey) => {
    const newOrder = sortKey === key && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortKey(key);
    setSortOrder(newOrder);
    sessionStorage.setItem('animalesSortKey', key);
    sessionStorage.setItem('animalesSortOrder', newOrder);
  };

  const handleFilter = (filter: string) => {
    setFilterActive(filter);
    sessionStorage.setItem('animalesFilterActive', filter);
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
      const res = await fetch('/api/admin/especiesanimales', {
        headers: { 'x-user-email': email }
      });
      const data = await res.json();
      if (data.success) {
        setAnimales(data.data);
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
      const res = await fetch(`/api/admin/especiesanimales/${id}`, {
        method: 'DELETE',
        headers: { 'x-user-email': userEmail || '' }
      });
      const data = await res.json();
      if (data.success) {
        setAnimales(prev => prev.filter(c => c.idespeciesanimales !== id));
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const visibleAnimales = useMemo(() => animales.filter(c => c.idespeciesanimales !== 1), [animales]);

  const filteredData = useMemo(() => {
    let data = [...visibleAnimales];
    if (filterActive === 'active') data = data.filter(c => c.especiesanimalesactivo === 1);
    if (filterActive === 'inactive') data = data.filter(c => c.especiesanimalesactivo === 0);

    data.sort((a, b) => {
      const valA = a[sortKey];
      const valB = b[sortKey];
      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortOrder === 'asc' ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
    });

    return data;
  }, [visibleAnimales, filterActive, sortKey, sortOrder]);

  const countActive = visibleAnimales.filter(c => c.especiesanimalesactivo === 1).length;
  const countInactive = visibleAnimales.filter(c => c.especiesanimalesactivo === 0).length;

  return (
    <div style={{ width: '100%', boxSizing: 'border-box', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Subheader Global (Rule 7) */}
      <div style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', padding: '24px', borderRadius: '16px', marginBottom: '24px', color: 'white', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '12px' }}>
              🐰 Especies animales
            </h1>
            <p style={{ margin: '8px 0 0', opacity: 0.9, fontSize: '1rem' }}>
              Gestión de animales de granja de Verdantia
            </p>
          </div>
          <PremiumAddButton 
            onClick={() => router.push('/dashboard/admin/especiesanimales/nuevo')} 
            text="➕ Nueva Especie Animal"
          />
        </div>
        
        {/* Filtros Rápidos (Tags/Pills) */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '24px', overflowX: 'auto', paddingBottom: '4px' }}>
          <button onClick={() => handleFilter('all')} style={{ background: filterActive === 'all' ? 'rgba(255,255,255,0.2)' : 'transparent', color: 'white', border: '1px solid rgba(255,255,255,0.4)', padding: '6px 16px', borderRadius: '20px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
            Todos ({visibleAnimales.length})
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
                <th onClick={() => handleSort('idespeciesanimales')} style={{ padding: '16px', textAlign: 'left', fontWeight: 600, color: '#475569', cursor: 'pointer' }}>ID {sortKey === 'idespeciesanimales' ? (sortOrder === 'asc' ? '🔼' : '🔽') : ''}</th>
                <th onClick={() => handleSort('especiesanimalesnombre')} style={{ padding: '16px', textAlign: 'left', fontWeight: 600, color: '#475569', cursor: 'pointer' }}>Nombre {sortKey === 'especiesanimalesnombre' ? (sortOrder === 'asc' ? '🔼' : '🔽') : ''}</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Descripción</th>
                <th onClick={() => handleSort('especiesanimalesactivo')} style={{ padding: '16px', textAlign: 'center', fontWeight: 600, color: '#475569', cursor: 'pointer' }}>Estado {sortKey === 'especiesanimalesactivo' ? (sortOrder === 'asc' ? '🔼' : '🔽') : ''}</th>
                <th style={{ padding: '16px', textAlign: 'right', fontWeight: 600, color: '#475569' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 && !loading && (
                <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>No hay animales de granja registrados.</td></tr>
              )}
              {filteredData.map((c, idx) => (
                <tr key={c.idespeciesanimales} style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 0 ? 'white' : '#f8fafc' }}>
                  {/* Columna Fija (Rule 7) */}
                  <td style={{ width: '80px', minWidth: '80px', padding: '8px', textAlign: 'center', position: 'sticky', left: 0, zIndex: 1, background: idx % 2 === 0 ? 'white' : '#f8fafc', borderRight: '1px solid #e2e8f0' }}>
                    <div 
                      onClick={() => router.push(`/dashboard/admin/especiesanimales/${c.idespeciesanimales}`)}
                      style={{ width: '56px', height: '56px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: '#f1f5f9', fontSize: '2rem', cursor: 'pointer', margin: '0 auto' }}
                      title="Editar animal de granja"
                    >
                      {c.especiesanimalesicono}
                    </div>
                  </td>
                  <td style={{ padding: '16px', color: '#64748b', fontWeight: 500 }}>#{c.idespeciesanimales}</td>
                  <td style={{ padding: '16px', fontWeight: 'bold', color: '#1e293b' }}>{c.especiesanimalesnombre}</td>
                  <td style={{ padding: '16px', color: '#475569', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.especiesanimalesdescripcion}</td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    <span style={{ background: c.especiesanimalesactivo ? '#dcfce7' : '#fee2e2', color: c.especiesanimalesactivo ? '#166534' : '#991b1b', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                      {c.especiesanimalesactivo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <PremiumEditButton onClick={() => router.push(`/dashboard/admin/especiesanimales/${c.idespeciesanimales}`)} />
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
