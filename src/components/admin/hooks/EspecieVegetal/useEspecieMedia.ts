import { useState, useRef, useEffect } from 'react';
import { storage } from '@/lib/firebase/config';

interface UseEspecieMediaProps {
  especieId: string | null;
  userEmail: string | null;
  formData: any;
}

export const useEspecieMedia = ({ especieId, userEmail, formData }: UseEspecieMediaProps) => {
  const [photos, setPhotos] = useState<any[]>([]);
  const [activeFotoId, setActiveFotoId] = useState<number | string | null>(null);

  const [pdfs, setPdfs] = useState<any[]>([]);
  const [blogs, setBlogs] = useState<any[]>([]);

  const [dragOverPhotos, setDragOverPhotos] = useState(false);
  const [dragOverPdfs, setDragOverPdfs] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [uploadingPdfs, setUploadingPdfs] = useState(false);
  const [draggedPhotoIndex, setDraggedPhotoIndex] = useState<number | null>(null);
  const [draggedOverPhotoIndex, setDraggedOverPhotoIndex] = useState<number | null>(null);

  // Hero Carousel Drag State
  const [draggedHeroPhotoId, setDraggedHeroPhotoId] = useState<number | null>(null);
  const [draggedOverHeroPhotoId, setDraggedOverHeroPhotoId] = useState<number | null>(null);

  // Photo Editor State
  const [editingPhoto, setEditingPhoto] = useState<any>(null);
  const [photoEditorSaveStatus, setPhotoEditorSaveStatus] = useState<'idle' | 'saving' | 'no-changes'>('idle');
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string | number; type: string; url?: string } | null>(null);
  const [heroIndex, setHeroIndex] = useState(0);

  // PDF Editor State
  const [editingPdf, setEditingPdf] = useState<any>(null);
  const [pdfTitle, setPdfTitle] = useState('');
  const [pdfSummary, setPdfSummary] = useState('');
  const [pdfApuntes, setPdfApuntes] = useState('');
  const [pdfEditorSaveStatus, setPdfEditorSaveStatus] = useState<'idle' | 'saving' | 'no-changes'>('idle');

  // AI PDF Search State
  const [showPdfSearchModal, setShowPdfSearchModal] = useState(false);
  const [pdfSearchTopic, setPdfSearchTopic] = useState('');
  const [pdfSearchResults, setPdfSearchResults] = useState<{ title: string, url: string, summary?: string, apuntes?: string }[]>([]);
  const [pdfSearchLoading, setPdfSearchLoading] = useState(false);
  const [pdfSearchError, setPdfSearchError] = useState<string | null>(null);

  // Blog Generator State
  const [blogGenPdf, setBlogGenPdf] = useState<any>(null);
  const [blogGenInstructions, setBlogGenInstructions] = useState('Escribe un post de blog para agricultores principiantes, con un tono motivador, consejos prácticos, emojis y una buena estructura de Markdown.');
  const [blogGenLoading, setBlogGenLoading] = useState(false);
  const [blogGenProgress, setBlogGenProgress] = useState('Iniciando motor de IA...');
  const [showBlogPrompt, setShowBlogPrompt] = useState(false);

  const [generatingCoverId, setGeneratingCoverId] = useState<string | number | null>(null);

  useEffect(() => {
    if (photos.length > 0 && !activeFotoId) {
      const portada = photos.find(p => {
        try {
          const res = JSON.parse(p.resumen || '{}');
          return res.profile_style?.isPortada || p.esPrincipal === 1;
        } catch { return p.esPrincipal === 1; }
      });
      setActiveFotoId(portada ? portada.id : photos[0].id);
    } else if (photos.length === 0 && activeFotoId) {
      setActiveFotoId(null);
    }
  }, [photos, activeFotoId]);

  const loadAttachments = async (id: string) => {
    if (!userEmail) return;

    await Promise.allSettled([
      fetch(`/api/admin/especiesvegetales/${id}/photos`, { headers: { 'x-user-email': userEmail } })
        .then(res => res.json())
        .then(data => setPhotos(data.photos || []))
        .catch(e => console.error('Error cargando fotos:', e)),

      fetch(`/api/admin/especiesvegetales/${id}/pdfs`, { headers: { 'x-user-email': userEmail } })
        .then(res => res.json())
        .then(data => setPdfs(data.pdfs || []))
        .catch(e => console.error('Error cargando PDFs:', e)),

      fetch(`/api/admin/especiesvegetales/${id}/blogs`, { headers: { 'x-user-email': userEmail } })
        .then(res => res.json())
        .then(data => setBlogs(data.data || []))
        .catch(e => console.error('Error cargando blogs:', e))
    ]);
  };

  const generatePdfCover = async (pdf: any) => {
    setGeneratingCoverId(pdf.id);
    try {
      const res = await fetch('/api/ai/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail || '' },
        body: JSON.stringify({
          tipoEntidad: 'documento',
          especieNombre: formData.especiesvegetalesnombre,
          concept: `Portada del documento titulado "${pdf.titulo}". Estilo limpio, académico, con ilustración botánica. Contenido principal: ${pdf.resumen}`
        })
      });
      const data = await res.json();
      if (data.success && data.base64) {
        await fetch(`/api/admin/especiesvegetales/${especieId}/pdfs`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail || '' },
          body: JSON.stringify({
            pdfId: pdf.id,
            base64Cover: `data:image/jpeg;base64,${data.base64}`
          })
        });

        if (especieId) {
          await loadAttachments(especieId);
        }

        setEditingPdf((prev: any) => {
          if (prev && prev.id === pdf.id) {
            return { ...prev, portada: `data:image/jpeg;base64,${data.base64}` };
          }
          return prev;
        });
      }
    } catch (error) {
      console.error('Error generando portada:', error);
    } finally {
      setGeneratingCoverId(null);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement> | any, type: 'photos' | 'pdfs') => {
    if (!especieId) {
      alert('Guarda la especie primero antes de subir archivos.');
      return;
    }
    const files = e.target ? e.target.files : e;
    if (!files || files.length === 0) return;

    if (type === 'photos') {
      const remainingSlots = 4 - photos.length;
      if (files.length > remainingSlots) {
        alert(`Solo puedes subir ${remainingSlots} fotos más (Límite estricto de 4).`);
        return;
      }
      setUploadingPhotos(true);
    } else {
      setUploadingPdfs(true);
    }

    try {
      let imageCompression: any = null;
      let storageApi: typeof import('firebase/storage') | null = null;
      let clientStorage: any = null;

      if (type === 'photos') {
        imageCompression = (await import('browser-image-compression')).default;
        clientStorage = storage;
        storageApi = await import('firebase/storage');
      }

      for (let i = 0; i < files.length; i++) {
        let file = files[i];

        if (type === 'photos') {
          const lowerName = (file.name || '').toLowerCase();
          const lowerType = (file.type || '').toLowerCase();
          const isHeicLike =
            lowerName.endsWith('.heic') ||
            lowerName.endsWith('.heif') ||
            lowerType === 'image/heic' ||
            lowerType === 'image/heif' ||
            lowerType === 'image/heic-sequence' ||
            lowerType === 'image/heif-sequence';

          if (isHeicLike) {
            try {
              const heic2any = (await import('heic2any')).default;
              const convertedBlob = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.8 });
              const blobArray = Array.isArray(convertedBlob) ? convertedBlob : [convertedBlob];
              const convertedName = (file.name || 'foto.heic').replace(/\.(heic|heif)$/i, '.jpg');
              file = new File(blobArray, convertedName, { type: 'image/jpeg' });
            } catch (error) {
              console.error('Error convirtiendo HEIC/HEIF', error);
              throw new Error('No se pudo convertir la foto HEIC/HEIF. Intenta subirla desde Galería como JPG o PNG.');
            }
          }

          if (imageCompression && file.type.startsWith('image/')) {
            try {
              file = await imageCompression(file, { maxSizeMB: 1, maxWidthOrHeight: 2048, useWebWorker: true });
            } catch (error) {
              console.error('Error en compresión pre-subida', error);
            }
          }
        }

        if (type === 'photos') {
          if (!storageApi || !clientStorage) {
            throw new Error('Firebase Storage no inicializado');
          }
          const { ref, uploadBytes } = storageApi;
          const fileName = `temp-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`;
          const storagePath = `uploads/temp/${fileName}`;
          const storageRef = ref(clientStorage, storagePath);
          await uploadBytes(storageRef, file);

          const res = await fetch(`/api/admin/especiesvegetales/${especieId}/photos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail || '' },
            body: JSON.stringify({
              rawStoragePath: storagePath,
              especieNombre: formData.especiesvegetalesnombre || 'especie'
            })
          });
          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || `HTTP Error ${res.status}`);
          }
        } else {
          const fd = new FormData();
          fd.append('file', file);
          fd.append('especieNombre', formData.especiesvegetalesnombre || '');
          const res = await fetch(`/api/admin/especiesvegetales/${especieId}/${type}`, {
            method: 'POST',
            headers: { 'x-user-email': userEmail || '' },
            body: fd
          });
          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || `HTTP Error ${res.status}`);
          }

          if (type === 'pdfs') {
            const data = await res.json();
            if (data.success && data.pdf && !data.pdf.portada) {
              generatePdfCover(data.pdf);
            }
          }
        }
      }
      await loadAttachments(especieId);
    } catch (err: any) {
      console.error('UPLOAD ERROR:', err);
      alert('Error al subir archivos: ' + err.message);
    } finally {
      if (type === 'photos') setUploadingPhotos(false);
      else setUploadingPdfs(false);
      if (e?.target && e.target.value) e.target.value = '';
    }
  };

  const handleSetPrimaryPhoto = async (photoId: string | number) => {
    setActiveFotoId(photoId); // optimistic
    const newPhotos = photos.map(p => ({
      ...p,
      esPrincipal: p.id === photoId ? 1 : 0
    }));
    setPhotos(newPhotos);

    if (!userEmail || !especieId) return;
    try {
      await fetch(`/api/admin/especiesvegetales/${especieId}/photos`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail },
        body: JSON.stringify({ photoId, action: 'setPrimary' })
      });
      loadAttachments(especieId);
    } catch {
      alert('Error al fijar la portada');
    }
  };

  const handleReorderPhotos = async (newPhotos: any[]) => {
    setPhotos(newPhotos); // Optimistic UI update
    if (!userEmail || !especieId) return;
    try {
      const reorderPayload = newPhotos.map((p, index) => ({ id: p.id, orden: index + 1 }));
      await fetch(`/api/admin/especiesvegetales/${especieId}/photos/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail },
        body: JSON.stringify({ photos: reorderPayload })
      });
    } catch (e) {
      console.error(e);
      alert('Error reordenando fotos');
    }
  };

  const handlePhotoReorder = (e?: React.DragEvent) => {
    if (e) e.preventDefault();
    if (draggedPhotoIndex !== null && draggedOverPhotoIndex !== null && draggedPhotoIndex !== draggedOverPhotoIndex) {
      const newPhotos = [...photos];
      const draggedItem = newPhotos[draggedPhotoIndex];
      const draggedOverItem = newPhotos[draggedOverPhotoIndex];

      // Intercambiar (swap)
      newPhotos[draggedPhotoIndex] = draggedOverItem;
      newPhotos[draggedOverPhotoIndex] = draggedItem;

      // Actualizar cuál es la principal visualmente
      newPhotos.forEach((p, idx) => {
        p.esPrincipal = (idx === 0 ? 1 : 0);
      });

      handleReorderPhotos(newPhotos);

      // Si la foto en la posición 0 ha cambiado, actualizar en BD
      const newPrimary = newPhotos[0];
      if (newPrimary.id !== photos[0].id) {
        handleSetPrimaryPhoto(newPrimary.id);
      }
    }
    setDraggedPhotoIndex(null);
    setDraggedOverPhotoIndex(null);
  };

  const savePhotoEdits = async (metadata: any) => {
    if (!editingPhoto || !especieId) return;
    if (metadata.noChanges) {
      setPhotoEditorSaveStatus('no-changes');
      setTimeout(() => setPhotoEditorSaveStatus('idle'), 1500);
      return;
    }
    setPhotoEditorSaveStatus('saving');

    // Preserve existing non-editor fields (dominant_color, vibrant_color, blurhash, exif_data, etc.)
    let existingMeta: any = {};
    try {
      if (editingPhoto.resumen) {
        existingMeta = typeof editingPhoto.resumen === 'string'
          ? JSON.parse(editingPhoto.resumen)
          : editingPhoto.resumen;
      }
    } catch {}
    const mergedMeta = { ...existingMeta, ...metadata };
    const resumen = JSON.stringify(mergedMeta);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const res = await fetch(`/api/admin/especiesvegetales/${especieId}/photos`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': userEmail || ''
        },
        body: JSON.stringify({ photoId: editingPhoto.id, action: 'updateMeta', resumen }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Error ${res.status}`);
      }
      loadAttachments(especieId);
      return true;
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.error(err);
      const msg = err.name === 'AbortError' ? 'Tiempo de espera agotado (10s)' : err.message;
      alert('❌ Error guardando ajustes: ' + msg);
      return false;
    } finally {
      setPhotoEditorSaveStatus('idle');
    }
  };

  const savePdfEdits = async () => {
    if (!editingPdf || !especieId) return;

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
      await fetch(`/api/admin/especiesvegetales/${especieId}/pdfs`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': userEmail || ''
        },
        body: JSON.stringify({ pdfId: editingPdf.id, titulo: pdfTitle, resumen: pdfSummary, apuntes: pdfApuntes })
      });
      setEditingPdf(null);
      loadAttachments(especieId);
    } catch {
      alert('❌ Error guardando PDF');
    } finally {
      setPdfEditorSaveStatus('idle');
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    const { id, type } = deleteConfirm;
    setDeleteConfirm(null);
    try {
      const url = type === 'photos'
        ? `/api/admin/especiesvegetales/${especieId}/photos?photoId=${id}`
        : `/api/admin/especiesvegetales/${especieId}/pdfs?pdfId=${id}`;
      const res = await fetch(url, {
        method: 'DELETE',
        headers: { 'x-user-email': userEmail || '' }
      });
      const data = await res.json();
      if (data.success) {
        if (type === 'photos') setPhotos(prev => prev.filter(p => p.id !== id));
        if (type === 'pdfs') setPdfs(prev => prev.filter(p => p.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRunPdfSearch = async () => {
    if (!pdfSearchTopic.trim() || !especieId) return;
    setPdfSearchLoading(true);
    setPdfSearchError(null);
    setPdfSearchResults([]);
    try {
      const res = await fetch('/api/ai/pdf-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail || '' },
        body: JSON.stringify({ especieId, question: pdfSearchTopic })
      });
      const data = await res.json();
      if (data.success) {
        setPdfSearchResults(data.results || []);
      } else {
        setPdfSearchError(data.error || 'No se encontraron resultados relevantes en los PDFs.');
      }
    } catch (err: any) {
      setPdfSearchError(err.message || 'Error de conexión al buscar en PDFs.');
    } finally {
      setPdfSearchLoading(false);
    }
  };

  const handleGenerateBlog = async () => {
    if (!blogGenPdf) return;
    setBlogGenLoading(true);
    setBlogGenProgress('Preparando y leyendo el documento PDF...');
    try {
      const evtSource = new EventSource(`/api/ai/generate-blog?pdfId=${blogGenPdf.id}&instructions=${encodeURIComponent(blogGenInstructions)}`);

      evtSource.onmessage = (e) => {
        const data = JSON.parse(e.data);

        if (data.status === 'reading') setBlogGenProgress('Leyendo contenido del documento (OCR)...');
        else if (data.status === 'thinking') setBlogGenProgress('Generando estructura del blog con IA...');
        else if (data.status === 'writing') setBlogGenProgress('Escribiendo contenido detallado en formato Markdown...');
        else if (data.status === 'done') {
          evtSource.close();
          setBlogGenProgress('¡Post generado con éxito!');
          setTimeout(() => {
            setShowBlogPrompt(false);
            setBlogGenLoading(false);
            if (especieId) loadAttachments(especieId);
          }, 1500);
        } else if (data.status === 'error') {
          evtSource.close();
          alert('Error: ' + data.message);
          setBlogGenLoading(false);
        }
      };

      evtSource.onerror = () => {
        evtSource.close();
        alert('Error de conexión durante la generación.');
        setBlogGenLoading(false);
      };
    } catch (error) {
      console.error(error);
      alert('Error iniciando la generación del blog.');
      setBlogGenLoading(false);
    }
  };

  return {
    photos, setPhotos,
    activeFotoId, setActiveFotoId,
    pdfs, setPdfs,
    blogs, setBlogs,
    dragOverPhotos, setDragOverPhotos,
    dragOverPdfs, setDragOverPdfs,
    uploadingPhotos, setUploadingPhotos,
    uploadingPdfs, setUploadingPdfs,
    draggedPhotoIndex, setDraggedPhotoIndex,
    draggedOverPhotoIndex, setDraggedOverPhotoIndex,
    draggedHeroPhotoId, setDraggedHeroPhotoId,
    draggedOverHeroPhotoId, setDraggedOverHeroPhotoId,
    editingPhoto, setEditingPhoto,
    photoEditorSaveStatus, setPhotoEditorSaveStatus,
    deleteConfirm, setDeleteConfirm,
    heroIndex, setHeroIndex,
    editingPdf, setEditingPdf,
    pdfTitle, setPdfTitle,
    pdfSummary, setPdfSummary,
    pdfApuntes, setPdfApuntes,
    pdfEditorSaveStatus, setPdfEditorSaveStatus,
    showPdfSearchModal, setShowPdfSearchModal,
    pdfSearchTopic, setPdfSearchTopic,
    pdfSearchResults, setPdfSearchResults,
    pdfSearchLoading, setPdfSearchLoading,
    pdfSearchError, setPdfSearchError,
    blogGenPdf, setBlogGenPdf,
    blogGenInstructions, setBlogGenInstructions,
    blogGenLoading, setBlogGenLoading,
    blogGenProgress, setBlogGenProgress,
    showBlogPrompt, setShowBlogPrompt,
    generatingCoverId, setGeneratingCoverId,

    loadAttachments,
    handleFileUpload,
    handleSetPrimaryPhoto,
    handleReorderPhotos,
    handlePhotoReorder,
    savePhotoEdits,
    savePdfEdits,
    confirmDelete,
    handleRunPdfSearch,
    handleGenerateBlog,
    generatePdfCover
  };
};
