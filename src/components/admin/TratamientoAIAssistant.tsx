'use client';

import React, { useState, useEffect } from 'react';

interface TratamientoAIAssistantProps {
  show: boolean;
  onClose: () => void;
  currentData: any;
  onApplyChanges: (newData: any) => void;
}

export default function TratamientoAIAssistant({ show, onClose, currentData, onApplyChanges }: TratamientoAIAssistantProps) {
  const [phase, setPhase] = useState<2 | 3>(2);
  const [loading, setLoading] = useState(false);
  const [aiSeconds, setAiSeconds] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveSeconds, setSaveSeconds] = useState(0);
  
  // Phase 2 Settings
  const [isSystemPromptOpen, setIsSystemPromptOpen] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [fields, setFields] = useState({
    tratamientostipo: true,
    tratamientosaccion: true,
    tratamientosdosis: true,
    tratamientosfrecuencia: true,
    tratamientoscarencia: true,
    tratamientosmecanismo: true,
    tratamientosdescripcion: true,
    tratamientospreparacion: true,
    tratamientosprecauciones: true
  });

  const ALL_FIELDS = [
    { id: 'tratamientostipo', icon: '🌱', label: 'Naturaleza / Origen' },
    { id: 'tratamientosaccion', icon: '⚔️', label: 'Modo de Acción' },
    { id: 'tratamientosdosis', icon: '⚖️', label: 'Dosis Recomendada' },
    { id: 'tratamientosfrecuencia', icon: '🔁', label: 'Frecuencia de Aplicación' },
    { id: 'tratamientoscarencia', icon: '⏳', label: 'Plazo de Seguridad (Carencia)' },
    { id: 'tratamientosmecanismo', icon: '🔬', label: 'Mecanismo de Acción' },
    { id: 'tratamientosdescripcion', icon: '📝', label: 'Descripción General' },
    { id: 'tratamientospreparacion', icon: '🧪', label: 'Preparación y Uso Genérico' },
    { id: 'tratamientosprecauciones', icon: '⚠️', label: 'Precauciones / Toxicidad' }
  ];

  // Phase 3 Results
  const [aiResult, setAiResult] = useState<any>(null);
  const [selectedChanges, setSelectedChanges] = useState<Set<string>>(new Set());
  const [showOnlyChanges, setShowOnlyChanges] = useState(false);

  useEffect(() => {
    if (show) {
      setPhase(2);
      const defaultTags = ALL_FIELDS.map(f => `[${f.label}]`).join(' ');
      setCustomPrompt(defaultTags);
      setFields({
        tratamientostipo: true,
        tratamientosaccion: true,
        tratamientosdosis: true,
        tratamientosfrecuencia: true,
        tratamientoscarencia: true,
        tratamientosmecanismo: true,
        tratamientosdescripcion: true,
        tratamientospreparacion: true,
        tratamientosprecauciones: true
      });
      setAiResult(null);
      setSelectedChanges(new Set());
      setShowOnlyChanges(false);
    }
  }, [show]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      interval = setInterval(() => setAiSeconds(s => s + 1), 1000);
    } else {
      setAiSeconds(0);
    }
    return () => clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (saving) {
      interval = setInterval(() => setSaveSeconds(s => s + 1), 1000);
    } else {
      setSaveSeconds(0);
    }
    return () => clearInterval(interval);
  }, [saving]);

  const handleExecuteAI = async () => {
    setLoading(true);
    setAiSeconds(0);
    
    try {
      const res = await fetch('/api/ai/tratamiento-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: currentData.tratamientosnombre,
          customPrompt: customPrompt,
          categories: fields
        })
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Error desconocido del servidor');
      }

      const parsedData = data.data;
      setAiResult(parsedData);
      
      // Auto-select all changed fields
      const changes = new Set<string>();
      Object.keys(parsedData).forEach(key => {
        if (parsedData[key] && parsedData[key] !== currentData[key]) {
          changes.add(key);
        }
      });
      setSelectedChanges(changes);
      
      setPhase(3);
    } catch (error: any) {
      console.error('Error fetching AI data:', error);
      alert('Error al comunicarse con la IA: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyChanges = async () => {
    setSaving(true);
    setSaveSeconds(0);
    
    const newData = { ...currentData };
    selectedChanges.forEach(key => {
      newData[key] = aiResult[key];
    });

    try {
      // Disparar el guardado y esperar a que termine (Base de Datos)
      await Promise.resolve(onApplyChanges(newData));
      setSaving(false);
      onClose();
    } catch (error) {
      console.error("Error al asimilar cambios:", error);
      setSaving(false);
      // Opcional: Mostrar error en el modal
    }
  };

  const toggleField = (field: keyof typeof fields) => {
    setFields(prev => {
      const isChecked = prev[field];
      const newFields = { ...prev, [field]: !isChecked };
      
      const label = ALL_FIELDS.find(f => f.id === field)?.label || field;
      const tag = `[${label}]`;
      
      setCustomPrompt(currentPrompt => {
        if (!isChecked) {
          // Add tag if not present
          if (!currentPrompt.includes(tag)) {
            return currentPrompt ? `${currentPrompt} ${tag}` : tag;
          }
          return currentPrompt;
        } else {
          // Remove tag
          return currentPrompt.replace(new RegExp(`\\[${label}\\]\\s?`, 'g'), '').trim();
        }
      });
      
      return newFields;
    });
  };

  const toggleChange = (key: string) => {
    const newSet = new Set(selectedChanges);
    if (newSet.has(key)) newSet.delete(key);
    else newSet.add(key);
    setSelectedChanges(newSet);
  };

  if (!show) return null;

  // Render Diff Row Helper
  const renderDiffRow = (label: string, key: string) => {
    const currentVal = currentData[key] || '';
    const aiVal = aiResult?.[key] || '';
    const cleanCurrent = String(currentVal).trim().toLowerCase();
    const cleanAi = String(aiVal).trim().toLowerCase();
    const hasChanged = Boolean(aiVal && cleanAi !== cleanCurrent);
    const isSelected = selectedChanges.has(key);

    if (showOnlyChanges && !hasChanged) return null;

    return (
      <div key={key} style={{ 
        display: 'grid', gridTemplateColumns: 'auto 1fr 1fr', gap: '16px', 
        padding: '12px', borderBottom: '1px solid #e2e8f0',
        background: hasChanged ? (isSelected ? '#f3e8ff' : '#fef08a') : 'transparent',
        alignItems: 'start'
      }}>
        <div>
          {hasChanged && (
            <input 
              type="checkbox" 
              checked={isSelected} 
              onChange={() => toggleChange(key)}
              style={{ width: '18px', height: '18px', accentColor: '#8b5cf6', cursor: 'pointer' }}
            />
          )}
        </div>
        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>{label}</div>
          <div style={{ fontSize: '0.9rem', color: '#334155', whiteSpace: 'pre-wrap' }}>{currentVal || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Sin datos</span>}</div>
        </div>
        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#8b5cf6', textTransform: 'uppercase', marginBottom: '4px' }}>Propuesta IA</div>
          <div style={{ fontSize: '0.9rem', color: hasChanged ? '#6d28d9' : '#334155', fontWeight: hasChanged ? 'bold' : 'normal', whiteSpace: 'pre-wrap' }}>
            {aiVal || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Sin datos</span>}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: 'white', borderRadius: '16px', width: '100%', maxWidth: '1000px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden' }}>
        
        {/* HEADER */}
        <div style={{ 
          background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', 
          padding: '16px 24px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '1.5rem' }}>✨</span>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold' }}>Asistente IA de Tratamientos</h2>
              <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>Motor: GPT-4o / Gemini Pro</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {saving ? (
              <span style={{ fontWeight: 'bold', background: 'rgba(0,0,0,0.2)', padding: '6px 12px', borderRadius: '8px' }}>
                ⏳ Asimilando cambios... {saveSeconds}s
              </span>
            ) : phase === 3 && (
              <>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', cursor: 'pointer', background: 'rgba(0,0,0,0.2)', padding: '6px 12px', borderRadius: '8px' }}>
                  <input type="checkbox" checked={showOnlyChanges} onChange={e => setShowOnlyChanges(e.target.checked)} />
                  ⚠️ Ver solo cambios
                </label>
                <button onClick={onClose} style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                  🗑️ Descartar
                </button>
                <button onClick={handleApplyChanges} style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                  ✅ Asimilar Seleccionados
                </button>
              </>
            )}
            
            {phase === 2 && !loading && (
              <>
                <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                  Cancelar
                </button>
                <button onClick={handleExecuteAI} style={{ background: 'white', color: '#6d28d9', border: 'none', padding: '8px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  🚀 Analizar
                </button>
              </>
            )}
          </div>
        </div>

        {/* CONTADOR INTERACCIONES */}
        <div style={{ background: '#f8fafc', padding: '8px 24px', borderBottom: '1px solid #e2e8f0', fontSize: '0.8rem', color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
          <span>Consultas disponibles del límite de plataforma OpenAI.</span>
        </div>

        {/* BODY */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', background: '#f8fafc', position: 'relative' }}>
          
          {phase === 2 && (
            <>
              <div style={{ 
                display: 'flex', flexDirection: 'column', gap: '24px',
                opacity: loading ? 0.3 : 1,
                pointerEvents: loading ? 'none' : 'auto',
                transition: 'opacity 0.3s ease'
              }}>
              
              {/* 1. Entidad Objetivo */}
              <div style={{ background: '#eff6ff', borderLeft: '4px solid #3b82f6', padding: '16px', borderRadius: '0 8px 8px 0' }}>
                <h4 style={{ margin: '0 0 4px 0', color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  🧪 Tratamiento objetivo:
                </h4>
                <p style={{ margin: 0, color: '#1e40af', fontWeight: 'bold', fontSize: '1.2rem' }}>
                  {currentData.tratamientosnombre || 'Nombre de tratamiento no especificado'}
                </p>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#3b82f6' }}>
                  Asegúrate de escribir bien el nombre antes de lanzar la IA.
                </p>
              </div>

              {/* 2. System Prompt Base */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', background: 'white', overflow: 'hidden' }}>
                <div 
                  onClick={() => setIsSystemPromptOpen(!isSystemPromptOpen)}
                  style={{ padding: '12px 16px', background: '#f1f5f9', cursor: 'pointer', fontWeight: 'bold', color: '#475569', display: 'flex', justifyContent: 'space-between' }}
                >
                  <span>🤖 Instrucciones de Sistema (System Prompt)</span>
                  <span>{isSystemPromptOpen ? '▲' : '▼'}</span>
                </div>
                {isSystemPromptOpen && (
                  <div style={{ padding: '16px', fontSize: '0.85rem', color: '#64748b', fontFamily: 'monospace', whiteSpace: 'pre-wrap', background: '#f8fafc' }}>
                    Eres un ingeniero agrónomo experto. Tu misión es extraer las dosis recomendadas, la frecuencia de aplicación, los plazos de seguridad (carencia) y el mecanismo de acción del tratamiento indicado, estructurando la respuesta en JSON.
                  </div>
                )}
              </div>

              {/* 3. Prompt Dinámico */}
              <div>
                <label style={{ display: 'block', fontWeight: 'bold', color: '#334155', marginBottom: '8px' }}>
                  Instrucciones adicionales (Opcional)
                </label>
                <textarea 
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Ej: Especifica la dosis para cítricos adultos, céntrate en el tratamiento contra pulgón..."
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', resize: 'vertical', minHeight: '80px', fontFamily: 'inherit', boxSizing: 'border-box' }}
                />
              </div>

              {/* 4. Campos a buscar */}
              <div>
                <label style={{ display: 'block', fontWeight: 'bold', color: '#334155', marginBottom: '12px' }}>
                  ¿Qué campos del tratamiento deseas investigar?
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
                  {[
                    { id: 'tratamientostipo', icon: '🌱', label: 'Naturaleza / Origen' },
                    { id: 'tratamientosaccion', icon: '⚔️', label: 'Modo de Acción' },
                    { id: 'tratamientosdosis', icon: '⚖️', label: 'Dosis Recomendada' },
                    { id: 'tratamientosfrecuencia', icon: '🔁', label: 'Frecuencia de Aplicación' },
                    { id: 'tratamientoscarencia', icon: '⏳', label: 'Plazo de Seguridad (Carencia)' },
                    { id: 'tratamientosmecanismo', icon: '🔬', label: 'Mecanismo de Acción' },
                    { id: 'tratamientosdescripcion', icon: '📝', label: 'Descripción General' },
                    { id: 'tratamientospreparacion', icon: '🧪', label: 'Preparación y Uso Genérico' },
                    { id: 'tratamientosprecauciones', icon: '⚠️', label: 'Precauciones / Toxicidad' }
                  ].map(field => (
                    <div 
                      key={field.id}
                      onClick={() => toggleField(field.id as any)}
                      style={{ 
                        padding: '10px 12px', border: fields[field.id as keyof typeof fields] ? '2px solid #8b5cf6' : '1px solid #e2e8f0',
                        background: fields[field.id as keyof typeof fields] ? '#f5f3ff' : 'white',
                        borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                        transition: 'all 0.2s'
                      }}
                    >
                      <input 
                        type="checkbox" 
                        checked={fields[field.id as keyof typeof fields]} 
                        onChange={() => {}}
                        style={{ accentColor: '#8b5cf6' }}
                      />
                      <span style={{ fontSize: '1.2rem' }}>{field.icon}</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: fields[field.id as keyof typeof fields] ? 'bold' : 'normal', color: fields[field.id as keyof typeof fields] ? '#6d28d9' : '#64748b' }}>
                        {field.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              </div>

              {loading && (
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                  background: 'rgba(255,255,255,0.75)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  zIndex: 10
                }}>
                  <div style={{ fontSize: '3rem', marginBottom: '16px', animation: 'spin 2s linear infinite' }}>⏳</div>
                  <h3 style={{ margin: '0 0 16px 0', color: '#334155' }}>Analizando tratamiento...</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', maxWidth: '80%' }}>
                    {Object.entries(fields).filter(([_, v]) => v).map(([k]) => {
                      const label = ALL_FIELDS.find(f => f.id === k)?.label || k;
                      return (
                        <span key={k} style={{ background: '#ede9fe', color: '#6d28d9', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                          {label}
                        </span>
                      );
                    })}
                  </div>
                  <p style={{ marginTop: '16px', fontSize: '0.9rem', color: '#64748b' }}>T: {aiSeconds}s</p>
                </div>
              )}
            </>
          )}

          {phase === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              <div style={{ padding: '16px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px 12px 0 0', display: 'grid', gridTemplateColumns: 'auto 1fr 1fr', gap: '16px' }}>
                <div style={{ width: '18px' }}></div>
                <div style={{ fontWeight: 'bold', color: '#1e293b' }}>Valor Actual</div>
                <div style={{ fontWeight: 'bold', color: '#8b5cf6' }}>Propuesta IA</div>
              </div>
              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderTop: 'none', borderRadius: '0 0 12px 12px', overflow: 'hidden' }}>
                {fields.tratamientostipo && renderDiffRow('Naturaleza / Origen', 'tratamientostipo')}
                {fields.tratamientosaccion && renderDiffRow('Modo de Acción', 'tratamientosaccion')}
                {fields.tratamientosdosis && renderDiffRow('Dosis Recomendada', 'tratamientosdosis')}
                {fields.tratamientosfrecuencia && renderDiffRow('Frecuencia de Aplicación', 'tratamientosfrecuencia')}
                {fields.tratamientoscarencia && renderDiffRow('Plazo de Seguridad (Carencia)', 'tratamientoscarencia')}
                {fields.tratamientosmecanismo && renderDiffRow('Mecanismo de Acción', 'tratamientosmecanismo')}
                {fields.tratamientosdescripcion && renderDiffRow('Descripción General', 'tratamientosdescripcion')}
                {fields.tratamientospreparacion && renderDiffRow('Preparación y Uso Genérico', 'tratamientospreparacion')}
                {fields.tratamientosprecauciones && renderDiffRow('Precauciones / Toxicidad', 'tratamientosprecauciones')}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
