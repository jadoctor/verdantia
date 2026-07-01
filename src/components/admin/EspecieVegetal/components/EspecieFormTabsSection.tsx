import React from 'react';
import PremiumFormTabs from '@/components/ui/PremiumFormTabs';
import PremiumAiButton from '@/components/ui/PremiumAiButton';
import PremiumAutoEnhanceButton from '@/components/ui/PremiumAutoEnhanceButton';
import PremiumCheckButton from '@/components/ui/PremiumCheckButton';
import DetallesTab from './DetallesTab';
import CultivoTab from './CultivoTab';
import TaxonomiaTab from './TaxonomiaTab';
import CalendariosTab from './CalendariosTab';
import BiodinamicaTab from './BiodinamicaTab';
import MediaTab from './MediaTab';
import BlogsTab from './BlogsTab';
import AsociacionesTab from './AsociacionesTab';
import AlimentacionTab from './AlimentacionTab';
import PautasTab from './PautasTab';
import TextosTab from './TextosTab';
import VariedadesTab from './VariedadesTab';
import { useEspecieVegetalForm, MESES, STYLE_FILTERS } from '../../hooks/EspecieVegetal/useEspecieVegetalForm';

interface EspecieFormTabsSectionProps {
  s: ReturnType<typeof useEspecieVegetalForm>;
  especieId: string | null;
  userEmail: string | null;
  focusParam: string | null;
  editPdfParam: string | null;
}

