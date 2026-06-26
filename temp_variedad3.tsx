'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Blurhash } from 'react-blurhash';
import { getMediaUrl } from '@/lib/media-url';
import { storage } from '@/lib/firebase/config';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

interface VariedadMediaManagerProps {
  variedadId: string;
  userEmail: string;
  variedadNombre?: string;
  especieNombre?: string;
}

export default function VariedadMediaManager({ variedadId, userEmail, variedadNombre = 'Variedad', especieNombre = 'Especie' }: VariedadMediaManagerProps) {
  const [photos, setPhotos] = useState<any[]>([]);
  const [pdfs, setPdfs] = useState<any[]>([]);
  const [blogs, setBlogs] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  // AI Image States
  const [showAiImageModal, setShowAiImageModal] = useState(false);
  const [aiImageConcept, setAiImageConcept] = useState('');
  const [aiImageLoading, setAiImageLoading] = useState(false);
  const [aiImageResult, setAiImageResult] = useState<string | null>(null);
  const [aiImageDescription, setAiImageDescription] = useState('');
  const [aiImagePromptPreview, setAiImagePromptPreview] = useState('');
  const [aiImagePromptEdited, setAiImagePromptEdited] = useState(false);
  const [showPromptDetails, setShowPromptDetails] = useState(false);

  // PDF Editor & AI States
  const [editingPdf, setEditingPdf] = useState<any>(null);
  const [pdfTitle, setPdfTitle] = useState('');
  const [pdfSummary, setPdfSummary] = useState('');
  const [pdfApuntes, setPdfApuntes] = useState('');
  const [pdfEditorSaveStatus, setPdfEditorSaveStatus] = useState<'idle' | 'saving' | 'no-changes'>('idle');
  const [generatingCoverId, setGeneratingCoverId] = useState<number | null>(null);

  // AI PDF Search State
  const [showPdfSearchModal, setShowPdfSearchModal] = useState(false);
  const [pdfSearchTopic, setPdfSearchTopic] = useState('');
  const [pdfSearchResults, setPdfSearchResults] = useState<{title: string, url: string, summary?: string, apuntes?: string}[]>([]);
  const [pdfSearchLoading, setPdfSearchLoading] = useState(false);
  const [pdfSearchTimer, setPdfSearchTimer] = useState(0);
  const [pdfSearchError, setPdfSearchError] = useState<string | null>(null);
  const pdfSearchAbortControllerRef = useRef<AbortController | null>(null);

  // Blog Generator State
  const [blogGenPdf, setBlogGenPdf] = useState<any>(null);
  const [blogGenInstructions, setBlogGenInstructions] = useState('Escribe un post de blog para agricultores principiantes, con un tono motivador, consejos prácticos, emojis y una buena estructura de Markdown.');
  const [blogGenLoading, setBlogGenLoading] = useState(false);
  const [blogGenProgress, setBlogGenProgress] = useState('Iniciando motor de IA...');
  const [showBlogPrompt, setShowBlogPrompt] = useState(false);

  // Drag states
  const [dragOverPdfs, setDragOverPdfs] = useState(false);

  // Photo Editor States
  const [editingPhoto, setEditingPhoto] = useState<any>(null);
  const [editorX, setEditorX] = useState(50);
  const [editorY, setEditorY] = useState(50);
  const [editorZoom, setEditorZoom] = useState(100);
  const [editorBrightness, setEditorBrightness] = useState(100);
  const [editorContrast, setEditorContrast] = useState(100);
  const [editorStyle, setEditorStyle] = useState('');
  const [editorSeoAlt, setEditorSeoAlt] = useState('');
  const [photoEditorSaveStatus, setPhotoEditorSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const STYLE_FILTERS: Record<string, string> = {
    '': 'none',
    comic: 'contrast(1.45) saturate(1.55) brightness(1.08)',
    manga: 'grayscale(1) contrast(1.85) brightness(1.1)',
    watercolor: 'saturate(1.35) contrast(0.88) brightness(1.14)',
    vintage: 'sepia(40%) contrast(110%) saturate(120%) brightness(95%) hue-rotate(-5deg)',
    cinematic: 'contrast(120%) saturate(110%) brightness(90%) sepia(20%) hue-rotate(180deg) hue-rotate(-180deg)',
    vibrant: 'saturate(150%) contrast(105%) brightness(105%)',
    bnw: 'grayscale(100%) contrast(120%) brightness(105%)',
    fade: 'contrast(85%) brightness(110%) saturate(80%) sepia(10%)',
    sketch: 'grayscale(1) contrast(2.2) brightness(1.18)',
    pop: 'saturate(1.95) contrast(1.3) brightness(1.06)',
    hdr: 'contrast(1.35) saturate(1.3) brightness(1.07)'
  };

  useEffect(() => {
    if (variedadId && userEmail) {
      loadMedia();
    }
  }, [variedadId, userEmail]);

  useEffect(() => {
    let interval: any;
    if (pdfSearchLoading) {
      setPdfSearchTimer(0);
      interval = setInterval(() => {
        setPdfSearchTimer(prev => prev + 1);
      }, 1000);
    } else {
      setPdfSearchTimer(0);
    }
    return () => clearInterval(interval);
  }, [pdfSearchLoading]);

  const loadMedia = async () => {
    try {
      const [resPhotos, resPdfs, resBlogs] = await Promise.all([
        fetch(`/api/admin/variedades/${variedadId}/photos`, { headers: { 'x-user-email': userEmail } }),
        fetch(`/api/admin/variedades/${variedadId}/pdfs`, { headers: { 'x-user-email': userEmail } }),
        fetch(`/api/admin/variedades/${variedadId}/blogs`, { headers: { 'x-user-email': userEmail } })
      ]);
      const dataPhotos = await resPhotos.json();
      const dataPdfs = await resPdfs.json();
      const dataBlogs = await resBlogs.json();
      setPhotos(dataPhotos.photos || []);
      setPdfs(dataPdfs.pdfs || []);
      setBlogs(dataBlogs.blogs || []);
    } catch (e) {
      console.error('Error loading media:', e);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'photos' | 'pdfs') => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploading(true);

    try {
      const isPhotos = type === 'photos';
      for (let i = 0; i < e.target.files.length; i++) {
        const file = e.target.files[i];
        
        // 1. Upload to temporary Firebase Storage
        const tempPath = `uploads/temp/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const storageRef = ref(storage, tempPath);
        await uploadBytes(storageRef, file);
        const rawStoragePath = storageRef.fullPath;

        // 2. Send to API for processing
        const res = await fetch(`/api/admin/variedades/${variedadId}/${type}`, {
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

  const handleDelete = async (id: string, type: 'photos' | 'pdfs') => {
    if (!confirm('¿Seguro que quieres eliminar este archivo?')) return;
    
    try {
      const res = await fetch(`/api/admin/variedades/${variedadId}/${type}?id=${id}`, {
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
      const res = await fetch(`/api/admin/variedades/${variedadId}/photos`, {
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

  // ── Guardar edición de PDF ──
  const savePdfEdits = async () => {
    if (!editingPdf || !variedadId) return;

    const hasChanges = pdfTitle !== (editingPdf.titulo || '') ||
      pdfSummary !== (editingPdf.resumen || '') ||
      pdfApuntes !== (editingPdf.apuntes || '');

    if (!hasChanges) {
      setPdfEditorSaveStatus('no-changes');
      setTimeout(() => {
        setPdfEditorSaveStatus('idle');
        setEditingPdf(null);
      }, 1500);
      return;
    }

    setPdfEditorSaveStatus('saving');
    try {
      await fetch(`/api/admin/variedades/${variedadId}/pdfs`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': userEmail || ''
        },
        body: JSON.stringify({ pdfId: editingPdf.id, titulo: pdfTitle, resumen: pdfSummary, apuntes: pdfApuntes })
      });
      setEditingPdf(null);
      loadMedia();
    } catch {
      alert('❌ Error guardando PDF');
    } finally {
      setPdfEditorSaveStatus('idle');
    }
  };

  // ── Generar Portada de PDF con IA ──
  const generatePdfCover = async (pdf: any) => {
    setGeneratingCoverId(pdf.id);
    try {
      const res = await fetch('/api/ai/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail || '' },
        body: JSON.stringify({
          tipoEntidad: 'documento',
          especieNombre: variedadNombre,
          concept: `Portada del documento titulado "${pdf.titulo}". Estilo limpio, académico, con ilustración botánica. Contenido principal: ${pdf.resumen}`
        })
      });
      const data = await res.json();
      if (data.success && data.base64) {
        await fetch(`/api/admin/variedades/${variedadId}/pdfs`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail || '' },
          body: JSON.stringify({
            pdfId: pdf.id,
            base64Cover: `data:image/jpeg;base64,${data.base64}`
          })
        });

        await loadMedia();

        setEditingPdf((prev: any) => {
          if (prev && prev.id === pdf.id) {
            return { ...prev, portada: `data:image/jpeg;base64,${data.base64}` };
          }
          return prev;
        });
      } else {
        alert(data.error || 'Error al generar la portada del documento.');
      }
    } catch (e) {
      console.error(e);
      alert('Error de red al generar portada.');
    } finally {
      setGeneratingCoverId(null);
    }
  };

  // ── AI PDF Search Logic ──
  const handleSearchPdfs = async () => {
    if (!pdfSearchTopic) return;
    
    if (pdfSearchAbortControllerRef.current) {
      pdfSearchAbortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    pdfSearchAbortControllerRef.current = abortController;

    setPdfSearchLoading(true);
    setPdfSearchResults([]);
    setPdfSearchError(null);
    try {
      const res = await fetch('/api/ai/pdf-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: pdfSearchTopic, especieNombre: especieNombre, variedadNombre: variedadNombre }),
        signal: abortController.signal
      });

      let data;
      try {
        data = await res.json();
      } catch (parseErr) {
        throw new Error('Error al leer la respuesta del servidor.');
      }

      if (res.ok && data.links) {
        setPdfSearchResults(data.links);
      } else {
        setPdfSearchError(data.error || 'No se encontraron resultados o hubo un error.');
      }
    } catch (e: any) {
      if (e.name === 'AbortError') {
        console.log('Búsqueda de PDFs cancelada por el usuario.');
        return;
      }
      console.error(e);
      setPdfSearchError(e.message || 'Error en la conexión con el Asistente IA.');
    } finally {
      setPdfSearchLoading(false);
    }
  };

  const handleAddPdfLink = async (title: string, url: string, summary: string = '', apuntes: string = '') => {
    try {
      // Usamos el endpoint genérico de links que se conecta con Firebase y crea el registro
      // Haremos una pequeña adaptación enviando variedadId a su propio endpoint
      const res = await fetch(`/api/admin/variedades/${variedadId}/pdfs/link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail || '' },
        body: JSON.stringify({ title, url, summary, apuntes, targetModel: 'variedad' })
      });
      const data = await res.json();
      if (data.success) {
        loadMedia();
        setShowPdfSearchModal(false);
        if (data.pdf && !data.pdf.portada) {
          generatePdfCover(data.pdf);
        }
      } else {
        alert(data.error || 'Error al añadir enlace');
      }
    } catch (e) {
      console.error(e);
      alert('Error al añadir enlace');
    }
  };

  const submitBlogGen = async () => {
    if (!blogGenPdf) return;
    setBlogGenLoading(true);
    try {
      const res = await fetch('/api/ai/generate-blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pdfUrl: blogGenPdf.ruta.startsWith('http') ? blogGenPdf.ruta : `${window.location.origin}${blogGenPdf.ruta.startsWith('/') ? '' : '/'}${blogGenPdf.ruta}`,
          instructions: blogGenInstructions,
          especieId: null,
          variedadId: variedadId,
          autorEmail: userEmail,
          especieNombre: variedadNombre,
          contexto: {
            tipo: 'variedad',
            nombre: variedadNombre || 'Variedad'
          },
          pdfSourceId: blogGenPdf.id
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('¡Borrador generado con éxito! Slug: ' + data.slug);
        setBlogGenPdf(null);
        loadMedia();
      } else {
        alert(data.error || 'Error al generar blog');
      }
    } catch (e) {
      console.error(e);
      alert('Error al generar blog');
    } finally {
      setBlogGenLoading(false);
    }
  };

  const handleDeleteBlog = async (blogId: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este blog generado de la base de datos?')) return;
    try {
      const res = await fetch(`/api/admin/blog/${blogId}`, {
        method: 'DELETE',
        headers: { 'x-user-email': userEmail || '' }
      });
      if (res.ok) {
        loadMedia();
      } else {
        const data = await res.json();
        alert(data.error || 'Error al eliminar blog');
      }
    } catch (e) {
      console.error(e);
      alert('Error al eliminar blog');
    }
  };

  const openPhotoEditor = (photo: any) => {
    let meta: any = {};
    try { meta = JSON.parse(photo.resumen || '{}'); } catch(e){}
    setEditingPhoto(photo);
    setEditorX(meta.profile_object_x ?? 50);
    setEditorY(meta.profile_object_y ?? 50);
    setEditorZoom(meta.profile_object_zoom ?? 100);
    setEditorBrightness(meta.profile_brightness ?? 100);
    setEditorContrast(meta.profile_contrast ?? 100);
    setEditorStyle(meta.profile_style || '');
    setEditorSeoAlt(meta.seo_alt || '');
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
        profile_brightness: editorBrightness,
        profile_contrast: editorContrast,
        profile_style: editorStyle,
        seo_alt: editorSeoAlt
      };

      const res = await fetch(`/api/admin/variedades/${variedadId}/photos`, {
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

  const buildPromptPreview = () => {
    const defaultConcept = `varios ejemplares de la variedad ${variedadNombre} (perteneciente a la especie ${especieNombre}) recién cosechados, dispuestos sobre una mesa rústica de madera en un huerto al aire libre, con tierra y hojas verdes visibles al fondo`;
    return `Fotografía profesional de stock de alta resolución (8K), tomada con una cámara DSLR Canon EOS R5 y un objetivo macro 100mm f/2.8, iluminación natural suave de hora dorada.\\nSujeto principal: La variedad ${variedadNombre} de la especie ${especieNombre} (hortaliza/planta comestible de huerto).\\nEscena concreta: ${aiImageConcept || defaultConcept}.\\nComposición: regla de los tercios, sujeto nítido en primer plano, fondo suavemente desenfocado (bokeh) mostrando vegetación de huerto.\\nREGLAS ESTRICTAS:\\n1. El sujeto es SIEMPRE una planta, hortaliza, fruto o semilla comestible de huerto (específicamente de la especie ${especieNombre}).\\n2. La fotografía debe parecer tomada por un fotógrafo profesional de gastronomía o agricultura.\\n3. El entorno debe ser siempre agrícola: huerto, bancal, invernadero, mesa de cosecha o cocina rústica.\\n4. NO incluir personas, manos, texto, logotipos ni marcas de agua.\\n5. Mostrar el producto hortícola en su mejor estado: fresco, limpio, apetecible.`;
  };

  const generateAiImage = async () => {
    setAiImageLoading(true);
    setAiImageResult(null);
    setAiImageDescription('');
    try {
      const body: any = { 
        especieNombre: variedadNombre,
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
    if (!aiImageResult) return;
    setUploading(true);
    try {
      const base64Data = aiImageResult.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/jpeg' });
      
      const file = new File([blob], `ai_generated_${Date.now()}.jpg`, { type: 'image/jpeg' });
      
      const tempPath = `uploads/temp/${Date.now()}_ai_variedad_${variedadId}.jpg`;
      const storageRef = ref(storage, tempPath);
      await uploadBytes(storageRef, file);
      
      const saveRes = await fetch(`/api/admin/variedades/${variedadId}/photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail || '' },
        body: JSON.stringify({
          rawStoragePath: tempPath,
          originalFilename: file.name
        })
      });
      if (!saveRes.ok) {
        throw new Error('Error guardando en BD');
      }
      await loadMedia();
      setAiImageResult(null);
      setAiImageConcept('');
      setAiImageDescription('');
      setAiImagePromptPreview('');
      setAiImagePromptEdited(false);
      setShowAiImageModal(false);
    } catch (error) {
      console.error('Error uploading AI image:', error);
      alert('Error al guardar la imagen generada.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
        
        {/* PHOTOS */}
        <div className="form-group full" style={{ marginBottom: '30px' }}>
        <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            Fotos
          </span>
          <small style={{ color: photos.length >= 4 ? '#ef4444' : '#64748b' }}>
            {photos.length} / 4 permitidas
          </small>
        </label>
        
        <div className="gallery">
          {photos.map(p => {
            const isPrimary = p.esPrincipal === 1;
            let meta: any = {};
            try { meta = JSON.parse(p.resumen || '{}'); } catch(e){}

            return (
              <div key={p.id} className={`gallery-item ${isPrimary ? 'is-preferred' : ''}`} style={{ border: isPrimary ? '3px solid #f59e0b' : '1px solid #e2e8f0' }}>
                {meta.blurhash && (
                  <div style={{ position: 'absolute', inset: 0 }}>
                    <Blurhash hash={meta.blurhash} width="100%" height="100%" resolutionX={32} resolutionY={32} punch={1} />
                  </div>
                )}
                <img 
                  src={getMediaUrl(p.ruta)} 
                  alt={meta.seo_alt || "Variedad"} 
                  style={{ 
                    position: 'absolute', 
                    inset: 0, 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'cover',
                    objectPosition: `${meta.profile_object_x || 50}% ${meta.profile_object_y || 50}%`,
                    filter: STYLE_FILTERS[meta.profile_style || ''],
                    transform: `scale(${(meta.profile_object_zoom || 100) / 100})`
                  }} 
                  crossOrigin="anonymous" 
                />
                
                <div className="photo-actions" style={{ zIndex: 20 }}>
                  <button 
                    type="button"
                    className={`photo-action-btn btn-photo-primary ${isPrimary ? 'is-active' : ''}`}
                    onClick={() => setPrimaryPhoto(p.id)} 
                    title={isPrimary ? 'Foto preferida' : 'Marcar como preferida'}
                  >
                    {isPrimary ? '★' : '☆'}
                  </button>
                  <button 
                    type="button"
                    className="photo-action-btn btn-photo-edit"
                    onClick={() => openPhotoEditor(p)}
                    title="Editar foto"
                  >
                    ✏️
                  </button>
                  <button 
                    type="button"
                    className="photo-action-btn btn-photo-delete"
                    onClick={() => handleDelete(p.id, 'photos')}
                    title="Eliminar"
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })}
          
          {photos.length < 4 && (
            <div className={`custom-file-upload drop-zone inline-drop-zone ${uploading ? 'drag-over' : ''}`}>
              <input type="file" id="upload-photos-variedad" multiple accept="image/*" onChange={(e) => handleFileUpload(e, 'photos')} disabled={uploading} />
              
              {uploading ? (
                <div className="drop-zone-content">
                  <span style={{ fontSize: '1.5rem', animation: 'spin 2s linear infinite', display: 'inline-block' }}>⏳</span>
                  <span style={{ color: '#10b981', fontWeight: 'bold', fontSize: '0.75rem', textAlign: 'center' }}>Procesando...</span>
                </div>
              ) : (
                <div className="drop-zone-content">
                  <div className="drop-zone-buttons" style={{ flexDirection: 'column' }}>
                    <label htmlFor="upload-photos-variedad" className="btn-upload primary" style={{ padding: '8px', fontSize: '0.8rem' }}>
                      <span className="icon" style={{ fontSize: '1.2rem', marginBottom: '4px', display: 'block' }}>📁</span> Galería
                    </label>
                    <button type="button" onClick={() => {
                      setAiImagePromptPreview(buildPromptPreview());
                      setShowAiImageModal(true);
                    }} className="btn-upload" style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', color: 'white', border: 'none', padding: '8px', fontSize: '0.8rem' }}>
                      <span className="icon" style={{ fontSize: '1.2rem', marginBottom: '4px', display: 'block' }}>✨</span> Generar IA
                    </button>
                  </div>
                  <span className="drop-hint" style={{ fontSize: '0.7rem', textAlign: 'center', marginTop: '4px' }}>arrastra y suelta<br/>aquí</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* PDFS Y BLOGS */}
      <div className="form-group full" style={{ marginTop: '20px' }}>
        <label style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
          <span style={{ margin: 0, fontWeight: 'bold' }}>📄 Documentos Adicionales (PDF)</span>
          <button type="button" onClick={() => setShowPdfSearchModal(true)} style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 4px rgba(139, 92, 246, 0.3)' }}>
            ✨ Buscar PDFs con IA
          </button>
        </label>
        
        <div className="gallery pdfs">
          {pdfs.map(p => (
            <div key={p.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {/* Cuadro de portada — solo la foto */}
              <div className="gallery-item pdf" style={{ position: 'relative', overflow: 'hidden', borderRadius: '12px', border: '1px solid #e2e8f0', padding: 0 }}>
                {p.portada ? (
                  <img src={getMediaUrl(p.portada)} alt={p.titulo || 'Portada PDF'} style={{ width: '100%', height: '180px', objectFit: 'cover', display: 'block' }} crossOrigin="anonymous" />
                ) : (
                  <div style={{ width: '100%', height: '180px', background: 'linear-gradient(135deg, #f1f5f9, #e2e8f0)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <button type="button" onClick={() => generatePdfCover(p)} disabled={generatingCoverId === p.id} style={{ background: 'transparent', border: 'none', color: '#10b981', fontWeight: 'bold', cursor: generatingCoverId === p.id ? 'not-allowed' : 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {generatingCoverId === p.id ? '⏳ Generando...' : '🎨 Generar Portada'}
                    </button>
                  </div>
                )}

                {/* Botones superpuestos en la foto */}
                <div style={{ position: 'absolute', top: '6px', right: '6px', display: 'flex', gap: '4px' }}>
                  <button type="button" style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: 'white', borderRadius: '4px', border: 'none', padding: '4px 6px', fontSize: '0.8rem', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.25)' }} onClick={() => { setEditingPdf(p); setPdfTitle(p.titulo || ''); setPdfSummary(p.resumen || ''); setPdfApuntes(p.apuntes || ''); }} title="Editar Metadatos">✏️</button>
                  {(blogs.some(b => b.pdfSourceId == p.id)) ? (
                    <button type="button" style={{ background: 'linear-gradient(135deg, #9ca3af, #6b7280)', color: 'white', borderRadius: '4px', border: 'none', padding: '4px 6px', fontSize: '0.8rem', cursor: 'not-allowed', boxShadow: '0 2px 4px rgba(0,0,0,0.25)', opacity: 0.8 }} disabled title="No se puede eliminar: Hay un blog asociado a este PDF.">✕</button>
                  ) : (
                    <button type="button" style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: 'white', borderRadius: '4px', border: 'none', padding: '4px 6px', fontSize: '0.8rem', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.25)' }} onClick={() => handleDelete(p.id, 'pdfs')} title="Eliminar">✕</button>
                  )}
                </div>
              </div>

              {/* Título como hipervínculo debajo del cuadro */}
              <a href={getMediaUrl(p.ruta)} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.82rem', fontWeight: 600, color: '#10b981', textDecoration: 'none', textAlign: 'center', lineHeight: 1.3, padding: '0 4px' }} onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'} onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>
                📄 {p.titulo || p.nombreOriginal}
              </a>

              {/* Botón generar blog debajo del título */}
              <button type="button" onClick={() => setBlogGenPdf(p)} style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', alignSelf: 'center', boxShadow: '0 2px 4px rgba(245,158,11,0.3)' }}>
                📝 Generar Blog
              </button>

              {/* Blogs relacionados a este PDF */}
              {blogs.filter(b => b.pdfSourceId == p.id).length > 0 && (
                <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #e2e8f0', width: '100%' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px', textAlign: 'center' }}>Blogs Generados</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {blogs.filter(b => b.pdfSourceId == p.id).map(b => (
                      <div key={b.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '6px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', position: 'relative' }}>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                          {b.hero_imagen ? (
                            <div style={{ flex: '0 0 40px', height: '40px', borderRadius: '4px', overflow: 'hidden', background: '#f1f5f9', marginTop: '2px' }}>
                              <img src={getMediaUrl(b.hero_imagen)} alt={b.titulo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} crossOrigin="anonymous" />
                            </div>
                          ) : (
                            <div style={{ flex: '0 0 40px', height: '40px', borderRadius: '4px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', marginTop: '2px' }}>✨</div>
                          )}
                          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                            <a href={`/blog/${b.slug}?preview=true`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.72rem', fontWeight: 600, color: '#0f766e', lineHeight: 1.3, textDecoration: 'none' }} onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'} onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>
                              {b.titulo}
                            </a>
                          </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px', paddingLeft: '46px' }}>
                          <span style={{ fontSize: '0.6rem', color: b.estado === 'publicado' ? '#059669' : '#d97706', fontWeight: 700, background: b.estado === 'publicado' ? '#d1fae5' : '#fef3c7', padding: '2px 4px', borderRadius: '4px' }}>
                            {b.estado === 'publicado' ? 'Publicado' : 'Borrador'}
                          </span>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.6rem', color: '#94a3b8', fontWeight: 500 }}>
                              {new Date(b.fechaCreacion).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                            </span>
                            <button type="button" onClick={() => handleDeleteBlog(b.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0 2px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Eliminar blog">
                              🗑️
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          <div
            className={`custom-file-upload drop-zone inline-drop-zone ${dragOverPdfs ? 'drag-over' : ''}`}
            onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setDragOverPdfs(true); }}
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragOverPdfs(true); }}
            onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDragOverPdfs(false); }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setDragOverPdfs(false);
              if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                handleFileUpload({ target: { files: e.dataTransfer.files } } as any, 'pdfs');
              }
            }}
          >
            <input type="file" id="upload-pdfs-variedad" multiple accept=".pdf" onChange={(e) => handleFileUpload(e, 'pdfs')} disabled={uploading} style={{ display: 'none' }} />
            
            {uploading ? (
              <div className="drop-zone-content">
                <span style={{ fontSize: '1.5rem', animation: 'spin 2s linear infinite', display: 'inline-block' }}>⏳</span>
                <span style={{ color: '#3b82f6', fontWeight: 'bold', fontSize: '0.75rem', textAlign: 'center' }}>Subiendo...</span>
              </div>
            ) : (
              <div className="drop-zone-content">
                <label htmlFor="upload-pdfs-variedad" className="btn-upload primary" style={{ padding: '8px', fontSize: '0.8rem' }}>
                  <span className="icon" style={{ fontSize: '1.2rem', marginBottom: '4px', display: 'block' }}>📄</span> Subir PDF
                </label>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>

      {showAiImageModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.85)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', padding: '20px' }}>
          <div style={{ background: 'white', borderRadius: '20px', width: '100%', maxWidth: '600px', display: 'flex', flexDirection: 'column', maxHeight: '90vh', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', background: 'linear-gradient(to right, #f8fafc, #f1f5f9)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1.5rem' }}>✨</span> Generador de Imágenes IA
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748b' }}>Especie: <strong>{especieNombre}</strong> | Variedad: <strong>{variedadNombre || 'Sin nombre'}</strong></p>
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
                      placeholder={`Ej. Fotografía macro de la variedad ${variedadNombre} de la especie ${especieNombre}...`}
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
                        "En la planta con fruto maduro",
                        "En la planta y tras el riego",
                        "En la tabla de cocina preparándolo para crear un plato",
                        "Como plato precocinado"
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
                      fontSize: '1rem', 
                      cursor: aiImageLoading ? 'not-allowed' : 'pointer',
                      opacity: aiImageLoading ? 0.7 : 1,
                      marginTop: '10px'
                    }}
                  >
                    {aiImageLoading ? 'Generando Imagen...' : '✨ Generar Ahora'}
                  </button>
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '100%', aspectRatio: '1/1', borderRadius: '16px', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}>
                    <img src={aiImageResult} alt="Generated by AI" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  
                  <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                    <button 
                      type="button" 
                      onClick={() => setAiImageResult(null)} 
                      style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #cbd5e1', background: 'white', color: '#475569', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      Descartar y Reintentar
                    </button>
                    <button 
                      type="button" 
                      onClick={uploadAiImage} 
                      disabled={uploading}
                      style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: '#10b981', color: 'white', fontWeight: 'bold', cursor: uploading ? 'not-allowed' : 'pointer', opacity: uploading ? 0.7 : 1 }}
                    >
                      {uploading ? 'Guardando...' : 'Guardar en Galería'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE EDICIÓN DE METADATOS DE PDF */}
      {/* MODAL DE EDICIÓN DE METADATOS DE PDF */}
      {editingPdf && (() => {
        const hasPdfChanges = pdfTitle !== (editingPdf.titulo || '') ||
          pdfSummary !== (editingPdf.resumen || '') ||
          pdfApuntes !== (editingPdf.apuntes || '');
        return (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}
            onClick={() => setEditingPdf(null)}>
            <div style={{ background: 'white', borderRadius: '16px', padding: '24px', maxWidth: '800px', width: '95%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', gap: '16px' }}
              onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
                <div>
                  <h3 style={{ margin: 0, color: '#1e293b', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    📄 Editar Metadatos del PDF
                  </h3>
                  <span style={{ display: 'inline-block', marginTop: '6px', background: '#ecfdf5', color: '#0f766e', border: '1px solid #a7f3d0', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                    🌱 Especie: {especieNombre} | Variedad: {variedadNombre || 'Sin nombre'}
                  </span>
                </div>
                <button type="button" onClick={() => setEditingPdf(null)} style={{ background: 'transparent', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#64748b' }}>✕</button>
              </div>

              <div style={{ display: 'flex', gap: '24px', flexDirection: 'row', flexWrap: 'wrap' }}>
                {/* Columna Izquierda: Portada */}
                <div style={{ flex: '0 0 250px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ width: '100%', height: '350px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {editingPdf.portada ? (
                      <img src={getMediaUrl(editingPdf.portada)} alt="Portada PDF" style={{ width: '100%', height: '100%', objectFit: 'cover' }} crossOrigin="anonymous" />
                    ) : (
                      <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>
                        <span style={{ fontSize: '3rem', display: 'block', marginBottom: '10px' }}>📄</span>
                        <p style={{ margin: 0, fontSize: '0.9rem' }}>Sin portada generada</p>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      generatePdfCover({ ...editingPdf, titulo: pdfTitle, resumen: pdfSummary });
                    }}
                    disabled={generatingCoverId === editingPdf.id}
                    style={{ width: '100%', padding: '8px', background: '#e0e7ff', color: '#4338ca', border: '1px solid #c7d2fe', borderRadius: '6px', fontWeight: 'bold', cursor: generatingCoverId === editingPdf.id ? 'wait' : 'pointer', fontSize: '0.85rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}
                  >
                    {generatingCoverId === editingPdf.id ? '⏳ Generando...' : (editingPdf.portada ? '✨ Regenerar Portada IA' : '✨ Generar Portada IA')}
                  </button>
                </div>

                {/* Columna Derecha: Formulario */}
                <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', fontSize: '0.9rem', color: '#334155' }}>Nombre del Documento</label>
                    <input
                      type="text"
                      value={pdfTitle}
                      onChange={e => setPdfTitle(e.target.value)}
                      placeholder={editingPdf.nombreOriginal}
                      style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.95rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', fontSize: '0.9rem', color: '#334155' }}>Resumen Corto</label>
                    <textarea
                      value={pdfSummary}
                      onChange={e => setPdfSummary(e.target.value)}
                      placeholder="Describe brevemente el documento (1-2 líneas)..."
                      rows={3}
                      style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.95rem', resize: 'vertical' }}
                    />
                  </div>
                  <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                    <label style={{ marginBottom: '4px', fontWeight: 'bold', fontSize: '0.9rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      🎓 Apuntes (Modo Estudiante)
                    </label>
                    <textarea
                      value={pdfApuntes}
                      onChange={e => setPdfApuntes(e.target.value)}
                      placeholder="Apuntes técnicos detallados extraídos del PDF..."
                      style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.95rem', resize: 'vertical', flexGrow: 1, minHeight: '120px' }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
                <button type="button" onClick={() => setEditingPdf(null)}
                  style={{ padding: '10px 20px', borderRadius: '6px', border: '1px solid #cbd5e1', background: 'white', color: '#475569', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' }}>
                  Cancelar
                </button>
                {hasPdfChanges && (
                  <button type="button" onClick={savePdfEdits} disabled={pdfEditorSaveStatus === 'saving'}
                    style={{ padding: '10px 20px', borderRadius: '6px', border: 'none', background: '#10b981', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {pdfEditorSaveStatus === 'saving' ? '⏳ Guardando...' : pdfEditorSaveStatus === 'no-changes' ? '✓ Sin cambios' : '💾 Guardar Metadatos'}
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL GENERADOR DE BLOG */}
      {blogGenPdf && (
        <div 
          onClick={() => !blogGenLoading && setBlogGenPdf(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.85)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', padding: '20px' }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{ background: 'white', borderRadius: '20px', width: '100%', maxWidth: '600px', display: 'flex', flexDirection: 'column', maxHeight: '90vh', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}
          >
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', background: 'linear-gradient(to right, #fffbeb, #fef3c7)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, color: '#b45309', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1.5rem' }}>📝</span> Generador de Blog IA
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#92400e' }}>
                  Basado en: <strong>{blogGenPdf.titulo || blogGenPdf.nombreOriginal}</strong>
                </p>
              </div>
              <button onClick={() => !blogGenLoading && setBlogGenPdf(null)} disabled={blogGenLoading} style={{ background: 'none', border: 'none', fontSize: '1.5rem', color: '#d97706', cursor: blogGenLoading ? 'not-allowed' : 'pointer', opacity: blogGenLoading ? 0.5 : 1 }}>&times;</button>
            </div>
            <div style={{ padding: '24px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {blogGenLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', textAlign: 'center' }}>
                  <div style={{ fontSize: '4rem', animation: 'bounce 1s infinite' }}>🧠</div>
                  <h3 style={{ color: '#0f172a', marginTop: '20px', marginBottom: '8px' }}>Escribiendo artículo...</h3>
                  <p style={{ color: '#64748b', margin: 0 }}>La IA está leyendo el PDF y redactando el post (puede tardar un minuto).</p>
                </div>
              ) : (
                <>
                  <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '1.5rem' }}>💡</span>
                    <div>
                      <h4 style={{ margin: '0 0 4px 0', color: '#334155' }}>¿Cómo funciona?</h4>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5 }}>
                        La IA leerá el contenido técnico del PDF y lo transformará en un artículo de blog atractivo. Puedes cambiar el tono de redacción editando las instrucciones de abajo.
                      </p>
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#334155' }}>Instrucciones para la IA (Tono y Estilo)</label>
                    <textarea 
                      value={blogGenInstructions} 
                      onChange={e => setBlogGenInstructions(e.target.value)} 
                      style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid #cbd5e1', resize: 'vertical', minHeight: '120px', fontSize: '0.95rem', lineHeight: 1.5 }}
                    />
                  </div>

                  {/* Toggle para ver el prompt del sistema usando el estándar <details> */}
                  <details open={showBlogPrompt} onToggle={(e: any) => setShowBlogPrompt(e.target.open)} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', marginTop: '4px' }}>
                    <summary style={{ padding: '10px 14px', background: '#f8fafc', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '8px', userSelect: 'none', listStyle: 'none' }}>
                      <span style={{ transition: 'transform 0.2s', transform: showBlogPrompt ? 'rotate(90deg)' : 'rotate(0deg)', display: 'inline-block' }}>▶</span>
                      👁️ Ver Prompt del Sistema enviado a Gemini
                    </summary>
                    <div style={{ padding: '16px', borderTop: '1px solid #e2e8f0', background: '#0f172a', color: '#e2e8f0', fontSize: '0.75rem', fontFamily: 'monospace', maxHeight: '300px', overflowY: 'auto', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                      {`Actúa como un experto redactor de blogs agronómicos y de jardinería moderna. Vas a leer el documento adjunto sobre la variedad "${variedadNombre}" y vas a escribir un artículo de blog profesional, SEO-optimizado y visualmente estructurado.

CONTEXTO: Este blog trata sobre una VARIEDAD vegetal/hortaliza.

INDICACIONES DEL USUARIO: "${blogGenInstructions}"

REGLAS DE ESTRUCTURA OBLIGATORIAS (Blog Verdantia):
1. SIN PAJA: Párrafos de máximo 3 líneas.
2. NEGRITAS en conceptos clave. DATOS CONCRETOS.
3. TONO: Profesional pero cercano.
4. TÍTULO: Interrogativo siempre que sea posible (ej: "¿Cómo cultivar...?").

JSON de salida obligatorio:
→ titulo, slug, resumen, tags[]
→ ficha_rapida[6]: 🌡️ Temp, 🗓️ Siembra, 🌱 Germinación, 📏 Marco, 🕐 Cosecha, 💧 Riego
→ introduccion (max 100 palabras)
→ secciones[]: {titulo_h2, contenido_markdown, imagen_posicion}
→ consejos: {titulo, items[]}
→ cta: {titulo, subtitulo, botones}
→ imagenes[3]: {prompt_en, titulo_seo, descripcion_seo}`}
                    </div>
                  </details>
                </>
              )}
            </div>
            {!blogGenLoading && (
              <div style={{ padding: '20px 24px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button onClick={() => setBlogGenPdf(null)} style={{ padding: '12px 20px', borderRadius: '12px', border: '1px solid #cbd5e1', background: 'white', color: '#475569', fontWeight: 'bold', cursor: 'pointer' }}>Cancelar</button>
                <button onClick={submitBlogGen} style={{ padding: '12px 24px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 6px -1px rgba(245,158,11,0.4)' }}>
                  ✨ Comenzar Magia
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL SEARCH PDFS */}
      {showPdfSearchModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(6px)' }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '24px', maxWidth: '600px', width: '95%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #4c1d95', background: 'linear-gradient(to right, #6d28d9, #4c1d95)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, color: 'white', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1.5rem' }}>✨</span> Buscador IA de PDFs
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#ddd6fe' }}>
                  Especie: <strong style={{ color: 'white' }}>{especieNombre}</strong> | Variedad: <strong style={{ color: 'white' }}>{variedadNombre || 'Sin nombre'}</strong>
                </p>
              </div>
              <button 
                type="button" 
                onClick={() => {
                  if (pdfSearchAbortControllerRef.current) {
                    pdfSearchAbortControllerRef.current.abort();
                  }
                  setPdfSearchLoading(false);
                  setShowPdfSearchModal(false);
                }} 
                style={{ background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '8px', padding: '6px 12px', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer', color: 'white', transition: 'all 0.2s' }} 
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'; }} 
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'; }}
              >
                Cancelar
              </button>
            </div>

            <div style={{ padding: '24px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#334155' }}>
                  ¿Qué tipo de documento buscas sobre esta variedad?
                </label>
                <textarea
                  value={pdfSearchTopic}
                  onChange={e => setPdfSearchTopic(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSearchPdfs();
                    }
                  }}
                  placeholder="Ej. enfermedades comunes..."
                  rows={2}
                  style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '12px', fontSize: '0.95rem', outline: 'none', resize: 'vertical', minHeight: '60px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#334155', fontSize: '0.85rem' }}>
                  Sugerencias Rápidas:
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {[
                    "Manual de cultivo",
                    "Plagas y enfermedades comunes",
                    "Requerimientos hídricos y riego",
                    "Marco de plantación ideal",
                    "Ficha técnica oficial"
                  ].map(preset => (
                    <button 
                      key={preset}
                      type="button"
                      onClick={() => setPdfSearchTopic(preset)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '20px',
                        border: `1px solid ${pdfSearchTopic === preset ? '#8b5cf6' : '#e2e8f0'}`,
                        background: pdfSearchTopic === preset ? '#f3e8ff' : '#f8fafc',
                        color: pdfSearchTopic === preset ? '#6d28d9' : '#475569',
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

              <details style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                <summary style={{ padding: '10px 14px', background: '#f8fafc', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '8px', userSelect: 'none', listStyle: 'none' }}>
                  <span style={{ display: 'inline-block' }}>▶</span>
                  🔧 Prompt técnico
                </summary>
                <div style={{ padding: '12px 14px', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
                  <textarea
                    readOnly
                    value={`Actúa como un bibliotecario agrónomo experto. Busca 4 enlaces reales a manuales, guías o documentos PDF (preferiblemente de instituciones agrícolas, universidades o ministerios) sobre el cultivo de la especie "${especieNombre}" y variedad "${variedadNombre}", específicamente enfocados en el tema: "${pdfSearchTopic}".\n\nEs IMPRESCINDIBLE que uses tu herramienta de búsqueda en internet para obtener enlaces reales y actualizados.`}
                    rows={6}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.8rem', fontFamily: 'monospace', resize: 'vertical', lineHeight: '1.5', color: '#334155', background: '#f8fafc' }}
                  />
                </div>
              </details>

              <button
                type="button"
                onClick={handleSearchPdfs}
                disabled={pdfSearchLoading || !pdfSearchTopic}
                style={{ 
                  width: '100%',
                  padding: '14px', 
                  borderRadius: '12px', 
                  border: 'none', 
                  background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', 
                  color: 'white', 
                  fontWeight: 'bold', 
                  fontSize: '1rem',
                  cursor: (pdfSearchLoading || !pdfSearchTopic) ? 'not-allowed' : 'pointer', 
                  opacity: (pdfSearchLoading || !pdfSearchTopic) ? 0.7 : 1,
                  marginTop: '10px'
                }}
              >
                {pdfSearchLoading ? '⏳ Buscando Documentos...' : '✨ Buscar Ahora'}
              </button>

            {pdfSearchLoading && (
              <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
                <span style={{ fontSize: '2rem', display: 'inline-block', animation: 'spin 2s linear infinite' }}>⏳</span>
                <p style={{ marginTop: '10px', fontSize: '1rem', color: '#6d28d9', fontWeight: 'bold' }}>
                  Buscando documentos... {pdfSearchTimer}s
                </p>
                <p style={{ marginTop: '4px', fontSize: '0.85rem' }}>La IA está leyendo los repositorios agrícolas.</p>
              </div>
            )}

            {pdfSearchError && (
              <div style={{ background: '#fef2f2', border: '1px solid #f87171', borderRadius: '8px', padding: '16px', color: '#991b1b', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '1.5rem' }}>⚠️</span>
                <p style={{ margin: 0, fontSize: '0.95rem', flex: 1 }}>{pdfSearchError}</p>
              </div>
            )}

            {!pdfSearchLoading && pdfSearchResults.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h4 style={{ margin: 0, color: '#334155', fontSize: '1rem' }}>Resultados Encontrados:</h4>
                {pdfSearchResults.map((res, i) => (
                  <div key={i} style={{ border: '1px solid #e2e8f0', padding: '12px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', background: '#f8fafc' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <a href={res.url} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 'bold', color: '#0f172a', textDecoration: 'none', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'} onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>
                        {res.title}
                      </a>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px' }}>
                        {res.url}
                      </span>
                      {res.summary && (
                        <p style={{ margin: '6px 0 0', fontSize: '0.8rem', color: '#475569', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          ✨ {res.summary}
                        </p>
                      )}
                    </div>
                    <button type="button" onClick={() => handleAddPdfLink(res.title, res.url, res.summary, res.apuntes)} style={{ background: 'white', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                      ➕ Añadir
                    </button>
                  </div>
                ))}
              </div>
            )}
            </div>
          </div>
        </div>
      )}

      {editingPhoto && (
        <div className="photo-editor-overlay">
          <div className="photo-editor-content">
            <div className="photo-editor-header">
              <h3>🎨 Editor de Imagen: {variedadNombre}</h3>
              <button className="photo-editor-close" onClick={() => setEditingPhoto(null)}>&times;</button>
            </div>
            
            <div className="photo-editor-body">
              <div 
                className="photo-editor-preview-container"
                style={{ position: 'relative', overflow: 'hidden', height: '300px' }}
                onMouseDown={(e) => {
                  const startX = e.clientX;
                  const startY = e.clientY;
                  const startPosX = editorX;
                  const startPosY = editorY;
                  const onMove = (moveEvent: MouseEvent) => {
                    const dx = moveEvent.clientX - startX;
                    const dy = moveEvent.clientY - startY;
                    setEditorX(Math.max(0, Math.min(100, startPosX - dx / 5)));
                    setEditorY(Math.max(0, Math.min(100, startPosY - dy / 5)));
                  };
                  const onUp = () => {
                    window.removeEventListener('mousemove', onMove);
                    window.removeEventListener('mouseup', onUp);
                  };
                  window.addEventListener('mousemove', onMove);
                  window.addEventListener('mouseup', onUp);
                }}
              >
                <img 
                  src={getMediaUrl(editingPhoto.ruta)} 
                  alt="Preview" 
                  className="photo-editor-image"
                  style={{
                    objectPosition: `${editorX}% ${editorY}%`,
                    filter: `${STYLE_FILTERS[editorStyle] || 'none'} brightness(${editorBrightness}%) contrast(${editorContrast}%)`,
                    transform: `scale(${editorZoom / 100})`
                  }}
                  crossOrigin="anonymous"
                />
                <div style={{ position: 'absolute', bottom: '10px', left: '10px', background: 'rgba(0,0,0,0.5)', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem' }}>
                  Posición: {Math.round(editorX)}% / {Math.round(editorY)}%
                </div>
              </div>

              <div className="photo-editor-controls">
                <div className="editor-control-group">
                  <label>Zoom <span>{editorZoom}%</span></label>
                  <input type="range" min="100" max="300" value={editorZoom} onChange={e => setEditorZoom(parseInt(e.target.value))} />
                </div>

                <div className="editor-control-group">
                  <label>Estilo Visual</label>
                  <div className="style-filters-grid">
                    {Object.keys(STYLE_FILTERS).map(filter => (
                      <button 
                        key={filter} 
                        className={`style-filter-btn ${editorStyle === filter ? 'active' : ''}`}
                        onClick={() => setEditorStyle(filter)}
                      >
                        {filter || 'Original'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="editor-control-group">
                  <label>SEO Alt Text</label>
                  <input 
                    type="text" 
                    value={editorSeoAlt} 
                    onChange={e => setEditorSeoAlt(e.target.value)}
                    placeholder="Descripción para buscadores..."
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>
            </div>

            <div className="photo-editor-footer">
              <button className="btn-secondary" onClick={() => setEditingPhoto(null)}>Cancelar</button>
              <button 
                className={`btn-primary ${photoEditorSaveStatus === 'saved' ? 'success' : ''}`} 
                onClick={savePhotoEdits}
                disabled={photoEditorSaveStatus === 'saving'}
              >
                {photoEditorSaveStatus === 'saving' ? 'Guardando...' : photoEditorSaveStatus === 'saved' ? '¡Guardado!' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
