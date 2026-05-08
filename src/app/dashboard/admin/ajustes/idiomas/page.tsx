'use client';
import React, { useState, useEffect } from 'react';

export default function IdiomasPage() {
  const [idiomas, setIdiomas] = useState<any[]>([]);
  const [idiomasLoading, setIdiomasLoading] = useState(true);
  const [editingIdioma, setEditingIdioma] = useState<any>(null);

  const getLanguageFlagUrl = (iso: string) => {
    if (!iso) return null;
    const code = iso.toLowerCase().trim();
    const regionalMaps: Record<string, string> = {
      va: '/flags/va.svg',
      ca: '/flags/ca.svg',
      gl: '/flags/gl.svg',
      eu: '/flags/eu.svg',
    };
    if (regionalMaps[code]) return regionalMaps[code];

    const map: Record<string, string> = {
      en: 'gb', zh: 'cn', ja: 'jp', ko: 'kr', ar: 'sa', 
      da: 'dk', el: 'gr', he: 'il', hi: 'in', 
      sv: 'se', cs: 'cz', uk: 'ua', gn: 'py', qu: 'pe', la: 'va'
    };
    const country = map[code] || code;
    return `https://flagcdn.com/w40/${country}.png`;
  };

  useEffect(() => { loadIdiomas(); }, []);

  const loadIdiomas = async () => {
    setIdiomasLoading(true);
    try {
      const res = await fetch('/api/admin/ajustes/idiomas');
      const data = await res.json();
      if (res.ok) setIdiomas(Array.isArray(data) ? data : data.idiomas || []);
    } catch (e) { console.error(e); }
    finally { setIdiomasLoading(false); }
  };

  const saveIdioma = async () => {
    try {
      const method = editingIdioma.ididiomas ? 'PUT' : 'POST';
      const res = await fetch('/api/admin/ajustes/idiomas', {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingIdioma)
      });
      if (res.ok) {
        setEditingIdioma(null);
        loadIdiomas();
      } else alert('Error al guardar');
    } catch { alert('Error al guardar'); }
  };

  const deleteIdioma = async (id: number) => {
    if (!confirm('¿Seguro que quieres eliminar este idioma?')) return;
    try {
      const res = await fetch(`/api/admin/ajustes/idiomas?id=${id}`, { method: 'DELETE' });
      if (res.ok) loadIdiomas();
      else alert('Error al eliminar');
    } catch { alert('Error al eliminar'); }
  };

  return (
    <div className="dashboard-content" style={{ padding: '20px' }}>
      <div style={{ background: 'linear-gradient(135deg, #0f766e, #10b981)', borderRadius: '16px', padding: '24px 28px', marginBottom: '24px', color: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800 }}>🗣️ Gestión de Idiomas</h1>
            <p style={{ margin: '4px 0 0', opacity: 0.9, fontSize: '0.9rem' }}>
              Catálogo centralizado de idiomas soportados por el sistema
            </p>
          </div>
          <button 
            onClick={() => setEditingIdioma({ idiomasnombre: '', idiomasiso: '' })}
            style={{ padding: '10px 20px', background: 'white', color: '#0f766e', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            ➕ Nuevo Idioma
          </button>
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>



      {idiomasLoading ? (
        <p>Cargando idiomas...</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '12px', color: '#64748b', width: '60px', textAlign: 'center', position: 'sticky', left: 0, zIndex: 2, background: 'white' }}>Bandera</th>
                <th style={{ padding: '12px', color: '#64748b' }}>Nombre del Idioma</th>
                <th style={{ padding: '12px', color: '#64748b' }}>Código ISO</th>
                <th style={{ padding: '12px', color: '#64748b', textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {idiomas.map((idioma, idx) => (
                <tr key={idioma.ididiomas} style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 0 ? 'white' : '#f8fafc' }}>
                  <td style={{ padding: '12px', textAlign: 'center', position: 'sticky', left: 0, zIndex: 1, background: idx % 2 === 0 ? 'white' : '#f8fafc' }}>
                    {idioma.idiomasiso ? (
                      <img 
                        src={getLanguageFlagUrl(idioma.idiomasiso)!} 
                        alt={idioma.idiomasiso} 
                        crossOrigin="anonymous"
                        style={{ width: '28px', borderRadius: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', verticalAlign: 'middle' }} 
                        onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.innerHTML = '🌐'; }}
                      />
                    ) : <span style={{ fontSize: '1.4rem' }}>🌐</span>}
                  </td>
                  <td style={{ padding: '12px', fontWeight: 'bold', color: '#334155' }}>{idioma.idiomasnombre}</td>
                  <td style={{ padding: '12px' }}><span style={{ background: '#e2e8f0', color: '#475569', padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 'bold' }}>{idioma.idiomasiso || '-'}</span></td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    <button onClick={() => setEditingIdioma(idioma)} style={{ marginRight: '8px', padding: '6px 12px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, color: '#475569' }}>✏️ Editar</button>
                    <button onClick={() => deleteIdioma(idioma.ididiomas)} style={{ padding: '6px 12px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '6px', cursor: 'pointer' }}>🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editingIdioma && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '16px', width: '100%', maxWidth: '400px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#0f172a' }}>{editingIdioma.ididiomas ? 'Editar Idioma' : 'Nuevo Idioma'}</h3>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#475569' }}>Nombre</label>
              <input type="text" value={editingIdioma.idiomasnombre} onChange={e => setEditingIdioma({...editingIdioma, idiomasnombre: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} />
            </div>
            <div style={{ marginBottom: '25px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#475569' }}>Código ISO (opcional)</label>
              <input type="text" value={editingIdioma.idiomasiso || ''} onChange={e => setEditingIdioma({...editingIdioma, idiomasiso: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} />
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setEditingIdioma(null)} style={{ padding: '10px 15px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Cancelar</button>
              <button onClick={saveIdioma} style={{ padding: '10px 15px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
