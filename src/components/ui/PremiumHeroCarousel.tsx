'use client';
import React, { useState } from 'react';
import { getMediaUrl } from '@/lib/media-url';

export interface HeroPhoto {
  id: number | string;
  ruta: string;
  resumen?: string;
  esPrincipal?: number | boolean;
}

interface PremiumHeroCarouselProps {
  photos: HeroPhoto[];
  activePhotoId: number | string | null;
  onSetPrimary: (id: number | string) => void;
  onReorder: (dragId: number | string, dropId: number | string) => void;
  fallbackAlt?: string;
}

// Basic filters matching Verdiantia standard
const STYLE_FILTERS: Record<string, string> = {
  vintage: 'sepia(40%) contrast(110%) saturate(110%)',
  'b&w': 'grayscale(100%) contrast(120%)',
  polaroid: 'sepia(20%) contrast(120%) saturate(120%) hue-rotate(-10deg)',
  dramatic: 'contrast(130%) saturate(120%) brightness(90%)',
  soft: 'brightness(110%) saturate(90%) contrast(90%)',
  none: 'none'
};

export default function PremiumHeroCarousel({
  photos,
  activePhotoId,
  onSetPrimary,
  onReorder,
  fallbackAlt = 'Foto'
}: PremiumHeroCarouselProps) {
  // Drag state for Hero Carousel
  const [draggedPhotoId, setDraggedPhotoId] = useState<number | string | null>(null);
  const [draggedOverPhotoId, setDraggedOverPhotoId] = useState<number | string | null>(null);

  const activePhoto = photos.find(p => p.id === activePhotoId) || photos[0];
  const thumbPhotos = photos.filter(p => p.id !== activePhoto?.id).slice(0, 3);

  // Helper to get filters from resumen
  const getPhotoStyles = (photo: HeroPhoto) => {
    let meta: any = {};
    try { meta = JSON.parse(photo.resumen || '{}'); } catch (e) {}
    
    const styleFilter = STYLE_FILTERS[meta.profile_style] || '';
    const brightness = meta.profile_brightness ?? 100;
    const contrast = meta.profile_contrast ?? 100;
    const fullFilter = `${styleFilter === 'none' ? '' : styleFilter} brightness(${brightness}%) contrast(${contrast}%)`.trim();
    
    return {
      objectPosition: `${meta.profile_object_x ?? 50}% ${meta.profile_object_y ?? 50}%`,
      transformOrigin: `${meta.profile_object_x ?? 50}% ${meta.profile_object_y ?? 50}%`,
      zoom: meta.profile_object_zoom > 100 ? `scale(${meta.profile_object_zoom / 100})` : 'scale(1)',
      filter: fullFilter,
      vibrantColor: meta.vibrant_color || null
    };
  };

  if (!photos || photos.length === 0) {
    return null;
  }

  const activeStyles = getPhotoStyles(activePhoto);
  const vibrantColor = activeStyles.vibrantColor;

  return (
    <div style={{
      marginBottom: '28px',
      borderRadius: '16px',
      border: '1px solid #e2e8f0',
      background: vibrantColor ? `linear-gradient(135deg, #f8fafc 0%, ${vibrantColor}18 60%, ${vibrantColor}30 100%)` : '#f8fafc',
      transition: 'background 0.6s ease',
      overflow: 'hidden'
    }}>
      <div style={{ display: 'flex', gap: 0 }}>
        {/* Hero photo (Strictly 3:4, No texts) */}
        <div 
          className="profile-hero-main" 
          style={{ 
            width: '180px', 
            height: '220px', 
            flexShrink: 0, 
            position: 'relative',
            overflow: 'hidden',
            border: draggedOverPhotoId === 'HERO' ? '4px dashed #10b981' : 'none',
            opacity: draggedOverPhotoId === 'HERO' ? 0.8 : 1,
            transition: 'all 0.2s ease'
          }}
          onDragEnter={(e) => { e.preventDefault(); if (draggedPhotoId !== null) setDraggedOverPhotoId('HERO'); }}
          onDragOver={(e) => { e.preventDefault(); }}
          onDragLeave={() => { if (draggedOverPhotoId === 'HERO') setDraggedOverPhotoId(null); }}
          onDrop={(e) => {
            e.preventDefault();
            if (draggedPhotoId !== null) {
              onSetPrimary(draggedPhotoId);
            }
            setDraggedPhotoId(null);
            setDraggedOverPhotoId(null);
          }}
        >
          {activePhoto && (
            <img
              key={activePhoto.id}
              src={getMediaUrl(activePhoto.ruta)}
              alt={fallbackAlt}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: activeStyles.objectPosition,
                transformOrigin: activeStyles.transformOrigin,
                transform: activeStyles.zoom,
                filter: activeStyles.filter,
                transition: 'opacity 0.3s ease',
                display: 'block',
                pointerEvents: 'none' // Prevent img from interfering with drag events
              }}
              crossOrigin="anonymous"
            />
          )}
        </div>

        {/* Right strip: only photos NOT currently shown as hero, vertically stacked */}
        {thumbPhotos.length > 0 && (
          <div className="profile-hero-thumbnails" style={{ display: 'flex', flexDirection: 'column', gap: '5px', padding: '0 8px', height: '220px', justifyContent: 'center' }}>
            {thumbPhotos.map(p => {
              const styles = getPhotoStyles(p);
              return (
                <div
                  key={p.id}
                  onClick={() => onSetPrimary(p.id)}
                  className={`profile-hero-thumb`}
                  draggable
                  onDragStart={() => setDraggedPhotoId(p.id)}
                  onDragEnter={() => draggedPhotoId !== null && setDraggedOverPhotoId(p.id)}
                  onDragOver={(e) => e.preventDefault()}
                  onDragLeave={() => { if (draggedOverPhotoId === p.id) setDraggedOverPhotoId(null); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (draggedPhotoId !== null && draggedPhotoId !== p.id) {
                      onReorder(draggedPhotoId, p.id);
                    }
                    setDraggedPhotoId(null);
                    setDraggedOverPhotoId(null);
                  }}
                  style={{
                    width: '60px',
                    height: '70px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    cursor: 'grab',
                    flexShrink: 0,
                    border: draggedOverPhotoId === p.id ? '2px dashed #10b981' : '2px solid rgba(0,0,0,0.08)',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                    opacity: draggedPhotoId === p.id ? 0.5 : 1,
                    transform: draggedOverPhotoId === p.id ? 'scale(1.05)' : 'scale(1)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={e => { 
                    if (draggedPhotoId === null) {
                      e.currentTarget.style.transform = 'scale(1.1)'; 
                      e.currentTarget.style.borderColor = '#8b5cf6';
                    }
                  }}
                  onMouseLeave={e => { 
                    if (draggedPhotoId === null) {
                      e.currentTarget.style.transform = 'scale(1)'; 
                      e.currentTarget.style.borderColor = 'rgba(0,0,0,0.08)';
                    }
                  }}
                >
                  <img
                    src={getMediaUrl(p.ruta)}
                    draggable={false}
                    alt=""
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      objectPosition: styles.objectPosition,
                      transformOrigin: styles.transformOrigin,
                      transform: styles.zoom,
                      filter: styles.filter,
                      display: 'block'
                    }}
                    crossOrigin="anonymous"
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
