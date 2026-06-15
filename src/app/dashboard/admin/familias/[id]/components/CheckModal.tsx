import React, { Dispatch, SetStateAction } from 'react';
import { Familia } from '../types';

interface CheckModalProps {
  familia: Familia;
  showCheckModal: boolean;
  setShowCheckModal: Dispatch<SetStateAction<boolean>>;
}

export default function CheckModal({ familia, showCheckModal, setShowCheckModal }: CheckModalProps) {
  if (!showCheckModal) return null;

  const parseArrayField = (val: any) => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') return val.replace(/[\[\]"]/g, '').split(',').filter(Boolean);
    return [val];
  };

  const fields = [
    { key: 'familiasnombrecientifico', label: 'Nombre Científico', group: 'Datos Generales', valid: !!familia.familiasnombrecientifico },
    { key: 'familiasgruporotacion', label: 'Grupo de Rotación', group: 'Datos Generales', valid: !!familia.familiasgruporotacion },
    { key: 'familiasanosdescanso', label: 'Años de Descanso', group: 'Datos Generales', valid: typeof familia.familiasanosdescanso === 'number' && familia.familiasanosdescanso > 0 },
    { key: 'familiasemoji', label: 'Emoji Representativo', group: 'Datos Generales', valid: !!familia.familiasemoji },
    { key: 'familiascolor', label: 'Color Identificativo', group: 'Datos Generales', valid: !!familia.familiascolor },
    { key: 'familiasdescripcion', label: 'Descripción', group: 'Datos Generales', valid: !!familia.familiasdescripcion },
    { key: 'familiasprecedentes', label: 'Cultivos Precedentes', group: 'Rotación', valid: parseArrayField(familia.familiasprecedentes).length > 0 },
    { key: 'familiassucesores', label: 'Cultivos Sucesores', group: 'Rotación', valid: parseArrayField(familia.familiassucesores).length > 0 },
    { key: 'familiasnotas', label: 'Notas de Rotación', group: 'Rotación', valid: !!familia.familiasnotas }
  ];
  
  const validCount = fields.filter(f => f.valid).length;
  const totalCount = fields.length;
  const percentage = Math.round((validCount / totalCount) * 100);
  
  const grouped = fields.reduce((acc, field) => {
    if (!acc[field.group]) acc[field.group] = [];
    acc[field.group].push(field);
    return acc;
  }, {} as Record<string, typeof fields>);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.45)', zIndex: 10500, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(12px) saturate(180%)' }} onClick={() => setShowCheckModal(false)}>
      <div style={{ background: 'white', borderRadius: '24px', width: '100%', maxWidth: '600px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255,255,255,0.1) inset' }} onClick={e => e.stopPropagation()}>
        <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', padding: '24px 32px', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ color: 'white', margin: 0, fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '12px' }}>
              📊 Estado de Completado
            </h2>
            <button type="button" onClick={() => setShowCheckModal(false)} style={{ color: 'white', background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', opacity: 0.85, transition: 'opacity 0.2s' }}>✖</button>
          </div>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.95rem' }}>
            Revisión de los campos obligatorios y recomendados de la familia <strong style={{ color: 'white' }}>{familia.familiasnombre}</strong>.
          </p>
        </div>

        <div style={{ padding: '32px', overflowY: 'auto', flex: 1, background: '#f8fafc' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginBottom: '12px' }}>
                <div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Completado General</span>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: percentage === 100 ? '#10b981' : '#f59e0b', lineHeight: 1 }}>{percentage}%</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 500 }}>{validCount} de {totalCount} campos</span>
                </div>
              </div>
              <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', background: percentage === 100 ? '#10b981' : 'linear-gradient(90deg, #f59e0b, #fbbf24)', width: `${percentage}%`, transition: 'width 0.5s ease-out', borderRadius: '4px' }}></div>
              </div>
              {percentage === 100 && (
                <div style={{ marginTop: '16px', padding: '12px', background: '#ecfdf5', color: '#047857', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  🎉 ¡Familia completada al 100%! Excelente trabajo.
                </div>
              )}
            </div>

            {Object.entries(grouped).map(([groupName, groupFields]) => (
              <div key={groupName}>
                <h3 style={{ fontSize: '1.05rem', color: '#334155', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px', marginBottom: '16px' }}>{groupName}</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                  {groupFields.map(field => (
                    <div key={field.key} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: field.valid ? '#f0fdf4' : '#fff7ed', padding: '12px 16px', borderRadius: '8px', border: `1px solid ${field.valid ? '#bbf7d0' : '#ffedd5'}` }}>
                      <span style={{ fontSize: '1.2rem' }}>{field.valid ? '✅' : '❌'}</span>
                      <span style={{ fontSize: '0.9rem', fontWeight: 500, color: field.valid ? '#166534' : '#9a3412' }}>{field.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div style={{ padding: '16px 32px', background: 'white', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={() => setShowCheckModal(false)} style={{ padding: '10px 24px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
