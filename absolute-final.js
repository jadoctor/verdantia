const fs = require('fs');
let code = fs.readFileSync('src/components/admin/EspecieVegetalForm.tsx', 'utf8');

// Fix the destructuring names for Media hooks
code = code.replace(
  "handleRunPdfSearch, handleGenerateBlog, generatePdfCover",
  "handleRunPdfSearch: handleSearchPdfs, handleGenerateBlog: submitBlogGen, generatePdfCover"
);

// Delete duplicate variables
const varsToRemove = [
  'pdfSearchError', 'setPdfSearchError', 'blogGenPdf', 'setBlogGenPdf',
  'blogGenInstructions', 'setBlogGenInstructions', 'blogGenLoading', 'setBlogGenLoading',
  'blogGenProgress', 'setBlogGenProgress', 'showBlogPrompt', 'setShowBlogPrompt',
  'pautas', 'setPautas', 'pautasFiltroFase', 'setPautasFiltroFase',
  'pautasFiltroLabor', 'setPautasFiltroLabor', 'pautasFiltroLaboreo', 'setPautasFiltroLaboreo',
  'masterLabores', 'editingPauta', 'setEditingPauta', 'pautaForm', 'setPautaForm',
  'toastMessage', 'setToastMessage', 'showAddPautaForm', 'setShowAddPautaForm',
  'showAiImageModal', 'setShowAiImageModal', 'aiImageConcept', 'setAiImageConcept',
  'aiImageLoading', 'setAiImageLoading', 'aiImageResult', 'setAiImageResult',
  'aiImageDescription', 'setAiImageDescription', 'aiImagePromptPreview', 'setAiImagePromptPreview',
  'aiImagePromptEdited', 'setAiImagePromptEdited', 'showPromptDetails', 'setShowPromptDetails',
  'pautasAiLoading', 'setPautasAiLoading', 'pautasAiSeconds', 'setPautasAiSeconds',
  'showPautasAiModal', 'setShowPautasAiModal', 'aiPautasProposal', 'setAiPautasProposal',
  'showPautasConfig', 'setShowPautasConfig', 'pautasConfigPromptOpen', 'setPautasConfigPromptOpen',
  'pautasExtraInstructions', 'setPautasExtraInstructions', 'STYLE_FILTERS', 'generatingCoverId', 'setGeneratingCoverId'
];

let lines = code.split('\n');
let newLines = [];
let skipStyleFilters = false;

for (let i = 0; i < lines.length; i++) {
  let line = lines[i];
  let keep = true;
  
  if (line.includes('const STYLE_FILTERS')) {
    skipStyleFilters = true;
    keep = false;
  }
  if (skipStyleFilters) {
    if (line.includes('};')) {
      skipStyleFilters = false;
    }
    continue; // skip lines inside STYLE_FILTERS block
  }

  if (line.trim().startsWith('const [')) {
    for (const v of varsToRemove) {
      if (line.includes(`const [${v},`) || line.includes(`, ${v}]`)) {
        keep = false;
        break;
      }
    }
  }
  if (line.trim().startsWith('const ') && line.includes('generatingCoverId')) {
    keep = false;
  }
  if (line.trim().startsWith('const ') && line.includes('masterLabores')) {
    keep = false;
  }
  
  if (keep) {
    newLines.push(line);
  }
}

fs.writeFileSync('src/components/admin/EspecieVegetalForm.tsx', newLines.join('\n'), 'utf8');
console.log('Final cleanup complete.');
