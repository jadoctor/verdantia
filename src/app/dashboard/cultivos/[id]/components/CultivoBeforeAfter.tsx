'use client';
import React, { useState, useRef, useCallback } from 'react';
import { getMediaUrl } from '@/lib/media-url';

interface CultivoBeforeAfterProps {
  photos: any[]; // cultivo.fotosLabores — max 4 por ítem según plan
}

export default function CultivoBeforeAfter({ photos }: CultivoBeforeAfterProps) {
  const [sliderPos, setSliderPos] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Necesitamos al menos 2 fotos para comparar
  if (!photos || photos.length < 2) return null;

  // Ordenar cronológicamente por fecha de subida
  const sorted = [...photos].sort((a, b) => {
    const ta = new Date(a.fechaSubida || a.createdAt || 0).getTime();
    const tb = new Date(b.fechaSubida || b.createdAt || 0).getTime();
    return ta - tb;
  });

  const beforePhoto = sorted[0];
  const afterPhoto = sorted[sorted.length - 1];

  const beforeUrl = getMediaUrl(beforePhoto.ruta);
  const afterUrl = getMediaUrl(afterPhoto.ruta);

  const beforeDate = beforePhoto.fechaSubida
    ? new Date(beforePhoto.fechaSubida).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
    : 'Inicio';
  const afterDate = afterPhoto.fechaSubida
    ? new Date(afterPhoto.fechaSubida).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
    : 'Actual';

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.max(2, Math.min(98, (x / rect.width) * 100));
    setSliderPos(pct);
  }, []);

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);
  const handleMouseMove = (e: React.MouseEvent) => { if (isDragging) handleMove(e.clientX); };
  const handleTouchMove = (e: React.TouchEvent) => { handleMove(e.touches[0].clientX); };

  return (
    <div style={{
      background: 'white', borderRadius: '16px',
      border: '1px solid #e2e8f0', padding: '24px',
      marginBottom: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
    }}>
      <h3 style={{ margin: '0 0 16px', fontSize: '1.1rem', color: '#1e293b', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
        📸 Antes y Después
        <span style={{ fontSize: '0.8rem', fontWeight: 400, color: '#94a3b8' }}>Desliza para comparar</span>
      </h3>

      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleMouseUp}
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '4/3',
          borderRadius: '12px',
          overflow: 'hidden',
          cursor: 'ew-resize',
          userSelect: 'none',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
        }}
      >
        {/* Foto "Después" — fondo completo */}
        <img
          src={afterUrl}
          alt="Después"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          crossOrigin="anonymous"
          draggable={false}
        />

        {/* Foto "Antes" — recortada por clip-path */}
        <div style={{
          position: 'absolute', inset: 0,
          clipPath: `inset(0 ${100 - sliderPos}% 0 0)`,
          transition: isDragging ? 'none' : 'clip-path 0.1s ease'
        }}>
          <img
            src={beforeUrl}
            alt="Antes"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
            crossOrigin="anonymous"
            draggable={false}
          />
        </div>

        {/* Línea divisora */}
        <div style={{
          position: 'absolute',
          top: 0, bottom: 0,
          left: `${sliderPos}%`,
          width: '3px',
          background: 'white',
          boxShadow: '0 0 8px rgba(0,0,0,0.4)',
          transform: 'translateX(-50%)',
          zIndex: 10
        }}>
          {/* Handle circular */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '40px', height: '40px',
            borderRadius: '50%',
            background: 'white',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.9rem', fontWeight: 900, color: '#475569'
          }}>
            ◄►
          </div>
        </div>

        {/* Labels */}
        <div style={{
          position: 'absolute', top: '12px', left: '12px',
          background: 'rgba(0,0,0,0.6)', color: 'white',
          padding: '4px 10px', borderRadius: '8px',
          fontSize: '0.75rem', fontWeight: 700, zIndex: 5
        }}>
          📅 {beforeDate}
        </div>
        <div style={{
          position: 'absolute', top: '12px', right: '12px',
          background: 'rgba(0,0,0,0.6)', color: 'white',
          padding: '4px 10px', borderRadius: '8px',
          fontSize: '0.75rem', fontWeight: 700, zIndex: 5
        }}>
          📅 {afterDate}
        </div>
      </div>

      <p style={{ textAlign: 'center', margin: '12px 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
        {sorted.length} fotos en total · Mostrando la más antigua y la más reciente
      </p>
    </div>
  );
}
