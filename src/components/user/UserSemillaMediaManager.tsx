'use client'; // Force hot-reload: 2026-06-18T19:52:25
import React, { useState, useEffect, useRef } from 'react';
import { Blurhash } from 'react-blurhash';
import { getMediaUrl } from '@/lib/media-url';
import { storage } from '@/lib/firebase/config';
import { ref, uploadBytes } from 'firebase/storage';
import ConsentimientoFotoModal from '@/components/user/ConsentimientoFotoModal';
import PhotoEditorModal from '@/components/ui/PremiumPhotoEditor';
import '@/components/admin/EspecieVegetalForm.css';

interface UserSemillaMediaManagerProps {
  semillaId: string;
  userEmail: string;
  suscripcion?: string;
  onMediaChange?: () => void;
  initialPhotos?: any[];
}

function getMaxPhotos(suscripcion: string): number {
  const cleanName = (suscripcion || '').toLowerCase();
  if (cleanName.includes('premium')) return 4;
  if (cleanName.includes('avanzado') || cleanName.includes('profesional')) return 3;
  if (cleanName.includes('esencial') || cleanName.includes('avanzada')) return 2;
  return 1; // Gratuito / Básica
}

export default function UserSemillaMediaManager({ semillaId, userEmail, suscripcion = 'Básica', onMediaChange, initialPhotos = [] }: UserSemillaMediaManagerProps) {
  const maxPhotos = getMaxPhotos(suscripcion);
  const [photos, setPhotos] = useState<any[]>(initialPhotos);
  const [uploading, setUploading] = useState(false);

  // Consentimiento de fotos
  const [consentimiento, setConsentimiento] = useState<number | null | undefined>(undefined); // undefined=cargando
  const [mostrarModalConsentimiento, setMostrarModalConsentimiento] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Photo Editor States
  const [editingPhoto, setEditingPhoto] = useState<any>(null);
  const [photoEditorSaveStatus, setPhotoEditorSaveStatus] = useState<'idle' | 'saving' | 'no-changes'>('idle');

  // Drag and Drop States
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  useEffect(() => {
    if (semillaId && userEmail) {
      if (!initialPhotos || initialPhotos.length === 0) {
        loadMedia();
      }
      checkConsentimiento();
    }
  }, [semillaId, userEmail]);

  useEffect(() => {
    if (initialPhotos && initialPhotos.length > 0) {
      setPhotos(initialPhotos);
    }
  }, [initialPhotos]);

  const checkConsentimiento = async () => {
    try {
      const res = await fetch('/api/user/consentimiento-foto', { headers: { 'x-user-email': userEmail } });
      const data = await res.json();
      setConsentimiento(data.consentimiento); // null | 0 | 1
    } catch (e) {
      console.error('Error checking consentimiento:', e);
    }
  };

  // Intercepta el click en "Añadir foto" y verifica consentimiento primero
  const handleClickAddPhoto = async () => {
    if (consentimiento === 1) {
      // Ya aceptó → abrir directamente
      fileInputRef.current?.click();
    } else if (consentimiento === 0) {
      // Rechazó → informar
      alert('Tienes la galería de fotos desactivada. Puedes reactivarla desde tu perfil aceptando las condiciones de uso de imágenes.');
    } else {
      // null = no preguntado → mostrar modal
      setMostrarModalConsentimiento(true);
    }
  };

  const loadMedia = async () => {
    try {
      const res = await fetch(`/api/user/semillas/${semillaId}/photos`, { headers: { 'x-user-email': userEmail } });
      const data = await res.json();
      setPhotos(data.photos || []);
      if (onMediaChange) onMediaChange();
    } catch (e) {
      console.error('Error loading media:', e);
    }
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        const tempPath = `uploads/temp/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const storageRef = ref(storage, tempPath);
        await uploadBytes(storageRef, file);
        const rawStoragePath = storageRef.fullPath;

        const res = await fetch(`/api/user/semillas/${semillaId}/photos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail },
          body: JSON.stringify({ rawStoragePath, originalFilename: file.name })
        });

        if (!res.ok) {
          console.error('Failed to process file', await res.text());
        }
      }

      await loadMedia();
    } catch (err) {
      console.error(err);
      alert('Error uploading file');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Seguro que quieres eliminar esta foto de tu semilla?')) return;

    try {
      const res = await fetch(`/api/user/semillas/${semillaId}/photos?photoId=${id}`, {
        method: 'DELETE',
        headers: { 'x-user-email': userEmail }
      });
      if (res.ok) {
        await loadMedia();
      }
    } catch (e) {
      console.error('Error deleting:', e);
    }
  };

  const setPrimaryPhoto = async (photoId: string) => {
    try {
      const res = await fetch(`/api/user/semillas/${semillaId}/photos`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail },
        body: JSON.stringify({ action: 'setPrimary', photoId })
      });
      if (res.ok) {
        await loadMedia();
      }
    } catch (e) {
      console.error('Error setting primary:', e);
    }
  };

  const openPhotoEditor = (photo: any) => {
    setEditingPhoto(photo);
  };

  const savePhotoEdits = async (metadata: any) => {
    if (!editingPhoto) return;
    if (metadata.noChanges) {
      setPhotoEditorSaveStatus('no-changes');
      return;
    }
    setPhotoEditorSaveStatus('saving');
    try {
      let meta: any = {};
      try { meta = JSON.parse(editingPhoto.resumen || '{}'); } catch (e) { }

      const newMeta = {
        ...meta,
        ...metadata
      };

      const res = await fetch(`/api/user/semillas/${semillaId}/photos`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail },
        body: JSON.stringify({
          action: 'updateMeta',
          photoId: editingPhoto.id,
          resumen: JSON.stringify(newMeta)
        })
      });

      if (res.ok) {
        await loadMedia();
      }
    } catch (e) {
      console.error('Error saving photo edits:', e);
      alert('Error al guardar los cambios de la foto');
    } finally {
      setPhotoEditorSaveStatus('idle');
    }
  };

  // Fotos que pertenecen al usuario
  const userPhotos = photos.filter(p => p.origen === 'usuario');

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggingId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (draggingId && draggingId !== id) {
      setDragOverId(id);
    }
  };

  const handleDrop = async (e: React.DragEvent, id: string) => {
    e.preventDefault();
    setDragOverId(null);
    if (!draggingId || draggingId === id) {
      setDraggingId(null);
      return;
    }

    const newUserPhotos = [...userPhotos];
    const dragIndex = newUserPhotos.findIndex(p => p.id === draggingId);
    const dropIndex = newUserPhotos.findIndex(p => p.id === id);

    if (dragIndex === -1 || dropIndex === -1) return;

    const [draggedItem] = newUserPhotos.splice(dragIndex, 1);
    newUserPhotos.splice(dropIndex, 0, draggedItem);

    setPhotos(prev => {
      const others = prev.filter(p => p.origen !== 'usuario');
      return [...others, ...newUserPhotos];
    });
    setDraggingId(null);

    if (dropIndex === 0) {
      setPrimaryPhoto(draggingId);
    } else {
      try {
        const photoIds = newUserPhotos.map(p => p.id);
        await fetch(`/api/user/semillas/${semillaId}/photos`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail },
          body: JSON.stringify({ action: 'reorder', photoIds })
        });
        if (onMediaChange) onMediaChange();
      } catch (err) {
        console.error('Error reordering', err);
      }
    }
  };

  return (
    <div>
      <div className="form-group full">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <label style={{ margin: 0 }}>Fotos de la Semilla</label>
          <small style={{ color: userPhotos.length >= maxPhotos ? '#ef4444' : '#64748b', fontWeight: 'bold' }}>
            {userPhotos.length} / {maxPhotos} permitidas
          </small>
        </div>
        <div className="gallery">
          {userPhotos.map((p, photoIndex) => {
            // ── Placeholder: foto eliminada por sanción ──
            if (p.tipo === 'sancionada') {
              return (
                <div key={p.id} className="gallery-item" style={{
                  border: '2px solid #991b1b',
                  background: '#fef2f2',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '12px',
                  position: 'relative'
                }}>
                  <span style={{ fontSize: '2rem' }}>⛔</span>
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#991b1b', textAlign: 'center', lineHeight: 1.3 }}>
                    Foto eliminada
                  </span>
                  <span style={{ fontSize: '0.6rem', color: '#b91c1c', textAlign: 'center', lineHeight: 1.3 }}>
                    Contenido no permitido
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDelete(p.id)}
                    style={{
                      marginTop: '4px', background: '#991b1b', color: 'white',
                      border: 'none', borderRadius: '6px', padding: '4px 8px',
                      fontSize: '0.6rem', cursor: 'pointer', fontWeight: 700
                    }}
                    title="Eliminar este aviso"
                  >
                    Entendido ✕
                  </button>
                </div>
              );
            }

            const isPrimary = p.esPrincipal === 1 && p.origen === 'usuario';
            let meta: any = {};
            try { meta = JSON.parse(p.resumen || '{}'); } catch (e) { }
            const isUser = p.origen === 'usuario';
            const isLocked = photoIndex >= maxPhotos;

            return (
              <div
                key={p.id}
                className={`gallery-item ${isPrimary ? 'is-preferred' : ''}`}
                style={{
                  border: isPrimary ? '3px solid #10b981' : isUser ? '1px solid #e2e8f0' : '1px dashed #cbd5e1',
                  opacity: draggingId === p.id ? 0.4 : (isUser ? 1 : 0.6),
                  transform: dragOverId === p.id ? 'scale(1.05)' : 'none',
                  boxShadow: dragOverId === p.id ? '0 10px 15px -3px rgba(16,185,129,0.3)' : 'none'
                }}
                draggable={isUser && !isLocked && p.resultadoValidacion !== 'rechazado'}
                onDragStart={(e) => {
                  if (!isLocked && p.resultadoValidacion !== 'rechazado') {
                    handleDragStart(e, p.id);
                  } else {
                    e.preventDefault();
                  }
                }}
                onDragOver={(e) => handleDragOver(e, p.id)}
                onDragLeave={() => setDragOverId(null)}
                onDrop={(e) => {
                  if (!isLocked && p.resultadoValidacion !== 'rechazado') {
                    handleDrop(e, p.id);
                  }
                }}
              >
                {meta.blurhash && (
                  <div style={{ position: 'absolute', inset: 0 }}>
                    <Blurhash hash={meta.blurhash} width="100%" height="100%" resolutionX={32} resolutionY={32} punch={1} />
                  </div>
                )}
                <img
                  src={getMediaUrl(p.ruta)}
                  alt="Foto"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: `${meta.profile_object_x ?? 50}% ${meta.profile_object_y ?? 50}%`,
                    transformOrigin: `${meta.profile_object_x ?? 50}% ${meta.profile_object_y ?? 50}%`,
                    transform: `scale(${(meta.profile_object_zoom ?? 100) / 100})`,
                    filter: `brightness(${meta.profile_brightness ?? 100}%) contrast(${meta.profile_contrast ?? 100}%)`
                  }}
                  crossOrigin="anonymous"
                />
                {p.resultadoValidacion === 'rechazado' && p.tipo !== 'sancionada' ? (
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, background: 'rgba(220, 38, 38, 0.95)', color: 'white', fontSize: '0.65rem', padding: '6px 4px', textAlign: 'center', zIndex: 10, fontWeight: 'bold' }}>
                    ❌ Rechazada<br />
                    <span style={{ fontSize: '0.55rem', fontWeight: 'normal', opacity: 0.9 }}>
                      {p.motivoRechazo || 'Incumple las normas'}
                    </span>
                  </div>
                ) : p.validado === 0 && p.tipo !== 'sancionada' ? (
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, background: 'rgba(245, 158, 11, 0.9)', color: 'white', fontSize: '0.65rem', padding: '6px 4px', textAlign: 'center', zIndex: 10, fontWeight: 'bold' }}>
                    ⏳ Pendiente de validación<br />
                    <span style={{ fontSize: '0.55rem', fontWeight: 'normal', opacity: 0.9 }}>
                      El equipo revisará esta foto
                    </span>
                  </div>
                ) : null}

                {isLocked && (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.8)', zIndex: 10, background: 'rgba(0,0,0,0.4)' }}>
                    <span style={{ fontSize: '1.5rem', marginBottom: '4px' }}>🔒</span>
                    <small style={{ fontWeight: 'bold', textAlign: 'center', fontSize: '0.65rem' }}>Excede límite</small>
                  </div>
                )}

                {isUser && (
                  <div className="photo-actions" style={{ zIndex: 20 }}>
                    {!isLocked && p.resultadoValidacion !== 'rechazado' && (
                      <button
                        type="button"
                        className={`photo-action-btn btn-photo-primary ${isPrimary ? 'is-active' : ''}`}
                        onClick={() => setPrimaryPhoto(p.id)}
                        title={isPrimary ? 'Foto de portada de tu hortaliza' : 'Marcar como portada'}
                      >
                        {isPrimary ? '★' : '☆'}
                      </button>
                    )}
                    {!isLocked && p.resultadoValidacion !== 'rechazado' && (
                      <button
                        type="button"
                        className="photo-action-btn btn-photo-edit"
                        onClick={() => openPhotoEditor(p)}
                        title="Encuadrar foto"
                      >
                        ✏️
                      </button>
                    )}
                    <button
                      type="button"
                      className="photo-action-btn btn-photo-delete"
                      onClick={() => handleDelete(p.id)}
                      title="Eliminar"
                    >
                      ✕
                    </button>
                  </div>
                )}
                {!isUser && (
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.6)', color: 'white', fontSize: '0.65rem', padding: '4px', textAlign: 'center', zIndex: 10 }}>
                    Heredada de {p.origen}
                  </div>
                )}
              </div>
            );
          })}

          {userPhotos.length < maxPhotos && (
            <div 
              className={`custom-file-upload drop-zone inline-drop-zone`}
              onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = '#10b981'; e.currentTarget.style.background = '#f0fdf4'; }}
              onDragLeave={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = ''; e.currentTarget.style.background = ''; }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.style.borderColor = '';
                e.currentTarget.style.background = '';
                handleFileUpload(e.dataTransfer.files);
              }}
            >
              <input ref={fileInputRef} type="file" id="upload-photos-semilla" multiple accept="image/*" onChange={(e) => handleFileUpload(e.target.files)} disabled={uploading} style={{ display: 'none' }} />
              <input type="file" id="upload-camera-semilla" accept="image/*" capture="environment" onChange={(e) => handleFileUpload(e.target.files)} style={{display: 'none'}} disabled={uploading} />
              
              {uploading ? (
                <div className="drop-zone-content">
                  <span style={{ fontSize: '1.5rem', animation: 'spin 2s linear infinite', display: 'inline-block' }}>⏳</span>
                  <span style={{ color: '#10b981', fontWeight: 'bold', fontSize: '0.75rem', textAlign: 'center' }}>Procesando...</span>
                </div>
              ) : (
                <div className="drop-zone-content">
                  <div className="drop-zone-buttons" style={{ flexDirection: 'column' }}>
                    <button type="button" onClick={handleClickAddPhoto} className="btn-upload primary" style={{ padding: '8px', fontSize: '0.8rem' }}>
                      <span className="icon" style={{ fontSize: '1.2rem', marginBottom: '4px', display: 'block' }}>📁</span> Galería
                    </button>
                    <label htmlFor="upload-camera-semilla" className="btn-upload secondary mobile-only" style={{ padding: '8px', fontSize: '0.8rem' }}>
                      <span className="icon" style={{ fontSize: '1.2rem', marginBottom: '4px', display: 'block' }}>📷</span> Cámara
                    </label>
                  </div>
                  <span className="drop-hint" style={{ fontSize: '0.7rem', textAlign: 'center', marginTop: '4px' }}>arrastra y suelta<br/>aquí</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Consentimiento de Fotos */}
      {mostrarModalConsentimiento && (
        <ConsentimientoFotoModal
          userEmail={userEmail}
          onAcepta={() => {
            setConsentimiento(1);
            setMostrarModalConsentimiento(false);
            // Abrir el selector de archivo tras aceptar
            setTimeout(() => fileInputRef.current?.click(), 100);
          }}
          onRechaza={() => {
            setConsentimiento(0);
            setMostrarModalConsentimiento(false);
          }}
        />
      )}

      {/* Editor Modal — mismo estilo que especies globales */}
      <PhotoEditorModal
        isOpen={!!editingPhoto}
        onClose={() => setEditingPhoto(null)}
        photoUrl={editingPhoto ? getMediaUrl(editingPhoto.ruta) : ''}
        fileName={editingPhoto?.ruta ? editingPhoto.ruta.split('/').pop() : ''}
        initialMetadata={editingPhoto?.resumen ? JSON.parse(editingPhoto.resumen) : null}
        onSave={savePhotoEdits}
        saveStatus={photoEditorSaveStatus}
      />
    </div>
  );
}
