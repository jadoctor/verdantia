'use client'; // Force hot-reload AI Image feature - Standardized photo editor: 2026-06-18T20:11:45
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { getMediaUrl } from '@/lib/media-url';

import PremiumBackButton from '@/components/ui/PremiumBackButton';
import PremiumAiButton from '@/components/ui/PremiumAiButton';
import PremiumSaveButton from '@/components/ui/PremiumSaveButton';
import PremiumCancelButton from '@/components/ui/PremiumCancelButton';
import { storage } from '@/lib/firebase/config';
import { ref, uploadBytes } from 'firebase/storage';
import { Blurhash } from 'react-blurhash';
import PhotoEditorModal from '@/components/admin/PhotoEditorModal';

const STYLE_FILTERS: Record<string, string> = {
  none: 'none',
  grayscale: 'grayscale(100%)',
  sepia: 'sepia(100%)',
  invert: 'invert(100%)',
  blur: 'blur(2px)',
  brightness: 'brightness(150%)',
  contrast: 'contrast(150%)',
  hueRotate: 'hue-rotate(90deg)',
  saturate: 'saturate(200%)'
};
import '@/components/admin/EspecieVegetalForm.css';

interface AnimalForm {
  especiesanimalesnombre: string;
  especiesanimalesicono: string;
  especiesanimalesdescripcion: string;
  especiesanimalesactivo: number;
}

interface AlimentacionItem {
  idespeciesanimales: number;
  xespeciesvegetalesanimalesidespeciesvegetales: number;
  xespeciesvegetalesanimalesidespeciesanimales: number;
  especiesanimalesesapto: number;
  especiesanimalespartes: string;
  especiesanimalesnotas: string;
  especiesvegetalesnombre: string;
  especiesvegetalesicono: string;
  primary_photo_ruta?: string;
  especiesanimalesemoji?: string;
}

interface PhotoItem {
  id: number;
  ruta: string;
  esPrincipal: number;
  resumen: string;
  nombreOriginal: string;
}

