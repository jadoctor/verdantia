import React from 'react';

interface CultivoTabProps {
  formData: any;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  autoSaveField: (name: string, value: any, customFormData?: any) => Promise<void>;
  activeTab: string;
}

export default function CultivoTab({ formData, handleChange, setFormData, autoSaveField, activeTab }: CultivoTabProps) {
  return (
    <div className="grid-form" style={{ display: activeTab === 'cultivo' ? 'grid' : 'none' }}>
      {/* TIPO DE SIEMBRA */}
      <div className="form-group full" style={{ margin: 0, padding: '15px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
        <label style={{ color: '#1e293b', fontWeight: 'bold' }}>🌱 Tipo de Siembra / Propagación</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
          {[
            { val: 'directa', label: 'Semilla: Siembra Directa' },
            { val: 'semillero', label: 'Semilla: Semillero / Almácigo' },
            { val: 'planton', label: 'Plantón / Plantel' },
            { val: 'esqueje', label: 'Esqueje / Chupón / Estolón' },
            { val: 'bulbo', label: 'Tubérculo / Bulbo / Rizoma' },
            { val: 'division', label: 'División de Mata' }
          ].map(t => (
            <div key={t.val} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem', cursor: 'pointer', color: '#475569', flex: 1 }}>
                <input
                  type="checkbox"
                  name="especiestiposiembra"
                  value={t.val}
                  checked={formData.especiestiposiembra?.includes(t.val)}
                  onChange={handleChange}
                />
                {t.label}
              </label>
              {formData.especiestiposiembra?.includes(t.val) && (
                <button
                  type="button"
                  title="Marcar como preferente"
                  onClick={() => {
                    const prefs = formData.especiestiposiembrapreferente || [];
                    const newPrefs = prefs.includes(t.val) ? prefs.filter((p: string) => p !== t.val) : [...prefs, t.val];
                    const next = { ...formData, especiestiposiembrapreferente: newPrefs };
                    setFormData(next);
                    setTimeout(() => autoSaveField('especiestiposiembrapreferente', newPrefs, next), 100);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px',
                    fontSize: '1.2rem',
                    color: formData.especiestiposiembrapreferente?.includes(t.val) ? '#fbbf24' : '#cbd5e1'
                  }}
                >
                  {formData.especiestiposiembrapreferente?.includes(t.val) ? '⭐' : '☆'}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label>Profundidad de Siembra (cm)</label>
        <input type="number" step="0.1" name="especiesprofundidadsiembra" value={formData.especiesprofundidadsiembra || ''} onChange={handleChange} />
      </div>
      <div className="form-group">
        <label>Profundidad de Trasplante</label>
        <input type="text" name="especiesprofundidadtrasplante" placeholder="Ej: Hasta los cotiledones" value={formData.especiesprofundidadtrasplante || ''} onChange={handleChange} />
      </div>

      <div className="form-group">
        <label>Dificultad</label>
        <select name="especiesdificultad" value={formData.especiesdificultad || ''} onChange={handleChange}>
          <option value="">--</option>
          <option value="baja">Baja</option>
          <option value="media">Media</option>
          <option value="alta">Alta</option>
        </select>
      </div>
      <div className="form-group">
        <label>Luz Solar</label>
        <select name="especiesluzsolar" value={formData.especiesluzsolar || ''} onChange={handleChange}>
          <option value="">--</option>
          <option value="pleno_sol">Pleno Sol</option>
          <option value="semisombra">Semisombra</option>
          <option value="sombra">Sombra</option>
        </select>
      </div>
      <div className="form-group">
        <label>Necesidad de Riego</label>
        <select name="especiesnecesidadriego" value={formData.especiesnecesidadriego || ''} onChange={handleChange}>
          <option value="">--</option>
          <option value="baja">Baja</option>
          <option value="media">Media</option>
          <option value="alta">Alta</option>
        </select>
      </div>
      <div className="form-group">
        <label>Volumen Maceta (L)</label>
        <input type="number" name="especiesvolumenmaceta" value={formData.especiesvolumenmaceta || ''} onChange={handleChange} />
      </div>
      <div className="form-group">
        <label>Vol. Semillero Mín (cc)</label>
        <input type="number" name="especiesemillerovolumendesde" value={formData.especiesemillerovolumendesde || ''} onChange={handleChange} />
      </div>
      <div className="form-group">
        <label>Vol. Semillero Máx (cc)</label>
        <input type="number" name="especiesemillerovolumenhasta" value={formData.especiesemillerovolumenhasta || ''} onChange={handleChange} />
      </div>

      <div className="form-group">
        <label>pH Mínimo del Suelo</label>
        <input type="number" step="0.1" min="0" max="14" name="especiesphminimosuelo" placeholder="Ej: 5.5" value={formData.especiesphminimosuelo || ''} onChange={handleChange} />
      </div>
      <div className="form-group">
        <label>pH Máximo del Suelo</label>
        <input type="number" step="0.1" min="0" max="14" name="especiesphmaximosuelo" placeholder="Ej: 7.0" value={formData.especiesphmaximosuelo || ''} onChange={handleChange} />
      </div>
      <div className="form-group full">
        <label>Características del Suelo</label>
        <textarea name="especiescaracteristicassuelo" rows={2} value={formData.especiescaracteristicassuelo || ''} onChange={handleChange} />
      </div>

      {/* NUEVOS CAMPOS AGRONÓMICOS */}
      <div style={{ gridColumn: '1 / -1', margin: '8px 0 0', padding: '16px 0 0', borderTop: '2px solid #e2e8f0' }}>
        <h4 style={{ margin: '0 0 12px', fontSize: '1rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '8px' }}>🌿 Datos Agronómicos Avanzados</h4>
      </div>
      <div className="form-group">
        <label>Resistencia a Heladas</label>
        <select name="especiesresistenciahelada" value={formData.especiesresistenciahelada || ''} onChange={handleChange}>
          <option value="">--</option>
          <option value="nula">❌ Nula (muere con primera helada)</option>
          <option value="baja">🥶 Baja (heladas suaves)</option>
          <option value="media">🧊 Media (hasta -5°C)</option>
          <option value="alta">💎 Alta (heladas severas)</option>
        </select>
      </div>
      <div className="form-group">
        <label>Necesidad de Tutoraje</label>
        <select name="especiesnecesidadtutoraje" value={formData.especiesnecesidadtutoraje || ''} onChange={handleChange}>
          <option value="">--</option>
          <option value="no">🚫 No necesita</option>
          <option value="opcional">🔄 Opcional</option>
          <option value="obligatorio">📐 Obligatorio</option>
        </select>
      </div>
      <div className="form-group">
        <label>Porte de la Planta</label>
        <select name="especiesporteplanta" value={formData.especiesporteplanta || ''} onChange={handleChange}>
          <option value="">--</option>
          <option value="rastrero">🌊 Rastrero</option>
          <option value="arbusto">🌳 Arbusto</option>
          <option value="mata">🌿 Mata</option>
          <option value="trepador">🧗 Trepador</option>
          <option value="erecto">📏 Erecto</option>
        </select>
      </div>
      <div className="form-group">
        <label>Rendimiento Estimado</label>
        <input type="text" name="especiesrendimientoestimado" placeholder="Ej: 3-5 kg/planta" value={formData.especiesrendimientoestimado || ''} onChange={handleChange} />
      </div>
      <div className="form-group">
        <label title="Algunas semillas necesitan oscuridad (fotoblásticas negativas), otras necesitan luz para germinar (fotoblásticas positivas).">¿Germina en Oscuridad? 💡</label>
        <select name="especiesgerminaroscuridad" value={formData.especiesgerminaroscuridad === true || formData.especiesgerminaroscuridad === 1 ? '1' : formData.especiesgerminaroscuridad === false || formData.especiesgerminaroscuridad === 0 ? '0' : ''} onChange={(e) => {
          const val = e.target.value;
          handleChange({ target: { name: 'especiesgerminaroscuridad', value: val === '' ? null : val === '1' ? 1 : 0 } } as any);
        }}>
          <option value="">— Sin dato —</option>
          <option value="1">🌑 Sí (se entierra, necesita oscuridad)</option>
          <option value="0">☀️ No (necesita luz, se deja en superficie)</option>
        </select>
      </div>
      <div className="form-group full">
        <label>Parte Cosechable</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
          {['fruto', 'hoja', 'raiz', 'bulbo', 'tallo', 'flor', 'semilla'].map((parte) => {
            const emojis: Record<string, string> = { fruto: '🍅', hoja: '🥬', raiz: '🥕', bulbo: '🧅', tallo: '🌿', flor: '🌸', semilla: '🌰' };
            const isChecked = Array.isArray(formData.especiespartecosechable)
              ? formData.especiespartecosechable.includes(parte)
              : (formData.especiespartecosechable || '').split(',').filter(Boolean).includes(parte);
            return (
              <label key={parte} style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '6px 12px', borderRadius: '8px', cursor: 'pointer',
                background: isChecked ? '#dcfce7' : '#f8fafc',
                border: `1px solid ${isChecked ? '#86efac' : '#e2e8f0'}`,
                transition: 'all 0.2s', fontSize: '0.9rem'
              }}>
                <input type="checkbox" checked={isChecked} onChange={() => {
                  const current = Array.isArray(formData.especiespartecosechable)
                    ? formData.especiespartecosechable
                    : (formData.especiespartecosechable || '').split(',').filter(Boolean);
                  const next = isChecked ? current.filter((p: string) => p !== parte) : [...current, parte];
                  const nextValue = next;
                  handleChange({ target: { name: 'especiespartecosechable', value: nextValue } } as any);
                  autoSaveField('especiespartecosechable', nextValue.join(','));
                }} style={{ display: 'none' }} />
                <span>{emojis[parte]} {parte.charAt(0).toUpperCase() + parte.slice(1)}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* DATOS DE FISIOLOGÍA SEMILLAS */}
      <div className="form-group full" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '15px', marginTop: '15px' }}>
        <div className="form-group" style={{ margin: 0, padding: '15px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <label style={{ color: '#1e293b', fontWeight: 'bold' }}>Viabilidad de la Semilla (Años)</label>
          <input type="number" name="especiesviabilidadsemilla" value={formData.especiesviabilidadsemilla || ''} onChange={handleChange} style={{ marginTop: '8px' }} />
        </div>

        <div className="form-group" style={{ margin: 0, padding: '15px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <label style={{ color: '#1e293b', fontWeight: 'bold' }}>Peso de 1.000 Semillas (g)</label>
          <input type="number" step="0.001" name="especiespeso1000semillas" value={formData.especiespeso1000semillas || ''} onChange={handleChange} style={{ marginTop: '8px' }} placeholder="Ej. 1.5" />
          {formData.especiespeso1000semillas && Number(formData.especiespeso1000semillas) > 0 && (
            <div style={{ marginTop: '8px', fontSize: '0.8rem', color: '#0f766e', fontWeight: 'bold' }}>
              🔄 Equivalencia: {Math.round(1000 / Number(formData.especiespeso1000semillas))} semillas por gramo
            </div>
          )}
        </div>
      </div>

      {/* REQUISITOS TÉRMICOS */}
      <div className="form-group full" style={{ marginTop: '15px', marginBottom: '15px', padding: '20px', background: '#fff1f2', borderRadius: '12px', border: '1px solid #fecdd3' }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#be123c', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          🌡️ Requisitos Térmicos (°C)
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))', gap: '15px' }}>
          <div className="form-group" style={{ margin: 0, background: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid #fecdd3' }}>
            <label style={{ color: '#0369a1' }}>Mínima (Sobrevive)</label>
            <input type="number" step="0.1" name="especiestemperaturaminima" value={formData.especiestemperaturaminima || ''} onChange={handleChange} />
          </div>
          <div className="form-group" style={{ margin: 0, background: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid #fecdd3' }}>
            <label style={{ color: '#15803d' }}>Óptima (Desarrollo)</label>
            <input type="number" step="0.1" name="especiestemperaturaoptima" value={formData.especiestemperaturaoptima || ''} onChange={handleChange} />
          </div>
          <div className="form-group" style={{ margin: 0, background: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid #fecdd3' }}>
            <label style={{ color: '#be123c' }}>Máxima (Estrés)</label>
            <input type="number" step="0.1" name="especiestemperaturamaxima" value={formData.especiestemperaturamaxima || ''} onChange={handleChange} />
          </div>
        </div>
      </div>

      {/* MARCOS DE PLANTACIÓN (Autosuficiencia) */}
      <div className="form-group" style={{ marginTop: '15px' }}>
        <label>Marco Plantas (cm)</label>
        <input type="number" name="especiesmarcoplantas" value={formData.especiesmarcoplantas || ''} onChange={handleChange} />
      </div>
      <div className="form-group" style={{ marginTop: '15px' }}>
        <label>Marco Filas (cm)</label>
        <input type="number" name="especiesmarcofilas" value={formData.especiesmarcofilas || ''} onChange={handleChange} />
      </div>
      <div className="form-group full" style={{ marginTop: '15px' }}>
        <label>Margen al Borde (cm)</label>
        <input type="number" name="especiesmarcomargen" value={formData.especiesmarcomargen || ''} onChange={handleChange} />
      </div>

      {(formData.especiesmarcoplantas || formData.especiesmarcofilas) && (
        <div className="form-group full" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '15px', padding: '15px', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1', boxSizing: 'border-box', maxWidth: '100%', overflow: 'hidden' }}>
          <span style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '10px', fontWeight: 'bold' }}>Esquema de Plantación a Escala</span>

          {(() => {
            let p = parseFloat(formData.especiesmarcoplantas);
            let f = parseFloat(formData.especiesmarcofilas);
            let m = parseFloat(formData.especiesmarcomargen) || 0;
            if (!p || p <= 0) p = 50;
            if (!f || f <= 0) f = 50;

            const totalW = p + 2 * m;
            const totalH = f + 2 * m;

            const maxW = 220;
            const maxH = 160;

            let drawTotalW, drawTotalH;
            const ratio = totalW / totalH;
            const maxRatio = maxW / maxH;

            if (ratio > maxRatio) {
              drawTotalW = maxW;
              drawTotalH = maxW / ratio;
            } else {
              drawTotalH = maxH;
              drawTotalW = maxH * ratio;
            }

            if (drawTotalW < 50) drawTotalW = 50;
            if (drawTotalH < 50) drawTotalH = 50;

            const scale = drawTotalW / totalW;
            const drawM = m * scale;
            const drawW = p * scale;
            const drawH = f * scale;

            const cx = 160;
            const cy = 120;

            const bedX1 = cx - drawTotalW / 2;
            const bedX2 = cx + drawTotalW / 2;
            const bedY1 = cy - drawTotalH / 2;
            const bedY2 = cy + drawTotalH / 2;

            const x1 = bedX1 + drawM;
            const x2 = bedX2 - drawM;
            const y1 = bedY1 + drawM;
            const y2 = bedY2 - drawM;

            return (
              <svg width="320" height="240" viewBox="0 0 320 240" xmlns="http://www.w3.org/2000/svg" style={{ maxWidth: '100%', height: 'auto' }}>
                <rect 
                  x={bedX1} 
                  y={bedY1} 
                  width={drawTotalW} 
                  height={drawTotalH} 
                  fill="#fdfbf7" 
                  stroke="#10b981" 
                  strokeWidth="1.5" 
                  rx="6" 
                  style={{ filter: 'drop-shadow(0 2px 4px rgba(16,185,129,0.05))' }}
                />

                <circle cx={x1} cy={y1} r="8" fill="#22c55e" stroke="#16a34a" strokeWidth="1" />
                <circle cx={x2} cy={y1} r="8" fill="#22c55e" stroke="#16a34a" strokeWidth="1" />
                <circle cx={x1} cy={y2} r="8" fill="#22c55e" stroke="#16a34a" strokeWidth="1" />
                <circle cx={x2} cy={y2} r="8" fill="#22c55e" stroke="#16a34a" strokeWidth="1" />

                {x2 - x1 > 30 && (
                  <>
                    <line x1={x1 + 12} y1={y1} x2={x2 - 12} y2={y1} stroke="#64748b" strokeWidth="2" />
                    <polygon points={`${x1 + 12},${y1 - 4} ${x1 + 8},${y1} ${x1 + 12},${y1 + 4}`} fill="#64748b" />
                    <polygon points={`${x2 - 12},${y1 - 4} ${x2 - 8},${y1} ${x2 - 12},${y1 + 4}`} fill="#64748b" />
                  </>
                )}

                <rect x={cx - 30} y={y1 - 10} width="60" height="20" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" rx="4" />
                <text x={cx} y={y1 + 4} fontSize="11" fontWeight="bold" fill="#0f172a" textAnchor="middle">
                  {formData.especiesmarcoplantas ? `${formData.especiesmarcoplantas} cm` : '? cm'}
                </text>

                {y2 - y1 > 30 && (
                  <>
                    <line x1={x1} y1={y1 + 12} x2={x1} y2={y2 - 12} stroke="#64748b" strokeWidth="2" />
                    <polygon points={`${x1 - 4},${y1 + 12} ${x1},${y1 + 8} ${x1 + 4},${y1 + 12}`} fill="#64748b" />
                    <polygon points={`${x1 - 4},${y2 - 12} ${x1},${y2 - 8} ${x1 + 4},${y2 - 12}`} fill="#64748b" />
                  </>
                )}

                <rect x={x1 - 30} y={cy - 10} width="60" height="20" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" rx="4" />
                <text x={x1} y={cy + 4} fontSize="11" fontWeight="bold" fill="#0f172a" textAnchor="middle">
                  {formData.especiesmarcofilas ? `${formData.especiesmarcofilas} cm` : '? cm'}
                </text>

                <line x1={x2} y1={y1 + 12} x2={x2} y2={y2 - 12} stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="4 4" />
                <line x1={x1 + 12} y1={y2} x2={x2 - 12} y2={y2} stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="4 4" />

                {m > 0 && (
                  <>
                    <line x1={x2} y1={y1} x2={bedX2} y2={y1} stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3 3" />
                    {drawM > 15 && (
                      <>
                        <line x1={x2 + 8} y1={y1 - 6} x2={x2 + 8} y2={y1 + 6} stroke="#f59e0b" strokeWidth="1.5" />
                        <line x1={bedX2 - 8} y1={y1 - 6} x2={bedX2 - 8} y2={y1 + 6} stroke="#f59e0b" strokeWidth="1.5" />
                      </>
                    )}
                    <rect x={((x2 + bedX2) / 2) - 20} y={y1 - 18} width="40" height="15" fill="#ffffff" stroke="#fef3c7" strokeWidth="1" rx="3" />
                    <text x={(x2 + bedX2) / 2} y={y1 - 7} fontSize="9" fontWeight="bold" fill="#d97706" textAnchor="middle">
                      {formData.especiesmarcomargen ? `${formData.especiesmarcomargen} cm` : '0 cm'}
                    </text>
                  </>
                )}
              </svg>
            );
          })()}
        </div>
      )}
    </div>
  );
}
