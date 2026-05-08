'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Blurhash } from 'react-blurhash';
import { getMediaUrl } from '@/lib/media-url';
import { storage } from '@/lib/firebase/config'; // Import estático: garantiza initializeApp() en carga del módulo
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

const LABOR_EMOJIS: Record<string, string> = {
  'poda': '✂️',
  'riego': '💧',
  'abonado': '💩',
  'cosecha': '🧺',
  'siembra': '🌱',
  'trasplante': '🪴',
  'deshierbe': '🌿',
  'fumigacion': '🧪',
  'tutorado': '🎋',
  'limpieza': '🧹',
  'entutorado': '🎋',
  'recoleccion': '🧺',
  'fertilizacion': '💩',
  'tratamiento': '🧪',
  'mantenimiento': '🛠️',
  'control': '🛡️',
  'plaga': '🐛',
  'injerto': '🔪',
  'aclareo': '✂️',
  'escarda': '🌿'
};

const getEmojiForLabor = (nombre: string) => {
  const norm = (nombre || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  for (const [key, emoji] of Object.entries(LABOR_EMOJIS)) {
    if (norm.includes(key)) return emoji;
  }
  return '🌱'; // default
};

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
  const [isLaborOpen, setIsLaborOpen] = useState(true);

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
  const [aiImagePromptPreview, setAiImagePromptPreview] = useState('');
  const [aiImagePromptEdited, setAiImagePromptEdited] = useState(false);
  const [showPromptDetails, setShowPromptDetails] = useState(false);

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

  // PDF State
  const [pdfs, setPdfs] = useState<any[]>([]);
  const [editingPdf, setEditingPdf] = useState<any>(null);
  const [pdfTitle, setPdfTitle] = useState('');
  const [pdfSummary, setPdfSummary] = useState('');
  const [pdfApuntes, setPdfApuntes] = useState('');
  const [pdfEditorSaveStatus, setPdfEditorSaveStatus] = useState<'idle' | 'saving' | 'no-changes'>('idle');
  const [generatingCoverId, setGeneratingCoverId] = useState<number | null>(null);

  // PDF Search State
  const [showPdfSearchModal, setShowPdfSearchModal] = useState(false);
  const [pdfSearchTopic, setPdfSearchTopic] = useState('');
  const [pdfSearchResults, setPdfSearchResults] = useState<any[]>([]);
  const [pdfSearchLoading, setPdfSearchLoading] = useState(false);
  const [pdfSearchError, setPdfSearchError] = useState<string | null>(null);

  useEffect(() => {
    if (laborId && userEmail) {
      loadLabor(laborId);
      loadAttachments(laborId);
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

  const loadAttachments = async (id: string | number) => {
    if (!userEmail) return;
    try {
      const res = await fetch(`/api/admin/labores/${id}/photos`, { headers: { 'x-user-email': userEmail } });
      const data = await res.json();
      setPhotos(data.photos || []);

      const pdfRes = await fetch(`/api/admin/labores/${id}/pdfs`, { headers: { 'x-user-email': userEmail } });
      const pdfData = await pdfRes.json();
      setPdfs(pdfData.pdfs || []);
    } catch (e) {
      console.error(e);
    }
  };



  const handleSearchPdfs = async () => {
    if (!pdfSearchTopic) return;
    setPdfSearchLoading(true);
    setPdfSearchResults([]);
    setPdfSearchError(null);
    try {
      const res = await fetch('/api/ai/pdf-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: pdfSearchTopic, especieNombre: formData.laboresnombre || 'Labor Agrícola' })
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
      console.error(e);
      setPdfSearchError(e.message || 'Error en la conexión con el Asistente IA.');
    } finally {
      setPdfSearchLoading(false);
    }
  };

  const handleAddPdfLink = async (title: string, url: string, summary: string = '', apuntes: string = '') => {
    try {
      const res = await fetch(`/api/admin/labores/${laborId}/pdfs/link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail || '' },
        body: JSON.stringify({ title, url, summary, apuntes })
      });
      const data = await res.json();
      if (data.success) {
        loadAttachments(laborId!);
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

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev: any) => ({ ...prev, [name]: checked ? 1 : 0 }));
    } else {
      setFormData((prev: any) => {
        const newData = { ...prev, [name]: value };
        if (name === 'laboresnombre') {
          newData.laboresicono = getEmojiForLabor(value);
        }
        return newData;
      });
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
        const { ref, uploadBytes } = await import('firebase/storage');
        const fileName = `temp-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`;
        const storagePath = `uploads/temp/${fileName}`;
        const storageRef = ref(storage, storagePath);
        await uploadBytes(storageRef, file);

        await fetch(`/api/admin/labores/${laborId}/photos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail },
          body: JSON.stringify({ rawStoragePath: storagePath, laborNombre: formData.laboresnombre })
        });
      }
      await loadAttachments(laborId);
    } catch (error) {
      console.error('Error uploading file', error);
      alert('Error al subir el archivo');
    } finally {
      setUploadingPhotos(false);
    }
  };

  const buildPromptPreview = () => {
    const nombre = formData.laboresnombre || 'labor';
    const defaultConcept = `Una persona realizando la labor agrícola de ${nombre} en un día soleado en un huerto rural`;
    return `Fotografía profesional documental de alta resolución (8K) tomada con una cámara DSLR.\nSujeto principal: Acción agrícola de ${nombre}.\nEscena concreta: ${aiImageConcept || defaultConcept}.\nComposición: realista, colores naturales, luz de día, entorno rural y agrícola.\nREGLAS ESTRICTAS:\n1. La imagen debe reflejar tareas de jardinería o agricultura.\n2. La fotografía debe parecer tomada por un fotógrafo profesional de estilo de vida o documentales agro.\n3. El entorno debe ser siempre agrícola o de jardín.\n4. NO incluir texto, logotipos ni marcas de agua.\n5. Tono realista, sin aspecto excesivamente artificial ni saturado.`;
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
      const body: any = {
        tipoEntidad: 'labor',
        especieNombre: formData.laboresnombre,
        concept: aiImageConcept
      };
      if (aiImagePromptEdited && aiImagePromptPreview.trim()) {
        body.customPrompt = aiImagePromptPreview;
      }
      const res = await fetch('/api/ai/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.success && data.base64) {
        setAiImageResult(`data:image/jpeg;base64,${data.base64}`);
        if (data.promptUsed) {
          setAiImagePromptPreview(data.promptUsed);
          setAiImagePromptEdited(false);
        }
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
      const { ref, uploadBytes } = await import('firebase/storage');
      const fileName = `temp-ai-labor-${Date.now()}.jpg`;
      const storagePath = `uploads/temp/${fileName}`;
      const storageRef = ref(storage, storagePath);
      await uploadBytes(storageRef, blob);

      await fetch(`/api/admin/labores/${laborId}/photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail },
        body: JSON.stringify({ rawStoragePath: storagePath, laborNombre: formData.laboresnombre })
      });
      await loadAttachments(laborId);
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
    const newPhotos = photos.map(p => ({ ...p, esPrincipal: p.id === photoId ? 1 : 0 }));
    const primaryIdx = newPhotos.findIndex(p => p.id === photoId);
    if (primaryIdx > 0) {
      const [primary] = newPhotos.splice(primaryIdx, 1);
      newPhotos.unshift(primary);
      handleReorderPhotos(newPhotos);
    }
    setPhotos(newPhotos);
    setHeroIndex(0);
    try {
      await fetch(`/api/admin/labores/${laborId}/photos`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail },
        body: JSON.stringify({ photoId, action: 'setPrimary' })
      });
      loadAttachments(laborId);
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
      loadAttachments(laborId);
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
    try { meta = JSON.parse(photo.resumen || '{}'); } catch (e) { }
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
    try { meta = JSON.parse(editingPhoto.resumen || '{}'); } catch (e) { }
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
      loadAttachments(laborId);
      closePhotoEditor();
    } catch (e) {
      alert('Error guardando encuadre');
    } finally {
      setPhotoEditorSaveStatus('idle');
    }
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!laborId || !userEmail) {
      alert('Guarda la labor primero antes de subir documentos.');
      return;
    }
    const files = Array.from(e.target.files || []);
    const validPdfs = files.filter(f => f.type === 'application/pdf');
    if (!validPdfs.length) return;

    try {
      for (const file of validPdfs) {
        const formData = new FormData();
        formData.append('file', file);
        await fetch(`/api/admin/labores/${laborId}/pdfs`, {
          method: 'POST',
          headers: { 'x-user-email': userEmail },
          body: formData
        });
      }
      loadAttachments(laborId);
    } catch (e) {
      console.error(e);
      alert('Error al subir PDF');
    }
  };

  const handleDeletePdf = async (pdfId: number) => {
    if (!confirm('¿Eliminar este PDF permanentemente?') || !laborId || !userEmail) return;
    try {
      await fetch(`/api/admin/labores/${laborId}/pdfs?pdfId=${pdfId}`, {
        method: 'DELETE',
        headers: { 'x-user-email': userEmail }
      });
      loadAttachments(laborId);
    } catch (e) {
      alert('Error eliminando PDF');
    }
  };

  const savePdfEdits = async () => {
    if (!editingPdf || !laborId || !userEmail) return;

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
      await fetch(`/api/admin/labores/${laborId}/pdfs`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail },
        body: JSON.stringify({ pdfId: editingPdf.id, titulo: pdfTitle, resumen: pdfSummary, apuntes: pdfApuntes })
      });
      setEditingPdf(null);
      loadAttachments(laborId);
    } catch {
      alert('❌ Error guardando PDF');
    } finally {
      setPdfEditorSaveStatus('idle');
    }
  };

  const generatePdfCover = async (pdf: any) => {
    if (!laborId || !userEmail) return;
    setGeneratingCoverId(pdf.id);
    try {
      const res = await fetch('/api/ai/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail },
        body: JSON.stringify({
          tipoEntidad: 'documento',
          especieNombre: formData.laboresnombre,
          concept: `Portada del documento agrícola titulado "${pdf.titulo}". Estilo limpio, académico, con ilustración botánica o maquinaria agrícola.`
        })
      });
      const data = await res.json();
      if (data.success && data.base64) {
        await fetch(`/api/admin/labores/${laborId}/pdfs`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail },
          body: JSON.stringify({
            pdfId: pdf.id,
            base64Cover: `data:image/jpeg;base64,${data.base64}`
          })
        });
        await loadAttachments(laborId);
      } else {
        alert(data.error || 'Error generando portada');
      }
    } catch (e) {
      console.error(e);
      alert('Error de conexión al generar portada');
    } finally {
      setGeneratingCoverId(null);
    }
  };

  // ── Drag-to-Pan en el editor de fotos ──
  const editorDragRef = React.useRef<{ dragging: boolean; startX: number; startY: number; startPosX: number; startPosY: number }>({
    dragging: false, startX: 0, startY: 0, startPosX: 50, startPosY: 50
  });

  const onEditorMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    editorDragRef.current = { dragging: true, startX: e.clientX, startY: e.clientY, startPosX: editorX, startPosY: editorY };
    const onMove = (ev: MouseEvent) => {
      if (!editorDragRef.current.dragging) return;
      const dx = ev.clientX - editorDragRef.current.startX;
      const dy = ev.clientY - editorDragRef.current.startY;
      const sensitivity = 0.15 * (100 / Math.max(editorZoom, 100));
      setEditorX(Math.max(0, Math.min(100, editorDragRef.current.startPosX - dx * sensitivity)));
      setEditorY(Math.max(0, Math.min(100, editorDragRef.current.startPosY - dy * sensitivity)));
    };
    const onUp = () => {
      editorDragRef.current.dragging = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const onEditorTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    editorDragRef.current = { dragging: true, startX: t.clientX, startY: t.clientY, startPosX: editorX, startPosY: editorY };
  };

  const onEditorTouchMove = (e: React.TouchEvent) => {
    if (!editorDragRef.current.dragging) return;
    const t = e.touches[0];
    const dx = t.clientX - editorDragRef.current.startX;
    const dy = t.clientY - editorDragRef.current.startY;
    const sensitivity = 0.15 * (100 / Math.max(editorZoom, 100));
    setEditorX(Math.max(0, Math.min(100, editorDragRef.current.startPosX - dx * sensitivity)));
    setEditorY(Math.max(0, Math.min(100, editorDragRef.current.startPosY - dy * sensitivity)));
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
    try { heroMeta = JSON.parse(heroPhoto.resumen || '{}'); } catch (e) { }
  }
  const vibrantColor = heroMeta.vibrant_color || formData.laborescolor || '#10b981';

  return (
    <>
      {/* Floating Save Button */}
      <div style={{ position: 'fixed', bottom: '30px', right: '30px', zIndex: 100, display: 'flex', gap: '12px', transition: 'all 0.3s ease', transform: isDirty ? 'translateY(0)' : 'translateY(100px)', opacity: isDirty ? 1 : 0, pointerEvents: isDirty ? 'auto' : 'none' }}>
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
      <div style={{ marginBottom: '16px', padding: '0 4px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button onClick={() => router.push('/dashboard')} style={{ background: 'white', border: '1px solid #cbd5e1', color: '#475569', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          🏠 Volver al Inicio
        </button>
        <button onClick={goBack} style={{ background: 'white', border: '1px solid #cbd5e1', color: '#475569', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          🌍 Volver a Labores Globales
        </button>
      </div>

      {/* ── Subheader Integrado ── */}
      <div style={{ background: 'linear-gradient(135deg, #b45309, #f59e0b)', borderRadius: '16px', padding: '24px 28px', marginBottom: '24px', color: 'white' }}>
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

      {/* ── Status Bar ── */}
      <div style={{ background: formData.laboresactivosino === 1 ? '#ecfdf5' : '#f1f5f9', borderRadius: '12px', padding: '16px 24px', marginBottom: '24px', border: `1px solid ${formData.laboresactivosino === 1 ? '#10b981' : '#cbd5e1'}`, display: 'flex', alignItems: 'center', justifyContent: 'flex-start', transition: 'all 0.3s' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontWeight: 'bold', color: '#334155', fontSize: '1.1rem', margin: 0 }}>
          <input type="checkbox" name="laboresactivosino" checked={formData.laboresactivosino === 1} onChange={handleFormChange} style={{ width: '22px', height: '22px', accentColor: '#10b981' }} />
          Esta labor está activa y disponible globalmente
        </label>
      </div>

      {/* HERO GALLERY HEADER */}
      <div style={{
        marginBottom: '20px',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        background: vibrantColor ? `linear-gradient(135deg, #f8fafc 0%, ${vibrantColor}18 60%, ${vibrantColor}30 100%)` : '#f8fafc',
        transition: 'background 0.6s ease',
        overflow: 'hidden'
      }}>
        {photos.length > 0 ? (
          <div style={{ display: 'flex', gap: 0 }}>
            {/* Hero photo */}
            <div
              style={{
                position: 'relative', flexShrink: 0, width: '180px', height: '220px', overflow: 'hidden', border: draggedOverHeroPhotoId === -1 ? '4px dashed #10b981' : 'none', opacity: draggedOverHeroPhotoId === -1 ? 0.8 : 1, transition: 'all 0.2s ease'
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
                  <img key={heroPhoto.id} src={getMediaUrl(heroPhoto.ruta)}
                    alt={heroMeta.seo_alt || formData.laboresnombre}
                    style={{
                      width: '100%', height: '100%', objectFit: 'cover',
                      objectPosition: `${heroMeta.profile_object_x ?? 50}% ${heroMeta.profile_object_y ?? 50}%`,
                      transformOrigin: `${heroMeta.profile_object_x ?? 50}% ${heroMeta.profile_object_y ?? 50}%`,
                      transform: `scale(${(heroMeta.profile_object_zoom ?? 100) / 100})`,
                      filter: fullFilter, transition: 'opacity 0.3s ease'
                    }}
                    crossOrigin="anonymous" />
                );
              })()}
            </div>
            {sortedPhotos.filter((_, i) => i !== safeHeroIndex).length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '8px 6px', justifyContent: 'center' }}>
                {sortedPhotos.map((p, i) => ({ p, i })).filter(({ i }) => i !== safeHeroIndex).map(({ p }) => {
                  let tMeta: any = {};
                  try { tMeta = JSON.parse(p.resumen || '{}'); } catch (e) { }
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
                      style={{
                        width: '60px', height: '60px', borderRadius: '8px', overflow: 'hidden', cursor: 'grab', flexShrink: 0,
                        border: draggedOverHeroPhotoId === p.id ? '2px dashed #10b981' : '2px solid rgba(0,0,0,0.08)',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                        transition: 'all 0.2s ease', opacity: draggedHeroPhotoId === p.id ? 0.5 : 1, transform: draggedOverHeroPhotoId === p.id ? 'scale(1.05)' : 'scale(1)'
                      }}
                      onMouseEnter={e => { if (draggedHeroPhotoId === null) e.currentTarget.style.transform = 'scale(1.1)'; }}
                      onMouseLeave={e => { if (draggedHeroPhotoId === null) e.currentTarget.style.transform = 'scale(1)'; }}
                    >
                      <img src={getMediaUrl(p.ruta)} alt="" draggable={false}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: `${tMeta.profile_object_x ?? 50}% ${tMeta.profile_object_y ?? 50}%`, transform: `scale(${(tMeta.profile_object_zoom ?? 100) / 100})` }} crossOrigin="anonymous" />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            {formData.laboresicono && <span style={{ fontSize: '2.5rem' }}>{formData.laboresicono}</span>}
            <h2 style={{ margin: 0, color: '#1e293b' }}>Sin fotos en la galería</h2>
          </div>
        )}
      </div>

      <div className="especie-form-container">
        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="especie-form-body" style={{ margin: 0, width: '100%' }}>

          <div
            className="collapsible-header"
            onClick={() => setIsLaborOpen(!isLaborOpen)}
            style={{ padding: '15px 24px', background: '#e2e8f0', cursor: 'pointer', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <span>
              Ficha de Labor
              {!isLaborOpen && formData.laboresnombre && (
                <span style={{ color: '#475569', marginLeft: '10px', fontWeight: 'normal' }}>
                  — {formData.laboresnombre}
                </span>
              )}
            </span>
            <span>{isLaborOpen ? '▲' : '▼'}</span>
          </div>

          {isLaborOpen && (
            <div className="collapsible-content">
              <div className="form-tabs" style={{ padding: '0', background: 'white', borderBottom: '1px solid #e2e8f0' }}>
                <button type="button" className={activeTab === 'detalles' ? 'active' : ''} onClick={() => setActiveTab('detalles')}>📝 Detalles</button>
                <button type="button" className={activeTab === 'adjuntos' ? 'active' : ''} onClick={() => {
                  if (!laborId) alert('Guarda la labor primero para añadir fotos.');
                  else setActiveTab('adjuntos');
                }}>📎 Documentos Adjuntos ({photos.length}/4)</button>
              </div>

              <div className="form-tab-content">


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
                        <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', color: '#334155', fontSize: '0.95rem' }}>Descripción</label>
                        <textarea name="laboresdescripcion" value={formData.laboresdescripcion} onChange={handleFormChange} rows={4} placeholder="Describe en qué consiste detalladamente la labor..."
                          style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', boxSizing: 'border-box', resize: 'vertical' }} />
                      </div>
                    </div>
                  )}

                  {activeTab === 'adjuntos' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <div className="gallery">
                        {photos.map((p, index) => {
                          let meta: any = {};
                          try { meta = JSON.parse(p.resumen || '{}'); } catch (e) { }
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
                              <img src={getMediaUrl(p.ruta)} alt={meta.seo_alt || 'foto'} loading="lazy" style={{ ...imgStyle, position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }} draggable={false} crossOrigin="anonymous" />
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
                            <input type="file" id="upload-camera-labor" accept="image/*" capture="environment" onChange={handleFileUpload} style={{ display: 'none' }} disabled={uploadingPhotos} />

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

                      <div className="form-group full">
                        <label style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: '16px' }}>
                          <span style={{ margin: 0 }}>Documentos Adicionales (PDF)</span>
                          <label htmlFor="upload-pdfs" style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: 'white', border: 'none', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)', margin: 0 }}>
                            <span style={{ fontSize: '1.2rem', marginBottom: '2px' }}>+</span> Añadir PDF
                          </label>
                          <input type="file" id="upload-pdfs" multiple accept="application/pdf" onChange={handlePdfUpload} style={{ display: 'none' }} />
                          <button type="button" onClick={() => setShowPdfSearchModal(true)} style={{ background: 'linear-gradient(135deg, #a855f7 0%, #8b5cf6 100%)', color: 'white', border: 'none', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', boxShadow: '0 2px 4px rgba(168, 85, 247, 0.3)', margin: 0 }}>
                            <span style={{ fontSize: '1.2rem', marginBottom: '2px' }}>✨</span> Buscar PDFs con IA
                          </button>
                        </label>
                        <div className="gallery pdfs">
                          {pdfs.map(p => (
                            <div key={p.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
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
                                <div style={{ position: 'absolute', top: '6px', right: '6px', display: 'flex', gap: '4px' }}>
                                  <button type="button" style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: 'white', borderRadius: '4px', border: 'none', padding: '4px 6px', fontSize: '0.8rem', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.25)' }} onClick={() => { setEditingPdf(p); setPdfTitle(p.titulo || ''); setPdfSummary(p.resumen || ''); setPdfApuntes(p.apuntes || ''); }} title="Editar Metadatos">✏️</button>
                                  <button type="button" style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: 'white', borderRadius: '4px', border: 'none', padding: '4px 6px', fontSize: '0.8rem', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.25)' }} onClick={() => handleDeletePdf(p.id)} title="Eliminar Documento">✕</button>
                                </div>
                                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.6)', padding: '6px', backdropFilter: 'blur(2px)' }}>
                                  <a href={getMediaUrl(p.ruta)} target="_blank" rel="noopener noreferrer" style={{ color: 'white', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 'bold', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    📄 {p.titulo || p.nombreOriginal}
                                  </a>
                                </div>
                              </div>
                            </div>
                          ))}
                          {pdfs.length === 0 && (
                            <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem', gridColumn: '1 / -1', border: '2px dashed #e2e8f0', borderRadius: '12px' }}>
                              No hay documentos PDF adjuntos.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* EDITOR DE FOTOS MODAL */}
      {editingPhoto && (
        <div className="photo-editor-overlay">
          <div className="photo-editor-content" onClick={e => e.stopPropagation()}>
            <div className="photo-editor-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0 }}>Ajustar Fotografía y SEO</h3>
                <small style={{ color: '#64748b', fontSize: '0.75rem', display: 'block', marginTop: '4px' }}>
                  📄 {editingPhoto.ruta.split('/').pop()}
                </small>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <button type="button" onClick={closePhotoEditor} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white', color: '#475569', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>Cerrar</button>
                {(() => {
                  const currentState = JSON.stringify({ x: editorX, y: editorY, z: editorZoom, b: editorBrightness, c: editorContrast, s: editorStyle, alt: editorSeoAlt });
                  if (currentState !== editorInitialState) {
                    return (
                      <button
                        type="button"
                        onClick={handleSavePhotoEditor}
                        className={`btn-primary ${photoEditorSaveStatus === 'no-changes' ? 'success' : ''}`}
                        style={{ padding: '8px 16px', fontSize: '0.9rem', margin: 0 }}
                        disabled={photoEditorSaveStatus === 'saving'}
                      >
                        {photoEditorSaveStatus === 'saving' ? '⏳ Guardando...' : photoEditorSaveStatus === 'no-changes' ? '✓ Sin cambios' : '💾 Guardar Cambios'}
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
                      filter: `brightness(${editorBrightness}%) contrast(${editorContrast}%) ${editorStyle ? STYLE_FILTERS[editorStyle] : ''}`.trim()
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{ margin: 0 }}>
                      <span className="control-label" style={{ margin: 0 }}>🌗 Contraste ({editorContrast}%)</span>
                    </label>
                  </div>
                  <input type="range" min="50" max="150" value={editorContrast} onChange={e => setEditorContrast(Number(e.target.value))} />
                </div>

                <div style={{ marginBottom: '15px', display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setEditorBrightness(110);
                      setEditorContrast(115);
                      setEditorStyle('');
                    }}
                    style={{
                      flex: 1,
                      padding: '10px',
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      fontSize: '0.8rem'
                    }}
                  >
                    🪄 Auto-Mejora
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditorX(50); setEditorY(50); setEditorZoom(100);
                      setEditorBrightness(100); setEditorContrast(100); setEditorStyle('');
                    }}
                    style={{
                      flex: 1,
                      padding: '10px',
                      background: '#f1f5f9',
                      color: '#475569',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      fontSize: '0.8rem'
                    }}
                  >
                    ↻ Reset Todo
                  </button>
                </div>

                <div className="editor-control-group" style={{ marginBottom: '15px' }}>
                  <label>
                    <span className="control-label">🎨 Estilos y Filtros de IA</span>
                  </label>
                  <select
                    value={editorStyle}
                    onChange={e => setEditorStyle(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', color: '#334155', background: 'white' }}
                  >
                    <option value="">Sin Filtro (Original)</option>
                    <option value="vibrant">Saturado (Vibrant)</option>
                    <option value="vintage">Vintage (Cálido)</option>
                    <option value="cinematic">Cinemático (Dramatic)</option>
                    <option value="bnw">Blanco y Negro (Clásico)</option>
                    <option value="fade">Desaturado (Fade)</option>
                  </select>
                </div>

                <div className="editor-control-group">
                  <label>
                    <span className="control-label">📝 Texto Alternativo SEO (Alt Tag)</span>
                  </label>
                  <textarea
                    value={editorSeoAlt}
                    onChange={e => setEditorSeoAlt(e.target.value)}
                    rows={2}
                    placeholder="Descripción para SEO e invidentes..."
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', resize: 'vertical' }}
                  />
                  <small style={{ color: '#64748b', fontSize: '0.7rem', display: 'block', marginTop: '4px' }}>
                    * El alt-text es fundamental para que Verdantia aparezca en Google Images.
                  </small>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* AI Image Generator Modal */}
      {showAiImageModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.85)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', padding: '20px' }}>
          <div style={{ background: 'white', borderRadius: '20px', width: '100%', maxWidth: '600px', display: 'flex', flexDirection: 'column', maxHeight: '90vh', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', background: 'linear-gradient(to right, #f8fafc, #f1f5f9)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1.5rem' }}>✨</span> Generador IA (Imagen 4.0)
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748b' }}>Labor: <strong>{formData.laboresnombre || 'Sin nombre'}</strong></p>
              </div>
              <button onClick={() => setShowAiImageModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', color: '#94a3b8', cursor: 'pointer' }}>&times;</button>
            </div>

            <div style={{ padding: '24px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {!aiImageResult ? (
                <>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#334155' }}>
                      ¿Qué está pasando en la foto?
                    </label>
                    <textarea
                      value={aiImageConcept}
                      onChange={e => { setAiImageConcept(e.target.value); if (!aiImagePromptEdited) setAiImagePromptPreview(buildPromptPreview()); }}
                      placeholder="Ej. Una persona con sombrero de paja regando con una regadera en un huerto soleado..."
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
                        "Una persona realizando esta labor en un día soleado",
                        "Plano detalle (macro) de las herramientas o elementos usados",
                        "Vista general de un huerto después de realizar esta labor",
                        "Fotografía conceptual de la acción"
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
                      disabled={uploadingPhotos}
                      style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: '#10b981', color: 'white', fontWeight: 'bold', cursor: uploadingPhotos ? 'not-allowed' : 'pointer', opacity: uploadingPhotos ? 0.7 : 1 }}
                    >
                      {uploadingPhotos ? 'Guardando...' : 'Guardar en Galería'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
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
                    🚜 Labor: {formData.laboresnombre || 'Sin nombre'}
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
                    {pdfEditorSaveStatus === 'saving' ? '⏳ Guardando...' : '💾 Guardar Metadatos'}
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}
      {showPdfSearchModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(6px)' }}
          onClick={() => setShowPdfSearchModal(false)}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '24px', maxWidth: '600px', width: '95%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', gap: '20px' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                ✨ Asistente IA de Documentos
              </h3>
              <button type="button" onClick={() => setShowPdfSearchModal(false)} style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}>✕</button>
            </div>

            <p style={{ margin: 0, fontSize: '0.95rem', color: '#475569' }}>
              Dile a la Inteligencia Artificial qué tipo de documento necesitas buscar sobre la labor <strong>{formData.laboresnombre}</strong> (ej. <em>"guía de poda"</em>, <em>"manual INTA"</em>, <em>"buenas prácticas"</em>).
            </p>

            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                value={pdfSearchTopic}
                onChange={e => setPdfSearchTopic(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearchPdfs()}
                placeholder="Ej. manual de poda..."
                style={{ flex: 1, padding: '12px', border: '2px solid #cbd5e1', borderRadius: '8px', fontSize: '1rem', outline: 'none' }}
              />
              <button
                type="button"
                onClick={handleSearchPdfs}
                disabled={pdfSearchLoading || !pdfSearchTopic}
                style={{ padding: '0 24px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: pdfSearchLoading ? 'wait' : 'pointer', opacity: (!pdfSearchTopic || pdfSearchLoading) ? 0.6 : 1 }}
              >
                {pdfSearchLoading ? '⏳' : 'Buscar'}
              </button>
            </div>

            {pdfSearchError && (
              <div style={{ padding: '12px', background: '#fef2f2', color: '#b91c1c', borderRadius: '8px', fontSize: '0.9rem', border: '1px solid #fecaca' }}>
                {pdfSearchError}
              </div>
            )}

            {pdfSearchResults.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h4 style={{ margin: '0 0 4px 0', color: '#334155' }}>Resultados encontrados:</h4>
                {pdfSearchResults.map((link, idx) => (
                  <div key={idx} style={{ padding: '16px', border: '1px solid #e2e8f0', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '8px', background: '#f8fafc' }}>
                    <h5 style={{ margin: 0, color: '#0f172a', fontSize: '1.05rem', lineHeight: '1.3' }}>{link.title}</h5>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', wordBreak: 'break-all' }}>{link.url}</p>
                    {link.summary && <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', color: '#475569', fontStyle: 'italic' }}>"{link.summary}"</p>}

                    <button
                      type="button"
                      onClick={() => handleAddPdfLink(link.title, link.url, link.summary || '')}
                      style={{ marginTop: '8px', padding: '8px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', alignSelf: 'flex-start', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <span>📥</span> Adjuntar a {formData.laboresnombre}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
