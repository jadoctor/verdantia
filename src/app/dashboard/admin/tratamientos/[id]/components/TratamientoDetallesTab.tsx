import React from 'react';

interface TratamientoDetallesTabProps {
  formData: any;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  handleMultiSelectChange: (name: string, value: string) => void;
  handleParteToggle: (idparte: number) => void;
  plantasParteCatalog: any[];
  isMobile: boolean;
}

const getViaAplicacionVisual = (p: any) => {
  switch (p.idplantasparte) {
    case 1: return 'Vía Foliar / Aérea (Hojas)';
    case 3: return 'Vía Radicular (Suelo / Riego)';
    case 4: return 'Inyección / Pintado (Tronco)';
    case 7: return 'Drench / Entorno General';
    default: return `Aplicación en ${p.plantaspartenombre}`;
  }
};

export function TratamientoDetallesTab({
  formData,
  handleChange,
  handleMultiSelectChange,
  handleParteToggle,
  plantasParteCatalog,
  isMobile
}: TratamientoDetallesTabProps) {
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#475569' }}>Nombre del Tratamiento *</label>
          <input 
            type="text" name="tratamientosnombre" required
            value={formData.tratamientosnombre} onChange={handleChange}
            style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem' }}
            placeholder="Ej: Jabón Potásico 20%"
          />
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#475569' }}>Naturaleza / Origen</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc' }}>
            {[
              { id: 'ecológico', label: 'Ecológico' },
              { id: 'orgánico', label: 'Orgánico' },
              { id: 'químico', label: 'Químico / Sintético' },
              { id: 'biológico', label: 'Biológico (Depredadores, etc)' },
              { id: 'físico', label: 'Físico / Mecánico' }
            ].map(opt => (
              <label key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', cursor: 'pointer', background: 'white', padding: '4px 10px', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
                <input 
                  type="checkbox" 
                  checked={(formData.tratamientostipo || '').toLowerCase().split(',').map((s: string) => s.trim()).includes(opt.id)}
                  onChange={() => handleMultiSelectChange('tratamientostipo', opt.id)}
                  style={{ accentColor: '#10b981' }}
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#475569' }}>Modo de Acción (Finalidad)</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc' }}>
            {[
              { id: 'preventivo', label: 'Preventivo (Protector)' },
              { id: 'curativo', label: 'Curativo (Contacto / Choque)' },
              { id: 'sistémico', label: 'Sistémico (Absorción interna)' },
              { id: 'erradicante', label: 'Erradicante' }
            ].map(opt => (
              <label key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', cursor: 'pointer', background: 'white', padding: '4px 10px', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
                <input 
                  type="checkbox" 
                  checked={(formData.tratamientosaccion || '').toLowerCase().split(',').map((s: string) => s.trim()).includes(opt.id)}
                  onChange={() => handleMultiSelectChange('tratamientosaccion', opt.id)}
                  style={{ accentColor: '#3b82f6' }}
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#475569' }}>Plazo de Seguridad (Carencia)</label>
          <input 
            type="text" name="tratamientoscarencia"
            value={formData.tratamientoscarencia || ''} onChange={handleChange}
            style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem' }}
            placeholder="Ej: 3 días / Sin carencia"
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#475569' }}>Dosis Recomendada</label>
          <input 
            type="text" name="tratamientosdosis"
            value={formData.tratamientosdosis || ''} onChange={handleChange}
            style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem' }}
            placeholder="Ej: 5 ml/L de agua"
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#475569' }}>Frecuencia de Aplicación</label>
          <input 
            type="text" name="tratamientosfrecuencia"
            value={formData.tratamientosfrecuencia || ''} onChange={handleChange}
            style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem' }}
            placeholder="Ej: Cada 15 días"
          />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' }}>
        <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#475569' }}>Mecanismo de Acción (Cómo funciona)</label>
        <textarea 
          name="tratamientosmecanismo" rows={2}
          value={formData.tratamientosmecanismo || ''} onChange={handleChange}
          style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', resize: 'vertical' }}
          placeholder="Ej: Actúa por asfixia y reblandecimiento del exoesqueleto de los insectos..."
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' }}>
        <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#475569' }}>Descripción General</label>
        <textarea 
          name="tratamientosdescripcion" rows={3}
          value={formData.tratamientosdescripcion} onChange={handleChange}
          style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', resize: 'vertical' }}
          placeholder="Ej: Insecticida ecológico de contacto a base de sales potásicas..."
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' }}>
        <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#475569' }}>Preparación y Uso Genérico</label>
        <textarea 
          name="tratamientospreparacion" rows={3}
          value={formData.tratamientospreparacion} onChange={handleChange}
          style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', resize: 'vertical' }}
          placeholder="Ej: Diluir 20ml por litro de agua. Agitar bien antes de usar."
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#475569' }}>Precauciones / Toxicidad</label>
        <textarea 
          name="tratamientosprecauciones" rows={2}
          value={formData.tratamientosprecauciones} onChange={handleChange}
          style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', resize: 'vertical' }}
          placeholder="Ej: No aplicar a pleno sol para evitar quemaduras."
        />
      </div>

      <div id="partes" style={{ marginTop: '30px', padding: '24px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <h3 style={{ margin: '0 0 16px 0', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
          🎯 Vías de Aplicación
        </h3>
        <p style={{ margin: '0 0 20px 0', fontSize: '0.9rem', color: '#64748b' }}>
          Selecciona a qué partes de la planta se puede aplicar este tratamiento. Esto afectará a cómo se muestra en los asistentes IA y manuales agronómicos.
        </p>
        
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '16px', width: '100%' }}>
          {plantasParteCatalog.map(p => {
            const isSelected = formData.partes?.includes(p.idplantasparte);
            return (
              <div 
                key={p.idplantasparte}
                onClick={() => handleParteToggle(p.idplantasparte)}
                style={{
                  padding: '16px', borderRadius: '12px', cursor: 'pointer',
                  border: isSelected ? '2px solid #3b82f6' : '2px solid transparent',
                  background: isSelected ? '#eff6ff' : 'white',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                  display: 'flex', alignItems: 'center', gap: '12px', transition: 'all 0.2s'
                }}
              >
                <div style={{ fontSize: '2rem' }}>{p.plantasparteemoji}</div>
                <div>
                  <div style={{ fontWeight: 'bold', color: isSelected ? '#1e40af' : '#334155', fontSize: '0.95rem' }}>
                    {getViaAplicacionVisual(p)}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    Base: {p.plantaspartenombre}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
