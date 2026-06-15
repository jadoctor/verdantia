import React, { Dispatch, SetStateAction } from 'react';
import { useRouter } from 'next/navigation';
import { Familia, Especie } from '../types';

interface TabDatosGeneralesProps {
  familia: Familia;
  especies: Especie[];
  handleChange: (field: string, value: any) => void;
  setAiModalType: Dispatch<SetStateAction<'rotacion' | 'general' | 'full'>>;
  setShowAiModal: Dispatch<SetStateAction<boolean>>;
  setAiProposals: Dispatch<SetStateAction<any>>;
  setAiExtraInstructions: Dispatch<SetStateAction<string>>;
}

export default function TabDatosGenerales({ 
  familia, 
  especies, 
  handleChange,
  setAiModalType,
  setShowAiModal,
  setAiProposals,
  setAiExtraInstructions
}: TabDatosGeneralesProps) {
  const router = useRouter();
  
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #d1d5db',
    fontSize: '0.9rem', transition: 'border-color 0.2s', boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '0.8rem', fontWeight: 700, color: '#374151', marginBottom: '4px', display: 'block',
  };

  return (
    <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
      {/* Action Buttons */}
      <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => { setAiModalType('general'); setShowAiModal(true); setAiProposals(null); setAiExtraInstructions(''); }}
          style={{
            background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
            color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold',
            height: '38px', padding: '0 16px', cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(109, 40, 217, 0.2)',
            display: 'flex', alignItems: 'center', gap: '8px'
          }}
        >
          ✨ Asistente IA
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        <div>
          <label style={labelStyle}>Nombre de la Familia *</label>
          <input type="text" value={familia.familiasnombre || ''} onChange={e => handleChange('familiasnombre', e.target.value)}
            style={inputStyle} placeholder="Solanáceas" />
        </div>
        <div>
          <label style={labelStyle}>Nombre Científico</label>
          <input type="text" value={familia.familiasnombrecientifico || ''} onChange={e => handleChange('familiasnombrecientifico', e.target.value)}
            style={{ ...inputStyle, fontStyle: 'italic' }} placeholder="Solanaceae" />
        </div>
        <div>
          <label style={labelStyle}>Grupo de Rotación *</label>
          <input type="text" value={familia.familiasgruporotacion || ''} onChange={e => handleChange('familiasgruporotacion', e.target.value)}
            style={inputStyle} placeholder="solanaceas" />
          <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Clave que agrupa familias para la rotación</span>
        </div>
        <div>
          <label style={labelStyle}>Años de Descanso</label>
          <input type="number" value={familia.familiasanosdescanso ?? 3} onChange={e => handleChange('familiasanosdescanso', parseInt(e.target.value) || 3)}
            min="1" max="10" style={inputStyle} />
          <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Años mínimos antes de repetir en el mismo bancal</span>
        </div>
        <div>
          <label style={labelStyle}>Emoji Representativo</label>
          <input type="text" value={familia.familiasemoji || ''} onChange={e => handleChange('familiasemoji', e.target.value)}
            maxLength={4} style={{ ...inputStyle, fontSize: '1.5rem', textAlign: 'center', width: '80px' }} />
        </div>
        <div>
          <label style={labelStyle}>Color Identificativo</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input type="color" value={familia.familiascolor || '#64748b'} onChange={e => handleChange('familiascolor', e.target.value)}
              style={{ width: '48px', height: '38px', border: '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer', padding: '2px' }} />
            <span style={{ fontSize: '0.8rem', color: '#64748b', fontFamily: 'monospace' }}>{familia.familiascolor}</span>
            <div style={{ width: '60px', height: '24px', borderRadius: '12px', background: familia.familiascolor, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} />
          </div>
        </div>
      </div>

      <div style={{ marginTop: '20px' }}>
        <label style={labelStyle}>Descripción e Información General</label>
        <textarea value={familia.familiasdescripcion || ''} onChange={e => handleChange('familiasdescripcion', e.target.value)}
          rows={4} placeholder="Descripción botánica, características generales del grupo, clima ideal..."
          style={{ ...inputStyle, resize: 'vertical' }} />
      </div>

      {/* Especies Asociadas a continuación */}
      <div style={{ marginTop: '24px', borderTop: '1px solid #e2e8f0', paddingTop: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#374151', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          🌍 Especies Asociadas ({especies.length})
        </h3>
        <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          {especies.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🌿</div>
              <p style={{ fontSize: '1rem' }}>No hay especies asignadas a esta familia</p>
              <p style={{ fontSize: '0.85rem' }}>Puedes asignar especies desde el formulario de edición de cada especie</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', background: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 700 }}>Icono</th>
                    <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 700 }}>Especie</th>
                    <th style={{ padding: '10px 16px', textAlign: 'center', fontWeight: 700 }}>Estado</th>
                    <th style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 700 }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {especies.map((esp, idx) => (
                    <tr key={esp.idespecies} style={{ background: idx % 2 === 0 ? 'white' : '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 16px', fontSize: '1.3rem' }}>{esp.especiesicono || '🌱'}</td>
                      <td style={{ padding: '10px 16px', fontWeight: 600 }}>{esp.especiesnombre}</td>
                      <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                        <span style={{
                          padding: '3px 10px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 600,
                          background: esp.especiesvisibilidadsino === 1 ? '#d1fae5' : '#fee2e2',
                          color: esp.especiesvisibilidadsino === 1 ? '#065f46' : '#991b1b',
                        }}>
                          {esp.especiesvisibilidadsino === 1 ? 'Visible' : 'Oculta'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                        <button onClick={() => router.push(`/dashboard/admin/especies/${esp.idespecies}`)}
                          style={{ padding: '5px 12px', borderRadius: '6px', border: '1px solid #d1d5db', background: 'white', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
                          onMouseOver={(e) => e.currentTarget.style.background = '#f8fafc'}
                          onMouseOut={(e) => e.currentTarget.style.background = 'white'}
                        >
                          ✏️ Editar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
