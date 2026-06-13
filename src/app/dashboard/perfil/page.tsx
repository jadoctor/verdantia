'use client';

import React, { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import './perfil.css';

import { useProfileData } from './hooks/useProfileData';
import { useProfilePhotos } from './hooks/useProfilePhotos';
import { useProfileAvisos } from './hooks/useProfileAvisos';
import { useProfileSecurity } from './hooks/useProfileSecurity';

import { ProfileHeader } from './components/ProfileHeader';
import { ProfileHeroGallery } from './components/ProfileHeroGallery';
import { ProfileTabsNav } from './components/ProfileTabsNav';
import { DatosPersonalesTab } from './components/DatosPersonalesTab';
import { FotosTab } from './components/FotosTab';
import { ComunicacionesTab } from './components/ComunicacionesTab';
import { PreferenciasTab } from './components/PreferenciasTab';
import { SeguridadTab } from './components/SeguridadTab';
import { SuscripcionTab } from './components/SuscripcionTab';
import { LogrosTab } from './components/LogrosTab';
import { RolesTab } from './components/RolesTab';
import { DangerZoneTab } from './components/DangerZoneTab';
import { PhotoEditorModal } from './components/PhotoEditorModal';
import { AchievementModals } from './components/AchievementModals';
import BancalesSettings from '@/components/user/BancalesSettings';

function PerfilContent() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('perfil');

  // Modal states for subscription
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showCompareModal, setShowCompareModal] = useState(false);

  const [isMobile, setIsMobile] = useState(false);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleResize = () => {
        setIsMobile(window.innerWidth <= 768);
      };
      handleResize();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  const profileData = useProfileData();
  const photosData = useProfilePhotos(profileData.profile, profileData.showToast);
  const avisosData = useProfileAvisos(profileData.profile);
  const securityData = useProfileSecurity(profileData.profile, profileData.setProfile, profileData.showToast);

  if (profileData.loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Cargando perfil...</p>
      </div>
    );
  }
  if (!profileData.profile) return null;

  return (
    <div className="perfil-page" style={{ padding: isMobile ? '0 8px' : '0 16px' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 768px) {
          .perfil-page {
            padding: 0 8px !important;
          }
        }
      `}} />

      {profileData.toast && <div className="perfil-toast">{profileData.toast}</div>}

      <ProfileHeader
        profileData={profileData}
        onBackToInicio={() => router.push('/dashboard')}
      />

      <ProfileHeroGallery
        profileData={profileData}
        photosData={photosData}
      />

      <ProfileTabsNav activeTab={activeTab} setActiveTab={setActiveTab} />

      <div style={{ display: activeTab === 'perfil' ? 'block' : 'none' }}>
        <DatosPersonalesTab profileData={profileData} />
      </div>

      <div style={{ display: activeTab === 'fotos' ? 'block' : 'none' }}>
        <FotosTab profileData={profileData} photosData={photosData} />
      </div>

      <div style={{ display: activeTab === 'comunicaciones' ? 'block' : 'none' }}>
        <ComunicacionesTab avisosData={avisosData} />
      </div>

      <div style={{ display: activeTab === 'cultivo' ? 'block' : 'none' }}>
        <PreferenciasTab profileData={profileData} />
      </div>

      <div style={{ display: activeTab === 'bancales' ? 'block' : 'none' }}>
        <BancalesSettings profile={profileData.profile} showToast={profileData.showToast} />
      </div>

      <div style={{ display: activeTab === 'seguridad' ? 'block' : 'none' }}>
        <SeguridadTab profileData={profileData} securityData={securityData} />
      </div>

      <div style={{ display: activeTab === 'suscripcion' ? 'block' : 'none' }}>
        <SuscripcionTab
          profileData={profileData}
          showPlanModal={showPlanModal}
          setShowPlanModal={setShowPlanModal}
          showCompareModal={showCompareModal}
          setShowCompareModal={setShowCompareModal}
        />
      </div>

      <div style={{ display: activeTab === 'logros' ? 'block' : 'none' }}>
        <LogrosTab securityData={securityData} />
      </div>

      <div style={{ display: activeTab === 'roles' ? 'block' : 'none' }}>
        <RolesTab profileData={profileData} />
      </div>

      <div style={{ display: activeTab === 'cuenta' ? 'block' : 'none' }}>
        <DangerZoneTab securityData={securityData} />
      </div>

      {photosData.editingPhoto && (
        <PhotoEditorModal photosData={photosData} />
      )}

      <AchievementModals securityData={securityData} />
    </div>
  );
}

export default function PerfilPage() {
  return (
    <Suspense fallback={<div className="loading-screen"><div className="loading-spinner"></div><p>Cargando perfil...</p></div>}>
      <PerfilContent />
    </Suspense>
  );
}
