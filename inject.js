const fs = require('fs');
let content = fs.readFileSync('src/components/admin/EspecieVegetalForm.tsx', 'utf8');
let toInject = fs.readFileSync('to-inject.tsx', 'utf8');

content = content.replace(
  '} = useEspecieTaxonomy({ especieId, userEmail, formData });',
  `} = useEspecieTaxonomy({ especieId, userEmail, formData });\n\n${toInject}`
);

fs.writeFileSync('src/components/admin/EspecieVegetalForm.tsx', content);
console.log("Injected deleted states");
