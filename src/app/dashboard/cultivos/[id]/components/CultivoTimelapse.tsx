import React, { useState, useEffect } from 'react';
import { getMediaUrl } from '@/lib/media-url';

interface CultivoTimelapseProps {
  photos: any[];
  onClose: () => void;
}

export default function CultivoTimelapse({ photos, onClose }: CultivoTimelapseProps) {
  // Las fotos vienen de la API ordenadas por fechacreacion DESC, pero para el Timelapse las queremos ASC (cronológicas)
  const chronologicalPhotos = [...photos].reverse();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  const DURATION_MS = 4000;

  useEffect(() => {
    let startTime = Date.now();
    let animationFrameId: number;

    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed >= DURATION_MS) {
        if (currentIndex < chronologicalPhotos.length - 1) {
          setCurrentIndex(prev => prev + 1);
          startTime = Date.now();
          setProgress(0);
          animationFrameId = requestAnimationFrame(updateProgress);
        } else {
          // Si es la última foto, se queda al 100% y luego se cierra tras 1 segundo
          setProgress(100);
          setTimeout(onClose, 1000);
        }
      } else {
        setProgress((elapsed / DURATION_MS) * 100);
        animationFrameId = requestAnimationFrame(updateProgress);
      }
    };

    animationFrameId = requestAnimationFrame(updateProgress);

    return () => cancelAnimationFrame(animationFrameId);
  }, [currentIndex, chronologicalPhotos.length, onClose]);

  const handleNext = () => {
    if (currentIndex < chronologicalPhotos.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setProgress(0);
    }
  };

  if (chronologicalPhotos.length === 0) return null;

  const currentPhoto = chronologicalPhotos[currentIndex];
  let meta: any = {};
  try { meta = JSON.parse(currentPhoto.resumen || '{}'); } catch(e){}

  const formatShortDate = (isoStr: string) => {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999, background: '#000',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
    }}>
      {/* Botón de cierre */}
      <button 
        onClick={onClose}
        style={{
          position: 'absolute', top: '24px', right: '24px', zIndex: 10001,
          background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white',
          width: '40px', height: '40px', borderRadius: '50%', fontSize: '1.5rem',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}
      >
        ×
      </button>

      {/* Progreso tipo Stories */}
      <div style={{
        position: 'absolute', top: '16px', left: '16px', right: '16px', zIndex: 10001,
        display: 'flex', gap: '6px'
      }}>
        {chronologicalPhotos.map((_, idx) => (
          <div key={idx} style={{
            flex: 1, height: '4px', background: 'rgba(255,255,255,0.3)', borderRadius: '2px', overflow: 'hidden'
          }}>
            <div style={{
              height: '100%', background: 'white',
              width: idx < currentIndex ? '100%' : idx === currentIndex ? `${progress}%` : '0%',
              transition: idx === currentIndex ? 'none' : 'width 0.2s'
            }} />
          </div>
        ))}
      </div>

      {/* Contenedor principal de la foto (proporción 3:4 o cover de pantalla completa en móvil) */}
      <div style={{
        position: 'relative', width: '100%', maxWidth: '480px', height: '100%', maxHeight: '800px',
        background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
      }}>
        {/* Zonas de tap transparentes para avanzar/retroceder */}
        <div onClick={handlePrev} style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '40%', zIndex: 10000 }} />
        <div onClick={handleNext} style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: '60%', zIndex: 10000 }} />

        <img 
          src={getMediaUrl(currentPhoto.ruta)} 
          alt="Evolución"
          style={{
            width: '100%', height: '100%', objectFit: 'cover',
            objectPosition: `${meta.profile_object_x || 50}% ${meta.profile_object_y || 50}%`,
            transform: `scale(${(meta.profile_object_zoom || 100) / 100})`
          }}
          crossOrigin="anonymous"
        />

        {/* Metadatos en la parte inferior */}
        <div style={{
          position: 'absolute', bottom: '40px', left: '24px', right: '24px', zIndex: 10001,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)', padding: '16px', borderRadius: '16px',
          color: 'white'
        }}>
          <h2 style={{ margin: '0 0 4px', fontSize: '1.2rem', fontWeight: 800 }}>
            {meta.fase ? `Fase: ${meta.fase}` : 'Evolución del Cultivo'}
          </h2>
          <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.8 }}>
            {formatShortDate(currentPhoto.datosadjuntosfechacreacion || currentPhoto.fecha)}
          </p>
        </div>
      </div>
    </div>
  );
}
