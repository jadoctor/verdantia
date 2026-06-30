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
import { UsoIaTab } from './components/UsoIaTab';
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

      {/* ── Estado Global en Primer Lugar (Regla 8) ── */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', padding: '16px 24px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Estado de Cuenta:</span>
          {profileData.profile.estadoCuenta === 'activa' || profileData.profile.estadoCuenta === 'activo' ? (
            <span style={{ background: '#dcfce7', color: '#166534', padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 800 }}>✅ ACTIVA</span>
          ) : (
            <span style={{ background: '#fef9c3', color: '#854d0e', padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 800 }}>⚠️ {profileData.profile.estadoCuenta?.toUpperCase() || 'PENDIENTE'}</span>
          )}
        </div>
      </div>

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

      <div style={{ display: activeTab === 'usoia' ? 'block' : 'none' }}>
        <UsoIaTab />
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


// refresh trigger
// refresh trigger
// refresh trigger
// refresh trigger
// refresh trigger
// refresh trigger
// refresh trigger 2
// refresh trigger 3
// refresh trigger 4
// refresh trigger 5
// refresh trigger 6
// refresh trigger 7
// refresh trigger 8
// refresh trigger 9