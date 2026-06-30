
import { useState, useRef, useEffect } from 'react';

export const useEspecieAiConfig = (especieId: string | null, userEmail: string | null) => {
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
  const [aiConfigPrompt, setAiConfigPrompt] = useState('Busca informaci�n bot�nica detallada de esta especie, incluyendo su taxonom�a, requerimientos, ecosistema de asociaciones, sin�nimos locales y principales variedades comerciales y tradicionales.');
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
  const [isAssimilating, setIsAssimilating] = useState(false);
  const [assimilationSeconds, setAssimilationSeconds] = useState(0);
  
  const aiTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const assimilationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (aiTimerRef.current) clearInterval(aiTimerRef.current);
      if (assimilationTimerRef.current) clearInterval(assimilationTimerRef.current);
    };
  }, []);

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

  return {
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
  };
};
