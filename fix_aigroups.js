const fs = require('fs');
const file = 'src/components/admin/EspecieForm.tsx';
let content = fs.readFileSync(file, 'utf8');

// Update AI groups keys and labels
content = content.replace(
  "keys: ['especiesmarcoplantas', 'especiesmarcofilas', 'especiesautosuficiencia', 'especiesautosuficienciaconserva'],",
  "keys: ['especiesmarcoplantas', 'especiesmarcofilas', 'especiesautosuficienciaparcial', 'especiesautosuficiencia', 'especiesautosuficienciaconserva'],"
);

content = content.replace(
  "especiesautosuficiencia: 'Autosuf. Fresco',",
  "especiesautosuficienciaparcial: 'Autosuf. Parcial',\n        especiesautosuficiencia: 'Autosuf. Completa',"
);

fs.writeFileSync(file, content);
console.log('AI groups updated.');
