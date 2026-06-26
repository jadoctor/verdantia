'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getMediaUrl } from '@/lib/media-url';
import Link from 'next/link';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';

export default function SuperadminUsoIAPage() {
  const router = useRouter();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  
  // Persisted state
  const [periodo, setPeriodo] = useState('mes');
  const [sortCol, setSortCol] = useState('total_interacciones');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  
  const scrollRestored = useRef(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserEmail(user.email);
        fetchData(periodo, user.email!);
      } else {
        router.push('/login');
      }
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    // Restore state from sessionStorage
    const savedPeriodo = sessionStorage.getItem('admin_usoia_periodo');
    if (savedPeriodo) setPeriodo(savedPeriodo);
    
    const savedSortCol = sessionStorage.getItem('admin_usoia_sortCol');
    if (savedSortCol) setSortCol(savedSortCol);
    
    const savedSortDir = sessionStorage.getItem('admin_usoia_sortDir') as 'asc' | 'desc';
    if (savedSortDir) setSortDir(savedSortDir);
  }, []);

  const fetchData = async (currentPeriod: string, email?: string) => {
    const targetEmail = email || userEmail;
    if (!targetEmail) return;

    setIsFiltering(true);
    try {
      const res = await fetch(`/api/admin/uso-ia?periodo=${currentPeriod}`, {
        headers: { 'x-user-email': targetEmail }
      });
      if (res.ok) {
        const json = await res.json();
        setData(json.stats || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setIsFiltering(false);
      
      if (!scrollRestored.current) {
        scrollRestored.current = true;
        const savedScroll = sessionStorage.getItem('admin_usoia_scroll');
        if (savedScroll) {
          setTimeout(() => {
            window.scrollTo({ top: parseInt(savedScroll, 10), behavior: 'instant' });
          }, 50);
        }
      }
    }
  };

  useEffect(() => {
    if (userEmail) {
      fetchData(periodo, userEmail);
    }
    sessionStorage.setItem('admin_usoia_periodo', periodo);
  }, [periodo]);

  useEffect(() => {
    sessionStorage.setItem('admin_usoia_sortCol', sortCol);
    sessionStorage.setItem('admin_usoia_sortDir', sortDir);
  }, [sortCol, sortDir]);

  useEffect(() => {
    const handleScroll = () => {
      sessionStorage.setItem('admin_usoia_scroll', window.scrollY.toString());
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSort = (col: string) => {
    if (sortCol === col) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortCol(col);
      setSortDir('desc');
    }
  };

  const getSortIcon = (col: string) => {
    if (sortCol !== col) return ' ↕️';
    return sortDir === 'asc' ? ' 🔼' : ' 🔽';
  };

  const sortedData = [...data].sort((a, b) => {
    let valA = a[sortCol];
    let valB = b[sortCol];

    if (valA === null || valA === undefined) valA = '';
    if (valB === null || valB === undefined) valB = '';

    if (typeof valA === 'string') valA = valA.toLowerCase();
    if (typeof valB === 'string') valB = valB.toLowerCase();

    if (valA < valB) return sortDir === 'asc' ? -1 : 1;
    if (valA > valB) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const renderAvatar = (user: any) => {
    const allowedIcons = ['🌱','🌿','🍀','🍃','🌾','🌻','🌷','🌹','🌵','🌴','🍄','🪴','🐝','🦋','🐞','🐛','🐌','🐇','🦉','🐦','🦆','🐓','🐢','🦔','🐸','🐟','🐑','🐐','🐄','🐎','🐕','🐈','🦜','🦚','🦢'];
    if (user.icono && allowedIcons.includes(user.icono)) {
      return <span style={{ fontSize: '1.8rem' }}>{user.icono}</span>;
    }
    if (user.fotoPreferida) {
      let meta: any = { profile_object_x: 50, profile_object_y: 38, profile_object_zoom: 100 };
      try { if (user.fotoPreferidaMeta) meta = { ...meta, ...JSON.parse(user.fotoPreferidaMeta) }; } catch {}
      return (
        <img 
          src={getMediaUrl(user.fotoPreferida)} 
          alt="Avatar" 
          crossOrigin="anonymous"
          style={{ 
            width: '100%', height: '100%', objectFit: 'cover', 
            objectPosition: `${meta.profile_object_x}% ${meta.profile_object_y}%`,
            transform: meta.profile_object_zoom > 100 ? `scale(${meta.profile_object_zoom / 100})` : undefined
          }} 
        />
      );
    }
    if (user.iconoLogro && allowedIcons.includes(user.iconoLogro)) {
      return <span style={{ fontSize: '1.8rem' }}>{user.iconoLogro}</span>;
    }
    return <span style={{ fontSize: '1.8rem' }}>🌱</span>;
  };

  return (
    <div style={{ width: '100%', padding: '20px', boxSizing: 'border-box' }}>
      {/* Subheader Global */}
      <div style={{ 
        background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', 
        borderRadius: '16px', padding: '16px 24px', color: 'white',
        display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px',
        boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🤖 Uso de IA Global
            </h1>
            <p style={{ margin: '4px 0 0', opacity: 0.9, fontSize: '0.9rem' }}>
              Monitoriza el consumo de Inteligencia Artificial de todos los usuarios del sistema.
            </p>
          </div>
          <button 
            onClick={() => fetchData(periodo)}
            style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, transition: 'background 0.2s' }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
            onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
          >
            🔄 Refrescar
          </button>
        </div>

        {/* Filtros */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { id: 'hoy', label: 'Hoy' },
            { id: 'mes', label: 'Este Mes' },
            { id: 'ano', label: 'Este Año' },
            { id: 'todo', label: 'Todo' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setPeriodo(f.id)}
              style={{
                background: periodo === f.id ? 'white' : 'rgba(255,255,255,0.1)',
                color: periodo === f.id ? '#6d28d9' : 'white',
                border: '1px solid rgba(255,255,255,0.3)',
                padding: '6px 16px',
                borderRadius: '20px',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {f.label} ({data.length})
            </button>
          ))}
        </div>
      </div>

      {/* Tabla */}
      <div style={{ position: 'relative', background: 'white', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        
        {/* Overlay de Carga */}
        {isFiltering && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(255,255,255,0.65)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '40px', height: '40px', border: '4px solid #e2e8f0', borderTop: '4px solid #8b5cf6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          </div>
        )}

        <div style={{ width: '100%', overflowX: 'auto', opacity: isFiltering ? 0.6 : 1, transition: 'opacity 0.2s' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', textAlign: 'left', minWidth: '800px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ position: 'sticky', left: 0, zIndex: 2, background: '#f8fafc', width: '80px', minWidth: '80px', textAlign: 'center', padding: '12px 8px' }}></th>
                <th onClick={() => handleSort('nombre')} style={{ padding: '12px 16px', color: '#64748b', fontWeight: 600, cursor: 'pointer', userSelect: 'none' }}>
                  Usuario{getSortIcon('nombre')}
                </th>
                <th onClick={() => handleSort('suscripcion')} style={{ padding: '12px 16px', color: '#64748b', fontWeight: 600, cursor: 'pointer', userSelect: 'none' }}>
                  Plan{getSortIcon('suscripcion')}
                </th>
                <th onClick={() => handleSort('total_interacciones')} style={{ padding: '12px 16px', color: '#64748b', fontWeight: 600, cursor: 'pointer', userSelect: 'none' }}>
                  Interacciones{getSortIcon('total_interacciones')}
                </th>
                <th onClick={() => handleSort('ultima_interaccion')} style={{ padding: '12px 16px', color: '#64748b', fontWeight: 600, cursor: 'pointer', userSelect: 'none' }}>
                  Último Uso{getSortIcon('ultima_interaccion')}
                </th>
                <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 600, width: '120px' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {sortedData.map((u, idx) => (
                <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? 'white' : '#f8fafc' }}>
                  {/* Sticky Avatar Column */}
                  <td style={{ position: 'sticky', left: 0, zIndex: 1, background: idx % 2 === 0 ? 'white' : '#f8fafc', width: '80px', minWidth: '80px', textAlign: 'center', padding: '8px' }}>
                    <Link href={`/dashboard/admin/usuarios/${u.id}?from=usoia`} style={{ display: 'block', textDecoration: 'none' }}>
                      <div style={{ width: '56px', height: '56px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: '#f1f5f9', margin: '0 auto', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                        {renderAvatar(u)}
                      </div>
                    </Link>
                  </td>

                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 600, color: '#334155' }}>{u.nombre} {u.apellidos}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{u.email}</div>
                  </td>
                  
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ 
                      background: u.suscripcion?.toLowerCase().includes('premium') ? 'rgba(245,158,11,0.1)' : 'rgba(100,116,139,0.1)', 
                      color: u.suscripcion?.toLowerCase().includes('premium') ? '#d97706' : '#475569', 
                      padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' 
                    }}>
                      {u.suscripcion || 'Gratuito'}
                    </span>
                  </td>
                  
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: u.total_interacciones > 0 ? '#8b5cf6' : '#94a3b8' }}>
                      {u.total_interacciones}
                    </div>
                  </td>

                  <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.85rem' }}>
                    {u.ultima_interaccion ? (
                      <>
                        <div style={{ fontWeight: 500, color: '#475569' }}>{new Date(u.ultima_interaccion).toLocaleDateString()}</div>
                        <div>{new Date(u.ultima_interaccion).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </>
                    ) : (
                      <span style={{ fontStyle: 'italic', color: '#cbd5e1' }}>Sin actividad</span>
                    )}
                  </td>

                  <td style={{ padding: '12px 16px' }}>
                    <Link href={`/dashboard/admin/usuarios/${u.id}?from=usoia`}>
                      <button style={{ 
                        background: 'white', border: '1px solid #cbd5e1', padding: '6px 12px', 
                        borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, color: '#475569',
                        display: 'flex', alignItems: 'center', gap: '4px', transition: 'all 0.2s'
                      }}
                      onMouseOver={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#94a3b8'; }}
                      onMouseOut={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
                      >
                        ✏️ Perfil
                      </button>
                    </Link>
                  </td>
                </tr>
              ))}
              
              {!loading && data.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '8px' }}>👻</div>
                    No hay interacciones de IA en este periodo.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }` }} />
    </div>
  );
}
