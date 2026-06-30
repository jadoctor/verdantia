const fs = require('fs');
let code = fs.readFileSync('src/components/admin/EspecieVegetalForm.tsx', 'utf8');

// Fix the title tag and remove the dangling tag
code = code.replace(
  /title=\{<>[^\{]+\{formData\.especiesvegetalesnombre \|\| 'Nueva Especie'[\r\n\s]*<\/>\}/,
  "title={<>?? {formData.especiesvegetalesnombre || 'Nueva Especie'}</>}"
);

fs.writeFileSync('src/components/admin/EspecieVegetalForm.tsx', code, 'utf8');
console.log('Fixed title tag.');
