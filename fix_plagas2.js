const fs = require('fs');
const file = 'src/components/admin/EspecieForm.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /xrelacionesplagasideplaga: p\.idplagas,\s*plagasnombre: p\.plagasnombre,\s*relacionesplagasriesgo: 'media',\s*relacionesplagasnotas: notas/,
  `xrelacionesplagasideplaga: p.idplagas,
            xespeciesplagasidplagas: p.idplagas,
            plagasnombre: p.plagasnombre,
            especiesplagasnivelriesgo: riesgo,
            especiesplagasnotasespecificas: notas`
);

fs.writeFileSync(file, content);
console.log('Plaga push fields fixed.');
