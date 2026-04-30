'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

function getMediaUrl(path: string) {
  if (!path) return '';
  if (path.startsWith('/api/media')) return path;
  if (path.startsWith('http')) return path;
  return `/api/media?path=${encodeURIComponent(path)}`;
}

export default function BlogPublicArticle() {
  const params = useParams();
  const router = useRouter();
  const [art, setArt] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const isPreview = window.location.search.includes('preview=true');
    fetch(`/api/blog/${params.slug}${isPreview ? '?preview=true' : ''}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setArt(data.data);
        } else {
          router.push('/blog');
        }
        setLoading(false);
      });
  }, [params.slug, router]);

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f8fafc' }}>
      <span style={{ fontSize: '3rem', animation: 'spin 2s linear infinite' }}>⏳</span>
    </div>
  );
  
  if (!art) return null;

  // Intentar parsear JSON estructurado; si falla, es Markdown legacy
  let blogData: any = null;
  try {
    blogData = JSON.parse(art.xblogcontenido);
  } catch {
    blogData = null;
  }

  // ── RENDERIZADO LEGACY (Markdown plano) ──
  if (!blogData || !blogData.secciones) {
    return (
      <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
        <div style={{ width: '100%', height: '400px', background: 'linear-gradient(135deg, #10b981, #0ea5e9)', position: 'relative' }}>
          {art.xblogimagen && <img src={getMediaUrl(art.xblogimagen)} alt={art.xblogtitulo} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} />}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(15,23,42,0.9), transparent)' }} />
          <div style={{ position: 'absolute', bottom: '0', left: '0', right: '0', padding: '40px 20px', maxWidth: '800px', margin: '0 auto' }}>
            <Link href="/blog" style={{ color: '#10b981', textDecoration: 'none', fontWeight: 'bold' }}>← Volver al Blog</Link>
            <h1 style={{ color: 'white', fontSize: '2.5rem', margin: '10px 0', lineHeight: 1.1 }}>{art.xblogtitulo}</h1>
          </div>
        </div>
        <article style={{ maxWidth: '800px', margin: '0 auto', padding: '60px 20px', background: 'white', borderRadius: '16px', marginTop: '-40px', position: 'relative', zIndex: 10, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.05)' }}>
          <div className="blog-md" style={{ fontSize: '1.05rem', color: '#334155', lineHeight: 1.8 }}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{art.xblogcontenido}</ReactMarkdown>
          </div>
        </article>
      </div>
    );
  }

  // ── RENDERIZADO ESTRUCTURADO (JSON Verdantia) ──
  const heroImg = blogData.hero_imagen || (art.xblogimagen ? getMediaUrl(art.xblogimagen) : null);
  const fecha = art.xblogfechapublicacion 
    ? new Date(art.xblogfechapublicacion).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) 
    : new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        .vblog { font-family: 'Inter', system-ui, -apple-system, sans-serif; background: #f8fafc; min-height: 100vh; color: #334155; }
        .vblog * { box-sizing: border-box; }
        
        /* Breadcrumb */
        .vblog-bc { max-width: 860px; margin: 0 auto; padding: 16px 24px; font-size: .8rem; color: #94a3b8; }
        .vblog-bc a { color: #10b981; text-decoration: none; font-weight: 600; }
        .vblog-bc a:hover { text-decoration: underline; }

        /* Header */
        .vblog-header { max-width: 860px; margin: 0 auto; padding: 0 24px 32px; display: flex; gap: 24px; align-items: flex-start; }
        .vblog-header-img { width: 180px; height: 180px; object-fit: cover; border-radius: 14px; flex-shrink: 0; box-shadow: 0 6px 20px rgba(0,0,0,.1); }
        .vblog-header-text { flex: 1; min-width: 0; }
        .vblog-badges { display: flex; gap: 8px; margin-bottom: 10px; flex-wrap: wrap; }
        .vblog-badge { padding: 3px 10px; border-radius: 16px; font-size: .68rem; font-weight: 700; letter-spacing: .4px; text-transform: uppercase; }
        .vblog-badge-green { background: #ecfdf5; color: #0f766e; border: 1px solid #a7f3d0; }
        .vblog-badge-gray { background: #f1f5f9; color: #64748b; border: 1px solid #e2e8f0; }
        .vblog-h1 { font-size: 1.65rem; font-weight: 900; line-height: 1.2; margin: 0 0 8px; color: #0f172a; }
        .vblog-sub { font-size: .88rem; color: #475569; line-height: 1.5; margin: 0 0 10px; }
        .vblog-meta { font-size: .78rem; color: #94a3b8; display: flex; gap: 14px; flex-wrap: wrap; margin-bottom: 10px; }
        .vblog-author { display: flex; align-items: center; gap: 8px; }
        .vblog-avatar { width: 28px; height: 28px; border-radius: 50%; background: linear-gradient(135deg, #10b981, #0f766e); display: flex; align-items: center; justify-content: center; font-size: .75rem; color: #fff; flex-shrink: 0; }
        .vblog-author-name { font-size: .82rem; color: #334155; font-weight: 600; }

        /* Container */
        .vblog-body { max-width: 860px; margin: 0 auto; padding: 0 24px; }

        /* Ficha rápida */
        .vblog-ficha { background: linear-gradient(135deg, #ecfdf5, #f0fdf4); border: 1px solid #a7f3d0; border-radius: 14px; padding: 24px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 36px; }
        .vblog-ficha-item { text-align: center; }
        .vblog-ficha-icon { font-size: 1.3rem; margin-bottom: 2px; }
        .vblog-ficha-label { font-size: .62rem; text-transform: uppercase; letter-spacing: .8px; color: #64748b; font-weight: 600; margin-bottom: 2px; }
        .vblog-ficha-value { font-size: .95rem; font-weight: 800; color: #0f766e; }

        /* Introducción */
        .vblog-intro { font-size: 1.05rem; color: #1e293b; font-weight: 500; line-height: 1.7; margin-bottom: 36px; padding-bottom: 28px; border-bottom: 1px solid #e2e8f0; }

        /* Secciones */
        .vblog-section { margin-bottom: 40px; clear: both; }
        .vblog-section::after { content: ""; display: table; clear: both; }
        .vblog-section-text h2 { font-size: 1.25rem; font-weight: 800; color: #0f766e; margin: 0 0 14px; padding-bottom: 6px; border-bottom: 2px solid #d1fae5; clear: both; }
        .vblog-section-text h3 { font-size: 1rem; font-weight: 700; color: #1e293b; margin: 18px 0 8px; }
        .vblog-section-text p { margin: 0 0 12px; line-height: 1.65; font-size: .9rem; }
        .vblog-section-text strong { color: #0f172a; }
        .vblog-section-text ul, .vblog-section-text ol { padding-left: 18px; margin: 0 0 12px; }
        .vblog-section-text li { margin-bottom: 6px; font-size: .9rem; line-height: 1.5; }
        .vblog-section-img-wrapper { border-radius: 14px; width: 340px; height: 260px; overflow: hidden; box-shadow: 0 6px 24px rgba(0,0,0,.1); margin-bottom: 16px; }
        .vblog-section-img-wrapper.left { float: left; margin-right: 28px; }
        .vblog-section-img-wrapper.right { float: right; margin-left: 28px; }

        /* Consejos */
        .vblog-tips { background: linear-gradient(135deg, #fffbeb, #fef3c7); border-left: 4px solid #f59e0b; border-radius: 0 14px 14px 0; padding: 20px 24px; margin-bottom: 40px; clear: both; }
        .vblog-tips h3 { color: #92400e; margin: 0 0 12px; font-size: 1.05rem; font-weight: 700; }
        .vblog-tips ol { padding-left: 18px; color: #78350f; margin: 0; }
        .vblog-tips li { margin-bottom: 10px; line-height: 1.5; font-size: .88rem; }
        .vblog-tips li strong { color: #92400e; }

        /* CTA */
        .vblog-cta { background: linear-gradient(135deg, #0f766e, #10b981); border-radius: 18px; padding: 40px 28px; text-align: center; color: #fff; margin-bottom: 40px; clear: both; }
        .vblog-cta h2 { font-size: 1.4rem; font-weight: 800; margin: 0 0 6px; }
        .vblog-cta p { opacity: 0.9; margin: 0 0 20px; font-size: .92rem; }
        .vblog-cta-btns { display: flex; justify-content: center; gap: 12px; flex-wrap: wrap; }
        .vblog-cta-btn { padding: 10px 24px; border-radius: 10px; font-weight: 700; font-size: .88rem; cursor: pointer; border: none; transition: transform .15s; }
        .vblog-cta-btn:hover { transform: scale(1.03); }
        .vblog-cta-btn-primary { background: #fff; color: #0f766e; }
        .vblog-cta-btn-secondary { background: rgba(255,255,255,.15); color: #fff; border: 2px solid rgba(255,255,255,.35); }

        /* Footer */
        .vblog-footer { border-top: 1px solid #e2e8f0; padding: 28px 0; margin-top: 40px; clear: both; }
        .vblog-footer-author { display: flex; gap: 14px; align-items: center; margin-bottom: 20px; }
        .vblog-footer-avatar { width: 48px; height: 48px; border-radius: 50%; background: linear-gradient(135deg, #10b981, #0f766e); display: flex; align-items: center; justify-content: center; font-size: 1.2rem; color: #fff; flex-shrink: 0; }
        .vblog-tags { display: flex; gap: 6px; flex-wrap: wrap; }
        .vblog-tag { background: #e2e8f0; color: #475569; padding: 3px 10px; border-radius: 16px; font-size: .72rem; font-weight: 600; }

        /* Responsive */
        @media (max-width: 768px) {
          .vblog-header { flex-direction: column; align-items: center; text-align: center; }
          .vblog-header-img { width: 140px; height: 140px; }
          .vblog-badges { justify-content: center; }
          .vblog-meta { justify-content: center; }
          .vblog-author { justify-content: center; }
          
          .vblog-section-img-wrapper.left, .vblog-section-img-wrapper.right { float: none; width: 100%; height: auto; aspect-ratio: 16/9; margin-left: 0; margin-right: 0; margin-bottom: 20px; }
          
          .vblog-ficha { grid-template-columns: repeat(2, 1fr); }
          .vblog-h1 { font-size: 1.35rem; }
        }
      `}} />

      <div className="vblog">
        {/* Breadcrumb */}
        <div className="vblog-bc">
          <a href="/">🏠 Verdantia</a> › <a href="/blog">Blog</a> › {art.xblogtitulo}
        </div>

        {/* HEADER */}
        <div className="vblog-header">
          {heroImg && (
            <div className="vblog-header-img" style={{ overflow: 'hidden' }}>
              <img src={heroImg} alt={blogData.hero_imagen_alt || art.xblogtitulo} title={blogData.hero_imagen_title || art.xblogtitulo} 
                style={{
                  width: '100%', height: '100%', objectFit: 'cover',
                  objectPosition: blogData.hero_imagen_css ? `${blogData.hero_imagen_css.x}% ${blogData.hero_imagen_css.y}%` : '50% 50%',
                  transform: blogData.hero_imagen_css ? `scale(${blogData.hero_imagen_css.zoom / 100})` : 'scale(1)',
                  filter: blogData.hero_imagen_css ? `brightness(${blogData.hero_imagen_css.brightness}%) contrast(${blogData.hero_imagen_css.contrast}%)` : 'none'
                }}
              />
            </div>
          )}
          <div className="vblog-header-text">
            <div className="vblog-badges">
              {art.especiesnombre && <span className="vblog-badge vblog-badge-green">🌱 {art.especiesnombre}</span>}
              <span className="vblog-badge vblog-badge-gray">⏱️ 5 min</span>
            </div>
            <h1 className="vblog-h1">{art.xblogtitulo}</h1>
            <p className="vblog-sub">{blogData.resumen || art.xblogresumen}</p>
            <div className="vblog-meta">
              <span>📅 {fecha}</span>
              {art.especiesnombre && <span>🌍 {art.especiesnombre}</span>}
            </div>
            <div className="vblog-author">
              <div className="vblog-avatar">👤</div>
              <span className="vblog-author-name">{art.autor || 'Verdantia'}</span>
            </div>
          </div>
        </div>

        <div className="vblog-body">
          {/* FICHA RÁPIDA */}
          {blogData.ficha_rapida && blogData.ficha_rapida.length > 0 && (
            <div className="vblog-ficha">
              {blogData.ficha_rapida.map((f: any, i: number) => (
                <div key={i} className="vblog-ficha-item">
                  <div className="vblog-ficha-icon">{f.icono}</div>
                  <div className="vblog-ficha-label">{f.label}</div>
                  <div className="vblog-ficha-value">{f.valor}</div>
                </div>
              ))}
            </div>
          )}

          {/* INTRODUCCIÓN */}
          {blogData.introduccion && (
            <div className="vblog-intro">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{blogData.introduccion}</ReactMarkdown>
            </div>
          )}

          {/* SECCIONES */}
          {blogData.secciones && blogData.secciones.map((sec: any, i: number) => {
            const hasImg = !!sec.imagen_ruta;
            const imgClass = sec.imagen_posicion === 'izquierda' ? 'left' : 'right';
            
            return (
              <div key={i} className="vblog-section">
                <h2>{sec.titulo_h2}</h2>
                <div className="vblog-section-text">
                  {hasImg && (
                    <div className={`vblog-section-img-wrapper ${imgClass}`}>
                      <img src={sec.imagen_ruta} alt={sec.imagen_alt || sec.titulo_h2} title={sec.imagen_title || sec.titulo_h2} 
                        style={{
                          width: '100%', height: '100%', objectFit: 'cover',
                          objectPosition: sec.imagen_css ? `${sec.imagen_css.x}% ${sec.imagen_css.y}%` : '50% 50%',
                          transform: sec.imagen_css ? `scale(${sec.imagen_css.zoom / 100})` : 'scale(1)',
                          filter: sec.imagen_css ? `brightness(${sec.imagen_css.brightness}%) contrast(${sec.imagen_css.contrast}%)` : 'none'
                        }}
                      />
                    </div>
                  )}
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{sec.contenido_markdown}</ReactMarkdown>
                </div>
              </div>
            );
          })}

          {/* CONSEJOS */}
          {blogData.consejos && (
            <div className="vblog-tips">
              <h3>{blogData.consejos.titulo}</h3>
              <ol>
                {blogData.consejos.items.map((item: string, i: number) => (
                  <li key={i}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ p: ({children}) => <span>{children}</span> }}>{item}</ReactMarkdown>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* CTA */}
          {blogData.cta && (
            <div className="vblog-cta">
              <h2>{blogData.cta.titulo}</h2>
              <p>{blogData.cta.subtitulo}</p>
              <div className="vblog-cta-btns">
                <button className="vblog-cta-btn vblog-cta-btn-primary">{blogData.cta.boton_primario}</button>
                <button className="vblog-cta-btn vblog-cta-btn-secondary">{blogData.cta.boton_secundario}</button>
              </div>
            </div>
          )}

          {/* ADMIN EDIT BUTTON (Only in preview mode) */}
          {window.location.search.includes('preview=true') && (
            <div style={{ background: '#f8fafc', border: '2px dashed #cbd5e1', borderRadius: '16px', padding: '24px', textAlign: 'center', marginBottom: '40px' }}>
              <h3 style={{ margin: '0 0 12px', color: '#475569', fontSize: '1.1rem' }}>⚙️ Modo Vista Previa Administrador</h3>
              <Link href={`/dashboard/admin/blog/${art.idblog}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#334155', color: 'white', padding: '10px 24px', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold' }}>
                ✏️ Editar este artículo en el Dashboard
              </Link>
            </div>
          )}

          {/* FOOTER */}
          <div className="vblog-footer">
            <div className="vblog-footer-author">
              <div className="vblog-footer-avatar">👤</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '.95rem' }}>{art.autor || 'Verdantia'}</div>
                <div style={{ fontSize: '.8rem', color: '#64748b' }}>Artículo generado por Verdantia</div>
              </div>
            </div>
            {blogData.tags && blogData.tags.length > 0 && (
              <div className="vblog-tags">
                {blogData.tags.map((tag: string, i: number) => (
                  <span key={i} className="vblog-tag">{tag}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
