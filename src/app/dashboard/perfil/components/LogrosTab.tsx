import React from 'react';
import { useProfileSecurity } from '../hooks/useProfileSecurity';

interface LogrosTabProps {
  securityData: ReturnType<typeof useProfileSecurity>;
}

export function LogrosTab({ securityData }: LogrosTabProps) {
  const { achievementsHistory } = securityData;
  return (
    <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', animation: 'fadeIn 0.3s ease' }}>
      <h3 style={{ margin: '0 0 16px 0', color: '#d97706', fontSize: '1.1rem', fontWeight: 800 }}>🏆 Logros</h3>
      <div className="accordion-body">
        <label className="section-label">Vitrina Temporal de Logros</label>
        <div className="achievements-timeline" style={{ background: 'var(--bg-card)', padding: '15px', borderRadius: '12px', border: '1px solid var(--border-color)', marginTop: '10px' }}>
          {achievementsHistory.length > 0 ? (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, borderLeft: '2px solid var(--accent-amber)', marginLeft: '10px' }}>
              {achievementsHistory.map((logro, i) => (
                <li key={i} style={{ paddingLeft: '20px', position: 'relative', marginBottom: i === achievementsHistory.length - 1 ? '0' : '15px' }}>
                  <span style={{
                    position: 'absolute', left: '-11px', top: '2px', width: '20px', height: '20px',
                    background: 'var(--accent-amber)', borderRadius: '50%', border: '4px solid var(--bg-card)'
                  }}></span>
                  <strong style={{ color: 'var(--accent-amber)', fontSize: '1.05rem', display: 'block' }}>{logro.nombre_logro}</strong>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    <div>Inicio: {new Date(logro.fecha_desbloqueo).toLocaleDateString('es-ES')} a las {new Date(logro.fecha_desbloqueo).toLocaleTimeString('es-ES', {hour: '2-digit', minute:'2-digit'})}</div>
                    <div>Fin: {logro.fecha_fin ? `${new Date(logro.fecha_fin).toLocaleDateString('es-ES')} a las ${new Date(logro.fecha_fin).toLocaleTimeString('es-ES', {hour: '2-digit', minute:'2-digit'})}` : 'En curso'}</div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>Aún no has desbloqueado ningún logro. ¡Sigue interactuando en la comunidad!</p>
          )}
        </div>
      </div>
    </div>
  );
}
