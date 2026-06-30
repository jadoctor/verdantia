
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
  const [aiConfigPrompt, setAiConfigPrompt] = useState('Busca informaci+�n bot+�nica detallada de esta especie, incluyendo su taxonom+�a, requerimientos, ecosistema de asociaciones, sin+�nimos locales y principales variedades comerciales y tradicionales.');
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

  // -- Chekeo y Variedades Existentes State --

  // -- Sinonimos State --

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
  const sinScopePresets: Record<string, string> = {
    general: 'Busca sin+�nimos en espa+�ol de Latinoam+�rica y principales idiomas mundiales. Incluye variantes regionales donde el nombre sea diferente al principal.',
    cooficiales: 'Busca sin+�nimos en las lenguas cooficiales de Espa+�a: Valenciano, Gallego y Euskera. Prioriza nombres tradicionales peninsulares.',
    europa: 'Busca sin+�nimos en idiomas europeos: Franc+�s, Italiano, Portugu+�s, Alem+�n e Ingl+�s. Asocia cada nombre a su pa+�s correspondiente.'
  };
  // -- Animales State --

