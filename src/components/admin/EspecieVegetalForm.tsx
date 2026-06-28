'use client'; // Force hot-reload: 2026-06-27T20:13:00 - Exact Premium Standard
import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Blurhash } from 'react-blurhash';
import { getMediaUrl } from '@/lib/media-url';
import { storage } from '@/lib/firebase/config'; // Import estático: garantiza initializeApp() en carga del módulo
import PremiumFormTabs from '@/components/ui/PremiumFormTabs';
import PremiumModal from '@/components/ui/PremiumModal';
import PremiumModalHeader from '@/components/ui/PremiumModalHeader';
import PremiumAiDiffRow, { PremiumAiDiffBadge } from '@/components/ui/PremiumAiDiffRow';
import PremiumSubheader from '@/components/ui/PremiumSubheader';
import PremiumDeleteButton from '@/components/ui/PremiumDeleteButton';
import PremiumDevInsights from '@/components/ui/PremiumDevInsights';
import PremiumBackButton from '@/components/ui/PremiumBackButton';
import './EspecieVegetalForm.css';
import EspecieVegetalVariedadesTab from './EspecieVegetalVariedadesTab';
import VariedadVegetalMediaManager from './VariedadVegetalMediaManager';
import PhotoEditorModal from './PhotoEditorModal';


interface EspecieVegetalFormProps {
  especieId: string | null;
  userEmail: string | null;
}

const MESES = [
  { val: 1, label: 'Ene' }, { val: 2, label: 'Feb' }, { val: 3, label: 'Mar' },
  { val: 4, label: 'Abr' }, { val: 5, label: 'May' }, { val: 6, label: 'Jun' },
  { val: 7, label: 'Jul' }, { val: 8, label: 'Ago' }, { val: 9, label: 'Sep' },
  { val: 10, label: 'Oct' }, { val: 11, label: 'Nov' }, { val: 12, label: 'Dic' }
];

const TIPOS = ['hortaliza', 'fruta', 'aromatica', 'leguminosa', 'cereal', 'adventicia', 'otra'];
const CICLOS = ['anual', 'bianual', 'perenne'];

const normalizePlantaParteNombre = (name: string): string => {
  const normalized = name.trim().toLowerCase();
  if (normalized.includes('hoja') || normalized.includes('follaje') || normalized.includes('brote') || normalized.includes('rama')) return 'Hojas';
  if (normalized.includes('fruto') || normalized.includes('fruta') || normalized.includes('vaina') || normalized.includes('baya')) return 'Frutos';
  if (normalized.includes('tallo') || normalized.includes('penca') || normalized.includes('caña') || normalized.includes('tronco')) return 'Tallo';
  if (normalized.includes('raiz') || normalized.includes('raíz') || normalized.includes('bulbo') || normalized.includes('tubérculo') || normalized.includes('tuberculo')) return 'Raíz';
  if (normalized.includes('flor') || normalized.includes('flores') || normalized.includes('inflorescencia')) return 'Flores';
  if (normalized.includes('semilla') || normalized.includes('grano') || normalized.includes('pepita')) return 'Semillas';
  if (normalized.includes('toda la planta') || normalized.includes('planta completa') || normalized.includes('entera') || normalized.includes('toda')) return 'Toda la planta';
  return name;
};

