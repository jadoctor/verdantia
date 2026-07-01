'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth } from '@/lib/firebase/config';
import PremiumBackButton from '@/components/ui/PremiumBackButton';
import PremiumAiButton from '@/components/ui/PremiumAiButton';
import PremiumCancelButton from '@/components/ui/PremiumCancelButton';
import PremiumVisibilityToggle from '@/components/ui/PremiumVisibilityToggle';
import { onAuthStateChanged } from 'firebase/auth';
import VariedadVegetalMediaManager from './VariedadVegetalMediaManager';
import { getMediaUrl } from '@/lib/media-url';
import './EspecieVegetalForm.css';

const TIPOS = ['hortaliza', 'fruta', 'aromatica', 'leguminosa', 'cereal', 'adventicia', 'otra'];
const CICLOS = ['anual', 'bianual', 'perenne'];
const MESES = [
  { val: 1, label: 'Ene' }, { val: 2, label: 'Feb' }, { val: 3, label: 'Mar' },
  { val: 4, label: 'Abr' }, { val: 5, label: 'May' }, { val: 6, label: 'Jun' },
  { val: 7, label: 'Jul' }, { val: 8, label: 'Ago' }, { val: 9, label: 'Sep' },
  { val: 10, label: 'Oct' }, { val: 11, label: 'Nov' }, { val: 12, label: 'Dic' }
];

interface VariedadVegetalFormProps {
  variedadId: string | null;
}

