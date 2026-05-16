'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Blurhash } from 'react-blurhash';
import { getMediaUrl } from '@/lib/media-url';
import { storage } from '@/lib/firebase/config';
import { ref, uploadBytes } from 'firebase/storage';
import ConsentimientoFotoModal from '@/components/user/ConsentimientoFotoModal';

interface UserPlantaMediaManagerProps {
  plantaId: string;
  userEmail: string;
  onMediaChange?: () => void;
}

export default function UserPlantaMediaManager({ plantaId, userEmail, onMediaChange }: UserPlantaMediaManagerProps) {
  const [photos, setPhotos] = useState<any[]>([]);
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
  const [photoEditorSaveStatus, setPhotoEditorSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Drag and Drop States
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  useEffect(() => {
    if (plantaId && userEmail) {
      loadMedia();
      checkConsentimiento();
    }
  }, [plantaId, userEmail]);

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
      const res = await fetch(`/api/user/plantas/${plantaId}/photos`, { headers: { 'x-user-email': userEmail } });
      const data = await res.json();
      setPhotos(data.photos || []);
      if (onMediaChange) onMediaChange();
    } catch (e) {
      console.error('Error loading media:', e);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploading(true);

    try {
      for (let i = 0; i < e.target.files.length; i++) {
        const file = e.target.files[i];
        
        const tempPath = `uploads/temp/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const storageRef = ref(storage, tempPath);
        await uploadBytes(storageRef, file);
        const rawStoragePath = storageRef.fullPath;

        const res = await fetch(`/api/user/plantas/${plantaId}/photos`, {
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
      e.target.value = '';
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Seguro que quieres eliminar esta foto de tu planta?')) return;
    
    try {
      const res = await fetch(`/api/user/plantas/${plantaId}/photos?photoId=${id}`, {
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
      const res = await fetch(`/api/user/plantas/${plantaId}/photos`, {
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

      const res = await fetch(`/api/user/plantas/${plantaId}/photos`, {
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
        await fetch(`/api/user/plantas/${plantaId}/photos`, {
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
    <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
      <div className="form-group full" style={{ marginBottom: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
          <small style={{ color: userPhotos.length >= 4 ? '#ef4444' : '#64748b', fontWeight: 'bold' }}>
            {userPhotos.length} / 4 permitidas
          </small>
        </div>
        
        <div className="gallery">
          {userPhotos.map(p => {
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
            try { meta = JSON.parse(p.resumen || '{}'); } catch(e){}
            const isUser = p.origen === 'usuario';

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
                draggable={isUser && p.resultadoValidacion !== 'rechazado'}
                onDragStart={(e) => {
                  if (p.resultadoValidacion !== 'rechazado') {
                    handleDragStart(e, p.id);
                  } else {
                    e.preventDefault();
                  }
                }}
                onDragOver={(e) => handleDragOver(e, p.id)}
                onDragLeave={() => setDragOverId(null)}
                onDrop={(e) => {
                  if (p.resultadoValidacion !== 'rechazado') {
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
                    objectPosition: `${meta.profile_object_x || 50}% ${meta.profile_object_y || 50}%`,
                    transform: `scale(${(meta.profile_object_zoom || 100) / 100})`
                  }} 
                  crossOrigin="anonymous" 
                />
                {p.resultadoValidacion === 'rechazado' && p.tipo !== 'sancionada' ? (
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, background: 'rgba(220, 38, 38, 0.95)', color: 'white', fontSize: '0.65rem', padding: '6px 4px', textAlign: 'center', zIndex: 10, fontWeight: 'bold' }}>
                    ❌ Rechazada<br/>
                    <span style={{ fontSize: '0.55rem', fontWeight: 'normal', opacity: 0.9 }}>
                      {p.motivoRechazo || 'Incumple las normas'}
                    </span>
                  </div>
                ) : p.validado === 0 && p.tipo !== 'sancionada' ? (
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, background: 'rgba(245, 158, 11, 0.9)', color: 'white', fontSize: '0.65rem', padding: '6px 4px', textAlign: 'center', zIndex: 10, fontWeight: 'bold' }}>
                    ⏳ Pendiente de validación<br/>
                    <span style={{ fontSize: '0.55rem', fontWeight: 'normal', opacity: 0.9 }}>
                      El equipo revisará esta foto
                    </span>
                  </div>
                ) : null}
                
                {isUser && (
                  <div className="photo-actions" style={{ zIndex: 20 }}>
                    {p.resultadoValidacion !== 'rechazado' && (
                      <button 
                        type="button"
                        className={`photo-action-btn btn-photo-primary ${isPrimary ? 'is-active' : ''}`}
                        onClick={() => setPrimaryPhoto(p.id)} 
                        title={isPrimary ? 'Foto de portada de tu hortaliza' : 'Marcar como portada'}
                      >
                        {isPrimary ? '★' : '☆'}
                      </button>
                    )}
                    {p.resultadoValidacion !== 'rechazado' && (
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
          
          {userPhotos.length < 4 && (
            <div className={`custom-file-upload drop-zone inline-drop-zone`}>
              {/* Input oculto — se activa solo tras comprobar consentimiento */}
              <input
                ref={fileInputRef}
                type="file"
                id="upload-photos-user"
                multiple
                accept="image/*"
                onChange={(e) => handleFileUpload(e)}
                disabled={uploading}
                style={{ display: 'none' }}
              />
              
              {uploading ? (
                <div className="drop-zone-content">
                  <span style={{ fontSize: '1.5rem', animation: 'spin 2s linear infinite', display: 'inline-block' }}>⏳</span>
                  <span style={{ color: '#10b981', fontWeight: 'bold', fontSize: '0.75rem', textAlign: 'center' }}>Subiendo...</span>
                </div>
              ) : (
                <div className="drop-zone-content">
                  <div className="drop-zone-buttons" style={{ flexDirection: 'column' }}>
                    <button
                      type="button"
                      onClick={handleClickAddPhoto}
                      className="btn-upload primary"
                      style={{ padding: '8px', fontSize: '0.8rem', background: '#10b981', border: 'none', cursor: 'pointer' }}
                    >
                      <span className="icon" style={{ fontSize: '1.2rem', marginBottom: '4px', display: 'block' }}>📸</span> Añadir
                    </button>
                  </div>
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

      {/* Editor Modal */}
      {editingPhoto && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.85)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)', padding: '20px' }}>
          <div style={{ background: 'white', borderRadius: '16px', width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a' }}>Encuadrar Foto</h3>
              <button onClick={() => setEditingPhoto(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', color: '#94a3b8', cursor: 'pointer' }}>&times;</button>
            </div>
            <div style={{ padding: '20px' }}>
              <div style={{ width: '100%', height: '200px', background: '#f1f5f9', borderRadius: '8px', overflow: 'hidden', position: 'relative', marginBottom: '20px' }}>
                <img 
                  src={getMediaUrl(editingPhoto.ruta)} 
                  alt="Preview" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: `${editorX}% ${editorY}%`, transform: `scale(${editorZoom / 100})` }} 
                  crossOrigin="anonymous" 
                />
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 'bold', color: '#475569', marginBottom: '8px' }}>
                    <span>Eje X (Horizontal)</span>
                    <span style={{ color: '#94a3b8' }}>{editorX}%</span>
                  </label>
                  <input type="range" min="0" max="100" value={editorX} onChange={e => setEditorX(Number(e.target.value))} style={{ width: '100%', accentColor: '#10b981' }} />
                </div>
                <div>
                  <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 'bold', color: '#475569', marginBottom: '8px' }}>
                    <span>Eje Y (Vertical)</span>
                    <span style={{ color: '#94a3b8' }}>{editorY}%</span>
                  </label>
                  <input type="range" min="0" max="100" value={editorY} onChange={e => setEditorY(Number(e.target.value))} style={{ width: '100%', accentColor: '#10b981' }} />
                </div>
                <div>
                  <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 'bold', color: '#475569', marginBottom: '8px' }}>
                    <span>Zoom</span>
                    <span style={{ color: '#94a3b8' }}>{editorZoom}%</span>
                  </label>
                  <input type="range" min="100" max="300" value={editorZoom} onChange={e => setEditorZoom(Number(e.target.value))} style={{ width: '100%', accentColor: '#10b981' }} />
                </div>
              </div>
            </div>
            
            <div style={{ padding: '16px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button onClick={() => setEditingPhoto(null)} style={{ padding: '8px 16px', background: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#475569', fontWeight: 'bold', cursor: 'pointer' }}>Cancelar</button>
              <button onClick={savePhotoEdits} disabled={photoEditorSaveStatus === 'saving'} style={{ padding: '8px 16px', background: '#10b981', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {photoEditorSaveStatus === 'saving' ? 'Guardando...' : photoEditorSaveStatus === 'saved' ? '✓ Guardado' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
