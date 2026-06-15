import React, { Dispatch, SetStateAction } from 'react';
import { Familia, FamiliaMin } from '../types';

interface TabRotacionProps {
  familia: Familia;
  todasFamilias: FamiliaMin[];
  handleChange: (field: string, value: any) => void;
  toggleRotacion: (campo: 'familiasprecedentes' | 'familiassucesores', id: number) => void;
  setAiModalType: Dispatch<SetStateAction<'rotacion' | 'general' | 'full'>>;
  setShowAiModal: Dispatch<SetStateAction<boolean>>;
  setAiPromptOpen: Dispatch<SetStateAction<boolean>>;
  setAiProposals: Dispatch<SetStateAction<any>>;
  setAiExtraInstructions: Dispatch<SetStateAction<string>>;
  isAILoading: boolean;
  aiError: string | null;
}

export default function TabRotacion({
  familia,
  todasFamilias,
  handleChange,
  toggleRotacion,
  setAiModalType,
  setShowAiModal,
  setAiPromptOpen,
  setAiProposals,
  setAiExtraInstructions,
  isAILoading,
  aiError
}: TabRotacionProps) {

  const labelStyle: React.CSSProperties = {
    fontSize: '0.8rem', fontWeight: 700, color: '#374151', marginBottom: '4px', display: 'block',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #d1d5db',
    fontSize: '0.9rem', transition: 'border-color 0.2s', boxSizing: 'border-box',
  };

  const renderSelectores = (campo: 'familiasprecedentes' | 'familiassucesores', titulo: string, descripcion: string) => {
    let seleccionados: any = familia[campo] || [];
    if (typeof seleccionados === 'string') {
      seleccionados = seleccionados.replace(/[\[\]"]/g, '').split(',').map((s: string) => parseInt(s.trim())).filter((n: number) => !isNaN(n));
    } else if (!Array.isArray(seleccionados)) {
      seleccionados = [seleccionados];
    }

    return (
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#374151', marginBottom: '4px' }}>{titulo}</h3>
        <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '16px' }}>{descripcion}</p>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {todasFamilias.filter(f => f.idfamilias !== familia.idfamilias).map(f => {
            const isSelected = seleccionados.includes(f.idfamilias);
            return (
              <button
                key={f.idfamilias}
                onClick={() => toggleRotacion(campo, f.idfamilias)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 14px',
                  borderRadius: '20px', border: `1px solid ${isSelected ? f.familiascolor : '#e2e8f0'}`,
                  background: isSelected ? `${f.familiascolor}15` : 'white',
                  color: isSelected ? '#0f172a' : '#64748b',
                  cursor: 'pointer', transition: 'all 0.2s',
                  fontWeight: isSelected ? 600 : 400,
                  boxShadow: isSelected ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                  fontSize: '0.85rem'
                }}
              >
                <span style={{ fontSize: '1.2rem' }}>{f.familiasemoji}</span>
                {f.familiasnombre}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div style={{ background: 'white', padding: '32px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
      
      {/* Action Buttons */}
      <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => { setAiModalType('rotacion'); setShowAiModal(true); setAiPromptOpen(false); setAiProposals(null); setAiExtraInstructions(''); }}
          disabled={isAILoading}
          style={{ 
            height: '38px',
            padding: '0 16px', 
            background: isAILoading ? 'linear-gradient(135deg, #475569, #1e293b)' : 'linear-gradient(135deg, #8b5cf6, #6d28d9)', 
            color: 'white', 
            border: 'none', 
            borderRadius: '8px', 
            fontWeight: 'bold', 
            cursor: isAILoading ? 'not-allowed' : 'pointer', 
            fontSize: '0.9rem', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 12px rgba(109, 40, 217, 0.2)',
            flexShrink: 0
          }}
        >
          {isAILoading ? (
            <>
              <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⏳</span>
              Pensando...
            </>
          ) : (
            <>✨ Asistente IA Rotaciones</>
          )}
        </button>
        {aiError && <span style={{ fontSize: '0.8rem', color: '#ef4444' }}>{aiError}</span>}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px', paddingBottom: '24px', borderBottom: '1px solid #e2e8f0', flexWrap: 'wrap' }}>
        <div style={{ fontSize: '2.5rem', background: '#f0fdf4', width: '64px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '16px' }}>🔄</div>
        <div>
          <h2 style={{ margin: '0 0 4px', color: '#0f172a', fontSize: '1.3rem' }}>Motor de Recomendaciones de Rotación</h2>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>Define qué familias botánicas son beneficiosas antes o después de plantar <strong>{familia.familiasnombre}</strong>.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '40px', alignItems: 'start' }}>
        <div>
          {renderSelectores('familiasprecedentes', '⬅️ Cultivos Precedentes', `¿Qué se recomienda plantar ANTES de ${familia.familiasnombre}?`)}
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 20px', background: '#f8fafc', borderRadius: '12px', border: '2px dashed #cbd5e1' }}>
           <span style={{ fontSize: '3rem', marginBottom: '8px', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))' }}>{familia.familiasemoji}</span>
           <strong style={{ fontSize: '1.3rem', color: '#0f172a' }}>{familia.familiasnombre}</strong>
           <span style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '8px', background: '#e2e8f0', padding: '4px 12px', borderRadius: '12px' }}>Grupo: {familia.familiasgruporotacion}</span>
           <span style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '4px', background: '#e2e8f0', padding: '4px 12px', borderRadius: '12px' }}>Descanso: {familia.familiasanosdescanso} años</span>
        </div>

        <div>
          {renderSelectores('familiassucesores', '➡️ Cultivos Sucesores', `¿Qué se recomienda plantar DESPUÉS de ${familia.familiasnombre}?`)}
        </div>
      </div>

      <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #e2e8f0' }}>
        <label style={{ ...labelStyle, fontSize: '1rem', color: '#0f172a' }}>Notas sobre Rotación y Cultivo</label>
        <p style={{ margin: '0 0 12px 0', fontSize: '0.85rem', color: '#64748b' }}>Anotaciones sobre rotación, plagas comunes o asociaciones favorables para esta familia.</p>
        <textarea value={familia.familiasnotas || ''} onChange={e => handleChange('familiasnotas', e.target.value)}
          rows={4} placeholder="Escribe aquí las notas..."
          style={{ ...inputStyle, resize: 'vertical' }} />
      </div>

    </div>
  );
}
