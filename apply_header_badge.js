const fs = require('fs');

const path = 'src/app/dashboard/page.tsx';
let content = fs.readFileSync(path, 'utf8');
let changes = 0;

// 1. Replace "Rango Actual" span with RangoBadge
const actualOld = /<span style=\{\{ fontSize: '2\.2rem', filter: 'drop-shadow\(0 2px 8px rgba\(234,179,8,0\.25\)\)' \}\}>\{actualLogroIcono\}<\/span>/;
const actualNew = `<RangoBadge icono={actualLogroIcono} nivel={actualLogro?.logrosnivel || 1} size={42} style={{ background: 'linear-gradient(135deg, #fef3c7, #fde68a)', border: '2px solid #f59e0b' }} />`;

if (actualOld.test(content)) {
  content = content.replace(actualOld, actualNew);
  changes++;
  console.log('✅ Rango Actual → RangoBadge');
} else {
  console.log('❌ No encontré Rango Actual span');
}

// 2. Replace "Siguiente Rango" span with RangoBadge
const sigOld = /<span style=\{\{ fontSize: '2\.2rem', filter: 'drop-shadow\(0 2px 8px rgba\(139,92,246,0\.3\)\)' \}\}>\{siguiente\.logrosicono \|\| '🏆'\}<\/span>/;
const sigNew = `<RangoBadge icono={siguiente.logrosicono || '🏆'} nivel={siguiente.logrosnivel} size={42} style={{ background: 'linear-gradient(135deg, #e9d5ff, #d8b4fe)', border: '2px solid #a855f7' }} />`;

if (sigOld.test(content)) {
  content = content.replace(sigOld, sigNew);
  changes++;
  console.log('✅ Siguiente Rango → RangoBadge');
} else {
  console.log('❌ No encontré Siguiente Rango span');
}

if (changes > 0) {
  fs.writeFileSync(path, content);
  console.log(`✅ Encabezado actualizado (${changes} cambios)`);
} else {
  console.log('⚠️ Sin cambios');
}
