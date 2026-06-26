const fs = require('fs');
const file = 'src/components/admin/EspecieForm.tsx';
let content = fs.readFileSync(file, 'utf8');

// Line 576-577 (around there)
content = content.replace(
  'beneficiosas: data.beneficiosas || [],\n        perjudiciales: data.perjudiciales || [],\n        plagas: data.afecciones || []',
  'beneficiosas: data.beneficiosas || [],\n        perjudiciales: data.perjudiciales || [],\n        afecciones: data.afecciones || []'
);

// 1475 and 4023
content = content.replace(/plagas: newAfe/g, 'afecciones: newAfe');
content = content.replace(/plagas: \[\.\.\.relaciones\.afecciones, \{/g, 'afecciones: [...relaciones.afecciones, {');

// Double check the exact strings for setRelaciones
content = content.replace(/setRelaciones\(\{ beneficiosas: newBen, perjudiciales: newPer, plagas: newAfe \}\);/g, 'setRelaciones({ beneficiosas: newBen, perjudiciales: newPer, afecciones: newAfe });');
content = content.replace(/setRelaciones\(\{ beneficiosas: newBen, perjudiciales: newPer, plagas:/g, 'setRelaciones({ beneficiosas: newBen, perjudiciales: newPer, afecciones:');
content = content.replace(/setRelaciones\(\{\n\s+beneficiosas: newBen,\n\s+perjudiciales: newPer,\n\s+plagas:/g, 'setRelaciones({\n                        beneficiosas: newBen,\n                        perjudiciales: newPer,\n                        afecciones:');

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed TS errors');
