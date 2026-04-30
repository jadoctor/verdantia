'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import '@/components/admin/EspecieForm.css';

export default function BlogEditorDashboard() {
  const params = useParams();
  const router = useRouter();
  const [blog, setBlog] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // -- Photo Editor State --
  const [editingPhoto, setEditingPhoto] = useState<{index: number, url: string} | null>(null);
  const [editorX, setEditorX] = useState(50);
  const [editorY, setEditorY] = useState(38);
  const [editorZoom, setEditorZoom] = useState(100);
  const [editorBrightness, setEditorBrightness] = useState(100);
  const [editorContrast, setEditorContrast] = useState(100);
  const [editorStyle, setEditorStyle] = useState('');
  const [editorSeoAlt, setEditorSeoAlt] = useState('');
  const [editorSeoTitle, setEditorSeoTitle] = useState('');
  const [editorInitialState, setEditorInitialState] = useState('');
  
  // Drag to pan
  const editorDragRef = React.useRef<{ dragging: boolean; startX: number; startY: number; startPosX: number; startPosY: number }>({
    dragging: false, startX: 0, startY: 0, startPosX: 50, startPosY: 50
  });

  useEffect(() => {
    fetch(`/api/admin/blog/${params.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setBlog(data.data);
        } else {
          alert('Artículo no encontrado');
          router.push('/dashboard/admin/blog');
        }
        setLoading(false);
      });
  }, [params.id, router]);

  const handleSave = async (estado: 'borrador' | 'publicado') => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/blog/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...blog, xblogestado: estado })
      });
      const data = await res.json();
      if (data.success) {
        alert('Guardado correctamente');
        router.push('/dashboard/admin/blog');
      } else {
        alert('Error: ' + data.error);
      }
    } catch (e) {
      alert('Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  const handleSeoChange = (index: number, field: 'alt'|'title', value: string) => {
    try {
      const data = JSON.parse(blog.xblogcontenido);
      let curr = 0;
      if (data.hero_imagen) {
        if (curr === index) {
          if (field === 'alt') data.hero_imagen_alt = value;
          if (field === 'title') data.hero_imagen_title = value;
        }
        curr++;
      }
      if (data.secciones) {
        data.secciones.forEach((sec: any) => {
          if (sec.imagen_ruta) {
            if (curr === index) {
              if (field === 'alt') sec.imagen_alt = value;
              if (field === 'title') sec.imagen_title = value;
            }
            curr++;
          }
        });
      }
      setBlog({...blog, xblogcontenido: JSON.stringify(data, null, 2)});
    } catch (e) {}
  };

  const openPhotoEditor = (index: number, url: string) => {
    try {
      const data = JSON.parse(blog.xblogcontenido);
      let curr = 0;
      let targetCss = null;
      let targetAlt = '';
      let targetTitle = '';

      if (data.hero_imagen) {
        if (curr === index) {
          targetCss = data.hero_imagen_css;
          targetAlt = data.hero_imagen_alt || '';
          targetTitle = data.hero_imagen_title || '';
        }
        curr++;
      }
      if (data.secciones) {
        data.secciones.forEach((sec: any) => {
          if (sec.imagen_ruta) {
            if (curr === index) {
              targetCss = sec.imagen_css;
              targetAlt = sec.imagen_alt || '';
              targetTitle = sec.imagen_title || '';
            }
            curr++;
          }
        });
      }

      if (targetCss) {
        setEditorX(targetCss.x ?? 50);
        setEditorY(targetCss.y ?? 50);
        setEditorZoom(targetCss.zoom ?? 100);
        setEditorBrightness(targetCss.brightness ?? 100);
        setEditorContrast(targetCss.contrast ?? 100);
        setEditorStyle(targetCss.style ?? '');
      } else {
        setEditorX(50); setEditorY(50); setEditorZoom(100); 
        setEditorBrightness(100); setEditorContrast(100); setEditorStyle('');
      }
      
      setEditorSeoAlt(targetAlt);
      setEditorSeoTitle(targetTitle);
      
      setEditorInitialState(JSON.stringify({
        x: targetCss?.x ?? 50, y: targetCss?.y ?? 50, zoom: targetCss?.zoom ?? 100, 
        brightness: targetCss?.brightness ?? 100, contrast: targetCss?.contrast ?? 100, 
        style: targetCss?.style ?? '', seo_alt: targetAlt, seo_title: targetTitle
      }));

      setEditingPhoto({ index, url });
    } catch (e) {}
  };

  const savePhotoEdits = () => {
    if (!editingPhoto) return;
    try {
      const data = JSON.parse(blog.xblogcontenido);
      let curr = 0;
      const newCss = { x: editorX, y: editorY, zoom: editorZoom, brightness: editorBrightness, contrast: editorContrast, style: editorStyle };

      if (data.hero_imagen) {
        if (curr === editingPhoto.index) {
          data.hero_imagen_css = newCss;
          data.hero_imagen_alt = editorSeoAlt;
          data.hero_imagen_title = editorSeoTitle;
        }
        curr++;
      }
      if (data.secciones) {
        data.secciones.forEach((sec: any) => {
          if (sec.imagen_ruta) {
            if (curr === editingPhoto.index) {
              sec.imagen_css = newCss;
              sec.imagen_alt = editorSeoAlt;
              sec.imagen_title = editorSeoTitle;
            }
            curr++;
          }
        });
      }
      setBlog({...blog, xblogcontenido: JSON.stringify(data, null, 2)});
      setEditingPhoto(null);
    } catch (e) {}
  };

  const onEditorMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    editorDragRef.current = { dragging: true, startX: e.clientX, startY: e.clientY, startPosX: editorX, startPosY: editorY };
    const handleMouseMove = (ev: MouseEvent) => {
      if (!editorDragRef.current.dragging) return;
      const dx = ev.clientX - editorDragRef.current.startX;
      const dy = ev.clientY - editorDragRef.current.startY;
      const sensitivity = 0.15 * (100 / Math.max(editorZoom, 100));
      setEditorX(Math.max(0, Math.min(100, editorDragRef.current.startPosX - dx * sensitivity)));
      setEditorY(Math.max(0, Math.min(100, editorDragRef.current.startPosY - dy * sensitivity)));
    };
    const handleMouseUp = () => {
      editorDragRef.current.dragging = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Cargando...</div>;
  if (!blog) return null;

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      {/* ── Navegación ── */}
      <div style={{ marginBottom: '16px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button onClick={() => router.push('/dashboard')} style={{ background: 'white', border: '1px solid #cbd5e1', color: '#475569', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          🏠 Volver al Inicio
        </button>
        <button onClick={() => router.push('/dashboard/admin/blog')} style={{ background: 'white', border: '1px solid #cbd5e1', color: '#475569', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          📝 Volver al Blog
        </button>
      </div>

      {/* ── Subheader Integrado ── */}
      <div style={{ background: 'linear-gradient(135deg, #10b981, #047857)', borderRadius: '16px', padding: '24px 28px', marginBottom: '24px', color: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800 }}>
              Editar Artículo: {blog.xblogtitulo || 'Nuevo Artículo'}
            </h1>
            <p style={{ margin: '4px 0 0', opacity: 0.9, fontSize: '0.9rem' }}>
              Estado actual: {blog.xblogestado === 'publicado' ? '✅ Publicado' : '📝 Borrador'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <a 
              href={`/blog/${blog.xblogslug}?preview=true`} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ padding: '8px 16px', borderRadius: '8px', background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'none', color: 'white', display: 'flex', alignItems: 'center', fontSize: '0.85rem' }}
            >
              👁️ Visualizar
            </a>
            <button 
              onClick={() => handleSave('borrador')} 
              disabled={saving}
              style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: 'white', color: '#047857', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}
            >
              💾 Guardar Borrador
            </button>
            <button 
              onClick={() => handleSave('publicado')} 
              disabled={saving}
              style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #10b981', background: '#064e3b', color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}
            >
              🚀 Publicar Ahora
            </button>
          </div>
        </div>
      </div>

      <div style={{ background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        <div className="form-group">
          <label style={{ fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '5px' }}>Título</label>
          <input 
            type="text" 
            value={blog.xblogtitulo} 
            onChange={e => setBlog({...blog, xblogtitulo: e.target.value})}
            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1.2rem', fontWeight: 'bold' }}
          />
        </div>

        <div className="form-group">
          <label style={{ fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '5px' }}>Slug (URL)</label>
          <input 
            type="text" 
            value={blog.xblogslug} 
            onChange={e => setBlog({...blog, xblogslug: e.target.value})}
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
          />
        </div>

        <div className="form-group">
          <label style={{ fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '5px' }}>Resumen</label>
          <textarea 
            value={blog.xblogresumen} 
            onChange={e => setBlog({...blog, xblogresumen: e.target.value})}
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', minHeight: '80px', resize: 'vertical' }}
          />
        </div>

        <div className="form-group">
          <label style={{ fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '5px' }}>Contenido (JSON / Markdown)</label>
          
          {(() => {
            try {
              const blogData = JSON.parse(blog.xblogcontenido);
              
              // Extraer imágenes
              const images: {url: string, alt: string, title: string, css: any}[] = [];
              if (blogData.hero_imagen) images.push({url: blogData.hero_imagen, alt: blogData.hero_imagen_alt || '', title: blogData.hero_imagen_title || '', css: blogData.hero_imagen_css});
              if (blogData.secciones) {
                blogData.secciones.forEach((sec: any) => {
                  if (sec.imagen_ruta) images.push({url: sec.imagen_ruta, alt: sec.imagen_alt || '', title: sec.imagen_title || '', css: sec.imagen_css});
                });
              }

              return (
                <div style={{ marginBottom: '15px' }}>
                  {images.length > 0 && (
                    <div style={{ marginBottom: '15px', padding: '20px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                      <p style={{ margin: '0 0 16px', fontWeight: 'bold', color: '#334155', fontSize: '1.05rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                        📸 Galería de Medios y SEO ({images.length})
                      </p>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                        {images.map((img, i) => (
                          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'white', padding: '12px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', border: '1px solid #cbd5e1' }}>
                            <div style={{ position: 'relative', width: '100%', height: '140px', borderRadius: '6px', overflow: 'hidden' }}>
                              <img src={img.url} alt={img.alt} style={{ 
                                width: '100%', height: '100%', objectFit: 'cover',
                                objectPosition: img.css ? `${img.css.x}% ${img.css.y}%` : '50% 50%',
                                transform: img.css ? `scale(${img.css.zoom / 100})` : 'scale(1)',
                                filter: img.css ? `brightness(${img.css.brightness}%) contrast(${img.css.contrast}%)` : 'none'
                              }} />
                              <button 
                                type="button" 
                                onClick={() => openPhotoEditor(i, img.url)}
                                style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.6)', border: 'none', color: 'white', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '1rem', backdropFilter: 'blur(4px)' }}
                                title="Editar imagen (Filtros, Zoom y Encuadre)"
                              >
                                ✏️
                              </button>
                            </div>
                            
                            <div>
                              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '2px' }}>Texto Alternativo (Alt):</label>
                              <input 
                                type="text" 
                                value={img.alt} 
                                onChange={(e) => handleSeoChange(i, 'alt', e.target.value)}
                                placeholder="Ej: Foto de cultivo"
                                style={{ width: '100%', padding: '6px', fontSize: '0.8rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                              />
                            </div>
                            
                            <div>
                              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '2px' }}>Título Emergente (Title):</label>
                              <input 
                                type="text" 
                                value={img.title} 
                                onChange={(e) => handleSeoChange(i, 'title', e.target.value)}
                                placeholder="Ej: Calabacín al sol"
                                style={{ width: '100%', padding: '6px', fontSize: '0.8rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', color: '#92400e', padding: '10px 15px', borderRadius: '8px', marginBottom: '10px', fontSize: '0.85rem' }}>
                    <strong>⚠️ Modo Avanzado:</strong> Este artículo usa el nuevo formato estructurado JSON. Puedes modificar los textos con cuidado, pero asegúrate de no romper la estructura JSON (comillas, corchetes).
                  </div>
                </div>
              );
            } catch (e) {
              return null; // Es markdown legacy
            }
          })()}

          <textarea 
            value={blog.xblogcontenido} 
            onChange={e => setBlog({...blog, xblogcontenido: e.target.value})}
            style={{ width: '100%', padding: '15px', borderRadius: '8px', border: '1px solid #cbd5e1', minHeight: '500px', resize: 'vertical', fontFamily: 'monospace', fontSize: '0.95rem', background: '#f8fafc', whiteSpace: 'pre' }}
          />
        </div>

      </div>

      {/* Editor Modal */}
      {editingPhoto && (
        <div className="photo-editor-overlay" onClick={() => setEditingPhoto(null)}>
          <div className="photo-editor-modal" onClick={e => e.stopPropagation()}>
            <div className="photo-editor-header">
              <h3>🎨 Editor Visual</h3>
              <button type="button" className="photo-editor-close" onClick={() => setEditingPhoto(null)}>✕</button>
            </div>

            <div className="photo-editor-body">
              <div className="photo-editor-preview-container" onMouseDown={onEditorMouseDown}>
                <div className="photo-editor-preview-mask" style={{ borderRadius: '12px', width: '220px', height: '220px', overflow: 'hidden' }}>
                  <img 
                    src={editingPhoto.url} 
                    alt="preview"
                    className="photo-editor-image"
                    draggable="false"
                    style={{
                      objectPosition: `${editorX}% ${editorY}%`,
                      transformOrigin: `${editorX}% ${editorY}%`,
                      transform: `scale(${editorZoom / 100})`,
                      filter: `brightness(${editorBrightness}%) contrast(${editorContrast}%)`,
                      width: '100%', height: '100%', objectFit: 'cover'
                    }}
                  />
                </div>
                <div className="photo-editor-hint">
                  <span>Arrastra para encuadrar</span>
                </div>
              </div>

              <div className="photo-editor-controls">
                <div className="editor-control-group">
                  <label><span className="control-label">🔍 Zoom ({editorZoom}%)</span></label>
                  <input type="range" min="100" max="300" value={editorZoom} onChange={e => setEditorZoom(Number(e.target.value))} />
                </div>
                <div className="editor-control-group">
                  <label><span className="control-label">☀️ Brillo ({editorBrightness}%)</span></label>
                  <input type="range" min="50" max="150" value={editorBrightness} onChange={e => setEditorBrightness(Number(e.target.value))} />
                </div>
                <div className="editor-control-group">
                  <label><span className="control-label">🌗 Contraste ({editorContrast}%)</span></label>
                  <input type="range" min="50" max="150" value={editorContrast} onChange={e => setEditorContrast(Number(e.target.value))} />
                </div>
                
                <div style={{ marginBottom: '15px', display: 'flex', gap: '8px' }}>
                  <button type="button" onClick={() => { setEditorBrightness(110); setEditorContrast(115); setEditorStyle(''); }} style={{ flex: 1, padding: '10px', background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)' }}>✨ Auto Color</button>
                  <button type="button" onClick={() => { setEditorBrightness(100); setEditorContrast(100); setEditorStyle(''); setEditorZoom(100); setEditorX(50); setEditorY(50); }} style={{ padding: '10px 15px', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>↺ Reset</button>
                </div>

                <div className="editor-control-group">
                  <label><span className="control-label">🏷️ Texto Alternativo (Alt)</span></label>
                  <input type="text" value={editorSeoAlt} onChange={e => setEditorSeoAlt(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                </div>
                <div className="editor-control-group">
                  <label><span className="control-label">💬 Título Emergente (Title)</span></label>
                  <input type="text" value={editorSeoTitle} onChange={e => setEditorSeoTitle(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                </div>
              </div>
            </div>

            <div className="photo-editor-footer">
              <button type="button" className="btn-secondary" onClick={() => setEditingPhoto(null)}>Cancelar</button>
              <button type="button" className="btn-primary" onClick={savePhotoEdits}>💾 Guardar Cambios</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
