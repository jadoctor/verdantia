const fs = require('fs');
const file = 'src/components/admin/EspecieForm.tsx';
let content = fs.readFileSync(file, 'utf8');

// Fix: change the field names in plaga push to match the UI rendering
// The UI reads: especiesplagasnivelriesgo, especiesplagasnotasespecificas
// The assimilation was using: relacionesplagasriesgo, relacionesplagasnotas
content = content.replace(
  `            xrelacionesplagasideplaga: p.idplagas,
            plagasnombre: p.plagasnombre,
            relacionesplagasriesgo: 'media',
            relacionesplagasnotas: notas`,
  `            xrelacionesplagasideplaga: p.idplagas,
            xespeciesplagasidplagas: p.idplagas,
            plagasnombre: p.plagasnombre,
            especiesplagasnivelriesgo: riesgo,
            especiesplagasnotasespecificas: notas`
);

// Also extract riesgo from the AI item in the plaNames loop
content = content.replace(
  "const notas = typeof item === 'string' ? 'Sugerido por IA' : (item?.notas || 'Sugerido por IA');",
  "const notas = typeof item === 'string' ? 'Sugerido por IA' : (item?.notas || 'Sugerido por IA');\n        const riesgo = typeof item === 'string' ? 'media' : (item?.riesgo || 'media');"
);

fs.writeFileSync(file, content);
console.log('Plaga field names fixed to match UI.');
