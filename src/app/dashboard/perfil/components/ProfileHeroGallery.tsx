import React from 'react';
import { useProfileData } from '../hooks/useProfileData';
import { useProfilePhotos } from '../hooks/useProfilePhotos';
import PremiumHeroCarousel from '@/components/ui/PremiumHeroCarousel';

interface ProfileHeroGalleryProps {
  profileData: ReturnType<typeof useProfileData>;
  photosData: ReturnType<typeof useProfilePhotos>;
}

export function ProfileHeroGallery({ profileData, photosData }: ProfileHeroGalleryProps) {
  const { icono } = profileData;
  const { photos, activeFoto, setPhotoPrimary, handleReorder } = photosData;

  return (
    <>
      {photos.length > 0 ? (
        <PremiumHeroCarousel
          photos={photos}
          activePhotoId={activeFoto?.id || null}
          onSetPrimary={(id) => setPhotoPrimary(Number(id))}
          onReorder={(dragId, dropId) => handleReorder(Number(dragId), Number(dropId))}
          fallbackAlt={profileData.nombre || 'Foto de Perfil'}
        />
      ) : (
        <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          {icono && !icono.startsWith('mdi-') ? (
            <span style={{ fontSize: '2.5rem' }}>{icono}</span>
          ) : (
            <span style={{ fontSize: '2.5rem' }}>👤</span>
          )}
          <h2 style={{ margin: 0, color: '#1e293b', fontSize: '1.2rem', fontWeight: 700 }}>Sin fotos en la galería</h2>
        </div>
      )}
    </>
  );
}
