'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Blurhash } from 'react-blurhash';
import type { FirebaseStorage } from 'firebase/storage';
import { getMediaUrl } from '@/lib/media-url';
import './EspecieForm.css';

interface EspecieFormProps {
  especieId: string | null;
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

export default function EspecieForm({ especieId, userEmail }: EspecieFormProps) {
  const router = useRouter();

  const defaultFormData = {
    especiesnombre: '', especiesnombrecientifico: '', especiesfamilia: '',
    especiestipo: [], especiesciclo: [], especiescolor: '', especiestamano: 'mediano',
    especiesdiasgerminacion: '', especiesdiashastatrasplante: '', especiesviabilidadsemilla: '', especiesdiashastafructificacion: '',
    especiestemperaturaminima: '', especiestemperaturaoptima: '',
    especiesmarcoplantas: '', especiesmarcofilas: '', especiesprofundidadsiembra: '',
    especiesfechasemillerodesde: '', especiesfechasemillerohasta: '',
    especiesfechasiembradirectadesde: '', especiesfechasiembradirectahasta: '',
    especiestrasplantedesde: '', especiestrasplantehasta: '',
    especiesfecharecolecciondesde: '', especiesfecharecoleccionhasta: '',
    especieshistoria: '', especiesdescripcion: '', especiesfuentesinformacion: '',
    especiesautosuficiencia: '', especiesautosuficienciaconserva: '', especiesvisibilidadsino: 1,
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

  const isFormDirty = JSON.stringify(formData) !== JSON.stringify(initialData);
  const isDirty = isFormDirty || relacionesDirty;
  
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('taxonomia');
  const [isEspecieOpen, setIsEspecieOpen] = useState(true);
  const [calcPersonas, setCalcPersonas] = useState<number>(1);
  const [aiProposal, setAiProposal] = useState<any>(null);
  const [selectedRels, setSelectedRels] = useState<{ ben: string[], per: string[], pla: string[] }>({ ben: [], per: [], pla: [] });
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

  // -- AI Image Generator State --
  const [showAiImageModal, setShowAiImageModal] = useState(false);
  const [aiImageConcept, setAiImageConcept] = useState('');
  const [aiImageLoading, setAiImageLoading] = useState(false);
  const [aiImageResult, setAiImageResult] = useState<string | null>(null);

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

  useEffect(() => {
    // Cargar catálogos maestros
    if (userEmail) {
      fetch('/api/admin/especies', { headers: { 'x-user-email': userEmail } })
        .then(res => res.json())
        .then(data => setMasterEspecies(data.especies || []));
      fetch('/api/admin/plagas', { headers: { 'x-user-email': userEmail } })
        .then(res => res.json())
        .then(data => setMasterPlagas(data.plagas || []));
    }

    if (especieId) {
      loadEspecie(especieId);
      loadAttachments(especieId);
      loadRelaciones(especieId);
    }
  }, [especieId, userEmail]);

  const loadRelaciones = async (id: string) => {
    if (!userEmail) return;
    try {
      const res = await fetch(`/api/admin/especies/${id}/relaciones`, { headers: { 'x-user-email': userEmail } });
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
  }, [especieId, formData.especiesnombre, userEmail]);

  const loadEspecie = async (id: string) => {
    if (!userEmail) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/especies/${id}`, {
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
      const pRes = await fetch(`/api/admin/especies/${id}/photos`, { headers: { 'x-user-email': userEmail } });
      const pData = await pRes.json();
      setPhotos(pData.photos || []);
    } catch (e) { console.error('Error cargando fotos:', e); }

    try {
      const dRes = await fetch(`/api/admin/especies/${id}/pdfs`, { headers: { 'x-user-email': userEmail } });
      const dData = await dRes.json();
      setPdfs(dData.pdfs || []);
    } catch (e) { console.error('Error cargando PDFs:', e); }

    try {
      const bRes = await fetch(`/api/admin/especies/${id}/blogs`, { headers: { 'x-user-email': userEmail } });
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
      const url = especieId ? `/api/admin/especies/${especieId}` : '/api/admin/especies';
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
            await fetch(`/api/admin/especies/${targetId}/relaciones`, {
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
      keys: ['especiesdiasgerminacion', 'especiesdiashastatrasplante', 'especiesviabilidadsemilla', 'especiesdiashastafructificacion', 'especiestemperaturaminima', 'especiestemperaturaoptima', 'especiestemperaturamaxima', 'especiesprofundidadsiembra', 'especiesprofundidadtrasplante', 'especiesluzsolar'],
      labels: {
        especiesdiasgerminacion: 'Días Germinación',
        especiesdiashastatrasplante: 'Días hasta Trasplante',
        especiesviabilidadsemilla: 'Viabilidad Semilla',
        especiesdiashastafructificacion: 'Días a Fruct.',
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
      keys: ['especiesmarcoplantas', 'especiesmarcofilas', 'especiesautosuficiencia', 'especiesautosuficienciaconserva'],
      labels: {
        especiesmarcoplantas: 'Marco Plantas',
        especiesmarcofilas: 'Marco Filas',
        especiesautosuficiencia: 'Autosuf. Fresco',
        especiesautosuficienciaconserva: 'Autosuf. Conserva'
      }
    },
    {
      id: 'biodinamica',
      title: 'Luna y Biodinámica',
      keys: ['especiesbiodinamicacategoria', 'especiesbiodinamicanotas'],
      labels: {
        especiesbiodinamicacategoria: 'Cat. Biodinámica',
        especiesbiodinamicanotas: 'Notas Lunares'
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
      const benNames = selectedRels.ben;
      const perNames = selectedRels.per;
      const plaNames = selectedRels.pla;

      const newBen = [...relaciones.beneficiosas];
      const newPer = [...relaciones.perjudiciales];
      const newPla = [...relaciones.plagas];

      let masterE = [...masterEspecies];
      let masterP = [...masterPlagas];
      let madeChanges = false;

      const normalize = (str: string) => str.toLowerCase().trim();

      for (const name of benNames) {
        let sp = masterE.find(e => normalize(e.especiesnombre) === normalize(name));
        if (!sp) {
          const res = await fetch('/api/admin/especies', {
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
        if (sp && sp.idespecies.toString() !== especieId && !newBen.some(b => b.xasociacionesbeneficiosasidespeciedestino.toString() === sp.idespecies.toString())) {
          newBen.push({
            xasociacionesbeneficiosasidespeciedestino: sp.idespecies,
            especie_destino_nombre: sp.especiesnombre,
            asociacionesbeneficiosasmotivo: 'Sugerido por IA'
          });
          madeChanges = true;
        }
      }

      for (const name of perNames) {
        let sp = masterE.find(e => normalize(e.especiesnombre) === normalize(name));
        if (!sp) {
          const res = await fetch('/api/admin/especies', {
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
        if (sp && sp.idespecies.toString() !== especieId && !newPer.some(p => p.xasociacionesperjudicialesidespeciedestino.toString() === sp.idespecies.toString())) {
          newPer.push({
            xasociacionesperjudicialesidespeciedestino: sp.idespecies,
            especie_destino_nombre: sp.especiesnombre,
            asociacionesperjudicialesmotivo: 'Sugerido por IA'
          });
          madeChanges = true;
        }
      }

      for (const name of plaNames) {
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
        if (p && !newPla.some(pl => pl.xrelacionesplagasideplaga.toString() === p.idplagas.toString())) {
          newPla.push({
            xrelacionesplagasideplaga: p.idplagas,
            plagasnombre: p.plagasnombre,
            relacionesplagasriesgo: 'media',
            relacionesplagasnotas: 'Sugerido por IA'
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement> | any, type: 'photos' | 'pdfs') => {
    if (!especieId) {
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
      let clientStorage: FirebaseStorage | null = null;

      if (type === 'photos') {
        imageCompression = (await import('browser-image-compression')).default;
        const firebaseConfigModule = await import('@/lib/firebase/config');
        clientStorage = firebaseConfigModule.storage;
        storageApi = await import('firebase/storage');
      }

      for (let i = 0; i < files.length; i++) {
        let file = files[i];

        if (type === 'photos') {
          const isHeic = file.name.toLowerCase().endsWith('.heic') || file.type === 'image/heic';
          if (isHeic) {
            try {
              const heic2any = (await import('heic2any')).default;
              const convertedBlob = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.8 });
              const blobArray = Array.isArray(convertedBlob) ? convertedBlob : [convertedBlob];
              file = new File(blobArray, file.name.replace(/\.heic$/i, '.jpg'), { type: 'image/jpeg' });
            } catch (error) {
              console.error('Error convirtiendo HEIC', error);
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

          const res = await fetch(`/api/admin/especies/${especieId}/photos`, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail || '' },
            body: JSON.stringify({ rawStoragePath: storagePath, especieNombre: formData.especiesnombre || '' }) 
          });
          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || `HTTP Error ${res.status}`);
          }
        } else {
          const fd = new FormData();
          fd.append('file', file);
          fd.append('especieNombre', formData.especiesnombre || '');
          const res = await fetch(`/api/admin/especies/${especieId}/${type}`, { 
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

  const generateAiImage = async () => {
    if (!formData.especiesnombre) {
      alert('Se necesita el nombre de la especie para generar la imagen.');
      return;
    }
    setAiImageLoading(true);
    setAiImageResult(null);
    try {
      const res = await fetch('/api/ai/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail || '' },
        body: JSON.stringify({ 
          especieNombre: formData.especiesnombre,
          especieNombreCientifico: formData.especiesnombrecientifico,
          especieFamilia: formData.especiesfamilia,
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
    if (!aiImageResult || !especieId) return;
    setUploadingPhotos(true);
    setShowAiImageModal(false);
    try {
      const res = await fetch(aiImageResult);
      const blob = await res.blob();
      const { storage } = await import('@/lib/firebase/config');
      const { ref, uploadBytes } = await import('firebase/storage');
      const fileName = `temp-ai-${Date.now()}.jpg`;
      const storagePath = `uploads/temp/${fileName}`;
      const storageRef = ref(storage, storagePath);
      await uploadBytes(storageRef, blob);

      await fetch(`/api/admin/especies/${especieId}/photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail || '' },
        body: JSON.stringify({ rawStoragePath: storagePath, especieNombre: formData.especiesnombre || '' })
      });
      await loadAttachments(especieId);
      setAiImageResult(null);
      setAiImageConcept('');
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
        ? `/api/admin/especies/${especieId}/photos?photoId=${id}`
        : `/api/admin/especies/${especieId}/pdfs?pdfId=${id}`;
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
      await fetch(`/api/admin/especies/${especieId}/photos/reorder`, {
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
      await fetch(`/api/admin/especies/${especieId}/photos`, {
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
    if (!editingPhoto || !especieId) return;
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
      await fetch(`/api/admin/especies/${especieId}/photos`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-email': userEmail || ''
        },
        body: JSON.stringify({ photoId: editingPhoto.id, action: 'updateMeta', resumen })
      });
      setEditingPhoto(null);
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
      await fetch(`/api/admin/especies/${especieId}/pdfs`, {
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
        await fetch(`/api/admin/especies/${especieId}/pdfs`, {
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
      const res = await fetch(`/api/admin/especies/${especieId}/pdfs/link`, {
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
              <div className="form-group">
                <label>Días Germinación</label>
                <input type="number" name="especiesdiasgerminacion" value={formData.especiesdiasgerminacion || ''} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Días hasta Trasplante</label>
                <input type="number" name="especiesdiashastatrasplante" value={formData.especiesdiashastatrasplante || ''} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Viabilidad Semilla (Años)</label>
                <input type="number" name="especiesviabilidadsemilla" value={formData.especiesviabilidadsemilla || ''} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Días a Fructificación</label>
                <input type="number" name="especiesdiashastafructificacion" value={formData.especiesdiashastafructificacion || ''} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Profundidad Siembra (cm)</label>
                <input type="number" step="0.1" name="especiesprofundidadsiembra" value={formData.especiesprofundidadsiembra || ''} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Temp. Mínima (°C)</label>
                <input type="number" step="0.1" name="especiestemperaturaminima" value={formData.especiestemperaturaminima || ''} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Temp. Óptima (°C)</label>
                <input type="number" step="0.1" name="especiestemperaturaoptima" value={formData.especiestemperaturaoptima || ''} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Temp. Máxima (°C)</label>
                <input type="number" step="0.1" name="especiestemperaturamaxima" value={formData.especiestemperaturamaxima || ''} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Profundidad Trasplante</label>
                <input type="text" name="especiesprofundidadtrasplante" placeholder="Ej: Hasta los cotiledones" value={formData.especiesprofundidadtrasplante || ''} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Tipo de Siembra</label>
                <select name="especiestiposiembra" value={formData.especiestiposiembra || ''} onChange={handleChange}>
                  <option value="">--</option>
                  <option value="directa">Directa</option>
                  <option value="semillero">Semillero</option>
                  <option value="ambas">Ambas</option>
                </select>
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
            <div className="grid-form">
              <div className="form-group full">
                <label>Categoría Biodinámica</label>
                <select name="especiesbiodinamicacategoria" value={formData.especiesbiodinamicacategoria || ''} onChange={handleChange}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '1rem' }}>
                  <option value="">— Sin categoría —</option>
                  <option value="fruto">🍅 Planta de Fruto</option>
                  <option value="raiz">🥕 Planta de Raíz</option>
                  <option value="hoja">🥬 Planta de Hoja</option>
                  <option value="flor">🌸 Planta de Flor</option>
                </select>
                {formData.especiesbiodinamicacategoria && (
                  <p style={{ marginTop: '8px', fontSize: '0.82rem', color: '#64748b', lineHeight: 1.5 }}>
                    {({ fruto: 'Siembra y trasplanta en días Fruto (luna creciente). Recolecta también en días Fruto para mejor sabor.', raiz: 'Siembra en días Raíz con luna creciente. Recolecta en días Raíz con luna menguante para mejor conservación.', hoja: 'Trasplanta en días Hoja con luna creciente. Evita podar en días Fruto.', flor: 'Trabaja en días Flor para multiplicación y floración abundante. Cosecha en días Flor para mayor fragancia.' } as Record<string, string>)[formData.especiesbiodinamicacategoria]}
                  </p>
                )}
              </div>
              <div className="form-group full">
                <label>Notas de Calendario Lunar</label>
                <textarea name="especiesbiodinamicanotas" value={formData.especiesbiodinamicanotas || ''} onChange={handleChange}
                  rows={4} placeholder="Ej: El tomate responde muy bien al trasplante en días Fruto durante luna creciente. Podar hojas basales preferiblemente en días Hoja..."
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.95rem', resize: 'vertical' }} />
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

              <div className="form-group">
                <label>Autosuficiencia Fresco (plantas/pers)</label>
                <input type="number" step="0.1" name="especiesautosuficiencia" value={formData.especiesautosuficiencia || ''} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Autosuficiencia Conserva (plantas/pers)</label>
                <input type="number" step="0.1" name="especiesautosuficienciaconserva" value={formData.especiesautosuficienciaconserva || ''} onChange={handleChange} />
              </div>
              <div className="form-group full" style={{ padding: '15px', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1', marginTop: '10px' }}>
                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0, textAlign: 'center' }}>
                  <strong>Nota:</strong> Estos valores indican el número estimado de plantas necesarias para abastecer a <strong>una persona</strong> durante un año.
                </p>
              </div>

              {/* CALCULADORA */}
              {(() => {
                const pFresco = parseFloat(formData.especiesautosuficiencia) || 0;
                const pConserva = parseFloat(formData.especiesautosuficienciaconserva) || 0;
                const totalPFresco = pFresco * calcPersonas;
                const totalPConserva = pConserva * calcPersonas;
                
                const marcoP = (parseFloat(formData.especiesmarcoplantas) || 0) / 100;
                const marcoF = (parseFloat(formData.especiesmarcofilas) || 0) / 100;
                const areaPlant = marcoP * marcoF;
                
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

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                      <div style={{ background: '#fff', padding: '15px', borderRadius: '8px', border: '1px solid #bbf7d0', textAlign: 'center' }}>
                        <h4 style={{ margin: '0 0 10px 0', color: '#15803d', borderBottom: '1px solid #bbf7d0', paddingBottom: '10px' }}>🌱 Solo Consumo en Fresco</h4>
                        <span style={{ display: 'block', fontSize: '0.9rem', color: '#166534' }}>Plantas Necesarias</span>
                        <strong style={{ fontSize: '1.8rem', color: '#15803d', display: 'block', marginBottom: '10px' }}>{totalPFresco.toFixed(1)}</strong>
                        <span style={{ display: 'block', fontSize: '0.9rem', color: '#166534' }}>Terreno Necesario</span>
                        <strong style={{ fontSize: '1.8rem', color: '#15803d' }}>{m2Fresco > 0 ? `${m2Fresco.toFixed(2)} m²` : '--- m²'}</strong>
                      </div>

                      <div style={{ background: '#fff', padding: '15px', borderRadius: '8px', border: '1px solid #bbf7d0', textAlign: 'center' }}>
                        <h4 style={{ margin: '0 0 10px 0', color: '#15803d', borderBottom: '1px solid #bbf7d0', paddingBottom: '10px' }}>🥫 Fresco + Conserva (Total)</h4>
                        <span style={{ display: 'block', fontSize: '0.9rem', color: '#166534' }}>Plantas Totales Necesarias</span>
                        <strong style={{ fontSize: '1.8rem', color: '#15803d', display: 'block', marginBottom: '10px' }}>{totalPConserva.toFixed(1)}</strong>
                        <span style={{ display: 'block', fontSize: '0.9rem', color: '#166534' }}>Terreno Total Necesario</span>
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
                <h4>Asociaciones Beneficiosas</h4>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                  <select id="selBen" style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                    <option value="">Selecciona especie...</option>
                    {masterEspecies.filter(e => e.idespecies.toString() !== especieId).map(e => <option key={e.idespecies} value={e.idespecies}>{e.especiesnombre}</option>)}
                  </select>
                  <input type="text" id="motivoBen" placeholder="Motivo (opcional)" style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                  <button type="button" onClick={() => {
                    const sel = document.getElementById('selBen') as HTMLSelectElement;
                    const mot = document.getElementById('motivoBen') as HTMLInputElement;
                    if (!sel.value) return;
                    if (relaciones.beneficiosas.some((b: any) => b.xasociacionesbeneficiosasidespeciedestino.toString() === sel.value)) { alert('Ya añadida'); return; }
                    const sp = masterEspecies.find(e => e.idespecies.toString() === sel.value);
                    setRelaciones((prev: any) => ({
                      ...prev,
                      beneficiosas: [...prev.beneficiosas, { 
                        xasociacionesbeneficiosasidespeciedestino: parseInt(sel.value),
                        especie_destino_nombre: sp?.especiesnombre,
                        asociacionesbeneficiosasmotivo: mot.value 
                      }]
                    }));
                    setRelacionesDirty(true);
                    sel.value = ''; mot.value = '';
                  }} style={{ padding: '8px 16px', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Añadir</button>
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {relaciones.beneficiosas.map((b: any, idx: number) => (
                    <li key={idx} style={{ padding: '10px', border: '1px solid #e2e8f0', borderRadius: '4px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div><strong>{b.especie_destino_nombre}</strong> {b.asociacionesbeneficiosasmotivo ? `- ${b.asociacionesbeneficiosasmotivo}` : ''}</div>
                      <button type="button" onClick={() => {
                        setRelaciones((prev: any) => ({ ...prev, beneficiosas: prev.beneficiosas.filter((_: any, i: number) => i !== idx) }));
                        setRelacionesDirty(true);
                      }} style={{ color: '#ef4444', border: 'none', background: '#fee2e2', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}>Eliminar</button>
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
                    {masterEspecies.filter(e => e.idespecies.toString() !== especieId).map(e => <option key={e.idespecies} value={e.idespecies}>{e.especiesnombre}</option>)}
                  </select>
                  <input type="text" id="motivoPer" placeholder="Motivo (opcional)" style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                  <button type="button" onClick={() => {
                    const sel = document.getElementById('selPer') as HTMLSelectElement;
                    const mot = document.getElementById('motivoPer') as HTMLInputElement;
                    if (!sel.value) return;
                    if (relaciones.perjudiciales.some((p: any) => p.xasociacionesperjudicialesidespeciedestino.toString() === sel.value)) { alert('Ya añadida'); return; }
                    const sp = masterEspecies.find(e => e.idespecies.toString() === sel.value);
                    setRelaciones((prev: any) => ({
                      ...prev,
                      perjudiciales: [...prev.perjudiciales, { 
                        xasociacionesperjudicialesidespeciedestino: parseInt(sel.value),
                        especie_destino_nombre: sp?.especiesnombre,
                        asociacionesperjudicialesmotivo: mot.value 
                      }]
                    }));
                    setRelacionesDirty(true);
                    sel.value = ''; mot.value = '';
                  }} style={{ padding: '8px 16px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Añadir</button>
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {relaciones.perjudiciales.map((p: any, idx: number) => (
                    <li key={idx} style={{ padding: '10px', border: '1px solid #e2e8f0', borderRadius: '4px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div><strong>{p.especie_destino_nombre}</strong> {p.asociacionesperjudicialesmotivo ? `- ${p.asociacionesperjudicialesmotivo}` : ''}</div>
                      <button type="button" onClick={() => {
                        setRelaciones((prev: any) => ({ ...prev, perjudiciales: prev.perjudiciales.filter((_: any, i: number) => i !== idx) }));
                        setRelacionesDirty(true);
                      }} style={{ color: '#ef4444', border: 'none', background: '#fee2e2', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}>Eliminar</button>
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
                    setRelaciones((prev: any) => ({
                      ...prev,
                      plagas: [...prev.plagas, { 
                        xespeciesplagasidplagas: parseInt(sel.value),
                        plagasnombre: pla?.plagasnombre,
                        plagastipo: pla?.plagastipo,
                        especiesplagasnivelriesgo: r.value,
                        especiesplagasnotasespecificas: n.value 
                      }]
                    }));
                    setRelacionesDirty(true);
                    sel.value = ''; n.value = ''; r.value = 'media';
                  }} style={{ padding: '8px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Añadir Plaga</button>
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {relaciones.plagas.map((p: any, idx: number) => (
                    <li key={idx} style={{ padding: '10px', border: '1px solid #e2e8f0', borderRadius: '4px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong>{p.plagasnombre}</strong> <span style={{ color: '#64748b', fontSize: '0.85rem' }}>({p.plagastipo})</span> 
                        <span style={{ margin: '0 8px', color: '#cbd5e1' }}>|</span> 
                        <span style={{ fontWeight: 'bold', textTransform: 'capitalize', color: p.especiesplagasnivelriesgo === 'alta' ? '#ef4444' : p.especiesplagasnivelriesgo === 'baja' ? '#10b981' : '#f59e0b' }}>Riesgo {p.especiesplagasnivelriesgo}</span>
                        {p.especiesplagasnotasespecificas ? ` - ${p.especiesplagasnotasespecificas}` : ''}
                      </div>
                      <button type="button" onClick={() => {
                        setRelaciones((prev: any) => ({ ...prev, plagas: prev.plagas.filter((_: any, i: number) => i !== idx) }));
                        setRelacionesDirty(true);
                      }} style={{ color: '#ef4444', border: 'none', background: '#fee2e2', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}>Eliminar</button>
                    </li>
                  ))}
                  {relaciones.plagas.length === 0 && <p style={{ color: '#94a3b8', fontStyle: 'italic', margin: 0 }}>No hay plagas vinculadas.</p>}
                </ul>
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
              {!especieId ? (
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
                          {aiProposal.asociaciones_beneficiosas.map((name: string) => {
                            const exists = masterEspecies.some(e => e.especiesnombre.toLowerCase().trim() === name.toLowerCase().trim());
                            return (
                              <li key={name} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0' }}>
                                <input type="checkbox" checked={selectedRels.ben.includes(name)} onChange={(e) => {
                                  if (e.target.checked) setSelectedRels(p => ({...p, ben: [...p.ben, name]}));
                                  else setSelectedRels(p => ({...p, ben: p.ben.filter(n => n !== name)}));
                                }} style={{ width: '16px', height: '16px', accentColor: '#10b981', cursor: 'pointer' }} />
                                <span>{exists ? '✅' : '➕'}</span>
                                <span>{name}</span> {exists ? <small style={{color: '#64748b'}}>(Existente)</small> : <small style={{color: '#f59e0b'}}>(Se creará inactiva)</small>}
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
                          {aiProposal.asociaciones_perjudiciales.map((name: string) => {
                            const exists = masterEspecies.some(e => e.especiesnombre.toLowerCase().trim() === name.toLowerCase().trim());
                            return (
                              <li key={name} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0' }}>
                                <input type="checkbox" checked={selectedRels.per.includes(name)} onChange={(e) => {
                                  if (e.target.checked) setSelectedRels(p => ({...p, per: [...p.per, name]}));
                                  else setSelectedRels(p => ({...p, per: p.per.filter(n => n !== name)}));
                                }} style={{ width: '16px', height: '16px', accentColor: '#ef4444', cursor: 'pointer' }} />
                                <span>{exists ? '✅' : '➕'}</span>
                                <span>{name}</span> {exists ? <small style={{color: '#64748b'}}>(Existente)</small> : <small style={{color: '#f59e0b'}}>(Se creará inactiva)</small>}
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
                          {aiProposal.plagas_asociadas.map((name: string) => {
                            const exists = masterPlagas.some(p => p.plagasnombre.toLowerCase().trim() === name.toLowerCase().trim());
                            return (
                              <li key={name} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0' }}>
                                <input type="checkbox" checked={selectedRels.pla.includes(name)} onChange={(e) => {
                                  if (e.target.checked) setSelectedRels(p => ({...p, pla: [...p.pla, name]}));
                                  else setSelectedRels(p => ({...p, pla: p.pla.filter(n => n !== name)}));
                                }} style={{ width: '16px', height: '16px', accentColor: '#f97316', cursor: 'pointer' }} />
                                <span>{exists ? '✅' : '➕'}</span>
                                <span>{name}</span> {exists ? <small style={{color: '#64748b'}}>(Existente)</small> : <small style={{color: '#f59e0b'}}>(Se creará inactiva)</small>}
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
        <div className="photo-editor-overlay" onClick={() => setEditingPhoto(null)}>
          <div className="photo-editor-content" onClick={e => e.stopPropagation()}>
            <div className="photo-editor-header">
              <div>
                <h3>Ajustar Fotografía y SEO</h3>
                <small style={{ color: '#64748b', fontSize: '0.75rem', display: 'block', marginTop: '2px' }}>
                  📄 {editingPhoto.ruta.split('/').pop()}
                </small>
              </div>
              <button type="button" className="photo-editor-close" onClick={() => setEditingPhoto(null)}>✕</button>
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

            {(() => {
              const currentEditorState = JSON.stringify({ x: editorX, y: editorY, zoom: editorZoom, brightness: editorBrightness, contrast: editorContrast, style: editorStyle, seo_alt: editorSeoAlt });
              const hasPhotoChanges = currentEditorState !== editorInitialState;
              return (
                <div className="photo-editor-footer">
                  <button type="button" className="btn-secondary" onClick={() => setEditingPhoto(null)}>Cerrar</button>
                  {hasPhotoChanges && (
                    <button 
                      type="button" 
                      className="btn-primary"
                      onClick={savePhotoEdits}
                      disabled={photoEditorSaveStatus === 'saving'}
                      style={{ minWidth: '175px', transition: 'all 0.3s ease' }}
                    >
                      {photoEditorSaveStatus === 'saving' ? '⏳ Guardando...' : '💾 Guardar Cambios'}
                    </button>
                  )}
                </div>
              );
            })()}
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
                      onChange={e => setAiImageConcept(e.target.value)}
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
                          onClick={() => setAiImageConcept(preset)}
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
    </>
  );
}
