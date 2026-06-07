const fs = require('fs');

const path = 'src/app/dashboard/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add RangoBadge import
if (!content.includes("import RangoBadge from '@/components/ui/RangoBadge'")) {
  content = content.replace(
    /import \{ Trash2 \} from 'lucide-react';/,
    "import { Trash2 } from 'lucide-react';\nimport RangoBadge from '@/components/ui/RangoBadge';"
  );
  console.log('✅ Import añadido');
}

// 2. Replace ACQUIRED logro div with RangoBadge using regex
const adqRegex = /<div style=\{\{\s*width: '56px', height: '56px', borderRadius: '50%',\s*background: logro\.fecha_fin \? 'linear-gradient\(135deg, #d1fae5, #a7f3d0\)' : 'linear-gradient\(135deg, #fef3c7, #fde68a\)',\s*display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1\.6rem',\s*border: logro\.fecha_fin \? '3px solid #10b981' : '3px solid #f59e0b',\s*boxShadow: logro\.fecha_fin \? '0 4px 6px rgba\(16,185,129,0\.2\)' : '0 4px 6px rgba\(245,158,11,0\.2\)'\s*\}\}>\s*\{logro\.logrosicono \|\| '\?'\}\s*<\/div>/;

if (adqRegex.test(content)) {
  content = content.replace(adqRegex, `<RangoBadge
                    icono={logro.logrosicono || '👶'}
                    nivel={logro.logrosnivel}
                    size={56}
                    style={{
                      background: logro.fecha_fin ? 'linear-gradient(135deg, #d1fae5, #a7f3d0)' : 'linear-gradient(135deg, #fef3c7, #fde68a)',
                      border: logro.fecha_fin ? '3px solid #10b981' : '3px solid #f59e0b',
                      boxShadow: logro.fecha_fin ? '0 4px 6px rgba(16,185,129,0.2)' : '0 4px 6px rgba(245,158,11,0.2)'
                    }}
                  />`);
  console.log('✅ Logros ADQUIRIDOS reemplazados');
} else {
  console.log('❌ No encontré logros adquiridos');
}

// 3. Replace PENDING logro div with RangoBadge using regex
const pendRegex = /<div style=\{\{ width: '56px', height: '56px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1\.6rem', border: '3px solid #cbd5e1' \}\}>\s*\{logro\.logrosicono \|\| '\?'\}\s*<\/div>/;

if (pendRegex.test(content)) {
  content = content.replace(pendRegex, `<RangoBadge
                    icono={logro.logrosicono || '👶'}
                    nivel={logro.logrosnivel}
                    size={56}
                    style={{ background: '#f1f5f9', border: '3px solid #cbd5e1' }}
                  />`);
  console.log('✅ Logros PENDIENTES reemplazados');
} else {
  console.log('❌ No encontré logros pendientes');
}

fs.writeFileSync(path, content);
console.log('✅ Terminado');
