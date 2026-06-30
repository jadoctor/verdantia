import { useState, useEffect } from 'react';

export function useEspecieUiState() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const checkResize = () => setIsMobile(window.innerWidth <= 768);
    checkResize();
    window.addEventListener('resize', checkResize);
    return () => window.removeEventListener('resize', checkResize);
  }, []);

  // Filtros de alimentación animal
  const [alimentacionFiltroAnimal, setAlimentacionFiltroAnimal] = useState('');
  const [alimentacionFiltroAptitud, setAlimentacionFiltroAptitud] = useState('');

  // AI Image Generation State
  const [aiImageConcept, setAiImageConcept] = useState('');
  const [aiImageLoading, setAiImageLoading] = useState(false);
  const [aiImageResult, setAiImageResult] = useState<string | null>(null);
  const [aiImageDescription, setAiImageDescription] = useState('');
  const [aiImagePromptPreview, setAiImagePromptPreview] = useState('');
  const [aiImagePromptEdited, setAiImagePromptEdited] = useState(false);
  const [showAiImageModal, setShowAiImageModal] = useState(false);
  const [showPromptDetails, setShowPromptDetails] = useState(false);
  const [aiReplacingPhotoId, setAiReplacingPhotoId] = useState<string | number | null>(null);

  return {
    isMobile,
    alimentacionFiltroAnimal,
    setAlimentacionFiltroAnimal,
    alimentacionFiltroAptitud,
    setAlimentacionFiltroAptitud,
    aiImageConcept,
    setAiImageConcept,
    aiImageLoading,
    setAiImageLoading,
    aiImageResult,
    setAiImageResult,
    aiImageDescription,
    setAiImageDescription,
    aiImagePromptPreview,
    setAiImagePromptPreview,
    aiImagePromptEdited,
    setAiImagePromptEdited,
    showAiImageModal,
    setShowAiImageModal,
    showPromptDetails,
    setShowPromptDetails,
    aiReplacingPhotoId,
    setAiReplacingPhotoId
  };
}
