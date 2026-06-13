import React from 'react';
import { FaseFormData } from '../services/fasesApi';

interface FaseEditorHeaderProps {
  formData: FaseFormData;
  isNew: boolean;
  saveStatus: 'idle' | 'saving' | 'success';
  isMobile: boolean;
}

export function FaseEditorHeader({ formData, isNew, saveStatus, isMobile }: FaseEditorHeaderProps) {
  return (
    <div style={{ background: 'linear-gradient(135deg, #1e3a8a, #3b82f6)', borderRadius: '16px', padding: isMobile ? '16px 20px' : '24px 28px', marginBottom: '24px', color: 'white' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: isMobile ? '1.3rem' : '1.8rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <span>{formData.fasescultivoicono || '🌱'}</span>
            <span>{isNew ? 'Crear Nueva Fase de Cultivo' : `Editar Fase: ${formData.fasescultivonombre}`}</span>
            
            {/* Indicador de Autoguardado */}
            {saveStatus === 'saving' && (
              <span style={{ background: '#fef08a', color: '#854d0e', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</span> Guardando...
              </span>
            )}
            {saveStatus === 'success' && (
              <span style={{ background: '#d1fae5', color: '#065f46', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                ✓ Guardado
              </span>
            )}
          </h1>
          <p style={{ margin: '4px 0 0', opacity: 0.9, fontSize: '0.9rem' }}>
            {isNew ? 'Registro de una nueva etapa de ciclo en el sistema.' : 'Editor de Fase de Cultivo (Autoguardado activado)'}
          </p>
        </div>
      </div>
    </div>
  );
}
