'use client';
import React, { useState } from 'react';
import { getMediaUrl } from '@/lib/media-url';

interface TratamientoHeroProps {
  photos: any[];
  onSetPrimary?: (photoId: number) => void;
  onReorder?: (draggedId: number, targetId: number) => void;
}

const STYLE_FILTERS: Record<string, string> = {
  none: 'none', vivid: 'saturate(1.3) contrast(1.1)', warm: 'sepia(0.25) saturate(1.2)',
  cool: 'saturate(0.9) hue-rotate(15deg)', bw: 'grayscale(1)', vintage: 'sepia(0.4) contrast(0.9) brightness(1.1)',
  dramatic: 'contrast(1.4) saturate(1.2)', soft: 'brightness(1.1) contrast(0.9) saturate(0.9)',
};

export default function TratamientoHero({ photos, onSetPrimary, onReorder }: TratamientoHeroProps) {
  const [draggedThumb, setDraggedThumb] = useState<number | null>(null);
  const [isDragOverHero, setIsDragOverHero] = useState(false);

  if (!photos || photos.length === 0) return null;

  const heroPhoto = photos[0];
  const thumbs = photos.slice(1, 4);

  let heroMeta: any = {};
  try { heroMeta = JSON.parse(heroPhoto.resumen || '{}'); } catch(e){}

  const vibrantColor = heroMeta.vibrant_color || '#1e293b';
  const dominantColor = heroMeta.dominant_color || '#334155';

  let heroFilter = heroMeta.profile_style ? STYLE_FILTERS[heroMeta.profile_style] : 'none';
  if (heroMeta.profile_brightness !== undefined || heroMeta.profile_contrast !== undefined) {
    heroFilter = `brightness(${heroMeta.profile_brightness ?? 100}%) contrast(${heroMeta.profile_contrast ?? 100}%) ${heroFilter}`.trim();
  }

  const handleDragStart = (e: React.DragEvent, id: number) => {
    setDraggedThumb(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleHeroDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverHero(false);
    if (draggedThumb && onSetPrimary) {
      onSetPrimary(draggedThumb);
    }
    setDraggedThumb(null);
  };

  return (
    <div style={{
      display: 'flex', gap: '16px', marginBottom: '24px', padding: '24px',
      background: `linear-gradient(135deg, ${vibrantColor} 0%, ${dominantColor} 100%)`,
      borderRadius: '16px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)',
      alignItems: 'center'
    }}>
      
      {/* Hero Photo */}
      <div 
        onDragOver={(e) => { e.preventDefault(); setIsDragOverHero(true); }}
        onDragLeave={() => setIsDragOverHero(false)}
        onDrop={handleHeroDrop}
        style={{
          width: '180px', height: '220px', borderRadius: '12px', overflow: 'hidden',
          boxShadow: '0 10px 25px rgba(0,0,0,0.3)', position: 'relative', flexShrink: 0,
          border: isDragOverHero ? '3px dashed #10b981' : 'none',
          transition: 'border 0.2s'
        }}
      >
        <img 
          src={getMediaUrl(heroPhoto.ruta)} 
          alt={heroPhoto.nombreOriginal}
          crossOrigin="anonymous"
          style={{
            width: '100%', height: '100%', objectFit: 'cover',
            objectPosition: `${heroMeta.profile_object_x ?? 50}% ${heroMeta.profile_object_y ?? 50}%`,
            transformOrigin: `${heroMeta.profile_object_x ?? 50}% ${heroMeta.profile_object_y ?? 50}%`,
            transform: `scale(${(heroMeta.profile_object_zoom ?? 100) / 100})`,
            filter: heroFilter
          }}
        />
      </div>

      {/* Miniaturas Apiladas */}
      {thumbs.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {thumbs.map((thumb: any) => {
            let tMeta: any = {};
            try { tMeta = JSON.parse(thumb.resumen || '{}'); } catch(e){}
            
            let tFilter = tMeta.profile_style ? STYLE_FILTERS[tMeta.profile_style] : 'none';
            if (tMeta.profile_brightness !== undefined || tMeta.profile_contrast !== undefined) {
              tFilter = `brightness(${tMeta.profile_brightness ?? 100}%) contrast(${tMeta.profile_contrast ?? 100}%) ${tFilter}`.trim();
            }

            return (
              <div 
                key={thumb.id}
                draggable
                onDragStart={(e) => handleDragStart(e, thumb.id)}
                style={{
                  width: '52px', height: '70px', borderRadius: '8px', overflow: 'hidden',
                  cursor: 'grab', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', border: '2px solid transparent',
                  transition: 'transform 0.2s, border 0.2s'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.border = '2px solid #8b5cf6'; e.currentTarget.style.transform = 'scale(1.05)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.border = '2px solid transparent'; e.currentTarget.style.transform = 'scale(1)'; }}
              >
                <img 
                  src={getMediaUrl(thumb.ruta)} 
                  alt={thumb.nombreOriginal}
                  crossOrigin="anonymous"
                  style={{
                    width: '100%', height: '100%', objectFit: 'cover', filter: tFilter
                  }}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