export default function EspecieFormTabsSection({
  s,
  especieId,
  userEmail,
  focusParam,
  editPdfParam,
}: EspecieFormTabsSectionProps) {
  return (
    <div className="especie-form-container">
      <form onSubmit={s.handleSubmit} onBlur={s.handleFormBlur} className="especie-form-body">
        <div
          className="collapsible-header"
          onClick={() => {
            const next = !s.isEspecieOpen;
            s.setIsEspecieOpen(next);
            if (next) s.setActiveTab('taxonomia');
          }}
          style={{
            padding: '15px 24px',
            background: '#e2e8f0',
            cursor: 'pointer',
            fontWeight: 'bold',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '8px'
          }}
        >
          <span style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', flex: 1, minWidth: 0 }}>
            <span>Ficha de Especie</span>
            {!s.isEspecieOpen && s.formData.especiesvegetalesnombre && (
              <span style={{ color: '#475569', fontWeight: 'normal', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                — {s.formData.especiesvegetalesnombre}{' '}
                {s.formData.especiesvegetalesnombrecientifico
                  ? `(${s.formData.especiesvegetalesnombrecientifico})`
                  : ''}
              </span>
            )}
          </span>
          <span style={{ flexShrink: 0 }}>{s.isEspecieOpen ? '▲' : '▼'}</span>
        </div>

        {s.isEspecieOpen && (
          <div className="collapsible-content">
            <div
              style={{
                padding: '15px 24px',
                background: '#fff',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                flexWrap: 'wrap',
                gap: '16px',
              }}
            >
              <PremiumAiButton 
                onClick={s.callAI}
                isLoading={s.aiLoading}
                loadingText={`⏳ Analizando... ${s.aiSeconds}s`}
              />
              {especieId && (
                <PremiumCheckButton 
                  onClick={s.handleCheckSpecies}
                  isLoading={s.checking}
                  loadingText="Chequeando..."
                  text="Chekeo"
                />
              )}
            </div>

            <PremiumFormTabs
              tabs={[
                { id: 'taxonomia', label: '🧬 Identificación' },
                { id: 'cultivo', label: '🌱 Requisitos y Suelo' },
                { id: 'fases', label: '⏳ Cronología y Calendarios' },
                { id: 'biodinamica', label: '🌙 Luna y Biodinámica' },
                { id: 'asociaciones', label: '🤝 Ecosistema' },
                { id: 'textos', label: '📝 Textos y Autosuficiencia' },
                { id: 'alimentacion', label: '🐄 Alimentación Animal' },
                { id: 'variedades', label: '🌱 Variedades' },
                { id: 'pautas', label: '📋 Labores' },
                { id: 'photos', label: '📷 Fotos' },
                { id: 'pdfs', label: '📄 PDFs' },
                { id: 'blogs', label: '📰 Blogs' },
              ]}
              activeTab={s.activeTab}
              onTabChange={s.setActiveTab}
            />

            <div className="form-tab-content">
              <DetallesTab
                formData={s.formData}
                masterFamilias={s.masterFamilias}
                handleChange={s.handleChange}
                activeTab={s.activeTab}
              />
              <TaxonomiaTab
                sinonimos={s.sinonimos}
                setSinonimos={s.setSinonimos}
                sinonimosDirty={s.sinonimosDirty}
                setSinonimosDirty={s.setSinonimosDirty}
                masterIdiomas={s.masterIdiomas}
                masterPaises={s.masterPaises}
                saveSinonimosNow={s.saveSinonimosNow}
                sinonimosAiLoading={s.sinonimosAiLoading}
                especieId={especieId}
                TABLE_MIN_WIDTH={s.TABLE_MIN_WIDTH}
                activeTab={s.activeTab}
              />
              <CultivoTab
                formData={s.formData}
                handleChange={s.handleChange}
                setFormData={s.setFormData}
                autoSaveField={s.autoSaveField}
                activeTab={s.activeTab}
              />
              <CalendariosTab
                formData={s.formData}
                setFormData={s.setFormData}
                handleChange={s.handleChange}
                autoSaveFases={s.autoSaveFases}
                masterFases={s.masterFases}
                MESES={MESES}
                isMobile={s.isMobile}
                CALENDAR_MIN_WIDTH={s.CALENDAR_MIN_WIDTH}
                activeTab={s.activeTab}
              />
              <BiodinamicaTab
                formData={s.formData}
                handleChange={s.handleChange}
                activeTab={s.activeTab}
              />
              <AsociacionesTab
                relaciones={s.relaciones}
                setRelaciones={s.setRelaciones}
                setRelacionesDirty={s.setRelacionesDirty}
                relacionesSaveStatus={s.relacionesSaveStatus}
                masterEspecies={s.masterEspecies}
                masterAfecciones={s.masterAfecciones}
                saveRelacionesNow={s.saveRelacionesNow}
                especieId={especieId}
                isMobile={s.isMobile}
                activeTab={s.activeTab}
              />
              <TextosTab
                formData={s.formData}
                handleChange={s.handleChange}
                activeTab={s.activeTab}
                calcPersonas={s.calcPersonas}
                setCalcPersonas={s.setCalcPersonas}
              />
              <AlimentacionTab
                alimentacion={s.alimentacion}
                setAlimentacion={s.setAlimentacion}
                alimentacionDirty={s.alimentacionDirty}
                setAlimentacionDirty={s.setAlimentacionDirty}
                masterAnimales={s.masterAnimales}
                masterPlantasPartes={s.masterPlantasPartes}
                saveAlimentacionNow={s.saveAlimentacionNow}
                especieId={especieId}
                isMobile={s.isMobile}
                TABLE_MIN_WIDTH={s.TABLE_MIN_WIDTH}
                activeTab={s.activeTab}
                alimentacionFiltroAnimal={s.alimentacionFiltroAnimal}
                setAlimentacionFiltroAnimal={s.setAlimentacionFiltroAnimal}
                alimentacionFiltroAptitud={s.alimentacionFiltroAptitud}
                setAlimentacionFiltroAptitud={s.setAlimentacionFiltroAptitud}
              />
              <VariedadesTab
                especieId={especieId}
                userEmail={userEmail}
                focusParam={focusParam}
                activeTab={s.activeTab}
              />
              <PautasTab
                especieId={especieId}
                activeTab={s.activeTab}
                pautas={s.pautas}
                pautasFiltroFase={s.pautasFiltroFase}
                setPautasFiltroFase={s.setPautasFiltroFase}
                pautasFiltroLabor={s.pautasFiltroLabor}
                setPautasFiltroLabor={s.setPautasFiltroLabor}
                pautasFiltroLaboreo={s.pautasFiltroLaboreo}
                setPautasFiltroLaboreo={s.setPautasFiltroLaboreo}
                editingPauta={s.editingPauta}
                setEditingPauta={s.setEditingPauta}
                pautaForm={s.pautaForm}
                setPautaForm={s.setPautaForm}
                showAddPautaForm={s.showAddPautaForm}
                setShowAddPautaForm={s.setShowAddPautaForm}
                pautasAiLoading={s.pautasAiLoading}
                setPautasAiLoading={s.setPautasAiLoading}
                pautasAiSeconds={s.pautasAiSeconds}
                setPautasAiSeconds={s.setPautasAiSeconds}
                showPautasAiModal={s.showPautasAiModal}
                setShowPautasAiModal={s.setShowPautasAiModal}
                aiPautasProposal={s.aiPautasProposal}
                setAiPautasProposal={s.setAiPautasProposal}
                showPautasConfig={s.showPautasConfig}
                setShowPautasConfig={s.setShowPautasConfig}
                pautasConfigPromptOpen={s.pautasConfigPromptOpen}
                setPautasConfigPromptOpen={s.setPautasConfigPromptOpen}
                pautasExtraInstructions={s.pautasExtraInstructions}
                setPautasExtraInstructions={s.setPautasExtraInstructions}
                masterFases={s.masterFases}
                masterLabores={s.masterLabores}
                loadPautas={s.loadPautas}
                setToastMessage={s.setToastMessage}
                isMobile={s.isMobile}
                formData={s.formData}
                userEmail={userEmail}
                pautasTimerRef={s.pautasTimerRef}
              />
              <MediaTab
                especieId={especieId}
                userEmail={userEmail}
                photos={s.photos}
                uploadingPhotos={s.uploadingPhotos}
                dragOverPhotos={s.dragOverPhotos}
                setDragOverPhotos={s.setDragOverPhotos}
                setDraggedPhotoIndex={s.setDraggedPhotoIndex}
                setDraggedOverPhotoIndex={s.setDraggedOverPhotoIndex}
                handlePhotoReorder={s.handlePhotoReorder}
                handleSetPrimaryPhoto={s.handleSetPrimaryPhoto}
                setDeleteConfirm={s.setDeleteConfirm}
                openPhotoEditor={s.openPhotoEditor}
                handleFileUpload={s.handleFileUpload}
                setShowAiImageModal={s.setShowAiImageModal}
                formData={s.formData}
                activeTab={s.activeTab}
                pdfs={s.pdfs}
                setPdfs={s.setPdfs}
                editPdfParam={editPdfParam}
                STYLE_FILTERS={STYLE_FILTERS}
              />
              <BlogsTab
                especieId={especieId}
                userEmail={userEmail}
                formData={s.formData}
                activeTab={s.activeTab}
                pdfs={s.pdfs}
                blogGenPdf={s.blogGenPdf}
                setBlogGenPdf={s.setBlogGenPdf}
                setShowBlogPrompt={s.setShowBlogPrompt}
                blogGenLoading={s.blogGenLoading}
                blogGenProgress={s.blogGenProgress}
                blogs={s.blogs}
                handleDeleteBlog={s.handleDeleteBlog}
              />
            </div>

            <div className="form-footer">
              {s.hasChanges && (
                <button type="submit" disabled={s.loading} className="btn-save">
                  {s.loading ? 'Guardando...' : 'Guardar Especie'}
                </button>
              )}
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
