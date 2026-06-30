import React from 'react';
import PremiumModal from '@/components/ui/PremiumModal';
import PremiumModalHeader from '@/components/ui/PremiumModalHeader';
import PremiumFormTabs from '@/components/ui/PremiumFormTabs';
import { getMediaUrl } from '@/lib/media-url';

interface AiAssistantModalProps {
  showAiConfig: boolean;
  setShowAiConfig: React.Dispatch<React.SetStateAction<boolean>>;
  showAiModal: boolean;
  closeAiModal: () => void;
  aiLoading: boolean;
  aiSeconds: number;
  runUnifiedAiSearch: () => Promise<void>;
  aiStats: any;
  formData: any;
  aiConfigTabs: Record<string, boolean>;
  setAiConfigTabs: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  aiConfigPrompt: string;
  setAiConfigPrompt: React.Dispatch<React.SetStateAction<string>>;
  sinSelectedScope: string;
  setSinSelectedScope: React.Dispatch<React.SetStateAction<string>>;
  setSinExtraInstructions: React.Dispatch<React.SetStateAction<string>>;
  sinScopePresets: Record<string, string>;
  aiProposal: any;
  isAssimilating: boolean;
  assimilationSeconds: number;
  showOnlyDiffs: boolean;
  setShowOnlyDiffs: React.Dispatch<React.SetStateAction<boolean>>;
  assimilateAll: () => Promise<void>;
  aiModalActiveTab: string;
  setAiModalActiveTab: React.Dispatch<React.SetStateAction<string>>;
  masterFases: any[];
  masterEspecies: any[];
  selectedRels: { ben: any[]; per: any[]; pla: any[] };
  setSelectedRels: React.Dispatch<React.SetStateAction<{ ben: any[]; per: any[]; pla: any[] }>>;
  assimilateTab: (tabId: string) => Promise<void>;
  selectedAiFields: Record<string, boolean>;
  setSelectedAiFields: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  collapsedAiGroups: Record<string, boolean>;
  setCollapsedAiGroups: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  isAssimilatingRels: boolean;
  selectedAiSinonimos: any[];
  setSelectedAiSinonimos: React.Dispatch<React.SetStateAction<any[]>>;
  isAssimilatingSinonimos: boolean;
  masterIdiomas: any[];
  masterPaises: any[];
  selectedAiAlimentacion: any[];
  setSelectedAiAlimentacion: React.Dispatch<React.SetStateAction<any[]>>;
  isAssimilatingAlimentacion: boolean;
  masterAnimales: any[];
  selectedAiVariedades: any[];
  setSelectedAiVariedades: React.Dispatch<React.SetStateAction<any[]>>;
  isAssimilatingVariedades: boolean;
  assimilatedVarietyNames: string[];
  setAssimilatedVarietyNames: React.Dispatch<React.SetStateAction<string[]>>;
  existingVarieties: any[];
}

