import { useState, Dispatch, SetStateAction } from 'react';
import { fetchAiAssistant } from '../services/familiaApi';
import { Familia } from '../types';

export function useAiAssistant(
  familia: Familia | null, 
  userEmail: string | null,
  setFamilia: Dispatch<SetStateAction<Familia | null>>,
  autoSave: (data: Partial<Familia>) => Promise<void>,
  setActiveTab: Dispatch<SetStateAction<string>>
) {
  const [isAILoading, setIsAILoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiModalType, setAiModalType] = useState<'full' | 'general' | 'rotacion'>('full');
  const [aiPromptOpen, setAiPromptOpen] = useState(false);
  const [aiExtraInstructions, setAiExtraInstructions] = useState('');
  const [aiSeconds, setAiSeconds] = useState(0);
  const [aiProposals, setAiProposals] = useState<any>(null);
  const [aiAcceptedFields, setAiAcceptedFields] = useState<Record<string, boolean>>({});
  const [aiArraySelections, setAiArraySelections] = useState<Record<string, string[]>>({});

  const handleAIAssist = async () => {
    if (!familia || !userEmail) return;
    setIsAILoading(true);
    setAiError(null);
    setAiSeconds(0);
    const intervalId = setInterval(() => setAiSeconds(s => s + 1), 1000);
    try {
      const endpoint = '/api/ai/familia-full-assistant';
      const data = await fetchAiAssistant(endpoint, familia.familiasnombre, aiExtraInstructions, userEmail);
      
      clearInterval(intervalId);
      setAiProposals(data);
      
      setAiAcceptedFields({
        familiasnombrecientifico: true,
        familiasgruporotacion: true,
        familiasanosdescanso: true,
        familiasemoji: true,
        familiascolor: true,
        familiasdescripcion: true,
        familiasnotas: true
      });
      setAiArraySelections({
        familiasprecedentes: (data.familiasprecedentes || []).map(String),
        familiassucesores: (data.familiassucesores || []).map(String)
      });
    } catch (e: any) {
      clearInterval(intervalId);
      setAiError(e.message);
    } finally {
      setIsAILoading(false);
    }
  };

  const applyAIProposals = () => {
    if (!familia || !aiProposals) return;
    const newFamilia = { ...familia };
    Object.keys(aiAcceptedFields).forEach(key => {
      if (aiAcceptedFields[key] && aiProposals[key] !== undefined) {
        (newFamilia as any)[key] = aiProposals[key];
      }
    });
    // Apply array selections
    newFamilia.familiasprecedentes = aiArraySelections['familiasprecedentes'] ? aiArraySelections['familiasprecedentes'].map(Number) : newFamilia.familiasprecedentes;
    newFamilia.familiassucesores = aiArraySelections['familiassucesores'] ? aiArraySelections['familiassucesores'].map(Number) : newFamilia.familiassucesores;

    setFamilia(newFamilia);
    autoSave(newFamilia);
    setShowAiModal(false);
  };

  return {
    isAILoading, aiError, showAiModal, setShowAiModal, aiModalType, setAiModalType,
    aiPromptOpen, setAiPromptOpen, aiExtraInstructions, setAiExtraInstructions,
    aiSeconds, aiProposals, setAiProposals, aiAcceptedFields, setAiAcceptedFields,
    aiArraySelections, setAiArraySelections, handleAIAssist, applyAIProposals
  };
}
