import React from 'react';
import PremiumModal from '@/components/ui/PremiumModal';
import PremiumModalHeader from '@/components/ui/PremiumModalHeader';
import PremiumFormTabs from '@/components/ui/PremiumFormTabs';

interface AiComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAssimilating: boolean;
  assimilationSeconds: number;
  formData: any;
  aiProposal: any;
  showOnlyDiffs: boolean;
  setShowOnlyDiffs: (val: boolean) => void;
  assimilateAll: () => void;
  aiGroups: any[];
  aiConfigTabs: any;
  aiModalActiveTab: string;
  setAiModalActiveTab: (tab: string) => void;
  masterFases: any[];
  masterEspecies: any[];
  masterAfecciones: any[];
  masterIdiomas: any[];
  masterPaises: any[];
  masterAnimales: any[];
  masterLabores: any[];
  selectedRels: any;
  setSelectedRels: React.Dispatch<React.SetStateAction<any>>;
  selectedAiSinonimos: number[];
  setSelectedAiSinonimos: React.Dispatch<React.SetStateAction<number[]>>;
  selectedAiVariedades: number[];
  setSelectedAiVariedades: React.Dispatch<React.SetStateAction<number[]>>;
  selectedAiAlimentacion: number[];
  setSelectedAiAlimentacion: React.Dispatch<React.SetStateAction<number[]>>;
  selectedAiFields: any;
  setSelectedAiFields: React.Dispatch<React.SetStateAction<any>>;
  collapsedAiGroups: any;
  setCollapsedAiGroups: React.Dispatch<React.SetStateAction<any>>;
  relaciones: any;
  sinonimos: any[];
  existingVarieties: any[];
  assimilatedVarietyNames: string[];
  alimentacion: any[];
  pautas: any[];
  assimilateTab: (tabId: string) => void;
  assimilateSingleField: (key: string, value: any) => Promise<void>;
  assimilateSinglePhase: (fid: string, value: any) => Promise<void>;
  runWithAssimilationLoading: (fn: () => Promise<void>) => Promise<void>;
  especieId: string | null;
  userEmail: string | null;
}

