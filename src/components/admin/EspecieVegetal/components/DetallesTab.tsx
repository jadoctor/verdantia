import React from 'react';

interface DetallesTabProps {
  formData: any;
  masterFamilias: any[];
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  activeTab: string;
}

const TIPOS = ['hortaliza', 'fruta', 'aromatica', 'leguminosa', 'cereal', 'adventicia', 'otra'];
const CICLOS = ['anual', 'bianual', 'perenne'];

export default function DetallesTab({ formData, masterFamilias, handleChange, activeTab }: DetallesTabProps) {
  return (
    <div className="grid-form" style={{ display: activeTab === 'taxonomia' ? 'grid' : 'none' }}>
      <div className="form-group full">
        <label>Nombre Común *</label>
        <input 
          type="text" 
          name="especiesvegetalesnombre" 
          required 
          value={formData.especiesvegetalesnombre || ''} 
          onChange={handleChange} 
        />
      </div>
      <div className="form-group">
        <label>Nombre Científico</label>
        <input 
          type="text" 
          name="especiesvegetalesnombrecientifico" 
          value={formData.especiesvegetalesnombrecientifico || ''} 
          onChange={handleChange} 
        />
      </div>
      <div className="form-group" style={{ display: 'flex', flexDirection: 'column' }}>
        <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Familia</span>
          <a 
            href="/dashboard/admin/familias" 
            target="_blank" 
            rel="noopener noreferrer" 
            style={{ fontSize: '0.75rem', textDecoration: 'none', background: '#e2e8f0', padding: '2px 8px', borderRadius: '10px', color: '#475569' }}
          >
            ⚙️ Gestionar
          </a>
        </label>
        <select 
          name="xespeciesvegetalesidfamilias" 
          value={formData.xespeciesvegetalesidfamilias || ''} 
          onChange={handleChange} 
          style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #d1d5db' }}
        >
          <option value="">— Sin familia asignada —</option>
          {masterFamilias.map((f: any) => (
            <option key={f.idfamilias} value={f.idfamilias}>
              {f.familiasemoji} {f.familiasnombre} {f.familiasnombrecientifico ? `(${f.familiasnombrecientifico})` : ''}
            </option>
          ))}
        </select>
      </div>
      <div className="form-group full checkbox-group">
        <label>Tipos</label>
        <div className="cb-list">
          {TIPOS.map(t => (
            <label key={t}>
              <input 
                type="checkbox" 
                name="especiestipo" 
                value={t} 
                checked={formData.especiestipo.includes(t)} 
                onChange={handleChange} 
              /> {t}
            </label>
          ))}
        </div>
      </div>
      <div className="form-group full checkbox-group">
        <label>Ciclo</label>
        <div className="cb-list">
          {CICLOS.map(c => (
            <label key={c}>
              <input 
                type="checkbox" 
                name="especiesciclo" 
                value={c} 
                checked={formData.especiesciclo.includes(c)} 
                onChange={handleChange} 
              /> {c}
            </label>
          ))}
        </div>
      </div>
      <div className="form-group">
        <label>Color Fenotípico</label>
        <input 
          type="text" 
          name="especiescolor" 
          value={formData.especiescolor || ''} 
          onChange={handleChange} 
        />
      </div>
      <div className="form-group">
        <label>Tamaño</label>
        <select name="especiestamano" value={formData.especiestamano || 'mediano'} onChange={handleChange}>
          <option value="pequeno">Pequeño</option>
          <option value="mediano">Mediano</option>
          <option value="grande">Grande</option>
        </select>
      </div>
    </div>
  );
}
