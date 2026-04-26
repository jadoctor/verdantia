'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function BlogPublicIndex() {
  const [articulos, setArticulos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/blog')
      .then(res => res.json())
      .then(data => {
        if (data.success) setArticulos(data.data);
        setLoading(false);
      });
  }, []);

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', padding: '40px 20px' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        
        <header style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h1 style={{ fontSize: '3.5rem', color: '#0f172a', marginBottom: '15px', fontWeight: 900 }}>
            Blog de <span style={{ color: '#10b981' }}>Verdantia</span>
          </h1>
          <p style={{ fontSize: '1.2rem', color: '#475569', maxWidth: '600px', margin: '0 auto' }}>
            Descubre los mejores artículos, guías y consejos generados a partir de los mejores manuales agronómicos.
          </p>
        </header>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
            <span style={{ fontSize: '2rem', display: 'inline-block', animation: 'spin 2s linear infinite' }}>⏳</span>
          </div>
        ) : articulos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ color: '#334155', fontSize: '1.5rem', margin: '0 0 10px' }}>Próximamente...</h3>
            <p style={{ color: '#64748b' }}>Estamos preparando artículos increíbles para ti.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '30px' }}>
            {articulos.map(art => (
              <Link href={`/blog/${art.xblogslug}`} key={art.idblog} style={{ textDecoration: 'none' }}>
                <article style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)', transition: 'transform 0.3s', cursor: 'pointer', height: '100%', display: 'flex', flexDirection: 'column' }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                >
                  <div style={{ height: '200px', background: 'linear-gradient(135deg, #10b981, #0ea5e9)', position: 'relative' }}>
                    {art.xblogimagen ? (
                       <img src={art.xblogimagen} alt={art.xblogtitulo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                       <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem', color: 'rgba(255,255,255,0.5)' }}>
                         🌱
                       </div>
                    )}
                    <div style={{ position: 'absolute', top: '15px', right: '15px', background: 'rgba(255,255,255,0.9)', padding: '5px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', color: '#0f172a' }}>
                      {art.especiesnombre || 'General'}
                    </div>
                  </div>
                  
                  <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <h2 style={{ margin: '0 0 10px', fontSize: '1.4rem', color: '#0f172a', lineHeight: 1.3 }}>{art.xblogtitulo}</h2>
                    <p style={{ margin: '0 0 20px', color: '#64748b', fontSize: '0.95rem', lineHeight: 1.5, flex: 1 }}>
                      {art.xblogresumen}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '15px', marginTop: 'auto' }}>
                      <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>{art.autor}</span>
                      <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{new Date(art.xblogfechapublicacion).toLocaleDateString()}</span>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
