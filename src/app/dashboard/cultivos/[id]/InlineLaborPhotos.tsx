'use client';
import React, { useState, useEffect, useRef } from 'react';
import { getMediaUrl } from '@/lib/media-url';

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
        setPhotos(data.photos || []);
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
      const formData = new FormData();
      formData.append('file', file);
      
      const url = isPending
        ? '/api/user/cultivos/avisos/pending/photos'
        : `/api/user/cultivos/avisos/${idcultivosavisos}/photos`;

      if (isPending) {
        formData.append('idcultivos', idcultivos);
        formData.append('idpauta', idpauta.toString());
        formData.append('fechaEmision', fechaEmision);
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'x-user-email': userEmail },
        body: formData
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
    try {
      const url = isPending
        ? `/api/user/cultivos/avisos/pending/photos?idcultivos=${idcultivos}`
        : `/api/user/cultivos/avisos/${idcultivosavisos}/photos`;
        
      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail },
        body: JSON.stringify({ photoId, action: 'setPrincipal' })
      });
      if (res.ok) await loadPhotos();
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

  // Drag to reorder logic (just triggering setPrincipal if dropped as first)
  const [draggedPhotoId, setDraggedPhotoId] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, id: number) => {
    setDraggedPhotoId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDropOnPhoto = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (targetIndex === 0 && draggedPhotoId) {
      handleSetPrincipal(draggedPhotoId);
    }
    setDraggedPhotoId(null);
  };

  return (
    <div style={{ marginTop: '16px', background: 'rgba(255,255,255,0.5)', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
      <h5 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
        <span>Fotografías de la labor {photos.length > 0 ? `(${photos.length}/4)` : ''}</span>
        {loading && <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Cargando...</span>}
      </h5>

      <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px', alignItems: 'center' }}>
        
        {/* Render Photos */}
        {photos.map((p, index) => (
          <div 
            key={p.id}
            draggable
            onDragStart={(e) => handleDragStart(e, p.id)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDropOnPhoto(e, index)}
            style={{
              position: 'relative', width: '120px', height: '120px', flexShrink: 0,
              borderRadius: '12px', border: p.esPrincipal ? '3px solid #3b82f6' : '1px solid #cbd5e1',
              overflow: 'hidden', cursor: 'grab', background: '#f8fafc',
              boxShadow: p.esPrincipal ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            <img 
              src={getMediaUrl(p.ruta)} 
              alt="Labor" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              onClick={() => setLightboxUrl(getMediaUrl(p.ruta))}
            />
            {p.validado === 0 && (
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, background: 'rgba(234,179,8,0.9)',
                color: 'white', fontSize: '0.65rem', fontWeight: 'bold', padding: '4px', textAlign: 'center', zIndex: 10
              }}>
                PENDIENTE
              </div>
            )}
            
            {/* Hover Actions */}
            <div style={{ position: 'absolute', top: '4px', right: '4px', display: 'flex', gap: '4px', zIndex: 20 }}>
              <button
                onClick={() => handleSetPrincipal(p.id)}
                title="Marcar como preferida"
                style={{
                  background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '50%',
                  width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', fontSize: '0.9rem', color: p.esPrincipal ? '#eab308' : '#94a3b8',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                ★
              </button>
              <button
                onClick={() => handleDeletePhoto(p.id)}
                title="Eliminar"
                style={{
                  background: 'rgba(239,68,68,0.9)', border: 'none', borderRadius: '50%',
                  width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', fontSize: '0.8rem', color: 'white',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                ✕
              </button>
            </div>
            {p.esPrincipal && (
              <div style={{ position: 'absolute', bottom: '0', left: '0', right: '0', background: 'rgba(59,130,246,0.9)', color: 'white', fontSize: '0.7rem', padding: '4px', textAlign: 'center', fontWeight: 'bold' }}>
                PRINCIPAL
              </div>
            )}
          </div>
        ))}

        {/* Upload Box */}
        {photos.length < 4 && (
          <div 
            ref={uploadContainerRef}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              width: '120px', height: '120px', flexShrink: 0, borderRadius: '12px',
              border: isDragOver ? '2px dashed #3b82f6' : '2px dashed #cbd5e1',
              background: isDragOver ? '#eff6ff' : 'transparent',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#64748b', transition: 'all 0.2s', gap: '8px'
            }}
            title="Sube o arrastra una foto aquí"
          >
            {uploading ? (
              <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#3b82f6' }}>Subiendo...</span>
            ) : (
              <>
                <span style={{ fontSize: '2rem' }}>+</span>
                <span style={{ fontSize: '0.75rem', textAlign: 'center', padding: '0 8px' }}>Añadir Foto</span>
              </>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
            />
          </div>
        )}
        
      </div>
    </div>
  );
}
