import React from 'react';
import { FaseFormData } from '../services/fasesApi';

interface FaseLimitsEditorProps {
  formData: FaseFormData;
  setFormData: React.Dispatch<React.SetStateAction<FaseFormData>>;
  hitosList: any[];
  isMobile: boolean;
}

export function FaseLimitsEditor({ formData, setFormData, hitosList, isMobile }: FaseLimitsEditorProps) {
  if (formData.fasescultivotipo !== 'Fase') return null;

  const handleCheckboxChange = (field: 'fasescultivodesde' | 'fasescultivohasta', key: string, checked: boolean) => {
    const current = (formData[field] || '').split(',').filter(Boolean);
    let next;
    if (checked) {
      next = [...current, key];
    } else {
      next = current.filter(k => k !== key);
    }
    setFormData(prev => ({ ...prev, [field]: next.join(',') }));
  };

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
        ⏳ Duración del Periodo (Límites Temporales)
      </h4>
      <p style={{ margin: '0 0 16px 0', fontSize: '0.8rem', color: '#64748b' }}>
        Elige los hitos del sistema que delimitan el inicio y final de esta fase. Puedes marcar múltiples opciones si hay diferentes caminos de inicio o fin.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '12px' : '20px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#475569', fontSize: '0.85rem' }}>🎬 Hitos de Inicio (Desde)</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '12px', maxHeight: '180px', overflowY: 'auto' }}>
            {hitosList.length === 0 ? (
              <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic' }}>Cargando hitos...</span>
            ) : hitosList.map(h => {
              const isChecked = (formData.fasescultivodesde || '').split(',').includes(h.fasescultivoclave);
              return (
                <label key={h.idfasescultivo} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', cursor: 'pointer', color: '#334155' }}>
                  <input 
                    type="checkbox" 
                    checked={isChecked}
                    onChange={(e) => handleCheckboxChange('fasescultivodesde', h.fasescultivoclave, e.target.checked)}
                    style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                  />
                  <span>{h.fasescultivoicono} {h.fasescultivonombre}</span>
                </label>
              );
            })}
          </div>
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#475569', fontSize: '0.85rem' }}>🏁 Hitos de Fin (Hasta)</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '12px', maxHeight: '180px', overflowY: 'auto' }}>
            {hitosList.length === 0 ? (
              <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic' }}>Cargando hitos...</span>
            ) : hitosList.map(h => {
              const isChecked = (formData.fasescultivohasta || '').split(',').includes(h.fasescultivoclave);
              return (
                <label key={h.idfasescultivo} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', cursor: 'pointer', color: '#334155' }}>
                  <input 
                    type="checkbox" 
                    checked={isChecked}
                    onChange={(e) => handleCheckboxChange('fasescultivohasta', h.fasescultivoclave, e.target.checked)}
                    style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                  />
                  <span>{h.fasescultivoicono} {h.fasescultivonombre}</span>
                </label>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
