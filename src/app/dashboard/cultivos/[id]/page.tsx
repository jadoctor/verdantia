'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { auth } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { useCultivoData } from './hooks/useCultivoData';
import CultivoHeroCarousel from './components/CultivoHeroCarousel';
import CultivoTabs from './components/CultivoTabs';
import CultivoTimeline from './components/CultivoTimeline';
import CultivoPrintView from './components/CultivoPrintView';
import UserCultivoMediaManager from './components/UserCultivoMediaManager';
import CultivoPendingTasks from './components/CultivoPendingTasks';
import CultivoStatsPanel from './components/CultivoStatsPanel';
import CultivoMeteoWidget from './components/CultivoMeteoWidget';
import CultivoHistorial from './components/CultivoHistorial';
import CultivoConsejos from './components/CultivoConsejos';
import CultivoAgenda7Dias from './components/CultivoAgenda7Dias';
import CultivoDiarioVisual from './components/CultivoDiarioVisual';
import CultivoShareCard from './components/CultivoShareCard';
import CultivoGantt from './components/CultivoGantt';
import CultivoLogros from './components/CultivoLogros';
import CultivoBeforeAfter from './components/CultivoBeforeAfter';
import InlineLaborPhotos from './InlineLaborPhotos'; // Legacy or adapt

