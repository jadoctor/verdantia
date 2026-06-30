import React from 'react';
import PremiumModal from '@/components/ui/PremiumModal';
import PremiumModalHeader from '@/components/ui/PremiumModalHeader';
import PremiumFormTabs from '@/components/ui/PremiumFormTabs';

interface PautaItem {
  idlaborespauta?: number | string | null;
  laborespautafase: string;
  laborespautalabor: string;
  laborespautadetalle: string;
  laborespautafrecuencia: string;
  laborespautatopolaboreo: string;
  laborespautaactivosino: number;
}

interface PautasTabProps {
  especieId: string | null;
  activeTab: string;
  pautas: any[];
  pautasFiltroFase: string;
  setPautasFiltroFase: React.Dispatch<React.SetStateAction<string>>;
  pautasFiltroLabor: string;
  setPautasFiltroLabor: React.Dispatch<React.SetStateAction<string>>;
  pautasFiltroLaboreo: string;
  setPautasFiltroLaboreo: React.Dispatch<React.SetStateAction<string>>;
  editingPauta: any;
  setEditingPauta: React.Dispatch<React.SetStateAction<any>>;
  pautaForm: any;
  setPautaForm: React.Dispatch<React.SetStateAction<any>>;
  showAddPautaForm: boolean;
  setShowAddPautaForm: React.Dispatch<React.SetStateAction<boolean>>;
  pautasAiLoading: boolean;
  setPautasAiLoading: React.Dispatch<React.SetStateAction<boolean>>;
  pautasAiSeconds: number;
  setPautasAiSeconds: React.Dispatch<React.SetStateAction<number>>;
  showPautasAiModal: boolean;
  setShowPautasAiModal: React.Dispatch<React.SetStateAction<boolean>>;
  aiPautasProposal: any;
  setAiPautasProposal: React.Dispatch<React.SetStateAction<any>>;
  showPautasConfig: boolean;
  setShowPautasConfig: React.Dispatch<React.SetStateAction<boolean>>;
  pautasConfigPromptOpen: boolean;
  setPautasConfigPromptOpen: React.Dispatch<React.SetStateAction<boolean>>;
  pautasExtraInstructions: string;
  setPautasExtraInstructions: React.Dispatch<React.SetStateAction<string>>;
  masterFases: any[];
  masterLabores: any[];
  loadPautas: (id: string) => Promise<void>;
  setToastMessage: React.Dispatch<React.SetStateAction<string | null>>;
  isMobile: boolean;
  formData: any;
  userEmail: string | null;
  pautasTimerRef: any;
}