export default function EspecieVegetalForm({ especieId, userEmail }: EspecieVegetalFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const focusParam = searchParams.get('focus');
  const editPdfParam = searchParams.get('editPdf');

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const checkResize = () => setIsMobile(window.innerWidth <= 768);
    checkResize();
    window.addEventListener('resize', checkResize);
    return () => window.removeEventListener('resize', checkResize);
  }, []);

    const defaultFormData = {
    especiesvegetalesnombre: '', especiesvegetalesnombrecientifico: '', xespeciesvegetalesidfamilias: '',
    especiestipo: [], especiesciclo: [], especiescolor: '', especiestamano: 'mediano',
    especiesviabilidadsemilla: '',
    especiestemperaturaminima: '', especiestemperaturaoptima: '',
    especiesmarcoplantas: '', especiesmarcofilas: '', especiesmarcomargen: '', especiesprofundidadsiembra: '',
    especiesfechasemillerodesde: '', especiesfechasemillerohasta: '',
    especiesfechasiembradirectadesde: '', especiesfechasiembradirectahasta: '',
    especiestrasplantedesde: '', especiestrasplantehasta: '',
    especiesfecharecolecciondesde: '', especiesfecharecoleccionhasta: '',
    especieshistoria: '', especiesvegetalesdescripcion: '', especiesfuentesinformacion: '',
    especiesautosuficiencia: '', especiesautosuficienciaparcial: '', especiesautosuficienciaconserva: '', especiesvegetalesvisibilidadsino: 1,
    especiesvegetalesicono: '',    especiesorganocomestible: '', especiesbiodinamicanotas: '', especiesprofundidadtrasplante: '',
    especiesphminimosuelo: '', especiesphmaximosuelo: '', especiesnecesidadriego: '', especiestiposiembra: [], especiestiposiembrapreferente: [],
    especiesvolumenmaceta: '', especiesemillerovolumendesde: '', especiesemillerovolumenhasta: '', especiesluzsolar: '', especiescaracteristicassuelo: '', especiesdificultad: '', especiestemperaturamaxima: '',
    especiespreparacionconvencional: '', especiespreparacionminima: '', especiespreparacionnolaboreo: '',
    especiespeso1000semillas: '',
    especieslunarfasesiembra: '',
    especieslunarfasetrasplante: '',
    especieslunarobservaciones: '',
    especiesbiodinamicafasesiembra: '',
    especiesbiodinamicafasetrasplante: '',
    especiesresistenciahelada: '',
    especiesnecesidadtutoraje: '',
    especiesporteplanta: '',
    especiesrendimientoestimado: '',
    especiespartecosechable: [],
    especiesgerminaroscuridad: '',
    fases_duracion: {}
  };

  const [formData, setFormData] = useState<any>(defaultFormData);
  const [initialData, setInitialData] = useState<any>(defaultFormData);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'no-changes'>('idle');
  const [relaciones, setRelaciones] = useState<{ beneficiosas: any[]; perjudiciales: any[]; afecciones: any[] }>({ beneficiosas: [], perjudiciales: [], afecciones: [] });
  const [initialRelaciones, setInitialRelaciones] = useState<{ beneficiosas: any[]; perjudiciales: any[]; afecciones: any[] }>({ beneficiosas: [], perjudiciales: [], afecciones: [] });
  const [relacionesDirty, setRelacionesDirty] = useState(false);
  const [relacionesSaveStatus, setRelacionesSaveStatus] = useState<'idle' | 'saving' | 'no-changes'>('idle');

  const isFormDirty = JSON.stringify(formData) !== JSON.stringify(initialData);
  const isDirty = isFormDirty || relacionesDirty;

  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('taxonomia');
  const [isEspecieOpen, setIsEspecieOpen] = useState(true);

  const [calcPersonas, setCalcPersonas] = useState<number>(1);
  const [aiProposal, setAiProposal] = useState<any>(null);
  const [selectedRels, setSelectedRels] = useState<{ ben: any[], per: any[], pla: any[] }>({ ben: [], per: [], pla: [] });
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiModalActiveTab, setAiModalActiveTab] = useState('taxonomia');
  const [selectedAiFields, setSelectedAiFields] = useState<Record<string, boolean>>({});
  const [showOnlyDiffs, setShowOnlyDiffs] = useState(false);
  const [collapsedAiGroups, setCollapsedAiGroups] = useState<Record<string, boolean>>({});
  const [isAssimilatingRels, setIsAssimilatingRels] = useState(false);

  const [showAiConfig, setShowAiConfig] = useState(false);
  const [aiConfigPrompt, setAiConfigPrompt] = useState('Busca información botánica detallada de esta especie, incluyendo su taxonomía, requerimientos, ecosistema de asociaciones, sinónimos locales y principales variedades comerciales y tradicionales.');
  const [aiConfigTabs, setAiConfigTabs] = useState<Record<string, boolean>>({
    taxonomia: true,
    cultivo: true,
    fases: true,
    biodinamica: true,
    asociaciones: true,
    textos: true,
    sinonimos: true,
    variedades: true,
    alimentacion: true,
    pautas: true
  });
  const [selectedAiSinonimos, setSelectedAiSinonimos] = useState<any[]>([]);
  const [selectedAiVariedades, setSelectedAiVariedades] = useState<any[]>([]);
  const [selectedAiAlimentacion, setSelectedAiAlimentacion] = useState<any[]>([]);
  const [isAssimilatingSinonimos, setIsAssimilatingSinonimos] = useState(false);
  const [isAssimilatingVariedades, setIsAssimilatingVariedades] = useState(false);
  const [assimilatedVarietyNames, setAssimilatedVarietyNames] = useState<string[]>([]);

  const [aiSeconds, setAiSeconds] = useState(0);
  const [aiStats, setAiStats] = useState<{ used: number, max: number, remaining: number } | null>(null);
  const aiTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [isAssimilating, setIsAssimilating] = useState(false);
  const [assimilationSeconds, setAssimilationSeconds] = useState(0);
  const assimilationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const runWithAssimilationLoading = async (fn: () => Promise<void> | void) => {
    if (isAssimilating) {
      await fn();
      return;
    }
    setAssimilationSeconds(0);
    setIsAssimilating(true);
    const interval = setInterval(() => {
      setAssimilationSeconds(s => s + 1);
    }, 1000);
    assimilationTimerRef.current = interval;
    try {
      await fn();
    } finally {
      setIsAssimilating(false);
      clearInterval(interval);
      if (assimilationTimerRef.current === interval) {
        assimilationTimerRef.current = null;
      }
    }
  };

  useEffect(() => {
    return () => {
      if (aiTimerRef.current) clearInterval(aiTimerRef.current);
      if (assimilationTimerRef.current) clearInterval(assimilationTimerRef.current);
    };
  }, []);

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
  const [masterAfecciones, setMasterAfecciones] = useState<any[]>([]);
  const [masterFases, setMasterFases] = useState<any[]>([]);
  const [masterFamilias, setMasterFamilias] = useState<any[]>([]);

  // -- Chekeo y Variedades Existentes State --
  const [existingVarieties, setExistingVarieties] = useState<any[]>([]);
  const [checking, setChecking] = useState(false);
  const [checkResults, setCheckResults] = useState<any>(null);
  const [showCheckModal, setShowCheckModal] = useState(false);

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
  
    useEffect(() => {
    if (tabParam) {
      const mappedTabs: Record<string, string> = {
        sinonimos: 'taxonomia',
        fisiologia: 'cultivo',
        calendarios: 'fases',
        plagas: 'asociaciones',
        autosuficiencia: 'textos'
      };
      setActiveTab(mappedTabs[tabParam] || tabParam);
    }
  }, [tabParam]);
  const [showSinonimosConfig, setShowSinonimosConfig] = useState(false);
  const [sinConfigPromptOpen, setSinConfigPromptOpen] = useState(false);
  const [sinSelectedScope, setSinSelectedScope] = useState<string>('general');
  const [sinExtraInstructions, setSinExtraInstructions] = useState('Busca sinónimos en español de Latinoamérica y principales idiomas mundiales. Incluye variantes regionales donde el nombre sea diferente al principal.');
  const sinScopePresets: Record<string, string> = {
    general: 'Busca sinónimos en español de Latinoamérica y principales idiomas mundiales. Incluye variantes regionales donde el nombre sea diferente al principal.',
    cooficiales: 'Busca sinónimos en las lenguas cooficiales de España: Valenciano, Gallego y Euskera. Prioriza nombres tradicionales peninsulares.',
    europa: 'Busca sinónimos en idiomas europeos: Francés, Italiano, Portugués, Alemán e Inglés. Asocia cada nombre a su país correspondiente.'
  };
  // -- Animales State --
  const [masterAnimales, setMasterAnimales] = useState<any[]>([]);
  const [masterPlantasPartes, setMasterPlantasPartes] = useState<any[]>([]);
  const [alimentacion, setAlimentacion] = useState<any[]>([]);
  const [initialAlimentacion, setInitialAlimentacion] = useState<any[]>([]);
  const [alimentacionDirty, setAlimentacionDirty] = useState(false);

  // -- Photo Editor State --
  const [editingPhoto, setEditingPhoto] = useState<any>(null);
  const [photoEditorSaveStatus, setPhotoEditorSaveStatus] = useState<'idle' | 'saving' | 'no-changes'>('idle');
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string | number; type: string; url?: string } | null>(null);
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
  const [pdfSearchResults, setPdfSearchResults] = useState<{ title: string, url: string, summary?: string, apuntes?: string }[]>([]);
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
  const [pautasFiltroFase, setPautasFiltroFase] = useState('');
  const [pautasFiltroLabor, setPautasFiltroLabor] = useState('');
  const [pautasFiltroLaboreo, setPautasFiltroLaboreo] = useState('');
  const [alimentacionFiltroAnimal, setAlimentacionFiltroAnimal] = useState('');
  const [alimentacionFiltroAptitud, setAlimentacionFiltroAptitud] = useState('');
  const [masterLabores, setMasterLabores] = useState<any[]>([]);
  const [editingPauta, setEditingPauta] = useState<any>(null);
  const [pautaForm, setPautaForm] = useState({
    xlaborespautaidlabores: '',
    laborespautafase: 'planificacion',
    laborespautafrecuenciadias: '',
    laborespautaoffset: 0,
    laborespautanotasia: '',
    laborespautaactivosino: 1,
    idlaborespauta: undefined as number | undefined
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showAddPautaForm, setShowAddPautaForm] = useState(false);

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
      fetch('/api/admin/especiesvegetales', { headers: { 'x-user-email': userEmail } })
        .then(res => res.json())
        .then(data => setMasterEspecies(data.especies || []));
      fetch('/api/admin/afecciones', { headers: { 'x-user-email': userEmail } })
        .then(res => res.json())
        .then(data => setMasterAfecciones(data.afecciones || []));
      fetch('/api/admin/labores', { headers: { 'x-user-email': userEmail } })
        .then(res => res.json())
        .then(data => setMasterLabores(data.labores || []));
      fetch('/api/admin/fases', { headers: { 'x-user-email': userEmail } })
        .then(res => res.json())
        .then(data => setMasterFases(data.fases || []));
      fetch('/api/admin/familias', { headers: { 'x-user-email': userEmail } })
        .then(res => res.json())
        .then(data => setMasterFamilias(data.familias || []));
      fetch('/api/admin/ajustes/idiomas')
        .then(res => res.json())
        .then(data => setMasterIdiomas(Array.isArray(data) ? data : []));
      fetch('/api/admin/ajustes/paises')
        .then(res => res.json())
        .then(data => setMasterPaises(Array.isArray(data) ? data : []));
      fetch('/api/admin/especiesanimales', { headers: { 'x-user-email': userEmail } })
        .then(res => res.json())
        .then(data => setMasterAnimales(data.data || []));
      fetch('/api/admin/plantasparte', { headers: { 'x-user-email': userEmail } })
        .then(res => res.json())
        .then(data => setMasterPlantasPartes(data.plantaspartes || []));
    }

    if (especieId) {
      loadEspecie(especieId);
      loadAttachments(especieId);
      loadRelaciones(especieId);
      loadSinonimos(especieId);
      loadAlimentacion(especieId);
      loadPautas(especieId);
      loadExistingVarieties(especieId);
    }
  }, [especieId, userEmail]);

  // Vincular alimentacion importados por nombre a sus IDs una vez que masterPlantasPartes esté disponible
  useEffect(() => {
    if (masterPlantasPartes.length > 0 && alimentacion.length > 0) {
      let changed = false;
      const updated = alimentacion.map(c => {
        if (!c.xespeciesvegetalesanimalesidplantasparte && c.especiesanimalespartes) {
          const baseName = normalizePlantaParteNombre(c.especiesanimalespartes);
          const found = masterPlantasPartes.find(p => p.plantaspartenombre.toLowerCase() === baseName.toLowerCase());
          if (found) {
            changed = true;
            let updatedNotas = c.especiesanimalesnotas || '';
            if (c.especiesanimalespartes.toLowerCase() !== baseName.toLowerCase()) {
              const prefix = `${c.especiesanimalespartes}: `;
              if (!updatedNotas.startsWith(prefix)) {
                updatedNotas = prefix + updatedNotas;
              }
            }
            return {
              ...c,
              xespeciesvegetalesanimalesidplantasparte: found.idplantasparte,
              especiesanimalespartes: found.plantaspartenombre,
              especiesanimalesnotas: updatedNotas
            };
          }
        }
        return c;
      });
      if (changed) {
        setAlimentacion(updated);
      }
    }
  }, [masterPlantasPartes, alimentacion]);

  // AI Trigger para especies nuevas importadas desde el identificador IA
  useEffect(() => {
    const fromParam = searchParams.get('from');
    const nameParam = searchParams.get('name');
    const advParam = searchParams.get('adv');
    
    if (fromParam === 'identificar-especie' && nameParam && !showAiConfig) {
      // 1. Asimilar alimentacion desde sessionStorage
      const pendingAlimentacionStr = sessionStorage.getItem('ai_pending_alimentacion');
      if (pendingAlimentacionStr) {
        try {
          const parsed = JSON.parse(pendingAlimentacionStr);
          // Convertir al formato de la BBDD
          const mapped = parsed.map((c: any) => ({
            idespeciesanimales: null,
            xespeciesvegetalesanimalesidespeciesanimales: c.idespeciesanimales ? c.idespeciesanimales.toString() : '',
            especiesanimalesesapto: c.esapto,
            especiesanimalespartes: c.partes || '',
            especiesanimalesnotas: c.notas || ''
          }));
          setAlimentacion(mapped);
          setAlimentacionDirty(true);
          sessionStorage.removeItem('ai_pending_alimentacion');
        } catch (e) {
          console.error('Error parseando alimentacion pendientes', e);
        }
      }

      // 2. Pre-configurar el prompt dependiendo de si es adventicia o no
      const isAdventicia = advParam === '1';
      if (isAdventicia) {
        setAiConfigPrompt(`Busca información botánica detallada de esta especie (${nameParam}). Al ser considerada adventicia o mala hierba, céntrate exclusivamente en su identificación biológica, familia, toxicidad, forraje y usos tradicionales. Ignora todo lo relacionado con requerimientos agronómicos, marcos de plantación, poda o cultivo activo, ya que no se va a cultivar.`);
        
        // Seleccionar solo pestañas relevantes
        setAiConfigTabs({
          taxonomia: true, cultivo: false, asociaciones: true, fases: false, biodinamica: false,
          textos: true, pautas: false, sinonimos: true, alimentacion: true
        });
      } else {
        setAiConfigPrompt(`Busca información botánica y agronómica detallada de esta especie (${nameParam}), incluyendo su taxonomía, requerimientos de cultivo, ecosistema de asociaciones, sinónimos locales y principales variedades comerciales y tradicionales.`);
      }

      // 3. Abrir el modal del Asistente
      setTimeout(() => {
        setAiConfigTabs({ taxonomia: true, cultivo: true, fases: true, biodinamica: true, asociaciones: true, textos: true, sinonimos: true, variedades: true, alimentacion: true, pautas: true });
        setAiConfigPrompt('');
        setShowAiConfig(true);
      }, 500);
    }
  }, [searchParams]);

  const loadExistingVarieties = async (id: string) => {
    if (!userEmail) return;
    try {
      const res = await fetch(`/api/admin/variedadesvegetales?filter=todas`, {
        headers: { 'x-user-email': userEmail },
      });
      if (res.ok) {
        const data = await res.json();
        const filtered = (data.variedades || []).filter((v: any) => v.xvariedadesvegetalesidespeciesvegetales == id);
        setExistingVarieties(filtered);
      }
    } catch (e) {
      console.error('Error loading existing varieties:', e);
    }
  };

  const loadSinonimos = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/especiesvegetales/${id}/sinonimos`);
      const data = await res.json();
      setSinonimos(Array.isArray(data) ? data : []);
      setInitialSinonimos(Array.isArray(data) ? data : []);
      setSinonimosDirty(false);
    } catch (e) {
      console.error('Error loading sinonimos:', e);
    }
  };

  const resolvePlantasParteId = async (name: string): Promise<number | null> => {
    const baseName = normalizePlantaParteNombre(name);
    const normalized = baseName.trim().toLowerCase();
    if (!normalized) return null;

    // Check if we have it in state
    const existing = masterPlantasPartes.find(p => p.plantaspartenombre.toLowerCase() === normalized);
    if (existing) return existing.idplantasparte;

    // If not, create dynamically
    try {
      const res = await fetch('/api/admin/plantasparte', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': userEmail || ''
        },
        body: JSON.stringify({
          plantaspartenombre: baseName.trim(),
          plantasparteemoji: '🌱',
          plantaspartedescripcion: 'Creado automáticamente por el Asistente IA',
          plantasparteactivo: 1
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.id) {
          const newPart = {
            idplantasparte: data.id,
            plantaspartenombre: baseName.trim(),
            plantasparteemoji: '🌱',
            plantaspartedescripcion: 'Creado automáticamente por el Asistente IA',
            plantasparteactivo: 1
          };
          setMasterPlantasPartes(prev => [...prev, newPart]);
          return data.id;
        }
      }
    } catch (err) {
      console.error('Error creating plantasparte dynamically:', err);
    }
    return null;
  };

  const loadAlimentacion = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/especiesvegetales/${id}/animales`);
      const data = await res.json();
      setAlimentacion(Array.isArray(data) ? data : []);
      setInitialAlimentacion(Array.isArray(data) ? data : []);
      setAlimentacionDirty(false);
    } catch (e) {
      console.error('Error loading alimentacion:', e);
    }
  };

  const saveAlimentacionNow = async () => {
    if (!especieId) {
      alert("Guarda primero la especie antes de guardar los alimentacion.");
      return;
    }
    try {
      const res = await fetch(`/api/admin/especiesvegetales/${especieId}/animales`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': userEmail || ''
        },
        body: JSON.stringify({ alimentacion })
      });
      const data = await res.json();
      if (data.success) {
        setAlimentacionDirty(false);
        setInitialAlimentacion([...alimentacion]);
        setToastMessage("Alimentacion guardados correctamente");
        setTimeout(() => setToastMessage(null), 3000);
      } else {
        alert(data.error || "Error al guardar alimentacion");
      }
    } catch (e) {
      console.error('Error saving alimentacion:', e);
      alert("Error de red");
    }
  };

  const loadRelaciones = async (id: string) => {
    if (!userEmail) return;
    try {
      const res = await fetch(`/api/admin/especiesvegetales/${id}/relaciones`, { headers: { 'x-user-email': userEmail } });
      const data = await res.json();
      const rels = {
        beneficiosas: data.beneficiosas || [],
        perjudiciales: data.perjudiciales || [],
        afecciones: data.afecciones || []
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
  }, [especieId, formData.especiesvegetalesnombre, userEmail]);

  const loadEspecie = async (id: string) => {
    if (!userEmail) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/especiesvegetales/${id}`, {
        headers: { 'x-user-email': userEmail }
      });
      const data = await res.json();
      const especie = data.especie;
      if (especie) {
        const parsedEspecie = {
          ...especie,
          especiestemperaturaminima: especie.especiesvegetalestemperaturaminima !== null ? parseFloat(especie.especiesvegetalestemperaturaminima).toString() : '',
          especiestemperaturaoptima: especie.especiesvegetalestemperaturaoptima !== null ? parseFloat(especie.especiesvegetalestemperaturaoptima).toString() : '',
          especiesmarcoplantas: especie.especiesvegetalesmarcoplantas !== null ? parseInt(especie.especiesvegetalesmarcoplantas, 10).toString() : '',
          especiesmarcofilas: especie.especiesvegetalesmarcofilas !== null ? parseInt(especie.especiesvegetalesmarcofilas, 10).toString() : '',
          especiesmarcomargen: especie.especiesvegetalesmarcomargen !== null ? parseInt(especie.especiesvegetalesmarcomargen, 10).toString() : '',
          especiestipo: especie.especiesvegetalestipo ? especie.especiesvegetalestipo.split(',') : [],
          especiesciclo: especie.especiesvegetalesciclo ? especie.especiesvegetalesciclo.split(',') : [],
          especiestiposiembra: especie.especiesvegetalestiposiembra ? especie.especiesvegetalestiposiembra.split(',') : [],
          especiestiposiembrapreferente: especie.especiesvegetalestiposiembrapreferente ? especie.especiesvegetalestiposiembrapreferente.split(',') : [],
          especiesviabilidadsemilla: especie.especiesvegetalesviabilidadsemilla !== null ? parseFloat(especie.especiesvegetalesviabilidadsemilla).toString() : '',
          especiespeso1000semillas: especie.especiesvegetalespeso1000semillas !== null ? parseFloat(especie.especiesvegetalespeso1000semillas).toString() : '',
          especiespreparacionconvencional: especie.especiesvegetalespreparacionconvencional !== null && especie.especiesvegetalespreparacionconvencional !== undefined ? parseInt(especie.especiesvegetalespreparacionconvencional, 10).toString() : '',
          especiespreparacionminima: especie.especiesvegetalespreparacionminima !== null && especie.especiesvegetalespreparacionminima !== undefined ? parseInt(especie.especiesvegetalespreparacionminima, 10).toString() : '',
          especiespreparacionnolaboreo: especie.especiesvegetalespreparacionnolaboreo !== null && especie.especiesvegetalespreparacionnolaboreo !== undefined ? parseInt(especie.especiesvegetalespreparacionnolaboreo, 10).toString() : ''
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
      const pRes = await fetch(`/api/admin/especiesvegetales/${id}/photos`, { headers: { 'x-user-email': userEmail } });
      const pData = await pRes.json();
      setPhotos(pData.photos || []);
    } catch (e) { console.error('Error cargando fotos:', e); }

    try {
      const dRes = await fetch(`/api/admin/especiesvegetales/${id}/pdfs`, { headers: { 'x-user-email': userEmail } });
      const dData = await dRes.json();
      setPdfs(dData.pdfs || []);
    } catch (e) { console.error('Error cargando PDFs:', e); }

    try {
      const bRes = await fetch(`/api/admin/especiesvegetales/${id}/blogs`, { headers: { 'x-user-email': userEmail } });
      const bData = await bRes.json();
      setBlogs(bData.data || []);
    } catch (e) { console.error('Error cargando blogs:', e); }
  };

  const loadPautas = async (id: string) => {
    if (!userEmail) return;
    try {
      const res = await fetch(`/api/admin/especiesvegetales/${id}/pautas`, {
        headers: { 'x-user-email': userEmail }
      });
      if (res.ok) {
        const data = await res.json();
        setPautas(data.pautas || []);
      }
    } catch (e) {
      console.error('Error cargando pautas:', e);
    }
  };

  const autoSaveField = async (name: string, value: any, customFormData?: any) => {
    if (!especieId || !userEmail) return;

    const dataToSave = customFormData || {
      ...formData,
      [name]: value
    };

    // Evitamos guardar si no hay cambios reales comparado con la base de datos
    if (JSON.stringify(dataToSave[name]) === JSON.stringify(initialData[name])) return;

    setSaveStatus('saving');
    try {
      const res = await fetch(`/api/admin/especiesvegetales/${especieId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': userEmail
        },
        body: JSON.stringify(dataToSave)
      });
      const data = await res.json();
      if (data.success) {
        setInitialData(dataToSave);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } else {
        setSaveStatus('idle');
      }
    } catch (e) {
      console.error('Error in autoSaveField:', e);
      setSaveStatus('idle');
    }
  };

  const autoSaveFases = async (fasesData: any) => {
    if (!especieId || !userEmail) return;
    setSaveStatus('saving');
    try {
      const res = await fetch(`/api/admin/especiesvegetales/${especieId}/fases`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': userEmail
        },
        body: JSON.stringify({ fases_duracion: fasesData })
      });
      const data = await res.json();
      if (data.success) {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } else {
        setSaveStatus('idle');
      }
    } catch (e) {
      console.error('Error in autoSaveFases:', e);
      setSaveStatus('idle');
    }
  };

  const handleFormBlur = (e: React.FocusEvent<HTMLFormElement>) => {
    const target = e.target as any;
    if (target && target.name && target.type !== 'checkbox') {
      autoSaveField(target.name, target.value);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      if (name === 'especiestipo' || name === 'especiesciclo' || name === 'especiestiposiembra') {
        const nextArray = checked
          ? [...formData[name], value]
          : formData[name].filter((item: string) => item !== value);
        setFormData((prev: any) => {
          const next = { ...prev, [name]: nextArray };
          setTimeout(() => autoSaveField(name, nextArray, next), 100);
          return next;
        });
      } else {
        const finalValue = checked ? 1 : 0;
        setFormData((prev: any) => {
          const next = { ...prev, [name]: finalValue };
          setTimeout(() => autoSaveField(name, finalValue, next), 100);
          return next;
        });
      }
    } else {
      setFormData({ ...formData, [name]: value });
      if (e.target.tagName === 'SELECT') {
        const next = { ...formData, [name]: value };
        setTimeout(() => autoSaveField(name, value, next), 100);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userEmail) { alert('No email (sesión no detectada)'); return; }
    setLoading(true);
    setSaveStatus('saving');
    try {
      const url = especieId ? `/api/admin/especiesvegetales/${especieId}` : '/api/admin/especiesvegetales';
      const method = especieId ? 'PUT' : 'POST';
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
        const targetId = especieId || data.id;
        if (relacionesDirty && targetId) {
          try {
            await fetch(`/api/admin/especiesvegetales/${targetId}/relaciones`, {
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

        if (!especieId) {
          router.push(`/dashboard/admin/especiesvegetales/${data.id}`);
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

  const handleCheckSpecies = async () => {
    if (!especieId) {
      alert('Guarda primero la especie para realizar el chequeo.');
      return;
    }
    setChecking(true);
    try {
      const varRes = await fetch(`/api/admin/variedadesvegetales?filter=todas`, {
        headers: { 'x-user-email': userEmail || '' }
      });
      let varCount = 0;
      if (varRes.ok) {
        const varData = await varRes.json();
        const filtered = (varData.variedades || []).filter((v: any) => v.xvariedadesvegetalesidespeciesvegetales == especieId);
        varCount = filtered.length;
      }

      const missingFields: string[] = [];
      let score = 0;
      
      const basicFields = [
        { key: 'especiesvegetalesnombrecientifico', label: 'Nombre científico' },
        { key: 'xespeciesvegetalesidfamilias', label: 'Familia botánica (ID)' },
        { key: 'especiesvegetalesdescripcion', label: 'Descripción / Historia' },
        { key: 'especiesvegetalesicono', label: 'Icono / Emoji' },
        { key: 'especiesphminimosuelo', label: 'pH mínimo del suelo' },
        { key: 'especiesphmaximosuelo', label: 'pH máximo del suelo' },
        { key: 'especiesnecesidadriego', label: 'Riego' },
        { key: 'especiesluzsolar', label: 'Luz solar' },
        { key: 'especiesdificultad', label: 'Dificultad' },
        { key: 'especiesresistenciahelada', label: 'Resistencia a heladas' },
        { key: 'especiesnecesidadtutoraje', label: 'Necesidad de tutoraje' },
        { key: 'especiesporteplanta', label: 'Porte de la planta' },
        { key: 'especiesrendimientoestimado', label: 'Rendimiento estimado' },
      ];

      basicFields.forEach(f => {
        if (!formData[f.key]) {
          missingFields.push(f.label);
        } else {
          score += 5;
        }
      });

      const hasSinonimos = sinonimos.length > 0;
      const hasLabores = pautas.length > 0;
      const hasPhotos = photos.length > 0;
      const hasPdfs = pdfs.length > 0;
      const hasEcosystem = relaciones.beneficiosas.length > 0 || relaciones.perjudiciales.length > 0 || relaciones.afecciones.length > 0;
      const hasVarieties = varCount > 0;
      const hasAlimentacion = alimentacion.length > 0;

      if (hasSinonimos) score += 10;
      if (hasLabores) score += 10;
      if (hasPhotos) score += 10;
      if (hasPdfs) score += 10;
      if (hasEcosystem) score += 10;
      if (hasVarieties) score += 10;
      if (hasAlimentacion) score += 10;

      setCheckResults({
        score,
        missingFields,
        hasSinonimos,
        hasLabores,
        hasPhotos,
        hasPdfs,
        hasEcosystem,
        hasVarieties,
        hasAlimentacion,
        sinonimosCount: sinonimos.length,
        laboresCount: pautas.length,
        photosCount: photos.length,
        pdfsCount: pdfs.length,
        ecosystemCount: relaciones.beneficiosas.length + relaciones.perjudiciales.length + relaciones.afecciones.length,
        varietiesCount: varCount,
        alimentacionCount: alimentacion.length
      });
      setShowCheckModal(true);
    } catch (err) {
      console.error(err);
      alert('Error al realizar el chequeo de la especie.');
    } finally {
      setChecking(false);
    }
  };

  const callAI = async () => {
    if (!formData.especiesvegetalesnombre) {
      alert('Introduce primero el nombre común de la especie.');
      return;
    }
    setAiConfigTabs({ taxonomia: true, cultivo: true, fases: true, biodinamica: true, asociaciones: true, textos: true, sinonimos: true, variedades: true, alimentacion: true, pautas: true });
    setAiConfigPrompt('');
    setShowAiConfig(true);

    try {
      const resAi = await fetch('/api/user/ai-stats', { headers: { 'x-user-email': userEmail || '' } });
      if (resAi.ok) {
        const aiData = await resAi.json();
        setAiStats(aiData);
      }
    } catch (e) {
      console.error('Error fetching ai stats:', e);
    }
  };

  const aiGroups = [
    {
      id: 'taxonomia',
      title: '🧬 Identificación',
      keys: ['especiesvegetalesnombrecientifico', 'xespeciesvegetalesidfamilias', 'especiescolor', 'especiestamano', 'especiesvegetalesicono', 'especiestipo', 'especiesciclo'],
      labels: {
        especiesvegetalesnombrecientifico: 'Nombre científico',
        xespeciesvegetalesidfamilias: 'Familia (ID)',
        especiesfamilia: 'Familia',
        especiescolor: 'Color Fenotípico',
        especiestamano: 'Tamaño',
        especiesvegetalesicono: 'Icono/Emoji',
        especiestipo: 'Tipos',
        especiesciclo: 'Ciclo'
      }
    },
    {
      id: 'cultivo',
      title: '🌱 Requisitos y Suelo',
      keys: [
        'especiesphminimosuelo', 'especiesphmaximosuelo', 'especiescaracteristicassuelo', 'especiesnecesidadriego', 
        'especiestiposiembra', 'especiestiposiembrapreferente', 'especiesvolumenmaceta', 
        'especiesemillerovolumendesde', 'especiesemillerovolumenhasta', 'especiesdificultad', 
        'especiesviabilidadsemilla', 'especiespeso1000semillas', 'especiestemperaturaminima', 
        'especiestemperaturaoptima', 'especiestemperaturamaxima', 'especiesprofundidadsiembra', 
        'especiesprofundidadtrasplante', 'especiesluzsolar',
        'especiespreparacionconvencional', 'especiespreparacionminima', 'especiespreparacionnolaboreo',
        'especiesmarcoplantas', 'especiesmarcofilas', 'especiesmarcomargen',
        'especiesresistenciahelada', 'especiesnecesidadtutoraje', 'especiesporteplanta',
        'especiesrendimientoestimado', 'especiespartecosechable', 'especiesgerminaroscuridad'
      ],
      labels: {
        especiesphminimosuelo: 'pH Mín. Suelo',
        especiesphmaximosuelo: 'pH Máx. Suelo',
        especiescaracteristicassuelo: 'Tipo de Suelo',
        especiesnecesidadriego: 'Nec. Riego',
        especiestiposiembra: 'Tipos de Siembra',
        especiestiposiembrapreferente: 'Siembra Preferida',
        especiesvolumenmaceta: 'Volumen Maceta (L)',
        especiesemillerovolumendesde: 'Vol. Semillero Mín (cc)',
        especiesemillerovolumenhasta: 'Vol. Semillero Máx (cc)',
        especiesdificultad: 'Dificultad',
        especiesviabilidadsemilla: 'Viabilidad Semilla (Años)',
        especiespeso1000semillas: 'Peso 1000 Semillas (g)',
        especiestemperaturaminima: 'Temp. Mínima (°C)',
        especiestemperaturaoptima: 'Temp. Óptima (°C)',
        especiestemperaturamaxima: 'Temp. Máxima (°C)',
        especiesprofundidadsiembra: 'Profundidad Siembra (cm)',
        especiesprofundidadtrasplante: 'Profundidad Trasplante (cm)',
        especiesluzsolar: 'Luz Solar',
        especiespreparacionconvencional: 'Prep. Convencional (días)',
        especiespreparacionminima: 'Prep. Mínima (días)',
        especiespreparacionnolaboreo: 'Prep. Sin Laboreo (días)',
        especiesmarcoplantas: 'Marco entre Plantas (cm)',
        especiesmarcofilas: 'Marco entre Filas (cm)',
        especiesmarcomargen: 'Margen al Borde (cm)',
        especiesresistenciahelada: 'Resistencia a Heladas',
        especiesnecesidadtutoraje: 'Necesidad de Tutoraje',
        especiesporteplanta: 'Porte de la Planta',
        especiesrendimientoestimado: 'Rendimiento Estimado',
        especiespartecosechable: 'Parte Cosechable',
        especiesgerminaroscuridad: '¿Germina en Oscuridad?'
      }
    },
    {
      id: 'fases',
      title: '📅 Calendarios y Fases',
      keys: [
        'especiesfechasemillerodesde', 'especiesfechasemillerohasta',
        'especiesfechasiembradirectadesde', 'especiesfechasiembradirectahasta',
        'especiestrasplantedesde', 'especiestrasplantehasta',
        'especiesfecharecolecciondesde', 'especiesfecharecoleccionhasta',
        'fases_duracion'
      ],
      labels: {
        especiesfechasemillerodesde: 'Semillero (Desde)',
        especiesfechasemillerohasta: 'Semillero (Hasta)',
        especiesfechasiembradirectadesde: 'Siembra Dir. (Desde)',
        especiesfechasiembradirectahasta: 'Siembra Dir. (Hasta)',
        especiestrasplantedesde: 'Trasplante (Desde)',
        especiestrasplantehasta: 'Trasplante (Hasta)',
        especiesfecharecolecciondesde: 'Recolección (Desde)',
        especiesfecharecoleccionhasta: 'Recolección (Hasta)',
        fases_duracion: 'Duración de Fases'
      }
    },
    {
      id: 'biodinamica',
      title: '🌙 Luna y Biodinámica',
      keys: [
        'especieslunarfasesiembra', 
        'especieslunarfasetrasplante', 
        'especieslunarobservaciones',
        'especiesorganocomestible', 
        'especiesbiodinamicafasesiembra',
        'especiesbiodinamicafasetrasplante',
        'especiesbiodinamicanotas'
      ],
      labels: {
        especieslunarfasesiembra: 'Fase Siembra (Lunar)',
        especieslunarfasetrasplante: 'Fase Trasplante (Lunar)',
        especieslunarobservaciones: 'Notas (Lunar)',
        especiesorganocomestible: 'Órgano Comestible',
        especiesbiodinamicafasesiembra: 'Fase Siembra (Biodinámica)',
        especiesbiodinamicafasetrasplante: 'Fase Trasplante (Biodinámica)',
        especiesbiodinamicanotas: 'Notas (Biodinámica)'
      }
    },
    {
      id: 'asociaciones',
      title: '🤝 Asociaciones',
      keys: [],
      labels: {}
    },
    {
      id: 'textos',
      title: '📝 Textos y Autosuficiencia',
      keys: [
        'especieshistoria', 'especiesvegetalesdescripcion', 'especiesfuentesinformacion',
        'especiesautosuficienciaparcial', 'especiesautosuficiencia', 'especiesautosuficienciaconserva'
      ],
      labels: {
        especieshistoria: 'Historia',
        especiesvegetalesdescripcion: 'Descripción',
        especiesfuentesinformacion: 'Fuentes',
        especiesautosuficienciaparcial: 'Autosuf. Parcial (pl/pers)',
        especiesautosuficiencia: 'Autosuf. Completa (pl/pers)',
        especiesautosuficienciaconserva: 'Autosuf. Conserva (pl/pers)'
      }
    },
    {
      id: 'sinonimos',
      title: '🗣️ Sinónimos',
      keys: [],
      labels: {}
    },
    {
      id: 'variedades',
      title: '🌾 Variedades',
      keys: [],
      labels: {}
    },
    {
      id: 'alimentacion',
      title: '🍽️ Usos y Consumo',
      keys: [],
      labels: {}
    },
    {
      id: 'pautas',
      title: '📋 Labores',
      keys: [],
      labels: {}
    }
  ];

  const saveFormData = async (customFormData: any) => {
    if (!especieId || !userEmail) return;
    setSaveStatus('saving');
    const { fases_duracion, ...dataToSave } = customFormData;
    try {
      const res = await fetch(`/api/admin/especiesvegetales/${especieId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': userEmail
        },
        body: JSON.stringify(dataToSave)
      });
      const data = await res.json();
      if (data.success) {
        setInitialData(customFormData);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } else {
        setSaveStatus('idle');
      }
    } catch (e) {
      console.error('Error saving form data:', e);
      setSaveStatus('idle');
    }
  };

  const runUnifiedAiSearch = async () => {
    const selectedCount = Object.values(aiConfigTabs).filter(Boolean).length;
    if (selectedCount === 0) {
      alert('Debes seleccionar al menos una pestaña para realizar la comparación.');
      return;
    }

    setAiLoading(true);
    setAiSeconds(0);
    if (aiTimerRef.current) clearInterval(aiTimerRef.current);
    aiTimerRef.current = setInterval(() => {
      setAiSeconds(s => s + 1);
    }, 1000);

    try {
      const promises: Promise<any>[] = [];
      const keys: string[] = [];

      const needsCore = aiConfigTabs.taxonomia || aiConfigTabs.cultivo || aiConfigTabs.fases || aiConfigTabs.biodinamica || aiConfigTabs.asociaciones || aiConfigTabs.textos || aiConfigTabs.alimentacion;
      if (needsCore) {
        keys.push('core');
        promises.push(
          fetch('/api/ai/especie-assistant', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-user-email': userEmail || ''
            },
            body: JSON.stringify({
              nombre: formData.especiesvegetalesnombre,
              customPrompt: aiConfigPrompt,
              selectedTabs: Object.keys(aiConfigTabs).filter(k => (aiConfigTabs as any)[k])
            })
          }).then(res => res.json())
        );
      }

      if (aiConfigTabs.sinonimos) {
        keys.push('sinonimos');
        promises.push(
          fetch('/api/ai/proponer-sinonimos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              especieNombre: formData.especiesvegetalesnombre,
              especieCientifico: formData.especiesvegetalesnombrecientifico,
              existingSinonimos: sinonimos.map(s => ({
                nombre: s.especiessinonimosnombre,
                idPais: s.xespeciesvegetalessinonimosidpaises
              })),
              extraInstructions: sinExtraInstructions || aiConfigPrompt
            })
          }).then(res => res.json())
        );
      }

      if (aiConfigTabs.variedades) {
        keys.push('variedades');
        promises.push(
          fetch('/api/ai/proponer-variedades', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-user-email': userEmail || ''
            },
            body: JSON.stringify({
              especieNombre: formData.especiesvegetalesnombre,
              existingVariedades: [],
              extraInstructions: aiConfigPrompt
            })
          }).then(res => res.json())
        );
      }

      if (aiConfigTabs.pautas) {
        keys.push('pautas');
        promises.push(
          fetch('/api/ai/pautas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              idespeciesvegetales: especieId,
              especie: formData.especiesvegetalesnombre,
              labores: masterLabores.map((l: any) => ({ id: l.idlabores, nombre: l.laboresnombre })),
              instruccionesAdicionales: aiConfigPrompt
            })
          }).then(res => res.json())
        );
      }

      const results = await Promise.all(promises);
      let coreData: any = null;
      let sinonimosData: any[] = [];
      let variedadesData: any[] = [];
      let pautasData: any[] = [];

      keys.forEach((key, index) => {
        const resObj = results[index];
        if (resObj.success) {
          if (key === 'core') coreData = resObj.data;
          if (key === 'sinonimos') sinonimosData = resObj.sinonimos;
          if (key === 'variedades') variedadesData = resObj.variedades || resObj.data;
          if (key === 'pautas') pautasData = resObj.pautas || [];
        } else {
          console.warn(`Error en petición IA ${key}:`, resObj.error);
        }
      });

      if (needsCore && !coreData) {
        throw new Error('Error al obtener datos principales de la especie');
      }

      if (coreData && coreData.fases_duracion && typeof coreData.fases_duracion === 'object') {
        const normalized: Record<string, any> = {};
        Object.entries(coreData.fases_duracion).forEach(([k, val]) => {
          const matchedById = masterFases.find((f: any) => f.idfasescultivo.toString() === k);
          if (matchedById) {
            normalized[matchedById.idfasescultivo.toString()] = val;
            return;
          }
          const matchedByClave = masterFases.find((f: any) => f.fasescultivoclave.toLowerCase().trim() === k.toLowerCase().trim());
          if (matchedByClave) {
            normalized[matchedByClave.idfasescultivo.toString()] = val;
            return;
          }
          const matchedByName = masterFases.find((f: any) => f.fasescultivonombre.toLowerCase().trim() === k.toLowerCase().trim());
          if (matchedByName) {
            normalized[matchedByName.idfasescultivo.toString()] = val;
            return;
          }
          const lowerKey = k.toLowerCase().trim();
          if (lowerKey.includes('pregerminacion') || lowerKey === 'germinacion' || lowerKey.includes('germina')) {
            const f = masterFases.find((x: any) => x.fasescultivoclave === 'pregerminacion');
            if (f) normalized[f.idfasescultivo.toString()] = val;
          } else if (lowerKey.includes('postgerminacion') || lowerKey.includes('postgermina')) {
            const f = masterFases.find((x: any) => x.fasescultivoclave === 'postgerminacion');
            if (f) normalized[f.idfasescultivo.toString()] = val;
          } else if (lowerKey.includes('semillero')) {
            const f = masterFases.find((x: any) => x.fasescultivoclave === 'semillero');
            if (f) normalized[f.idfasescultivo.toString()] = val;
          } else if (lowerKey.includes('crecimiento')) {
            const f = masterFases.find((x: any) => x.fasescultivoclave === 'crecimiento');
            if (f) normalized[f.idfasescultivo.toString()] = val;
          } else if (lowerKey.includes('cosecha')) {
            const f = masterFases.find((x: any) => x.fasescultivoclave === 'cosecha');
            if (f) normalized[f.idfasescultivo.toString()] = val;
          } else if (lowerKey.includes('enraizamiento') || lowerKey.includes('posplantacion')) {
            const f = masterFases.find((x: any) => x.fasescultivoclave === 'enraizamiento');
            if (f) normalized[f.idfasescultivo.toString()] = val;
          } else if (lowerKey.includes('floracion')) {
            const f = masterFases.find((x: any) => x.fasescultivoclave === 'floracion');
            if (f) normalized[f.idfasescultivo.toString()] = val;
          }
        });
        coreData.fases_duracion = normalized;
      }

      const proposal: any = {
        ...(coreData || {}),
        _sinonimos: (sinonimosData || []).map((s: any) => ({ ...s, _selected: true })),
        _variedades: (variedadesData || []).map((v: any) => ({ ...v, _selected: true })),
        _alimentacion: coreData?.usos_consumo || [],
        _pautas: (pautasData || []).map((p: any) => ({ ...p, selected: true }))
      };

      setAiProposal(proposal);

      const initialSelected: Record<string, boolean> = {};
      aiGroups.forEach(group => {
        if (group.id === 'sinonimos' || group.id === 'variedades' || group.id === 'pautas') return;
        group.keys.forEach(k => {
          if (k === 'fases_duracion') {
            const phasesList = masterFases.filter((f: any) => f.fasescultivotipo === 'Fase' && f.fasescultivoclave !== 'planificacion');
            phasesList.forEach((f: any) => {
              const fid = f.idfasescultivo.toString();
              const currentVal = formData.fases_duracion?.[fid] != null ? String(formData.fases_duracion[fid]) : '';
              const aiVal = proposal.fases_duracion?.[fid] != null ? String(proposal.fases_duracion[fid]) : '';
              initialSelected[`fase_${fid}`] = aiVal !== '' && currentVal !== aiVal;
            });
          } else {
            let currentVal = formData[k] != null ? formData[k] : '';
            let aiVal = proposal[k] != null ? proposal[k] : '';
            if (Array.isArray(currentVal)) currentVal = [...currentVal].sort().join(',');
            else currentVal = String(currentVal);
            if (Array.isArray(aiVal)) aiVal = [...aiVal].sort().join(',');
            else aiVal = String(aiVal);
            initialSelected[k] = aiVal !== '' && currentVal !== aiVal;
          }
        });
      });

      setSelectedAiFields(initialSelected);

      if (proposal.asociaciones_beneficiosas || proposal.asociaciones_perjudiciales || proposal.afecciones_asociadas) {
        setSelectedRels({
          ben: proposal.asociaciones_beneficiosas || [],
          per: proposal.asociaciones_perjudiciales || [],
          pla: proposal.afecciones_asociadas || []
        });
      } else {
        setSelectedRels({ ben: [], per: [], pla: [] });
      }

      setSelectedAiSinonimos((sinonimosData || []).map((_, i) => i));
      setSelectedAiVariedades((variedadesData || []).map((_, i) => i));
      setSelectedAiAlimentacion((coreData?.usos_consumo || []).map((_: any, i: number) => i));
      setAssimilatedVarietyNames([]);
      setShowOnlyDiffs(false);

      const firstActiveTab = Object.keys(aiConfigTabs).find(tabKey => aiConfigTabs[tabKey]) || 'taxonomia';
      setAiModalActiveTab(firstActiveTab);
      setShowAiConfig(false);
      setShowAiModal(true);

    } catch (err: any) {
      console.error(err);
      alert('Error en búsqueda unificada IA: ' + err.message);
    } finally {
      setAiLoading(false);
      if (aiTimerRef.current) {
        clearInterval(aiTimerRef.current);
        aiTimerRef.current = null;
      }
    }
  };

  const assimilateSingleField = async (key: string, value: any) => {
    await runWithAssimilationLoading(async () => {
      const next = { ...formData, [key]: value };
      await autoSaveField(key, value, next);
      setFormData(next);
      setSelectedAiFields(prev => ({ ...prev, [key]: false }));
    });
  };

  const assimilateSinglePhase = async (fid: string, value: any) => {
    await runWithAssimilationLoading(async () => {
      const nextFases = {
        ...formData.fases_duracion,
        [fid]: value
      };
      setFormData((prev: any) => {
        const next = { ...prev, fases_duracion: nextFases };
        return next;
      });
      await autoSaveFases(nextFases);
      setSelectedAiFields(prev => ({ ...prev, [`fase_${fid}`]: false }));
    });
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
      const newAfe = [...relaciones.afecciones];

      let masterE = [...masterEspecies];
      let masterP = [...masterAfecciones];
      let madeChanges = false;

      const normalize = (str: string) => (str || "").toLowerCase().trim();

      for (const item of benNames) {
        const name = typeof item === 'string' ? item : item?.nombre;
        const motivo = typeof item === 'string' ? 'Sugerido por IA' : (item?.motivo || 'Sugerido por IA');
        if (!name || typeof name !== 'string') continue;
        let sp = masterE.find(e => normalize(e.especiesvegetalesnombre) === normalize(name));
        if (!sp) {
          const res = await fetch('/api/admin/especiesvegetales', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail || '' },
            body: JSON.stringify({ especiesvegetalesnombre: name, especiesvegetalesvisibilidadsino: 0 })
          });
          const data = await res.json();
          if (data.success && data.id) {
            sp = { idespeciesvegetales: data.id, especiesvegetalesnombre: name };
            masterE.push(sp);
            setMasterEspecies([...masterE]);
          }
        }
        if (sp && sp.idespeciesvegetales.toString() !== especieId && !newBen.some(b => b.xasociacionesbeneficiosasidespeciedestino?.toString() === sp.idespeciesvegetales?.toString())) {
          newBen.push({
            xasociacionesbeneficiosasidespeciedestino: sp.idespeciesvegetales,
            especie_destino_nombre: sp.especiesvegetalesnombre,
            asociacionesbeneficiosasmotivo: motivo
          });
          madeChanges = true;
        }
      }

      for (const item of perNames) {
        const name = typeof item === 'string' ? item : item?.nombre;
        const motivo = typeof item === 'string' ? 'Sugerido por IA' : (item?.motivo || 'Sugerido por IA');
        if (!name || typeof name !== 'string') continue;
        let sp = masterE.find(e => normalize(e.especiesvegetalesnombre) === normalize(name));
        if (!sp) {
          const res = await fetch('/api/admin/especiesvegetales', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail || '' },
            body: JSON.stringify({ especiesvegetalesnombre: name, especiesvegetalesvisibilidadsino: 0 })
          });
          const data = await res.json();
          if (data.success && data.id) {
            sp = { idespeciesvegetales: data.id, especiesvegetalesnombre: name };
            masterE.push(sp);
            setMasterEspecies([...masterE]);
          }
        }
        if (sp && sp.idespeciesvegetales.toString() !== especieId && !newPer.some(p => p.xasociacionesperjudicialesidespeciedestino?.toString() === sp.idespeciesvegetales?.toString())) {
          newPer.push({
            xasociacionesperjudicialesidespeciedestino: sp.idespeciesvegetales,
            especie_destino_nombre: sp.especiesvegetalesnombre,
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
        let p = masterP.find(pl => normalize(pl.afeccionesnombre) === normalize(name));
        if (!p) {
          const res = await fetch('/api/admin/afecciones', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail || '' },
            body: JSON.stringify({ afeccionesnombre: name, afeccionescategoria: 'plaga', plagasestado: 'inactivo' })
          });
          const data = await res.json();
          if (data.success && data.id) {
            p = { idafecciones: data.id, afeccionesnombre: name, afeccionescategoria: 'plaga' };
            masterP.push(p);
            setMasterAfecciones([...masterP]);
          }
        }
        if (p && !newAfe.some(pl => (pl.xespeciesvegetalesafeccionesidafecciones || pl.xespeciesvegetalesplagasidafecciones)?.toString() === p.idafecciones?.toString())) {
          newAfe.push({
            xespeciesvegetalesafeccionesidafecciones: p.idafecciones,
            xespeciesvegetalesplagasidafecciones: p.idafecciones,
            afeccionesnombre: p.afeccionesnombre,
            especiesafeccionesnivelriesgo: riesgo,
            especiesafeccionesnotasespecificas: notas
          });
          madeChanges = true;
        }
      }

      if (madeChanges) {
        setRelaciones({ beneficiosas: newBen, perjudiciales: newPer, afecciones: newAfe });
        setRelacionesDirty(true);
      }
    } catch (e) {
      console.error(e);
      alert('Error asimilando relaciones.');
    } finally {
      setIsAssimilatingRels(false);
    }
  };

  const assimilateSinonimosAI = async () => {
    if (!aiProposal || !aiProposal._sinonimos) return;
    const selectedList = aiProposal._sinonimos.filter((_: any, idx: number) => selectedAiSinonimos.includes(idx));
    if (selectedList.length === 0) return;

    await runWithAssimilationLoading(async () => {
      const merged = [...sinonimos];
      const added: any[] = [];
      selectedList.forEach((item: any) => {
        const exists = merged.some(s =>
          s.especiessinonimosnombre?.toLowerCase().trim() === item.especiessinonimosnombre?.toLowerCase().trim() &&
          String(s.xespeciesvegetalessinonimosidpaises || '') === String(item.xespeciesvegetalessinonimosidpaises || '')
        );
        if (!exists) {
          const newSin = {
            especiessinonimosnombre: item.especiessinonimosnombre,
            xespeciesvegetalessinonimosididiomas: item.xespeciesvegetalessinonimosididiomas,
            xespeciesvegetalessinonimosidpaises: item.xespeciesvegetalessinonimosidpaises,
            especiessinonimosnotas: item.especiessinonimosnotas || 'Sugerido por IA',
            idespeciesvegetalessinonimos: null
          };
          merged.push(newSin);
          added.push(newSin);
        }
      });

      if (added.length > 0) {
        setSinonimos(merged);
        setSinonimosDirty(true);
        if (especieId) {
          try {
            for (const s of added) {
              await fetch(`/api/admin/especiesvegetales/${especieId}/sinonimos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(s)
              });
            }
            await loadSinonimos(especieId);
          } catch (err) {
            console.error('Error guardando sinónimos asimilados:', err);
          }
        }
      }
      setSelectedAiSinonimos([]);
    });
  };

  const assimilateVariedadesAI = async () => {
    if (!aiProposal || !aiProposal._variedades || !especieId || !userEmail) return;
    const selectedList = aiProposal._variedades.filter((_: any, idx: number) => selectedAiVariedades.includes(idx));
    if (selectedList.length === 0) return;

    await runWithAssimilationLoading(async () => {
      const newlyAddedNames: string[] = [];
      for (const item of selectedList) {
        try {
          const res = await fetch('/api/admin/variedadesvegetales', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-user-email': userEmail
            },
            body: JSON.stringify({
              variedadesvegetalesnombre: item.variedadesvegetalesnombre,
              xvariedadesvegetalesidespeciesvegetales: especieId,
              variedadestamano: item.variedadestamano || 'mediano',
              variedadesdiasgerminacion: item.variedadesdiasgerminacion || null,
              variedadescolor: item.variedadescolor || null,
              variedadesdescripcion: item.variedadesdescripcion || null,
              variedadesvegetalesvisibilidadsino: 1
            })
          });
          const data = await res.json();
          if (data.success) {
            newlyAddedNames.push(item.variedadesvegetalesnombre);
          }
        } catch (err) {
          console.error(`Error guardando variedad ${item.variedadesvegetalesnombre}:`, err);
        }
      }
      if (newlyAddedNames.length > 0) {
        setAssimilatedVarietyNames(prev => [...prev, ...newlyAddedNames]);
        await loadExistingVarieties(especieId);
      }
      setSelectedAiVariedades([]);
    });
  };

  const assimilateAlimentacionAI = async () => {
    if (!aiProposal || !aiProposal._alimentacion || !especieId) return;
    const selectedList = aiProposal._alimentacion.filter((_: any, idx: number) => selectedAiAlimentacion.includes(idx));
    if (selectedList.length === 0) return;

    await runWithAssimilationLoading(async () => {
      const nextAlimentacion = [...alimentacion];
      for (const item of selectedList) {
        const idAnimal = String(item.idespeciesanimales);
        const targetParte = (item.parte || item.partes || '').trim();
        const targetAptoNum = item.apto === 'apto' ? 1 : (item.apto === 'con_moderacion' ? 2 : 0);
        
        const targetParteId = await resolvePlantasParteId(targetParte);
        const existingIdx = nextAlimentacion.findIndex(c => 
          String(c.xespeciesvegetalesanimalesidespeciesanimales) === idAnimal &&
          c.xespeciesvegetalesanimalesidplantasparte === targetParteId
        );
        const baseName = normalizePlantaParteNombre(targetParte);
        let updatedNotas = item.notas || '';
        if (targetParte.toLowerCase() !== baseName.toLowerCase()) {
          const prefix = `${targetParte}: `;
          if (!updatedNotas.startsWith(prefix)) {
            updatedNotas = prefix + updatedNotas;
          }
        }
        const payload = {
          xespeciesvegetalesanimalesidespeciesvegetales: especieId,
          xespeciesvegetalesanimalesidespeciesanimales: idAnimal,
          especiesanimalesesapto: targetAptoNum,
          xespeciesvegetalesanimalesidplantasparte: targetParteId,
          especiesanimalespartes: baseName,
          especiesanimalesnotas: updatedNotas
        };
        if (existingIdx !== -1) {
          nextAlimentacion[existingIdx] = { ...nextAlimentacion[existingIdx], ...payload };
        } else {
          nextAlimentacion.push(payload as any);
        }
      }

      try {
        await fetch(`/api/admin/especiesvegetales/${especieId}/animales`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-user-email': userEmail || ''
          },
          body: JSON.stringify({ alimentacion: nextAlimentacion })
        });
      } catch (err) {
        console.error('Error guardando alimentacion:', err);
      }
      await loadAlimentacion(especieId);
      setSelectedAiAlimentacion([]);
    });
  };

  const assimilateTab = async (tabId: string) => {
    await runWithAssimilationLoading(async () => {
      if (tabId === 'asociaciones') {
        await assimilateRelacionesAI();
        return;
      }
      if (tabId === 'sinonimos') {
        await assimilateSinonimosAI();
        return;
      }
      if (tabId === 'variedades') {
        await assimilateVariedadesAI();
        return;
      }
      if (tabId === 'alimentacion') {
        await assimilateAlimentacionAI();
        return;
      }

      const group = aiGroups.find(g => g.id === tabId);
      if (!group) return;

      const updates: any = {};
      let nextFases = { ...formData.fases_duracion };
      let phasesChanged = false;

      group.keys.forEach(k => {
        if (k === 'fases_duracion') {
          const phasesList = masterFases.filter((f: any) => f.fasescultivotipo === 'Fase' && f.fasescultivoclave !== 'planificacion');
          phasesList.forEach((f: any) => {
            const fid = f.idfasescultivo.toString();
            const vKey = `fase_${fid}`;
            if (selectedAiFields[vKey] && aiProposal.fases_duracion?.[fid] !== undefined && aiProposal.fases_duracion?.[fid] !== null) {
              nextFases[fid] = aiProposal.fases_duracion[fid];
              phasesChanged = true;
              setSelectedAiFields(prev => ({ ...prev, [vKey]: false }));
            }
          });
        } else {
          if (selectedAiFields[k] && aiProposal[k] !== undefined && aiProposal[k] !== null) {
            updates[k] = aiProposal[k];
            setSelectedAiFields(prev => ({ ...prev, [k]: false }));
          }
        }
      });

      if (Object.keys(updates).length > 0 || phasesChanged) {
        const next = { ...formData, ...updates };
        if (phasesChanged) {
          next.fases_duracion = nextFases;
          await autoSaveFases(nextFases);
        }
        await saveFormData(next);
        setFormData(next);
      }
    });
  };

  const assimilateAll = async () => {
    if (!aiProposal) return;
    
    await runWithAssimilationLoading(async () => {
      // 1. Core fields
      const allKeys = aiGroups.flatMap(g => g.keys);
      const updates: any = {};
      let nextFases = { ...formData.fases_duracion };
      let phasesChanged = false;

      allKeys.forEach(k => {
        if (k === 'fases_duracion') {
          const phasesList = masterFases.filter((f: any) => f.fasescultivotipo === 'Fase' && f.fasescultivoclave !== 'planificacion');
          phasesList.forEach((f: any) => {
            const fid = f.idfasescultivo.toString();
            const vKey = `fase_${fid}`;
            if (selectedAiFields[vKey] && aiProposal.fases_duracion?.[fid] !== undefined && aiProposal.fases_duracion?.[fid] !== null) {
              nextFases[fid] = aiProposal.fases_duracion[fid];
              phasesChanged = true;
              setSelectedAiFields(prev => ({ ...prev, [vKey]: false }));
            }
          });
        } else if (k !== 'alimentacion') {
          if (selectedAiFields[k] && aiProposal[k] !== undefined && aiProposal[k] !== null) {
            updates[k] = aiProposal[k];
            setSelectedAiFields(prev => ({ ...prev, [k]: false }));
          }
        }
      });

      if (Object.keys(updates).length > 0 || phasesChanged) {
        const next = { ...formData, ...updates };
        if (phasesChanged) {
          next.fases_duracion = nextFases;
          await autoSaveFases(nextFases);
        }
        await saveFormData(next);
        setFormData(next);
      }

      // 2. Relationships
      if (aiProposal.asociaciones_beneficiosas || aiProposal.asociaciones_perjudiciales || aiProposal.afecciones_asociadas) {
        await assimilateRelacionesAI();
      }

      // 3. Synonyms
      if (aiProposal._sinonimos && selectedAiSinonimos.length > 0) {
        await assimilateSinonimosAI();
      }

      // 4. Varieties
      if (aiProposal._variedades && selectedAiVariedades.length > 0) {
        await assimilateVariedadesAI();
      }

      // 5. Alimentacion
      if (aiProposal._alimentacion && selectedAiAlimentacion.length > 0) {
        await assimilateAlimentacionAI();
      }

      setShowAiModal(false);
    });
  };

  const closeAiModal = () => {
    setShowAiModal(false);
    if (assimilatedVarietyNames.length > 0) {
      window.location.reload();
    }
  };

  const openSinonimosConfig = () => {
    if (!formData.especiesvegetalesnombre) {
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
          especieNombre: formData.especiesvegetalesnombre,
          especieCientifico: formData.especiesvegetalesnombrecientifico,
          existingSinonimos: sinonimos.map(s => ({
            nombre: s.especiessinonimosnombre,
            idPais: s.xespeciesvegetalessinonimosidpaises
          })),
          extraInstructions: sinExtraInstructions
        })
      });
      const data = await res.json();
      if (data.success && data.sinonimos) {
        const propuestos = data.sinonimos.map((s: any) => ({
          ...s,
          idespeciesvegetalessinonimos: null,
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
    if (!especieId) return;
    try {
      // 1. Encontramos los que hay que borrar (estaban en initial pero no en actuales)
      const toDelete = initialSinonimos.filter(init => !sinonimos.some(s => s.idespeciesvegetalessinonimos === init.idespeciesvegetalessinonimos));
      for (const del of toDelete) {
        await fetch(`/api/admin/especiesvegetales/${especieId}/sinonimos?id=${del.idespeciesvegetalessinonimos}`, { method: 'DELETE' });
      }

      // 2. Guardar o actualizar los actuales
      for (const s of sinonimos) {
        const isNew = !s.idespeciesvegetalessinonimos;
        const res = await fetch(`/api/admin/especiesvegetales/${especieId}/sinonimos`, {
          method: isNew ? 'POST' : 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(s)
        });
        if (!res.ok) {
          console.error('Error guardando sinónimo', s);
        }
      }

      await loadSinonimos(especieId);
      alert('Sinónimos guardados con éxito.');
    } catch (err) {
      console.error(err);
      alert('Error guardando sinónimos.');
    }
  };

  const saveRelacionesNow = async (updatedRels: any) => {
    if (!especieId || !userEmail) return;
    setRelacionesSaveStatus('saving');
    try {
      await fetch(`/api/admin/especiesvegetales/${especieId}/relaciones`, {
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
      .replace(/[\u0300-\u036f]/g, '')
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
    const baseName = normalizePathSegment(formData.especiesvegetalesnombre || `especie-${especieId || 'nueva'}`) || `especie-${especieId || 'nueva'}`;
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
      if (e.target && e.target.value) e.target.value = '';
    }
  };

  const buildPromptPreview = () => {
    const nombre = formData.especiesvegetalesnombre || 'especie';
    const sciCtx = formData.especiesvegetalesnombrecientifico ? ` Nombre científico: ${formData.especiesvegetalesnombrecientifico}.` : '';
    const famCtx = formData.xespeciesvegetalesidfamilias ? ` ID Familia: ${formData.xespeciesvegetalesidfamilias}.` : '';
    const defaultConcept = `varios ejemplares de ${nombre} recién cosechados, dispuestos sobre una mesa rústica de madera en un huerto al aire libre, con tierra y hojas verdes visibles al fondo`;
    return `Fotografía profesional de stock de alta resolución (8K), tomada con una cámara DSLR Canon EOS R5 y un objetivo macro 100mm f/2.8, iluminación natural suave de hora dorada.\nSujeto principal: ${nombre} (hortaliza/planta comestible de huerto).${sciCtx}${famCtx}\nEscena concreta: ${aiImageConcept || defaultConcept}.\nComposición: regla de los tercios, sujeto nítido en primer plano, fondo suavemente desenfocado (bokeh) mostrando vegetación de huerto.\nREGLAS ESTRICTAS:\n1. El sujeto es SIEMPRE una planta, hortaliza, fruto o semilla comestible de huerto.\n2. La fotografía debe parecer tomada por un fotógrafo profesional de gastronomía o agricultura.\n3. El entorno debe ser siempre agrícola: huerto, bancal, invernadero, mesa de cosecha o cocina rústica.\n4. NO incluir personas, manos, texto, logotipos ni marcas de agua.\n5. Mostrar el producto hortícola en su mejor estado: fresco, limpio, apetecible.`;
  };

  const generateAiImage = async () => {
    if (!formData.especiesvegetalesnombre) {
      alert('Se necesita el nombre de la especie para generar la imagen.');
      return;
    }
    setAiImageLoading(true);
    setAiImageResult(null);
    setAiImageDescription('');
    try {
      const body: any = {
        especieNombre: formData.especiesvegetalesnombre,
        especieNombreCientifico: formData.especiesvegetalesnombrecientifico,
        especieFamiliaId: formData.xespeciesvegetalesidfamilias,
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
    if (!aiImageResult || !especieId) return;
    setUploadingPhotos(true);
    setShowAiImageModal(false);
    try {
      const res = await fetch(aiImageResult);
      const blob = await res.blob();
      const descBase = aiImageDescription || formData.especiesvegetalesnombre || 'especie';

      // Subir a ruta temporal vía Firebase client-side (mismo flujo que fotos normales)
      const storageApi = await import('firebase/storage');
      const tempFileName = `temp-ai-${Date.now()}-${descBase.replace(/[^a-zA-Z0-9.-]/g, '')}.webp`;
      const tempPath = `uploads/temp/${tempFileName}`;
      const storageRef = storageApi.ref(storage, tempPath);
      await storageApi.uploadBytes(storageRef, blob);

      // Llamar a la API de especies que descarga, procesa y guarda
      const saveRes = await fetch(`/api/admin/especiesvegetales/${especieId}/photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail || '' },
        body: JSON.stringify({
          rawStoragePath: tempPath,
          especieNombre: formData.especiesvegetalesnombre || 'especie'
        })
      });
      if (!saveRes.ok) {
        const errData = await saveRes.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP Error ${saveRes.status}`);
      }
      await loadAttachments(especieId);
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
        handleSetPrimaryPhoto(draggedItem.id);
      }
    }
    setDraggedPhotoIndex(null);
    setDraggedOverPhotoIndex(null);
  };

  const handleSetPrimaryPhoto = async (photoId: number) => {
    // Optimistic UI update: mark photo as primary immediately
    setPhotos(prev => prev.map(p => ({ ...p, esPrincipal: p.id === photoId ? 1 : 0 })));
    setHeroIndex(0);
    try {
      await fetch(`/api/admin/especiesvegetales/${especieId}/photos`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': userEmail || ''
        },
        body: JSON.stringify({ photoId, action: 'setPrimary' })
      });
      loadAttachments(especieId!);
    } catch (err) {
      alert('Error estableciendo foto principal');
      loadAttachments(especieId!); // Revert on error
    }
  };

  // ── Abrir editor de foto ──
  const openPhotoEditor = (photo: any) => {
    setEditingPhoto(photo);
  };

  // ── Guardar edición de foto ──
  const savePhotoEdits = async (metadata: any) => {
    if (!editingPhoto || !especieId) return;
    if (metadata.noChanges) {
      setPhotoEditorSaveStatus('no-changes');
      return;
    }
    setPhotoEditorSaveStatus('saving');
    const resumen = JSON.stringify(metadata);
    try {
      await fetch(`/api/admin/especiesvegetales/${especieId}/photos`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': userEmail || ''
        },
        body: JSON.stringify({ photoId: editingPhoto.id, action: 'updateMeta', resumen })
      });
      loadAttachments(especieId);
    } catch {
      alert('❌ Error guardando ajustes');
    } finally {
      setPhotoEditorSaveStatus('idle');
    }
  };

  // ── Guardar edición de PDF ──
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

  const handleOpenPdfEditor = (pdf: any) => {
    setEditingPdf(pdf);
    setPdfTitle(pdf.titulo || '');
    setPdfSummary(pdf.resumen || '');
    setPdfApuntes(pdf.apuntes || '');
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

        await loadAttachments(especieId!);

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
        body: JSON.stringify({ topic: pdfSearchTopic, especieNombre: formData.especiesvegetalesnombre })
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
      const res = await fetch(`/api/admin/especiesvegetales/${especieId}/pdfs/link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail || '' },
        body: JSON.stringify({ title, url, summary, apuntes })
      });
      const data = await res.json();
      if (data.success) {
        loadAttachments(especieId!);
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
          especieId: especieId,
          variedadId: null,
          autorEmail: userEmail,
          especieNombre: formData.especiesvegetalesnombre,
          contexto: {
            tipo: 'especie',
            nombre: formData.especiesvegetalesnombre || 'Especie'
          },
          pdfSourceId: blogGenPdf.id
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('¡Borrador generado con éxito! Slug: ' + data.slug);
        setBlogGenPdf(null);
        if (especieId) {
          loadAttachments(especieId); // Recargar blogs
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
        if (especieId) loadAttachments(especieId);
      } else {
        const data = await res.json();
        alert(data.error || 'Error al eliminar blog');
      }
    } catch (e) {
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
  const hasChanges = JSON.stringify(formData) !== JSON.stringify(initialData);

  // ── Hero Gallery ──
  const sortedPhotos = [...photos].sort((a, b) => (b.esPrincipal ? 1 : 0) - (a.esPrincipal ? 1 : 0));
  const safeHeroIndex = Math.min(heroIndex, Math.max(0, sortedPhotos.length - 1));
  const heroPhoto = sortedPhotos[safeHeroIndex] || null;
  let vibrantColor: string | null = null;
  let heroMeta: any = {};
  if (heroPhoto) {
    try { heroMeta = JSON.parse(heroPhoto.resumen || '{}'); } catch (e) { }
    vibrantColor = heroMeta.vibrant_color || null;
  }

  // ── Pautas Handlers ──
  const handleSavePauta = async () => {
    if (!especieId) {
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
        ? `/api/admin/especiesvegetales/${especieId}/pautas/${editingPauta}`
        : `/api/admin/especiesvegetales/${especieId}/pautas`;

      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'x-user-email': userEmail || ''
        },
        body: JSON.stringify(pautaForm)
      });

      if (!res.ok) {
        const errorData = await res.json();
        alert(errorData.error || "Error al guardar la pauta");
        return;
      }

      // Refetch pautas
      const pautasRes = await fetch(`/api/admin/especiesvegetales/${especieId}/pautas`, {
        headers: { 'x-user-email': userEmail || '' }
      });
      if (pautasRes.ok) {
        const { pautas } = await pautasRes.json();
        setPautas(pautas || []);
      }

      // Reset form
      setEditingPauta(null);
      setPautaForm({
        xlaborespautaidlabores: '',
        laborespautafase: 'planificacion',
        laborespautafrecuenciadias: '',
        laborespautaoffset: 0,
        laborespautanotasia: '',
        laborespautaactivosino: 1,
        idlaborespauta: undefined
      });
      setShowAddPautaForm(false);
      setEditingPauta(null);
    } catch (e) {
      console.error(e);
      alert("Error inesperado al guardar pauta.");
    }
  };

  const handleDeletePauta = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/especiesvegetales/${especieId}/pautas/${id}`, { 
        method: 'DELETE',
        headers: { 'x-user-email': userEmail || '' }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.message) {
          setPautas(pautas.map(p => p.idlaborespauta === id ? { ...p, laborespautaactivosino: 0 } : p));
          setToastMessage(data.message);
        } else {
          setPautas(pautas.filter(p => p.idlaborespauta !== id));
          setToastMessage("Labor eliminada correctamente");
        }
        setTimeout(() => setToastMessage(null), 3000);
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
    if (!formData.especiesvegetalesnombre) {
      alert('Debes darle un nombre a la especie primero.');
      return;
    }
    setPautasAiLoading(true);
    setPautasAiSeconds(0);
    setAiPautasProposal([]);

    if (pautasTimerRef.current) clearInterval(pautasTimerRef.current);
    pautasTimerRef.current = setInterval(() => setPautasAiSeconds(s => s + 1), 1000);

    try {
      const res = await fetch('/api/ai/pautas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idespeciesvegetales: especieId,
          especie: formData.especiesvegetalesnombre,
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
    } catch (e) {
      console.error(e);
      alert('Error de red al consultar IA.');
    } finally {
      setPautasAiLoading(false);
      if (pautasTimerRef.current) clearInterval(pautasTimerRef.current);
    }
  };

  const applyAiPautas = async () => {
    if (!especieId) {
      alert("Guarda primero la especie para aplicar las pautas.");
      return;
    }

    try {
      // Mandar todas las pautas propuestas a la BD una por una
      for (const pauta of aiPautasProposal) {
        if (!pauta.selected) continue;

        await fetch(`/api/admin/especiesvegetales/${especieId}/pautas`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-user-email': userEmail || ''
          },
          body: JSON.stringify({
            xlaborespautaidlabores: pauta.id_labor,
            laborespautafase: pauta.fase,
            laborespautafrecuenciadias: pauta.frecuencia || '',
            laborespautaoffset: pauta.offset || 0,
            laborespautanotasia: pauta.notas_ia || '',
            laborespautaactivosino: 1
          })
        });
      }

      // Refetch
      const pautasRes = await fetch(`/api/admin/especiesvegetales/${especieId}/pautas`, {
        headers: { 'x-user-email': userEmail || '' }
      });
      if (pautasRes.ok) {
        const { pautas } = await pautasRes.json();
        setPautas(pautas || []);
      }
      setShowPautasAiModal(false);
      alert('Pautas aplicadas correctamente.');
    } catch (e) {
      console.error(e);
      alert('Error al aplicar pautas.');
    }
  };

  return (
    <>
      {/* ── Navegación ── */}
      <div style={{ marginBottom: '16px', padding: '0 4px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <PremiumBackButton onClick={() => router.push('/dashboard')} text="🏠 Volver al Inicio" />
        <PremiumBackButton
          onClick={() => {
            if (isDirty && !confirm('Tienes cambios sin guardar. ¿Seguro que quieres salir?')) return;
            const from = searchParams.get('from');
            if (from === 'identificar-especie') {
              router.push('/dashboard/admin/tareas/identificar-especie');
            } else if (from === 'labores') {
              router.push('/dashboard/admin/labores');
            } else if (from === 'animales') {
              router.push('/dashboard/admin/especiesanimales');
            } else if (from === 'pdfs') {
              router.push('/dashboard/admin/pdfs');
            } else if (window.history.length > 2) { 
              router.back(); 
            } else { 
              router.push('/dashboard/admin/especiesvegetales'); 
            }
          }}
          text={searchParams.get('from') === 'labores' ? '🔙 Volver a Labores' : searchParams.get('from') === 'identificar-especie' ? '🔙 Volver al Identificador de Especies' : searchParams.get('from') === 'animales' ? '🔙 Volver a Especies de Granja' : searchParams.get('from') === 'pdfs' ? '🔙 Volver a Gestor de PDFs' : '🔙 Volver a Especies'}
        />
        {searchParams.get('from') === 'animales' && searchParams.get('fromId') && (
          <PremiumBackButton
            onClick={() => {
              const fromId = searchParams.get('fromId');
              router.push(`/dashboard/admin/especiesanimales/${fromId}`);
            }}
            text={`🔙 Volver a ${decodeURIComponent(searchParams.get('fromName') || 'Animal')}`}
            style={{ background: '#fef3c7', border: '1px solid #fcd34d', color: '#92400e' }}
          />
        )}
      </div>

      {/* ── Encabezado Premium Contextual (PremiumSubheader) ── */}
      <PremiumSubheader
        title={<>🌿 {formData.especiesvegetalesnombre || 'Nueva Especie'}</>}
        subtitle={<>✏️ Editar Especie Vegetal · ID del Registro: {especieId}</>}
        gradient="linear-gradient(135deg, #0f766e, #10b981)"
        actions={
          <>
            {/* Indicador de Autoguardado */}
            {saveStatus === 'saving' && (
              <span style={{ padding: '6px 14px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 'bold', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                ⏳ Guardando...
              </span>
            )}
            {saveStatus === 'saved' && (
              <span style={{ padding: '6px 14px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 'bold', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                ✅ Guardado
              </span>
            )}

            {/* Botón Guardar Forzado */}
            {isDirty && saveStatus === 'idle' && (
              <button 
                onClick={(e) => handleSubmit(e as unknown as React.FormEvent)} 
                style={{ background: '#fef08a', color: '#854d0e', border: 'none', padding: '6px 14px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 14px 0 rgba(0, 0, 0, 0.1)' }}
              >
                💾 Guardar Cambios
              </button>
            )}

            {/* Botón Eliminar Premium */}
            {especieId && (
              <PremiumDeleteButton onClick={() => setDeleteConfirm({ type: 'especie', id: especieId, url: '' })} />
            )}
          </>
        }
      >
        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
          <PremiumDevInsights modulePath="admin/especiesvegetales/[id]/page.tsx" />
        </div>
      </PremiumSubheader>

      {/* ── Status Bar ── */}
      <div style={{ background: formData.especiesvegetalesvisibilidadsino ? '#ecfdf5' : '#f1f5f9', borderRadius: '12px', padding: '16px 24px', marginBottom: '24px', border: `1px solid ${formData.especiesvegetalesvisibilidadsino ? '#10b981' : '#cbd5e1'}`, display: 'flex', alignItems: 'center', justifyContent: 'flex-start', transition: 'all 0.3s' }}>
        <label style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', color: '#334155', margin: 0, fontSize: '1.1rem' }}>
          <input
            type="checkbox"
            name="especiesvegetalesvisibilidadsino"
            checked={!!formData.especiesvegetalesvisibilidadsino}
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
                    alt={heroMeta.seo_alt || formData.especiesvegetalesnombre}
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

            {/* Right strip: only photos NOT currently shown as hero */}
            {sortedPhotos.filter((_, i) => i !== safeHeroIndex).length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '8px 6px', justifyContent: 'center' }}>
                {sortedPhotos
                  .map((p, i) => ({ p, i }))
                  .filter(({ i }) => i !== safeHeroIndex)
                  .map(({ p, i }) => {
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
                          transition: 'all 0.2s ease',
                          opacity: draggedHeroPhotoId === p.id ? 0.5 : 1,
                          transform: draggedOverHeroPhotoId === p.id ? 'scale(1.05)' : 'scale(1)'
                        }}
                        onMouseEnter={e => { if (draggedHeroPhotoId === null) e.currentTarget.style.transform = 'scale(1.1)'; }}
                        onMouseLeave={e => { if (draggedHeroPhotoId === null) e.currentTarget.style.transform = 'scale(1)'; }}
                      >
                        <img src={getMediaUrl(p.ruta)}
                          draggable={false}
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

            {/* The Text Info was moved above the Hero Gallery */}
          </div>
        ) : (
          <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            {formData.especiesvegetalesicono && <span style={{ fontSize: '2.5rem' }}>{formData.especiesvegetalesicono}</span>}
            <h2 style={{ margin: 0, color: '#1e293b' }}>Sin fotos en la galería</h2>
          </div>
        )}
      </div>
      <div className="especie-form-container">

        <form onSubmit={handleSubmit} onBlur={handleFormBlur} className="especie-form-body">

          <div
            className="collapsible-header"
            onClick={() => {
              const next = !isEspecieOpen;
              setIsEspecieOpen(next);
              if (next) setActiveTab('taxonomia');
            }}
            style={{ padding: '15px 24px', background: '#e2e8f0', cursor: 'pointer', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <span>
              Ficha de Especie
              {!isEspecieOpen && formData.especiesvegetalesnombre && (
                <span style={{ color: '#475569', marginLeft: '10px', fontWeight: 'normal' }}>
                  — {formData.especiesvegetalesnombre} {formData.especiesvegetalesnombrecientifico ? `(${formData.especiesvegetalesnombrecientifico})` : ''}
                </span>
              )}
            </span>
            <span>{isEspecieOpen ? '▲' : '▼'}</span>
          </div>

          {isEspecieOpen && (
            <div className="collapsible-content">

              <div style={{ padding: '15px 24px', background: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '16px' }}>
                <button type="button" onClick={callAI} className="btn-ai" disabled={aiLoading} style={{ 
                  margin: 0,
                  background: aiLoading ? 'linear-gradient(135deg, #475569, #1e293b)' : 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
                  color: 'white',
                  fontWeight: 'bold',
                  boxShadow: aiLoading ? 'none' : '0 4px 12px rgba(139, 92, 246, 0.3)',
                  cursor: aiLoading ? 'not-allowed' : 'pointer',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease'
                }}>
                  {aiLoading ? `⏳ Analizando... ${aiSeconds}s` : '✨ Asistente IA'}
                </button>
                {especieId && (
                  <button type="button" onClick={handleCheckSpecies} className="btn-ai" disabled={checking} style={{ margin: 0, background: 'linear-gradient(135deg, #0284c7, #0369a1)', color: 'white', border: 'none', cursor: 'pointer', boxShadow: '0 4px 6px rgba(2,132,199,0.2)' }}>
                    {checking ? 'Chequeando...' : '🔍 Chekeo'}
                  </button>
                )}
              </div>

              <PremiumFormTabs 
                tabs={[
                  { id: 'taxonomia', label: '🧬 Identificación', hasNotification: !!aiConfigTabs['taxonomia'] },
                  { id: 'cultivo', label: '🌱 Requisitos y Suelo', hasNotification: !!aiConfigTabs['cultivo'] },
                  { id: 'fases', label: '⏳ Cronología y Calendarios', hasNotification: !!aiConfigTabs['fases'] },
                  { id: 'biodinamica', label: '🌙 Luna y Biodinámica', hasNotification: !!aiConfigTabs['biodinamica'] },
                  { id: 'asociaciones', label: '🤝 Ecosistema', hasNotification: !!aiConfigTabs['asociaciones'] },
                  { id: 'textos', label: '📝 Textos y Autosuficiencia', hasNotification: !!aiConfigTabs['textos'] },
                  { id: 'alimentacion', label: '🐄 Alimentación Animal', hasNotification: !!aiConfigTabs['alimentacion'] },
                  { id: 'variedades', label: '🌱 Variedades', hasNotification: !!aiConfigTabs['variedades'] },
                  { id: 'pautas', label: '📋 Labores', hasNotification: !!aiConfigTabs['pautas'] },
                  { id: 'photos', label: '📷 Fotos', hasNotification: !!aiConfigTabs['photos'] },
                  { id: 'pdfs', label: '📄 PDFs', hasNotification: !!aiConfigTabs['pdfs'] },
                  { id: 'blogs', label: '📰 Blogs', hasNotification: !!aiConfigTabs['blogs'] }
                ]}
                activeTab={activeTab}
                onTabChange={setActiveTab}
              />

              <div className="form-tab-content">

                {/* IDENTIFICACIÓN (Taxonomía + Sinónimos) */}
                <div className="grid-form" style={{ display: activeTab === 'taxonomia' ? 'grid' : 'none' }}>
                  <div className="form-group full">
                    <label>Nombre Común *</label>
                    <input type="text" name="especiesvegetalesnombre" required value={formData.especiesvegetalesnombre || ''} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label>Nombre Científico</label>
                    <input type="text" name="especiesvegetalesnombrecientifico" value={formData.especiesvegetalesnombrecientifico || ''} onChange={handleChange} />
                  </div>
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column' }}>
                    <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Familia</span>
                      <a href="/dashboard/admin/familias" target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.75rem', textDecoration: 'none', background: '#e2e8f0', padding: '2px 8px', borderRadius: '10px', color: '#475569' }}>⚙️ Gestionar</a>
                    </label>
                    <select name="xespeciesvegetalesidfamilias" value={formData.xespeciesvegetalesidfamilias || ''} onChange={handleChange} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #d1d5db' }}>
                      <option value="">— Sin familia asignada —</option>
                      {masterFamilias.map((f: any) => (
                        <option key={f.idfamilias} value={f.idfamilias}>
                          {f.familiasemoji} {f.familiasnombre} {f.familiasnombrecientifico ? `(${f.familiasnombrecientifico})` : ''}
                        </option>
                      ))}
                    </select>
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

                  {/* SECCIÓN SINÓNIMOS */}
                  <div className="form-group full" style={{ marginTop: '30px', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                      <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#1e293b' }}>🗣️ Sinónimos y Nombres Locales</h3>
                      <div style={{ display: 'flex', gap: '10px' }}>

                        <button
                          type="button"
                          onClick={() => {
                            setSinonimos([...sinonimos, { idespeciesvegetalessinonimos: null, especiessinonimosnombre: '', xespeciesvegetalessinonimosididiomas: '', xespeciesvegetalessinonimosidpaises: '', especiessinonimosnotas: '' }]);
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

                    {sinonimos.length === 0 && !sinonimosAiLoading ? (
                      <div style={{ padding: '40px', textAlign: 'center', background: '#f8fafc', borderRadius: '12px', border: '2px dashed #cbd5e1' }}>
                        <p style={{ color: '#64748b', fontSize: '1.1rem', margin: '0 0 10px 0' }}>No hay sinónimos registrados.</p>
                        <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0 }}>Usa el botón "✨ Asistente IA" de la barra superior para que la Inteligencia Artificial busque sinónimos por ti.</p>
                      </div>
                    ) : (
                      <div style={{ overflowX: 'auto', width: '100%' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px', minWidth: '600px' }}>
                          <thead>
                            <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                              <th style={{ padding: '12px', textAlign: 'center', width: '10%' }}>Acciones</th>
                              <th style={{ padding: '12px', textAlign: 'left', width: '30%' }}>Nombre / Sinónimo</th>
                              <th style={{ padding: '12px', textAlign: 'left', width: '20%' }}>Idioma</th>
                              <th style={{ padding: '12px', textAlign: 'left', width: '20%' }}>País / Región</th>
                              <th style={{ padding: '12px', textAlign: 'left', width: '20%' }}>Notas</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sinonimos.map((s, index) => (
                              <tr key={index} style={{ borderBottom: '1px solid #e2e8f0', background: s.idespeciesvegetalessinonimos === null ? '#fefce8' : 'transparent' }}>
                                <td style={{ padding: '8px', textAlign: 'center' }}>
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      const sinToDelete = sinonimos[index];
                                      const newSin = [...sinonimos];
                                      newSin.splice(index, 1);
                                      setSinonimos(newSin);
                                      if (sinToDelete.idespeciesvegetalessinonimos && especieId) {
                                        try {
                                          await fetch(`/api/admin/especiesvegetales/${especieId}/sinonimos?id=${sinToDelete.idespeciesvegetalessinonimos}`, { method: 'DELETE' });
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
                                    value={s.xespeciesvegetalessinonimosididiomas || ''}
                                    onChange={e => {
                                      const newSin = [...sinonimos];
                                      newSin[index].xespeciesvegetalessinonimosididiomas = e.target.value;
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
                                    value={s.xespeciesvegetalessinonimosidpaises || ''}
                                    onChange={e => {
                                      const newSin = [...sinonimos];
                                      newSin[index].xespeciesvegetalessinonimosidpaises = e.target.value;
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
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>

                {/* REQUISITOS Y SUELO (Cultivo + Fisiología + Marcos) */}
                <div className="grid-form" style={{ display: activeTab === 'cultivo' ? 'grid' : 'none' }}>
                  {/* TIPO DE SIEMBRA */}
                  <div className="form-group full" style={{ margin: 0, padding: '15px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <label style={{ color: '#1e293b', fontWeight: 'bold' }}>🌱 Tipo de Siembra / Propagación</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                      {[
                        { val: 'directa', label: 'Semilla: Siembra Directa' },
                        { val: 'semillero', label: 'Semilla: Semillero / Almácigo' },
                        { val: 'planton', label: 'Plantón / Plantel' },
                        { val: 'esqueje', label: 'Esqueje / Chupón / Estolón' },
                        { val: 'bulbo', label: 'Tubérculo / Bulbo / Rizoma' },
                        { val: 'division', label: 'División de Mata' }
                      ].map(t => (
                        <div key={t.val} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem', cursor: 'pointer', color: '#475569', flex: 1 }}>
                            <input
                              type="checkbox"
                              name="especiestiposiembra"
                              value={t.val}
                              checked={formData.especiestiposiembra?.includes(t.val)}
                              onChange={handleChange}
                            />
                            {t.label}
                          </label>
                          {formData.especiestiposiembra?.includes(t.val) && (
                            <button
                              type="button"
                              title="Marcar como preferente"
                              onClick={() => {
                                const prefs = formData.especiestiposiembrapreferente || [];
                                const newPrefs = prefs.includes(t.val) ? prefs.filter((p: string) => p !== t.val) : [...prefs, t.val];
                                const next = { ...formData, especiestiposiembrapreferente: newPrefs };
                                setFormData(next);
                                setTimeout(() => autoSaveField('especiestiposiembrapreferente', newPrefs, next), 100);
                              }}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '4px',
                                fontSize: '1.2rem',
                                color: formData.especiestiposiembrapreferente?.includes(t.val) ? '#fbbf24' : '#cbd5e1'
                              }}
                            >
                              {formData.especiestiposiembrapreferente?.includes(t.val) ? '⭐' : '☆'}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Profundidad de Siembra (cm)</label>
                    <input type="number" step="0.1" name="especiesprofundidadsiembra" value={formData.especiesprofundidadsiembra || ''} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label>Profundidad de Trasplante</label>
                    <input type="text" name="especiesprofundidadtrasplante" placeholder="Ej: Hasta los cotiledones" value={formData.especiesprofundidadtrasplante || ''} onChange={handleChange} />
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
                  <div className="form-group">
                    <label>Vol. Semillero Mín (cc)</label>
                    <input type="number" name="especiesemillerovolumendesde" value={formData.especiesemillerovolumendesde || ''} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label>Vol. Semillero Máx (cc)</label>
                    <input type="number" name="especiesemillerovolumenhasta" value={formData.especiesemillerovolumenhasta || ''} onChange={handleChange} />
                  </div>

                  <div className="form-group">
                    <label>pH Mínimo del Suelo</label>
                    <input type="number" step="0.1" min="0" max="14" name="especiesphminimosuelo" placeholder="Ej: 5.5" value={formData.especiesphminimosuelo || ''} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label>pH Máximo del Suelo</label>
                    <input type="number" step="0.1" min="0" max="14" name="especiesphmaximosuelo" placeholder="Ej: 7.0" value={formData.especiesphmaximosuelo || ''} onChange={handleChange} />
                  </div>
                  <div className="form-group full">
                    <label>Características del Suelo</label>
                    <textarea name="especiescaracteristicassuelo" rows={2} value={formData.especiescaracteristicassuelo || ''} onChange={handleChange} />
                  </div>

                  {/* NUEVOS CAMPOS AGRONÓMICOS */}
                  <div style={{ gridColumn: '1 / -1', margin: '8px 0 0', padding: '16px 0 0', borderTop: '2px solid #e2e8f0' }}>
                    <h4 style={{ margin: '0 0 12px', fontSize: '1rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '8px' }}>🌿 Datos Agronómicos Avanzados</h4>
                  </div>
                  <div className="form-group">
                    <label>Resistencia a Heladas</label>
                    <select name="especiesresistenciahelada" value={formData.especiesresistenciahelada || ''} onChange={handleChange}>
                      <option value="">--</option>
                      <option value="nula">❌ Nula (muere con primera helada)</option>
                      <option value="baja">🥶 Baja (heladas suaves)</option>
                      <option value="media">🧊 Media (hasta -5°C)</option>
                      <option value="alta">💎 Alta (heladas severas)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Necesidad de Tutoraje</label>
                    <select name="especiesnecesidadtutoraje" value={formData.especiesnecesidadtutoraje || ''} onChange={handleChange}>
                      <option value="">--</option>
                      <option value="no">🚫 No necesita</option>
                      <option value="opcional">🔄 Opcional</option>
                      <option value="obligatorio">📐 Obligatorio</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Porte de la Planta</label>
                    <select name="especiesporteplanta" value={formData.especiesporteplanta || ''} onChange={handleChange}>
                      <option value="">--</option>
                      <option value="rastrero">🌊 Rastrero</option>
                      <option value="arbusto">🌳 Arbusto</option>
                      <option value="mata">🌿 Mata</option>
                      <option value="trepador">🧗 Trepador</option>
                      <option value="erecto">📏 Erecto</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Rendimiento Estimado</label>
                    <input type="text" name="especiesrendimientoestimado" placeholder="Ej: 3-5 kg/planta" value={formData.especiesrendimientoestimado || ''} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label title="Algunas semillas necesitan oscuridad (fotoblásticas negativas), otras necesitan luz para germinar (fotoblásticas positivas).">¿Germina en Oscuridad? 💡</label>
                    <select name="especiesgerminaroscuridad" value={formData.especiesgerminaroscuridad === true || formData.especiesgerminaroscuridad === 1 ? '1' : formData.especiesgerminaroscuridad === false || formData.especiesgerminaroscuridad === 0 ? '0' : ''} onChange={(e) => {
                      const val = e.target.value;
                      handleChange({ target: { name: 'especiesgerminaroscuridad', value: val === '' ? null : val === '1' ? 1 : 0 } } as any);
                    }}>
                      <option value="">— Sin dato —</option>
                      <option value="1">🌑 Sí (se entierra, necesita oscuridad)</option>
                      <option value="0">☀️ No (necesita luz, se deja en superficie)</option>
                    </select>
                  </div>
                  <div className="form-group full">
                    <label>Parte Cosechable</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
                      {['fruto', 'hoja', 'raiz', 'bulbo', 'tallo', 'flor', 'semilla'].map((parte) => {
                        const emojis: Record<string, string> = { fruto: '🍅', hoja: '🥬', raiz: '🥕', bulbo: '🧅', tallo: '🌿', flor: '🌸', semilla: '🌰' };
                        const isChecked = Array.isArray(formData.especiespartecosechable)
                          ? formData.especiespartecosechable.includes(parte)
                          : (formData.especiespartecosechable || '').split(',').filter(Boolean).includes(parte);
                        return (
                          <label key={parte} style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: '6px 12px', borderRadius: '8px', cursor: 'pointer',
                            background: isChecked ? '#dcfce7' : '#f8fafc',
                            border: `1px solid ${isChecked ? '#86efac' : '#e2e8f0'}`,
                            transition: 'all 0.2s', fontSize: '0.9rem'
                          }}>
                            <input type="checkbox" checked={isChecked} onChange={() => {
                              const current = Array.isArray(formData.especiespartecosechable)
                                ? formData.especiespartecosechable
                                : (formData.especiespartecosechable || '').split(',').filter(Boolean);
                              const next = isChecked ? current.filter((p: string) => p !== parte) : [...current, parte];
                              const nextValue = next;
                              handleChange({ target: { name: 'especiespartecosechable', value: nextValue } } as any);
                              autoSaveField('especiespartecosechable', nextValue.join(','));
                            }} style={{ display: 'none' }} />
                            <span>{emojis[parte]} {parte.charAt(0).toUpperCase() + parte.slice(1)}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* DATOS DE FISIOLOGÍA SEMILLAS */}
                  <div className="form-group full" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '15px', marginTop: '15px' }}>
                    <div className="form-group" style={{ margin: 0, padding: '15px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <label style={{ color: '#1e293b', fontWeight: 'bold' }}>Viabilidad de la Semilla (Años)</label>
                      <input type="number" name="especiesviabilidadsemilla" value={formData.especiesviabilidadsemilla || ''} onChange={handleChange} style={{ marginTop: '8px' }} />
                    </div>

                    <div className="form-group" style={{ margin: 0, padding: '15px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <label style={{ color: '#1e293b', fontWeight: 'bold' }}>Peso de 1.000 Semillas (g)</label>
                      <input type="number" step="0.001" name="especiespeso1000semillas" value={formData.especiespeso1000semillas || ''} onChange={handleChange} style={{ marginTop: '8px' }} placeholder="Ej. 1.5" />
                      {formData.especiespeso1000semillas && Number(formData.especiespeso1000semillas) > 0 && (
                        <div style={{ marginTop: '8px', fontSize: '0.8rem', color: '#0f766e', fontWeight: 'bold' }}>
                          🔄 Equivalencia: {Math.round(1000 / Number(formData.especiespeso1000semillas))} semillas por gramo
                        </div>
                      )}
                    </div>
                  </div>

                  {/* REQUISITOS TÉRMICOS */}
                  <div className="form-group full" style={{ marginTop: '15px', marginBottom: '15px', padding: '20px', background: '#fff1f2', borderRadius: '12px', border: '1px solid #fecdd3' }}>
                    <h3 style={{ margin: '0 0 15px 0', color: '#be123c', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      🌡️ Requisitos Térmicos (°C)
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))', gap: '15px' }}>
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

                  {/* MARCOS DE PLANTACIÓN (Autosuficiencia) */}
                  <div className="form-group" style={{ marginTop: '15px' }}>
                    <label>Marco Plantas (cm)</label>
                    <input type="number" name="especiesmarcoplantas" value={formData.especiesmarcoplantas || ''} onChange={handleChange} />
                  </div>
                  <div className="form-group" style={{ marginTop: '15px' }}>
                    <label>Marco Filas (cm)</label>
                    <input type="number" name="especiesmarcofilas" value={formData.especiesmarcofilas || ''} onChange={handleChange} />
                  </div>
                  <div className="form-group full" style={{ marginTop: '15px' }}>
                    <label>Margen al Borde (cm)</label>
                    <input type="number" name="especiesmarcomargen" value={formData.especiesmarcomargen || ''} onChange={handleChange} />
                  </div>

                  {(formData.especiesmarcoplantas || formData.especiesmarcofilas) && (
                    <div className="form-group full" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '15px', padding: '15px', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1', boxSizing: 'border-box', maxWidth: '100%', overflow: 'hidden' }}>
                      <span style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '10px', fontWeight: 'bold' }}>Esquema de Plantación a Escala</span>

                      {(() => {
                        let p = parseFloat(formData.especiesmarcoplantas);
                        let f = parseFloat(formData.especiesmarcofilas);
                        let m = parseFloat(formData.especiesmarcomargen) || 0;
                        if (!p || p <= 0) p = 50;
                        if (!f || f <= 0) f = 50;

                        const totalW = p + 2 * m;
                        const totalH = f + 2 * m;

                        const maxW = 220;
                        const maxH = 160;

                        let drawTotalW, drawTotalH;
                        const ratio = totalW / totalH;
                        const maxRatio = maxW / maxH;

                        if (ratio > maxRatio) {
                          drawTotalW = maxW;
                          drawTotalH = maxW / ratio;
                        } else {
                          drawTotalH = maxH;
                          drawTotalW = maxH * ratio;
                        }

                        if (drawTotalW < 50) drawTotalW = 50;
                        if (drawTotalH < 50) drawTotalH = 50;

                        const scale = drawTotalW / totalW;
                        const drawM = m * scale;
                        const drawW = p * scale;
                        const drawH = f * scale;

                        const cx = 160;
                        const cy = 120;

                        const bedX1 = cx - drawTotalW / 2;
                        const bedX2 = cx + drawTotalW / 2;
                        const bedY1 = cy - drawTotalH / 2;
                        const bedY2 = cy + drawTotalH / 2;

                        const x1 = bedX1 + drawM;
                        const x2 = bedX2 - drawM;
                        const y1 = bedY1 + drawM;
                        const y2 = bedY2 - drawM;

                        return (
                          <svg width="320" height="240" viewBox="0 0 320 240" xmlns="http://www.w3.org/2000/svg" style={{ maxWidth: '100%', height: 'auto' }}>
                            <rect 
                              x={bedX1} 
                              y={bedY1} 
                              width={drawTotalW} 
                              height={drawTotalH} 
                              fill="#fdfbf7" 
                              stroke="#10b981" 
                              strokeWidth="1.5" 
                              rx="6" 
                              style={{ filter: 'drop-shadow(0 2px 4px rgba(16,185,129,0.05))' }}
                            />

                            <circle cx={x1} cy={y1} r="8" fill="#22c55e" stroke="#16a34a" strokeWidth="1" />
                            <circle cx={x2} cy={y1} r="8" fill="#22c55e" stroke="#16a34a" strokeWidth="1" />
                            <circle cx={x1} cy={y2} r="8" fill="#22c55e" stroke="#16a34a" strokeWidth="1" />
                            <circle cx={x2} cy={y2} r="8" fill="#22c55e" stroke="#16a34a" strokeWidth="1" />

                            {x2 - x1 > 30 && (
                              <>
                                <line x1={x1 + 12} y1={y1} x2={x2 - 12} y2={y1} stroke="#64748b" strokeWidth="2" />
                                <polygon points={`${x1 + 12},${y1 - 4} ${x1 + 8},${y1} ${x1 + 12},${y1 + 4}`} fill="#64748b" />
                                <polygon points={`${x2 - 12},${y1 - 4} ${x2 - 8},${y1} ${x2 - 12},${y1 + 4}`} fill="#64748b" />
                              </>
                            )}

                            <rect x={cx - 30} y={y1 - 10} width="60" height="20" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" rx="4" />
                            <text x={cx} y={y1 + 4} fontSize="11" fontWeight="bold" fill="#0f172a" textAnchor="middle">
                              {formData.especiesmarcoplantas ? `${formData.especiesmarcoplantas} cm` : '? cm'}
                            </text>

                            {y2 - y1 > 30 && (
                              <>
                                <line x1={x1} y1={y1 + 12} x2={x1} y2={y2 - 12} stroke="#64748b" strokeWidth="2" />
                                <polygon points={`${x1 - 4},${y1 + 12} ${x1},${y1 + 8} ${x1 + 4},${y1 + 12}`} fill="#64748b" />
                                <polygon points={`${x1 - 4},${y2 - 12} ${x1},${y2 - 8} ${x1 + 4},${y2 - 12}`} fill="#64748b" />
                              </>
                            )}

                            <rect x={x1 - 30} y={cy - 10} width="60" height="20" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" rx="4" />
                            <text x={x1} y={cy + 4} fontSize="11" fontWeight="bold" fill="#0f172a" textAnchor="middle">
                              {formData.especiesmarcofilas ? `${formData.especiesmarcofilas} cm` : '? cm'}
                            </text>

                            <line x1={x2} y1={y1 + 12} x2={x2} y2={y2 - 12} stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="4 4" />
                            <line x1={x1 + 12} y1={y2} x2={x2 - 12} y2={y2} stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="4 4" />

                            {m > 0 && (
                              <>
                                <line x1={x2} y1={y1} x2={bedX2} y2={y1} stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3 3" />
                                {drawM > 15 && (
                                  <>
                                    <line x1={x2 + 8} y1={y1 - 6} x2={x2 + 8} y2={y1 + 6} stroke="#f59e0b" strokeWidth="1.5" />
                                    <line x1={bedX2 - 8} y1={y1 - 6} x2={bedX2 - 8} y2={y1 + 6} stroke="#f59e0b" strokeWidth="1.5" />
                                  </>
                                )}
                                <rect x={((x2 + bedX2) / 2) - 20} y={y1 - 18} width="40" height="15" fill="#ffffff" stroke="#fef3c7" strokeWidth="1" rx="3" />
                                <text x={(x2 + bedX2) / 2} y={y1 - 7} fontSize="9" fontWeight="bold" fill="#d97706" textAnchor="middle">
                                  {formData.especiesmarcomargen ? `${formData.especiesmarcomargen} cm` : '0 cm'}
                                </text>
                              </>
                            )}
                          </svg>
                        );
                      })()}
                    </div>
                  )}
                </div>

                {/* CRONOLOGÍA Y CALENDARIOS (Fases + Calendarios) */}
                <div className="grid-form" style={{ display: activeTab === 'fases' ? 'grid' : 'none' }}>
                  <div className="form-group full" style={{ padding: '20px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ margin: '0 0 15px 0', color: '#1e293b', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      ⏳ Tiempos Estimados (Días)
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '20px' }}>
                      Indica los días reales que dura cada fase para esta especie concreta. El sistema las encadenará automáticamente para calcular las fechas estimadas del cultivo. Deja en 0 las fases que no apliquen.
                    </p>

                    {/* Tiempos de Preparación del Terreno (según laboreo) */}
                    <div style={{
                      background: '#f1f5f9',
                      border: '1px solid #cbd5e1',
                      borderRadius: '10px',
                      padding: '16px',
                      marginBottom: '20px'
                    }}>
                      <h4 style={{ margin: '0 0 8px 0', color: '#334155', fontSize: '0.95rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        🚜 Preparación del Terreno (según tipo de laboreo)
                      </h4>
                      <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0 0 14px 0' }}>
                        Establece los días de preparación del suelo según la técnica de laboreo a emplear.
                      </p>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '12px' }}>
                        <div className="form-group" style={{ margin: 0, padding: '12px', background: '#fff', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                          <label style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '1.2rem' }}>🚜</span>
                            <span style={{ color: '#475569' }}>Prep. Convencional</span>
                          </label>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                            <input 
                              type="number" 
                              min="0"
                              name="especiespreparacionconvencional"
                              placeholder="Días"
                              value={formData.especiespreparacionconvencional || ''} 
                              onChange={handleChange}
                              style={{ flex: 1 }}
                            />
                            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>días</span>
                          </div>
                        </div>

                        <div className="form-group" style={{ margin: 0, padding: '12px', background: '#fff', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                          <label style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '1.2rem' }}>⛏️</span>
                            <span style={{ color: '#475569' }}>Prep. Mínimo</span>
                          </label>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                            <input 
                              type="number" 
                              min="0"
                              name="especiespreparacionminima"
                              placeholder="Días"
                              value={formData.especiespreparacionminima || ''} 
                              onChange={handleChange}
                              style={{ flex: 1 }}
                            />
                            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>días</span>
                          </div>
                        </div>

                        <div className="form-group" style={{ margin: 0, padding: '12px', background: '#fff', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                          <label style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '1.2rem' }}>🌱</span>
                            <span style={{ color: '#475569' }}>Prep. No Laboreo</span>
                          </label>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                            <input 
                              type="number" 
                              min="0"
                              name="especiespreparacionnolaboreo"
                              placeholder="Días"
                              value={formData.especiespreparacionnolaboreo || ''} 
                              onChange={handleChange}
                              style={{ flex: 1 }}
                            />
                            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>días</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Resto de Fases del Cultivo */}
                    <div style={{ marginBottom: '30px' }}>
                      <h4 style={{ margin: '0 0 12px 0', color: '#334155', fontSize: '0.95rem', fontWeight: 'bold' }}>
                        🌱 Fases del Ciclo de Vida
                      </h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 250px), 1fr))', gap: '15px' }}>
                        {masterFases
                          .filter(f => f.fasescultivotipo === 'Fase' && f.fasescultivoclave !== 'planificacion')
                          .map(fase => (
                            <div key={fase.idfasescultivo} className="form-group" style={{ margin: 0, padding: '12px', background: '#fff', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                              <label style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontSize: '1.2rem' }}>{fase.fasescultivoicono}</span>
                                <span style={{ color: fase.fasescultivocolor }}>{fase.fasescultivonombre}</span>
                              </label>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                                <input 
                                  type="number" 
                                  min="0"
                                  placeholder="Días"
                                  value={formData.fases_duracion?.[fase.idfasescultivo] || ''} 
                                  onChange={(e) => {
                                    setFormData((prev: any) => ({
                                      ...prev,
                                      fases_duracion: {
                                        ...prev.fases_duracion,
                                        [fase.idfasescultivo]: e.target.value
                                      }
                                    }));
                                  }}
                                  onBlur={() => autoSaveFases(formData.fases_duracion)}
                                  style={{ flex: 1 }}
                                />
                                <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>días</span>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* SECCIÓN CALENDARIOS ANUALES (Meses) */}
                    <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '25px', marginTop: '20px' }}>
                      <h3 style={{ margin: '0 0 15px 0', color: '#1e293b', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        📅 Calendario Anual (Temporadas)
                      </h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: '10px', marginBottom: '20px' }}>
                        {['semillero', 'siembradirecta', 'trasplante', 'recoleccion'].map(tipo => {
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
                            <div key={tipo} style={{ background: '#fff', padding: '15px', borderRadius: '8px', borderTop: `4px solid ${colorMap[tipo]}`, borderLeft: '1px solid #cbd5e1', borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
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

                      <div style={{ marginTop: '20px' }}>
                        <h4 style={{ fontSize: '1.1rem', color: '#334155', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', marginBottom: '15px' }}>
                          📊 Gráfico del Calendario de Cultivo
                        </h4>

                        <div style={{ overflowX: 'auto', width: '100%' }}>
                          <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden', minWidth: '550px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '70px repeat(12, 1fr)', background: '#f1f5f9', borderBottom: '1px solid #e2e8f0' }}>
                              <div style={{ padding: '8px 4px', fontWeight: 'bold', color: '#64748b', fontSize: '0.7rem', borderRight: '1px solid #e2e8f0', textAlign: 'center' }}>FASE</div>
                              {MESES.map(m => (
                                <div key={m.val} style={{ padding: '8px 0', textAlign: 'center', fontWeight: 'bold', color: '#475569', fontSize: '0.7rem', borderRight: m.val < 12 ? '1px solid #e2e8f0' : 'none' }}>
                                  {isMobile ? m.label.charAt(0) : m.label}
                                </div>
                              ))}
                            </div>

                            {['semillero', 'siembradirecta', 'trasplante', 'recoleccion'].map((tipo, idx) => {
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
                    </div>
                  </div>
                </div>

                {/* LUNA Y BIODINAMICA */}
                <div className="grid-form" style={{ display: activeTab === 'biodinamica' ? 'flex' : 'none', flexDirection: 'column', gap: '24px' }}>
                  <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ margin: '0 0 16px 0', color: '#1e293b', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      🌕 Calendario Lunar
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '16px', marginBottom: '16px' }}>
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

                  <div style={{ background: '#f0fdfa', padding: '20px', borderRadius: '12px', border: '1px solid #ccfbf1' }}>
                    <h3 style={{ margin: '0 0 16px 0', color: '#0f766e', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      🌍 Calendario Biodinámico
                    </h3>
                    
                    <div className="form-group full" style={{ marginBottom: '16px' }}>
                      <label style={{ fontWeight: 'bold', color: '#0f766e' }} title="Determina en qué 'día de constelación' es óptimo sembrar según la biodinámica (Fruto=Fuego, Raíz=Tierra, Hoja=Agua, Flor=Aire). No confundir con el tipo de especie (hortaliza/fruta).">Organo Comestible Principal 💡</label>
                      <select name="especiesorganocomestible" value={formData.especiesorganocomestible || ''} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #99f6e4', fontSize: '1rem', background: '#fff' }}>
                        <option value="">— Sin categoría —</option>
                        <option value="fruto">🍅 Planta de Fruto (Días de Fuego/Calor)</option>
                        <option value="raiz">🥕 Planta de Raíz (Días de Tierra/Frío)</option>
                        <option value="hoja">🥬 Planta de Hoja (Días de Agua/Humedad)</option>
                        <option value="flor">🌸 Planta de Flor (Días de Aire/Luz)</option>
                      </select>
                      {formData.especiesorganocomestible && (
                        <p style={{ marginTop: '8px', fontSize: '0.85rem', color: '#0f766e', lineHeight: 1.5 }}>
                          {({ fruto: 'Siembra y trasplanta en días Fruto. Recolecta también en días Fruto para mejor sabor y conservación.', raiz: 'Siembra en días Raíz. Recolecta en días Raíz para mejor conservación.', hoja: 'Siembra y trasplanta en días Hoja. Evita podar o cosechar en días Fruto.', flor: 'Trabaja en días Flor para multiplicación y floración abundante. Cosecha en días Flor para mayor fragancia.' } as Record<string, string>)[formData.especiesorganocomestible]}
                        </p>
                      )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '16px', marginBottom: '16px' }}>
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

                {/* ECOSISTEMA (Asociaciones + Plagas) */}
                <div className="grid-form" style={{ display: activeTab === 'asociaciones' ? 'grid' : 'none' }}>
                  <div className="form-group full">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b' }}>Asociaciones Beneficiosas</h4>
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
                        {masterEspecies.filter(e => e.idespeciesvegetales.toString() !== especieId).map(e => <option key={e.idespeciesvegetales} value={e.idespeciesvegetales}>{e.especiesvegetalesnombre}</option>)}
                      </select>
                      <input type="text" id="motivoBen" placeholder="Motivo (opcional)" style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                      <button type="button" onClick={() => {
                        const sel = document.getElementById('selBen') as HTMLSelectElement | null;
                        const mot = document.getElementById('motivoBen') as HTMLInputElement | null;
                        if (!sel || !sel.value) return;
                        if (relaciones.beneficiosas.some((b) => b.xasociacionesbeneficiosasidespeciedestino.toString() === sel.value)) { alert('Ya añadida'); return; }
                        const sp = masterEspecies.find(e => e.idespeciesvegetales.toString() === sel.value);
                        const updated = {
                          ...relaciones,
                          beneficiosas: [...relaciones.beneficiosas, {
                            xasociacionesbeneficiosasidespeciedestino: parseInt(sel.value),
                            especie_destino_nombre: sp?.especiesvegetalesnombre,
                            asociacionesbeneficiosasmotivo: mot?.value || ''
                          }]
                        };
                        setRelaciones(updated);
                        saveRelacionesNow(updated);
                        if (sel) sel.value = '';
                        if (mot) mot.value = '';
                      }} style={{ padding: '8px 16px', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Añadir</button>
                    </div>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                      {relaciones.beneficiosas.map((b, idx) => (
                        <li key={idx} style={{ padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '8px', display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: '12px', alignItems: 'center' }}>
                          <div><strong>{b.especie_destino_nombre}</strong></div>
                          <input type="text" value={b.asociacionesbeneficiosasmotivo || ''} placeholder="Motivo de la asociación..." onChange={(e) => {
                            const updatedBen = relaciones.beneficiosas.map((bb, i) => i === idx ? { ...bb, asociacionesbeneficiosasmotivo: e.target.value } : bb);
                            setRelaciones({ ...relaciones, beneficiosas: updatedBen });
                            setRelacionesDirty(true);
                          }} onBlur={() => { saveRelacionesNow(relaciones); }} style={{ padding: '6px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }} />
                          <button type="button" onClick={() => {
                            const updated = { ...relaciones, beneficiosas: relaciones.beneficiosas.filter((_, i) => i !== idx) };
                            setRelaciones(updated);
                            saveRelacionesNow(updated);
                          }} style={{ color: '#ef4444', border: 'none', background: '#fee2e2', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer' }}>🗑️</button>
                        </li>
                      ))}
                      {relaciones.beneficiosas.length === 0 && <p style={{ color: '#94a3b8', fontStyle: 'italic', margin: 0 }}>No hay asociaciones beneficiosas.</p>}
                    </ul>
                  </div>

                  <div className="form-group full" style={{ marginTop: '20px', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
                    <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b', marginBottom: '10px' }}>Asociaciones Perjudiciales</h4>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                      <select id="selPer" style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                        <option value="">Selecciona especie...</option>
                        {masterEspecies.filter(e => e.idespeciesvegetales.toString() !== especieId).map(e => <option key={e.idespeciesvegetales} value={e.idespeciesvegetales}>{e.especiesvegetalesnombre}</option>)}
                      </select>
                      <input type="text" id="motivoPer" placeholder="Motivo (opcional)" style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                      <button type="button" onClick={() => {
                        const sel = document.getElementById('selPer') as HTMLSelectElement | null;
                        const mot = document.getElementById('motivoPer') as HTMLInputElement | null;
                        if (!sel || !sel.value) return;
                        if (relaciones.perjudiciales.some((p) => p.xasociacionesperjudicialesidespeciedestino.toString() === sel.value)) { alert('Ya añadida'); return; }
                        const sp = masterEspecies.find(e => e.idespeciesvegetales.toString() === sel.value);
                        const updated = {
                          ...relaciones,
                          perjudiciales: [...relaciones.perjudiciales, {
                            xasociacionesperjudicialesidespeciedestino: parseInt(sel.value),
                            especie_destino_nombre: sp?.especiesvegetalesnombre,
                            asociacionesperjudicialesmotivo: mot?.value || ''
                          }]
                        };
                        setRelaciones(updated);
                        saveRelacionesNow(updated);
                        if (sel) sel.value = '';
                        if (mot) mot.value = '';
                      }} style={{ padding: '8px 16px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Añadir</button>
                    </div>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                      {relaciones.perjudiciales.map((p, idx) => (
                        <li key={idx} style={{ padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '8px', display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: '12px', alignItems: 'center' }}>
                          <div><strong>{p.especie_destino_nombre}</strong></div>
                          <input type="text" value={p.asociacionesperjudicialesmotivo || ''} placeholder="Motivo de la asociación..." onChange={(e) => {
                            const updatedPer = relaciones.perjudiciales.map((pp, i) => i === idx ? { ...pp, asociacionesperjudicialesmotivo: e.target.value } : pp);
                            setRelaciones({ ...relaciones, perjudiciales: updatedPer });
                            setRelacionesDirty(true);
                          }} onBlur={() => { saveRelacionesNow(relaciones); }} style={{ padding: '6px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }} />
                          <button type="button" onClick={() => {
                            const updated = { ...relaciones, perjudiciales: relaciones.perjudiciales.filter((_, i) => i !== idx) };
                            setRelaciones(updated);
                            saveRelacionesNow(updated);
                          }} style={{ color: '#ef4444', border: 'none', background: '#fee2e2', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer' }}>🗑️</button>
                        </li>
                      ))}
                      {relaciones.perjudiciales.length === 0 && <p style={{ color: '#94a3b8', fontStyle: 'italic', margin: 0 }}>No hay asociaciones perjudiciales.</p>}
                    </ul>
                  </div>

                  {/* SECCIÓN AFECCIONES */}
                  <div className="form-group full" style={{ marginTop: '20px', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
                    <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b', marginBottom: '10px' }}>Afecciones Asociadas</h4>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
                      <select id="selPla" style={{ flex: 1, minWidth: '200px', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                        <option value="">Selecciona afección...</option>
                        {masterAfecciones.map(p => <option key={p.idafecciones} value={p.idafecciones}>{p.afeccionesnombre} ({p.afeccionescategoria})</option>)}
                      </select>
                      <select id="riesgoPla" style={{ width: '120px', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                        <option value="baja">Riesgo Bajo</option>
                        <option value="media">Riesgo Medio</option>
                        <option value="alta">Riesgo Alto</option>
                      </select>
                      <input type="text" id="notasPla" placeholder="Notas (opcional)" style={{ flex: 2, minWidth: '200px', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                      <button type="button" onClick={() => {
                        const sel = document.getElementById('selPla') as HTMLSelectElement | null;
                        const r = document.getElementById('riesgoPla') as HTMLSelectElement | null;
                        const n = document.getElementById('notasPla') as HTMLInputElement | null;
                        if (!sel || !sel.value) return;
                        if (relaciones.afecciones.some((p) => p.xespeciesvegetalesplagasidafecciones.toString() === sel.value)) { alert('Ya añadida'); return; }
                        const pla = masterAfecciones.find(p => p.idafecciones.toString() === sel.value);
                        const updated = {
                          ...relaciones,
                          afecciones: [...relaciones.afecciones, {
                            xespeciesvegetalesplagasidafecciones: parseInt(sel.value),
                            afeccionesnombre: pla?.afeccionesnombre,
                            afeccionescategoria: pla?.afeccionescategoria,
                            especiesafeccionesnivelriesgo: r?.value || 'media',
                            especiesafeccionesnotasespecificas: n?.value || ''
                          }]
                        };
                        setRelaciones(updated);
                        saveRelacionesNow(updated);
                        if (sel) sel.value = '';
                        if (n) n.value = '';
                        if (r) r.value = 'media';
                      }} style={{ padding: '8px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Añadir Afección</button>
                    </div>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                      {relaciones.afecciones.map((p, idx) => (
                        <li key={idx} style={{ padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '8px', display: 'grid', gridTemplateColumns: 'auto auto 1fr auto', gap: '12px', alignItems: 'center' }}>
                          <div>
                            <strong>{p.afeccionesnombre}</strong> <span style={{ color: '#64748b', fontSize: '0.85rem' }}>({p.afeccionescategoria})</span>
                          </div>
                          <select value={p.especiesafeccionesnivelriesgo || 'media'} onChange={(e) => {
                            const updatedPlagas = relaciones.afecciones.map((pl, i) => i === idx ? { ...pl, especiesafeccionesnivelriesgo: e.target.value } : pl);
                            const updated = { ...relaciones, plagas: updatedPlagas };
                            setRelaciones(updated);
                            saveRelacionesNow(updated);
                          }} style={{ padding: '6px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontWeight: 'bold', color: p.especiesafeccionesnivelriesgo === 'alta' ? '#ef4444' : p.especiesafeccionesnivelriesgo === 'baja' ? '#10b981' : '#f59e0b', cursor: 'pointer', minWidth: '130px' }}>
                            <option value="baja">🟢 Riesgo Bajo</option>
                            <option value="media">🟡 Riesgo Medio</option>
                            <option value="alta">🔴 Riesgo Alto</option>
                          </select>
                          <input type="text" value={p.especiesafeccionesnotasespecificas || ''} placeholder="Descripción del daño..." onChange={(e) => {
                            const updatedPlagas = relaciones.afecciones.map((pl, i) => i === idx ? { ...pl, especiesafeccionesnotasespecificas: e.target.value } : pl);
                            setRelaciones({ ...relaciones, afecciones: updatedPlagas });
                            setRelacionesDirty(true);
                          }} onBlur={() => { saveRelacionesNow(relaciones); }} style={{ padding: '6px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }} />
                          <button type="button" onClick={() => {
                            const updated = { ...relaciones, plagas: relaciones.afecciones.filter((_, i) => i !== idx) };
                            setRelaciones(updated);
                            saveRelacionesNow(updated);
                          }} style={{ color: '#ef4444', border: 'none', background: '#fee2e2', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer' }}>🗑️</button>
                        </li>
                      ))}
                      {relaciones.afecciones.length === 0 && <p style={{ color: '#94a3b8', fontStyle: 'italic', margin: 0 }}>No hay plagas vinculadas.</p>}
                    </ul>
                  </div>
                </div>

                {/* TEXTOS Y AUTOSUFICIENCIA */}
                <div className="grid-form" style={{ display: activeTab === 'textos' ? 'grid' : 'none' }}>
                  <div className="form-group full">
                    <label>Descripción / Cultivo</label>
                    <textarea name="especiesvegetalesdescripcion" rows={3} value={formData.especiesvegetalesdescripcion || ''} onChange={handleChange} />
                  </div>

                  <div className="form-group full">
                    <label>Historia / Origen</label>
                    <textarea name="especieshistoria" rows={3} value={formData.especieshistoria || ''} onChange={handleChange} />
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
                              🔗 {trimmedUrl.length > 35 ? trimmedUrl.substring(0, 35) + '...' : trimmedUrl}
                            </a>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* METRICAS DE CONSUMO DE AUTOSUFICIENCIA */}
                  <div className="form-group full" style={{ borderTop: '1px solid #e2e8f0', paddingTop: '20px', marginTop: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '15px' }}>
                    <h3 className="form-group full" style={{ margin: '0 0 10px 0', fontSize: '1.2rem', color: '#1e293b' }}>
                      ⚖️ Ratios de Consumo para Autosuficiencia
                    </h3>
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

                  {/* CALCULADORA DE RENDIMIENTO */}
                  {(() => {
                    const pParcial = parseFloat(formData.especiesautosuficienciaparcial) || 0;
                    const pFresco = parseFloat(formData.especiesautosuficiencia) || 0;
                    const pConserva = parseFloat(formData.especiesautosuficienciaconserva) || 0;
                    const totalPParcial = pParcial * calcPersonas;
                    const totalPFresco = pFresco * calcPersonas;
                    const totalPConserva = pConserva * calcPersonas;

                    const marcoP = (parseFloat(formData.especiesmarcoplantas) || 0) / 100;
                    const marcoF = (parseFloat(formData.especiesmarcofilas) || 0) / 100;
                    const margin = (parseFloat(formData.especiesmarcomargen) || 0) / 100;
                    const areaPlant = (marcoP + 2 * margin) * (marcoF + 2 * margin);

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

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '12px' }}>
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

                <div style={{ display: activeTab === 'alimentacion' ? 'block' : 'none' }}>
                  {/* Barra de filtros + Añadir */}
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', background: 'white', padding: '12px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', flexWrap: 'wrap', alignItems: 'center' }}>
                    {alimentacion.length > 0 && (
                      <>
                        <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#64748b' }}>🔍 Filtrar:</span>
                        <select
                          value={alimentacionFiltroAnimal || ''}
                          onChange={(e) => setAlimentacionFiltroAnimal(e.target.value)}
                          style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', color: '#475569', background: '#fff', cursor: 'pointer' }}
                        >
                          <option value="">Animal...</option>
                          {masterAnimales.map((mc: any) => <option key={mc.idespeciesanimales} value={mc.idespeciesanimales}>{mc.especiesanimalesnombre}</option>)}
                        </select>
                        <select
                          value={alimentacionFiltroAptitud || ''}
                          onChange={(e) => setAlimentacionFiltroAptitud(e.target.value)}
                          style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', color: '#475569', background: '#fff', cursor: 'pointer' }}
                        >
                          <option value="">Aptitud...</option>
                          <option value="1">✅ Apto</option>
                          <option value="2">⚠️ Moderado</option>
                          <option value="0">❌ Tóxico</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => { setAlimentacionFiltroAnimal(''); setAlimentacionFiltroAptitud(''); }}
                          style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '0.85rem', color: '#64748b', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                          Limpiar
                        </button>
                      </>
                    )}
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setAlimentacion([...alimentacion, { idespeciesanimales: null, xespeciesvegetalesanimalesidespeciesanimales: '', especiesanimalesesapto: 1, especiesanimalespartes: '', especiesanimalesnotas: '' }]);
                          setAlimentacionDirty(true);
                        }}
                        style={{ padding: '8px 16px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem', boxShadow: '0 4px 6px rgba(16,185,129,0.2)' }}
                      >
                        ➕ Añadir Registro
                      </button>
                      {alimentacionDirty && (
                        <button
                          type="button"
                          onClick={saveAlimentacionNow}
                          style={{ padding: '8px 16px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(245,158,11,0.4)' }}
                        >
                          💾 Guardar Cambios
                        </button>
                      )}
                    </div>
                  </div>

                  {alimentacion.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', background: '#f8fafc', borderRadius: '12px', border: '2px dashed #cbd5e1' }}>
                      <p style={{ color: '#64748b', fontSize: '1.1rem', margin: '0 0 10px 0' }}>No hay información de animales.</p>
                      <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0 }}>Haz clic en "+ Añadir Animal" para definir si es apto o tóxico para distintos animales y humanos.</p>
                    </div>
                  ) : (
                    <div style={{ overflowX: 'auto', width: '100%' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px', minWidth: '600px' }}>
                        <thead>
                          <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                            <th style={{ padding: '12px', textAlign: 'center', width: '10%' }}>Acciones</th>
                            <th style={{ padding: '12px', textAlign: 'left', width: '20%' }}>Animal</th>
                            <th style={{ padding: '12px', textAlign: 'left', width: '15%' }}>Aptitud</th>
                            <th style={{ padding: '12px', textAlign: 'left', width: '25%' }}>Partes Consumibles</th>
                            <th style={{ padding: '12px', textAlign: 'left', width: '35%' }}>Notas Adicionales</th>
                          </tr>
                        </thead>
                        <tbody>
                          {alimentacion.map((c, index) => {
                            if (alimentacionFiltroAnimal && String(c.xespeciesvegetalesanimalesidespeciesanimales) !== alimentacionFiltroAnimal) return null;
                            if (alimentacionFiltroAptitud && String(c.especiesanimalesesapto) !== alimentacionFiltroAptitud) return null;
                            return (
                            <tr key={index} style={{ borderBottom: '1px solid #e2e8f0', background: c.idespeciesanimales === null ? '#fefce8' : 'transparent' }}>
                              <td style={{ padding: '8px', textAlign: 'center' }}>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    const conToDelete = alimentacion[index];
                                    const newCon = [...alimentacion];
                                    newCon.splice(index, 1);
                                    setAlimentacion(newCon);
                                    setAlimentacionDirty(true);
                                    if (conToDelete.idespeciesanimales && especieId) {
                                      try {
                                        await fetch(`/api/admin/especiesvegetales/${especieId}/animales?id=${conToDelete.idespeciesanimales}`, { method: 'DELETE' });
                                      } catch (err) {
                                        console.error('Error borrando animal:', err);
                                      }
                                    }
                                  }}
                                  style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fca5a5', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}
                                >
                                  🗑️
                                </button>
                              </td>
                              <td style={{ padding: '8px' }}>
                                <select
                                  value={c.xespeciesvegetalesanimalesidespeciesanimales || ''}
                                  onChange={e => {
                                    const newCon = [...alimentacion];
                                    newCon[index].xespeciesvegetalesanimalesidespeciesanimales = e.target.value;
                                    setAlimentacion(newCon);
                                    setAlimentacionDirty(true);
                                  }}
                                  style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                                >
                                  <option value="">-- Seleccionar --</option>
                                  {masterAnimales.map(mc => (
                                    <option key={mc.idespeciesanimales} value={mc.idespeciesanimales}>{mc.especiesanimalesnombre}</option>
                                  ))}
                                </select>
                              </td>
                              <td style={{ padding: '8px' }}>
                                <select
                                  value={c.especiesanimalesesapto != null ? c.especiesanimalesesapto : 1}
                                  onChange={e => {
                                    const newCon = [...alimentacion];
                                    newCon[index].especiesanimalesesapto = Number(e.target.value);
                                    setAlimentacion(newCon);
                                    setAlimentacionDirty(true);
                                  }}
                                  style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', background: 'white' }}
                                >
                                  <option value={1}>🟢 Apto</option>
                                  <option value={2}>🟡 Con moderación</option>
                                  <option value={0}>🔴 No apto / Tóxico</option>
                                </select>
                              </td>
                              <td style={{ padding: '8px' }}>
                                <select
                                  value={c.xespeciesvegetalesanimalesidplantasparte || ''}
                                  onChange={e => {
                                    const newCon = [...alimentacion];
                                    const val = e.target.value ? Number(e.target.value) : '';
                                    newCon[index].xespeciesvegetalesanimalesidplantasparte = val;
                                    const matchPart = masterPlantasPartes.find(p => p.idplantasparte === val);
                                    newCon[index].especiesanimalespartes = matchPart ? matchPart.plantaspartenombre : '';
                                    setAlimentacion(newCon);
                                    setAlimentacionDirty(true);
                                  }}
                                  style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', background: 'white' }}
                                >
                                  <option value="">-- Seleccionar --</option>
                                  {masterPlantasPartes.map(pp => (
                                    <option key={pp.idplantasparte} value={pp.idplantasparte}>
                                      {pp.plantasparteemoji} {pp.plantaspartenombre}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td style={{ padding: '8px' }}>
                                <textarea
                                  value={c.especiesanimalesnotas || ''}
                                  onChange={e => {
                                    const newCon = [...alimentacion];
                                    newCon[index].especiesanimalesnotas = e.target.value;
                                    setAlimentacion(newCon);
                                    setAlimentacionDirty(true);
                                  }}
                                  style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', resize: 'vertical', fontFamily: 'inherit' }}
                                  rows={2}
                                  placeholder="Tóxico en crudo, apto cocinado..."
                                />
                              </td>
                            </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* VARIEDADES */}
                <div style={{ display: activeTab === 'variedades' ? 'block' : 'none' }}>
                  {especieId && (
                    <EspecieVegetalVariedadesTab especieId={especieId} userEmail={userEmail} focusVariedadId={focusParam} />
                  )}
                </div>

                {/* PAUTAS DE LABORES */}
                <div style={{ display: activeTab === 'pautas' ? 'block' : 'none', background: '#f8fafc', padding: '24px', borderRadius: '12px' }}>

                  {especieId && (
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', background: 'white', padding: '12px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', flexWrap: 'wrap', alignItems: 'center' }}>
                      {pautas.length > 0 && (
                        <>
                          <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#64748b' }}>🔍 Filtrar por:</span>
                      
                          <select 
                            value={pautasFiltroFase} 
                            onChange={(e) => setPautasFiltroFase(e.target.value)}
                            style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', color: '#475569', background: '#fff', cursor: 'pointer' }}
                          >
                            <option value="">Fase...</option>
                            {masterFases.map(f => <option key={f.idfasescultivo} value={f.fasescultivoclave}>{f.fasescultivonombre}</option>)}
                          </select>

                          <select 
                            value={pautasFiltroLabor} 
                            onChange={(e) => setPautasFiltroLabor(e.target.value)}
                            style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', color: '#475569', background: '#fff', cursor: 'pointer' }}
                          >
                            <option value="">Labor...</option>
                            {masterLabores.map(l => <option key={l.idlabores} value={l.idlabores}>{l.laboresnombre}</option>)}
                          </select>

                          <select 
                            value={pautasFiltroLaboreo} 
                            onChange={(e) => setPautasFiltroLaboreo(e.target.value)}
                            style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', color: '#475569', background: '#fff', cursor: 'pointer' }}
                          >
                            <option value="">Método de Tierra...</option>
                            <option value="convencional">🚜 Convencional</option>
                            <option value="minimo">⛏️ Mínimo</option>
                            <option value="nolaboreo">🚫 No laboreo</option>
                          </select>

                          <button 
                            type="button" 
                            onClick={() => { setPautasFiltroFase(''); setPautasFiltroLabor(''); setPautasFiltroLaboreo(''); }} 
                            style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '0.85rem', color: '#64748b', cursor: 'pointer', fontWeight: 'bold' }}
                          >
                            Limpiar Filtros
                          </button>
                        </>
                      )}

                      <div style={{ marginLeft: 'auto' }}>
                        <button
                          type="button"
                          onClick={() => setShowAddPautaForm(!showAddPautaForm)}
                          style={{ 
                            height: '38px',
                            padding: '0 16px', 
                            background: showAddPautaForm ? 'linear-gradient(135deg, #475569, #1e293b)' : '#10b981', 
                            color: 'white', 
                            border: 'none', 
                            borderRadius: '8px', 
                            fontWeight: 'bold', 
                            cursor: 'pointer', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            gap: '8px', 
                            fontSize: '0.9rem', 
                            transition: 'all 0.3s ease',
                            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
                            flexShrink: 0
                          }}
                        >
                          {showAddPautaForm ? '✕ Cancelar' : '➕ Añadir Labor'}
                        </button>
                      </div>
                    </div>
                  )}

                  {showAddPautaForm && (
                    <form onSubmit={(e) => { e.preventDefault(); handleSavePauta(); }} style={{ background: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <h4 style={{ margin: 0, color: '#1e293b' }}>{editingPauta ? '✏️ Editar Labor Pautada' : '➕ Añadir Nueva Labor Pautada'}</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#475569' }}>Labor *</label>
                          <select required value={pautaForm.xlaborespautaidlabores} onChange={(e) => setPautaForm({ ...pautaForm, xlaborespautaidlabores: e.target.value })} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                            <option value="">Selecciona labor...</option>
                            {masterLabores.map(l => <option key={l.idlabores} value={l.idlabores}>{l.laboresnombre}</option>)}
                          </select>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#475569' }}>Fase de Cultivo *</label>
                          <select required value={pautaForm.laborespautafase} onChange={(e) => setPautaForm({ ...pautaForm, laborespautafase: e.target.value })} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                            {masterFases.map(f => <option key={f.idfasescultivo} value={f.fasescultivoclave}>{f.fasescultivonombre}</option>)}
                          </select>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#475569' }}>Frecuencia (Días) *</label>
                          <input type="number" required min="1" placeholder="Ej: 3" value={pautaForm.laborespautafrecuenciadias} onChange={(e) => setPautaForm({ ...pautaForm, laborespautafrecuenciadias: e.target.value })} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#475569' }}>Día de Inicio en la Fase (Offset)</label>
                          <input type="number" min="0" placeholder="Ej: 0 (empieza inmediato)" value={pautaForm.laborespautaoffset} onChange={(e) => setPautaForm({ ...pautaForm, laborespautaoffset: parseInt(e.target.value) || 0 })} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#475569' }}>Instrucciones / Notas Específicas</label>
                        <textarea placeholder="Consejos prácticos para realizar esta labor en esta especie..." value={pautaForm.laborespautanotasia} onChange={(e) => setPautaForm({ ...pautaForm, laborespautanotasia: e.target.value })} rows={2} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', resize: 'vertical' }} />
                      </div>

                      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                        <button type="button" onClick={() => { setShowAddPautaForm(false); setEditingPauta(null); setPautaForm({ xlaborespautaidlabores: '', laborespautafase: 'planificacion', laborespautafrecuenciadias: '', laborespautaoffset: 0, laborespautanotasia: '', laborespautaactivosino: 1, idlaborespauta: undefined }); }} style={{ padding: '8px 16px', background: 'white', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#475569', cursor: 'pointer', fontWeight: 'bold' }}>Cancelar</button>
                        <button type="submit" style={{ padding: '8px 20px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>{editingPauta ? 'Actualizar' : 'Guardar'}</button>
                      </div>
                    </form>
                  )}

                  {especieId && pautas.length === 0 ? (
                    <div style={{ background: 'white', padding: '40px', textAlign: 'center', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                      <p style={{ margin: 0, color: '#64748b', fontSize: '1rem', fontWeight: 'bold' }}>No hay labores programadas para esta especie.</p>
                      <p style={{ margin: '8px 0 0 0', color: '#94a3b8', fontSize: '0.85rem' }}>Haz clic en "+ Añadir Labor" o pídele al "Asistente IA" que diseñe un calendario recomendado.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {pautas
                        .filter(p => {
                          if (pautasFiltroFase && p.laborespautafase !== pautasFiltroFase) return false;
                          if (pautasFiltroLabor && p.xlaborespautaidlabores?.toString() !== pautasFiltroLabor) return false;
                          if (pautasFiltroLaboreo) {
                            const laborObj = masterLabores.find(l => l.idlabores === p.xlaborespautaidlabores);
                            if (laborObj) {
                              if (pautasFiltroLaboreo === 'convencional' && laborObj.laboresaplicaconvencional !== 1) return false;
                              if (pautasFiltroLaboreo === 'minimo' && laborObj.laboresaplicaminimo !== 1) return false;
                              if (pautasFiltroLaboreo === 'nolaboreo' && laborObj.laboresaplicanolaboreo !== 1) return false;
                            }
                          }
                          return true;
                        })
                        .map(p => {
                          const faseDetail = masterFases.find(f => f.fasescultivoclave === p.laborespautafase);
                          return (
                            <div key={p.idlaborespauta} style={{ background: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', transition: 'all 0.2s' }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                  <span style={{ fontSize: '1.2rem', padding: '6px', background: `${p.laborescolor || '#f1f5f9'}30`, borderRadius: '6px' }}>{p.laboresicono || '📋'}</span>
                                  <strong style={{ fontSize: '1rem', color: '#1e293b' }}>{p.laboresnombre}</strong>
                                  <span onClick={() => router.push(`/dashboard/admin/labores/${p.xlaborespautaidlabores}`)} title="Editar labor original" style={{ cursor: 'pointer', fontSize: '1rem', opacity: 0.7 }} onMouseOver={e => e.currentTarget.style.opacity='1'} onMouseOut={e => e.currentTarget.style.opacity='0.7'}>⚙️</span>
                                  <span style={{ fontSize: '0.75rem', fontWeight: 'bold', background: `${faseDetail?.fasescultivocolor || '#64748b'}15`, color: faseDetail?.fasescultivocolor || '#64748b', padding: '3px 8px', borderRadius: '12px' }}>
                                    {faseDetail?.fasescultivoicono} {faseDetail?.fasescultivonombre || p.laborespautafase}
                                  </span>
                                  <span style={{ fontSize: '0.75rem', color: '#475569', background: '#f1f5f9', padding: '3px 8px', borderRadius: '12px', fontWeight: 'bold' }}>
                                    Cada {p.laborespautafrecuenciadias} {p.laborespautafrecuenciadias === 1 ? 'día' : 'días'}
                                  </span>
                                  {p.laborespautaoffset > 0 && (
                                    <span style={{ fontSize: '0.75rem', color: '#4f46e5', background: '#e0e7ff', padding: '3px 8px', borderRadius: '12px', fontWeight: 'bold' }}>
                                      Inicio: Día +{p.laborespautaoffset}
                                    </span>
                                  )}
                                </div>
                                {p.laborespautanotasia && (
                                  <p style={{ margin: '8px 0 0 0', fontSize: '0.85rem', color: '#475569', fontStyle: 'italic', background: '#f8fafc', padding: '8px 12px', borderRadius: '6px', borderLeft: '3px solid #cbd5e1' }}>
                                    {p.laborespautanotasia}
                                  </p>
                                )}
                              </div>
                              <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingPauta(p);
                                    setPautaForm({
                                      xlaborespautaidlabores: p.xlaborespautaidlabores?.toString() || '',
                                      laborespautafase: p.laborespautafase || 'planificacion',
                                      laborespautafrecuenciadias: p.laborespautafrecuenciadias?.toString() || '',
                                      laborespautaoffset: p.laborespautaoffset || 0,
                                      laborespautanotasia: p.laborespautanotasia || '',
                                      laborespautaactivosino: p.laborespautaactivosino || 1,
                                      idlaborespauta: p.idlaborespauta
                                    });
                                    setShowAddPautaForm(true);
                                    window.scrollTo({ top: 300, behavior: 'smooth' });
                                  }}
                                  style={{ padding: '6px 12px', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}
                                >
                                  ✏️ Editar
                                </button>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (!especieId) return;
                                    if (!window.confirm('¿Seguro que deseas eliminar esta labor de la pauta?')) return;
                                    try {
                                      const res = await fetch(`/api/admin/especiesvegetales/${especieId}/pautas?id=${p.idlaborespauta}`, { method: 'DELETE' });
                                      if (res.ok) {
                                        loadPautas(especieId);
                                        setToastMessage('Labor eliminada con éxito.');
                                        setTimeout(() => setToastMessage(null), 3000);
                                      }
                                    } catch (err) {
                                      console.error(err);
                                    }
                                  }}
                                  style={{ padding: '6px 10px', background: '#fee2e2', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '6px', cursor: 'pointer' }}
                                >
                                  🗑️
                                </button>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>

                {/* FOTOS */}
                <div style={{ display: activeTab === 'photos' ? 'block' : 'none' }}>
                  {!especieId && (
                    <div style={{ padding: '20px', background: '#fef3c7', borderRadius: '12px', color: '#92400e', fontSize: '0.85rem', fontWeight: 600, width: '100%' }}>
                      💡 Guarda la especie primero para poder añadir fotos.
                    </div>
                  )}

                  {especieId && (
                    <>
                      <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px' }}>📷 Fotos</span>
                        <span style={{ fontSize: '0.82rem', color: photos.length >= 4 ? '#ef4444' : '#64748b', fontWeight: 600 }}>{photos.length} / 4 permitidas</span>
                      </div>

                      {((photos.length > 0) || (photos.length < 4)) && (
                        <div className="gallery">
                          {photos.map((photo, index) => {
                            let parsedResumen: any = {};
                            try {
                              parsedResumen = typeof photo.resumen === 'string'
                                ? JSON.parse(photo.resumen)
                                : (photo.resumen || {});
                            } catch (e) {
                              console.error('Error parseando resumen foto:', e);
                            }

                            const filterVal = STYLE_FILTERS[parsedResumen.profile_style || ''] || 'none';

                            return (
                              <div
                                key={photo.id}
                                className={`gallery-item ${photo.esPrincipal ? 'is-preferred' : ''}`}
                                draggable
                                onDragStart={() => setDraggedPhotoIndex(index)}
                                onDragOver={(e) => { e.preventDefault(); setDraggedOverPhotoIndex(index); }}
                                onDrop={handlePhotoReorder}
                              >
                                <img
                                  src={getMediaUrl(photo.ruta)}
                                  alt={parsedResumen.seo_alt || formData.especiesvegetalesnombre || 'Foto de Especie'}
                                  crossOrigin="anonymous"
                                  style={{ filter: filterVal }}
                                />
                                <div className="photo-actions">
                                  <button
                                    type="button"
                                    className={`photo-action-btn btn-photo-primary ${photo.esPrincipal ? 'is-active' : ''}`}
                                    onClick={() => handleSetPrimaryPhoto(photo.id)}
                                    title={photo.esPrincipal ? 'Foto de portada' : 'Hacer portada'}
                                  >
                                    {photo.esPrincipal ? '⭐' : '☆'}
                                  </button>
                                  <button
                                    type="button"
                                    className="photo-action-btn btn-photo-delete"
                                    onClick={() => setDeleteConfirm({ id: photo.id, type: 'photos' })}
                                    title="Eliminar foto"
                                  >
                                    ✕
                                  </button>
                                  <button
                                    type="button"
                                    className="photo-action-btn btn-photo-edit"
                                    onClick={() => openPhotoEditor(photo)}
                                    title="Editar imagen y SEO"
                                  >
                                    ✏️
                                  </button>
                                </div>
                              </div>
                            );
                          })}

                          {/* Inline Dropzone (only if less than 4 photos) */}
                          {photos.length < 4 && (
                            <div
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
                              className={`custom-file-upload drop-zone inline-drop-zone ${dragOverPhotos ? 'drag-over' : ''}`}
                              style={{ cursor: 'default' }}
                            >
                              <input
                                type="file"
                                id="upload-photos"
                                multiple
                                accept="image/*"
                                onChange={(e) => handleFileUpload(e, 'photos')}
                                style={{ display: 'none' }}
                                disabled={uploadingPhotos}
                              />

                              {uploadingPhotos ? (
                                <div className="drop-zone-content">
                                  <span style={{ fontSize: '1.5rem', animation: 'spin 2s linear infinite', display: 'inline-block' }}>⏳</span>
                                  <span style={{ color: '#3b82f6', fontWeight: 'bold', fontSize: '0.75rem', textAlign: 'center' }}>Procesando...</span>
                                </div>
                              ) : (
                                <div className="drop-zone-content" style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                                  <div className="drop-zone-buttons" style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', alignItems: 'center' }}>
                                    <label
                                      htmlFor="upload-photos"
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
                    </>
                  )}
                </div>

                {/* PDFs */}
                <div style={{ display: activeTab === 'pdfs' ? 'block' : 'none' }}>
                  {!especieId ? (
                    <div style={{ padding: '40px', textAlign: 'center', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1', color: '#64748b' }}>
                      Guarda la especie primero antes de poder gestionar documentos.
                    </div>
                  ) : (
                    <VariedadVegetalMediaManager 
                      variedadId={especieId.toString()} 
                      userEmail={userEmail!} 
                      variedadNombre={formData.especiesvegetalesnombre}
                      especieNombre="Especie"
                      especieNombreCientifico={formData.especiesvegetalesnombrecientifico}
                      apiBasePath={`/api/admin/especiesvegetales/${especieId}`}
                      section="pdfs"
                      onMediaChange={async () => {
                        try {
                          const dRes = await fetch(`/api/admin/especiesvegetales/${especieId}/pdfs`, { headers: { 'x-user-email': userEmail || '' } });
                          if (dRes.ok) {
                            const dData = await dRes.json();
                            setPdfs(dData.pdfs || []);
                          }
                        } catch (e) { console.error('Error refetching PDFs in EspecieVegetalForm:', e); }
                      }}
                      entityType="especies"
                      initialEditPdfId={editPdfParam ? parseInt(editPdfParam, 10) : null}
                    />
                  )}
                </div>

                {/* BLOGS */}
                <div className="grid-form" style={{ display: activeTab === 'blogs' ? 'grid' : 'none' }}>
                  <div className="form-group full" style={{ margin: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                      <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#1e293b' }}>📰 Posts de Blog Vinculados</h3>
                      {especieId && pdfs.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setBlogGenPdf(pdfs[0]?.id?.toString() || '');
                            setShowBlogPrompt(true);
                          }}
                          disabled={blogGenLoading}
                          style={{ padding: '8px 16px', background: 'linear-gradient(135deg, #059669, #10b981)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: blogGenLoading ? 'not-allowed' : 'pointer' }}
                        >
                          {blogGenLoading ? '⏳ Generando...' : '✨ Redactar Post de Blog (IA)'}
                        </button>
                      )}
                    </div>

                    {blogGenLoading && (
                      <div style={{ padding: '24px', background: '#ecfdf5', borderRadius: '12px', border: '1px solid #a7f3d0', marginBottom: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '2rem', animation: 'spin 1s linear infinite', display: 'inline-block' }}>⚙️</span>
                        <strong style={{ color: '#065f46' }}>El redactor IA está trabajando...</strong>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#047857' }}>{blogGenProgress}</p>
                      </div>
                    )}

                    {blogs.length === 0 && !blogGenLoading ? (
                      <div style={{ padding: '40px', textAlign: 'center', background: '#f8fafc', borderRadius: '12px', border: '2px dashed #cbd5e1' }}>
                        <p style={{ color: '#64748b', fontSize: '1.1rem', margin: '0 0 10px 0' }}>No hay artículos de blog asociados a esta especie.</p>
                        {pdfs.length > 0 ? (
                          <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0 }}>Puedes generar un post de blog automáticamente utilizando las guías de la pestaña PDFs.</p>
                        ) : (
                          <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0 }}>Sube primero guías en la pestaña PDFs para que la IA tenga material de base para redactar artículos.</p>
                        )}
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: '16px', marginTop: '10px' }}>
                        {blogs.map((b) => (
                          <div key={b.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                              {b.hero_imagen ? (
                                <div style={{ width: '60px', height: '60px', borderRadius: '8px', overflow: 'hidden', background: '#f1f5f9', flexShrink: 0 }}>
                                  <img src={getMediaUrl(b.hero_imagen)} alt={b.titulo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} crossOrigin="anonymous" />
                                </div>
                              ) : (
                                <div style={{ width: '60px', height: '60px', borderRadius: '8px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>✨</div>
                              )}
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 'bold', color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: 1.3 }}>
                                  {b.titulo}
                                </h4>
                                <span style={{ display: 'inline-block', marginTop: '4px', fontSize: '0.7rem', color: b.estado === 'publicado' ? '#059669' : '#d97706', fontWeight: 700, background: b.estado === 'publicado' ? '#d1fae5' : '#fef3c7', padding: '2px 6px', borderRadius: '4px' }}>
                                  {b.estado === 'publicado' ? 'Publicado' : 'Borrador'}
                                </span>
                              </div>
                            </div>

                            <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: 1.4 }}>
                              {b.resumen}
                            </p>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
                              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                                {new Date(b.fechaCreacion).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </span>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <a
                                  href={`/blog/${b.slug}?preview=true`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    background: '#0f766e',
                                    color: 'white',
                                    padding: '4px 10px',
                                    borderRadius: '6px',
                                    fontSize: '0.75rem',
                                    textDecoration: 'none',
                                    fontWeight: 'bold',
                                    cursor: 'pointer'
                                  }}
                                >
                                  Leer Art
                                </a>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteBlog(b.id)}
                                  style={{ background: '#fee2e2', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px 8px', borderRadius: '6px', fontSize: '0.8rem' }}
                                  title="Eliminar artículo"
                                >
                                  🗑️
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

              </div>

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
            </div>
          )}
        </form>
      </div>

      {/* MODAL DE COMPARACIÓN IA */}
      {/* MODAL DE CONFIGURACIÓN IA */}
      {showAiConfig && (
        <PremiumModal isOpen={showAiConfig} onClose={() => setShowAiConfig(false)} maxWidth="600px" zIndex={10000}>
          <PremiumModalHeader
            title={
              aiLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '1.5rem', animation: 'spin 2s linear infinite', display: 'inline-block' }}>⏳</span>
                  <h2 style={{ color: 'white', margin: 0, fontSize: '1.25rem' }}>Analizando... {aiSeconds}s</h2>
                </div>
              ) : (
                <>✨ Asistente IA</>
              )
            }
            actions={
              !aiLoading && (
                <button type="button" onClick={runUnifiedAiSearch} disabled={aiLoading} style={{ padding: '6px 16px', borderRadius: '6px', border: 'none', background: 'white', color: '#6d28d9', fontWeight: 'bold', cursor: aiLoading ? 'not-allowed' : 'pointer', fontSize: '0.9rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', transition: 'all 0.2s' }}>
                  🚀 Analizar
                </button>
              )
            }
            gradient="linear-gradient(135deg, #8b5cf6, #6d28d9)"
            onClose={() => setShowAiConfig(false)}
          />
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '75vh', overflowY: 'auto', position: 'relative' }}>
              
              {/* Overlay de carga superpuesto sobre el contenido existente */}
              {aiLoading && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.75)', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '0 0 12px 12px' }}>
                  <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center', padding: '20px' }}>
                    <p style={{ margin: 0, color: '#475569', fontSize: '0.9rem', fontWeight: 600 }}>
                      Buscando información para {formData.especiesvegetalesnombre}...
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center', maxWidth: '380px' }}>
                      {Object.keys(aiConfigTabs).filter(k => (aiConfigTabs as any)[k]).map(k => {
                        const labelMap: Record<string, string> = {
                          taxonomia: '🧬 Identificación', cultivo: '🌱 Requisitos', fases: '📅 Cronología',
                          biodinamica: '🌙 Biodinámica', asociaciones: '🤝 Ecosistema', textos: '📝 Textos',
                          sinonimos: '🗣️ Sinónimos', variedades: '🌾 Variedades', alimentacion: '🐄 Alimentación', pautas: '📋 Labores'
                        };
                        return (
                          <span key={k} style={{ background: '#ede9fe', color: '#6d28d9', padding: '3px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600 }}>
                            {labelMap[k]}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Contenido real (siempre renderizado, atenuado si carga) */}
              <div style={{ opacity: aiLoading ? 0.3 : 1, pointerEvents: aiLoading ? 'none' : 'auto', transition: 'opacity 0.3s ease' }}>
                {aiStats && (
                  <div style={{ textAlign: 'center', marginBottom: '4px' }}>
                    <p style={{ margin: '0 0 4px', fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
                      Interacciones IA este mes: <span style={{ color: aiStats.remaining > 0 ? '#0d9488' : '#ef4444' }}>{aiStats.used} / {aiStats.max}</span>
                    </p>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>
                      Incluido gratis en tu suscripción actual.
                    </p>
                  </div>
                )}
                
                {/* Apartado 1: Entidad Objetivo */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                <div style={{ fontWeight: 'bold', color: '#1e293b', fontSize: '0.9rem', marginBottom: '4px' }}>1. Entidad Objetivo</div>
                <div style={{ color: '#475569', fontSize: '0.95rem' }}>
                  🌱 Especie seleccionada: <strong>{formData.especiesvegetalesnombre || 'Desconocida'}</strong> {formData.especiesvegetalesnombrecientifico ? `(${formData.especiesvegetalesnombrecientifico})` : ''}
                </div>
              </div>

              {/* Apartado 2: System Prompt Base */}
              <details style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                <summary style={{ fontWeight: 'bold', color: '#1e293b', fontSize: '0.9rem', cursor: 'pointer', outline: 'none', listStyle: 'none', display: 'flex', justifyContent: 'space-between' }}>
                  <span>2. System Prompt Base (Instrucciones)</span>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>▼ Expandir</span>
                </summary>
                <div style={{ marginTop: '12px', color: '#475569', fontSize: '0.85rem', fontFamily: 'monospace', background: '#f1f5f9', padding: '10px', borderRadius: '6px' }}>
                  Actúa como un experto agrónomo botánico. Debes buscar información detallada, técnica y veraz relativa a la especie seleccionada. Tu objetivo es estructurar los datos para autocompletar una ficha técnica agrícola, ajustándote a los parámetros de las categorías requeridas y proporcionando valores precisos.
                </div>
              </details>

              {/* Apartado 3: Prompt Dinámico (Texto Libre) */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                <div style={{ fontWeight: 'bold', color: '#1e293b', fontSize: '0.9rem', marginBottom: '8px' }}>3. Prompt Dinámico (Texto Libre)</div>
                <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '10px', background: 'white', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ color: '#64748b', fontSize: '0.85rem', whiteSpace: 'pre-line' }}>
                    {`Busca información para las siguientes categorías de la especie:\n${Object.keys(aiConfigTabs).filter(k => (aiConfigTabs as any)[k]).map(k => {
                      const labelMap: Record<string, string> = {
                        taxonomia: '🧬 Identificación', cultivo: '🌱 Requisitos y Suelo', fases: '📅 Cronología',
                        biodinamica: '🌙 Lunar / Biodinámica', asociaciones: '🤝 Ecosistema', textos: '📝 Textos y Autosuf.',
                        sinonimos: '🗣️ Sinónimos', variedades: '🌾 Variedades', alimentacion: '🐄 Alimentación Animal', pautas: '📋 Labores'
                      };
                      return `- ${labelMap[k]}`;
                    }).join('\n')}`}
                  </div>
                  <hr style={{ border: 'none', borderTop: '1px dashed #e2e8f0', margin: 0 }} />
                  <textarea
                    value={aiConfigPrompt}
                    onChange={(e) => setAiConfigPrompt(e.target.value)}
                    placeholder="Añade directrices, matices o condiciones adicionales aquí..."
                    rows={3}
                    style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', resize: 'vertical', fontSize: '0.9rem', color: '#1e293b' }}
                  />
                </div>
              </div>

              {/* Apartado 4: Ayudante de Categorías */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ fontWeight: 'bold', color: '#1e293b', fontSize: '0.9rem' }}>4. Ayudante de Categorías</div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button type="button" onClick={() => setAiConfigTabs({
                      taxonomia: true, cultivo: true, fases: true, biodinamica: true, asociaciones: true, textos: true, sinonimos: true, variedades: true, alimentacion: true, pautas: true
                    })} style={{ background: 'none', border: 'none', color: '#7c3aed', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold', padding: 0 }}>
                      ➕ Todas
                    </button>
                    <button type="button" onClick={() => setAiConfigTabs({
                      taxonomia: false, cultivo: false, fases: false, biodinamica: false, asociaciones: false, textos: false, sinonimos: false, variedades: false, alimentacion: false, pautas: false
                    })} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold', padding: 0 }}>
                      ➖ Ninguna
                    </button>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 180px), 1fr))', gap: '10px' }}>
                  {Object.keys(aiConfigTabs).map((tabKey) => {
                    const labelMap: Record<string, string> = {
                      taxonomia: '🧬 Identificación', cultivo: '🌱 Requisitos y Suelo', fases: '📅 Cronología',
                      biodinamica: '🌙 Lunar / Biodinámica', asociaciones: '🤝 Ecosistema', textos: '📝 Textos y Autosuf.',
                      sinonimos: '🗣️ Sinónimos', variedades: '🌾 Variedades', alimentacion: '🐄 Alimentación Animal', pautas: '📋 Labores'
                    };
                    return (
                      <label key={tabKey} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '6px 8px', background: 'white', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                        <input
                          type="checkbox"
                          checked={(aiConfigTabs as any)[tabKey]}
                          onChange={(e) => setAiConfigTabs(prev => ({ ...prev, [tabKey]: e.target.checked }))}
                          style={{ accentColor: '#7c3aed', width: '14px', height: '14px', margin: 0 }}
                        />
                        <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#334155' }}>
                          {labelMap[tabKey]}
                        </span>
                      </label>
                    );
                  })}
                </div>

                {/* Sub-bloque: Ámbito de Sinónimos (visible solo si sinónimos está marcado) */}
                {(aiConfigTabs as any).sinonimos && (
                  <div style={{ marginTop: '12px', padding: '12px', background: '#f5f3ff', borderRadius: '8px', border: '1px solid #ddd6fe' }}>
                    <div style={{ fontWeight: 'bold', color: '#6d28d9', fontSize: '0.8rem', marginBottom: '8px' }}>🌍 Ámbito de búsqueda de sinónimos</div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {[
                        { key: 'general', emoji: '🌎', label: 'General' },
                        { key: 'cooficiales', emoji: '🇪🇸', label: 'Lenguas Cooficiales' },
                        { key: 'europa', emoji: '🇪🇺', label: 'Europea' },
                      ].map(scope => (
                        <label key={scope.key} style={{
                          display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px',
                          border: sinSelectedScope === scope.key ? '2px solid #7c3aed' : '1px solid #e2e8f0',
                          borderRadius: '6px', cursor: 'pointer',
                          background: sinSelectedScope === scope.key ? '#ede9fe' : '#fff',
                          transition: 'all 0.2s', fontSize: '0.8rem'
                        }}>
                          <input
                            type="radio"
                            name="sinScopeUnified"
                            checked={sinSelectedScope === scope.key}
                            onChange={() => {
                              setSinSelectedScope(scope.key);
                              setSinExtraInstructions(sinScopePresets[scope.key]);
                            }}
                            style={{ width: '14px', height: '14px', accentColor: '#7c3aed', flexShrink: 0 }}
                          />
                          <span style={{ fontWeight: sinSelectedScope === scope.key ? 'bold' : 'normal', color: '#1e293b' }}>{scope.emoji} {scope.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </PremiumModal>
      )}

      {/* MODAL DE COMPARACIÓN IA */}
      {showAiModal && aiProposal !== null && (
        <PremiumModal isOpen={true} onClose={closeAiModal} maxWidth="900px" zIndex={10000}>
        <PremiumModalHeader
          title={isAssimilating ? (
            <>
              <span style={{ fontSize: '1.2rem', animation: 'spin 2s linear infinite', display: 'inline-block' }}>⏳</span>
              Asimilando cambios... {assimilationSeconds}s
            </>
          ) : `✨ Revisión IA — ${formData.especiesvegetalesnombre}`}
          onClose={closeAiModal}
          actions={
            !isAssimilating && (
              <>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', padding: '5px 12px', background: 'rgba(255,255,255,0.15)', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, color: 'white', userSelect: 'none' }}>
                  <input
                    type="checkbox"
                    checked={showOnlyDiffs}
                    onChange={(e) => setShowOnlyDiffs(e.target.checked)}
                    style={{ accentColor: '#fbbf24', width: '14px', height: '14px' }}
                  />
                  ⚠️ Ver solo cambios
                </label>
                <button type="button" onClick={assimilateAll} style={{ padding: '6px 16px', borderRadius: '6px', border: 'none', background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem', boxShadow: '0 2px 6px rgba(16,185,129,0.3)', transition: 'all 0.2s' }}>
                  ✅ Asimilar Todos
                </button>
              </>
            )
          }
        />

        <div className="ai-modal-body" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', flex: 1 }}>

              {!showOnlyDiffs ? (
                <>
                  {/* Pestañas del Modal */}
                  <PremiumFormTabs
                    tabs={aiGroups.filter(g => aiConfigTabs[g.id]).map(group => {
                      const hasDiff = group.id === 'asociaciones'
                        ? ((aiProposal.asociaciones_beneficiosas?.length > 0) || (aiProposal.asociaciones_perjudiciales?.length > 0) || (aiProposal.afecciones_asociadas?.length > 0))
                        : group.id === 'sinonimos'
                          ? (aiProposal._sinonimos?.length > 0)
                          : group.id === 'variedades'
                            ? (aiProposal._variedades?.length > 0)
                            : group.keys.some(k => {
                                if (k === 'fases_duracion') {
                                  const phasesList = masterFases.filter((f: any) => f.fasescultivotipo === 'Fase' && f.fasescultivoclave !== 'planificacion');
                                  return phasesList.some((f: any) => {
                                    const fid = f.idfasescultivo.toString();
                                    const currentVal = formData.fases_duracion?.[fid] != null ? String(formData.fases_duracion[fid]) : '';
                                    const aiVal = aiProposal.fases_duracion?.[fid] != null ? String(aiProposal.fases_duracion[fid]) : '';
                                    return aiVal !== '' && currentVal !== aiVal;
                                  });
                                } else {
                                  let currentVal = formData[k] != null ? formData[k] : '';
                                  let aiVal = aiProposal[k] != null ? aiProposal[k] : '';
                                  if (Array.isArray(currentVal)) currentVal = [...currentVal].sort().join(',');
                                  else currentVal = String(currentVal);
                                  if (Array.isArray(aiVal)) aiVal = [...aiVal].sort().join(',');
                                  else aiVal = String(aiVal);
                                  return aiVal !== '' && currentVal !== aiVal;
                                }
                              });
                      return { id: group.id, label: group.title, hasNotification: hasDiff };
                    })}
                    activeTab={aiModalActiveTab}
                    onTabChange={setAiModalActiveTab}
                    style={{ marginBottom: 0, paddingBottom: 0 }}
                  />

                  {/* Contenido de la Pestaña Activa */}
                  {aiGroups.map(group => {
                    if (group.id !== aiModalActiveTab || !aiConfigTabs[group.id]) return null;

                    if (group.id === 'asociaciones') {
                      const hasRels = (aiProposal.asociaciones_beneficiosas?.length > 0 || aiProposal.asociaciones_perjudiciales?.length > 0 || aiProposal.afecciones_asociadas?.length > 0);
                      return (
                        <div key={group.id} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                            <div>
                              <h4 style={{ margin: 0, color: '#334155', fontSize: '0.95rem' }}>Ecosistema de Asociaciones y Plagas</h4>
                              <small style={{ color: '#64748b' }}>Se crearán como especies/plagas inactivas en el catálogo si no existen.</small>
                            </div>
                            <button type="button" className="btn-assimilate-row" style={{ padding: '8px 16px', background: '#e0e7ff', color: '#4338ca', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }} onClick={() => assimilateTab('asociaciones')}>
                              ✨ Asimilar Asociaciones
                            </button>
                          </div>

                          {!hasRels ? (
                            <p style={{ textAlign: 'center', padding: '24px', color: '#94a3b8', fontStyle: 'italic', margin: 0 }}>No hay asociaciones propuestas.</p>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                              {aiProposal.asociaciones_beneficiosas?.length > 0 && (
                                <div>
                                  <h5 style={{ color: '#10b981', margin: '0 0 8px', fontSize: '0.9rem' }}>➕ Beneficiosas</h5>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    {aiProposal.asociaciones_beneficiosas.map((item: any, idx: number) => {
                                      const name = typeof item === 'string' ? item : item?.nombre;
                                      const motivo = typeof item === 'string' ? '' : (item?.motivo || '');
                                      if (!name) return null;
                                      const exists = masterEspecies.some(e => e.especiesvegetalesnombre.toLowerCase().trim() === name.toLowerCase().trim());
                                      const isChecked = selectedRels.ben.some((s: any) => (typeof s === 'string' ? s : s?.nombre) === name);
                                      return (
                                        <label key={`ben_tab_${idx}`} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', cursor: 'pointer' }}>
                                          <input type="checkbox" checked={isChecked} onChange={(e) => {
                                            if (e.target.checked) setSelectedRels(p => ({ ...p, ben: [...p.ben, item] }));
                                            else setSelectedRels(p => ({ ...p, ben: p.ben.filter((n: any) => (typeof n === 'string' ? n : n?.nombre) !== name) }));
                                          }} style={{ accentColor: '#10b981', width: '16px', height: '16px' }} />
                                          <span style={{ fontSize: '0.85rem' }}>{exists ? '✅' : '➕'}</span>
                                          <span style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>{name}</span>
                                          {motivo && <span style={{ color: '#64748b', fontSize: '0.8rem' }}> — {motivo}</span>}
                                          {exists ? <small style={{ color: '#64748b', marginLeft: 'auto' }}>(Existente)</small> : <small style={{ color: '#f59e0b', marginLeft: 'auto' }}>(Se creará inactiva)</small>}
                                        </label>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {aiProposal.asociaciones_perjudiciales?.length > 0 && (
                                <div>
                                  <h5 style={{ color: '#ef4444', margin: '0 0 8px', fontSize: '0.9rem' }}>➖ Perjudiciales</h5>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    {aiProposal.asociaciones_perjudiciales.map((item: any, idx: number) => {
                                      const name = typeof item === 'string' ? item : item?.nombre;
                                      const motivo = typeof item === 'string' ? '' : (item?.motivo || '');
                                      if (!name) return null;
                                      const exists = masterEspecies.some(e => e.especiesvegetalesnombre.toLowerCase().trim() === name.toLowerCase().trim());
                                      const isChecked = selectedRels.per.some((s: any) => (typeof s === 'string' ? s : s?.nombre) === name);
                                      return (
                                        <label key={`per_tab_${idx}`} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', cursor: 'pointer' }}>
                                          <input type="checkbox" checked={isChecked} onChange={(e) => {
                                            if (e.target.checked) setSelectedRels(p => ({ ...p, per: [...p.per, item] }));
                                            else setSelectedRels(p => ({ ...p, per: p.per.filter((n: any) => (typeof n === 'string' ? n : n?.nombre) !== name) }));
                                          }} style={{ accentColor: '#ef4444', width: '16px', height: '16px' }} />
                                          <span style={{ fontSize: '0.85rem' }}>{exists ? '✅' : '➕'}</span>
                                          <span style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>{name}</span>
                                          {motivo && <span style={{ color: '#64748b', fontSize: '0.8rem' }}> — {motivo}</span>}
                                          {exists ? <small style={{ color: '#64748b', marginLeft: 'auto' }}>(Existente)</small> : <small style={{ color: '#f59e0b', marginLeft: 'auto' }}>(Se creará inactiva)</small>}
                                        </label>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {aiProposal.afecciones_asociadas?.length > 0 && (
                                <div>
                                  <h5 style={{ color: '#f97316', margin: '0 0 8px', fontSize: '0.9rem' }}>🐛 Plagas y Enfermedades</h5>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    {aiProposal.afecciones_asociadas.map((item: any, idx: number) => {
                                      const name = typeof item === 'string' ? item : item?.nombre;
                                      const notas = typeof item === 'string' ? '' : (item?.notas || '');
                                      if (!name) return null;
                                      const exists = masterAfecciones.some(p => p.afeccionesnombre.toLowerCase().trim() === name.toLowerCase().trim());
                                      const isChecked = selectedRels.pla.some((s: any) => (typeof s === 'string' ? s : s?.nombre) === name);
                                      return (
                                        <label key={`pla_tab_${idx}`} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', cursor: 'pointer' }}>
                                          <input type="checkbox" checked={isChecked} onChange={(e) => {
                                            if (e.target.checked) setSelectedRels(p => ({ ...p, pla: [...p.pla, item] }));
                                            else setSelectedRels(p => ({ ...p, pla: p.pla.filter((n: any) => (typeof n === 'string' ? n : n?.nombre) !== name) }));
                                          }} style={{ accentColor: '#f97316', width: '16px', height: '16px' }} />
                                          <span style={{ fontSize: '0.85rem' }}>{exists ? '✅' : '➕'}</span>
                                          <span style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>{name}</span>
                                          {notas && <span style={{ color: '#64748b', fontSize: '0.8rem' }}> — {notas}</span>}
                                          {exists ? <small style={{ color: '#64748b', marginLeft: 'auto' }}>(Existente)</small> : <small style={{ color: '#f59e0b', marginLeft: 'auto' }}>(Se creará inactiva)</small>}
                                        </label>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    }

                    if (group.id === 'sinonimos') {
                      const sProps = aiProposal._sinonimos || [];
                      return (
                        <div key={group.id} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                            <div>
                              <h4 style={{ margin: 0, color: '#334155', fontSize: '0.95rem' }}>Sinónimos Propuestos por la IA</h4>
                              <small style={{ color: '#64748b' }}>Los sinónimos asimilados se agregarán a tu lista de sinónimos editable.</small>
                            </div>
                            <button type="button" className="btn-assimilate-row" style={{ padding: '8px 16px', background: '#e0e7ff', color: '#4338ca', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }} onClick={() => assimilateTab('sinonimos')}>
                              ✨ Asimilar Sinónimos
                            </button>
                          </div>

                          {sProps.length === 0 ? (
                            <p style={{ textAlign: 'center', padding: '24px', color: '#94a3b8', fontStyle: 'italic', margin: 0 }}>No hay sinónimos propuestos.</p>
                          ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                              <thead>
                                <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1', textAlign: 'left' }}>
                                  <th style={{ padding: '10px 12px', width: '40px' }}>
                                    <input
                                      type="checkbox"
                                      checked={selectedAiSinonimos.length === sProps.length}
                                      onChange={(e) => {
                                        if (e.target.checked) setSelectedAiSinonimos(sProps.map((_: any, idx: number) => idx));
                                        else setSelectedAiSinonimos([]);
                                      }}
                                      style={{ accentColor: '#7c3aed' }}
                                    />
                                  </th>
                                  <th style={{ padding: '10px 12px' }}>Nombre</th>
                                  <th style={{ padding: '10px 12px' }}>Idioma</th>
                                  <th style={{ padding: '10px 12px' }}>País</th>
                                  <th style={{ padding: '10px 12px' }}>Notas</th>
                                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Acción</th>
                                </tr>
                              </thead>
                              <tbody>
                                {sProps.map((item: any, idx: number) => {
                                  const isChecked = selectedAiSinonimos.includes(idx);
                                  const exists = sinonimos.some(s =>
                                    s.especiessinonimosnombre?.toLowerCase().trim() === item.especiessinonimosnombre?.toLowerCase().trim() &&
                                    String(s.xespeciesvegetalessinonimosidpaises || '') === String(item.xespeciesvegetalessinonimosidpaises || '')
                                  );
                                  const idioma = masterIdiomas.find(i => i.ididiomas.toString() === String(item.xespeciesvegetalessinonimosididiomas || ''));
                                  const pais = masterPaises.find(p => p.idpaises.toString() === String(item.xespeciesvegetalessinonimosidpaises || ''));

                                  return (
                                    <tr key={idx} className="ai-comparison-grid-with-actions" style={{ borderBottom: '1px solid #e2e8f0', background: isChecked ? '#f5f3ff' : 'transparent', opacity: exists ? 0.7 : 1 }}>
                                      <td style={{ padding: '10px 12px' }}>
                                        {!exists && (
                                          <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={(e) => {
                                              if (e.target.checked) setSelectedAiSinonimos(prev => [...prev, idx]);
                                              else setSelectedAiSinonimos(prev => prev.filter(v => v !== idx));
                                            }}
                                            style={{ accentColor: '#7c3aed' }}
                                          />
                                        )}
                                        {exists && <span>✅</span>}
                                      </td>
                                      <td style={{ padding: '10px 12px', fontWeight: 'bold', color: '#1e293b' }}>{item.especiessinonimosnombre}</td>
                                      <td style={{ padding: '10px 12px' }}>{idioma ? idioma.idiomasnombre : <em style={{ color: '#94a3b8' }}>No indicado</em>}</td>
                                      <td style={{ padding: '10px 12px' }}>{pais ? pais.paisesnombre : <em style={{ color: '#94a3b8' }}>General</em>}</td>
                                      <td style={{ padding: '10px 12px', fontStyle: 'italic', color: '#64748b' }}>{item.especiessinonimosnotas || '—'}</td>
                                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                                        {!exists ? (
                                          <button type="button" className="btn-assimilate-row" style={{ padding: '4px 10px', background: '#e0e7ff', color: '#4338ca', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, fontSize: '0.75rem' }} onClick={async () => {
                                            await runWithAssimilationLoading(async () => {
                                              try {
                                                await fetch(`/api/admin/especiesvegetales/${especieId}/sinonimos`, {
                                                  method: 'POST',
                                                  headers: { 'Content-Type': 'application/json' },
                                                  body: JSON.stringify(item)
                                                });
                                                if (especieId) {
                                                  await loadSinonimos(especieId);
                                                }
                                              } catch (err) {
                                                console.error(err);
                                              }
                                            });
                                          }}>
                                            Agregar
                                          </button>
                                        ) : (
                                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Incluido</span>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          )}
                        </div>
                      );
                    }

                    if (group.id === 'variedades') {
                      const vProps = aiProposal._variedades || [];
                      return (
                        <div key={group.id} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                            <div>
                              <h4 style={{ margin: 0, color: '#334155', fontSize: '0.95rem' }}>Variedades Propuestas por la IA</h4>
                              <small style={{ color: '#64748b' }}>Las variedades asimiladas se guardan de inmediato en la base de datos.</small>
                            </div>
                            <button type="button" className="btn-assimilate-row" style={{ padding: '8px 16px', background: '#e0e7ff', color: '#4338ca', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }} onClick={() => assimilateTab('variedades')}>
                              ✨ Asimilar Variedades
                            </button>
                          </div>

                          {vProps.length === 0 ? (
                            <p style={{ textAlign: 'center', padding: '24px', color: '#94a3b8', fontStyle: 'italic', margin: 0 }}>No hay variedades propuestas.</p>
                          ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                              <thead>
                                <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1', textAlign: 'left' }}>
                                  <th style={{ padding: '10px 12px', width: '40px' }}>
                                    <input
                                      type="checkbox"
                                      checked={selectedAiVariedades.length === vProps.length}
                                      onChange={(e) => {
                                        if (e.target.checked) setSelectedAiVariedades(vProps.map((_: any, idx: number) => idx));
                                        else setSelectedAiVariedades([]);
                                      }}
                                      style={{ accentColor: '#7c3aed' }}
                                    />
                                  </th>
                                  <th style={{ padding: '10px 12px' }}>Nombre</th>
                                  <th style={{ padding: '10px 12px' }}>Tamaño</th>
                                  <th style={{ padding: '10px 12px' }}>Germinación</th>
                                  <th style={{ padding: '10px 12px' }}>Color</th>
                                  <th style={{ padding: '10px 12px' }}>Descripción</th>
                                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Acción</th>
                                </tr>
                              </thead>
                              <tbody>
                                {vProps.map((item: any, idx: number) => {
                                  const isChecked = selectedAiVariedades.includes(idx);
                                  const isAlreadyInDb = existingVarieties.some(ev => ev.variedadesvegetalesnombre?.toLowerCase().trim() === item.variedadesvegetalesnombre?.toLowerCase().trim());
                                  const isAddedNow = assimilatedVarietyNames.includes(item.variedadesvegetalesnombre);
                                  const isAdded = isAlreadyInDb || isAddedNow;

                                  return (
                                    <tr key={idx} className="ai-comparison-grid-with-actions" style={{ borderBottom: '1px solid #e2e8f0', background: isChecked ? '#f5f3ff' : 'transparent', opacity: isAdded ? 0.7 : 1 }}>
                                      <td style={{ padding: '10px 12px' }}>
                                        {!isAdded && (
                                          <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={(e) => {
                                              if (e.target.checked) setSelectedAiVariedades(prev => [...prev, idx]);
                                              else setSelectedAiVariedades(prev => prev.filter(v => v !== idx));
                                            }}
                                            style={{ accentColor: '#7c3aed' }}
                                          />
                                        )}
                                        {isAdded && <span>✅</span>}
                                      </td>
                                      <td style={{ padding: '10px 12px', fontWeight: 'bold', color: '#1e293b' }}>
                                        {item.variedadesvegetalesnombre}
                                        {isAlreadyInDb && <span style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 'normal', marginLeft: '8px' }}>(Ya integrada)</span>}
                                        {isAddedNow && <span style={{ color: '#10b981', fontSize: '0.75rem', fontWeight: 'normal', marginLeft: '8px' }}>(Agregada ahora)</span>}
                                      </td>
                                      <td style={{ padding: '10px 12px', textTransform: 'capitalize' }}>{item.variedadestamano || 'mediano'}</td>
                                      <td style={{ padding: '10px 12px' }}>{item.variedadesdiasgerminacion ? `${item.variedadesdiasgerminacion} días` : '—'}</td>
                                      <td style={{ padding: '10px 12px' }}>{item.variedadescolor || '—'}</td>
                                      <td style={{ padding: '10px 12px', color: '#64748b' }}>{item.variedadesdescripcion || '—'}</td>
                                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                                        {!isAdded ? (
                                          <button type="button" className="btn-assimilate-row" style={{ padding: '4px 10px', background: '#e0e7ff', color: '#4338ca', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, fontSize: '0.75rem' }} onClick={async () => {
                                            await runWithAssimilationLoading(async () => {
                                              try {
                                                const res = await fetch('/api/admin/variedadesvegetales', {
                                                  method: 'POST',
                                                  headers: {
                                                    'Content-Type': 'application/json',
                                                    'x-user-email': userEmail || ''
                                                  },
                                                  body: JSON.stringify({
                                                    variedadesvegetalesnombre: item.variedadesvegetalesnombre,
                                                    xvariedadesvegetalesidespeciesvegetales: especieId,
                                                    variedadestamano: item.variedadestamano || 'mediano',
                                                    variedadesdiasgerminacion: item.variedadesdiasgerminacion || null,
                                                    variedadescolor: item.variedadescolor || null,
                                                    variedadesdescripcion: item.variedadesdescripcion || null,
                                                    variedadesvegetalesvisibilidadsino: 1
                                                  })
                                                });
                                                const data = await res.json();
                                                if (data.success) {
                                                  setAssimilatedVarietyNames(prev => [...prev, item.variedadesvegetalesnombre]);
                                                  if (especieId) await loadExistingVarieties(especieId);
                                                }
                                              } catch (err) {
                                                console.error(err);
                                              }
                                            });
                                          }}>
                                            Agregar
                                          </button>
                                        ) : (
                                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{isAlreadyInDb ? 'Integrada' : 'Agregado'}</span>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          )}
                        </div>
                      );
                    }

                    if (group.id === 'alimentacion') {
                      const cProps = aiProposal._alimentacion || [];
                      return (
                        <div key={group.id} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                            <div>
                              <h4 style={{ margin: 0, color: '#334155', fontSize: '0.95rem' }}>Usos y Consumo Propuestos</h4>
                              <small style={{ color: '#64748b' }}>Los cambios asimilados se guardan de inmediato en la base de datos.</small>
                            </div>
                            <button type="button" className="btn-assimilate-row" style={{ padding: '8px 16px', background: '#e0e7ff', color: '#4338ca', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }} onClick={() => assimilateTab('alimentacion')}>
                              ✨ Asimilar Alimentacion
                            </button>
                          </div>

                          {cProps.length === 0 ? (
                            <p style={{ textAlign: 'center', padding: '24px', color: '#94a3b8', fontStyle: 'italic', margin: 0 }}>No hay alimentacion propuestos.</p>
                          ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                              <thead>
                                <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1', textAlign: 'left' }}>
                                  <th style={{ padding: '10px 12px', width: '40px' }}>
                                    <input
                                      type="checkbox"
                                      checked={selectedAiAlimentacion.length === cProps.length && cProps.length > 0}
                                      onChange={(e) => {
                                        if (e.target.checked) setSelectedAiAlimentacion(cProps.map((_: any, idx: number) => idx));
                                        else setSelectedAiAlimentacion([]);
                                      }}
                                      style={{ accentColor: '#7c3aed' }}
                                    />
                                  </th>
                                  <th style={{ padding: '10px 12px' }}>Animal</th>
                                  <th style={{ padding: '10px 12px' }}>¿Apto?</th>
                                  <th style={{ padding: '10px 12px' }}>Partes</th>
                                  <th style={{ padding: '10px 12px' }}>Notas</th>
                                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Acción</th>
                                </tr>
                              </thead>
                              <tbody>
                                {cProps.map((item: any, idx: number) => {
                                  const isChecked = selectedAiAlimentacion.includes(idx);
                                  const animalName = masterAnimales.find(c => c.idespeciesanimales.toString() === String(item.idespeciesanimales))?.especiesanimalesnombre || 'Desconocido';
                                  
                                  const targetParte = (item.parte || item.partes || '').trim();
                                  const targetAptoNum = item.apto === 'apto' ? 1 : (item.apto === 'con_moderacion' ? 2 : 0);
                                  const matched = alimentacion.find(o => 
                                    String(o.xespeciesvegetalesanimalesidespeciesanimales) === String(item.idespeciesanimales) &&
                                    (o.especiesanimalespartes || '').trim().toLowerCase() === targetParte.toLowerCase()
                                  );
                                  const isDifferent = !matched || 
                                    matched.especiesanimalesesapto !== targetAptoNum || 
                                    (matched.especiesanimalesnotas || '') !== (item.notas || '');

                                  return (
                                    <tr key={idx} className="ai-comparison-grid-with-actions" style={{ borderBottom: '1px solid #e2e8f0', background: isChecked ? '#f5f3ff' : 'transparent', opacity: !isDifferent ? 0.7 : 1 }}>
                                      <td style={{ padding: '10px 12px' }}>
                                        {isDifferent && (
                                          <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={(e) => {
                                              if (e.target.checked) setSelectedAiAlimentacion(prev => [...prev, idx]);
                                              else setSelectedAiAlimentacion(prev => prev.filter(v => v !== idx));
                                            }}
                                            style={{ accentColor: '#7c3aed' }}
                                          />
                                        )}
                                      </td>
                                      <td style={{ padding: '10px 12px', fontWeight: 'bold', color: '#1e293b' }}>{animalName}</td>
                                      <td style={{ padding: '10px 12px' }}>
                                        {targetAptoNum === 1 ? (
                                          <span style={{ color: '#10b981', fontWeight: 'bold' }}>🟢 Apto</span>
                                        ) : targetAptoNum === 2 ? (
                                          <span style={{ color: '#d97706', fontWeight: 'bold' }}>🟡 Con moderación</span>
                                        ) : (
                                          <span style={{ color: '#ef4444', fontWeight: 'bold' }}>🔴 No apto</span>
                                        )}
                                      </td>
                                      <td style={{ padding: '10px 12px' }}>{targetParte || '—'}</td>
                                      <td style={{ padding: '10px 12px', color: '#64748b' }}>{item.notas || '-'}</td>
                                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                                        {isDifferent ? (
                                          <button type="button" className="btn-assimilate-row" style={{ padding: '4px 10px', background: '#e0e7ff', color: '#4338ca', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, fontSize: '0.75rem' }} onClick={async () => {
                                            await runWithAssimilationLoading(async () => {
                                              try {
                                                const nextAlimentacion = [...alimentacion];
                                                const idAnimal = String(item.idespeciesanimales);
                                                const targetParteId = await resolvePlantasParteId(targetParte);
                                                const baseName = normalizePlantaParteNombre(targetParte);
                                                let updatedNotas = item.notas || '';
                                                if (targetParte.toLowerCase() !== baseName.toLowerCase()) {
                                                  const prefix = `${targetParte}: `;
                                                  if (!updatedNotas.startsWith(prefix)) {
                                                    updatedNotas = prefix + updatedNotas;
                                                  }
                                                }
                                                const existingIdx = nextAlimentacion.findIndex(c => String(c.xespeciesvegetalesanimalesidespeciesanimales) === idAnimal && normalizePlantaParteNombre(c.especiesanimalespartes || '') === baseName);
                                                const payload = {
                                                   xespeciesvegetalesanimalesidespeciesvegetales: especieId,
                                                   xespeciesvegetalesanimalesidespeciesanimales: idAnimal,
                                                   especiesanimalesesapto: targetAptoNum,
                                                   xespeciesvegetalesanimalesidplantasparte: targetParteId,
                                                   especiesanimalespartes: baseName,
                                                   especiesanimalesnotas: updatedNotas
                                                 };
                                                if (existingIdx !== -1) {
                                                  nextAlimentacion[existingIdx] = { ...nextAlimentacion[existingIdx], ...payload };
                                                } else {
                                                  nextAlimentacion.push(payload as any);
                                                }

                                                await fetch(`/api/admin/especiesvegetales/${especieId}/animales`, {
                                                  method: 'PUT',
                                                  headers: {
                                                    'Content-Type': 'application/json',
                                                    'x-user-email': userEmail || ''
                                                  },
                                                  body: JSON.stringify({ alimentacion: nextAlimentacion })
                                                });
                                                if (especieId) await loadAlimentacion(especieId);
                                              } catch (err) {
                                                console.error(err);
                                              }
                                            });
                                          }}>
                                            Aplicar
                                          </button>
                                        ) : (
                                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Actualizado</span>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          )}
                        </div>
                      );
                    }

                    if (group.id === 'pautas') {
                      const pProps = aiProposal._pautas || [];
                      const faseLabels: Record<string, string> = {
                        planificado: '1. Pre-siembra', siembra: '2. Siembra', postsiembra: '3. Post-siembra',
                        germinacion: '4. Germinación', semillero: '5. Semillero', trasplante: '6. Trasplante',
                        enraizamiento: '7. Posplantación', crecimiento: '8. Crecimiento', floracion: '9. Floración',
                        cosecha: '10. Cosecha', finalizado: '11. Finalizado', general: '🌍 General',
                        pregerminacion: '3. Pre-germinación', postgerminacion: '5. Post-germinación',
                        creacion: '0. Creación', planificacion: '1. Planificación', adquisicion: '2. Adquisición',
                        hitoplanton: '6. Plantón'
                      };
                      return (
                        <div key={group.id} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                            <div>
                              <h4 style={{ margin: 0, color: '#334155', fontSize: '0.95rem' }}>Pautas de Labores Propuestas</h4>
                              <small style={{ color: '#64748b' }}>Las pautas asimiladas se guardan de inmediato en la base de datos.</small>
                            </div>
                            <button type="button" className="btn-assimilate-row" style={{ padding: '8px 16px', background: '#e0e7ff', color: '#4338ca', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }} onClick={async () => {
                              await runWithAssimilationLoading(async () => {
                                for (const pauta of pProps) {
                                  if (!pauta.selected) continue;
                                  const isExisting = pautas.some((p: any) => p.xlaborespautaidlabores == pauta.id_labor && p.laborespautafase === pauta.fase);
                                  if (isExisting) continue;
                                  try {
                                    await fetch(`/api/admin/especiesvegetales/${especieId}/pautas`, {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail || '' },
                                      body: JSON.stringify({
                                        xlaborespautaidlabores: pauta.id_labor,
                                        laborespautafase: pauta.fase,
                                        laborespautafrecuenciadias: pauta.frecuencia || '',
                                        laborespautaoffset: pauta.offset || 0,
                                        laborespautanotasia: pauta.notas_ia || '',
                                        laborespautaactivosino: 1
                                      })
                                    });
                                  } catch (err) { console.error(err); }
                                }
                                if (especieId) await loadPautas(especieId);
                              });
                            }}>
                              ✨ Asimilar Labores
                            </button>
                          </div>

                          {pProps.length === 0 ? (
                            <p style={{ textAlign: 'center', padding: '24px', color: '#94a3b8', fontStyle: 'italic', margin: 0 }}>No hay pautas propuestas.</p>
                          ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                              <thead>
                                <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #e2e8f0' }}>
                                  <th style={{ padding: '10px 12px', textAlign: 'center', width: '50px' }}>✓</th>
                                  <th style={{ padding: '10px 12px', textAlign: 'left' }}>Labor</th>
                                  <th style={{ padding: '10px 12px', textAlign: 'left' }}>Fase</th>
                                  <th style={{ padding: '10px 12px', textAlign: 'center' }}>Frecuencia</th>
                                  <th style={{ padding: '10px 12px', textAlign: 'left' }}>Notas IA</th>
                                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Acción</th>
                                </tr>
                              </thead>
                              <tbody>
                                {pProps.map((item: any, idx: number) => {
                                  const isExisting = pautas.some((p: any) => p.xlaborespautaidlabores == item.id_labor && p.laborespautafase === item.fase);
                                  const laborDef = masterLabores.find((l: any) => l.idlabores == item.id_labor);
                                  return (
                                    <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', background: item.selected ? '#f5f3ff' : 'transparent', opacity: isExisting ? 0.7 : 1 }}>
                                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                        {!isExisting ? (
                                          <input
                                            type="checkbox"
                                            checked={item.selected}
                                            onChange={(e) => {
                                              const updated = { ...aiProposal };
                                              updated._pautas = [...updated._pautas];
                                              updated._pautas[idx] = { ...updated._pautas[idx], selected: e.target.checked };
                                              setAiProposal(updated);
                                            }}
                                            style={{ accentColor: '#7c3aed' }}
                                          />
                                        ) : <span>✅</span>}
                                      </td>
                                      <td style={{ padding: '10px 12px', fontWeight: 'bold', color: '#1e293b' }}>{laborDef ? laborDef.laboresnombre : `Labor #${item.id_labor}`}</td>
                                      <td style={{ padding: '10px 12px' }}>
                                        <span style={{ background: '#e0e7ff', color: '#4338ca', padding: '2px 8px', borderRadius: '4px', fontWeight: 600, fontSize: '0.78rem' }}>
                                          {faseLabels[item.fase] || item.fase}
                                        </span>
                                      </td>
                                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                        <span style={{ background: '#fef3c7', color: '#b45309', padding: '2px 8px', borderRadius: '4px', fontWeight: 600, fontSize: '0.78rem' }}>
                                          {item.frecuencia ? `Cada ${item.frecuencia}d` : 'Puntual'}
                                        </span>
                                      </td>
                                      <td style={{ padding: '10px 12px', fontStyle: 'italic', color: '#64748b', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.notas_ia || '—'}</td>
                                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                                        {!isExisting ? (
                                          <button type="button" className="btn-assimilate-row" style={{ padding: '4px 10px', background: '#e0e7ff', color: '#4338ca', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, fontSize: '0.75rem' }} onClick={async () => {
                                            await runWithAssimilationLoading(async () => {
                                              try {
                                                await fetch(`/api/admin/especiesvegetales/${especieId}/pautas`, {
                                                  method: 'POST',
                                                  headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail || '' },
                                                  body: JSON.stringify({
                                                    xlaborespautaidlabores: item.id_labor,
                                                    laborespautafase: item.fase,
                                                    laborespautafrecuenciadias: item.frecuencia || '',
                                                    laborespautaoffset: item.offset || 0,
                                                    laborespautanotasia: item.notas_ia || '',
                                                    laborespautaactivosino: 1
                                                  })
                                                });
                                                if (especieId) await loadPautas(especieId);
                                              } catch (err) { console.error(err); }
                                            });
                                          }}>
                                            Agregar
                                          </button>
                                        ) : (
                                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Incluida</span>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          )}
                        </div>
                      );
                    }

                    return (
                      <div key={group.id} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '8px' }}>
                          <div>
                            <h4 style={{ margin: 0, color: '#334155', fontSize: '0.95rem' }}>{group.title}</h4>
                            <small style={{ color: '#64748b' }}>Marca los checkboxes individuales de cada campo o asimila todo este bloque.</small>
                          </div>
                          <button type="button" className="btn-assimilate-row" style={{ padding: '8px 16px', background: '#e0e7ff', color: '#4338ca', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }} onClick={() => assimilateTab(group.id)}>
                            ✨ Asimilar Pestaña
                          </button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '80px 180px 1fr 1fr', gap: '10px', background: '#f1f5f9', padding: '10px 16px', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.8rem', color: '#475569' }}>
                          <div>Incluir</div>
                          <div>Campo</div>
                          <div>Valor Actual</div>
                          <div>Propuesta IA</div>
                        </div>

                        {group.keys.map(k => {
                          if (k === 'fases_duracion') {
                            const phasesList = masterFases.filter((f: any) => f.fasescultivotipo === 'Fase' && f.fasescultivoclave !== 'planificacion');
                            return phasesList.map((f: any) => {
                              const fid = f.idfasescultivo.toString();
                              const vKey = `fase_${fid}`;
                              const currentVal = formData.fases_duracion?.[fid] != null ? String(formData.fases_duracion[fid]) : '';
                              const aiVal = aiProposal.fases_duracion?.[fid] != null ? String(aiProposal.fases_duracion[fid]) : '';

                              if (aiVal === '') return null;
                              const isDifferent = currentVal !== aiVal;
                              const isChecked = !!selectedAiFields[vKey];

                              return (
                                <div key={vKey} className="ai-comparison-grid-with-actions" style={{ display: 'grid', gridTemplateColumns: '80px 180px 1fr 1fr', gap: '10px', padding: '10px 16px', borderBottom: '1px solid #e2e8f0', background: isChecked ? '#f5f3ff' : 'transparent', borderLeft: isDifferent ? '4px solid #8b5cf6' : '4px solid transparent', alignItems: 'center', fontSize: '0.85rem' }}>
                                  <div>
                                    {isDifferent ? (
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={(e) => setSelectedAiFields(prev => ({ ...prev, [vKey]: e.target.checked }))}
                                        style={{ accentColor: '#7c3aed', width: '16px', height: '16px' }}
                                      />
                                    ) : (
                                      <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>—</span>
                                    )}
                                  </div>
                                  <div style={{ fontWeight: 600, color: '#334155' }}>⏱ {f.fasescultivonombre}</div>
                                  <div style={{ color: '#64748b' }}>{currentVal ? `${currentVal} días` : <em style={{ opacity: 0.5 }}>No config.</em>}</div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span className={isDifferent ? 'ai-value-changed' : ''} style={{ fontWeight: isDifferent ? 'bold' : 'normal', color: isDifferent ? '#7c3aed' : '#334155' }}>
                                      {aiVal} días {isDifferent && ' ✨'}
                                    </span>
                                    {isDifferent && (
                                      <button type="button" className="btn-assimilate-row" style={{ marginLeft: 'auto', padding: '2px 8px', background: '#f5f3ff', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }} onClick={() => assimilateSinglePhase(fid, aiProposal.fases_duracion[fid])}>
                                        Aplicar
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            });
                          }

                          const rawCurrent = formData[k];
                          const rawAi = aiProposal[k];
                          
                          let currentStr = Array.isArray(rawCurrent) ? [...rawCurrent].sort().join(',') : (rawCurrent != null ? String(rawCurrent) : '');
                          let aiStr = Array.isArray(rawAi) ? [...rawAi].sort().join(',') : (rawAi != null ? String(rawAi) : '');
                          
                          if (!Array.isArray(rawCurrent) && !isNaN(Number(rawCurrent)) && rawCurrent !== '' && rawCurrent != null) {
                            currentStr = parseFloat(String(rawCurrent)).toString();
                          }
                          if (!Array.isArray(rawAi) && !isNaN(Number(rawAi)) && rawAi !== '' && rawAi != null) {
                            aiStr = parseFloat(String(rawAi)).toString();
                          }

                          if (aiStr === '') return null;

                          const isDifferent = currentStr !== aiStr;
                          const displayCurrent = Array.isArray(rawCurrent) ? rawCurrent.join(', ') : currentStr;
                          const displayAi = Array.isArray(rawAi) ? rawAi.join(', ') : aiStr;
                          const isChecked = !!selectedAiFields[k];

                          return (
                            <div key={k} className="ai-comparison-grid-with-actions" style={{ display: 'grid', gridTemplateColumns: '80px 180px 1fr 1fr', gap: '10px', padding: '10px 16px', borderBottom: '1px solid #e2e8f0', background: isChecked ? '#f5f3ff' : 'transparent', borderLeft: isDifferent ? '4px solid #8b5cf6' : '4px solid transparent', alignItems: 'center', fontSize: '0.85rem' }}>
                              <div>
                                {isDifferent ? (
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={(e) => setSelectedAiFields(prev => ({ ...prev, [k]: e.target.checked }))}
                                    style={{ accentColor: '#7c3aed', width: '16px', height: '16px' }}
                                  />
                                ) : (
                                  <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>—</span>
                                )}
                              </div>
                              <div style={{ fontWeight: 600, color: '#334155' }}>{(group.labels as any)[k]}</div>
                              <div style={{ color: '#64748b', whiteSpace: 'pre-line', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                                {displayCurrent || <em style={{ opacity: 0.5 }}>Vacío</em>}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                <span className={isDifferent ? 'ai-value-changed' : ''} style={{ fontWeight: isDifferent ? 'bold' : 'normal', color: isDifferent ? '#7c3aed' : '#334155', whiteSpace: 'pre-line', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                                  {displayAi} {isDifferent && ' ✨'}
                                </span>
                                {isDifferent && (
                                  <button type="button" className="btn-assimilate-row" style={{ marginLeft: 'auto', padding: '2px 8px', background: '#f5f3ff', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', flexShrink: 0 }} onClick={() => assimilateSingleField(k, rawAi)}>
                                    Aplicar
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Vista continua de diferencias agrupada por pestañas */}
                  {(() => {
                    const groupsWithChanges: React.ReactNode[] = [];

                    // 1. Core Fields Groups
                    aiGroups.forEach(group => {
                      if (!aiConfigTabs[group.id]) return;
                      if (group.id === 'asociaciones' || group.id === 'sinonimos' || group.id === 'variedades' || group.id === 'alimentacion') return;

                      const fieldElements: React.ReactNode[] = [];

                      group.keys.forEach(k => {
                        if (k === 'fases_duracion') {
                          const phasesList = masterFases.filter((f: any) => f.fasescultivotipo === 'Fase' && f.fasescultivoclave !== 'planificacion');
                          phasesList.forEach((f: any) => {
                            const fid = f.idfasescultivo.toString();
                            const vKey = `fase_${fid}`;
                            const currentVal = formData.fases_duracion?.[fid] != null ? String(formData.fases_duracion[fid]) : '';
                            const aiVal = aiProposal.fases_duracion?.[fid] != null ? String(aiProposal.fases_duracion[fid]) : '';

                            if (aiVal === '') return;
                            const isDifferent = currentVal !== aiVal;
                            if (!isDifferent) return;
                            const isChecked = !!selectedAiFields[vKey];

                            fieldElements.push(
                              <div key={vKey} className="ai-comparison-grid-with-actions" style={{ display: 'grid', gridTemplateColumns: '80px 180px 1fr 1fr', gap: '10px', padding: '10px 16px', borderBottom: '1px solid #e2e8f0', background: isChecked ? '#f5f3ff' : 'transparent', borderLeft: '4px solid #8b5cf6', alignItems: 'center', fontSize: '0.85rem' }}>
                                <div>
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={(e) => setSelectedAiFields(prev => ({ ...prev, [vKey]: e.target.checked }))}
                                    style={{ accentColor: '#7c3aed', width: '16px', height: '16px' }}
                                  />
                                </div>
                                <div style={{ fontWeight: 600, color: '#334155' }}>⏱ {f.fasescultivonombre}</div>
                                <div style={{ color: '#64748b' }}>{currentVal ? `${currentVal} días` : <em style={{ opacity: 0.5 }}>No config.</em>}</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span className="ai-value-changed" style={{ fontWeight: 'bold', color: '#7c3aed' }}>
                                    {aiVal} días ✨
                                  </span>
                                  <button type="button" className="btn-assimilate-row" style={{ marginLeft: 'auto', padding: '2px 8px', background: '#f5f3ff', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }} onClick={() => assimilateSinglePhase(fid, aiProposal.fases_duracion[fid])}>
                                    Aplicar
                                  </button>
                                </div>
                              </div>
                            );
                          });
                        } else {
                          const rawCurrent = formData[k];
                          const rawAi = aiProposal[k];
                          let currentStr = Array.isArray(rawCurrent) ? [...rawCurrent].sort().join(',') : (rawCurrent != null ? String(rawCurrent) : '');
                          let aiStr = Array.isArray(rawAi) ? [...rawAi].sort().join(',') : (rawAi != null ? String(rawAi) : '');

                          if (!Array.isArray(rawCurrent) && !isNaN(Number(rawCurrent)) && rawCurrent !== '' && rawCurrent != null) {
                            currentStr = parseFloat(String(rawCurrent)).toString();
                          }
                          if (!Array.isArray(rawAi) && !isNaN(Number(rawAi)) && rawAi !== '' && rawAi != null) {
                            aiStr = parseFloat(String(rawAi)).toString();
                          }

                          if (aiStr === '') return;
                          const isDifferent = currentStr !== aiStr;
                          if (!isDifferent) return;
                          const isChecked = !!selectedAiFields[k];
                          const displayCurrent = Array.isArray(rawCurrent) ? rawCurrent.join(', ') : currentStr;
                          const displayAi = Array.isArray(rawAi) ? rawAi.join(', ') : aiStr;

                          fieldElements.push(
                            <div key={k} className="ai-comparison-grid-with-actions" style={{ display: 'grid', gridTemplateColumns: '80px 180px 1fr 1fr', gap: '10px', padding: '10px 16px', borderBottom: '1px solid #e2e8f0', background: isChecked ? '#f5f3ff' : 'transparent', borderLeft: '4px solid #8b5cf6', alignItems: 'center', fontSize: '0.85rem' }}>
                              <div>
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => setSelectedAiFields(prev => ({ ...prev, [k]: e.target.checked }))}
                                  style={{ accentColor: '#7c3aed', width: '16px', height: '16px' }}
                                />
                              </div>
                              <div style={{ fontWeight: 600, color: '#334155' }}>{(group.labels as any)[k]}</div>
                              <div style={{ color: '#64748b', whiteSpace: 'pre-line', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                                {displayCurrent || <em style={{ opacity: 0.5 }}>Vacío</em>}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                <span className="ai-value-changed" style={{ fontWeight: 'bold', color: '#7c3aed', whiteSpace: 'pre-line', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                                  {displayAi} ✨
                                </span>
                                <button type="button" className="btn-assimilate-row" style={{ marginLeft: 'auto', padding: '2px 8px', background: '#f5f3ff', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', flexShrink: 0 }} onClick={() => assimilateSingleField(k, rawAi)}>
                                  Aplicar
                                </button>
                              </div>
                            </div>
                          );
                        }
                      });

                      if (fieldElements.length > 0) {
                        const isCollapsed = !!collapsedAiGroups[group.id];
                        groupsWithChanges.push(
                          <div key={group.id} style={{ border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden', background: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                            <div 
                              onClick={() => setCollapsedAiGroups(prev => ({ ...prev, [group.id]: !prev[group.id] }))}
                              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#f1f5f9', cursor: 'pointer', userSelect: 'none', borderBottom: isCollapsed ? 'none' : '1px solid #cbd5e1' }}
                            >
                              <span style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span>{group.title}</span>
                              </span>
                              <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 'bold' }}>
                                {isCollapsed ? '➕ Mostrar' : '➖ Ocultar'}
                              </span>
                            </div>
                            <div style={{ display: isCollapsed ? 'none' : 'block' }}>
                              <div style={{ display: 'grid', gridTemplateColumns: '80px 180px 1fr 1fr', gap: '10px', background: '#f8fafc', padding: '10px 16px', borderBottom: '1px solid #e2e8f0', fontWeight: 'bold', fontSize: '0.8rem', color: '#475569' }}>
                                <div>Incluir</div>
                                <div>Campo</div>
                                <div>Valor Actual</div>
                                <div>Propuesta IA</div>
                              </div>
                              {fieldElements}
                            </div>
                          </div>
                        );
                      }
                    });

                    // 2. Associations Group
                    if (aiConfigTabs.asociaciones) {
                      const benNames = aiProposal.asociaciones_beneficiosas || [];
                      const perNames = aiProposal.asociaciones_perjudiciales || [];
                      const plaNames = aiProposal.afecciones_asociadas || [];

                      const filteredBen = benNames.filter((item: any) => {
                        const name = typeof item === 'string' ? item : item?.nombre;
                        return !relaciones.beneficiosas.some(b => b.especie_destino_nombre?.toLowerCase().trim() === name.toLowerCase().trim());
                      });
                      const filteredPer = perNames.filter((item: any) => {
                        const name = typeof item === 'string' ? item : item?.nombre;
                        return !relaciones.perjudiciales.some(p => p.especie_destino_nombre?.toLowerCase().trim() === name.toLowerCase().trim());
                      });
                      const filteredPla = plaNames.filter((item: any) => {
                        const name = typeof item === 'string' ? item : item?.nombre;
                        return !relaciones.afecciones.some(p => p.afeccionesnombre?.toLowerCase().trim() === name.toLowerCase().trim());
                      });

                      const hasNewRels = filteredBen.length > 0 || filteredPer.length > 0 || filteredPla.length > 0;
                      if (hasNewRels) {
                        const isCollapsed = !!collapsedAiGroups.asociaciones;
                        groupsWithChanges.push(
                          <div key="asociaciones" style={{ border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden', background: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                            <div 
                              onClick={() => setCollapsedAiGroups(prev => ({ ...prev, asociaciones: !prev.asociaciones }))}
                              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#f1f5f9', cursor: 'pointer', userSelect: 'none', borderBottom: isCollapsed ? 'none' : '1px solid #cbd5e1' }}
                            >
                              <span style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span>🤝 Asociaciones</span>
                              </span>
                              <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 'bold' }}>
                                {isCollapsed ? '➕ Mostrar' : '➖ Ocultar'}
                              </span>
                            </div>
                            <div style={{ display: isCollapsed ? 'none' : 'block', padding: '16px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '12px' }}>
                                <div>
                                  <h4 style={{ margin: 0, color: '#334155', fontSize: '0.95rem' }}>🤝 Nuevas Asociaciones y Plagas propuestas</h4>
                                  <small style={{ color: '#64748b' }}>Se agregarán a las relaciones de la especie al asimilar.</small>
                                </div>
                                <button type="button" className="btn-assimilate-row" style={{ padding: '8px 16px', background: '#e0e7ff', color: '#4338ca', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }} onClick={() => assimilateTab('asociaciones')}>
                                  ✨ Asimilar Ecosistema
                                </button>
                              </div>

                              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingLeft: '16px' }}>
                                {filteredBen.length > 0 && (
                                  <div>
                                    <h5 style={{ color: '#10b981', margin: '0 0 6px', fontSize: '0.85rem' }}>➕ Beneficiosas</h5>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                      {filteredBen.map((item: any, idx: number) => {
                                        const name = typeof item === 'string' ? item : item?.nombre;
                                        const motivo = typeof item === 'string' ? '' : (item?.motivo || '');
                                        const exists = masterEspecies.some(e => e.especiesvegetalesnombre.toLowerCase().trim() === name.toLowerCase().trim());
                                        const isChecked = selectedRels.ben.some((s: any) => (typeof s === 'string' ? s : s?.nombre) === name);
                                        return (
                                          <label key={`ben_diff_${idx}`} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', cursor: 'pointer' }}>
                                            <input type="checkbox" checked={isChecked} onChange={(e) => {
                                              if (e.target.checked) setSelectedRels(p => ({ ...p, ben: [...p.ben, item] }));
                                              else setSelectedRels(p => ({ ...p, ben: p.ben.filter((n: any) => (typeof n === 'string' ? n : n?.nombre) !== name) }));
                                            }} style={{ accentColor: '#10b981', width: '16px', height: '16px' }} />
                                            <span style={{ fontSize: '0.85rem' }}>{exists ? '✅' : '➕'}</span>
                                            <span style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>{name}</span>
                                            {motivo && <span style={{ color: '#64748b', fontSize: '0.8rem' }}> — {motivo}</span>}
                                          </label>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}

                                {filteredPer.length > 0 && (
                                  <div style={{ marginTop: '8px' }}>
                                    <h5 style={{ color: '#ef4444', margin: '0 0 6px', fontSize: '0.85rem' }}>➖ Perjudiciales</h5>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                      {filteredPer.map((item: any, idx: number) => {
                                        const name = typeof item === 'string' ? item : item?.nombre;
                                        const motivo = typeof item === 'string' ? '' : (item?.motivo || '');
                                        const exists = masterEspecies.some(e => e.especiesvegetalesnombre.toLowerCase().trim() === name.toLowerCase().trim());
                                        const isChecked = selectedRels.per.some((s: any) => (typeof s === 'string' ? s : s?.nombre) === name);
                                        return (
                                          <label key={`per_diff_${idx}`} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', cursor: 'pointer' }}>
                                            <input type="checkbox" checked={isChecked} onChange={(e) => {
                                              if (e.target.checked) setSelectedRels(p => ({ ...p, per: [...p.per, item] }));
                                              else setSelectedRels(p => ({ ...p, per: p.per.filter((n: any) => (typeof n === 'string' ? n : n?.nombre) !== name) }));
                                            }} style={{ accentColor: '#ef4444', width: '16px', height: '16px' }} />
                                            <span style={{ fontSize: '0.85rem' }}>{exists ? '✅' : '➕'}</span>
                                            <span style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>{name}</span>
                                            {motivo && <span style={{ color: '#64748b', fontSize: '0.8rem' }}> — {motivo}</span>}
                                          </label>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}

                                {filteredPla.length > 0 && (
                                  <div style={{ marginTop: '8px' }}>
                                    <h5 style={{ color: '#f97316', margin: '0 0 6px', fontSize: '0.85rem' }}>🐛 Plagas y Enfermedades</h5>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                      {filteredPla.map((item: any, idx: number) => {
                                        const name = typeof item === 'string' ? item : item?.nombre;
                                        const notas = typeof item === 'string' ? '' : (item?.notas || '');
                                        const exists = masterAfecciones.some(p => p.afeccionesnombre.toLowerCase().trim() === name.toLowerCase().trim());
                                        const isChecked = selectedRels.pla.some((s: any) => (typeof s === 'string' ? s : s?.nombre) === name);
                                        return (
                                          <label key={`pla_diff_${idx}`} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', cursor: 'pointer' }}>
                                            <input type="checkbox" checked={isChecked} onChange={(e) => {
                                              if (e.target.checked) setSelectedRels(p => ({ ...p, pla: [...p.pla, item] }));
                                              else setSelectedRels(p => ({ ...p, pla: p.pla.filter((n: any) => (typeof n === 'string' ? n : n?.nombre) !== name) }));
                                            }} style={{ accentColor: '#f97316', width: '16px', height: '16px' }} />
                                            <span style={{ fontSize: '0.85rem' }}>{exists ? '✅' : '➕'}</span>
                                            <span style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>{name}</span>
                                            {notas && <span style={{ color: '#64748b', fontSize: '0.8rem' }}> — {notas}</span>}
                                          </label>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      }
                    }

                    // Usos y Alimentacion
                    if (aiConfigTabs.alimentacion) {
                      const cProps = aiProposal._alimentacion || [];
                      if (cProps.length > 0) {
                        const isCollapsed = !!collapsedAiGroups.alimentacion;
                      groupsWithChanges.push(
                        <div key="alimentacion" style={{ border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden', background: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                          <div 
                            onClick={() => setCollapsedAiGroups(prev => ({ ...prev, alimentacion: !prev.alimentacion }))}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#f1f5f9', cursor: 'pointer', userSelect: 'none', borderBottom: isCollapsed ? 'none' : '1px solid #cbd5e1' }}
                          >
                            <span style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span>🍽️ Usos y Consumo</span>
                            </span>
                            <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 'bold' }}>
                              {isCollapsed ? '➕ Mostrar' : '➖ Ocultar'}
                            </span>
                          </div>
                          <div style={{ display: isCollapsed ? 'none' : 'block', padding: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '12px' }}>
                              <div>
                                <h4 style={{ margin: 0, color: '#334155', fontSize: '0.95rem' }}>🍽️ Animales Aptos Propuestos</h4>
                                <small style={{ color: '#64748b' }}>Se cargarán en la pestaña de Usos y Consumo al asimilar.</small>
                              </div>
                            </div>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                              <thead>
                                <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1', textAlign: 'left' }}>
                                  <th style={{ padding: '10px 12px', width: '40px' }}>
                                    <input
                                      type="checkbox"
                                      checked={selectedAiAlimentacion.length === cProps.length}
                                      onChange={(e) => {
                                        if (e.target.checked) setSelectedAiAlimentacion(cProps.map((_: any, idx: number) => idx));
                                        else setSelectedAiAlimentacion([]);
                                      }}
                                      style={{ accentColor: '#7c3aed' }}
                                    />
                                  </th>
                                  <th style={{ padding: '10px 12px' }}>Animal</th>
                                  <th style={{ padding: '10px 12px' }}>Apto</th>
                                  <th style={{ padding: '10px 12px' }}>Partes</th>
                                  <th style={{ padding: '10px 12px' }}>Notas</th>
                                </tr>
                              </thead>
                              <tbody>
                                {cProps.map((item: any, idx: number) => {
                                  const isChecked = selectedAiAlimentacion.includes(idx);
                                  return (
                                    <tr key={`con_diff_${idx}`} className="ai-comparison-grid-with-actions" style={{ borderBottom: '1px solid #e2e8f0', background: isChecked ? '#f5f3ff' : 'transparent' }}>
                                      <td style={{ padding: '10px 12px' }}>
                                        <input
                                          type="checkbox"
                                          checked={isChecked}
                                          onChange={(e) => {
                                            if (e.target.checked) setSelectedAiAlimentacion(prev => [...prev, idx]);
                                            else setSelectedAiAlimentacion(prev => prev.filter(v => v !== idx));
                                          }}
                                          style={{ accentColor: '#7c3aed' }}
                                        />
                                      </td>
                                      <td style={{ padding: '10px 12px', fontWeight: 'bold', color: '#1e293b' }}>{item.nombre}</td>
                                      <td style={{ padding: '10px 12px' }}>
                                        {item.apto === 'apto' || item.esapto === 1 ? (
                                          <span style={{ color: '#10b981', fontWeight: 'bold' }}>🟢 Apto</span>
                                        ) : item.apto === 'con_moderacion' || item.esapto === 2 ? (
                                          <span style={{ color: '#d97706', fontWeight: 'bold' }}>🟡 Con moderación</span>
                                        ) : (
                                          <span style={{ color: '#ef4444', fontWeight: 'bold' }}>🔴 No apto</span>
                                        )}
                                      </td>
                                      <td style={{ padding: '10px 12px' }}>{item.parte || item.partes || '—'}</td>
                                      <td style={{ padding: '10px 12px', fontStyle: 'italic', color: '#64748b' }}>{item.notas || '—'}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    }
                  }

                    // 3. Synonyms Group
                    if (aiConfigTabs.sinonimos) {
                      const sProps = aiProposal._sinonimos || [];
                      const filteredSin = sProps.filter((item: any) => {
                        return !sinonimos.some(s =>
                          s.especiessinonimosnombre?.toLowerCase().trim() === item.especiessinonimosnombre?.toLowerCase().trim() &&
                          String(s.xespeciesvegetalessinonimosidpaises || '') === String(item.xespeciesvegetalessinonimosidpaises || '')
                        );
                      });

                      if (filteredSin.length > 0) {
                        const isCollapsed = !!collapsedAiGroups.sinonimos;
                        groupsWithChanges.push(
                          <div key="sinonimos" style={{ border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden', background: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                            <div 
                              onClick={() => setCollapsedAiGroups(prev => ({ ...prev, sinonimos: !prev.sinonimos }))}
                              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#f1f5f9', cursor: 'pointer', userSelect: 'none', borderBottom: isCollapsed ? 'none' : '1px solid #cbd5e1' }}
                            >
                              <span style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span>🗣️ Sinónimos</span>
                              </span>
                              <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 'bold' }}>
                                {isCollapsed ? '➕ Mostrar' : '➖ Ocultar'}
                              </span>
                            </div>
                            <div style={{ display: isCollapsed ? 'none' : 'block', padding: '16px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '12px' }}>
                                <div>
                                  <h4 style={{ margin: 0, color: '#334155', fontSize: '0.95rem' }}>🗣️ Nuevos Sinónimos propuestos</h4>
                                  <small style={{ color: '#64748b' }}>Se agregarán a tu lista de sinónimos al asimilar.</small>
                                </div>
                                <button type="button" className="btn-assimilate-row" style={{ padding: '8px 16px', background: '#e0e7ff', color: '#4338ca', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }} onClick={() => assimilateTab('sinonimos')}>
                                  ✨ Asimilar Sinónimos
                                </button>
                              </div>

                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                <thead>
                                  <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1', textAlign: 'left' }}>
                                    <th style={{ padding: '10px 12px', width: '40px' }}>
                                      <input
                                        type="checkbox"
                                        checked={selectedAiSinonimos.length === sProps.length}
                                        onChange={(e) => {
                                          if (e.target.checked) setSelectedAiSinonimos(sProps.map((_: any, idx: number) => idx));
                                          else setSelectedAiSinonimos([]);
                                        }}
                                        style={{ accentColor: '#7c3aed' }}
                                      />
                                    </th>
                                    <th style={{ padding: '10px 12px' }}>Nombre</th>
                                    <th style={{ padding: '10px 12px' }}>Idioma</th>
                                    <th style={{ padding: '10px 12px' }}>País</th>
                                    <th style={{ padding: '10px 12px' }}>Notas</th>
                                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Acción</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {sProps.map((item: any, idx: number) => {
                                    const isChecked = selectedAiSinonimos.includes(idx);
                                    const exists = sinonimos.some(s =>
                                      s.especiessinonimosnombre?.toLowerCase().trim() === item.especiessinonimosnombre?.toLowerCase().trim() &&
                                      String(s.xespeciesvegetalessinonimosidpaises || '') === String(item.xespeciesvegetalessinonimosidpaises || '')
                                    );
                                    if (exists) return null;

                                    const idioma = masterIdiomas.find(i => i.ididiomas.toString() === String(item.xespeciesvegetalessinonimosididiomas || ''));
                                    const pais = masterPaises.find(p => p.idpaises.toString() === String(item.xespeciesvegetalessinonimosidpaises || ''));

                                    return (
                                      <tr key={`sin_diff_${idx}`} className="ai-comparison-grid-with-actions" style={{ borderBottom: '1px solid #e2e8f0', background: isChecked ? '#f5f3ff' : 'transparent' }}>
                                        <td style={{ padding: '10px 12px' }}>
                                          <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={(e) => {
                                              if (e.target.checked) setSelectedAiSinonimos(prev => [...prev, idx]);
                                              else setSelectedAiSinonimos(prev => prev.filter(v => v !== idx));
                                            }}
                                            style={{ accentColor: '#7c3aed' }}
                                          />
                                        </td>
                                        <td style={{ padding: '10px 12px', fontWeight: 'bold', color: '#1e293b' }}>{item.especiessinonimosnombre}</td>
                                        <td style={{ padding: '10px 12px' }}>{idioma ? idioma.idiomasnombre : <em style={{ color: '#94a3b8' }}>No indicado</em>}</td>
                                        <td style={{ padding: '10px 12px' }}>{pais ? pais.paisesnombre : <em style={{ color: '#94a3b8' }}>General</em>}</td>
                                        <td style={{ padding: '10px 12px', fontStyle: 'italic', color: '#64748b' }}>{item.especiessinonimosnotas || '—'}</td>
                                        <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                                          <button type="button" className="btn-assimilate-row" style={{ padding: '4px 10px', background: '#e0e7ff', color: '#4338ca', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, fontSize: '0.75rem' }} onClick={async () => {
                                            await runWithAssimilationLoading(async () => {
                                              try {
                                                await fetch(`/api/admin/especiesvegetales/${especieId}/sinonimos`, {
                                                  method: 'POST',
                                                  headers: { 'Content-Type': 'application/json' },
                                                  body: JSON.stringify(item)
                                                });
                                                if (especieId) {
                                                  await loadSinonimos(especieId);
                                                }
                                              } catch (err) {
                                                console.error(err);
                                              }
                                            });
                                          }}>
                                            Agregar
                                          </button>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        );
                      }
                    }

                    // 4. Varieties Group
                    if (aiConfigTabs.variedades) {
                      const vProps = aiProposal._variedades || [];
                      const filteredVar = vProps.filter((item: any) => {
                        const isAdded = assimilatedVarietyNames.includes(item.variedadesvegetalesnombre) || existingVarieties.some(ev => ev.variedadesvegetalesnombre?.toLowerCase().trim() === item.variedadesvegetalesnombre?.toLowerCase().trim());
                        return !isAdded;
                      });

                      if (filteredVar.length > 0) {
                        const isCollapsed = !!collapsedAiGroups.variedades;
                        groupsWithChanges.push(
                          <div key="variedades" style={{ border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden', background: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                            <div 
                              onClick={() => setCollapsedAiGroups(prev => ({ ...prev, variedades: !prev.variedadesvegetales }))}
                              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#f1f5f9', cursor: 'pointer', userSelect: 'none', borderBottom: isCollapsed ? 'none' : '1px solid #cbd5e1' }}
                            >
                              <span style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span>🌾 Variedades</span>
                              </span>
                              <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 'bold' }}>
                                {isCollapsed ? '➕ Mostrar' : '➖ Ocultar'}
                              </span>
                            </div>
                            <div style={{ display: isCollapsed ? 'none' : 'block', padding: '16px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '12px' }}>
                                <div>
                                  <h4 style={{ margin: 0, color: '#334155', fontSize: '0.95rem' }}>🌾 Nuevas Variedades propuestas</h4>
                                  <small style={{ color: '#64748b' }}>Se agregarán a la base de datos de inmediato al asimilar.</small>
                                </div>
                                <button type="button" className="btn-assimilate-row" style={{ padding: '8px 16px', background: '#e0e7ff', color: '#4338ca', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }} onClick={() => assimilateTab('variedades')}>
                                  ✨ Asimilar Variedades
                                </button>
                              </div>

                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                <thead>
                                  <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1', textAlign: 'left' }}>
                                    <th style={{ padding: '10px 12px', width: '40px' }}>
                                      <input
                                        type="checkbox"
                                        checked={selectedAiVariedades.length === vProps.length}
                                        onChange={(e) => {
                                          if (e.target.checked) setSelectedAiVariedades(vProps.map((_: any, idx: number) => idx));
                                          else setSelectedAiVariedades([]);
                                        }}
                                        style={{ accentColor: '#7c3aed' }}
                                      />
                                    </th>
                                    <th style={{ padding: '10px 12px' }}>Nombre</th>
                                    <th style={{ padding: '10px 12px' }}>Tamaño</th>
                                    <th style={{ padding: '10px 12px' }}>Germinación</th>
                                    <th style={{ padding: '10px 12px' }}>Color</th>
                                    <th style={{ padding: '10px 12px' }}>Descripción</th>
                                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Acción</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {vProps.map((item: any, idx: number) => {
                                    const isChecked = selectedAiVariedades.includes(idx);
                                    const isAdded = assimilatedVarietyNames.includes(item.variedadesvegetalesnombre) || existingVarieties.some(ev => ev.variedadesvegetalesnombre?.toLowerCase().trim() === item.variedadesvegetalesnombre?.toLowerCase().trim());
                                    if (isAdded) return null;

                                    return (
                                      <tr key={`var_diff_${idx}`} className="ai-comparison-grid-with-actions" style={{ borderBottom: '1px solid #e2e8f0', background: isChecked ? '#f5f3ff' : 'transparent' }}>
                                        <td style={{ padding: '10px 12px' }}>
                                          <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={(e) => {
                                              if (e.target.checked) setSelectedAiVariedades(prev => [...prev, idx]);
                                              else setSelectedAiVariedades(prev => prev.filter(v => v !== idx));
                                            }}
                                            style={{ accentColor: '#7c3aed' }}
                                          />
                                        </td>
                                        <td style={{ padding: '10px 12px', fontWeight: 'bold', color: '#1e293b' }}>{item.variedadesvegetalesnombre}</td>
                                        <td style={{ padding: '10px 12px', textTransform: 'capitalize' }}>{item.variedadestamano || 'mediano'}</td>
                                        <td style={{ padding: '10px 12px' }}>{item.variedadesdiasgerminacion ? `${item.variedadesdiasgerminacion} días` : '—'}</td>
                                        <td style={{ padding: '10px 12px' }}>{item.variedadescolor || '—'}</td>
                                        <td style={{ padding: '10px 12px', color: '#64748b' }}>{item.variedadesdescripcion || '—'}</td>
                                        <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                                          <button type="button" className="btn-assimilate-row" style={{ padding: '4px 10px', background: '#e0e7ff', color: '#4338ca', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, fontSize: '0.75rem' }} onClick={async () => {
                                            await runWithAssimilationLoading(async () => {
                                              try {
                                                const res = await fetch('/api/admin/variedadesvegetales', {
                                                  method: 'POST',
                                                  headers: {
                                                    'Content-Type': 'application/json',
                                                    'x-user-email': userEmail || ''
                                                  },
                                                  body: JSON.stringify({
                                                    variedadesvegetalesnombre: item.variedadesvegetalesnombre,
                                                    xvariedadesvegetalesidespeciesvegetales: especieId,
                                                    variedadestamano: item.variedadestamano || 'mediano',
                                                    variedadesdiasgerminacion: item.variedadesdiasgerminacion || null,
                                                    variedadescolor: item.variedadescolor || null,
                                                    variedadesdescripcion: item.variedadesdescripcion || null,
                                                    variedadesvegetalesvisibilidadsino: 1
                                                  })
                                                });
                                                const data = await res.json();
                                                if (data.success) {
                                                  setAssimilatedVarietyNames(prev => [...prev, item.variedadesvegetalesnombre]);
                                                  if (especieId) await loadExistingVarieties(especieId);
                                                }
                                              } catch (err) {
                                                console.error(err);
                                              }
                                            });
                                          }}>
                                            Agregar
                                          </button>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        );
                      }
                    }

                    return (
                      <>
                        {groupsWithChanges.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {groupsWithChanges}
                          </div>
                        ) : (
                          <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontStyle: 'italic' }}>
                            No hay diferencias en los parámetros botánicos principales.
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}
          </div>
        </PremiumModal>
      )}

      {/* MODAL DE DIAGNÓSTICO DE COMPLETITUD (CHEOKEO) */}
      <PremiumModal isOpen={showCheckModal && checkResults !== null} onClose={() => setShowCheckModal(false)} maxWidth="650px" zIndex={10500}>
        {checkResults && (
          <>
            <PremiumModalHeader
              title={<>🔍 Diagnóstico de Completitud</>}
              gradient="linear-gradient(135deg, #0284c7, #0369a1)"
              onClose={() => setShowCheckModal(false)}
            />
            {/* Content */}
            <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Completeness Health/Progress Bar */}
              <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#334155' }}>Nivel de Completitud:</span>
                  <span style={{ fontSize: '1.2rem', fontWeight: '900', color: checkResults.score >= 80 ? '#10b981' : checkResults.score >= 50 ? '#f59e0b' : '#ef4444' }}>
                    {checkResults.score}%
                  </span>
                </div>
                
                {/* Progress bar container */}
                <div style={{ width: '100%', height: '12px', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden', position: 'relative' }}>
                  <div style={{
                    width: `${checkResults.score}%`,
                    height: '100%',
                    background: `linear-gradient(90deg, 
                      ${checkResults.score >= 80 ? '#10b981, #059669' : checkResults.score >= 50 ? '#f59e0b, #d97706' : '#ef4444, #dc2626'}
                    )`,
                    borderRadius: '999px',
                    transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
                  }} />
                </div>
                
                <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748b', lineHeight: '1.4' }}>
                  {checkResults.score === 100 
                    ? '🎉 ¡Enhorabuena! La ficha de esta especie está 100% completa.'
                    : checkResults.score >= 80 
                      ? '✨ ¡Excelente trabajo! Solo faltan algunos detalles menores.'
                      : '💡 Completa las secciones y campos vacíos indicados abajo para mejorar la calidad de esta ficha en el catálogo.'}
                </p>
              </div>

              {/* Related Sections Checklist */}
              <div>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '1rem', color: '#1e293b', fontWeight: 'bold' }}>📋 Secciones de Contenido</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
                  {[
                    { label: '🗣️ Sinónimos', active: checkResults.hasSinonimos, count: checkResults.sinonimosCount, desc: 'Nombres locales o alternativos', tab: 'taxonomia' },
                    { label: '📋 Labores/Tareas', active: checkResults.hasLabores, count: checkResults.laboresCount, desc: 'Instrucciones y pautas de cuidado', tab: 'pautas' },
                    { label: '📷 Fotos', active: checkResults.hasPhotos, count: checkResults.photosCount, desc: 'Imágenes botánicas o de cultivos', tab: 'photos' },
                    { label: '📄 PDFs', active: checkResults.hasPdfs, count: checkResults.pdfsCount, desc: 'Fichas técnicas y guías en PDF', tab: 'pdfs' },
                    { label: '🤝 Ecosistema (Asociaciones)', active: checkResults.hasEcosystem, count: checkResults.ecosystemCount, desc: 'Relaciones beneficiosas y plagas', tab: 'asociaciones' },
                    { label: '🌱 Variedades', active: checkResults.hasVarieties, count: checkResults.varietiesCount, desc: 'Variedades registradas de la especie', tab: 'variedades' },
                    { label: '🍽️ Usos y Consumo', active: checkResults.hasAlimentacion, count: checkResults.alimentacionCount, desc: 'Animales aptos en granja', tab: 'alimentacion' },
                  ].map((sec, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.85rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '1.15rem' }}>{sec.active ? '✅' : '❌'}</span>
                        <div>
                          <strong style={{ color: '#1e293b' }}>{sec.label}</strong>
                          <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b' }}>
                            {sec.active ? `${sec.count} ${sec.count === 1 ? 'registrado' : 'registrados'}` : sec.desc}
                          </span>
                        </div>
                      </div>
                      
                      {!sec.active && (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab(sec.tab);
                            setShowCheckModal(false);
                          }}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            background: '#fff',
                            color: '#475569',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            transition: 'all 0.2s',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                          }}
                        >
                          Ir a sección →
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Missing Basic Fields */}
              {checkResults.missingFields.length > 0 && (
                <div>
                  <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem', color: '#1e293b', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ color: '#ef4444' }}>⚠️</span>
                    <span>Campos Básicos Vacíos ({checkResults.missingFields.length})</span>
                  </h3>
                  <div style={{ background: '#fff5f5', border: '1px solid #fee2e2', borderRadius: '12px', padding: '14px 18px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {checkResults.missingFields.map((field: string, idx: number) => (
                      <span key={idx} style={{ background: '#fecaca', color: '#b91c1c', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600 }}>
                        {field}
                      </span>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Footer */}
            <div style={{ padding: '16px 24px', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
              <button
                type="button"
                onClick={() => setShowCheckModal(false)}
                style={{ padding: '10px 20px', background: '#0284c7', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem', boxShadow: '0 4px 6px rgba(2,132,199,0.2)', transition: 'all 0.2s' }}
              >
                Entendido
              </button>
            </div>
          </>
        )}
      </PremiumModal>

      {/* EDITOR DE FOTOS MODAL (Refactorizado Regla 13 DRY) */}
      <PhotoEditorModal
        isOpen={!!editingPhoto}
        onClose={() => setEditingPhoto(null)}
        photoUrl={editingPhoto ? getMediaUrl(editingPhoto.ruta) : ''}
        fileName={editingPhoto?.ruta ? editingPhoto.ruta.split('/').pop() : ''}
        initialMetadata={editingPhoto?.resumen ? JSON.parse(editingPhoto.resumen) : null}
        onSave={savePhotoEdits}
        saveStatus={photoEditorSaveStatus}
      />

      {editingPdf && (() => {
        const hasPdfChanges = pdfTitle !== (editingPdf.titulo || '') ||
          pdfSummary !== (editingPdf.resumen || '') ||
          pdfApuntes !== (editingPdf.apuntes || '');
        return (
          <PremiumModal isOpen={editingPdf !== null} onClose={() => setEditingPdf(null)} maxWidth="800px" zIndex={9999}>
            <PremiumModalHeader
              title={<>📄 Editar Metadatos del PDF</>}
              actions={
                <span style={{ display: 'inline-block', background: 'rgba(255,255,255,0.2)', color: 'white', padding: '4px 12px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                  🌱 Especie: {formData.especiesvegetalesnombre || 'Sin nombre'}
                </span>
              }
              onClose={() => setEditingPdf(null)}
            />
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

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
          </PremiumModal>
        );
      })()}
      {/* MODAL DE BÚSQUEDA EN PDF */}
      <PremiumModal isOpen={showPdfSearchModal} onClose={() => setShowPdfSearchModal(false)} maxWidth="600px" zIndex={9999}>
        <PremiumModalHeader
          title={<>✨ Asistente IA de Documentos</>}
          gradient="linear-gradient(135deg, #8b5cf6, #6d28d9)"
          onClose={() => setShowPdfSearchModal(false)}
        />
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>


            {/* SINÓNIMOS (Inteligencia Artificial) */}
            <p style={{ margin: 0, fontSize: '0.95rem', color: '#475569' }}>
              Dile a la Inteligencia Artificial qué tipo de documento necesitas buscar sobre <strong>{formData.especiesvegetalesnombre}</strong> (ej. <em>"poda"</em>, <em>"plagas INTA"</em>, <em>"guía de cultivo"</em>).
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
      </PremiumModal>

      {/* MODAL GENERADOR DE BLOG */}
      {blogGenPdf && (
        <PremiumModal isOpen={blogGenPdf !== null} onClose={() => setBlogGenPdf(null)} maxWidth="600px" zIndex={10000}>
          <PremiumModalHeader
            title={<>📝 Generar Artículo Automático</>}
            gradient="linear-gradient(135deg, #f59e0b, #d97706)"
            onClose={() => setBlogGenPdf(null)}
          />
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Contexto: Entidad + PDF */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '200px', background: 'linear-gradient(135deg, #ecfdf5, #f0fdf4)', border: '1px solid #a7f3d0', borderRadius: '10px', padding: '12px 16px' }}>
                  <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#64748b', fontWeight: 700, marginBottom: '4px' }}>🌱 Especie</div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f766e' }}>{formData.especiesvegetalesnombre || 'Sin nombre'}</div>
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
                  {`Actúa como un experto redactor de blogs agronómicos y de jardinería moderna. Vas a leer el documento adjunto sobre la especie "${formData.especiesvegetalesnombre || 'agricultura'}" y vas a escribir un artículo de blog profesional, SEO-optimizado y visualmente estructurado.

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
        </PremiumModal>
      )}



      {deleteConfirm && (
        <PremiumModal isOpen={deleteConfirm !== null} onClose={() => setDeleteConfirm(null)} maxWidth="380px" zIndex={9999}>
          <div style={{ padding: '32px', textAlign: 'center' }}>
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
        </PremiumModal>
      )}

      {/* AI Image Generator Modal */}
      <PremiumModal isOpen={showAiImageModal} onClose={() => setShowAiImageModal(false)} maxWidth="600px" zIndex={10000}>
        <PremiumModalHeader
          title={<><span style={{ fontSize: '1.5rem' }}>✨</span> Generador de Imágenes IA</>}
          actions={
            <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.9)' }}>
              Especie: <strong>{formData.especiesvegetalesnombre || 'Sin nombre'}</strong>
            </span>
          }
          gradient="linear-gradient(135deg, #8b5cf6, #6d28d9)"
          onClose={() => setShowAiImageModal(false)}
        />
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
        </PremiumModal>

      {/* Toast Notification */}
      {toastMessage && (
        <div style={{ position: 'fixed', bottom: '30px', right: '30px', background: '#10b981', color: 'white', padding: '12px 24px', borderRadius: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.15)', zIndex: 9999, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', animation: 'fadeInUp 0.3s ease-out' }}>
          <span>✓</span> {toastMessage}
        </div>
      )}
    </>
  );
}
