import React from 'react';
import AiConfigModal from './AiConfigModal';
import AiComparisonModal from './AiComparisonModal';
import CheckSpeciesModal from './CheckSpeciesModal';
import PhotoEditorModalWrapper from './PhotoEditorModalWrapper';
import PdfEditModal from './PdfEditModal';
import PdfSearchModal from './PdfSearchModal';
import BlogPromptModal from './BlogPromptModal';
import DeleteConfirmModal from './DeleteConfirmModal';
import AiImageModal from './AiImageModal';
import { useEspecieVegetalForm } from '../../hooks/EspecieVegetal/useEspecieVegetalForm';
import { storage } from '@/lib/firebase/config';

interface EspecieModalsSectionProps {
  s: ReturnType<typeof useEspecieVegetalForm>;
  especieId: string | null;
  userEmail: string | null;
}

export default function EspecieModalsSection({
  s,
  especieId,
  userEmail,
}: EspecieModalsSectionProps) {
  const hasPdfChanges = s.editingPdf && (
    s.pdfTitle !== (s.editingPdf.titulo || '') ||
    s.pdfSummary !== (s.editingPdf.resumen || '') ||
    s.pdfApuntes !== (s.editingPdf.apuntes || '')
  );

  return (
    <>
      <AiConfigModal
        isOpen={s.showAiConfig}
        onClose={() => s.setShowAiConfig(false)}
        aiLoading={s.aiLoading}
        aiSeconds={s.aiSeconds}
        runUnifiedAiSearch={s.runUnifiedAiSearch}
        aiConfigTabs={s.aiConfigTabs}
        setAiConfigTabs={s.setAiConfigTabs}
        aiStats={s.aiStats}
        formData={s.formData}
        aiConfigPrompt={s.aiConfigPrompt}
        setAiConfigPrompt={s.setAiConfigPrompt}
        sinSelectedScope={s.sinSelectedScope}
        setSinSelectedScope={s.setSinSelectedScope}
        setSinExtraInstructions={s.setSinExtraInstructions}
        sinScopePresets={s.sinScopePresets}
      />

      <AiComparisonModal
        isOpen={s.showAiModal && s.aiProposal !== null}
        onClose={s.closeAiModal}
        isAssimilating={s.isAssimilating}
        assimilationSeconds={s.assimilationSeconds}
        formData={s.formData}
        aiProposal={s.aiProposal}
        showOnlyDiffs={s.showOnlyDiffs}
        setShowOnlyDiffs={s.setShowOnlyDiffs}
        assimilateAll={s.assimilateAll}
        aiGroups={s.aiGroups}
        aiConfigTabs={s.aiConfigTabs}
        aiModalActiveTab={s.aiModalActiveTab}
        setAiModalActiveTab={s.setAiModalActiveTab}
        masterFases={s.masterFases}
        masterEspecies={s.masterEspecies}
        masterAfecciones={s.masterAfecciones}
        masterIdiomas={s.masterIdiomas}
        masterPaises={s.masterPaises}
        masterAnimales={s.masterAnimales}
        masterLabores={s.masterLabores}
        selectedRels={s.selectedRels}
        setSelectedRels={s.setSelectedRels}
        selectedAiSinonimos={s.selectedAiSinonimos}
        setSelectedAiSinonimos={s.setSelectedAiSinonimos}
        selectedAiVariedades={s.selectedAiVariedades}
        setSelectedAiVariedades={s.setSelectedAiVariedades}
        selectedAiAlimentacion={s.selectedAiAlimentacion}
        setSelectedAiAlimentacion={s.setSelectedAiAlimentacion}
        selectedAiFields={s.selectedAiFields}
        setSelectedAiFields={s.setSelectedAiFields}
        collapsedAiGroups={s.collapsedAiGroups}
        setCollapsedAiGroups={s.setCollapsedAiGroups}
        relaciones={s.relaciones}
        sinonimos={s.sinonimos}
        existingVarieties={s.existingVarieties}
        assimilatedVarietyNames={s.assimilatedVarietyNames}
        alimentacion={s.alimentacion}
        pautas={s.pautas}
        assimilateTab={s.assimilateTab}
        assimilateSingleField={s.assimilateSingleField}
        assimilateSinglePhase={s.assimilateSinglePhase}
        runWithAssimilationLoading={s.runWithAssimilationLoading}
        especieId={especieId}
        userEmail={userEmail}
      />

      <CheckSpeciesModal
        isOpen={s.showCheckModal && s.checkResults !== null}
        onClose={() => s.setShowCheckModal(false)}
        checkResults={s.checkResults}
        setActiveTab={s.setActiveTab}
      />

      <PhotoEditorModalWrapper
        editingPhoto={s.editingPhoto}
        setEditingPhoto={s.setEditingPhoto}
        savePhotoEdits={s.savePhotoEdits}
        deletePhoto={() => s.handleDeleteFile(s.editingPhoto.id, 'photos')}
        photoEditorSaveStatus={s.photoEditorSaveStatus}
        onRecreateAi={() => {
          s.setAiReplacingPhotoId(s.editingPhoto.id);
          s.setShowAiImageModal(true);
        }}
      />

      <PdfEditModal
        isOpen={s.editingPdf !== null}
        onClose={() => s.setEditingPdf(null)}
        editingPdf={s.editingPdf}
        pdfTitle={s.pdfTitle}
        setPdfTitle={s.setPdfTitle}
        pdfSummary={s.pdfSummary}
        setPdfSummary={s.setPdfSummary}
        pdfApuntes={s.pdfApuntes}
        setPdfApuntes={s.setPdfApuntes}
        generatePdfCover={s.generatePdfCover}
        generatingCoverId={s.generatingCoverId}
        savePdfEdits={s.savePdfEdits}
        pdfEditorSaveStatus={s.pdfEditorSaveStatus}
        especieNombre={s.formData.especiesvegetalesnombre}
        hasPdfChanges={!!hasPdfChanges}
      />

      <PdfSearchModal
        isOpen={s.showPdfSearchModal}
        onClose={() => s.setShowPdfSearchModal(false)}
        pdfSearchTopic={s.pdfSearchTopic}
        setPdfSearchTopic={s.setPdfSearchTopic}
        handleSearchPdfs={s.handleRunPdfSearch}
        pdfSearchLoading={s.pdfSearchLoading}
        pdfSearchError={s.pdfSearchError}
        pdfSearchResults={s.pdfSearchResults}
        handleAddPdfLink={s.handleAddPdfLink}
        especieNombre={s.formData.especiesvegetalesnombre}
      />

      <BlogPromptModal
        blogGenPdf={s.blogGenPdf}
        setBlogGenPdf={s.setBlogGenPdf}
        blogGenInstructions={s.blogGenInstructions}
        setBlogGenInstructions={s.setBlogGenInstructions}
        showBlogPrompt={s.showBlogPrompt}
        setShowBlogPrompt={s.setShowBlogPrompt}
        blogGenLoading={s.blogGenLoading}
        blogGenProgress={s.blogGenProgress}
        submitBlogGen={s.handleGenerateBlog}
        formData={s.formData}
        pdfs={s.pdfs}
      />

      <DeleteConfirmModal
        deleteConfirm={s.deleteConfirm}
        setDeleteConfirm={s.setDeleteConfirm}
        confirmDelete={async () => {
          const deletingId = s.deleteConfirm?.id;
          const deletingType = s.deleteConfirm?.type;
          await s.confirmDelete();
          if (deletingType === 'photos' && s.editingPhoto?.id === deletingId) {
            s.setEditingPhoto(null);
          }
        }}
      />

      <AiImageModal
        showAiImageModal={s.showAiImageModal}
        setShowAiImageModal={s.setShowAiImageModal}
        aiImageConcept={s.aiImageConcept}
        setAiImageConcept={s.setAiImageConcept}
        aiImagePromptPreview={s.aiImagePromptPreview}
        setAiImagePromptPreview={s.setAiImagePromptPreview}
        aiImagePromptEdited={s.aiImagePromptEdited}
        setAiImagePromptEdited={s.setAiImagePromptEdited}
        showPromptDetails={s.showPromptDetails}
        setShowPromptDetails={s.setShowPromptDetails}
        aiImageLoading={s.aiImageLoading}
        setAiImageLoading={s.setAiImageLoading}
        aiImageResult={s.aiImageResult}
        setAiImageResult={s.setAiImageResult}
        aiImageDescription={s.aiImageDescription}
        setAiImageDescription={s.setAiImageDescription}
        uploadingPhotos={s.uploadingPhotos}
        setUploadingPhotos={s.setUploadingPhotos}
        formData={s.formData}
        especieId={especieId}
        userEmail={userEmail}
        storage={storage}
        loadAttachments={s.loadAttachments}
        aiReplacingPhotoId={s.aiReplacingPhotoId || s.editingPhoto?.id}
        setAiReplacingPhotoId={s.setAiReplacingPhotoId}
        closePhotoEditor={() => s.setEditingPhoto(null)}
      />
    </>
  );
}