export default function AnimalEditPage() {
  const router = useRouter();
  const params = useParams();
  const isNew = params.id === 'nuevo';
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isDatosExpanded, setIsDatosExpanded] = useState(true);
  const [isAlimentacionExpanded, setIsAlimentacionExpanded] = useState(true);
  const [datosSubTab, setDatosSubTab] = useState<'datos' | 'fotos'>('datos');
  const [alimentacion, setAlimentacion] = useState<AlimentacionItem[]>([]);
  const [lightboxPhoto, setLightboxPhoto] = useState<{ url: string; nombre: string } | null>(null);

  // Photo states
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [heroIndex, setHeroIndex] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<PhotoItem | null>(null);
  const [photoSaveStatus, setPhotoSaveStatus] = useState<'idle' | 'saving' | 'no-changes'>('idle');

  // Drag states for Hero Carousel reordering
  const [draggedHeroPhotoId, setDraggedHeroPhotoId] = useState<number | null>(null);
  const [draggedOverHeroPhotoId, setDraggedOverHeroPhotoId] = useState<number | null>(null);

  // Drag states for gallery tab reordering (Pestaña Fotos)
  const [draggedPhotoIndex, setDraggedPhotoIndex] = useState<number | null>(null);
  const [draggedOverPhotoIndex, setDraggedOverPhotoIndex] = useState<number | null>(null);

  // AI Image States
  const [showAiImageModal, setShowAiImageModal] = useState(false);
  const [aiImageConcept, setAiImageConcept] = useState('');
  const [aiImageLoading, setAiImageLoading] = useState(false);
  const [aiImageResult, setAiImageResult] = useState<string | null>(null);
  const [aiImageDescription, setAiImageDescription] = useState('');
  const [aiImagePromptPreview, setAiImagePromptPreview] = useState('');
  const [aiImagePromptEdited, setAiImagePromptEdited] = useState(false);
  const [showPromptDetails, setShowPromptDetails] = useState(false);
  const [aiImageSeconds, setAiImageSeconds] = useState(0);
  const aiImageTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [formData, setFormData] = useState<AnimalForm>({
    especiesanimalesnombre: '',
    especiesanimalesicono: '👤',
    especiesanimalesdescripcion: '',
    especiesanimalesactivo: 1
  });
  
  const [initialData, setInitialData] = useState<AnimalForm | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user?.email) {
        setUserEmail(user.email);
        if (!isNew) {
          fetchAnimal(user.email);
        } else {
          setInitialData(formData);
        }
      } else {
        router.push('/login');
      }
    });
    return () => unsub();
  }, [router, isNew]);

  const fetchAnimal = async (email: string) => {
    try {
      const res = await fetch(`/api/admin/especiesanimales/${params.id}`, { headers: { 'x-user-email': email } });
      const data = await res.json();
      if (data.success) {
        setFormData(data.data);
        setInitialData(data.data);
        fetchAlimentacion(email);
        fetchPhotos(email);
      } else {
        alert(data.error);
        router.push('/dashboard/admin/especiesanimales');
      }
    } catch (err) { console.error(err); }
  };

  const fetchAlimentacion = async (email: string) => {
    try {
      const res = await fetch(`/api/admin/especiesanimales/${params.id}/alimentacion`, { headers: { 'x-user-email': email } });
      const data = await res.json();
      if (data.success) setAlimentacion(data.data);
    } catch (err) { console.error(err); }
  };

  const fetchPhotos = async (email: string) => {
    try {
      const res = await fetch(`/api/admin/especiesanimales/${params.id}/photos`, { headers: { 'x-user-email': email } });
      const data = await res.json();
      if (data.photos) {
        setPhotos(data.photos);
        const heroIdx = data.photos.findIndex((p: PhotoItem) => p.esPrincipal === 1);
        setHeroIndex(heroIdx >= 0 ? heroIdx : 0);
      }
    } catch (err) { console.error(err); }
  };

  const autoSave = useCallback(async (dataToSave: AnimalForm) => {
    if (isNew || !userEmail) return;
    setSaveStatus('saving');
    try {
      const res = await fetch(`/api/admin/especiesanimales/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail },
        body: JSON.stringify(dataToSave)
      });
      if (res.ok) { setSaveStatus('saved'); setInitialData(dataToSave); setTimeout(() => setSaveStatus('idle'), 2000); }
    } catch (err) { setSaveStatus('idle'); }
  }, [isNew, params.id, userEmail]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, type } = e.target as any;
    let parsedValue: any = e.target.value;
    if (type === 'checkbox') parsedValue = (e.target as HTMLInputElement).checked ? 1 : 0;
    const newForm = { ...formData, [name]: parsedValue };
    setFormData(newForm);
    if (!isNew) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      setSaveStatus('saving');
      debounceRef.current = setTimeout(() => autoSave(newForm), 1000);
    }
  };

  const handleCreate = async () => {
    if (!userEmail) return;
    setSaveStatus('saving');
    try {
      const res = await fetch(`/api/admin/especiesanimales`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) router.push(`/dashboard/admin/especiesanimales/${data.id}`);
      else { alert(data.error); setSaveStatus('idle'); }
    } catch (err) { setSaveStatus('idle'); }
  };

  // ── AI Image Helpers & Clipboard Paste ──
  const buildPromptPreview = (conceptOverride?: string) => {
    const nombre = formData.especiesanimalesnombre || 'animal';
    const conceptValue = conceptOverride !== undefined ? conceptOverride : aiImageConcept;
    const defaultConcept = `un ejemplar de ${nombre} en un corral de granja limpio y soleado, con paja en el suelo y vegetación verde difuminada en el fondo`;
    return `Fotografía profesional de stock de alta resolución (8K), tomada con una cámara DSLR Canon EOS R5 y un objetivo de retrato o macro, iluminación natural suave.\nSujeto principal: ${nombre} (animal de granja / ganado / ave de corral).\nEscena concreta: ${conceptValue || defaultConcept}.\nComposición: primer plano o plano medio del animal, nítido y detallado, fondo suavemente desenfocado (bokeh) mostrando un entorno de granja o campo.\nREGLAS ESTRICTAS:\n1. El sujeto es SIEMPRE un animal, ave o ganado de granja. Ignora otras acepciones.\n2. La fotografía debe parecer real y tomada por un fotógrafo profesional de fauna o agricultura.\n3. El entorno debe ser de granja o campo (pastizal, pradera, corral, gallinero, establo).\n4. NO incluir personas, manos, texto, logotipos ni marcas de agua.\n5. Mostrar al animal en un estado saludable y limpio.`;
  };

  useEffect(() => {
    return () => {
      if (aiImageTimerRef.current) {
        clearInterval(aiImageTimerRef.current);
      }
    };
  }, []);

  const generateAiImage = async () => {
    if (!formData.especiesanimalesnombre) {
      alert('Se necesita el nombre del animal de granja para generar la imagen.');
      return;
    }
    setAiImageLoading(true);
    setAiImageResult(null);
    setAiImageDescription('');
    setAiImageSeconds(0);
    if (aiImageTimerRef.current) clearInterval(aiImageTimerRef.current);
    aiImageTimerRef.current = setInterval(() => {
      setAiImageSeconds(s => s + 1);
    }, 1000);

    try {
      const body: any = {
        tipoEntidad: 'animal',
        especieNombre: formData.especiesanimalesnombre,
        concept: aiImageConcept
      };
      if (aiImagePromptEdited && aiImagePromptPreview.trim()) {
        body.customPrompt = aiImagePromptPreview;
      }
      const res = await fetch('/api/ai/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail || '' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.success && data.base64) {
        setAiImageResult(`data:image/jpeg;base64,${data.base64}`);
        if (data.description) setAiImageDescription(data.description);
        if (data.promptUsed) {
          setAiImagePromptPreview(data.promptUsed);
          setAiImagePromptEdited(false);
        }
      } else {
        alert(data.error || 'Error al generar la imagen.');
      }
    } catch (e) {
      console.error(e);
      alert('Error de conexión al generar la imagen.');
    } finally {
      setAiImageLoading(false);
      if (aiImageTimerRef.current) {
        clearInterval(aiImageTimerRef.current);
        aiImageTimerRef.current = null;
      }
    }
  };

  const uploadAiImage = async () => {
    if (!aiImageResult || !userEmail) return;
    setUploading(true);
    setShowAiImageModal(false);
    try {
      const res = await fetch(aiImageResult);
      const blob = await res.blob();
      const descBase = aiImageDescription || formData.especiesanimalesnombre || 'animal';

      const tempFileName = `temp-ai-${Date.now()}-${descBase.replace(/[^a-zA-Z0-9.-]/g, '')}.webp`;
      const tempPath = `uploads/temp/${tempFileName}`;
      const storageRef = ref(storage, tempPath);
      await uploadBytes(storageRef, blob);

      const saveRes = await fetch(`/api/admin/especiesanimales/${params.id}/photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail },
        body: JSON.stringify({
          rawStoragePath: storageRef.fullPath
        })
      });
      if (!saveRes.ok) {
        const errData = await saveRes.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP Error ${saveRes.status}`);
      }
      await fetchPhotos(userEmail);
      setAiImageResult(null);
      setAiImageConcept('');
      setAiImageDescription('');
      setAiImagePromptPreview('');
      setAiImagePromptEdited(false);
    } catch (error) {
      console.error('Error uploading AI image:', error);
      alert('Error al guardar la imagen generada.');
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.clipboardData && e.clipboardData.files.length > 0) {
        const imageFiles = Array.from(e.clipboardData.files).filter(f => f.type.startsWith('image/'));
        if (imageFiles.length > 0) {
          e.preventDefault();
          handleFileUpload(imageFiles);
        }
      }
    };

    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, [userEmail, formData.especiesanimalesnombre, photos.length]);

  // ── Photo handlers ──
  const handleFileUpload = async (files: FileList | File[] | null) => {
    if (!files || files.length === 0 || !userEmail) return;
    if (photos.length >= 4) { alert('Límite de 4 fotos alcanzado'); return; }
    setUploading(true);
    try {
      const filesArray = Array.from(files);
      for (let i = 0; i < filesArray.length; i++) {
        const file = filesArray[i];
        const tempPath = `uploads/temp/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const storageRef = ref(storage, tempPath);
        await uploadBytes(storageRef, file);
        await fetch(`/api/admin/especiesanimales/${params.id}/photos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail },
          body: JSON.stringify({ rawStoragePath: storageRef.fullPath })
        });
      }
      await fetchPhotos(userEmail);
    } catch (err) { alert('Error subiendo foto'); } finally { setUploading(false); }
  };

  const handleSetPrimary = async (photoId: number) => {
    if (!userEmail) return;
    await fetch(`/api/admin/especiesanimales/${params.id}/photos`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail },
      body: JSON.stringify({ action: 'setPrimary', photoId })
    });
    await fetchPhotos(userEmail);
  };

  const handleDeletePhoto = async (photoId: number) => {
    if (!confirm('¿Eliminar esta foto?') || !userEmail) return;
    await fetch(`/api/admin/especiesanimales/${params.id}/photos?id=${photoId}`, {
      method: 'DELETE', headers: { 'x-user-email': userEmail }
    });
    await fetchPhotos(userEmail);
  };

  const openPhotoEditor = (photo: PhotoItem) => {
    setEditingPhoto(photo);
  };

  const savePhotoEdits = async (metadata: any) => {
    if (!editingPhoto || !userEmail) return;
    if (metadata.noChanges) {
      setPhotoSaveStatus('no-changes');
      return;
    }
    
    setPhotoSaveStatus('saving');
    try {
      const currentRes = editingPhoto.resumen ? JSON.parse(editingPhoto.resumen) : {};
      const newRes = { ...currentRes, ...metadata };

      await fetch(`/api/admin/especiesanimales/${params.id}/photos`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail },
        body: JSON.stringify({ action: 'updateMeta', photoId: editingPhoto.id, resumen: JSON.stringify(newRes) })
      });
      await fetchPhotos(userEmail);
    } catch (e) {
      console.error('Error saving photo edits', e);
      alert('Error guardando cambios');
    } finally {
      setPhotoSaveStatus('idle');
    }
  };

  const handleReorderPhotos = async (newPhotos: any[]) => {
    setPhotos(newPhotos); // Optimistic UI update
    if (!userEmail) return;
    try {
      const reorderPayload = newPhotos.map((p, index) => ({ id: p.id, orden: index + 1 }));
      await fetch(`/api/admin/especiesanimales/${params.id}/photos`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail },
        body: JSON.stringify({ action: 'reorder', photos: reorderPayload })
      });
    } catch (e) {
      console.error('Error reordering photos', e);
    }
  };

  const handlePhotoReorder = (e?: React.DragEvent) => {
    if (e) e.preventDefault();
    if (draggedPhotoIndex !== null && draggedOverPhotoIndex !== null && draggedPhotoIndex !== draggedOverPhotoIndex) {
      const newPhotos = [...photos];
      const [draggedItem] = newPhotos.splice(draggedPhotoIndex, 1);
      newPhotos.splice(draggedOverPhotoIndex, 0, draggedItem);
      
      const wasAlreadyPrimary = draggedItem.esPrincipal === 1;
      if (draggedOverPhotoIndex === 0) {
        newPhotos.forEach(p => p.esPrincipal = (p.id === draggedItem.id ? 1 : 0));
      }
      
      handleReorderPhotos(newPhotos);
      
      if (draggedOverPhotoIndex === 0 && !wasAlreadyPrimary) {
        handleSetPrimary(draggedItem.id);
      }
    }
    setDraggedPhotoIndex(null);
    setDraggedOverPhotoIndex(null);
  };

  // Compute sorted photos and hero photo metadata (Regla 9 / standard carousel)
  const sortedPhotos = [...photos].sort((a, b) => (b.esPrincipal ? 1 : 0) - (a.esPrincipal ? 1 : 0));
  const safeHeroIndex = Math.min(heroIndex, Math.max(0, sortedPhotos.length - 1));
  const heroPhoto = sortedPhotos[safeHeroIndex] || null;
  const getPhotoMeta = (p: PhotoItem) => { try { return JSON.parse(p.resumen || '{}'); } catch { return {}; } };
  let vibrantColor: string | null = null;
  let heroMeta: any = {};
  if (heroPhoto) {
    try { heroMeta = JSON.parse(heroPhoto.resumen || '{}'); } catch (e) { }
    vibrantColor = heroMeta.vibrant_color || null;
  }

  return (
    <div style={{ width: '100%', boxSizing: 'border-box', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* Lightbox Modal */}
      {lightboxPhoto && (
        <div onClick={() => setLightboxPhoto(null)} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out' }}>
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
            <img src={lightboxPhoto.url} alt={lightboxPhoto.nombre} style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: '12px', objectFit: 'contain', boxShadow: '0 25px 60px rgba(0,0,0,0.5)' }} />
            <div style={{ position: 'absolute', bottom: '-40px', left: 0, right: 0, textAlign: 'center', color: 'white', fontWeight: 600 }}>{lightboxPhoto.nombre}</div>
            <button onClick={(e) => { e.stopPropagation(); setLightboxPhoto(null); }} style={{ position: 'absolute', top: '-16px', right: '-16px', background: 'white', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>✕</button>
          </div>
        </div>
      )}

      {/* Photo Editor Modal */}
      <PhotoEditorModal
        isOpen={!!editingPhoto}
        onClose={() => setEditingPhoto(null)}
        photoUrl={editingPhoto ? getMediaUrl(editingPhoto.ruta) : ''}
        fileName={editingPhoto?.nombreOriginal || editingPhoto?.ruta.split('/').pop() || ''}
        initialMetadata={editingPhoto?.resumen ? JSON.parse(editingPhoto.resumen) : null}
        onSave={savePhotoEdits}
        saveStatus={photoSaveStatus}
      />

      {/* AI Image Generator Modal */}
      {showAiImageModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.85)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', padding: '20px' }}>
          <div style={{ background: 'white', borderRadius: '20px', width: '100%', maxWidth: '600px', display: 'flex', flexDirection: 'column', maxHeight: '90vh', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', background: 'linear-gradient(to right, #f8fafc, #f1f5f9)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1.5rem' }}>✨</span> Generador de Imágenes IA
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748b' }}>Especie animal: <strong>{formData.especiesanimalesnombre || 'Sin nombre'}</strong></p>
              </div>
              <button onClick={() => setShowAiImageModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', color: '#94a3b8', cursor: 'pointer' }}>&times;</button>
            </div>

            <div style={{ padding: '24px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {!aiImageResult ? (
                <>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#334155' }}>
                      Contexto de la foto deseada
                    </label>
                    <textarea
                      value={aiImageConcept}
                      onChange={e => {
                        const val = e.target.value;
                        setAiImageConcept(val);
                        if (!aiImagePromptEdited) setAiImagePromptPreview(buildPromptPreview(val));
                      }}
                      placeholder="Ej. Fotografía de primer plano de la gallina buscando grano en el suelo..."
                      rows={3}
                      style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '0.95rem', resize: 'vertical' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#334155', fontSize: '0.85rem' }}>
                      Sugerencias Rápidas:
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {[
                        "En su hábitat natural, pastando libremente",
                        "Alimentándose en el comedero de su corral",
                        "Retrato de primer plano detallado de la cabeza",
                        "En grupo con otros animales de su especie en la granja",
                        "En un establo o gallinero limpio iluminado por el sol"
                      ].map(preset => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => {
                            setAiImageConcept(preset);
                            if (!aiImagePromptEdited) setAiImagePromptPreview(buildPromptPreview(preset));
                          }}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '20px',
                            border: `1px solid ${aiImageConcept === preset ? '#f59e0b' : '#e2e8f0'}`,
                            background: aiImageConcept === preset ? '#fef3c7' : '#f8fafc',
                            color: aiImageConcept === preset ? '#b45309' : '#475569',
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Prompt colapsable y editable */}
                  <details open={showPromptDetails} onToggle={(e: any) => setShowPromptDetails(e.target.open)} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                    <summary style={{ padding: '10px 14px', background: '#f8fafc', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '8px', userSelect: 'none', listStyle: 'none' }}>
                      <span style={{ transition: 'transform 0.2s', transform: showPromptDetails ? 'rotate(90deg)' : 'rotate(0deg)', display: 'inline-block' }}>▶</span>
                      🔧 Prompt técnico {aiImagePromptEdited && <span style={{ background: '#fef08a', color: '#854d0e', padding: '1px 6px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 'bold' }}>Editado</span>}
                    </summary>
                    <div style={{ padding: '12px 14px', borderTop: '1px solid #e2e8f0' }}>
                      <textarea
                        value={aiImagePromptPreview || buildPromptPreview()}
                        onChange={e => { setAiImagePromptPreview(e.target.value); setAiImagePromptEdited(true); }}
                        rows={8}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.8rem', fontFamily: 'monospace', resize: 'vertical', lineHeight: '1.5', color: '#334155', background: aiImagePromptEdited ? '#fffbeb' : '#f8fafc' }}
                      />
                      {aiImagePromptEdited && (
                        <button type="button" onClick={() => { setAiImagePromptPreview(buildPromptPreview()); setAiImagePromptEdited(false); }} style={{ marginTop: '8px', padding: '4px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white', color: '#64748b', fontSize: '0.75rem', cursor: 'pointer' }}>
                          ↩️ Restaurar prompt original
                        </button>
                      )}
                    </div>
                  </details>

                  <PremiumAiButton 
                    onClick={generateAiImage}
                    isLoading={aiImageLoading}
                    loadingText={`⏳ Generando... ${aiImageSeconds}s`}
                    text="✨ Generar Ahora"
                    style={{ width: '100%', marginTop: '10px' }}
                  />
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '100%', aspectRatio: '1/1', borderRadius: '16px', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}>
                    <img src={aiImageResult} alt="Generated by AI" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>

                  <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                    <PremiumCancelButton
                      onClick={() => setAiImageResult(null)}
                      text="Descartar y Reintentar"
                      style={{ flex: 1 }}
                    />
                    <PremiumSaveButton
                      onClick={uploadAiImage}
                      isLoading={uploading}
                      text="Guardar en Galería"
                      style={{ flex: 1 }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Navegación Hierárquica Superior */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <PremiumBackButton onClick={() => router.push('/dashboard')} text="🏠 Inicio" />
        <PremiumBackButton onClick={() => router.push('/dashboard/admin/especiesanimales')} text="🔙 Volver a Especies animales" />
      </div>

      {/* Subheader Contextual y Autoguardado */}
      <div style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', borderRadius: '14px', padding: '12px 20px', marginBottom: '24px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '12px' }}>
            {formData.especiesanimalesicono} {formData.especiesanimalesnombre || 'Nuevo Especie animal'}
          </h1>
          <p style={{ margin: '4px 0 0', opacity: 0.9, fontSize: '0.85rem' }}>
            ✏️ Editar Especie animal · ID del Registro: {isNew ? 'Nuevo' : params.id}
          </p>
        </div>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: 'rgba(255,255,255,0.2)', padding: '3px 8px', borderRadius: '8px', fontSize: '0.74rem', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
            {isNew ? '✨ Creación Manual' : (saveStatus === 'saving' ? '⏳ Guardando...' : '✅ Guardado')}
          </div>
        </div>
      </div>

      {/* Estado Global */}
      <div style={{ background: formData.especiesanimalesactivo === 1 ? '#ecfdf5' : '#f1f5f9', borderRadius: '12px', padding: '12px 20px', marginBottom: '20px', border: `1px solid ${formData.especiesanimalesactivo === 1 ? '#10b981' : '#cbd5e1'}`, display: 'flex', alignItems: 'center', gap: '12px', transition: 'all 0.3s' }}>
        <input type="checkbox" name="especiesanimalesactivo" checked={formData.especiesanimalesactivo === 1} onChange={handleChange} style={{ width: '22px', height: '22px', accentColor: '#10b981', cursor: 'pointer' }} />
        <span style={{ fontWeight: 700, fontSize: '0.95rem', color: formData.especiesanimalesactivo === 1 ? '#065f46' : '#475569' }}>
          {formData.especiesanimalesactivo === 1 ? '🟢 Activo (Visible en todo el sistema)' : '🔴 Inactivo (Oculto)'}
        </span>
      </div>

      {/* Hero Carousel (Regla 9) */}
      {photos.length > 0 ? (() => {
        const hFilter = heroMeta.profile_style ? STYLE_FILTERS[heroMeta.profile_style] : 'none';
        const fullFilter = (heroMeta.profile_brightness !== undefined || heroMeta.profile_contrast !== undefined)
          ? `brightness(${heroMeta.profile_brightness ?? 100}%) contrast(${heroMeta.profile_contrast ?? 100}%) ${heroMeta.profile_style ? STYLE_FILTERS[heroMeta.profile_style] : ''}`.trim()
          : hFilter;
        return (
          <div style={{
            background: vibrantColor ? `linear-gradient(135deg, #f8fafc 0%, ${vibrantColor}18 60%, ${vibrantColor}30 100%)` : 'linear-gradient(135deg, #fffbeb, #fef3c7)',
            borderRadius: '16px',
            marginBottom: '24px',
            display: 'flex',
            gap: '16px',
            alignItems: 'center',
            border: vibrantColor ? '1px solid #e2e8f0' : '1px solid #fde68a',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
            overflow: 'hidden'
          }}>
            {/* Hero photo 180x220 (3:4) */}
            <div
              style={{
                position: 'relative', flexShrink: 0, width: '180px', height: '220px', overflow: 'hidden',
                border: draggedOverHeroPhotoId === -1 ? '4px dashed #10b981' : 'none',
                opacity: draggedOverHeroPhotoId === -1 ? 0.8 : 1,
                transition: 'all 0.2s ease'
              }}
              onDragEnter={(e) => { e.preventDefault(); if (draggedHeroPhotoId !== null) setDraggedOverHeroPhotoId(-1); }}
              onDragOver={(e) => e.preventDefault()}
              onDragLeave={() => { if (draggedOverHeroPhotoId === -1) setDraggedOverHeroPhotoId(null); }}
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
                    handleSetPrimary(draggedHeroPhotoId);
                  }
                }
                setDraggedHeroPhotoId(null);
                setDraggedOverHeroPhotoId(null);
              }}
            >
              {heroPhoto && (
                <div
                  onClick={() => setLightboxPhoto({ url: getMediaUrl(heroPhoto.ruta), nombre: formData.especiesanimalesnombre })}
                  style={{ width: '100%', height: '100%', cursor: 'zoom-in', position: 'relative' }}
                >
                  {heroMeta.blurhash && (
                    <div style={{ position: 'absolute', inset: 0 }}>
                      <Blurhash hash={heroMeta.blurhash} width="100%" height="100%" resolutionX={32} resolutionY={32} punch={1} />
                    </div>
                  )}
                  <img key={heroPhoto.id} src={getMediaUrl(heroPhoto.ruta)}
                    alt={heroMeta.seo_alt || formData.especiesanimalesnombre}
                    style={{
                      width: '100%', height: '100%', objectFit: 'cover',
                      objectPosition: `${heroMeta.profile_object_x ?? 50}% ${heroMeta.profile_object_y ?? 50}%`,
                      transformOrigin: `${heroMeta.profile_object_x ?? 50}% ${heroMeta.profile_object_y ?? 50}%`,
                      transform: `scale(${(heroMeta.profile_object_zoom ?? 100) / 100})`,
                      filter: fullFilter, transition: 'opacity 0.3s ease',
                      position: 'relative'
                    }}
                    crossOrigin="anonymous" />
                </div>
              )}
            </div>

            {/* Right strip: only photos NOT currently shown as hero */}
            {sortedPhotos.filter((_, i) => i !== safeHeroIndex).length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '8px 6px', justifyContent: 'center', flexShrink: 0 }}>
                {sortedPhotos
                  .map((p, i) => ({ p, i }))
                  .filter(({ i }) => i !== safeHeroIndex)
                  .map(({ p, i }) => {
                    let tMeta: any = {};
                    try { tMeta = JSON.parse(p.resumen || '{}'); } catch (e) { }
                    return (
                      <div key={p.id}
                        draggable
                        onClick={() => { handleSetPrimary(p.id); setHeroIndex(0); }}
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
                        style={{
                          width: '52px', height: '70px', borderRadius: '8px', overflow: 'hidden', cursor: 'grab', flexShrink: 0,
                          border: draggedOverHeroPhotoId === p.id ? '2px dashed #8b5cf6' : '2px solid transparent',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                          transition: 'all 0.2s ease',
                          opacity: draggedHeroPhotoId === p.id ? 0.5 : 1,
                          transform: draggedOverHeroPhotoId === p.id ? 'scale(1.05)' : 'scale(1)',
                          position: 'relative'
                        }}
                        onMouseEnter={e => { if (draggedHeroPhotoId === null) { e.currentTarget.style.border = '2px solid #8b5cf6'; e.currentTarget.style.transform = 'scale(1.05)'; } }}
                        onMouseLeave={e => { if (draggedHeroPhotoId === null) { e.currentTarget.style.border = '2px solid transparent'; e.currentTarget.style.transform = 'scale(1)'; } }}
                      >
                        <img src={getMediaUrl(p.ruta)}
                          draggable={false}
                          alt=""
                          style={{
                            width: '100%', height: '100%', objectFit: 'cover'
                          }} crossOrigin="anonymous" />
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        );
      })() : (
        <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          {formData.especiesanimalesicono && <span style={{ fontSize: '2.5rem' }}>{formData.especiesanimalesicono}</span>}
          <h2 style={{ margin: 0, color: '#1e293b', fontSize: '1.2rem', fontWeight: 600 }}>Sin fotos en la galería</h2>
        </div>
      )}

      {/* SECCIÓN 1: DATOS BÁSICOS */}
      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', marginBottom: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>

        {/* Cabecera Colapsable */}
        <div onClick={() => setIsDatosExpanded(!isDatosExpanded)} style={{ padding: '16px 24px', background: isDatosExpanded ? 'transparent' : '#f8fafc', borderBottom: isDatosExpanded ? '1px solid #e2e8f0' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', transition: 'background 0.2s' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h2 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
              📝 Datos Básicos
            </h2>
            {!isDatosExpanded && formData.especiesanimalesnombre && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#e2e8f0', padding: '4px 12px', borderRadius: '20px', fontSize: '0.85rem', color: '#475569' }}>
                <span>{formData.especiesanimalesicono}</span>
                <span style={{ fontWeight: 600 }}>{formData.especiesanimalesnombre}</span>
                <span>({formData.especiesanimalesactivo ? 'Activo' : 'Inactivo'})</span>
              </div>
            )}
          </div>
          <div style={{ color: '#64748b', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
            {isDatosExpanded ? 'Ocultar' : 'Mostrar'}
            <span style={{ transform: isDatosExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s', display: 'inline-block' }}>🔽</span>
          </div>
        </div>

        {/* Contenido con sub-pestañas CSS */}
        <div style={{ display: isDatosExpanded ? 'block' : 'none' }}>

          {/* Sub-tabs CSS (Regla 8 — siempre en DOM) */}
          <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', padding: '0 24px', background: '#f8fafc', gap: '4px' }}>
            {(['datos', 'fotos'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setDatosSubTab(tab)}
                style={{
                  padding: '10px 18px', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 600,
                  fontSize: '0.9rem', borderBottom: datosSubTab === tab ? '2px solid #f59e0b' : '2px solid transparent',
                  color: datosSubTab === tab ? '#d97706' : '#64748b', transition: 'all 0.2s',
                  display: 'flex', alignItems: 'center', gap: '6px'
                }}
              >
                {tab === 'datos' ? '📝 Datos' : `📷 Fotos ${photos.length > 0 ? `(${photos.length})` : ''}`}
              </button>
            ))}
          </div>

          {/* ── Panel DATOS ── */}
          <div style={{ display: datosSubTab === 'datos' ? 'block' : 'none', padding: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontWeight: 600, fontSize: '0.9rem', color: '#334155' }}>Nombre del Especie animal *</label>
                <input name="especiesanimalesnombre" value={formData.especiesanimalesnombre} onChange={handleChange} placeholder="Ej: Gallina" style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontWeight: 600, fontSize: '0.9rem', color: '#334155' }}>Icono (Emoji)</label>
                <input name="especiesanimalesicono" value={formData.especiesanimalesicono} onChange={handleChange} placeholder="Ej: 🐔" style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', gridColumn: '1 / -1' }}>
                <label style={{ fontWeight: 600, fontSize: '0.9rem', color: '#334155' }}>Descripción Genérica</label>
                <textarea name="especiesanimalesdescripcion" value={formData.especiesanimalesdescripcion} onChange={handleChange} placeholder="Añade notas biológicas sobre este animal de granja (herbívoro, omnívoro...)" style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', minHeight: '100px', resize: 'vertical' }} />
              </div>
            </div>
            {isNew && (
              <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
                <button onClick={handleCreate} disabled={saveStatus === 'saving' || !formData.especiesanimalesnombre} style={{ background: '#d97706', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem' }}>
                  {saveStatus === 'saving' ? 'Guardando...' : 'Crear Especie animal'}
                </button>
              </div>
            )}
          </div>

          {/* ── Panel FOTOS ── */}
          <div style={{ display: datosSubTab === 'fotos' ? 'block' : 'none', padding: '24px' }}>



            {/* Galería con Dropzone */}
            <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px' }}>📷 Fotos</span>
              <span style={{ fontSize: '0.82rem', color: photos.length >= 4 ? '#ef4444' : '#64748b', fontWeight: 600 }}>{photos.length} / 4 permitidas</span>
            </div>

            {/* Gallery grid containing photos and inline dropzone */}
            {((photos.length > 0) || (photos.length < 4 && !isNew)) && (
              <div className="gallery">
                {photos.map((p, index) => {
                  const meta = getPhotoMeta(p);
                  const isPrimary = p.esPrincipal === 1;
                  const thumbFilter = meta.profile_style ? STYLE_FILTERS[meta.profile_style] : 'none';
                  const fullThumbFilter = (meta.profile_brightness !== undefined || meta.profile_contrast !== undefined)
                    ? `brightness(${meta.profile_brightness ?? 100}%) contrast(${meta.profile_contrast ?? 100}%) ${meta.profile_style ? STYLE_FILTERS[meta.profile_style] : ''}`.trim()
                    : thumbFilter;
                  return (
                    <div
                      key={p.id}
                      className={`gallery-item ${isPrimary ? 'is-preferred' : ''}`}
                      draggable
                      onDragStart={() => setDraggedPhotoIndex(index)}
                      onDragOver={(e) => { e.preventDefault(); setDraggedOverPhotoIndex(index); }}
                      onDrop={handlePhotoReorder}
                    >
                      {meta.blurhash && (
                        <div style={{ position: 'absolute', inset: 0 }}>
                          <Blurhash hash={meta.blurhash} width="100%" height="100%" resolutionX={32} resolutionY={32} punch={1} />
                        </div>
                      )}
                      <img
                        src={getMediaUrl(p.ruta)}
                        alt={meta.seo_alt || ''}
                        style={{
                          position: 'absolute',
                          inset: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          objectPosition: `${meta.profile_object_x ?? 50}% ${meta.profile_object_y ?? 50}%`,
                          transformOrigin: `${meta.profile_object_x ?? 50}% ${meta.profile_object_y ?? 50}%`,
                          transform: `scale(${(meta.profile_object_zoom ?? 100) / 100})`,
                          filter: fullThumbFilter
                        }}
                        crossOrigin="anonymous"
                      />
                      <div className="photo-actions" style={{ zIndex: 20 }}>
                        <button
                          type="button"
                          className={`photo-action-btn btn-photo-primary ${isPrimary ? 'is-active' : ''}`}
                          onClick={() => handleSetPrimary(p.id)}
                          title={isPrimary ? 'Foto de portada' : 'Hacer portada'}
                        >
                          {isPrimary ? '⭐' : '☆'}
                        </button>
                        <button
                          type="button"
                          className="photo-action-btn btn-photo-delete"
                          onClick={() => handleDeletePhoto(p.id)}
                          title="Eliminar foto"
                        >
                          ✕
                        </button>
                        <button
                          type="button"
                          className="photo-action-btn btn-photo-edit"
                          onClick={() => openPhotoEditor(p)}
                          title="Editar imagen y SEO"
                        >
                          ✏️
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Inline Dropzone (only if less than 4 photos and not a new entry) */}
                {photos.length < 4 && !isNew && (
                  <div
                    onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setDragOver(true); }}
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragOver(true); }}
                    onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDragOver(false); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDragOver(false);
                      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                        handleFileUpload(e.dataTransfer.files);
                      }
                    }}
                    className={`custom-file-upload drop-zone inline-drop-zone ${dragOver ? 'drag-over' : ''}`}
                    style={{ cursor: 'default' }}
                  >
                    <input
                      type="file"
                      id="upload-animal-photos"
                      multiple
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e.target.files)}
                      style={{ display: 'none' }}
                      disabled={uploading}
                    />

                    {uploading ? (
                      <div className="drop-zone-content">
                        <span style={{ fontSize: '1.5rem', animation: 'spin 2s linear infinite', display: 'inline-block' }}>⏳</span>
                        <span style={{ color: '#3b82f6', fontWeight: 'bold', fontSize: '0.75rem', textAlign: 'center' }}>Procesando...</span>
                      </div>
                    ) : (
                      <div className="drop-zone-content" style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                        <div className="drop-zone-buttons" style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', alignItems: 'center' }}>
                          <label
                            htmlFor="upload-animal-photos"
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
                            📁 Seleccionar
                          </label>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setAiImageConcept('');
                              setAiImageResult(null);
                              setAiImagePromptPreview(buildPromptPreview(''));
                              setAiImagePromptEdited(false);
                              setShowAiImageModal(true);
                            }}
                            className="btn-upload"
                            style={{
                              background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
                              color: 'white',
                              border: 'none',
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
                            ✨ Generar IA
                          </button>
                        </div>
                        <span className="drop-hint" style={{ fontSize: '0.65rem', color: '#94a3b8', textAlign: 'center', lineHeight: '1.2' }}>
                          Arrastra o pega<br />aquí
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {isNew && (
              <div style={{ padding: '20px', background: '#fef3c7', borderRadius: '12px', color: '#92400e', fontSize: '0.85rem', fontWeight: 600, width: '100%' }}>
                💡 Guarda el animal de granja primero para poder añadir fotos.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SECCIÓN 2: ALIMENTACIÓN */}
      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', marginBottom: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <div onClick={() => setIsAlimentacionExpanded(!isAlimentacionExpanded)} style={{ padding: '16px 24px', background: isAlimentacionExpanded ? 'transparent' : '#f8fafc', borderBottom: isAlimentacionExpanded ? '1px solid #e2e8f0' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', transition: 'background 0.2s' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h2 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🥕 Alimentación
            </h2>
            {!isAlimentacionExpanded && (
              <div style={{ display: 'flex', gap: '12px', fontSize: '0.85rem' }}>
                <span style={{ background: '#dcfce7', color: '#166534', padding: '4px 10px', borderRadius: '20px', fontWeight: 600 }}>🟢 {alimentacion.filter(a => a.especiesanimalesesapto === 1).length} Permitidos</span>
                <span style={{ background: '#fef3c7', color: '#b45309', padding: '4px 10px', borderRadius: '20px', fontWeight: 600 }}>🟡 {alimentacion.filter(a => a.especiesanimalesesapto === 2).length} Con Moderación</span>
                <span style={{ background: '#fee2e2', color: '#991b1b', padding: '4px 10px', borderRadius: '20px', fontWeight: 600 }}>🔴 {alimentacion.filter(a => a.especiesanimalesesapto === 0).length} Tóxicos</span>
              </div>
            )}
          </div>
          <div style={{ color: '#64748b', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
            {isAlimentacionExpanded ? 'Ocultar detalle' : 'Mostrar detalle'}
            <span style={{ transform: isAlimentacionExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s', display: 'inline-block' }}>🔽</span>
          </div>
        </div>

        <div style={{ display: isAlimentacionExpanded ? 'block' : 'none', padding: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '20px' }}>
            {/* Columna Permitidos */}
            <div style={{ background: '#f0fdf4', borderRadius: '12px', padding: '20px', border: '1px solid #bbf7d0' }}>
              <h3 style={{ margin: '0 0 16px 0', color: '#166534', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>🟢 Alimentos Permitidos</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {alimentacion.filter(a => a.especiesanimalesesapto === 1).length === 0 ? (
                  <p style={{ color: '#15803d', fontSize: '0.9rem', margin: 0, fontStyle: 'italic' }}>No hay alimentos permitidos registrados.</p>
                ) : (
                  alimentacion.filter(a => a.especiesanimalesesapto === 1).map(item => (
                    <div key={item.idespeciesanimales} style={{ background: 'white', padding: '12px', borderRadius: '8px', border: '1px solid #dcfce7', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <div style={{ width: '80px', height: '80px', borderRadius: '10px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0fdf4', border: '1px solid #bbf7d0', overflow: 'hidden', cursor: item.primary_photo_ruta ? 'zoom-in' : 'default' }}
                        onClick={() => item.primary_photo_ruta && setLightboxPhoto({ url: getMediaUrl(item.primary_photo_ruta), nombre: item.especiesvegetalesnombre })}
                        title={item.primary_photo_ruta ? 'Ver foto completa' : ''}>
                        {item.primary_photo_ruta ? (
                          <img src={getMediaUrl(item.primary_photo_ruta)} alt={item.especiesvegetalesnombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <span style={{ fontSize: '2.2rem' }}>{item.especiesvegetalesicono || '🌿'}</span>
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <strong style={{ color: '#166534', fontSize: '1rem' }}>{item.especiesvegetalesnombre}</strong>
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#15803d', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {item.especiesanimalespartes && <span><strong>Partes:</strong> {item.especiesanimalesemoji || '🌱'} {item.especiesanimalespartes}</span>}
                          {item.especiesanimalesnotas && <span><strong>Notas:</strong> {item.especiesanimalesnotas}</span>}
                        </div>
                      </div>
                      <button onClick={() => router.push(`/dashboard/admin/especiesvegetales/${item.xespeciesvegetalesanimalesidespeciesvegetales}?from=animales&fromId=${params.id}&fromName=${encodeURIComponent(formData.especiesanimalesnombre || 'Especie animal')}&tab=alimentacion`)}
                        style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.2s', flexShrink: 0 }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#dcfce7'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = '#f0fdf4'; }}>
                        Abrir 🔗
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Columna Con Moderación */}
            <div style={{ background: '#fffbeb', borderRadius: '12px', padding: '20px', border: '1px solid #fde68a' }}>
              <h3 style={{ margin: '0 0 16px 0', color: '#92400e', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>🟡 Con Moderación</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {alimentacion.filter(a => a.especiesanimalesesapto === 2).length === 0 ? (
                  <p style={{ color: '#b45309', fontSize: '0.9rem', margin: 0, fontStyle: 'italic' }}>No hay alimentos con moderación registrados.</p>
                ) : (
                  alimentacion.filter(a => a.especiesanimalesesapto === 2).map(item => (
                    <div key={item.idespeciesanimales} style={{ background: 'white', padding: '12px', borderRadius: '8px', border: '1px solid #fde68a', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <div style={{ width: '80px', height: '80px', borderRadius: '10px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fffbeb', border: '1px solid #fde68a', overflow: 'hidden', cursor: item.primary_photo_ruta ? 'zoom-in' : 'default' }}
                        onClick={() => item.primary_photo_ruta && setLightboxPhoto({ url: getMediaUrl(item.primary_photo_ruta), nombre: item.especiesvegetalesnombre })}
                        title={item.primary_photo_ruta ? 'Ver foto completa' : ''}>
                        {item.primary_photo_ruta ? (
                          <img src={getMediaUrl(item.primary_photo_ruta)} alt={item.especiesvegetalesnombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <span style={{ fontSize: '2.2rem' }}>{item.especiesvegetalesicono || '🌿'}</span>
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <strong style={{ color: '#92400e', fontSize: '1rem' }}>{item.especiesvegetalesnombre}</strong>
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#b45309', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {item.especiesanimalespartes && <span><strong>Partes:</strong> {item.especiesanimalesemoji || '🌱'} {item.especiesanimalespartes}</span>}
                          {item.especiesanimalesnotas && <span><strong>Notas:</strong> {item.especiesanimalesnotas}</span>}
                        </div>
                      </div>
                      <button onClick={() => router.push(`/dashboard/admin/especiesvegetales/${item.xespeciesvegetalesanimalesidespeciesvegetales}?from=animales&fromId=${params.id}&fromName=${encodeURIComponent(formData.especiesanimalesnombre || 'Especie animal')}&tab=alimentacion`)}
                        style={{ background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.2s', flexShrink: 0 }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#fef3c7'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = '#fffbeb'; }}>
                        Abrir 🔗
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Columna No Permitidos */}
            <div style={{ background: '#fef2f2', borderRadius: '12px', padding: '20px', border: '1px solid #fecaca' }}>
              <h3 style={{ margin: '0 0 16px 0', color: '#991b1b', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>🔴 Alimentos NO Permitidos (Tóxicos)</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {alimentacion.filter(a => a.especiesanimalesesapto === 0).length === 0 ? (
                  <p style={{ color: '#b91c1c', fontSize: '0.9rem', margin: 0, fontStyle: 'italic' }}>No hay alimentos tóxicos registrados.</p>
                ) : (
                  alimentacion.filter(a => a.especiesanimalesesapto === 0).map(item => (
                    <div key={item.idespeciesanimales} style={{ background: 'white', padding: '12px', borderRadius: '8px', border: '1px solid #fee2e2', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <div style={{ width: '80px', height: '80px', borderRadius: '10px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fef2f2', border: '1px solid #fecaca', overflow: 'hidden', cursor: item.primary_photo_ruta ? 'zoom-in' : 'default' }}
                        onClick={() => item.primary_photo_ruta && setLightboxPhoto({ url: getMediaUrl(item.primary_photo_ruta), nombre: item.especiesvegetalesnombre })}
                        title={item.primary_photo_ruta ? 'Ver foto completa' : ''}>
                        {item.primary_photo_ruta ? (
                          <img src={getMediaUrl(item.primary_photo_ruta)} alt={item.especiesvegetalesnombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <span style={{ fontSize: '2.2rem' }}>{item.especiesvegetalesicono || '🌿'}</span>
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <strong style={{ color: '#991b1b', fontSize: '1rem' }}>{item.especiesvegetalesnombre}</strong>
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#b91c1c', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {item.especiesanimalespartes && <span><strong>Partes tóxicas:</strong> {item.especiesanimalesemoji || '🌱'} {item.especiesanimalespartes}</span>}
                          {item.especiesanimalesnotas && <span><strong>Notas:</strong> {item.especiesanimalesnotas}</span>}
                        </div>
                      </div>
                      <button onClick={() => router.push(`/dashboard/admin/especiesvegetales/${item.xespeciesvegetalesanimalesidespeciesvegetales}?from=animales&fromId=${params.id}&fromName=${encodeURIComponent(formData.especiesanimalesnombre || 'Especie animal')}&tab=alimentacion`)}
                        style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.2s', flexShrink: 0 }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#fee2e2'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = '#fef2f2'; }}>
                        Abrir 🔗
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
