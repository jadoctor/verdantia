'use client';
import React, { useMemo } from 'react';
import { useCultivoPhases } from '../hooks/useCultivoPhases';

interface CultivoGanttProps {
  cultivo: any;
  formData: any;
}

interface GanttPhase {
  name: string;
  icon: string;
  color: string;
  realDays: number;
  estDays: number | null;
  startOffset: number;
}

export default function CultivoGantt({ cultivo, formData }: CultivoGanttProps) {
  const phaseLogic = useCultivoPhases(cultivo, false, 0);

  const ganttPhases = useMemo(() => {
    if (!phaseLogic || !phaseLogic.dynamicPhases || phaseLogic.dynamicPhases.length === 0) return [];

    const { dynamicPhases, tInicio } = phaseLogic;
    if (!tInicio) return [];

    const DAY_MS = 86400000;
    const result: GanttPhase[] = [];
    const colors = ['#22c55e', '#06b6d4', '#10b981', '#3b82f6', '#ec4899', '#f97316', '#eab308', '#8b5cf6'];

    for (let i = 0; i < dynamicPhases.length - 1; i++) {
      const from = dynamicPhases[i];
      const to = dynamicPhases[i + 1];

      if (!from.realTime) continue; // If this phase hasn't started, we don't show it in the completed Gantt

      // Real start of this phase
      const startT = from.realTime;
      // Real end of this phase is the start of the next phase, or NOW if it hasn't finished
      const endT = to.realTime ? to.realTime : Math.max(startT, Date.now());

      const realDays = Math.max(1, Math.floor((endT - startT) / DAY_MS));
      const startOffset = Math.max(0, Math.floor((startT - tInicio) / DAY_MS));
      const estDays = from.duracion > 0 ? from.duracion : null;

      result.push({
        name: from.fasescultivonombre,
        icon: i === 0 ? '🌱' : '⏳', // Simplification, could map icons
        color: colors[i % colors.length],
        realDays,
        estDays,
        startOffset
      });
      
      // Stop rendering if we reached the current active phase
      if (!to.realTime) break;
    }

    return result;
  }, [phaseLogic]);

  if (ganttPhases.length === 0) return null;

  const totalDays = ganttPhases.reduce((acc, p) => acc + p.realDays, 0);
  const maxDays = Math.max(totalDays, ...(ganttPhases.map(p => (p.startOffset + (p.estDays || p.realDays)))));

  return (
    <div style={{
      background: 'white', borderRadius: '16px', padding: '24px',
      border: '1px solid #e2e8f0', marginBottom: '24px',
      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
    }}>
      <h3 style={{ margin: '0 0 20px', fontSize: '1.1rem', color: '#1e293b', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
        📊 Diagrama del Ciclo de Vida
        <span style={{ fontSize: '0.8rem', fontWeight: 400, color: '#94a3b8' }}>({totalDays} días)</span>
      </h3>

      {/* Leyenda */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', fontSize: '0.75rem', color: '#64748b' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: '12px', height: '8px', borderRadius: '2px', background: '#10b981', display: 'inline-block' }} /> Real
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: '12px', height: '8px', borderRadius: '2px', background: '#10b981', opacity: 0.25, display: 'inline-block', border: '1px dashed #10b981' }} /> Estimado
        </span>
      </div>

      {/* Barras */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {ganttPhases.map((phase, idx) => {
          const realPct = Math.max(4, (phase.realDays / maxDays) * 100);
          const estPct = phase.estDays ? Math.max(4, (phase.estDays / maxDays) * 100) : null;
          const ratio = phase.estDays ? phase.realDays / phase.estDays : 1;
          const statusColor = ratio <= 1.1 ? '#16a34a' : ratio <= 1.4 ? '#ca8a04' : '#dc2626';

          return (
            <div key={idx}>
              {/* Label */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {phase.icon} {phase.name}
                </span>
                <span style={{ fontSize: '0.8rem', color: statusColor, fontWeight: 700 }}>
                  {phase.realDays}d
                  {phase.estDays && phase.estDays !== phase.realDays && (
                    <span style={{ color: '#94a3b8', fontWeight: 400 }}> / {phase.estDays}d est.</span>
                  )}
                </span>
              </div>

              {/* Bar real */}
              <div style={{ position: 'relative', height: '20px' }}>
                {/* Estimado (fondo) */}
                {estPct && (
                  <div style={{
                    position: 'absolute', top: '2px', left: 0,
                    width: `${estPct}%`, height: '16px',
                    background: `${phase.color}18`,
                    border: `1px dashed ${phase.color}50`,
                    borderRadius: '4px'
                  }} />
                )}
                {/* Real (primer plano) */}
                <div style={{
                  position: 'absolute', top: '0', left: 0,
                  width: `${realPct}%`, height: '20px',
                  background: `linear-gradient(90deg, ${phase.color}, ${phase.color}cc)`,
                  borderRadius: '6px',
                  boxShadow: `0 2px 4px ${phase.color}40`,
                  transition: 'width 1s ease',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <span style={{ fontSize: '0.65rem', color: 'white', fontWeight: 700, textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
                    {phase.realDays}d
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Resumen visual: barra continua de todas las fases */}
      <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
        <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '8px', fontWeight: 600 }}>Vista continua</div>
        <div style={{ display: 'flex', height: '28px', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.08)' }}>
          {ganttPhases.map((phase, idx) => (
            <div
              key={idx}
              title={`${phase.icon} ${phase.name}: ${phase.realDays} días`}
              style={{
                flex: phase.realDays,
                background: phase.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.7rem', color: 'white', fontWeight: 700,
                borderRight: idx < ganttPhases.length - 1 ? '1px solid rgba(255,255,255,0.4)' : 'none',
                cursor: 'default', transition: 'flex 0.8s ease'
              }}
            >
              {phase.realDays > (totalDays * 0.08) ? `${phase.icon} ${phase.realDays}d` : phase.icon}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