const aiGroups = [
  {
    id: 'taxonomia',
    title: '🧬 Identificación',
    keys: ['especiesvegetalesnombrecientifico', 'xespeciesvegetalesidfamilias', 'especiescolor', 'especiestamano', 'especiesvegetalesicono', 'especiestipo', 'especiesciclo'],
    labels: {
      especiesvegetalesnombrecientifico: 'Nombre científico',
      xespeciesvegetalesidfamilias: 'Familia (ID)',
      especiesfamilia: 'Familia',
      especiescolor: 'Color Fenotípico',
      especiestamano: 'Tamaño',
      especiesvegetalesicono: 'Icono/Emoji',
      especiestipo: 'Tipos',
      especiesciclo: 'Ciclo'
    }
  },
  {
    id: 'cultivo',
    title: '🌱 Requisitos y Suelo',
    keys: [
      'especiesphminimosuelo', 'especiesphmaximosuelo', 'especiescaracteristicassuelo', 'especiesnecesidadriego', 
      'especiestiposiembra', 'especiestiposiembrapreferente', 'especiesvolumenmaceta', 
      'especiesemillerovolumendesde', 'especiesemillerovolumenhasta', 'especiesdificultad', 
      'especiesviabilidadsemilla', 'especiespeso1000semillas', 'especiestemperaturaminima', 
      'especiestemperaturaoptima', 'especiestemperaturamaxima', 'especiesprofundidadsiembra', 
      'especiesprofundidadtrasplante', 'especiesluzsolar',
      'especiespreparacionconvencional', 'especiespreparacionminima', 'especiespreparacionnolaboreo',
      'especiesmarcoplantas', 'especiesmarcofilas', 'especiesmarcomargen',
      'especiesresistenciahelada', 'especiesnecesidadtutoraje', 'especiesporteplanta',
      'especiesrendimientoestimado', 'especiespartecosechable', 'especiesgerminaroscuridad'
    ],
    labels: {
      especiesphminimosuelo: 'pH Mín. Suelo',
      especiesphmaximosuelo: 'pH Máx. Suelo',
      especiescaracteristicassuelo: 'Tipo de Suelo',
      especiesnecesidadriego: 'Nec. Riego',
      especiestiposiembra: 'Tipos de Siembra',
      especiestiposiembrapreferente: 'Siembra Preferida',
      especiesvolumenmaceta: 'Volumen Maceta (L)',
      especiesemillerovolumendesde: 'Vol. Semillero Mín (cc)',
      especiesemillerovolumenhasta: 'Vol. Semillero Máx (cc)',
      especiesdificultad: 'Dificultad',
      especiesviabilidadsemilla: 'Viabilidad Semilla (Años)',
      especiespeso1000semillas: 'Peso 1000 Semillas (g)',
      especiestemperaturaminima: 'Temp. Mínima (°C)',
      especiestemperaturaoptima: 'Temp. Óptima (°C)',
      especiestemperaturamaxima: 'Temp. Máxima (°C)',
      especiesprofundidadsiembra: 'Profundidad Siembra (cm)',
      especiesprofundidadtrasplante: 'Profundidad Trasplante (cm)',
      especiesluzsolar: 'Luz Solar',
      especiespreparacionconvencional: 'Prep. Convencional (días)',
      especiespreparacionminima: 'Prep. Mínima (días)',
      especiespreparacionnolaboreo: 'Prep. Sin Laboreo (días)',
      especiesmarcoplantas: 'Marco entre Plantas (cm)',
      especiesmarcofilas: 'Marco entre Filas (cm)',
      especiesmarcomargen: 'Margen al Borde (cm)',
      especiesresistenciahelada: 'Resistencia a Heladas',
      especiesnecesidadtutoraje: 'Necesidad de Tutoraje',
      especiesporteplanta: 'Porte de la Planta',
      especiesrendimientoestimado: 'Rendimiento Estimado',
      especiespartecosechable: 'Parte Cosechable',
      especiesgerminaroscuridad: '¿Germina en Oscuridad?'
    }
  },
  {
    id: 'fases',
    title: '📅 Calendarios y Fases',
    keys: [
      'especiesfechasemillerodesde', 'especiesfechasemillerohasta',
      'especiesfechasiembradirectadesde', 'especiesfechasiembradirectahasta',
      'especiestrasplantedesde', 'especiestrasplantehasta',
      'especiesfecharecolecciondesde', 'especiesfecharecoleccionhasta',
      'fases_duracion'
    ],
    labels: {
      especiesfechasemillerodesde: 'Semillero (Desde)',
      especiesfechasemillerohasta: 'Semillero (Hasta)',
      especiesfechasiembradirectadesde: 'Siembra Dir. (Desde)',
      especiesfechasiembradirectahasta: 'Siembra Dir. (Hasta)',
      especiestrasplantedesde: 'Trasplante (Desde)',
      especiestrasplantehasta: 'Trasplante (Hasta)',
      especiesfecharecolecciondesde: 'Recolección (Desde)',
      especiesfecharecoleccionhasta: 'Recolección (Hasta)',
      fases_duracion: 'Duración de Fases'
    }
  },
  {
    id: 'biodinamica',
    title: '🌙 Luna y Biodinámica',
    keys: [
      'especieslunarfasesiembra', 
      'especieslunarfasetrasplante', 
      'especieslunarobservaciones',
      'especiesorganocomestible', 
      'especiesbiodinamicafasesiembra',
      'especiesbiodinamicafasetrasplante',
      'especiesbiodinamicanotas'
    ],
    labels: {
      especieslunarfasesiembra: 'Fase Siembra (Lunar)',
      especieslunarfasetrasplante: 'Fase Trasplante (Lunar)',
      especieslunarobservaciones: 'Notas (Lunar)',
      especiesorganocomestible: 'Órgano Comestible',
      especiesbiodinamicafasesiembra: 'Fase Siembra (Biodinámica)',
      especiesbiodinamicafasetrasplante: 'Fase Trasplante (Biodinámica)',
      especiesbiodinamicanotas: 'Notas (Biodinámica)'
    }
  },
  {
    id: 'asociaciones',
    title: '🤝 Asociaciones',
    keys: [],
    labels: {}
  },
  {
    id: 'textos',
    title: '📝 Textos y Autosuficiencia',
    keys: [
      'especieshistoria', 'especiesvegetalesdescripcion', 'especiesfuentesinformacion',
      'especiesautosuficienciaparcial', 'especiesautosuficiencia', 'especiesautosuficienciaconserva'
    ],
    labels: {
      especieshistoria: 'Historia',
      especiesvegetalesdescripcion: 'Descripción',
      especiesfuentesinformacion: 'Fuentes',
      especiesautosuficienciaparcial: 'Autosuf. Parcial (pl/pers)',
      especiesautosuficiencia: 'Autosuf. Completa (pl/pers)',
      especiesautosuficienciaconserva: 'Autosuf. Conserva (pl/pers)'
    }
  },
  {
    id: 'sinonimos',
    title: '🗣️ Sinónimos',
    keys: [],
    labels: {}
  },
  {
    id: 'variedades',
    title: '🌾 Variedades',
    keys: [],
    labels: {}
  },
  {
    id: 'alimentacion',
    title: '🍽️ Usos y Consumo',
    keys: [],
    labels: {}
  },
  {
    id: 'pautas',
    title: '📋 Labores',
    keys: [],
    labels: {}
  }
];

