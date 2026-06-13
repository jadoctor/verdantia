import React from 'react';
import { FaseFormData } from '../services/fasesApi';

interface FaseEditorFormProps {
  formData: FaseFormData;
  isNew: boolean;
  isMobile: boolean;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSelectChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

export function FaseEditorForm({ formData, isNew, isMobile, handleChange, handleSelectChange }: FaseEditorFormProps) {
  const isSystemKey = !isNew && ['planificado', 'germinando', 'semillero', 'crecimiento', 'produccion', 'finalizado', 'perdido'].includes(formData.fasescultivoclave);

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '12px' : '20px', marginBottom: '20px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', color: '#475569', fontSize: '0.9rem' }}>Nombre (Público)</label>
          <input 
            type="text" 
            name="fasescultivonombre" 
            value={formData.fasescultivonombre} 
            onChange={handleChange}
            placeholder="Ej: Germinación / Semillero"
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', boxSizing: 'border-box' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', color: '#475569', fontSize: '0.9rem' }}>Clave Interna (Código)</label>
          <input 
            type="text" 
            name="fasescultivoclave" 
            value={formData.fasescultivoclave} 
            onChange={handleChange}
            placeholder="Ej: germinacion"
            disabled={isSystemKey}
            style={{ 
              width: '100%', 
              padding: '10px', 
              borderRadius: '8px', 
              border: '1px solid #cbd5e1', 
              fontSize: '1rem', 
              background: isSystemKey ? '#f1f5f9' : 'white', 
              boxSizing: 'border-box' 
            }}
          />
          <small style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Las claves del sistema no deben modificarse.</small>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: isMobile ? '12px' : '20px', marginBottom: '20px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', color: '#475569', fontSize: '0.9rem' }}>Tipo</label>
          <select 
            name="fasescultivotipo" 
            value={formData.fasescultivotipo} 
            onChange={handleSelectChange}
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', background: 'white' }}
          >
            <option value="Hito">🏁 Hito</option>
            <option value="Fase">🌱 Fase</option>
            <option value="Hito Final">🛑 Hito Final</option>
          </select>
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', color: '#475569', fontSize: '0.9rem' }}>Orden cronológico</label>
          <input 
            type="number" 
            name="fasescultivoorden" 
            value={formData.fasescultivoorden} 
            onChange={handleChange}
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', color: '#475569', fontSize: '0.9rem' }}>Icono (Emoji)</label>
          <input 
            type="text" 
            name="fasescultivoicono" 
            value={formData.fasescultivoicono} 
            onChange={handleChange}
            placeholder="🌱"
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', textAlign: 'center' }}
          />
        </div>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', color: '#475569', fontSize: '0.9rem' }}>Descripción para el usuario</label>
        <textarea 
          name="fasescultivodescripcion" 
          value={formData.fasescultivodescripcion || ''} 
          onChange={handleChange}
          placeholder="Breve explicación de lo que ocurre en esta fase..."
          rows={3}
          style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', resize: 'vertical', boxSizing: 'border-box' }}
        />
      </div>

      {formData.fasescultivotipo === 'Hito Final' && (
        <div style={{ marginBottom: '30px', padding: '16px', background: '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '1.5rem' }}>🛑</span>
          <div>
            <strong style={{ display: 'block', color: '#991b1b', fontSize: '1rem' }}>Esta es una "Fase Final" (Fin de Ciclo)</strong>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#b91c1c' }}>
              Al ser de tipo "Hito Final", el sistema marcará los cultivos en esta etapa como concluidos (por cosecha completada, pérdida, etc.).
            </p>
          </div>
        </div>
      )}
    </>
  );
}
