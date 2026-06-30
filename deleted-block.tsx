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
  const [aiConfigPrompt, setAiConfigPrompt] = useState('Busca informaci+好 bot+璯ica detallada de esta especie, incluyendo su taxonom+｛, requerimientos, ecosistema de asociaciones, sin+好imos locales y principales variedades comerciales y tradicionales.');
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
  const [sinExtraInstructions, setSinExtraInstructions] = useState('Busca sin+好imos en espa+她l de Latinoam+崁ica y principales idiomas mundiales. Incluye variantes regionales donde el nombre sea diferente al principal.');
  const sinScopePresets: Record<string, string> = {
    general: 'Busca sin+好imos en espa+她l de Latinoam+崁ica y principales idiomas mundiales. Incluye variantes regionales donde el nombre sea diferente al principal.',
    cooficiales: 'Busca sin+好imos en las lenguas cooficiales de Espa+地: Valenciano, Gallego y Euskera. Prioriza nombres tradicionales peninsulares.',
    europa: 'Busca sin+好imos en idiomas europeos: Franc+峴, Italiano, Portugu+峴, Alem+璯 e Ingl+峴. Asocia cada nombre a su pa+︿ correspondiente.'
  };
  // -- Animales State --
  const [masterAnimales, setMasterAnimales] = useState<any[]>([]);
  const [masterPlantasPartes, setMasterPlantasPartes] = useState<any[]>([]);
  const [alimentacion, setAlimentacion] = useState<any[]>([]);
  const [initialAlimentacion, setInitialAlimentacion] = useState<any[]>([]);
  const [alimentacionDirty, setAlimentacionDirty] = useState(false);

