import React from 'react';

interface BiodinamicaTabProps {
  formData: any;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  activeTab: string;
}

export default function BiodinamicaTab({ formData, handleChange, activeTab }: BiodinamicaTabProps) {
  return (
    <div className="grid-form" style={{ display: activeTab === 'biodinamica' ? 'flex' : 'none', flexDirection: 'column', gap: '24px' }}>
      <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <h3 style={{ margin: '0 0 16px 0', color: '#1e293b', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          🌕 Calendario Lunar
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '16px', marginBottom: '16px' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontWeight: 'bold' }}>Fase de Siembra</label>
            <select 
              name="especieslunarfasesiembra" 
              value={formData.especieslunarfasesiembra || ''} 
              onChange={handleChange} 
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
            >
              <option value="">— Seleccionar Fase —</option>
              <option value="Creciente">🌘 Cuarto Creciente (Savia sube)</option>
              <option value="Menguante">🌔 Cuarto Menguante (Savia baja)</option>
              <option value="Nueva">🌑 Luna Nueva</option>
              <option value="Llena">🌕 Luna Llena</option>
            </select>
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontWeight: 'bold' }}>Fase de Trasplante</label>
            <select 
              name="especieslunarfasetrasplante" 
              value={formData.especieslunarfasetrasplante || ''} 
              onChange={handleChange} 
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
            >
              <option value="">— Seleccionar Fase —</option>
              <option value="Creciente">🌘 Cuarto Creciente</option>
              <option value="Menguante">🌔 Cuarto Menguante (Recomendado)</option>
              <option value="Nueva">🌑 Luna Nueva</option>
              <option value="Llena">🌕 Luna Llena</option>
            </select>
          </div>
        </div>
        <div className="form-group full" style={{ margin: 0 }}>
          <label style={{ fontWeight: 'bold' }}>Observaciones del Calendario Lunar</label>
          <textarea 
            name="especieslunarobservaciones" 
            value={formData.especieslunarobservaciones || ''} 
            onChange={handleChange} 
            rows={3} 
            placeholder="Ej: La lechuga es preferible sembrarla en menguante para evitar que espigue rápido..." 
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', resize: 'vertical' }} 
          />
        </div>
      </div>

      <div style={{ background: '#f0fdfa', padding: '20px', borderRadius: '12px', border: '1px solid #ccfbf1' }}>
        <h3 style={{ margin: '0 0 16px 0', color: '#0f766e', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          🌍 Calendario Biodinámico
        </h3>
        
        <div className="form-group full" style={{ marginBottom: '16px' }}>
          <label style={{ fontWeight: 'bold', color: '#0f766e' }} title="Determina en qué 'día de constelación' es óptimo sembrar según la biodinámica (Fruto=Fuego, Raíz=Tierra, Hoja=Agua, Flor=Aire). No confundir con el tipo de especie (hortaliza/fruta).">Organo Comestible Principal 💡</label>
          <select 
            name="especiesorganocomestible" 
            value={formData.especiesorganocomestible || ''} 
            onChange={handleChange} 
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #99f6e4', fontSize: '1rem', background: '#fff' }}
          >
            <option value="">— Sin categoría —</option>
            <option value="fruto">🍅 Planta de Fruto (Días de Fuego/Calor)</option>
            <option value="raiz">🥕 Planta de Raíz (Días de Tierra/Frío)</option>
            <option value="hoja">🥬 Planta de Hoja (Días de Agua/Humedad)</option>
            <option value="flor">🌸 Planta de Flor (Días de Aire/Luz)</option>
          </select>
          {formData.especiesorganocomestible && (
            <p style={{ marginTop: '8px', fontSize: '0.85rem', color: '#0f766e', lineHeight: 1.5 }}>
              {({ fruto: 'Siembra y trasplanta en días Fruto. Recolecta también en días Fruto para mejor sabor y conservación.', raiz: 'Siembra en días Raíz. Recolecta en días Raíz para mejor conservación.', hoja: 'Siembra y trasplanta en días Hoja. Evita podar o cosechar en días Fruto.', flor: 'Trabaja en días Flor para multiplicación y floración abundante. Cosecha en días Flor para mayor fragancia.' } as Record<string, string>)[formData.especiesorganocomestible]}
            </p>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '16px', marginBottom: '16px' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontWeight: 'bold', color: '#0f766e' }}>Fase de Siembra Biodinámica</label>
            <select 
              name="especiesbiodinamicafasesiembra" 
              value={formData.especiesbiodinamicafasesiembra || ''} 
              onChange={handleChange} 
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #99f6e4', background: '#fff' }}
            >
              <option value="">— Seleccionar Fase —</option>
              <option value="Ascendente">📈 Luna Ascendente (Savia sube)</option>
              <option value="Descendente">📉 Luna Descendente (Savia en raíces)</option>
            </select>
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontWeight: 'bold', color: '#0f766e' }}>Fase de Trasplante Biodinámica</label>
            <select 
              name="especiesbiodinamicafasetrasplante" 
              value={formData.especiesbiodinamicafasetrasplante || ''} 
              onChange={handleChange} 
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #99f6e4', background: '#fff' }}
            >
              <option value="">— Seleccionar Fase —</option>
              <option value="Ascendente">📈 Luna Ascendente</option>
              <option value="Descendente">📉 Luna Descendente (Recomendado)</option>
            </select>
          </div>
        </div>

        <div className="form-group full" style={{ margin: 0 }}>
          <label style={{ fontWeight: 'bold', color: '#0f766e' }}>Notas de Calendario Biodinámico</label>
          <textarea 
            name="especiesbiodinamicanotas" 
            value={formData.especiesbiodinamicanotas || ''} 
            onChange={handleChange} 
            rows={3} 
            placeholder="Ej: Además del día de Fruto, evitar perigeos y nodos lunares para la siembra..." 
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #99f6e4', background: '#fff', resize: 'vertical' }} 
          />
        </div>
      </div>
    </div>
  );
}
