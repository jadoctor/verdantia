const fs = require('fs');
let code = fs.readFileSync('src/components/admin/EspecieVegetalForm.tsx', 'utf8');
code = code.replace("</>}\n        gradient", "gradient");
fs.writeFileSync('src/components/admin/EspecieVegetalForm.tsx', code, 'utf8');
console.log('Fixed syntax error.');
