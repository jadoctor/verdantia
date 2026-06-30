
import { useState, useRef, useEffect } from 'react';

export const useEspeciePautas = (especieId: string | null) => {
  const [pautas, setPautas] = useState<any[]>([]);
  const [pautasFiltroFase, setPautasFiltroFase] = useState('');
  const [pautasFiltroLabor, setPautasFiltroLabor] = useState('');
  const [pautasFiltroLaboreo, setPautasFiltroLaboreo] = useState('');
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
  const [showAddPautaForm, setShowAddPautaForm] = useState(false);

  // -- Pautas AI State --
  const [pautasAiLoading, setPautasAiLoading] = useState(false);
  const [pautasAiSeconds, setPautasAiSeconds] = useState(0);
  const [showPautasAiModal, setShowPautasAiModal] = useState(false);
  const [aiPautasProposal, setAiPautasProposal] = useState<any[]>([]);
  
  const [showPautasConfig, setShowPautasConfig] = useState(false);
  const [pautasConfigPromptOpen, setPautasConfigPromptOpen] = useState(false);
  const [pautasExtraInstructions, setPautasExtraInstructions] = useState('Te debes centrar exclusivamente en las labores que tiene el sistema y en esta especie, y comportarte como un experto.');

  const pautasTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (pautasTimerRef.current) clearInterval(pautasTimerRef.current);
    };
  }, []);

  const loadPautas = async (id: string) => {
    if (!id) return;
    try {
      const res = await fetch(`/api/admin/especiesvegetales/${id}/pautas`);
      if (res.ok) {
        const data = await res.json();
        setPautas(data.pautas || []);
      }
    } catch (e) {
      console.error('Error cargando pautas:', e);
    }
  };

  return {
    pautas, setPautas, pautasFiltroFase, setPautasFiltroFase, pautasFiltroLabor, setPautasFiltroLabor,
    pautasFiltroLaboreo, setPautasFiltroLaboreo, editingPauta, setEditingPauta, pautaForm, setPautaForm,
    showAddPautaForm, setShowAddPautaForm, pautasAiLoading, setPautasAiLoading, pautasAiSeconds, setPautasAiSeconds,
    showPautasAiModal, setShowPautasAiModal, aiPautasProposal, setAiPautasProposal,
    showPautasConfig, setShowPautasConfig, pautasConfigPromptOpen, setPautasConfigPromptOpen,
    pautasExtraInstructions, setPautasExtraInstructions, pautasTimerRef,
    loadPautas
  };
};
