import React from 'react';

interface CalendariosTabProps {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  autoSaveFases: (fases: any) => Promise<void>;
  masterFases: any[];
  MESES: Array<{ val: number; label: string }>;
  isMobile: boolean;
  CALENDAR_MIN_WIDTH: number;
  activeTab: string;
}

export default function CalendariosTab({
  formData,
  setFormData,
  handleChange,
  autoSaveFases,
  masterFases,
  MESES,
  isMobile,
  CALENDAR_MIN_WIDTH,
  activeTab
}: CalendariosTabProps) {
  return (
    <div className="grid-form" style={{ display: activeTab === 'fases' ? 'grid' : 'none' }}>
      <div className="form-group full" style={{ padding: '20px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#1e293b', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          ⏳ Tiempos Estimados (Días)
        </h3>
        <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '20px' }}>
          Indica los días reales que dura cada fase para esta especie concreta. El sistema las encadenará automáticamente para calcular las fechas estimadas del cultivo. Deja en 0 las fases que no apliquen.
        </p>

        {/* Tiempos de Preparación del Terreno (según laboreo) */}
        <div style={{
          background: '#f1f5f9',
          border: '1px solid #cbd5e1',
          borderRadius: '10px',
          padding: '16px',
          marginBottom: '20px'
        }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#334155', fontSize: '0.95rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
            🚜 Preparación del Terreno (según tipo de laboreo)
          </h4>
          <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0 0 14px 0' }}>
            Establece los días de preparación del suelo según la técnica de laboreo a emplear.
          </p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '12px' }}>
            <div className="form-group" style={{ margin: 0, padding: '12px', background: '#fff', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
              <label style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '1.2rem' }}>🚜</span>
                <span style={{ color: '#475569' }}>Prep. Convencional</span>
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                <input 
                  type="number" 
                  min="0"
                  name="especiespreparacionconvencional"
                  placeholder="Días"
                  value={formData.especiespreparacionconvencional || ''} 
                  onChange={handleChange}
                  style={{ flex: 1 }}
                />
                <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>días</span>
              </div>
            </div>

            <div className="form-group" style={{ margin: 0, padding: '12px', background: '#fff', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
              <label style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '1.2rem' }}>⛏️</span>
                <span style={{ color: '#475569' }}>Prep. Mínimo</span>
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                <input 
                  type="number" 
                  min="0"
                  name="especiespreparacionminima"
                  placeholder="Días"
                  value={formData.especiespreparacionminima || ''} 
                  onChange={handleChange}
                  style={{ flex: 1 }}
                />
                <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>días</span>
              </div>
            </div>

            <div className="form-group" style={{ margin: 0, padding: '12px', background: '#fff', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
              <label style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '1.2rem' }}>🌱</span>
                <span style={{ color: '#475569' }}>Prep. No Laboreo</span>
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                <input 
                  type="number" 
                  min="0"
                  name="especiespreparacionnolaboreo"
                  placeholder="Días"
                  value={formData.especiespreparacionnolaboreo || ''} 
                  onChange={handleChange}
                  style={{ flex: 1 }}
                />
                <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>días</span>
              </div>
            </div>
          </div>
        </div>

        {/* Resto de Fases del Cultivo */}
        <div style={{ marginBottom: '30px' }}>
          <h4 style={{ margin: '0 0 12px 0', color: '#334155', fontSize: '0.95rem', fontWeight: 'bold' }}>
            🌱 Fases del Ciclo de Vida
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 250px), 1fr))', gap: '15px' }}>
            {masterFases
              .filter(f => f.fasescultivotipo === 'Fase' && f.fasescultivoclave !== 'planificacion')
              .map(fase => (
                <div key={fase.idfasescultivo} className="form-group" style={{ margin: 0, padding: '12px', background: '#fff', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                  <label style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '1.2rem' }}>{fase.fasescultivoicono}</span>
                    <span style={{ color: fase.fasescultivocolor }}>{fase.fasescultivonombre}</span>
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                    <input 
                      type="number" 
                      min="0"
                      placeholder="Días"
                      value={formData.fases_duracion?.[fase.idfasescultivo] || ''} 
                      onChange={(e) => {
                        setFormData((prev: any) => ({
                          ...prev,
                          fases_duracion: {
                            ...prev.fases_duracion,
                            [fase.idfasescultivo]: e.target.value
                          }
                        }));
                      }}
                      onBlur={() => autoSaveFases(formData.fases_duracion)}
                      style={{ flex: 1 }}
                    />
                    <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>días</span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* SECCIÓN CALENDARIOS ANUALES (Meses) */}
        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '25px', marginTop: '20px' }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#1e293b', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            📅 Calendario Anual (Temporadas)
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: '10px', marginBottom: '20px' }}>
            {['semillero', 'siembradirecta', 'trasplante', 'recoleccion'].map(tipo => {
              const colorMap: Record<string, string> = {
                siembradirecta: '#f97316',
                semillero: '#3b82f6',
                trasplante: '#a855f7',
                recoleccion: '#22c55e'
              };
              const labelMap: Record<string, string> = {
                siembradirecta: 'Siembra Directa',
                semillero: 'Semillero',
                trasplante: 'Trasplante',
                recoleccion: 'Recolección'
              };
              return (
                <div key={tipo} style={{ background: '#fff', padding: '15px', borderRadius: '8px', borderTop: `4px solid ${colorMap[tipo]}`, borderLeft: '1px solid #cbd5e1', borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <strong style={{ display: 'block', marginBottom: '10px', fontSize: '0.95rem', color: '#334155' }}>{labelMap[tipo]}</strong>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <select
                      name={tipo === 'trasplante' ? `especies${tipo}desde` : `especiesfecha${tipo}desde`}
                      value={formData[tipo === 'trasplante' ? `especies${tipo}desde` : `especiesfecha${tipo}desde`] || ''}
                      onChange={handleChange}
                      style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                    >
                      <option value="">Desde (Mes)...</option>
                      {MESES.map(m => <option key={m.val} value={m.val}>{m.label}</option>)}
                    </select>
                    <select
                      name={tipo === 'trasplante' ? `especies${tipo}hasta` : `especiesfecha${tipo}hasta`}
                      value={formData[tipo === 'trasplante' ? `especies${tipo}hasta` : `especiesfecha${tipo}hasta`] || ''}
                      onChange={handleChange}
                      style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                    >
                      <option value="">Hasta (Mes)...</option>
                      {MESES.map(m => <option key={m.val} value={m.val}>{m.label}</option>)}
                    </select>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: '20px' }}>
            <h4 style={{ fontSize: '1.1rem', color: '#334155', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', marginBottom: '15px' }}>
              📊 Gráfico del Calendario de Cultivo
            </h4>

            <div style={{ overflowX: 'auto', width: '100%' }}>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden', minWidth: CALENDAR_MIN_WIDTH }}>
                <div style={{ display: 'grid', gridTemplateColumns: '70px repeat(12, 1fr)', background: '#f1f5f9', borderBottom: '1px solid #e2e8f0' }}>
                  <div style={{ padding: '8px 4px', fontWeight: 'bold', color: '#64748b', fontSize: '0.7rem', borderRight: '1px solid #e2e8f0', textAlign: 'center' }}>FASE</div>
                  {MESES.map(m => (
                    <div key={m.val} style={{ padding: '8px 0', textAlign: 'center', fontWeight: 'bold', color: '#475569', fontSize: '0.7rem', borderRight: m.val < 12 ? '1px solid #e2e8f0' : 'none' }}>
                      {isMobile ? m.label.charAt(0) : m.label}
                    </div>
                  ))}
                </div>

                {['semillero', 'siembradirecta', 'trasplante', 'recoleccion'].map((tipo, idx) => {
                  const colorMap: Record<string, string> = { siembradirecta: '#f97316', semillero: '#3b82f6', trasplante: '#a855f7', recoleccion: '#22c55e' };
                  const labelMap: Record<string, string> = { siembradirecta: 'Siembra', semillero: 'Semillero', trasplante: 'Traspl.', recoleccion: 'Recol.' };

                  const desde = parseInt(formData[tipo === 'trasplante' ? `especies${tipo}desde` : `especiesfecha${tipo}desde`]) || 0;
                  const hasta = parseInt(formData[tipo === 'trasplante' ? `especies${tipo}hasta` : `especiesfecha${tipo}hasta`]) || 0;

                  const isMonthActive = (m: number) => {
                    if (!desde || !hasta) return false;
                    if (desde <= hasta) return m >= desde && m <= hasta;
                    return m >= desde || m <= hasta;
                  };

                  return (
                    <div key={tipo} style={{ display: 'grid', gridTemplateColumns: '70px repeat(12, 1fr)', borderBottom: idx < 3 ? '1px solid #e2e8f0' : 'none', background: '#fff' }}>
                      <div style={{ padding: '8px 4px', fontSize: '0.65rem', fontWeight: 'bold', color: '#334155', borderRight: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: colorMap[tipo], flexShrink: 0 }}></span>
                        {labelMap[tipo]}
                      </div>
                      {MESES.map(m => {
                        const active = isMonthActive(m.val);
                        return (
                          <div key={m.val} style={{
                            padding: '8px 0',
                            borderRight: m.val < 12 ? '1px dashed #e2e8f0' : 'none',
                            background: active ? `${colorMap[tipo]}20` : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            {active && <div style={{ width: '100%', height: '10px', background: colorMap[tipo], borderRadius: '2px', margin: '0 1px' }}></div>}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
