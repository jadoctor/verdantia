'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

export default function BlogEditorDashboard() {
  const params = useParams();
  const router = useRouter();
  const [blog, setBlog] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Cargando...</div>;
  if (!blog) return null;

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <Link href="/dashboard/admin/blog" style={{ color: '#64748b', textDecoration: 'none', fontWeight: 'bold' }}>
          ← Volver al listado
        </Link>
        <div style={{ display: 'flex', gap: '10px' }}>
          <a 
            href={`/blog/${blog.xblogslug}?preview=true`} 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'none', color: '#334155', display: 'flex', alignItems: 'center' }}
          >
            👁️ Visualizar
          </a>
          <button 
            onClick={() => handleSave('borrador')} 
            disabled={saving}
            style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white', fontWeight: 'bold', cursor: 'pointer' }}
          >
            Guardar Borrador
          </button>
          <button 
            onClick={() => handleSave('publicado')} 
            disabled={saving}
            style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#10b981', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}
          >
            🚀 Publicar Ahora
          </button>
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
          <label style={{ fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '5px' }}>Contenido (Markdown)</label>
          <textarea 
            value={blog.xblogcontenido} 
            onChange={e => setBlog({...blog, xblogcontenido: e.target.value})}
            style={{ width: '100%', padding: '15px', borderRadius: '8px', border: '1px solid #cbd5e1', minHeight: '500px', resize: 'vertical', fontFamily: 'monospace', fontSize: '0.95rem', background: '#f8fafc' }}
          />
        </div>

      </div>
    </div>
  );
}
