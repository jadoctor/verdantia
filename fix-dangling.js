const fs = require('fs');
let code = fs.readFileSync('src/components/admin/EspecieVegetalForm.tsx', 'utf8');

// Fix the dangling tag that was left by the subtitle strip
code = code.replace(/}<\/>}/g, '');

fs.writeFileSync('src/components/admin/EspecieVegetalForm.tsx', code, 'utf8');
console.log('Fixed dangling tag.');