export default function CultivoDashboard() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const from = searchParams.get('from');
  const cultivoId = params.id as string;
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user && user.email) setUserEmail(user.email);
      else router.push('/login');
    });
    return () => unsub();
  }, [router]);

  const data = useCultivoData(cultivoId, userEmail);
  const [activeTab, setActiveTab] = useState<'ficha' | 'tareas' | 'completadas' | 'fotos'>('ficha');

  if (data.loading || !data.cultivo) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Cargando cultivo...</div>;
  }

  const {
    cultivo, formData, saveStatus, phaseModal, setPhaseModal, undoState, handleUndo,
    handleChange, handleBlurSave, handleOpenPhaseModal, handleConfirmPhaseModal, loadCultivo
  } = data;

  const handleDeleteCultivo = async () => {
    if (!confirm('¿Estás seguro de que quieres eliminar este cultivo por completo?')) return;
    try {
      const res = await fetch(`/api/user/cultivos/${cultivoId}`, { method: 'DELETE', headers: { 'x-user-email': userEmail! } });
      if (res.ok) router.push(`/dashboard/mis-plantas/${cultivo.xcultivosidvariedades}`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCloneCultivo = async () => {
    if (!confirm('¿Repetir este cultivo? Se creará uno nuevo con los mismos datos base pero sin fechas.')) return;
    try {
      const res = await fetch(`/api/user/cultivos/${cultivoId}/clone`, { method: 'POST', headers: { 'x-user-email': userEmail! } });
      if (res.ok) {
        const d = await res.json();
        router.push(`/dashboard/cultivos/${d.newCultivoId}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui, sans-serif', width: '100%' }}>
      {/* ── Navegación Hierárquica Superior ── */}
      <div className="cultivo-nav" style={{ marginBottom: '16px', display: 'flex', gap: '10px', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => {
              if (from === 'bancal') router.push(`/dashboard/bancales/${searchParams.get('bancalId')}`);
              else if (from === 'dashboard') router.push('/dashboard');
              else router.push(`/dashboard/mis-plantas/${cultivo.xcultivosidvariedades}`);
            }}
            style={{ background: 'white', border: '1px solid #cbd5e1', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
          >
            {from === 'bancal' ? '🏠 Volver al Bancal' : from === 'dashboard' ? '🏠 Volver al Inicio' : '🔙 Volver a la Planta'}
          </button>
          <button 
            onClick={() => window.print()} 
            style={{ padding: '6px 14px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            📖 Diario
          </button>
          <CultivoShareCard cultivo={cultivo} formData={formData} />
        </div>
        <div style={{ padding: '6px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600, background: saveStatus === 'saving' ? '#fef08a' : saveStatus === 'saved' ? '#dcfce7' : '#f1f5f9', color: saveStatus === 'saving' ? '#854d0e' : saveStatus === 'saved' ? '#166534' : '#64748b' }}>
          {saveStatus === 'saving' ? '⏳ Guardando...' : saveStatus === 'saved' ? '✓ Guardado' : 'Todos los cambios guardados'}
        </div>
      </div>

      {/* ── Subheader Global ── */}
      {(() => {
        const tSiembra = formData.cultivosfechainicio ? new Date(formData.cultivosfechainicio).getTime() : null;
        const durTotal = cultivo?.duracion_total || 0;
        const diasTranscurridos = tSiembra ? Math.floor((Date.now() - tSiembra) / 86400000) : 0;
        const pctAvance = durTotal > 0 ? Math.min(100, Math.round((diasTranscurridos / durTotal) * 100)) : null;
        const esFinalizado = ['finalizado', 'perdido'].includes(formData.cultivosestado);

        return (
          <div style={{ background: 'linear-gradient(135deg, #0f766e, #10b981)', borderRadius: '16px', padding: '24px 28px', marginBottom: '24px', color: 'white' }}>
            <div className="cultivo-subheader-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: pctAvance && !esFinalizado ? '14px' : '0' }}>
              <div>
                <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
                  🌱 Cultivo Nº {cultivo.cultivosnumerocoleccion || cultivo.idcultivos}
                  {tSiembra && (
                    <span style={{ fontSize: '0.85rem', fontWeight: 500, opacity: 0.85, background: 'rgba(255,255,255,0.2)', padding: '2px 10px', borderRadius: '12px' }}>
                      Día {diasTranscurridos}{durTotal > 0 ? ` de ~${durTotal}` : ''}
                    </span>
                  )}
                </h1>
                <p style={{ margin: '4px 0 0', opacity: 0.9 }}>{cultivo.especiesnombre} {cultivo.variedad_nombre !== cultivo.especiesnombre ? ` - ${cultivo.variedad_nombre}` : ''}</p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {['finalizado', 'recoleccion'].includes(formData.cultivosestado) && (
                  <button onClick={handleCloneCultivo} style={{ background: 'rgba(255,255,255,0.25)', border: '1px solid rgba(255,255,255,0.4)', color: 'white', padding: '8px 16px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    🔁 Repetir Cultivo
                  </button>
                )}
                <button onClick={handleDeleteCultivo} style={{ background: '#dc2626', border: 'none', color: 'white', padding: '8px 16px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
                  Eliminar
                </button>
              </div>
            </div>
            {/* Barra de progreso global del ciclo */}
            {pctAvance !== null && !esFinalizado && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ flex: 1, background: 'rgba(255,255,255,0.2)', borderRadius: '6px', height: '8px', overflow: 'hidden' }}>
                  <div style={{ width: `${pctAvance}%`, height: '100%', background: pctAvance > 90 ? '#fbbf24' : 'white', borderRadius: '6px', transition: 'width 1s ease' }} />
                </div>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, opacity: 0.9, minWidth: '36px' }}>{pctAvance}%</span>
              </div>
            )}
          </div>
        );
      })()}

      {/* ── Hero Carousel Estándar ── */}
      <CultivoHeroCarousel 
        cultivoPhotos={cultivo.fotosLabores || []} 
        fallbackPhoto={cultivo.foto} 
        onSetPrimary={async (id) => {
          await fetch(`/api/user/cultivos/${cultivoId}/photos`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail! }, body: JSON.stringify({ action: 'setPrimary', photoId: id }) });
          loadCultivo();
        }}
      />

      {/* ── Pestañas Controladas por CSS ── */}
      <CultivoTabs activeTab={activeTab} setActiveTab={setActiveTab} pendingTasksCount={(cultivo.avisos?.alertasPendientes || []).length} completedTasksCount={(data.avisosCompletados || []).length} />

      <div style={{ display: activeTab === 'ficha' ? 'block' : 'none' }}>
        {/* Consejos del Agrónomo — arriba de todo, justo debajo de las tabs */}
        <CultivoConsejos cultivo={cultivo} formData={formData} />

        <div style={{ background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', marginBottom: '32px' }}>
          <h2 style={{ margin: '0 0 24px', fontSize: '1.4rem', color: '#334155', borderBottom: '2px solid #f1f5f9', paddingBottom: '12px' }}>Información General</h2>
          <div className="cultivo-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
            <div><label>Estado Actual</label><select name="cultivosestado" value={formData.cultivosestado} onChange={handleChange} style={{ width: '100%', padding: '10px' }}><option value="en_espera">En espera de siembra</option><option value="germinacion">Germinando</option><option value="crecimiento_inicial">Crecimiento Inicial</option><option value="crecimiento">Crecimiento Firme</option><option value="fructificacion">Floración / Fructificación</option><option value="recoleccion">Recolección / Cosecha</option><option value="finalizado">Ciclo Finalizado</option><option value="perdido">Cultivo Perdido</option></select></div>
            <div><label>Cantidad (Ej. m² o macetas)</label><input type="number" name="cultivoscantidad" value={formData.cultivoscantidad} onChange={handleChange} onBlur={handleBlurSave} style={{ width: '100%', padding: '10px' }} /></div>
            <div style={{ gridColumn: '1 / -1' }}><label>Ubicación Específica</label><input type="text" name="cultivosubicacion" value={formData.cultivosubicacion} onChange={handleChange} onBlur={handleBlurSave} style={{ width: '100%', padding: '10px' }} /></div>
          </div>
          <div>
            <label>Observaciones y Notas</label>
            {/* Quick-Log Bitácora */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px', marginTop: '4px' }}>
              {[
                { emoji: '💧', label: 'Riego' },
                { emoji: '🌿', label: 'Abono' },
                { emoji: '✂️', label: 'Poda' },
                { emoji: '🐛', label: 'Plaga' },
                { emoji: '🌧️', label: 'Lluvia' },
                { emoji: '☀️', label: 'Sol intenso' },
              ].map(({ emoji, label }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => {
                    const today = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
                    const entry = `[${today}] ${emoji} ${label}\n`;
                    const syntheticEvent = { target: { name: 'cultivosobservaciones', value: entry + (formData.cultivosobservaciones || '') } } as any;
                    handleChange(syntheticEvent);
                    setTimeout(() => {
                      const blurEvent = { target: { name: 'cultivosobservaciones' } } as any;
                      handleBlurSave(blurEvent);
                    }, 500);
                  }}
                  style={{
                    background: '#f1f5f9', border: '1px solid #e2e8f0',
                    borderRadius: '20px', padding: '4px 12px', cursor: 'pointer',
                    fontSize: '0.82rem', fontWeight: 500, color: '#475569',
                    transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: '4px'
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#e2e8f0')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#f1f5f9')}
                >
                  {emoji} {label}
                </button>
              ))}
            </div>
            <textarea name="cultivosobservaciones" value={formData.cultivosobservaciones} onChange={handleChange} onBlur={handleBlurSave} rows={4} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
            {/* Diario Visual */}
            <CultivoDiarioVisual observaciones={formData.cultivosobservaciones || ''} />
          </div>
          
          {/* Widget Meteo */}
          <CultivoMeteoWidget ubicacion={formData.cultivosubicacion || ''} userEmail={userEmail!} />
        </div>

        {/* Panel de Estadísticas (solo si el ciclo está finalizado) */}
        <CultivoStatsPanel cultivo={cultivo} formData={formData} userEmail={userEmail!} />

        <CultivoTimeline 
          cultivo={cultivo} formData={formData} handleChange={handleChange} handleBlurSave={handleBlurSave} 
          handleOpenPhaseModal={handleOpenPhaseModal} isSimulating={data.isSimulating} 
          timeOffsetDays={data.timeOffsetDays} setTimeOffsetDays={data.setTimeOffsetDays} 
        />

        {/* Diagrama Gantt del ciclo */}
        <CultivoGantt cultivo={cultivo} formData={formData} />

        {/* Logros del cultivo */}
        <CultivoLogros cultivo={cultivo} formData={formData} />
      </div>

      <div style={{ display: activeTab === 'tareas' ? 'block' : 'none' }}>
        {/* Agenda 7 días */}
        <CultivoAgenda7Dias cultivo={cultivo} formData={formData} />
        
        <CultivoPendingTasks
          cultivo={cultivo}
          avisosCompletados={data.avisosCompletados}
          ignoredPautas={data.ignoredPautas}
          forcedPautas={data.forcedPautas}
          isSimulating={data.isSimulating}
          onMarkDone={data.handleMarkAsDone}
          onIgnore={(idpauta) => {
            const newIgnored = data.ignoredPautas.includes(idpauta)
              ? data.ignoredPautas.filter((i: number) => i !== idpauta)
              : [...data.ignoredPautas, idpauta];
            data.setIgnoredPautas(newIgnored);
          }}
        />
      </div>

      <div style={{ display: activeTab === 'completadas' ? 'block' : 'none' }}>
        <CultivoHistorial
          avisosCompletados={data.avisosCompletados || []}
          pautas={data.pautas || []}
        />
      </div>

      <div style={{ display: activeTab === 'fotos' ? 'block' : 'none' }}>
        {/* Comparador Antes/Después */}
        <CultivoBeforeAfter photos={cultivo.fotosLabores || []} />

        <div style={{ background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
          <h2 style={{ margin: '0 0 16px', fontSize: '1.4rem', color: '#334155' }}>📷 Galería Fotográfica</h2>
          <UserCultivoMediaManager cultivoId={cultivoId} userEmail={userEmail!} onMediaChange={loadCultivo} />
        </div>
      </div>

      {/* ── Modal de Fase y Undo Toast ── */}
      {phaseModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: 'white', padding: '24px', borderRadius: '16px', width: '100%', maxWidth: '400px' }}>
            <h3 style={{ margin: '0 0 16px' }}>Completar {phaseModal.title}</h3>
            <label style={{ display: 'block', marginBottom: '16px' }}>Fecha:<input type="date" value={phaseModal.date} onChange={(e) => setPhaseModal({ ...phaseModal, date: e.target.value })} style={{ width: '100%', padding: '10px', marginTop: '4px' }} /></label>
            
            {phaseModal.isHarvest && (
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', marginBottom: '16px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ margin: '0 0 12px', color: '#0f172a' }}>⚖️ Registro de Cosecha</h4>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  <input 
                    type="number" 
                    placeholder="Cantidad"
                    value={phaseModal.cosechaCantidad} 
                    onChange={(e) => setPhaseModal({ ...phaseModal, cosechaCantidad: e.target.value })} 
                    style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} 
                  />
                  <select 
                    value={phaseModal.cosechaUnidad} 
                    onChange={(e) => setPhaseModal({ ...phaseModal, cosechaUnidad: e.target.value })}
                    style={{ width: '110px', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  >
                    <option value="gramos">Gramos</option>
                    <option value="kilos">Kilos</option>
                    <option value="unidades">Unidades</option>
                    <option value="manojos">Manojos</option>
                  </select>
                </div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.9rem', color: '#475569' }}>Valoración de la Cosecha:</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[1,2,3,4,5].map(star => (
                    <button 
                      key={star}
                      onClick={() => setPhaseModal({ ...phaseModal, cosechaEstrellas: star })}
                      style={{ 
                        background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer',
                        filter: star <= phaseModal.cosechaEstrellas ? 'none' : 'grayscale(100%) opacity(30%)'
                      }}
                    >
                      ⭐
                    </button>
                  ))}
                </div>
              </div>
            )}

            <label style={{ display: 'block', marginBottom: '16px' }}>Nota (Opcional):<textarea value={phaseModal.nota} onChange={(e) => setPhaseModal({ ...phaseModal, nota: e.target.value })} rows={3} style={{ width: '100%', padding: '10px', marginTop: '4px' }} /></label>
            <label style={{ display: 'block', marginBottom: '16px' }}>📸 Foto del Hito (Opcional):<br/><input type="file" accept="image/*" onChange={(e) => setPhaseModal({ ...phaseModal, file: e.target.files?.[0] || null })} style={{ marginTop: '8px' }} /></label>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setPhaseModal(null)} style={{ padding: '8px 16px', background: '#e2e8f0', borderRadius: '8px', cursor: 'pointer', border: 'none' }}>Cancelar</button>
              <button onClick={handleConfirmPhaseModal} style={{ padding: '8px 16px', background: '#10b981', color: 'white', borderRadius: '8px', cursor: 'pointer', border: 'none', fontWeight: 'bold' }}>Confirmar Fase</button>
            </div>
          </div>
        </div>
      )}
      {undoState && (
        <div style={{ position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)', background: '#1e293b', color: 'white', padding: '12px 24px', borderRadius: '30px', display: 'flex', alignItems: 'center', gap: '16px', zIndex: 1100 }}>
          <span>Fase guardada exitosamente</span>
          <button onClick={handleUndo} style={{ background: 'white', color: '#1e293b', border: 'none', padding: '4px 12px', borderRadius: '16px', cursor: 'pointer', fontWeight: 'bold' }}>Deshacer</button>
        </div>
      )}

      {/* Vista especial solo para impresión */}
      <CultivoPrintView cultivo={cultivo} formData={formData} userEmail={userEmail!} />

      {/* ── CSS Responsive ── */}
      <style>{`
        @media (max-width: 768px) {
          /* Nav bar: stack vertical */
          .cultivo-nav { flex-direction: column !important; gap: 8px !important; }
          
          /* Subheader: título y botones en columna */
          .cultivo-subheader-row { flex-direction: column !important; gap: 12px !important; align-items: flex-start !important; }
          .cultivo-subheader-row h1 { font-size: 1.3rem !important; flex-wrap: wrap !important; }
          .cultivo-subheader-row h1 span { font-size: 0.75rem !important; }
          
          /* Hero carousel: apila foto y miniaturas */
          .cultivo-hero { flex-direction: column !important; align-items: center !important; padding: 16px !important; }
          .cultivo-hero > div:first-child { width: 140px !important; height: 170px !important; }
          .cultivo-hero > div:nth-child(2) { flex-direction: row !important; height: auto !important; gap: 8px !important; }
          
          /* Formulario: 1 columna */
          .cultivo-form-grid { grid-template-columns: 1fr !important; }
          
          /* Tabs: scroll horizontal con texto más corto */
          .cultivo-tabs { gap: 4px !important; }
          .cultivo-tabs button { padding: 10px 10px !important; font-size: 0.85rem !important; }
          
          /* Stats panel: 2 columnas en móvil */
          .cultivo-stats-grid { grid-template-columns: 1fr 1fr !important; }
          
          /* Agenda 7 días: scroll horizontal */
          .cultivo-agenda-grid { 
            grid-template-columns: repeat(7, minmax(80px, 1fr)) !important;
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch;
          }
        }
        
        @media (max-width: 480px) {
          .cultivo-agenda-grid { 
            grid-template-columns: repeat(7, 72px) !important;
          }
        }
      `}</style>
    </div>
  );
}
