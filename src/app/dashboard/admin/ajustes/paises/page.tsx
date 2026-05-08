'use client';
import React, { useState, useEffect } from 'react';

export default function PaisesPage() {
  const [paises, setPaises] = useState<any[]>([]);
  const [paisesLoading, setPaisesLoading] = useState(true);
  const [editingPais, setEditingPais] = useState<any>(null);

  const getCountryFlagUrl = (countryCode: string) => {
    if (!countryCode) return null;
    let code = countryCode.toLowerCase().trim();
    if (code === 'uk') code = 'gb'; // uk -> gb in flagcdn
    return `https://flagcdn.com/w40/${code}.png`;
  };

  useEffect(() => { loadPaises(); }, []);

  const loadPaises = async () => {
    setPaisesLoading(true);
    try {
      const res = await fetch('/api/admin/ajustes/paises');
      const data = await res.json();
      if (res.ok) setPaises(Array.isArray(data) ? data : data.paises || []);
    } catch (e) { console.error(e); }
    finally { setPaisesLoading(false); }
  };

  const savePais = async () => {
    try {
      const method = editingPais.idpaises ? 'PUT' : 'POST';
      const res = await fetch('/api/admin/ajustes/paises', {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingPais)
      });
      if (res.ok) {
        setEditingPais(null);
        loadPaises();
      } else alert('Error al guardar');
    } catch { alert('Error al guardar'); }
  };

  const deletePais = async (id: number) => {
    if (!confirm('¿Seguro que quieres eliminar este país?')) return;
    try {
      const res = await fetch(`/api/admin/ajustes/paises?id=${id}`, { method: 'DELETE' });
      if (res.ok) loadPaises();
      else alert('Error al eliminar');
    } catch { alert('Error al eliminar'); }
  };

  return (
    <div className="dashboard-content" style={{ padding: '20px' }}>
      <div style={{ background: 'linear-gradient(135deg, #0f766e, #10b981)', borderRadius: '16px', padding: '24px 28px', marginBottom: '24px', color: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800 }}>🌎 Gestión de Países</h1>
            <p style={{ margin: '4px 0 0', opacity: 0.9, fontSize: '0.9rem' }}>
              Catálogo de países habilitados en el sistema
            </p>
          </div>
          <button 
            onClick={() => setEditingPais({ paisesnombre: '', paisesisocode: '' })}
            style={{ padding: '10px 20px', background: 'white', color: '#0f766e', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            ➕ Nuevo País
          </button>
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>


      {paisesLoading ? (
        <p>Cargando países...</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '12px', color: '#64748b', width: '60px', textAlign: 'center', position: 'sticky', left: 0, zIndex: 2, background: 'white' }}>Bandera</th>
                <th style={{ padding: '12px', color: '#64748b' }}>Nombre del País</th>
                <th style={{ padding: '12px', color: '#64748b' }}>Código ISO</th>
                <th style={{ padding: '12px', color: '#64748b', textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paises.map((pais, idx) => (
                <tr key={pais.idpaises} style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 0 ? 'white' : '#f8fafc' }}>
                  <td style={{ padding: '12px', textAlign: 'center', position: 'sticky', left: 0, zIndex: 1, background: idx % 2 === 0 ? 'white' : '#f8fafc' }}>
                    {pais.paisesisocode ? (
                      <img 
                        src={getCountryFlagUrl(pais.paisesisocode)!} 
                        alt={pais.paisesisocode} 
                        crossOrigin="anonymous"
                        style={{ width: '28px', borderRadius: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', verticalAlign: 'middle' }} 
                        onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.innerHTML = '🌍'; }}
                      />
                    ) : <span style={{ fontSize: '1.4rem' }}>🌍</span>}
                  </td>
                  <td style={{ padding: '12px', fontWeight: 'bold', color: '#334155' }}>{pais.paisesnombre}</td>
                  <td style={{ padding: '12px' }}><span style={{ background: '#e2e8f0', color: '#475569', padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 'bold' }}>{pais.paisesisocode || '-'}</span></td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    <button onClick={() => setEditingPais(pais)} style={{ marginRight: '8px', padding: '6px 12px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, color: '#475569' }}>✏️ Editar</button>
                    <button onClick={() => deletePais(pais.idpaises)} style={{ padding: '6px 12px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '6px', cursor: 'pointer' }}>🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editingPais && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '16px', width: '100%', maxWidth: '400px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#0f172a' }}>{editingPais.idpaises ? 'Editar País' : 'Nuevo País'}</h3>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#475569' }}>Nombre</label>
              <input type="text" value={editingPais.paisesnombre} onChange={e => setEditingPais({...editingPais, paisesnombre: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} />
            </div>
            <div style={{ marginBottom: '25px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#475569' }}>Código ISO (opcional)</label>
              <input type="text" value={editingPais.paisesisocode || ''} onChange={e => setEditingPais({...editingPais, paisesisocode: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} />
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setEditingPais(null)} style={{ padding: '10px 15px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Cancelar</button>
              <button onClick={savePais} style={{ padding: '10px 15px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
