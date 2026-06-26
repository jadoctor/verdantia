'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { getMediaUrl } from '@/lib/media-url';
import '@/components/admin/EspecieForm.css';
import PhotoEditorModal from '@/components/admin/PhotoEditorModal';

const STYLE_FILTERS: Record<string, string> = {
  '': 'none',
  comic: 'contrast(1.45) saturate(1.55) brightness(1.08)',
  vintage: 'sepia(0.4) contrast(1.1) brightness(0.9) saturate(0.8)',
  cinematic: 'contrast(1.3) saturate(1.2) brightness(0.9) hue-rotate(-5deg)',
  bnw: 'grayscale(1) contrast(1.2) brightness(1.05)',
  fade: 'contrast(0.9) brightness(1.1) saturate(0.7)',
  cool: 'saturate(1.2) hue-rotate(15deg) brightness(1.05)',
  warm: 'saturate(1.3) hue-rotate(-15deg) contrast(1.1)',
  dramatic: 'contrast(1.5) saturate(0.8) brightness(0.8)',
};

const parsePdfResumen = (resumenStr: string) => {
  if (!resumenStr) return { text: '', metadata: {} };
  try {
    const parsed = JSON.parse(resumenStr);
    if (parsed.text !== undefined) {
      return { text: parsed.text || '', metadata: parsed };
    }
    return { text: resumenStr, metadata: {} };
  } catch (e) {
    return { text: resumenStr, metadata: {} };
  }
};

