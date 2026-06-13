import React from 'react';
import { useCultivoPhases } from '../hooks/useCultivoPhases';

interface CultivoTimelineProps {
  cultivo: any;
  formData: any;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleBlurSave: (e: React.FocusEvent<HTMLInputElement>) => void;
  handleOpenPhaseModal: (field: string, title: string, idfase?: number) => void;
  isSimulating: boolean;
  timeOffsetDays: number;
  setTimeOffsetDays: (v: number) => void;
}

export default function CultivoTimeline({
  cultivo,
  formData,
  handleChange,
  handleBlurSave,
  handleOpenPhaseModal,
  isSimulating,
  timeOffsetDays,
  setTimeOffsetDays
}: CultivoTimelineProps) {
  
  const phaseLogic = useCultivoPhases(cultivo, isSimulating, timeOffsetDays);

  if (!phaseLogic) return null;

  const { dynamicPhases, tInicio } = phaseLogic;
  const DAY_MS = 86400000;

  const renderEstimate = (timestampEstimado: number | null | undefined, isEnabled: boolean, durationDays: number, currentPhaseStart?: number | null) => {
    if (!timestampEstimado) return null;
    const estimatedDate = new Date(timestampEstimado);
    
    // Calcular días exactos de diferencia respecto a hoy
    const todayAtMidnight = new Date().setHours(0,0,0,0);
    const diffDays = Math.round((timestampEstimado - todayAtMidnight) / DAY_MS);
    
    let timeText = '';
    if (diffDays === 0) timeText = '(Hoy)';
    else if (diffDays === 1) timeText = '(Mañana)';
    else if (diffDays === -1) timeText = '(Ayer)';
    else if (diffDays > 1) timeText = `(en ${diffDays} días)`;
    else timeText = `(hace ${Math.abs(diffDays)} días)`;

    // Estancamiento calculation
    const delayLimitDays = Math.max(3, Math.round(durationDays * 0.3)); 
    const isEstancado = isEnabled && diffDays < -delayLimitDays;

    // Días transcurridos (si se pasa currentPhaseStart)
    let progressText = null;
    let percent = 0;
    if (currentPhaseStart && currentPhaseStart <= Date.now() && durationDays > 0) {
      const daysElapsed = Math.floor((Date.now() - currentPhaseStart) / DAY_MS);
      percent = Math.min(100, Math.round((daysElapsed / durationDays) * 100));
      progressText = `Día ${daysElapsed} de ${durationDays} (${percent}%)`;
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', marginTop: '6px' }}>
        <div style={{ fontSize: '0.8rem', color: isEnabled ? '#64748b' : '#94a3b8', textAlign: 'center', fontStyle: 'italic', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
          <span>⏱️</span> Estimado: {estimatedDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} <span style={{ fontWeight: 600 }}>{timeText}</span>
        </div>
        {progressText && isEnabled && (
          <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#0ea5e9', background: '#e0f2fe', padding: '2px 8px', borderRadius: '12px', display: 'inline-block', marginTop: '2px' }}>
            ⏳ {progressText}
          </div>
        )}
        {isEstancado && (
          <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#dc2626', background: '#fee2e2', padding: '2px 8px', borderRadius: '12px', display: 'inline-block' }}>
            ⚠️ Posible Estancamiento
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', marginBottom: '32px' }}>
      <h2 style={{ margin: '0 0 24px', fontSize: '1.4rem', color: '#334155', borderBottom: '2px solid #f1f5f9', paddingBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>⏱️ Fases del Cultivo</span>
      </h2>

      {isSimulating && (
        <div style={{ background: '#fef08a', padding: '12px', borderRadius: '8px', marginBottom: '24px', border: '1px solid #fde047' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <strong style={{ color: '#854d0e', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>🚀</span> Modo Simulación Activado
            </strong>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button onClick={() => setTimeOffsetDays(Math.max(0, timeOffsetDays - 1))} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer' }}>-1 día</button>
            <button onClick={() => setTimeOffsetDays(Math.min(365, timeOffsetDays + 1))} style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 'bold' }}>+1 día</button>
            <button onClick={() => setTimeOffsetDays(Math.min(365, timeOffsetDays + 7))} style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 'bold' }}>+7 días</button>
            <button onClick={() => setTimeOffsetDays(Math.min(365, timeOffsetDays + 30))} style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 'bold' }}>+1 Mes</button>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .timeline-container { position: relative; max-width: 1000px; margin: 0 auto; }
        .timeline-item { position: relative; width: 100%; display: flex; box-sizing: border-box; padding-bottom: 40px; }
        .timeline-left { width: 50%; min-width: 350px; padding: 10px 80px 0 0; position: relative; box-sizing: border-box; text-align: right; }
        .timeline-right { width: 45%; padding-left: 20px; padding-top: 10px; display: flex; flex-direction: column; gap: 8px; }
        .timeline-left::after { content: ''; position: absolute; width: 6px; background: linear-gradient(to bottom, #10b981 var(--line-fill, 0%), #cbd5e1 var(--line-fill, 0%)); top: 40px; height: 100%; z-index: 1; border-radius: 4px; right: 23px; }
        .timeline-item:last-child .timeline-left::after { display: none; } 
        .timeline-left::before { content: ''; position: absolute; top: 38px; width: 20px; height: 4px; background-color: var(--connector-color, #cbd5e1); z-index: 1; right: 31px; }
        .timeline-icon { position: absolute; width: 50px; height: 50px; border-radius: 50%; background: white; border: 4px solid; top: 15px; z-index: 2; display: flex; align-items: center; justify-content: center; font-size: 1.3rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); right: 1px; }
        .timeline-content { padding: 20px; background: white; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; position: relative; z-index: 3; text-align: right; }
        @media screen and (max-width: 768px) {
          .timeline-item { flex-direction: column; }
          .timeline-left { width: 100%; min-width: auto; padding-right: 60px; }
          .timeline-left::after { right: 18px; }
          .timeline-left::before { width: 15px; right: 23px; }
          .timeline-icon { right: 0; width: 40px; height: 40px; border-width: 3px; font-size: 1rem; }
          .timeline-right { width: 100%; padding-left: 0; padding-top: 15px; }
        }
      `}} />

      <div className="timeline-container">
        {dynamicPhases.map((phase: any, index: number) => {
          const nextPhase = dynamicPhases[index + 1];
          let fillPercent = 0;
          
          const isSiembra = index === 0;
          const hasRealDate = phase.isRealizada;
          let connectorColor = hasRealDate ? '#10b981' : '#cbd5e1';
          const iconColor = hasRealDate ? '#10b981' : '#cbd5e1';
          const title = phase.fasescultivonombre;
          
          if (hasRealDate) {
            fillPercent = 100;
            if (nextPhase && !nextPhase.isRealizada && phase.realTime && nextPhase.estimatedTime) {
              const start = phase.realTime;
              const end = nextPhase.estimatedTime;
              if (end > start) {
                const now = isSimulating ? Date.now() + timeOffsetDays * 86400000 : Date.now();
                const total = end - start;
                const elapsed = now - start;
                fillPercent = Math.max(0, Math.min(100, (elapsed / total) * 100));
              }
            }
          }

          // Generate field name (either for Siembra or dynamic)
          const fieldName = isSiembra ? 'cultivosfechainicio' : `fase_${phase.idfasescultivo}`;
          const dateValue = isSiembra 
            ? formData.cultivosfechainicio 
            : (cultivo.fases_historial?.[phase.idfasescultivo] || '');

          return (
            <div key={phase.idfasescultivo} className="timeline-item" style={{ opacity: (!tInicio && !isSiembra) ? 0.4 : 1 }}>
              <div 
                className="timeline-left" 
                style={{ 
                  '--line-fill': `${fillPercent}%`,
                  '--connector-color': connectorColor 
                } as any}
              >
                <div className="timeline-icon" style={{ borderColor: iconColor, color: iconColor, background: hasRealDate ? '#f0fdf4' : 'white' }}>
                  {isSiembra ? '🌱' : '⏳'}
                </div>
                <div className="timeline-content" style={{ borderLeft: `4px solid ${iconColor}` }}>
                  <h3 style={{ margin: '0 0 8px', color: '#1e293b', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                    {hasRealDate && <span style={{ color: '#10b981', fontSize: '1rem' }}>✓</span>}
                    {title}
                  </h3>
                  
                  <div style={{ position: 'relative' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input 
                        type="date" 
                        disabled={!phase.canAct} 
                        name={fieldName} 
                        value={dateValue} 
                        onChange={handleChange} 
                        onBlur={handleBlurSave} 
                        style={{ flex: 1, padding: '10px', borderRadius: '8px', border: hasRealDate ? `2px solid ${iconColor}` : '1px solid #cbd5e1', textAlign: 'center', fontWeight: 'bold', color: '#1e293b', opacity: phase.canAct ? 1 : 0.5, cursor: phase.canAct ? 'text' : 'not-allowed' }} 
                      />
                      {!dateValue && (
                        <button 
                          onClick={() => handleOpenPhaseModal(fieldName, title, phase.idfasescultivo)} 
                          disabled={!phase.canAct} 
                          style={{ padding: '0 12px', background: phase.canAct ? iconColor : '#cbd5e1', color: 'white', border: 'none', borderRadius: '8px', cursor: phase.canAct ? 'pointer' : 'not-allowed', fontWeight: 'bold', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
                        >
                          ✓ Hoy
                        </button>
                      )}
                    </div>
                    {!phase.canAct && !tInicio && !isSiembra && <div style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '6px', textAlign: 'center' }}>Requiere siembra previa</div>}
                    {!phase.canAct && tInicio && !isSiembra && <div style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '6px', textAlign: 'center' }}>Requiere paso previo</div>}
                    
                    {!!tInicio && !dateValue && renderEstimate(phase.estimatedTime, phase.canAct, phase.duracion, phaseLogic.dynamicPhases[index - 1]?.realTime)}
                  </div>

                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
