import React from 'react';
import TratamientoHealthCheck from '@/components/admin/TratamientoHealthCheck';
import { TratamientoDetallesTab } from './TratamientoDetallesTab';
import { TratamientoMediaTabs } from './TratamientoMediaTabs';

export function TratamientoFicha({
  id,
  isFichaOpen,
  setIsFichaOpen,
  formData,
  setShowAiModal,
  userEmail,
  activeTab,
  setActiveTab,
  mediaRefreshTrigger,
  triggerMediaRefresh,
  handleChange,
  handleMultiSelectChange,
  handleParteToggle,
  plantasParteCatalog,
  editPdfParam,
  refreshPhotos,
  isMobile
}: any) {
  return (
    <div className="especie-form-container">
      <form onSubmit={(e) => e.preventDefault()} className="especie-form-body">
        <div className="collapsible-header" onClick={() => setIsFichaOpen(!isFichaOpen)}
          style={{ padding: '15px 24px', background: '#e2e8f0', cursor: 'pointer', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>
            Ficha de Tratamiento
            {!isFichaOpen && formData.tratamientosnombre && (
              <span style={{ color: '#475569', marginLeft: '10px', fontWeight: 'normal' }}>— {formData.tratamientosnombre}</span>
            )}
          </span>
          <span>{isFichaOpen ? '▲' : '▼'}</span>
        </div>

        {isFichaOpen && (
          <div className="collapsible-content">
            {/* Action Bar */}
            <div style={{ padding: '15px 24px', background: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '16px', flexWrap: 'wrap', width: '100%' }}>
              <button type="button" onClick={() => setShowAiModal(true)} className="btn-ai" style={{ 
                margin: 0, background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', color: 'white', fontWeight: 'bold',
                boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)', cursor: 'pointer', border: 'none', borderRadius: '8px',
                padding: '8px 16px', display: 'inline-flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s ease', flexShrink: 0
              }}>
                <span style={{ fontSize: '1.25rem' }}>✨</span> Asistente IA
              </button>
              {id !== 'nuevo' && (
                <div style={{ flex: 1 }}>
                  <TratamientoHealthCheck formData={formData} tratamientoId={id} userEmail={userEmail!} onNavigateTab={setActiveTab} refreshTrigger={mediaRefreshTrigger} />
                </div>
              )}
            </div>

            <div className="form-tabs">
              <button type="button" className={activeTab === 'detalles' ? 'active' : ''} onClick={() => setActiveTab('detalles')}>📝 Detalles</button>
              <button type="button" className={activeTab === 'fotos' ? 'active' : ''} onClick={() => setActiveTab('fotos')}>📷 Fotos</button>
              <button type="button" className={activeTab === 'pdfs' ? 'active' : ''} onClick={() => setActiveTab('pdfs')}>📄 PDFs</button>
              <button type="button" className={activeTab === 'blogs' ? 'active' : ''} onClick={() => setActiveTab('blogs')}>✍️ Blogs IA</button>
            </div>

            <div className="form-tab-content">
              <div className="grid-form" style={{ display: activeTab === 'detalles' ? 'block' : 'none', padding: isMobile ? '16px' : '24px' }}>
                <TratamientoDetallesTab
                  formData={formData} handleChange={handleChange}
                  handleMultiSelectChange={handleMultiSelectChange} handleParteToggle={handleParteToggle}
                  plantasParteCatalog={plantasParteCatalog} isMobile={isMobile}
                />
              </div>

              <TratamientoMediaTabs
                activeTab={activeTab} id={id} userEmail={userEmail!}
                formData={formData} refreshPhotos={refreshPhotos}
                triggerMediaRefresh={triggerMediaRefresh} mediaRefreshTrigger={mediaRefreshTrigger}
                editPdfParam={editPdfParam}
              />
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
