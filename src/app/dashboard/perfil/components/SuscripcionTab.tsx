import React from 'react';
import { useProfileData } from '../hooks/useProfileData';

interface SuscripcionTabProps {
  profileData: ReturnType<typeof useProfileData>;
  showPlanModal: boolean;
  setShowPlanModal: (val: boolean) => void;
  showCompareModal: boolean;
  setShowCompareModal: (val: boolean) => void;
}

export function SuscripcionTab({
  profileData,
  showPlanModal,
  setShowPlanModal,
  showCompareModal,
  setShowCompareModal
}: SuscripcionTabProps) {
  const { profile } = profileData;
  if (!profile) return null;

  let diasRestantes: number | null = null;
  if (profile.fechaCaducidadSuscripcion) {
    const diff = new Date(profile.fechaCaducidadSuscripcion).getTime() - new Date().getTime();
    diasRestantes = Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  const plan = (profile.suscripcion || 'Gratuito').toLowerCase();
  const isPremium = plan === 'premium';
  const isAvanzado = plan === 'avanzado' || plan === 'pro';
  const isEsencial = plan === 'esencial' || plan === 'plus';
  const isGratuito = !isPremium && !isAvanzado && !isEsencial;

  const segments = [
    { key: 'premium',  label: 'Premium',  icon: '🌳', color: '#d97706', bg: '#fffbeb', price: '9,99€' },
    { key: 'avanzado', label: 'Avanzado', icon: '🌿', color: '#2563eb', bg: '#eff6ff', price: '5,99€' },
    { key: 'esencial', label: 'Esencial', icon: '🌱', color: '#059669', bg: '#f0fdf4', price: '2,99€' },
    { key: 'gratuito', label: 'Gratuito', icon: '🌾', color: '#94a3b8', bg: '#f8fafc', price: 'Gratis' },
  ];

  const currentIdx = isPremium ? 0 : isAvanzado ? 1 : isEsencial ? 2 : 3;
  const currentSeg = segments[currentIdx];

  const DAYS_PER_SEG = 30;
  const daysInCurrent = diasRestantes !== null ? Math.min(diasRestantes, DAYS_PER_SEG) : DAYS_PER_SEG;
  const elapsedInCurrent = DAYS_PER_SEG - daysInCurrent;
  const totalTrialDays = DAYS_PER_SEG * 3;
  const globalElapsed = isGratuito ? totalTrialDays : (currentIdx * DAYS_PER_SEG) + elapsedInCurrent;
  const urgentColor = diasRestantes !== null && diasRestantes <= 7 ? '#ef4444' : currentSeg.color;
  const showTimeline = !isGratuito;

  return (
    <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', animation: 'fadeIn 0.3s ease' }}>
      <h3 style={{ margin: '0 0 16px 0', color: '#0f766e', fontSize: '1.1rem', fontWeight: 800 }}>⭐ Mi Suscripción</h3>
      <div className="accordion-body">
        <label className="section-label">Nivel de Suscripción Actual</label>

        {/* ── Timeline de Suscripción ── */}
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: showTimeline ? '18px' : '0', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '2rem' }}>{currentSeg.icon}</span>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1.05rem', color: currentSeg.color, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  Plan {currentSeg.label}
                  {profile.esPrueba && <span style={{ fontSize: '0.68rem', background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: '10px', fontWeight: 700 }}>PERIODO DE PRUEBA</span>}
                </div>
                {!isGratuito && <small style={{ color: '#94a3b8', fontSize: '0.78rem' }}>{currentSeg.price}/mes</small>}
              </div>
            </div>
            {diasRestantes !== null && diasRestantes >= 0 && profile.fechaCaducidadSuscripcion && (
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{profile.esPrueba ? 'Baja al siguiente el' : 'Expira el'}</div>
                <div style={{ fontWeight: 700, color: urgentColor, fontSize: '0.95rem' }}>
                  {new Date(profile.fechaCaducidadSuscripcion).toLocaleDateString('es-ES')}
                </div>
                <div style={{ fontSize: '0.72rem', color: urgentColor, fontWeight: 600 }}>
                  {diasRestantes === 1 ? '1 día' : `${diasRestantes} días`}
                  {segments[currentIdx + 1] && <span style={{ fontWeight: 400, color: '#94a3b8' }}>{' '}para bajar a {segments[currentIdx + 1].label}</span>}
                </div>
              </div>
            )}
          </div>
          {showTimeline && (() => {
            const BLOCKS = 30;
            const daysLeft = Math.max(0, Math.min(diasRestantes ?? BLOCKS, BLOCKS));

            // Calcular fechas de transición desde la fecha de caducidad actual
            const expiry = profile.fechaCaducidadSuscripcion ? new Date(profile.fechaCaducidadSuscripcion) : null;
            const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86400000);
            const fmt = (d: Date | null) => d ? d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) : '';

            // Fechas cuando cada plan termina (= empieza el siguiente)
            const datePremEnd   = isPremium   ? expiry         : isAvanzado ? (expiry ? addDays(expiry, -30) : null) : isEsencial ? (expiry ? addDays(expiry, -60) : null) : null;
            const dateAvzEnd    = isPremium   ? (expiry ? addDays(expiry,  30) : null) : isAvanzado ? expiry : isEsencial ? (expiry ? addDays(expiry, -30) : null) : null;
            const dateEsEnd     = isPremium   ? (expiry ? addDays(expiry,  60) : null) : isAvanzado ? (expiry ? addDays(expiry,  30) : null) : isEsencial ? expiry : null;

            const segDates = [datePremEnd, dateAvzEnd, dateEsEnd];

            return (
              <div style={{ marginTop: '4px' }}>
                {/* Grupos de bloques */}
                <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-start', overflowX: 'auto', paddingBottom: '4px' }}>
                  {segments.slice(0, 3).map((seg, segIdx) => {
                    const isPast    = segIdx < currentIdx;
                    const isCurrent = segIdx === currentIdx;
                    return (
                      <div key={seg.key} style={{ flex: 1, minWidth: '100px' }}>
                        {/* Icono + label */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '5px' }}>
                          <span style={{ fontSize: '0.9rem', opacity: isPast ? 0.3 : 1 }}>{seg.icon}</span>
                          <span style={{ fontSize: '0.62rem', fontWeight: isCurrent ? 800 : 500, color: isCurrent ? seg.color : '#94a3b8', opacity: isPast ? 0.4 : 1 }}>{seg.label}</span>
                        </div>
                        {/* 30 bloques */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px' }}>
                          {Array.from({ length: BLOCKS }).map((_, dayIdx) => {
                            const globalIdx = segIdx * 30 + dayIdx;
                            const lightness = 30 + (globalIdx / 89) * 50;
                            const bg = `hsl(142, 76%, ${lightness}%)`;
                            let opacity: number;
                            if (isPast) {
                              opacity = 0.1;
                            } else if (isCurrent) {
                              const elapsed = BLOCKS - daysLeft;
                              opacity = dayIdx < elapsed ? 0.12 : 1;
                            } else {
                              opacity = 0.25;
                            }
                            return (
                              <div key={dayIdx} style={{
                                width: 'calc((100% - 58px) / 30)',
                                minWidth: '3px',
                                height: '12px',
                                borderRadius: '2px',
                                background: bg,
                                opacity,
                                transition: 'opacity 0.3s ease',
                                flexShrink: 0,
                              }} />
                            );
                          })}
                        </div>
                        {/* Fechas inicio (izq) y fin (der) del segmento */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                          <div style={{ fontSize: '0.58rem', color: '#64748b', fontWeight: 500, opacity: segIdx === 0 ? 1 : 0 }}>
                            {segIdx === 0 ? fmt(expiry ? addDays(expiry, -(currentIdx + 1) * 30) : null) : ''}
                          </div>
                          {segDates[segIdx] ? (
                            <div style={{ fontSize: '0.58rem', color: '#64748b', fontWeight: 500, textAlign: 'right' }}>
                              {fmt(segDates[segIdx])}
                            </div>
                          ) : <div />}
                        </div>
                      </div>
                    );
                  })}
                  {/* Gratuito permanente */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', paddingTop: '2px', minWidth: '36px' }}>
                    <span style={{ fontSize: '1rem', opacity: 0.7 }}>{segments[3].icon}</span>
                    <span style={{ fontSize: '0.55rem', color: '#94a3b8', fontWeight: 600, textAlign: 'center', lineHeight: 1.2, marginTop: '2px' }}>Gratis<br/>perm.</span>
                    {dateEsEnd && (
                      <div style={{ fontSize: '0.55rem', color: '#64748b', marginTop: '4px', textAlign: 'center', fontWeight: 500 }}>
                        {fmt(dateEsEnd)}
                      </div>
                    )}
                  </div>
                </div>
                {/* Leyenda */}
                <div style={{ fontSize: '0.7rem', color: '#94a3b8', textAlign: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '8px', marginTop: '10px' }}>
                  {profile.esPrueba
                    ? '🎁 3 meses gratuitos · Premium → Avanzado → Esencial → Gratuito (permanente)'
                    : '🔄 Si no renuevas: → Avanzado (1 mes) → Esencial (1 mes) → Gratuito (permanente)'}
                </div>
              </div>
            );
          })()}
        </div>

        <div style={{ marginTop: '16px', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          <button 
            type="button" 
            className="btn btn-primary"
            onClick={() => setShowPlanModal(true)}
          >
            ⚙️ Gestionar mi plan
          </button>
          <button 
            type="button" 
            className="btn btn-ghost"
            onClick={() => setShowCompareModal(true)}
          >
            📊 Comparar planes
          </button>
        </div>

        {/* ═══ MODAL: GESTIONAR PLAN ═══ */}
        {showPlanModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(2,6,23,0.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div style={{ background: 'white', borderRadius: '20px', width: '100%', maxWidth: '520px', overflow: 'hidden', boxShadow: '0 25px 60px rgba(0,0,0,0.35)' }}>
              {/* Header */}
              <div style={{ background: 'linear-gradient(135deg, #1e3a8a, #2563eb)', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ color: 'white', margin: 0, fontWeight: 800, fontSize: '1.1rem' }}>⚙️ Gestionar mi Plan</h3>
                <button onClick={() => setShowPlanModal(false)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', borderRadius: '8px', padding: '4px 10px', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
              </div>
              {/* Body */}
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Plan actual */}
                <div style={{ padding: '14px', background: '#f0f9ff', borderRadius: '12px', border: '1px solid #bae6fd', marginBottom: '4px' }}>
                  <div style={{ fontSize: '0.78rem', color: '#0369a1', fontWeight: 600, marginBottom: '4px' }}>PLAN ACTUAL</div>
                  <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0c4a6e' }}>{profile.suscripcion || 'Gratuito'}{profile.esPrueba ? ' (Prueba)' : ''}</div>
                  {profile.fechaCaducidadSuscripcion && diasRestantes !== null && <small style={{ color: '#0369a1' }}>{diasRestantes >= 0 ? `Quedan ${diasRestantes} días` : 'Periodo finalizado'}</small>}
                </div>
                {/* Opciones de upgrade */}
                {[{ plan: 'Esencial', price: '2,99 €/mes', icon: '🌱', color: '#059669', features: ['Hasta 20 semillas/especies activas', '2 fotos de perfil', 'Hasta 2 fotos por galería/labor', 'Calendario Lunar Simple'] },
                  { plan: 'Avanzado', price: '5,99 €/mes', icon: '🌿', color: '#2563eb', features: ['Hasta 50 semillas/especies activas', '3 fotos de perfil', 'Hasta 3 fotos por galería/labor', 'Chat Básico IA (Consultas limitadas)', 'Calendario Lunar y Biodinámico Básico'] },
                  { plan: 'Premium', price: '9,99 €/mes', icon: '🌳', color: '#d97706', features: ['Semillas/especies activas ilimitadas', '4 fotos de perfil', 'Hasta 4 fotos por galería/labor', 'Acceso ilimitado al Chat IA y generación', 'Calendarios completos (Agrícola, Biodinámico Avanzado e IA)'] },
                ].map(({ plan: pName, price, icon, color, features }) => (
                  <div key={pName} style={{ padding: '14px', borderRadius: '12px', border: `1.5px solid ${color}30`, background: `${color}08`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                    <div>
                      <div style={{ fontWeight: 700, color, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>{icon}</span> {pName}
                      </div>
                      <ul style={{ margin: '4px 0 0', padding: '0 0 0 16px', fontSize: '0.75rem', color: '#64748b' }}>
                        {features.map(f => <li key={f}>{f}</li>)}
                      </ul>
                    </div>
                    <button
                      style={{ background: color, color: 'white', border: 'none', borderRadius: '10px', padding: '8px 14px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', fontSize: '0.82rem' }}
                      onClick={() => { alert(`👄 Funcionalidad de pago en desarrollo. Plan: ${pName} — ${price}`); }}
                    >
                      {price}
                    </button>
                  </div>
                ))}
                {/* Cancelar (solo si es de pago) */}
                {profile.suscripcion && !profile.esPrueba && !['gratuito','free'].includes((profile.suscripcion || '').toLowerCase()) && (
                  <button style={{ background: 'none', border: '1px solid #fca5a5', color: '#ef4444', borderRadius: '10px', padding: '8px', cursor: 'pointer', fontSize: '0.8rem', marginTop: '4px' }}
                    onClick={() => { if (confirm('¿Seguro que quieres cancelar tu suscripción de pago?')) { alert('Solicitud enviada. El equipo de soporte procesará la cancelación.'); setShowPlanModal(false); } }}
                  >
                    Cancelar suscripción de pago
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═══ MODAL: COMPARAR PLANES ═══ */}
        {showCompareModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(2,6,23,0.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div style={{ background: 'white', borderRadius: '20px', width: '100%', maxWidth: '780px', maxHeight: '85vh', overflow: 'auto', boxShadow: '0 25px 60px rgba(0,0,0,0.35)' }}>
              <div style={{ background: 'linear-gradient(135deg, #1e3a8a, #2563eb)', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0 }}>
                <h3 style={{ color: 'white', margin: 0, fontWeight: 800, fontSize: '1.1rem' }}>📊 Comparar Planes Verdantia</h3>
                <button onClick={() => setShowCompareModal(false)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', borderRadius: '8px', padding: '4px 10px', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
              </div>
              <div style={{ padding: '24px', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr>
                      {[{ label: 'Característica', color: '#f8fafc', textColor: '#64748b' },
                        { label: '🌾 Gratuito\n0 €', color: '#f8fafc', textColor: '#64748b' },
                        { label: '🌱 Esencial\n2,99 €/mes', color: '#f0fdf4', textColor: '#059669' },
                        { label: '🌿 Avanzado\n5,99 €/mes', color: '#eff6ff', textColor: '#2563eb' },
                        { label: '🌳 Premium\n9,99 €/mes', color: '#fffbeb', textColor: '#d97706' },
                      ].map(({ label: thLabel, color, textColor }, i) => (
                        <th key={i} style={{ background: color, color: textColor, padding: '10px 12px', textAlign: i === 0 ? 'left' : 'center', fontWeight: 700, borderBottom: '2px solid #e2e8f0', whiteSpace: 'pre-line', fontSize: i === 0 ? '0.78rem' : '0.82rem' }}>{thLabel}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['Fotos de perfil', '1', '2', '3', '4'],
                      ['Semillas/especies activas', '5', '20', '50', 'Ilimitadas'],
                      ['Fotos por galería/labor', '1', '2', '3', '4'],
                      ['Chat IA y generación', '❌', '❌', 'Básico (Limitado)', 'Ilimitado'],
                      ['Calendario Lunar', '❌', '✅ (Simple)', '✅ (Básico)', '✅ (Completo)'],
                      ['Calendario Biodinámico', '❌', '❌', '✅ (Básico)', '✅ (Avanzado e IA)'],
                      ['Soporte prioritario', '❌', '❌', '✅', '✅'],
                      ['Sin publicidad', '❌', '✅', '✅', '✅'],
                    ].map((row, i) => (
                      <tr key={i} style={{ background: i % 2 === 0 ? '#f8fafc' : 'white' }}>
                        {row.map((cell, j) => (
                          <td key={j} style={{ padding: '9px 12px', textAlign: j === 0 ? 'left' : 'center', borderBottom: '1px solid #f1f5f9', color: j === 0 ? '#1e293b' : (cell === '❌' ? '#94a3b8' : (cell === '✅' ? '#059669' : '#334155')), fontWeight: j === 4 ? 600 : (j === 0 ? 600 : 400) }}>{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ marginTop: '20px', padding: '14px', background: '#fffbeb', borderRadius: '10px', border: '1px solid #fde68a', fontSize: '0.82rem', color: '#92400e', lineHeight: 1.7 }}>
                  🎁 <strong>¡3 meses gratuitos al verificar tu correo!</strong> — Sin tarjeta de crédito.<br />
                  <span style={{ opacity: 0.85 }}>Mes 1: Premium completo · Mes 2: Avanzado · Mes 3: Esencial · Mes 4 en adelante: Gratuito permanente.</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
