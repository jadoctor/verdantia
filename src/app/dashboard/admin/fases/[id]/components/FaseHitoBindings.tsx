import React from 'react';
import { FaseFormData } from '../services/fasesApi';

interface FaseHitoBindingsProps {
  formData: FaseFormData;
  allFasesList: any[];
  isMobile: boolean;
}

export function FaseHitoBindings({ formData, allFasesList, isMobile }: FaseHitoBindingsProps) {
  if (formData.fasescultivotipo !== 'Hito' && formData.fasescultivotipo !== 'Hito Final') return null;

  const startingFases = allFasesList.filter(f => 
    f.fasescultivotipo === 'Fase' && 
    (f.fasescultivodesde || '').split(',').map((k: string) => k.trim()).includes(formData.fasescultivoclave)
  );

  const endingFases = allFasesList.filter(f => 
    f.fasescultivotipo === 'Fase' && 
    (f.fasescultivohasta || '').split(',').map((k: string) => k.trim()).includes(formData.fasescultivoclave)
  );

  return (
    <div style={{ 
      background: '#f8fafc', 
      borderRadius: '12px', 
      padding: '20px', 
      border: '1px dashed #cbd5e1', 
      marginBottom: '20px',
      animation: 'fadeIn 0.3s ease'
    }}>
      <h4 style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: '#1e293b', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
        🔗 Vinculación con Fases de Cultivo
      </h4>
      <p style={{ margin: '0 0 16px 0', fontSize: '0.8rem', color: '#64748b' }}>
        Como este elemento es un **Hito**, actúa como un límite cronológico. Aquí puedes ver qué fases se inician o finalizan al alcanzarlo:
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '12px' : '20px' }}>
        <div>
          <span style={{ display: 'block', fontWeight: 'bold', color: '#0f766e', fontSize: '0.85rem', marginBottom: '8px' }}>🚀 Fases que Empiezan aquí</span>
          <div style={{ background: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '12px', minHeight: '60px' }}>
            {startingFases.map(f => (
              <div key={f.idfasescultivo} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem', margin: '4px 0', color: '#334155' }}>
                <span>{f.fasescultivoicono}</span>
                <span>{f.fasescultivonombre}</span>
              </div>
            ))}
            {startingFases.length === 0 && (
              <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic' }}>Ninguna fase empieza en este hito.</span>
            )}
          </div>
        </div>
        <div>
          <span style={{ display: 'block', fontWeight: 'bold', color: '#b91c1c', fontSize: '0.85rem', marginBottom: '8px' }}>🛑 Fases que Terminan aquí</span>
          <div style={{ background: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '12px', minHeight: '60px' }}>
            {endingFases.map(f => (
              <div key={f.idfasescultivo} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem', margin: '4px 0', color: '#334155' }}>
                <span>{f.fasescultivoicono}</span>
                <span>{f.fasescultivonombre}</span>
              </div>
            ))}
            {endingFases.length === 0 && (
              <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic' }}>Ninguna fase termina en este hito.</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
