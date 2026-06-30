'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { storage } from '@/lib/firebase/config';
import { useEspecieCore } from './useEspecieCore';
import { useEspecieMedia } from './useEspecieMedia';
import { useEspecieTaxonomy } from './useEspecieTaxonomy';
import { useEspecieAiConfig } from './useEspecieAiConfig';
import { useEspeciePautas } from './useEspeciePautas';
import { useEspecieUiState } from '../../EspecieVegetal/hooks/useEspecieUiState';
import useEspecieInit from './useEspecieInit';

interface UseEspecieVegetalFormProps {
  especieId: string | null;
  userEmail: string | null;
}

export const MESES = [
  { val: 1, label: 'Ene' }, { val: 2, label: 'Feb' }, { val: 3, label: 'Mar' },
  { val: 4, label: 'Abr' }, { val: 5, label: 'May' }, { val: 6, label: 'Jun' },
  { val: 7, label: 'Jul' }, { val: 8, label: 'Ago' }, { val: 9, label: 'Sep' },
  { val: 10, label: 'Oct' }, { val: 11, label: 'Nov' }, { val: 12, label: 'Dic' }
];

export const TIPOS = ['hortaliza', 'fruta', 'aromatica', 'leguminosa', 'cereal', 'adventicia', 'otra'];
export const CICLOS = ['anual', 'bianual', 'perenne'];

export const STYLE_FILTERS: Record<string, string> = {
  'none': 'none',
  'vintage': 'sepia(0.3) contrast(1.1) brightness(0.95)',
  'bw': 'grayscale(1) contrast(1.1)',
  'warm': 'sepia(0.15) saturate(1.2) brightness(1.05)',
  'cool': 'hue-rotate(-10deg) saturate(0.9) brightness(1.05)',
  'dramatic': 'contrast(1.3) brightness(0.9) saturate(1.1)',
  'soft': 'contrast(0.9) brightness(1.1) saturate(0.9)',
  'vivid': 'saturate(1.4) contrast(1.15)',
  'matte': 'contrast(0.85) brightness(1.1) saturate(0.85)',
  'cinematic': 'contrast(1.2) brightness(0.95) saturate(1.1) sepia(0.1)'
};

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

