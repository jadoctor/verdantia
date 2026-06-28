import React, { Dispatch, SetStateAction } from 'react';
import { Familia, FamiliaMin } from '../types';
import PremiumCancelButton from '@/components/ui/PremiumCancelButton';

interface AiModalProps {
  familia: Familia;
  todasFamilias: FamiliaMin[];
  showAiModal: boolean;
  setShowAiModal: Dispatch<SetStateAction<boolean>>;
  aiModalType: string;
  isAILoading: boolean;
  aiSeconds: number;
  handleAIAssist: () => void;
  aiProposals: any;
  applyAIProposals: () => void;
  aiAcceptedFields: Record<string, boolean>;
  setAiAcceptedFields: Dispatch<SetStateAction<Record<string, boolean>>>;
  aiArraySelections: Record<string, string[]>;
  setAiArraySelections: Dispatch<SetStateAction<Record<string, string[]>>>;
  aiPromptOpen: boolean;
  setAiPromptOpen: Dispatch<SetStateAction<boolean>>;
  aiExtraInstructions: string;
  setAiExtraInstructions: Dispatch<SetStateAction<string>>;
}

export default function AiModal({
  familia,
  todasFamilias,
  showAiModal,
  setShowAiModal,
  aiModalType,
  isAILoading,
  aiSeconds,
  handleAIAssist,
  aiProposals,
  applyAIProposals,
  aiAcceptedFields,
  setAiAcceptedFields,
  aiArraySelections,
  setAiArraySelections,
  aiPromptOpen,
  setAiPromptOpen,
  aiExtraInstructions,
  setAiExtraInstructions
}: AiModalProps) {
  if (!showAiModal) return null;

  const renderAiDiff = (key: string, label: string) => {
    const isSelected = !!aiAcceptedFields[key];
    const toggle = () => setAiAcceptedFields(prev => ({ ...prev, [key]: !prev[key] }));
    const oldValue = familia?.[key as keyof Familia];
    const newValue = aiProposals?.[key];

    let oldDisplay = oldValue;
    let newDisplay = newValue;

    const isMatching = String(oldDisplay) === String(newDisplay);

    const renderValue = (val: any) => {
      if (key === 'familiascolor') {
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '24px', height: '24px', borderRadius: '4px', background: String(val || '#000'), border: '1px solid #cbd5e1' }} />
            <span>{String(val || 'Vacío')}</span>
          </div>
        );
      }
      if (key === 'familiasemoji') {
        return <span style={{ fontSize: '1.5rem' }}>{String(val || '❓')}</span>;
      }
      return <span style={{ whiteSpace: 'pre-wrap' }}>{String(val || 'Vacío')}</span>;
    };

    return (
      <div style={{ padding: '12px', background: isSelected ? '#f0fdf4' : 'white', border: `1px solid ${isSelected ? '#86efac' : '#e2e8f0'}`, borderRadius: '8px', marginBottom: '8px', display: 'flex', alignItems: 'stretch', gap: '12px', cursor: 'pointer', transition: 'all 0.2s' }} onClick={toggle}>
        <div style={{ flex: 1 }}>
          <strong style={{ display: 'block', fontSize: '0.95rem', color: '#1e293b', marginBottom: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>{label}</strong>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ background: '#fff1f2', padding: '10px', borderRadius: '6px', border: '1px solid #fecdd3' }}>
              <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', color: '#be123c', marginBottom: '6px', textTransform: 'uppercase' }}>Actual</span>
              <div style={{ fontSize: '0.85rem', color: '#881337', lineHeight: '1.4' }}>{renderValue(oldDisplay)}</div>
            </div>
            
            <div style={{ background: isMatching ? '#f8fafc' : '#f0fdf4', padding: '10px', borderRadius: '6px', border: `1px solid ${isMatching ? '#e2e8f0' : '#bbf7d0'}` }}>
              <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', color: isMatching ? '#64748b' : '#15803d', marginBottom: '6px', textTransform: 'uppercase' }}>Propuesta IA {isMatching && '(Coincide)'}</span>
              <div style={{ fontSize: '0.85rem', color: isMatching ? '#475569' : '#166534', lineHeight: '1.4', fontWeight: isMatching ? 'normal' : '500' }}>{renderValue(newDisplay)}</div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderLeft: '1px solid #e2e8f0', paddingLeft: '16px', minWidth: '90px' }}>
           <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: isSelected ? '#166534' : '#64748b', marginBottom: '8px' }}>{isSelected ? '✅ APLICAR' : '❌ IGNORAR'}</span>
           <input type="checkbox" checked={isSelected} readOnly style={{ cursor: 'pointer', transform: 'scale(1.3)' }} />
        </div>
      </div>
    );
  };

  const renderAiArrayDiff = (key: 'familiasprecedentes' | 'familiassucesores', label: string) => {
    const oldArr = familia?.[key] ? String(familia[key]).replace(/[\[\]"]/g, '').split(',').map(s=>s.trim()).filter(Boolean) : [];
    const newArr = (aiProposals?.[key] || []).map(String);
    const allIds = Array.from(new Set([...oldArr, ...newArr]));

    if (allIds.length === 0) return null;

    const allSelected = allIds.length > 0 && allIds.every(id => aiArraySelections[key]?.includes(id));
    const toggleAll = () => {
      setAiArraySelections(prev => {
        return { ...prev, [key]: allSelected ? [] : [...allIds] };
      });
    };

    return (
      <div style={{ padding: '16px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginBottom: '12px' }}>
          <strong style={{ fontSize: '0.95rem', color: '#1e293b' }}>{label}</strong>
          <button type="button" onClick={toggleAll} style={{ fontSize: '0.75rem', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '4px 8px', color: '#475569', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s' }}>
            {allSelected ? '➖ Desmarcar Grupo' : '➕ Seleccionar Grupo'}
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {allIds.map(id => {
            const isOld = oldArr.includes(id);
            const isNew = newArr.includes(id);
            const isSelected = aiArraySelections[key]?.includes(id);
            const name = todasFamilias.find(f => String(f.idfamilias) === id)?.familiasnombre || id;

            const toggle = () => {
              setAiArraySelections(prev => {
                const current = prev[key] || [];
                return { ...prev, [key]: current.includes(id) ? current.filter(x => x !== id) : [...current, id] };
              });
            };

            let statusBadge = null;
            if (isOld && isNew) statusBadge = <span style={{ fontSize: '0.7rem', background: '#f1f5f9', color: '#64748b', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>COINCIDE</span>;
            else if (isNew && !isOld) statusBadge = <span style={{ fontSize: '0.7rem', background: '#dcfce7', color: '#166534', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>NUEVO DE IA</span>;
            else if (isOld && !isNew) statusBadge = <span style={{ fontSize: '0.7rem', background: '#ffe4e6', color: '#be123c', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>IA SUGIERE ELIMINAR</span>;

            let actionLabel = null;
            if (isOld && isNew) {
              actionLabel = isSelected ? <span style={{ color: '#166534', fontWeight: 'bold' }}>✅ Mantener</span> : <span style={{ color: '#be123c', fontWeight: 'bold' }}>❌ Quitar</span>;
            } else if (isNew && !isOld) {
              actionLabel = isSelected ? <span style={{ color: '#166534', fontWeight: 'bold' }}>✨ Añadir</span> : <span style={{ color: '#64748b', fontWeight: 'bold' }}>❌ Ignorar</span>;
            } else if (isOld && !isNew) {
              actionLabel = isSelected ? <span style={{ color: '#ca8a04', fontWeight: 'bold' }}>⚠️ Mantener</span> : <span style={{ color: '#be123c', fontWeight: 'bold' }}>🗑️ Borrar</span>;
            }

            return (
              <div key={id} onClick={toggle} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', background: isSelected ? '#f0fdf4' : '#f8fafc', border: `1px solid ${isSelected ? '#86efac' : '#e2e8f0'}`, borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '0.95rem', color: isSelected ? '#166534' : '#475569', fontWeight: isSelected ? '600' : 'normal', minWidth: '120px' }}>{name}</span>
                  {statusBadge}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span style={{ fontSize: '0.85rem', width: '90px', textAlign: 'right' }}>{actionLabel}</span>
                  <input type="checkbox" checked={isSelected} readOnly style={{ cursor: 'pointer', transform: 'scale(1.2)' }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="ai-modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.75)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(4px)' }}>
      <div className="ai-modal-content" style={{ background: 'white', borderRadius: '16px', width: '100%', maxWidth: '700px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
        <div className="ai-modal-header" style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
          <h2 style={{ color: 'white', margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            ✨ Asistente IA Integral de Familias
          </h2>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {aiProposals ? (
              <button
                type="button"
                onClick={applyAIProposals}
                style={{ padding: '8px 16px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.4)', transition: 'all 0.2s' }}
              >
                ✅ Aplicar Selección
              </button>
            ) : (
              <button
                type="button"
                disabled={isAILoading}
                onClick={handleAIAssist}
                style={{
                  padding: '8px 16px', background: isAILoading ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.15)',
                  color: 'white', border: '2px solid rgba(255,255,255,0.5)', borderRadius: '8px', fontWeight: 'bold',
                  cursor: isAILoading ? 'not-allowed' : 'pointer', fontSize: '0.9rem', transition: 'all 0.2s'
                }}
              >
                {isAILoading ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite', fontSize: '1rem' }}>⏳</span>
                    Analizando... {aiSeconds}s
                  </span>
                ) : '🚀 Analizar'}
              </button>
            )}
            <PremiumCancelButton onClick={() => setShowAiModal(false)} />
          </div>
        </div>

        {aiProposals ? (
          <div className="ai-modal-body" style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '1.1rem', color: '#0f172a' }}>Revisión de Propuestas</h3>
            <p style={{ margin: '0 0 16px', fontSize: '0.9rem', color: '#64748b' }}>La IA ha generado las siguientes sugerencias. Selecciona cuáles quieres aplicar.</p>
            {renderAiDiff('familiasnombrecientifico', 'Nombre Científico')}
            {renderAiDiff('familiasgruporotacion', 'Grupo de Rotación')}
            {renderAiDiff('familiasanosdescanso', 'Años de Descanso')}
            {renderAiDiff('familiasemoji', 'Emoji Representativo')}
            {renderAiDiff('familiascolor', 'Color Identificativo')}
            {renderAiDiff('familiasdescripcion', 'Descripción e Información General')}
            {renderAiDiff('familiasnotas', 'Notas de Rotación')}
            {renderAiArrayDiff('familiasprecedentes', 'Cultivos Precedentes (Selección Individual)')}
            {renderAiArrayDiff('familiassucesores', 'Cultivos Sucesores (Selección Individual)')}
          </div>
        ) : (
          <div className="ai-modal-body" style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
            <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '16px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
              <p style={{ margin: '0 0 4px', fontWeight: 'bold', color: '#1e293b', fontSize: '1.05rem' }}>
                Generar datos completos para <span style={{ color: '#7c3aed' }}>"{familia?.familiasnombre}"</span>
              </p>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
                La IA analizará la familia botánica y completará automáticamente todos sus datos taxonómicos, visuales y agronómicos (descripción, años de descanso, precedentes y sucesores).
              </p>
            </div>

            <div style={{ marginBottom: '20px', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
              <button
                type="button"
                onClick={() => setAiPromptOpen(!aiPromptOpen)}
                style={{ width: '100%', padding: '10px 16px', background: '#f1f5f9', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: '600', color: '#475569', fontSize: '0.9rem' }}
              >
                <span>📋 Instrucciones del Prompt (técnico)</span>
                <span style={{ transform: aiPromptOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', display: 'inline-block' }}>▼</span>
              </button>
              {aiPromptOpen && (
                <div style={{ padding: '12px 16px', background: '#1e293b', color: '#94a3b8', fontSize: '0.8rem', fontFamily: 'monospace', maxHeight: '200px', overflowY: 'auto', lineHeight: '1.5' }}>
                  La IA recibirá el nombre de la familia actual. Identificará el nombre científico, grupo de rotación, años de descanso, emoji, color, descripción general y las familias ideales a plantar como precedentes y sucesoras (eligiendo de las existentes). Se le exigirá formato JSON estricto.
                </div>
              )}
            </div>

            <div style={{ marginBottom: '0' }}>
              <h4 style={{ margin: '0 0 8px', color: '#1e293b', fontSize: '1rem' }}>💬 Instrucciones extra para la IA</h4>
              <textarea
                value={aiExtraInstructions}
                onChange={e => setAiExtraInstructions(e.target.value)}
                placeholder="Ej. 'Asegúrate de incluir Leguminosas como cultivo precedente...'"
                rows={4}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', resize: 'vertical', fontFamily: 'inherit', lineHeight: '1.5', boxSizing: 'border-box' }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
