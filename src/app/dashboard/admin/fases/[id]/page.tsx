'use client';
import React from 'react';
import { useFaseEditor } from './hooks/useFaseEditor';
import { FaseEditorHeader } from './components/FaseEditorHeader';
import { FaseEditorForm } from './components/FaseEditorForm';
import { FaseLimitsEditor } from './components/FaseLimitsEditor';
import { FaseHitoBindings } from './components/FaseHitoBindings';
import { FaseEditorFooter } from './components/FaseEditorFooter';

export default function FaseCultivoEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params);
  const {
    isNew,
    formData,
    setFormData,
    loading,
    saving,
    isMobile,
    saveStatus,
    hitosList,
    allFasesList,
    router,
    handleChange,
    handleSelectChange,
    handleSaveManual
  } = useFaseEditor(resolvedParams.id);

  if (loading) return <div style={{ padding: '20px' }}>Cargando datos de la fase...</div>;

  return (
    <div style={{ padding: isMobile ? '10px 4px' : '20px', width: '100%' }}>
      <style dangerouslySetInnerHTML={{ __html: '@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }' }} />
      {/* ── Navigation ── */}
      <div style={{ marginBottom: '16px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button 
          onClick={() => router.push('/dashboard')} 
          style={{ flex: isMobile ? 1 : 'none', justifyContent: 'center', background: 'white', border: '1px solid #cbd5e1', color: '#475569', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          🏠 Volver al Inicio
        </button>
        <button 
          onClick={() => router.push('/dashboard/admin/fases')} 
          style={{ flex: isMobile ? 1 : 'none', justifyContent: 'center', background: 'white', border: '1px solid #cbd5e1', color: '#475569', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          🔙 Volver a Fases
        </button>
      </div>

      {/* ── Subheader Contextual ── */}
      <FaseEditorHeader 
        formData={formData} 
        isNew={isNew} 
        saveStatus={saveStatus} 
        isMobile={isMobile} 
      />

      <div style={{ background: 'white', borderRadius: '16px', padding: isMobile ? '16px' : '30px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
        <FaseEditorForm 
          formData={formData} 
          isNew={isNew} 
          isMobile={isMobile} 
          handleChange={handleChange} 
          handleSelectChange={handleSelectChange} 
        />

        {/* ── LÍMITES TEMPORALES (Solo si es tipo Fase) ── */}
        <FaseLimitsEditor 
          formData={formData} 
          setFormData={setFormData} 
          hitosList={hitosList} 
          isMobile={isMobile} 
        />

        {/* ── VINCULACIÓN CON FASES DE CULTIVO (Solo si es tipo Hito o Hito Final) ── */}
        <FaseHitoBindings 
          formData={formData} 
          allFasesList={allFasesList} 
          isMobile={isMobile} 
        />

        <FaseEditorFooter 
          isNew={isNew} 
          saving={saving} 
          isMobile={isMobile}
          onSaveManual={handleSaveManual} 
          onCancel={() => router.push('/dashboard/admin/fases')} 
        />
      </div>
    </div>
  );
}
