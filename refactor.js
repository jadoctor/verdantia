const fs = require('fs');
let code = fs.readFileSync('src/components/admin/EspecieVegetalForm.tsx', 'utf8');

// 1. Add imports
code = code.replace(
  "import PremiumBackButton from '@/components/ui/PremiumBackButton';",
  "import PremiumBackButton from '@/components/ui/PremiumBackButton';\nimport { useEspecieCore } from './hooks/EspecieVegetal/useEspecieCore';\nimport { useEspecieMedia } from './hooks/EspecieVegetal/useEspecieMedia';"
);

// 2. Replace the start of the component state
const stateStartRegex = /const defaultFormData = \{[\s\S]*?const \[loading, setLoading\] = useState\(false\);/m;
const hookInjection = `
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
`;
code = code.replace(stateStartRegex, hookInjection);

// 3. Delete media states (line 156 to 265 approximately)
// We will replace from "const [photos" to "const [showBlogPrompt...;"
const mediaStatesRegex = /const \[photos, setPhotos\] = useState<any\[\]>\(\[\]\);.*?const \[showBlogPrompt, setShowBlogPrompt\] = useState\(false\);/s;
code = code.replace(mediaStatesRegex, '');

// 4. Delete toastMessage state (since it's now in useEspecieCore)
code = code.replace(/const \[toastMessage, setToastMessage\] = useState<string \| null>\(null\);\n/, '');

// 5. Delete Core handlers
code = code.replace(/const loadEspecie = async[\s\S]*?^  };\n/m, '');
code = code.replace(/const saveFormData = async[\s\S]*?^  };\n/m, '');

// 6. Delete Media handlers
code = code.replace(/const loadAttachments = async[\s\S]*?^  };\n/m, '');
code = code.replace(/const handleFileUpload = async[\s\S]*?^  };\n/m, '');
code = code.replace(/const handlePhotoReorder = \(e\?: React\.DragEvent[\s\S]*?^  };\n/m, '');
code = code.replace(/const handleReorderPhotos = async[\s\S]*?^  };\n/m, '');
code = code.replace(/const handleSetPrimaryPhoto = async[\s\S]*?^  };\n/m, '');
code = code.replace(/const savePhotoEdits = async[\s\S]*?^  };\n/m, '');
code = code.replace(/const savePdfEdits = async[\s\S]*?^  };\n/m, '');
code = code.replace(/const confirmDelete = async[\s\S]*?^  };\n/m, '');
code = code.replace(/const handleRunPdfSearch = async[\s\S]*?^  };\n/m, '');
code = code.replace(/const handleGenerateBlog = async[\s\S]*?^  };\n/m, '');
code = code.replace(/const generatePdfCover = async[\s\S]*?^  };\n/m, '');

fs.writeFileSync('src/components/admin/EspecieVegetalForm.tsx', code);
console.log("Hooks injected and old code removed.");
