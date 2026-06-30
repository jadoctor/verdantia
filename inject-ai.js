const fs = require('fs');
let content = fs.readFileSync('src/components/admin/EspecieVegetalForm.tsx', 'utf8');

content = content.replace(
  "import { useEspecieTaxonomy } from './hooks/EspecieVegetal/useEspecieTaxonomy';",
  "import { useEspecieTaxonomy } from './hooks/EspecieVegetal/useEspecieTaxonomy';\nimport { useEspecieAiConfig } from './hooks/EspecieVegetal/useEspecieAiConfig';"
);

const destructuring = `
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
    assimilationSeconds, setAssimilationSeconds, aiTimerRef, assimilationTimerRef,
    runWithAssimilationLoading
  } = useEspecieAiConfig(especieId, userEmail);
`;

content = content.replace(
  /} = useEspecieTaxonomy\(\{ especieId, userEmail, formData \}\);\r?\n/,
  `} = useEspecieTaxonomy({ especieId, userEmail, formData });\n${destructuring}`
);

// Delete the specific old state declarations:
const varsToRemove = [
  'isMobile', 'aiLoading', 'activeTab', 'isEspecieOpen', 'calcPersonas', 'aiProposal',
  'selectedRels', 'showAiModal', 'aiModalActiveTab', 'selectedAiFields', 'showOnlyDiffs',
  'collapsedAiGroups', 'isAssimilatingRels', 'showAiConfig', 'aiConfigPrompt', 'aiConfigTabs',
  'selectedAiSinonimos', 'selectedAiVariedades', 'selectedAiAlimentacion',
  'isAssimilatingSinonimos', 'isAssimilatingVariedades', 'assimilatedVarietyNames',
  'aiSeconds', 'aiStats', 'isAssimilating', 'assimilationSeconds'
];

let lines = content.split('\n');
let newLines = [];
let i = 0;
let removedCount = 0;

while (i < lines.length) {
  let line = lines[i];
  let keep = true;

  if (line.trim().startsWith('const [') || line.trim().startsWith('const aiTimerRef =') || line.trim().startsWith('const assimilationTimerRef =')) {
    for (const v of varsToRemove) {
      if (line.includes(`const [${v},`) || line.trim().startsWith(`const ${v} =`) || line.trim().startsWith(`const ${v}:`)) {
        keep = false;
        removedCount++;
        break;
      }
    }
  }

  // Remove `aiConfigTabs` which is multi-line
  if (!keep && line.includes('aiConfigTabs')) {
    i += 11;
  }
  
  // Remove runWithAssimilationLoading which is multi-line
  if (line.includes('const runWithAssimilationLoading =')) {
    keep = false;
    removedCount++;
    i += 20; // It's exactly 21 lines block
  }
  
  // Remove the useEffect for timer refs
  if (line.includes('useEffect(() => {') && lines[i+1].includes('return () => {') && lines[i+2].includes('aiTimerRef.current')) {
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
console.log(`Injected useEspecieAiConfig and removed ${removedCount} declarations.`);
