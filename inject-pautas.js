const fs = require('fs');
let content = fs.readFileSync('src/components/admin/EspecieVegetalForm.tsx', 'utf8');

content = content.replace(
  "import { useEspecieAiConfig } from './hooks/EspecieVegetal/useEspecieAiConfig';",
  "import { useEspecieAiConfig } from './hooks/EspecieVegetal/useEspecieAiConfig';\nimport { useEspeciePautas } from './hooks/EspecieVegetal/useEspeciePautas';"
);

const destructuring = `
  const {
    pautas, setPautas, pautasFiltroFase, setPautasFiltroFase, pautasFiltroLabor, setPautasFiltroLabor,
    pautasFiltroLaboreo, setPautasFiltroLaboreo, editingPauta, setEditingPauta, pautaForm, setPautaForm,
    showAddPautaForm, setShowAddPautaForm, pautasAiLoading, setPautasAiLoading, pautasAiSeconds, setPautasAiSeconds,
    showPautasAiModal, setShowPautasAiModal, aiPautasProposal, setAiPautasProposal,
    showPautasConfig, setShowPautasConfig, pautasConfigPromptOpen, setPautasConfigPromptOpen,
    pautasExtraInstructions, setPautasExtraInstructions, pautasTimerRef
  } = useEspeciePautas(especieId);
`;

content = content.replace(
  /} = useEspecieAiConfig\(especieId, userEmail\);\r?\n/,
  `} = useEspecieAiConfig(especieId, userEmail);\n${destructuring}`
);

const varsToRemove = [
  'pautas', 'pautasFiltroFase', 'pautasFiltroLabor', 'pautasFiltroLaboreo', 'editingPauta',
  'pautaForm', 'showAddPautaForm', 'pautasAiLoading', 'pautasAiSeconds', 'showPautasAiModal',
  'aiPautasProposal', 'showPautasConfig', 'pautasConfigPromptOpen', 'pautasExtraInstructions'
];

let lines = content.split('\n');
let newLines = [];
let i = 0;
let removedCount = 0;

while (i < lines.length) {
  let line = lines[i];
  let keep = true;

  if (line.trim().startsWith('const [') || line.trim().startsWith('const pautasTimerRef =')) {
    for (const v of varsToRemove) {
      if (line.includes(`const [${v},`) || line.trim().startsWith(`const ${v} =`) || line.trim().startsWith(`const ${v}:`)) {
        keep = false;
        removedCount++;
        break;
      }
    }
  }

  // Remove `pautaForm` which is multi-line
  if (line.includes('const [pautaForm, setPautaForm] = useState({')) {
    keep = false;
    removedCount++;
    i += 8;
  }
  
  if (!keep && line.includes('pautasExtraInstructions')) {
     i += 1;
  }

  // Remove the useEffect for pautasTimerRef
  if (line.includes('useEffect(() => {') && lines[i+1] && lines[i+1].includes('return () => {') && lines[i+2] && lines[i+2].includes('pautasTimerRef.current')) {
     keep = false;
     removedCount++;
     i += 5; // The useEffect block is 6 lines
  }

  if (keep) {
    newLines.push(line);
  }
  i++;
}

fs.writeFileSync('src/components/admin/EspecieVegetalForm.tsx', newLines.join('\n'));
console.log(`Injected useEspeciePautas and removed ${removedCount} declarations.`);
