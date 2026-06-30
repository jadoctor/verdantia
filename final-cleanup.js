const fs = require('fs');
let code = fs.readFileSync('src/components/admin/EspecieVegetalForm.tsx', 'utf8');

// 1. Fix the destructuring for useEspecieTaxonomy
code = code.replace(
  "masterLabores, relaciones, initialRelaciones, relacionesDirty,",
  "masterLabores, relaciones, setRelaciones, initialRelaciones, setInitialRelaciones, relacionesDirty, setRelacionesDirty,"
);
code = code.replace(
  "relacionesSaveStatus, existingVarieties, checking, checkResults,",
  "relacionesSaveStatus, setRelacionesSaveStatus, existingVarieties, checking, checkResults,"
);

// 2. Remove duplicate timer refs (the ones not destructured)
code = code.replace(/const aiTimerRef = useRef[\s\S]*?;\r?\n/g, '');
code = code.replace(/const assimilationTimerRef = useRef[\s\S]*?;\r?\n/g, '');
code = code.replace(/const pautasTimerRef = useRef[\s\S]*?;\r?\n/g, '');
code = code.replace(/const \[toastMessage, setToastMessage\] = useState[\s\S]*?;\r?\n/g, '');
code = code.replace(/const STYLE_FILTERS: Record<string, string> = \{[\s\S]*?\};\r?\n/m, '');

const varsToRemove = [
  'setShowAddPautaForm', 'showAiImageModal', 'setShowAiImageModal',
  'aiImageConcept', 'setAiImageConcept', 'aiImageLoading', 'setAiImageLoading',
  'aiImageResult', 'setAiImageResult', 'aiImageDescription', 'setAiImageDescription',
  'aiImagePromptPreview', 'setAiImagePromptPreview', 'aiImagePromptEdited', 'setAiImagePromptEdited',
  'showPromptDetails', 'setShowPromptDetails', 'pautasAiLoading', 'setPautasAiLoading',
  'pautasAiSeconds', 'setPautasAiSeconds', 'showPautasAiModal', 'setShowPautasAiModal',
  'aiPautasProposal', 'setAiPautasProposal', 'showPautasConfig', 'setShowPautasConfig',
  'pautasConfigPromptOpen', 'setPautasConfigPromptOpen', 'pautasExtraInstructions', 'setPautasExtraInstructions',
  'generatingCoverId', 'setGeneratingCoverId'
];

let lines = code.split('\n');
let newLines = [];
for (let i = 0; i < lines.length; i++) {
  let line = lines[i];
  let keep = true;
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
  if (keep) {
    newLines.push(line);
  }
}
code = newLines.join('\n');

// 3. Remove remaining functions
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

code = removeFunction(code, 'handleSearchPdfs');
code = removeFunction(code, 'submitBlogGen');

// Wait! `subtitle` error was still in tsc output! Let's strip it correctly.
code = code.replace(/subtitle=\{[^\}]+\}/g, '');

fs.writeFileSync('src/components/admin/EspecieVegetalForm.tsx', code, 'utf8');
console.log('Final cleanup complete.');
