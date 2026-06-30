'use client';

import React from 'react';
import TratamientoHero from './components/TratamientoHero';
import TratamientoAIAssistant from '@/components/admin/TratamientoAIAssistant';
import TratamientoHealthCheck from '@/components/admin/TratamientoHealthCheck';
import PremiumBackButton from '@/components/ui/PremiumBackButton';
import PremiumSubheader from '@/components/ui/PremiumSubheader';
import PremiumDevInsights from '@/components/ui/PremiumDevInsights';
import PremiumDeleteButton from '@/components/ui/PremiumDeleteButton';
import PremiumHeroCarousel from '@/components/ui/PremiumHeroCarousel';
import { useTratamientoEdit } from './hooks/useTratamientoEdit';
import { TratamientoDetallesTab } from './components/TratamientoDetallesTab';
import { TratamientoMediaTabs } from './components/TratamientoMediaTabs';
import { TratamientoFicha } from './components/TratamientoFicha';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import '@/components/admin/EspecieVegetalForm.css';

export default function EditarTratamientoPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params);
  const {
    router, searchParams, editPdfParam, userEmail, authReady, isMobile,
    activeTab, setActiveTab, isFichaOpen, setIsFichaOpen,
    showAiModal, setShowAiModal, mediaRefreshTrigger, triggerMediaRefresh,
    deleteConfirm, setDeleteConfirm,
    formData, setFormData, loading, saveStatus, plantasParteCatalog,
    photos, refreshPhotos, activeFotoId, handleSetPrimaryPhoto, handleReorderPhoto,
    handleChange, handleMultiSelectChange, handleParteToggle,
    handleDelete, autoSave
  } = useTratamientoEdit(resolvedParams.id);

  if (!authReady || loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
        <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🧪</div>
        <p>Cargando tratamiento...</p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', padding: isMobile ? '0' : '20px', boxSizing: 'border-box', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* Navegación Hierárquica */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', padding: isMobile ? '10px' : '0', flexWrap: 'wrap', width: '100%' }}>
        <PremiumBackButton onClick={() => router.push('/dashboard')} text="🏠 Volver al Inicio" />
        {searchParams.get('from') === 'enlaces' ? (
          <PremiumBackButton onClick={() => router.push('/dashboard/admin/mantenimiento/enlaces')} text="🔗 Volver a Salud de Enlaces" />
        ) : searchParams.get('from') === 'pdfs' ? (
          <PremiumBackButton onClick={() => router.push('/dashboard/admin/pdfs')} text="🔙 Volver a Gestor de PDFs" />
        ) : (
          <PremiumBackButton onClick={() => router.push('/dashboard/admin/tratamientos')} text="🔙 Volver a Tratamientos" />
        )}
      </div>

      {/* Encabezado Premium Contextual */}
      <PremiumSubheader
        title={<>🧪 {resolvedParams.id === 'nuevo' ? 'Nuevo Tratamiento' : formData.tratamientosnombre || 'Edición de Tratamiento'}</>}
        gradient="linear-gradient(135deg, #0f766e, #3b82f6)"
        isMobile={isMobile}
        actions={
          <>
            {resolvedParams.id !== 'nuevo' && (
              <PremiumDeleteButton onClick={() => setDeleteConfirm(true)} />
            )}
          </>
        }
      >
        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
          <PremiumDevInsights modulePath="admin/tratamientos/[id]/page.tsx" />
        </div>
      </PremiumSubheader>

      {/* Estado Global (Activo) */}
      <div style={{ marginBottom: isMobile ? '16px' : '24px', background: 'white', padding: isMobile ? '12px' : '16px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', width: '100%' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold', color: formData.tratamientosactivo ? '#166534' : '#94a3b8' }}>
          <input 
            type="checkbox" name="tratamientosactivo" 
            checked={!!formData.tratamientosactivo} onChange={handleChange}
            style={{ width: '20px', height: '20px', accentColor: '#10b981' }}
          />
          {formData.tratamientosactivo ? 'Tratamiento Activo y Disponible' : 'Tratamiento Inhabilitado'}
        </label>
        <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Controla si este tratamiento puede ser vinculado a las afecciones.</span>
      </div>

      {/* Hero Carousel */}
      <PremiumHeroCarousel
        photos={photos}
        activePhotoId={activeFotoId}
        onSetPrimary={(id) => {
          handleSetPrimaryPhoto(Number(id));
        }}
        onReorder={(dragId, dropId) => {
          handleReorderPhoto(dragId, dropId);
        }}
        fallbackAlt={formData.tratamientosnombre || 'Tratamiento'}
      />

      {/* Ficha de Tratamiento Colapsable */}
      <TratamientoFicha
        id={resolvedParams.id}
        isFichaOpen={isFichaOpen}
        setIsFichaOpen={setIsFichaOpen}
        formData={formData}
        setShowAiModal={setShowAiModal}
        userEmail={userEmail}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        mediaRefreshTrigger={mediaRefreshTrigger}
        triggerMediaRefresh={triggerMediaRefresh}
        handleChange={handleChange}
        handleMultiSelectChange={handleMultiSelectChange}
        handleParteToggle={handleParteToggle}
        plantasParteCatalog={plantasParteCatalog}
        editPdfParam={editPdfParam}
        refreshPhotos={refreshPhotos}
        isMobile={isMobile}
      />

      <TratamientoAIAssistant 
        show={showAiModal} onClose={() => setShowAiModal(false)} 
        currentData={formData} onApplyChanges={async (newData) => { setFormData(newData); await autoSave(newData); }} 
      />

      {deleteConfirm && <DeleteConfirmModal onCancel={() => setDeleteConfirm(false)} onConfirm={handleDelete} />}
    </div>
  );
}
// reload 29/06/2026 16:25:00
