'use client';
import React from 'react';

interface CultivoPendingTasksProps {
  cultivo: any;
  avisosCompletados: any[];
  ignoredPautas: number[];
  forcedPautas: number[];
  isSimulating: boolean;
  onMarkDone: (idpauta: number, fase: string, fechaEmision: string | null) => void;
  onIgnore: (idpauta: number) => void;
}

export default function CultivoPendingTasks({
  cultivo,
  avisosCompletados,
  ignoredPautas,
  isSimulating,
  onMarkDone,
  onIgnore
}: CultivoPendingTasksProps) {
  const alertas: any[] = cultivo?.avisos?.alertasPendientes || [];

  const formatFecha = (fechaStr: string | null) => {
    if (!fechaStr) return '';
    const d = new Date(fechaStr);
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getDaysAgo = (fechaStr: string | null) => {
    if (!fechaStr) return null;
    const diff = Math.floor((Date.now() - new Date(fechaStr).getTime()) / 86400000);
    if (diff === 0) return 'Hoy';
    if (diff === 1) return 'Ayer';
    if (diff < 0) return `en ${Math.abs(diff)} días`;
    return `hace ${diff} días`;
  };

  const getTaskIcon = (nombre: string) => {
    if (!nombre) return '🌾';
    if (nombre.includes('Riego')) return '💧';
    if (nombre.includes('Abono') || nombre.includes('Fertiliz')) return '🌿';
    if (nombre.includes('Siembra')) return '🌱';
    if (nombre.includes('Trasplante')) return '🪴';
    if (nombre.includes('Poda')) return '✂️';
    if (nombre.includes('Plaga') || nombre.includes('Tratam')) return '🧪';
    return '🌾';
  };

  const alertasEstancamiento = alertas.filter(a => a.tipo === 'estancamiento');
  const alertasPauta = alertas.filter(a => a.tipo !== 'estancamiento');

  const now = Date.now();
  const getGroup = (fechaStr: string) => {
    const diff = Math.floor((now - new Date(fechaStr).getTime()) / 86400000);
    if (diff >= 7) return 'overdue';
    if (diff >= 0) return 'thisWeek';
    return 'upcoming';
  };

  const pautasOverdue = alertasPauta.filter(a => getGroup(a.fechaEmision) === 'overdue');
  const pautasThisWeek = alertasPauta.filter(a => getGroup(a.fechaEmision) === 'thisWeek');
  const pautasUpcoming = alertasPauta.filter(a => getGroup(a.fechaEmision) === 'upcoming');

  if (alertas.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <div style={{ fontSize: '4rem', marginBottom: '16px' }}>✅</div>
        <h3 style={{ margin: '0 0 8px', color: '#1e293b', fontSize: '1.4rem' }}>¡Al día!</h3>
        <p style={{ margin: 0, color: '#64748b' }}>No hay tareas pendientes para este cultivo en este momento.</p>
      </div>
    );
  }

  const renderAlertaCard = (alerta: any) => {
    const pauta = alerta.pauta;
    const isIgnoredItem = ignoredPautas.includes(pauta?.idlaborespauta);
    const daysAgo = getDaysAgo(alerta.fechaEmision);
    const diff = Math.floor((Date.now() - new Date(alerta.fechaEmision).getTime()) / 86400000);
    const urgencyColor = diff >= 7
      ? { bg: '#fff1f2', border: '#fca5a5', badge: '#dc2626', badgeText: 'URGENTE' }
      : diff >= 0
      ? { bg: '#fffbeb', border: '#fde68a', badge: '#d97706', badgeText: 'PENDIENTE' }
      : { bg: '#f0fdf4', border: '#86efac', badge: '#16a34a', badgeText: 'PRÓXIMO' };

    return (
      <div key={`${pauta?.idlaborespauta}-${alerta.fechaEmision}`} style={{
        background: urgencyColor.bg, border: `1px solid ${urgencyColor.border}`,
        borderRadius: '16px', padding: '20px', display: 'flex', gap: '16px',
        alignItems: 'flex-start', opacity: isIgnoredItem ? 0.5 : 1, transition: 'all 0.2s'
      }}>
        <div style={{ fontSize: '1.8rem', flexShrink: 0 }}>{getTaskIcon(pauta?.laboresnombre || '')}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '6px' }}>
            <h4 style={{ margin: 0, color: '#1e293b', fontSize: '1rem', fontWeight: 700 }}>{pauta?.laboresnombre}</h4>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <span style={{ background: urgencyColor.badge, color: 'white', fontSize: '0.7rem', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold' }}>
                {urgencyColor.badgeText}
              </span>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{formatFecha(alerta.fechaEmision)} ({daysAgo})</span>
            </div>
          </div>
          {pauta?.laboresdescripcion && (
            <p style={{ margin: '0 0 12px', color: '#475569', fontSize: '0.9rem', lineHeight: 1.5 }}>{pauta.laboresdescripcion}</p>
          )}
          {pauta?.laboresnota && (
            <div style={{ background: 'rgba(255,255,255,0.7)', padding: '8px 12px', borderRadius: '8px', marginBottom: '12px', fontSize: '0.85rem', color: '#475569', border: '1px dashed #cbd5e1' }}>
              💡 {pauta.laboresnota}
            </div>
          )}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {!isSimulating && (
              <button
                onClick={() => onMarkDone(pauta.idlaborespauta, pauta.laborespautafase, alerta.fechaEmision)}
                style={{ background: 'linear-gradient(to right, #10b981, #059669)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
              >
                ✓ Completar
              </button>
            )}
            <button
              onClick={() => onIgnore(pauta.idlaborespauta)}
              style={{ background: 'white', color: '#64748b', border: '1px solid #cbd5e1', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}
            >
              {isIgnoredItem ? '↩ Restaurar' : '✕ Ignorar'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const SectionHeader = ({ emoji, title, count, color }: { emoji: string; title: string; count: number; color: string }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '24px 0 12px', padding: '10px 14px', background: `${color}18`, borderRadius: '10px', borderLeft: `4px solid ${color}` }}>
      <span style={{ fontSize: '1.2rem' }}>{emoji}</span>
      <span style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.95rem' }}>{title}</span>
      <span style={{ marginLeft: 'auto', background: color, color: 'white', borderRadius: '12px', padding: '2px 10px', fontSize: '0.8rem', fontWeight: 'bold' }}>{count}</span>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

      {alertasEstancamiento.length > 0 && (
        <>
          <SectionHeader emoji="🚨" title="Diagnóstico de Salud" count={alertasEstancamiento.length} color="#dc2626" />
          {alertasEstancamiento.map((alerta: any) => (
            <div key={alerta.id} style={{ background: 'linear-gradient(135deg, #fff1f2, #ffe4e6)', border: '2px solid #fca5a5', borderRadius: '16px', padding: '20px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
              <div style={{ fontSize: '2rem', flexShrink: 0 }}>⚠️</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                  <h4 style={{ margin: 0, color: '#991b1b', fontSize: '1rem', fontWeight: 800 }}>{alerta.titulo}</h4>
                  <span style={{ background: '#dc2626', color: 'white', fontSize: '0.7rem', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold', whiteSpace: 'nowrap', marginLeft: '8px' }}>ALERTA</span>
                </div>
                <p style={{ margin: 0, color: '#7f1d1d', fontSize: '0.9rem', lineHeight: 1.5 }}>{alerta.descripcion}</p>
              </div>
            </div>
          ))}
        </>
      )}

      {pautasOverdue.length > 0 && (
        <>
          <SectionHeader emoji="🔴" title="Vencidas" count={pautasOverdue.length} color="#dc2626" />
          {pautasOverdue.map(renderAlertaCard)}
        </>
      )}

      {pautasThisWeek.length > 0 && (
        <>
          <SectionHeader emoji="🟡" title="Esta Semana" count={pautasThisWeek.length} color="#d97706" />
          {pautasThisWeek.map(renderAlertaCard)}
        </>
      )}

      {pautasUpcoming.length > 0 && (
        <>
          <SectionHeader emoji="🟢" title="Próximamente" count={pautasUpcoming.length} color="#16a34a" />
          {pautasUpcoming.map(renderAlertaCard)}
        </>
      )}
    </div>
  );
}