export default function VariedadVegetalForm({ variedadId }: VariedadVegetalFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const especieIdQuery = searchParams.get('especieId');
  const editPdfParam = searchParams.get('editPdf');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [especies, setEspecies] = useState<any[]>([]);
  const [genericData, setGenericData] = useState<any>(null);
  
  const [activeTab, setActiveTab] = useState(() => {
    const tabParam = searchParams.get('tab');
    return tabParam && ['taxonomia', 'fisiologia', 'calendarios', 'autosuficiencia', 'suelo', 'textos', 'fotos', 'pdfs'].includes(tabParam) ? tabParam : 'taxonomia';
  });
  const [photos, setPhotos] = useState<any[]>([]);
  const [vibrantColor, setVibrantColor] = useState<string | null>(null);
  const [isVariedadOpen, setIsVariedadOpen] = useState(true);

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

  const [formData, setFormData] = useState<any>({
    variedadesvegetalesnombre: '',
    xvariedadesvegetalesidespeciesvegetales: especieIdQuery || '',
    variedadesdescripcion: '',
    variedadestamano: 'mediano',
    variedadesvegetalesnombrecientifico: '',
    variedadesfamilia: '',
    variedadestipo: [],
    variedadesciclo: [],
    variedadescolor: '',
    variedadesdiasgerminacion: '',
    variedadesviabilidadsemilla: '',
    variedadespeso1000semillas: '',
    variedadesdiashastafructificacion: '',
    variedadesdiascrecimientofirme: '',
    variedadesdiashastatrasplante: '',
    variedadesdiashastarecoleccion: '',
    variedadestemperaturaminima: '',
    variedadestemperaturaoptima: '',
    variedadestemperaturamaxima: '',
    variedadesmarcoplantas: '',
    variedadesmarcofilas: '',
    variedadesmarcomargen: '',
    variedadesprofundidadsiembra: '',
    variedadesprofundidadtrasplante: '',
    variedadessemillerodesde: '',
    variedadessemillerohasta: '',
    variedadessiembradirectadesde: '',
    variedadessiembradirectahasta: '',
    variedadestrasplantedesde: '',
    variedadestrasplantehasta: '',
    variedadesrecolecciondesde: '',
    variedadesrecoleccionhasta: '',
    variedadesvegetalesvisibilidadsino: 1,
    variedadesautosuficiencia: '',
    variedadesautosuficienciaparcial: '',
    variedadesautosuficienciaconserva: '',
    variedadesicono: '',
    variedadesphsuelo: '',
    variedadesnecesidadriego: '',
    variedadestiposiembra: '',
    variedadesvolumenmaceta: '',
    variedadesluzsolar: '',
    variedadescaracteristicassuelo: '',
    variedadesdificultad: '',
    variedadeshistoria: ''
  });

  const [originalData, setOriginalData] = useState<any>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [calcPersonas, setCalcPersonas] = useState<number>(1);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'no-changes'>('idle');

  // -- AI Assistant State --
  const [aiLoading, setAiLoading] = useState(false);
  const [aiProposal, setAiProposal] = useState<any>(null);
  const [showAiModal, setShowAiModal] = useState(false);
  const [showAiConfig, setShowAiConfig] = useState(false);
  const [aiConfigPromptOpen, setAiConfigPromptOpen] = useState(false);
  const [aiExtraInstructions, setAiExtraInstructions] = useState('Busca datos específicos de esta variedad. Si tiene características propias distintas a la especie genérica (tamaño, color, precocidad, etc.), refléjalas con precisión.');
  const [aiSeconds, setAiSeconds] = useState(0);
  const aiTimerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.email) {
        setUserEmail(user.email);
      } else {
        setUserEmail(null);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (userEmail) {
      loadMasterData();
      if (variedadId) {
        loadVariedad();
        loadPhotos();
      } else {
        setLoading(false);
        const initData = { ...formData, xvariedadesvegetalesidespeciesvegetales: especieIdQuery || '' };
        setFormData(initData);
        setOriginalData(initData);
      }
    }
  }, [userEmail, variedadId]);

  useEffect(() => {
    if (formData.xvariedadesvegetalesidespeciesvegetales && userEmail) {
      loadGenericData(formData.xvariedadesvegetalesidespeciesvegetales);
    } else {
      setGenericData(null);
    }
  }, [formData.xvariedadesvegetalesidespeciesvegetales, userEmail]);

  useEffect(() => {
    if (originalData) {
      const isDifferent = JSON.stringify(formData) !== JSON.stringify(originalData);
      setHasChanges(isDifferent);
    }
  }, [formData, originalData]);

  const loadMasterData = async () => {
    try {
      const res = await fetch('/api/admin/especiesvegetales', { headers: { 'x-user-email': userEmail! } });
      const data = await res.json();
      setEspecies(data.especies || []);
    } catch (e) {
      console.error(e);
    }
  };

  const loadGenericData = async (especieId: string) => {
    try {
      const res = await fetch(`/api/admin/variedadesvegetales/generica/${especieId}`, { headers: { 'x-user-email': userEmail! } });
      const data = await res.json();
      setGenericData(data.generica || null);
    } catch (e) {
      console.error('Error cargando variedad genérica', e);
    }
  };

  const loadVariedad = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/variedadesvegetales/${variedadId}`, { headers: { 'x-user-email': userEmail! } });
      const data = await res.json();
      if (data.variedad) {
        const v = data.variedad;
        const parsed = {
          ...v,
          variedadestipo: v.variedadesvegetalestipo ? v.variedadesvegetalestipo.split(',') : [],
          variedadesciclo: v.variedadesvegetalesciclo ? v.variedadesvegetalesciclo.split(',') : []
        };
        setFormData(parsed);
        setOriginalData(parsed);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadPhotos = async () => {
    if (!variedadId || !userEmail) return;
    try {
      const res = await fetch(`/api/admin/variedadesvegetales/${variedadId}/photos`, { headers: { 'x-user-email': userEmail } });
      const data = await res.json();
      const loadedPhotos = data.photos || [];
      setPhotos(loadedPhotos);
      
      // Extraer color vibrante de la principal si existe
      const primary = loadedPhotos.find((p: any) => p.esPrincipal === 1);
      if (primary) {
        try {
          const meta = JSON.parse(primary.resumen || '{}');
          if (meta.vibrant_color) setVibrantColor(meta.vibrant_color);
        } catch(e){}
      }
    } catch (e) {
      console.error('Error loading photos:', e);
    }
  };

  const setPrimaryPhoto = async (photoId: string) => {
    try {
      const res = await fetch(`/api/admin/variedadesvegetales/${variedadId}/photos`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail! },
        body: JSON.stringify({ action: 'setPrimary', photoId })
      });
      if (res.ok) {
        await loadPhotos();
      }
    } catch (e) {
      console.error('Error setting primary:', e);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      if (name === 'variedadestipo' || name === 'variedadesciclo') {
        setFormData((prev: any) => ({
          ...prev,
          [name]: checked
            ? [...(prev[name] || []), value]
            : (prev[name] || []).filter((item: string) => item !== value)
        }));
      } else {
        setFormData((prev: any) => ({ ...prev, [name]: checked ? 1 : 0 }));
      }
    } else {
      setFormData((prev: any) => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Autoguardado inmediato para checkboxes y selects
    if (type === 'checkbox' || e.target.tagName === 'SELECT') {
      setTimeout(() => saveVariedad(), 100);
    }
  };

  const hasOverrides = (tab: string) => {
    if (!genericData) return false;
    const tabFields: Record<string, string[]> = {
      taxonomia: ['variedadesvegetalesnombrecientifico', 'variedadesfamilia', 'variedadestipo', 'variedadesciclo', 'variedadescolor', 'variedadestamano', 'variedadesdificultad', 'variedadesluzsolar', 'variedadesnecesidadriego', 'variedadesvolumenmaceta'],
      fisiologia: ['variedadesdiasgerminacion', 'variedadesdiashastatrasplante', 'variedadesviabilidadsemilla', 'variedadespeso1000semillas', 'variedadesdiascrecimientofirme', 'variedadesdiashastafructificacion', 'variedadesdiashastarecoleccion', 'variedadestemperaturaminima', 'variedadestemperaturaoptima', 'variedadestemperaturamaxima', 'variedadesmarcoplantas', 'variedadesmarcofilas', 'variedadesprofundidadsiembra', 'variedadesprofundidadtrasplante'],
      calendarios: ['variedadessemillerodesde', 'variedadessemillerohasta', 'variedadessiembradirectadesde', 'variedadessiembradirectahasta', 'variedadestrasplantedesde', 'variedadestrasplantehasta', 'variedadesrecolecciondesde', 'variedadesrecoleccionhasta'],
      autosuficiencia: ['variedadesautosuficiencia', 'variedadesautosuficienciaparcial', 'variedadesautosuficienciaconserva', 'variedadesmarcomargen']
    };

    const fields = tabFields[tab] || [];
    return fields.some(f => {
      const v = formData[f];
      const g = genericData[f];
      if (f === 'variedadestipo' || f === 'variedadesciclo') {
        const vArr = Array.isArray(v) ? v : [];
        const gArr = typeof g === 'string' ? g.split(',').filter(Boolean) : (Array.isArray(g) ? g : []);
        return vArr.length > 0 && JSON.stringify([...vArr].sort()) !== JSON.stringify([...gArr].sort());
      }
      
      let parsedV: any = v;
      let parsedG: any = g;
      if (typeof v === 'string' && v !== '' && !isNaN(parseFloat(v))) parsedV = parseFloat(v);
      if (typeof g === 'string' && g !== '' && !isNaN(parseFloat(g))) parsedG = parseFloat(g);

      return v !== '' && v !== null && v !== undefined && parsedV != parsedG;
    });
  };

  const revertField = (field: string, isCheckbox: boolean) => {
    const newVal = isCheckbox ? [] : '';
    setFormData((prev: any) => ({ ...prev, [field]: newVal }));
    // Force save after state update
    setTimeout(() => {
      const updatedData = { ...formData, [field]: newVal };
      saveVariedad(updatedData);
    }, 50);
  };

  // -- AI Assistant Functions --
  const openAiConfig = () => {
    if (!formData.variedadesvegetalesnombre) {
      alert('Introduce primero el nombre de la variedad.');
      return;
    }
    setShowAiConfig(true);
  };

  const closeAiModal = () => {
    setShowAiModal(false);
  }

  const callVariedadAI = async () => {
    if (!formData.variedadesvegetalesnombre) return;
    setAiLoading(true);
    setAiSeconds(0);
    aiTimerRef.current = setInterval(() => setAiSeconds(s => s + 1), 1000);
    try {
      const especieNombre = especies.find((e: any) => e.idespeciesvegetales == formData.xvariedadesvegetalesidespeciesvegetales)?.especiesvegetalesnombre || genericData?.especiesvegetalesnombre || '';
      const res = await fetch('/api/ai/variedad-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': userEmail || ''
        },
        body: JSON.stringify({ 
          nombreVariedad: formData.variedadesvegetalesnombre, 
          nombreEspecie: especieNombre,
          customPrompt: aiExtraInstructions 
        })
      });
      const data = await res.json();
      if (data.success) {
        setAiProposal(data.data);
        setShowAiConfig(false);
        setShowAiModal(true);
      } else {
        alert('Error IA: ' + data.error);
      }
    } catch (err) {
      alert('Error llamando a la IA');
    } finally {
      setAiLoading(false);
      if (aiTimerRef.current) { clearInterval(aiTimerRef.current); aiTimerRef.current = null; }
    }
  };

  const aiGroups = [
    {
      id: 'taxonomia',
      title: '\uD83E\uDDEC Taxonomía',
      keys: ['variedadesvegetalesnombrecientifico', 'variedadesfamilia', 'variedadestipo', 'variedadesciclo', 'variedadescolor', 'variedadestamano', 'variedadesdificultad', 'variedadesluzsolar', 'variedadesnecesidadriego', 'variedadesvolumenmaceta'],
      labels: {
        variedadesvegetalesnombrecientifico: 'Nombre Científico',
        variedadesfamilia: 'Familia',
        variedadestipo: 'Tipos',
        variedadesciclo: 'Ciclo',
        variedadescolor: 'Color',
        variedadestamano: 'Tamaño',
        variedadesdificultad: 'Dificultad',
        variedadesluzsolar: 'Luz Solar',
        variedadesnecesidadriego: 'Nec. Riego',
        variedadesvolumenmaceta: 'Vol. Maceta (L)'
      }
    },
    {
      id: 'fisiologia',
      title: '\uD83C\uDF31 Fisiología',
      keys: ['variedadesdiasgerminacion', 'variedadesviabilidadsemilla', 'variedadespeso1000semillas', 'variedadesdiashastatrasplante', 'variedadesdiascrecimientofirme', 'variedadesdiashastafructificacion', 'variedadesdiashastarecoleccion', 'variedadestemperaturaminima', 'variedadestemperaturaoptima', 'variedadestemperaturamaxima', 'variedadesmarcoplantas', 'variedadesmarcofilas', 'variedadesprofundidadsiembra', 'variedadesprofundidadtrasplante'],
      labels: {
        variedadesdiasgerminacion: 'Días Germinación',
        variedadesviabilidadsemilla: 'Viabilidad Semilla (Años)',
        variedadespeso1000semillas: 'Peso 1.000 Semillas (g)',
        variedadesdiashastatrasplante: 'Días a Trasplante',
        variedadesdiascrecimientofirme: 'Días a Crec. Firme',
        variedadesdiashastafructificacion: 'Días a Fructificación',
        variedadesdiashastarecoleccion: 'Días a Recolección',
        variedadestemperaturaminima: 'Temp. Mínima (°C)',
        variedadestemperaturaoptima: 'Temp. Óptima (°C)',
        variedadestemperaturamaxima: 'Temp. Máxima (°C)',
        variedadesmarcoplantas: 'Marco Plantas (cm)',
        variedadesmarcofilas: 'Marco Filas (cm)',
        variedadesprofundidadsiembra: 'Profundidad Siembra (cm)',
        variedadesprofundidadtrasplante: 'Profundidad Trasplante (cm)'
      }
    },
    {
      id: 'calendarios',
      title: '\uD83D\uDCC5 Calendarios',
      keys: ['variedadessemillerodesde', 'variedadessemillerohasta', 'variedadessiembradirectadesde', 'variedadessiembradirectahasta', 'variedadestrasplantedesde', 'variedadestrasplantehasta', 'variedadesrecolecciondesde', 'variedadesrecoleccionhasta'],
      labels: {
        variedadessemillerodesde: 'Semillero (Desde)',
        variedadessemillerohasta: 'Semillero (Hasta)',
        variedadessiembradirectadesde: 'Siembra Dir. (Desde)',
        variedadessiembradirectahasta: 'Siembra Dir. (Hasta)',
        variedadestrasplantedesde: 'Trasplante (Desde)',
        variedadestrasplantehasta: 'Trasplante (Hasta)',
        variedadesrecolecciondesde: 'Recolección (Desde)',
        variedadesrecoleccionhasta: 'Recolección (Hasta)'
      }
    },
    {
      id: 'autosuficiencia',
      title: '\u2696\uFE0F Autosuficiencia',
      keys: ['variedadesautosuficienciaparcial', 'variedadesautosuficiencia', 'variedadesautosuficienciaconserva', 'variedadesmarcomargen'],
      labels: {
        variedadesautosuficienciaparcial: 'Autosuf. Parcial',
        variedadesautosuficiencia: 'Autosuf. Completa',
        variedadesautosuficienciaconserva: 'Autosuf. Conserva',
        variedadesmarcomargen: 'Margen al Borde (cm)'
      }
    },
    {
      id: 'suelo',
      title: '\uD83D\uDEDC Suelo',
      keys: ['variedadesphsuelo', 'variedadescaracteristicassuelo', 'variedadestiposiembra'],
      labels: {
        variedadesphsuelo: 'pH Suelo',
        variedadescaracteristicassuelo: 'Tipo de Suelo',
        variedadestiposiembra: 'Tipo Siembra'
      }
    },
    {
      id: 'textos',
      title: '\uD83D\uDCDD Textos',
      keys: ['variedadeshistoria', 'variedadesdescripcion'],
      labels: {
        variedadeshistoria: 'Historia',
        variedadesdescripcion: 'Descripción'
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
    // Trigger save after state update
    setTimeout(() => saveVariedad({ ...formData, ...updates }), 100);
  };

  const assimilateAll = () => {
    if (!aiProposal) return;
    const allKeys = aiGroups.flatMap(g => g.keys);
    const updates: any = {};
    allKeys.forEach(k => {
      if (aiProposal[k] !== undefined && aiProposal[k] !== null) {
        updates[k] = aiProposal[k];
      }
    });
    setFormData((prev: any) => ({ ...prev, ...updates }));
    setTimeout(() => saveVariedad({ ...formData, ...updates }), 100);
    setShowAiModal(false);
  };

  const handleBlurSave = () => {
    saveVariedad();
  };

  const saveVariedad = async (dataToSave = formData) => {
    // Verificar si hay cambios reales respecto al original
    const hasChanges = JSON.stringify(dataToSave) !== JSON.stringify(originalData);

    if (!hasChanges) {
      setSaveStatus('no-changes');
      setTimeout(() => setSaveStatus('idle'), 2000);
      return;
    }
    
    setSaveStatus('saving');
    try {
      const method = variedadId ? 'PUT' : 'POST';
      const url = variedadId ? `/api/admin/variedadesvegetales/${variedadId}` : '/api/admin/variedadesvegetales';
      
      // Preparar datos para el envío (unir arrays)
      const submitData = { ...dataToSave };
      
      // Eliminar campos que vienen de JOINS y no pertenecen a la tabla variedades
      delete (submitData as any).especiesvegetalesnombre;
      delete (submitData as any).especiesvegetalesicono;

      if (Array.isArray(submitData.variedadestipo)) submitData.variedadestipo = submitData.variedadestipo.join(',');
      if (Array.isArray(submitData.variedadesciclo)) submitData.variedadesciclo = submitData.variedadesciclo.join(',');

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail! },
        body: JSON.stringify(submitData)
      });
      const data = await res.json();
      if (data.success) {
        setOriginalData({ ...dataToSave });
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
        if (!variedadId) {
          router.push(`/dashboard/admin/variedadesvegetales/${data.id}`);
        }
      } else {
        console.error('Error saving:', data.error);
        setSaveStatus('idle');
      }
    } catch (e) {
      console.error(e);
      setSaveStatus('idle');
    }
  };

  const FieldCompare = ({ label, field, type = 'text', options = null, isCheckboxGroup = false, hideRevert = false, step }: { label: string, field: string, type?: string, options?: any[] | null, isCheckboxGroup?: boolean, hideRevert?: boolean, step?: string }) => {
    const rawStandardValue = genericData ? genericData[field] : (isCheckboxGroup ? [] : '');
    let standardValue = (isCheckboxGroup && typeof rawStandardValue === 'string') ? rawStandardValue.split(',').filter(Boolean) : (rawStandardValue || (isCheckboxGroup ? [] : ''));

    // Fix numeric formats (e.g., '3.000' -> '3') to prevent false overrides
    if (type === 'number' && typeof standardValue === 'string' && standardValue.trim() !== '') {
      const parsedNum = parseFloat(standardValue);
      if (!isNaN(parsedNum)) {
        standardValue = parsedNum.toString();
      }
    }

    const currentVal = formData[field];
    let formattedCurrentVal = currentVal;
    if (type === 'number' && typeof currentVal === 'string' && currentVal.trim() !== '') {
      const parsedNum = parseFloat(currentVal);
      if (!isNaN(parsedNum)) formattedCurrentVal = parsedNum.toString();
    }

    const isOverridden = isCheckboxGroup 
      ? ((currentVal || []).length > 0 && JSON.stringify([...(currentVal || [])].sort()) !== JSON.stringify([...standardValue].sort()))
      : (formattedCurrentVal !== '' && formattedCurrentVal !== null && formattedCurrentVal !== undefined && formattedCurrentVal != standardValue);
    
    const isInherited = isCheckboxGroup 
      ? (currentVal || []).length === 0
      : !formattedCurrentVal;

    return (
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '220px 1fr 50px 1fr', 
        borderBottom: '1px solid #e2e8f0',
        alignItems: 'stretch',
        minHeight: '60px'
      }}>
        {/* Columna 1: Etiqueta */}
        <div style={{ 
          padding: '16px', 
          background: '#f8fafc', 
          borderRight: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          fontWeight: '600',
          color: '#475569',
          fontSize: '0.85rem'
        }}>
          {label}
        </div>

        {/* Columna 2: Valor Estándar (Gold) */}
        <div style={{ 
          padding: '12px 16px', 
          borderRight: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          background: '#ffffff',
          opacity: 0.8
        }}>
          {isCheckboxGroup && options ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {options.map(opt => {
                const val = typeof opt === 'string' ? opt : opt.value;
                const lab = typeof opt === 'string' ? opt : opt.label;
                const isChecked = standardValue.includes(val);
                return (
                  <span key={val} style={{ 
                    fontSize: '0.75rem', 
                    padding: '2px 8px', 
                    borderRadius: '12px', 
                    background: isChecked ? '#e2e8f0' : '#f1f5f9',
                    color: isChecked ? '#475569' : '#cbd5e1',
                    border: isChecked ? '1px solid #cbd5e1' : '1px solid transparent'
                  }}>
                    {lab}
                  </span>
                );
              })}
            </div>
          ) : options ? (
            <span style={{ color: '#64748b', fontSize: '0.9rem' }}>{options.find(o => o.value == standardValue)?.label || standardValue || '--'}</span>
          ) : (
            <span style={{ color: '#64748b', fontSize: '0.9rem' }}>{standardValue || '--'}</span>
          )}
        </div>

        {/* Columna 3: Estado / Acción (EN MEDIO) */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          borderRight: '1px solid #e2e8f0',
          background: hideRevert ? '#f8fafc' : (isOverridden ? '#f5f3ff' : '#f0fdf4'),
          transition: 'all 0.3s ease'
        }}>
          {hideRevert ? (
            <span style={{ fontSize: '0.9rem', opacity: 0.3 }}>--</span>
          ) : isOverridden ? (
            <button 
              type="button" 
              onClick={() => revertField(field, isCheckboxGroup || false)}
              title="Revertir al estándar"
              style={{ 
                background: '#7c3aed', 
                color: 'white', 
                border: 'none', 
                borderRadius: '50%', 
                width: '26px', 
                height: '26px', 
                fontSize: '14px', 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 4px rgba(124, 58, 237, 0.3)',
                transition: 'transform 0.2s'
              }}
              onMouseOver={e => e.currentTarget.style.transform = 'rotate(-90deg)'}
              onMouseOut={e => e.currentTarget.style.transform = 'rotate(0deg)'}
            >
              ↺
            </button>
          ) : (
            <span style={{ color: '#22c55e', fontSize: '1.1rem', filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.1))' }} title="Idéntico al estándar">
              ✅
            </span>
          )}
        </div>

        {/* Columna 4: Valor Variedad (Editable) */}
        <div style={{ 
          padding: '8px 16px', 
          background: isOverridden ? '#f5f3ff' : (isInherited ? '#f0f9ff' : 'white'),
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          transition: 'all 0.2s ease'
        }}>
          {isCheckboxGroup && options ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {options.map(opt => {
                const val = typeof opt === 'string' ? opt : opt.value;
                const lab = typeof opt === 'string' ? opt : opt.label;
                const isChecked = isInherited ? standardValue.includes(val) : (formData[field] || []).includes(val);
                return (
                  <label key={val} style={{ 
                    fontSize: '0.75rem', 
                    color: isInherited ? '#64748b' : '#1e293b', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '4px', 
                    cursor: 'pointer',
                    fontStyle: isInherited ? 'italic' : 'normal'
                  }}>
                    <input type="checkbox" name={field} value={val} checked={isChecked} onChange={handleChange} onBlur={handleBlurSave} /> {lab}
                  </label>
                );
              })}
            </div>
          ) : options ? (
            <select 
              name={field}
              value={formData[field] || ''} 
              onChange={handleChange} 
              onBlur={handleBlurSave}
              style={{ 
                width: '100%', border: 'none', background: 'transparent', outline: 'none', 
                fontSize: '0.9rem', 
                color: isOverridden ? '#7c3aed' : (isInherited ? '#64748b' : '#0f172a'), 
                fontWeight: isOverridden ? 'bold' : 'normal',
                fontStyle: isInherited ? 'italic' : 'normal'
              }}
            >
              <option value="" style={{ fontStyle: 'italic' }}>{options.find(o => o.value == standardValue)?.label || standardValue || '--'}</option>
              {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          ) : type === 'textarea' ? (
            <textarea 
              name={field}
              value={formData[field] || ''} 
              onChange={handleChange} 
              onBlur={handleBlurSave}
              placeholder={String(standardValue || '--')}
              rows={3}
              style={{ 
                width: '100%', border: 'none', background: 'transparent', outline: 'none', 
                fontSize: '0.9rem', 
                color: isOverridden ? '#7c3aed' : '#0f172a', 
                fontWeight: isOverridden ? 'bold' : 'normal',
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
            />
          ) : (
            <input 
              type={type} 
              name={field}
              value={formData[field] || ''} 
              onChange={handleChange} 
              onBlur={handleBlurSave}
              placeholder={String(standardValue || '--')}
              step={step}
              style={{ 
                width: '100%', border: 'none', background: 'transparent', outline: 'none', 
                fontSize: '0.9rem', 
                color: isOverridden ? '#7c3aed' : '#0f172a', 
                fontWeight: isOverridden ? 'bold' : 'normal'
              }}
            />
          )}
        </div>
      </div>
    );
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Cargando variedad...</div>;

  return (
    <>
      <div style={{ marginBottom: '16px', padding: '0 4px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <PremiumBackButton onClick={() => router.push('/dashboard')} text="🏠 Volver al Inicio" />
        {searchParams.get('from') === 'pdfs' ? (
          <PremiumBackButton onClick={() => router.push('/dashboard/admin/pdfs')} text="🔙 Volver a Gestor de PDFs" />
        ) : (
          <PremiumBackButton onClick={() => router.push(`/dashboard/admin/especiesvegetales/${formData.xvariedadesvegetalesidespeciesvegetales}?tab=variedades&focus=${variedadId}`)} text="🌳 Volver a Especie Padre" />
        )}
      </div>

      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
        <form style={{ flex: 1, background: 'white', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', border: '1px solid #e2e8f0', position: 'relative' }}>
          
          <div style={{ 
            padding: '24px', 
            background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)', 
            borderRadius: '12px', 
            marginBottom: '24px',
            border: '1px solid #ddd6fe',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <h1 style={{ margin: 0, color: '#1e1b4b', fontSize: '1.8rem', fontWeight: '800' }}>
                {especies.find(e => e.idespeciesvegetales == formData.xvariedadesvegetalesidespeciesvegetales)?.especiesvegetalesnombre || 'Cargando...'} — <span style={{ color: '#7c3aed' }}>{formData.variedadesvegetalesnombre || 'Nueva Variedad'}</span>
              </h1>
              {saveStatus !== 'idle' && (
                <span style={{ 
                  fontSize: '0.75rem', 
                  fontWeight: 'bold', 
                  color: saveStatus === 'saved' ? '#065f46' : '#1e3a8a',
                  background: saveStatus === 'saved' ? '#d1fae5' : '#dbeafe',
                  padding: '4px 10px',
                  borderRadius: '12px',
                  border: `1px solid ${saveStatus === 'saved' ? '#a7f3d0' : '#bfdbfe'}`
                }}>
                  {saveStatus === 'saving' ? '⏳ Guardando...' : '✓ Guardado'}
                </span>
              )}
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label style={{ fontWeight: 'bold', color: '#475569', fontSize: '1.05rem', display: 'block', marginBottom: '8px' }}>
              Nombre de la Variedad <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input 
              type="text" 
              name="variedadesvegetalesnombre" 
              required
              value={formData.variedadesvegetalesnombre || ''} 
              onChange={handleChange} 
              placeholder="Ej. Cherry, Roma, Kumato, Raf..."
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #ddd6fe',
                borderRadius: '10px',
                fontSize: '1.1rem',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
                outline: 'none',
                transition: 'all 0.2s ease',
                fontWeight: '600',
                color: '#1e1b4b',
                background: '#fcfbfe',
                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)'
              }}
              onFocus={e => {
                e.target.style.borderColor = '#7c3aed';
                e.target.style.background = '#ffffff';
                e.target.style.boxShadow = '0 0 0 3px rgba(124, 58, 237, 0.15), inset 0 1px 2px rgba(0,0,0,0.05)';
              }}
              onBlur={e => {
                e.target.style.borderColor = '#ddd6fe';
                e.target.style.background = '#fcfbfe';
                e.target.style.boxShadow = 'inset 0 1px 2px rgba(0,0,0,0.05)';
                handleBlurSave();
              }}
            />
          </div>

          <PremiumVisibilityToggle 
            name="variedadesvegetalesvisibilidadsino"
            label="Variedad con Visibilidad Global (Pública)"
            checked={!!formData.variedadesvegetalesvisibilidadsino}
            onChange={handleChange}
          />

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
              <div style={{ display: 'flex', gap: 0, alignItems: 'center' }}>
                {/* Hero photo */}
                {(() => {
                  const sortedPhotos = [...photos].sort((a, b) => (b.esPrincipal || 0) - (a.esPrincipal || 0));
                  const heroPhoto = sortedPhotos[0];
                  let heroMeta: any = {};
                  try { heroMeta = JSON.parse(heroPhoto.resumen || '{}'); } catch(e){}
                  const hFilter = heroMeta.profile_style ? STYLE_FILTERS[heroMeta.profile_style] : 'none';
                  const fullFilter = (heroMeta.profile_brightness !== undefined || heroMeta.profile_contrast !== undefined)
                    ? `brightness(${heroMeta.profile_brightness ?? 100}%) contrast(${heroMeta.profile_contrast ?? 100}%) ${heroMeta.profile_style ? STYLE_FILTERS[heroMeta.profile_style] : ''}`.trim()
                    : hFilter;

                  return (
                    <>
                      <div style={{ position: 'relative', flexShrink: 0, width: '180px', height: '220px', overflow: 'hidden' }}>
                        <img 
                          src={getMediaUrl(heroPhoto.ruta)}
                          alt={heroMeta.seo_alt || formData.variedadesvegetalesnombre}
                          style={{ 
                            width: '100%', height: '100%', objectFit: 'cover',
                            objectPosition: `${heroMeta.profile_object_x ?? 50}% ${heroMeta.profile_object_y ?? 50}%`,
                            transform: `scale(${(heroMeta.profile_object_zoom ?? 100) / 100})`,
                            filter: fullFilter
                          }}
                          crossOrigin="anonymous" 
                        />
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', padding: '0 12px' }}>
                          {sortedPhotos.slice(1, 4).map((p) => {
                            let tMeta: any = {};
                            try { tMeta = JSON.parse(p.resumen || '{}'); } catch (e) { }
                            return (
                              <div 
                                key={p.id} 
                                onClick={() => setPrimaryPhoto(p.id)}
                                style={{ 
                                  width: '52px', height: '70px', borderRadius: '8px', overflow: 'hidden', cursor: 'pointer',
                                  border: '2px solid rgba(0,0,0,0.08)', transition: 'all 0.2s ease'
                                }}
                                onMouseOver={e => { e.currentTarget.style.borderColor = '#7c3aed'; e.currentTarget.style.transform = 'scale(1.05)'; }}
                                onMouseOut={e => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'scale(1)'; }}
                              >
                                <img 
                                  src={getMediaUrl(p.ruta)}
                                  alt=""
                                  style={{ 
                                    width: '100%', height: '100%', objectFit: 'cover',
                                    objectPosition: 'center center'
                                  }} 
                                  crossOrigin="anonymous" 
                                />
                              </div>
                            );
                          })}
                        </div>
                    </>
                  );
                })()}
              </div>
            ) : (
              <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '2rem' }}>🧪</span>
                <h2 style={{ margin: 0, color: '#1e293b', fontSize: '1.2rem' }}>Sin fotos en la galería de variedad</h2>
              </div>
            )}
          </div>

          <div 
            className="collapsible-header"
            onClick={() => {
              const next = !isVariedadOpen;
              setIsVariedadOpen(next);
              if (next) setActiveTab('taxonomia');
            }}
            style={{ 
              padding: '15px 24px', 
              background: '#f8fafc', 
              cursor: 'pointer', 
              fontWeight: 'bold', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              borderBottom: isVariedadOpen ? '1px solid #e2e8f0' : 'none',
              borderRadius: isVariedadOpen ? '16px 16px 0 0' : '16px',
              marginTop: '20px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.2rem', color: '#7c3aed' }}>🧬</span>
              <h2 style={{ margin: 0, color: '#0f172a', fontSize: '1.1rem' }}>Ficha Técnica</h2>
              {!isVariedadOpen && (
                <span style={{ color: '#64748b', fontWeight: 'normal', fontSize: '0.9rem', marginLeft: '8px' }}>
                  — {especies.find(e => e.idespeciesvegetales == formData.xvariedadesvegetalesidespeciesvegetales)?.especiesvegetalesnombre || '...'} / {formData.variedadesvegetalesnombre || 'Nueva Variedad'}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: saveStatus === 'idle' ? '0' : '6px 12px', background: saveStatus === 'idle' ? 'transparent' : '#f1f5f9', borderRadius: '20px', border: saveStatus === 'idle' ? 'none' : '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: saveStatus === 'saved' ? '#10b981' : saveStatus === 'saving' ? '#3b82f6' : 'transparent' }}>
                  {saveStatus === 'saving' ? '⏳ Guardando...' : saveStatus === 'saved' ? '✓ Guardado' : ''}
                </span>
              </div>
              <span style={{ color: '#94a3b8' }}>{isVariedadOpen ? '▲' : '▼'}</span>
            </div>
          </div>

          {isVariedadOpen && (
            <div className="collapsible-content" style={{ padding: '24px', border: '1px solid #e2e8f0', borderTop: 'none', borderRadius: '0 0 16px 16px' }}>
              {variedadId && formData.variedadesvegetalesnombre && (
                <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '16px' }}>
                  <PremiumAiButton 
                    onClick={openAiConfig} 
                    isLoading={aiLoading} 
                    loadingText="⏳ Pensando..."
                    text="✨ Asistente IA"
                    style={{ fontSize: '0.9rem', padding: '8px 20px' }}
                  />
                </div>
              )}
              <div className="form-tabs">
                <button type="button" className={activeTab === 'taxonomia' ? 'active' : ''} onClick={() => setActiveTab('taxonomia')}>
                  🧬 Taxonomía {hasOverrides('taxonomia') && <span style={{ marginLeft: '4px', width: '8px', height: '8px', background: '#7c3aed', borderRadius: '50%', display: 'inline-block' }} title="Contiene sobrescritos"></span>}
                </button>
                <button type="button" className={activeTab === 'fisiologia' ? 'active' : ''} onClick={() => setActiveTab('fisiologia')}>
                  🌱 Fisiología {hasOverrides('fisiologia') && <span style={{ marginLeft: '4px', width: '8px', height: '8px', background: '#7c3aed', borderRadius: '50%', display: 'inline-block' }} title="Contiene sobrescritos"></span>}
                </button>
                <button type="button" className={activeTab === 'calendarios' ? 'active' : ''} onClick={() => setActiveTab('calendarios')}>
                  📅 Calendarios {hasOverrides('calendarios') && <span style={{ marginLeft: '4px', width: '8px', height: '8px', background: '#7c3aed', borderRadius: '50%', display: 'inline-block' }} title="Contiene sobrescritos"></span>}
                </button>
                <button type="button" className={activeTab === 'autosuficiencia' ? 'active' : ''} onClick={() => setActiveTab('autosuficiencia')}>
                  ⚖️ Autosuficiencia {hasOverrides('autosuficiencia') && <span style={{ marginLeft: '4px', width: '8px', height: '8px', background: '#7c3aed', borderRadius: '50%', display: 'inline-block' }} title="Contiene sobrescritos"></span>}
                </button>
                <button type="button" className={activeTab === 'fotos' ? 'active' : ''} onClick={() => setActiveTab('fotos')}>📷 Fotos</button>
                <button type="button" className={activeTab === 'pdfs' ? 'active' : ''} onClick={() => setActiveTab('pdfs')}>📄 PDFs</button>
              </div>

              <div className="form-tab-content">
                {activeTab === 'taxonomia' && (
                  <div className="grid-form" style={{ maxWidth: '100%', gridTemplateColumns: '1fr' }}>
                    <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: '220px 1fr 50px 1fr', 
                        background: '#f1f5f9', 
                        borderBottom: '2px solid #e2e8f0',
                        fontWeight: '800',
                        fontSize: '0.7rem',
                        color: '#64748b',
                        textTransform: 'uppercase',
                        letterSpacing: '1px'
                      }}>
                        <div style={{ padding: '12px 16px', borderRight: '1px solid #e2e8f0' }}>Propiedad</div>
                        <div style={{ padding: '12px 16px', borderRight: '1px solid #e2e8f0' }}>Referencia Especie</div>
                        <div style={{ padding: '12px 16px', borderRight: '1px solid #e2e8f0', textAlign: 'center' }}>Sync</div>
                        <div style={{ padding: '12px 16px' }}>Variedad</div>
                      </div>


                      <FieldCompare label="Nombre Científico" field="variedadesvegetalesnombrecientifico" type="text" />
                      <FieldCompare label="Familia" field="variedadesfamilia" type="text" />
                      <FieldCompare label="Tipos" field="variedadestipo" isCheckboxGroup options={TIPOS} />
                      <FieldCompare label="Ciclo" field="variedadesciclo" isCheckboxGroup options={CICLOS} />
                      <FieldCompare label="Color Fenotípico" field="variedadescolor" type="text" />
                      <FieldCompare 
                        label="Tamaño General" 
                        field="variedadestamano" 
                        options={[
                          { value: 'pequeno', label: 'Pequeño' },
                          { value: 'mediano', label: 'Mediano' },
                          { value: 'grande', label: 'Grande' }
                        ]} 
                      />
                      <FieldCompare 
                        label="Dificultad" 
                        field="variedadesdificultad" 
                        options={[
                          { value: 'baja', label: 'Baja' },
                          { value: 'media', label: 'Media' },
                          { value: 'alta', label: 'Alta' }
                        ]} 
                      />
                      <FieldCompare 
                        label="Luz Solar" 
                        field="variedadesluzsolar" 
                        options={[
                          { value: 'pleno_sol', label: 'Pleno Sol' },
                          { value: 'semisombra', label: 'Semisombra' },
                          { value: 'sombra', label: 'Sombra' }
                        ]} 
                      />
                      <FieldCompare 
                        label="Necesidad de Riego" 
                        field="variedadesnecesidadriego" 
                        options={[
                          { value: 'baja', label: 'Baja' },
                          { value: 'media', label: 'Media' },
                          { value: 'alta', label: 'Alta' }
                        ]} 
                      />
                      <FieldCompare label="Volumen Maceta (L)" field="variedadesvolumenmaceta" type="number" />
                      <FieldCompare label="Descripción y Notas" field="variedadesdescripcion" type="textarea" />
                    </div>
                  </div>
                )}

                {activeTab === 'fisiologia' && (
                  <div className="grid-form" style={{ maxWidth: '100%', gridTemplateColumns: '1fr' }}>
                    <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '15px' }}>Compara y sobrescribe los valores genéricos de la especie padre. Si dejas un campo vacío, la variedad utilizará el valor estándar.</p>
                    <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr 50px 1fr', background: '#f1f5f9', borderBottom: '2px solid #e2e8f0', fontWeight: '800', fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        <div style={{ padding: '12px 16px', borderRight: '1px solid #e2e8f0' }}>Propiedad</div>
                        <div style={{ padding: '12px 16px', borderRight: '1px solid #e2e8f0' }}>Referencia Especie</div>
                        <div style={{ padding: '12px 16px', borderRight: '1px solid #e2e8f0', textAlign: 'center' }}>Sync</div>
                        <div style={{ padding: '12px 16px' }}>Variedad</div>
                      </div>
                      <FieldCompare 
                        label="Tipo de Siembra Principal" 
                        field="variedadestiposiembra" 
                        options={[
                          { value: 'directa', label: 'Directa (En tierra)' },
                          { value: 'semillero', label: 'Semillero (Requiere trasplante)' },
                          { value: 'ambas', label: 'Ambas opciones posibles' }
                        ]} 
                      />
                      <FieldCompare label="Viabilidad de la Semilla (Años)" field="variedadesviabilidadsemilla" type="number" />
                      <FieldCompare label="Peso de 1.000 Semillas (g)" field="variedadespeso1000semillas" type="number" step="0.001" />
                      <FieldCompare label="Días a Germinación" field="variedadesdiasgerminacion" type="number" />
                      <FieldCompare label="Días a Trasplante" field="variedadesdiashastatrasplante" type="number" />
                      <FieldCompare label="Días a Crecimiento Firme" field="variedadesdiascrecimientofirme" type="number" />
                      <FieldCompare label="Días a Primer Fruto" field="variedadesdiashastafructificacion" type="number" />
                      <FieldCompare label="Días a Recolección Final" field="variedadesdiashastarecoleccion" type="number" />
                      <FieldCompare label="Duración Total (Fin Ciclo)" field="variedadesduraciontotal" type="number" />
                      <FieldCompare label="Temperatura Mínima (°C)" field="variedadestemperaturaminima" type="number" />
                      <FieldCompare label="Temperatura Óptima (°C)" field="variedadestemperaturaoptima" type="number" />
                      <FieldCompare label="Temperatura Máxima (°C)" field="variedadestemperaturamaxima" type="number" />
                      <FieldCompare label="Profundidad de Siembra (cm)" field="variedadesprofundidadsiembra" type="number" />
                      <FieldCompare label="Profundidad de Trasplante" field="variedadesprofundidadtrasplante" type="text" />
                    </div>
                  </div>
                )}

                {activeTab === 'calendarios' && (
                  <div className="grid-form" style={{ maxWidth: '100%', gridTemplateColumns: '1fr' }}>
                    <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '15px' }}>Compara y ajusta los meses de cultivo. Los valores vacíos utilizarán el estándar de la especie.</p>
                    
                    <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', marginBottom: '30px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr 50px 1fr', background: '#f1f5f9', borderBottom: '2px solid #e2e8f0', fontWeight: '800', fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        <div style={{ padding: '12px 16px', borderRight: '1px solid #e2e8f0' }}>Fase de Cultivo</div>
                        <div style={{ padding: '12px 16px', borderRight: '1px solid #e2e8f0' }}>Referencia Especie</div>
                        <div style={{ padding: '12px 16px', borderRight: '1px solid #e2e8f0', textAlign: 'center' }}>Sync</div>
                        <div style={{ padding: '12px 16px' }}>Variedad</div>
                      </div>

                      <div style={{ background: '#f8fafc', padding: '10px 16px', borderBottom: '1px solid #e2e8f0', fontWeight: 'bold', fontSize: '0.75rem', color: '#0f766e' }}>🌱 SIEMBRA SEMILLERO</div>
                      <FieldCompare label="Mes Inicio" field="variedadessemillerodesde" type="number" />
                      <FieldCompare label="Mes Fin" field="variedadessemillerohasta" type="number" />

                      <div style={{ background: '#fff7ed', padding: '10px 16px', borderBottom: '1px solid #e2e8f0', fontWeight: 'bold', fontSize: '0.75rem', color: '#c2410c' }}>🚜 SIEMBRA DIRECTA</div>
                      <FieldCompare label="Mes Inicio" field="variedadessiembradirectadesde" type="number" />
                      <FieldCompare label="Mes Fin" field="variedadessiembradirectahasta" type="number" />

                      <div style={{ background: '#f5f3ff', padding: '10px 16px', borderBottom: '1px solid #e2e8f0', fontWeight: 'bold', fontSize: '0.75rem', color: '#7c3aed' }}>🌿 TRASPLANTE</div>
                      <FieldCompare label="Mes Inicio" field="variedadestrasplantedesde" type="number" />
                      <FieldCompare label="Mes Fin" field="variedadestrasplantehasta" type="number" />

                      <div style={{ background: '#f0fdf4', padding: '10px 16px', borderBottom: '1px solid #e2e8f0', fontWeight: 'bold', fontSize: '0.75rem', color: '#15803d' }}>🧺 RECOLECCIÓN</div>
                      <FieldCompare label="Mes Inicio" field="variedadesrecolecciondesde" type="number" />
                      <FieldCompare label="Mes Fin" field="variedadesrecoleccionhasta" type="number" />
                    </div>

                    <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                      {/* COLUMNA ORO (ESPECIE) */}
                      <div>
                        <h3 style={{ fontSize: '0.9rem', color: '#15803d', borderBottom: '1px solid #dcfce7', paddingBottom: '8px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          🏆 Gold Standard (Especie)
                        </h3>
                        <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', overflow: 'hidden', opacity: 0.8 }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '60px repeat(12, 1fr)', background: '#f1f5f9', borderBottom: '1px solid #e2e8f0' }}>
                            <div style={{ padding: '6px 2px', fontWeight: 'bold', color: '#64748b', fontSize: '0.6rem', borderRight: '1px solid #e2e8f0', textAlign: 'center' }}>FASE</div>
                            {MESES.map(m => (
                              <div key={m.val} style={{ padding: '6px 0', textAlign: 'center', fontWeight: 'bold', color: '#475569', fontSize: '0.6rem', borderRight: m.val < 12 ? '1px solid #e2e8f0' : 'none' }}>
                                {m.label.charAt(0)}
                              </div>
                            ))}
                          </div>
                          {['semillero', 'siembradirecta', 'trasplante', 'recoleccion'].map((tipo, idx) => {
                            const colorMap: Record<string, string> = { siembradirecta: '#f97316', semillero: '#3b82f6', trasplante: '#a855f7', recoleccion: '#22c55e' };
                            const labelMap: Record<string, string> = { siembradirecta: 'Siembra', semillero: 'Semil.', trasplante: 'Trasp.', recoleccion: 'Recol.' };
                            
                            const fPrefix = `variedades${tipo}`;
                            const dVal = genericData?.[`${fPrefix}desde`] || 0;
                            const hVal = genericData?.[`${fPrefix}hasta`] || 0;
                            const desde = parseInt(dVal);
                            const hasta = parseInt(hVal);
                            const isMonthActive = (m: number) => {
                              if (!desde || !hasta) return false;
                              if (desde <= hasta) return m >= desde && m <= hasta;
                              return m >= desde || m <= hasta;
                            };

                            return (
                              <div key={tipo} style={{ display: 'grid', gridTemplateColumns: '60px repeat(12, 1fr)', borderBottom: idx < 3 ? '1px solid #e2e8f0' : 'none', background: '#f8fafc' }}>
                                <div style={{ padding: '4px 2px', fontSize: '0.55rem', fontWeight: 'bold', color: '#64748b', borderRight: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '2px' }}>
                                  <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: colorMap[tipo], flexShrink: 0 }}></span>
                                  {labelMap[tipo]}
                                </div>
                                {MESES.map(m => {
                                  const active = isMonthActive(m.val);
                                  return (
                                    <div key={m.val} style={{ borderRight: m.val < 12 ? '1px dashed #e2e8f0' : 'none', background: active ? `${colorMap[tipo]}15` : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                      {active && <div style={{ width: '100%', height: '5px', background: colorMap[tipo], borderRadius: '1px', opacity: 0.6 }}></div>}
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* COLUMNA VARIEDAD */}
                      <div>
                        <h3 style={{ fontSize: '0.9rem', color: '#7c3aed', borderBottom: '1px solid #ddd6fe', paddingBottom: '8px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          ✨ Calendario Variedad
                        </h3>
                        <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '60px repeat(12, 1fr)', background: '#f1f5f9', borderBottom: '1px solid #e2e8f0' }}>
                            <div style={{ padding: '6px 2px', fontWeight: 'bold', color: '#64748b', fontSize: '0.65rem', borderRight: '1px solid #e2e8f0', textAlign: 'center' }}>FASE</div>
                            {MESES.map(m => (
                              <div key={m.val} style={{ padding: '6px 0', textAlign: 'center', fontWeight: 'bold', color: '#475569', fontSize: '0.65rem', borderRight: m.val < 12 ? '1px solid #e2e8f0' : 'none' }}>
                                {m.label.charAt(0)}
                              </div>
                            ))}
                          </div>
                          {['semillero', 'siembradirecta', 'trasplante', 'recoleccion'].map((tipo, idx) => {
                            const colorMap: Record<string, string> = { siembradirecta: '#f97316', semillero: '#3b82f6', trasplante: '#a855f7', recoleccion: '#22c55e' };
                            const labelMap: Record<string, string> = { siembradirecta: 'Siembra', semillero: 'Semil.', trasplante: 'Trasp.', recoleccion: 'Recol.' };
                            
                            const fieldMap: Record<string, { desde: string, hasta: string }> = {
                              siembradirecta: { desde: 'variedadessiembradirectadesde', hasta: 'variedadessiembradirectahasta' },
                              semillero: { desde: 'variedadessemillerodesde', hasta: 'variedadessemillerohasta' },
                              trasplante: { desde: 'variedadestrasplantedesde', hasta: 'variedadestrasplantehasta' },
                              recoleccion: { desde: 'variedadesrecolecciondesde', hasta: 'variedadesrecoleccionhasta' }
                            };

                            const fNames = fieldMap[tipo];
                            const vDesde = formData[fNames.desde] || 0;
                            const vHasta = formData[fNames.hasta] || 0;
                            const desde = parseInt(vDesde);
                            const hasta = parseInt(vHasta);
                            const isMonthActive = (m: number) => {
                              if (!desde || !hasta) return false;
                              if (desde <= hasta) return m >= desde && m <= hasta;
                              return m >= desde || m <= hasta;
                            };

                            return (
                              <div key={tipo} style={{ display: 'grid', gridTemplateColumns: '60px repeat(12, 1fr)', borderBottom: idx < 3 ? '1px solid #e2e8f0' : 'none', background: '#fff' }}>
                                <div style={{ padding: '6px 2px', fontSize: '0.6rem', fontWeight: 'bold', color: '#1e1b4b', borderRight: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '2px' }}>
                                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: colorMap[tipo], flexShrink: 0 }}></span>
                                  {labelMap[tipo]}
                                </div>
                                {MESES.map(m => {
                                  const active = isMonthActive(m.val);
                                  return (
                                    <div key={m.val} style={{ borderRight: m.val < 12 ? '1px dashed #e2e8f0' : 'none', background: active ? `${colorMap[tipo]}20` : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                      {active && <div style={{ width: '100%', height: '8px', background: colorMap[tipo], borderRadius: '1px', margin: '0 1px' }}></div>}
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
                )}

                {activeTab === 'autosuficiencia' && (
                  <div className="grid-form" style={{ maxWidth: '800px', gridTemplateColumns: '1fr' }}>
                    <div style={{ background: '#f0fdf4', padding: '20px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #bbf7d0' }}>
                      <h3 style={{ margin: '0 0 16px', color: '#15803d', fontSize: '1rem' }}>📐 Marco de Plantación (cm)</h3>
                      <FieldCompare label="Entre Plantas" field="variedadesmarcoplantas" type="number" />
                      <FieldCompare label="Entre Filas" field="variedadesmarcofilas" type="number" />
                      <FieldCompare label="Margen al Borde" field="variedadesmarcomargen" type="number" />

                      {/* ESQUEMAS SVG A ESCALA (COMPARATIVA) */}
                      {(formData.variedadesmarcoplantas || formData.variedadesmarcofilas || genericData?.variedadesmarcoplantas || genericData?.variedadesmarcofilas) && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
                          {/* SCHEMA ORO (ESPECIE) */}
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '15px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', opacity: 0.8 }}>
                            <span style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>🏆 Gold Standard (Especie)</span>
                            {(() => {
                              const pVal = genericData?.variedadesmarcoplantas || 50;
                              const fVal = genericData?.variedadesmarcofilas || 50;
                              const mVal = genericData?.variedadesmarcomargen || 0;
                              let p = parseFloat(pVal);
                              let f = parseFloat(fVal);
                              let m = parseFloat(mVal) || 0;
                              if (isNaN(p) || p <= 0) p = 50;
                              if (isNaN(f) || f <= 0) f = 50;

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
                                  {/* Cama de Cultivo (Fondo) */}
                                  <rect 
                                    x={bedX1} 
                                    y={bedY1} 
                                    width={drawTotalW} 
                                    height={drawTotalH} 
                                    fill="#fdfbf7" 
                                    stroke="#94a3b8" 
                                    strokeWidth="1.5" 
                                    rx="6" 
                                    style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.02))' }}
                                  />

                                  {/* Plantas */}
                                  <circle cx={x1} cy={y1} r="7" fill="#94a3b8" />
                                  <circle cx={x2} cy={y1} r="7" fill="#94a3b8" />
                                  <circle cx={x1} cy={y2} r="7" fill="#94a3b8" />
                                  <circle cx={x2} cy={y2} r="7" fill="#94a3b8" />

                                  {/* Marco entre Plantas (Horizontal) */}
                                  {x2 - x1 > 30 && (
                                    <>
                                      <line x1={x1 + 12} y1={y1} x2={x2 - 12} y2={y1} stroke="#94a3b8" strokeWidth="2" />
                                      <polygon points={`${x1 + 12},${y1 - 4} ${x1 + 8},${y1} ${x1 + 12},${y1 + 4}`} fill="#94a3b8" />
                                      <polygon points={`${x2 - 12},${y1 - 4} ${x2 - 8},${y1} ${x2 - 12},${y1 + 4}`} fill="#94a3b8" />
                                    </>
                                  )}

                                  <rect x={cx - 30} y={y1 - 10} width="60" height="20" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" rx="4" />
                                  <text x={cx} y={y1 + 4} fontSize="11" fontWeight="bold" fill="#64748b" textAnchor="middle">
                                    {pVal} cm
                                  </text>

                                  {/* Marco entre Filas (Vertical) */}
                                  {y2 - y1 > 30 && (
                                    <>
                                      <line x1={x1} y1={y1 + 12} x2={x1} y2={y2 - 12} stroke="#94a3b8" strokeWidth="2" />
                                      <polygon points={`${x1 - 4},${y1 + 12} ${x1},${y1 + 8} ${x1 + 4},${y1 + 12}`} fill="#94a3b8" />
                                      <polygon points={`${x1 - 4},${y2 - 12} ${x1},${y2 - 8} ${x1 + 4},${y2 - 12}`} fill="#94a3b8" />
                                    </>
                                  )}

                                  <rect x={x1 - 30} y={cy - 10} width="60" height="20" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" rx="4" />
                                  <text x={x1} y={cy + 4} fontSize="11" fontWeight="bold" fill="#64748b" textAnchor="middle">
                                    {fVal} cm
                                  </text>

                                  {/* Líneas de Guía de Rejilla de Plantas */}
                                  <line x1={x2} y1={y1 + 12} x2={x2} y2={y2 - 12} stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="4 4" />
                                  <line x1={x1 + 12} y1={y2} x2={x2 - 12} y2={y2} stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="4 4" />

                                  {/* Cota Margen al Borde (Horizontal) */}
                                  {m > 0 && (
                                    <>
                                      <line x1={x2} y1={y1} x2={bedX2} y2={y1} stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.7" />
                                      {drawM > 15 && (
                                        <>
                                          <line x1={x2 + 8} y1={y1} x2={bedX2 - 4} y2={y1} stroke="#f59e0b" strokeWidth="1.5" opacity="0.7" />
                                          <polygon points={`${x2 + 8},${y1 - 3} ${x2 + 3},${y1} ${x2 + 8},${y1 + 3}`} fill="#f59e0b" opacity="0.7" />
                                          <polygon points={`${bedX2 - 5},${y1 - 3} ${bedX2 - 1},${y1} ${bedX2 - 5},${y1 + 3}`} fill="#f59e0b" opacity="0.7" />
                                        </>
                                      )}
                                      <g transform={`translate(${Math.max(x2 + 10, x2 + drawM / 2)}, ${y1 - 16})`}>
                                        <rect x="-18" y="-7" width="36" height="14" fill="#ffffff" stroke="#f59e0b" strokeWidth="1" rx="3" opacity="0.7" />
                                        <text x="0" y="3" fontSize="8" fontWeight="bold" fill="#d97706" textAnchor="middle" opacity="0.7">
                                          {m} cm
                                        </text>
                                      </g>
                                    </>
                                  )}

                                  {/* Cota Margen al Borde (Vertical) */}
                                  {m > 0 && (
                                    <>
                                      <line x1={x2} y1={y2} x2={x2} y2={bedY2} stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.7" />
                                      {drawM > 15 && (
                                        <>
                                          <line x1={x2} y1={y2 + 8} x2={x2} y2={bedY2 - 4} stroke="#f59e0b" strokeWidth="1.5" opacity="0.7" />
                                          <polygon points={`${x2 - 3},${y2 + 8} ${x2},${y2 + 3} ${x2 + 3},${y2 + 8}`} fill="#f59e0b" opacity="0.7" />
                                          <polygon points={`${x2 - 3},${bedY2 - 5} ${x2},${bedY2 - 1} ${x2 + 3},${bedY2 - 5}`} fill="#f59e0b" opacity="0.7" />
                                        </>
                                      )}
                                      <g transform={`translate(${x2 + 22}, ${Math.max(y2 + 10, y2 + drawM / 2)})`}>
                                        <rect x="-18" y="-7" width="36" height="14" fill="#ffffff" stroke="#f59e0b" strokeWidth="1" rx="3" opacity="0.7" />
                                        <text x="0" y="3" fontSize="8" fontWeight="bold" fill="#d97706" textAnchor="middle" opacity="0.7">
                                          {m} cm
                                        </text>
                                      </g>
                                    </>
                                  )}
                                </svg>
                              );
                            })()}
                          </div>

                          {/* SCHEMA VARIEDAD */}
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '15px', background: '#fff', borderRadius: '12px', border: '1px dashed #22c55e', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                            <span style={{ fontSize: '0.75rem', color: '#15803d', marginBottom: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>✨ Variedad</span>
                            {(() => {
                              const pVal = formData.variedadesmarcoplantas || genericData?.variedadesmarcoplantas || 50;
                              const fVal = formData.variedadesmarcofilas || genericData?.variedadesmarcofilas || 50;
                              const mVal = formData.variedadesmarcomargen || genericData?.variedadesmarcomargen || 0;
                              let p = parseFloat(pVal);
                              let f = parseFloat(fVal);
                              let m = parseFloat(mVal) || 0;
                              if (isNaN(p) || p <= 0) p = 50;
                              if (isNaN(f) || f <= 0) f = 50;

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
                                  {/* Cama de Cultivo (Fondo) */}
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

                                  {/* Plantas */}
                                  <circle cx={x1} cy={y1} r="7" fill="#22c55e" stroke="#16a34a" strokeWidth="1" />
                                  <circle cx={x2} cy={y1} r="7" fill="#22c55e" stroke="#16a34a" strokeWidth="1" />
                                  <circle cx={x1} cy={y2} r="7" fill="#22c55e" stroke="#16a34a" strokeWidth="1" />
                                  <circle cx={x2} cy={y2} r="7" fill="#22c55e" stroke="#16a34a" strokeWidth="1" />

                                  {/* Marco entre Plantas (Horizontal) */}
                                  {x2 - x1 > 30 && (
                                    <>
                                      <line x1={x1 + 12} y1={y1} x2={x2 - 12} y2={y1} stroke="#15803d" strokeWidth="2" />
                                      <polygon points={`${x1 + 12},${y1 - 4} ${x1 + 8},${y1} ${x1 + 12},${y1 + 4}`} fill="#15803d" />
                                      <polygon points={`${x2 - 12},${y1 - 4} ${x2 - 8},${y1} ${x2 - 12},${y1 + 4}`} fill="#15803d" />
                                    </>
                                  )}

                                  <rect x={cx - 30} y={y1 - 10} width="60" height="20" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" rx="4" />
                                  <text x={cx} y={y1 + 4} fontSize="11" fontWeight="bold" fill="#15803d" textAnchor="middle">
                                    {pVal} cm
                                  </text>

                                  {/* Marco entre Filas (Vertical) */}
                                  {y2 - y1 > 30 && (
                                    <>
                                      <line x1={x1} y1={y1 + 12} x2={x1} y2={y2 - 12} stroke="#15803d" strokeWidth="2" />
                                      <polygon points={`${x1 - 4},${y1 + 12} ${x1},${y1 + 8} ${x1 + 4},${y1 + 12}`} fill="#15803d" />
                                      <polygon points={`${x1 - 4},${y2 - 12} ${x1},${y2 - 8} ${x1 + 4},${y2 - 12}`} fill="#15803d" />
                                    </>
                                  )}

                                  <rect x={x1 - 30} y={cy - 10} width="60" height="20" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" rx="4" />
                                  <text x={x1} y={cy + 4} fontSize="11" fontWeight="bold" fill="#15803d" textAnchor="middle">
                                    {fVal} cm
                                  </text>

                                  {/* Líneas de Guía de Rejilla de Plantas */}
                                  <line x1={x2} y1={y1 + 12} x2={x2} y2={y2 - 12} stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="4 4" />
                                  <line x1={x1 + 12} y1={y2} x2={x2 - 12} y2={y2} stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="4 4" />

                                  {/* Cota Margen al Borde (Horizontal) */}
                                  {m > 0 && (
                                    <>
                                      <line x1={x2} y1={y1} x2={bedX2} y2={y1} stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3 3" />
                                      {drawM > 15 && (
                                        <>
                                          <line x1={x2 + 8} y1={y1} x2={bedX2 - 4} y2={y1} stroke="#f59e0b" strokeWidth="1.5" />
                                          <polygon points={`${x2 + 8},${y1 - 3} ${x2 + 3},${y1} ${x2 + 8},${y1 + 3}`} fill="#f59e0b" />
                                          <polygon points={`${bedX2 - 5},${y1 - 3} ${bedX2 - 1},${y1} ${bedX2 - 5},${y1 + 3}`} fill="#f59e0b" />
                                        </>
                                      )}
                                      <g transform={`translate(${Math.max(x2 + 10, x2 + drawM / 2)}, ${y1 - 16})`}>
                                        <rect x="-18" y="-7" width="36" height="14" fill="#ffffff" stroke="#f59e0b" strokeWidth="1" rx="3" />
                                        <text x="0" y="3" fontSize="8" fontWeight="bold" fill="#d97706" textAnchor="middle">
                                          {m} cm
                                        </text>
                                      </g>
                                    </>
                                  )}

                                  {/* Cota Margen al Borde (Vertical) */}
                                  {m > 0 && (
                                    <>
                                      <line x1={x2} y1={y2} x2={x2} y2={bedY2} stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3 3" />
                                      {drawM > 15 && (
                                        <>
                                          <line x1={x2} y1={y2 + 8} x2={x2} y2={bedY2 - 4} stroke="#f59e0b" strokeWidth="1.5" />
                                          <polygon points={`${x2 - 3},${y2 + 8} ${x2},${y2 + 3} ${x2 + 3},${y2 + 8}`} fill="#f59e0b" />
                                          <polygon points={`${x2 - 3},${bedY2 - 5} ${x2},${bedY2 - 1} ${x2 + 3},${bedY2 - 5}`} fill="#f59e0b" />
                                        </>
                                      )}
                                      <g transform={`translate(${x2 + 22}, ${Math.max(y2 + 10, y2 + drawM / 2)})`}>
                                        <rect x="-18" y="-7" width="36" height="14" fill="#ffffff" stroke="#f59e0b" strokeWidth="1" rx="3" />
                                        <text x="0" y="3" fontSize="8" fontWeight="bold" fill="#d97706" textAnchor="middle">
                                          {m} cm
                                        </text>
                                      </g>
                                    </>
                                  )}
                                </svg>
                              );
                            })()}

                            {/* CALCULADORA (LADO VARIEDAD) */}
                            {(() => {
                              const pParcial = parseFloat(formData.variedadesautosuficienciaparcial || genericData?.variedadesautosuficienciaparcial) || 0;
                              const pFresco = parseFloat(formData.variedadesautosuficiencia || genericData?.variedadesautosuficiencia) || 0;
                              const pConserva = parseFloat(formData.variedadesautosuficienciaconserva || genericData?.variedadesautosuficienciaconserva) || 0;
                              const totalPParcial = pParcial * calcPersonas;
                              const totalPFresco = pFresco * calcPersonas;
                              const totalPConserva = pConserva * calcPersonas;

                              const marcoP = (parseFloat(formData.variedadesmarcoplantas || genericData?.variedadesmarcoplantas) || 50) / 100;
                              const marcoF = (parseFloat(formData.variedadesmarcofilas || genericData?.variedadesmarcofilas) || 50) / 100;
                              const margin = (parseFloat(formData.variedadesmarcomargen || genericData?.variedadesmarcomargen) || 0) / 100;
                              const areaPlant = (marcoP + 2 * margin) * (marcoF + 2 * margin);

                              const m2Parcial = totalPParcial * areaPlant;
                              const m2Fresco = totalPFresco * areaPlant;
                              const m2Conserva = totalPConserva * areaPlant;

                              return (
                                <div style={{ width: '100%', marginTop: '15px', padding: '15px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '12px' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#166534' }}>🧮 CALCULADORA</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      <span style={{ fontSize: '0.7rem', color: '#15803d' }}>Pers:</span>
                                      <input 
                                        type="number" 
                                        min="1" 
                                        value={calcPersonas} 
                                        onChange={(e) => setCalcPersonas(parseInt(e.target.value) || 1)}
                                        style={{ width: '45px', padding: '2px 4px', border: '1px solid #86efac', borderRadius: '4px', textAlign: 'center', fontSize: '0.85rem' }}
                                      />
                                    </div>
                                  </div>

                                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                                    <div style={{ background: '#fff', padding: '8px', borderRadius: '8px', textAlign: 'center', border: '1px solid #dcfce7' }}>
                                      <div style={{ fontSize: '0.65rem', color: '#64748b' }}>PARCIAL</div>
                                      <div style={{ fontSize: '0.9rem', fontWeight: '800', color: '#15803d' }}>{totalPParcial.toFixed(1)} <small style={{fontSize: '0.5rem'}}>pl</small></div>
                                      <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#166534' }}>{m2Parcial.toFixed(1)} <small style={{fontSize: '0.5rem'}}>m²</small></div>
                                    </div>
                                    <div style={{ background: '#fff', padding: '8px', borderRadius: '8px', textAlign: 'center', border: '1px solid #dcfce7' }}>
                                      <div style={{ fontSize: '0.65rem', color: '#64748b' }}>COMPLETA</div>
                                      <div style={{ fontSize: '0.9rem', fontWeight: '800', color: '#15803d' }}>{totalPFresco.toFixed(1)} <small style={{fontSize: '0.5rem'}}>pl</small></div>
                                      <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#166534' }}>{m2Fresco.toFixed(1)} <small style={{fontSize: '0.5rem'}}>m²</small></div>
                                    </div>
                                    <div style={{ background: '#fff', padding: '8px', borderRadius: '8px', textAlign: 'center', border: '1px solid #dcfce7' }}>
                                      <div style={{ fontSize: '0.65rem', color: '#64748b' }}>CONSERVA</div>
                                      <div style={{ fontSize: '0.9rem', fontWeight: '800', color: '#15803d' }}>{totalPConserva.toFixed(1)} <small style={{fontSize: '0.5rem'}}>pl</small></div>
                                      <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#166534' }}>{m2Conserva.toFixed(1)} <small style={{fontSize: '0.5rem'}}>m²</small></div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      )}
                    </div>
                    <FieldCompare label="Plantas para Consumo Parcial (por persona)" field="variedadesautosuficienciaparcial" type="number" />
                    <FieldCompare label="Plantas para Autosuficiencia Completa (por persona)" field="variedadesautosuficiencia" type="number" />
                    <FieldCompare label="Plantas para Conserva (por persona)" field="variedadesautosuficienciaconserva" type="number" />
                  </div>
                )}

                {/* Contenido de Fotos y PDFs siempre montado si existe variedadId para evitar parpadeos y retrasos al cambiar de pestaña */}
                {(() => {
                  if (!variedadId) {
                    return (
                      <>
                        {activeTab === 'fotos' && (
                          <p style={{ color: '#64748b', fontStyle: 'italic', padding: '20px' }}>Guarda la variedad primero para subir fotos.</p>
                        )}
                        {activeTab === 'pdfs' && (
                          <p style={{ color: '#64748b', fontStyle: 'italic', padding: '20px' }}>Guarda la variedad primero para subir documentos PDF.</p>
                        )}
                      </>
                    );
                  }

                  const selectedEspecie = especies.find(e => e.idespeciesvegetales == formData.xvariedadesvegetalesidespeciesvegetales) || genericData;
                  const espNombre = selectedEspecie?.especiesvegetalesnombre || 'Especie';
                  const espCientifico = selectedEspecie?.especiesvegetalesnombrecientifico || '';
                  const espFamilia = selectedEspecie?.especiesfamilia || '';

                  return (
                    <>
                      <div className="grid-form" style={{ display: activeTab === 'fotos' ? 'grid' : 'none' }}>
                        <VariedadVegetalMediaManager 
                          variedadId={variedadId} 
                          userEmail={userEmail!} 
                          variedadNombre={formData.variedadesvegetalesnombre}
                          especieNombre={espNombre}
                          especieNombreCientifico={espCientifico}
                          especieFamilia={espFamilia}
                          section="photos"
                          onMediaChange={loadPhotos}
                        />
                      </div>

                      <div className="grid-form" style={{ display: activeTab === 'pdfs' ? 'grid' : 'none' }}>
                        <VariedadVegetalMediaManager 
                          variedadId={variedadId} 
                          userEmail={userEmail!} 
                          variedadNombre={formData.variedadesvegetalesnombre}
                          especieNombre={espNombre}
                          especieNombreCientifico={espCientifico}
                          especieFamilia={espFamilia}
                          section="pdfs"
                          onMediaChange={loadPhotos}
                          initialEditPdfId={editPdfParam ? parseInt(editPdfParam, 10) : null}
                        />
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          )}
        </form>
      </div>
      {/* AI CONFIG MODAL — Ventana intermedia */}
      {showAiConfig && (
        <div className="ai-modal-overlay">
          <div className="ai-modal-content" style={{ maxWidth: '700px' }}>
            <div className="ai-modal-header" style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'nowrap' }}>
              <h2 style={{ color: 'white', margin: 0, fontSize: '1.1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0, flexShrink: 1 }}>✨ Asistente IA de Variedades</h2>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                <button
                  type="button"
                  disabled={aiLoading || !aiExtraInstructions.trim()}
                  onClick={callVariedadAI}
                  style={{
                    padding: '8px 16px', background: aiLoading ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.15)',
                    color: 'white', border: '2px solid rgba(255,255,255,0.5)', borderRadius: '8px', fontWeight: 'bold',
                    cursor: aiLoading ? 'not-allowed' : 'pointer', fontSize: '0.9rem',
                    opacity: !aiExtraInstructions.trim() ? 0.4 : 1,
                    transition: 'all 0.2s', whiteSpace: 'nowrap'
                  }}
                >
                  {aiLoading ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite', fontSize: '1rem' }}>⏳</span>
                      {aiSeconds}s
                    </span>
                  ) : '🚀 Buscar'}
                </button>
                <PremiumCancelButton onClick={() => setShowAiConfig(false)} />
              </div>
            </div>

            <div className="ai-modal-body">
              {/* Datos básicos */}
              <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '16px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
                <p style={{ margin: '0 0 8px', fontWeight: 'bold', color: '#1e293b', fontSize: '1.05rem' }}>
                  Objetivo: Completar la ficha técnica de <span style={{ color: '#7c3aed' }}>"{formData.variedadesvegetalesnombre}"</span>
                </p>
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                  <div style={{ color: '#64748b', fontSize: '0.9rem' }}>
                    🌱 <strong>Especie:</strong> {especies.find((e: any) => e.idespeciesvegetales == formData.xvariedadesvegetalesidespeciesvegetales)?.especiesvegetalesnombre || 'No seleccionada'}
                  </div>
                  <div style={{ color: '#64748b', fontSize: '0.9rem' }}>
                    🧬 <strong>Variedad:</strong> {formData.variedadesvegetalesnombre}
                  </div>
                  {formData.variedadesvegetalesnombrecientifico && (
                    <div style={{ color: '#64748b', fontSize: '0.9rem' }}>
                      🔬 <strong>Científico:</strong> <em>{formData.variedadesvegetalesnombrecientifico}</em>
                    </div>
                  )}
                </div>
              </div>

              {/* Prompt colapsable */}
              <div style={{ marginBottom: '20px', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                <button
                  type="button"
                  onClick={() => setAiConfigPromptOpen(!aiConfigPromptOpen)}
                  style={{ width: '100%', padding: '10px 16px', background: '#f1f5f9', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: '600', color: '#475569', fontSize: '0.9rem' }}
                >
                  <span>📋 Prompt utilizado (técnico)</span>
                  <span style={{ transform: aiConfigPromptOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
                </button>
                {aiConfigPromptOpen && (
                  <div style={{ padding: '12px 16px', background: '#1e293b', color: '#94a3b8', fontSize: '0.8rem', fontFamily: 'monospace', maxHeight: '200px', overflowY: 'auto', lineHeight: '1.5' }}>
                    La IA recibirá el nombre de la variedad ({formData.variedadesvegetalesnombre}) y su especie ({especies.find((e: any) => e.idespeciesvegetales == formData.xvariedadesvegetalesidespeciesvegetales)?.especiesvegetalesnombre || '—'}).
                    Buscará datos específicos de esta variedad: taxonomía, fisiología, calendarios, autosuficiencia, suelo y textos descriptivos.
                    Los resultados se mostrarán en una tabla comparativa contra los valores actuales para que puedas decidir qué asimilar.
                  </div>
                )}
              </div>

              {/* Textarea — Instrucciones personalizadas */}
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 8px', color: '#1e293b', fontSize: '1rem' }}>💬 Instrucciones específicas para la IA</h4>
                <textarea
                  value={aiExtraInstructions}
                  onChange={e => setAiExtraInstructions(e.target.value)}
                  placeholder="Escribe instrucciones adicionales para la IA..."
                  rows={4}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', resize: 'vertical', fontFamily: 'inherit', lineHeight: '1.5', boxSizing: 'border-box' }}
                />
                <p style={{ margin: '6px 0 0', color: '#94a3b8', fontSize: '0.8rem' }}>
                  Puedes modificar el texto libremente. La IA leerá exactamente lo que esté escrito aquí junto al prompt base.
                </p>
              </div>

              {/* Estado actual resumen */}
              <div style={{ padding: '12px 16px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                <span style={{ fontWeight: 'bold', color: '#065f46', fontSize: '0.9rem' }}>
                  📊 Campos que se analizarán:
                </span>
                <span style={{ color: '#15803d', fontSize: '0.85rem', marginLeft: '8px' }}>
                  Taxonomía, Fisiología, Calendarios, Autosuficiencia, Suelo y Textos
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI ASSISTANT MODAL */}
      {showAiModal && aiProposal && (
        <div className="ai-modal-overlay">
          <div className="ai-modal-content">
            <div className="ai-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'nowrap' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0, flexShrink: 1 }}>✨ Revisión de Inteligencia Artificial — {formData.variedadesvegetalesnombre}</h2>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                <button 
                  type="button" 
                  className="btn-ai" 
                  onClick={assimilateAll} 
                  style={{ padding: '8px 16px', fontSize: '0.9rem', whiteSpace: 'nowrap' }}
                >
                  ✨ Asimilar Todo
                </button>
                <PremiumCancelButton onClick={closeAiModal} />
              </div>
            </div>

            <div className="ai-modal-body">
              <p style={{ marginBottom: '20px', color: '#475569' }}>
                La IA ha sugerido los siguientes datos específicos para la variedad <strong>{formData.variedadesvegetalesnombre}</strong>.
                Revisa cada bloque y asimila los cambios propuestos donde estés de acuerdo.
                Los datos que difieren de tu versión actual están resaltados.
              </p>

              {aiGroups.map(group => {
                const hasDifferences = group.keys.some(k => {
                  let currentVal = formData[k] != null ? formData[k] : '';
                  let aiVal = aiProposal[k] != null ? aiProposal[k] : '';
                  
                  if (Array.isArray(currentVal)) currentVal = [...currentVal].sort().join(',');
                  else currentVal = String(currentVal);
                  
                  if (Array.isArray(aiVal)) aiVal = [...aiVal].sort().join(',');
                  else aiVal = String(aiVal);

                  return aiVal !== '' && currentVal !== aiVal;
                });

                return (
                  <div key={group.id} className="ai-group-section">
                    <div className="ai-group-header">
                      <h3>{group.title} {hasDifferences && <span style={{ fontSize: '0.8rem', background: '#fef08a', color: '#854d0e', padding: '2px 8px', borderRadius: '12px', marginLeft: '10px' }}>Cambios detectados</span>}</h3>
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
                      const rawCurrent = formData[k];
                      const rawAi = aiProposal[k];
                      
                      // Check if variety field is empty and we're falling back to species
                      const isVarietyEmpty = rawCurrent === '' || rawCurrent === null || rawCurrent === undefined || (Array.isArray(rawCurrent) && rawCurrent.length === 0);
                      const rawGeneric = genericData ? genericData[k] : null;
                      const hasGenericFallback = isVarietyEmpty && rawGeneric != null && rawGeneric !== '' && !(Array.isArray(rawGeneric) && rawGeneric.length === 0);
                      
                      // Use the effective value (variety or species fallback) for comparison
                      const effectiveRaw = isVarietyEmpty ? rawGeneric : rawCurrent;
                      
                      let currentStr = Array.isArray(effectiveRaw) ? [...effectiveRaw].sort().join(',') : (effectiveRaw != null ? String(effectiveRaw) : '');
                      let aiStr = Array.isArray(rawAi) ? [...rawAi].sort().join(',') : (rawAi != null ? String(rawAi) : '');
                      
                      if (!Array.isArray(effectiveRaw) && !isNaN(Number(effectiveRaw)) && effectiveRaw !== '' && effectiveRaw != null) {
                        currentStr = parseFloat(String(effectiveRaw)).toString();
                      }
                      if (!Array.isArray(rawAi) && !isNaN(Number(rawAi)) && rawAi !== '' && rawAi != null) {
                        aiStr = parseFloat(String(rawAi)).toString();
                      }

                      if (!aiStr) return null;

                      const isDifferent = currentStr !== aiStr;
                      const displayCurrent = Array.isArray(effectiveRaw) ? (typeof effectiveRaw === 'string' ? effectiveRaw : [...effectiveRaw]).join(', ') : currentStr;
                      const displayAi = Array.isArray(rawAi) ? rawAi.join(', ') : aiStr;

                      return (
                        <div key={k} className={`ai-comparison-grid ${isDifferent ? 'ai-row-diff' : 'ai-row-same'}`}>
                          <div style={{ fontWeight: '600', color: '#475569' }}>{(group.labels as any)[k]}</div>
                          <div style={{ color: '#64748b' }}>
                            {displayCurrent ? (
                              <>
                                {displayCurrent}
                                {hasGenericFallback && (
                                  <span style={{ display: 'inline-block', marginLeft: '6px', fontSize: '0.7rem', background: '#dbeafe', color: '#1e40af', padding: '1px 6px', borderRadius: '8px', fontWeight: '600', verticalAlign: 'middle' }}>
                                    🌱 Especie
                                  </span>
                                )}
                              </>
                            ) : (
                              <em style={{ opacity: 0.5 }}>Vacío</em>
                            )}
                          </div>
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

              
            </div>
          </div>
        </div>
      )}
    </>
  );
}
