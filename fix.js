const fs = require('fs');
let c = fs.readFileSync('src/components/admin/EspecieVegetalForm.tsx', 'utf-8');
const searchStr = `            resumen: (() => { try { return JSON.parse(p.resumen || '{}'); } catch { return {}; } })()
          }))}`;
c = c.replace(searchStr, "          photos={photos}");
fs.writeFileSync('src/components/admin/EspecieVegetalForm.tsx', c);