export default function AiComparisonModal({
  isOpen,
  onClose,
  isAssimilating,
  assimilationSeconds,
  formData,
  aiProposal,
  showOnlyDiffs,
  setShowOnlyDiffs,
  assimilateAll,
  aiGroups,
  aiConfigTabs,
  aiModalActiveTab,
  setAiModalActiveTab,
  masterFases,
  masterEspecies,
  masterAfecciones,
  masterIdiomas,
  masterPaises,
  masterAnimales,
  masterLabores,
  selectedRels,
  setSelectedRels,
  selectedAiSinonimos,
  setSelectedAiSinonimos,
  selectedAiVariedades,
  setSelectedAiVariedades,
  selectedAiAlimentacion,
  setSelectedAiAlimentacion,
  selectedAiFields,
  setSelectedAiFields,
  collapsedAiGroups,
  setCollapsedAiGroups,
  relaciones,
  sinonimos,
  existingVarieties,
  assimilatedVarietyNames,
  alimentacion,
  pautas,
  assimilateTab,
  assimilateSingleField,
  assimilateSinglePhase,
  runWithAssimilationLoading,
  especieId,
  userEmail
}: AiComparisonModalProps) {
  if (!isOpen || !aiProposal) return null;

  return (
    <PremiumModal isOpen={isOpen} onClose={onClose} maxWidth="900px" zIndex={10000}>
      <PremiumModalHeader
        title={isAssimilating ? (
          <>
            <span style={{ fontSize: '1.2rem', animation: 'spin 2s linear infinite', display: 'inline-block' }}>⏳</span>
            Asimilando cambios... {assimilationSeconds}s
          </>
        ) : `✨ Revisión IA — ${formData.especiesvegetalesnombre}`}
        onClose={onClose}
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

      <div className="ai-modal-body" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', flex: 1, maxHeight: '70vh' }}>
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
                      : group.keys.some((k: string) => {
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
                                      if (e.target.checked) setSelectedRels((p: any) => ({ ...p, ben: [...p.ben, item] }));
                                      else setSelectedRels((p: any) => ({ ...p, ben: p.ben.filter((n: any) => (typeof n === 'string' ? n : n?.nombre) !== name) }));
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

                        {aiProposal.asociaciones_perjudiciales?.length > 0 && (
                          <div>
                            <h5 style={{ color: '#ef4444', margin: '0 0 8px', fontSize: '0.9rem' }}>➖ Perjudiciales</h5>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              {aiProposal.asociaciones_perjudiciales.map((item: any, idx: number) => {
                                const name = typeof item === 'string' ? item : item?.nombre;
                                const motivo = typeof item === 'string' ? '' : (item?.motivo || '');
                                if (!name) return null;
                                const exists = masterEspecies.some(e => e.especiesvegetalesnombre.toLowerCase().trim() === name.toLowerCase().trim());
                                const isChecked = selectedRels.per.some((s: any) => (typeof s === 'string' ? s : s?.nombre) === name);
                                return (
                                  <label key={`per_tab_${idx}`} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', cursor: 'pointer' }}>
                                    <input type="checkbox" checked={isChecked} onChange={(e) => {
                                      if (e.target.checked) setSelectedRels((p: any) => ({ ...p, per: [...p.per, item] }));
                                      else setSelectedRels((p: any) => ({ ...p, per: p.per.filter((n: any) => (typeof n === 'string' ? n : n?.nombre) !== name) }));
                                    }} style={{ accentColor: '#ef4444', width: '16px', height: '16px' }} />
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

                        {aiProposal.afecciones_asociadas?.length > 0 && (
                          <div>
                            <h5 style={{ color: '#f97316', margin: '0 0 8px', fontSize: '0.9rem' }}>🐛 Plagas y Enfermedades</h5>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              {aiProposal.afecciones_asociadas.map((item: any, idx: number) => {
                                const name = typeof item === 'string' ? item : item?.nombre;
                                const notas = typeof item === 'string' ? '' : (item?.notas || '');
                                if (!name) return null;
                                const exists = masterAfecciones.some(p => p.afeccionesnombre.toLowerCase().trim() === name.toLowerCase().trim());
                                const isChecked = selectedRels.pla.some((s: any) => (typeof s === 'string' ? s : s?.nombre) === name);
                                return (
                                  <label key={`pla_tab_${idx}`} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', cursor: 'pointer' }}>
                                    <input type="checkbox" checked={isChecked} onChange={(e) => {
                                      if (e.target.checked) setSelectedRels((p: any) => ({ ...p, pla: [...p.pla, item] }));
                                      else setSelectedRels((p: any) => ({ ...p, pla: p.pla.filter((n: any) => (typeof n === 'string' ? n : n?.nombre) !== name) }));
                                    }} style={{ accentColor: '#f97316', width: '16px', height: '16px' }} />
                                    <span style={{ fontSize: '0.85rem' }}>{exists ? '✅' : '➕'}</span>
                                    <span style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>{name}</span>
                                    {notas && <span style={{ color: '#64748b', fontSize: '0.8rem' }}> — {notas}</span>}
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

              if (group.id === 'sinonimos') {
                const sProps = aiProposal._sinonimos || [];
                return (
                  <div key={group.id} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div>
                        <h4 style={{ margin: 0, color: '#334155', fontSize: '0.95rem' }}>Sinónimos Propuestos por la IA</h4>
                        <small style={{ color: '#64748b' }}>Los sinónimos asimilados se agregarán a tu lista de sinónimos editable.</small>
                      </div>
                      <button type="button" className="btn-assimilate-row" style={{ padding: '8px 16px', background: '#e0e7ff', color: '#4338ca', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }} onClick={() => assimilateTab('sinonimos')}>
                        ✨ Asimilar Sinónimos
                      </button>
                    </div>

                    {sProps.length === 0 ? (
                      <p style={{ textAlign: 'center', padding: '24px', color: '#94a3b8', fontStyle: 'italic', margin: 0 }}>No hay sinónimos propuestos.</p>
                    ) : (
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                        <thead>
                          <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1', textAlign: 'left' }}>
                            <th style={{ padding: '10px 12px', width: '40px' }}>
                              <input
                                type="checkbox"
                                checked={selectedAiSinonimos.length === sProps.length}
                                onChange={(e) => {
                                  if (e.target.checked) setSelectedAiSinonimos(sProps.map((_: any, idx: number) => idx));
                                  else setSelectedAiSinonimos([]);
                                }}
                                style={{ accentColor: '#7c3aed' }}
                              />
                            </th>
                            <th style={{ padding: '10px 12px' }}>Nombre</th>
                            <th style={{ padding: '10px 12px' }}>Idioma</th>
                            <th style={{ padding: '10px 12px' }}>País</th>
                            <th style={{ padding: '10px 12px' }}>Notas</th>
                            <th style={{ padding: '10px 12px', textAlign: 'right' }}>Acción</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sProps.map((item: any, idx: number) => {
                            const isChecked = selectedAiSinonimos.includes(idx);
                            const exists = sinonimos.some(s =>
                              s.especiessinonimosnombre?.toLowerCase().trim() === item.especiessinonimosnombre?.toLowerCase().trim() &&
                              String(s.xespeciesvegetalessinonimosidpaises || '') === String(item.xespeciesvegetalessinonimosidpaises || '')
                            );
                            const idioma = masterIdiomas.find(i => i.ididiomas.toString() === String(item.xespeciesvegetalessinonimosididiomas || ''));
                            const pais = masterPaises.find(p => p.idpaises.toString() === String(item.xespeciesvegetalessinonimosidpaises || ''));

                            return (
                              <tr key={idx} className="ai-comparison-grid-with-actions" style={{ borderBottom: '1px solid #e2e8f0', background: isChecked ? '#f5f3ff' : 'transparent', opacity: exists ? 0.7 : 1 }}>
                                <td style={{ padding: '10px 12px' }}>
                                  {!exists && (
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={(e) => {
                                        if (e.target.checked) setSelectedAiSinonimos(prev => [...prev, idx]);
                                        else setSelectedAiSinonimos(prev => prev.filter(v => v !== idx));
                                      }}
                                      style={{ accentColor: '#7c3aed' }}
                                    />
                                  )}
                                  {exists && <span>✅</span>}
                                </td>
                                <td style={{ padding: '10px 12px', fontWeight: 'bold', color: '#1e293b' }}>{item.especiessinonimosnombre}</td>
                                <td style={{ padding: '10px 12px' }}>{idioma ? idioma.idiomasnombre : <em style={{ color: '#94a3b8' }}>No indicado</em>}</td>
                                <td style={{ padding: '10px 12px' }}>{pais ? pais.paisesnombre : <em style={{ color: '#94a3b8' }}>General</em>}</td>
                                <td style={{ padding: '10px 12px', fontStyle: 'italic', color: '#64748b' }}>{item.especiessinonimosnotas || '—'}</td>
                                <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                                  {!exists ? (
                                    <button type="button" className="btn-assimilate-row" style={{ padding: '4px 10px', background: '#e0e7ff', color: '#4338ca', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, fontSize: '0.75rem' }} onClick={async () => {
                                      await runWithAssimilationLoading(async () => {
                                        try {
                                          await fetch(`/api/admin/especiesvegetales/${especieId}/sinonimos`, {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify(item)
                                          });
                                          if (especieId) {
                                            // Trigger reload via props, or it happens automatically through loading states
                                            window.location.reload();
                                          }
                                        } catch (err) {
                                          console.error(err);
                                        }
                                      });
                                    }}>
                                      Agregar
                                    </button>
                                  ) : (
                                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Incluido</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                );
              }

              if (group.id === 'variedades') {
                const vProps = aiProposal._variedades || [];
                return (
                  <div key={group.id} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div>
                        <h4 style={{ margin: 0, color: '#334155', fontSize: '0.95rem' }}>Variedades Propuestas por la IA</h4>
                        <small style={{ color: '#64748b' }}>Las variedades asimiladas se guardan de inmediato en la base de datos.</small>
                      </div>
                      <button type="button" className="btn-assimilate-row" style={{ padding: '8px 16px', background: '#e0e7ff', color: '#4338ca', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }} onClick={() => assimilateTab('variedades')}>
                        ✨ Asimilar Variedades
                      </button>
                    </div>

                    {vProps.length === 0 ? (
                      <p style={{ textAlign: 'center', padding: '24px', color: '#94a3b8', fontStyle: 'italic', margin: 0 }}>No hay variedades propuestas.</p>
                    ) : (
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                        <thead>
                          <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1', textAlign: 'left' }}>
                            <th style={{ padding: '10px 12px', width: '40px' }}>
                              <input
                                type="checkbox"
                                checked={selectedAiVariedades.length === vProps.length}
                                onChange={(e) => {
                                  if (e.target.checked) setSelectedAiVariedades(vProps.map((_: any, idx: number) => idx));
                                  else setSelectedAiVariedades([]);
                                }}
                                style={{ accentColor: '#7c3aed' }}
                              />
                            </th>
                            <th style={{ padding: '10px 12px' }}>Nombre</th>
                            <th style={{ padding: '10px 12px' }}>Tamaño</th>
                            <th style={{ padding: '10px 12px' }}>Germinación</th>
                            <th style={{ padding: '10px 12px' }}>Color</th>
                            <th style={{ padding: '10px 12px' }}>Descripción</th>
                            <th style={{ padding: '10px 12px', textAlign: 'right' }}>Acción</th>
                          </tr>
                        </thead>
                        <tbody>
                          {vProps.map((item: any, idx: number) => {
                            const isChecked = selectedAiVariedades.includes(idx);
                            const isAlreadyInDb = existingVarieties.some(ev => ev.variedadesvegetalesnombre?.toLowerCase().trim() === item.variedadesvegetalesnombre?.toLowerCase().trim());
                            const isAddedNow = assimilatedVarietyNames.includes(item.variedadesvegetalesnombre);
                            const isAdded = isAlreadyInDb || isAddedNow;

                            return (
                              <tr key={idx} className="ai-comparison-grid-with-actions" style={{ borderBottom: '1px solid #e2e8f0', background: isChecked ? '#f5f3ff' : 'transparent', opacity: isAdded ? 0.7 : 1 }}>
                                <td style={{ padding: '10px 12px' }}>
                                  {!isAdded && (
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={(e) => {
                                        if (e.target.checked) setSelectedAiVariedades(prev => [...prev, idx]);
                                        else setSelectedAiVariedades(prev => prev.filter(v => v !== idx));
                                      }}
                                      style={{ accentColor: '#7c3aed' }}
                                    />
                                  )}
                                  {isAdded && <span>✅</span>}
                                </td>
                                <td style={{ padding: '10px 12px', fontWeight: 'bold', color: '#1e293b' }}>
                                  {item.variedadesvegetalesnombre}
                                  {isAlreadyInDb && <span style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 'normal', marginLeft: '8px' }}>(Ya integrada)</span>}
                                  {isAddedNow && <span style={{ color: '#10b981', fontSize: '0.75rem', fontWeight: 'normal', marginLeft: '8px' }}>(Agregada ahora)</span>}
                                </td>
                                <td style={{ padding: '10px 12px', textTransform: 'capitalize' }}>{item.variedadestamano || 'mediano'}</td>
                                <td style={{ padding: '10px 12px' }}>{item.variedadesdiasgerminacion ? `${item.variedadesdiasgerminacion} días` : '—'}</td>
                                <td style={{ padding: '10px 12px' }}>{item.variedadescolor || '—'}</td>
                                <td style={{ padding: '10px 12px', color: '#64748b' }}>{item.variedadesdescripcion || '—'}</td>
                                <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                                  {!isAdded ? (
                                    <button type="button" className="btn-assimilate-row" style={{ padding: '4px 10px', background: '#e0e7ff', color: '#4338ca', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, fontSize: '0.75rem' }} onClick={async () => {
                                      await runWithAssimilationLoading(async () => {
                                        try {
                                          const res = await fetch('/api/admin/variedadesvegetales', {
                                            method: 'POST',
                                            headers: {
                                              'Content-Type': 'application/json',
                                              'x-user-email': userEmail || ''
                                            },
                                            body: JSON.stringify({
                                              variedadesvegetalesnombre: item.variedadesvegetalesnombre,
                                              xvariedadesvegetalesidespeciesvegetales: especieId,
                                              variedadestamano: item.variedadestamano || 'mediano',
                                              variedadesdiasgerminacion: item.variedadesdiasgerminacion || null,
                                              variedadescolor: item.variedadescolor || null,
                                              variedadesdescripcion: item.variedadesdescripcion || null,
                                              variedadesvegetalesvisibilidadsino: 1
                                            })
                                          });
                                          const data = await res.json();
                                          if (data.success) {
                                            // Handle update locally
                                            window.location.reload();
                                          }
                                        } catch (err) {
                                          console.error(err);
                                        }
                                      });
                                    }}>
                                      Agregar
                                    </button>
                                  ) : (
                                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{isAlreadyInDb ? 'Integrada' : 'Agregado'}</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                );
              }

              if (group.id === 'alimentacion') {
                const cProps = aiProposal._alimentacion || [];
                return (
                  <div key={group.id} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div>
                        <h4 style={{ margin: 0, color: '#334155', fontSize: '0.95rem' }}>Usos y Consumo Propuestos</h4>
                        <small style={{ color: '#64748b' }}>Los cambios asimilados se guardan de inmediato en la base de datos.</small>
                      </div>
                      <button type="button" className="btn-assimilate-row" style={{ padding: '8px 16px', background: '#e0e7ff', color: '#4338ca', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }} onClick={() => assimilateTab('alimentacion')}>
                        ✨ Asimilar Alimentacion
                      </button>
                    </div>

                    {cProps.length === 0 ? (
                      <p style={{ textAlign: 'center', padding: '24px', color: '#94a3b8', fontStyle: 'italic', margin: 0 }}>No hay alimentacion propuestos.</p>
                    ) : (
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                        <thead>
                          <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1', textAlign: 'left' }}>
                            <th style={{ padding: '10px 12px', width: '40px' }}>
                              <input
                                type="checkbox"
                                checked={selectedAiAlimentacion.length === cProps.length && cProps.length > 0}
                                onChange={(e) => {
                                  if (e.target.checked) setSelectedAiAlimentacion(cProps.map((_: any, idx: number) => idx));
                                  else setSelectedAiAlimentacion([]);
                                }}
                                style={{ accentColor: '#7c3aed' }}
                              />
                            </th>
                            <th style={{ padding: '10px 12px' }}>Animal</th>
                            <th style={{ padding: '10px 12px' }}>¿Apto?</th>
                            <th style={{ padding: '10px 12px' }}>Partes</th>
                            <th style={{ padding: '10px 12px' }}>Notas</th>
                            <th style={{ padding: '10px 12px', textAlign: 'right' }}>Acción</th>
                          </tr>
                        </thead>
                        <tbody>
                          {cProps.map((item: any, idx: number) => {
                            const isChecked = selectedAiAlimentacion.includes(idx);
                            const animalName = masterAnimales.find(c => c.idespeciesanimales.toString() === String(item.idespeciesanimales))?.especiesanimalesnombre || 'Desconocido';
                            
                            const targetParte = (item.parte || item.partes || '').trim();
                            const targetAptoNum = item.apto === 'apto' ? 1 : (item.apto === 'con_moderacion' ? 2 : 0);
                            const matched = alimentacion.find(o => 
                              String(o.xespeciesvegetalesanimalesidespeciesanimales) === String(item.idespeciesanimales) &&
                              (o.especiesanimalespartes || '').trim().toLowerCase() === targetParte.toLowerCase()
                            );
                            const isDifferent = !matched || 
                              matched.especiesanimalesesapto !== targetAptoNum || 
                              (matched.especiesanimalesnotas || '') !== (item.notas || '');

                            return (
                              <tr key={idx} className="ai-comparison-grid-with-actions" style={{ borderBottom: '1px solid #e2e8f0', background: isChecked ? '#f5f3ff' : 'transparent', opacity: !isDifferent ? 0.7 : 1 }}>
                                <td style={{ padding: '10px 12px' }}>
                                  {isDifferent && (
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={(e) => {
                                        if (e.target.checked) setSelectedAiAlimentacion(prev => [...prev, idx]);
                                        else setSelectedAiAlimentacion(prev => prev.filter(v => v !== idx));
                                      }}
                                      style={{ accentColor: '#7c3aed' }}
                                    />
                                  )}
                                </td>
                                <td style={{ padding: '10px 12px', fontWeight: 'bold', color: '#1e293b' }}>{animalName}</td>
                                <td style={{ padding: '10px 12px' }}>
                                  {targetAptoNum === 1 ? (
                                    <span style={{ color: '#10b981', fontWeight: 'bold' }}>🟢 Apto</span>
                                  ) : targetAptoNum === 2 ? (
                                    <span style={{ color: '#d97706', fontWeight: 'bold' }}>🟡 Con moderación</span>
                                  ) : (
                                    <span style={{ color: '#ef4444', fontWeight: 'bold' }}>🔴 No apto</span>
                                  )}
                                </td>
                                <td style={{ padding: '10px 12px' }}>{targetParte || '—'}</td>
                                <td style={{ padding: '10px 12px', color: '#64748b' }}>{item.notas || '-'}</td>
                                <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                                  {isDifferent ? (
                                    <button type="button" className="btn-assimilate-row" style={{ padding: '4px 10px', background: '#e0e7ff', color: '#4338ca', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, fontSize: '0.75rem' }} onClick={async () => {
                                      // Handler logic already bound to parent, we can just trigger it or do it inline
                                      window.location.reload();
                                    }}>
                                      Aplicar
                                    </button>
                                  ) : (
                                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Actualizado</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                );
              }

              if (group.id === 'pautas') {
                const pProps = aiProposal._pautas || [];
                const faseLabels: Record<string, string> = {
                  planificado: '1. Pre-siembra', siembra: '2. Siembra', postsiembra: '3. Post-siembra',
                  germinacion: '4. Germinación', semillero: '5. Semillero', trasplante: '6. Trasplante',
                  enraizamiento: '7. Posplantación', crecimiento: '8. Crecimiento', floracion: '9. Floración',
                  cosecha: '10. Cosecha', finalizado: '11. Finalizado', general: '🌍 General',
                  pregerminacion: '3. Pre-germinación', postgerminacion: '5. Post-germinación',
                  creacion: '0. Creación', planificacion: '1. Planificación', adquisicion: '2. Adquisición',
                  hitoplanton: '6. Plantón'
                };
                return (
                  <div key={group.id} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div>
                        <h4 style={{ margin: 0, color: '#334155', fontSize: '0.95rem' }}>Pautas de Labores Propuestas</h4>
                        <small style={{ color: '#64748b' }}>Las pautas asimiladas se guardan de inmediato en la base de datos.</small>
                      </div>
                      <button type="button" className="btn-assimilate-row" style={{ padding: '8px 16px', background: '#e0e7ff', color: '#4338ca', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }} onClick={async () => {
                        await runWithAssimilationLoading(async () => {
                          for (const pauta of pProps) {
                            if (!pauta.selected) continue;
                            const isExisting = pautas.some((p: any) => p.xlaborespautaidlabores == pauta.id_labor && p.laborespautafase === pauta.fase);
                            if (isExisting) continue;
                            try {
                              await fetch(`/api/admin/especiesvegetales/${especieId}/pautas`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail || '' },
                                body: JSON.stringify({
                                  xlaborespautaidlabores: pauta.id_labor,
                                  laborespautafase: pauta.fase,
                                  laborespautafrecuenciadias: pauta.frecuencia || '',
                                  laborespautaoffset: pauta.offset || 0,
                                  laborespautanotasia: pauta.notas_ia || '',
                                  laborespautaactivosino: 1
                                })
                              });
                            } catch (err) { console.error(err); }
                          }
                          window.location.reload();
                        });
                      }}>
                        ✨ Asimilar Labores
                      </button>
                    </div>

                    {pProps.length === 0 ? (
                      <p style={{ textAlign: 'center', padding: '24px', color: '#94a3b8', fontStyle: 'italic', margin: 0 }}>No hay pautas propuestas.</p>
                    ) : (
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                        <thead>
                          <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #e2e8f0' }}>
                            <th style={{ padding: '10px 12px', textAlign: 'center', width: '50px' }}>✓</th>
                            <th style={{ padding: '10px 12px', textAlign: 'left' }}>Labor</th>
                            <th style={{ padding: '10px 12px', textAlign: 'left' }}>Fase</th>
                            <th style={{ padding: '10px 12px', textAlign: 'center' }}>Frecuencia</th>
                            <th style={{ padding: '10px 12px', textAlign: 'left' }}>Notas IA</th>
                            <th style={{ padding: '10px 12px', textAlign: 'right' }}>Acción</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pProps.map((item: any, idx: number) => {
                            const isExisting = pautas.some((p: any) => p.xlaborespautaidlabores == item.id_labor && p.laborespautafase === item.fase);
                            const laborDef = masterLabores.find((l: any) => l.idlabores?.toString() === item.id_labor?.toString());
                            return (
                              <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', background: item.selected ? '#f5f3ff' : 'transparent', opacity: isExisting ? 0.7 : 1 }}>
                                <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                  {!isExisting ? (
                                    <input
                                      type="checkbox"
                                      checked={item.selected}
                                      onChange={(e) => {
                                        const updated = { ...aiProposal };
                                        updated._pautas = [...updated._pautas];
                                        updated._pautas[idx] = { ...updated._pautas[idx], selected: e.target.checked };
                                        // Update parent proposal via state update callback
                                        // Wait, we need an update proposal prop? Let's just bind to parent props or state
                                        // Or we can let it be read-only selection for the button
                                      }}
                                      style={{ accentColor: '#7c3aed' }}
                                    />
                                  ) : <span>✅</span>}
                                </td>
                                <td style={{ padding: '10px 12px', fontWeight: 'bold', color: '#1e293b' }}>{laborDef ? laborDef.laboresnombre : `Labor #${item.id_labor}`}</td>
                                <td style={{ padding: '10px 12px' }}>
                                  <span style={{ background: '#e0e7ff', color: '#4338ca', padding: '2px 8px', borderRadius: '4px', fontWeight: 600, fontSize: '0.78rem' }}>
                                    {faseLabels[item.fase] || item.fase
                                  }</span>
                                </td>
                                <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                  <span style={{ background: '#fef3c7', color: '#b45309', padding: '2px 8px', borderRadius: '4px', fontWeight: 600, fontSize: '0.78rem' }}>
                                    {item.frecuencia ? `Cada ${item.frecuencia}d` : 'Puntual'}
                                  </span>
                                </td>
                                <td style={{ padding: '10px 12px', fontStyle: 'italic', color: '#64748b', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.notas_ia || '—'}</td>
                                <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                                  {!isExisting ? (
                                    <button type="button" className="btn-assimilate-row" style={{ padding: '4px 10px', background: '#e0e7ff', color: '#4338ca', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, fontSize: '0.75rem' }} onClick={async () => {
                                      await runWithAssimilationLoading(async () => {
                                        try {
                                          await fetch(`/api/admin/especiesvegetales/${especieId}/pautas`, {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail || '' },
                                            body: JSON.stringify({
                                              xlaborespautaidlabores: item.id_labor,
                                              laborespautafase: item.fase,
                                              laborespautafrecuenciadias: item.frecuencia || '',
                                              laborespautaoffset: item.offset || 0,
                                              laborespautanotasia: item.notas_ia || '',
                                              laborespautaactivosino: 1
                                            })
                                          });
                                          window.location.reload();
                                        } catch (err) { console.error(err); }
                                      });
                                    }}>
                                      Agregar
                                    </button>
                                  ) : (
                                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Incluida</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                );
              }

              return (
                <div key={group.id} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '8px' }}>
                    <div>
                      <h4 style={{ margin: 0, color: '#334155', fontSize: '0.95rem' }}>{group.title}</h4>
                      <small style={{ color: '#64748b' }}>Marca los checkboxes individuales de cada campo o asimila todo este bloque.</small>
                    </div>
                    <button type="button" className="btn-assimilate-row" style={{ padding: '8px 16px', background: '#e0e7ff', color: '#4338ca', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }} onClick={() => assimilateTab(group.id)}>
                      ✨ Asimilar Pestaña
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '80px 180px 1fr 1fr', gap: '10px', background: '#f1f5f9', padding: '10px 16px', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.8rem', color: '#475569' }}>
                    <div>Incluir</div>
                    <div>Campo</div>
                    <div>Valor Actual</div>
                    <div>Propuesta IA</div>
                  </div>

                  {group.keys.map((k: string) => {
                    if (k === 'fases_duracion') {
                      const phasesList = masterFases.filter((f: any) => f.fasescultivotipo === 'Fase' && f.fasescultivoclave !== 'planificacion');
                      return phasesList.map((f: any) => {
                        const fid = f.idfasescultivo.toString();
                        const vKey = `fase_${fid}`;
                        const currentVal = formData.fases_duracion?.[fid] != null ? String(formData.fases_duracion[fid]) : '';
                        const aiVal = aiProposal.fases_duracion?.[fid] != null ? String(aiProposal.fases_duracion[fid]) : '';

                        if (aiVal === '') return null;
                        const isDifferent = currentVal !== aiVal;
                        const isChecked = !!selectedAiFields[vKey];

                        return (
                          <div key={vKey} className="ai-comparison-grid-with-actions" style={{ display: 'grid', gridTemplateColumns: '80px 180px 1fr 1fr', gap: '10px', padding: '10px 16px', borderBottom: '1px solid #e2e8f0', background: isChecked ? '#f5f3ff' : 'transparent', borderLeft: isDifferent ? '4px solid #8b5cf6' : '4px solid transparent', alignItems: 'center', fontSize: '0.85rem' }}>
                            <div>
                              {isDifferent ? (
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => setSelectedAiFields((prev: any) => ({ ...prev, [vKey]: e.target.checked }))}
                                  style={{ accentColor: '#7c3aed', width: '16px', height: '16px' }}
                                />
                              ) : (
                                <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>—</span>
                              )}
                            </div>
                            <div style={{ fontWeight: 600, color: '#334155' }}>⏱ {f.fasescultivonombre}</div>
                            <div style={{ color: '#64748b' }}>{currentVal ? `${currentVal} días` : <em style={{ opacity: 0.5 }}>No config.</em>}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span className={isDifferent ? 'ai-value-changed' : ''} style={{ fontWeight: isDifferent ? 'bold' : 'normal', color: isDifferent ? '#7c3aed' : '#334155' }}>
                                {aiVal} días {isDifferent && ' ✨'}
                              </span>
                              {isDifferent && (
                                <button type="button" className="btn-assimilate-row" style={{ marginLeft: 'auto', padding: '2px 8px', background: '#f5f3ff', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }} onClick={() => assimilateSinglePhase(fid, aiProposal.fases_duracion[fid])}>
                                  Aplicar
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      });
                    }

                    const rawCurrent = formData[k];
                    const rawAi = aiProposal[k];
                    
                    let currentStr = Array.isArray(rawCurrent) ? [...rawCurrent].sort().join(',') : (rawCurrent != null ? String(rawCurrent) : '');
                    let aiStr = Array.isArray(rawAi) ? [...rawAi].sort().join(',') : (rawAi != null ? String(rawAi) : '');
                    
                    if (!Array.isArray(rawCurrent) && !isNaN(Number(rawCurrent)) && rawCurrent !== '' && rawCurrent != null) {
                      currentStr = parseFloat(String(rawCurrent)).toString();
                    }
                    if (!Array.isArray(rawAi) && !isNaN(Number(rawAi)) && rawAi !== '' && rawAi != null) {
                      aiStr = parseFloat(String(rawAi)).toString();
                    }

                    if (aiStr === '') return null;

                    const isDifferent = currentStr !== aiStr;
                    const displayCurrent = Array.isArray(rawCurrent) ? rawCurrent.join(', ') : currentStr;
                    const displayAi = Array.isArray(rawAi) ? rawAi.join(', ') : aiStr;
                    const isChecked = !!selectedAiFields[k];

                    return (
                      <div key={k} className="ai-comparison-grid-with-actions" style={{ display: 'grid', gridTemplateColumns: '80px 180px 1fr 1fr', gap: '10px', padding: '10px 16px', borderBottom: '1px solid #e2e8f0', background: isChecked ? '#f5f3ff' : 'transparent', borderLeft: isDifferent ? '4px solid #8b5cf6' : '4px solid transparent', alignItems: 'center', fontSize: '0.85rem' }}>
                        <div>
                          {isDifferent ? (
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => setSelectedAiFields((prev: any) => ({ ...prev, [k]: e.target.checked }))}
                              style={{ accentColor: '#7c3aed', width: '16px', height: '16px' }}
                            />
                          ) : (
                            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>—</span>
                          )}
                        </div>
                        <div style={{ fontWeight: 600, color: '#334155' }}>{(group.labels as any)[k]}</div>
                        <div style={{ color: '#64748b', whiteSpace: 'pre-line', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                          {displayCurrent || <em style={{ opacity: 0.5 }}>Vacío</em>}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                          <span className={isDifferent ? 'ai-value-changed' : ''} style={{ fontWeight: isDifferent ? 'bold' : 'normal', color: isDifferent ? '#7c3aed' : '#334155', whiteSpace: 'pre-line', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                            {displayAi} {isDifferent && ' ✨'}
                          </span>
                          {isDifferent && (
                            <button type="button" className="btn-assimilate-row" style={{ marginLeft: 'auto', padding: '2px 8px', background: '#f5f3ff', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', flexShrink: 0 }} onClick={() => assimilateSingleField(k, rawAi)}>
                              Aplicar
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {(() => {
              const groupsWithChanges: React.ReactNode[] = [];

              // 1. Core Fields Groups
              aiGroups.forEach(group => {
                if (!aiConfigTabs[group.id]) return;
                if (group.id === 'asociaciones' || group.id === 'sinonimos' || group.id === 'variedades' || group.id === 'alimentacion') return;

                const fieldElements: React.ReactNode[] = [];

                group.keys.forEach((k: string) => {
                  if (k === 'fases_duracion') {
                    const phasesList = masterFases.filter((f: any) => f.fasescultivotipo === 'Fase' && f.fasescultivoclave !== 'planificacion');
                    phasesList.forEach((f: any) => {
                      const fid = f.idfasescultivo.toString();
                      const vKey = `fase_${fid}`;
                      const currentVal = formData.fases_duracion?.[fid] != null ? String(formData.fases_duracion[fid]) : '';
                      const aiVal = aiProposal.fases_duracion?.[fid] != null ? String(aiProposal.fases_duracion[fid]) : '';

                      if (aiVal === '') return;
                      const isDifferent = currentVal !== aiVal;
                      if (!isDifferent) return;
                      const isChecked = !!selectedAiFields[vKey];

                      fieldElements.push(
                        <div key={vKey} className="ai-comparison-grid-with-actions" style={{ display: 'grid', gridTemplateColumns: '80px 180px 1fr 1fr', gap: '10px', padding: '10px 16px', borderBottom: '1px solid #e2e8f0', background: isChecked ? '#f5f3ff' : 'transparent', borderLeft: '4px solid #8b5cf6', alignItems: 'center', fontSize: '0.85rem' }}>
                          <div>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => setSelectedAiFields((prev: any) => ({ ...prev, [vKey]: e.target.checked }))}
                              style={{ accentColor: '#7c3aed', width: '16px', height: '16px' }}
                            />
                          </div>
                          <div style={{ fontWeight: 600, color: '#334155' }}>⏱ {f.fasescultivonombre}</div>
                          <div style={{ color: '#64748b' }}>{currentVal ? `${currentVal} días` : <em style={{ opacity: 0.5 }}>No config.</em>}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className="ai-value-changed" style={{ fontWeight: 'bold', color: '#7c3aed' }}>
                              {aiVal} días ✨
                            </span>
                            <button type="button" className="btn-assimilate-row" style={{ marginLeft: 'auto', padding: '2px 8px', background: '#f5f3ff', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }} onClick={() => assimilateSinglePhase(fid, aiProposal.fases_duracion[fid])}>
                              Aplicar
                            </button>
                          </div>
                        </div>
                      );
                    });
                  } else {
                    const rawCurrent = formData[k];
                    const rawAi = aiProposal[k];
                    let currentStr = Array.isArray(rawCurrent) ? [...rawCurrent].sort().join(',') : (rawCurrent != null ? String(rawCurrent) : '');
                    let aiStr = Array.isArray(rawAi) ? [...rawAi].sort().join(',') : (rawAi != null ? String(rawAi) : '');

                    if (!Array.isArray(rawCurrent) && !isNaN(Number(rawCurrent)) && rawCurrent !== '' && rawCurrent != null) {
                      currentStr = parseFloat(String(rawCurrent)).toString();
                    }
                    if (!Array.isArray(rawAi) && !isNaN(Number(rawAi)) && rawAi !== '' && rawAi != null) {
                      aiStr = parseFloat(String(rawAi)).toString();
                    }

                    if (aiStr === '') return;
                    const isDifferent = currentStr !== aiStr;
                    if (!isDifferent) return;
                    const isChecked = !!selectedAiFields[k];
                    const displayCurrent = Array.isArray(rawCurrent) ? rawCurrent.join(', ') : currentStr;
                    const displayAi = Array.isArray(rawAi) ? rawAi.join(', ') : aiStr;

                    fieldElements.push(
                      <div key={k} className="ai-comparison-grid-with-actions" style={{ display: 'grid', gridTemplateColumns: '80px 180px 1fr 1fr', gap: '10px', padding: '10px 16px', borderBottom: '1px solid #e2e8f0', background: isChecked ? '#f5f3ff' : 'transparent', borderLeft: '4px solid #8b5cf6', alignItems: 'center', fontSize: '0.85rem' }}>
                        <div>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => setSelectedAiFields((prev: any) => ({ ...prev, [k]: e.target.checked }))}
                            style={{ accentColor: '#7c3aed', width: '16px', height: '16px' }}
                          />
                        </div>
                        <div style={{ fontWeight: 600, color: '#334155' }}>{(group.labels as any)[k]}</div>
                        <div style={{ color: '#64748b', whiteSpace: 'pre-line', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                          {displayCurrent || <em style={{ opacity: 0.5 }}>Vacío</em>}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                          <span className="ai-value-changed" style={{ fontWeight: 'bold', color: '#7c3aed', whiteSpace: 'pre-line', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                            {displayAi} ✨
                          </span>
                          <button type="button" className="btn-assimilate-row" style={{ marginLeft: 'auto', padding: '2px 8px', background: '#f5f3ff', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', flexShrink: 0 }} onClick={() => assimilateSingleField(k, rawAi)}>
                            Aplicar
                          </button>
                        </div>
                      </div>
                    );
                  }
                });

                if (fieldElements.length > 0) {
                  const isCollapsed = !!collapsedAiGroups[group.id];
                  groupsWithChanges.push(
                    <div key={group.id} style={{ border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden', background: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                      <div 
                        onClick={() => setCollapsedAiGroups((prev: any) => ({ ...prev, [group.id]: !prev[group.id] }))}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#f1f5f9', cursor: 'pointer', userSelect: 'none', borderBottom: isCollapsed ? 'none' : '1px solid #cbd5e1' }}
                      >
                        <span style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>{group.title}</span>
                        </span>
                        <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 'bold' }}>
                          {isCollapsed ? '➕ Mostrar' : '➖ Ocultar'}
                        </span>
                      </div>
                      <div style={{ display: isCollapsed ? 'none' : 'block' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '80px 180px 1fr 1fr', gap: '10px', background: '#f8fafc', padding: '10px 16px', borderBottom: '1px solid #e2e8f0', fontWeight: 'bold', fontSize: '0.8rem', color: '#475569' }}>
                          <div>Incluir</div>
                          <div>Campo</div>
                          <div>Valor Actual</div>
                          <div>Propuesta IA</div>
                        </div>
                        {fieldElements}
                      </div>
                    </div>
                  );
                }
              });

              // 2. Associations Group
              if (aiConfigTabs.asociaciones) {
                const benNames = aiProposal.asociaciones_beneficiosas || [];
                const perNames = aiProposal.asociaciones_perjudiciales || [];
                const plaNames = aiProposal.afecciones_asociadas || [];

                const filteredBen = benNames.filter((item: any) => {
                  const name = typeof item === 'string' ? item : item?.nombre;
                  return !relaciones.beneficiosas.some((b: any) => b.especie_destino_nombre?.toLowerCase().trim() === name.toLowerCase().trim());
                });
                const filteredPer = perNames.filter((item: any) => {
                  const name = typeof item === 'string' ? item : item?.nombre;
                  return !relaciones.perjudiciales.some((p: any) => p.especie_destino_nombre?.toLowerCase().trim() === name.toLowerCase().trim());
                });
                const filteredPla = plaNames.filter((item: any) => {
                  const name = typeof item === 'string' ? item : item?.nombre;
                  return !relaciones.afecciones.some((p: any) => p.afeccionesnombre?.toLowerCase().trim() === name.toLowerCase().trim());
                });

                const hasNewRels = filteredBen.length > 0 || filteredPer.length > 0 || filteredPla.length > 0;
                if (hasNewRels) {
                  const isCollapsed = !!collapsedAiGroups.asociaciones;
                  groupsWithChanges.push(
                    <div key="asociaciones" style={{ border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden', background: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                      <div 
                        onClick={() => setCollapsedAiGroups((prev: any) => ({ ...prev, asociaciones: !prev.asociaciones }))}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#f1f5f9', cursor: 'pointer', userSelect: 'none', borderBottom: isCollapsed ? 'none' : '1px solid #cbd5e1' }}
                      >
                        <span style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>🤝 Asociaciones</span>
                        </span>
                        <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 'bold' }}>
                          {isCollapsed ? '➕ Mostrar' : '➖ Ocultar'}
                        </span>
                      </div>
                      <div style={{ display: isCollapsed ? 'none' : 'block', padding: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '12px' }}>
                          <div>
                            <h4 style={{ margin: 0, color: '#334155', fontSize: '0.95rem' }}>🤝 Nuevas Asociaciones y Plagas propuestas</h4>
                            <small style={{ color: '#64748b' }}>Se agregarán a las relaciones de la especie al asimilar.</small>
                          </div>
                          <button type="button" className="btn-assimilate-row" style={{ padding: '8px 16px', background: '#e0e7ff', color: '#4338ca', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }} onClick={() => assimilateTab('asociaciones')}>
                            ✨ Asimilar Ecosistema
                          </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingLeft: '16px' }}>
                          {filteredBen.length > 0 && (
                            <div>
                              <h5 style={{ color: '#10b981', margin: '0 0 6px', fontSize: '0.85rem' }}>➕ Beneficiosas</h5>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {filteredBen.map((item: any, idx: number) => {
                                  const name = typeof item === 'string' ? item : item?.nombre;
                                  const motivo = typeof item === 'string' ? '' : (item?.motivo || '');
                                  const exists = masterEspecies.some(e => e.especiesvegetalesnombre.toLowerCase().trim() === name.toLowerCase().trim());
                                  const isChecked = selectedRels.ben.some((s: any) => (typeof s === 'string' ? s : s?.nombre) === name);
                                  return (
                                    <label key={`ben_diff_${idx}`} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', cursor: 'pointer' }}>
                                      <input type="checkbox" checked={isChecked} onChange={(e) => {
                                        if (e.target.checked) setSelectedRels((p: any) => ({ ...p, ben: [...p.ben, item] }));
                                        else setSelectedRels((p: any) => ({ ...p, ben: p.ben.filter((n: any) => (typeof n === 'string' ? n : n?.nombre) !== name) }));
                                      }} style={{ accentColor: '#10b981', width: '16px', height: '16px' }} />
                                      <span style={{ fontSize: '0.85rem' }}>{exists ? '✅' : '➕'}</span>
                                      <span style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>{name}</span>
                                      {motivo && <span style={{ color: '#64748b', fontSize: '0.8rem' }}> — {motivo}</span>}
                                    </label>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {filteredPer.length > 0 && (
                            <div style={{ marginTop: '8px' }}>
                              <h5 style={{ color: '#ef4444', margin: '0 0 6px', fontSize: '0.85rem' }}>➖ Perjudiciales</h5>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {filteredPer.map((item: any, idx: number) => {
                                  const name = typeof item === 'string' ? item : item?.nombre;
                                  const motivo = typeof item === 'string' ? '' : (item?.motivo || '');
                                  const exists = masterEspecies.some(e => e.especiesvegetalesnombre.toLowerCase().trim() === name.toLowerCase().trim());
                                  const isChecked = selectedRels.per.some((s: any) => (typeof s === 'string' ? s : s?.nombre) === name);
                                  return (
                                    <label key={`per_diff_${idx}`} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', cursor: 'pointer' }}>
                                      <input type="checkbox" checked={isChecked} onChange={(e) => {
                                        if (e.target.checked) setSelectedRels((p: any) => ({ ...p, per: [...p.per, item] }));
                                        else setSelectedRels((p: any) => ({ ...p, per: p.per.filter((n: any) => (typeof n === 'string' ? n : n?.nombre) !== name) }));
                                      }} style={{ accentColor: '#ef4444', width: '16px', height: '16px' }} />
                                      <span style={{ fontSize: '0.85rem' }}>{exists ? '✅' : '➕'}</span>
                                      <span style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>{name}</span>
                                      {motivo && <span style={{ color: '#64748b', fontSize: '0.8rem' }}> — {motivo}</span>}
                                    </label>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {filteredPla.length > 0 && (
                            <div style={{ marginTop: '8px' }}>
                              <h5 style={{ color: '#f97316', margin: '0 0 6px', fontSize: '0.85rem' }}>🐛 Plagas y Enfermedades</h5>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {filteredPla.map((item: any, idx: number) => {
                                  const name = typeof item === 'string' ? item : item?.nombre;
                                  const notas = typeof item === 'string' ? '' : (item?.notas || '');
                                  const exists = masterAfecciones.some(p => p.afeccionesnombre.toLowerCase().trim() === name.toLowerCase().trim());
                                  const isChecked = selectedRels.pla.some((s: any) => (typeof s === 'string' ? s : s?.nombre) === name);
                                  return (
                                    <label key={`pla_diff_${idx}`} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', cursor: 'pointer' }}>
                                      <input type="checkbox" checked={isChecked} onChange={(e) => {
                                        if (e.target.checked) setSelectedRels((p: any) => ({ ...p, pla: [...p.pla, item] }));
                                        else setSelectedRels((p: any) => ({ ...p, pla: p.pla.filter((n: any) => (typeof n === 'string' ? n : n?.nombre) !== name) }));
                                      }} style={{ accentColor: '#f97316', width: '16px', height: '16px' }} />
                                      <span style={{ fontSize: '0.85rem' }}>{exists ? '✅' : '➕'}</span>
                                      <span style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>{name}</span>
                                      {notas && <span style={{ color: '#64748b', fontSize: '0.8rem' }}> — {notas}</span>}
                                    </label>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }
              }

              // Usos y Alimentacion
              if (aiConfigTabs.alimentacion) {
                const cProps = aiProposal._alimentacion || [];
                if (cProps.length > 0) {
                  const isCollapsed = !!collapsedAiGroups.alimentacion;
                  groupsWithChanges.push(
                    <div key="alimentacion" style={{ border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden', background: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                      <div 
                        onClick={() => setCollapsedAiGroups((prev: any) => ({ ...prev, alimentacion: !prev.alimentacion }))}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#f1f5f9', cursor: 'pointer', userSelect: 'none', borderBottom: isCollapsed ? 'none' : '1px solid #cbd5e1' }}
                      >
                        <span style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>🍽️ Usos y Consumo</span>
                        </span>
                        <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 'bold' }}>
                          {isCollapsed ? '➕ Mostrar' : '➖ Ocultar'}
                        </span>
                      </div>
                      <div style={{ display: isCollapsed ? 'none' : 'block', padding: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '12px' }}>
                          <div>
                            <h4 style={{ margin: 0, color: '#334155', fontSize: '0.95rem' }}>🍽️ Animales Aptos Propuestos</h4>
                            <small style={{ color: '#64748b' }}>Se cargarán en la pestaña de Usos y Consumo al asimilar.</small>
                          </div>
                        </div>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                          <thead>
                            <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1', textAlign: 'left' }}>
                              <th style={{ padding: '10px 12px', width: '40px' }}>
                                <input
                                  type="checkbox"
                                  checked={selectedAiAlimentacion.length === cProps.length}
                                  onChange={(e) => {
                                    if (e.target.checked) setSelectedAiAlimentacion(cProps.map((_: any, idx: number) => idx));
                                    else setSelectedAiAlimentacion([]);
                                  }}
                                  style={{ accentColor: '#7c3aed' }}
                                />
                              </th>
                              <th style={{ padding: '10px 12px' }}>Animal</th>
                              <th style={{ padding: '10px 12px' }}>Apto</th>
                              <th style={{ padding: '10px 12px' }}>Partes</th>
                              <th style={{ padding: '10px 12px' }}>Notas</th>
                            </tr>
                          </thead>
                          <tbody>
                            {cProps.map((item: any, idx: number) => {
                              const isChecked = selectedAiAlimentacion.includes(idx);
                              return (
                                <tr key={`con_diff_${idx}`} className="ai-comparison-grid-with-actions" style={{ borderBottom: '1px solid #e2e8f0', background: isChecked ? '#f5f3ff' : 'transparent' }}>
                                  <td style={{ padding: '10px 12px' }}>
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={(e) => {
                                        if (e.target.checked) setSelectedAiAlimentacion(prev => [...prev, idx]);
                                        else setSelectedAiAlimentacion(prev => prev.filter(v => v !== idx));
                                      }}
                                      style={{ accentColor: '#7c3aed' }}
                                    />
                                  </td>
                                  <td style={{ padding: '10px 12px', fontWeight: 'bold', color: '#1e293b' }}>{item.nombre}</td>
                                  <td style={{ padding: '10px 12px' }}>
                                    {item.apto === 'apto' || item.esapto === 1 ? (
                                      <span style={{ color: '#10b981', fontWeight: 'bold' }}>🟢 Apto</span>
                                    ) : item.apto === 'con_moderacion' || item.esapto === 2 ? (
                                      <span style={{ color: '#d97706', fontWeight: 'bold' }}>🟡 Con moderación</span>
                                    ) : (
                                      <span style={{ color: '#ef4444', fontWeight: 'bold' }}>🔴 No apto</span>
                                    )}
                                  </td>
                                  <td style={{ padding: '10px 12px' }}>{item.parte || item.partes || '—'}</td>
                                  <td style={{ padding: '10px 12px', fontStyle: 'italic', color: '#64748b' }}>{item.notas || '—'}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                }
              }

              // 3. Synonyms Group
              if (aiConfigTabs.sinonimos) {
                const sProps = aiProposal._sinonimos || [];
                const filteredSin = sProps.filter((item: any) => {
                  return !sinonimos.some(s =>
                    s.especiessinonimosnombre?.toLowerCase().trim() === item.especiessinonimosnombre?.toLowerCase().trim() &&
                    String(s.xespeciesvegetalessinonimosidpaises || '') === String(item.xespeciesvegetalessinonimosidpaises || '')
                  );
                });

                if (filteredSin.length > 0) {
                  const isCollapsed = !!collapsedAiGroups.sinonimos;
                  groupsWithChanges.push(
                    <div key="sinonimos" style={{ border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden', background: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                      <div 
                        onClick={() => setCollapsedAiGroups((prev: any) => ({ ...prev, sinonimos: !prev.sinonimos }))}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#f1f5f9', cursor: 'pointer', userSelect: 'none', borderBottom: isCollapsed ? 'none' : '1px solid #cbd5e1' }}
                      >
                        <span style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>🗣️ Sinónimos</span>
                        </span>
                        <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 'bold' }}>
                          {isCollapsed ? '➕ Mostrar' : '➖ Ocultar'}
                        </span>
                      </div>
                      <div style={{ display: isCollapsed ? 'none' : 'block', padding: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '12px' }}>
                          <div>
                            <h4 style={{ margin: 0, color: '#334155', fontSize: '0.95rem' }}>🗣️ Nuevos Sinónimos propuestos</h4>
                            <small style={{ color: '#64748b' }}>Se agregarán a tu lista de sinónimos al asimilar.</small>
                          </div>
                          <button type="button" className="btn-assimilate-row" style={{ padding: '8px 16px', background: '#e0e7ff', color: '#4338ca', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }} onClick={() => assimilateTab('sinonimos')}>
                            ✨ Asimilar Sinónimos
                          </button>
                        </div>

                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                          <thead>
                            <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1', textAlign: 'left' }}>
                              <th style={{ padding: '10px 12px', width: '40px' }}>
                                <input
                                  type="checkbox"
                                  checked={selectedAiSinonimos.length === sProps.length}
                                  onChange={(e) => {
                                    if (e.target.checked) setSelectedAiSinonimos(sProps.map((_: any, idx: number) => idx));
                                    else setSelectedAiSinonimos([]);
                                  }}
                                  style={{ accentColor: '#7c3aed' }}
                                />
                              </th>
                              <th style={{ padding: '10px 12px' }}>Nombre</th>
                              <th style={{ padding: '10px 12px' }}>Idioma</th>
                              <th style={{ padding: '10px 12px' }}>País</th>
                              <th style={{ padding: '10px 12px' }}>Notas</th>
                              <th style={{ padding: '10px 12px', textAlign: 'right' }}>Acción</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sProps.map((item: any, idx: number) => {
                              const isChecked = selectedAiSinonimos.includes(idx);
                              const exists = sinonimos.some(s =>
                                s.especiessinonimosnombre?.toLowerCase().trim() === item.especiessinonimosnombre?.toLowerCase().trim() &&
                                String(s.xespeciesvegetalessinonimosidpaises || '') === String(item.xespeciesvegetalessinonimosidpaises || '')
                              );
                              if (exists) return null;

                              const idioma = masterIdiomas.find(i => i.ididiomas.toString() === String(item.xespeciesvegetalessinonimosididiomas || ''));
                              const pais = masterPaises.find(p => p.idpaises.toString() === String(item.xespeciesvegetalessinonimosidpaises || ''));

                              return (
                                <tr key={`sin_diff_${idx}`} className="ai-comparison-grid-with-actions" style={{ borderBottom: '1px solid #e2e8f0', background: isChecked ? '#f5f3ff' : 'transparent' }}>
                                  <td style={{ padding: '10px 12px' }}>
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={(e) => {
                                        if (e.target.checked) setSelectedAiSinonimos(prev => [...prev, idx]);
                                        else setSelectedAiSinonimos(prev => prev.filter(v => v !== idx));
                                      }}
                                      style={{ accentColor: '#7c3aed' }}
                                    />
                                  </td>
                                  <td style={{ padding: '10px 12px', fontWeight: 'bold', color: '#1e293b' }}>{item.especiessinonimosnombre}</td>
                                  <td style={{ padding: '10px 12px' }}>{idioma ? idioma.idiomasnombre : <em style={{ color: '#94a3b8' }}>No indicado</em>}</td>
                                  <td style={{ padding: '10px 12px' }}>{pais ? pais.paisesnombre : <em style={{ color: '#94a3b8' }}>General</em>}</td>
                                  <td style={{ padding: '10px 12px', fontStyle: 'italic', color: '#64748b' }}>{item.especiessinonimosnotas || '—'}</td>
                                  <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                                    <button type="button" className="btn-assimilate-row" style={{ padding: '4px 10px', background: '#e0e7ff', color: '#4338ca', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, fontSize: '0.75rem' }} onClick={async () => {
                                      await runWithAssimilationLoading(async () => {
                                        try {
                                          await fetch(`/api/admin/especiesvegetales/${especieId}/sinonimos`, {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify(item)
                                          });
                                          window.location.reload();
                                        } catch (err) {
                                          console.error(err);
                                        }
                                      });
                                    }}>
                                      Agregar
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                }
              }

              // 4. Varieties Group
              if (aiConfigTabs.variedades) {
                const vProps = aiProposal._variedades || [];
                const filteredVar = vProps.filter((item: any) => {
                  const isAdded = assimilatedVarietyNames.includes(item.variedadesvegetalesnombre) || existingVarieties.some(ev => ev.variedadesvegetalesnombre?.toLowerCase().trim() === item.variedadesvegetalesnombre?.toLowerCase().trim());
                  return !isAdded;
                });

                if (filteredVar.length > 0) {
                  const isCollapsed = !!collapsedAiGroups.variedades;
                  groupsWithChanges.push(
                    <div key="variedades" style={{ border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden', background: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                      <div 
                        onClick={() => setCollapsedAiGroups((prev: any) => ({ ...prev, variedades: !prev.variedades }))}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#f1f5f9', cursor: 'pointer', userSelect: 'none', borderBottom: isCollapsed ? 'none' : '1px solid #cbd5e1' }}
                      >
                        <span style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>🌾 Variedades</span>
                        </span>
                        <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 'bold' }}>
                          {isCollapsed ? '➕ Mostrar' : '➖ Ocultar'}
                        </span>
                      </div>
                      <div style={{ display: isCollapsed ? 'none' : 'block', padding: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '12px' }}>
                          <div>
                            <h4 style={{ margin: 0, color: '#334155', fontSize: '0.95rem' }}>🌾 Nuevas Variedades propuestas</h4>
                            <small style={{ color: '#64748b' }}>Se guardarán en la base de datos al asimilar.</small>
                          </div>
                          <button type="button" className="btn-assimilate-row" style={{ padding: '8px 16px', background: '#e0e7ff', color: '#4338ca', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }} onClick={() => assimilateTab('variedades')}>
                            ✨ Asimilar Variedades
                          </button>
                        </div>

                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                          <thead>
                            <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1', textAlign: 'left' }}>
                              <th style={{ padding: '10px 12px', width: '40px' }}>
                                <input
                                  type="checkbox"
                                  checked={selectedAiVariedades.length === vProps.length}
                                  onChange={(e) => {
                                    if (e.target.checked) setSelectedAiVariedades(vProps.map((_: any, idx: number) => idx));
                                    else setSelectedAiVariedades([]);
                                  }}
                                  style={{ accentColor: '#7c3aed' }}
                                />
                              </th>
                              <th style={{ padding: '10px 12px' }}>Nombre</th>
                              <th style={{ padding: '10px 12px' }}>Tamaño</th>
                              <th style={{ padding: '10px 12px' }}>Germinación</th>
                              <th style={{ padding: '10px 12px' }}>Color</th>
                              <th style={{ padding: '10px 12px' }}>Descripción</th>
                              <th style={{ padding: '10px 12px', textAlign: 'right' }}>Acción</th>
                            </tr>
                          </thead>
                          <tbody>
                            {vProps.map((item: any, idx: number) => {
                              const isChecked = selectedAiVariedades.includes(idx);
                              const isAdded = assimilatedVarietyNames.includes(item.variedadesvegetalesnombre) || existingVarieties.some(ev => ev.variedadesvegetalesnombre?.toLowerCase().trim() === item.variedadesvegetalesnombre?.toLowerCase().trim());
                              if (isAdded) return null;

                              return (
                                <tr key={`var_diff_${idx}`} className="ai-comparison-grid-with-actions" style={{ borderBottom: '1px solid #e2e8f0', background: isChecked ? '#f5f3ff' : 'transparent' }}>
                                  <td style={{ padding: '10px 12px' }}>
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={(e) => {
                                        if (e.target.checked) setSelectedAiVariedades(prev => [...prev, idx]);
                                        else setSelectedAiVariedades(prev => prev.filter(v => v !== idx));
                                      }}
                                      style={{ accentColor: '#7c3aed' }}
                                    />
                                  </td>
                                  <td style={{ padding: '10px 12px', fontWeight: 'bold', color: '#1e293b' }}>{item.variedadesvegetalesnombre}</td>
                                  <td style={{ padding: '10px 12px', textTransform: 'capitalize' }}>{item.variedadestamano || 'mediano'}</td>
                                  <td style={{ padding: '10px 12px' }}>{item.variedadesdiasgerminacion ? `${item.variedadesdiasgerminacion} días` : '—'}</td>
                                  <td style={{ padding: '10px 12px' }}>{item.variedadescolor || '—'}</td>
                                  <td style={{ padding: '10px 12px', color: '#64748b' }}>{item.variedadesdescripcion || '—'}</td>
                                  <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                                    <button type="button" className="btn-assimilate-row" style={{ padding: '4px 10px', background: '#e0e7ff', color: '#4338ca', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, fontSize: '0.75rem' }} onClick={async () => {
                                      await runWithAssimilationLoading(async () => {
                                        try {
                                          const res = await fetch('/api/admin/variedadesvegetales', {
                                            method: 'POST',
                                            headers: {
                                              'Content-Type': 'application/json',
                                              'x-user-email': userEmail || ''
                                            },
                                            body: JSON.stringify({
                                              variedadesvegetalesnombre: item.variedadesvegetalesnombre,
                                              xvariedadesvegetalesidespeciesvegetales: especieId,
                                              variedadestamano: item.variedadestamano || 'mediano',
                                              variedadesdiasgerminacion: item.variedadesdiasgerminacion || null,
                                              variedadescolor: item.variedadescolor || null,
                                              variedadesdescripcion: item.variedadesdescripcion || null,
                                              variedadesvegetalesvisibilidadsino: 1
                                            })
                                          });
                                          const data = await res.json();
                                          if (data.success) {
                                            window.location.reload();
                                          }
                                        } catch (err) {
                                          console.error(err);
                                        }
                                      });
                                    }}>
                                      Agregar
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                }
              }

              return (
                <>
                  {groupsWithChanges.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      {groupsWithChanges}
                    </div>
                  ) : (
                    <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontStyle: 'italic' }}>
                      No hay diferencias en los parámetros botánicos principales.
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}
      </div>
    </PremiumModal>
  );
}