export default function AiAssistantModal({
  showAiConfig,
  setShowAiConfig,
  showAiModal,
  closeAiModal,
  aiLoading,
  aiSeconds,
  runUnifiedAiSearch,
  aiStats,
  formData,
  aiConfigTabs,
  setAiConfigTabs,
  aiConfigPrompt,
  setAiConfigPrompt,
  sinSelectedScope,
  setSinSelectedScope,
  setSinExtraInstructions,
  sinScopePresets,
  aiProposal,
  isAssimilating,
  assimilationSeconds,
  showOnlyDiffs,
  setShowOnlyDiffs,
  assimilateAll,
  aiModalActiveTab,
  setAiModalActiveTab,
  masterFases,
  masterEspecies,
  selectedRels,
  setSelectedRels,
  assimilateTab,
  selectedAiFields,
  setSelectedAiFields,
  collapsedAiGroups,
  setCollapsedAiGroups,
  isAssimilatingRels,
  selectedAiSinonimos,
  setSelectedAiSinonimos,
  isAssimilatingSinonimos,
  masterIdiomas,
  masterPaises,
  selectedAiAlimentacion,
  setSelectedAiAlimentacion,
  isAssimilatingAlimentacion,
  masterAnimales,
  selectedAiVariedades,
  setSelectedAiVariedades,
  isAssimilatingVariedades,
  assimilatedVarietyNames,
  setAssimilatedVarietyNames,
  existingVarieties
}: AiAssistantModalProps) {
  return (
    <>
      {/* MODAL DE CONFIGURACIÓN IA */}
      {showAiConfig && (
        <PremiumModal isOpen={showAiConfig} onClose={() => setShowAiConfig(false)} maxWidth="600px" zIndex={10000}>
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
            onClose={() => setShowAiConfig(false)}
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
                          onChange={(e) => setAiConfigTabs(prev => ({ ...prev, [tabKey]: e.target.checked }))}
                          style={{ accentColor: '#7c3aed', width: '14px', height: '14px', margin: 0 }}
                        />
                        <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#334155' }}>
                          {labelMap[tabKey]}
                        </span>
                      </label>
                    );
                  })}
                </div>

                {/* Sub-bloque: Ámbito de Sinónimos */}
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
      )}

      {/* MODAL DE COMPARACIÓN IA */}
      {showAiModal && aiProposal !== null && (
        <PremiumModal isOpen={true} onClose={closeAiModal} maxWidth="900px" zIndex={10000}>
          <PremiumModalHeader
            title={isAssimilating ? (
              <>
                <span style={{ fontSize: '1.2rem', animation: 'spin 2s linear infinite', display: 'inline-block' }}>⏳</span>
                Asimilando cambios... {assimilationSeconds}s
              </>
            ) : `✨ Revisión IA — ${formData.especiesvegetalesnombre}`}
            onClose={closeAiModal}
            actions={
              !isAssimilating && (
                <>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', padding: '5px 12px', background: 'rgba(255,255,255,0.15)', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, color: 'white', userSelect: 'none' }}>
                    <input
                      type="checkbox"
                      checked={showOnlyDiffs}
                      onChange={(e) => setShowOnlyDiffs(e.target.checked)}
                      style={{ accentColor: '#fbbf24', width: '14px', height: '14px' }}
                    />
                    ⚠️ Ver solo cambios
                  </label>
                  <button type="button" onClick={assimilateAll} style={{ padding: '6px 16px', borderRadius: '6px', border: 'none', background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem', boxShadow: '0 2px 6px rgba(16,185,129,0.3)', transition: 'all 0.2s' }}>
                    ✅ Asimilar Todos
                  </button>
                </>
              )
            }
          />

          <div className="ai-modal-body" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', flex: 1, maxHeight: '75vh' }}>
            {!showOnlyDiffs ? (
              <>
                {/* Pestañas del Modal */}
                <PremiumFormTabs
                  tabs={aiGroups.filter(g => aiConfigTabs[g.id]).map(group => {
                    const hasDiff = group.id === 'asociaciones'
                      ? ((aiProposal.asociaciones_beneficiosas?.length > 0) || (aiProposal.asociaciones_perjudiciales?.length > 0) || (aiProposal.afecciones_asociadas?.length > 0))
                      : group.id === 'sinonimos'
                        ? (aiProposal._sinonimos?.length > 0)
                        : group.id === 'variedades'
                          ? (aiProposal._variedades?.length > 0)
                          : group.keys.some(k => {
                              if (k === 'fases_duracion') {
                                const phasesList = masterFases.filter((f: any) => f.fasescultivotipo === 'Fase' && f.fasescultivoclave !== 'planificacion');
                                return phasesList.some((f: any) => {
                                  const fid = f.idfasescultivo.toString();
                                  const currentVal = formData.fases_duracion?.[fid] != null ? String(formData.fases_duracion[fid]) : '';
                                  const aiVal = aiProposal.fases_duracion?.[fid] != null ? String(aiProposal.fases_duracion[fid]) : '';
                                  return aiVal !== '' && currentVal !== aiVal;
                                });
                              } else {
                                let currentVal = formData[k] != null ? formData[k] : '';
                                let aiVal = aiProposal[k] != null ? aiProposal[k] : '';
                                if (Array.isArray(currentVal)) currentVal = [...currentVal].sort().join(',');
                                else currentVal = String(currentVal);
                                if (Array.isArray(aiVal)) aiVal = [...aiVal].sort().join(',');
                                else aiVal = String(aiVal);
                                return aiVal !== '' && currentVal !== aiVal;
                              }
                            });
                    return { id: group.id, label: group.title, hasNotification: hasDiff };
                  })}
                  activeTab={aiModalActiveTab}
                  onTabChange={setAiModalActiveTab}
                  style={{ marginBottom: 0, paddingBottom: 0 }}
                />

                {/* Contenido de la Pestaña Activa */}
                {aiGroups.map(group => {
                  if (group.id !== aiModalActiveTab || !aiConfigTabs[group.id]) return null;

                  if (group.id === 'asociaciones') {
                    const hasRels = (aiProposal.asociaciones_beneficiosas?.length > 0 || aiProposal.asociaciones_perjudiciales?.length > 0 || aiProposal.afecciones_asociadas?.length > 0);
                    return (
                      <div key={group.id} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                          <div>
                            <h4 style={{ margin: 0, color: '#334155', fontSize: '0.95rem' }}>Ecosistema de Asociaciones y Plagas</h4>
                            <small style={{ color: '#64748b' }}>Se crearán como especies/plagas inactivas en el catálogo si no existen.</small>
                          </div>
                          <button type="button" className="btn-assimilate-row" style={{ padding: '8px 16px', background: '#e0e7ff', color: '#4338ca', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }} onClick={() => assimilateTab('asociaciones')}>
                            ✨ Asimilar Asociaciones
                          </button>
                        </div>

                        {!hasRels ? (
                          <p style={{ textAlign: 'center', padding: '24px', color: '#94a3b8', fontStyle: 'italic', margin: 0 }}>No hay asociaciones propuestas.</p>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {aiProposal.asociaciones_beneficiosas?.length > 0 && (
                              <div>
                                <h5 style={{ color: '#10b981', margin: '0 0 8px', fontSize: '0.9rem' }}>➕ Beneficiosas</h5>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                  {aiProposal.asociaciones_beneficiosas.map((item: any, idx: number) => {
                                    const name = typeof item === 'string' ? item : item?.nombre;
                                    const motivo = typeof item === 'string' ? '' : (item?.motivo || '');
                                    if (!name) return null;
                                    const exists = masterEspecies.some(e => e.especiesvegetalesnombre.toLowerCase().trim() === name.toLowerCase().trim());
                                    const isChecked = selectedRels.ben.some((s: any) => (typeof s === 'string' ? s : s?.nombre) === name);
                                    return (
                                      <label key={`ben_tab_${idx}`} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', cursor: 'pointer' }}>
                                        <input type="checkbox" checked={isChecked} onChange={(e) => {
                                          if (e.target.checked) setSelectedRels(p => ({ ...p, ben: [...p.ben, item] }));
                                          else setSelectedRels(p => ({ ...p, ben: p.ben.filter((n: any) => (typeof n === 'string' ? n : n?.nombre) !== name) }));
                                        }} style={{ accentColor: '#10b981', width: '16px', height: '16px' }} />
                                        <span style={{ fontSize: '0.85rem' }}>{exists ? '✅' : '➕'}</span>
                                        <span style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>{name}</span>
                                        {motivo && <span style={{ color: '#64748b', fontSize: '0.8rem' }}> — {motivo}</span>}
                                        {exists ? <small style={{ color: '#64748b', marginLeft: 'auto' }}>(Existente)</small> : <small style={{ color: '#f59e0b', marginLeft: 'auto' }}>(Se creará inactiva)</small>}
                                      </label>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  }
                  
                  return null;
                })}
              </>
            ) : null}
          </div>
        </PremiumModal>
      )}
    </>
  );
}
