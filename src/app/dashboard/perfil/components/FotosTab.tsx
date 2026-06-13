import React, { useRef } from 'react';
import { getMediaUrl } from '@/lib/media-url';
import { getMaxPhotos, AVATAR_ICONS, STYLE_FILTERS } from '../constants/profileConstants';
import { useProfileData } from '../hooks/useProfileData';
import { useProfilePhotos } from '../hooks/useProfilePhotos';

interface FotosTabProps {
  profileData: ReturnType<typeof useProfileData>;
  photosData: ReturnType<typeof useProfilePhotos>;
}

export function FotosTab({ profileData, photosData }: FotosTabProps) {
  const { profile, icono, autoSaveIcon } = profileData;
  const {
    photos,
    uploading,
    dragOver,
    draggingId,
    setPhotoPrimary,
    openPhotoEditor,
    deletePhoto,
    uploadPhoto,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handlePhotoDragStart,
    handlePhotoDragOver,
    handlePhotoDrop
  } = photosData;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  if (!profile) return null;

  const selectIcon = (icon: string) => {
    const newIcon = icono === icon ? null : icon;
    autoSaveIcon(newIcon);
  };

  const maxPhotos = getMaxPhotos(profile.suscripcion);

  return (
    <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', marginBottom: '24px', animation: 'fadeIn 0.3s ease' }}>
      <h3 style={{ margin: '0 0 16px 0', color: '#0f766e', fontSize: '1.1rem', fontWeight: 800 }}>📸 Fotografía e Iconos</h3>
      <div className="accordion-body">
        {/* ── Galería de Fotos ── */}
        <label className="section-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
          <span>Fotos de Perfil</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <small style={{ color: photos.length >= maxPhotos ? '#ef4444' : '#64748b', fontWeight: photos.length >= maxPhotos ? 'bold' : 'normal' }}>
              {photos.length} / {maxPhotos} permitidas ({profile.suscripcion || 'Básica'})
            </small>
            {photos.length >= maxPhotos && (
              <span style={{ 
                background: '#fee2e2', color: '#ef4444', fontSize: '0.65rem', 
                padding: '2px 8px', borderRadius: '10px', border: '1px solid #fecaca',
                fontWeight: 'bold', textTransform: 'uppercase'
              }}>Límite alcanzado</span>
            )}
          </span>
        </label>
        <div className={`photo-gallery-grid ${dragOver ? 'drag-over' : ''}`}>
          {photos.map((photo, i) => {
            let meta: { profile_object_x: number; profile_object_y: number; profile_object_zoom: number; profile_style: string; profile_brightness?: number; profile_contrast?: number } = { profile_object_x: 50, profile_object_y: 38, profile_object_zoom: 100, profile_style: '' };
            try { meta = { ...meta, ...JSON.parse(photo.resumen || '{}') }; } catch {}
            
            const isLocked = i >= maxPhotos;
            
            return (
              <div
                key={photo.id}
                className={`photo-item ${photo.esPrincipal ? 'is-preferred' : ''} ${isLocked ? 'is-locked' : ''} ${draggingId === photo.id ? 'dragging' : ''} ${photo.resultadoValidacion === 'rechazado' ? 'is-rejected' : ''}`}
                style={{ position: 'relative' }}
                draggable={!isLocked && photo.resultadoValidacion !== 'rechazado'}
                onDragStart={(e) => {
                  if (photo.resultadoValidacion !== 'rechazado') {
                    handlePhotoDragStart(e, photo.id);
                  } else {
                    e.preventDefault();
                  }
                }}
                onDragOver={handlePhotoDragOver}
                onDrop={(e) => {
                  if (photo.resultadoValidacion !== 'rechazado') {
                    handlePhotoDrop(e, photo.id);
                  }
                }}
              >
                <img
                  src={getMediaUrl(photo.ruta)}
                  alt="Foto de perfil"
                  crossOrigin="anonymous"
                  style={{
                    cursor: isLocked ? 'not-allowed' : 'default',
                    objectPosition: `${meta.profile_object_x}% ${meta.profile_object_y}%`,
                    transformOrigin: `${meta.profile_object_x}% ${meta.profile_object_y}%`,
                    transform: meta.profile_object_zoom > 100 ? `scale(${meta.profile_object_zoom / 100})` : undefined,
                    filter: isLocked 
                      ? 'grayscale(100%) blur(2px) brightness(0.7)' 
                      : `${STYLE_FILTERS[meta.profile_style] === 'none' ? '' : (STYLE_FILTERS[meta.profile_style] || '')} brightness(${meta.profile_brightness ?? 100}%) contrast(${meta.profile_contrast ?? 100}%)`.trim()
                  }}
                />

                {photo.resultadoValidacion === 'rechazado' ? (
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, background: 'rgba(220, 38, 38, 0.95)', color: 'white', fontSize: '0.65rem', padding: '6px 4px', textAlign: 'center', zIndex: 10, fontWeight: 'bold' }}>
                    ❌ Rechazada<br/>
                    <span style={{ fontSize: '0.55rem', fontWeight: 'normal', opacity: 0.9 }}>
                      {photo.motivoRechazo || 'Incumple las normas'}
                    </span>
                  </div>
                ) : photo.validado === 0 ? (
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, background: 'rgba(245, 158, 11, 0.9)', color: 'white', fontSize: '0.65rem', padding: '6px 4px', textAlign: 'center', zIndex: 10, fontWeight: 'bold' }}>
                    ⏳ Pendiente de validación<br/>
                    <span style={{ fontSize: '0.55rem', fontWeight: 'normal', opacity: 0.9 }}>
                      El equipo revisará esta foto
                    </span>
                  </div>
                ) : null}

                {isLocked && (
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.8)', pointerEvents: 'none', zIndex: 10
                  }}>
                    <span style={{ fontSize: '2rem', marginBottom: '8px' }}>🔒</span>
                    <small style={{ fontWeight: 'bold', textAlign: 'center', padding: '0 10px' }}>Límite de plan superado</small>
                  </div>
                )}

                <div className="photo-actions" style={{ zIndex: 20 }}>
                  {!isLocked && (
                    <>
                      {photo.resultadoValidacion !== 'rechazado' && (
                        <button
                          type="button"
                          className={`photo-action-btn btn-photo-primary ${photo.esPrincipal ? 'is-active' : ''}`}
                          onClick={() => setPhotoPrimary(photo.id)}
                          title={photo.esPrincipal ? 'Foto preferida actual' : 'Marcar como foto preferida'}
                        >{photo.esPrincipal ? '★' : '☆'}</button>
                      )}
                      {photo.resultadoValidacion !== 'rechazado' && (
                        <button
                          type="button"
                          className="photo-action-btn btn-photo-edit"
                          onClick={() => openPhotoEditor(photo)}
                          title="Editar foto"
                        >✏️</button>
                      )}
                    </>
                  )}
                  <button
                    type="button"
                    className="photo-action-btn btn-photo-delete"
                    onClick={() => deletePhoto(photo.id)}
                    title="Eliminar"
                  >✕</button>
                </div>
              </div>
            );
          })}

          {/* Zona de Drop / Subir */}
          {photos.length < maxPhotos && (
            <div
              className="photo-add-card"
              onDragOver={handleDragOver}
              onDragEnter={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {uploading ? (
                <div className="upload-progress">
                  <div className="loading-spinner" style={{ width: '24px', height: '24px' }}></div>
                  <span>Subiendo...</span>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                      onClick={() => fileInputRef.current?.click()}
                    >📁 Galería</button>
                    <button
                      type="button"
                      style={{ padding: '6px 12px', fontSize: '0.78rem', background: '#0ea5e9', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, boxShadow: '0 2px 4px rgba(14, 165, 233, 0.3)' }}
                      onClick={() => cameraInputRef.current?.click()}
                    >📷 Cámara</button>
                  </div>
                  <small className="drop-hint">
                    {dragOver ? '¡Suelta aquí!' : 'También puedes soltar una imagen'}
                  </small>
                </>
              )}
            </div>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={e => {
            const file = e.target.files?.[0];
            if (file) uploadPhoto(file);
            e.target.value = '';
          }}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: 'none' }}
          onChange={e => {
            const file = e.target.files?.[0];
            if (file) uploadPhoto(file);
            e.target.value = '';
          }}
        />

        {/* ── Icono de Perfil ── */}
        <label className="section-label" style={{ marginTop: '24px' }}>Icono de Perfil Alternativo</label>
        <div className="icon-grid">
          {AVATAR_ICONS.map((icon) => (
            <button
              key={icon}
              type="button"
              className={`icon-btn ${icono === icon ? 'selected' : ''}`}
              onClick={() => selectIcon(icon)}
            >
              {icon}
            </button>
          ))}
        </div>
        <small className="help-text">
          Este icono se mostrará como emoji cuando no tengas fotografía. Su guardado es automático al clicar uno.
        </small>
      </div>
    </div>
  );
}
