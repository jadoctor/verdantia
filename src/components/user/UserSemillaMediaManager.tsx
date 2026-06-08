'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Blurhash } from 'react-blurhash';
import { getMediaUrl } from '@/lib/media-url';
import { storage } from '@/lib/firebase/config';
import { ref, uploadBytes } from 'firebase/storage';
import ConsentimientoFotoModal from '@/components/user/ConsentimientoFotoModal';

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
  const [editorX, setEditorX] = useState(50);
  const [editorY, setEditorY] = useState(50);
  const [editorZoom, setEditorZoom] = useState(100);
  const [editorBrightness, setEditorBrightness] = useState(100);
  const [editorContrast, setEditorContrast] = useState(100);
  const [editorInitialState, setEditorInitialState] = useState('');
  const [photoEditorSaveStatus, setPhotoEditorSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

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
    let meta: any = {};
    try { meta = JSON.parse(photo.resumen || '{}'); } catch (e) { }
    const initial = {
      x: meta.profile_object_x ?? 50,
      y: meta.profile_object_y ?? 50,
      zoom: meta.profile_object_zoom ?? 100,
      brightness: meta.profile_brightness ?? 100,
      contrast: meta.profile_contrast ?? 100,
    };
    setEditingPhoto(photo);
    setEditorX(initial.x);
    setEditorY(initial.y);
    setEditorZoom(initial.zoom);
    setEditorBrightness(initial.brightness);
    setEditorContrast(initial.contrast);
    setEditorInitialState(JSON.stringify(initial));
    setPhotoEditorSaveStatus('idle');
  };

  const savePhotoEdits = async () => {
    if (!editingPhoto) return;
    setPhotoEditorSaveStatus('saving');
    try {
      let meta: any = {};
      try { meta = JSON.parse(editingPhoto.resumen || '{}'); } catch (e) { }

      const newMeta = {
        ...meta,
        profile_object_x: editorX,
        profile_object_y: editorY,
        profile_object_zoom: editorZoom,
        profile_brightness: editorBrightness,
        profile_contrast: editorContrast,
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
        setPhotoEditorSaveStatus('saved');
        await loadMedia();
        setTimeout(() => {
          setEditingPhoto(null);
          setPhotoEditorSaveStatus('idle');
        }, 1000);
      }
    } catch (e) {
      console.error('Error saving photo edits:', e);
      alert('Error al guardar los cambios de la foto');
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
                    objectPosition: `${meta.profile_object_x || 50}% ${meta.profile_object_y || 50}%`
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
      {editingPhoto && (
        <div className="photo-editor-overlay">
          <div className="photo-editor-content" onClick={e => e.stopPropagation()}>
            <div className="photo-editor-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0 }}>Ajustar Fotografía</h3>
                <small style={{ color: '#64748b', fontSize: '0.75rem', display: 'block', marginTop: '4px' }}>
                  📄 {editingPhoto.ruta.split('/').pop()}
                </small>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <button type="button" onClick={() => setEditingPhoto(null)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white', color: '#475569', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer' }}>Cerrar</button>
                {(() => {
                  const currentState = JSON.stringify({ x: editorX, y: editorY, zoom: editorZoom, brightness: editorBrightness, contrast: editorContrast });
                  if (currentState !== editorInitialState) {
                    return (
                      <button type="button" onClick={savePhotoEdits} disabled={photoEditorSaveStatus === 'saving'}
                        style={{ padding: '8px 16px', fontSize: '0.9rem', background: '#10b981', border: '1px solid #059669', color: 'white', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
                        {photoEditorSaveStatus === 'saving' ? '⏳ Guardando...' : '💾 Guardar Cambios'}
                      </button>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>

            <div className="photo-editor-body">
              <div className="photo-editor-preview-container">
                <div className="photo-editor-preview-mask" style={{ borderRadius: '12px', aspectRatio: '3/4', width: '220px', overflow: 'hidden' }}>
                  <img
                    src={getMediaUrl(editingPhoto.ruta)}
                    alt="preview"
                    className="photo-editor-image"
                    draggable="false"
                    style={{
                      objectPosition: `${editorX}% ${editorY}%`,
                      transformOrigin: `${editorX}% ${editorY}%`,
                      transform: `scale(${editorZoom / 100})`,
                      filter: `brightness(${editorBrightness}%) contrast(${editorContrast}%)`
                    }}
                    crossOrigin="anonymous"
                  />
                </div>
                <div className="photo-editor-hint">
                  <span>Arrastra para encuadrar</span>
                </div>
              </div>

              <div className="photo-editor-controls">
                <div className="editor-control-group">
                  <label>
                    <span className="control-label">🔍 Zoom ({editorZoom}%)</span>
                    <button type="button" className="reset-btn" onClick={() => setEditorZoom(100)}>↻</button>
                  </label>
                  <input type="range" min="100" max="300" value={editorZoom} onChange={e => setEditorZoom(Number(e.target.value))} />
                </div>
                <div className="editor-control-group">
                  <label>
                    <span className="control-label">☀️ Brillo ({editorBrightness}%)</span>
                  </label>
                  <input type="range" min="50" max="150" value={editorBrightness} onChange={e => setEditorBrightness(Number(e.target.value))} />
                </div>
                <div className="editor-control-group">
                  <label>
                    <span className="control-label">🌗 Contraste ({editorContrast}%)</span>
                  </label>
                  <input type="range" min="50" max="150" value={editorContrast} onChange={e => setEditorContrast(Number(e.target.value))} />
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" onClick={() => { setEditorBrightness(110); setEditorContrast(115); }}
                    style={{ flex: 1, padding: '10px', background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)' }}>
                    ✨ Auto Color
                  </button>
                  <button type="button" onClick={() => { setEditorBrightness(100); setEditorContrast(100); setEditorZoom(100); setEditorX(50); setEditorY(50); }}
                    style={{ padding: '10px 15px', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    ↺ Reset
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
