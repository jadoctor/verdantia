const fs = require('fs');
const file = 'src/components/admin/EspecieForm.tsx';
let content = fs.readFileSync(file, 'utf8');

// Fix 1: benNames push - use motivo variable instead of hardcoded string
content = content.replace(
  "            asociacionesbeneficiosasmotivo: 'Sugerido por IA'\r\n           });\r\n           madeChanges = true;\r\n         }\r\n       }\r\n\r\n       for (const name of perNames) {\r\n        if (!name || typeof name !== \"string\") continue;",
  "            asociacionesbeneficiosasmotivo: motivo\r\n           });\r\n           madeChanges = true;\r\n         }\r\n       }\r\n\r\n       for (const item of perNames) {\r\n        const name = typeof item === 'string' ? item : item?.nombre;\r\n        const motivo = typeof item === 'string' ? 'Sugerido por IA' : (item?.motivo || 'Sugerido por IA');\r\n        if (!name || typeof name !== 'string') continue;"
);

// Fix 2: perNames push - use motivo 
content = content.replace(
  "            asociacionesperjudicialesmotivo: 'Sugerido por IA'\r\n           });\r\n           madeChanges = true;\r\n         }\r\n       }\r\n\r\n       for (const name of plaNames) {\r\n        if (!name || typeof name !== \"string\") continue;",
  "            asociacionesperjudicialesmotivo: motivo\r\n           });\r\n           madeChanges = true;\r\n         }\r\n       }\r\n\r\n       for (const item of plaNames) {\r\n        const name = typeof item === 'string' ? item : item?.nombre;\r\n        const notas = typeof item === 'string' ? 'Sugerido por IA' : (item?.notas || 'Sugerido por IA');\r\n        if (!name || typeof name !== 'string') continue;"
);

// Fix 3: plaNames push - use notas
content = content.replace(
  "            relacionesplagasnotas: notas",
  "            relacionesplagasnotas: notas"
);
// Check if the old hardcoded string is still there for plagas
if (content.includes("relacionesplagasnotas: 'Sugerido por IA'")) {
  content = content.replace(
    "relacionesplagasnotas: 'Sugerido por IA'",
    "relacionesplagasnotas: notas"
  );
}

fs.writeFileSync(file, content);
console.log('Final motivo/notas fix applied.');
