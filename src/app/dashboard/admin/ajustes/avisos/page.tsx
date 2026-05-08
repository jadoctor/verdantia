'use client';
import React, { useState, useEffect } from 'react';

export default function AvisosPage() {
  const [avisosData, setAvisosData] = useState<any>({ tiposavisos: [], suscripciones: [], suscripcionesavisos: [] });
  const [laboresData, setLaboresData] = useState<any[]>([]);
  const [avisosLoading, setAvisosLoading] = useState(true);
  const [matrizLocal, setMatrizLocal] = useState<Record<string, number>>({});
  const [matrizInicial, setMatrizInicial] = useState<Record<string, number>>({});
  const [avisosIsDirty, setAvisosIsDirty] = useState(false);
  const [editingAviso, setEditingAviso] = useState<any>(null);
  const [showLabores, setShowLabores] = useState(false);

  useEffect(() => { loadAvisos(); }, []);

  const loadAvisos = async () => {
    setAvisosLoading(true);
    try {
      const res = await fetch('/api/admin/ajustes/avisos');
      const resLabores = await fetch('/api/admin/ajustes/avisos/labores');
      const data = await res.json();
      const dataLabores = await resLabores.json();
      if (res.ok && resLabores.ok) {
        setAvisosData(data);
        setLaboresData(dataLabores.labores || []);
        const initMatriz: Record<string, number> = {};
        if (data.suscripcionestiposavisos) {
          data.suscripcionestiposavisos.forEach((regla: any) => {
            initMatriz[`${regla.xsuscripcionestiposavisosidsuscripciones}_${regla.xsuscripcionestiposavisosidtiposavisos}`] = regla.suscripcionestiposavisosestado;
          });
        }
        setMatrizLocal(initMatriz);
        setMatrizInicial(initMatriz);
        setAvisosIsDirty(false);
      }
    } catch (e) { console.error(e); }
    finally { setAvisosLoading(false); }
  };

  const handleMatrizChange = (idSuscripcion: number, idAviso: number, nuevoEstado: number) => {
    setMatrizLocal(prev => {
      const nueva = { ...prev, [`${idSuscripcion}_${idAviso}`]: nuevoEstado };
      const hasChanges = JSON.stringify(nueva) !== JSON.stringify(matrizInicial);
      setAvisosIsDirty(hasChanges);
      return nueva;
    });
  };

  const saveMatriz = async () => {
    try {
      const res = await fetch('/api/admin/ajustes/avisos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates: matrizLocal })
      });
      if (res.ok) loadAvisos();
      else alert('Error al guardar matriz');
    } catch { alert('Error al guardar matriz'); }
  };

  const saveAviso = async () => {
    try {
      const method = editingAviso.idtiposavisos ? 'PUT' : 'POST';
      const res = await fetch('/api/admin/ajustes/tiposavisos', {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingAviso)
      });
      if (res.ok) { setEditingAviso(null); loadAvisos(); }
      else alert('Error al guardar aviso');
    } catch { alert('Error al guardar aviso'); }
  };

  const deleteAviso = async (id: number) => {
    if (!confirm('¿Seguro que quieres eliminar este aviso?')) return;
    try {
      const res = await fetch(`/api/admin/ajustes/tiposavisos?id=${id}`, { method: 'DELETE' });
      if (res.ok) loadAvisos();
      else alert('Error al eliminar');
    } catch { alert('Error al eliminar'); }
  };

  return (
    <div className="dashboard-content" style={{ padding: '20px' }}>
      <div style={{ background: 'linear-gradient(135deg, #0f766e, #10b981)', borderRadius: '16px', padding: '24px 28px', marginBottom: '24px', color: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800 }}>🔔 Avisos y Reglas</h1>
            <p style={{ margin: '4px 0 0', opacity: 0.9, fontSize: '0.9rem' }}>
              Gestión de notificaciones y permisos según el plan de suscripción
            </p>
          </div>
          <button onClick={() => setEditingAviso({ tiposavisosnombre: '', tiposavisoscodigo: '', tiposavisosdescripcion: '' })} style={{ padding: '10px 20px', background: 'white', color: '#0f766e', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            ➕ Nuevo Aviso
          </button>
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
      {avisosLoading ? (
        <p>Cargando datos de avisos...</p>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
            <button onClick={saveMatriz} disabled={!avisosIsDirty} style={{ padding: '8px 16px', background: avisosIsDirty ? '#10b981' : '#f1f5f9', color: avisosIsDirty ? 'white' : '#94a3b8', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: avisosIsDirty ? 'pointer' : 'not-allowed', transition: 'all 0.2s' }}>
              {avisosIsDirty ? '💾 Guardar Cambios Matriz' : '✓ Sin cambios'}
            </button>
          </div>

          <div style={{ overflowX: 'auto', marginBottom: '40px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '12px', background: '#f8fafc', color: '#475569', minWidth: '200px' }}>Concepto</th>
                  <th style={{ padding: '12px', background: '#f8fafc', color: '#475569', textAlign: 'center' }}>Canal</th>
                  {avisosData.suscripciones.map((sub: any) => (
                    <th key={sub.idsuscripciones} style={{ padding: '12px', textAlign: 'center', background: '#f8fafc', color: '#0f172a' }}>
                      {sub.suscripcionesnombre}
                    </th>
                  ))}
                  <th style={{ padding: '12px', background: '#f8fafc', textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>

                {avisosData.tiposavisos.map((aviso: any) => {
                  const isTareasHuerto = aviso.tiposavisosnombre === 'Tareas del Huerto';
                  return (
                    <React.Fragment key={aviso.idtiposavisos}>
                      <tr style={{ borderBottom: '1px solid #e2e8f0', background: isTareasHuerto ? '#f8fafc' : 'white' }}>
                        <td style={{ padding: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {isTareasHuerto && (
                              <button 
                                onClick={() => setShowLabores(!showLabores)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', padding: '0 5px', transition: 'transform 0.2s', transform: showLabores ? 'rotate(0deg)' : 'rotate(-90deg)' }}
                              >
                                ▼
                              </button>
                            )}
                            <div>
                              <strong style={{ color: '#1e293b' }}>{aviso.tiposavisosnombre}</strong>
                              <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>{aviso.tiposavisosdescripcion}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <select 
                            value={aviso.tiposavisosmetodo || 'in-app'}
                            onChange={async (e) => {
                              const newVal = e.target.value;
                              const newData = { ...avisosData };
                              const index = newData.tiposavisos.findIndex((a: any) => a.idtiposavisos === aviso.idtiposavisos);
                              if (index !== -1) newData.tiposavisos[index].tiposavisosmetodo = newVal;
                              setAvisosData(newData);
                              try {
                                await fetch('/api/admin/ajustes/tiposavisos', {
                                  method: 'PUT',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ ...aviso, tiposavisosmetodo: newVal })
                                });
                              } catch { alert('Error al guardar el método de envío'); }
                            }}
                            style={{ 
                              padding: '6px 10px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 'bold', 
                              background: aviso.tiposavisosmetodo === 'email' ? '#e0e7ff' : '#fce7f3', 
                              color: aviso.tiposavisosmetodo === 'email' ? '#4f46e5' : '#db2777',
                              border: '1px solid ' + (aviso.tiposavisosmetodo === 'email' ? '#c7d2fe' : '#fbcfe8'), 
                              cursor: 'pointer', outline: 'none', textAlign: 'center'
                            }}
                          >
                            <option value="in-app">🔔 App Push</option>
                            <option value="email">📩 Por Email</option>
                          </select>
                        </td>
                        {avisosData.suscripciones.map((sub: any) => {
                          const key = `${sub.idsuscripciones}_${aviso.idtiposavisos}`;
                          const estado = matrizLocal[key] ?? 0;
                          return (
                            <td key={sub.idsuscripciones} style={{ padding: '12px', textAlign: 'center' }}>
                              <select 
                                value={estado} 
                                onChange={(e) => handleMatrizChange(sub.idsuscripciones, aviso.idtiposavisos, parseInt(e.target.value))}
                                style={{ 
                                  padding: '6px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', cursor: 'pointer', fontWeight: 600,
                                  background: estado === 2 ? '#fef2f2' : estado === 1 ? '#fef3c7' : '#ecfdf5',
                                  color: estado === 2 ? '#ef4444' : estado === 1 ? '#d97706' : '#10b981'
                                }}>
                                <option value={0}>Opcional</option>
                                <option value={1}>Obligatorio</option>
                                <option value={2}>🔒 Bloqueado</option>
                              </select>
                            </td>
                          );
                        })}
                        <td style={{ padding: '12px', textAlign: 'right' }}>
                          <button onClick={() => setEditingAviso(aviso)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem' }}>✏️</button>
                          <button onClick={() => deleteAviso(aviso.idtiposavisos)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem' }}>🗑️</button>
                        </td>
                      </tr>
                      {isTareasHuerto && showLabores && laboresData.map(labor => (
                        <tr key={`labor-${labor.idlabores}`} style={{ borderBottom: '1px solid #f1f5f9', background: '#fdfdfd' }}>
                          <td style={{ padding: '8px 12px 8px 40px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ color: '#94a3b8' }}>↳</span>
                              <strong style={{ color: '#475569', fontSize: '0.95rem' }}>{labor.laboresnombre}</strong>
                            </div>
                          </td>
                          <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                            <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 'bold' }}>↳ Heredado</span>
                          </td>
                          <td colSpan={avisosData.suscripciones.length} style={{ padding: '8px 12px', textAlign: 'center', verticalAlign: 'middle' }}>
                            <div 
                              onClick={async () => {
                                const nuevoEstado = labor.laboresnotificable ? 0 : 1;
                                setLaboresData(prev => prev.map(l => l.idlabores === labor.idlabores ? { ...l, laboresnotificable: nuevoEstado } : l));
                                try {
                                  await fetch('/api/admin/ajustes/avisos/labores', {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ idlabores: labor.idlabores, laboresnotificable: nuevoEstado })
                                  });
                                } catch { alert('Error al guardar'); }
                              }}
                              style={{ 
                                width: '38px', height: '20px', 
                                background: labor.laboresnotificable ? '#10b981' : '#cbd5e1', 
                                borderRadius: '10px', position: 'relative', cursor: 'pointer', display: 'inline-flex', transition: 'all 0.2s', verticalAlign: 'middle' 
                              }}>
                              <div style={{ 
                                width: '16px', height: '16px', background: '#fff', borderRadius: '50%', position: 'absolute', top: '2px', 
                                left: labor.laboresnotificable ? '20px' : '2px', transition: 'all 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' 
                              }} />
                            </div>
                            <span style={{ marginLeft: '10px', fontSize: '0.8rem', color: labor.laboresnotificable ? '#10b981' : '#94a3b8', fontWeight: '600' }}>
                              {labor.laboresnotificable ? 'Visible' : 'Oculto'}
                            </span>
                          </td>
                          <td style={{ padding: '8px 12px' }}></td>
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>


        </>
      )}

      {editingAviso && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '16px', width: '100%', maxWidth: '400px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#0f172a' }}>{editingAviso.idtiposavisos ? 'Editar Aviso' : 'Nuevo Aviso'}</h3>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#475569' }}>Nombre Público</label>
              <input type="text" value={editingAviso.tiposavisosnombre} onChange={e => setEditingAviso({...editingAviso, tiposavisosnombre: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#475569' }}>Código Interno</label>
              <input type="text" value={editingAviso.tiposavisoscodigo} onChange={e => setEditingAviso({...editingAviso, tiposavisoscodigo: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#475569' }}>Método de Envío</label>
              <select value={editingAviso.tiposavisosmetodo || 'in-app'} onChange={e => setEditingAviso({...editingAviso, tiposavisosmetodo: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', background: 'white' }}>
                <option value="in-app">🔔 Notificación Interna (App)</option>
                <option value="email">📩 Correo Electrónico (Boletín)</option>
              </select>
            </div>
            <div style={{ marginBottom: '25px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#475569' }}>Descripción</label>
              <textarea value={editingAviso.tiposavisosdescripcion} onChange={e => setEditingAviso({...editingAviso, tiposavisosdescripcion: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', height: '80px', resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setEditingAviso(null)} style={{ padding: '10px 15px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Cancelar</button>
              <button onClick={saveAviso} style={{ padding: '10px 15px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
