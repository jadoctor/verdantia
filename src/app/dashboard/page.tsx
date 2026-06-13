'use client';

import { useState, useEffect } from 'react';
import { useDashboard } from './hooks/useDashboard';
import { useCropWizard } from './hooks/useCropWizard';
import { SeedWizardModal } from '@/components/SeedWizardModal';
import GardenMap from '@/components/user/GardenMap';

import DashboardHeader from './components/DashboardHeader';
import OnboardingCTA from './components/OnboardingCTA';
import RangeProgressCard from './components/RangeProgressCard';
import StatsGrid from './components/StatsGrid';
import AchievementsSection from './components/AchievementsSection';
import CropWizardModal from './components/CropWizardModal';

export default function DashboardHome() {
  const [showSeedModal, setShowSeedModal] = useState(false);
  const dashboard = useDashboard();
  const cropWizard = useCropWizard(dashboard.misSemillas, dashboard.reloadProfile);

  useEffect(() => {
    if (!dashboard.loading && dashboard.profile) {
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.get('startCrop') === 'true') {
        cropWizard.openCropWizard();
        const url = new URL(window.location.href);
        url.searchParams.delete('startCrop');
        window.history.replaceState({}, '', url.pathname + url.searchParams.toString());
      }
    }
  }, [dashboard.loading, dashboard.profile, cropWizard.openCropWizard]);

  if (dashboard.loading) return <p className="loading-text">Cargando tu huerto...</p>;

  const displayName = dashboard.profile?.nombreUsuario || dashboard.profile?.nombre || 'Agricultor';

  return (
    <div className="welcome-section" style={{ width: '100%', position: 'relative' }}>
      <DashboardHeader 
        displayName={displayName} 
        onOpenCropWizard={cropWizard.openCropWizard} 
      />

      <OnboardingCTA profile={dashboard.profile} />

      {dashboard.setupMessage && !dashboard.profile && (
        <div className="status-message glass" style={{ padding: '1.5rem', borderLeft: '4px solid var(--primary)', marginBottom: '2rem' }}>
          <p>{dashboard.setupMessage}</p>
          <button
            type="button"
            onClick={dashboard.reloadProfile}
            style={{ marginTop: '10px', padding: '8px 20px', borderRadius: '8px', background: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 700 }}
          >
            Reintentar
          </button>
        </div>
      )}

      {dashboard.profile && (
        <>
          <RangeProgressCard
            todosLogros={dashboard.todosLogros}
            misLogros={dashboard.misLogros}
            misSemillas={dashboard.misSemillas}
            misCultivos={dashboard.misCultivos}
            misMensajesComunidad={dashboard.misMensajesComunidad}
            profile={dashboard.profile}
            isLogrosExpanded={dashboard.isLogrosExpanded}
            setIsLogrosExpanded={dashboard.setIsLogrosExpanded}
            showSemillasDetalle={dashboard.showSemillasDetalle}
            setShowSemillasDetalle={dashboard.setShowSemillasDetalle}
            showCultivoDetalle={dashboard.showCultivoDetalle}
            setShowCultivoDetalle={dashboard.setShowCultivoDetalle}
            openSeedModal={() => setShowSeedModal(true)}
            openCropWizard={cropWizard.openCropWizard}
            isMobile={dashboard.isMobile}
          />

          <StatsGrid
            misCultivos={dashboard.misCultivos}
            misSemillas={dashboard.misSemillas}
            deletingCropId={dashboard.deletingCropId}
            setDeletingCropId={dashboard.setDeletingCropId}
            deletingSeedId={dashboard.deletingSeedId}
            setDeletingSeedId={dashboard.setDeletingSeedId}
            executeDeleteCrop={dashboard.executeDeleteCrop}
            executeDeleteSeed={dashboard.executeDeleteSeed}
            executeInactivateSeed={dashboard.executeInactivateSeed}
            openCropWizard={cropWizard.openCropWizard}
            router={dashboard.router}
          />

          <GardenMap misCultivos={dashboard.misCultivos} profile={dashboard.profile} />

          <AchievementsSection 
            misLogros={dashboard.misLogros} 
            todosLogros={dashboard.todosLogros} 
          />
        </>
      )}

      <SeedWizardModal
        show={showSeedModal}
        onClose={() => setShowSeedModal(false)}
        onSuccess={dashboard.reloadProfile}
      />

      <CropWizardModal
        showCropWizard={cropWizard.showCropWizard}
        setShowCropWizard={cropWizard.setShowCropWizard}
        cropWizardStep={cropWizard.cropWizardStep}
        setCropWizardStep={cropWizard.setCropWizardStep}
        cropWizardEspecies={cropWizard.cropWizardEspecies}
        cropWizardVariedades={cropWizard.cropWizardVariedades}
        selectedCropEspecie={cropWizard.selectedCropEspecie}
        selectedCropVariedad={cropWizard.selectedCropVariedad}
        cropSearchTerm={cropWizard.cropSearchTerm}
        setCropSearchTerm={cropWizard.setCropSearchTerm}
        cropAcquiring={cropWizard.cropAcquiring}
        cropNextNumero={cropWizard.cropNextNumero}
        cropFormData={cropWizard.cropFormData}
        setCropFormData={cropWizard.setCropFormData}
        cropInputGramos={cropWizard.cropInputGramos}
        cropCustomSemillasPorGramo={cropWizard.cropCustomSemillasPorGramo}
        setCropCustomSemillasPorGramo={cropWizard.setCropCustomSemillasPorGramo}
        handleCropGramosChange={cropWizard.handleCropGramosChange}
        selectCropEspecie={cropWizard.selectCropEspecie}
        selectCropVariedad={cropWizard.selectCropVariedad}
        handleSaveCrop={cropWizard.handleSaveCrop}
        getSemillaStock={cropWizard.getSemillaStock}
        isMobile={dashboard.isMobile}
      />
    </div>
  );
}
