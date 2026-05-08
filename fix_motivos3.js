const fs = require('fs');
const file = 'src/components/admin/EspecieForm.tsx';
let content = fs.readFileSync(file, 'utf8');

// Fix beneficiosas motivo (line ~497)
content = content.replace(
  "asociacionesbeneficiosasmotivo: 'Sugerido por IA'",
  "asociacionesbeneficiosasmotivo: motivo"
);

// Fix perNames: change 'for (const name of perNames)' to item pattern
content = content.replace(
  /for \(const name of perNames\) \{\s*if \(!name \|\| typeof name !== "string"\) continue;/,
  `for (const item of perNames) {\n        const name = typeof item === 'string' ? item : item?.nombre;\n        const motivo = typeof item === 'string' ? 'Sugerido por IA' : (item?.motivo || 'Sugerido por IA');\n        if (!name || typeof name !== 'string') continue;`
);

// Fix perjudiciales motivo
content = content.replace(
  "asociacionesperjudicialesmotivo: 'Sugerido por IA'",
  "asociacionesperjudicialesmotivo: motivo"
);

// Fix plaNames: change 'for (const name of plaNames)' to item pattern
content = content.replace(
  /for \(const name of plaNames\) \{\s*if \(!name \|\| typeof name !== "string"\) continue;/,
  `for (const item of plaNames) {\n        const name = typeof item === 'string' ? item : item?.nombre;\n        const notas = typeof item === 'string' ? 'Sugerido por IA' : (item?.notas || 'Sugerido por IA');\n        if (!name || typeof name !== 'string') continue;`
);

fs.writeFileSync(file, content);
console.log('All 3 loops now use item pattern with motivo/notas.');
