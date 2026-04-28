'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Blurhash } from 'react-blurhash';
import './EspecieForm.css'; // Reuse the EspecieForm CSS for the common classes

interface LaborFormProps {
  laborId: string | null;
  userEmail: string | null;
}

const MDI_TO_EMOJI: Record<string, string> = {
  'mdi-water': '💧', 'mdi-sprout': '🌱', 'mdi-leaf': '🍃', 'mdi-flower': '🌺',
  'mdi-tree': '🌳', 'mdi-scissors-cutting': '✂️', 'mdi-tractor': '🚜',
  'mdi-shovel': '⛏️', 'mdi-shield-bug': '🛡️', 'mdi-spray': '💦',
  'mdi-weather-sunny': '☀️', 'mdi-thermometer': '🌡️', 'mdi-basket': '🧺',
  'mdi-hand-water': '🖐️', 'mdi-format-list-bulleted': '🏷️'
};

const SUGGESTED_EMOJIS = [
  '🌱', '💧', '⛏️', '✂️', '🚜', '🧺', '🌺', '🌳', '🍃', '☀️', 
  '🌡️', '💦', '🛡️', '🖐️', '🍂', '🌾', '🎋', '🪴', '✨', '🏷️'
];

const STYLE_FILTERS: Record<string, string> = {
  vintage: 'sepia(40%) contrast(110%) saturate(120%) brightness(95%) hue-rotate(-5deg)',
  cinematic: 'contrast(120%) saturate(110%) brightness(90%) sepia(20%) hue-rotate(180deg) hue-rotate(-180deg)',
  vibrant: 'saturate(150%) contrast(105%) brightness(105%)',
  bnw: 'grayscale(100%) contrast(120%) brightness(105%)',
  fade: 'contrast(85%) brightness(110%) saturate(80%) sepia(10%)',
  none: 'none'
};

