import React from 'react';
import { getMediaUrl } from '@/lib/media-url';

interface BlogsTabProps {
  especieId: string | null;
  userEmail: string | null;
  formData: any;
  activeTab: string;
  pdfs: any[];
  blogGenPdf: string;
  setBlogGenPdf: React.Dispatch<React.SetStateAction<string>>;
  setShowBlogPrompt: React.Dispatch<React.SetStateAction<boolean>>;
  blogGenLoading: boolean;
  blogGenProgress: string;
  blogs: any[];
  handleDeleteBlog: (id: number) => Promise<void>;
}

export default function BlogsTab({
  especieId,
  userEmail,
  formData,
  activeTab,
  pdfs,
  blogGenPdf,
  setBlogGenPdf,
  setShowBlogPrompt,
  blogGenLoading,
  blogGenProgress,
  blogs,
  handleDeleteBlog
}: BlogsTabProps) {
  return (
    <div className="grid-form" style={{ display: activeTab === 'blogs' ? 'grid' : 'none' }}>
      <div className="form-group full" style={{ margin: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#1e293b' }}>📰 Posts de Blog Vinculados</h3>
          {especieId && pdfs.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setBlogGenPdf(pdfs[0]?.id?.toString() || '');
                setShowBlogPrompt(true);
              }}
              disabled={blogGenLoading}
              style={{ padding: '8px 16px', background: 'linear-gradient(135deg, #059669, #10b981)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: blogGenLoading ? 'not-allowed' : 'pointer' }}
            >
              {blogGenLoading ? '⏳ Generando...' : '✨ Redactar Post de Blog (IA)'}
            </button>
          )}
        </div>

        {blogGenLoading && (
          <div style={{ padding: '24px', background: '#ecfdf5', borderRadius: '12px', border: '1px solid #a7f3d0', marginBottom: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '2rem', animation: 'spin 1s linear infinite', display: 'inline-block' }}>⚙️</span>
            <strong style={{ color: '#065f46' }}>El redactor IA está trabajando...</strong>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#047857' }}>{blogGenProgress}</p>
          </div>
        )}

        {blogs.length === 0 && !blogGenLoading ? (
          <div style={{ padding: '40px', textAlign: 'center', background: '#f8fafc', borderRadius: '12px', border: '2px dashed #cbd5e1' }}>
            <p style={{ color: '#64748b', fontSize: '1.1rem', margin: '0 0 10px 0' }}>No hay artículos de blog asociados a esta especie.</p>
            {pdfs.length > 0 ? (
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0 }}>Puedes generar un post de blog automáticamente utilizando las guías de la pestaña PDFs.</p>
            ) : (
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0 }}>Sube primero guías en la pestaña PDFs para que la IA tenga material de base para redactar artículos.</p>
            )}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: '16px', marginTop: '10px' }}>
            {blogs.map((b) => (
              <div key={b.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  {b.hero_imagen ? (
                    <div style={{ width: '60px', height: '60px', borderRadius: '8px', overflow: 'hidden', background: '#f1f5f9', flexShrink: 0 }}>
                      <img src={getMediaUrl(b.hero_imagen)} alt={b.titulo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} crossOrigin="anonymous" />
                    </div>
                  ) : (
                    <div style={{ width: '60px', height: '60px', borderRadius: '8px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>✨</div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 'bold', color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: 1.3 }}>
                      {b.titulo}
                    </h4>
                    <span style={{ display: 'inline-block', marginTop: '4px', fontSize: '0.7rem', color: b.estado === 'publicado' ? '#059669' : '#d97706', fontWeight: 700, background: b.estado === 'publicado' ? '#d1fae5' : '#fef3c7', padding: '2px 6px', borderRadius: '4px' }}>
                      {b.estado === 'publicado' ? 'Publicado' : 'Borrador'}
                    </span>
                  </div>
                </div>

                <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: 1.4 }}>
                  {b.resumen}
                </p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    {new Date(b.fechaCreacion).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <a
                      href={`/blog/${b.slug}?preview=true`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        background: '#0f766e',
                        color: 'white',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        textDecoration: 'none',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                      }}
                    >
                      Leer Art
                    </a>
                    <button
                      type="button"
                      onClick={() => handleDeleteBlog(b.id)}
                      style={{ background: '#fee2e2', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px 8px', borderRadius: '6px', fontSize: '0.8rem' }}
                      title="Eliminar artículo"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
