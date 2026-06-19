'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Blurhash } from 'react-blurhash';
import { getMediaUrl } from '@/lib/media-url';
import { storage } from '@/lib/firebase/config';
import { ref, uploadBytes } from 'firebase/storage';
import ConsentimientoFotoModal from '@/components/user/ConsentimientoFotoModal';
import CultivoTimelapse from './CultivoTimelapse';
import '@/components/admin/EspecieForm.css';

interface UserCultivoMediaManagerProps {
  cultivoId: string;
  userEmail: string;
  onMediaChange?: () => void;
}

export default function UserCultivoMediaManager({ cultivoId, userEmail, onMediaChange }: UserCultivoMediaManagerProps) {
  const [photos, setPhotos] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Drag and Drop States
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  // Consentimiento de fotos
  const [consentimiento, setConsentimiento] = useState<number | null | undefined>(undefined);
  const [mostrarModalConsentimiento, setMostrarModalConsentimiento] = useState(false);
  const [showTimelapse, setShowTimelapse] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Photo Editor States
  const [editingPhoto, setEditingPhoto] = useState<any>(null);
  const [editorX, setEditorX] = useState(50);
  const [editorY, setEditorY] = useState(50);
  const [editorZoom, setEditorZoom] = useState(100);
  const [photoEditorSaveStatus, setPhotoEditorSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  useEffect(() => {
    if (cultivoId && userEmail) {
      loadMedia();
      checkConsentimiento();
    }
  }, [cultivoId, userEmail]);

  const checkConsentimiento = async () => {
    try {
      const res = await fetch('/api/user/consentimiento-foto', { headers: { 'x-user-email': userEmail } });
      const data = await res.json();
      setConsentimiento(data.consentimiento);
    } catch (e) {
      console.error('Error checking consentimiento:', e);
    }
  };

  const handleClickAddPhoto = async () => {
    if (consentimiento === 1) {
      fileInputRef.current?.click();
    } else if (consentimiento === 0) {
      alert('Tienes la galería de fotos desactivada. Puedes reactivarla desde tu perfil aceptando las condiciones de uso de imágenes.');
    } else {
      setMostrarModalConsentimiento(true);
    }
  };

  const loadMedia = async () => {
    try {
      const res = await fetch(`/api/user/cultivos/${cultivoId}/photos`, { headers: { 'x-user-email': userEmail } });
      const data = await res.json();
      setPhotos(data.photos || []);
      if (onMediaChange) onMediaChange();
    } catch (e) {
      console.error('Error loading media:', e);
    }
  };

  const uploadFileList = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        const tempPath = `uploads/temp/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const storageRef = ref(storage, tempPath);
        await uploadBytes(storageRef, file);
        const rawStoragePath = storageRef.fullPath;

        const res = await fetch(`/api/user/cultivos/${cultivoId}/photos`, {
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
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    await uploadFileList(e.target.files);
    e.target.value = '';
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Seguro que quieres eliminar esta foto de tu cultivo?')) return;
    try {
      const res = await fetch(`/api/user/cultivos/${cultivoId}/photos?photoId=${id}`, {
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
      const res = await fetch(`/api/user/cultivos/${cultivoId}/photos`, {
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
    try { meta = JSON.parse(photo.resumen || '{}'); } catch(e){}
    setEditingPhoto(photo);
    setEditorX(meta.profile_object_x ?? 50);
    setEditorY(meta.profile_object_y ?? 50);
    setEditorZoom(meta.profile_object_zoom ?? 100);
    setPhotoEditorSaveStatus('idle');
  };

  const savePhotoEdits = async () => {
    if (!editingPhoto) return;
    setPhotoEditorSaveStatus('saving');
    try {
      let meta: any = {};
      try { meta = JSON.parse(editingPhoto.resumen || '{}'); } catch(e){}
      
      const newMeta = {
        ...meta,
        profile_object_x: editorX,
        profile_object_y: editorY,
        profile_object_zoom: editorZoom,
      };

      const res = await fetch(`/api/user/cultivos/${cultivoId}/photos`, {
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
        setTimeout(() => {
          setEditingPhoto(null);
          loadMedia();
        }, 1000);
      } else {
        setPhotoEditorSaveStatus('idle');
        alert('Error saving edits');
      }
    } catch (e) {
      console.error('Error saving edits:', e);
      setPhotoEditorSaveStatus('idle');
    }
  };

  // Drag logic for Editor
  const isDraggingEditor = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0, initialX: 50, initialY: 50 });

  const handleEditorPointerDown = (e: React.PointerEvent) => {
    isDraggingEditor.current = true;
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      initialX: editorX,
      initialY: editorY
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleEditorPointerMove = (e: React.PointerEvent) => {
    if (!isDraggingEditor.current) return;
    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;
    // Sensibilidad
    let newX = dragStartRef.current.initialX - (deltaX / 3);
    let newY = dragStartRef.current.initialY - (deltaY / 3);
    setEditorX(Math.max(0, Math.min(100, newX)));
    setEditorY(Math.max(0, Math.min(100, newY)));
  };

  const handleEditorPointerUp = (e: React.PointerEvent) => {
    isDraggingEditor.current = false;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  // Reordering drag & drop handlers
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

    const newPhotos = [...photos];
    const dragIndex = newPhotos.findIndex(p => p.id === draggingId);
    const dropIndex = newPhotos.findIndex(p => p.id === id);
    
    if (dragIndex === -1 || dropIndex === -1) return;

    const [draggedItem] = newPhotos.splice(dragIndex, 1);
    newPhotos.splice(dropIndex, 0, draggedItem);
    
    setPhotos(newPhotos);
    setDraggingId(null);

    try {
      const photoIds = newPhotos.map(p => p.id);
      await fetch(`/api/user/cultivos/${cultivoId}/photos`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail },
        body: JSON.stringify({ action: 'reorder', photoIds })
      });
      if (onMediaChange) onMediaChange();
    } catch (err) {
      console.error('Error reordering', err);
    }
  };

  return (
    <div style={{ marginTop: '20px' }}>
      {/* Botonera de acciones superiores */}
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
        {photos.length >= 2 && (
          <button 
            onClick={() => setShowTimelapse(true)}
            style={{
              background: '#1e293b', color: 'white', padding: '10px 20px', borderRadius: '8px', border: 'none',
              cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px',
              boxShadow: '0 4px 6px -1px rgba(0,0,0, 0.2)'
            }}
          >
            ▶ Ver Timelapse
          </button>
        )}
      </div>

      {/* Galería con inline dropzone */}
      <div className="gallery" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '16px' }}>
        {photos.map(photo => {
          let meta: any = {};
          try { meta = JSON.parse(photo.resumen || '{}'); } catch(e){}
          
          return (
            <div 
              key={photo.id}
              draggable
              onDragStart={(e) => handleDragStart(e, photo.id)}
              onDragOver={(e) => handleDragOver(e, photo.id)}
              onDragLeave={() => setDragOverId(null)}
              onDrop={(e) => handleDrop(e, photo.id)}
              style={{
                position: 'relative', borderRadius: '12px', overflow: 'hidden', height: '180px',
                border: photo.esPrincipal ? '3px solid #10b981' : '1px solid #e2e8f0',
                cursor: 'grab',
                opacity: draggingId === photo.id ? 0.4 : 1,
                transform: dragOverId === photo.id ? 'scale(1.05)' : 'none',
                transition: 'all 0.2s ease',
                boxShadow: dragOverId === photo.id ? '0 10px 15px -3px rgba(16,185,129,0.3)' : '0 4px 6px rgba(0,0,0,0.05)'
              }}
            >
              {meta.blurhash && (
                <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
                  <Blurhash hash={meta.blurhash} width="100%" height="100%" resolutionX={32} resolutionY={32} punch={1} />
                </div>
              )}
              <img 
                src={getMediaUrl(photo.ruta)} 
                alt="Cultivo" 
                style={{
                  position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 2,
                  objectFit: 'cover',
                  objectPosition: `${meta.profile_object_x ?? 50}% ${meta.profile_object_y ?? 50}%`,
                  transformOrigin: `${meta.profile_object_x ?? 50}% ${meta.profile_object_y ?? 50}%`,
                  transform: `scale(${(meta.profile_object_zoom ?? 100) / 100})`,
                  pointerEvents: 'none'
                }}
                crossOrigin="anonymous"
              />
              
              {/* Actions Overlay */}
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, padding: '8px', zIndex: 3,
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)',
                display: 'flex', justifyContent: 'space-between'
              }}>
                <button 
                  onClick={() => setPrimaryPhoto(photo.id)}
                  style={{ background: 'none', border: 'none', color: photo.esPrincipal ? '#fbbf24' : 'white', cursor: 'pointer', fontSize: '1.2rem', padding: '0 4px' }}
                  title="Hacer Portada"
                >
                  ★
                </button>
                <button 
                  onClick={() => handleDelete(photo.id)}
                  style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '1.2rem', padding: '0 4px' }}
                  title="Eliminar"
                >
                  ✖
                </button>
              </div>
              
              {/* Edit Button Bottom */}
              <button 
                onClick={() => openPhotoEditor(photo)}
                style={{
                  position: 'absolute', bottom: '8px', right: '8px', zIndex: 3,
                  background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '50%',
                  width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}
                title="Editar encuadre"
              >
                ✏️
              </button>
            </div>
          );
        })}

        {/* Inline Dropzone (only if less than 4 photos) */}
        {photos.length < 4 && (
          <div
            className={`custom-file-upload drop-zone inline-drop-zone ${dragOver ? 'drag-over' : ''}`}
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setDragOver(false);
              if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                uploadFileList(e.dataTransfer.files);
              }
            }}
            style={{ cursor: 'default', height: '180px' }}
          >
            <input
              ref={fileInputRef}
              type="file"
              id="upload-photos-cultivo"
              multiple
              accept="image/*"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
              disabled={uploading}
            />
            
            {uploading ? (
              <div className="drop-zone-content">
                <span style={{ fontSize: '1.5rem', animation: 'spin 2s linear infinite', display: 'inline-block' }}>⏳</span>
                <span style={{ color: '#10b981', fontWeight: 'bold', fontSize: '0.75rem', textAlign: 'center' }}>Subiendo...</span>
              </div>
            ) : (
              <div className="drop-zone-content" style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                <div className="drop-zone-buttons" style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={handleClickAddPhoto}
                    className="btn-upload primary"
                    style={{
                      background: 'white',
                      border: '1px solid #cbd5e1',
                      color: '#475569',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                      margin: 0
                    }}
                  >
                    📁 Galería
                  </button>
                </div>
                <span className="drop-hint" style={{ fontSize: '0.65rem', textAlign: 'center', color: '#64748b' }}>arrastra y suelta<br/>aquí</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal Consentimiento */}
      {mostrarModalConsentimiento && (
        <ConsentimientoFotoModal
          userEmail={userEmail}
          onAcepta={() => {
            setMostrarModalConsentimiento(false);
            setConsentimiento(1);
            fileInputRef.current?.click();
          }}
          onRechaza={() => {
            setMostrarModalConsentimiento(false);
            setConsentimiento(0);
          }}
        />
      )}

      {/* Editor Visual Fotográfico Modal */}
      {editingPhoto && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#1e293b', borderRadius: '16px', padding: '24px', width: '90%', maxWidth: '400px', color: 'white' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '1.2rem', textAlign: 'center' }}>Editar Encuadre (3:4)</h3>
            
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
              <div 
                style={{
                  width: '240px', height: '320px', borderRadius: '12px', overflow: 'hidden', position: 'relative',
                  border: '2px solid #38bdf8', cursor: 'grab', touchAction: 'none'
                }}
                onPointerDown={handleEditorPointerDown}
                onPointerMove={handleEditorPointerMove}
                onPointerUp={handleEditorPointerUp}
                onPointerLeave={handleEditorPointerUp}
              >
                <img 
                  src={getMediaUrl(editingPhoto.ruta)} 
                  alt="Editor preview" 
                  style={{
                    position: 'absolute', inset: 0, width: '100%', height: '100%',
                    objectFit: 'cover',
                    objectPosition: `${editorX}% ${editorY}%`,
                    transform: `scale(${editorZoom / 100})`,
                    pointerEvents: 'none'
                  }}
                  crossOrigin="anonymous"
                />
                {isDraggingEditor.current && (
                  <div style={{ position: 'absolute', inset: 0, border: '1px dashed rgba(255,255,255,0.5)', pointerEvents: 'none', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gridTemplateRows: '1fr 1fr 1fr' }}>
                    {[...Array(9)].map((_, i) => <div key={i} style={{ border: '1px dashed rgba(255,255,255,0.2)' }} />)}
                  </div>
                )}
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem', color: '#cbd5e1' }}>
                <span>Zoom ({editorZoom}%)</span>
                {editorZoom !== 100 && <button onClick={() => setEditorZoom(100)} style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', fontSize: '0.8rem' }}>Reset</button>}
              </div>
              <input 
                type="range" min="100" max="250" value={editorZoom} 
                onChange={(e) => setEditorZoom(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#38bdf8' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => setEditingPhoto(null)}
                style={{ flex: 1, padding: '12px', background: 'transparent', border: '1px solid #475569', color: 'white', borderRadius: '8px', cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button 
                onClick={savePhotoEdits}
                disabled={photoEditorSaveStatus === 'saving'}
                style={{ flex: 1, padding: '12px', background: '#38bdf8', color: '#0f172a', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                {photoEditorSaveStatus === 'saving' ? 'Guardando...' : photoEditorSaveStatus === 'saved' ? '¡Guardado!' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Timelapse Overlay */}
      {showTimelapse && (
        <CultivoTimelapse photos={photos} onClose={() => setShowTimelapse(false)} />
      )}
    </div>
  );
}
