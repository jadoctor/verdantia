'use client';
// Force layout and path columns update in PDF Dashboard
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase/config';
import SharedMediaUploader from '@/components/admin/SharedMediaUploader';
import { getMediaUrl } from '@/lib/media-url';

interface GlobalPdf {
  id: number;
  ruta: string;
  titulo: string;
  nombreOriginal: string;
  portada: string | null;
  activo: boolean;
  fecha: string;
  entityType: string;
  entityName: string;
  entityId: number | null;
  urlContext: string;
  blogsAsociados: number;
}

type SortKey = 'titulo' | 'ruta' | 'entityName' | 'fecha' | 'activo';
type SortOrder = 'asc' | 'desc';

export default function PdfsDashboard() {
  const router = useRouter();
  
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [pdfs, setPdfs] = useState<GlobalPdf[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [filterActive, setFilterActive] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  
  const [sortKey, setSortKey] = useState<SortKey>('fecha');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [focusedPdfId, setFocusedPdfId] = useState<number | null>(null);
  const [pdfUrlStatus, setPdfUrlStatus] = useState<Record<string, boolean | null>>({});

  const checkPdfUrls = async (pdfList: GlobalPdf[]) => {
    const cachedStr = sessionStorage.getItem('pdfs_url_status');
    const cached = cachedStr ? JSON.parse(cachedStr) : {};

    const urlsToCheck = pdfList
      .filter(p => cached[p.ruta] === undefined)
      .map(p => getMediaUrl(p.ruta))
      .filter(Boolean);

    if (urlsToCheck.length === 0) {
      setPdfUrlStatus(cached);
      return;
    }

    try {
      const res = await fetch('/api/admin/check-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: urlsToCheck })
      });
      if (res.ok) {
        const data = await res.json();
        const newStatus: Record<string, boolean> = { ...cached };
        pdfList.forEach(p => {
          const resolved = getMediaUrl(p.ruta);
          if (data.results[resolved] !== undefined) {
            newStatus[p.ruta] = data.results[resolved] === true;
          }
        });
        sessionStorage.setItem('pdfs_url_status', JSON.stringify(newStatus));
        setPdfUrlStatus(newStatus);
      }
    } catch (e) {
      console.error('Error checking PDF URLs:', e);
    }
  };

  useEffect(() => {
    if (pdfs.length > 0) {
      checkPdfUrls(pdfs);
    }
  }, [pdfs]);

  useEffect(() => {
    // Restore state from sessionStorage
    const savedFilterActive = sessionStorage.getItem('pdfs_filter_active');
    if (savedFilterActive) setFilterActive(savedFilterActive);
    
    const savedFilterType = sessionStorage.getItem('pdfs_filter_type');
    if (savedFilterType) setFilterType(savedFilterType);
    
    const savedSortKey = sessionStorage.getItem('pdfs_sort_key');
    if (savedSortKey) setSortKey(savedSortKey as SortKey);
    
    const savedSortOrder = sessionStorage.getItem('pdfs_sort_order');
    if (savedSortOrder) setSortOrder(savedSortOrder as SortOrder);

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user && user.email) {
        setUserEmail(user.email);
      } else {
        setUserEmail(null);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (userEmail) {
      fetchPdfs();
    }
  }, [userEmail]);

  useEffect(() => {
    if (!loading) {
      const savedScroll = sessionStorage.getItem('pdfs_scroll');
      if (savedScroll) {
        setTimeout(() => window.scrollTo(0, parseInt(savedScroll, 10)), 100);
      }
      
      const lastEditedId = sessionStorage.getItem('pdfs_last_edited_id');
      if (lastEditedId) {
        const idNum = parseInt(lastEditedId, 10);
        setFocusedPdfId(idNum);
        
        setTimeout(() => {
          const element = document.getElementById(`pdf-row-${idNum}`);
          if (element) {
            element.focus();
            element.scrollIntoView({ block: 'center', behavior: 'smooth' });
          }
        }, 150);

        const timer = setTimeout(() => {
          setFocusedPdfId(null);
          sessionStorage.removeItem('pdfs_last_edited_id');
        }, 3000);

        return () => clearTimeout(timer);
      }
    }
  }, [loading]);

  const fetchPdfs = async () => {
    if (!userEmail) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/pdfs', {
        headers: { 'x-user-email': userEmail }
      });
      if (!res.ok) throw new Error('Error cargando PDFs');
      const data = await res.json();
      setPdfs(data.pdfs);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key: SortKey) => {
    let newOrder: SortOrder = 'asc';
    if (sortKey === key && sortOrder === 'asc') newOrder = 'desc';
    
    setSortKey(key);
    setSortOrder(newOrder);
    
    sessionStorage.setItem('pdfs_sort_key', key);
    sessionStorage.setItem('pdfs_sort_order', newOrder);
  };

  const setFilterActiveWithSave = (val: string) => {
    setFilterActive(val);
    sessionStorage.setItem('pdfs_filter_active', val);
  };

  const setFilterTypeWithSave = (val: string) => {
    setFilterType(val);
    sessionStorage.setItem('pdfs_filter_type', val);
  };

  const toggleStatus = async (id: number) => {
    if (!userEmail) return;
    try {
      const res = await fetch('/api/admin/pdfs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail },
        body: JSON.stringify({ id, action: 'toggleActive' })
      });
      if (res.ok) fetchPdfs();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!userEmail) return;
    try {
      const res = await fetch(`/api/admin/pdfs?id=${id}`, { 
        method: 'DELETE',
        headers: { 'x-user-email': userEmail }
      });
      if (res.ok) fetchPdfs();
    } catch (error) {
      console.error(error);
    }
  };

  // Derived calculations
  let filtered = pdfs.filter(p => {
    if (filterActive === 'active') return p.activo;
    if (filterActive === 'inactive') return !p.activo;
    return true;
  });

  if (filterType !== 'all') {
    filtered = filtered.filter(p => p.entityType === filterType);
  }

  const sorted = [...filtered].sort((a, b) => {
    let valA: any = a[sortKey];
    let valB: any = b[sortKey];

    if (sortKey === 'fecha') {
      valA = new Date(valA).getTime();
      valB = new Date(valB).getTime();
    }

    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });



  const uniqueTypes = Array.from(new Set(pdfs.map(p => p.entityType)));

  return (
    <div style={{ width: '100%', padding: '0', fontFamily: 'inherit', position: 'relative' }}>
      
      {/* GLOBAL SUBHEADER */}
      <div style={{ background: 'linear-gradient(135deg, #1e293b, #0f172a)', padding: '20px 24px', borderRadius: '16px', marginBottom: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', color: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.75rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span>📄</span> Gestor de Documentos PDF
            </h1>
            <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '0.9rem' }}>
              Visualiza y gestiona todos los PDFs de la base de datos de Verdantia.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={fetchPdfs} style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              🔄 Refrescar
            </button>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '20px', flexWrap: 'wrap' }}>
          {/* Active Status */}
          <div style={{ display: 'flex', background: 'rgba(0,0,0,0.2)', borderRadius: '10px', padding: '4px' }}>
            {['all', 'active', 'inactive'].map(f => {
              let label = f === 'all' ? `Todos (${pdfs.length})` : f === 'active' ? `Activos (${pdfs.filter(x => x.activo).length})` : `Inactivos (${pdfs.filter(x => !x.activo).length})`;
              return (
                <button
                  key={f}
                  onClick={() => setFilterActiveWithSave(f)}
                  style={{ padding: '4px 12px', borderRadius: '6px', border: 'none', background: filterActive === f ? 'white' : 'transparent', color: filterActive === f ? '#0f172a' : '#94a3b8', fontWeight: filterActive === f ? 'bold' : 'normal', cursor: 'pointer', fontSize: '0.8rem', transition: 'all 0.2s' }}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Types */}
          <div style={{ display: 'flex', background: 'rgba(0,0,0,0.2)', borderRadius: '10px', padding: '4px', overflowX: 'auto' }}>
            <button
              onClick={() => setFilterTypeWithSave('all')}
              style={{ padding: '4px 12px', borderRadius: '6px', border: 'none', background: filterType === 'all' ? 'white' : 'transparent', color: filterType === 'all' ? '#0f172a' : '#94a3b8', fontWeight: filterType === 'all' ? 'bold' : 'normal', cursor: 'pointer', fontSize: '0.8rem', transition: 'all 0.2s', whiteSpace: 'nowrap' }}
            >
              Cualquier Origen
            </button>
            {uniqueTypes.map(t => {
              const count = pdfs.filter(x => x.entityType === t).length;
              return (
                <button
                  key={t}
                  onClick={() => setFilterTypeWithSave(t)}
                  style={{ padding: '4px 12px', borderRadius: '6px', border: 'none', background: filterType === t ? 'white' : 'transparent', color: filterType === t ? '#0f172a' : '#94a3b8', fontWeight: filterType === t ? 'bold' : 'normal', cursor: 'pointer', fontSize: '0.8rem', transition: 'all 0.2s', whiteSpace: 'nowrap' }}
                >
                  {t} ({count})
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ERROR MSG */}
      {error && <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '12px 20px', borderRadius: '12px', marginBottom: '20px', fontWeight: 600 }}>Error: {error}</div>}

      {/* TABLE CONTAINER - Carga sin Flickering */}
      <div style={{ position: 'relative', background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflowX: 'auto', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        
        {loading && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(2px)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '40px', height: '40px', border: '4px solid #e2e8f0', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          </div>
        )}

        <table style={{ width: '100%', borderCollapse: 'collapse', opacity: loading ? 0.6 : 1, transition: 'opacity 0.3s' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e2e8f0', background: '#f8fafc' }}>
              <th style={{ width: '80px', minWidth: '80px', padding: '12px 8px', textAlign: 'center', position: 'sticky', left: 0, background: '#f8fafc', zIndex: 2, borderRight: '1px solid #e2e8f0' }}>Portada</th>
              <th onClick={() => handleSort('titulo')} style={{ padding: '16px', textAlign: 'left', fontWeight: 700, color: '#475569', fontSize: '0.85rem', textTransform: 'uppercase', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                Documento {sortKey === 'titulo' && (sortOrder === 'asc' ? '🔼' : '🔽')}
              </th>
              <th onClick={() => handleSort('ruta')} style={{ padding: '16px', textAlign: 'left', fontWeight: 700, color: '#475569', fontSize: '0.85rem', textTransform: 'uppercase', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                Ruta {sortKey === 'ruta' && (sortOrder === 'asc' ? '🔼' : '🔽')}
              </th>
              <th onClick={() => handleSort('entityName')} style={{ padding: '16px', paddingRight: 0, textAlign: 'center', fontWeight: 700, color: '#475569', fontSize: '0.85rem', textTransform: 'uppercase', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                Origen / Entidad {sortKey === 'entityName' && (sortOrder === 'asc' ? '🔼' : '🔽')}
              </th>
              <th style={{ width: '40px', padding: '16px 0 16px 4px', textAlign: 'center' }}></th>
              <th style={{ padding: '16px', textAlign: 'center', fontWeight: 700, color: '#475569', fontSize: '0.85rem', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                Blogs
              </th>
              <th onClick={() => handleSort('fecha')} style={{ padding: '16px', textAlign: 'left', fontWeight: 700, color: '#475569', fontSize: '0.85rem', textTransform: 'uppercase', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                Fecha {sortKey === 'fecha' && (sortOrder === 'asc' ? '🔼' : '🔽')}
              </th>
              <th onClick={() => handleSort('activo')} style={{ padding: '16px', textAlign: 'center', fontWeight: 700, color: '#475569', fontSize: '0.85rem', textTransform: 'uppercase', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                Estado {sortKey === 'activo' && (sortOrder === 'asc' ? '🔼' : '🔽')}
              </th>
              <th style={{ padding: '16px', textAlign: 'right', fontWeight: 700, color: '#475569', fontSize: '0.85rem', textTransform: 'uppercase' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                  No se encontraron documentos PDF.
                </td>
              </tr>
            ) : (
              sorted.map((pdf, index) => (
                <tr 
                  key={pdf.id} 
                  id={`pdf-row-${pdf.id}`}
                  tabIndex={0}
                  style={{ 
                    borderBottom: '1px solid #e2e8f0', 
                    background: focusedPdfId === pdf.id ? '#ede9fe' : (index % 2 === 0 ? 'white' : '#f8fafc'), 
                    transition: 'all 0.3s ease',
                    outline: focusedPdfId === pdf.id ? '2px solid #8b5cf6' : 'none',
                    outlineOffset: '-2px'
                  }}
                >
                  
                  {/* Sticky First Column */}
                  <td style={{ width: '80px', minWidth: '80px', padding: '8px', textAlign: 'center', position: 'sticky', left: 0, background: focusedPdfId === pdf.id ? '#ede9fe' : (index % 2 === 0 ? 'white' : '#f8fafc'), zIndex: 1, borderRight: '1px solid #e2e8f0' }}>
                    <div 
                      onClick={() => {
                        if (pdf.urlContext) {
                          sessionStorage.setItem('pdfs_scroll', window.scrollY.toString());
                          sessionStorage.setItem('pdfs_last_edited_id', pdf.id.toString());
                          const editUrl = pdf.urlContext.includes('?') 
                            ? `${pdf.urlContext}&from=pdfs&editPdf=${pdf.id}` 
                            : `${pdf.urlContext}?from=pdfs&editPdf=${pdf.id}`;
                          router.push(editUrl);
                        }
                      }}
                      style={{ width: '56px', height: '56px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', margin: '0 auto', background: '#f1f5f9', border: '1px solid #cbd5e1', cursor: pdf.urlContext ? 'pointer' : 'default', transition: 'transform 0.2s' }}
                      onMouseOver={e => pdf.urlContext && (e.currentTarget.style.transform = 'scale(1.05)')}
                      onMouseOut={e => pdf.urlContext && (e.currentTarget.style.transform = 'scale(1)')}
                      title={pdf.urlContext ? 'Ir a editar PDF' : ''}
                    >
                      {pdf.portada ? (
                        <img src={getMediaUrl(pdf.portada)} alt="Portada" style={{ width: '100%', height: '100%', objectFit: 'cover' }} crossOrigin="anonymous" />
                      ) : (
                        <span style={{ fontSize: '1.8rem' }}>📄</span>
                      )}
                    </div>
                  </td>
                  
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.95rem' }}>
                        {pdf.titulo}
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
                      <div style={{ color: '#64748b', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontWeight: 500 }}>Archivo:</span> {pdf.nombreOriginal}
                      </div>
                    </div>
                  </td>

                  <td style={{ padding: '16px' }}>
                    {(() => {
                      const href = getMediaUrl(pdf.ruta);
                      const urlOk = pdfUrlStatus[pdf.ruta] === true;
                      const urlChecking = pdfUrlStatus[pdf.ruta] === undefined;
                      const urlBroken = pdfUrlStatus[pdf.ruta] === false;

                      const baseCodeStyle: React.CSSProperties = {
                        wordBreak: 'break-all',
                        fontFamily: 'monospace',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        border: '1px solid',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        transition: 'all 0.2s'
                      };

                      if (urlOk) {
                        return (
                          <a href={href} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }} title="Enlace verificado y funcional. Haz clic para abrir.">
                            <span>🟢</span>
                            <code style={{ ...baseCodeStyle, background: '#ecfdf5', borderColor: '#a7f3d0', color: '#065f46' }} onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'} onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>
                              {pdf.ruta}
                            </code>
                          </a>
                        );
                      }
                      if (urlBroken) {
                        return (
                          <a href={href} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }} title="⚠️ Enlace roto o no accesible. Haz clic para verificar manualmente.">
                            <span>🔴</span>
                            <code style={{ ...baseCodeStyle, background: '#fef2f2', borderColor: '#fecaca', color: '#991b1b', textDecoration: 'line-through' }} onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'} onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>
                              {pdf.ruta}
                            </code>
                          </a>
                        );
                      }
                      return (
                        <a href={href} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }} title="⏳ Verificando estado del enlace...">
                          <span>🔍</span>
                          <code style={{ ...baseCodeStyle, background: '#f8fafc', borderColor: '#e2e8f0', color: '#475569' }} onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'} onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>
                            {pdf.ruta}
                          </code>
                        </a>
                      );
                    })()}
                  </td>

                  <td style={{ padding: '16px', paddingRight: 0, textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
                      <span style={{ background: '#e0e7ff', color: '#4338ca', padding: '4px 10px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        {pdf.entityType === 'Tratamiento' ? '💊' : pdf.entityType === 'Especie' ? '🌱' : pdf.entityType === 'Variedad' ? '🏷️' : pdf.entityType === 'Labor' ? '🚜' : pdf.entityType === 'Afección' ? '🦠' : '📦'} {pdf.entityType}
                      </span>
                      <div style={{ color: '#334155', fontSize: '0.85rem', marginTop: '6px', fontWeight: 500 }}>{pdf.entityName}</div>
                    </div>
                  </td>
                  
                  <td style={{ padding: '16px 4px 16px 0', width: '40px', textAlign: 'center', verticalAlign: 'middle' }}>
                    <button
                      onClick={() => {
                        if (pdf.urlContext) {
                          sessionStorage.setItem('pdfs_scroll', window.scrollY.toString());
                          sessionStorage.setItem('pdfs_last_edited_id', pdf.id.toString());
                          const editUrl = pdf.urlContext.includes('?') 
                            ? `${pdf.urlContext}&from=pdfs&editPdf=${pdf.id}` 
                            : `${pdf.urlContext}?from=pdfs&editPdf=${pdf.id}`;
                          router.push(editUrl);
                        }
                      }}
                      disabled={!pdf.urlContext}
                      style={{ 
                        background: 'white', 
                        border: '1px solid #cbd5e1', 
                        color: '#475569', 
                        width: '36px', 
                        height: '36px', 
                        borderRadius: '8px', 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        cursor: pdf.urlContext ? 'pointer' : 'not-allowed', 
                        transition: 'all 0.2s', 
                        opacity: pdf.urlContext ? 1 : 0.5 
                      }}
                      title="Ir al Origen"
                      onMouseOver={e => { if (pdf.urlContext) { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#0f172a'; } }}
                      onMouseOut={e => { if (pdf.urlContext) { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = '#475569'; } }}
                    >
                      ↗️
                    </button>
                  </td>

                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    {pdf.blogsAsociados > 0 ? (
                      <span style={{ background: '#fef3c7', color: '#b45309', padding: '4px 10px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        📝 {pdf.blogsAsociados}
                      </span>
                    ) : (
                      <span style={{ color: '#cbd5e1', fontSize: '0.85rem' }}>-</span>
                    )}
                  </td>

                  <td style={{ padding: '16px', color: '#64748b', fontSize: '0.85rem' }}>
                    {new Date(pdf.fecha).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </td>

                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    <span style={{ background: pdf.activo ? '#dcfce7' : '#fee2e2', color: pdf.activo ? '#166534' : '#991b1b', padding: '4px 12px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700 }}>
                      {pdf.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>

                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      {/* EDITAR (Gris/Blanco) */}
                      <button
                        onClick={() => {
                          sessionStorage.setItem('pdfs_scroll', window.scrollY.toString());
                          sessionStorage.setItem('pdfs_last_edited_id', pdf.id.toString());
                          router.push(`/dashboard/admin/pdfs/${pdf.id}`);
                        }}
                        style={{ 
                          background: 'white', 
                          border: '1px solid #cbd5e1', 
                          color: '#475569', 
                          height: '36px', 
                          padding: '0 12px',
                          borderRadius: '8px', 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          cursor: 'pointer', 
                          transition: 'all 0.2s', 
                          opacity: 1,
                          fontSize: '0.85rem',
                          fontWeight: 'bold'
                        }}
                        title="Editar"
                        onMouseOver={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#0f172a'; }}
                        onMouseOut={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = '#475569'; }}
                      >
                        Editar
                      </button>
                    </div>
                  </td>

                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
