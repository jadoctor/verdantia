import React from 'react';
import PremiumSubheader from '@/components/ui/PremiumSubheader';
import PremiumHeroCarousel from '@/components/ui/PremiumHeroCarousel';

interface PhotoType {
  id: string | number;
  ruta: string;
}

interface MultimediaShowcaseProps {
  photos: PhotoType[];
  activePhoto: string | number;
  setActivePhoto: (id: string | number) => void;
  handleReorder: (dragId: string | number, dropId: string | number) => void;
}

export default function MultimediaShowcase({ photos, activePhoto, setActivePhoto, handleReorder }: MultimediaShowcaseProps) {
  return (
    <>
      <div style={{ marginTop: '48px' }}>
        <PremiumSubheader
          title={<>🖼️ Kit de Diseño Premium (Multimedia)</>}
          gradient="linear-gradient(135deg, #0ea5e9, #3b82f6)"
        />
      </div>
      
      <div style={{ marginTop: '24px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', padding: '6px 14px', background: 'rgba(255, 255, 255, 0.9)', border: '1px solid rgba(226, 232, 240, 0.8)', borderRadius: '999px', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '24px', boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)', backdropFilter: 'blur(10px)', letterSpacing: '0.02em' }}>
          PremiumHeroCarousel
        </div>
        <PremiumHeroCarousel
          photos={photos}
          activePhotoId={activePhoto}
          onSetPrimary={setActivePhoto}
          onReorder={handleReorder}
        />
      </div>
    </>
  );
}
