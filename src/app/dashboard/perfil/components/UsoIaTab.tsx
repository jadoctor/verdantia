import React, { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase/config';

export function UsoIaTab() {
  const [historialIa, setHistorialIa] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [iaFilter, setIaFilter] = useState<string>('todos');

  useEffect(() => {
    const fetchHistory = async () => {
      if (!auth.currentUser?.email) return;
      try {
        const res = await fetch('/api/user/ai-stats/history', {
          headers: { 'x-user-email': auth.currentUser.email }
        });
        if (res.ok) {
          const data = await res.json();
          setHistorialIa(data.history || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const iaModules = Array.from(new Set(historialIa.map((i: any) => i.historialiamodulo)));
  const filteredIa = historialIa.filter((i: any) => iaFilter === 'todos' || i.historialiamodulo === iaFilter);

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Cargando historial de IA...</div>;
  }

  return (
    <div className="perfil-tab-content active" style={{ animation: 'fadeIn 0.3s ease-out' }}>
      <div className="perfil-section-header">
        <div className="section-title-wrapper">
          <h2 className="section-title">✨ Tu Uso de Inteligencia Artificial</h2>
          <p className="section-subtitle">
            Historial de interacciones con los asistentes y herramientas IA durante este mes.
          </p>
        </div>
      </div>

      <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        {historialIa.length === 0 ? (
          <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8', border: '1.5px dashed #cbd5e1', borderRadius: '12px', background: '#f8fafc' }}>
            <span style={{ fontSize: '2rem', display: 'block', marginBottom: '8px' }}>🤖</span>
            <p style={{ fontSize: '0.9rem', fontWeight: 600, margin: 0 }}>Aún no has utilizado los asistentes de Inteligencia Artificial este mes.</p>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setIaFilter('todos')}
                style={{
                  background: iaFilter === 'todos' ? '#8b5cf6' : '#f1f5f9',
                  color: iaFilter === 'todos' ? 'white' : '#64748b',
                  border: 'none',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Todos ({historialIa.length})
              </button>
              {iaModules.map((mod: any) => {
                const count = historialIa.filter((i: any) => i.historialiamodulo === mod).length;
                return (
                  <button
                    key={mod}
                    onClick={() => setIaFilter(mod)}
                    style={{
                      background: iaFilter === mod ? '#8b5cf6' : '#f1f5f9',
                      color: iaFilter === mod ? 'white' : '#64748b',
                      border: 'none',
                      padding: '6px 14px',
                      borderRadius: '20px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {mod} ({count})
                  </button>
                );
              })}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredIa.map((item: any) => (
                <div key={item.idhistorialia} style={{ 
                  border: '1px solid #e2e8f0', 
                  borderRadius: '12px', 
                  padding: '16px',
                  background: item.historialiaexito === 1 ? 'white' : '#fef2f2',
                  borderColor: item.historialiaexito === 1 ? '#e2e8f0' : '#fecaca'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{ 
                        background: '#f3e8ff', 
                        color: '#7e22ce', 
                        padding: '4px 10px', 
                        borderRadius: '6px', 
                        fontSize: '0.75rem', 
                        fontWeight: 700,
                        border: '1px solid #e9d5ff'
                      }}>
                        {item.historialiamodulo}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
                        {new Date(item.historialiafecha).toLocaleString()}
                      </span>
                    </div>
                    {item.historialiaexito !== 1 && (
                      <span style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: 700, background: '#fee2e2', padding: '2px 8px', borderRadius: '4px' }}>
                        ⚠️ Error / Fallido
                      </span>
                    )}
                  </div>
                  
                  <div style={{ marginBottom: '12px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '4px' }}>PROMPT / ACCIÓN:</span>
                    <div style={{ fontSize: '0.85rem', color: '#334155', background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                      {item.historialiaprompt || '—'}
                    </div>
                  </div>

                  {item.historialiarespuesta && (
                    <div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '4px' }}>RESPUESTA IA:</span>
                      <div style={{ fontSize: '0.85rem', color: '#334155', background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px dashed #cbd5e1', maxHeight: '150px', overflowY: 'auto' }}>
                        {item.historialiarespuesta}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
