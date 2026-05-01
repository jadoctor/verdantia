'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import '@/components/admin/EspecieForm.css';
import { auth } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';

export default function BlogEditorDashboard() {
  const params = useParams();
  const router = useRouter();
  const [blog, setBlog] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUserEmail(user?.email ?? null);
    });
    return () => unsubscribe();
  }, []);

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
  
  // -- AI Image Generation --
  const [aiGenLoading, setAiGenLoading] = useState(false);
  const [aiGenNote, setAiGenNote] = useState('');
  const [aiGenShowNote, setAiGenShowNote] = useState(false);
  
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
        body: JSON.stringify({ ...blog, blogestado: estado })
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
      const data = JSON.parse(blog.blogcontenido);
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
      setBlog({...blog, blogcontenido: JSON.stringify(data, null, 2)});
    } catch (e) {}
  };

  const openPhotoEditor = (index: number, url: string) => {
    try {
      const data = JSON.parse(blog.blogcontenido);
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
      const data = JSON.parse(blog.blogcontenido);
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
      setBlog({...blog, blogcontenido: JSON.stringify(data, null, 2)});
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
              Editar Artículo: {blog.blogtitulo || 'Nuevo Artículo'}
            </h1>
            <p style={{ margin: '4px 0 0', opacity: 0.9, fontSize: '0.9rem' }}>
              Estado actual: {blog.blogestado === 'publicado' ? '✅ Publicado' : '📝 Borrador'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <a 
              href={`/blog/${blog.blogslug}?preview=true`} 
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

      {/* ── Campos Meta (Título, Slug, Resumen) ── */}
      <div style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px', fontSize: '0.85rem' }}>Título</label>
            <input 
              type="text" 
              value={blog.blogtitulo} 
              onChange={e => setBlog({...blog, blogtitulo: e.target.value})}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', fontWeight: 'bold' }}
            />
          </div>
          <div>
            <label style={{ fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px', fontSize: '0.85rem' }}>Slug (URL)</label>
            <input 
              type="text" 
              value={blog.blogslug} 
              onChange={e => setBlog({...blog, blogslug: e.target.value})}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
            />
          </div>
        </div>
        <div>
          <label style={{ fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px', fontSize: '0.85rem' }}>Resumen</label>
          <textarea 
            value={blog.blogresumen} 
            onChange={e => setBlog({...blog, blogresumen: e.target.value})}
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', minHeight: '60px', resize: 'vertical' }}
          />
        </div>
      </div>

      {/* ── Vista Previa Editable (estilo blog público) ── */}
      {(() => {
        try {
          const blogData = JSON.parse(blog.blogcontenido);
          const heroImg = blogData.hero_imagen || null;

          const updateContent = (updater: (d: any) => void) => {
            const d = JSON.parse(blog.blogcontenido);
            updater(d);
            setBlog({...blog, blogcontenido: JSON.stringify(d, null, 2)});
          };

          // Calcular índice de imagen para el editor
          let imgIdx = 0;
          const heroImgIdx = heroImg ? imgIdx++ : -1;
          const secImgIdxs = (blogData.secciones || []).map((sec: any) => sec.imagen_ruta ? imgIdx++ : -1);

          return (
            <div style={{ background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              {/* Barra indicadora */}
              <div style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', color: 'white', padding: '8px 20px', fontSize: '0.78rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                ✏️ MODO EDITOR — Los cambios se reflejan en tiempo real
              </div>

              <div style={{ padding: '32px 28px', maxWidth: '860px', margin: '0 auto' }}>
                {/* HEADER con hero */}
                <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', marginBottom: '32px' }}>
                  {heroImg && (
                    <div style={{ position: 'relative', width: '180px', height: '180px', borderRadius: '14px', overflow: 'hidden', flexShrink: 0, boxShadow: '0 6px 20px rgba(0,0,0,.1)' }}>
                      <img src={heroImg} alt="" style={{
                        width: '100%', height: '100%', objectFit: 'cover',
                        objectPosition: blogData.hero_imagen_css ? `${blogData.hero_imagen_css.x}% ${blogData.hero_imagen_css.y}%` : '50% 50%',
                        transform: blogData.hero_imagen_css ? `scale(${blogData.hero_imagen_css.zoom / 100})` : 'scale(1)',
                        filter: blogData.hero_imagen_css ? `brightness(${blogData.hero_imagen_css.brightness}%) contrast(${blogData.hero_imagen_css.contrast}%)` : 'none'
                      }} />
                      <button type="button" onClick={() => openPhotoEditor(heroImgIdx, heroImg)}
                        style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.6)', border: 'none', color: 'white', padding: '5px 8px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', backdropFilter: 'blur(4px)' }}>✏️</button>
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <h1 style={{ fontSize: '1.65rem', fontWeight: 900, lineHeight: 1.2, margin: '0 0 8px', color: '#0f172a' }}>{blog.blogtitulo}</h1>
                    <p style={{ fontSize: '.88rem', color: '#475569', lineHeight: 1.5, margin: '0 0 10px' }}>{blog.blogresumen}</p>
                    <div style={{ fontSize: '.78rem', color: '#94a3b8' }}>
                      📅 {new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })} • Estado: {blog.blogestado === 'publicado' ? '✅ Publicado' : '📝 Borrador'}
                    </div>
                  </div>
                </div>

                {/* FICHA RÁPIDA */}
                {blogData.ficha_rapida && blogData.ficha_rapida.length > 0 && (
                  <div style={{ background: 'linear-gradient(135deg, #ecfdf5, #f0fdf4)', border: '1px solid #a7f3d0', borderRadius: '14px', padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '32px' }}>
                    {blogData.ficha_rapida.map((f: any, i: number) => (
                      <div key={i} style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.3rem' }}>{f.icono}</div>
                        <div style={{ fontSize: '.62rem', textTransform: 'uppercase', letterSpacing: '.8px', color: '#64748b', fontWeight: 600 }}>{f.label}</div>
                        <div style={{ fontSize: '.95rem', fontWeight: 800, color: '#0f766e' }}>{f.valor}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* INTRODUCCIÓN */}
                {blogData.introduccion && (
                  <div style={{ marginBottom: '32px', paddingBottom: '24px', borderBottom: '1px solid #e2e8f0' }}>
                    <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#8b5cf6', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px', display: 'block' }}>Introducción</label>
                    <textarea 
                      value={blogData.introduccion}
                      onChange={e => updateContent(d => { d.introduccion = e.target.value; })}
                      style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px dashed #cbd5e1', fontSize: '1rem', color: '#1e293b', fontWeight: 500, lineHeight: 1.7, minHeight: '80px', resize: 'vertical', background: 'rgba(139,92,246,0.03)', fontFamily: 'inherit' }}
                    />
                  </div>
                )}

                {/* SECCIONES */}
                {blogData.secciones && blogData.secciones.map((sec: any, i: number) => {
                  const hasImg = !!sec.imagen_ruta;
                  const imgFloat = sec.imagen_posicion === 'izquierda' ? 'left' : 'right';
                  return (
                    <div key={i} style={{ marginBottom: '36px', clear: 'both' }}>
                      <label style={{ fontSize: '0.65rem', fontWeight: 700, color: '#8b5cf6', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px', display: 'block' }}>Sección {i + 1}</label>
                      <input 
                        type="text"
                        value={sec.titulo_h2}
                        onChange={e => updateContent(d => { d.secciones[i].titulo_h2 = e.target.value; })}
                        style={{ width: '100%', padding: '8px 0', border: 'none', borderBottom: '2px solid #d1fae5', fontSize: '1.25rem', fontWeight: 800, color: '#0f766e', marginBottom: '14px', background: 'transparent', outline: 'none', fontFamily: 'inherit' }}
                      />
                      <div style={{ overflow: 'hidden' }}>
                        {hasImg && (
                          <div style={{ float: imgFloat as any, width: '280px', height: '200px', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 6px 24px rgba(0,0,0,.1)', margin: imgFloat === 'left' ? '0 24px 16px 0' : '0 0 16px 24px', position: 'relative' }}>
                            <img src={sec.imagen_ruta} alt="" style={{
                              width: '100%', height: '100%', objectFit: 'cover',
                              objectPosition: sec.imagen_css ? `${sec.imagen_css.x}% ${sec.imagen_css.y}%` : '50% 50%',
                              transform: sec.imagen_css ? `scale(${sec.imagen_css.zoom / 100})` : 'scale(1)',
                              filter: sec.imagen_css ? `brightness(${sec.imagen_css.brightness}%) contrast(${sec.imagen_css.contrast}%)` : 'none'
                            }} />
                            <button type="button" onClick={() => openPhotoEditor(secImgIdxs[i], sec.imagen_ruta)}
                              style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.6)', border: 'none', color: 'white', padding: '5px 8px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', backdropFilter: 'blur(4px)' }}>✏️</button>
                          </div>
                        )}
                        <textarea
                          value={sec.contenido_markdown}
                          onChange={e => updateContent(d => { d.secciones[i].contenido_markdown = e.target.value; })}
                          style={{ width: '100%', padding: '10px', border: '1px dashed #e2e8f0', borderRadius: '8px', fontSize: '.9rem', lineHeight: 1.65, color: '#334155', minHeight: '120px', resize: 'vertical', background: 'rgba(139,92,246,0.02)', fontFamily: 'inherit' }}
                        />
                      </div>
                      <div style={{ clear: 'both' }} />
                    </div>
                  );
                })}

                {/* CONSEJOS */}
                {blogData.consejos && (
                  <div style={{ background: 'linear-gradient(135deg, #fffbeb, #fef3c7)', borderLeft: '4px solid #f59e0b', borderRadius: '0 14px 14px 0', padding: '20px 24px', marginBottom: '36px', clear: 'both' }}>
                    <input
                      type="text"
                      value={blogData.consejos.titulo}
                      onChange={e => updateContent(d => { d.consejos.titulo = e.target.value; })}
                      style={{ width: '100%', border: 'none', background: 'transparent', fontSize: '1.05rem', fontWeight: 700, color: '#92400e', marginBottom: '12px', outline: 'none', fontFamily: 'inherit' }}
                    />
                    <ol style={{ paddingLeft: '18px', margin: 0, color: '#78350f' }}>
                      {blogData.consejos.items.map((item: string, j: number) => (
                        <li key={j} style={{ marginBottom: '8px' }}>
                          <input
                            type="text"
                            value={item}
                            onChange={e => updateContent(d => { d.consejos.items[j] = e.target.value; })}
                            style={{ width: '100%', border: 'none', borderBottom: '1px dashed #d97706', background: 'transparent', fontSize: '.88rem', color: '#78350f', padding: '2px 0', outline: 'none', fontFamily: 'inherit' }}
                          />
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* CTA */}
                {blogData.cta && (
                  <div style={{ background: 'linear-gradient(135deg, #0f766e, #10b981)', borderRadius: '18px', padding: '36px 28px', textAlign: 'center', color: '#fff', marginBottom: '36px', clear: 'both' }}>
                    <input
                      type="text"
                      value={blogData.cta.titulo}
                      onChange={e => updateContent(d => { d.cta.titulo = e.target.value; })}
                      style={{ width: '100%', border: 'none', background: 'transparent', fontSize: '1.4rem', fontWeight: 800, color: 'white', textAlign: 'center', marginBottom: '6px', outline: 'none', fontFamily: 'inherit' }}
                    />
                    <input
                      type="text"
                      value={blogData.cta.subtitulo}
                      onChange={e => updateContent(d => { d.cta.subtitulo = e.target.value; })}
                      style={{ width: '100%', border: 'none', background: 'transparent', fontSize: '.92rem', color: 'rgba(255,255,255,0.9)', textAlign: 'center', marginBottom: '16px', outline: 'none', fontFamily: 'inherit' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                      <span style={{ padding: '10px 24px', borderRadius: '10px', fontWeight: 700, fontSize: '.88rem', background: '#fff', color: '#0f766e' }}>{blogData.cta.boton_primario}</span>
                      <span style={{ padding: '10px 24px', borderRadius: '10px', fontWeight: 700, fontSize: '.88rem', background: 'rgba(255,255,255,.15)', color: '#fff', border: '2px solid rgba(255,255,255,.35)' }}>{blogData.cta.boton_secundario}</span>
                    </div>
                  </div>
                )}

                {/* TAGS */}
                {blogData.tags && blogData.tags.length > 0 && (
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', paddingTop: '20px', borderTop: '1px solid #e2e8f0' }}>
                    {blogData.tags.map((tag: string, i: number) => (
                      <span key={i} style={{ background: '#e2e8f0', color: '#475569', padding: '3px 10px', borderRadius: '16px', fontSize: '.72rem', fontWeight: 600 }}>{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        } catch (e) {
          // Markdown legacy — mostrar textarea simple
          return (
            <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <label style={{ fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '8px' }}>Contenido (Markdown)</label>
              <textarea 
                value={blog.blogcontenido} 
                onChange={e => setBlog({...blog, blogcontenido: e.target.value})}
                style={{ width: '100%', padding: '15px', borderRadius: '8px', border: '1px solid #cbd5e1', minHeight: '400px', resize: 'vertical', fontFamily: 'monospace', fontSize: '0.95rem', background: '#f8fafc' }}
              />
            </div>
          );
        }
      })()}

      {/* Editor Modal */}
      {editingPhoto && (() => {
        const currentEditorState = JSON.stringify({
          x: editorX, y: editorY, zoom: editorZoom, brightness: editorBrightness,
          contrast: editorContrast, style: editorStyle, seo_alt: editorSeoAlt, seo_title: editorSeoTitle
        });
        const hasChanges = currentEditorState !== editorInitialState;
        const filename = editingPhoto.url.split('/').pop()?.split('?')[0] || 'imagen';

        return (
          <div className="photo-editor-overlay" onClick={() => { if (!hasChanges) { setEditingPhoto(null); setAiGenShowNote(false); } }}>
            <div className="photo-editor-content" onClick={e => e.stopPropagation()}>
              <div className="photo-editor-header">
                <div>
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>🎨 Editor Visual</h3>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 'normal', marginTop: '2px', wordBreak: 'break-all' }}>📄 {filename}</div>
                </div>
                <button type="button" className="photo-editor-close" onClick={() => { setEditingPhoto(null); setAiGenShowNote(false); }}>✕</button>
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

              {/* Generar nueva foto con IA */}
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px', marginTop: '8px' }}>
                {!aiGenShowNote ? (
                  <button type="button" onClick={() => { setAiGenShowNote(true); setAiGenNote(''); }}
                    style={{ width: '100%', padding: '10px', background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    🎨 Generar nueva foto con IA
                  </button>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#6d28d9' }}>Nota opcional para la IA (qué quieres en la foto):</label>
                    <input
                      type="text"
                      value={aiGenNote}
                      onChange={e => setAiGenNote(e.target.value)}
                      placeholder="Ej: Un primer plano de calabacines recién cosechados al amanecer"
                      style={{ padding: '8px 12px', border: '1px solid #c4b5fd', borderRadius: '6px', fontSize: '0.85rem', background: '#faf5ff' }}
                      disabled={aiGenLoading}
                    />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button type="button" disabled={aiGenLoading} onClick={async () => {
                        if (!editingPhoto || !blog) return;
                        setAiGenLoading(true);
                        try {
                          // Obtener contexto del blog
                          const blogData = JSON.parse(blog.blogcontenido);
                          let sectionTitle = '';
                          // Determinar si es hero o sección
                          let curr = 0;
                          if (blogData.hero_imagen) {
                            if (curr === editingPhoto.index) sectionTitle = 'Portada del artículo';
                            curr++;
                          }
                          if (blogData.secciones) {
                            blogData.secciones.forEach((sec: any) => {
                              if (sec.imagen_ruta) {
                                if (curr === editingPhoto.index) sectionTitle = sec.titulo_h2 || '';
                                curr++;
                              }
                            });
                          }

                          const context = `${blog.blogtitulo}. Sección: ${sectionTitle}`;
                          const res = await fetch('/api/ai/generate-image', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail || '' },
                            body: JSON.stringify({
                              tipoEntidad: 'blog',
                              especieNombre: context,
                              concept: aiGenNote || `Imagen editorial para la sección "${sectionTitle}" del artículo "${blog.blogtitulo}"`
                            })
                          });
                          const data = await res.json();
                          if (data.success && data.base64) {
                            // Subir la imagen
                            const blob = await fetch(`data:image/webp;base64,${data.base64}`).then(r => r.blob());
                            const fileName = `blog-ai-${Date.now()}.webp`;
                            const formData = new FormData();
                            formData.append('file', blob, fileName);
                            formData.append('path', `uploads/blog/${fileName}`);
                            const upRes = await fetch('/api/admin/upload', { 
                              method: 'POST', 
                              headers: { 'x-user-email': userEmail || '' },
                              body: formData 
                            });
                            const upData = await upRes.json();
                            if (upData.url || upData.path) {
                              const newUrl = upData.url || upData.path;
                              // Actualizar en el JSON del blog
                              const d = JSON.parse(blog.blogcontenido);
                              let c2 = 0;
                              if (d.hero_imagen) {
                                if (c2 === editingPhoto.index) { d.hero_imagen = newUrl; d.hero_imagen_css = null; }
                                c2++;
                              }
                              if (d.secciones) {
                                d.secciones.forEach((sec: any) => {
                                  if (sec.imagen_ruta) {
                                    if (c2 === editingPhoto.index) { sec.imagen_ruta = newUrl; sec.imagen_css = null; }
                                    c2++;
                                  }
                                });
                              }
                              setBlog({...blog, blogcontenido: JSON.stringify(d, null, 2)});
                              setEditingPhoto({...editingPhoto, url: newUrl});
                              setEditorX(50); setEditorY(50); setEditorZoom(100); setEditorBrightness(100); setEditorContrast(100);
                              setAiGenShowNote(false);
                            } else { alert('Error al subir la imagen generada'); }
                          } else { alert(data.error || 'Error al generar imagen'); }
                        } catch (e: any) { alert('Error: ' + e.message); }
                        finally { setAiGenLoading(false); }
                      }}
                        style={{ flex: 1, padding: '10px', background: aiGenLoading ? '#c4b5fd' : 'linear-gradient(135deg, #8b5cf6, #6d28d9)', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: aiGenLoading ? 'wait' : 'pointer', fontSize: '0.85rem' }}>
                        {aiGenLoading ? '⏳ Generando...' : '🎨 Crear foto'}
                      </button>
                      <button type="button" onClick={() => setAiGenShowNote(false)} disabled={aiGenLoading}
                        style={{ padding: '10px 16px', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="photo-editor-footer" style={{ display: 'flex', justifyContent: hasChanges ? 'space-between' : 'flex-end' }}>
              <button type="button" className="btn-secondary" onClick={() => { setEditingPhoto(null); setAiGenShowNote(false); }}>
                {hasChanges ? 'Cancelar' : '✕ Cerrar'}
              </button>
              {hasChanges && (
                <button type="button" className="btn-primary" onClick={savePhotoEdits} style={{ transition: 'all 0.3s ease' }}>
                  💾 Guardar Cambios
                </button>
              )}
            </div>
          </div>
        </div>
        );
      })()}

    </div>
  );
}
