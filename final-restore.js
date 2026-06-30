const fs = require('fs');

// 1. We will read the clean, pristine file (we will run git checkout before this script)
let code = fs.readFileSync('src/components/admin/EspecieVegetalForm.tsx', 'utf8');

// 2. Add imports
code = code.replace(
  "import PremiumBackButton from '@/components/ui/PremiumBackButton';",
  "import PremiumBackButton from '@/components/ui/PremiumBackButton';\nimport { useEspecieCore } from './hooks/EspecieVegetal/useEspecieCore';\nimport { useEspecieMedia } from './hooks/EspecieVegetal/useEspecieMedia';\nimport { useEspecieTaxonomy } from './hooks/EspecieVegetal/useEspecieTaxonomy';\nimport { useEspecieAiConfig } from './hooks/EspecieVegetal/useEspecieAiConfig';\nimport { useEspeciePautas } from './hooks/EspecieVegetal/useEspeciePautas';"
);

// 3. Replace state block with ALL hooks
const stateStartRegex = /const defaultFormData = \{[\s\S]*?const \[loading, setLoading\] = useState\(false\);/m;
const allHooksInjection = `
  const {
    formData, setFormData, initialData, setInitialData,
    saveStatus, setSaveStatus, loading, setLoading,
    toastMessage, setToastMessage, isFormDirty,
    loadEspecie, saveFormData
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
    masterEspecies, masterAfecciones, masterFases, masterFamilias,
    masterIdiomas, masterPaises, masterAnimales, masterPlantasPartes,
    masterLabores, relaciones, setRelaciones, initialRelaciones, setInitialRelaciones, relacionesDirty, setRelacionesDirty,
    relacionesSaveStatus, setRelacionesSaveStatus, existingVarieties, checking, checkResults,
    showCheckModal, sinonimos, initialSinonimos, sinonimosDirty,
    sinonimosAiLoading, sinonimosAiSeconds, showSinonimosAiModal,
    aiSinonimosProposal, showSinonimosConfig, sinConfigPromptOpen,
    sinSelectedScope, sinExtraInstructions, sinScopePresets,
    alimentacion, initialAlimentacion, alimentacionDirty, setAlimentacionDirty, handleCheckSpecies
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
    assimilationSeconds, setAssimilationSeconds, runWithAssimilationLoading
  } = useEspecieAiConfig(especieId, userEmail);

  const {
    pautas, setPautas, pautasFiltroFase, setPautasFiltroFase, pautasFiltroLabor, setPautasFiltroLabor,
    pautasFiltroLaboreo, setPautasFiltroLaboreo, editingPauta, setEditingPauta, pautaForm, setPautaForm,
    showAddPautaForm, setShowAddPautaForm, pautasAiLoading, setPautasAiLoading, pautasAiSeconds, setPautasAiSeconds,
    showPautasAiModal, setShowPautasAiModal, aiPautasProposal, setAiPautasProposal,
    showPautasConfig, setShowPautasConfig, pautasConfigPromptOpen, setPautasConfigPromptOpen,
    pautasExtraInstructions, setPautasExtraInstructions
  } = useEspeciePautas(especieId);

  const [isMobile, setIsMobile] = useState(false);
  const isDirty = isFormDirty || relacionesDirty;

  const [showAiImageModal, setShowAiImageModal] = useState(false);
  const [aiImageConcept, setAiImageConcept] = useState('');
  const [aiImageLoading, setAiImageLoading] = useState(false);
  const [aiImageResult, setAiImageResult] = useState<string | null>(null);
  const [aiImageDescription, setAiImageDescription] = useState('');
  const [aiImagePromptPreview, setAiImagePromptPreview] = useState('');
  const [aiImagePromptEdited, setAiImagePromptEdited] = useState(false);
  const [showPromptDetails, setShowPromptDetails] = useState(false);

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
    cool: 'hue-rotate(15deg) saturate(110%) brightness(105%)',
    warm: 'hue-rotate(-15deg) saturate(120%) brightness(105%)'
  };
`;
code = code.replace(stateStartRegex, allHooksInjection);

// 4. Delete the massive chunk of extracted states. We will do this carefully by searching for the start and end tokens.
// In the original file, right after "const [loading, setLoading] = useState(false);" is "const [aiLoading, setAiLoading]"
// and the state block ends before "useEffect(() => {"
const stateStartStr = "const [aiLoading, setAiLoading] = useState(false);";
const stateEndStr = "// -- Efecto de Autoguardado Principal --";

const startIdx = code.indexOf(stateStartStr);
const endIdx = code.indexOf(stateEndStr);

if (startIdx !== -1 && endIdx !== -1) {
  code = code.substring(0, startIdx) + code.substring(endIdx);
}

// 5. Delete the extracted FUNCTIONS.
function removeFunction(source, funcName) {
  const regex = new RegExp(`const ${funcName} = (async )?\\([^)]*\\) => \\{`);
  let match = source.match(regex);
  if (!match) return source;
  
  let start = match.index;
  let openBrackets = 0;
  let i = start;
  let foundFirstBracket = false;
  
  while (i < source.length) {
    if (source[i] === '{') {
      openBrackets++;
      foundFirstBracket = true;
    } else if (source[i] === '}') {
      openBrackets--;
    }
    
    i++;
    if (foundFirstBracket && openBrackets === 0) {
      break;
    }
  }
  
  if (source[i] === ';') i++;
  if (source[i] === '\n') i++;
  if (source[i] === '\r' && source[i+1] === '\n') i += 2;
  
  return source.substring(0, start) + source.substring(i);
}

const funcsToRemove = [
  'loadEspecie', 'saveFormData', 'loadAttachments', 'handleFileUpload',
  'handlePhotoReorder', 'handleReorderPhotos', 'handleSetPrimaryPhoto',
  'savePhotoEdits', 'savePdfEdits', 'confirmDelete', 'generatePdfCover',
  'handleSearchPdfs', 'submitBlogGen', 'handleCheckSpecies'
];

for (const fn of funcsToRemove) {
  code = removeFunction(code, fn);
  // Call again in case of duplicates
  code = removeFunction(code, fn);
}

// 6. Fix `subtitle` in PremiumSubheader since it breaks TS rules for PremiumSubheaderProps
code = code.replace(/subtitle=\{[^\}]+\}/g, '');

fs.writeFileSync('src/components/admin/EspecieVegetalForm.tsx', code, 'utf8');
console.log('Successfully applied all hooks to pristine file.');
