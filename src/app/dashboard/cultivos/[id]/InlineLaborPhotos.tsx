'use client';
import React, { useState, useEffect, useRef } from 'react';
import { getMediaUrl } from '@/lib/media-url';
import { storage } from '@/lib/firebase/config';

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
        ? `/api/user/cultivos/avisos/pending/photos?idcultivos=${idcultivos}&idpauta=${idpauta}&fechaEmision=${encodeURIComponent(fechaEmision)}`
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

  // Drag to reorder logic (full reorder like EspecieForm)
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
  const STYLE_FILTERS: Record<string, string> = {
    '': 'none',
    comic: 'contrast(1.45) saturate(1.55) brightness(1.08)',
    manga: 'grayscale(1) contrast(1.85) brightness(1.1)',
    watercolor: 'saturate(1.35) contrast(0.88) brightness(1.14)',
    vintage: 'sepia(40%) contrast(110%) saturate(120%) brightness(95%) hue-rotate(-5deg)',
    cinematic: 'contrast(120%) saturate(110%) brightness(90%) sepia(20%)',
    vibrant: 'saturate(150%) contrast(105%) brightness(105%)',
    bnw: 'grayscale(100%) contrast(120%) brightness(105%)',
    fade: 'contrast(85%) brightness(110%) saturate(80%) sepia(10%)'
  };
  const [editingPhoto, setEditingPhoto] = useState<any>(null);
  const [editorX, setEditorX] = useState(50);
  const [editorY, setEditorY] = useState(50);
  const [editorZoom, setEditorZoom] = useState(100);
  const [editorBrightness, setEditorBrightness] = useState(100);
  const [editorContrast, setEditorContrast] = useState(100);
  const [editorStyle, setEditorStyle] = useState('');
  const [editorInitialState, setEditorInitialState] = useState('');
  const [photoEditorSaveStatus, setPhotoEditorSaveStatus] = useState<'idle' | 'saving' | 'no-changes'>('idle');
  const editorDragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);

  const openPhotoEditor = (photo: any) => {
    try {
      const meta = JSON.parse(photo.resumen || '{}');
      const initial = {
        x: meta.profile_object_x ?? 50,
        y: meta.profile_object_y ?? 50,
        zoom: meta.profile_object_zoom ?? 100,
        brightness: meta.profile_brightness ?? 100,
        contrast: meta.profile_contrast ?? 100,
        style: meta.profile_style ?? ''
      };
      setEditorX(initial.x);
      setEditorY(initial.y);
      setEditorZoom(initial.zoom);
      setEditorBrightness(initial.brightness);
      setEditorContrast(initial.contrast);
      setEditorStyle(initial.style);
      setEditorInitialState(JSON.stringify(initial));
    } catch {
      setEditorX(50); setEditorY(50); setEditorZoom(100);
      setEditorBrightness(100); setEditorContrast(100); setEditorStyle('');
      setEditorInitialState(JSON.stringify({ x: 50, y: 50, zoom: 100, brightness: 100, contrast: 100, style: '' }));
    }
    setEditingPhoto(photo);
  };

  const savePhotoEdits = async () => {
    if (!editingPhoto) return;
    setPhotoEditorSaveStatus('saving');
    const resumen = JSON.stringify({
      profile_object_x: editorX,
      profile_object_y: editorY,
      profile_object_zoom: editorZoom,
      profile_brightness: editorBrightness,
      profile_contrast: editorContrast,
      profile_style: editorStyle
    });
    try {
      const url = isPending
        ? `/api/user/cultivos/avisos/pending/photos?idcultivos=${idcultivos}`
        : `/api/user/cultivos/avisos/${idcultivosavisos}/photos`;
      await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail },
        body: JSON.stringify({ photoId: editingPhoto.id, action: 'updateMeta', resumen })
      });
      setEditingPhoto(null);
      await loadPhotos();
    } catch {
      alert('❌ Error guardando ajustes');
    } finally {
      setPhotoEditorSaveStatus('idle');
    }
  };

  const onEditorMouseDown = (e: React.MouseEvent) => {
    editorDragRef.current = { startX: e.clientX, startY: e.clientY, origX: editorX, origY: editorY };
    const onMove = (ev: MouseEvent) => {
      if (!editorDragRef.current) return;
      const dx = ev.clientX - editorDragRef.current.startX;
      const dy = ev.clientY - editorDragRef.current.startY;
      setEditorX(Math.max(0, Math.min(100, editorDragRef.current.origX - dx * 0.15)));
      setEditorY(Math.max(0, Math.min(100, editorDragRef.current.origY - dy * 0.15)));
    };
    const onUp = () => { editorDragRef.current = null; window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const onEditorTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    editorDragRef.current = { startX: t.clientX, startY: t.clientY, origX: editorX, origY: editorY };
  };

  const onEditorTouchMove = (e: React.TouchEvent) => {
    if (!editorDragRef.current) return;
    const t = e.touches[0];
    const dx = t.clientX - editorDragRef.current.startX;
    const dy = t.clientY - editorDragRef.current.startY;
    setEditorX(Math.max(0, Math.min(100, editorDragRef.current.origX - dx * 0.15)));
    setEditorY(Math.max(0, Math.min(100, editorDragRef.current.origY - dy * 0.15)));
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

      {/* ── Photo Editor Overlay (same as EspecieForm) ── */}
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
                      <button
                        type="button"
                        onClick={savePhotoEdits}
                        className="btn-primary"
                        style={{ padding: '8px 16px', fontSize: '0.9rem', margin: 0 }}
                        disabled={photoEditorSaveStatus === 'saving'}
                      >
                        {photoEditorSaveStatus === 'saving' ? '⏳ Guardando...' : '💾 Guardar Cambios'}
                      </button>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>

            <div className="photo-editor-body">
              <div className="photo-editor-preview-container"
                onMouseDown={onEditorMouseDown}
                onTouchStart={onEditorTouchStart}
                onTouchMove={onEditorTouchMove}>
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
                    crossOrigin="anonymous" />
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

                <div style={{ marginBottom: '15px', display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => { setEditorBrightness(110); setEditorContrast(115); }}
                    style={{
                      flex: 1, padding: '10px',
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      gap: '6px', boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)'
                    }}
                  >
                    ✨ Auto Color
                  </button>
                  <button
                    type="button"
                    onClick={() => { setEditorBrightness(100); setEditorContrast(100); setEditorZoom(100); setEditorX(50); setEditorY(38); }}
                    style={{
                      padding: '10px 15px', background: '#f1f5f9', color: '#475569',
                      border: '1px solid #cbd5e1', borderRadius: '6px', fontWeight: 'bold',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                    }}
                  >
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
