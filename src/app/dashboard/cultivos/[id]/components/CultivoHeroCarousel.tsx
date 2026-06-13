import React from 'react';
import { getMediaUrl } from '@/lib/media-url';
import { Blurhash } from 'react-blurhash';

interface CultivoHeroCarouselProps {
  cultivoPhotos: any[];
  fallbackPhoto: string | null;
  onSetPrimary: (id: string) => void;
}

export default function CultivoHeroCarousel({ cultivoPhotos, fallbackPhoto, onSetPrimary }: CultivoHeroCarouselProps) {
  // Ordenamos para que la principal esté primera
  const sortedPhotos = [...cultivoPhotos].sort((a, b) => b.esPrincipal - a.esPrincipal);
  const primaryPhoto = sortedPhotos[0];
  const thumbPhotos = sortedPhotos.slice(1, 4); // Max 3 miniaturas

  let primaryMeta: any = {};
  if (primaryPhoto && primaryPhoto.resumen) {
    try { primaryMeta = JSON.parse(primaryPhoto.resumen); } catch(e){}
  }

  // Fondo degradado basado en vibrant_color si existe, si no uno por defecto
  const vibrantColor = primaryMeta.vibrant_color || '#10b981';
  const heroBackground = `linear-gradient(135deg, ${vibrantColor}22 0%, ${vibrantColor}66 100%)`;

  const heroImageSrc = primaryPhoto ? getMediaUrl(primaryPhoto.ruta) : (fallbackPhoto ? getMediaUrl(fallbackPhoto) : '/placeholder.jpg');

  return (
    <div className="cultivo-hero" style={{ width: '100%', background: heroBackground, borderRadius: '16px', padding: '24px', marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'center', boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.05)' }}>
      {/* HERO IMAGE 180x220 (3:4) */}
      <div style={{ width: '180px', height: '220px', borderRadius: '12px', overflow: 'hidden', position: 'relative', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', border: '2px solid white', flexShrink: 0 }}>
        {primaryMeta.blurhash && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
            <Blurhash hash={primaryMeta.blurhash} width="100%" height="100%" resolutionX={32} resolutionY={32} punch={1} />
          </div>
        )}
        <img 
          src={heroImageSrc} 
          alt="Foto principal del cultivo" 
          style={{ 
            position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 2,
            objectFit: 'cover',
            objectPosition: primaryPhoto ? `${primaryMeta.profile_object_x || 50}% ${primaryMeta.profile_object_y || 50}%` : 'center',
            transform: primaryPhoto ? `scale(${(primaryMeta.profile_object_zoom || 100) / 100})` : 'none',
            transition: 'all 0.3s ease'
          }} 
          crossOrigin="anonymous" 
        />
      </div>

      {/* MINIATURAS VERTICALES (max 3) */}
      {thumbPhotos.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', height: '220px', justifyContent: 'center' }}>
          {thumbPhotos.map(photo => {
            let thumbMeta: any = {};
            try { thumbMeta = JSON.parse(photo.resumen || '{}'); } catch(e){}
            
            return (
              <div 
                key={photo.id}
                onClick={() => onSetPrimary(photo.id)}
                style={{
                  width: '52px', height: '70px', borderRadius: '8px', overflow: 'hidden', position: 'relative', 
                  border: '2px solid rgba(255,255,255,0.7)', cursor: 'pointer', transition: 'all 0.2s',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = '#8b5cf6';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.7)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
                title="Hacer clic para poner como principal"
              >
                {thumbMeta.blurhash && (
                  <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
                    <Blurhash hash={thumbMeta.blurhash} width="100%" height="100%" resolutionX={32} resolutionY={32} punch={1} />
                  </div>
                )}
                <img 
                  src={getMediaUrl(photo.ruta)} 
                  alt="Miniatura" 
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 2, objectFit: 'cover', objectPosition: 'center' }} 
                  crossOrigin="anonymous" 
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