export function useEspecieVegetalForm({ especieId, userEmail }: UseEspecieVegetalFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const focusParam = searchParams.get('focus');
  const editPdfParam = searchParams.get('editPdf');

  const uiState = useEspecieUiState();
  const { isMobile } = uiState;

  const TABLE_MIN_WIDTH = 600;
  const CALENDAR_MIN_WIDTH = 550;

  // 1. Sub-Hooks instances
  const {
    formData, setFormData, initialData, setInitialData,
    saveStatus, setSaveStatus, loading, setLoading,
    toastMessage, setToastMessage, isFormDirty,
    loadEspecie, saveFormData, autoSaveFases
  } = useEspecieCore(especieId, userEmail);

  const {
    photos, setPhotos, activeFotoId, setActiveFotoId,
    pdfs, setPdfs, blogs, setBlogs, dragOverPhotos, setDragOverPhotos,
    dragOverPdfs, setDragOverPdfs, uploadingPhotos, setUploadingPhotos,
    uploadingPdfs, setUploadingPdfs, draggedPhotoIndex, setDraggedPhotoIndex,
    draggedOverPhotoIndex, setDraggedOverPhotoIndex, draggedHeroPhotoId, setDraggedHeroPhotoId,
    draggedOverHeroPhotoId, setDraggedOverHeroPhotoId, editingPhoto, setEditingPhoto,
    photoEditorSaveStatus, setPhotoEditorSaveStatus, deleteConfirm, setDeleteConfirm,
    heroIndex, setHeroIndex, editingPdf, setEditingPdf, pdfTitle, setPdfTitle,
    pdfSummary, setPdfSummary, pdfApuntes, setPdfApuntes, pdfEditorSaveStatus, setPdfEditorSaveStatus,
    showPdfSearchModal, setShowPdfSearchModal, pdfSearchTopic, setPdfSearchTopic,
    pdfSearchResults, setPdfSearchResults, pdfSearchLoading, setPdfSearchLoading,
    pdfSearchError, setPdfSearchError, blogGenPdf, setBlogGenPdf, blogGenInstructions, setBlogGenInstructions,
    blogGenLoading, setBlogGenLoading, blogGenProgress, setBlogGenProgress, showBlogPrompt, setShowBlogPrompt,
    generatingCoverId, setGeneratingCoverId,

    loadAttachments, handleFileUpload, handleSetPrimaryPhoto, handleReorderPhotos,
    handlePhotoReorder, savePhotoEdits, savePdfEdits, confirmDelete,
    handleRunPdfSearch, handleGenerateBlog, generatePdfCover
  } = useEspecieMedia({ especieId, userEmail, formData });

  const {
    masterEspecies, setMasterEspecies, masterAfecciones, setMasterAfecciones,
    masterFases, setMasterFases, masterFamilias, setMasterFamilias,
    masterIdiomas, setMasterIdiomas, masterPaises, setMasterPaises,
    masterAnimales, setMasterAnimales, masterPlantasPartes, setMasterPlantasPartes,
    masterLabores, setMasterLabores,
    relaciones, setRelaciones, initialRelaciones, setInitialRelaciones, relacionesDirty, setRelacionesDirty,
    relacionesSaveStatus, setRelacionesSaveStatus, existingVarieties, setExistingVarieties, checking, checkResults,
    showCheckModal, setShowCheckModal, sinonimos, setSinonimos, initialSinonimos, setInitialSinonimos, sinonimosDirty, setSinonimosDirty,
    sinonimosAiLoading, setSinonimosAiLoading, sinonimosAiSeconds, setSinonimosAiSeconds, showSinonimosAiModal, setShowSinonimosAiModal,
    aiSinonimosProposal, setAiSinonimosProposal, showSinonimosConfig, setShowSinonimosConfig, sinConfigPromptOpen, setSinConfigPromptOpen,
    sinSelectedScope, setSinSelectedScope, sinExtraInstructions, setSinExtraInstructions, sinScopePresets,
    alimentacion, setAlimentacion, initialAlimentacion, setInitialAlimentacion, alimentacionDirty, setAlimentacionDirty,
    sinonimosTimerRef,
    loadSinonimos, loadRelaciones, loadAlimentacion, loadExistingVarieties, resolvePlantasParteId,
    handleCheckSpecies
  } = useEspecieTaxonomy({ especieId, userEmail, formData });

  const {
    aiLoading, setAiLoading, activeTab, setActiveTab, isEspecieOpen, setIsEspecieOpen,
    calcPersonas, setCalcPersonas, aiProposal, setAiProposal, selectedRels, setSelectedRels,
    showAiModal, setShowAiModal, aiModalActiveTab, setAiModalActiveTab,
    selectedAiFields, setSelectedAiFields, showOnlyDiffs, setShowOnlyDiffs,
    collapsedAiGroups, setCollapsedAiGroups, isAssimilatingRels, setIsAssimilatingRels,
    showAiConfig, setShowAiConfig, aiConfigPrompt, setAiConfigPrompt, aiConfigTabs, setAiConfigTabs,
    selectedAiSinonimos, setSelectedAiSinonimos, selectedAiVariedades, setSelectedAiVariedades,
    selectedAiAlimentacion, setSelectedAiAlimentacion, isAssimilatingSinonimos, setIsAssimilatingSinonimos,
    isAssimilatingVariedades, setIsAssimilatingVariedades, assimilatedVarietyNames, setAssimilatedVarietyNames,
    aiSeconds, setAiSeconds, aiStats, setAiStats, isAssimilating, setIsAssimilating,
    assimilationSeconds, setAssimilationSeconds, aiTimerRef, assimilationTimerRef,
    runWithAssimilationLoading
  } = useEspecieAiConfig(especieId, userEmail);

  const {
    pautas, setPautas, pautasFiltroFase, setPautasFiltroFase, pautasFiltroLabor, setPautasFiltroLabor,
    pautasFiltroLaboreo, setPautasFiltroLaboreo, editingPauta, setEditingPauta, pautaForm, setPautaForm,
    showAddPautaForm, setShowAddPautaForm, pautasAiLoading, setPautasAiLoading, pautasAiSeconds, setPautasAiSeconds,
    showPautasAiModal, setShowPautasAiModal, aiPautasProposal, setAiPautasProposal,
    showPautasConfig, setShowPautasConfig, pautasConfigPromptOpen, setPautasConfigPromptOpen,
    pautasExtraInstructions, setPautasExtraInstructions, pautasTimerRef,
    loadPautas
  } = useEspeciePautas(especieId);

  const isDirty = isFormDirty || relacionesDirty;

  // Local values / state that didn't belong to any hook
  const {
    alimentacionFiltroAnimal, setAlimentacionFiltroAnimal,
    alimentacionFiltroAptitud, setAlimentacionFiltroAptitud,
    aiImageConcept, setAiImageConcept,
    aiImageLoading, setAiImageLoading,
    aiImageResult, setAiImageResult,
    aiImageDescription, setAiImageDescription,
    aiImagePromptPreview, setAiImagePromptPreview,
    aiImagePromptEdited, setAiImagePromptEdited,
    showAiImageModal, setShowAiImageModal,
    showPromptDetails, setShowPromptDetails
  } = uiState;

  // Initialize catalogs
  useEspecieInit({
    userEmail,
    especieId,
    tabParam,
    searchParams,
    setActiveTab,
    setMasterEspecies,
    setMasterAfecciones,
    setMasterLabores,
    setMasterFases,
    setMasterFamilias,
    setMasterIdiomas,
    setMasterPaises,
    setMasterAnimales,
    setMasterPlantasPartes,
    loadEspecie,
    loadAttachments,
    loadRelaciones,
    loadSinonimos,
    loadAlimentacion,
    loadPautas,
    loadExistingVarieties,
    setAlimentacion,
    setAlimentacionDirty,
    showAiConfig,
    setShowAiConfig,
    setAiConfigPrompt,
    setAiConfigTabs
  });

  // Action Handlers siphoned from form body
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
  }, [especieId, formData.especiesvegetalesnombre, userEmail, handleFileUpload]);

  const autoSaveField = async (name: string, value: any, customFormData?: any) => {
    if (!especieId || !userEmail) return;

    const dataToSave = customFormData || {
      ...formData,
      [name]: value
    };

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
        let updatedNotas = item.notes || item.notas || '';
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
          especiesanimalesnotes: updatedNotas,
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

      if (aiProposal.asociaciones_beneficiosas || aiProposal.asociaciones_perjudiciales || aiProposal.afecciones_asociadas) {
        await assimilateRelacionesAI();
      }

      if (aiProposal._sinonimos && selectedAiSinonimos.length > 0) {
        await assimilateSinonimosAI();
      }

      if (aiProposal._variedades && selectedAiVariedades.length > 0) {
        await assimilateVariedadesAI();
      }

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
      const toDelete = initialSinonimos.filter(init => !sinonimos.some(s => s.idespeciesvegetalessinonimos === init.idespeciesvegetalessinonimos));
      for (const del of toDelete) {
        await fetch(`/api/admin/especiesvegetales/${especieId}/sinonimos?id=${del.idespeciesvegetalessinonimos}`, { method: 'DELETE' });
      }

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

  const buildEspecieStoragePath = (file: File) => {
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

      const storageApi = await import('firebase/storage');
      const tempFileName = `temp-ai-${Date.now()}-${descBase.replace(/[^a-zA-Z0-9.-]/g, '')}.webp`;
      const tempPath = `uploads/temp/${tempFileName}`;
      const storageRef = storageApi.ref(storage, tempPath);
      await storageApi.uploadBytes(storageRef, blob);

      const saveRes = await fetch(`/api/admin/especiesvegetales/${especieId}/photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail || '' },
        body: JSON.stringify({
          rawStoragePath: tempPath,
          especieNombre: formData.especiesvegetalesnombre || 'especie',
          replacePhotoId: uiState.aiReplacingPhotoId || undefined
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
      uiState.setAiReplacingPhotoId(null);
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

  const openPhotoEditor = (photo: any) => {
    setEditingPhoto(photo);
  };

  const handleOpenPdfEditor = (pdf: any) => {
    setEditingPdf(pdf);
    setPdfTitle(pdf.titulo || '');
    setPdfSummary(pdf.resumen || '');
    setPdfApuntes(pdf.apuntes || '');
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
  }, [blogGenLoading, setBlogGenProgress]);

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

      const pautasRes = await fetch(`/api/admin/especiesvegetales/${especieId}/pautas`, {
        headers: { 'x-user-email': userEmail || '' }
      });
      if (pautasRes.ok) {
        const { pautas } = await pautasRes.json();
        setPautas(pautas || []);
      }

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

  return {
    isMobile,
    TABLE_MIN_WIDTH,
    CALENDAR_MIN_WIDTH,

    formData, setFormData, initialData, setInitialData,
    saveStatus, setSaveStatus, loading, setLoading,
    toastMessage, setToastMessage, isFormDirty,
    loadEspecie, saveFormData, autoSaveFases,

    photos, setPhotos, activeFotoId, setActiveFotoId,
    pdfs, setPdfs, blogs, setBlogs, dragOverPhotos, setDragOverPhotos,
    dragOverPdfs, setDragOverPdfs, uploadingPhotos, setUploadingPhotos,
    uploadingPdfs, setUploadingPdfs, draggedPhotoIndex, setDraggedPhotoIndex,
    draggedOverPhotoIndex, setDraggedOverPhotoIndex, draggedHeroPhotoId, setDraggedHeroPhotoId,
    draggedOverHeroPhotoId, setDraggedOverHeroPhotoId, editingPhoto, setEditingPhoto,
    photoEditorSaveStatus, setPhotoEditorSaveStatus, deleteConfirm, setDeleteConfirm,
    heroIndex, setHeroIndex, editingPdf, setEditingPdf, pdfTitle, setPdfTitle,
    pdfSummary, setPdfSummary, pdfApuntes, setPdfApuntes, pdfEditorSaveStatus, setPdfEditorSaveStatus,
    showPdfSearchModal, setShowPdfSearchModal, pdfSearchTopic, setPdfSearchTopic,
    pdfSearchResults, setPdfSearchResults, pdfSearchLoading, setPdfSearchLoading,
    pdfSearchError, setPdfSearchError, blogGenPdf, setBlogGenPdf, blogGenInstructions, setBlogGenInstructions,
    blogGenLoading, setBlogGenLoading, blogGenProgress, setBlogGenProgress, showBlogPrompt, setShowBlogPrompt,
    generatingCoverId, setGeneratingCoverId,

    loadAttachments, handleFileUpload, handleSetPrimaryPhoto, handleReorderPhotos,
    handlePhotoReorder, savePhotoEdits, savePdfEdits, confirmDelete,
    handleRunPdfSearch, handleGenerateBlog, generatePdfCover,

    masterEspecies, setMasterEspecies, masterAfecciones, setMasterAfecciones,
    masterFases, setMasterFases, masterFamilias, setMasterFamilias,
    masterIdiomas, setMasterIdiomas, masterPaises, setMasterPaises,
    masterAnimales, setMasterAnimales, masterPlantasPartes, setMasterPlantasPartes,
    masterLabores, setMasterLabores,
    relaciones, setRelaciones, initialRelaciones, setInitialRelaciones, relacionesDirty, setRelacionesDirty,
    relacionesSaveStatus, setRelacionesSaveStatus, existingVarieties, setExistingVarieties, checking, checkResults,
    showCheckModal, setShowCheckModal, sinonimos, setSinonimos, initialSinonimos, setInitialSinonimos, sinonimosDirty, setSinonimosDirty,
    sinonimosAiLoading, setSinonimosAiLoading, sinonimosAiSeconds, setSinonimosAiSeconds, showSinonimosAiModal, setShowSinonimosAiModal,
    aiSinonimosProposal, setAiSinonimosProposal, showSinonimosConfig, setShowSinonimosConfig, sinConfigPromptOpen, setSinConfigPromptOpen,
    sinSelectedScope, setSinSelectedScope, sinExtraInstructions, setSinExtraInstructions, sinScopePresets,
    alimentacion, setAlimentacion, initialAlimentacion, setInitialAlimentacion, alimentacionDirty, setAlimentacionDirty,
    sinonimosTimerRef,
    loadSinonimos, loadRelaciones, loadAlimentacion, loadExistingVarieties, resolvePlantasParteId,
    handleCheckSpecies,

    aiLoading, setAiLoading, activeTab, setActiveTab, isEspecieOpen, setIsEspecieOpen,
    calcPersonas, setCalcPersonas, aiProposal, setAiProposal, selectedRels, setSelectedRels,
    showAiModal, setShowAiModal, aiModalActiveTab, setAiModalActiveTab,
    selectedAiFields, setSelectedAiFields, showOnlyDiffs, setShowOnlyDiffs,
    collapsedAiGroups, setCollapsedAiGroups, isAssimilatingRels, setIsAssimilatingRels,
    showAiConfig, setShowAiConfig, aiConfigPrompt, setAiConfigPrompt, aiConfigTabs, setAiConfigTabs,
    selectedAiSinonimos, setSelectedAiSinonimos, selectedAiVariedades, setSelectedAiVariedades,
    selectedAiAlimentacion, setSelectedAiAlimentacion, isAssimilatingSinonimos, setIsAssimilatingSinonimos,
    isAssimilatingVariedades, setIsAssimilatingVariedades, assimilatedVarietyNames, setAssimilatedVarietyNames,
    aiSeconds, setAiSeconds, aiStats, setAiStats, isAssimilating, setIsAssimilating,
    assimilationSeconds, setAssimilationSeconds, aiTimerRef, assimilationTimerRef,
    runWithAssimilationLoading,

    pautas, setPautas, pautasFiltroFase, setPautasFiltroFase, pautasFiltroLabor, setPautasFiltroLabor,
    pautasFiltroLaboreo, setPautasFiltroLaboreo, editingPauta, setEditingPauta, pautaForm, setPautaForm,
    showAddPautaForm, setShowAddPautaForm, pautasAiLoading, setPautasAiLoading, pautasAiSeconds, setPautasAiSeconds,
    showPautasAiModal, setShowPautasAiModal, aiPautasProposal, setAiPautasProposal,
    showPautasConfig, setShowPautasConfig, pautasConfigPromptOpen, setPautasConfigPromptOpen,
    pautasExtraInstructions, setPautasExtraInstructions, pautasTimerRef,
    loadPautas,

    isDirty,
    alimentacionFiltroAnimal, setAlimentacionFiltroAnimal,
    alimentacionFiltroAptitud, setAlimentacionFiltroAptitud,

    aiImageConcept, setAiImageConcept,
    aiImageLoading, setAiImageLoading,
    aiImageResult, setAiImageResult,
    aiImageDescription, setAiImageDescription,
    aiImagePromptPreview, setAiImagePromptPreview,
    aiImagePromptEdited, setAiImagePromptEdited,
    showAiImageModal, setShowAiImageModal,
    showPromptDetails, setShowPromptDetails,
    aiReplacingPhotoId: uiState.aiReplacingPhotoId,
    setAiReplacingPhotoId: uiState.setAiReplacingPhotoId,

    saveAlimentacionNow,
    autoSaveField,
    handleFormBlur,
    handleChange,
    handleSubmit,
    callAI,
    runUnifiedAiSearch,
    assimilateSingleField,
    assimilateSinglePhase,
    assimilateRelacionesAI,
    assimilateSinonimosAI,
    assimilateVariedadesAI,
    assimilateAlimentacionAI,
    assimilateTab,
    assimilateAll,
    closeAiModal,
    openSinonimosConfig,
    proponerSinonimosAI,
    saveSinonimosNow,
    saveRelacionesNow,
    normalizePathSegment,
    getExtensionFromFile,
    buildEspecieStoragePath,
    buildDefaultPhotoResumen,
    buildPromptPreview,
    generateAiImage,
    uploadAiImage,
    handleDeleteFile,
    openPhotoEditor,
    handleOpenPdfEditor,
    handleAddPdfLink,
    handleDeleteBlog,
    handleSavePauta,
    handleDeletePauta,
    startPautasAiSearch,
    applyAiPautas,

    hasChanges,
    sortedPhotos,
    safeHeroIndex,
    heroPhoto,
    vibrantColor,
    heroMeta,
    aiGroups
  };
}
