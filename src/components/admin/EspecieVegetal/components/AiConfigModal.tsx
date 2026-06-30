import React from 'react';
import PremiumModal from '@/components/ui/PremiumModal';
import PremiumModalHeader from '@/components/ui/PremiumModalHeader';

interface AiConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  aiLoading: boolean;
  aiSeconds: number;
  runUnifiedAiSearch: () => void;
  aiConfigTabs: any;
  setAiConfigTabs: React.Dispatch<React.SetStateAction<any>> | ((prev: any) => void);
  aiStats: any;
  formData: any;
  aiConfigPrompt: string;
  setAiConfigPrompt: (val: string) => void;
  sinSelectedScope: string;
  setSinSelectedScope: (val: string) => void;
  setSinExtraInstructions: (val: string) => void;
  sinScopePresets: any;
}

export default function AiConfigModal({
  isOpen,
  onClose,
  aiLoading,
  aiSeconds,
  runUnifiedAiSearch,
  aiConfigTabs,
  setAiConfigTabs,
  aiStats,
  formData,
  aiConfigPrompt,
  setAiConfigPrompt,
  sinSelectedScope,
  setSinSelectedScope,
  setSinExtraInstructions,
  sinScopePresets
}: AiConfigModalProps) {
  return (
    <PremiumModal isOpen={isOpen} onClose={onClose} maxWidth="600px" zIndex={10000}>
      <PremiumModalHeader
        title={
          aiLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '1.5rem', animation: 'spin 2s linear infinite', display: 'inline-block' }}>⏳</span>
              <h2 style={{ color: 'white', margin: 0, fontSize: '1.25rem' }}>Analizando... {aiSeconds}s</h2>
            </div>
          ) : (
            <>✨ Asistente IA</>
          )
        }
        actions={
          !aiLoading && (
            <button type="button" onClick={runUnifiedAiSearch} disabled={aiLoading} style={{ padding: '6px 16px', borderRadius: '6px', border: 'none', background: 'white', color: '#6d28d9', fontWeight: 'bold', cursor: aiLoading ? 'not-allowed' : 'pointer', fontSize: '0.9rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', transition: 'all 0.2s' }}>
              🚀 Analizar
            </button>
          )
        }
        gradient="linear-gradient(135deg, #8b5cf6, #6d28d9)"
        onClose={onClose}
      />
      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '75vh', overflowY: 'auto', position: 'relative' }}>
          
          {/* Overlay de carga superpuesto sobre el contenido existente */}
          {aiLoading && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.75)', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '0 0 12px 12px' }}>
              <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center', padding: '20px' }}>
                <p style={{ margin: 0, color: '#475569', fontSize: '0.9rem', fontWeight: 600 }}>
                  Buscando información para {formData.especiesvegetalesnombre}...
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center', maxWidth: '380px' }}>
                  {Object.keys(aiConfigTabs).filter(k => (aiConfigTabs as any)[k]).map(k => {
                    const labelMap: Record<string, string> = {
                      taxonomia: '🧬 Identificación', cultivo: '🌱 Requisitos', fases: '📅 Cronología',
                      biodinamica: '🌙 Biodinámica', asociaciones: '🤝 Ecosistema', textos: '📝 Textos',
                      sinonimos: '🗣️ Sinónimos', variedades: '🌾 Variedades', alimentacion: '🐄 Alimentación', pautas: '📋 Labores'
                    };
                    return (
                      <span key={k} style={{ background: '#ede9fe', color: '#6d28d9', padding: '3px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600 }}>
                        {labelMap[k]}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Contenido real (siempre renderizado, atenuado si carga) */}
          <div style={{ opacity: aiLoading ? 0.3 : 1, pointerEvents: aiLoading ? 'none' : 'auto', transition: 'opacity 0.3s ease' }}>
            {aiStats && (
              <div style={{ textAlign: 'center', marginBottom: '4px' }}>
                <p style={{ margin: '0 0 4px', fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
                  Interacciones IA este mes: <span style={{ color: aiStats.remaining > 0 ? '#0d9488' : '#ef4444' }}>{aiStats.used} / {aiStats.max}</span>
                </p>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>
                  Incluido gratis en tu suscripción actual.
                </p>
              </div>
            )}
            
            {/* Apartado 1: Entidad Objetivo */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
            <div style={{ fontWeight: 'bold', color: '#1e293b', fontSize: '0.9rem', marginBottom: '4px' }}>1. Entidad Objetivo</div>
            <div style={{ color: '#475569', fontSize: '0.95rem' }}>
              🌱 Especie seleccionada: <strong>{formData.especiesvegetalesnombre || 'Desconocida'}</strong> {formData.especiesvegetalesnombrecientifico ? `(${formData.especiesvegetalesnombrecientifico})` : ''}
            </div>
          </div>

          {/* Apartado 2: System Prompt Base */}
          <details style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
            <summary style={{ fontWeight: 'bold', color: '#1e293b', fontSize: '0.9rem', cursor: 'pointer', outline: 'none', listStyle: 'none', display: 'flex', justifyContent: 'space-between' }}>
              <span>2. System Prompt Base (Instrucciones)</span>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>▼ Expandir</span>
            </summary>
            <div style={{ marginTop: '12px', color: '#475569', fontSize: '0.85rem', fontFamily: 'monospace', background: '#f1f5f9', padding: '10px', borderRadius: '6px' }}>
              Actúa como un experto agrónomo botánico. Debes buscar información detallada, técnica y veraz relativa a la especie seleccionada. Tu objetivo es estructurar los datos para autocompletar una ficha técnica agrícola, ajustándote a los parámetros de las categorías requeridas y proporcionando valores precisos.
            </div>
          </details>

          {/* Apartado 3: Prompt Dinámico (Texto Libre) */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
            <div style={{ fontWeight: 'bold', color: '#1e293b', fontSize: '0.9rem', marginBottom: '8px' }}>3. Prompt Dinámico (Texto Libre)</div>
            <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '10px', background: 'white', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ color: '#64748b', fontSize: '0.85rem', whiteSpace: 'pre-line' }}>
                {`Busca información para las siguientes categorías de la especie:\n${Object.keys(aiConfigTabs).filter(k => (aiConfigTabs as any)[k]).map(k => {
                  const labelMap: Record<string, string> = {
                    taxonomia: '🧬 Identificación', cultivo: '🌱 Requisitos y Suelo', fases: '📅 Cronología',
                    biodinamica: '🌙 Lunar / Biodinámica', asociaciones: '🤝 Ecosistema', textos: '📝 Textos y Autosuf.',
                    sinonimos: '🗣️ Sinónimos', variedades: '🌾 Variedades', alimentacion: '🐄 Alimentación Animal', pautas: '📋 Labores'
                  };
                  return `- ${labelMap[k]}`;
                }).join('\n')}`}
              </div>
              <hr style={{ border: 'none', borderTop: '1px dashed #e2e8f0', margin: 0 }} />
              <textarea
                value={aiConfigPrompt}
                onChange={(e) => setAiConfigPrompt(e.target.value)}
                placeholder="Añade directrices, matices o condiciones adicionales aquí..."
                rows={3}
                style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', resize: 'vertical', fontSize: '0.9rem', color: '#1e293b' }}
              />
            </div>
          </div>

          {/* Apartado 4: Ayudante de Categorías */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ fontWeight: 'bold', color: '#1e293b', fontSize: '0.9rem' }}>4. Ayudante de Categorías</div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setAiConfigTabs({
                  taxonomia: true, cultivo: true, fases: true, biodinamica: true, asociaciones: true, textos: true, sinonimos: true, variedades: true, alimentacion: true, pautas: true
                })} style={{ background: 'none', border: 'none', color: '#7c3aed', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold', padding: 0 }}>
                  ➕ Todas
                </button>
                <button type="button" onClick={() => setAiConfigTabs({
                  taxonomia: false, cultivo: false, fases: false, biodinamica: false, asociaciones: false, textos: false, sinonimos: false, variedades: false, alimentacion: false, pautas: false
                })} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold', padding: 0 }}>
                  ➖ Ninguna
                </button>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 180px), 1fr))', gap: '10px' }}>
              {Object.keys(aiConfigTabs).map((tabKey) => {
                const labelMap: Record<string, string> = {
                  taxonomia: '🧬 Identificación', cultivo: '🌱 Requisitos y Suelo', fases: '📅 Cronología',
                  biodinamica: '🌙 Lunar / Biodinámica', asociaciones: '🤝 Ecosistema', textos: '📝 Textos y Autosuf.',
                  sinonimos: '🗣️ Sinónimos', variedades: '🌾 Variedades', alimentacion: '🐄 Alimentación Animal', pautas: '📋 Labores'
                };
                return (
                  <label key={tabKey} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '6px 8px', background: 'white', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                    <input
                      type="checkbox"
                      checked={(aiConfigTabs as any)[tabKey]}
                      onChange={(e) => setAiConfigTabs((prev: any) => ({ ...prev, [tabKey]: e.target.checked }))}
                      style={{ accentColor: '#7c3aed', width: '14px', height: '14px', margin: 0 }}
                    />
                    <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#334155' }}>
                      {labelMap[tabKey]}
                    </span>
                  </label>
                );
              })}
            </div>

            {/* Sub-bloque: Ámbito de Sinónimos (visible solo si sinónimos está marcado) */}
            {(aiConfigTabs as any).sinonimos && (
              <div style={{ marginTop: '12px', padding: '12px', background: '#f5f3ff', borderRadius: '8px', border: '1px solid #ddd6fe' }}>
                <div style={{ fontWeight: 'bold', color: '#6d28d9', fontSize: '0.8rem', marginBottom: '8px' }}>🌍 Ámbito de búsqueda de sinónimos</div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {[
                    { key: 'general', emoji: '🌎', label: 'General' },
                    { key: 'cooficiales', emoji: '🇪🇸', label: 'Lenguas Cooficiales' },
                    { key: 'europa', emoji: '🇪🇺', label: 'Europea' },
                  ].map(scope => (
                    <label key={scope.key} style={{
                      display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px',
                      border: sinSelectedScope === scope.key ? '2px solid #7c3aed' : '1px solid #e2e8f0',
                      borderRadius: '6px', cursor: 'pointer',
                      background: sinSelectedScope === scope.key ? '#ede9fe' : '#fff',
                      transition: 'all 0.2s', fontSize: '0.8rem'
                    }}>
                      <input
                        type="radio"
                        name="sinScopeUnified"
                        checked={sinSelectedScope === scope.key}
                        onChange={() => {
                          setSinSelectedScope(scope.key);
                          setSinExtraInstructions(sinScopePresets[scope.key]);
                        }}
                        style={{ width: '14px', height: '14px', accentColor: '#7c3aed', flexShrink: 0 }}
                      />
                      <span style={{ fontWeight: sinSelectedScope === scope.key ? 'bold' : 'normal', color: '#1e293b' }}>{scope.emoji} {scope.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </PremiumModal>
  );
}