export default function PautasTab({
  especieId,
  activeTab,
  pautas,
  pautasFiltroFase,
  setPautasFiltroFase,
  pautasFiltroLabor,
  setPautasFiltroLabor,
  pautasFiltroLaboreo,
  setPautasFiltroLaboreo,
  editingPauta,
  setEditingPauta,
  pautaForm,
  setPautaForm,
  showAddPautaForm,
  setShowAddPautaForm,
  pautasAiLoading,
  setPautasAiLoading,
  pautasAiSeconds,
  setPautasAiSeconds,
  showPautasAiModal,
  setShowPautasAiModal,
  aiPautasProposal,
  setAiPautasProposal,
  showPautasConfig,
  setShowPautasConfig,
  pautasConfigPromptOpen,
  setPautasConfigPromptOpen,
  pautasExtraInstructions,
  setPautasExtraInstructions,
  masterFases,
  masterLabores,
  loadPautas,
  setToastMessage,
  isMobile,
  formData,
  userEmail,
  pautasTimerRef
}: PautasTabProps) {
  // Manejo de la acción de guardar pauta
  const handleSavePauta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!especieId) return;
    try {
      const isEdit = pautaForm.idlaborespauta !== null;
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(`/api/admin/especiesvegetales/${especieId}/pautas`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pautaForm)
      });
      if (res.ok) {
        loadPautas(especieId);
        setShowAddPautaForm(false);
        setEditingPauta(null);
        setPautaForm({
          laborespautafase: '',
          laborespautalabor: '',
          laborespautadetalle: '',
          laborespautafrecuencia: '',
          laborespautatopolaboreo: '',
          laborespautaactivosino: 1,
          idlaborespauta: null
        });
        setToastMessage(isEdit ? 'Labor de pauta actualizada con éxito.' : 'Nueva labor añadida a la pauta.');
        setTimeout(() => setToastMessage(null), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Asimilación de Pautas IA
  const handleAssimilatePautas = async () => {
    if (!especieId || !aiPautasProposal) return;
    try {
      const pautasToSave = aiPautasProposal.pautas || [];
      const res = await fetch(`/api/admin/especiesvegetales/${especieId}/pautas/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pautas: pautasToSave })
      });
      if (res.ok) {
        loadPautas(especieId);
        setShowPautasAiModal(false);
        setAiPautasProposal(null);
        setToastMessage(`Pauta IA asimilada con éxito (${pautasToSave.length} labores añadidas).`);
        setTimeout(() => setToastMessage(null), 3000);
      }
    } catch (err) {
      console.error('Error asimilando pautas batch:', err);
    }
  };

  // Lanzar Generador de Pautas con IA
  const handleTriggerPautasAi = async () => {
    if (!especieId) return;
    setPautasAiLoading(true);
    setPautasAiSeconds(0);
    setShowPautasAiModal(true);
    setAiPautasProposal(null);

    if (pautasTimerRef.current) clearInterval(pautasTimerRef.current);
    pautasTimerRef.current = setInterval(() => {
      setPautasAiSeconds((prev: number) => prev + 1);
    }, 1000);

    try {
      const res = await fetch(`/api/admin/especiesvegetales/${especieId}/pautas/generar-ia`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': userEmail || ''
        },
        body: JSON.stringify({
          nombreComun: formData.especiesvegetalesnombre,
          nombreCientifico: formData.especiesvegetalesnombrecientifico,
          instrucciones: pautasExtraInstructions
        })
      });
      if (res.ok) {
        const data = await res.json();
        setAiPautasProposal(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPautasAiLoading(false);
      if (pautasTimerRef.current) {
        clearInterval(pautasTimerRef.current);
        pautasTimerRef.current = null;
      }
    }
  };

  return (
    <div style={{ display: activeTab === 'pautas' ? 'block' : 'none', background: '#f8fafc', padding: '24px', borderRadius: '12px' }}>
      {especieId && (
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', background: 'white', padding: '12px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', flexWrap: 'wrap', alignItems: 'center' }}>
          {pautas.length > 0 && (
            <>
              <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#64748b' }}>🔍 Filtrar por:</span>
              <select 
                value={pautasFiltroFase} 
                onChange={(e) => setPautasFiltroFase(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', color: '#475569', background: '#fff', cursor: 'pointer' }}
              >
                <option value="">Fase...</option>
                {masterFases.map(f => <option key={f.idfasescultivo} value={f.fasescultivoclave}>{f.fasescultivonombre}</option>)}
              </select>

              <select 
                value={pautasFiltroLabor} 
                onChange={(e) => setPautasFiltroLabor(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', color: '#475569', background: '#fff', cursor: 'pointer' }}
              >
                <option value="">Labor...</option>
                {masterLabores.map(l => <option key={l.idlabores} value={l.laboresclave}>{l.laboresnombre}</option>)}
              </select>

              <select 
                value={pautasFiltroLaboreo} 
                onChange={(e) => setPautasFiltroLaboreo(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', color: '#475569', background: '#fff', cursor: 'pointer' }}
              >
                <option value="">Laboreo...</option>
                <option value="convencional">🚜 Convencional</option>
                <option value="minimo">⛏️ Mínimo</option>
                <option value="nolaboreo">🌱 No Laboreo</option>
              </select>

              <button
                type="button"
                onClick={() => {
                  setPautasFiltroFase('');
                  setPautasFiltroLabor('');
                  setPautasFiltroLaboreo('');
                }}
                style={{ padding: '6px 12px', background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#64748b', fontSize: '0.8rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
              >
                Restablecer
              </button>
            </>
          )}

          <div style={{ flex: 1 }} />

          <button
            type="button"
            onClick={() => {
              setPautaForm({
                laborespautafase: '',
                laborespautalabor: '',
                laborespautadetalle: '',
                laborespautafrecuencia: '',
                laborespautatopolaboreo: '',
                laborespautaactivosino: 1,
                idlaborespauta: null
              });
              setEditingPauta(null);
              setShowAddPautaForm(!showAddPautaForm);
            }}
            style={{ padding: '8px 16px', background: '#0f766e', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            {showAddPautaForm ? '✕ Cerrar' : '+ Añadir Labor'}
          </button>
          
          <button
            type="button"
            onClick={handleTriggerPautasAi}
            style={{ padding: '8px 16px', background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            ✨ Guía de Pautas IA
          </button>
        </div>
      )}

      {/* FORMULARIO DE AÑADIR/EDITAR LABOR */}
      {showAddPautaForm && (
        <form onSubmit={handleSavePauta} style={{ background: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '15px' }}>
          <h4 style={{ gridColumn: '1 / -1', margin: '0 0 5px', fontSize: '1rem', color: '#1e293b' }}>
            {pautaForm.idlaborespauta ? '✏️ Editar Labor de Pauta' : '➕ Añadir Labor de Pauta'}
          </h4>

          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontWeight: 'bold' }}>Fase de Cultivo</label>
            <select
              value={pautaForm.laborespautafase}
              onChange={e => setPautaForm({ ...pautaForm, laborespautafase: e.target.value })}
              required
              style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
            >
              <option value="">-- Seleccionar --</option>
              {masterFases.map(f => <option key={f.idfasescultivo} value={f.fasescultivoclave}>{f.fasescultivonombre}</option>)}
            </select>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontWeight: 'bold' }}>Labor a Realizar</label>
            <select
              value={pautaForm.laborespautalabor}
              onChange={e => setPautaForm({ ...pautaForm, laborespautalabor: e.target.value })}
              required
              style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
            >
              <option value="">-- Seleccionar --</option>
              {masterLabores.map(l => <option key={l.idlabores} value={l.laboresclave}>{l.laboresnombre}</option>)}
            </select>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontWeight: 'bold' }}>Tipo de Laboreo</label>
            <select
              value={pautaForm.laborespautatopolaboreo}
              onChange={e => setPautaForm({ ...pautaForm, laborespautatopolaboreo: e.target.value })}
              style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
            >
              <option value="">Cualquiera</option>
              <option value="convencional">🚜 Convencional</option>
              <option value="minimo">⛏️ Mínimo</option>
              <option value="nolaboreo">🌱 No Laboreo</option>
            </select>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontWeight: 'bold' }}>Frecuencia / Momento</label>
            <input
              type="text"
              value={pautaForm.laborespautafrecuencia}
              onChange={e => setPautaForm({ ...pautaForm, laborespautafrecuencia: e.target.value })}
              placeholder="Ej. Semanal, 10 días tras siembra..."
              required
              style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
            />
          </div>

          <div className="form-group full" style={{ margin: 0 }}>
            <label style={{ fontWeight: 'bold' }}>Detalle de las Instrucciones</label>
            <textarea
              value={pautaForm.laborespautadetalle}
              onChange={e => setPautaForm({ ...pautaForm, laborespautadetalle: e.target.value })}
              placeholder="Escribe aquí las pautas técnicas..."
              rows={3}
              required
              style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', resize: 'vertical' }}
            />
          </div>

          <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
            <button
              type="button"
              onClick={() => {
                setShowAddPautaForm(false);
                setEditingPauta(null);
              }}
              style={{ padding: '8px 16px', background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#475569', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              style={{ padding: '8px 20px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              💾 {pautaForm.idlaborespauta ? 'Actualizar Labor' : 'Guardar Labor'}
            </button>
          </div>
        </form>
      )}

      {/* LISTADO DE LABORES */}
      {!especieId ? (
        <div style={{ padding: '40px', textAlign: 'center', background: '#fff', borderRadius: '12px', border: '1px dashed #cbd5e1', color: '#64748b' }}>
          Guarda la especie primero antes de poder configurar pautas de cultivo.
        </div>
      ) : pautas.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', background: '#fff', borderRadius: '12px', border: '2px dashed #cbd5e1' }}>
          <p style={{ color: '#64748b', fontSize: '1.1rem', margin: '0 0 10px 0' }}>No hay labores definidas en el calendario de cultivo.</p>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0 }}>Crea una labor con el botón verde de la derecha o genera la pauta técnica estándar usando el redactor IA.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
          {pautas
            .filter(p => {
              if (pautasFiltroFase && p.laborespautafase !== pautasFiltroFase) return false;
              if (pautasFiltroLabor && p.laborespautalabor !== pautasFiltroLabor) return false;
              if (pautasFiltroLaboreo && p.laborespautatopolaboreo && p.laborespautatopolaboreo !== pautasFiltroLaboreo) return false;
              return true;
            })
            .map((p) => {
              const fObj = masterFases.find(f => f.fasescultivoclave === p.laborespautafase);
              const lObj = masterLabores.find(l => l.laboresclave === p.laborespautalabor);

              return (
                <div key={p.idlaborespauta} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', display: 'flex', gap: '16px', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', borderLeft: `6px solid ${fObj?.fasescultivocolor || '#cbd5e1'}` }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 'bold', background: `${fObj?.fasescultivocolor || '#cbd5e1'}20`, color: fObj?.fasescultivocolor || '#64748b', padding: '3px 8px', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <span>{fObj?.fasescultivoicono || '🌱'}</span> {fObj?.fasescultivonombre || p.laborespautafase}
                      </span>
                      <strong style={{ color: '#1e293b', fontSize: '0.95rem' }}>{lObj?.laboresnombre || p.laborespautalabor}</strong>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8', border: '1px solid #e2e8f0', padding: '2px 6px', borderRadius: '6px' }}>
                        ⏱️ {p.laborespautafrecuencia}
                      </span>
                      {p.laborespautatopolaboreo && (
                        <span style={{ fontSize: '0.75rem', background: '#f1f5f9', color: '#475569', padding: '2px 6px', borderRadius: '6px', fontWeight: 'bold' }}>
                          🚜 {p.laborespautatopolaboreo === 'nolaboreo' ? 'No Laboreo' : p.laborespautatopolaboreo === 'minimo' ? 'Mínimo' : 'Convencional'}
                        </span>
                      )}
                    </div>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#475569', lineHeight: '1.4' }}>{p.laborespautadetalle}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignSelf: isMobile ? 'flex-end' : 'center' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPauta(p.idlaborespauta);
                        setPautaForm({
                          laborespautafase: p.laborespautafase,
                          laborespautalabor: p.laborespautalabor,
                          laborespautadetalle: p.laborespautadetalle,
                          laborespautafrecuencia: p.laborespautafrecuencia,
                          laborespautatopolaboreo: p.laborespautatopolaboreo || '',
                          laborespautaactivosino: p.laborespautaactivosino || 1,
                          idlaborespauta: p.idlaborespauta
                        });
                        setShowAddPautaForm(true);
                        window.scrollTo({ top: 300, behavior: 'smooth' });
                      }}
                      style={{ padding: '6px 12px', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}
                    >
                      ✏️ Editar
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!especieId) return;
                        if (!window.confirm('¿Seguro que deseas eliminar esta labor de la pauta?')) return;
                        try {
                          const res = await fetch(`/api/admin/especiesvegetales/${especieId}/pautas?id=${p.idlaborespauta}`, { method: 'DELETE' });
                          if (res.ok) {
                            loadPautas(especieId);
                            setToastMessage('Labor eliminada con éxito.');
                            setTimeout(() => setToastMessage(null), 3000);
                          }
                        } catch (err) {
                          console.error(err);
                        }
                      }}
                      style={{ padding: '6px 10px', background: '#fee2e2', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '6px', cursor: 'pointer' }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* MODAL DE PAUTAS IA GENERADAS */}
      {showPautasAiModal && (
        <PremiumModal isOpen={showPautasAiModal} onClose={() => setShowPautasAiModal(false)} maxWidth="800px" zIndex={10000}>
          <PremiumModalHeader
            title={<>🧙‍♂️ Propuesta de Pauta de Cultivo (IA) <span style={{ fontSize: '0.8rem', opacity: 0.8, marginLeft: '8px' }}>({formData.especiesvegetalesnombre})</span></>}
            actions={
              <button
                onClick={() => setShowPautasConfig(!showPautasConfig)}
                style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.1)', color: 'white', fontWeight: 'bold', fontSize: '0.75rem', cursor: 'pointer' }}
              >
                ⚙️ Configurar Prompt
              </button>
            }
            gradient="linear-gradient(135deg, #8b5cf6, #6d28d9)"
            onClose={() => setShowPautasAiModal(false)}
          />

          <div style={{ padding: '24px', maxHeight: '70vh', overflowY: 'auto' }}>
            {pautasAiLoading ? (
              <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                <span style={{ fontSize: '2.5rem', display: 'inline-block', animation: 'spin 2s linear infinite', marginBottom: '15px' }}>⏳</span>
                <h4 style={{ margin: '0 0 8px 0', color: '#8b5cf6', fontSize: '1.2rem' }}>El agrónomo IA está diseñando la pauta...</h4>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b' }}>
                  Esto puede tardar unos segundos. Llevamos {pautasAiSeconds}s...
                </p>
              </div>
            ) : showPautasConfig ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <h4 style={{ margin: 0, fontSize: '1rem', color: '#1e293b' }}>Ajustes del Prompt del Agrónomo IA</h4>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
                  Añade instrucciones específicas para guiar la generación de labores por parte de la IA.
                </p>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>Instrucciones adicionales para la IA</label>
                  <textarea
                    value={pautasExtraInstructions}
                    onChange={e => setPautasExtraInstructions(e.target.value)}
                    rows={4}
                    placeholder="Ej. Enfocar el cultivo en maceta y climas mediterráneos secos. Añadir labores sobre el acolchado de paja..."
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => setShowPautasConfig(false)} style={{ padding: '8px 16px', background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                    Atrás
                  </button>
                  <button type="button" onClick={() => { setShowPautasConfig(false); handleTriggerPautasAi(); }} style={{ padding: '8px 20px', background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                    🔄 Regenerar con Ajustes
                  </button>
                </div>
              </div>
            ) : aiPautasProposal ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', background: '#ecfdf5', padding: '12px 16px', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
                  <span style={{ fontSize: '0.9rem', color: '#065f46', fontWeight: 600 }}>
                    💡 Se ha diseñado una pauta de cultivo con {aiPautasProposal.pautas?.length || 0} labores recomendadas.
                  </span>
                  <button
                    onClick={handleAssimilatePautas}
                    style={{ padding: '8px 16px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    Asimilar pauta en el cultivo
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {aiPautasProposal.pautas?.map((p: any, idx: number) => {
                    const fObj = masterFases.find(f => f.fasescultivoclave === p.laborespautafase);
                    return (
                      <div key={idx} style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', borderLeft: `5px solid ${fObj?.fasescultivocolor || '#cbd5e1'}`, borderTop: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 'bold', background: 'white', border: `1px solid ${fObj?.fasescultivocolor || '#cbd5e1'}`, color: fObj?.fasescultivocolor || '#64748b', padding: '2px 6px', borderRadius: '10px' }}>
                            {fObj?.fasescultivonombre || p.laborespautafase}
                          </span>
                          <strong style={{ fontSize: '0.9rem', color: '#1e293b' }}>{p.laborespautalabor}</strong>
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Frecuencia: {p.laborespautafrecuencia}</span>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#475569' }}>{p.laborespautadetalle}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div style={{ padding: '20px', textAlign: 'center' }}>
                Ocurrió un error o la propuesta está vacía.
              </div>
            )}
          </div>
        </PremiumModal>
      )}
    </div>
  );
}
