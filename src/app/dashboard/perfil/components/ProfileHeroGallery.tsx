import React from 'react';
import { getMediaUrl } from '@/lib/media-url';
import { STYLE_FILTERS } from '../constants/profileConstants';
import { useProfileData } from '../hooks/useProfileData';
import { useProfilePhotos } from '../hooks/useProfilePhotos';

interface ProfileHeroGalleryProps {
  profileData: ReturnType<typeof useProfileData>;
  photosData: ReturnType<typeof useProfilePhotos>;
}

export function ProfileHeroGallery({ profileData, photosData }: ProfileHeroGalleryProps) {
  const { nombre, icono } = profileData;
  const { photos, activeFoto, setActiveFotoId, setPhotoPrimary } = photosData;

  return (
    <div
      style={{
        marginBottom: '28px',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        background: 'linear-gradient(135deg, #f8fafc 0%, #14b8a612 60%, #10b98120 100%)',
        transition: 'background 0.6s ease',
        overflow: 'hidden'
      }}
    >
      {photos.length > 0 ? (
        <div className="profile-hero-gallery">
          {/* Hero photo */}
          <div className="profile-hero-main">
            {activeFoto && (() => {
              let hMeta: any = {};
              try { hMeta = JSON.parse(activeFoto.resumen || '{}'); } catch (e) {}
              const fullFilter = `${STYLE_FILTERS[hMeta.profile_style] === 'none' ? '' : (STYLE_FILTERS[hMeta.profile_style] || '')} brightness(${hMeta.profile_brightness ?? 100}%) contrast(${hMeta.profile_contrast ?? 100}%)`.trim();
              return (
                <>
                  <img
                    key={activeFoto.id}
                    src={getMediaUrl(activeFoto.ruta)}
                    alt={nombre}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      objectPosition: `${hMeta.profile_object_x ?? 50}% ${hMeta.profile_object_y ?? 38}%`,
                      transformOrigin: `${hMeta.profile_object_x ?? 50}% ${hMeta.profile_object_y ?? 38}%`,
                      transform: hMeta.profile_object_zoom > 100 ? `scale(${hMeta.profile_object_zoom / 100})` : undefined,
                      filter: fullFilter,
                      transition: 'opacity 0.3s ease'
                    }}
                    crossOrigin="anonymous"
                  />
                  
                  {/* Badge / Button Overlay */}
                  <div style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 10 }}>
                    {activeFoto.esPrincipal ? (
                      <span
                        style={{
                          background: '#10b981',
                          color: 'white',
                          fontSize: '0.68rem',
                          padding: '4px 10px',
                          borderRadius: '20px',
                          fontWeight: 700,
                          boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                        }}
                      >
                        ⭐ Principal
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setPhotoPrimary(activeFoto.id)}
                        style={{
                          background: 'rgba(15, 23, 42, 0.75)',
                          color: 'white',
                          border: '1px solid rgba(255,255,255,0.2)',
                          borderRadius: '20px',
                          padding: '4px 10px',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                          backdropFilter: 'blur(4px)',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#10b981';
                          e.currentTarget.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(15, 23, 42, 0.75)';
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                      >
                        ☆ Hacer Principal
                      </button>
                    )}
                  </div>
                </>
              );
            })()}
          </div>

          {/* Right strip: only photos NOT currently shown as hero */}
          {photos.filter(p => p.id !== activeFoto?.id).length > 0 && (
            <div className="profile-hero-thumbnails">
              {photos
                .filter(p => p.id !== activeFoto?.id)
                .slice(0, 3) // Muestra hasta 3 miniaturas
                .map(p => {
                  let tMeta: any = {};
                  try { tMeta = JSON.parse(p.resumen || '{}'); } catch (e) { }
                  return (
                    <div
                      key={p.id}
                      onClick={() => setActiveFotoId(p.id)}
                      className={`profile-hero-thumb ${p.esPrincipal ? 'is-preferred' : ''}`}
                      style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        flexShrink: 0,
                        border: p.esPrincipal ? '2.5px solid #f59e0b' : '2px solid rgba(0,0,0,0.08)',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)'; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                    >
                      <img
                        src={getMediaUrl(p.ruta)}
                        draggable={false}
                        alt=""
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          objectPosition: `${tMeta.profile_object_x ?? 50}% ${tMeta.profile_object_y ?? 38}%`,
                          filter: `${STYLE_FILTERS[tMeta.profile_style] === 'none' ? '' : (STYLE_FILTERS[tMeta.profile_style] || '')} brightness(${tMeta.profile_brightness ?? 100}%) contrast(${tMeta.profile_contrast ?? 100}%)`.trim()
                        }}
                        crossOrigin="anonymous"
                      />
                    </div>
                  );
                })}
            </div>
          )}
        </div>
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
    </div>
  );
}
