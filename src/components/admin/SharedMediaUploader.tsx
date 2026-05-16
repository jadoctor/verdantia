'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Blurhash } from 'react-blurhash';
import { getMediaUrl } from '@/lib/media-url';
import { storage } from '@/lib/firebase/config'; // Import estático: garantiza initializeApp() en carga del módulo
import './EspecieForm.css';

interface SharedMediaUploaderProps {
  entityId: string | null;
  entityType: 'especies' | 'variedades' | 'labores';
  userEmail: string | null;
}

const MESES = [
  { val: 1, label: 'Ene' }, { val: 2, label: 'Feb' }, { val: 3, label: 'Mar' },
  { val: 4, label: 'Abr' }, { val: 5, label: 'May' }, { val: 6, label: 'Jun' },
  { val: 7, label: 'Jul' }, { val: 8, label: 'Ago' }, { val: 9, label: 'Sep' },
  { val: 10, label: 'Oct' }, { val: 11, label: 'Nov' }, { val: 12, label: 'Dic' }
];

const TIPOS = ['hortaliza', 'fruta', 'aromatica', 'leguminosa', 'cereal', 'otra'];
const CICLOS = ['anual', 'bianual', 'perenne'];

export default function SharedMediaUploader({ entityId, entityType, userEmail }: SharedMediaUploaderProps) {
  const router = useRouter();

  const defaultFormData = {
    especiesnombre: '', especiesnombrecientifico: '', especiesfamilia: '',
    especiestipo: [], especiesciclo: [], especiescolor: '', especiestamano: 'mediano',
    especiesdiasgerminacion: '', especiesdiashastatrasplante: '', especiesviabilidadsemilla: '', 
    especiesdiashastafructificacion: '', especiesdiashastarecoleccion: '',
    especiestemperaturaminima: '', especiestemperaturaoptima: '',
    especiesmarcoplantas: '', especiesmarcofilas: '', especiesprofundidadsiembra: '',
    especiesfechasemillerodesde: '', especiesfechasemillerohasta: '',
    especiesfechasiembradirectadesde: '', especiesfechasiembradirectahasta: '',
    especiestrasplantedesde: '', especiestrasplantehasta: '',
    especiesfecharecolecciondesde: '', especiesfecharecoleccionhasta: '',
    especieshistoria: '', especiesdescripcion: '', especiesfuentesinformacion: '',
    especiesautosuficiencia: '', especiesautosuficienciaparcial: '', especiesautosuficienciaconserva: '', especiesvisibilidadsino: 1,
    especiesicono: '',
    especiesbiodinamicacategoria: '', especiesbiodinamicanotas: '',
    especiesprofundidadtrasplante: '', especiesphsuelo: '', especiesnecesidadriego: '',
    especiestiposiembra: '', especiesvolumenmaceta: '', especiesluzsolar: '',
    especiescaracteristicassuelo: '', especiesdificultad: '', especiestemperaturamaxima: ''
  };

  const [formData, setFormData] = useState<any>(defaultFormData);
  const [initialData, setInitialData] = useState<any>(defaultFormData);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'no-changes'>('idle');
  const [relaciones, setRelaciones] = useState<{ beneficiosas: any[]; perjudiciales: any[]; plagas: any[] }>({ beneficiosas: [], perjudiciales: [], plagas: [] });
  const [initialRelaciones, setInitialRelaciones] = useState<{ beneficiosas: any[]; perjudiciales: any[]; plagas: any[] }>({ beneficiosas: [], perjudiciales: [], plagas: [] });
  const [relacionesDirty, setRelacionesDirty] = useState(false);
  const [relacionesSaveStatus, setRelacionesSaveStatus] = useState<'idle' | 'saving' | 'no-changes'>('idle');

  const isFormDirty = JSON.stringify(formData) !== JSON.stringify(initialData);
  const isDirty = isFormDirty || relacionesDirty;
  
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('taxonomia');
  const [isEspecieOpen, setIsEspecieOpen] = useState(true);
  const [isPautasOpen, setIsPautasOpen] = useState(false);
  const [calcPersonas, setCalcPersonas] = useState<number>(1);
  const [aiProposal, setAiProposal] = useState<any>(null);
  const [selectedRels, setSelectedRels] = useState<{ ben: any[], per: any[], pla: any[] }>({ ben: [], per: [], pla: [] });
  const [showAiModal, setShowAiModal] = useState(false);
  const [isAssimilatingRels, setIsAssimilatingRels] = useState(false);
  const [photos, setPhotos] = useState<any[]>([]);
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

  // -- Relaciones State --
  const [masterEspecies, setMasterEspecies] = useState<any[]>([]);
  const [masterPlagas, setMasterPlagas] = useState<any[]>([]);

  // -- Sinonimos State --
  const [sinonimos, setSinonimos] = useState<any[]>([]);
  const [initialSinonimos, setInitialSinonimos] = useState<any[]>([]);
  const [sinonimosDirty, setSinonimosDirty] = useState(false);
  const [masterIdiomas, setMasterIdiomas] = useState<any[]>([]);
  const [masterPaises, setMasterPaises] = useState<any[]>([]);
  const [sinonimosAiLoading, setSinonimosAiLoading] = useState(false);
  const [sinonimosAiSeconds, setSinonimosAiSeconds] = useState(0);
  const sinonimosTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [showSinonimosAiModal, setShowSinonimosAiModal] = useState(false);
  const [aiSinonimosProposal, setAiSinonimosProposal] = useState<any[]>([]);

  // -- Synonym AI Config Panel --
  const [showSinonimosConfig, setShowSinonimosConfig] = useState(false);
  const [sinConfigPromptOpen, setSinConfigPromptOpen] = useState(false);
  const [sinSelectedScope, setSinSelectedScope] = useState<string>('general');
  const [sinExtraInstructions, setSinExtraInstructions] = useState('Busca sinónimos en español de Latinoamérica y principales idiomas mundiales. Incluye variantes regionales donde el nombre sea diferente al principal.');
  const sinScopePresets: Record<string, string> = {
    general: 'Busca sinónimos en español de Latinoamérica y principales idiomas mundiales. Incluye variantes regionales donde el nombre sea diferente al principal.',
    cooficiales: 'Busca sinónimos en las lenguas cooficiales de España: Valenciano, Gallego y Euskera. Prioriza nombres tradicionales peninsulares.',
    europa: 'Busca sinónimos en idiomas europeos: Francés, Italiano, Portugués, Alemán e Inglés. Asocia cada nombre a su país correspondiente.'
  };

  // -- Photo Editor State --
  const [editingPhoto, setEditingPhoto] = useState<any>(null);
  const [editorX, setEditorX] = useState(50);
  const [editorY, setEditorY] = useState(38);
  const [editorZoom, setEditorZoom] = useState(100);
  const [editorBrightness, setEditorBrightness] = useState(100);
  const [editorContrast, setEditorContrast] = useState(100);
  const [editorStyle, setEditorStyle] = useState('');
  const [editorSeoAlt, setEditorSeoAlt] = useState('');
  const [editorInitialState, setEditorInitialState] = useState('');
  const [photoEditorSaveStatus, setPhotoEditorSaveStatus] = useState<'idle' | 'saving' | 'no-changes'>('idle');
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; type: 'photos' | 'pdfs' } | null>(null);
  const [heroIndex, setHeroIndex] = useState(0);

  // -- PDF Editor State --
  const [editingPdf, setEditingPdf] = useState<any>(null);
  const [pdfTitle, setPdfTitle] = useState('');
  const [pdfSummary, setPdfSummary] = useState('');
  const [pdfApuntes, setPdfApuntes] = useState('');
  const [pdfEditorSaveStatus, setPdfEditorSaveStatus] = useState<'idle' | 'saving' | 'no-changes'>('idle');

  // -- AI PDF Search State --
  const [showPdfSearchModal, setShowPdfSearchModal] = useState(false);
  const [pdfSearchTopic, setPdfSearchTopic] = useState('');
  const [pdfSearchResults, setPdfSearchResults] = useState<{title: string, url: string, summary?: string, apuntes?: string}[]>([]);
  const [pdfSearchLoading, setPdfSearchLoading] = useState(false);
  const [pdfSearchError, setPdfSearchError] = useState<string | null>(null);
  
  // -- Blog Generator State --
  const [blogGenPdf, setBlogGenPdf] = useState<any>(null);
  const [blogGenInstructions, setBlogGenInstructions] = useState('Escribe un post de blog para agricultores principiantes, con un tono motivador, consejos prácticos, emojis y una buena estructura de Markdown.');
  const [blogGenLoading, setBlogGenLoading] = useState(false);
  const [blogGenProgress, setBlogGenProgress] = useState('Iniciando motor de IA...');
  const [showBlogPrompt, setShowBlogPrompt] = useState(false);

  // -- Pautas Labores State --
  const [pautas, setPautas] = useState<any[]>([]);
  const [masterLabores, setMasterLabores] = useState<any[]>([]);
  const [editingPauta, setEditingPauta] = useState<any>(null);
  const [pautaForm, setPautaForm] = useState({
    xlaborespautaidlabores: '',
    laborespautafase: 'germinacion',
    laborespautafrecuenciadias: '',
    laborespautanotasia: '',
    laborespautaactivosino: 1
  });
  const [pautaDeleteConfirm, setPautaDeleteConfirm] = useState<string | null>(null);
  const [expandedPautasLabor, setExpandedPautasLabor] = useState<Set<string>>(new Set());
  const [showPautaForm, setShowPautaForm] = useState(false);

  const [showAiImageModal, setShowAiImageModal] = useState(false);
  const [aiImageConcept, setAiImageConcept] = useState('');
  const [aiImageLoading, setAiImageLoading] = useState(false);
  const [aiImageResult, setAiImageResult] = useState<string | null>(null);
  const [aiImageDescription, setAiImageDescription] = useState('');
  const [aiImagePromptPreview, setAiImagePromptPreview] = useState('');
  const [aiImagePromptEdited, setAiImagePromptEdited] = useState(false);
  const [showPromptDetails, setShowPromptDetails] = useState(false);

  // -- Pautas AI State --
  const [pautasAiLoading, setPautasAiLoading] = useState(false);
  const [pautasAiSeconds, setPautasAiSeconds] = useState(0);
  const pautasTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pautasAiAbortControllerRef = useRef<AbortController | null>(null);
  const [showPautasAiModal, setShowPautasAiModal] = useState(false);
  const [aiPautasProposal, setAiPautasProposal] = useState<any[]>([]);
  const [showPautasConfig, setShowPautasConfig] = useState(false);
  const [pautasConfigPromptOpen, setPautasConfigPromptOpen] = useState(false);
  const [pautasExtraInstructions, setPautasExtraInstructions] = useState('Te debes centrar exclusivamente en las labores que tiene el sistema y en esta especie, y comportarte como un experto.');

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
    // Cargar catálogos maestros
    if (userEmail) {
      fetch(`/api/admin/${entityType}`, { headers: { 'x-user-email': userEmail } })
        .then(res => res.json())
        .then(data => setMasterEspecies(data.especies || []));
      fetch('/api/admin/plagas', { headers: { 'x-user-email': userEmail } })
        .then(res => res.json())
        .then(data => setMasterPlagas(data.plagas || []));
      fetch('/api/admin/labores', { headers: { 'x-user-email': userEmail } })
        .then(res => res.json())
        .then(data => setMasterLabores(data.labores || []));
      fetch('/api/admin/ajustes/idiomas')
        .then(res => res.json())
        .then(data => setMasterIdiomas(Array.isArray(data) ? data : []));
      fetch('/api/admin/ajustes/paises')
        .then(res => res.json())
        .then(data => setMasterPaises(Array.isArray(data) ? data : []));
    }

    if (entityId) {
      loadEspecie(entityId);
      loadAttachments(entityId);
      loadRelaciones(entityId);
      loadSinonimos(entityId);
      loadPautas(entityId);
    }
  }, [entityId, userEmail]);

  const loadSinonimos = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/${entityType}/${id}/sinonimos`);
      const data = await res.json();
      setSinonimos(Array.isArray(data) ? data : []);
      setInitialSinonimos(Array.isArray(data) ? data : []);
      setSinonimosDirty(false);
    } catch (e) {
      console.error('Error loading sinonimos:', e);
    }
  };

  const loadPautas = async (id: string) => {
    if (!userEmail) { console.warn('[loadPautas] No userEmail, skip'); return; }
    try {
      console.log('[loadPautas] Fetching for especie', id, 'with email', userEmail);
      const pautasRes = await fetch(`/api/admin/${entityType}/${id}/pautas`, { headers: { 'x-user-email': userEmail } });
      console.log('[loadPautas] Response status:', pautasRes.status);
      if (pautasRes.ok) {
        const data = await pautasRes.json();
        console.log('[loadPautas] Data received:', data);
        setPautas(data.pautas || []);
      } else {
        console.error('[loadPautas] Error response:', await pautasRes.text());
      }
    } catch (e) {
      console.error('Error loading pautas:', e);
    }
  };

  const loadRelaciones = async (id: string) => {
    if (!userEmail) return;
    try {
      const res = await fetch(`/api/admin/${entityType}/${id}/relaciones`, { headers: { 'x-user-email': userEmail } });
      const data = await res.json();
      const rels = {
        beneficiosas: data.beneficiosas || [],
        perjudiciales: data.perjudiciales || [],
        plagas: data.plagas || []
      };
      setRelaciones(rels);
      setInitialRelaciones(rels);
      setRelacionesDirty(false);
    } catch (e) {
      console.error(e);
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
          handleFileUpload(imageFiles, 'photos');
        }
      }
    };

    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, [entityId, formData.especiesnombre, userEmail]);

  const loadEspecie = async (id: string) => {
    if (!userEmail) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/${entityType}/${id}`, {
        headers: { 'x-user-email': userEmail }
      });
      const data = await res.json();
      const especie = data.especie;
      if (especie) {
        const parsedEspecie = {
          ...especie,
          especiestemperaturaminima: especie.especiestemperaturaminima !== null ? parseFloat(especie.especiestemperaturaminima).toString() : '',
          especiestemperaturaoptima: especie.especiestemperaturaoptima !== null ? parseFloat(especie.especiestemperaturaoptima).toString() : '',
          especiesmarcoplantas: especie.especiesmarcoplantas !== null ? parseInt(especie.especiesmarcoplantas, 10).toString() : '',
          especiesmarcofilas: especie.especiesmarcofilas !== null ? parseInt(especie.especiesmarcofilas, 10).toString() : '',
          especiestipo: especie.especiestipo ? especie.especiestipo.split(',') : [],
          especiesciclo: especie.especiesciclo ? especie.especiesciclo.split(',') : []
        };
        setFormData(parsedEspecie);
        setInitialData(parsedEspecie);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadAttachments = async (id: string) => {
    if (!userEmail) return;
    // Cada fetch es independiente para que un fallo en uno no bloquee a los demás
    try {
      const pRes = await fetch(`/api/admin/${entityType}/${id}/photos`, { headers: { 'x-user-email': userEmail } });
      const pData = await pRes.json();
      setPhotos(pData.photos || []);
    } catch (e) { console.error('Error cargando fotos:', e); }

    try {
      const dRes = await fetch(`/api/admin/${entityType}/${id}/pdfs`, { headers: { 'x-user-email': userEmail } });
      const dData = await dRes.json();
      setPdfs(dData.pdfs || []);
    } catch (e) { console.error('Error cargando PDFs:', e); }

    try {
      const bRes = await fetch(`/api/admin/${entityType}/${id}/blogs`, { headers: { 'x-user-email': userEmail } });
      const bData = await bRes.json();
      setBlogs(bData.data || []);
    } catch (e) { console.error('Error cargando blogs:', e); }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      if (name === 'especiestipo' || name === 'especiesciclo') {
        setFormData((prev: any) => ({
          ...prev,
          [name]: checked 
            ? [...prev[name], value] 
            : prev[name].filter((item: string) => item !== value)
        }));
      } else {
        setFormData({ ...formData, [name]: checked ? 1 : 0 });
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userEmail) { alert('No email (sesión no detectada)'); return; }
    setLoading(true);
    setSaveStatus('saving');
    try {
      const url = entityId ? `/api/admin/especies/${entityId}` : '/api/admin/especies';
      const method = entityId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'x-user-email': userEmail
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        setInitialData(formData);
        
        // Guardar relaciones si han cambiado y ya tenemos ID
        const targetId = entityId || data.id;
        if (relacionesDirty && targetId) {
          try {
            await fetch(`/api/admin/${entityType}/${targetId}/relaciones`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail },
              body: JSON.stringify(relaciones)
            });
            setInitialRelaciones(relaciones);
            setRelacionesDirty(false);
          } catch (e) {
            console.error('Error guardando relaciones:', e);
          }
        }

        if (!entityId) {
            router.push(`/dashboard/admin/especies/${data.id}`);
        } else {
            setSaveStatus('idle');
            // Remove the alert, it's successful implicitly
        }
      } else {
        alert('Error: ' + data.error);
        setSaveStatus('idle');
      }
    } catch (err) {
      alert('Error de conexión');
      setSaveStatus('idle');
    } finally {
      setLoading(false);
    }
  };

  const callAI = async () => {
    if (!formData.especiesnombre) {
      alert('Introduce primero el nombre común de la especie.');
      return;
    }
    setAiLoading(true);
    try {
      const res = await fetch('/api/ai/especie-assistant', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-email': userEmail || ''
        },
        body: JSON.stringify({ nombre: formData.especiesnombre })
      });
      const data = await res.json();
      if (data.success) {
        setAiProposal(data.data);
        setSelectedRels({
          ben: data.data.asociaciones_beneficiosas || [],
          per: data.data.asociaciones_perjudiciales || [],
          pla: data.data.plagas_asociadas || []
        });
        setShowAiModal(true);
      } else {
        alert('Error IA: ' + data.error);
      }
    } catch (err) {
      alert('Error llamando a la IA');
    } finally {
      setAiLoading(false);
    }
  };

  const aiGroups = [
    {
      id: 'taxonomia',
      title: '🧬 Taxonomía',
      keys: ['especiesnombrecientifico', 'especiesfamilia', 'especiestipo', 'especiesciclo', 'especiescolor', 'especiestamano'],
      labels: {
        especiesnombrecientifico: 'Nombre Científico',
        especiesfamilia: 'Familia',
        especiestipo: 'Tipos',
        especiesciclo: 'Ciclo',
        especiescolor: 'Color',
        especiestamano: 'Tamaño'
      }
    },
    {
      id: 'fisiologia',
      title: '🌱 Fisiología',
      keys: ['especiesdiasgerminacion', 'especiesdiashastatrasplante', 'especiesviabilidadsemilla', 'especiesdiashastafructificacion', 'especiesdiashastarecoleccion', 'especiestemperaturaminima', 'especiestemperaturaoptima', 'especiestemperaturamaxima', 'especiesprofundidadsiembra', 'especiesprofundidadtrasplante', 'especiesluzsolar'],
      labels: {
        especiesdiasgerminacion: 'Días Germinación',
        especiesdiashastatrasplante: 'Días hasta Trasplante',
        especiesviabilidadsemilla: 'Viabilidad Semilla',
        especiesdiashastafructificacion: 'Días a Fruct.',
        especiesdiashastarecoleccion: 'Días a Recol.',
        especiestemperaturaminima: 'Temp. Mínima',
        especiestemperaturaoptima: 'Temp. Óptima',
        especiestemperaturamaxima: 'Temp. Máxima',
        especiesprofundidadsiembra: 'Profundidad Siembra',
        especiesprofundidadtrasplante: 'Profundidad Trasplante',
        especiesluzsolar: 'Luz Solar'
      }
    },
    {
      id: 'cultivo',
      title: '🚜 Cultivo y Suelo',
      keys: ['especiesphsuelo', 'especiescaracteristicassuelo', 'especiesnecesidadriego', 'especiestiposiembra', 'especiesvolumenmaceta', 'especiesdificultad'],
      labels: {
        especiesphsuelo: 'pH Suelo',
        especiescaracteristicassuelo: 'Tipo de Suelo',
        especiesnecesidadriego: 'Nec. Riego',
        especiestiposiembra: 'Tipo Siembra',
        especiesvolumenmaceta: 'Vol. Maceta (L)',
        especiesdificultad: 'Dificultad'
      }
    },
    {
      id: 'autosuficiencia',
      title: 'Autosuficiencia y Marcos',
      keys: ['especiesmarcoplantas', 'especiesmarcofilas', 'especiesautosuficienciaparcial', 'especiesautosuficiencia', 'especiesautosuficienciaconserva'],
      labels: {
        especiesmarcoplantas: 'Marco Plantas',
        especiesmarcofilas: 'Marco Filas',
        especiesautosuficienciaparcial: 'Autosuf. Parcial',
        especiesautosuficiencia: 'Autosuf. Completa',
        especiesautosuficienciaconserva: 'Autosuf. Conserva'
      }
    },
    {
      id: 'biodinamica',
      title: 'Luna y Biodinámica',
      keys: [
        'especieslunarfasesiembra', 
        'especieslunarfasetrasplante', 
        'especieslunarobservaciones',
        'especiesbiodinamicacategoria', 
        'especiesbiodinamicafasesiembra',
        'especiesbiodinamicafasetrasplante',
        'especiesbiodinamicanotas'
      ],
      labels: {
        especieslunarfasesiembra: 'Fase Siembra (Lunar)',
        especieslunarfasetrasplante: 'Fase Trasplante (Lunar)',
        especieslunarobservaciones: 'Notas (Lunar)',
        especiesbiodinamicacategoria: 'Categoría (Biodinámica)',
        especiesbiodinamicafasesiembra: 'Fase Siembra (Biodinámica)',
        especiesbiodinamicafasetrasplante: 'Fase Trasplante (Biodinámica)',
        especiesbiodinamicanotas: 'Notas (Biodinámica)'
      }
    },
    {
      id: 'calendarios',
      title: '📅 Calendarios',
      keys: [
        'especiesfechasemillerodesde', 'especiesfechasemillerohasta',
        'especiesfechasiembradirectadesde', 'especiesfechasiembradirectahasta',
        'especiestrasplantedesde', 'especiestrasplantehasta',
        'especiesfecharecolecciondesde', 'especiesfecharecoleccionhasta'
      ],
      labels: {
        especiesfechasemillerodesde: 'Semillero (Desde)',
        especiesfechasemillerohasta: 'Semillero (Hasta)',
        especiesfechasiembradirectadesde: 'Siembra Dir. (Desde)',
        especiesfechasiembradirectahasta: 'Siembra Dir. (Hasta)',
        especiestrasplantedesde: 'Trasplante (Desde)',
        especiestrasplantehasta: 'Trasplante (Hasta)',
        especiesfecharecolecciondesde: 'Recolección (Desde)',
        especiesfecharecoleccionhasta: 'Recolección (Hasta)'
      }
    },
    {
      id: 'textos',
      title: 'Textos y Otros',
      keys: ['especieshistoria', 'especiesdescripcion', 'especiesfuentesinformacion'],
      labels: {
        especieshistoria: 'Historia',
        especiesdescripcion: 'Descripción',
        especiesfuentesinformacion: 'Fuentes'
      }
    }
  ];

  const assimilateGroup = (keys: string[]) => {
    if (!aiProposal) return;
    const updates: any = {};
    keys.forEach(k => {
      if (aiProposal[k] !== undefined && aiProposal[k] !== null) {
        updates[k] = aiProposal[k];
      }
    });
    setFormData((prev: any) => ({ ...prev, ...updates }));
  };

  const assimilateRelacionesAI = async () => {
    if (!aiProposal) return;
    setIsAssimilatingRels(true);

    try {
      const benNames = Array.isArray(selectedRels?.ben) ? selectedRels.ben : [];
      const perNames = Array.isArray(selectedRels?.per) ? selectedRels.per : [];
      const plaNames = Array.isArray(selectedRels?.pla) ? selectedRels.pla : [];

      const newBen = [...relaciones.beneficiosas];
      const newPer = [...relaciones.perjudiciales];
      const newPla = [...relaciones.plagas];

      let masterE = [...masterEspecies];
      let masterP = [...masterPlagas];
      let madeChanges = false;

      const normalize = (str: string) => (str || "").toLowerCase().trim();

      for (const item of benNames) {
        const name = typeof item === 'string' ? item : item?.nombre;
        const motivo = typeof item === 'string' ? 'Sugerido por IA' : (item?.motivo || 'Sugerido por IA');
        if (!name || typeof name !== 'string') continue;
        let sp = masterE.find(e => normalize(e.especiesnombre) === normalize(name));
        if (!sp) {
          const res = await fetch(`/api/admin/${entityType}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail || '' },
            body: JSON.stringify({ especiesnombre: name, especiesvisibilidadsino: 0 })
          });
          const data = await res.json();
          if (data.success && data.id) {
            sp = { idespecies: data.id, especiesnombre: name };
            masterE.push(sp);
            setMasterEspecies([...masterE]);
          }
        }
        if (sp && sp.idespecies.toString() !== entityId && !newBen.some(b => b.xasociacionesbeneficiosasidespeciedestino?.toString() === sp.idespecies?.toString())) {
          newBen.push({
            xasociacionesbeneficiosasidespeciedestino: sp.idespecies,
            especie_destino_nombre: sp.especiesnombre,
            asociacionesbeneficiosasmotivo: motivo
          });
          madeChanges = true;
        }
      }

      for (const item of perNames) {
        const name = typeof item === 'string' ? item : item?.nombre;
        const motivo = typeof item === 'string' ? 'Sugerido por IA' : (item?.motivo || 'Sugerido por IA');
        if (!name || typeof name !== 'string') continue;
        let sp = masterE.find(e => normalize(e.especiesnombre) === normalize(name));
        if (!sp) {
          const res = await fetch(`/api/admin/${entityType}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail || '' },
            body: JSON.stringify({ especiesnombre: name, especiesvisibilidadsino: 0 })
          });
          const data = await res.json();
          if (data.success && data.id) {
            sp = { idespecies: data.id, especiesnombre: name };
            masterE.push(sp);
            setMasterEspecies([...masterE]);
          }
        }
        if (sp && sp.idespecies.toString() !== entityId && !newPer.some(p => p.xasociacionesperjudicialesidespeciedestino?.toString() === sp.idespecies?.toString())) {
          newPer.push({
            xasociacionesperjudicialesidespeciedestino: sp.idespecies,
            especie_destino_nombre: sp.especiesnombre,
            asociacionesperjudicialesmotivo: motivo
          });
          madeChanges = true;
        }
      }

      for (const item of plaNames) {
        const name = typeof item === 'string' ? item : item?.nombre;
        const notas = typeof item === 'string' ? 'Sugerido por IA' : (item?.notas || 'Sugerido por IA');
        const riesgo = typeof item === 'string' ? 'media' : (item?.riesgo || 'media');
        if (!name || typeof name !== 'string') continue;
        let p = masterP.find(pl => normalize(pl.plagasnombre) === normalize(name));
        if (!p) {
          const res = await fetch('/api/admin/plagas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail || '' },
            body: JSON.stringify({ plagasnombre: name, plagastipo: 'plaga', plagasestado: 'inactivo' })
          });
          const data = await res.json();
          if (data.success && data.id) {
            p = { idplagas: data.id, plagasnombre: name, plagastipo: 'plaga' };
            masterP.push(p);
            setMasterPlagas([...masterP]);
          }
        }
        if (p && !newPla.some(pl => (pl.xrelacionesplagasideplaga || pl.xespeciesplagasidplagas)?.toString() === p.idplagas?.toString())) {
          newPla.push({
            xrelacionesplagasideplaga: p.idplagas,
            xespeciesplagasidplagas: p.idplagas,
            plagasnombre: p.plagasnombre,
            especiesplagasnivelriesgo: riesgo,
            especiesplagasnotasespecificas: notas
          });
          madeChanges = true;
        }
      }

      if (madeChanges) {
        setRelaciones({ beneficiosas: newBen, perjudiciales: newPer, plagas: newPla });
        setRelacionesDirty(true);
      }
    } catch (e) {
      console.error(e);
      alert('Error asimilando relaciones.');
    } finally {
      setIsAssimilatingRels(false);
    }
  };

  const assimilateAll = async () => {
    if (!aiProposal) return;
    const allKeys = aiGroups.flatMap(g => g.keys);
    assimilateGroup(allKeys);
    if (aiProposal.asociaciones_beneficiosas || aiProposal.asociaciones_perjudiciales || aiProposal.plagas_asociadas) {
      await assimilateRelacionesAI();
    }
    setShowAiModal(false);
  };

  const openSinonimosConfig = () => {
    if (!formData.especiesnombre) {
      alert('Se necesita el nombre de la especie para proponer sinónimos.');
      return;
    }
    setShowSinonimosConfig(true);
  };

  const proponerSinonimosAI = async () => {
    setSinonimosAiLoading(true);
    setSinonimosAiSeconds(0);
    sinonimosTimerRef.current = setInterval(() => setSinonimosAiSeconds(s => s + 1), 1000);
    try {
      const res = await fetch('/api/ai/proponer-sinonimos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          especieNombre: formData.especiesnombre,
          especieCientifico: formData.especiesnombrecientifico,
          existingSinonimos: sinonimos.map(s => ({
            nombre: s.especiessinonimosnombre,
            idPais: s.xespeciessinonimosidpaises
          })),
          extraInstructions: sinExtraInstructions
        })
      });
      const data = await res.json();
      if (data.success && data.sinonimos) {
        const propuestos = data.sinonimos.map((s: any) => ({
          ...s,
          idespeciessinonimos: null,
          _selected: true
        }));
        setAiSinonimosProposal(propuestos);
        setShowSinonimosConfig(false);
        setShowSinonimosAiModal(true);
      } else {
        alert(data.error || 'Error al proponer sinónimos.');
      }
    } catch (e) {
      console.error(e);
      alert('Error de conexión con la IA.');
    } finally {
      setSinonimosAiLoading(false);
      if (sinonimosTimerRef.current) { clearInterval(sinonimosTimerRef.current); sinonimosTimerRef.current = null; }
    }
  };

  const saveSinonimosNow = async () => {
    if (!entityId) return;
    try {
      // 1. Encontramos los que hay que borrar (estaban en initial pero no en actuales)
      const toDelete = initialSinonimos.filter(init => !sinonimos.some(s => s.idespeciessinonimos === init.idespeciessinonimos));
      for (const del of toDelete) {
        await fetch(`/api/admin/${entityType}/${entityId}/sinonimos?id=${del.idespeciessinonimos}`, { method: 'DELETE' });
      }

      // 2. Guardar o actualizar los actuales
      for (const s of sinonimos) {
        const isNew = !s.idespeciessinonimos;
        const res = await fetch(`/api/admin/${entityType}/${entityId}/sinonimos`, {
          method: isNew ? 'POST' : 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(s)
        });
        if (!res.ok) {
           console.error('Error guardando sinónimo', s);
        }
      }

      await loadSinonimos(entityId);
      alert('Sinónimos guardados con éxito.');
    } catch (err) {
      console.error(err);
      alert('Error guardando sinónimos.');
    }
  };

  const saveRelacionesNow = async (updatedRels: any) => {
    if (!entityId || !userEmail) return;
    setRelacionesSaveStatus('saving');
    try {
      await fetch(`/api/admin/${entityType}/${entityId}/relaciones`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail },
        body: JSON.stringify(updatedRels)
      });
      setInitialRelaciones(updatedRels);
      setRelacionesDirty(false);
      setRelacionesSaveStatus('no-changes');
      setTimeout(() => setRelacionesSaveStatus('idle'), 2000);
    } catch (e) {
      console.error('Error auto-guardando relaciones:', e);
      setRelacionesSaveStatus('idle');
    }
  };

  const normalizePathSegment = (value: string) =>
    value
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

  const getExtensionFromFile = (file: File) => {
    const byName = (file.name.match(/\.([a-zA-Z0-9]+)$/)?.[1] || '').toLowerCase();
    if (byName) return byName;

    const mimeToExt: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
      'image/avif': 'avif'
    };
    return mimeToExt[file.type] || 'jpg';
  };

  const buildEspecieStoragePath = (file: File, isAi = false) => {
    const baseName = normalizePathSegment(formData.especiesnombre || `especie-${entityId || 'nueva'}`) || `especie-${entityId || 'nueva'}`;
    const randomSuffix = Math.random().toString(36).slice(2, 8);
    const extension = getExtensionFromFile(file);
    return `uploads/especies/${baseName}-${Date.now()}-${randomSuffix}.${extension}`;
  };

  const buildDefaultPhotoResumen = (seoAlt = '') =>
    JSON.stringify({
      profile_object_x: 50,
      profile_object_y: 50,
      profile_object_zoom: 100,
      profile_brightness: 100,
      profile_contrast: 100,
      profile_style: '',
      seo_alt: seoAlt,
      dominant_color: null,
      vibrant_color: null,
      blurhash: null,
      exif_data: null
    });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement> | any, type: 'photos' | 'pdfs') => {
    if (!entityId) {
      alert('Guarda la especie primero antes de subir archivos.');
      return;
    }
    const files = e.target ? e.target.files : e;
    if (!files || files.length === 0) return;
    
    if (type === 'photos') setUploadingPhotos(true);
    else setUploadingPdfs(true);

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

          const res = await fetch(`/api/admin/${entityType}/${entityId}/photos`, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail || '' },
            body: JSON.stringify({
              rawStoragePath: storagePath,
              especieNombre: formData.especiesnombre || 'especie'
            })
          });
          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || `HTTP Error ${res.status}`);
          }
        } else {
          const fd = new FormData();
          fd.append('file', file);
          fd.append('especieNombre', formData.especiesnombre || '');
          const res = await fetch(`/api/admin/${entityType}/${entityId}/${type}`, {
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
      await loadAttachments(entityId);
    } catch (err: any) {
      console.error('UPLOAD ERROR:', err);
      alert('Error al subir archivos: ' + err.message);
    } finally {
      if (type === 'photos') setUploadingPhotos(false);
      else setUploadingPdfs(false);
      if (e.target && e.target.value) e.target.value = '';
    }
  };

  const buildPromptPreview = () => {
    const nombre = formData.especiesnombre || 'especie';
    const sciCtx = formData.especiesnombrecientifico ? ` Nombre científico: ${formData.especiesnombrecientifico}.` : '';
    const famCtx = formData.especiesfamilia ? ` Familia botánica: ${formData.especiesfamilia}.` : '';
    const defaultConcept = `varios ejemplares de ${nombre} recién cosechados, dispuestos sobre una mesa rústica de madera en un huerto al aire libre, con tierra y hojas verdes visibles al fondo`;
    return `Fotografía profesional de stock de alta resolución (8K), tomada con una cámara DSLR Canon EOS R5 y un objetivo macro 100mm f/2.8, iluminación natural suave de hora dorada.\nSujeto principal: ${nombre} (hortaliza/planta comestible de huerto).${sciCtx}${famCtx}\nEscena concreta: ${aiImageConcept || defaultConcept}.\nComposición: regla de los tercios, sujeto nítido en primer plano, fondo suavemente desenfocado (bokeh) mostrando vegetación de huerto.\nREGLAS ESTRICTAS:\n1. El sujeto es SIEMPRE una planta, hortaliza, fruto o semilla comestible de huerto.\n2. La fotografía debe parecer tomada por un fotógrafo profesional de gastronomía o agricultura.\n3. El entorno debe ser siempre agrícola: huerto, bancal, invernadero, mesa de cosecha o cocina rústica.\n4. NO incluir personas, manos, texto, logotipos ni marcas de agua.\n5. Mostrar el producto hortícola en su mejor estado: fresco, limpio, apetecible.`;
  };

  const generateAiImage = async () => {
    if (!formData.especiesnombre) {
      alert('Se necesita el nombre de la especie para generar la imagen.');
      return;
    }
    setAiImageLoading(true);
    setAiImageResult(null);
    setAiImageDescription('');
    try {
      const body: any = { 
        especieNombre: formData.especiesnombre,
        especieNombreCientifico: formData.especiesnombrecientifico,
        especieFamilia: formData.especiesfamilia,
        concept: aiImageConcept 
      };
      // Si el usuario ha editado manualmente el prompt, enviarlo como customPrompt
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
    if (!aiImageResult || !entityId) return;
    setUploadingPhotos(true);
    setShowAiImageModal(false);
    try {
      const res = await fetch(aiImageResult);
      const blob = await res.blob();
      const descBase = aiImageDescription || formData.especiesnombre || 'especie';

      // Subir a ruta temporal vía Firebase client-side (mismo flujo que fotos normales)
      const storageApi = await import('firebase/storage');
      const tempFileName = `temp-ai-${Date.now()}-${descBase.replace(/[^a-zA-Z0-9.-]/g, '')}.webp`;
      const tempPath = `uploads/temp/${tempFileName}`;
      const storageRef = storageApi.ref(storage, tempPath);
      await storageApi.uploadBytes(storageRef, blob);

      // Llamar a la API de especies que descarga, procesa y guarda
      const saveRes = await fetch(`/api/admin/${entityType}/${entityId}/photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail || '' },
        body: JSON.stringify({
          rawStoragePath: tempPath,
          especieNombre: formData.especiesnombre || 'especie'
        })
      });
      if (!saveRes.ok) {
        const errData = await saveRes.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP Error ${saveRes.status}`);
      }
      await loadAttachments(entityId);
      setAiImageResult(null);
      setAiImageConcept('');
      setAiImageDescription('');
      setAiImagePromptPreview('');
      setAiImagePromptEdited(false);
    } catch (error) {
      console.error('Error uploading AI image:', error);
      alert('Error al guardar la imagen generada.');
    } finally {
      setUploadingPhotos(false);
    }
  };

  const handleDeleteFile = async (id: string, type: 'photos' | 'pdfs') => {
    setDeleteConfirm({ id, type });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    const { id, type } = deleteConfirm;
    setDeleteConfirm(null);
    try {
      const url = type === 'photos'
        ? `/api/admin/especies/${entityId}/photos?photoId=${id}`
        : `/api/admin/especies/${entityId}/pdfs?pdfId=${id}`;
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

  const handleReorderPhotos = async (newPhotos: any[]) => {
    setPhotos(newPhotos); // Optimistic UI update
    if (!userEmail || !entityId) return;
    try {
      const reorderPayload = newPhotos.map((p, index) => ({ id: p.id, orden: index + 1 }));
      await fetch(`/api/admin/${entityType}/${entityId}/photos/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail },
        body: JSON.stringify({ photos: reorderPayload })
      });
    } catch (e) {
      console.error('Error reordering photos', e);
    }
  };

  const handleSetPrimaryPhoto = async (photoId: number) => {
    // Optimistic UI update: mark photo as primary immediately
    setPhotos(prev => prev.map(p => ({ ...p, esPrincipal: p.id === photoId ? 1 : 0 })));
    setHeroIndex(0);
    try {
      await fetch(`/api/admin/${entityType}/${entityId}/photos`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-email': userEmail || ''
        },
        body: JSON.stringify({ photoId, action: 'setPrimary' })
      });
      loadAttachments(entityId!);
    } catch (err) {
      alert('Error estableciendo foto principal');
      loadAttachments(entityId!); // Revert on error
    }
  };

  // ── Abrir editor de foto ──
  const openPhotoEditor = (photo: any) => {
    try {
      const meta = JSON.parse(photo.resumen || '{}');
      const initial = {
        x: meta.profile_object_x ?? 50,
        y: meta.profile_object_y ?? 50,
        zoom: meta.profile_object_zoom ?? 100,
        brightness: meta.profile_brightness ?? 100,
        contrast: meta.profile_contrast ?? 100,
        style: meta.profile_style ?? '',
        seo_alt: meta.seo_alt ?? ''
      };
      setEditorX(initial.x);
      setEditorY(initial.y);
      setEditorZoom(initial.zoom);
      setEditorBrightness(initial.brightness);
      setEditorContrast(initial.contrast);
      setEditorStyle(initial.style);
      setEditorSeoAlt(initial.seo_alt);
      setEditorInitialState(JSON.stringify(initial));
    } catch {
      setEditorX(50); setEditorY(50); setEditorZoom(100); 
      setEditorBrightness(100); setEditorContrast(100); setEditorStyle(''); setEditorSeoAlt('');
      setEditorInitialState(JSON.stringify({x: 50, y: 50, zoom: 100, brightness: 100, contrast: 100, style: '', seo_alt: ''}));
    }
    setEditingPhoto(photo);
  };

  // ── Guardar edición de foto ──
  const savePhotoEdits = async () => {
    if (!editingPhoto || !entityId) return;
    setPhotoEditorSaveStatus('saving');
    const resumen = JSON.stringify({
      profile_object_x: editorX,
      profile_object_y: editorY,
      profile_object_zoom: editorZoom,
      profile_brightness: editorBrightness,
      profile_contrast: editorContrast,
      profile_style: editorStyle,
      seo_alt: editorSeoAlt
    });
    try {
      await fetch(`/api/admin/${entityType}/${entityId}/photos`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-email': userEmail || ''
        },
        body: JSON.stringify({ photoId: editingPhoto.id, action: 'updateMeta', resumen })
      });
      setEditingPhoto(null);
      loadAttachments(entityId);
    } catch { 
      alert('❌ Error guardando ajustes'); 
    } finally {
      setPhotoEditorSaveStatus('idle');
    }
  };

  // ── Guardar edición de PDF ──
  const savePdfEdits = async () => {
    if (!editingPdf || !entityId) return;

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
      await fetch(`/api/admin/${entityType}/${entityId}/pdfs`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-email': userEmail || ''
        },
        body: JSON.stringify({ pdfId: editingPdf.id, titulo: pdfTitle, resumen: pdfSummary, apuntes: pdfApuntes })
      });
      setEditingPdf(null);
      loadAttachments(entityId);
    } catch { 
      alert('❌ Error guardando PDF'); 
    } finally {
      setPdfEditorSaveStatus('idle');
    }
  };

  // ── Generar Portada de PDF con IA ──
  const [generatingCoverId, setGeneratingCoverId] = useState<number | null>(null);

  const generatePdfCover = async (pdf: any) => {
    setGeneratingCoverId(pdf.id);
    try {
      const res = await fetch('/api/ai/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail || '' },
        body: JSON.stringify({
          tipoEntidad: 'documento',
          especieNombre: formData.especiesnombre,
          concept: `Portada del documento titulado "${pdf.titulo}". Estilo limpio, académico, con ilustración botánica. Contenido principal: ${pdf.resumen}`
        })
      });
      const data = await res.json();
      if (data.success && data.base64) {
        await fetch(`/api/admin/${entityType}/${entityId}/pdfs`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail || '' },
          body: JSON.stringify({
            pdfId: pdf.id,
            base64Cover: `data:image/jpeg;base64,${data.base64}`
          })
        });
        
        await loadAttachments(entityId!);
        
        // Si el editor está abierto, actualizar su previsualización al instante
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
    setPdfSearchLoading(true);
    setPdfSearchResults([]);
    setPdfSearchError(null);
    try {
      const res = await fetch('/api/ai/pdf-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: pdfSearchTopic, especieNombre: formData.especiesnombre })
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
      const res = await fetch(`/api/admin/${entityType}/${entityId}/pdfs/link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail || '' },
        body: JSON.stringify({ title, url, summary, apuntes })
      });
      const data = await res.json();
      if (data.success) {
        loadAttachments(entityId!);
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
          entityId: entityId,
          variedadId: null,
          autorEmail: userEmail,
          especieNombre: formData.especiesnombre,
          contexto: {
            tipo: 'especie',
            nombre: formData.especiesnombre || 'Especie'
          },
          pdfSourceId: blogGenPdf.id
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('¡Borrador generado con éxito! Slug: ' + data.slug);
        setBlogGenPdf(null);
        if (entityId) {
          loadAttachments(entityId); // Recargar blogs
        }
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
        if (entityId) loadAttachments(entityId);
      } else {
        const data = await res.json();
        alert(data.error || 'Error al eliminar blog');
      }
    } catch(e) {
      console.error(e);
      alert('Error de conexión al eliminar blog');
    }
  };

  React.useEffect(() => {
    if (blogGenLoading) {
      const phases = [
        { t: 0, msg: '🧠 Analizando el documento y extrayendo conceptos clave...' },
        { t: 8000, msg: '✍️ Redactando contenido y optimizando SEO...' },
        { t: 18000, msg: '🎨 Diseñando portada principal (Imagen 1 de 3)...' },
        { t: 28000, msg: '🎨 Generando ilustraciones botánicas (Imagen 2 de 3)...' },
        { t: 38000, msg: '🎨 Generando ilustraciones botánicas (Imagen 3 de 3)...' },
        { t: 48000, msg: '💾 Aplicando marcas de agua y guardando en servidor...' },
        { t: 55000, msg: '⌛ Ya casi está listo, finalizando detalles...' }
      ];
      const timeouts = phases.map(p => setTimeout(() => setBlogGenProgress(p.msg), p.t));
      return () => timeouts.forEach(clearTimeout);
    } else {
      setBlogGenProgress('Iniciando motor de IA...');
    }
  }, [blogGenLoading]);

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

  const hasChanges = JSON.stringify(formData) !== JSON.stringify(initialData);

  // ── Hero Gallery ──
  const sortedPhotos = [...photos].sort((a, b) => (b.esPrincipal ? 1 : 0) - (a.esPrincipal ? 1 : 0));
  const safeHeroIndex = Math.min(heroIndex, Math.max(0, sortedPhotos.length - 1));
  const heroPhoto = sortedPhotos[safeHeroIndex] || null;
  let vibrantColor: string | null = null;
  let heroMeta: any = {};
  if (heroPhoto) {
    try { heroMeta = JSON.parse(heroPhoto.resumen || '{}'); } catch(e){}
    vibrantColor = heroMeta.vibrant_color || null;
  }

  // ── Pautas Handlers ──
  const handleSavePauta = async () => {
    if (!entityId) {
      alert("Guarda primero la especie antes de añadir pautas.");
      return;
    }
    if (!pautaForm.xlaborespautaidlabores || !pautaForm.laborespautafase) {
      alert("Selecciona una labor y una fase.");
      return;
    }
    
    try {
      const isEditing = editingPauta !== null;
      const url = isEditing 
        ? `/api/admin/especies/${entityId}/pautas/${editingPauta}` 
        : `/api/admin/especies/${entityId}/pautas`;
      
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail || '' },
        body: JSON.stringify(pautaForm)
      });

      if (!res.ok) {
        const errorData = await res.json();
        alert(errorData.error || "Error al guardar la pauta");
        return;
      }

      // Refetch pautas
      const pautasRes = await fetch(`/api/admin/${entityType}/${entityId}/pautas`, { headers: { 'x-user-email': userEmail || '' } });
      if (pautasRes.ok) {
        const { pautas } = await pautasRes.json();
        setPautas(pautas || []);
      }

      // Reset form
      setEditingPauta(null);
      setPautaForm({
        xlaborespautaidlabores: '',
        laborespautafase: 'germinacion',
        laborespautafrecuenciadias: '',
        laborespautanotasia: '',
        laborespautaactivosino: 1
      });

    } catch (e) {
      console.error(e);
      alert("Error inesperado al guardar pauta.");
    }
  };

  // Auto-save a single pauta field inline
  const autoSavePautaField = async (pautaId: any, field: string, value: any) => {
    if (!entityId) return;
    const pauta = pautas.find(p => p.idlaborespauta === pautaId);
    if (!pauta) return;
    
    // Optimistic update
    setPautas(prev => prev.map(p => p.idlaborespauta === pautaId ? { ...p, [field]: value } : p));

    try {
      await fetch(`/api/admin/${entityType}/${entityId}/pautas`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail || '' },
        body: JSON.stringify({
          idlaborespauta: pautaId,
          laborespautafrecuenciadias: field === 'laborespautafrecuenciadias' ? value : pauta.laborespautafrecuenciadias,
          laborespautanotasia: field === 'laborespautanotasia' ? value : pauta.laborespautanotasia,
          laborespautaactivosino: field === 'laborespautaactivosino' ? value : pauta.laborespautaactivosino,
        })
      });
    } catch (e) {
      console.error('Auto-save pauta error:', e);
    }
  };

  const handleDeletePauta = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/${entityType}/${entityId}/pautas/${id}`, { method: 'DELETE', headers: { 'x-user-email': userEmail || '' } });
      if (res.ok) {
        setPautas(pautas.filter(p => p.idlaborespauta !== id));
        setPautaDeleteConfirm(null);
      } else {
        alert("Error al eliminar la pauta");
      }
    } catch (e) {
      console.error(e);
      alert("Error de red");
    }
  };

  // ── AI Pautas Handlers ──
  const startPautasAiSearch = async () => {
    if (!formData.especiesnombre) {
      alert('Debes darle un nombre a la especie primero.');
      return;
    }
    setPautasAiLoading(true);
    setPautasAiSeconds(0);
    setAiPautasProposal([]);
    
    if (pautasTimerRef.current) clearInterval(pautasTimerRef.current);
    pautasTimerRef.current = setInterval(() => setPautasAiSeconds(s => s + 1), 1000);

    if (pautasAiAbortControllerRef.current) pautasAiAbortControllerRef.current.abort();
    pautasAiAbortControllerRef.current = new AbortController();

    try {
      const res = await fetch('/api/ai/pautas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: pautasAiAbortControllerRef.current.signal,
        body: JSON.stringify({ 
          especie: formData.especiesnombre,
          labores: masterLabores.map(l => ({ id: l.idlabores, nombre: l.laboresnombre })),
          instruccionesAdicionales: pautasExtraInstructions
        })
      });
      const data = await res.json();
      if (data.success && data.pautas) {
        setAiPautasProposal(data.pautas);
        setShowPautasAiModal(true);
        setShowPautasConfig(false);
      } else {
        alert(data.error || 'Error al obtener propuesta de la IA');
      }
    } catch (e: any) {
      if (e.name === 'AbortError') {
        console.log('Búsqueda de pautas IA cancelada por el usuario');
        return;
      }
      console.error(e);
      alert('Error de red al consultar IA.');
    } finally {
      setPautasAiLoading(false);
      if (pautasTimerRef.current) clearInterval(pautasTimerRef.current);
    }
  };

  const applyAiPautas = async () => {
    if (!entityId) {
      alert("Guarda primero la especie para aplicar las pautas.");
      return;
    }
    
    try {
      // Mandar todas las pautas propuestas a la BD una por una
      let saved = 0;
      let updated = 0;
      let errors = 0;
      for (const pauta of aiPautasProposal) {
        if (!pauta.selected) continue;
        
        // Check if this pauta already exists
        const existing = pautas.find(p => p.xlaborespautaidlabores == pauta.id_labor && p.laborespautafase === pauta.fase);
        
        if (existing) {
          // UPDATE existing pauta
          const res = await fetch(`/api/admin/${entityType}/${entityId}/pautas`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail || '' },
            body: JSON.stringify({
              xlaborespautaidlabores: pauta.id_labor,
              laborespautafase: pauta.fase,
              laborespautafrecuenciadias: pauta.frecuencia != null ? pauta.frecuencia : null,
              laborespautanotasia: pauta.notas_ia || null,
              laborespautaactivosino: 1
            })
          });
          if (res.ok) { updated++; } else { errors++; console.error('Error actualizando pauta:', await res.text()); }
        } else {
          // CREATE new pauta
          const res = await fetch(`/api/admin/${entityType}/${entityId}/pautas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail || '' },
            body: JSON.stringify({
              xlaborespautaidlabores: pauta.id_labor,
              laborespautafase: pauta.fase,
              laborespautafrecuenciadias: pauta.frecuencia != null ? pauta.frecuencia : null,
              laborespautanotasia: pauta.notas_ia || null,
              laborespautaactivosino: 1
            })
          });
          if (res.ok) { saved++; } else if (res.status === 400) { /* duplicado — skip */ } else { errors++; console.error('Error guardando pauta:', await res.text()); }
        }
      }
      
      // Refetch
      const pautasRes = await fetch(`/api/admin/${entityType}/${entityId}/pautas`, { headers: { 'x-user-email': userEmail || '' } });
      if (pautasRes.ok) {
        const { pautas } = await pautasRes.json();
        setPautas(pautas || []);
      }
      setShowPautasAiModal(false);
      alert(errors > 0 ? `${saved} creadas, ${updated} actualizadas (${errors} con error).` : `${saved} creadas, ${updated} actualizadas.`);
    } catch (e) {
      console.error(e);
      alert('Error al aplicar pautas.');
    }
  };

  return (
    <>
      {/* ── Navegación ── */}
      <div style={{ marginBottom: '16px', padding: '0 4px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button onClick={() => router.push('/dashboard')} style={{ background: 'white', border: '1px solid #cbd5e1', color: '#475569', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          🏠 Volver al Inicio
        </button>
        <button onClick={() => router.push('/dashboard/admin/especies')} style={{ background: 'white', border: '1px solid #cbd5e1', color: '#475569', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          🌍 Volver a Especies Globales
        </button>
      </div>

      {/* ── Subheader Integrado ── */}
      <div style={{ background: 'linear-gradient(135deg, #0f766e, #10b981)', borderRadius: '16px', padding: '24px 28px', marginBottom: '24px', color: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '12px' }}>
              {formData.especiesnombre || 'Nueva Especie'}
              {isDirty && <span style={{ background: '#fef08a', color: '#854d0e', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold' }}>Cambios sin guardar</span>}
            </h1>
            {formData.especiesnombrecientifico ? (
              <p style={{ margin: '4px 0 0', opacity: 0.9, fontSize: '1rem', fontStyle: 'italic' }}>
                {formData.especiesnombrecientifico}
              </p>
            ) : (
              <p style={{ margin: '4px 0 0', opacity: 0.9, fontSize: '0.9rem' }}>
                Editor de Especie
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Status Bar ── */}
      <div style={{ background: formData.especiesvisibilidadsino ? '#ecfdf5' : '#f1f5f9', borderRadius: '12px', padding: '16px 24px', marginBottom: '24px', border: `1px solid ${formData.especiesvisibilidadsino ? '#10b981' : '#cbd5e1'}`, display: 'flex', alignItems: 'center', justifyContent: 'flex-start', transition: 'all 0.3s' }}>
        <label style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', color: '#334155', margin: 0, fontSize: '1.1rem' }}>
          <input 
            type="checkbox" 
            name="especiesvisibilidadsino" 
            checked={!!formData.especiesvisibilidadsino} 
            onChange={handleChange} 
            style={{ width: '22px', height: '22px', accentColor: '#10b981' }}
          /> 
          Especie con Visibilidad Global (Pública)
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
                position: 'relative', flexShrink: 0, width: '180px', height: '220px', overflow: 'hidden',
                border: draggedOverHeroPhotoId === -1 ? '4px dashed #10b981' : 'none',
                opacity: draggedOverHeroPhotoId === -1 ? 0.8 : 1,
                transition: 'all 0.2s ease'
              }}
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
                  <img key={heroPhoto.id} src={getMediaUrl(heroPhoto.ruta)}
                    alt={heroMeta.seo_alt || formData.especiesnombre}
                    style={{ width: '100%', height: '100%', objectFit: 'cover',
                      objectPosition: `${heroMeta.profile_object_x ?? 50}% ${heroMeta.profile_object_y ?? 50}%`,
                      transformOrigin: `${heroMeta.profile_object_x ?? 50}% ${heroMeta.profile_object_y ?? 50}%`,
                      transform: `scale(${(heroMeta.profile_object_zoom ?? 100) / 100})`,
                      filter: fullFilter, transition: 'opacity 0.3s ease' }}
                   crossOrigin="anonymous" />
                );
              })()}
            </div>

            {/* Right strip: only photos NOT currently shown as hero */}
            {sortedPhotos.filter((_, i) => i !== safeHeroIndex).length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '8px 6px', justifyContent: 'center' }}>
                {sortedPhotos
                  .map((p, i) => ({ p, i }))
                  .filter(({ i }) => i !== safeHeroIndex)
                  .map(({ p, i }) => {
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
                        style={{ width: '60px', height: '60px', borderRadius: '8px', overflow: 'hidden', cursor: 'grab', flexShrink: 0,
                          border: draggedOverHeroPhotoId === p.id ? '2px dashed #10b981' : '2px solid rgba(0,0,0,0.08)', 
                          boxShadow: '0 1px 3px rgba(0,0,0,0.12)', 
                          transition: 'all 0.2s ease',
                          opacity: draggedHeroPhotoId === p.id ? 0.5 : 1,
                          transform: draggedOverHeroPhotoId === p.id ? 'scale(1.05)' : 'scale(1)'
                        }}
                        onMouseEnter={e => { if(draggedHeroPhotoId === null) e.currentTarget.style.transform = 'scale(1.1)'; }}
                        onMouseLeave={e => { if(draggedHeroPhotoId === null) e.currentTarget.style.transform = 'scale(1)'; }}
                      >
                        <img src={getMediaUrl(p.ruta)}
                          draggable={false}
                          alt=""
                          style={{ width: '100%', height: '100%', objectFit: 'cover',
                            objectPosition: `${tMeta.profile_object_x ?? 50}% ${tMeta.profile_object_y ?? 50}%`,
                            transformOrigin: `${tMeta.profile_object_x ?? 50}% ${tMeta.profile_object_y ?? 50}%`,
                            transform: `scale(${(tMeta.profile_object_zoom ?? 100) / 100})` }}  crossOrigin="anonymous" />
                      </div>
                    );
                  })}
              </div>
            )}

            {/* The Text Info was moved above the Hero Gallery */}
          </div>
        ) : (
          <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            {formData.especiesicono && <span style={{ fontSize: '2.5rem' }}>{formData.especiesicono}</span>}
            <h2 style={{ margin: 0, color: '#1e293b' }}>Sin fotos en la galería</h2>
          </div>
        )}
      </div>
      <div className="especie-form-container">

      <form onSubmit={handleSubmit} className="especie-form-body">
        
        <div 
          className="collapsible-header" 
          onClick={() => setIsEspecieOpen(!isEspecieOpen)}
          style={{ padding: '15px 24px', background: '#e2e8f0', cursor: 'pointer', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <span>
            Ficha de Especie
            {!isEspecieOpen && formData.especiesnombre && (
              <span style={{ color: '#475569', marginLeft: '10px', fontWeight: 'normal' }}>
                — {formData.especiesnombre} {formData.especiesnombrecientifico ? `(${formData.especiesnombrecientifico})` : ''}
              </span>
            )}
          </span>
          <span>{isEspecieOpen ? '▲' : '▼'}</span>
        </div>

        {isEspecieOpen && (
          <div className="collapsible-content">
            
            <div style={{ padding: '15px 24px', background: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '16px' }}>
              <button type="button" onClick={callAI} className="btn-ai" disabled={aiLoading} style={{ margin: 0 }}>
                {aiLoading ? 'Pensando...' : '✨ Asistente IA'}
              </button>
            </div>

            <div className="form-tabs">
              <button type="button" className={activeTab === 'taxonomia' ? 'active' : ''} onClick={() => setActiveTab('taxonomia')}>🧬 Taxonomía</button>
              <button type="button" className={activeTab === 'fisiologia' ? 'active' : ''} onClick={() => setActiveTab('fisiologia')}>🌱 Fisiología</button>
              <button type="button" className={activeTab === 'calendarios' ? 'active' : ''} onClick={() => setActiveTab('calendarios')}>📅 Calendarios</button>
              <button type="button" className={activeTab === 'textos' ? 'active' : ''} onClick={() => setActiveTab('textos')}>📝 Textos</button>
              <button type="button" className={activeTab === 'autosuficiencia' ? 'active' : ''} onClick={() => setActiveTab('autosuficiencia')}>⚖️ Autosuficiencia</button>
              <button type="button" className={activeTab === 'biodinamica' ? 'active' : ''} onClick={() => setActiveTab('biodinamica')}>🌙 Luna</button>
              <button type="button" className={activeTab === 'asociaciones' ? 'active' : ''} onClick={() => setActiveTab('asociaciones')}>🤝 Asociaciones</button>
              <button type="button" className={activeTab === 'plagas' ? 'active' : ''} onClick={() => setActiveTab('plagas')}>🐛 Plagas</button>
              <button type="button" className={activeTab === 'sinonimos' ? 'active' : ''} onClick={() => setActiveTab('sinonimos')}>🗣️ Sinónimos</button>
              <button type="button" className={activeTab === 'adjuntos' ? 'active' : ''} onClick={() => setActiveTab('adjuntos')}>📎 Adjuntos</button>
              <button type="button" className={activeTab === 'blogs' ? 'active' : ''} onClick={() => setActiveTab('blogs')}>📰 Blogs</button>
            </div>

            <div className="form-tab-content">
              
              {/* TAXONOMÍA */}
          {activeTab === 'taxonomia' && (
            <div className="grid-form">
              <div className="form-group full">
                <label>Nombre Común *</label>
                <input type="text" name="especiesnombre" required value={formData.especiesnombre || ''} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Nombre Científico</label>
                <input type="text" name="especiesnombrecientifico" value={formData.especiesnombrecientifico || ''} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Familia</label>
                <input type="text" name="especiesfamilia" value={formData.especiesfamilia || ''} onChange={handleChange} />
              </div>
              <div className="form-group full checkbox-group">
                <label>Tipos</label>
                <div className="cb-list">
                  {TIPOS.map(t => (
                    <label key={t}><input type="checkbox" name="especiestipo" value={t} checked={formData.especiestipo.includes(t)} onChange={handleChange} /> {t}</label>
                  ))}
                </div>
              </div>
              <div className="form-group full checkbox-group">
                <label>Ciclo</label>
                <div className="cb-list">
                  {CICLOS.map(c => (
                    <label key={c}><input type="checkbox" name="especiesciclo" value={c} checked={formData.especiesciclo.includes(c)} onChange={handleChange} /> {c}</label>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label>Color Fenotípico</label>
                <input type="text" name="especiescolor" value={formData.especiescolor || ''} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Tamaño</label>
                <select name="especiestamano" value={formData.especiestamano || 'mediano'} onChange={handleChange}>
                  <option value="pequeno">Pequeño</option><option value="mediano">Mediano</option><option value="grande">Grande</option>
                </select>
              </div>
              <div className="form-group">
                <label>Dificultad</label>
                <select name="especiesdificultad" value={formData.especiesdificultad || ''} onChange={handleChange}>
                  <option value="">--</option>
                  <option value="baja">Baja</option>
                  <option value="media">Media</option>
                  <option value="alta">Alta</option>
                </select>
              </div>
              <div className="form-group">
                <label>Luz Solar</label>
                <select name="especiesluzsolar" value={formData.especiesluzsolar || ''} onChange={handleChange}>
                  <option value="">--</option>
                  <option value="pleno_sol">Pleno Sol</option>
                  <option value="semisombra">Semisombra</option>
                  <option value="sombra">Sombra</option>
                </select>
              </div>
              <div className="form-group">
                <label>Necesidad de Riego</label>
                <select name="especiesnecesidadriego" value={formData.especiesnecesidadriego || ''} onChange={handleChange}>
                  <option value="">--</option>
                  <option value="baja">Baja</option>
                  <option value="media">Media</option>
                  <option value="alta">Alta</option>
                </select>
              </div>
              <div className="form-group">
                <label>Volumen Maceta (L)</label>
                <input type="number" name="especiesvolumenmaceta" value={formData.especiesvolumenmaceta || ''} onChange={handleChange} />
              </div>
            </div>
          )}

          {/* FISIOLOGÍA */}
          {activeTab === 'fisiologia' && (
            <div className="grid-form">
              {/* BLOQUE PRINCIPAL SUPERIOR */}
              <div className="form-group full" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                <div className="form-group" style={{ margin: 0, padding: '15px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <label style={{ color: '#1e293b', fontWeight: 'bold' }}>🌱 Tipo de Siembra Principal</label>
                  <select name="especiestiposiembra" value={formData.especiestiposiembra || ''} onChange={handleChange} style={{ marginTop: '8px' }}>
                    <option value="">-- Selecciona --</option>
                    <option value="directa">Directa (En tierra)</option>
                    <option value="semillero">Semillero (Requiere trasplante)</option>
                    <option value="ambas">Ambas opciones posibles</option>
                  </select>
                </div>
                
                <div className="form-group" style={{ margin: 0, padding: '15px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <label style={{ color: '#1e293b', fontWeight: 'bold' }}>Viabilidad de la Semilla (Años)</label>
                  <input type="number" name="especiesviabilidadsemilla" value={formData.especiesviabilidadsemilla || ''} onChange={handleChange} style={{ marginTop: '8px' }} />
                </div>
              </div>

              {/* CRONOLOGÍA MODULAR */}
              <div className="form-group full" style={{ marginBottom: '10px', padding: '20px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <h3 style={{ margin: '0 0 15px 0', color: '#1e293b', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  ⏱️ Cronología Modular (Días de Desarrollo)
                </h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                  {/* BLOQUE 1: DDS */}
                  <div style={{ background: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                    <h4 style={{ margin: '0 0 10px 0', color: '#3b82f6', borderBottom: '2px solid #bfdbfe', paddingBottom: '8px', fontSize: '1rem' }}>
                      Bloque 1: Desde la Siembra (DDS)
                    </h4>
                    <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '15px', lineHeight: '1.4' }}>
                      Estos tiempos se cuentan siempre desde el momento en el que la semilla toca la tierra.
                    </p>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label style={{ fontWeight: 'bold' }}>Días hasta Germinación</label>
                        <input type="number" name="especiesdiasgerminacion" value={formData.especiesdiasgerminacion || ''} onChange={handleChange} />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label style={{ fontWeight: 'bold' }}>Edad del Plantel (Días a Trasplante)</label>
                        <input type="number" name="especiesdiashastatrasplante" value={formData.especiesdiashastatrasplante || ''} onChange={handleChange} />
                      </div>
                    </div>
                  </div>

                  {/* BLOQUE 2: DDT */}
                  <div style={{ background: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                    <h4 style={{ margin: '0 0 10px 0', color: '#10b981', borderBottom: '2px solid #a7f3d0', paddingBottom: '8px', fontSize: '1rem' }}>
                      Bloque 2: Desde el Trasplante (DDT)
                    </h4>
                    <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '15px', lineHeight: '1.4' }}>
                      Estos tiempos se cuentan después de plantar el plantel. <em>Si es de siembra directa, se contarán desde el Día 0.</em>
                    </p>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label style={{ fontWeight: 'bold' }}>Días hasta Fructificación</label>
                        <input type="number" name="especiesdiashastafructificacion" value={formData.especiesdiashastafructificacion || ''} onChange={handleChange} />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label style={{ fontWeight: 'bold' }}>Días hasta Recolección / Cosecha</label>
                        <input type="number" name="especiesdiashastarecoleccion" value={formData.especiesdiashastarecoleccion || ''} onChange={handleChange} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* REQUISITOS TÉRMICOS */}
              <div className="form-group full" style={{ marginBottom: '10px', padding: '20px', background: '#fff1f2', borderRadius: '12px', border: '1px solid #fecdd3' }}>
                <h3 style={{ margin: '0 0 15px 0', color: '#be123c', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  🌡️ Requisitos Térmicos (°C)
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
                  <div className="form-group" style={{ margin: 0, background: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid #fecdd3' }}>
                    <label style={{ color: '#0369a1' }}>Mínima (Sobrevive)</label>
                    <input type="number" step="0.1" name="especiestemperaturaminima" value={formData.especiestemperaturaminima || ''} onChange={handleChange} />
                  </div>
                  <div className="form-group" style={{ margin: 0, background: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid #fecdd3' }}>
                    <label style={{ color: '#15803d' }}>Óptima (Desarrollo)</label>
                    <input type="number" step="0.1" name="especiestemperaturaoptima" value={formData.especiestemperaturaoptima || ''} onChange={handleChange} />
                  </div>
                  <div className="form-group" style={{ margin: 0, background: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid #fecdd3' }}>
                    <label style={{ color: '#be123c' }}>Máxima (Estrés)</label>
                    <input type="number" step="0.1" name="especiestemperaturamaxima" value={formData.especiestemperaturamaxima || ''} onChange={handleChange} />
                  </div>
                </div>
              </div>

              {/* PROFUNDIDADES */}
              <div className="form-group full" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Profundidad de Siembra (cm)</label>
                  <input type="number" step="0.1" name="especiesprofundidadsiembra" value={formData.especiesprofundidadsiembra || ''} onChange={handleChange} />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Profundidad de Trasplante</label>
                  <input type="text" name="especiesprofundidadtrasplante" placeholder="Ej: Hasta los cotiledones" value={formData.especiesprofundidadtrasplante || ''} onChange={handleChange} />
                </div>
              </div>
            </div>
          )}

          {/* CALENDARIOS */}
          {activeTab === 'calendarios' && (
            <div className="grid-form">
              <div className="form-group full">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
                  {['siembradirecta', 'semillero', 'trasplante', 'recoleccion'].map(tipo => {
                    const colorMap: Record<string, string> = {
                      siembradirecta: '#f97316',
                      semillero: '#3b82f6',
                      trasplante: '#a855f7',
                      recoleccion: '#22c55e'
                    };
                    const labelMap: Record<string, string> = {
                      siembradirecta: 'Siembra Directa',
                      semillero: 'Semillero',
                      trasplante: 'Trasplante',
                      recoleccion: 'Recolección'
                    };
                    return (
                      <div key={tipo} style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', borderTop: `4px solid ${colorMap[tipo]}`, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <strong style={{ display: 'block', marginBottom: '10px', fontSize: '0.95rem', color: '#334155' }}>{labelMap[tipo]}</strong>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <select 
                            name={tipo === 'trasplante' ? `especies${tipo}desde` : `especiesfecha${tipo}desde`} 
                            value={formData[tipo === 'trasplante' ? `especies${tipo}desde` : `especiesfecha${tipo}desde`] || ''} 
                            onChange={handleChange} 
                            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                          >
                            <option value="">Desde (Mes)...</option>
                            {MESES.map(m => <option key={m.val} value={m.val}>{m.label}</option>)}
                          </select>
                          <select 
                            name={tipo === 'trasplante' ? `especies${tipo}hasta` : `especiesfecha${tipo}hasta`} 
                            value={formData[tipo === 'trasplante' ? `especies${tipo}hasta` : `especiesfecha${tipo}hasta`] || ''} 
                            onChange={handleChange} 
                            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                          >
                            <option value="">Hasta (Mes)...</option>
                            {MESES.map(m => <option key={m.val} value={m.val}>{m.label}</option>)}
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="form-group full" style={{ marginTop: '10px' }}>
                <h3 style={{ fontSize: '1.1rem', color: '#334155', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', marginBottom: '15px' }}>
                  📊 Gráfico del Calendario de Cultivo
                </h3>
                
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                  {/* Cabecera de meses */}
                  <div style={{ display: 'grid', gridTemplateColumns: '70px repeat(12, 1fr)', background: '#f1f5f9', borderBottom: '1px solid #e2e8f0' }}>
                    <div style={{ padding: '8px 4px', fontWeight: 'bold', color: '#64748b', fontSize: '0.7rem', borderRight: '1px solid #e2e8f0', textAlign: 'center' }}>FASE</div>
                    {MESES.map(m => (
                      <div key={m.val} style={{ padding: '8px 0', textAlign: 'center', fontWeight: 'bold', color: '#475569', fontSize: '0.7rem', borderRight: m.val < 12 ? '1px solid #e2e8f0' : 'none' }}>
                        {m.label.charAt(0)}
                      </div>
                    ))}
                  </div>

                  {/* Filas del gráfico */}
                  {['siembradirecta', 'semillero', 'trasplante', 'recoleccion'].map((tipo, idx) => {
                    const colorMap: Record<string, string> = { siembradirecta: '#f97316', semillero: '#3b82f6', trasplante: '#a855f7', recoleccion: '#22c55e' };
                    const labelMap: Record<string, string> = { siembradirecta: 'Siembra', semillero: 'Semillero', trasplante: 'Traspl.', recoleccion: 'Recol.' };
                    
                    const desde = parseInt(formData[tipo === 'trasplante' ? `especies${tipo}desde` : `especiesfecha${tipo}desde`]) || 0;
                    const hasta = parseInt(formData[tipo === 'trasplante' ? `especies${tipo}hasta` : `especiesfecha${tipo}hasta`]) || 0;
                    
                    const isMonthActive = (m: number) => {
                      if (!desde || !hasta) return false;
                      if (desde <= hasta) return m >= desde && m <= hasta;
                      return m >= desde || m <= hasta;
                    };

                    return (
                      <div key={tipo} style={{ display: 'grid', gridTemplateColumns: '70px repeat(12, 1fr)', borderBottom: idx < 3 ? '1px solid #e2e8f0' : 'none', background: '#fff' }}>
                        <div style={{ padding: '8px 4px', fontSize: '0.65rem', fontWeight: 'bold', color: '#334155', borderRight: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: colorMap[tipo], flexShrink: 0 }}></span>
                          {labelMap[tipo]}
                        </div>
                        {MESES.map(m => {
                          const active = isMonthActive(m.val);
                          return (
                            <div key={m.val} style={{ 
                              padding: '8px 0', 
                              borderRight: m.val < 12 ? '1px dashed #e2e8f0' : 'none',
                              background: active ? `${colorMap[tipo]}20` : 'transparent',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              {active && <div style={{ width: '100%', height: '10px', background: colorMap[tipo], borderRadius: '2px', margin: '0 1px' }}></div>}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TEXTOS */}
          {activeTab === 'textos' && (
            <div className="grid-form">
              <div className="form-group full">
                <label>Historia / Origen</label>
                <textarea name="especieshistoria" rows={3} value={formData.especieshistoria || ''} onChange={handleChange} />
              </div>
              <div className="form-group full">
                <label>Descripción / Cultivo</label>
                <textarea name="especiesdescripcion" rows={3} value={formData.especiesdescripcion || ''} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>pH del Suelo</label>
                <input type="text" name="especiesphsuelo" placeholder="Ej: 5.5 - 6.5" value={formData.especiesphsuelo || ''} onChange={handleChange} />
              </div>
              <div className="form-group full">
                <label>Características del Suelo</label>
                <textarea name="especiescaracteristicassuelo" rows={2} value={formData.especiescaracteristicassuelo || ''} onChange={handleChange} />
              </div>
              <div className="form-group full">
                <label>Fuentes (URLs separadas por comas)</label>
                <input type="text" name="especiesfuentesinformacion" value={formData.especiesfuentesinformacion || ''} onChange={handleChange} />
                {formData.especiesfuentesinformacion && typeof formData.especiesfuentesinformacion === 'string' && formData.especiesfuentesinformacion.trim() !== '' && (
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
                    {formData.especiesfuentesinformacion.split(',').map((url: string, idx: number) => {
                      const trimmedUrl = url.trim();
                      if (!trimmedUrl) return null;
                      const href = trimmedUrl.startsWith('http') ? trimmedUrl : `https://${trimmedUrl}`;
                      return (
                        <a 
                          key={idx} 
                          href={href} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{
                            background: '#e0e7ff',
                            color: '#4338ca',
                            padding: '6px 12px',
                            borderRadius: '16px',
                            fontSize: '0.8rem',
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            border: '1px solid #c7d2fe',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                            transition: 'all 0.2s'
                          }}
                        >
                          🔗 {trimmedUrl.length > 35 ? trimmedUrl.substring(0,35) + '...' : trimmedUrl}
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* LUNA Y BIODINAMICA */}
          {activeTab === 'biodinamica' && (
            <div className="grid-form" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* SECCIÓN CALENDARIO LUNAR */}
              <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ margin: '0 0 16px 0', color: '#1e293b', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  🌕 Calendario Lunar
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontWeight: 'bold' }}>Fase de Siembra</label>
                    <select name="especieslunarfasesiembra" value={formData.especieslunarfasesiembra || ''} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                      <option value="">— Seleccionar Fase —</option>
                      <option value="Creciente">🌘 Cuarto Creciente (Savia sube)</option>
                      <option value="Menguante">🌔 Cuarto Menguante (Savia baja)</option>
                      <option value="Nueva">🌑 Luna Nueva</option>
                      <option value="Llena">🌕 Luna Llena</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontWeight: 'bold' }}>Fase de Trasplante</label>
                    <select name="especieslunarfasetrasplante" value={formData.especieslunarfasetrasplante || ''} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                      <option value="">— Seleccionar Fase —</option>
                      <option value="Creciente">🌘 Cuarto Creciente</option>
                      <option value="Menguante">🌔 Cuarto Menguante (Recomendado)</option>
                      <option value="Nueva">🌑 Luna Nueva</option>
                      <option value="Llena">🌕 Luna Llena</option>
                    </select>
                  </div>
                </div>
                <div className="form-group full" style={{ margin: 0 }}>
                  <label style={{ fontWeight: 'bold' }}>Observaciones del Calendario Lunar</label>
                  <textarea name="especieslunarobservaciones" value={formData.especieslunarobservaciones || ''} onChange={handleChange} rows={3} placeholder="Ej: La lechuga es preferible sembrarla en menguante para evitar que espigue rápido..." style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', resize: 'vertical' }} />
                </div>
              </div>

              {/* SECCIÓN CALENDARIO BIODINÁMICO */}
              <div style={{ background: '#f0fdfa', padding: '20px', borderRadius: '12px', border: '1px solid #ccfbf1' }}>
                <h3 style={{ margin: '0 0 16px 0', color: '#0f766e', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  🌍 Calendario Biodinámico
                </h3>
                
                <div className="form-group full" style={{ marginBottom: '16px' }}>
                  <label style={{ fontWeight: 'bold', color: '#0f766e' }}>Categoría del Órgano Principal</label>
                  <select name="especiesbiodinamicacategoria" value={formData.especiesbiodinamicacategoria || ''} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #99f6e4', fontSize: '1rem', background: '#fff' }}>
                    <option value="">— Sin categoría —</option>
                    <option value="fruto">🍅 Planta de Fruto (Días de Fuego/Calor)</option>
                    <option value="raiz">🥕 Planta de Raíz (Días de Tierra/Frío)</option>
                    <option value="hoja">🥬 Planta de Hoja (Días de Agua/Humedad)</option>
                    <option value="flor">🌸 Planta de Flor (Días de Aire/Luz)</option>
                  </select>
                  {formData.especiesbiodinamicacategoria && (
                    <p style={{ marginTop: '8px', fontSize: '0.85rem', color: '#0f766e', lineHeight: 1.5 }}>
                      {({ fruto: 'Siembra y trasplanta en días Fruto. Recolecta también en días Fruto para mejor sabor y conservación.', raiz: 'Siembra en días Raíz. Recolecta en días Raíz para mejor conservación.', hoja: 'Siembra y trasplanta en días Hoja. Evita podar o cosechar en días Fruto.', flor: 'Trabaja en días Flor para multiplicación y floración abundante. Cosecha en días Flor para mayor fragancia.' } as Record<string, string>)[formData.especiesbiodinamicacategoria]}
                    </p>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontWeight: 'bold', color: '#0f766e' }}>Fase de Siembra Biodinámica</label>
                    <select name="especiesbiodinamicafasesiembra" value={formData.especiesbiodinamicafasesiembra || ''} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #99f6e4', background: '#fff' }}>
                      <option value="">— Seleccionar Fase —</option>
                      <option value="Ascendente">📈 Luna Ascendente (Savia sube)</option>
                      <option value="Descendente">📉 Luna Descendente (Savia en raíces)</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontWeight: 'bold', color: '#0f766e' }}>Fase de Trasplante Biodinámica</label>
                    <select name="especiesbiodinamicafasetrasplante" value={formData.especiesbiodinamicafasetrasplante || ''} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #99f6e4', background: '#fff' }}>
                      <option value="">— Seleccionar Fase —</option>
                      <option value="Ascendente">📈 Luna Ascendente</option>
                      <option value="Descendente">📉 Luna Descendente (Recomendado)</option>
                    </select>
                  </div>
                </div>

                <div className="form-group full" style={{ margin: 0 }}>
                  <label style={{ fontWeight: 'bold', color: '#0f766e' }}>Notas de Calendario Biodinámico</label>
                  <textarea name="especiesbiodinamicanotas" value={formData.especiesbiodinamicanotas || ''} onChange={handleChange} rows={3} placeholder="Ej: Además del día de Fruto, evitar perigeos y nodos lunares para la siembra..." style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #99f6e4', background: '#fff', resize: 'vertical' }} />
                </div>
              </div>

            </div>
          )}

          {/* AUTOSUFICIENCIA */}
          {activeTab === 'autosuficiencia' && (
            <div className="grid-form">
              <div className="form-group">
                <label>Marco Plantas (cm)</label>
                <input type="number" name="especiesmarcoplantas" value={formData.especiesmarcoplantas || ''} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Marco Filas (cm)</label>
                <input type="number" name="especiesmarcofilas" value={formData.especiesmarcofilas || ''} onChange={handleChange} />
              </div>

              {(formData.especiesmarcoplantas || formData.especiesmarcofilas) && (
                <div className="form-group full" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '10px', padding: '15px', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1', boxSizing: 'border-box', maxWidth: '100%', overflow: 'hidden' }}>
                  <span style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '10px', fontWeight: 'bold' }}>Esquema de Plantación a Escala</span>
                  
                  {(() => {
                    let p = parseFloat(formData.especiesmarcoplantas);
                    let f = parseFloat(formData.especiesmarcofilas);
                    if (!p || p <= 0) p = 50;
                    if (!f || f <= 0) f = 50;

                    const maxW = 160;
                    const maxH = 120;
                    
                    let drawW, drawH;
                    const ratio = p / f;
                    const maxRatio = maxW / maxH;

                    if (ratio > maxRatio) {
                      drawW = maxW;
                      drawH = maxW / ratio;
                    } else {
                      drawH = maxH;
                      drawW = maxH * ratio;
                    }

                    if (drawW < 40) drawW = 40;
                    if (drawH < 40) drawH = 40;

                    const cx = 120;
                    const cy = 90;
                    const x1 = cx - drawW / 2;
                    const x2 = cx + drawW / 2;
                    const y1 = cy - drawH / 2;
                    const y2 = cy + drawH / 2;

                    return (
                      <svg width="240" height="180" viewBox="0 0 240 180" xmlns="http://www.w3.org/2000/svg" style={{ maxWidth: '100%', height: 'auto' }}>
                        <circle cx={x1} cy={y1} r="8" fill="#22c55e" />
                        <circle cx={x2} cy={y1} r="8" fill="#22c55e" />
                        <circle cx={x1} cy={y2} r="8" fill="#22c55e" />
                        <circle cx={x2} cy={y2} r="8" fill="#22c55e" />

                        {x2 - x1 > 30 && (
                          <>
                            <line x1={x1 + 12} y1={y1} x2={x2 - 12} y2={y1} stroke="#94a3b8" strokeWidth="2" />
                            <polygon points={`${x1+12},${y1-4} ${x1+8},${y1} ${x1+12},${y1+4}`} fill="#94a3b8" />
                            <polygon points={`${x2-12},${y1-4} ${x2-8},${y1} ${x2-12},${y1+4}`} fill="#94a3b8" />
                          </>
                        )}
                        
                        <rect x={cx - 30} y={y1 - 10} width="60" height="20" fill="#f8fafc" rx="4" />
                        <text x={cx} y={y1 + 4} fontSize="12" fontWeight="bold" fill="#334155" textAnchor="middle">
                          {formData.especiesmarcoplantas ? `${formData.especiesmarcoplantas} cm` : '? cm'}
                        </text>

                        {y2 - y1 > 30 && (
                          <>
                            <line x1={x1} y1={y1 + 12} x2={x1} y2={y2 - 12} stroke="#94a3b8" strokeWidth="2" />
                            <polygon points={`${x1-4},${y1+12} ${x1},${y1+8} ${x1+4},${y1+12}`} fill="#94a3b8" />
                            <polygon points={`${x1-4},${y2-12} ${x1},${y2-8} ${x1+4},${y2-12}`} fill="#94a3b8" />
                          </>
                        )}
                        
                        <rect x={x1 - 30} y={cy - 10} width="60" height="20" fill="#f8fafc" rx="4" />
                        <text x={x1} y={cy + 4} fontSize="12" fontWeight="bold" fill="#334155" textAnchor="middle">
                          {formData.especiesmarcofilas ? `${formData.especiesmarcofilas} cm` : '? cm'}
                        </text>

                        <line x1={x2} y1={y1 + 12} x2={x2} y2={y2 - 12} stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 4" />
                        <line x1={x1 + 12} y1={y2} x2={x2 - 12} y2={y2} stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 4" />
                      </svg>
                    );
                  })()}

                  <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0', textAlign: 'center' }}>
                    <strong style={{color:'#64748b'}}>Marco Plantas:</strong> distancia entre plantas de la misma fila.<br/>
                    <strong style={{color:'#64748b'}}>Marco Filas:</strong> distancia entre las diferentes filas.
                  </p>
                </div>
              )}

              <div className="form-group full" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                <div>
                  <label>🌱 Parcial (plantas/pers)</label>
                  <input type="number" step="0.1" name="especiesautosuficienciaparcial" value={formData.especiesautosuficienciaparcial || ''} onChange={handleChange} />
                </div>
                <div>
                  <label>🥬 Completa (plantas/pers)</label>
                  <input type="number" step="0.1" name="especiesautosuficiencia" value={formData.especiesautosuficiencia || ''} onChange={handleChange} />
                </div>
                <div>
                  <label>🥫 Conserva (plantas/pers)</label>
                  <input type="number" step="0.1" name="especiesautosuficienciaconserva" value={formData.especiesautosuficienciaconserva || ''} onChange={handleChange} />
                </div>
              </div>
              
              <div className="form-group full" style={{ padding: '15px', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1', marginTop: '10px' }}>
                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0, textAlign: 'center' }}>
                  <strong>Nota:</strong> Estos valores indican el número estimado de plantas necesarias para abastecer a <strong>una persona</strong> durante un año.
                </p>
              </div>

              {/* CALCULADORA */}
              {(() => {
                const pParcial = parseFloat(formData.especiesautosuficienciaparcial) || 0;
                const pFresco = parseFloat(formData.especiesautosuficiencia) || 0;
                const pConserva = parseFloat(formData.especiesautosuficienciaconserva) || 0;
                const totalPParcial = pParcial * calcPersonas;
                const totalPFresco = pFresco * calcPersonas;
                const totalPConserva = pConserva * calcPersonas;
                
                const marcoP = (parseFloat(formData.especiesmarcoplantas) || 0) / 100;
                const marcoF = (parseFloat(formData.especiesmarcofilas) || 0) / 100;
                const areaPlant = marcoP * marcoF;
                
                const m2Parcial = totalPParcial * areaPlant;
                const m2Fresco = totalPFresco * areaPlant;
                const m2Conserva = totalPConserva * areaPlant;

                return (
                  <div className="form-group full" style={{ marginTop: '20px', padding: '14px', background: '#f0fdf4', border: '2px solid #22c55e', borderRadius: '8px', boxSizing: 'border-box', maxWidth: '100%', overflow: 'hidden' }}>
                    <h3 style={{ marginTop: 0, color: '#166534', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.2rem' }}>
                      🧮 Calculadora de Autosuficiencia
                      <span style={{ fontSize: '0.8rem', fontWeight: 'normal', background: '#dcfce7', padding: '3px 8px', borderRadius: '12px' }}>No se guarda</span>
                    </h3>
                    
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', marginBottom: '20px' }}>
                      <label style={{ fontWeight: 'bold', color: '#15803d' }}>Número de Personas a alimentar:</label>
                      <input 
                        type="number" 
                        min="1" 
                        value={calcPersonas} 
                        onChange={(e) => setCalcPersonas(parseInt(e.target.value) || 1)} 
                        style={{ width: '80px', padding: '8px', border: '1px solid #86efac', borderRadius: '4px', textAlign: 'center', fontSize: '1.1rem' }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                      <div style={{ background: '#fff', padding: '15px', borderRadius: '8px', border: '1px solid #bbf7d0', textAlign: 'center' }}>
                        <h4 style={{ margin: '0 0 10px 0', color: '#15803d', borderBottom: '1px solid #bbf7d0', paddingBottom: '10px' }}>🌱 Parcial</h4>
                        <span style={{ display: 'block', fontSize: '0.9rem', color: '#166534' }}>Plantas Necesarias</span>
                        <strong style={{ fontSize: '1.8rem', color: '#15803d', display: 'block', marginBottom: '10px' }}>{totalPParcial.toFixed(1)}</strong>
                        <span style={{ display: 'block', fontSize: '0.9rem', color: '#166534' }}>Terreno Necesario</span>
                        <strong style={{ fontSize: '1.8rem', color: '#15803d' }}>{m2Parcial > 0 ? `${m2Parcial.toFixed(2)} m²` : '--- m²'}</strong>
                      </div>

                      <div style={{ background: '#fff', padding: '15px', borderRadius: '8px', border: '1px solid #bbf7d0', textAlign: 'center' }}>
                        <h4 style={{ margin: '0 0 10px 0', color: '#15803d', borderBottom: '1px solid #bbf7d0', paddingBottom: '10px' }}>🥬 Completa</h4>
                        <span style={{ display: 'block', fontSize: '0.9rem', color: '#166534' }}>Plantas Necesarias</span>
                        <strong style={{ fontSize: '1.8rem', color: '#15803d', display: 'block', marginBottom: '10px' }}>{totalPFresco.toFixed(1)}</strong>
                        <span style={{ display: 'block', fontSize: '0.9rem', color: '#166534' }}>Terreno Necesario</span>
                        <strong style={{ fontSize: '1.8rem', color: '#15803d' }}>{m2Fresco > 0 ? `${m2Fresco.toFixed(2)} m²` : '--- m²'}</strong>
                      </div>

                      <div style={{ background: '#fff', padding: '15px', borderRadius: '8px', border: '1px solid #bbf7d0', textAlign: 'center' }}>
                        <h4 style={{ margin: '0 0 10px 0', color: '#15803d', borderBottom: '1px solid #bbf7d0', paddingBottom: '10px' }}>🥫 Conserva</h4>
                        <span style={{ display: 'block', fontSize: '0.9rem', color: '#166534' }}>Plantas Necesarias</span>
                        <strong style={{ fontSize: '1.8rem', color: '#15803d', display: 'block', marginBottom: '10px' }}>{totalPConserva.toFixed(1)}</strong>
                        <span style={{ display: 'block', fontSize: '0.9rem', color: '#166534' }}>Terreno Necesario</span>
                        <strong style={{ fontSize: '1.8rem', color: '#15803d' }}>{m2Conserva > 0 ? `${m2Conserva.toFixed(2)} m²` : '--- m²'}</strong>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* ASOCIACIONES */}
          {activeTab === 'asociaciones' && (
            <div className="grid-form">
              <div className="form-group full">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h4 style={{ margin: 0 }}>Asociaciones Beneficiosas</h4>
                  {relacionesSaveStatus !== 'idle' && (
                    <span style={{ 
                      fontSize: '0.85rem', fontWeight: 'bold', padding: '4px 10px', borderRadius: '12px',
                      color: relacionesSaveStatus === 'no-changes' ? '#10b981' : '#64748b',
                      background: relacionesSaveStatus === 'no-changes' ? '#dcfce7' : '#f1f5f9',
                      transition: 'all 0.3s'
                    }}>
                      {relacionesSaveStatus === 'saving' ? '⏳ Guardando...' : '✓ Guardado'}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                  <select id="selBen" style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                    <option value="">Selecciona especie...</option>
                    {masterEspecies.filter(e => e.idespecies.toString() !== entityId).map(e => <option key={e.idespecies} value={e.idespecies}>{e.especiesnombre}</option>)}
                  </select>
                  <input type="text" id="motivoBen" placeholder="Motivo (opcional)" style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                  <button type="button" onClick={() => {
                    const sel = document.getElementById('selBen') as HTMLSelectElement;
                    const mot = document.getElementById('motivoBen') as HTMLInputElement;
                    if (!sel.value) return;
                    if (relaciones.beneficiosas.some((b: any) => b.xasociacionesbeneficiosasidespeciedestino.toString() === sel.value)) { alert('Ya añadida'); return; }
                    const sp = masterEspecies.find(e => e.idespecies.toString() === sel.value);
                    const updated = {
                      ...relaciones,
                      beneficiosas: [...relaciones.beneficiosas, { 
                        xasociacionesbeneficiosasidespeciedestino: parseInt(sel.value),
                        especie_destino_nombre: sp?.especiesnombre,
                        asociacionesbeneficiosasmotivo: mot.value 
                      }]
                    };
                    setRelaciones(updated);
                    saveRelacionesNow(updated);
                    sel.value = ''; mot.value = '';
                  }} style={{ padding: '8px 16px', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Añadir</button>
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {relaciones.beneficiosas.map((b: any, idx: number) => (
                    <li key={idx} style={{ padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '8px', display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: '12px', alignItems: 'center' }}>
                      <div><strong>{b.especie_destino_nombre}</strong></div>
                      <input type="text" value={b.asociacionesbeneficiosasmotivo || ''} placeholder="Motivo de la asociación..." onChange={(e) => {
                        const updatedBen = relaciones.beneficiosas.map((bb: any, i: number) => i === idx ? { ...bb, asociacionesbeneficiosasmotivo: e.target.value } : bb);
                        setRelaciones({ ...relaciones, beneficiosas: updatedBen });
                        setRelacionesDirty(true);
                      }} onBlur={() => { saveRelacionesNow(relaciones); }} style={{ padding: '6px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }} />
                      <button type="button" onClick={() => {
                        const updated = { ...relaciones, beneficiosas: relaciones.beneficiosas.filter((_: any, i: number) => i !== idx) };
                        setRelaciones(updated);
                        saveRelacionesNow(updated);
                      }} style={{ color: '#ef4444', border: 'none', background: '#fee2e2', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer' }}>🗑️</button>
                    </li>
                  ))}
                  {relaciones.beneficiosas.length === 0 && <p style={{ color: '#94a3b8', fontStyle: 'italic', margin: 0 }}>No hay asociaciones beneficiosas.</p>}
                </ul>
              </div>

              <div className="form-group full" style={{ marginTop: '20px' }}>
                <h4>Asociaciones Perjudiciales</h4>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                  <select id="selPer" style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                    <option value="">Selecciona especie...</option>
                    {masterEspecies.filter(e => e.idespecies.toString() !== entityId).map(e => <option key={e.idespecies} value={e.idespecies}>{e.especiesnombre}</option>)}
                  </select>
                  <input type="text" id="motivoPer" placeholder="Motivo (opcional)" style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                  <button type="button" onClick={() => {
                    const sel = document.getElementById('selPer') as HTMLSelectElement;
                    const mot = document.getElementById('motivoPer') as HTMLInputElement;
                    if (!sel.value) return;
                    if (relaciones.perjudiciales.some((p: any) => p.xasociacionesperjudicialesidespeciedestino.toString() === sel.value)) { alert('Ya añadida'); return; }
                    const sp = masterEspecies.find(e => e.idespecies.toString() === sel.value);
                    const updated = {
                      ...relaciones,
                      perjudiciales: [...relaciones.perjudiciales, { 
                        xasociacionesperjudicialesidespeciedestino: parseInt(sel.value),
                        especie_destino_nombre: sp?.especiesnombre,
                        asociacionesperjudicialesmotivo: mot.value 
                      }]
                    };
                    setRelaciones(updated);
                    saveRelacionesNow(updated);
                    sel.value = ''; mot.value = '';
                  }} style={{ padding: '8px 16px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Añadir</button>
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {relaciones.perjudiciales.map((p: any, idx: number) => (
                    <li key={idx} style={{ padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '8px', display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: '12px', alignItems: 'center' }}>
                      <div><strong>{p.especie_destino_nombre}</strong></div>
                      <input type="text" value={p.asociacionesperjudicialesmotivo || ''} placeholder="Motivo de la asociación..." onChange={(e) => {
                        const updatedPer = relaciones.perjudiciales.map((pp: any, i: number) => i === idx ? { ...pp, asociacionesperjudicialesmotivo: e.target.value } : pp);
                        setRelaciones({ ...relaciones, perjudiciales: updatedPer });
                        setRelacionesDirty(true);
                      }} onBlur={() => { saveRelacionesNow(relaciones); }} style={{ padding: '6px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }} />
                      <button type="button" onClick={() => {
                        const updated = { ...relaciones, perjudiciales: relaciones.perjudiciales.filter((_: any, i: number) => i !== idx) };
                        setRelaciones(updated);
                        saveRelacionesNow(updated);
                      }} style={{ color: '#ef4444', border: 'none', background: '#fee2e2', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer' }}>🗑️</button>
                    </li>
                  ))}
                  {relaciones.perjudiciales.length === 0 && <p style={{ color: '#94a3b8', fontStyle: 'italic', margin: 0 }}>No hay asociaciones perjudiciales.</p>}
                </ul>
              </div>
            </div>
          )}

          {/* PLAGAS */}
          {activeTab === 'plagas' && (
            <div className="grid-form">
              <div className="form-group full">
                <h4>Plagas / Enfermedades Asociadas</h4>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
                  <select id="selPla" style={{ flex: 1, minWidth: '200px', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                    <option value="">Selecciona plaga o enfermedad...</option>
                    {masterPlagas.map(p => <option key={p.idplagas} value={p.idplagas}>{p.plagasnombre} ({p.plagastipo})</option>)}
                  </select>
                  <select id="riesgoPla" style={{ width: '120px', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                    <option value="baja">Riesgo Bajo</option>
                    <option value="media">Riesgo Medio</option>
                    <option value="alta">Riesgo Alto</option>
                  </select>
                  <input type="text" id="notasPla" placeholder="Notas (opcional)" style={{ flex: 2, minWidth: '200px', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                  <button type="button" onClick={() => {
                    const sel = document.getElementById('selPla') as HTMLSelectElement;
                    const r = document.getElementById('riesgoPla') as HTMLSelectElement;
                    const n = document.getElementById('notasPla') as HTMLInputElement;
                    if (!sel.value) return;
                    if (relaciones.plagas.some((p: any) => p.xespeciesplagasidplagas.toString() === sel.value)) { alert('Ya añadida'); return; }
                    const pla = masterPlagas.find(p => p.idplagas.toString() === sel.value);
                    const updated = {
                      ...relaciones,
                      plagas: [...relaciones.plagas, { 
                        xespeciesplagasidplagas: parseInt(sel.value),
                        plagasnombre: pla?.plagasnombre,
                        plagastipo: pla?.plagastipo,
                        especiesplagasnivelriesgo: r.value,
                        especiesplagasnotasespecificas: n.value 
                      }]
                    };
                    setRelaciones(updated);
                    saveRelacionesNow(updated);
                    sel.value = ''; n.value = ''; r.value = 'media';
                  }} style={{ padding: '8px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Añadir Plaga</button>
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {relaciones.plagas.map((p: any, idx: number) => (
                    <li key={idx} style={{ padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '8px', display: 'grid', gridTemplateColumns: 'auto auto 1fr auto', gap: '12px', alignItems: 'center' }}>
                      <div>
                        <strong>{p.plagasnombre}</strong> <span style={{ color: '#64748b', fontSize: '0.85rem' }}>({p.plagastipo})</span>
                      </div>
                      <select value={p.especiesplagasnivelriesgo || 'media'} onChange={(e) => {
                        const updatedPlagas = relaciones.plagas.map((pl: any, i: number) => i === idx ? { ...pl, especiesplagasnivelriesgo: e.target.value } : pl);
                        const updated = { ...relaciones, plagas: updatedPlagas };
                        setRelaciones(updated);
                        saveRelacionesNow(updated);
                      }} style={{ padding: '6px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontWeight: 'bold', color: p.especiesplagasnivelriesgo === 'alta' ? '#ef4444' : p.especiesplagasnivelriesgo === 'baja' ? '#10b981' : '#f59e0b', cursor: 'pointer', minWidth: '130px' }}>
                        <option value="baja">🟢 Riesgo Bajo</option>
                        <option value="media">🟡 Riesgo Medio</option>
                        <option value="alta">🔴 Riesgo Alto</option>
                      </select>
                      <input type="text" value={p.especiesplagasnotasespecificas || ''} placeholder="Descripción del daño..." onChange={(e) => {
                        const updatedPlagas = relaciones.plagas.map((pl: any, i: number) => i === idx ? { ...pl, especiesplagasnotasespecificas: e.target.value } : pl);
                        setRelaciones({ ...relaciones, plagas: updatedPlagas });
                        setRelacionesDirty(true);
                      }} onBlur={() => { saveRelacionesNow(relaciones); }} style={{ padding: '6px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }} />
                      <button type="button" onClick={() => {
                        const updated = { ...relaciones, plagas: relaciones.plagas.filter((_: any, i: number) => i !== idx) };
                        setRelaciones(updated);
                        saveRelacionesNow(updated);
                      }} style={{ color: '#ef4444', border: 'none', background: '#fee2e2', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer' }}>🗑️</button>
                    </li>
                  ))}
                  {relaciones.plagas.length === 0 && <p style={{ color: '#94a3b8', fontStyle: 'italic', margin: 0 }}>No hay plagas vinculadas.</p>}
                </ul>
              </div>
            </div>
          )}


          {/* SINONIMOS */}
          {activeTab === 'sinonimos' && (
            <div className="grid-form">
              <div className="form-group full" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0 }}>Gestión de Sinónimos y Nombres Locales</h3>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button 
                    type="button" 
                    onClick={openSinonimosConfig}
                    disabled={sinonimosAiLoading}
                    style={{ padding: '8px 16px', background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: sinonimosAiLoading ? 'not-allowed' : 'pointer' }}
                  >
                    {sinonimosAiLoading ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite', fontSize: '1.1rem' }}>⏳</span>
                        Buscando... {sinonimosAiSeconds}s
                      </span>
                    ) : '✨ Proponer Sinónimos (IA)'}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => {
                      setSinonimos([...sinonimos, { idespeciessinonimos: null, especiessinonimosnombre: '', xespeciessinonimosididiomas: '', xespeciessinonimosidpaises: '', especiessinonimosnotas: '' }]);
                      setSinonimosDirty(true);
                    }}
                    style={{ padding: '8px 16px', background: '#e2e8f0', color: '#334155', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    + Añadir Manualmente
                  </button>
                  {sinonimosDirty && (
                    <button 
                      type="button" 
                      onClick={saveSinonimosNow}
                      style={{ padding: '8px 16px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(16,185,129,0.4)' }}
                    >
                      💾 Guardar Cambios
                    </button>
                  )}
                </div>
              </div>

              <div className="form-group full">
                {sinonimos.length === 0 && !sinonimosAiLoading ? (
                  <div style={{ padding: '40px', textAlign: 'center', background: '#f8fafc', borderRadius: '12px', border: '2px dashed #cbd5e1' }}>
                    <p style={{ color: '#64748b', fontSize: '1.1rem', margin: '0 0 10px 0' }}>No hay sinónimos registrados.</p>
                    <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0 }}>Haz clic en "Proponer Sinónimos" para que la Inteligencia Artificial busque por ti.</p>
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                    <thead>
                      <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                        <th style={{ padding: '12px', textAlign: 'left', width: '30%' }}>Nombre / Sinónimo</th>
                        <th style={{ padding: '12px', textAlign: 'left', width: '20%' }}>Idioma</th>
                        <th style={{ padding: '12px', textAlign: 'left', width: '20%' }}>País / Región</th>
                        <th style={{ padding: '12px', textAlign: 'left', width: '20%' }}>Notas</th>
                        <th style={{ padding: '12px', textAlign: 'center', width: '10%' }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sinonimos.map((s, index) => (
                        <tr key={index} style={{ borderBottom: '1px solid #e2e8f0', background: s.idespeciessinonimos === null ? '#fefce8' : 'transparent' }}>
                          <td style={{ padding: '8px' }}>
                            <input 
                              type="text" 
                              value={s.especiessinonimosnombre} 
                              onChange={e => {
                                const newSin = [...sinonimos];
                                newSin[index].especiessinonimosnombre = e.target.value;
                                setSinonimos(newSin);
                                setSinonimosDirty(true);
                              }}
                              style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                              placeholder="Ej. Palta"
                            />
                          </td>
                          <td style={{ padding: '8px' }}>
                            <select 
                              value={s.xespeciessinonimosididiomas || ''} 
                              onChange={e => {
                                const newSin = [...sinonimos];
                                newSin[index].xespeciessinonimosididiomas = e.target.value;
                                setSinonimos(newSin);
                                setSinonimosDirty(true);
                              }}
                              style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                            >
                              <option value="">-- Sin especificar --</option>
                              {masterIdiomas.map(i => (
                                <option key={i.ididiomas} value={i.ididiomas}>{i.idiomasnombre}</option>
                              ))}
                            </select>
                          </td>
                          <td style={{ padding: '8px' }}>
                            <select 
                              value={s.xespeciessinonimosidpaises || ''} 
                              onChange={e => {
                                const newSin = [...sinonimos];
                                newSin[index].xespeciessinonimosidpaises = e.target.value;
                                setSinonimos(newSin);
                                setSinonimosDirty(true);
                              }}
                              style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                            >
                              <option value="">-- Sin especificar --</option>
                              {masterPaises.map(p => (
                                <option key={p.idpaises} value={p.idpaises}>{p.paisesnombre}</option>
                              ))}
                            </select>
                          </td>
                          <td style={{ padding: '8px' }}>
                            <input 
                              type="text" 
                              value={s.especiessinonimosnotas || ''} 
                              onChange={e => {
                                const newSin = [...sinonimos];
                                newSin[index].especiessinonimosnotas = e.target.value;
                                setSinonimos(newSin);
                                setSinonimosDirty(true);
                              }}
                              style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                              placeholder="Notas opcionales"
                            />
                          </td>
                          <td style={{ padding: '8px', textAlign: 'center' }}>
                            <button 
                              type="button" 
                              onClick={async () => {
                                const sinToDelete = sinonimos[index];
                                const newSin = [...sinonimos];
                                newSin.splice(index, 1);
                                setSinonimos(newSin);
                                // Auto-borrar de la BD si ya estaba guardado
                                if (sinToDelete.idespeciessinonimos && entityId) {
                                  try {
                                    await fetch(`/api/admin/${entityType}/${entityId}/sinonimos?id=${sinToDelete.idespeciessinonimos}`, { method: 'DELETE' });
                                  } catch (err) {
                                    console.error('Error borrando sinónimo:', err);
                                  }
                                }
                              }}
                              style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fca5a5', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* BLOGS */}
          {activeTab === 'blogs' && (
            <div className="grid-form">
              <div className="form-group full">
                <label style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: '16px' }}>
                  <span style={{ margin: 0 }}>Artículos del Blog generados para esta Especie</span>
                </label>
                {blogs.length === 0 ? (
                  <div style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', padding: '30px', textAlign: 'center', borderRadius: '12px', color: '#64748b' }}>
                    No hay ningún artículo generado para esta especie.<br/><br/>
                    <button type="button" onClick={() => setActiveTab('adjuntos')} style={{ background: '#10b981', color: 'white', padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
                      Ir a Adjuntos para generar uno a partir de un PDF
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                    {blogs.map(b => {
                      const linkedPdf = b.pdfSourceId ? pdfs.find((p: any) => p.id === b.pdfSourceId) : null;
                      return (
                      <div key={b.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', display: 'flex', flexDirection: 'column' }}>
                        {b.hero_imagen ? (
                          <img src={getMediaUrl(b.hero_imagen)} alt={b.hero_imagen_alt || b.titulo} style={{ width: '100%', height: '140px', objectFit: 'cover' }}  crossOrigin="anonymous" />
                        ) : (
                          <div style={{ width: '100%', height: '140px', background: 'linear-gradient(135deg, #0f766e, #10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '3rem' }}>📝</div>
                        )}
                        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                          <h3 style={{ margin: '0 0 6px 0', fontSize: '1.1rem', color: '#1e293b', lineHeight: 1.3 }}>{b.titulo}</h3>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', marginBottom: '8px', fontSize: '0.75rem', color: '#64748b' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>✍️ {b.autor}</span>
                            <span>•</span>
                            <span>{b.fechaCreacion ? new Date(b.fechaCreacion).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Sin fecha'}</span>
                            <span style={{ marginLeft: 'auto', background: b.estado === 'publicado' ? '#dcfce7' : '#fef3c7', color: b.estado === 'publicado' ? '#166534' : '#92400e', padding: '2px 8px', borderRadius: '10px', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase' }}>{b.estado}</span>
                          </div>
                          <p style={{ margin: '0 0 12px 0', fontSize: '0.85rem', color: '#64748b', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', flex: 1 }}>
                            {b.resumen}
                          </p>

                          {/* PDF asociado */}
                          <div style={{ marginBottom: '12px', padding: '8px 10px', background: linkedPdf ? '#ecfdf5' : '#f8fafc', border: `1px solid ${linkedPdf ? '#a7f3d0' : '#e2e8f0'}`, borderRadius: '6px', fontSize: '0.78rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {linkedPdf ? (
                              <a href={getMediaUrl(linkedPdf.ruta)} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none', color: '#0f766e', fontWeight: 600 }} onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'} onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>
                                📄 {linkedPdf.titulo || linkedPdf.nombreOriginal}
                              </a>
                            ) : (
                              <span style={{ color: '#94a3b8' }}>Sin PDF de origen vinculado</span>
                            )}
                          </div>

                          {/* Acciones */}
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <a href={`/blog/${b.slug}?preview=true`} target="_blank" rel="noopener noreferrer" style={{ textAlign: 'center', background: '#f1f5f9', color: '#0f766e', textDecoration: 'none', padding: '8px 12px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 'bold', border: '1px solid #cbd5e1', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'} onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}>
                              👁️
                            </a>
                            <a href={`/dashboard/admin/blog/${b.id}`} style={{ flex: 1, textAlign: 'center', background: '#eff6ff', color: '#2563eb', textDecoration: 'none', padding: '8px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 'bold', border: '1px solid #bfdbfe', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#dbeafe'} onMouseLeave={e => e.currentTarget.style.background = '#eff6ff'}>
                              ✏️ Editar
                            </a>
                            <button type="button" onClick={async () => {
                              if (!confirm(`¿Estás seguro de que quieres eliminar el blog "${b.titulo}"? Esta acción no se puede deshacer.`)) return;
                              try {
                                const res = await fetch(`/api/admin/blog/${b.id}`, { method: 'DELETE' });
                                const data = await res.json();
                                if (data.success) {
                                  setBlogs(prev => prev.filter(x => x.id !== b.id));
                                } else {
                                  alert(data.error || 'Error al eliminar');
                                }
                              } catch (e) { alert('Error de red al eliminar blog'); }
                            }} style={{ padding: '8px 12px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2'; }} onMouseLeave={e => { e.currentTarget.style.background = '#fef2f2'; }}>
                              🗑️
                            </button>
                          </div>
                        </div>
                      </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ADJUNTOS */}
          {activeTab === 'adjuntos' && (
            <div>
              {!entityId ? (
                <p>Guarda la especie primero para subir archivos adjuntos.</p>
              ) : (
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
                        try { meta = JSON.parse(p.resumen || '{}'); } catch(e){}
                        
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
                                
                                // Guardar estado original
                                const wasAlreadyPrimary = draggedItem.esPrincipal === 1;
                                
                                // Si se arrastra a la primera posición, marcarla como principal localmente
                                if (draggedOverPhotoIndex === 0) {
                                  newPhotos.forEach(p => p.esPrincipal = (p.id === draggedItem.id ? 1 : 0));
                                }
                                
                                handleReorderPhotos(newPhotos);
                                
                                // Si cayó en la primera posición y no era la principal, actualizar en servidor
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
                              alt={meta.seo_alt || 'foto especie'} 
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
                              <button type="button" className="photo-action-btn btn-photo-delete" onClick={() => handleDeleteFile(p.id, 'photos')} title="Eliminar">✕</button>
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
                              handleFileUpload({ target: { files: e.dataTransfer.files } }, 'photos');
                            }
                          }}
                        >
                          <input type="file" id="upload-photos" multiple accept="image/*" onChange={(e) => handleFileUpload(e, 'photos')} disabled={uploadingPhotos} />
                          <input type="file" id="upload-camera" accept="image/*" capture="environment" onChange={(e) => handleFileUpload(e, 'photos')} style={{display: 'none'}} disabled={uploadingPhotos} />
                          
                          {uploadingPhotos ? (
                            <div className="drop-zone-content">
                              <span style={{ fontSize: '1.5rem', animation: 'spin 2s linear infinite', display: 'inline-block' }}>⏳</span>
                              <span style={{ color: '#10b981', fontWeight: 'bold', fontSize: '0.75rem', textAlign: 'center' }}>Procesando...</span>
                              <span className="drop-hint" style={{ color: '#059669', fontSize: '0.65rem' }}>IA analizando</span>
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
                              <span className="drop-hint" style={{ fontSize: '0.7rem', textAlign: 'center', marginTop: '4px' }}>arrastra y suelta<br/>aquí</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="form-group full">
                    <label style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: '16px' }}>
                      <span style={{ margin: 0 }}>Documentos Adicionales (PDF)</span>
                      <button type="button" onClick={() => setShowPdfSearchModal(true)} style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', border: 'none', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)', margin: 0 }}>
                        ✨ Buscar PDFs con IA
                      </button>
                    </label>
                    <div className="gallery pdfs">
                      {pdfs.map(p => (
                        <div key={p.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {/* Cuadro de portada — solo la foto */}
                          <div className="gallery-item pdf" style={{ position: 'relative', overflow: 'hidden', borderRadius: '12px', border: '1px solid #e2e8f0', padding: 0 }}>
                            {p.portada ? (
                              <img src={getMediaUrl(p.portada)} alt={p.titulo || 'Portada PDF'} style={{ width: '100%', height: '180px', objectFit: 'cover', display: 'block' }}  crossOrigin="anonymous" />
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
                              {(p.hasBlog || blogs.some(b => b.pdfSourceId == p.id)) ? (
                                <button type="button" style={{ background: 'linear-gradient(135deg, #9ca3af, #6b7280)', color: 'white', borderRadius: '4px', border: 'none', padding: '4px 6px', fontSize: '0.8rem', cursor: 'not-allowed', boxShadow: '0 2px 4px rgba(0,0,0,0.25)', opacity: 0.8 }} disabled title="No se puede eliminar: Hay un blog asociado a este PDF.">✕</button>
                              ) : (
                                <button type="button" style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: 'white', borderRadius: '4px', border: 'none', padding: '4px 6px', fontSize: '0.8rem', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.25)' }} onClick={() => handleDeleteFile(p.id, 'pdfs')} title="Eliminar">✕</button>
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
                                          <img src={getMediaUrl(b.hero_imagen)} alt={b.titulo} style={{ width: '100%', height: '100%', objectFit: 'cover' }}  crossOrigin="anonymous" />
                                        </div>
                                      ) : (
                                        <div style={{ flex: '0 0 40px', height: '40px', borderRadius: '4px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', marginTop: '2px' }}>✨</div>
                                      )}
                                      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                                        <a href={`/blog/${b.slug}?preview=true`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.72rem', fontWeight: 600, color: '#0f766e', lineHeight: 1.3, textDecoration: 'none' }} onMouseEnter={e => e.currentTarget.style.textDecoration='underline'} onMouseLeave={e => e.currentTarget.style.textDecoration='none'}>
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
                            handleFileUpload({ target: { files: e.dataTransfer.files } }, 'pdfs');
                          }
                        }}
                      >
                        <input type="file" id="upload-pdfs" multiple accept=".pdf" onChange={(e) => handleFileUpload(e, 'pdfs')} disabled={uploadingPdfs} />
                        
                        {uploadingPdfs ? (
                          <div className="drop-zone-content">
                            <span style={{ fontSize: '1.5rem', animation: 'spin 2s linear infinite', display: 'inline-block' }}>⏳</span>
                            <span style={{ color: '#3b82f6', fontWeight: 'bold', fontSize: '0.75rem', textAlign: 'center' }}>Subiendo...</span>
                          </div>
                        ) : (
                          <div className="drop-zone-content">
                            <label htmlFor="upload-pdfs" className="btn-upload primary" style={{ padding: '8px', fontSize: '0.8rem' }}>
                              <span className="icon" style={{ fontSize: '1.2rem', marginBottom: '4px', display: 'block' }}>📄</span> Subir PDF
                            </label>
                            <span className="drop-hint" style={{ fontSize: '0.7rem', textAlign: 'center', marginTop: '4px' }}>arrastra y suelta<br/>aquí</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}


            </div>
          )}

        </div>
          </div>
        )}

        <div className="form-footer">
          {hasChanges && (
            <button 
              type="submit" 
              disabled={loading} 
              className="btn-save"
            >
              {loading ? 'Guardando...' : 'Guardar Especie'}
            </button>
          )}
        </div>
      </form>
    </div>

      {/* MODAL DE COMPARACIÓN IA */}
      {showAiModal && aiProposal && (
        <div className="ai-modal-overlay">
          <div className="ai-modal-content">
            <div className="ai-modal-header">
              <h2>✨ Revisión de Inteligencia Artificial</h2>
              <button className="btn-close-modal" onClick={() => setShowAiModal(false)}>✖ Cerrar</button>
            </div>
            
            <div className="ai-modal-body">
              <p style={{ marginBottom: '20px', color: '#475569' }}>
                La IA ha sugerido los siguientes datos. Revisa cada bloque y asimila los cambios propuestos donde estés de acuerdo. 
                Los datos que difieren de tu versión actual están resaltados.
              </p>

              {aiGroups.map(group => {
                const hasDifferences = group.keys.some(k => {
                  const currentVal = formData[k] != null ? String(formData[k]) : '';
                  const aiVal = aiProposal[k] != null ? String(aiProposal[k]) : '';
                  return aiVal !== '' && currentVal !== aiVal;
                });

                return (
                  <div key={group.id} className="ai-group-section">
                    <div className="ai-group-header">
                      <h3>{group.title} {hasDifferences && <span style={{fontSize:'0.8rem', background:'#fef08a', color: '#854d0e', padding:'2px 8px', borderRadius:'12px', marginLeft:'10px'}}>Cambios detectados</span>}</h3>
                      <button type="button" className="btn-assimilate-group" onClick={() => assimilateGroup(group.keys)}>
                        ✨ Asimilar este bloque
                      </button>
                    </div>
                    
                    <div className="ai-comparison-grid header">
                      <div>Campo</div>
                      <div>Valor Actual</div>
                      <div>Propuesta IA</div>
                    </div>
                    
                    {group.keys.map(k => {
                      const currentVal = formData[k] != null ? String(formData[k]) : '';
                      const aiVal = aiProposal[k] != null ? String(aiProposal[k]) : '';
                      if (!aiVal) return null;
                      
                      const isDifferent = currentVal !== aiVal;
                      const displayCurrent = Array.isArray(formData[k]) ? formData[k].join(', ') : currentVal;
                      const displayAi = Array.isArray(aiProposal[k]) ? aiProposal[k].join(', ') : aiVal;

                      return (
                        <div key={k} className={`ai-comparison-grid ${isDifferent ? 'ai-row-diff' : 'ai-row-same'}`}>
                          <div style={{ fontWeight: '600', color: '#475569' }}>{(group.labels as any)[k]}</div>
                          <div style={{ color: '#64748b' }}>{displayCurrent || <em style={{opacity:0.5}}>Vacío</em>}</div>
                          <div>
                            <span className={isDifferent ? 'ai-value-changed' : ''}>
                              {displayAi} {isDifferent && ' ✨'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}

              {(aiProposal.asociaciones_beneficiosas?.length > 0 || aiProposal.asociaciones_perjudiciales?.length > 0 || aiProposal.plagas_asociadas?.length > 0) && (
                <div className="ai-group-section" style={{ marginTop: '20px' }}>
                  <div className="ai-group-header" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                    <h3 style={{ color: '#166534' }}>🤝 Asociaciones y Plagas sugeridas</h3>
                    <button type="button" className="btn-assimilate-group" onClick={assimilateRelacionesAI} disabled={isAssimilatingRels}>
                      {isAssimilatingRels ? '⏳ Asimilando...' : '✨ Asimilar Asociaciones'}
                    </button>
                  </div>
                  <div style={{ padding: '15px' }}>
                    {aiProposal.asociaciones_beneficiosas?.length > 0 && (
                      <div style={{ marginBottom: '15px' }}>
                        <h4 style={{ color: '#10b981', marginBottom: '5px' }}>Beneficiosas</h4>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                          {aiProposal.asociaciones_beneficiosas.map((item: any) => {
                            const name = typeof item === 'string' ? item : item?.nombre;
                            const motivo = typeof item === 'string' ? '' : (item?.motivo || '');
                            if (!name) return null;
                            const exists = masterEspecies.some(e => e.especiesnombre.toLowerCase().trim() === name.toLowerCase().trim());
                            const isChecked = selectedRels.ben.some((s: any) => (typeof s === 'string' ? s : s?.nombre) === name);
                            return (
                              <li key={name} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0' }}>
                                <input type="checkbox" checked={isChecked} onChange={(e) => {
                                  if (e.target.checked) setSelectedRels(p => ({...p, ben: [...p.ben, item]}));
                                  else setSelectedRels(p => ({...p, ben: p.ben.filter((n: any) => (typeof n === 'string' ? n : n?.nombre) !== name)}));
                                }} style={{ width: '16px', height: '16px', accentColor: '#10b981', cursor: 'pointer' }} />
                                <span>{exists ? '✅' : '➕'}</span>
                                <div><span style={{fontWeight: 'bold'}}>{name}</span>{motivo ? <span style={{color: '#64748b', fontSize: '0.85rem'}}> — {motivo}</span> : ''} {exists ? <small style={{color: '#64748b'}}>(Existente)</small> : <small style={{color: '#f59e0b'}}>(Se creará inactiva)</small>}</div>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                    
                    {aiProposal.asociaciones_perjudiciales?.length > 0 && (
                      <div style={{ marginBottom: '15px' }}>
                        <h4 style={{ color: '#ef4444', marginBottom: '5px' }}>Perjudiciales</h4>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                          {aiProposal.asociaciones_perjudiciales.map((item: any) => {
                            const name = typeof item === 'string' ? item : item?.nombre;
                            const motivo = typeof item === 'string' ? '' : (item?.motivo || '');
                            if (!name) return null;
                            const exists = masterEspecies.some(e => e.especiesnombre.toLowerCase().trim() === name.toLowerCase().trim());
                            const isChecked = selectedRels.per.some((s: any) => (typeof s === 'string' ? s : s?.nombre) === name);
                            return (
                              <li key={name} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0' }}>
                                <input type="checkbox" checked={isChecked} onChange={(e) => {
                                  if (e.target.checked) setSelectedRels(p => ({...p, per: [...p.per, item]}));
                                  else setSelectedRels(p => ({...p, per: p.per.filter((n: any) => (typeof n === 'string' ? n : n?.nombre) !== name)}));
                                }} style={{ width: '16px', height: '16px', accentColor: '#ef4444', cursor: 'pointer' }} />
                                <span>{exists ? '✅' : '➕'}</span>
                                <div><span style={{fontWeight: 'bold'}}>{name}</span>{motivo ? <span style={{color: '#64748b', fontSize: '0.85rem'}}> — {motivo}</span> : ''} {exists ? <small style={{color: '#64748b'}}>(Existente)</small> : <small style={{color: '#f59e0b'}}>(Se creará inactiva)</small>}</div>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}

                    {aiProposal.plagas_asociadas?.length > 0 && (
                      <div>
                        <h4 style={{ color: '#f97316', marginBottom: '5px' }}>Plagas y Enfermedades</h4>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                          {aiProposal.plagas_asociadas.map((item: any) => {
                            const name = typeof item === 'string' ? item : item?.nombre;
                            const notas = typeof item === 'string' ? '' : (item?.notas || '');
                            if (!name) return null;
                            const exists = masterPlagas.some(p => p.plagasnombre.toLowerCase().trim() === name.toLowerCase().trim());
                            const isChecked = selectedRels.pla.some((s: any) => (typeof s === 'string' ? s : s?.nombre) === name);
                            return (
                              <li key={name} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0' }}>
                                <input type="checkbox" checked={isChecked} onChange={(e) => {
                                  if (e.target.checked) setSelectedRels(p => ({...p, pla: [...p.pla, item]}));
                                  else setSelectedRels(p => ({...p, pla: p.pla.filter((n: any) => (typeof n === 'string' ? n : n?.nombre) !== name)}));
                                }} style={{ width: '16px', height: '16px', accentColor: '#f97316', cursor: 'pointer' }} />
                                <span>{exists ? '✅' : '➕'}</span>
                                <div><span style={{fontWeight: 'bold'}}>{name}</span>{notas ? <span style={{color: '#64748b', fontSize: '0.85rem'}}> — {notas}</span> : ''} {exists ? <small style={{color: '#64748b'}}>(Existente)</small> : <small style={{color: '#f59e0b'}}>(Se creará inactiva)</small>}</div>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="ai-modal-footer">
              <button className="btn-assimilate-all" onClick={assimilateAll}>
                ✨ Asimilar TODOS los cambios de la IA
              </button>
            </div>
          </div>
        </div>
      )}
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
                <button type="button" onClick={() => setEditingPhoto(null)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white', color: '#475569', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>Cerrar</button>
                {(() => {
                  const currentState = JSON.stringify({ x: editorX, y: editorY, zoom: editorZoom, brightness: editorBrightness, contrast: editorContrast, style: editorStyle, seo_alt: editorSeoAlt });
                  if (currentState !== editorInitialState) {
                    return (
                      <button 
                        type="button" 
                        onClick={savePhotoEdits} 
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
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)'
                    }}
                  >
                    ✨ Auto Color
                  </button>
                  <button 
                    type="button" 
                    onClick={() => {
                      setEditorBrightness(100);
                      setEditorContrast(100);
                      setEditorStyle('');
                      setEditorZoom(100);
                      setEditorX(50);
                      setEditorY(38);
                    }}
                    style={{
                      padding: '10px 15px',
                      background: '#f1f5f9',
                      color: '#475569',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    ↺ Reset
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
                    <option value="comic">Comic (Vibrante)</option>
                    <option value="manga">Manga (B/N Intenso)</option>
                    <option value="watercolor">Acuarela (Suave)</option>
                  </select>
                </div>
                
                <div className="editor-control-group">
                  <label><span className="control-label">🏷️ Descripción SEO (Alt Text)</span></label>
                  <input 
                    type="text" 
                    value={editorSeoAlt} 
                    onChange={e => setEditorSeoAlt(e.target.value)} 
                    placeholder="Ej. Tomates cherry maduros en la planta"
                    style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.9rem' }}
                  />
                  <small style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>Ayuda al posicionamiento en buscadores.</small>
                </div>


              </div>
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
                  🌱 Especie: {formData.especiesnombre || 'Sin nombre'}
                </span>
              </div>
              <button type="button" onClick={() => setEditingPdf(null)} style={{ background: 'transparent', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#64748b' }}>✕</button>
            </div>
            
            <div style={{ display: 'flex', gap: '24px', flexDirection: 'row', flexWrap: 'wrap' }}>
              {/* Columna Izquierda: Portada */}
              <div style={{ flex: '0 0 250px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ width: '100%', height: '350px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {editingPdf.portada ? (
                    <img src={getMediaUrl(editingPdf.portada)} alt="Portada PDF" style={{ width: '100%', height: '100%', objectFit: 'cover' }}  crossOrigin="anonymous" />
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


          {/* SINÓNIMOS (Inteligencia Artificial) */}
            <p style={{ margin: 0, fontSize: '0.95rem', color: '#475569' }}>
              Dile a la Inteligencia Artificial qué tipo de documento necesitas buscar sobre <strong>{formData.especiesnombre}</strong> (ej. <em>"poda"</em>, <em>"plagas INTA"</em>, <em>"guía de cultivo"</em>).
            </p>

            <div style={{ display: 'flex', gap: '10px' }}>
              <input 
                type="text" 
                value={pdfSearchTopic} 
                onChange={e => setPdfSearchTopic(e.target.value)} 
                onKeyDown={e => e.key === 'Enter' && handleSearchPdfs()}
                placeholder="Ej. enfermedades comunes..."
                style={{ flex: 1, padding: '12px', border: '2px solid #cbd5e1', borderRadius: '8px', fontSize: '1rem', outline: 'none' }}
              />
              <button 
                type="button" 
                onClick={handleSearchPdfs} 
                disabled={pdfSearchLoading || !pdfSearchTopic}
                style={{ padding: '0 20px', borderRadius: '8px', border: 'none', background: '#10b981', color: 'white', fontWeight: 'bold', cursor: pdfSearchLoading ? 'wait' : 'pointer', transition: 'all 0.2s', opacity: (pdfSearchLoading || !pdfSearchTopic) ? 0.7 : 1 }}
              >
                {pdfSearchLoading ? 'Buscando...' : 'Buscar'}
              </button>
            </div>

            {pdfSearchLoading && (
              <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
                <span style={{ fontSize: '2rem', display: 'inline-block', animation: 'spin 2s linear infinite' }}>⏳</span>
                <p style={{ marginTop: '10px', fontSize: '0.9rem' }}>Buscando en repositorios agrícolas, por favor espera...</p>
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
      )}

      {/* MODAL GENERADOR DE BLOG */}
      {blogGenPdf && (
        <div className="ai-modal-overlay">
          <div className="ai-modal-content" style={{ maxWidth: '600px' }}>
            <div className="ai-modal-header">
              <h2>📝 Generar Artículo Automático</h2>
              <button className="btn-close-modal" onClick={() => setBlogGenPdf(null)}>✖ Cerrar</button>
            </div>
            <div className="ai-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {/* Contexto: Entidad + PDF */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '200px', background: 'linear-gradient(135deg, #ecfdf5, #f0fdf4)', border: '1px solid #a7f3d0', borderRadius: '10px', padding: '12px 16px' }}>
                  <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#64748b', fontWeight: 700, marginBottom: '4px' }}>🌱 Especie</div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f766e' }}>{formData.especiesnombre || 'Sin nombre'}</div>
                </div>
                <div style={{ flex: 1, minWidth: '200px', background: 'linear-gradient(135deg, #fffbeb, #fef3c7)', border: '1px solid #fcd34d', borderRadius: '10px', padding: '12px 16px' }}>
                  <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#64748b', fontWeight: 700, marginBottom: '4px' }}>📄 Documento PDF</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#92400e', wordBreak: 'break-word' }}>{blogGenPdf.titulo || blogGenPdf.nombreOriginal}</div>
                </div>
              </div>
              
              <div className="form-group full">
                <label>Instrucciones de estilo y enfoque (Prompt)</label>
                <textarea 
                  value={blogGenInstructions}
                  onChange={(e) => setBlogGenInstructions(e.target.value)}
                  style={{ width: '100%', minHeight: '100px', padding: '12px', border: '2px solid #cbd5e1', borderRadius: '8px', fontSize: '0.95rem', resize: 'vertical' }}
                  placeholder="Ej: Escribe un post en tono amigable, para niños, que hable sobre..."
                />
              </div>

              {/* Toggle para ver el prompt del sistema */}
              <button type="button" onClick={() => setShowBlogPrompt(!showBlogPrompt)} style={{ background: 'none', border: '1px dashed #94a3b8', borderRadius: '8px', padding: '8px 14px', color: '#64748b', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', width: '100%', justifyContent: 'center' }}>
                {showBlogPrompt ? '🔽 Ocultar' : '👁️ Ver'} Prompt del Sistema enviado a Gemini
              </button>
              {showBlogPrompt && (
                <div style={{ background: '#0f172a', color: '#e2e8f0', borderRadius: '8px', padding: '16px', fontSize: '0.75rem', fontFamily: 'monospace', maxHeight: '300px', overflowY: 'auto', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                  {`Actúa como un experto redactor de blogs agronómicos y de jardinería moderna. Vas a leer el documento adjunto sobre la especie "${formData.especiesnombre || 'agricultura'}" y vas a escribir un artículo de blog profesional, SEO-optimizado y visualmente estructurado.

CONTEXTO: Este blog trata sobre una ESPECIE vegetal/hortaliza.

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
              )}

              {blogGenLoading ? (
                <div style={{ padding: '30px 20px', textAlign: 'center', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '2.5rem', display: 'inline-block', animation: 'spin 2s linear infinite', marginBottom: '15px' }}>⏳</span>
                  <h4 style={{ margin: '0 0 8px 0', color: '#0f766e', fontSize: '1.1rem' }}>Generación en curso</h4>
                  <p style={{ margin: 0, fontSize: '0.95rem', color: '#475569', fontWeight: 500, minHeight: '24px', transition: 'all 0.3s' }}>
                    {blogGenProgress}
                  </p>
                  <div style={{ width: '100%', background: '#e2e8f0', height: '6px', borderRadius: '3px', marginTop: '16px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: '#10b981', width: '100%', animation: 'progress 60s ease-out forwards' }}></div>
                  </div>
                  <style>{`@keyframes progress { 0% { width: 0%; } 100% { width: 95%; } }`}</style>
                </div>
              ) : (
                <button 
                  type="button" 
                  onClick={submitBlogGen} 
                  style={{ padding: '12px', borderRadius: '8px', border: 'none', background: '#f59e0b', color: 'white', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '10px' }}
                >
                  🚀 ¡Crear Artículo Ahora!
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── SECCIÓN: PAUTAS DE LABORES ── */}
      <div className="especie-form-container" style={{ marginTop: '24px' }}>
        <div className="especie-form-body">
          <div 
            className="collapsible-header" 
            onClick={() => setIsPautasOpen(!isPautasOpen)}
            style={{ padding: '15px 24px', background: '#e2e8f0', cursor: 'pointer', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <span>📋 Pautas de Labores</span>
            <span>{isPautasOpen ? '▲' : '▼'}</span>
          </div>

          {isPautasOpen && (
            <div className="collapsible-content">
              <div style={{ background: '#f8fafc', padding: '24px', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                  <button 
                    type="button" 
                    onClick={() => {
                      setShowPautasConfig(true);
                      setPautasConfigPromptOpen(false);
                    }}
                    disabled={pautasAiLoading}
                    style={{ padding: '8px 16px', background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: pautasAiLoading ? 'not-allowed' : 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    {pautasAiLoading ? (
                      <>
                        <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⏳</span>
                        Analizando... {pautasAiSeconds}s
                      </>
                    ) : (
                      <>✨ Asistente IA</>
                    )}
                  </button>
                  {entityId && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowPautaForm(true);
                        setEditingPauta(null);
                        setPautaForm({ xlaborespautaidlabores: '', laborespautafase: 'germinacion', laborespautafrecuenciadias: '', laborespautanotasia: '', laborespautaactivosino: 1 });
                      }}
                      style={{ padding: '8px 16px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      ➕ Añadir Pauta Manual
                    </button>
                  )}
                </div>

                {!entityId ? (
                  <div style={{ padding: '20px', background: '#fffbeb', color: '#b45309', borderRadius: '8px', border: '1px solid #fef3c7' }}>
                    Debes guardar la especie primero antes de poder asignar pautas de labores.
                  </div>
                ) : (
                  <>

                    {showPautaForm && (
                      <div style={{ marginBottom: '16px', background: 'white', padding: '16px', borderRadius: '12px', border: '2px solid #10b981', position: 'relative' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <h4 style={{ margin: 0, color: '#1e293b', fontSize: '0.95rem' }}>{editingPauta ? '✏️ Editar Pauta' : '➕ Nueva Pauta'}</h4>
                          <button type="button" onClick={() => { setShowPautaForm(false); setEditingPauta(null); setPautaForm({ xlaborespautaidlabores: '', laborespautafase: 'germinacion', laborespautafrecuenciadias: '', laborespautanotasia: '', laborespautaactivosino: 1 }); }} style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', color: '#94a3b8', padding: '0 4px' }}>&times;</button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 120px', gap: '12px' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: '#475569', marginBottom: '6px' }}>Labor *</label>
                            <select 
                              value={pautaForm.xlaborespautaidlabores} 
                              onChange={e => setPautaForm({...pautaForm, xlaborespautaidlabores: e.target.value})}
                              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                            >
                              <option value="">Selecciona labor...</option>
                              {masterLabores.map(l => (
                                <option key={l.idlabores} value={l.idlabores}>{l.laboresnombre}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: '#475569', marginBottom: '6px' }}>Fase de la Planta *</label>
                            <select 
                              value={pautaForm.laborespautafase} 
                              onChange={e => setPautaForm({...pautaForm, laborespautafase: e.target.value})}
                              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                            >
                              <option value="presiembra">1. Presiembra</option>
                              <option value="siembra">2. Siembra</option>
                              <option value="germinacion">3. Germinación</option>
                              <option value="trasplante">4. Trasplante</option>
                              <option value="crecimiento">5. Crecimiento</option>
                              <option value="floracion">6. Floración</option>
                              <option value="fructificacion">7. Fructificación</option>
                              <option value="cosecha">8. Cosecha</option>
                              <option value="fin_ciclo">9. Fin de Ciclo</option>
                              <option value="general">General</option>
                            </select>
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: '#475569', marginBottom: '6px' }}>Frecuencia (días)</label>
                            <input 
                              type="number" 
                              min="1"
                              placeholder="Ej: 3"
                              value={pautaForm.laborespautafrecuenciadias} 
                              onChange={e => setPautaForm({...pautaForm, laborespautafrecuenciadias: e.target.value})}
                              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                            />
                          </div>
                          <div style={{ gridColumn: '1 / -1' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: '#475569', marginBottom: '6px' }}>Notas / Instrucciones</label>
                            <textarea 
                              rows={2}
                              placeholder="Ej: Mantener humedad constante sin encharcar..."
                              value={pautaForm.laborespautanotasia} 
                              onChange={e => setPautaForm({...pautaForm, laborespautanotasia: e.target.value})}
                              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                            />
                          </div>
                          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold', color: '#334155', fontSize: '0.9rem' }}>
                              <input 
                                type="checkbox" 
                                checked={pautaForm.laborespautaactivosino === 1}
                                onChange={e => setPautaForm({...pautaForm, laborespautaactivosino: e.target.checked ? 1 : 0})}
                              />
                              Pauta Activa
                            </label>
                            <div style={{ display: 'flex', gap: '10px' }}>
                              <button 
                                type="button" 
                                onClick={() => { setShowPautaForm(false); setEditingPauta(null); setPautaForm({ xlaborespautaidlabores: '', laborespautafase: 'germinacion', laborespautafrecuenciadias: '', laborespautanotasia: '', laborespautaactivosino: 1 }); }}
                                style={{ padding: '8px 16px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem' }}
                              >
                                Cancelar
                              </button>
                              <button 
                                type="button" 
                                onClick={async () => { await handleSavePauta(); setShowPautaForm(false); }}
                                style={{ padding: '8px 24px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem' }}
                              >
                                {editingPauta ? '✓ Actualizar' : '✓ Guardar'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {pautas.length > 0 && (() => {
                      const grouped: Record<string, any[]> = {};
                      for (const p of pautas) {
                        const key = p.xlaborespautaidlabores;
                        if (!grouped[key]) grouped[key] = [];
                        grouped[key].push(p);
                      }
                      const faseOrder: Record<string, number> = { presiembra: 1, siembra: 2, germinacion: 3, trasplante: 4, plantula: 4, crecimiento: 5, floracion: 6, fructificacion: 7, cosecha: 8, fin_ciclo: 9, general: 10 };

                      const cellStyle: React.CSSProperties = { padding: '6px 8px', fontSize: '0.83rem', borderRadius: '5px', border: '1px solid #e2e8f0', width: '100%', background: '#fff' };

                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {Object.entries(grouped).map(([laborId, laborPautas]) => {
                            const laborName = laborPautas[0]?.laboresnombre || 'Labor';
                            const isExpanded = expandedPautasLabor.has(laborId);
                            const sortedPautas = [...laborPautas].sort((a, b) => (faseOrder[a.laborespautafase] || 99) - (faseOrder[b.laborespautafase] || 99));

                            return (
                              <div key={laborId} style={{ borderRadius: '10px', border: '1px solid #e2e8f0', overflow: 'hidden', background: 'white' }}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const next = new Set(expandedPautasLabor);
                                    if (next.has(laborId)) next.delete(laborId); else next.add(laborId);
                                    setExpandedPautasLabor(next);
                                  }}
                                  style={{ width: '100%', padding: '10px 16px', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: isExpanded ? 'linear-gradient(135deg, #f0fdf4, #ecfdf5)' : '#f8fafc', transition: 'all 0.2s' }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ fontWeight: 'bold', fontSize: '0.95rem', color: '#1e293b' }}>{laborName}</span>
                                    <span style={{ background: '#e0e7ff', color: '#4338ca', padding: '2px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '700' }}>{laborPautas.length}</span>
                                  </div>
                                  <span style={{ fontSize: '0.85rem', color: '#94a3b8', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
                                </button>

                                {isExpanded && (
                                  <table style={{ width: '100%', borderCollapse: 'collapse', borderTop: '1px solid #e2e8f0' }}>
                                    <tbody>
                                      {sortedPautas.map((p, i) => (
                                        <tr key={p.idlaborespauta} style={{ borderTop: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
                                          <td style={{ padding: '5px 4px', textAlign: 'center' }}>
                                            <input
                                              type="checkbox"
                                              checked={!!p.laborespautaactivosino}
                                              onChange={e => autoSavePautaField(p.idlaborespauta, 'laborespautaactivosino', e.target.checked ? 1 : 0)}
                                              style={{ width: '16px', height: '16px', accentColor: '#10b981', cursor: 'pointer' }}
                                            />
                                          </td>
                                          <td style={{ padding: '5px 8px' }}>
                                            <select
                                              value={p.laborespautafase}
                                              onChange={e => autoSavePautaField(p.idlaborespauta, 'laborespautafase', e.target.value)}
                                              style={{ ...cellStyle, width: '135px' }}
                                            >
                                              <option value="presiembra">1. Presiembra</option>
                                              <option value="siembra">2. Siembra</option>
                                              <option value="germinacion">3. Germinación</option>
                                              <option value="trasplante">4. Trasplante</option>
                                              <option value="crecimiento">5. Crecimiento</option>
                                              <option value="floracion">6. Floración</option>
                                              <option value="fructificacion">7. Fructificación</option>
                                              <option value="cosecha">8. Cosecha</option>
                                              <option value="fin_ciclo">9. Fin de Ciclo</option>
                                              <option value="general">General</option>
                                            </select>
                                          </td>
                                          <td style={{ padding: '5px 8px', textAlign: 'center' }}>
                                            <input
                                              type="number"
                                              min="1"
                                              defaultValue={p.laborespautafrecuenciadias || ''}
                                              onBlur={e => {
                                                const val = e.target.value ? parseInt(e.target.value) : null;
                                                if (val !== p.laborespautafrecuenciadias) autoSavePautaField(p.idlaborespauta, 'laborespautafrecuenciadias', val);
                                              }}
                                              style={{ ...cellStyle, width: '60px', textAlign: 'center' }}
                                            />
                                          </td>
                                          <td style={{ padding: '5px 8px' }}>
                                            <textarea
                                              rows={1}
                                              defaultValue={p.laborespautanotasia || ''}
                                              onBlur={e => {
                                                if (e.target.value !== (p.laborespautanotasia || '')) autoSavePautaField(p.idlaborespauta, 'laborespautanotasia', e.target.value);
                                              }}
                                              style={{ ...cellStyle, resize: 'vertical', minHeight: '28px' }}
                                            />
                                          </td>
                                          <td style={{ padding: '5px 4px', textAlign: 'center' }}>
                                            {pautaDeleteConfirm === p.idlaborespauta ? (
                                              <div style={{ display: 'flex', gap: '2px' }}>
                                                <button type="button" onClick={() => handleDeletePauta(p.idlaborespauta)} style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', padding: '2px 6px', fontSize: '0.75rem', fontWeight: 'bold' }}>✓</button>
                                                <button type="button" onClick={() => setPautaDeleteConfirm(null)} style={{ background: '#e2e8f0', border: 'none', borderRadius: '3px', cursor: 'pointer', padding: '2px 6px', fontSize: '0.75rem' }}>✕</button>
                                              </div>
                                            ) : (
                                              <button type="button" onClick={() => setPautaDeleteConfirm(p.idlaborespauta)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem', padding: '2px' }}>🗑️</button>
                                            )}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}
          onClick={() => setDeleteConfirm(null)}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '32px', maxWidth: '380px', width: '90%', boxShadow: '0 25px 50px rgba(0,0,0,0.3)', textAlign: 'center' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🗑️</div>
            <h3 style={{ margin: '0 0 8px', color: '#1e293b', fontSize: '1.1rem' }}>
              Eliminar {deleteConfirm.type === 'photos' ? 'foto' : 'documento'}
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '24px', lineHeight: 1.5 }}>
              Esta acción no se puede deshacer. ¿Confirmas que quieres eliminar este {deleteConfirm.type === 'photos' ? 'archivo de imagen' : 'documento PDF'}?
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button type="button" onClick={() => setDeleteConfirm(null)}
                style={{ padding: '10px 22px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white', color: '#334155', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' }}>
                Cancelar
              </button>
              <button type="button" onClick={confirmDelete}
                style={{ padding: '10px 22px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem', boxShadow: '0 4px 12px rgba(239,68,68,0.35)' }}>
                Sí, eliminar
              </button>
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
                  <span style={{ fontSize: '1.5rem' }}>✨</span> Generador de Imágenes IA
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748b' }}>Especie: <strong>{formData.especiesnombre || 'Sin nombre'}</strong></p>
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
                      placeholder="Ej. Fotografía macro de las hojas con rocío de la mañana..."
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

        {/* SINÓNIMOS AI CONFIG PANEL */}
        {showSinonimosConfig && (
          <div className="ai-modal-overlay">
            <div className="ai-modal-content" style={{ maxWidth: '700px' }}>
              <div className="ai-modal-header" style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'nowrap' }}>
                <h2 style={{ color: 'white', margin: 0, fontSize: '1.1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0, flexShrink: 1 }}>🔍 Buscador de Sinónimos</h2>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                  <button
                    type="button"
                    disabled={sinonimosAiLoading || !sinExtraInstructions.trim()}
                    onClick={proponerSinonimosAI}
                    style={{ 
                      padding: '8px 16px', background: sinonimosAiLoading ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.15)', 
                      color: 'white', border: '2px solid rgba(255,255,255,0.5)', borderRadius: '8px', fontWeight: 'bold', 
                      cursor: sinonimosAiLoading ? 'not-allowed' : 'pointer', fontSize: '0.9rem',
                      opacity: !sinExtraInstructions.trim() ? 0.4 : 1,
                      transition: 'all 0.2s', whiteSpace: 'nowrap'
                    }}
                  >
                    {sinonimosAiLoading ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite', fontSize: '1rem' }}>⏳</span>
                        {sinonimosAiSeconds}s
                      </span>
                    ) : '🚀 Buscar'}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setShowSinonimosConfig(false)} 
                    style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.15)', color: 'white', border: '2px solid rgba(255,255,255,0.3)', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem', whiteSpace: 'nowrap' }}
                  >
                    ✖
                  </button>
                </div>
              </div>

              <div className="ai-modal-body">
                <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '16px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
                  <p style={{ margin: '0 0 4px', fontWeight: 'bold', color: '#1e293b', fontSize: '1.05rem' }}>
                    Objetivo: Encontrar nombres alternativos para <span style={{ color: '#7c3aed' }}>"{formData.especiesnombre}"</span>
                  </p>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
                    {formData.especiesnombrecientifico && <em>({formData.especiesnombrecientifico}) — </em>}
                    Selecciona un ámbito para cargar las instrucciones, o escribe las tuyas propias.
                  </p>
                </div>

                {/* Prompt colapsable */}
                <div style={{ marginBottom: '20px', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                  <button 
                    type="button"
                    onClick={() => setSinConfigPromptOpen(!sinConfigPromptOpen)}
                    style={{ width: '100%', padding: '10px 16px', background: '#f1f5f9', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: '600', color: '#475569', fontSize: '0.9rem' }}
                  >
                    <span>📋 Instrucciones del Prompt (técnico)</span>
                    <span style={{ transform: sinConfigPromptOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
                  </button>
                  {sinConfigPromptOpen && (
                    <div style={{ padding: '12px 16px', background: '#1e293b', color: '#94a3b8', fontSize: '0.8rem', fontFamily: 'monospace', maxHeight: '200px', overflowY: 'auto', lineHeight: '1.5' }}>
                      La IA recibirá la lista de idiomas y países del sistema, los sinónimos existentes, y el texto de instrucciones que escribas abajo. Filtrará automáticamente duplicados y el nombre principal.
                    </div>
                  )}
                </div>

                {/* Ámbitos de búsqueda — Radio buttons */}
                <div style={{ marginBottom: '16px' }}>
                  <h4 style={{ margin: '0 0 12px', color: '#1e293b', fontSize: '1rem' }}>🌍 Ámbito de Búsqueda</h4>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {[
                      { key: 'general', emoji: '🌎', label: 'General' },
                      { key: 'cooficiales', emoji: '🇪🇸', label: 'Lenguas Cooficiales' },
                      { key: 'europa', emoji: '🇪🇺', label: 'Europea' },
                    ].map(scope => (
                      <label key={scope.key} style={{
                        display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', 
                        border: sinSelectedScope === scope.key ? '2px solid #7c3aed' : '1px solid #e2e8f0',
                        borderRadius: '8px', cursor: 'pointer',
                        background: sinSelectedScope === scope.key ? '#f5f3ff' : '#fff',
                        transition: 'all 0.2s', flex: '1', minWidth: '150px'
                      }}>
                        <input 
                          type="radio"
                          name="sinScope"
                          checked={sinSelectedScope === scope.key}
                          onChange={() => {
                            setSinSelectedScope(scope.key);
                            setSinExtraInstructions(sinScopePresets[scope.key]);
                          }}
                          style={{ width: '18px', height: '18px', accentColor: '#7c3aed', flexShrink: 0 }}
                        />
                        <span style={{ fontWeight: sinSelectedScope === scope.key ? 'bold' : 'normal', color: '#1e293b', fontSize: '0.95rem' }}>{scope.emoji} {scope.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Textarea — Instrucciones que la IA leerá */}
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ margin: '0 0 8px', color: '#1e293b', fontSize: '1rem' }}>💬 Instrucciones para la IA</h4>
                  <textarea
                    value={sinExtraInstructions}
                    onChange={e => setSinExtraInstructions(e.target.value)}
                    placeholder="Escribe las instrucciones de búsqueda para la IA..."
                    rows={4}
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', resize: 'vertical', fontFamily: 'inherit', lineHeight: '1.5' }}
                  />
                  <p style={{ margin: '6px 0 0', color: '#94a3b8', fontSize: '0.8rem' }}>
                    Puedes modificar el texto libremente. La IA leerá exactamente lo que esté escrito aquí.
                  </p>
                </div>

                {/* Sinónimos actuales */}
                {sinonimos.length > 0 && (
                  <div style={{ padding: '12px 16px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                    <span style={{ fontWeight: 'bold', color: '#065f46', fontSize: '0.9rem' }}>📊 Ya tienes {sinonimos.length} sinónimo{sinonimos.length !== 1 ? 's' : ''} registrado{sinonimos.length !== 1 ? 's' : ''}</span>
                    <span style={{ color: '#15803d', fontSize: '0.85rem', marginLeft: '8px' }}>— La IA evitará duplicados</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {showSinonimosAiModal && (() => {
          const isExisting = (prop: any) => sinonimos.some(s =>
            s.especiessinonimosnombre?.toLowerCase().trim() === prop.especiessinonimosnombre?.toLowerCase().trim() &&
            String(s.xespeciessinonimosidpaises || '') === String(prop.xespeciessinonimosidpaises || '')
          );
          const existingOnes = aiSinonimosProposal.filter(isExisting);
          const newOnes = aiSinonimosProposal.filter(p => !isExisting(p));
          const hasBothColumns = existingOnes.length > 0 && newOnes.length > 0;

          const renderCard = (prop: any, idx: number, isAlreadyIncluded: boolean) => {
            const idioma = masterIdiomas.find(i => i.ididiomas == prop.xespeciessinonimosididiomas);
            const pais = masterPaises.find(p => p.idpaises == prop.xespeciessinonimosidpaises);
            return (
              <label key={idx} style={{
                display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '14px',
                border: isAlreadyIncluded ? '1px solid #cbd5e1' : prop._selected ? '2px solid #10b981' : '1px solid #e2e8f0',
                borderRadius: '8px', cursor: isAlreadyIncluded ? 'default' : 'pointer',
                background: isAlreadyIncluded ? '#f8fafc' : prop._selected ? '#f0fdf4' : '#fff',
                transition: 'all 0.2s'
              }}>
                {!isAlreadyIncluded && (
                  <input
                    type="checkbox"
                    checked={prop._selected}
                    onChange={(e) => {
                      const newProps = [...aiSinonimosProposal];
                      const realIdx = aiSinonimosProposal.indexOf(prop);
                      newProps[realIdx]._selected = e.target.checked;
                      setAiSinonimosProposal(newProps);
                    }}
                    style={{ marginTop: '2px', width: '20px', height: '20px', accentColor: '#10b981', flexShrink: 0 }}
                  />
                )}
                {isAlreadyIncluded && (
                  <span style={{ fontSize: '1.2rem', flexShrink: 0, marginTop: '1px' }}>✅</span>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 'bold', fontSize: '1.05rem', color: isAlreadyIncluded ? '#64748b' : '#1e293b' }}>
                    {prop.especiessinonimosnombre}
                  </div>
                  <div style={{ display: 'flex', gap: '6px', marginTop: '5px', fontSize: '0.82rem', color: '#64748b', flexWrap: 'wrap' }}>
                    {idioma && <span style={{ background: '#e0e7ff', color: '#4338ca', padding: '1px 7px', borderRadius: '4px', fontWeight: '600' }}>🗣️ {idioma.idiomasnombre}</span>}
                    {pais && <span style={{ background: '#ecfdf5', color: '#065f46', padding: '1px 7px', borderRadius: '4px', fontWeight: '600' }}>🌍 {pais.paisesnombre}</span>}
                  </div>
                  {prop.especiessinonimosnotas && (
                    <div style={{ marginTop: '5px', fontSize: '0.85rem', color: '#64748b', fontStyle: 'italic' }}>
                      {prop.especiessinonimosnotas}
                    </div>
                  )}
                </div>
              </label>
            );
          };

          return (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}
               onClick={() => setShowSinonimosAiModal(false)}>
            <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', width: '90%', maxWidth: hasBothColumns ? '950px' : '600px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}
                 onClick={e => e.stopPropagation()}>
              <h2 style={{ marginTop: 0, color: '#1e293b', borderBottom: '2px solid #e2e8f0', paddingBottom: '12px', display: 'flex', justifyContent: 'space-between' }}>
                <span>✨ Sinónimos Propuestos por la IA</span>
                <button type="button" onClick={() => setShowSinonimosAiModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#94a3b8' }}>&times;</button>
              </h2>

              {hasBothColumns ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                  {/* Columna Izquierda: Ya incorporados */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', padding: '8px 12px', background: '#f1f5f9', borderRadius: '8px', borderLeft: '4px solid #94a3b8' }}>
                      <span style={{ fontSize: '1.1rem' }}>✅</span>
                      <span style={{ fontWeight: 'bold', color: '#475569', fontSize: '0.95rem' }}>Ya incorporados ({existingOnes.length})</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {existingOnes.map((prop, idx) => renderCard(prop, idx, true))}
                    </div>
                  </div>

                  {/* Columna Derecha: Disponibles para incorporar */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', padding: '8px 12px', background: '#f0fdf4', borderRadius: '8px', borderLeft: '4px solid #10b981' }}>
                      <span style={{ fontSize: '1.1rem' }}>🆕</span>
                      <span style={{ fontWeight: 'bold', color: '#065f46', fontSize: '0.95rem' }}>Disponibles para incorporar ({newOnes.length})</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {newOnes.map((prop, idx) => renderCard(prop, idx, false))}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ marginBottom: '24px' }}>
                  {existingOnes.length > 0 && newOnes.length === 0 && (
                    <div style={{ padding: '24px', textAlign: 'center', background: '#f0fdf4', borderRadius: '12px', border: '2px solid #bbf7d0', marginBottom: '16px' }}>
                      <span style={{ fontSize: '2rem', display: 'block', marginBottom: '8px' }}>🎉</span>
                      <p style={{ color: '#065f46', fontWeight: 'bold', fontSize: '1.1rem', margin: '0 0 4px' }}>¡Todos los sinónimos ya están incluidos!</p>
                      <p style={{ color: '#15803d', margin: 0, fontSize: '0.95rem' }}>La base de datos de Verdantia ya contiene todos los sinónimos que la IA ha encontrado.</p>
                    </div>
                  )}
                  {newOnes.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', padding: '8px 12px', background: '#f0fdf4', borderRadius: '8px', borderLeft: '4px solid #10b981' }}>
                        <span style={{ fontSize: '1.1rem' }}>🆕</span>
                        <span style={{ fontWeight: 'bold', color: '#065f46', fontSize: '0.95rem' }}>Nuevos sinónimos encontrados ({newOnes.length})</span>
                      </div>
                      {newOnes.map((prop, idx) => renderCard(prop, idx, false))}
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '2px solid #e2e8f0', paddingTop: '16px' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowSinonimosAiModal(false)}>
                  Cancelar
                </button>
                {newOnes.filter(p => p._selected).length > 0 && (
                  <button
                    type="button"
                    style={{ padding: '10px 24px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1.05rem', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.3)' }}
                    onClick={async () => {
                      const selected = newOnes.filter(p => p._selected);
                      const cleanedSelected = selected.map(s => {
                        const copy = { ...s };
                        delete copy._selected;
                        return copy;
                      });
                      if (cleanedSelected.length > 0) {
                        const merged = [...sinonimos, ...cleanedSelected];
                        setSinonimos(merged);
                        setSinonimosDirty(true);
                        setShowSinonimosAiModal(false);
                        if (entityId) {
                          try {
                            for (const s of cleanedSelected) {
                              await fetch(`/api/admin/${entityType}/${entityId}/sinonimos`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(s)
                              });
                            }
                            await loadSinonimos(entityId);
                          } catch (err) {
                            console.error('Error auto-guardando sinónimos:', err);
                          }
                        }
                      } else {
                        setShowSinonimosAiModal(false);
                      }
                    }}
                  >
                    Incorporar Seleccionados ({newOnes.filter(p => p._selected).length})
                  </button>
                )}
              </div>
            </div>
          </div>
          );
        })()}

        {/* ── Pautas AI Config Modal ── */}
        {showPautasConfig && (
          <div className="ai-modal-overlay">
            <div className="ai-modal-content" style={{ maxWidth: '700px' }}>
              <div className="ai-modal-header" style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                <h2 style={{ color: 'white', margin: 0, fontSize: '1.1rem' }}>🌱 Asistente IA de Pautas</h2>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    type="button"
                    disabled={pautasAiLoading || !pautasExtraInstructions.trim()}
                    onClick={startPautasAiSearch}
                    style={{ 
                      padding: '8px 16px', background: pautasAiLoading ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.15)', 
                      color: 'white', border: '2px solid rgba(255,255,255,0.5)', borderRadius: '8px', fontWeight: 'bold', 
                      cursor: pautasAiLoading ? 'not-allowed' : 'pointer', fontSize: '0.9rem',
                      transition: 'all 0.2s'
                    }}
                  >
                    {pautasAiLoading ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite', fontSize: '1rem' }}>⏳</span>
                        {pautasAiSeconds}s
                      </span>
                    ) : '🚀 Analizar'}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => {
                      if (pautasAiLoading && pautasAiAbortControllerRef.current) {
                        pautasAiAbortControllerRef.current.abort();
                        setPautasAiLoading(false);
                      }
                      setShowPautasConfig(false);
                    }} 
                    style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.15)', color: 'white', border: '2px solid rgba(255,255,255,0.3)', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem' }}
                  >
                    Cancelar
                  </button>
                </div>
              </div>

              <div className="ai-modal-body">
                <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '16px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
                  <p style={{ margin: '0 0 4px', fontWeight: 'bold', color: '#1e293b', fontSize: '1.05rem' }}>
                    Generar pautas para <span style={{ color: '#7c3aed' }}>"{formData.especiesnombre}"</span>
                  </p>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
                    La IA analizará el ciclo de vida y propondrá frecuencias para las labores disponibles en el sistema.
                  </p>
                </div>

                {/* Prompt colapsable */}
                <div style={{ marginBottom: '20px', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                  <button 
                    type="button"
                    onClick={() => setPautasConfigPromptOpen(!pautasConfigPromptOpen)}
                    style={{ width: '100%', padding: '10px 16px', background: '#f1f5f9', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: '600', color: '#475569', fontSize: '0.9rem' }}
                  >
                    <span>📋 Instrucciones del Prompt (técnico)</span>
                    <span style={{ transform: pautasConfigPromptOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
                  </button>
                  {pautasConfigPromptOpen && (
                    <div style={{ padding: '12px 16px', background: '#1e293b', color: '#94a3b8', fontSize: '0.8rem', fontFamily: 'monospace', maxHeight: '200px', overflowY: 'auto', lineHeight: '1.5' }}>
                      La IA recibirá la lista de labores registradas en el sistema y el nombre de la especie actual. Su tarea será vincular cada labor pertinente con la fase adecuada del ciclo de vida y proponer una frecuencia en días, además de generar instrucciones breves.
                    </div>
                  )}
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ margin: '0 0 8px', color: '#1e293b', fontSize: '1rem' }}>💬 Instrucciones para la IA</h4>
                  <textarea
                    value={pautasExtraInstructions}
                    onChange={e => setPautasExtraInstructions(e.target.value)}
                    placeholder="Instrucciones adicionales para la generación..."
                    rows={4}
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', resize: 'vertical', fontFamily: 'inherit', lineHeight: '1.5', marginBottom: '12px' }}
                  />
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: '#f1f5f9', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#475569' }}>🎯 Enfocar análisis en una labor específica:</label>
                    <select
                      onChange={(e) => {
                        const val = e.target.value;
                        if (!val) {
                          setPautasExtraInstructions('Analiza el ciclo de vida de esta especie y genera pautas de labores (riego, abonado, poda, etc.) específicas para cada fase, indicando la frecuencia recomendada.');
                        } else {
                          const laborName = masterLabores.find(l => String(l.idlabores) === String(val))?.laboresnombre || 'esta labor';
                          setPautasExtraInstructions(`Concéntrate exclusivamente en analizar y generar las pautas, fases y frecuencias para la labor de "${laborName}". No propongas ninguna otra labor.`);
                        }
                      }}
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem', background: 'white' }}
                    >
                      <option value="">-- Búsqueda General (Todas las labores) --</option>
                      {masterLabores.map(l => (
                        <option key={l.idlabores} value={l.idlabores}>{l.laboresnombre}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Pautas AI Results Modal ── */}
        {showPautasAiModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
            <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', width: '95%', maxWidth: '1000px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }} onClick={e => e.stopPropagation()}>
              <h2 style={{ marginTop: 0, color: '#1e293b', borderBottom: '2px solid #e2e8f0', paddingBottom: '12px', display: 'flex', justifyContent: 'space-between' }}>
                <span>✨ Pautas Propuestas por la IA</span>
                <button type="button" onClick={() => setShowPautasAiModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#94a3b8' }}>&times;</button>
              </h2>

              <div style={{ marginBottom: '24px' }}>
                {aiPautasProposal.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>No se encontraron pautas.</div>
                ) : (() => {
                  const faseLabels: Record<string, string> = { siembra: '🌱 Siembra', germinacion: '🌿 Germinación', trasplante: '🪴 Trasplante', plantula: '🌱 Plántula', crecimiento: '📈 Crecimiento', floracion: '🌸 Floración', fructificacion: '🍅 Fructificación', cosecha: '🧺 Cosecha', fin_ciclo: '🔄 Fin de Ciclo', general: '♻️ General' };
                  let countNew = 0, countModified = 0, countIdentical = 0;
                  aiPautasProposal.forEach(prop => {
                    const existing = pautas.find(p => p.xlaborespautaidlabores == prop.id_labor && p.laborespautafase === prop.fase);
                    if (!existing) countNew++;
                    else if (existing.laborespautafrecuenciadias != prop.frecuencia || (existing.laborespautanotasia || '') !== (prop.notas_ia || '')) countModified++;
                    else countIdentical++;
                  });
                  return (
                    <>
                      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
                        {countNew > 0 && <span style={{ background: '#dcfce7', color: '#166534', padding: '4px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '700' }}>🆕 {countNew} nueva{countNew !== 1 ? 's' : ''}</span>}
                        {countModified > 0 && <span style={{ background: '#fef3c7', color: '#92400e', padding: '4px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '700' }}>✏️ {countModified} con cambios</span>}
                        {countIdentical > 0 && <span style={{ background: '#f1f5f9', color: '#64748b', padding: '4px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '700' }}>✅ {countIdentical} sin cambios</span>}
                      </div>
                      <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '36px 1fr 1fr', background: '#f1f5f9', borderBottom: '2px solid #e2e8f0' }}>
                          <div style={{ padding: '10px 8px' }}></div>
                          <div style={{ padding: '10px 14px', fontWeight: '700', fontSize: '0.85rem', color: '#64748b', borderRight: '1px solid #e2e8f0' }}>📦 ACTUAL</div>
                          <div style={{ padding: '10px 14px', fontWeight: '700', fontSize: '0.85rem', color: '#7c3aed' }}>✨ PROPUESTA IA</div>
                        </div>
                        {aiPautasProposal.map((prop, idx) => {
                          const existing = pautas.find(p => p.xlaborespautaidlabores == prop.id_labor && p.laborespautafase === prop.fase);
                          const laborDef = masterLabores.find(l => l.idlabores == prop.id_labor);
                          const laborName = laborDef ? laborDef.laboresnombre : '?';
                          let status: 'new' | 'modified' | 'identical' = 'new';
                          let freqChanged = false, notesChanged = false;
                          if (existing) {
                            freqChanged = existing.laborespautafrecuenciadias != prop.frecuencia;
                            notesChanged = (existing.laborespautanotasia || '') !== (prop.notas_ia || '');
                            status = (freqChanged || notesChanged) ? 'modified' : 'identical';
                          }
                          const isSelectable = status !== 'identical';
                          const statusColors: Record<string, string> = { new: '#10b981', modified: '#f59e0b', identical: '#cbd5e1' };
                          const statusBg: Record<string, string> = { new: '#f0fdf4', modified: '#fffbeb', identical: '#fafafa' };
                          const statusLabels: Record<string, string> = { new: '🆕 Nueva', modified: '✏️ Cambios', identical: '✅ Idéntica' };
                          return (
                            <div key={idx} style={{ borderBottom: idx < aiPautasProposal.length - 1 ? '1px solid #e2e8f0' : 'none' }}>
                              <div style={{ display: 'grid', gridTemplateColumns: '36px 1fr', background: statusBg[status], borderBottom: '1px solid #f1f5f9' }}>
                                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: isSelectable ? 'pointer' : 'default', padding: '8px 0' }}>
                                  {isSelectable ? (
                                    <input type="checkbox" checked={prop.selected} onChange={e => { const n = [...aiPautasProposal]; n[idx].selected = e.target.checked; setAiPautasProposal(n); }} style={{ width: '18px', height: '18px', accentColor: statusColors[status] }} />
                                  ) : (
                                    <span style={{ fontSize: '1rem' }}>✅</span>
                                  )}
                                </label>
                                <div style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                  <span style={{ fontWeight: 'bold', color: '#1e293b' }}>{laborName}</span>
                                  <span style={{ background: '#f1f5f9', color: '#475569', padding: '1px 8px', borderRadius: '5px', fontSize: '0.8rem', fontWeight: '600' }}>{faseLabels[prop.fase] || prop.fase}</span>
                                  <span style={{ background: statusBg[status], color: status === 'new' ? '#166534' : status === 'modified' ? '#92400e' : '#64748b', padding: '1px 8px', borderRadius: '5px', fontSize: '0.75rem', fontWeight: '700', border: `1px solid ${statusColors[status]}` }}>{statusLabels[status]}</span>
                                </div>
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: '36px 1fr 1fr', opacity: status === 'identical' ? 0.6 : 1 }}>
                                <div></div>
                                <div style={{ padding: '10px 14px', borderRight: '1px solid #e2e8f0', fontSize: '0.85rem', background: existing ? '#fff' : '#fafafa' }}>
                                  {existing ? (
                                    <>
                                      <div style={{ marginBottom: '6px' }}>
                                        <span style={{ background: freqChanged ? '#fee2e2' : '#f1f5f9', color: freqChanged ? '#991b1b' : '#475569', padding: '2px 8px', borderRadius: '4px', fontWeight: '600', fontSize: '0.82rem' }}>
                                          ⏱️ {existing.laborespautafrecuenciadias ? `Cada ${existing.laborespautafrecuenciadias} días` : 'Puntual'}
                                        </span>
                                      </div>
                                      {existing.laborespautanotasia && (
                                        <p style={{ margin: '4px 0 0', color: notesChanged ? '#991b1b' : '#64748b', fontStyle: 'italic', fontSize: '0.82rem', lineHeight: 1.4, background: notesChanged ? '#fee2e2' : '#f8fafc', padding: '5px 8px', borderRadius: '5px' }}>
                                          &quot;{existing.laborespautanotasia}&quot;
                                        </p>
                                      )}
                                    </>
                                  ) : (
                                    <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>— No existe —</span>
                                  )}
                                </div>
                                <div style={{ padding: '10px 14px', fontSize: '0.85rem', background: status === 'new' ? '#f0fdf4' : status === 'modified' ? '#fffbeb' : '#fff' }}>
                                  <div style={{ marginBottom: '6px' }}>
                                    <span style={{ background: freqChanged ? '#dcfce7' : '#e0e7ff', color: freqChanged ? '#166534' : '#4338ca', padding: '2px 8px', borderRadius: '4px', fontWeight: '600', fontSize: '0.82rem' }}>
                                      ⏱️ {prop.frecuencia ? `Cada ${prop.frecuencia} días` : 'Puntual'}
                                    </span>
                                  </div>
                                  {prop.notas_ia && (
                                    <p style={{ margin: '4px 0 0', color: notesChanged ? '#166534' : '#475569', fontStyle: 'italic', fontSize: '0.82rem', lineHeight: 1.4, background: notesChanged ? '#dcfce7' : '#f8fafc', padding: '5px 8px', borderRadius: '5px' }}>
                                      &quot;{prop.notas_ia}&quot;
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  );
                })()}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '2px solid #e2e8f0', paddingTop: '16px' }}>
                <button type="button" onClick={() => setShowPautasAiModal(false)} style={{ padding: '10px 24px', background: 'white', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1.05rem' }}>Cancelar</button>
                {aiPautasProposal.filter(p => p.selected && (() => {
                  const ex = pautas.find(e => e.xlaborespautaidlabores == p.id_labor && e.laborespautafase === p.fase);
                  return !ex || ex.laborespautafrecuenciadias != p.frecuencia || (ex.laborespautanotasia || '') !== (p.notas_ia || '');
                })()).length > 0 && (
                  <button
                    type="button"
                    style={{ padding: '10px 24px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1.05rem' }}
                    onClick={applyAiPautas}
                  >
                    Guardar Seleccionadas ({aiPautasProposal.filter(p => p.selected && (() => {
                      const ex = pautas.find(e => e.xlaborespautaidlabores == p.id_labor && e.laborespautafase === p.fase);
                      return !ex || ex.laborespautafrecuenciadias != p.frecuencia || (ex.laborespautanotasia || '') !== (p.notas_ia || '');
                    })()).length})
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </>
  );
}
