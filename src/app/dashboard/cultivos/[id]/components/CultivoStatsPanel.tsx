'use client';
import React, { useEffect, useState } from 'react';

interface CultivoStatsPanelProps {
  cultivo: any;
  formData: any;
  userEmail?: string;
}

export default function CultivoStatsPanel({ cultivo, formData, userEmail }: CultivoStatsPanelProps) {
  const isFinished = ['finalizado', 'recoleccion'].includes(formData.cultivosestado);
  const [historicos, setHistoricos] = useState<any[]>([]);

  useEffect(() => {
    if (!isFinished || !userEmail || !cultivo?.xcultivosidvariedades) return;
    // Buscar ciclos anteriores de la misma variedad finalizados
    fetch(`/api/user/cultivos?estado=finalizado&variedadId=${cultivo.xcultivosidvariedades}`, {
      headers: { 'x-user-email': userEmail }
    })
      .then(r => r.json())
      .then(data => {
        const lista = (data.cultivos || []).filter((c: any) =>
          c.idcultivos !== cultivo.idcultivos && c.cultivosfechainicio && (c.cultivosfechafinalizacion || c.cultivosfecharecoleccion)
        );
        setHistoricos(lista);
      })
      .catch(() => {});
  }, [isFinished, userEmail, cultivo]);

  if (!isFinished || !formData.cultivosfechainicio) return null;

  const DAY_MS = 86400000;
  const parseDate = (s: string) => s ? new Date(s).getTime() : null;

  const tSiembra = parseDate(formData.cultivosfechainicio);
  const tGerm = parseDate(formData.cultivosfechagerminacion);
  const tTras = parseDate(formData.cultivosfechatrasplante);
  const tCrec = parseDate(formData.cultivosfechacrecimiento);
  const tFruc = parseDate(formData.cultivosfechafructificacion);
  const tReco = parseDate(formData.cultivosfecharecoleccion);
  const tFin = parseDate(formData.cultivosfechafinalizacion);
  const endDate = tFin || tReco || Date.now();

  const totalDays = tSiembra ? Math.floor((endDate - tSiembra) / DAY_MS) : 0;

  const estGerm = cultivo?.dias_germinacion || 0;
  const estTotal = cultivo?.duracion_total || 0;
  const efficiencyPct = estTotal > 0 ? Math.round((totalDays / estTotal) * 100) : null;

  const phases = [
    { name: 'Germinación', icon: '🌱', real: tGerm && tSiembra ? Math.floor((tGerm - tSiembra) / DAY_MS) : null, est: estGerm },
    { name: 'Trasplante', icon: '🪴', real: tTras && (tGerm || tSiembra) ? Math.floor((tTras - (tGerm || tSiembra!)) / DAY_MS) : null, est: Math.max(0, (cultivo?.dias_trasplante || 0) - estGerm) },
    { name: 'Crecimiento', icon: '🌿', real: tCrec && tTras ? Math.floor((tCrec - tTras) / DAY_MS) : null, est: null },
    { name: 'Fructificación', icon: '🌸', real: tFruc && tCrec ? Math.floor((tFruc - tCrec) / DAY_MS) : null, est: Math.max(0, (cultivo?.dias_fructificacion || 0) - (cultivo?.dias_crecimiento || 0)) },
    { name: 'Recolección', icon: '🧺', real: tReco && tFruc ? Math.floor((tReco - tFruc) / DAY_MS) : null, est: Math.max(0, (cultivo?.dias_recoleccion || 0) - (cultivo?.dias_fructificacion || 0)) },
  ].filter(p => p.real !== null);

  const harvestMatch = (formData.cultivosobservaciones || '').match(/\[🏆 Cosecha: ([^\]]+)\]/);
  const ratingMatch = (formData.cultivosobservaciones || '').match(/\[⭐ (\d)\/5\]/);
  const harvestAmount = harvestMatch?.[1] || null;
  const harvestRating = ratingMatch ? parseInt(ratingMatch[1]) : null;

  const getEfficiencyLabel = () => {
    if (!efficiencyPct) return null;
    if (efficiencyPct <= 90) return { text: '🚀 Más rápido de lo esperado', color: '#16a34a', bg: '#dcfce7' };
    if (efficiencyPct <= 115) return { text: '✅ Ciclo muy eficiente', color: '#0369a1', bg: '#e0f2fe' };
    if (efficiencyPct <= 140) return { text: '⏳ Ligeramente por encima', color: '#92400e', bg: '#fef3c7' };
    return { text: '⚠️ Ciclo más largo de lo habitual', color: '#991b1b', bg: '#fee2e2' };
  };

  const effLabel = getEfficiencyLabel();

  // Comparativa histórica
  const avgDays = historicos.length > 0
    ? Math.round(historicos.reduce((acc: number, c: any) => {
        const s = new Date(c.cultivosfechainicio).getTime();
        const e = new Date(c.cultivosfechafinalizacion || c.cultivosfecharecoleccion).getTime();
        return acc + Math.floor((e - s) / DAY_MS);
      }, 0) / historicos.length)
    : null;
  const diffVsAvg = avgDays ? totalDays - avgDays : null;

  return (
    <div style={{ background: 'linear-gradient(135deg, #0f172a, #1e3a5f)', borderRadius: '20px', padding: '28px', marginBottom: '32px', color: 'white', boxShadow: '0 20px 40px -12px rgba(0,0,0,0.4)' }}>
      <h2 style={{ margin: '0 0 24px', fontSize: '1.4rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
        🏆 Resumen del Ciclo
        {harvestRating && (
          <span style={{ marginLeft: 'auto', fontSize: '1.2rem' }}>
            {Array.from({ length: harvestRating }, (_, i) => <span key={i}>⭐</span>)}
          </span>
        )}
      </h2>

      {/* Métricas principales */}
      <div className="cultivo-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#34d399' }}>{totalDays}</div>
          <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>Días totales</div>
          {estTotal > 0 && <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>Estimado: {estTotal} días</div>}
        </div>
        <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#a78bfa' }}>{phases.length}</div>
          <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>Fases registradas</div>
        </div>
        {harvestAmount && (
          <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fbbf24' }}>{harvestAmount}</div>
            <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>Cosecha</div>
          </div>
        )}
        {efficiencyPct && (
          <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 900, color: efficiencyPct <= 115 ? '#34d399' : '#fbbf24' }}>{efficiencyPct}%</div>
            <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>del tiempo estimado</div>
          </div>
        )}
      </div>

      {effLabel && (
        <div style={{ background: effLabel.bg, color: effLabel.color, padding: '10px 16px', borderRadius: '10px', fontWeight: 700, fontSize: '0.9rem', marginBottom: '20px', textAlign: 'center' }}>
          {effLabel.text} — {totalDays} días reales vs {estTotal} estimados
        </div>
      )}

      {/* Timeline de fases reales */}
      {phases.length > 0 && (
        <div style={{ marginBottom: historicos.length > 0 ? '24px' : '0' }}>
          <h4 style={{ margin: '0 0 12px', color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Duración Real por Fase</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {phases.map(phase => {
              const ratio = phase.est > 0 ? (phase.real! / phase.est) : 1;
              const barColor = ratio <= 1.1 ? '#34d399' : ratio <= 1.4 ? '#fbbf24' : '#f87171';
              const barPct = Math.min(100, (phase.real! / (phase.est || phase.real!)) * 100);
              return (
                <div key={phase.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.85rem' }}>
                    <span>{phase.icon} {phase.name}</span>
                    <span style={{ color: barColor, fontWeight: 700 }}>
                      {phase.real} días{phase.est > 0 ? ` / ${phase.est} est.` : ''}
                    </span>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
                    <div style={{ width: `${barPct}%`, height: '100%', background: barColor, borderRadius: '4px', transition: 'width 1s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Comparativa Histórica */}
      {historicos.length > 0 && avgDays && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '20px' }}>
          <h4 style={{ margin: '0 0 14px', color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            📊 Comparativa con Ciclos Anteriores ({historicos.length} ciclo{historicos.length !== 1 ? 's' : ''})
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '14px' }}>
            <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#34d399' }}>{totalDays}d</div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.55)' }}>Este ciclo</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#94a3b8' }}>{avgDays}d</div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.55)' }}>Media histórica</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: diffVsAvg! <= 0 ? '#34d399' : '#fbbf24' }}>
                {diffVsAvg! <= 0 ? `−${Math.abs(diffVsAvg!)}d` : `+${diffVsAvg!}d`}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.55)' }}>vs. media</div>
            </div>
          </div>
          <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', textAlign: 'center', fontStyle: 'italic' }}>
            {diffVsAvg! < -5
              ? '🚀 Tu mejor ciclo hasta la fecha'
              : diffVsAvg! > 10
              ? '📝 Revisa tus condiciones para optimizar el siguiente'
              : '✅ Rendimiento consistente con tus ciclos anteriores'}
          </div>
        </div>
      )}
    </div>
  );
}
