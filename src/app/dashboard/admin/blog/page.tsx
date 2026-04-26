'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function BlogAdminDashboard() {
  const [articulos, setArticulos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/admin/blog')
      .then(res => res.json())
      .then(data => {
        if (data.success) setArticulos(data.data);
        setLoading(false);
      });
  }, []);

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ color: '#10b981', margin: 0, fontSize: '2rem' }}>📝 Gestión del Blog</h1>
        <Link href="/dashboard/admin/especies" style={{ background: '#f59e0b', color: 'white', padding: '10px 20px', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold' }}>
          + Generar desde PDF (Ir a Especies)
        </Link>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Cargando artículos...</div>
      ) : articulos.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', background: 'white', borderRadius: '12px', border: '2px dashed #cbd5e1' }}>
          <h3 style={{ margin: '0 0 10px', color: '#475569' }}>No hay artículos generados</h3>
          <p style={{ color: '#64748b', margin: 0 }}>Ve a la ficha de una especie y usa la varita mágica en un PDF para generar tu primer artículo de blog con IA.</p>
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '15px', textAlign: 'left', color: '#475569' }}>Título</th>
                <th style={{ padding: '15px', textAlign: 'left', color: '#475569' }}>Especie/Variedad</th>
                <th style={{ padding: '15px', textAlign: 'left', color: '#475569' }}>Estado</th>
                <th style={{ padding: '15px', textAlign: 'left', color: '#475569' }}>Fecha</th>
                <th style={{ padding: '15px', textAlign: 'center', color: '#475569' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {articulos.map(art => (
                <tr key={art.idblog} style={{ borderBottom: '1px solid #e2e8f0', cursor: 'pointer' }} onClick={() => router.push(`/dashboard/admin/blog/${art.idblog}`)}>
                  <td style={{ padding: '15px', fontWeight: 'bold', color: '#0f172a' }}>{art.xblogtitulo}</td>
                  <td style={{ padding: '15px', color: '#64748b' }}>{art.especiesnombre || art.variedadesnombre || '-'}</td>
                  <td style={{ padding: '15px' }}>
                    <span style={{ 
                      padding: '4px 10px', 
                      borderRadius: '20px', 
                      fontSize: '0.8rem', 
                      fontWeight: 'bold',
                      background: art.xblogestado === 'publicado' ? '#dcfce7' : '#fef3c7',
                      color: art.xblogestado === 'publicado' ? '#166534' : '#92400e'
                    }}>
                      {art.xblogestado.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '15px', color: '#64748b' }}>{new Date(art.xblogfechacreacion).toLocaleDateString()}</td>
                  <td style={{ padding: '15px', textAlign: 'center' }}>
                    <button style={{ background: '#10b981', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}>
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
