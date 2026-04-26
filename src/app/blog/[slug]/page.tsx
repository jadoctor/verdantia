'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      
      {/* Hero Image */}
      <div style={{ width: '100%', height: '400px', background: 'linear-gradient(135deg, #10b981, #0ea5e9)', position: 'relative' }}>
         {art.xblogimagen && (
           <img src={art.xblogimagen} alt={art.xblogtitulo} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} />
         )}
         <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(15,23,42,0.9), transparent)' }} />
         <div style={{ position: 'absolute', bottom: '0', left: '0', right: '0', padding: '40px 20px', maxWidth: '800px', margin: '0 auto' }}>
           <Link href="/blog" style={{ color: '#10b981', textDecoration: 'none', fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '15px', display: 'inline-block' }}>
             ← Volver al Blog
           </Link>
           <h1 style={{ color: 'white', fontSize: '3.5rem', margin: '0 0 10px', lineHeight: 1.1 }}>{art.xblogtitulo}</h1>
           <div style={{ display: 'flex', gap: '20px', color: '#cbd5e1', fontSize: '1rem', marginTop: '15px' }}>
             <span>👤 {art.autor}</span>
             <span>📅 {new Date(art.xblogfechapublicacion).toLocaleDateString()}</span>
             {art.especiesnombre && <span>🌱 {art.especiesnombre}</span>}
           </div>
         </div>
      </div>

      {/* Content */}
      <article style={{ maxWidth: '800px', margin: '0 auto', padding: '60px 20px', background: 'white', borderRadius: '16px', marginTop: '-40px', position: 'relative', zIndex: 10, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.05)' }}>
        <p style={{ fontSize: '1.3rem', color: '#475569', lineHeight: 1.6, fontStyle: 'italic', marginBottom: '40px', paddingBottom: '30px', borderBottom: '1px solid #e2e8f0' }}>
          {art.xblogresumen}
        </p>

        <div className="markdown-content" style={{ fontSize: '1.15rem', color: '#334155', lineHeight: 1.8 }}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {art.xblogcontenido}
          </ReactMarkdown>
        </div>
        
        {/* Global CSS for Markdown generated content */}
        <style dangerouslySetInnerHTML={{__html: `
          .markdown-content h2 { color: #0f172a; font-size: 2.2rem; margin-top: 2em; margin-bottom: 0.5em; }
          .markdown-content h3 { color: #1e293b; font-size: 1.6rem; margin-top: 1.5em; margin-bottom: 0.5em; }
          .markdown-content p { margin-bottom: 1.5em; }
          .markdown-content ul, .markdown-content ol { margin-bottom: 1.5em; padding-left: 1.5em; }
          .markdown-content li { margin-bottom: 0.5em; }
          .markdown-content blockquote { border-left: 4px solid #10b981; background: #f0fdf4; padding: 15px 20px; margin: 2em 0; border-radius: 0 8px 8px 0; font-style: italic; color: #166534; }
          .markdown-content strong { color: #0f172a; }
          .markdown-content table { width: 100%; border-collapse: collapse; margin: 2em 0; }
          .markdown-content th, .markdown-content td { border: 1px solid #e2e8f0; padding: 12px; text-align: left; }
          .markdown-content th { background: #f8fafc; color: #0f172a; }
        `}} />
      </article>

    </div>
  );
}
