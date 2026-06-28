const fs = require('fs');
const content = fs.readFileSync('c:/Users/jaill/Documents/VERDANTIA/src/app/dashboard/admin/mantenimiento/analisis/page.tsx', 'utf8');
const importRegex = /import\s+(?:{[^}]+}|\w+)\s+from\s+['"](\.\/[^'"]+)['"]/g;
let match;
let i = 0;
while ((match = importRegex.exec(content)) !== null) {
  console.log(match[1]);
  i++;
  if(i > 10) break;
}
console.log('Done');
