const fs = require('fs');
let code = fs.readFileSync('src/components/admin/EspecieVegetalForm.tsx', 'utf8');

// 1. Add Import
code = code.replace(
  "import { useEspecieMedia } from './hooks/EspecieVegetal/useEspecieMedia';",
  "import { useEspecieMedia } from './hooks/EspecieVegetal/useEspecieMedia';\nimport { useEspecieTaxonomy } from './hooks/EspecieVegetal/useEspecieTaxonomy';"
);

// 2. Add Destructuring Hook Call
const destructuring = `
  const {
    masterEspecies, setMasterEspecies, masterAfecciones, setMasterAfecciones,
    masterFases, setMasterFases, masterFamilias, setMasterFamilias,
    masterIdiomas, setMasterIdiomas, masterPaises, setMasterPaises,
    masterAnimales, setMasterAnimales, masterPlantasPartes, setMasterPlantasPartes,
    masterLabores, setMasterLabores,
    relaciones, setRelaciones, initialRelaciones, setInitialRelaciones,
    relacionesDirty, setRelacionesDirty, relacionesSaveStatus, setRelacionesSaveStatus,
    existingVarieties, setExistingVarieties, checking, setChecking,
    checkResults, setCheckResults, showCheckModal, setShowCheckModal,
    sinonimos, setSinonimos, initialSinonimos, setInitialSinonimos,
    sinonimosDirty, setSinonimosDirty, sinonimosAiLoading, setSinonimosAiLoading,
    sinonimosAiSeconds, setSinonimosAiSeconds, sinonimosTimerRef,
    showSinonimosAiModal, setShowSinonimosAiModal, aiSinonimosProposal, setAiSinonimosProposal,
    showSinonimosConfig, setShowSinonimosConfig, sinConfigPromptOpen, setSinConfigPromptOpen,
    sinSelectedScope, setSinSelectedScope, sinExtraInstructions, setSinExtraInstructions,
    sinScopePresets,
    alimentacion, setAlimentacion, initialAlimentacion, setInitialAlimentacion,
    alimentacionDirty, setAlimentacionDirty, handleCheckSpecies
  } = useEspecieTaxonomy({ especieId, userEmail, formData });
`;

// Insert after the useEspecieMedia destructuring
code = code.replace(
  /} = useEspecieMedia\(\{ especieId, userEmail, formData \}\);\r?\n/,
  `} = useEspecieMedia({ especieId, userEmail, formData });\n${destructuring}`
);

// 3. Remove old states (using exact RegExp match for the block between useEspecieMedia and handleCheckSpecies)
code = code.replace(/const \[relaciones, setRelaciones\] = useState[\s\S]*?const \[alimentacionDirty, setAlimentacionDirty\] = useState\(false\);\r?\n/m, '');

// Also remove the old fetch master useEffect
code = code.replace(/useEffect\(\(\) => \{\r?\n\s*\/\/ Cargar catálogos maestros[\s\S]*?^\s*\}, \[userEmail\]\);\r?\n/m, '');
// Also remove the old useEffect that cleared the sinonimosTimerRef
code = code.replace(/useEffect\(\(\) => \{\r?\n\s*return \(\) => \{\r?\n\s*if \(sinonimosTimerRef\.current\) clearInterval\(sinonimosTimerRef\.current\);\r?\n\s*\};\r?\n\s*\}, \[\]\);\r?\n/m, '');

// 4. Remove the handleCheckSpecies function definition
code = code.replace(/const handleCheckSpecies = async \(\) => \{[\s\S]*?^\s*\};\r?\n/m, '');

fs.writeFileSync('src/components/admin/EspecieVegetalForm.tsx', code);
console.log("Taxonomy hooks injected.");
