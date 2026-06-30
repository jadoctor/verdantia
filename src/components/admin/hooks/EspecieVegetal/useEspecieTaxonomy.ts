import { useState, useRef, useEffect } from 'react';

interface UseEspecieTaxonomyProps {
  especieId: string | null;
  userEmail: string | null;
  formData: any;
}

export const useEspecieTaxonomy = ({ especieId, userEmail, formData }: UseEspecieTaxonomyProps) => {
  // -- Master Catalogs --
  const [masterEspecies, setMasterEspecies] = useState<any[]>([]);
  const [masterAfecciones, setMasterAfecciones] = useState<any[]>([]);
  const [masterFases, setMasterFases] = useState<any[]>([]);
  const [masterFamilias, setMasterFamilias] = useState<any[]>([]);
  const [masterIdiomas, setMasterIdiomas] = useState<any[]>([]);
  const [masterPaises, setMasterPaises] = useState<any[]>([]);
  const [masterAnimales, setMasterAnimales] = useState<any[]>([]);
  const [masterPlantasPartes, setMasterPlantasPartes] = useState<any[]>([]);
  const [masterLabores, setMasterLabores] = useState<any[]>([]); // also fetched here

  // -- Relaciones State --
  const [relaciones, setRelaciones] = useState<{ beneficiosas: any[]; perjudiciales: any[]; afecciones: any[] }>({ beneficiosas: [], perjudiciales: [], afecciones: [] });
  const [initialRelaciones, setInitialRelaciones] = useState<{ beneficiosas: any[]; perjudiciales: any[]; afecciones: any[] }>({ beneficiosas: [], perjudiciales: [], afecciones: [] });
  const [relacionesDirty, setRelacionesDirty] = useState(false);
  const [relacionesSaveStatus, setRelacionesSaveStatus] = useState<'idle' | 'saving' | 'no-changes'>('idle');

  // -- Chekeo y Variedades Existentes State --
  const [existingVarieties, setExistingVarieties] = useState<any[]>([]);
  const [checking, setChecking] = useState(false);
  const [checkResults, setCheckResults] = useState<any>(null);
  const [showCheckModal, setShowCheckModal] = useState(false);

  // -- Sinonimos State --
  const [sinonimos, setSinonimos] = useState<any[]>([]);
  const [initialSinonimos, setInitialSinonimos] = useState<any[]>([]);
  const [sinonimosDirty, setSinonimosDirty] = useState(false);
  
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

  // -- Animales / Alimentacion State --
  const [alimentacion, setAlimentacion] = useState<any[]>([]);
  const [initialAlimentacion, setInitialAlimentacion] = useState<any[]>([]);
  const [alimentacionDirty, setAlimentacionDirty] = useState(false);

  // Fetch Master Catalogs
  useEffect(() => {
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
      fetch('/api/admin/animales', { headers: { 'x-user-email': userEmail } })
        .then(res => res.json())
        .then(data => setMasterAnimales(data.animales || []));
      fetch('/api/admin/plantaspartes', { headers: { 'x-user-email': userEmail } })
        .then(res => res.json())
        .then(data => setMasterPlantasPartes(data.partes || []));
    }
  }, [userEmail]);

  useEffect(() => {
    return () => {
      if (sinonimosTimerRef.current) clearInterval(sinonimosTimerRef.current);
    };
  }, []);

  // Efecto: vincular alimentación importada por nombre a IDs de plantasparte
  useEffect(() => {
    if (masterPlantasPartes.length > 0 && alimentacion.length > 0) {
      let changed = false;
      const updated = alimentacion.map(c => {
        if (!c.xespeciesvegetalesanimalesidplantasparte && c.especiesanimalespartes) {
          const normalized = c.especiesanimalespartes.trim().toLowerCase();
          const found = masterPlantasPartes.find(p => p.plantaspartenombre.toLowerCase() === normalized);
          if (found) {
            changed = true;
            return {
              ...c,
              xespeciesvegetalesanimalesidplantasparte: found.idplantasparte,
              especiesanimalespartes: found.plantaspartenombre
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

  const resolvePlantasParteId = async (name: string): Promise<number | null> => {
    const normalized = name.trim().toLowerCase();
    if (!normalized) return null;

    const existing = masterPlantasPartes.find(p => p.plantaspartenombre.toLowerCase() === normalized);
    if (existing) return existing.idplantasparte;

    try {
      const res = await fetch('/api/admin/plantasparte', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': userEmail || ''
        },
        body: JSON.stringify({
          plantaspartenombre: name.trim(),
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
            plantaspartenombre: name.trim(),
            plantasparteemoji: '',
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

  const handleCheckSpecies = async () => {
    if (!formData.especiesvegetalesnombre) {
      alert('Escribe un nombre común primero.');
      return;
    }
    setChecking(true);
    setCheckResults(null);
    setShowCheckModal(true);
    try {
      const res = await fetch(`/api/admin/especiesvegetales/check?nombre=${encodeURIComponent(formData.especiesvegetalesnombre)}&nombreCientifico=${encodeURIComponent(formData.especiesvegetalesnombrecientifico)}`, {
        headers: { 'x-user-email': userEmail || '' }
      });
      const data = await res.json();
      setCheckResults(data);
    } catch (err) {
      console.error(err);
      setCheckResults({ error: true });
    } finally {
      setChecking(false);
    }
  };

  return {
    masterEspecies, setMasterEspecies,
    masterAfecciones, setMasterAfecciones,
    masterFases, setMasterFases,
    masterFamilias, setMasterFamilias,
    masterIdiomas, setMasterIdiomas,
    masterPaises, setMasterPaises,
    masterAnimales, setMasterAnimales,
    masterPlantasPartes, setMasterPlantasPartes,
    masterLabores, setMasterLabores,

    relaciones, setRelaciones,
    initialRelaciones, setInitialRelaciones,
    relacionesDirty, setRelacionesDirty,
    relacionesSaveStatus, setRelacionesSaveStatus,

    existingVarieties, setExistingVarieties,
    checking, setChecking,
    checkResults, setCheckResults,
    showCheckModal, setShowCheckModal,

    sinonimos, setSinonimos,
    initialSinonimos, setInitialSinonimos,
    sinonimosDirty, setSinonimosDirty,
    sinonimosAiLoading, setSinonimosAiLoading,
    sinonimosAiSeconds, setSinonimosAiSeconds,
    sinonimosTimerRef,
    showSinonimosAiModal, setShowSinonimosAiModal,
    aiSinonimosProposal, setAiSinonimosProposal,

    showSinonimosConfig, setShowSinonimosConfig,
    sinConfigPromptOpen, setSinConfigPromptOpen,
    sinSelectedScope, setSinSelectedScope,
    sinExtraInstructions, setSinExtraInstructions,
    sinScopePresets,

    alimentacion, setAlimentacion,
    initialAlimentacion, setInitialAlimentacion,
    alimentacionDirty, setAlimentacionDirty,

    loadSinonimos,
    loadRelaciones,
    loadAlimentacion,
    loadExistingVarieties,
    resolvePlantasParteId,
    handleCheckSpecies
  };
};
