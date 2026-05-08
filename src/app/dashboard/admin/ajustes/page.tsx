'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AjustesPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'idiomas' | 'paises'>('idiomas');
  
  // Idiomas State
  const [idiomas, setIdiomas] = useState<any[]>([]);
  const [idiomasLoading, setIdiomasLoading] = useState(true);
  const [editingIdioma, setEditingIdioma] = useState<any>(null);
  
  // Paises State
  const [paises, setPaises] = useState<any[]>([]);
  const [paisesLoading, setPaisesLoading] = useState(true);
  const [editingPais, setEditingPais] = useState<any>(null);

  useEffect(() => {
    loadIdiomas();
    loadPaises();
  }, []);

  const loadIdiomas = async () => {
    setIdiomasLoading(true);
    try {
      const res = await fetch('/api/admin/ajustes/idiomas');
      const data = await res.json();
      setIdiomas(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setIdiomasLoading(false);
    }
  };

  const loadPaises = async () => {
    setPaisesLoading(true);
    try {
      const res = await fetch('/api/admin/ajustes/paises');
      const data = await res.json();
      setPaises(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setPaisesLoading(false);
    }
  };

  const saveIdioma = async () => {
    if (!editingIdioma?.idiomasnombre) return;
    try {
      const isNew = !editingIdioma.ididiomas;
      const res = await fetch('/api/admin/ajustes/idiomas', {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingIdioma)
      });
      if (res.ok) {
        setEditingIdioma(null);
        loadIdiomas();
      } else {
        alert('Error al guardar');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteIdioma = async (id: number) => {
    if (!confirm('¿Seguro que quieres borrar este idioma? Podría afectar a las especies que lo usen.')) return;
    try {
      await fetch(`/api/admin/ajustes/idiomas?id=${id}`, { method: 'DELETE' });
      loadIdiomas();
    } catch (err) {
      console.error(err);
    }
  };

  const savePais = async () => {
    if (!editingPais?.paisesnombre) return;
    try {
      const isNew = !editingPais.idpaises;
      const res = await fetch('/api/admin/ajustes/paises', {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingPais)
      });
      if (res.ok) {
        setEditingPais(null);
        loadPaises();
      } else {
        alert('Error al guardar');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deletePais = async (id: number) => {
    if (!confirm('¿Seguro que quieres borrar este país?')) return;
    try {
      await fetch(`/api/admin/ajustes/paises?id=${id}`, { method: 'DELETE' });
      loadPaises();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '30px' }}>
        <div>
          <h1 style={{ margin: '0 0 10px 0', fontSize: '2.5rem', color: '#1e293b' }}>⚙️ Ajustes del Programa</h1>
          <p style={{ margin: 0, color: '#64748b' }}>Gestiona los catálogos maestros del sistema.</p>
        </div>
        <Link href="/dashboard/admin" style={{ padding: '10px 20px', background: '#f1f5f9', color: '#334155', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold' }}>
          Volver al Panel
        </Link>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #e2e8f0' }}>
        <button 
          onClick={() => setActiveTab('idiomas')}
          style={{ padding: '12px 24px', background: 'none', border: 'none', borderBottom: activeTab === 'idiomas' ? '3px solid #3b82f6' : '3px solid transparent', color: activeTab === 'idiomas' ? '#3b82f6' : '#64748b', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer', marginBottom: '-2px' }}>
          🗣️ Idiomas
        </button>
        <button 
          onClick={() => setActiveTab('paises')}
          style={{ padding: '12px 24px', background: 'none', border: 'none', borderBottom: activeTab === 'paises' ? '3px solid #10b981' : '3px solid transparent', color: activeTab === 'paises' ? '#10b981' : '#64748b', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer', marginBottom: '-2px' }}>
          🌍 Países
        </button>
      </div>

      <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}>
        
        {/* PESTAÑA IDIOMAS */}
        {activeTab === 'idiomas' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, color: '#1e293b' }}>Catálogo de Idiomas</h2>
              <button 
                onClick={() => setEditingIdioma({ idiomasnombre: '', idiomasiso: '' })}
                style={{ padding: '10px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                + Nuevo Idioma
              </button>
            </div>

            {idiomasLoading ? (
              <p>Cargando idiomas...</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ padding: '12px', color: '#64748b' }}>ID</th>
                    <th style={{ padding: '12px', color: '#64748b' }}>Nombre del Idioma</th>
                    <th style={{ padding: '12px', color: '#64748b' }}>Código ISO</th>
                    <th style={{ padding: '12px', color: '#64748b', textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {idiomas.map(idioma => (
                    <tr key={idioma.ididiomas} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '12px', color: '#94a3b8' }}>{idioma.ididiomas}</td>
                      <td style={{ padding: '12px', fontWeight: 'bold', color: '#334155' }}>{idioma.idiomasnombre}</td>
                      <td style={{ padding: '12px' }}><span style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem' }}>{idioma.idiomasiso || '-'}</span></td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        <button onClick={() => setEditingIdioma(idioma)} style={{ marginRight: '8px', padding: '6px 12px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer' }}>✏️ Editar</button>
                        <button onClick={() => deleteIdioma(idioma.ididiomas)} style={{ padding: '6px 12px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '6px', cursor: 'pointer' }}>🗑️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* PESTAÑA PAISES */}
        {activeTab === 'paises' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, color: '#1e293b' }}>Catálogo de Países</h2>
              <button 
                onClick={() => setEditingPais({ paisesnombre: '', paisesisocode: '' })}
                style={{ padding: '10px 20px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                + Nuevo País
              </button>
            </div>

            {paisesLoading ? (
              <p>Cargando países...</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ padding: '12px', color: '#64748b' }}>ID</th>
                    <th style={{ padding: '12px', color: '#64748b' }}>Nombre del País</th>
                    <th style={{ padding: '12px', color: '#64748b' }}>Código ISO</th>
                    <th style={{ padding: '12px', color: '#64748b', textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {paises.map(pais => (
                    <tr key={pais.idpaises} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '12px', color: '#94a3b8' }}>{pais.idpaises}</td>
                      <td style={{ padding: '12px', fontWeight: 'bold', color: '#334155' }}>{pais.paisesnombre}</td>
                      <td style={{ padding: '12px' }}><span style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem' }}>{pais.paisesisocode || '-'}</span></td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        <button onClick={() => setEditingPais(pais)} style={{ marginRight: '8px', padding: '6px 12px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer' }}>✏️ Editar</button>
                        <button onClick={() => deletePais(pais.idpaises)} style={{ padding: '6px 12px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '6px', cursor: 'pointer' }}>🗑️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

      </div>

      {/* MODAL IDIOMA */}
      {editingIdioma && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '16px', width: '100%', maxWidth: '400px' }}>
            <h3 style={{ marginTop: 0 }}>{editingIdioma.ididiomas ? 'Editar Idioma' : 'Nuevo Idioma'}</h3>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Nombre</label>
              <input type="text" value={editingIdioma.idiomasnombre} onChange={e => setEditingIdioma({...editingIdioma, idiomasnombre: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
            </div>
            <div style={{ marginBottom: '25px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Código ISO (opcional)</label>
              <input type="text" value={editingIdioma.idiomasiso || ''} onChange={e => setEditingIdioma({...editingIdioma, idiomasiso: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setEditingIdioma(null)} style={{ padding: '10px 15px', background: '#f1f5f9', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Cancelar</button>
              <button onClick={saveIdioma} style={{ padding: '10px 15px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PAIS */}
      {editingPais && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '16px', width: '100%', maxWidth: '400px' }}>
            <h3 style={{ marginTop: 0 }}>{editingPais.idpaises ? 'Editar País' : 'Nuevo País'}</h3>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Nombre</label>
              <input type="text" value={editingPais.paisesnombre} onChange={e => setEditingPais({...editingPais, paisesnombre: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
            </div>
            <div style={{ marginBottom: '25px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Código ISO (opcional)</label>
              <input type="text" value={editingPais.paisesisocode || ''} onChange={e => setEditingPais({...editingPais, paisesisocode: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setEditingPais(null)} style={{ padding: '10px 15px', background: '#f1f5f9', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Cancelar</button>
              <button onClick={savePais} style={{ padding: '10px 15px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Guardar</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
