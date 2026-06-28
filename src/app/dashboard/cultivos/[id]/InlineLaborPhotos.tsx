'use client';
import React, { useState, useEffect, useRef } from 'react';
import { getMediaUrl } from '@/lib/media-url';
import { storage } from '@/lib/firebase/config';
import PhotoEditorModal from '@/components/admin/PhotoEditorModal';
import '@/components/admin/EspecieVegetalForm.css';

interface InlineLaborPhotosProps {
  isPending: boolean;
  idcultivos: string;
  idpauta: number;
  fechaEmision: string;
  idcultivosavisos?: number;
  userEmail: string;
  setLightboxUrl: (url: string | null) => void;
}

export default function InlineLaborPhotos({
  isPending, idcultivos, idpauta, fechaEmision, idcultivosavisos, userEmail, setLightboxUrl
}: InlineLaborPhotosProps) {
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadPhotos();
  }, [idcultivosavisos, idpauta, fechaEmision]);

  const loadPhotos = async () => {
    try {
      setLoading(true);
      const url = isPending 
        ? `/api/user/cultivos/avisos/pending/photos?idcultivos=${idcultivos}&idpauta=${idpauta}&fechaEmision=${encodeURIComponent(fechaEmision || '')}`
        : `/api/user/cultivos/avisos/${idcultivosavisos}/photos`;
      const res = await fetch(url, {
        headers: { 'x-user-email': userEmail }
      });
      if (res.ok) {
        const data = await res.json();
        const sorted = (data.photos || []).sort((a: any, b: any) => (b.esPrincipal || 0) - (a.esPrincipal || 0));
        setPhotos(sorted);
      }
    } catch (e) {
      console.error('Error loading photos:', e);
    } finally {
      setLoading(false);
    }
  };

  const uploadFile = async (file: File) => {
    if (photos.length >= 4) {
      alert('Límite alcanzado: solo puedes subir hasta 4 fotos por labor.');
      return;
    }
    try {
      setUploading(true);

      // Comprimir imagen si es posible
      let processedFile = file;
      try {
        const imageCompression = (await import('browser-image-compression')).default;
        processedFile = await imageCompression(file, { maxSizeMB: 1, maxWidthOrHeight: 2048, useWebWorker: true });
      } catch (e) {
        console.warn('Compresión no disponible, subiendo original:', e);
      }

      // Paso 1: Subir archivo a Firebase Storage (ruta temporal)
      const storageApi = await import('firebase/storage');
      const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '');
      const tempFileName = `temp-labor-${Date.now()}-${safeFileName}`;
      const tempPath = `uploads/temp/${tempFileName}`;
      const storageRef = storageApi.ref(storage, tempPath);
      await storageApi.uploadBytes(storageRef, processedFile);

      // Paso 2: POST JSON con la ruta temporal al endpoint de la API
      const apiUrl = isPending
        ? '/api/user/cultivos/avisos/pending/photos'
        : `/api/user/cultivos/avisos/${idcultivosavisos}/photos`;

      const bodyPayload: any = {
        rawStoragePath: tempPath,
        originalFilename: file.name
      };

      if (isPending) {
        bodyPayload.idcultivos = idcultivos;
        bodyPayload.idpauta = idpauta.toString();
        bodyPayload.fechaEmision = fechaEmision;
      }

      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail },
        body: JSON.stringify(bodyPayload)
      });

      if (res.ok) {
        await loadPhotos();
      } else {
        const errorData = await res.json();
        alert('Error al subir la foto: ' + (errorData.error || 'Desconocido'));
      }
    } catch (error) {
      console.error('Error subiendo foto:', error);
      alert('Error de red al subir la foto.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  };

  const handleDeletePhoto = async (photoId: number) => {
    if (!window.confirm('¿Eliminar esta foto definitivamente?')) return;
    try {
      const url = isPending
        ? `/api/user/cultivos/avisos/pending/photos?photoId=${photoId}`
        : `/api/user/cultivos/avisos/${idcultivosavisos}/photos?photoId=${photoId}`;
        
      const res = await fetch(url, {
        method: 'DELETE',
        headers: { 'x-user-email': userEmail }
      });
      if (res.ok) await loadPhotos();
    } catch (e) {
      console.error('Error deleting photo:', e);
    }
  };

  const handleSetPrincipal = async (photoId: number) => {
    // Optimistic UI: mover la foto a la primera posición
    const idx = photos.findIndex(p => p.id === photoId);
    if (idx > 0) {
      const newPhotos = [...photos];
      const [item] = newPhotos.splice(idx, 1);
      newPhotos.unshift(item);
      newPhotos.forEach((ph, i) => ph.esPrincipal = i === 0 ? 1 : 0);
      setPhotos(newPhotos);
    } else if (idx === 0) {
      // Ya es la primera, solo marcar
      setPhotos(prev => prev.map((p, i) => ({ ...p, esPrincipal: i === 0 ? 1 : 0 })));
    }

    try {
      const url = isPending
        ? `/api/user/cultivos/avisos/pending/photos?idcultivos=${idcultivos}`
        : `/api/user/cultivos/avisos/${idcultivosavisos}/photos`;
        
      await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail },
        body: JSON.stringify({ photoId, action: 'setPrincipal' })
      });
      await loadPhotos();
    } catch (e) {
      console.error('Error setting principal:', e);
    }
  };

  // Drag and drop setup for the upload container
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  const handleDragLeave = () => setIsDragOver(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      uploadFile(e.dataTransfer.files[0]);
    }
  };

  // Drag to reorder logic (full reorder like EspecieVegetalForm)
  const [draggedPhotoIndex, setDraggedPhotoIndex] = useState<number | null>(null);
  const [draggedOverPhotoIndex, setDraggedOverPhotoIndex] = useState<number | null>(null);

  const handleReorderPhotos = async (newPhotos: any[]) => {
    setPhotos(newPhotos); // Optimistic UI update
    try {
      // Persist new order to DB: update datosadjuntosorden for each photo
      for (let i = 0; i < newPhotos.length; i++) {
        const url = isPending
          ? `/api/user/cultivos/avisos/pending/photos?idcultivos=${idcultivos}`
          : `/api/user/cultivos/avisos/${idcultivosavisos}/photos`;
        await fetch(url, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail },
          body: JSON.stringify({ photoId: newPhotos[i].id, action: 'updateMeta', resumen: JSON.stringify({ datosadjuntosorden: i + 1 }) })
        });
      }
    } catch (e) {
      console.error('Error reordering photos:', e);
    }
  };

  // ── Photo Editor State ──
  const [editingPhoto, setEditingPhoto] = useState<any>(null);
  const [photoEditorSaveStatus, setPhotoEditorSaveStatus] = useState<'idle' | 'saving' | 'no-changes'>('idle');

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

      const apiUrl = isPending
        ? '/api/user/cultivos/avisos/pending/photos'
        : `/api/user/cultivos/avisos/${idcultivosavisos}/photos`;

      const bodyPayload: any = {
        action: 'updateMeta',
        photoId: editingPhoto.id,
        resumen: JSON.stringify(newMeta)
      };

      if (isPending) {
        bodyPayload.idcultivos = idcultivos;
        bodyPayload.idpauta = idpauta.toString();
        bodyPayload.fechaEmision = fechaEmision;
      }

      const res = await fetch(apiUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail },
        body: JSON.stringify(bodyPayload)
      });

      if (res.ok) {
        await loadPhotos();
      } else {
        alert('❌ Error guardando ajustes');
      }
    } catch (e) {
      console.error('Error saving photo edits:', e);
      alert('Error al guardar los cambios de la foto');
    } finally {
      setPhotoEditorSaveStatus('idle');
    }
  };

  const inputId = `upload-labor-${idpauta}-${isPending ? 'p' : idcultivosavisos}`;
  const cameraId = `camera-labor-${idpauta}-${isPending ? 'p' : idcultivosavisos}`;

  return (
    <div className="grid-form" style={{ marginTop: '16px' }}>
      <div className="form-group full">
        <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            Fotos
            {photos.length > 1 && (
              <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 'normal', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '4px', padding: '2px 7px', letterSpacing: '0.01em' }}>
                ✥ Arrastra para cambiar el orden
              </span>
            )}
          </span>
          <small style={{ color: photos.length >= 4 ? '#ef4444' : '#64748b' }}>
            {photos.length} / 4 permitidas
          </small>
        </label>

        <div className="gallery">
          {photos.map((p, index) => {
            const isDragging = draggedPhotoIndex === index;
            const isDragOver2 = draggedOverPhotoIndex === index;
            return (
              <div 
                key={p.id}
                className={`gallery-item ${p.esPrincipal ? 'is-preferred' : ''}`}
                style={{
                  cursor: 'grab', position: 'relative', overflow: 'hidden',
                  opacity: isDragging ? 0.5 : 1,
                  border: isDragOver2 ? '2px dashed #10b981' : undefined,
                  transform: isDragOver2 ? 'scale(1.02)' : 'none',
                  transition: 'all 0.2s ease'
                }}
                draggable
                onDragStart={() => setDraggedPhotoIndex(index)}
                onDragEnter={() => draggedPhotoIndex !== null && setDraggedOverPhotoIndex(index)}
                onDragEnd={() => {
                  if (draggedPhotoIndex !== null && draggedOverPhotoIndex !== null && draggedPhotoIndex !== draggedOverPhotoIndex) {
                    const newPhotos = [...photos];
                    const [draggedItem] = newPhotos.splice(draggedPhotoIndex, 1);
                    newPhotos.splice(draggedOverPhotoIndex, 0, draggedItem);

                    // La primera foto siempre es la principal
                    newPhotos.forEach((ph, i) => ph.esPrincipal = i === 0 ? 1 : 0);

                    handleReorderPhotos(newPhotos);

                    // Si la foto arrastrada quedó en primera posición, actualizar en servidor
                    if (draggedOverPhotoIndex === 0) {
                      handleSetPrincipal(draggedItem.id);
                    }
                  }
                  setDraggedPhotoIndex(null);
                  setDraggedOverPhotoIndex(null);
                }}
                onDragOver={(e) => e.preventDefault()}
              >
                <img 
                  src={getMediaUrl(p.ruta)} 
                  alt="Foto de labor"
                  loading="lazy"
                  style={{ objectFit: 'cover', position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }}
                  draggable={false}
                  crossOrigin="anonymous"
                  onClick={() => setLightboxUrl(getMediaUrl(p.ruta))}
                />
                {p.validado === 0 && (
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, background: 'rgba(234,179,8,0.9)',
                    color: 'white', fontSize: '0.6rem', fontWeight: 'bold', padding: '4px 6px', textAlign: 'center', zIndex: 10, lineHeight: '1.3'
                  }}>
                    Pendiente de validación, un equipo revisará esta foto
                  </div>
                )}
                <div className="photo-actions" style={{ zIndex: 20 }}>
                  <button
                    type="button"
                    className={`photo-action-btn btn-photo-primary ${p.esPrincipal ? 'is-active' : ''}`}
                    onClick={() => handleSetPrincipal(p.id)}
                    title={p.esPrincipal ? 'Foto preferida actual' : 'Marcar como foto preferida'}
                  >{p.esPrincipal ? '★' : '☆'}</button>
                  <button
                    type="button"
                    className="photo-action-btn btn-photo-edit"
                    onClick={() => openPhotoEditor(p)}
                    title="Editar foto"
                  >✏️</button>
                  <button 
                    type="button" 
                    className="photo-action-btn btn-photo-delete" 
                    onClick={() => handleDeletePhoto(p.id)} 
                    title="Eliminar"
                  >✕</button>
                </div>
              </div>
            );
          })}

          {photos.length < 4 && (
            <div
              ref={uploadContainerRef}
              className={`custom-file-upload drop-zone inline-drop-zone ${isDragOver ? 'drag-over' : ''}`}
              onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragOver(true); }}
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragOver(true); }}
              onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragOver(false); }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDragOver(false);
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  uploadFile(e.dataTransfer.files[0]);
                }
              }}
            >
              <input type="file" id={inputId} accept="image/*" onChange={handleFileChange} disabled={uploading} style={{ display: 'none' }} />
              <input type="file" id={cameraId} accept="image/*" capture="environment" onChange={handleFileChange} disabled={uploading} style={{ display: 'none' }} />

              {uploading ? (
                <div className="drop-zone-content">
                  <span style={{ fontSize: '1.5rem', animation: 'spin 2s linear infinite', display: 'inline-block' }}>⏳</span>
                  <span style={{ color: '#10b981', fontWeight: 'bold', fontSize: '0.75rem', textAlign: 'center' }}>Subiendo...</span>
                </div>
              ) : (
                <div className="drop-zone-content">
                  <div className="drop-zone-buttons">
                    <label htmlFor={inputId} className="btn-upload primary" style={{ padding: '8px', fontSize: '0.8rem' }}>
                      <span className="icon" style={{ fontSize: '1.2rem' }}>📁</span> Galería
                    </label>
                    <label htmlFor={cameraId} className="btn-upload secondary" style={{ padding: '8px', fontSize: '0.8rem' }}>
                      <span className="icon" style={{ fontSize: '1.2rem' }}>📷</span> Cámara
                    </label>
                  </div>
                  <span className="drop-hint" style={{ fontSize: '0.7rem', textAlign: 'center', marginTop: '4px' }}>También puedes soltar<br />una imagen</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

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
