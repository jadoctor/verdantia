'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { auth, storage } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { Blurhash } from 'react-blurhash';
import { getMediaUrl } from '@/lib/media-url';
import '@/components/admin/EspecieForm.css';

const STYLE_FILTERS: Record<string, string> = {
  vintage: 'sepia(40%) contrast(110%) saturate(120%) brightness(95%) hue-rotate(-5deg)',
  cinematic: 'contrast(120%) saturate(110%) brightness(90%) sepia(20%) hue-rotate(180deg) hue-rotate(-180deg)',
  vibrant: 'saturate(150%) contrast(105%) brightness(105%)',
  bnw: 'grayscale(100%) contrast(120%) brightness(105%)',
  fade: 'contrast(85%) brightness(110%) saturate(80%) sepia(10%)',
  none: 'none'
};

export default function ContenedorForm({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const isNew = resolvedParams.id === 'nueva' || resolvedParams.id === 'nuevo';
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('datos');
  const [photos, setPhotos] = useState<any[]>([]);
  const [heroIndex, setHeroIndex] = useState(0);
  const [draggedHeroPhotoId, setDraggedHeroPhotoId] = useState<number | null>(null);
  const [draggedOverHeroPhotoId, setDraggedOverHeroPhotoId] = useState<number | null>(null);
  const [draggedPhotoIndex, setDraggedPhotoIndex] = useState<number | null>(null);
  const [draggedOverPhotoIndex, setDraggedOverPhotoIndex] = useState<number | null>(null);
  const [dragOverPhotos, setDragOverPhotos] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  
  const [formData, setFormData] = useState({
    contenedoresnombre: '',
    contenedorestipo: 'bandeja_alveolos',
    contenedoresclasificacion: 'ambos',
    contenedorescantidadalveolos: 1,
    contenedoresvolumenalveolocc: 0,
    contenedoresvolumentotallitros: 0,
    contenedoresprofundidadalveolocm: 0,
    contenedoresdimensiones: '',
    contenedoresformaalveolo: '',
    contenedoresantiespiralizacion: 0,
    contenedoresmaterial: '',
    contenedoresreutilizable: 1,
    contenedoresobservaciones: '',
    contenedoresactivo: 1
  });
  const [initialData, setInitialData] = useState(formData);

  const isFormDirty = JSON.stringify(formData) !== JSON.stringify(initialData);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'no-changes'>('idle');
  const [loading, setLoading] = useState(!isNew);

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

  // AI State Variables
  const [showAiImageModal, setShowAiImageModal] = useState(false);
  const [aiImageLoading, setAiImageLoading] = useState(false);
  const [aiImageResult, setAiImageResult] = useState<string | null>(null);
  const [aiImageConcept, setAiImageConcept] = useState('');
  const [aiImageDescription, setAiImageDescription] = useState('');
  const [aiImagePromptPreview, setAiImagePromptPreview] = useState('');
  const [aiImagePromptEdited, setAiImagePromptEdited] = useState(false);
  const [showPromptDetails, setShowPromptDetails] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.email) {
        setUserEmail(user.email);
      } else {
        setUserEmail(null);
        if (!isNew) setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [isNew]);

  useEffect(() => {
    if (!isNew && userEmail) {
      fetch(`/api/admin/contenedores/${resolvedParams.id}`, {
        headers: { 'x-user-email': userEmail }
      })
        .then(r => r.json())
        .then(d => {
          if (d.contenedor) {
            setFormData(d.contenedor);
            setInitialData(d.contenedor);
          }
          setLoading(false);
        })
        .catch(e => {
          console.error(e);
          setLoading(false);
        });

      fetch(`/api/admin/contenedores/${resolvedParams.id}/photos`, {
        headers: { 'x-user-email': userEmail }
      })
        .then(r => r.json())
        .then(d => setPhotos(d.photos || []))
        .catch(e => console.error(e));
    }
  }, [resolvedParams.id, isNew, userEmail]);

  const loadAttachments = async (id: string) => {
    if (!userEmail) return;
    try {
      const pRes = await fetch(`/api/admin/contenedores/${id}/photos`, { headers: { 'x-user-email': userEmail } });
      const pData = await pRes.json();
      setPhotos(pData.photos || []);
    } catch (e) {}
  };

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (checked ? 1 : 0) : value
    }));
  };

  const toggleClasificacion = (tipo: 'semillero' | 'maceta') => {
    let current = formData.contenedoresclasificacion;
    const hasSemillero = current === 'ambos' || current === 'semillero';
    const hasMaceta = current === 'ambos' || current === 'maceta';
    
    let newHasSemillero = hasSemillero;
    let newHasMaceta = hasMaceta;

    if (tipo === 'semillero') newHasSemillero = !newHasSemillero;
    if (tipo === 'maceta') newHasMaceta = !newHasMaceta;

    let newVal = 'ninguno';
    if (newHasSemillero && newHasMaceta) newVal = 'ambos';
    else if (newHasSemillero) newVal = 'semillero';
    else if (newHasMaceta) newVal = 'maceta';

    setFormData(prev => ({ ...prev, contenedoresclasificacion: newVal }));
  };

  // Autoguardado automático
  useEffect(() => {
    if (!isNew && isFormDirty && saveStatus !== 'saving' && saveStatus !== 'no-changes') {
      const timer = setTimeout(() => {
        handleSubmit();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [formData, isNew, isFormDirty, saveStatus]);

  const handleSubmit = async (e?: any) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!userEmail) return alert('No autenticado');
    if (!isNew && !isFormDirty) {
      setSaveStatus('no-changes');
      setTimeout(() => setSaveStatus('idle'), 2000);
      return;
    }
    
    setSaveStatus('saving');
    
    const url = isNew ? '/api/admin/contenedores' : `/api/admin/contenedores/${resolvedParams.id}`;
    const method = isNew ? 'POST' : 'PUT';
    
    const res = await fetch(url, {
      method,
      headers: { 
        'Content-Type': 'application/json',
        'x-user-email': userEmail 
      },
      body: JSON.stringify(formData)
    });
    
    if (res.ok) {
      if (isNew) {
        router.push('/dashboard/admin/tareas/contenedores');
      } else {
        setInitialData(formData);
        setSaveStatus('idle');
      }
    } else {
      alert('Error guardando el contenedor');
      setSaveStatus('idle');
    }
  };

  const buildPromptPreview = () => {
    const nombre = formData.contenedoresnombre || 'contenedor';
    const defaultConcept = `fotografía hiperrealista de ${nombre} sobre una mesa rústica de madera en un vivero luminoso`;
    return `Fotografía profesional de stock de alta resolución (8K), tomada con una cámara DSLR Canon EOS R5 y un objetivo macro 100mm f/2.8, iluminación natural suave de hora dorada.\nSujeto principal: Contenedor agrícola/bandeja forestal tipo: ${nombre}.\nEscena concreta: ${aiImageConcept || defaultConcept}.\nComposición: regla de los tercios, sujeto nítido en primer plano, fondo suavemente desenfocado (bokeh) mostrando vegetación de vivero.\nREGLAS ESTRICTAS:\n1. El sujeto es SIEMPRE un recipiente para cultivo (maceta, bandeja, semillero).\n2. La fotografía debe parecer tomada por un fotógrafo profesional de agricultura.\n3. El entorno debe ser un vivero o invernadero.\n4. NO incluir personas, texto, logotipos ni marcas de agua.\n5. Mostrar el contenedor limpio y listo para usar o recién sembrado.`;
  };

  const generateAiImage = async () => {
    if (!formData.contenedoresnombre) {
      alert('Se necesita el nombre descriptivo del contenedor para generar la imagen.');
      return;
    }
    setAiImageLoading(true);
    setAiImageResult(null);
    setAiImageDescription('');
    try {
      const body: any = {
        especieNombre: formData.contenedoresnombre, // Usando endpoint genérico de AI
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
    }
  };

  const uploadAiImage = async () => {
    if (!aiImageResult || !resolvedParams.id) return;
    setUploadingPhotos(true);
    setShowAiImageModal(false);
    try {
      const res = await fetch(aiImageResult);
      const blob = await res.blob();
      const descBase = aiImageDescription || formData.contenedoresnombre || 'contenedor';

      const storageApi = await import('firebase/storage');
      const tempFileName = `temp-ai-${Date.now()}-${descBase.replace(/[^a-zA-Z0-9.-]/g, '')}.webp`;
      const tempPath = `uploads/temp/${tempFileName}`;
      const storageRef = storageApi.ref(storage, tempPath);
      await storageApi.uploadBytes(storageRef, blob);

      const saveRes = await fetch(`/api/admin/contenedores/${resolvedParams.id}/photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail || '' },
        body: JSON.stringify({
          rawStoragePath: tempPath,
          especieNombre: formData.contenedoresnombre || 'contenedor'
        })
      });
      if (!saveRes.ok) {
        const errData = await saveRes.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP Error ${saveRes.status}`);
      }
      await loadAttachments(resolvedParams.id);
      setAiImageResult(null);
      setAiImageConcept('');
      setAiImageDescription('');
      setAiImagePromptPreview('');
      setAiImagePromptEdited(false);
    } catch (error: any) {
      console.error('Error uploading AI image:', error);
      alert('Error al guardar la imagen generada: ' + error.message);
    } finally {
      setUploadingPhotos(false);
    }
  };

  const hasChanges = JSON.stringify(formData) !== JSON.stringify(initialData);

  const sortedPhotos = [...photos].sort((a, b) => (b.esPrincipal ? 1 : 0) - (a.esPrincipal ? 1 : 0));
  const safeHeroIndex = Math.min(heroIndex, Math.max(0, sortedPhotos.length - 1));
  const heroPhoto = sortedPhotos[safeHeroIndex] || null;
  let vibrantColor: string | null = null;
  let heroMeta: any = {};
  if (heroPhoto) {
    try { heroMeta = JSON.parse(heroPhoto.resumen || '{}'); } catch (e) { }
    vibrantColor = heroMeta.vibrant_color || null;
  }

  const STYLE_FILTERS: Record<string, string> = {
    '': 'none',
    comic: 'contrast(1.45) saturate(1.55) brightness(1.08)',
    manga: 'grayscale(1) contrast(1.85) brightness(1.1)',
    watercolor: 'saturate(1.35) contrast(0.88) brightness(1.14)',
    sketch: 'grayscale(1) contrast(2.2) brightness(1.18)',
    pop: 'saturate(1.95) contrast(1.3) brightness(1.06)',
    vintage: 'sepia(0.65) contrast(1.08) saturate(0.78) brightness(1.03)',
    cinematic: 'contrast(1.22) saturate(0.72) hue-rotate(338deg) brightness(0.98)',
    hdr: 'contrast(1.35) saturate(1.3) brightness(1.07)'
  };

  const handleSetPrimaryPhoto = async (photoId: number) => {
    try {
      const res = await fetch(`/api/admin/contenedores/${resolvedParams.id}/photos`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail || '' },
        body: JSON.stringify({ photoId, action: 'setPrimary' })
      });
      if (res.ok) {
        const newPhotos = photos.map(p => ({ ...p, esPrincipal: p.id === photoId ? 1 : 0 }));
        setPhotos(newPhotos);
      }
    } catch (e) {
      console.error('Error al establecer principal', e);
    }
  };

  const openPhotoEditor = (photo: any) => {
    const res = photo.resumen ? (typeof photo.resumen === 'string' ? JSON.parse(photo.resumen) : photo.resumen) : {};
    setEditingPhoto(photo);
    setEditorX(res.profile_object_x ?? 50);
    setEditorY(res.profile_object_y ?? 50);
    setEditorZoom(res.profile_object_zoom ?? 100);
    setEditorBrightness(res.profile_brightness ?? 100);
    setEditorContrast(res.profile_contrast ?? 100);
    setEditorStyle(res.profile_style ?? '');
    setEditorSeoAlt(res.seo_alt ?? '');
    
    const stateStr = JSON.stringify({
      x: res.profile_object_x ?? 50,
      y: res.profile_object_y ?? 50,
      z: res.profile_object_zoom ?? 100,
      b: res.profile_brightness ?? 100,
      c: res.profile_contrast ?? 100,
      s: res.profile_style ?? '',
      seo: res.seo_alt ?? ''
    });
    setEditorInitialState(stateStr);
    setPhotoEditorSaveStatus('idle');
  };

  const savePhotoEditor = async () => {
    const currentState = JSON.stringify({
      x: editorX, y: editorY, z: editorZoom, b: editorBrightness, c: editorContrast, s: editorStyle, seo: editorSeoAlt
    });
    if (currentState === editorInitialState) {
      setPhotoEditorSaveStatus('no-changes');
      setTimeout(() => setEditingPhoto(null), 800);
      return;
    }

    setPhotoEditorSaveStatus('saving');
    try {
      const res = editingPhoto.resumen ? (typeof editingPhoto.resumen === 'string' ? JSON.parse(editingPhoto.resumen) : editingPhoto.resumen) : {};
      const updatedResumen = {
        ...res,
        profile_object_x: editorX,
        profile_object_y: editorY,
        profile_object_zoom: editorZoom,
        profile_brightness: editorBrightness,
        profile_contrast: editorContrast,
        profile_style: editorStyle,
        seo_alt: editorSeoAlt
      };

      await fetch(`/api/admin/contenedores/${resolvedParams.id}/photos`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail || '' },
        body: JSON.stringify({ photoId: editingPhoto.id, action: 'updateMeta', resumen: JSON.stringify(updatedResumen) })
      });
      await loadAttachments(resolvedParams.id);
      setEditingPhoto(null);
    } catch (e) {
      console.error(e);
      alert('Error guardando cambios');
    } finally {
      setPhotoEditorSaveStatus('idle');
    }
  };

  const handleReorderPhotos = async (newPhotos: any[]) => {
    setPhotos(newPhotos);
    if (!userEmail) return;
    try {
      // Reutilizamos si hay un endpoint de reorder o simplemente en frontend por ahora.
      // Especies tiene `/photos/reorder`, si Contenedores no lo tiene, es un update optimista local
      // y si queremos persistirlo debemos añadir la API, pero de momento UI optimistic.
    } catch (e) {
      console.error('Error reordering', e);
    }
  };

  const handleDeleteFile = async (id: number) => {
    if (!confirm('¿Seguro que deseas eliminar esta foto?')) return;
    try {
      const res = await fetch(`/api/admin/contenedores/${resolvedParams.id}/photos?photoId=${id}`, {
        method: 'DELETE',
        headers: { 'x-user-email': userEmail || '' }
      });
      if (res.ok) {
        setPhotos(prev => prev.filter(p => p.id !== id));
      }
    } catch (e) {}
  };

  const handleFileUpload = async (e: any) => {
    if (!userEmail || !resolvedParams.id) return;
    const files = Array.from(e.target.files) as File[];
    if (!files.length) return;

    setUploadingPhotos(true);
    try {
      const storageApi = await import('firebase/storage');
      
      for (const file of files) {
        const tempFileName = `temp-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`;
        const tempPath = `uploads/temp/${tempFileName}`;
        const storageRef = storageApi.ref(storage, tempPath);
        
        await storageApi.uploadBytes(storageRef, file);

        await fetch(`/api/admin/contenedores/${resolvedParams.id}/photos`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-email': userEmail
          },
          body: JSON.stringify({
            rawStoragePath: tempPath,
            contenedorNombre: formData.contenedoresnombre
          })
        });
      }
      
      await loadAttachments(resolvedParams.id);
    } catch (error) {
      console.error('Upload error', error);
      alert('Error subiendo fotos');
    } finally {
      setUploadingPhotos(false);
      setDragOverPhotos(false);
      if (e.target.value) e.target.value = '';
    }
  };
  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Cargando datos...</div>;

  return (
    <div style={{ padding: '20px', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
      <button onClick={() => router.push('/dashboard/admin/tareas/contenedores')} className="btn-back" style={{ marginBottom: '20px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
        <span>←</span> Volver al catálogo
      </button>

      {/* ── Subheader Integrado ── */}
      <div style={{ background: 'linear-gradient(135deg, #0f766e, #10b981)', borderRadius: '16px', padding: '24px 28px', marginBottom: '24px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '12px' }}>
            {formData.contenedoresnombre || 'Nuevo Contenedor'}
            {isFormDirty && <span style={{ background: '#fef08a', color: '#854d0e', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold' }}>Cambios sin guardar</span>}
          </h1>
          <p style={{ margin: '4px 0 0', opacity: 0.9, fontSize: '1rem', fontStyle: 'italic' }}>
            {isNew ? 'Añadir al catálogo global' : `ID: ${resolvedParams.id} | Tipo: ${formData.contenedorestipo.replace('_', ' ')}`}
          </p>
        </div>
        <div>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, contenedoresactivo: formData.contenedoresactivo ? 0 : 1 })}
            style={{
              background: formData.contenedoresactivo ? '#dcfce7' : '#fee2e2',
              border: `1px solid ${formData.contenedoresactivo ? '#22c55e' : '#ef4444'}`,
              color: formData.contenedoresactivo ? '#166534' : '#b91c1c',
              padding: '8px 16px',
              borderRadius: '20px',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
          >
            <div style={{
              width: '10px', height: '10px', borderRadius: '50%',
              background: formData.contenedoresactivo ? '#22c55e' : '#ef4444',
              boxShadow: `0 0 8px ${formData.contenedoresactivo ? '#22c55e' : '#ef4444'}`
            }}></div>
            {formData.contenedoresactivo ? 'Visible en Catálogo' : 'Oculto (Borrador)'}
          </button>
        </div>
      </div>

      {/* ── Hero Gallery Header ── */}
      <div style={{
        marginBottom: '24px',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        background: vibrantColor ? `linear-gradient(135deg, #f8fafc 0%, ${vibrantColor}18 60%, ${vibrantColor}30 100%)` : '#f8fafc',
        transition: 'background 0.6s ease',
        overflow: 'hidden'
      }}>
        {photos.length > 0 ? (
          <div style={{ display: 'flex', gap: 0 }}>
            {/* Foto Principal Hero */}
            <div
              style={{
                position: 'relative', flexShrink: 0, width: '180px', height: '220px', overflow: 'hidden',
                border: draggedOverHeroPhotoId === -1 ? '4px dashed #10b981' : 'none',
                opacity: draggedOverHeroPhotoId === -1 ? 0.8 : 1,
                transition: 'all 0.2s ease'
              }}
            >
              {heroPhoto && (
                <img 
                  key={heroPhoto.id} 
                  src={getMediaUrl(heroPhoto.ruta)}
                  alt={heroMeta.seo_alt || formData.contenedoresnombre}
                  style={{
                    width: '100%', height: '100%', objectFit: 'cover',
                    objectPosition: `${heroMeta.profile_object_x ?? 50}% ${heroMeta.profile_object_y ?? 50}%`,
                    transformOrigin: `${heroMeta.profile_object_x ?? 50}% ${heroMeta.profile_object_y ?? 50}%`,
                    transform: `scale(${(heroMeta.profile_object_zoom ?? 100) / 100})`,
                    transition: 'opacity 0.3s ease'
                  }}
                  crossOrigin="anonymous" 
                />
              )}
            </div>

            {/* Tira de miniaturas derecha */}
            {sortedPhotos.filter((_, i) => i !== safeHeroIndex).length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '8px 6px', justifyContent: 'center', height: '220px', overflowY: 'auto' }}>
                {sortedPhotos
                  .map((p, i) => ({ p, i }))
                  .filter(({ i }) => i !== safeHeroIndex)
                  .map(({ p }) => {
                    let tMeta: any = {};
                    try { tMeta = JSON.parse(p.resumen || '{}'); } catch (e) { }
                    return (
                      <div key={p.id}
                        onClick={() => { handleSetPrimaryPhoto(p.id); setHeroIndex(0); }}
                        style={{
                          width: '60px', height: '60px', borderRadius: '8px', overflow: 'hidden', cursor: 'pointer', flexShrink: 0,
                          border: '2px solid rgba(0,0,0,0.08)',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <img src={getMediaUrl(p.ruta)}
                          alt=""
                          style={{
                            width: '100%', height: '100%', objectFit: 'cover',
                            objectPosition: `${tMeta.profile_object_x ?? 50}% ${tMeta.profile_object_y ?? 50}%`,
                            transformOrigin: `${tMeta.profile_object_x ?? 50}% ${tMeta.profile_object_y ?? 50}%`,
                            transform: `scale(${(tMeta.profile_object_zoom ?? 100) / 100})`
                          }} crossOrigin="anonymous" />
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        ) : (
          <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '2.5rem' }}>📦</span>
            <h2 style={{ margin: 0, color: '#1e293b' }}>Sin fotos en la galería</h2>
          </div>
        )}
      </div>

      <div className="especie-form-container">

        
        <div className="especie-form-body">
          {/* Pestañas (Tabs) */}
          <div className="form-tabs">
            <button className={activeTab === 'datos' ? 'active' : ''} onClick={(e) => { e.preventDefault(); setActiveTab('datos'); }}>
              📋 Datos Generales
            </button>
            <button className={activeTab === 'fotos' ? 'active' : ''} onClick={(e) => { e.preventDefault(); setActiveTab('fotos'); }} disabled={isNew} style={{ opacity: isNew ? 0.5 : 1, cursor: isNew ? 'not-allowed' : 'pointer' }}>
              📎 Fotos ({photos.length}/4) {isNew && '(Guarda primero)'}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="form-tab-content">
            
            <div style={{ display: activeTab === 'datos' ? 'flex' : 'none', flexDirection: 'column', gap: '20px' }}>
              
              <div className="grid-form" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#334155' }}>Nombre Descriptivo *</label>
            <input required type="text" name="contenedoresnombre" value={formData.contenedoresnombre} onChange={handleChange} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }} placeholder="Ej: Bandeja Forestal 40" />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#334155' }}>Tipo de Contenedor</label>
            <select name="contenedorestipo" value={formData.contenedorestipo} onChange={handleChange} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff' }}>
              <option value="bandeja_alveolos">Bandeja de Alvéolos</option>
              <option value="bandeja_plana">Bandeja Plana</option>
              <option value="pastilla_turba">Pastilla Turba / Coco (Jiffy)</option>
              <option value="biodegradable">Macetita Biodegradable</option>
              <option value="maceta_individual">Maceta Pequeña (Repicado)</option>
              <option value="maceta_mediana">Maceta Mediana (Hasta 15L)</option>
              <option value="maceta_grande">Maceta Grande (&gt;15L)</option>
              <option value="jardinera">Jardinera</option>
              <option value="mesa_cultivo">Mesa de Cultivo</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#334155' }}>Clasificación de Uso</label>
            <div style={{ display: 'flex', gap: '20px', padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#166534', fontWeight: 500 }}>
                <input 
                  type="checkbox" 
                  checked={formData.contenedoresclasificacion === 'ambos' || formData.contenedoresclasificacion === 'semillero'} 
                  onChange={() => toggleClasificacion('semillero')} 
                  style={{ width: '20px', height: '20px', accentColor: '#22c55e' }} 
                />
                <span>🌱 Semillero</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#0f766e', fontWeight: 500 }}>
                <input 
                  type="checkbox" 
                  checked={formData.contenedoresclasificacion === 'ambos' || formData.contenedoresclasificacion === 'maceta'} 
                  onChange={() => toggleClasificacion('maceta')} 
                  style={{ width: '20px', height: '20px', accentColor: '#0d9488' }} 
                />
                <span>🪴 Maceta</span>
              </label>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#0f766e', fontSize: '0.9rem' }}>Nº Alvéolos</label>
            <input type="number" name="contenedorescantidadalveolos" value={formData.contenedorescantidadalveolos} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #99f6e4' }} min="1" />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#b45309', fontSize: '0.9rem' }}>Profundidad (cm)</label>
            <input type="number" step="0.1" name="contenedoresprofundidadalveolocm" value={formData.contenedoresprofundidadalveolocm} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #fcd34d' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#0369a1', fontSize: '0.9rem' }}>Vol. x Alvéolo (cc)</label>
            <input type="number" name="contenedoresvolumenalveolocc" value={formData.contenedoresvolumenalveolocc} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #bae6fd' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#6d28d9', fontSize: '0.9rem' }}>Sustrato Total (L)</label>
            <input type="number" step="0.1" name="contenedoresvolumentotallitros" value={formData.contenedoresvolumentotallitros} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd6fe' }} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#334155' }}>Dimensiones Totales</label>
            <input type="text" name="contenedoresdimensiones" placeholder="Largo x Ancho x Alto (ej: 60x40x15 cm)" value={formData.contenedoresdimensiones} onChange={handleChange} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#334155' }}>Forma del Alvéolo</label>
            <input type="text" name="contenedoresformaalveolo" placeholder="Ej: Troncopiramidal, Cilíndrico..." value={formData.contenedoresformaalveolo} onChange={handleChange} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '24px', background: '#fffbeb', padding: '16px', borderRadius: '8px', border: '1px solid #fde68a' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: '#92400e', fontWeight: 500 }}>
            <input type="checkbox" name="contenedoresantiespiralizacion" checked={formData.contenedoresantiespiralizacion === 1} onChange={handleChange} style={{ width: '22px', height: '22px', accentColor: '#d97706' }} />
            <span>Tiene estrías antiespiralización (uso forestal/frutal)</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: '#166534', fontWeight: 500 }}>
            <input type="checkbox" name="contenedoresreutilizable" checked={formData.contenedoresreutilizable === 1} onChange={handleChange} style={{ width: '22px', height: '22px', accentColor: '#22c55e' }} />
            <span>Es lavable y reutilizable</span>
          </label>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#334155' }}>Material de Fabricación</label>
          <input type="text" name="contenedoresmaterial" placeholder="Ej: Plástico termoformado, Turba prensada, Fibra de coco..." value={formData.contenedoresmaterial} onChange={handleChange} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
        </div>

            </div>

            <div style={{ display: activeTab === 'fotos' ? 'block' : 'none' }}>
              {isNew ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                  Debes guardar el contenedor por primera vez para poder adjuntar fotos.
                </div>
              ) : (
                <div>
                  <h3 style={{ marginTop: 0, color: '#334155' }}>Galería de Imágenes</h3>
                  <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '20px' }}>Aquí puedes subir fotos del contenedor real. Máximo 4 fotos.</p>
                  <div className="grid-form">
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
                          const isLocked = index >= 4;
                          let meta: any = {};
                          try { meta = JSON.parse(p.resumen || '{}'); } catch (e) { }

                          let baseFilter = isLocked ? 'grayscale(100%) blur(2px)' : (meta.profile_style ? STYLE_FILTERS[meta.profile_style] : 'none');
                          if (!isLocked && (meta.profile_brightness !== undefined || meta.profile_contrast !== undefined)) {
                            baseFilter = `brightness(${meta.profile_brightness ?? 100}%) contrast(${meta.profile_contrast ?? 100}%) ${meta.profile_style ? STYLE_FILTERS[meta.profile_style] : ''}`.trim();
                          }

                          const imgStyle: any = {
                            filter: baseFilter,
                            objectFit: 'cover',
                            objectPosition: `${meta.profile_object_x ?? 50}% ${meta.profile_object_y ?? 50}%`,
                            transformOrigin: `${meta.profile_object_x ?? 50}% ${meta.profile_object_y ?? 50}%`,
                            transform: `scale(${(meta.profile_object_zoom ?? 100) / 100})`
                          };

                          const isDragging = draggedPhotoIndex === index;
                          const isDragOver = draggedOverPhotoIndex === index;

                          return (
                            <div
                              key={p.id}
                              className={`gallery-item ${p.esPrincipal ? 'is-preferred' : ''}`}
                              style={{
                                opacity: isDragging ? 0.5 : 1,
                                border: isDragOver ? '2px dashed #10b981' : undefined,
                                transform: isDragOver ? 'scale(1.02)' : 'none',
                                transition: 'all 0.2s ease',
                                cursor: 'grab',
                                backgroundColor: meta.dominant_color || '#f1f5f9',
                                position: 'relative',
                                overflow: 'hidden'
                              }}
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
                              {meta.blurhash && (
                                <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
                                  <Blurhash hash={meta.blurhash} width="100%" height="100%" resolutionX={32} resolutionY={32} punch={1} />
                                </div>
                              )}
                              <img
                                src={getMediaUrl(p.ruta)}
                                alt={meta.seo_alt || 'foto contenedor'}
                                loading="lazy"
                                style={{ ...imgStyle, position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }}
                                draggable={false}
                                crossOrigin="anonymous" />
                              {meta.exif_data && (
                                <div style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.6)', color: 'white', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', cursor: 'help', zIndex: 10 }} title={`Cámara: ${meta.exif_data.make || ''} ${meta.exif_data.model || ''}\nFecha: ${meta.exif_data.date ? new Date(meta.exif_data.date).toLocaleDateString() : 'Desconocida'}`}>
                                  ℹ️
                                </div>
                              )}
                              {isLocked && (
                                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.8)', zIndex: 10, background: 'rgba(0,0,0,0.4)' }}>
                                  <span style={{ fontSize: '1.5rem', marginBottom: '4px' }}>🔒</span>
                                  <small style={{ fontWeight: 'bold', textAlign: 'center', fontSize: '0.65rem' }}>Excede límite</small>
                                </div>
                              )}
                              <div className="photo-actions" style={{ zIndex: 20 }}>
                                <button
                                  type="button"
                                  className={`photo-action-btn btn-photo-primary ${p.esPrincipal ? 'is-active' : ''}`}
                                  onClick={() => handleSetPrimaryPhoto(p.id)}
                                  title={p.esPrincipal ? 'Foto preferida actual' : 'Marcar como foto preferida'}
                                >{p.esPrincipal ? '★' : '☆'}</button>
                                <button
                                  type="button"
                                  className="photo-action-btn btn-photo-edit"
                                  onClick={() => openPhotoEditor(p)}
                                  title="Editar foto"
                                >✏️</button>
                                <button type="button" className="photo-action-btn btn-photo-delete" onClick={() => handleDeleteFile(p.id)} title="Eliminar">✕</button>
                              </div>
                            </div>
                          );
                        })}

                        {photos.length >= 4 ? null : (
                          <div
                            className={`custom-file-upload drop-zone inline-drop-zone ${dragOverPhotos ? 'drag-over' : ''}`}
                            onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setDragOverPhotos(true); }}
                            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragOverPhotos(true); }}
                            onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDragOverPhotos(false); }}
                            onDrop={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setDragOverPhotos(false);
                              if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                                handleFileUpload({ target: { files: e.dataTransfer.files } });
                              }
                            }}
                          >
                            <input type="file" id="upload-photos" multiple accept="image/*" onChange={handleFileUpload} disabled={uploadingPhotos} />
                            <input type="file" id="upload-camera" accept="image/*" capture="environment" onChange={handleFileUpload} style={{ display: 'none' }} disabled={uploadingPhotos} />

                            {uploadingPhotos ? (
                              <div className="drop-zone-content">
                                <span style={{ fontSize: '1.5rem', animation: 'spin 2s linear infinite', display: 'inline-block' }}>⏳</span>
                                <span style={{ color: '#10b981', fontWeight: 'bold', fontSize: '0.75rem', textAlign: 'center' }}>Procesando...</span>
                                <span className="drop-hint" style={{ color: '#059669', fontSize: '0.65rem' }}>Subiendo a Firebase</span>
                              </div>
                            ) : (
                              <div className="drop-zone-content">
                                <div className="drop-zone-buttons" style={{ flexDirection: 'column' }}>
                                  <label htmlFor="upload-photos" className="btn-upload primary" style={{ padding: '8px', fontSize: '0.8rem' }}>
                                    <span className="icon" style={{ fontSize: '1.2rem', marginBottom: '4px', display: 'block' }}>📁</span> Galería
                                  </label>
                                  <label htmlFor="upload-camera" className="btn-upload secondary mobile-only" style={{ padding: '8px', fontSize: '0.8rem' }}>
                                    <span className="icon" style={{ fontSize: '1.2rem', marginBottom: '4px', display: 'block' }}>📷</span> Cámara
                                  </label>
                                  <button type="button" onClick={() => setShowAiImageModal(true)} className="btn-upload" style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', color: 'white', border: 'none', padding: '8px', fontSize: '0.8rem' }}>
                                    <span className="icon" style={{ fontSize: '1.2rem', marginBottom: '4px', display: 'block' }}>✨</span> Generar IA
                                  </button>
                                </div>
                                <span className="drop-hint" style={{ fontSize: '0.7rem', textAlign: 'center', marginTop: '4px' }}>arrastra y suelta<br />aquí</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Botón flotante Sticky Estándar Gold */}
            <div style={{
              position: 'fixed',
              bottom: '30px',
              right: '30px',
              zIndex: 1000,
              display: 'flex',
              gap: '12px'
            }}>
              <button 
                type="submit" 
                disabled={saveStatus === 'saving'}
                style={{ 
                  background: saveStatus === 'no-changes' ? '#10b981' : (isFormDirty ? '#f59e0b' : '#1e293b'), 
                  color: 'white', 
                  padding: '16px 32px', 
                  borderRadius: '30px', 
                  border: 'none', 
                  fontWeight: 'bold', 
                  fontSize: '1.1rem', 
                  cursor: saveStatus === 'saving' ? 'not-allowed' : 'pointer',
                  boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}
              >
                {saveStatus === 'saving' ? '⏳ Guardando...' : (saveStatus === 'no-changes' ? '✓ Sin cambios' : (isNew ? '💾 Crear Contenedor' : '💾 Guardar Cambios'))}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* AI Image Generator Modal */}
      {showAiImageModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.85)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', padding: '20px' }}>
          <div style={{ background: 'white', borderRadius: '20px', width: '100%', maxWidth: '600px', display: 'flex', flexDirection: 'column', maxHeight: '90vh', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', background: 'linear-gradient(to right, #f8fafc, #f1f5f9)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1.5rem' }}>✨</span> Generador de Imágenes IA
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748b' }}>Contenedor: <strong>{formData.contenedoresnombre || 'Sin nombre'}</strong></p>
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
                      onChange={e => { setAiImageConcept(e.target.value); if (!aiImagePromptEdited) setAiImagePromptPreview(buildPromptPreview()); }}
                      placeholder="Ej. Fotografía de bandeja forestal sobre mesa de invernadero..."
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
                        "Con tierra recién preparada para la siembra",
                        "Con pequeños brotes de lechuga recién germinados",
                        "Limpia y vacía lista para usar",
                        "Varias bandejas apiladas en un almacén rústico"
                      ].map(preset => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => { setAiImageConcept(preset); if (!aiImagePromptEdited) setAiImagePromptPreview(buildPromptPreview()); }}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '20px',
                            border: `1px solid ${aiImageConcept === preset ? '#8b5cf6' : '#e2e8f0'}`,
                            background: aiImageConcept === preset ? '#f3e8ff' : '#f8fafc',
                            color: aiImageConcept === preset ? '#6d28d9' : '#475569',
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

                  <button
                    type="button"
                    onClick={generateAiImage}
                    disabled={aiImageLoading}
                    style={{
                      padding: '14px',
                      borderRadius: '12px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '1.1rem',
                      cursor: aiImageLoading ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      gap: '10px',
                      opacity: aiImageLoading ? 0.7 : 1,
                      marginTop: '10px'
                    }}
                  >
                    {aiImageLoading ? (
                      <>
                        <span style={{ animation: 'spin 2s linear infinite' }}>⏳</span> Generando maravilla...
                      </>
                    ) : (
                      <>✨ Generar con IA</>
                    )}
                  </button>
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                  <div style={{ width: '100%', borderRadius: '12px', overflow: 'hidden', border: '2px solid #e2e8f0', background: '#f8fafc', position: 'relative' }}>
                    <img src={aiImageResult} alt="Generated AI Image" style={{ width: '100%', height: 'auto', display: 'block' }} />
                  </div>
                  {aiImageDescription && (
                    <div style={{ padding: '12px 16px', background: '#f1f5f9', borderRadius: '8px', fontSize: '0.9rem', color: '#334155', width: '100%', fontStyle: 'italic' }}>
                      "{aiImageDescription}"
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                    <button
                      type="button"
                      onClick={() => { setAiImageResult(null); setAiImageDescription(''); }}
                      disabled={uploadingPhotos}
                      style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '2px solid #cbd5e1', background: 'white', color: '#475569', fontWeight: 'bold', cursor: uploadingPhotos ? 'not-allowed' : 'pointer' }}
                    >
                      🔄 Descartar y probar otra
                    </button>
                    <button
                      type="button"
                      onClick={uploadAiImage}
                      disabled={uploadingPhotos}
                      style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: '#10b981', color: 'white', fontWeight: 'bold', cursor: uploadingPhotos ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                    >
                      {uploadingPhotos ? (
                        <>⏳ Subiendo a Galería...</>
                      ) : (
                        <>✅ Usar esta foto</>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Editor de Fotos Modal */}
      {editingPhoto && (
        <div className="photo-editor-overlay">
          <div className="photo-editor-modal">
            <div className="photo-editor-header">
              <h3>🎨 Editor de Foto</h3>
              <button onClick={() => setEditingPhoto(null)} className="close-editor">×</button>
            </div>
            
            <div className="photo-editor-layout">
              <div className="photo-preview-container">
                <div className="photo-preview-main">
                  <img 
                    src={getMediaUrl(editingPhoto.ruta)} 
                    alt="Editor Preview" 
                    crossOrigin="anonymous"
                    style={{
                      transform: `scale(${editorZoom/100}) translate(${(editorX-50)}%, ${(editorY-50)}%)`,
                      filter: `${STYLE_FILTERS[editorStyle || 'none']} brightness(${editorBrightness}%) contrast(${editorContrast}%)`
                    }}
                  />
                  <div className="preview-guide">CENTRO DEL OBJETO</div>
                </div>
                
                <div className="photo-preview-circular">
                  <div className="circular-inner">
                    <img 
                      src={getMediaUrl(editingPhoto.ruta)} 
                      alt="Circular Preview" 
                      crossOrigin="anonymous"
                      style={{
                        transform: `scale(${editorZoom/100}) translate(${(editorX-50)}%, ${(editorY-50)}%)`,
                        filter: `${STYLE_FILTERS[editorStyle || 'none']} brightness(${editorBrightness}%) contrast(${editorContrast}%)`
                      }}
                    />
                  </div>
                  <span className="circular-label">Vista Circular</span>
                </div>
              </div>

              <div className="photo-editor-controls">
                <div className="control-group">
                  <label>Posición Horizontal ({editorX}%)</label>
                  <input type="range" min="0" max="100" value={editorX} onChange={(e) => setEditorX(Number(e.target.value))} />
                </div>
                <div className="control-group">
                  <label>Posición Vertical ({editorY}%)</label>
                  <input type="range" min="0" max="100" value={editorY} onChange={(e) => setEditorY(Number(e.target.value))} />
                </div>
                <div className="control-group">
                  <label>Zoom ({editorZoom}%)</label>
                  <input type="range" min="50" max="250" value={editorZoom} onChange={(e) => setEditorZoom(Number(e.target.value))} />
                </div>
                
                <div className="control-divider" />

                <div className="control-group">
                  <label>Brillo ({editorBrightness}%)</label>
                  <input type="range" min="50" max="150" value={editorBrightness} onChange={(e) => setEditorBrightness(Number(e.target.value))} />
                </div>
                <div className="control-group">
                  <label>Contraste ({editorContrast}%)</label>
                  <input type="range" min="50" max="150" value={editorContrast} onChange={(e) => setEditorContrast(Number(e.target.value))} />
                </div>

                <div className="control-group">
                  <label>Estilo Visual</label>
                  <div className="style-grid">
                    {Object.keys(STYLE_FILTERS).map(s => (
                      <button 
                        key={s} 
                        type="button"
                        className={`style-btn ${editorStyle === s ? 'active' : ''}`}
                        onClick={() => setEditorStyle(s)}
                      >
                        {s === 'none' ? 'Normal' : s.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="control-divider" />

                <div className="control-group">
                  <label>Descripción SEO</label>
                  <textarea 
                    value={editorSeoAlt} 
                    onChange={(e) => setEditorSeoAlt(e.target.value)}
                    placeholder="Texto alternativo para SEO..."
                    rows={2}
                  />
                </div>

                <div className="editor-footer">
                  <button onClick={() => setEditingPhoto(null)} className="btn-cancel">Cancelar</button>
                  <button 
                    onClick={savePhotoEditor} 
                    className={`btn-save ${photoEditorSaveStatus === 'no-changes' ? 'success' : ''}`}
                    disabled={photoEditorSaveStatus === 'saving'}
                  >
                    {photoEditorSaveStatus === 'saving' ? 'Guardando...' : 
                     photoEditorSaveStatus === 'no-changes' ? '✓ Sin cambios' : 'Guardar Cambios'}
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
