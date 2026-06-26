'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { getMediaUrl } from '@/lib/media-url';

interface Enlace {
  iddatosadjuntos: number;
  ruta: string;
  nombreOriginal: string;
  titulo?: string;
  apuntes?: string;
  autores?: string;
  identificacion?: string;
  modulo: string;
  entityRoute?: string;
  status?: number;
  ok?: boolean;
  checking?: boolean;
  lastChecked?: string;
  error?: string;
  relatedBlogsCount?: number;
}

export default function EnlacesDashboardPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [enlaces, setEnlaces] = useState<Enlace[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalChecking, setGlobalChecking] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'ok' | 'error' | 'pending'>('all');
  const [filterModule, setFilterModule] = useState<string>('all');
  const [isRestoringState, setIsRestoringState] = useState(true);
  const [highlightedRowId, setHighlightedRowId] = useState<number | null>(null);

  // Load state from sessionStorage on mount
  useEffect(() => {
    try {
      const isClean = typeof window !== 'undefined' && window.location.search.includes('clean=true');
      
      if (isClean) {
        sessionStorage.removeItem('verdantia_enlaces_state');
        sessionStorage.removeItem('verdantia_enlaces_lastClicked');
        window.history.replaceState({}, '', window.location.pathname);
      } else {
        const savedState = sessionStorage.getItem('verdantia_enlaces_state');
        if (savedState) {
          const parsed = JSON.parse(savedState);
          if (parsed.filterStatus) setFilterStatus(parsed.filterStatus);
          if (parsed.filterModule) setFilterModule(parsed.filterModule);
          if (parsed.scrollPosition) {
            setTimeout(() => {
              window.scrollTo({ top: parsed.scrollPosition, behavior: 'instant' });
            }, 100);
          }
        }
        
        const lastClicked = sessionStorage.getItem('verdantia_enlaces_lastClicked');
        if (lastClicked) {
          setHighlightedRowId(Number(lastClicked));
          sessionStorage.removeItem('verdantia_enlaces_lastClicked');
          setTimeout(() => setHighlightedRowId(null), 3000); // Quitar resaltado tras 3 segundos
        }
      }
    } catch (e) {
      console.error('Error loading state from sessionStorage', e);
    } finally {
      setIsRestoringState(false);
    }
  }, []);

  // Save state to sessionStorage
  useEffect(() => {
    if (isRestoringState || loading) return;

    const saveState = () => {
      // Solo guardamos los campos importantes para no saturar el sessionStorage
      const auditedLinks = enlaces
        .filter(e => e.status !== undefined || e.checking)
        .map(e => ({
          iddatosadjuntos: e.iddatosadjuntos,
          status: e.status,
          ok: e.ok,
          checking: e.checking,
          lastChecked: e.lastChecked,
          error: e.error
        }));

      const state = {
        filterStatus,
        filterModule,
        scrollPosition: window.scrollY,
        auditedLinks
      };
      sessionStorage.setItem('verdantia_enlaces_state', JSON.stringify(state));
    };

    saveState(); // Save when filters or enlaces change

    window.addEventListener('scroll', saveState, { passive: true });
    return () => window.removeEventListener('scroll', saveState);
  }, [filterStatus, filterModule, isRestoringState, enlaces, loading]);

  // -- Repair Modal State --
  const [repairModalOpen, setRepairModalOpen] = useState(false);
  const [repairEnlace, setRepairEnlace] = useState<Enlace | null>(null);
  const [repairQuery, setRepairQuery] = useState('');
  const [pdfSearchResults, setPdfSearchResults] = useState<{ title: string, url: string, summary?: string, apuntes?: string }[]>([]);
  const [pdfSearchLoading, setPdfSearchLoading] = useState(false);
  const [pdfSearchError, setPdfSearchError] = useState<string | null>(null);
  const [isUpdatingUrl, setIsUpdatingUrl] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.email) {
        setUserEmail(user.email);
        setAuthReady(true);
      } else {
        router.push('/login');
      }
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (authReady && userEmail) {
      fetchEnlaces();
    }
  }, [authReady, userEmail]);

  const fetchEnlaces = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/mantenimiento/enlaces', {
        headers: { 'x-user-email': userEmail || '' }
      });
      if (res.ok) {
        const data = await res.json();
        let fetchedEnlaces = data.enlaces || [];

        // Restaurar la auditoría desde sessionStorage si existe
        try {
          const savedState = sessionStorage.getItem('verdantia_enlaces_state');
          if (savedState) {
            const parsed = JSON.parse(savedState);
            if (parsed.auditedLinks && Array.isArray(parsed.auditedLinks)) {
              fetchedEnlaces = fetchedEnlaces.map((enlace: Enlace) => {
                const cached = parsed.auditedLinks.find((c: any) => c.iddatosadjuntos === enlace.iddatosadjuntos);
                if (cached) {
                  return {
                    ...enlace,
                    status: cached.status,
                    ok: cached.ok,
                    checking: cached.checking,
                    lastChecked: cached.lastChecked,
                    error: cached.error
                  };
                }
                return enlace;
              });
            }
          }
        } catch(e) {
          console.error("Error restaurando auditoria", e);
        }

        setEnlaces(fetchedEnlaces);
      }
    } catch (e) {
      console.error('Error fetching enlaces:', e);
    } finally {
      setLoading(false);
    }
  };

  const checkSingleLink = async (index: number) => {
    const enlace = enlaces[index];
    setEnlaces(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], checking: true, error: undefined };
      return copy;
    });

    try {
      const res = await fetch('/api/admin/mantenimiento/enlaces/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': userEmail || ''
        },
        body: JSON.stringify({ url: enlace.ruta })
      });
      const data = await res.json();
      
      setEnlaces(prev => {
        const copy = [...prev];
        copy[index] = { 
          ...copy[index], 
          checking: false, 
          status: data.status, 
          ok: data.ok,
          error: data.error,
          lastChecked: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
        };
        return copy;
      });
    } catch (e: any) {
      setEnlaces(prev => {
        const copy = [...prev];
        copy[index] = { ...copy[index], checking: false, ok: false, error: e.message };
        return copy;
      });
    }
  };

  const checkAllLinks = async () => {
    if (globalChecking || enlaces.length === 0) return;
    setGlobalChecking(true);
    
    // Process sequentially to not overload the server or target websites
    for (let i = 0; i < enlaces.length; i++) {
      await checkSingleLink(i);
      // Small pause between checks
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    setGlobalChecking(false);
  };

  const handleDelete = async (index: number) => {
    const enlace = enlaces[index];
    const blogsLinked = enlace.relatedBlogsCount || 0;
    
    let action = 'delete';
    let message = '¿Estás seguro de que deseas ELIMINAR este PDF definitivamente de la base de datos?';
    
    if (blogsLinked > 0) {
      action = 'deactivate';
      message = `Este PDF está asociado a ${blogsLinked} artículo(s) del blog.\n\nNo se puede eliminar definitivamente sin romper el blog. ¿Deseas INACTIVARLO para que ya no aparezca en las búsquedas ni en los formularios, pero manteniendo la consistencia de los blogs ya generados?`;
    }

    if (!confirm(message)) return;
    
    try {
      const res = await fetch(`/api/admin/mantenimiento/enlaces/${enlace.iddatosadjuntos}?action=${action}`, {
        method: 'DELETE',
        headers: { 'x-user-email': userEmail || '' }
      });
      
      const data = await res.json();
      if (res.ok) {
        setEnlaces(prev => prev.filter((_, i) => i !== index));
      } else {
        alert('Error: ' + data.error);
      }
    } catch (e: any) {
      alert('Error de conexión');
    }
  };

  const openRepairModal = (enlace: Enlace) => {
    setRepairEnlace(enlace);
    const queryStr = `${enlace.titulo || enlace.nombreOriginal || ''} ${enlace.autores || ''}`.trim();
    setRepairQuery(queryStr);
    setPdfSearchResults([]);
    setPdfSearchError(null);
    setRepairModalOpen(true);
  };

  const closeRepairModal = () => {
    setRepairModalOpen(false);
    setRepairEnlace(null);
    setPdfSearchResults([]);
  };

  const searchPdfs = async () => {
    if (!repairQuery.trim() || pdfSearchLoading) return;
    setPdfSearchLoading(true);
    setPdfSearchError(null);
    setPdfSearchResults([]);
    try {
      const res = await fetch('/api/ai/pdf-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          topic: repairQuery,
          especieNombre: repairEnlace?.modulo || 'General',
          variedadNombre: 'General'
        })
      });
      const data = await res.json();
      if (data.success && data.results) {
        setPdfSearchResults(data.results);
      } else {
        setPdfSearchError(data.error || 'No se encontraron resultados');
      }
    } catch (e: any) {
      console.error(e);
      setPdfSearchError('Error de red al buscar PDFs');
    } finally {
      setPdfSearchLoading(false);
    }
  };

  const handleUpdateUrl = async (newUrl: string) => {
    if (!repairEnlace || isUpdatingUrl) return;
    setIsUpdatingUrl(true);
    try {
      const res = await fetch('/api/admin/mantenimiento/enlaces', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': userEmail || ''
        },
        body: JSON.stringify({
          iddatosadjuntos: repairEnlace.iddatosadjuntos,
          nuevaRuta: newUrl
        })
      });
      const data = await res.json();
      if (data.success) {
        // Actualizamos localmente el enlace y lo mandamos a comprobar
        const idx = enlaces.findIndex(e => e.iddatosadjuntos === repairEnlace.iddatosadjuntos);
        if (idx !== -1) {
          setEnlaces(prev => {
            const copy = [...prev];
            copy[idx] = { ...copy[idx], ruta: newUrl, checking: true, error: undefined, status: undefined, ok: undefined };
            return copy;
          });
          closeRepairModal();
          // Forzamos un re-chequeo automático del enlace modificado
          setTimeout(() => checkSingleLink(idx), 500);
        } else {
          fetchEnlaces(); // Refresh all if index not found
          closeRepairModal();
        }
      } else {
        alert(data.error || 'Error al actualizar el enlace');
      }
    } catch (e) {
      console.error(e);
      alert('Error al comunicar con el servidor');
    } finally {
      setIsUpdatingUrl(false);
    }
  };

  if (loading) {
    return (
      <div style={{ width: '100%', minHeight: '50vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div className="loading-spinner" style={{ marginBottom: '16px' }}></div>
        <p style={{ color: '#64748b', fontWeight: 500 }}>Analizando enlaces globales...</p>
      </div>
    );
  }
  const okCount = enlaces.filter(e => e.ok === true).length;
  const errorCount = enlaces.filter(e => e.ok === false && e.status !== undefined).length;
  const pendingCount = enlaces.filter(e => e.status === undefined && !e.checking).length;

  const modules = Array.from(new Set(enlaces.map(e => e.modulo))).sort();

  const filteredEnlaces = enlaces.filter(e => {
    if (filterStatus === 'ok' && e.ok !== true) return false;
    if (filterStatus === 'error' && !(e.ok === false && e.status !== undefined)) return false;
    if (filterStatus === 'pending' && (e.status !== undefined || e.checking)) return false;
    if (filterModule !== 'all' && e.modulo !== filterModule) return false;
    return true;
  });

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* HEADER JERÁRQUICO */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '-10px', alignItems: 'center' }}>
        <button onClick={() => router.push('/dashboard')} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px 16px', fontSize: '0.9rem', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', color: '#475569', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }} onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.background = 'white'}>
          🏠 Volver al Inicio
        </button>
      </div>

      {/* SUBHEADER CONTEXTUAL */}
      <div style={{ 
        width: '100%', 
        background: 'linear-gradient(135deg, #1e293b, #334155)', 
        borderRadius: '14px', 
        padding: '16px 24px', 
        display: 'flex', 
        flexDirection: 'column',
        gap: '16px', 
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' 
      }}>
        {/* BLOQUE SUPERIOR (Título y Acciones) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <h1 style={{ margin: 0, fontSize: '1.4rem', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🔗 Salud de Enlaces
            </h1>
            <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
              Comprobador automático de enlaces externos en todo Verdantia (Total: {enlaces.length})
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button 
              type="button" 
              onClick={checkAllLinks} 
              disabled={globalChecking}
              style={{ 
                background: globalChecking ? '#94a3b8' : 'linear-gradient(135deg, #8b5cf6, #6d28d9)', 
                color: 'white', 
                border: 'none', 
                padding: '10px 20px', 
                borderRadius: '8px', 
                fontWeight: 'bold', 
                cursor: globalChecking ? 'not-allowed' : 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                boxShadow: '0 4px 6px rgba(139, 92, 246, 0.3)' 
              }}
            >
              {globalChecking ? '⏳ Auditando...' : '▶️ Iniciar Auditoría'}
            </button>
          </div>
        </div>

        {/* BLOQUE INFERIOR (Filtros Rápidos) */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginRight: '4px' }}>Estado:</span>
          {[
            { key: 'all', label: 'Todos', count: enlaces.length, color: '#e2e8f0', bg: 'rgba(255,255,255,0.1)' },
            { key: 'ok', label: '🟢 OK', count: okCount, color: '#34d399', bg: 'rgba(16, 185, 129, 0.2)' },
            { key: 'error', label: '🔴 Rotos', count: errorCount, color: '#f87171', bg: 'rgba(239, 68, 68, 0.2)' },
            { key: 'pending', label: '⏳ Pendientes', count: pendingCount, color: '#fbbf24', bg: 'rgba(245, 158, 11, 0.2)' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilterStatus(f.key as any)}
              style={{
                padding: '4px 12px',
                borderRadius: '20px',
                border: filterStatus === f.key ? `1px solid ${f.color}` : '1px solid rgba(255,255,255,0.1)',
                background: filterStatus === f.key ? f.bg : 'rgba(255,255,255,0.05)',
                color: filterStatus === f.key ? f.color : '#94a3b8',
                fontSize: '0.8rem',
                fontWeight: filterStatus === f.key ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {f.label} ({f.count})
            </button>
          ))}

          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginLeft: '12px', marginRight: '4px' }}>Módulo:</span>
          <button
            onClick={() => setFilterModule('all')}
            style={{
              padding: '4px 12px',
              borderRadius: '20px',
              border: filterModule === 'all' ? '1px solid rgba(255,255,255,0.4)' : '1px solid rgba(255,255,255,0.1)',
              background: filterModule === 'all' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)',
              color: filterModule === 'all' ? '#ffffff' : '#94a3b8',
              fontSize: '0.8rem',
              fontWeight: filterModule === 'all' ? 700 : 500,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Todos ({enlaces.length})
          </button>
          {modules.map(mod => {
            const count = enlaces.filter(e => e.modulo === mod).length;
            return (
              <button
                key={mod}
                onClick={() => setFilterModule(mod)}
                style={{
                  padding: '4px 12px',
                  borderRadius: '20px',
                  border: filterModule === mod ? '1px solid #c084fc' : '1px solid rgba(255,255,255,0.1)',
                  background: filterModule === mod ? 'rgba(139, 92, 246, 0.3)' : 'rgba(255,255,255,0.05)',
                  color: filterModule === mod ? '#e9d5ff' : '#94a3b8',
                  fontSize: '0.8rem',
                  fontWeight: filterModule === mod ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {mod} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* TABLA PRINCIPAL */}
      <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        <div style={{ width: '100%', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', tableLayout: 'fixed' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: '#64748b', fontWeight: 600, width: '180px' }}>Estado</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: '#64748b', fontWeight: 600, width: '130px' }}>Módulo</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: '#64748b', fontWeight: 600, width: '700px' }}>Título / Documento</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>Usos Blog</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: '#64748b', fontWeight: 600, width: '180px' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredEnlaces.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8' }}>
                    {enlaces.length === 0 ? 'No hay enlaces externos registrados en la base de datos.' : 'No hay enlaces que coincidan con los filtros seleccionados.'}
                  </td>
                </tr>
              ) : filteredEnlaces.map((enlace, idx) => (
                <tr key={enlace.iddatosadjuntos} style={{ borderBottom: '1px solid #e2e8f0', background: highlightedRowId === enlace.iddatosadjuntos ? '#fef08a' : (idx % 2 === 0 ? 'white' : '#f8fafc'), transition: 'background-color 1s ease' }}>
                  
                  {/* ESTADO */}
                  <td style={{ padding: '12px 16px' }}>
                    {enlace.checking ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#f59e0b', fontWeight: 600, fontSize: '0.85rem' }}>
                        ⏳ Chequeando...
                      </span>
                    ) : enlace.status !== undefined ? (
                      <span style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '6px', 
                        color: enlace.ok ? '#059669' : '#dc2626', 
                        background: enlace.ok ? '#d1fae5' : '#fee2e2', 
                        padding: '4px 10px', 
                        borderRadius: '20px', 
                        fontWeight: 600, 
                        fontSize: '0.85rem' 
                      }}>
                        {enlace.ok ? '🟢 OK' : '🔴 ERROR'} ({enlace.status})
                      </span>
                    ) : (
                      <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Pte. revisión</span>
                    )}
                    {enlace.error && (
                      <div style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '4px', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={enlace.error}>
                        {enlace.error}
                      </div>
                    )}
                  </td>
                  
                  {/* MÓDULO */}
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ background: '#e2e8f0', color: '#475569', padding: '4px 8px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600 }}>
                      {enlace.modulo}
                    </span>
                  </td>
                  
                  {/* TÍTULO Y URL */}
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>
                      {enlace.titulo || enlace.nombreOriginal}
                    </div>
                    <a href={enlace.ruta} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.8rem', color: '#3b82f6', textDecoration: 'none', wordBreak: 'break-all' }} onMouseEnter={e => e.currentTarget.style.textDecoration='underline'} onMouseLeave={e => e.currentTarget.style.textDecoration='none'}>
                      {enlace.ruta}
                    </a>
                  </td>

                  {/* USOS BLOG */}
                  <td style={{ padding: '12px 16px', textAlign: 'left' }}>
                    {enlace.relatedBlogsCount && enlace.relatedBlogsCount > 0 ? (
                      <span style={{ background: '#e0f2fe', color: '#0284c7', border: '1px solid #bae6fd', padding: '4px 10px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '6px' }} title={`Asociado a ${enlace.relatedBlogsCount} artículo(s) de blog`}>
                        📰 {enlace.relatedBlogsCount}
                      </span>
                    ) : (
                      <span style={{ color: '#cbd5e1', fontSize: '0.85rem', marginLeft: '10px' }}>-</span>
                    )}
                  </td>

                  {/* ACCIONES */}
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {enlace.entityRoute && (
                        <button
                          onClick={() => {
                            sessionStorage.setItem('verdantia_enlaces_lastClicked', String(enlace.iddatosadjuntos));
                            router.push(`${enlace.entityRoute}?tab=pdfs&from=enlaces`);
                          }}
                          style={{ background: '#e0f2fe', border: '1px solid #bae6fd', borderRadius: '6px', padding: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                          title={`Ir a ${enlace.modulo} → Pestaña PDFs`}
                          onMouseEnter={e => { e.currentTarget.style.background = '#bae6fd'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = '#e0f2fe'; }}
                        >
                          📂
                        </button>
                      )}
                      <button 
                        onClick={() => checkSingleLink(enlaces.findIndex(e => e.iddatosadjuntos === enlace.iddatosadjuntos))}
                        disabled={enlace.checking || globalChecking}
                        style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '6px', cursor: (enlace.checking || globalChecking) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        title="Comprobar enlace"
                      >
                        🔄
                      </button>
                      <button 
                        onClick={() => handleDelete(enlaces.findIndex(e => e.iddatosadjuntos === enlace.iddatosadjuntos))}
                        style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '6px', padding: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        title={enlace.relatedBlogsCount && enlace.relatedBlogsCount > 0 ? "Inactivar enlace" : "Eliminar enlace"}
                      >
                        🗑️
                      </button>
                      {enlace.ok === false && enlace.status !== undefined && (
                        <button 
                          onClick={() => openRepairModal(enlace)}
                          style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', color: 'white', border: 'none', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 'bold' }}
                          title="Reparar enlace con IA"
                        >
                          ✨ Reparar
                        </button>
                      )}
                    </div>
                  </td>
                  
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* REPAIR MODAL */}
      {repairModalOpen && repairEnlace && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(15, 23, 42, 0.75)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
          <div style={{ background: 'white', borderRadius: '16px', width: '100%', maxWidth: '800px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden' }}>
            
            {/* Modal Header */}
            <div style={{ padding: '20px 24px', background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ color: 'white' }}>
                <h2 style={{ margin: 0, fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '8px' }}>✨ Reparar Enlace con IA</h2>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', opacity: 0.9 }}>Buscando alternativas para el archivo roto</p>
              </div>
              <button onClick={closeRepairModal} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', fontSize: '1.2rem', cursor: 'pointer', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}>✕</button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <p style={{ margin: '0 0 8px 0', fontSize: '0.85rem', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>Documento Roto</p>
                <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#0f172a', marginBottom: '4px' }}>{repairEnlace.titulo || repairEnlace.nombreOriginal}</div>
                <div style={{ fontSize: '0.85rem', color: '#dc2626', wordBreak: 'break-all' }}>{repairEnlace.ruta}</div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#334155' }}>Criterio de búsqueda (IA)</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="text"
                    value={repairQuery}
                    onChange={(e) => setRepairQuery(e.target.value)}
                    placeholder="Ej: Manual de cultivo del tomate pdf filetype:pdf"
                    style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', outline: 'none' }}
                    onKeyDown={(e) => e.key === 'Enter' && searchPdfs()}
                  />
                  <button
                    onClick={searchPdfs}
                    disabled={pdfSearchLoading || !repairQuery.trim()}
                    style={{ background: '#8b5cf6', color: 'white', border: 'none', borderRadius: '8px', padding: '0 20px', fontWeight: 'bold', cursor: (pdfSearchLoading || !repairQuery.trim()) ? 'not-allowed' : 'pointer', opacity: (pdfSearchLoading || !repairQuery.trim()) ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    {pdfSearchLoading ? '⏳ Buscando...' : '🔍 Buscar PDFs'}
                  </button>
                </div>
              </div>

              {pdfSearchError && (
                <div style={{ background: '#fee2e2', color: '#dc2626', padding: '12px 16px', borderRadius: '8px', border: '1px solid #fca5a5' }}>
                  {pdfSearchError}
                </div>
              )}

              {pdfSearchResults.length > 0 && (
                <div>
                  <h3 style={{ margin: '0 0 12px 0', color: '#0f172a', fontSize: '1.1rem' }}>Resultados ({pdfSearchResults.length})</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {pdfSearchResults.map((res, idx) => (
                      <div key={idx} style={{ padding: '16px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div>
                          <a href={res.url} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 'bold', color: '#0f172a', textDecoration: 'none', fontSize: '1.05rem', display: 'inline-block', marginBottom: '4px' }} onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'} onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>
                            📄 {res.title}
                          </a>
                          <div style={{ fontSize: '0.85rem', color: '#64748b', wordBreak: 'break-all' }}>{res.url}</div>
                        </div>
                        {res.summary && (
                          <div style={{ fontSize: '0.9rem', color: '#334155', background: 'white', padding: '10px', borderRadius: '6px', border: '1px dashed #cbd5e1' }}>
                            {res.summary}
                          </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => handleUpdateUrl(res.url)}
                            disabled={isUpdatingUrl}
                            style={{ background: '#10b981', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 'bold', cursor: isUpdatingUrl ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)' }}
                          >
                            {isUpdatingUrl ? 'Actualizando...' : '🔗 Usar este enlace'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