export default function EditarPdfPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const pdfId = parseInt(resolvedParams.id, 10);
  
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pdf, setPdf] = useState<any>(null);
  
  const [isPdfFormCollapsed, setIsPdfFormCollapsed] = useState(false);
  const [isBlogsCollapsed, setIsBlogsCollapsed] = useState(true);
  
  const [pdfTitle, setPdfTitle] = useState('');
  const [pdfSummary, setPdfSummary] = useState('');
  const [pdfMetadata, setPdfMetadata] = useState<any>({});
  const [pdfApuntes, setPdfApuntes] = useState('');
  const [pdfActivo, setPdfActivo] = useState(true);
  const [pdfEditorSaveStatus, setPdfEditorSaveStatus] = useState<'idle' | 'saving' | 'no-changes'>('idle');
  const [generatingCoverId, setGeneratingCoverId] = useState<number | null>(null);

  const [photoEditorOpen, setPhotoEditorOpen] = useState(false);
  const [photoEditorSaveStatus, setPhotoEditorSaveStatus] = useState<'idle' | 'saving' | 'no-changes'>('idle');

  const [blogIaModalOpen, setBlogIaModalOpen] = useState(false);
  const [blogIaLanguage, setBlogIaLanguage] = useState<'es' | 'en' | 'fr'>('es');
  const [blogIaLoading, setBlogIaLoading] = useState(false);
  const [blogIaTimer, setBlogIaTimer] = useState(0);
  const [blogIaPrompt, setBlogIaPrompt] = useState('Por favor, analiza este documento técnico y escribe un artículo de blog agronómico completo y detallado, siguiendo el esquema estándar. Asegúrate de incluir datos numéricos precisos y consejos prácticos si los hay.');

  const [blogsList, setBlogsList] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.email) {
        setUserEmail(user.email);
      } else {
        router.push('/admin');
      }
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (authReady && userEmail) {
      loadPdf();
    }
  }, [authReady, userEmail, pdfId]);

  const loadPdf = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/pdfs/${pdfId}`, { headers: { 'x-user-email': userEmail || '' } });
      if (res.ok) {
        const data = await res.json();
        setPdf(data.pdf);
        setPdfTitle(data.pdf.titulo || '');
        const { text, metadata } = parsePdfResumen(data.pdf.resumen || '');
        setPdfSummary(text);
        setPdfMetadata(metadata);
        setPdfApuntes(data.pdf.apuntes || '');
        setPdfActivo(!!data.pdf.activo);

        const blogsRes = await fetch(`/api/admin/pdfs/${pdfId}/blogs`, { headers: { 'x-user-email': userEmail || '' } });
        if (blogsRes.ok) {
          const blogsData = await blogsRes.json();
          setBlogsList(blogsData.blogs || []);
        }
      }
    } catch (error) {
      console.error('Fetch error:', error);
    }
    setLoading(false);
  };

  const savePdfEdits = async (overrideData?: any) => {
    if (!pdf) return;
    setPdfEditorSaveStatus('saving');
    
    const bodyData = overrideData || {
      titulo: pdfTitle,
      resumen: JSON.stringify({ text: pdfSummary, ...pdfMetadata }),
      apuntes: pdfApuntes,
      activo: pdfActivo
    };

    try {
      const res = await fetch(`/api/admin/pdfs/${pdfId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': userEmail || ''
        },
        body: JSON.stringify(bodyData)
      });

      if (res.ok) {
        setPdfEditorSaveStatus('no-changes');
        setTimeout(() => setPdfEditorSaveStatus('idle'), 2000);
        await loadPdf();
      } else {
        setPdfEditorSaveStatus('idle');
        alert('Error al guardar los cambios');
      }
    } catch (error) {
      console.error('Save error:', error);
      setPdfEditorSaveStatus('idle');
      alert('Error de conexión');
    }
  };

  const toggleActivo = async () => {
    const newVal = !pdfActivo;
    setPdfActivo(newVal);
    await savePdfEdits({ activo: newVal });
  };

  const generatePdfCover = async () => {
    if (!pdf) return;
    setGeneratingCoverId(pdf.id);
    try {
      const promptText = `Genera una portada minimalista y profesional para un documento titulado "${pdfTitle || pdf.nombreOriginal}". Resumen: ${pdfSummary || 'Documento técnico'}`;
      const aiRes = await fetch('/api/ai/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptText })
      });

      if (aiRes.ok) {
        const aiData = await aiRes.json();
        const base64Image = aiData.images[0].base64;
        
        const saveRes = await fetch(`/api/admin/pdfs/${pdfId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail || '' },
          body: JSON.stringify({ portada: `data:image/jpeg;base64,${base64Image}` })
        });
        
        if (saveRes.ok) {
          await loadPdf();
        }
      }
    } catch (error) {
      console.error('AI Error:', error);
      alert('Error al generar la portada con IA');
    }
    setGeneratingCoverId(null);
  };

  const handlePhotoEditorSave = async (newMeta: any) => {
    if (newMeta.noChanges) {
      setPhotoEditorSaveStatus('no-changes');
      setTimeout(() => {
        setPhotoEditorSaveStatus('idle');
        setPhotoEditorOpen(false);
      }, 1000);
      return;
    }

    setPhotoEditorSaveStatus('saving');
    const updatedMetadata = { ...pdfMetadata, ...newMeta };
    setPdfMetadata(updatedMetadata);
    
    try {
      const res = await fetch(`/api/admin/pdfs/${pdfId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail || '' },
        body: JSON.stringify({ resumen: JSON.stringify({ text: pdfSummary, ...updatedMetadata }) })
      });
      if (res.ok) {
        setPhotoEditorSaveStatus('no-changes');
        setTimeout(() => {
          setPhotoEditorSaveStatus('idle');
          setPhotoEditorOpen(false);
        }, 1000);
        await loadPdf();
      } else {
        setPhotoEditorSaveStatus('idle');
        alert('Error al guardar los estilos');
      }
    } catch {
      setPhotoEditorSaveStatus('idle');
      alert('Error de red al guardar los estilos');
    }
  };

  const handleGenerateBlog = () => {
    setBlogIaLoading(true);
    setBlogIaTimer(0);
    const interval = setInterval(() => setBlogIaTimer(t => t + 1), 1000);
    
    // Simular llamada a la IA y creación del blog (aquí realmente harías el fetch a /api/ai/generate-blog)
    setTimeout(() => {
      clearInterval(interval);
      setBlogIaLoading(false);
      setBlogIaModalOpen(false);
      router.push(`/dashboard/admin/blog/nuevo?sourcePdf=${pdfId}&lang=${blogIaLanguage}`);
    }, 3000);
  };

  const handleDeleteBlog = async (blogId: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este blog generado de la base de datos?')) return;
    try {
      const res = await fetch(`/api/admin/blog/${blogId}`, {
        method: 'DELETE',
        headers: { 'x-user-email': userEmail || '' }
      });
      if (res.ok) {
        await loadPdf();
      } else {
        const data = await res.json();
        alert(data.error || 'Error al eliminar blog');
      }
    } catch (e) {
      console.error(e);
      alert('Error al eliminar blog');
    }
  };

  const hasPdfChanges = pdfTitle !== (pdf?.titulo || '') ||
    pdfSummary !== parsePdfResumen(pdf?.resumen || '').text ||
    pdfApuntes !== (pdf?.apuntes || '');

  if (!authReady || loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#64748b' }}>
        <div style={{ width: '50px', height: '50px', border: '4px solid #e2e8f0', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '20px' }}></div>
        <h3 style={{ margin: 0, fontWeight: 600 }}>Cargando Documento...</h3>
      </div>
    );
  }

  if (!pdf) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: '#ef4444' }}>
        <h2>Documento no encontrado</h2>
        <button onClick={() => router.push('/dashboard/admin/pdfs')} style={{ padding: '10px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', marginTop: '20px' }}>Volver al listado</button>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', minHeight: '100vh', background: '#f8fafc', paddingBottom: '60px' }}>
      
      {/* NAVEGACIÓN HIERÁRQUICA SUPERIOR (Regla 8) */}
      <div style={{ padding: '20px 32px 10px', display: 'flex', gap: '12px' }}>
        <button type="button" onClick={() => router.push('/dashboard/admin')} style={{ padding: '8px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', background: 'white', color: '#475569', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.background = '#f1f5f9'} onMouseOut={e => e.currentTarget.style.background = 'white'}>
          🏠 Volver al Inicio
        </button>
        <button type="button" onClick={() => router.push('/dashboard/admin/pdfs')} style={{ padding: '8px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', background: 'white', color: '#475569', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.background = '#f1f5f9'} onMouseOut={e => e.currentTarget.style.background = 'white'}>
          🔙 Volver a Listado Global de PDFs
        </button>
      </div>

      <div style={{ padding: '0 32px' }}>
        {/* SUBHEADER CONTEXTUAL (Regla 8) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)', padding: '16px 24px', borderRadius: '16px', marginBottom: '20px', color: 'white', boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.3)' }}>
          <div style={{ flex: '1 1 auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <h2 style={{ margin: 0, fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 700, textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <span style={{ fontSize: '1.6rem' }}>📄</span> {pdfTitle || pdf.nombreOriginal}
            </h2>
            <div style={{ fontSize: '0.85rem', color: '#e0e7ff', fontWeight: 500 }}>
              ✏️ Editar Documento · ID del Registro: {pdf.id}
            </div>
          </div>
          <div style={{ flex: '1', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px' }}>
            <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)', backdropFilter: 'blur(4px)' }}>
              📂 {pdf.nombreOriginal}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 12px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600, backdropFilter: 'blur(4px)' }}>
              {pdfEditorSaveStatus === 'saving' ? '⏳ Guardando...' : pdfEditorSaveStatus === 'no-changes' ? '✅ Guardado' : '📝 Esperando...'}
            </div>
          </div>
        </div>

        {/* ESTADO GLOBAL/ACTIVO EN PRIMER LUGAR (Regla 8) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', padding: '16px 24px', background: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b', flexShrink: 0 }}>Visibilidad Global</h3>
          <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={toggleActivo}
              style={{
                width: '60px', height: '32px', borderRadius: '16px', border: 'none',
                background: pdfActivo ? '#10b981' : '#cbd5e1',
                position: 'relative', cursor: 'pointer', transition: 'background 0.3s'
              }}
            >
              <div style={{
                width: '26px', height: '26px', background: 'white', borderRadius: '50%',
                position: 'absolute', top: '3px', left: pdfActivo ? '31px' : '3px',
                transition: 'left 0.3s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }} />
            </button>
            <span style={{ fontWeight: 600, color: pdfActivo ? '#059669' : '#64748b', fontSize: '0.95rem' }}>
              {pdfActivo ? '🟢 El PDF es visible y está activo en el sistema' : '⚪ El PDF está inhabilitado (Oculto)'}
            </span>
          </div>
        </div>

        {/* HERO CAROUSEL (Regla 9) */}
        <div style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', borderRadius: '16px', padding: '24px', marginBottom: '24px', display: 'flex', gap: '24px', alignItems: 'center', boxShadow: '0 15px 30px -10px rgba(0,0,0,0.4)', position: 'relative', overflow: 'hidden' }}>
          
          {/* Decorative background glow */}
          <div style={{ position: 'absolute', top: '-50%', right: '-10%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, rgba(0,0,0,0) 70%)', borderRadius: '50%', pointerEvents: 'none' }}></div>

          {/* Hero Image - strictly 180x220 */}
          <div style={{ flex: '0 0 180px', height: '220px', borderRadius: '12px', background: '#0f172a', border: '2px solid rgba(255,255,255,0.1)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', zIndex: 1 }}>
            {pdf.portada ? (
              <>
                <img 
                  src={getMediaUrl(pdf.portada)} 
                  alt="Portada PDF" 
                  style={{ 
                    position: 'absolute',
                    inset: 0,
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'cover',
                    objectPosition: `${pdfMetadata.profile_object_x ?? 50}% ${pdfMetadata.profile_object_y ?? 50}%`,
                    transformOrigin: `${pdfMetadata.profile_object_x ?? 50}% ${pdfMetadata.profile_object_y ?? 50}%`,
                    filter: `brightness(${pdfMetadata.profile_brightness ?? 100}%) contrast(${pdfMetadata.profile_contrast ?? 100}%) ${pdfMetadata.profile_style ? STYLE_FILTERS[pdfMetadata.profile_style] : ''}`.trim(),
                    transform: `scale(${(pdfMetadata.profile_object_zoom ?? 100) / 100})`
                  }} 
                  crossOrigin="anonymous" 
                />
                <button
                  type="button"
                  onClick={() => setPhotoEditorOpen(true)}
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.9)',
                    border: '1px solid #cbd5e1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    zIndex: 10,
                    transition: 'all 0.2s ease',
                    fontSize: '0.9rem'
                  }}
                  title="Editar encuadre y filtros"
                  onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'}
                  onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  ✏️
                </button>
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#64748b' }}>
                <span style={{ fontSize: '3rem' }}>📄</span>
                <span style={{ fontSize: '0.8rem', marginTop: '10px', fontWeight: 600 }}>Sin Portada</span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', zIndex: 1 }}>
            <h3 style={{ margin: 0, color: 'white', fontSize: '1.4rem', fontWeight: 600 }}>Imagen de Portada</h3>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem', maxWidth: '400px', lineHeight: 1.5 }}>
              Genera una portada atractiva utilizando Inteligencia Artificial basada en el título y resumen del documento. Esta imagen se usará como vista previa en todo el sistema.
            </p>
            <button
              onClick={generatePdfCover}
              disabled={generatingCoverId === pdf.id}
              style={{ padding: '12px 24px', background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: generatingCoverId === pdf.id ? 'wait' : 'pointer', fontSize: '0.95rem', display: 'inline-flex', alignItems: 'center', gap: '8px', alignSelf: 'flex-start', boxShadow: '0 4px 15px rgba(139, 92, 246, 0.4)', transition: 'transform 0.2s', opacity: generatingCoverId === pdf.id ? 0.7 : 1 }}
              onMouseOver={e => { if (generatingCoverId !== pdf.id) e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseOut={e => { if (generatingCoverId !== pdf.id) e.currentTarget.style.transform = 'translateY(0)' }}
            >
              <span style={{ fontSize: '1.2rem' }}>✨</span>
              {generatingCoverId === pdf.id ? 'Generando con Imagen 4.0...' : (pdf.portada ? 'Regenerar Portada con IA' : 'Generar Portada con IA')}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* FOLDER 1: DATOS DEL PDF */}
          <div style={{ background: 'white', borderRadius: '16px', padding: '24px 32px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', transition: 'all 0.3s ease' }}>
            
            {/* Cabecera Colapsable */}
            <div
              onClick={() => setIsPdfFormCollapsed(!isPdfFormCollapsed)}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', marginBottom: isPdfFormCollapsed ? '0' : '24px' }}
            >
              <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                📄 Ficha del Documento
              </h3>
              <span style={{ transform: isPdfFormCollapsed ? 'rotate(0deg)' : 'rotate(90deg)', transition: 'transform 0.2s', color: '#64748b', fontSize: '1.2rem', display: 'inline-block' }}>▶</span>
            </div>

            {!isPdfFormCollapsed && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '32px' }}>
                
                {/* COLUMNA IZQUIERDA: VISOR PDF */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <label style={{ fontWeight: 700, color: '#334155', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    📖 Visualizador del Documento
                  </label>
                  <div style={{ width: '100%', height: '600px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)', background: '#f1f5f9' }}>
                    {pdf.ruta ? (
                      <iframe 
                        src={`${getMediaUrl(pdf.ruta)}#toolbar=0&navpanes=0`} 
                        title="Visor PDF"
                        width="100%" 
                        height="100%" 
                        style={{ border: 'none' }}
                      />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                        No hay archivo disponible
                      </div>
                    )}
                  </div>
                </div>

                {/* COLUMNA DERECHA: FORMULARIOS Y APUNTES */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ fontWeight: 600, color: '#334155', fontSize: '0.95rem' }}>Nombre del Documento *</label>
                      <input
                        type="text"
                        value={pdfTitle}
                        onChange={e => setPdfTitle(e.target.value)}
                        placeholder={pdf.nombreOriginal}
                        style={{ padding: '14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '1rem', background: '#f8fafc', transition: 'border-color 0.2s', outline: 'none' }}
                        onFocus={e => e.currentTarget.style.borderColor = '#3b82f6'}
                        onBlur={e => e.currentTarget.style.borderColor = '#cbd5e1'}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontWeight: 600, color: '#334155', fontSize: '0.95rem' }}>Resumen Corto (Meta Description)</label>
                    <textarea
                      value={pdfSummary}
                      onChange={e => setPdfSummary(e.target.value)}
                      placeholder="Escribe un resumen conciso y atractivo de 1-2 líneas..."
                      rows={3}
                      style={{ padding: '14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '1rem', background: '#f8fafc', resize: 'vertical', transition: 'border-color 0.2s', outline: 'none', fontFamily: 'inherit' }}
                      onFocus={e => e.currentTarget.style.borderColor = '#3b82f6'}
                      onBlur={e => e.currentTarget.style.borderColor = '#cbd5e1'}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexGrow: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label style={{ fontWeight: 700, color: '#059669', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        🎓 Apuntes (Modo Estudiante)
                      </label>
                      {pdfApuntes && (
                        <button 
                          type="button" 
                          onClick={() => {
                            const blob = new Blob([pdfApuntes], { type: 'text/plain' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `Apuntes_${pdfTitle || pdf.nombreOriginal || 'PDF'}.txt`;
                            a.click();
                            URL.revokeObjectURL(url);
                          }}
                          style={{ padding: '4px 12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                          ⬇️ Descargar
                        </button>
                      )}
                    </div>
                    <textarea
                      value={pdfApuntes}
                      onChange={e => setPdfApuntes(e.target.value)}
                      placeholder="Notas detalladas, esquemas o apuntes extraídos del contenido técnico del PDF..."
                      style={{ padding: '16px', borderRadius: '10px', border: '2px solid #a7f3d0', fontSize: '1.05rem', background: '#ecfdf5', resize: 'none', minHeight: '300px', height: '100%', outline: 'none', fontFamily: 'inherit', color: '#064e3b', lineHeight: 1.6 }}
                      onFocus={e => e.currentTarget.style.borderColor = '#10b981'}
                      onBlur={e => e.currentTarget.style.borderColor = '#a7f3d0'}
                    />
                  </div>
                </div>
              </div>

              {/* ACTION BAR INFERIOR */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '24px', borderTop: '1px solid #e2e8f0', marginTop: '8px' }}>
                <button 
                  type="button" 
                  onClick={() => savePdfEdits()} 
                  disabled={!hasPdfChanges || pdfEditorSaveStatus === 'saving'}
                  style={{ padding: '14px 28px', borderRadius: '10px', border: 'none', background: hasPdfChanges ? 'linear-gradient(135deg, #10b981, #059669)' : '#94a3b8', color: 'white', fontWeight: 700, cursor: hasPdfChanges ? 'pointer' : 'not-allowed', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '10px', transition: 'all 0.3s', boxShadow: hasPdfChanges ? '0 10px 15px -3px rgba(16, 185, 129, 0.4)' : 'none' }}
                >
                  {pdfEditorSaveStatus === 'saving' ? '⏳ Guardando cambios...' : '💾 Guardar Metadatos'}
                </button>
              </div>

              </div>
            )}
          </div>

          {/* FOLDER 2: BLOGS */}
          <div style={{ background: 'white', borderRadius: '16px', padding: '24px 32px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', transition: 'all 0.3s ease' }}>
            {/* Cabecera Colapsable */}
            <div
              onClick={() => setIsBlogsCollapsed(!isBlogsCollapsed)}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', marginBottom: isBlogsCollapsed ? '0' : '24px' }}
            >
              <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                📝 Blogs Relacionados ({pdf.blogsAsociados || 0})
              </h3>
              <span style={{ transform: isBlogsCollapsed ? 'rotate(0deg)' : 'rotate(90deg)', transition: 'transform 0.2s', color: '#64748b', fontSize: '1.2rem', display: 'inline-block' }}>▶</span>
            </div>

            {!isBlogsCollapsed && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', background: '#f8fafc', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.3rem', color: '#1e293b', fontWeight: 700 }}>Motor de Blogs IA 🤖</h3>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '0.95rem' }}>Usa este documento como base de conocimiento para redactar artículos agronómicos optimizados.</p>
                </div>
                <button 
                  type="button" 
                  onClick={() => setBlogIaModalOpen(true)}
                  style={{ padding: '14px 24px', background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 10px 15px -3px rgba(139, 92, 246, 0.4)', fontSize: '1.05rem', transition: 'transform 0.2s' }}
                  onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <span style={{ fontSize: '1.25rem' }}>🧙‍♂️</span> Guía IA de Blogs
                </button>
              </div>

              {blogsList.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>Artículos Generados</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                    {blogsList.map(b => (
                      <div key={b.id} style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', transition: 'all 0.2s' }}>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                          {b.hero_imagen ? (
                            <div style={{ flex: '0 0 60px', height: '60px', borderRadius: '8px', overflow: 'hidden', background: '#f1f5f9' }}>
                              <img src={getMediaUrl(b.hero_imagen)} alt={b.titulo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} crossOrigin="anonymous" />
                            </div>
                          ) : (
                            <div style={{ flex: '0 0 60px', height: '60px', borderRadius: '8px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>📝</div>
                          )}
                          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                            <a href={`/blog/${b.slug}?preview=true`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f766e', lineHeight: 1.3, textDecoration: 'none', marginBottom: '4px' }} onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'} onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>
                              {b.titulo}
                            </a>
                            <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              📅 {new Date(b.fechaCreacion).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                            </span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
                          <span style={{ fontSize: '0.75rem', color: b.estado === 'publicado' ? '#059669' : '#d97706', fontWeight: 700, background: b.estado === 'publicado' ? '#d1fae5' : '#fef3c7', padding: '4px 8px', borderRadius: '6px' }}>
                            {b.estado === 'publicado' ? 'Publicado' : 'Borrador'}
                          </span>
                          <button type="button" onClick={() => handleDeleteBlog(b.id)} style={{ background: '#fee2e2', border: '1px solid #fecaca', color: '#ef4444', cursor: 'pointer', padding: '6px 12px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.background = '#fecaca'} onMouseOut={e => e.currentTarget.style.background = '#fee2e2'}>
                            Eliminar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '50px 20px', background: '#f8fafc', borderRadius: '12px', border: '2px dashed #cbd5e1', color: '#64748b' }}>
                  <span style={{ fontSize: '3rem', display: 'block', marginBottom: '16px', opacity: 0.5 }}>📝</span>
                  <h3 style={{ margin: '0 0 8px 0', color: '#475569' }}>Aún no hay artículos</h3>
                  <p style={{ margin: 0 }}>Haz clic en el botón morado de arriba para que la IA extraiga la información clave y escriba un borrador de blog.</p>
                </div>
              )}

              </div>
            )}
          </div>

        </div>
      </div>

      <PhotoEditorModal 
        isOpen={photoEditorOpen}
        onClose={() => setPhotoEditorOpen(false)}
        photoUrl={pdf.portada ? getMediaUrl(pdf.portada) : ''}
        fileName={pdf.nombreOriginal || 'portada_pdf'}
        initialMetadata={pdfMetadata}
        onSave={handlePhotoEditorSave}
        saveStatus={photoEditorSaveStatus}
      />

      {/* Modal Pre-Ejecución Asistente IA (Regla 17) */}
      {blogIaModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          <div style={{ background: 'white', borderRadius: '16px', width: '100%', maxWidth: '800px', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            
            {/* Header del Modal */}
            <div style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white' }}>
              <h2 style={{ margin: 0, fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 700 }}>
                ✨ Asistente IA
              </h2>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setBlogIaModalOpen(false)} disabled={blogIaLoading} style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)', borderRadius: '8px', color: 'white', fontWeight: 600, cursor: blogIaLoading ? 'not-allowed' : 'pointer' }}>Cancelar</button>
                <button type="button" onClick={handleGenerateBlog} disabled={blogIaLoading} style={{ padding: '8px 24px', background: 'white', color: '#6d28d9', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: blogIaLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                  {blogIaLoading ? `⏳ Analizando... ${blogIaTimer}s` : '🚀 Analizar'}
                </button>
              </div>
            </div>

            {/* Contador Mensual */}
            <div style={{ padding: '10px 24px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></span>
                Interacciones IA este mes: 24 / 100
              </span>
            </div>

            {/* Body del Modal */}
            <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* 1. Entidad Objetivo */}
              <div style={{ background: '#f1f5f9', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '2rem' }}>📄</span>
                <div>
                  <h4 style={{ margin: '0 0 4px 0', color: '#1e293b' }}>Documento de Origen</h4>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '0.95rem' }}>{pdfTitle || pdf.nombreOriginal}</p>
                </div>
              </div>

              {/* 2. System Prompt Base */}
              <details style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
                <summary style={{ padding: '16px', fontWeight: 600, color: '#475569', cursor: 'pointer', background: '#f8fafc', userSelect: 'none' }}>
                  ⚙️ System Prompt Base (Instrucciones internas)
                </summary>
                <div style={{ padding: '16px', borderTop: '1px solid #e2e8f0', background: '#fefefe', fontSize: '0.85rem', fontFamily: 'monospace', color: '#64748b', whiteSpace: 'pre-wrap' }}>
                  Eres un asistente experto en agronomía y redactor SEO. Tu tarea es leer detenidamente el texto y apuntes del PDF proporcionado, y extraer la información clave para estructurarla en un artículo de blog que siga estrictamente el esquema estándar de Verdantia.
                </div>
              </details>

              {/* 3. Prompt Dinámico */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontWeight: 600, color: '#334155' }}>Instrucciones Adicionales (Prompt)</label>
                <textarea 
                  value={blogIaPrompt}
                  onChange={e => setBlogIaPrompt(e.target.value)}
                  disabled={blogIaLoading}
                  style={{ width: '100%', padding: '16px', borderRadius: '10px', border: '1px solid #cbd5e1', minHeight: '120px', resize: 'vertical', fontFamily: 'inherit', fontSize: '0.95rem', background: blogIaLoading ? '#f1f5f9' : 'white' }}
                />
              </div>

              {/* 4. Selector de Idioma */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <label style={{ fontWeight: 600, color: '#334155' }}>Idioma del Artículo</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px' }}>
                  <button 
                    type="button" 
                    onClick={() => setBlogIaLanguage('es')}
                    disabled={blogIaLoading}
                    style={{ padding: '16px', borderRadius: '12px', border: blogIaLanguage === 'es' ? '2px solid #8b5cf6' : '1px solid #e2e8f0', background: blogIaLanguage === 'es' ? '#f5f3ff' : 'white', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}
                  >
                    <span style={{ fontSize: '2rem' }}>🇪🇸</span>
                    <span style={{ fontWeight: 600, color: blogIaLanguage === 'es' ? '#7c3aed' : '#64748b' }}>Español</span>
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setBlogIaLanguage('en')}
                    disabled={blogIaLoading}
                    style={{ padding: '16px', borderRadius: '12px', border: blogIaLanguage === 'en' ? '2px solid #8b5cf6' : '1px solid #e2e8f0', background: blogIaLanguage === 'en' ? '#f5f3ff' : 'white', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}
                  >
                    <span style={{ fontSize: '2rem' }}>🇬🇧</span>
                    <span style={{ fontWeight: 600, color: blogIaLanguage === 'en' ? '#7c3aed' : '#64748b' }}>Inglés</span>
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setBlogIaLanguage('fr')}
                    disabled={blogIaLoading}
                    style={{ padding: '16px', borderRadius: '12px', border: blogIaLanguage === 'fr' ? '2px solid #8b5cf6' : '1px solid #e2e8f0', background: blogIaLanguage === 'fr' ? '#f5f3ff' : 'white', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}
                  >
                    <span style={{ fontSize: '2rem' }}>🇫🇷</span>
                    <span style={{ fontWeight: 600, color: blogIaLanguage === 'fr' ? '#7c3aed' : '#64748b' }}>Francés</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
