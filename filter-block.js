const fs = require('fs');

const extractedVars = new Set([
  'masterEspecies', 'masterAfecciones', 'masterFases', 'masterFamilias',
  'masterIdiomas', 'masterPaises', 'masterAnimales', 'masterPlantasPartes',
  'masterLabores', 'relaciones', 'initialRelaciones', 'relacionesDirty',
  'relacionesSaveStatus', 'existingVarieties', 'checking', 'checkResults',
  'showCheckModal', 'sinonimos', 'initialSinonimos', 'sinonimosDirty',
  'sinonimosAiLoading', 'sinonimosAiSeconds', 'showSinonimosAiModal',
  'aiSinonimosProposal', 'showSinonimosConfig', 'sinConfigPromptOpen',
  'sinSelectedScope', 'sinExtraInstructions', 'sinScopePresets',
  'alimentacion', 'initialAlimentacion', 'alimentacionDirty'
]);

let deletedBlock = fs.readFileSync('deleted-block.tsx', 'utf8');

// Filter out the states we extracted. We will keep everything else.
// But wait, the deleted block also contains random comments and `useEffect`.
// Let's just remove the lines that declare the extracted variables.

const lines = deletedBlock.split('\n');
let filteredLines = [];

for (let line of lines) {
  let keep = true;
  for (let ev of extractedVars) {
    if (line.includes(`const [${ev}, set`)) {
      keep = false;
      break;
    }
  }
  // also remove sinonimosTimerRef
  if (line.includes('const sinonimosTimerRef = useRef')) {
    keep = false;
  }
  if (keep) {
    filteredLines.push(line);
  }
}

let toInject = filteredLines.join('\n');
fs.writeFileSync('to-inject.tsx', toInject);
console.log("Filtered block created.");