export default function LaborForm({ laborId, userEmail }: LaborFormProps) {
  const router = useRouter();

  const defaultFormData = {
    laboresnombre: '',
    laboresdescripcion: '',
    laboresicono: '',
    laborescolor: '#64748b',
    laboresactivosino: 1
  };

  const [formData, setFormData] = useState<any>(defaultFormData);
  const [initialData, setInitialData] = useState<any>(defaultFormData);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'no-changes'>('idle');
  const isDirty = JSON.stringify(formData) !== JSON.stringify(initialData);

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('detalles');

  // Photos State
  const [photos, setPhotos] = useState<any[]>([]);
  const [dragOverPhotos, setDragOverPhotos] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [draggedPhotoIndex, setDraggedPhotoIndex] = useState<number | null>(null);
  const [draggedOverPhotoIndex, setDraggedOverPhotoIndex] = useState<number | null>(null);
  const [heroIndex, setHeroIndex] = useState(0);

  // AI Image State
  const [showAiImageModal, setShowAiImageModal] = useState(false);
  const [aiImageConcept, setAiImageConcept] = useState('');
  const [aiImageResult, setAiImageResult] = useState<string | null>(null);
  const [aiImageLoading, setAiImageLoading] = useState(false);

  // Hero Drag State
  const [draggedHeroPhotoId, setDraggedHeroPhotoId] = useState<number | null>(null);
  const [draggedOverHeroPhotoId, setDraggedOverHeroPhotoId] = useState<number | null>(null);

  // Editor State
  const [editingPhoto, setEditingPhoto] = useState<any>(null);
  const [editorX, setEditorX] = useState(50);
  const [editorY, setEditorY] = useState(50);
  const [editorZoom, setEditorZoom] = useState(100);
  const [editorBrightness, setEditorBrightness] = useState(100);
  const [editorContrast, setEditorContrast] = useState(100);
  const [editorStyle, setEditorStyle] = useState('');
  const [editorSeoAlt, setEditorSeoAlt] = useState('');
  const [photoEditorSaveStatus, setPhotoEditorSaveStatus] = useState<'idle' | 'saving' | 'no-changes'>('idle');
  const [editorInitialState, setEditorInitialState] = useState('');

  useEffect(() => {
    if (laborId && userEmail) {
      loadLabor(laborId);
      loadPhotos(laborId);
    }
  }, [laborId, userEmail]);

  const loadLabor = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/labores/${id}`, { headers: { 'x-user-email': userEmail! } });
      const data = await res.json();
      if (data.success && data.labor) {
        let iconToUse = data.labor.laboresicono;
        if (iconToUse && iconToUse.startsWith('mdi-')) {
          iconToUse = MDI_TO_EMOJI[iconToUse] || '🌱';
        }
        const loadedData = {
          laboresnombre: data.labor.laboresnombre || '',
          laboresdescripcion: data.labor.laboresdescripcion || '',
          laboresicono: iconToUse || '',
          laborescolor: data.labor.laborescolor || '#64748b',
          laboresactivosino: data.labor.laboresactivosino !== undefined ? data.labor.laboresactivosino : 1
        };
        setFormData(loadedData);
        setInitialData(loadedData);
      } else {
        alert('Labor no encontrada');
        router.push('/dashboard/admin/labores');
      }
    } catch (e) {
      console.error(e);
      alert('Error cargando labor');
    } finally {
      setLoading(false);
    }
  };

  const loadPhotos = async (id: string | number) => {
    if (!userEmail) return;
    try {
      const res = await fetch(`/api/admin/labores/${id}/photos`, { headers: { 'x-user-email': userEmail } });
      const data = await res.json();
      setPhotos(data.photos || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev: any) => ({ ...prev, [name]: checked ? 1 : 0 }));
    } else {
      setFormData((prev: any) => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async () => {
    if (!userEmail) return;
    if (!isDirty) {
      setSaveStatus('no-changes');
      setTimeout(() => setSaveStatus('idle'), 2000);
      return;
    }
    
    setSaveStatus('saving');
    try {
      const url = laborId ? `/api/admin/labores/${laborId}` : '/api/admin/labores';
      const method = laborId ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      if (data.success) {
        setSaveStatus('idle');
        setInitialData(formData);
        if (!laborId && data.id) {
          router.replace(`/dashboard/admin/labores/${data.id}`);
        }
      } else {
        alert('Error: ' + data.error);
        setSaveStatus('idle');
      }
    } catch (err) {
      alert('Error de conexión al guardar.');
      setSaveStatus('idle');
    }
  };

  const goBack = () => {
    if (isDirty) {
      if (!confirm('Tienes cambios sin guardar. ¿Seguro que quieres salir?')) return;
    }
    router.push('/dashboard/admin/labores');
  };

  // --- Photo Upload Logic ---
  const handleFileUpload = async (e: any) => {
    if (!laborId || !userEmail) {
      alert('Guarda la labor primero antes de subir fotos.');
      return;
    }
    const files = Array.from(e.target.files) as File[];
    if (!files.length) return;
    
    const validImageFiles = files.filter(f => f.type.startsWith('image/'));
    const remainingSlots = 4 - photos.length;
    if (validImageFiles.length > remainingSlots) {
      alert(`Solo puedes subir ${remainingSlots} fotos más (Límite de 4).`);
      return;
    }

    setUploadingPhotos(true);
    try {
      for (const file of validImageFiles) {
        const formDataPayload = new FormData();
        formDataPayload.append('file', file);
        formDataPayload.append('laborNombre', formData.laboresnombre);

        await fetch(`/api/admin/labores/${laborId}/photos`, {
          method: 'POST',
          headers: { 'x-user-email': userEmail },
          body: formDataPayload
        });
      }
      await loadPhotos(laborId);
    } catch (error) {
      console.error('Error uploading file', error);
      alert('Error al subir el archivo');
    } finally {
      setUploadingPhotos(false);
    }
  };

  const generateAiImage = async () => {
    if (!formData.laboresnombre) {
      alert("Por favor, ponle nombre a la labor antes de generar la IA.");
      return;
    }
    if (!userEmail) {
      alert("Falta el email del usuario. Recarga la página.");
      return;
    }
    setAiImageLoading(true);
    setAiImageResult(null);
    try {
      const res = await fetch('/api/ai/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail },
        body: JSON.stringify({ 
          tipoEntidad: 'labor',
          especieNombre: formData.laboresnombre, 
          concept: aiImageConcept 
        })
      });
      const data = await res.json();
      if (data.success && data.base64) {
        setAiImageResult(`data:image/jpeg;base64,${data.base64}`);
      } else {
        alert(data.error || 'Error al generar la imagen.');
      }
    } catch (e) {
      console.error(e);
      alert('Error de conexión al generar la imagen.');
    } finally {
      setAiImageLoading(false);
    }
  };

  const uploadAiImage = async () => {
    if (!aiImageResult || !laborId || !userEmail) return;
    setUploadingPhotos(true);
    setShowAiImageModal(false);
    try {
      const res = await fetch(aiImageResult);
      const blob = await res.blob();
      const file = new File([blob], `ai-generated-labor-${Date.now()}.jpg`, { type: 'image/jpeg' });
      
      const formDataPayload = new FormData();
      formDataPayload.append('file', file);
      formDataPayload.append('laborNombre', formData.laboresnombre);

      await fetch(`/api/admin/labores/${laborId}/photos`, {
        method: 'POST',
        headers: { 'x-user-email': userEmail },
        body: formDataPayload
      });
      await loadPhotos(laborId);
      setAiImageResult(null);
      setAiImageConcept('');
    } catch (error) {
      console.error('Error uploading AI image:', error);
      alert('Error al guardar la imagen generada.');
    } finally {
      setUploadingPhotos(false);
    }
  };

  const handleSetPrimaryPhoto = async (photoId: number) => {
    if (!laborId || !userEmail) return;
    setPhotos(prev => prev.map(p => ({ ...p, esPrincipal: p.id === photoId ? 1 : 0 })));
    setHeroIndex(0);
    try {
      await fetch(`/api/admin/labores/${laborId}/photos`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail },
        body: JSON.stringify({ photoId, action: 'setPrimary' })
      });
      loadPhotos(laborId);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePhoto = async (photoId: number) => {
    if (!confirm('¿Eliminar esta foto permanentemente?') || !laborId || !userEmail) return;
    try {
      await fetch(`/api/admin/labores/${laborId}/photos?photoId=${photoId}`, {
        method: 'DELETE',
        headers: { 'x-user-email': userEmail }
      });
      loadPhotos(laborId);
    } catch (e) {
      alert('Error eliminando archivo');
    }
  };

  const handleReorderPhotos = async (newPhotos: any[]) => {
    if (!laborId || !userEmail) return;
    setPhotos(newPhotos);
    try {
      const reorderPayload = newPhotos.map((p, index) => ({ id: p.id, orden: index + 1 }));
      await fetch(`/api/admin/labores/${laborId}/photos/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail },
        body: JSON.stringify({ photos: reorderPayload })
      });
    } catch (e) {
      console.error('Error reordering', e);
    }
  };

  const openPhotoEditor = (photo: any) => {
    setEditingPhoto(photo);
    let meta: any = {};
    try { meta = JSON.parse(photo.resumen || '{}'); } catch(e){}
    setEditorX(meta.profile_object_x ?? 50);
    setEditorY(meta.profile_object_y ?? 50);
    setEditorZoom(meta.profile_object_zoom ?? 100);
    setEditorBrightness(meta.profile_brightness ?? 100);
    setEditorContrast(meta.profile_contrast ?? 100);
    setEditorStyle(meta.profile_style ?? '');
    setEditorSeoAlt(meta.seo_alt || '');
    setEditorInitialState(JSON.stringify({ x: meta.profile_object_x ?? 50, y: meta.profile_object_y ?? 50, z: meta.profile_object_zoom ?? 100, b: meta.profile_brightness ?? 100, c: meta.profile_contrast ?? 100, s: meta.profile_style ?? '', alt: meta.seo_alt || '' }));
    setPhotoEditorSaveStatus('idle');
  };

  const closePhotoEditor = () => { setEditingPhoto(null); };

  const handleSavePhotoEditor = async () => {
    if (!editingPhoto || !laborId || !userEmail) return;
    
    const currentState = JSON.stringify({ x: editorX, y: editorY, z: editorZoom, b: editorBrightness, c: editorContrast, s: editorStyle, alt: editorSeoAlt });
    if (currentState === editorInitialState) {
      setPhotoEditorSaveStatus('no-changes');
      setTimeout(() => closePhotoEditor(), 1000);
      return;
    }

    setPhotoEditorSaveStatus('saving');
    let meta: any = {};
    try { meta = JSON.parse(editingPhoto.resumen || '{}'); } catch(e){}
    meta.profile_object_x = editorX;
    meta.profile_object_y = editorY;
    meta.profile_object_zoom = editorZoom;
    meta.profile_brightness = editorBrightness;
    meta.profile_contrast = editorContrast;
    meta.profile_style = editorStyle;
    meta.seo_alt = editorSeoAlt;

    try {
      await fetch(`/api/admin/labores/${laborId}/photos`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail },
        body: JSON.stringify({ photoId: editingPhoto.id, action: 'updateMeta', resumen: meta })
      });
      loadPhotos(laborId);
      closePhotoEditor();
    } catch (e) {
      alert('Error guardando encuadre');
    } finally {
      setPhotoEditorSaveStatus('idle');
    }
  };

  if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}>Cargando Ficha de Labor...</div>;

  const sortedPhotos = [...photos].sort((a, b) => {
    if (a.esPrincipal && !b.esPrincipal) return -1;
    if (!a.esPrincipal && b.esPrincipal) return 1;
    return (a.orden || 0) - (b.orden || 0);
  });
  const safeHeroIndex = heroIndex >= sortedPhotos.length ? 0 : heroIndex;
  const heroPhoto = sortedPhotos.length > 0 ? sortedPhotos[safeHeroIndex] : null;
  let heroMeta: any = {};
  if (heroPhoto) {
    try { heroMeta = JSON.parse(heroPhoto.resumen || '{}'); } catch(e){}
  }
  const vibrantColor = heroMeta.vibrant_color || formData.laborescolor || '#10b981';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f8fafc', overflow: 'hidden', position: 'relative' }}>
      
      {/* Floating Save Button */}
      <div style={{ position: 'absolute', bottom: '30px', right: '30px', zIndex: 100, display: 'flex', gap: '12px', transition: 'all 0.3s ease', transform: isDirty ? 'translateY(0)' : 'translateY(100px)', opacity: isDirty ? 1 : 0, pointerEvents: isDirty ? 'auto' : 'none' }}>
        <button className="btn-save-floating" onClick={handleSave} disabled={saveStatus === 'saving'} style={{
            background: saveStatus === 'no-changes' ? '#10b981' : '#3b82f6', color: 'white', border: 'none', padding: '16px 32px', borderRadius: '50px',
            fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 10px 25px rgba(59, 130, 246, 0.4)',
            display: 'flex', alignItems: 'center', gap: '10px'
          }}>
          {saveStatus === 'saving' ? (
            <><span style={{ animation: 'spin 2s linear infinite' }}>⏳</span> Guardando...</>
          ) : saveStatus === 'no-changes' ? (
            <>✓ Sin cambios</>
          ) : (
            <>💾 Guardar Cambios</>
          )}
        </button>
      </div>

      {/* Navigation Buttons */}
      <div style={{ padding: '16px 24px 0', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button onClick={() => router.push('/dashboard')} style={{ background: 'white', border: '1px solid #cbd5e1', color: '#475569', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          🏠 Volver al Inicio
        </button>
        <button onClick={goBack} style={{ background: 'white', border: '1px solid #cbd5e1', color: '#475569', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          🌍 Volver a Labores Globales
        </button>
      </div>

      {/* ── Subheader Integrado ── */}
      <div style={{ margin: '16px 24px', background: 'linear-gradient(135deg, #b45309, #f59e0b)', borderRadius: '16px', padding: '24px 28px', color: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '12px' }}>
              {laborId ? `Editar Labor: ${formData.laboresnombre}` : 'Nueva Labor'}
              {isDirty && <span style={{ background: '#fef08a', color: '#854d0e', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold' }}>Cambios sin guardar</span>}
            </h1>
            <p style={{ margin: '4px 0 0', opacity: 0.9, fontSize: '0.9rem' }}>
              Editor de Labor Agrícola
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* Left Form Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: '100%', maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Hero Banner Sticky Block */}
            <div style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
              <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'white', borderBottom: '1px solid #e2e8f0' }}>
                <div style={{ background: vibrantColor ? `linear-gradient(135deg, #f8fafc 0%, ${vibrantColor}18 60%, ${vibrantColor}30 100%)` : '#f8fafc', transition: 'background 0.6s ease', display: 'flex', gap: 0, height: '220px' }}>
                  {photos.length > 0 ? (
                    <>
                      <div 
                        style={{ position: 'relative', flexShrink: 0, width: '180px', height: '100%', overflow: 'hidden', border: draggedOverHeroPhotoId === -1 ? '4px dashed #10b981' : 'none', opacity: draggedOverHeroPhotoId === -1 ? 0.8 : 1, transition: 'all 0.2s ease' }}
                        onDragEnter={(e) => { e.preventDefault(); if (draggedHeroPhotoId !== null) setDraggedOverHeroPhotoId(-1); }}
                        onDragOver={(e) => e.preventDefault()}
                        onDragLeave={() => { if(draggedOverHeroPhotoId === -1) setDraggedOverHeroPhotoId(null); }}
                        onDrop={(e) => {
                          e.preventDefault();
                          if (draggedHeroPhotoId !== null && draggedOverHeroPhotoId === -1) {
                            const draggedPhoto = photos.find(p => p.id === draggedHeroPhotoId);
                            if (draggedPhoto && draggedPhoto.esPrincipal !== 1) {
                              const newPhotos = [...photos];
                              newPhotos.forEach(pt => pt.esPrincipal = (pt.id === draggedHeroPhotoId ? 1 : 0));
                              const dragIdx = newPhotos.findIndex(pt => pt.id === draggedHeroPhotoId);
                              if (dragIdx !== -1) {
                                const [draggedItem] = newPhotos.splice(dragIdx, 1);
                                newPhotos.unshift(draggedItem);
                                handleReorderPhotos(newPhotos);
                              }
                              handleSetPrimaryPhoto(draggedHeroPhotoId);
                            }
                          }
                          setDraggedHeroPhotoId(null);
                          setDraggedOverHeroPhotoId(null);
                        }}
                      >
                        {heroPhoto && (() => {
                          const hFilter = heroMeta.profile_style ? STYLE_FILTERS[heroMeta.profile_style] : 'none';
                          const fullFilter = (heroMeta.profile_brightness !== undefined || heroMeta.profile_contrast !== undefined)
                            ? `brightness(${heroMeta.profile_brightness ?? 100}%) contrast(${heroMeta.profile_contrast ?? 100}%) ${heroMeta.profile_style ? STYLE_FILTERS[heroMeta.profile_style] : ''}`.trim()
                            : hFilter;
                          return (
                            <img key={heroPhoto.id} src={heroPhoto.ruta.startsWith('http') ? heroPhoto.ruta : (heroPhoto.ruta.startsWith('/') ? heroPhoto.ruta : `/${heroPhoto.ruta}`)}
                              alt={heroMeta.seo_alt || formData.laboresnombre}
                              style={{ width: '100%', height: '100%', objectFit: 'cover',
                                objectPosition: `${heroMeta.profile_object_x ?? 50}% ${heroMeta.profile_object_y ?? 50}%`,
                                transformOrigin: `${heroMeta.profile_object_x ?? 50}% ${heroMeta.profile_object_y ?? 50}%`,
                                transform: `scale(${(heroMeta.profile_object_zoom ?? 100) / 100})`,
                                filter: fullFilter, transition: 'opacity 0.3s ease' }}
                            />
                          );
                        })()}
                      </div>
                      {sortedPhotos.filter((_, i) => i !== safeHeroIndex).length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px 8px', overflowY: 'auto' }}>
                          {sortedPhotos.map((p, i) => ({ p, i })).filter(({ i }) => i !== safeHeroIndex).map(({ p }) => {
                            let tMeta: any = {};
                            try { tMeta = JSON.parse(p.resumen || '{}'); } catch(e){}
                            return (
                              <div key={p.id} 
                                draggable
                                onClick={() => { handleSetPrimaryPhoto(p.id); setHeroIndex(0); }}
                                onDragStart={() => setDraggedHeroPhotoId(p.id)}
                                onDragEnter={() => draggedHeroPhotoId !== null && setDraggedOverHeroPhotoId(p.id)}
                                onDragEnd={() => {
                                  if (draggedHeroPhotoId !== null && draggedOverHeroPhotoId !== null && draggedHeroPhotoId !== draggedOverHeroPhotoId) {
                                    const newPhotos = [...photos];
                                    const dragIdx = newPhotos.findIndex(pt => pt.id === draggedHeroPhotoId);
                                    const dropIdx = newPhotos.findIndex(pt => pt.id === draggedOverHeroPhotoId);
                                    if (dragIdx !== -1 && dropIdx !== -1) {
                                      const [draggedItem] = newPhotos.splice(dragIdx, 1);
                                      newPhotos.splice(dropIdx, 0, draggedItem);
                                      handleReorderPhotos(newPhotos);
                                    }
                                  }
                                  setDraggedHeroPhotoId(null);
                                  setDraggedOverHeroPhotoId(null);
                                }}
                                onDragOver={(e) => e.preventDefault()}
                                style={{ width: '64px', height: '64px', borderRadius: '8px', overflow: 'hidden', cursor: 'grab', flexShrink: 0,
                                  border: draggedOverHeroPhotoId === p.id ? '2px dashed #10b981' : '2px solid rgba(0,0,0,0.08)', 
                                  transition: 'all 0.2s ease', opacity: draggedHeroPhotoId === p.id ? 0.5 : 1, transform: draggedOverHeroPhotoId === p.id ? 'scale(1.05)' : 'scale(1)'
                                }}
                                onMouseEnter={e => { if(draggedHeroPhotoId === null) e.currentTarget.style.transform = 'scale(1.1)'; }}
                                onMouseLeave={e => { if(draggedHeroPhotoId === null) e.currentTarget.style.transform = 'scale(1)'; }}
                              >
                                <img src={p.ruta.startsWith('http') ? p.ruta : (p.ruta.startsWith('/') ? p.ruta : `/${p.ruta}`)} alt="" draggable={false}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: `${tMeta.profile_object_x ?? 50}% ${tMeta.profile_object_y ?? 50}%`, transform: `scale(${(tMeta.profile_object_zoom ?? 100) / 100})` }} />
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                      {formData.laboresicono && <span style={{ fontSize: '4rem' }}>{formData.laboresicono}</span>}
                      <div style={{ color: '#64748b', fontSize: '1.4rem', fontWeight: 'bold' }}>Sin fotos de labor</div>
                    </div>
                  )}
                </div>
                
                <div className="form-tabs" style={{ display: 'flex', padding: '0 12px' }}>
                  <button type="button" className={activeTab === 'detalles' ? 'active' : ''} onClick={() => setActiveTab('detalles')}>📝 Detalles</button>
                  <button type="button" className={activeTab === 'adjuntos' ? 'active' : ''} onClick={() => {
                    if (!laborId) alert('Guarda la labor primero para añadir fotos.');
                    else setActiveTab('adjuntos');
                  }}>📎 Fotos ({photos.length}/4)</button>
                </div>
              </div>
            </div>

            {/* Form Content */}
            <div style={{ background: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', flex: 1 }}>
              {activeTab === 'detalles' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'flex', gap: '20px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', color: '#334155', fontSize: '0.95rem' }}>Nombre de la Labor *</label>
                      <input type="text" name="laboresnombre" value={formData.laboresnombre} onChange={handleFormChange} required placeholder="Ej. Riego"
                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1.05rem', boxSizing: 'border-box' }} />
                    </div>
                    <div style={{ width: '120px' }}>
                      <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', color: '#334155', fontSize: '0.95rem' }}>Color Base</label>
                      <input type="color" name="laborescolor" value={formData.laborescolor} onChange={handleFormChange} 
                        style={{ width: '100%', height: '48px', padding: '2px', borderRadius: '8px', border: '1px solid #cbd5e1', cursor: 'pointer' }} />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', color: '#334155', fontSize: '0.95rem' }}>Icono (Emoji Representativo)</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                      <input type="text" name="laboresicono" value={formData.laboresicono} onChange={handleFormChange} placeholder="🌱"
                        style={{ width: '90px', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1.8rem', textAlign: 'center', boxSizing: 'border-box' }} />
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px dashed #cbd5e1', flex: 1 }}>
                        {SUGGESTED_EMOJIS.map(emoji => (
                          <button key={emoji} type="button" onClick={() => setFormData((prev: any) => ({...prev, laboresicono: emoji}))}
                            style={{ background: 'white', border: '1px solid #e2e8f0', fontSize: '1.4rem', cursor: 'pointer', padding: '6px', borderRadius: '8px', filter: formData.laboresicono === emoji ? 'drop-shadow(0 0 3px #10b981)' : 'none', transform: formData.laboresicono === emoji ? 'scale(1.1)' : 'none', transition: 'all 0.2s' }}>
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', color: '#334155', fontSize: '0.95rem' }}>Descripción</label>
                    <textarea name="laboresdescripcion" value={formData.laboresdescripcion} onChange={handleFormChange} rows={4} placeholder="Describe en qué consiste detalladamente la labor..."
                      style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', boxSizing: 'border-box', resize: 'vertical' }} />
                  </div>

                  <div style={{ background: formData.laboresactivosino === 1 ? '#ecfdf5' : '#f1f5f9', padding: '20px', borderRadius: '8px', border: `1px solid ${formData.laboresactivosino === 1 ? '#10b981' : '#cbd5e1'}`, transition: 'all 0.3s' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontWeight: 'bold', color: '#334155', fontSize: '1.1rem' }}>
                      <input type="checkbox" name="laboresactivosino" checked={formData.laboresactivosino === 1} onChange={handleFormChange} style={{ width: '22px', height: '22px', accentColor: '#10b981' }} />
                      Esta labor está activa y disponible
                    </label>
                  </div>
                </div>
              )}

              {activeTab === 'adjuntos' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div className="gallery">
                    {photos.map((p, index) => {
                      let meta: any = {};
                      try { meta = JSON.parse(p.resumen || '{}'); } catch(e){}
                      const baseFilter = (meta.profile_brightness !== undefined || meta.profile_contrast !== undefined)
                        ? `brightness(${meta.profile_brightness ?? 100}%) contrast(${meta.profile_contrast ?? 100}%) ${meta.profile_style ? STYLE_FILTERS[meta.profile_style] : ''}`.trim()
                        : (meta.profile_style ? STYLE_FILTERS[meta.profile_style] : 'none');

                      const imgStyle: any = {
                        filter: baseFilter, objectFit: 'cover',
                        objectPosition: `${meta.profile_object_x ?? 50}% ${meta.profile_object_y ?? 50}%`,
                        transformOrigin: `${meta.profile_object_x ?? 50}% ${meta.profile_object_y ?? 50}%`,
                        transform: `scale(${(meta.profile_object_zoom ?? 100) / 100})`
                      };

                      const isDragging = draggedPhotoIndex === index;
                      const isDragOver = draggedOverPhotoIndex === index;

                      return (
                        <div key={p.id} className={`gallery-item ${p.esPrincipal ? 'is-preferred' : ''}`}
                          style={{ opacity: isDragging ? 0.5 : 1, border: isDragOver ? '2px dashed #10b981' : undefined, transform: isDragOver ? 'scale(1.02)' : 'none', cursor: 'grab' }}
                          draggable
                          onDragStart={() => setDraggedPhotoIndex(index)}
                          onDragEnter={() => setDraggedPhotoIndex !== null && setDraggedOverPhotoIndex(index)}
                          onDragEnd={() => {
                            if (draggedPhotoIndex !== null && draggedOverPhotoIndex !== null && draggedPhotoIndex !== draggedOverPhotoIndex) {
                              const newPhotos = [...photos];
                              const [draggedItem] = newPhotos.splice(draggedPhotoIndex, 1);
                              newPhotos.splice(draggedOverPhotoIndex, 0, draggedItem);
                              const wasAlreadyPrimary = draggedItem.esPrincipal === 1;
                              if (draggedOverPhotoIndex === 0) {
                                newPhotos.forEach(pt => pt.esPrincipal = (pt.id === draggedItem.id ? 1 : 0));
                              }
                              handleReorderPhotos(newPhotos);
                              if (draggedOverPhotoIndex === 0 && !wasAlreadyPrimary) {
                                handleSetPrimaryPhoto(draggedItem.id);
                              }
                            }
                            setDraggedPhotoIndex(null);
                            setDraggedOverPhotoIndex(null);
                          }}
                          onDragOver={(e) => e.preventDefault()}
                        >
                          {meta.blurhash && <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}><Blurhash hash={meta.blurhash} width="100%" height="100%" resolutionX={32} resolutionY={32} punch={1} /></div>}
                          <img src={p.ruta.startsWith('http') ? p.ruta : (p.ruta.startsWith('/') ? p.ruta : `/${p.ruta}`)} alt={meta.seo_alt || 'foto'} loading="lazy" style={{ ...imgStyle, position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }} draggable={false} />
                          <div className="photo-actions" style={{ zIndex: 20 }}>
                            <button type="button" className={`photo-action-btn btn-photo-primary ${p.esPrincipal ? 'is-active' : ''}`} onClick={() => handleSetPrimaryPhoto(p.id)}>{p.esPrincipal ? '★' : '☆'}</button>
                            <button type="button" className="photo-action-btn btn-photo-edit" onClick={() => openPhotoEditor(p)}>✏️</button>
                            <button type="button" className="photo-action-btn btn-photo-delete" onClick={() => handleDeletePhoto(p.id)}>✕</button>
                          </div>
                        </div>
                      );
                    })}
                    
                    {photos.length < 4 && (
                      <div className={`custom-file-upload drop-zone inline-drop-zone ${dragOverPhotos ? 'drag-over' : ''}`}
                        onDragEnter={(e) => { e.preventDefault(); setDragOverPhotos(true); }}
                        onDragOver={(e) => { e.preventDefault(); setDragOverPhotos(true); }}
                        onDragLeave={(e) => { e.preventDefault(); setDragOverPhotos(false); }}
                        onDrop={(e) => {
                          e.preventDefault(); setDragOverPhotos(false);
                          if (e.dataTransfer.files?.length > 0) handleFileUpload({ target: { files: e.dataTransfer.files } });
                        }}
                      >
                        <input type="file" id="upload-photos-labor" multiple accept="image/*" onChange={handleFileUpload} disabled={uploadingPhotos} />
                        <input type="file" id="upload-camera-labor" accept="image/*" capture="environment" onChange={handleFileUpload} style={{display: 'none'}} disabled={uploadingPhotos} />
                        
                        {uploadingPhotos ? (
                          <div className="drop-zone-content">
                            <span style={{ fontSize: '1.5rem', animation: 'spin 2s linear infinite' }}>⏳</span>
                            <span style={{ color: '#10b981', fontWeight: 'bold', fontSize: '0.75rem' }}>Subiendo...</span>
                          </div>
                        ) : (
                          <div className="drop-zone-content">
                            <div className="drop-zone-buttons" style={{ flexDirection: 'column' }}>
                              <label htmlFor="upload-photos-labor" className="btn-upload primary" style={{ padding: '8px', fontSize: '0.8rem' }}><span className="icon">📁</span> Galería</label>
                              <label htmlFor="upload-camera-labor" className="btn-upload secondary mobile-only" style={{ padding: '8px', fontSize: '0.8rem' }}><span className="icon">📷</span> Cámara</label>
                              <button type="button" className="btn-upload" style={{ padding: '8px', fontSize: '0.8rem', background: 'linear-gradient(135deg, #a855f7 0%, #8b5cf6 100%)', color: 'white', border: 'none' }} onClick={() => setShowAiImageModal(true)} disabled={uploadingPhotos}>
                                <span className="icon">✨</span> Generar IA
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Editor Modal */}
      {editingPhoto && (
        <div className="photo-editor-overlay">
          <div className="photo-editor-content">
            <div className="photo-editor-header">
              <h3>Ajustar Encuadre</h3>
              <button className="photo-editor-close" onClick={closePhotoEditor}>✕</button>
            </div>
            
            <div className="photo-editor-body">
              <div className="photo-editor-preview-container">
                <div style={{ width: '200px', height: '266px', borderRadius: '12px', overflow: 'hidden', border: '2px solid #e2e8f0', background: '#e2e8f0', position: 'relative' }}>
                  {(() => {
                    let meta: any = {};
                    try { meta = JSON.parse(editingPhoto.resumen || '{}'); } catch(e){}
                    const bFilter = editorStyle ? STYLE_FILTERS[editorStyle] : 'none';
                    const fFilter = (editorBrightness !== 100 || editorContrast !== 100)
                      ? `brightness(${editorBrightness}%) contrast(${editorContrast}%) ${editorStyle ? STYLE_FILTERS[editorStyle] : ''}`.trim()
                      : bFilter;
                    return (
                      <img src={editingPhoto.ruta.startsWith('http') ? editingPhoto.ruta : (editingPhoto.ruta.startsWith('/') ? editingPhoto.ruta : `/${editingPhoto.ruta}`)} alt="" className="photo-editor-image"
                        style={{ objectPosition: `${editorX}% ${editorY}%`, transform: `scale(${editorZoom / 100})`, filter: fFilter }} />
                    );
                  })()}
                </div>
                <div className="photo-editor-hint">💡 Usa los deslizadores para encuadrar</div>
              </div>

              <div className="photo-editor-controls">
                <div className="editor-control-group">
                  <label>Eje X (Horizontal) <span>{editorX}%</span></label>
                  <input type="range" min="0" max="100" value={editorX} onChange={(e) => setEditorX(Number(e.target.value))} />
                </div>
                <div className="editor-control-group">
                  <label>Eje Y (Vertical) <span>{editorY}%</span></label>
                  <input type="range" min="0" max="100" value={editorY} onChange={(e) => setEditorY(Number(e.target.value))} />
                </div>
                <div className="editor-control-group">
                  <label>Zoom <span>{editorZoom}%</span></label>
                  <input type="range" min="100" max="300" value={editorZoom} onChange={(e) => setEditorZoom(Number(e.target.value))} />
                </div>
              </div>
            </div>

            <div className="photo-editor-footer">
              <button className="btn-secondary" onClick={closePhotoEditor}>Cancelar</button>
              <button className={`btn-primary ${photoEditorSaveStatus === 'no-changes' ? 'success' : ''}`} onClick={handleSavePhotoEditor} disabled={photoEditorSaveStatus === 'saving'}>
                {photoEditorSaveStatus === 'saving' ? 'Guardando...' : photoEditorSaveStatus === 'no-changes' ? '✓ Sin cambios' : 'Guardar Encuadre'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Image Modal */}
      {showAiImageModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)' }} onClick={() => setShowAiImageModal(false)}></div>
          <div style={{ background: 'white', borderRadius: '16px', width: '100%', maxWidth: '600px', zIndex: 1001, display: 'flex', flexDirection: 'column', maxHeight: '90vh', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1.5rem' }}>✨</span> Generador IA (Imagen 4.0)
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748b' }}>Labor: <strong>{formData.laboresnombre || 'Sin nombre'}</strong></p>
              </div>
              <button onClick={() => setShowAiImageModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', color: '#94a3b8', cursor: 'pointer' }}>&times;</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#334155' }}>
                  ¿Qué está pasando en la foto?
                </label>
                <textarea 
                  value={aiImageConcept} 
                  onChange={(e) => setAiImageConcept(e.target.value)}
                  placeholder="Ej. Una persona con sombrero de paja regando con una regadera en un huerto soleado..."
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', resize: 'vertical', minHeight: '80px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#334155', fontSize: '0.85rem' }}>
                  Sugerencias Rápidas:
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {[
                    "Una persona realizando esta labor en un día soleado",
                    "Plano detalle (macro) de las herramientas o elementos usados en esta tarea",
                    "Vista general de un huerto después de realizar esta labor",
                    "Fotografía esquemática o conceptual de la acción"
                  ].map((sug, i) => (
                    <button 
                      key={i} 
                      onClick={() => setAiImageConcept(sug)}
                      style={{ 
                        padding: '6px 12px', borderRadius: '20px', background: aiImageConcept === sug ? '#f3e8ff' : '#f8fafc',
                        color: aiImageConcept === sug ? '#7e22ce' : '#64748b', border: `1px solid ${aiImageConcept === sug ? '#c084fc' : '#e2e8f0'}`,
                        fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.2s ease'
                      }}
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>

              {aiImageResult && (
                <div style={{ marginTop: '10px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0', background: '#f8fafc' }}>
                  <img src={aiImageResult} alt="IA Generada" style={{ width: '100%', display: 'block' }} />
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button 
                  onClick={generateAiImage} 
                  disabled={aiImageLoading}
                  style={{ 
                    flex: 1, padding: '12px', borderRadius: '8px', 
                    background: aiImageLoading ? '#e2e8f0' : 'linear-gradient(135deg, #a855f7 0%, #8b5cf6 100%)', 
                    color: aiImageLoading ? '#94a3b8' : 'white', border: 'none', fontWeight: 'bold', cursor: aiImageLoading ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                  }}
                >
                  {aiImageLoading ? '⏳ Generando...' : '✨ Generar Nueva Imagen'}
                </button>
                {aiImageResult && (
                  <button 
                    onClick={uploadAiImage}
                    style={{ 
                      flex: 1, padding: '12px', borderRadius: '8px', background: '#10b981', 
                      color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                    }}
                  >
                    💾 Guardar en Galería
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
