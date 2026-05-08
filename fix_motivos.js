const fs = require('fs');
const file = 'src/components/admin/EspecieForm.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Update the selectedRels extraction to handle both old format (string) and new format ({nombre, motivo})
// In the assimilateRelacionesAI function, update the benNames loop to extract motivo
content = content.replace(
  `for (const name of benNames) {\r\n        if (!name || typeof name !== "string") continue;\r\n        let sp = masterE.find(e => normalize(e.especiesnombre) === normalize(name));`,
  `for (const item of benNames) {\r\n        const name = typeof item === 'string' ? item : item?.nombre;\r\n        const motivo = typeof item === 'string' ? 'Sugerido por IA' : (item?.motivo || 'Sugerido por IA');\r\n        if (!name || typeof name !== 'string') continue;\r\n        let sp = masterE.find(e => normalize(e.especiesnombre) === normalize(name));`
);

// Update the benNames push to use motivo
content = content.replace(
  `asociacionesbeneficiosasmotivo: 'Sugerido por IA'\r\n           });\r\n           madeChanges = true;\r\n         }\r\n       }\r\n\r\n       for (const name of perNames) {`,
  `asociacionesbeneficiosasmotivo: motivo\r\n           });\r\n           madeChanges = true;\r\n         }\r\n       }\r\n\r\n       for (const item of perNames) {`
);

// Update perNames loop
content = content.replace(
  `for (const item of perNames) {\r\n        if (!name || typeof name !== "string") continue;\r\n        let sp = masterE.find(e => normalize(e.especiesnombre) === normalize(name));`,
  `for (const item of perNames) {\r\n        const name = typeof item === 'string' ? item : item?.nombre;\r\n        const motivo = typeof item === 'string' ? 'Sugerido por IA' : (item?.motivo || 'Sugerido por IA');\r\n        if (!name || typeof name !== 'string') continue;\r\n        let sp = masterE.find(e => normalize(e.especiesnombre) === normalize(name));`
);

// Update the perNames push to use motivo
content = content.replace(
  `asociacionesperjudicialesmotivo: 'Sugerido por IA'\r\n           });\r\n           madeChanges = true;\r\n         }\r\n       }\r\n\r\n       for (const name of plaNames) {`,
  `asociacionesperjudicialesmotivo: motivo\r\n           });\r\n           madeChanges = true;\r\n         }\r\n       }\r\n\r\n       for (const item of plaNames) {`
);

// Update plaNames loop
content = content.replace(
  `for (const item of plaNames) {\r\n        if (!name || typeof name !== "string") continue;\r\n        let p = masterP.find(pl => normalize(pl.plagasnombre) === normalize(name));`,
  `for (const item of plaNames) {\r\n        const name = typeof item === 'string' ? item : item?.nombre;\r\n        const notas = typeof item === 'string' ? 'Sugerido por IA' : (item?.notas || 'Sugerido por IA');\r\n        if (!name || typeof name !== 'string') continue;\r\n        let p = masterP.find(pl => normalize(pl.plagasnombre) === normalize(name));`
);

// Update plagas push to use notas
content = content.replace(
  `relacionesplagasnotas: 'Sugerido por IA'`,
  `relacionesplagasnotas: notas`
);

// Now update the selectedRels initialization to handle objects
// The modal checkboxes populate selectedRels with names from aiProposal
// We need to store the full objects instead of just names
// Find where selectedRels is populated from aiProposal and update

fs.writeFileSync(file, content);
console.log('Assimilation code updated for motivo/notas.');
