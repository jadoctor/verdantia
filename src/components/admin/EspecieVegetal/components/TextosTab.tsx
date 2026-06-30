import React from 'react';

interface TextosTabProps {
  formData: any;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  activeTab: string;
  calcPersonas: number;
  setCalcPersonas: (val: number) => void;
}

export default function TextosTab({
  formData,
  handleChange,
  activeTab,
  calcPersonas,
  setCalcPersonas
}: TextosTabProps) {
  return (
    <div className="grid-form" style={{ display: activeTab === 'textos' ? 'grid' : 'none' }}>
      <div className="form-group full">
        <label>Descripción / Cultivo</label>
        <textarea name="especiesvegetalesdescripcion" rows={3} value={formData.especiesvegetalesdescripcion || ''} onChange={handleChange} />
      </div>

      <div className="form-group full">
        <label>Historia / Origen</label>
        <textarea name="especieshistoria" rows={3} value={formData.especieshistoria || ''} onChange={handleChange} />
      </div>

      <div className="form-group full">
        <label>Fuentes (URLs separadas por comas)</label>
        <input type="text" name="especiesfuentesinformacion" value={formData.especiesfuentesinformacion || ''} onChange={handleChange} />
        {formData.especiesfuentesinformacion && typeof formData.especiesfuentesinformacion === 'string' && formData.especiesfuentesinformacion.trim() !== '' && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
            {formData.especiesfuentesinformacion.split(',').map((url: string, idx: number) => {
              const trimmedUrl = url.trim();
              if (!trimmedUrl) return null;
              const href = trimmedUrl.startsWith('http') ? trimmedUrl : `https://${trimmedUrl}`;
              return (
                <a
                  key={idx}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    background: '#e0e7ff',
                    color: '#4338ca',
                    padding: '6px 12px',
                    borderRadius: '16px',
                    fontSize: '0.8rem',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    border: '1px solid #c7d2fe',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                    transition: 'all 0.2s'
                  }}
                >
                  🔗 {trimmedUrl.length > 35 ? trimmedUrl.substring(0, 35) + '...' : trimmedUrl}
                </a>
              );
            })}
          </div>
        )}
      </div>

      {/* METRICAS DE CONSUMO DE AUTOSUFICIENCIA */}
      <div className="form-group full" style={{ borderTop: '1px solid #e2e8f0', paddingTop: '20px', marginTop: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '15px' }}>
        <h3 className="form-group full" style={{ margin: '0 0 10px 0', fontSize: '1.2rem', color: '#1e293b' }}>
          ⚖️ Ratios de Consumo para Autosuficiencia
        </h3>
        <div>
          <label>🌱 Parcial (plantas/pers)</label>
          <input type="number" step="0.1" name="especiesautosuficienciaparcial" value={formData.especiesautosuficienciaparcial || ''} onChange={handleChange} />
        </div>
        <div>
          <label>🥬 Completa (plantas/pers)</label>
          <input type="number" step="0.1" name="especiesautosuficiencia" value={formData.especiesautosuficiencia || ''} onChange={handleChange} />
        </div>
        <div>
          <label>🥫 Conserva (plantas/pers)</label>
          <input type="number" step="0.1" name="especiesautosuficienciaconserva" value={formData.especiesautosuficienciaconserva || ''} onChange={handleChange} />
        </div>
      </div>

      <div className="form-group full" style={{ padding: '15px', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1', marginTop: '10px' }}>
        <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0, textAlign: 'center' }}>
          <strong>Nota:</strong> Estos valores indican el número estimado de plantas necesarias para abastecer a <strong>una persona</strong> durante un año.
        </p>
      </div>

      {/* CALCULADORA DE RENDIMIENTO */}
      {(() => {
        const pParcial = parseFloat(formData.especiesautosuficienciaparcial) || 0;
        const pFresco = parseFloat(formData.especiesautosuficiencia) || 0;
        const pConserva = parseFloat(formData.especiesautosuficienciaconserva) || 0;
        const totalPParcial = pParcial * calcPersonas;
        const totalPFresco = pFresco * calcPersonas;
        const totalPConserva = pConserva * calcPersonas;

        const marcoP = (parseFloat(formData.especiesmarcoplantas) || 0) / 100;
        const marcoF = (parseFloat(formData.especiesmarcofilas) || 0) / 100;
        const margin = (parseFloat(formData.especiesmarcomargen) || 0) / 100;
        const areaPlant = (marcoP + 2 * margin) * (marcoF + 2 * margin);

        const m2Parcial = totalPParcial * areaPlant;
        const m2Fresco = totalPFresco * areaPlant;
        const m2Conserva = totalPConserva * areaPlant;

        return (
          <div className="form-group full" style={{ marginTop: '20px', padding: '14px', background: '#f0fdf4', border: '2px solid #22c55e', borderRadius: '8px', boxSizing: 'border-box', maxWidth: '100%', overflow: 'hidden' }}>
            <h3 style={{ marginTop: 0, color: '#166534', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.2rem' }}>
              🧮 Calculadora de Autosuficiencia
              <span style={{ fontSize: '0.8rem', fontWeight: 'normal', background: '#dcfce7', padding: '3px 8px', borderRadius: '12px' }}>No se guarda</span>
            </h3>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', marginBottom: '20px' }}>
              <label style={{ fontWeight: 'bold', color: '#15803d' }}>Número de Personas a alimentar:</label>
              <input
                type="number"
                min="1"
                value={calcPersonas}
                onChange={(e) => setCalcPersonas(parseInt(e.target.value) || 1)}
                style={{ width: '80px', padding: '8px', border: '1px solid #86efac', borderRadius: '4px', textAlign: 'center', fontSize: '1.1rem' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '12px' }}>
              <div style={{ background: '#fff', padding: '15px', borderRadius: '8px', border: '1px solid #bbf7d0', textAlign: 'center' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#15803d', borderBottom: '1px solid #bbf7d0', paddingBottom: '10px' }}>🌱 Parcial</h4>
                <span style={{ display: 'block', fontSize: '0.9rem', color: '#166534' }}>Plantas Necesarias</span>
                <strong style={{ fontSize: '1.8rem', color: '#15803d', display: 'block', marginBottom: '10px' }}>{totalPParcial.toFixed(1)}</strong>
                <span style={{ display: 'block', fontSize: '0.9rem', color: '#166534' }}>Terreno Necesario</span>
                <strong style={{ fontSize: '1.8rem', color: '#15803d' }}>{m2Parcial > 0 ? `${m2Parcial.toFixed(2)} m²` : '--- m²'}</strong>
              </div>

              <div style={{ background: '#fff', padding: '15px', borderRadius: '8px', border: '1px solid #bbf7d0', textAlign: 'center' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#15803d', borderBottom: '1px solid #bbf7d0', paddingBottom: '10px' }}>🥬 Completa</h4>
                <span style={{ display: 'block', fontSize: '0.9rem', color: '#166534' }}>Plantas Necesarias</span>
                <strong style={{ fontSize: '1.8rem', color: '#15803d', display: 'block', marginBottom: '10px' }}>{totalPFresco.toFixed(1)}</strong>
                <span style={{ display: 'block', fontSize: '0.9rem', color: '#166534' }}>Terreno Necesario</span>
                <strong style={{ fontSize: '1.8rem', color: '#15803d' }}>{m2Fresco > 0 ? `${m2Fresco.toFixed(2)} m²` : '--- m²'}</strong>
              </div>

              <div style={{ background: '#fff', padding: '15px', borderRadius: '8px', border: '1px solid #bbf7d0', textAlign: 'center' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#15803d', borderBottom: '1px solid #bbf7d0', paddingBottom: '10px' }}>🥫 Conserva</h4>
                <span style={{ display: 'block', fontSize: '0.9rem', color: '#166534' }}>Plantas Necesarias</span>
                <strong style={{ fontSize: '1.8rem', color: '#15803d', display: 'block', marginBottom: '10px' }}>{totalPConserva.toFixed(1)}</strong>
                <span style={{ display: 'block', fontSize: '0.9rem', color: '#166534' }}>Terreno Necesario</span>
                <strong style={{ fontSize: '1.8rem', color: '#15803d' }}>{m2Conserva > 0 ? `${m2Conserva.toFixed(2)} m²` : '--- m²'}</strong>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
