import { useEffect } from 'react';

interface UseEspecieInitProps {
  userEmail: string | null;
  especieId: string | null;
  tabParam: string | null;
  searchParams: any;
  setActiveTab: (tab: string) => void;
  setMasterEspecies: (data: any[]) => void;
  setMasterAfecciones: (data: any[]) => void;
  setMasterLabores: (data: any[]) => void;
  setMasterFases: (data: any[]) => void;
  setMasterFamilias: (data: any[]) => void;
  setMasterIdiomas: (data: any[]) => void;
  setMasterPaises: (data: any[]) => void;
  setMasterAnimales: (data: any[]) => void;
  setMasterPlantasPartes: (data: any[]) => void;
  loadEspecie: (id: string) => Promise<void>;
  loadAttachments: (id: string) => Promise<void>;
  loadRelaciones: (id: string) => Promise<void>;
  loadSinonimos: (id: string) => Promise<void>;
  loadAlimentacion: (id: string) => Promise<void>;
  loadPautas: (id: string) => Promise<void>;
  loadExistingVarieties: (id: string) => Promise<void>;
  setAlimentacion: (data: any[]) => void;
  setAlimentacionDirty: (val: boolean) => void;
  showAiConfig: boolean;
  setShowAiConfig: (val: boolean) => void;
  setAiConfigPrompt: (prompt: string) => void;
  setAiConfigTabs: (tabs: any) => void;
}

export default function useEspecieInit({
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
}: UseEspecieInitProps) {
  // Efecto: mapear tabParam a activeTab
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
  }, [tabParam, setActiveTab]);

  // Efecto: cargar catálogos maestros y datos de la especie
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [especieId, userEmail]);

  // Efecto: AI Trigger para especies nuevas importadas desde el identificador IA
  useEffect(() => {
    const fromParam = searchParams.get('from');
    const nameParam = searchParams.get('name');
    const advParam = searchParams.get('adv');
    
    if (fromParam === 'identificar-especie' && nameParam && !showAiConfig) {
      const pendingAlimentacionStr = sessionStorage.getItem('ai_pending_alimentacion');
      if (pendingAlimentacionStr) {
        try {
          const parsed = JSON.parse(pendingAlimentacionStr);
          const mapped = parsed.map((c: any) => ({
            idespeciesvegetalesanimales: null,
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

      const isAdventicia = advParam === '1';
      if (isAdventicia) {
        setAiConfigPrompt(`Busca información botánica detallada de esta especie (${nameParam}). Al ser considerada adventicia o mala hierba, céntrate exclusivamente en su identificación biológica, familia, toxicidad, forraje y usos tradicionales. Ignora todo lo relacionado con requerimientos agronómicos, marcos de plantación, poda o cultivo activo, ya que no se va a cultivar.`);
        setAiConfigTabs({
          taxonomia: true, cultivo: false, asociaciones: true, fases: false, biodinamica: false,
          textos: true, pautas: false, sinonimos: true, alimentacion: true
        });
      } else {
        setAiConfigPrompt(`Busca información botánica y agronómica detallada de esta especie (${nameParam}), incluyendo su taxonomía, requerimientos de cultivo, ecosistema de asociaciones, sinónimos locales y principales variedades comerciales y tradicionales.`);
      }

      setTimeout(() => {
        setAiConfigTabs({ taxonomia: true, cultivo: true, fases: true, biodinamica: true, asociaciones: true, textos: true, sinonimos: true, variedades: true, alimentacion: true, pautas: true });
        setAiConfigPrompt('');
        setShowAiConfig(true);
      }, 500);
    }
  }, [searchParams, showAiConfig, setAlimentacion, setAlimentacionDirty, setAiConfigPrompt, setAiConfigTabs, setShowAiConfig]);
}
