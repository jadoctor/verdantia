'use client';
import React, { useState } from 'react';
import { getMediaUrl } from '@/lib/media-url';
import styles from './PremiumHeroCarousel.module.css';

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
    <div 
      className={styles.container}
      style={{
        background: vibrantColor ? `linear-gradient(135deg, transparent 0%, ${vibrantColor}10 60%, ${vibrantColor}20 100%)` : 'transparent'
      }}
    >
      <div className={styles.flexContainer}>
        {/* Hero photo (Strictly 3:4, No texts) */}
        <div 
          className={`${styles.heroMain} ${draggedOverPhotoId === 'HERO' ? styles.dragOver : ''}`}
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
              className={styles.heroImg}
              style={{
                objectPosition: activeStyles.objectPosition,
                transformOrigin: activeStyles.transformOrigin,
                transform: activeStyles.zoom,
                filter: activeStyles.filter
              }}
              crossOrigin="anonymous"
            />
          )}
        </div>

        {/* Right strip: only photos NOT currently shown as hero, vertically stacked */}
        {thumbPhotos.length > 0 && (
          <div className={styles.thumbnails}>
            {thumbPhotos.map(p => {
              const stylesP = getPhotoStyles(p);
              return (
                <div
                  key={p.id}
                  onClick={() => onSetPrimary(p.id)}
                  className={`${styles.thumbItem} ${draggedPhotoId === p.id ? styles.dragging : ''} ${draggedOverPhotoId === p.id ? styles.dragOver : ''}`}
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
                >
                  <img
                    src={getMediaUrl(p.ruta)}
                    draggable={false}
                    alt=""
                    className={styles.thumbImg}
                    style={{
                      objectPosition: stylesP.objectPosition,
                      transformOrigin: stylesP.transformOrigin,
                      transform: stylesP.zoom,
                      filter: stylesP.filter
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
