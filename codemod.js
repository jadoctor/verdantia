const fs = require('fs');
let code = fs.readFileSync('src/components/admin/EspecieVegetalForm.tsx', 'utf8');

// 1. Inject import
code = code.replace(
  "import { useEspecieCore } from './hooks/EspecieVegetal/useEspecieCore';",
  "import { useEspecieCore } from './hooks/EspecieVegetal/useEspecieCore';\nimport { useEspecieMedia } from './hooks/EspecieVegetal/useEspecieMedia';"
);

// 2. Inject hook variables after useEspecieCore
const coreHookRegex = /const \{\s*formData,\s*setFormData,\s*initialData,\s*setInitialData,\s*loading,\s*setLoading,\s*saveStatus,\s*setSaveStatus,\s*loadEspecie,\s*saveFormData\s*\} = useEspecieCore\(especieId, userEmail\);/;
const hookCall = `
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
code = code.replace(coreHookRegex, (match) => match + '\n' + hookCall);

// 3. Delete old states (we use a non-greedy regex from `const [photos` to `setShowBlogPrompt`)
const statesRegex = /const \[photos, setPhotos\] = useState<any\[\]>\(\[\]\);.*?const \[showBlogPrompt, setShowBlogPrompt\] = useState\(false\);/s;
code = code.replace(statesRegex, '// Media states extracted to useEspecieMedia');

// 4. Delete loadAttachments
const loadAttachmentsRegex = /const loadAttachments = async.*?^  };\n/ms;
code = code.replace(loadAttachmentsRegex, '');

// 5. Delete handleFileUpload
const handleFileUploadRegex = /const handleFileUpload = async.*?^  };\n/ms;
code = code.replace(handleFileUploadRegex, '');

// 6. Delete buildPromptPreview & generateAiImage (Wait, I didn't put those in useEspecieMedia? Ah, generateAiImage is for AI panel! Leave it!)

// 7. Delete handlePhotoReorder
const handlePhotoReorderRegex = /const handlePhotoReorder = \(e\?: React\.DragEvent.*?^  };\n/ms;
code = code.replace(handlePhotoReorderRegex, '');

// 8. Delete handleReorderPhotos
const handleReorderPhotosRegex = /const handleReorderPhotos = async.*?^  };\n/ms;
code = code.replace(handleReorderPhotosRegex, '');

// 9. Delete handleSetPrimaryPhoto
const handleSetPrimaryPhotoRegex = /const handleSetPrimaryPhoto = async.*?^  };\n/ms;
code = code.replace(handleSetPrimaryPhotoRegex, '');

// 10. Delete savePhotoEdits
const savePhotoEditsRegex = /const savePhotoEdits = async.*?^  };\n/ms;
code = code.replace(savePhotoEditsRegex, '');

// 11. Delete savePdfEdits
const savePdfEditsRegex = /const savePdfEdits = async.*?^  };\n/ms;
code = code.replace(savePdfEditsRegex, '');

// 12. Delete confirmDelete
const confirmDeleteRegex = /const confirmDelete = async.*?^  };\n/ms;
code = code.replace(confirmDeleteRegex, '');

// 13. Delete handleRunPdfSearch
const handleRunPdfSearchRegex = /const handleRunPdfSearch = async.*?^  };\n/ms;
code = code.replace(handleRunPdfSearchRegex, '');

// 14. Delete handleGenerateBlog
const handleGenerateBlogRegex = /const handleGenerateBlog = async.*?^  };\n/ms;
code = code.replace(handleGenerateBlogRegex, '');

// 15. Delete generatePdfCover
const generatePdfCoverRegex = /const generatePdfCover = async.*?^  };\n/ms;
code = code.replace(generatePdfCoverRegex, '');

fs.writeFileSync('src/components/admin/EspecieVegetalForm.tsx', code);
console.log('Codemod aplicado!');
