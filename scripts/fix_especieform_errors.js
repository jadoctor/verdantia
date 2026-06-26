const fs = require('fs');
const file = 'src/components/admin/EspecieForm.tsx';
let content = fs.readFileSync(file, 'utf8');

// Fix `p.` to `af.` where context implies it's an afeccion
content = content.replace(/p\.idafecciones/g, 'af.idafecciones');
content = content.replace(/p\.afeccionesnombre/g, 'af.afeccionesnombre');
content = content.replace(/p\.afeccionescategoria/g, 'af.afeccionescategoria');
content = content.replace(/p\.xespeciesafeccionesidafecciones/g, 'af.xespeciesafeccionesidafecciones');
content = content.replace(/p\.especiesafeccionesnivelriesgo/g, 'af.especiesafeccionesnivelriesgo');
content = content.replace(/p\.especiesafeccionesnotasespecificas/g, 'af.especiesafeccionesnotasespecificas');

// Fix mapped arrays where `p` is missing
content = content.replace(/masterAfecciones\.map\(\(p\) =>/g, 'masterAfecciones.map((af) =>');
content = content.replace(/relaciones\.afecciones\.some\(\(p\)/g, 'relaciones.afecciones.some((af)');
content = content.replace(/relaciones\.afecciones\.some\(\(p =>/g, 'relaciones.afecciones.some((af =>');
content = content.replace(/relaciones\.afecciones\.some\(p =>/g, 'relaciones.afecciones.some(af =>');
content = content.replace(/masterAfecciones\.find\(p =>/g, 'masterAfecciones.find(af =>');
content = content.replace(/masterA\?.find\(p =>/g, 'masterA?.find(af =>');
content = content.replace(/relaciones\.afecciones\.map\(\(p,/g, 'relaciones.afecciones.map((af,');
content = content.replace(/relaciones\.afecciones\.map\(p =>/g, 'relaciones.afecciones.map(af =>');

// Replace {p. -> {af.
content = content.replace(/\{p\./g, '{af.');
content = content.replace(/\(p\)/g, '(af)');

// Re-fix the initial setRelaciones state if it was broken
content = content.replace(/plagas: any/g, 'afecciones: any');
content = content.replace(/plagas: \[\]/g, 'afecciones: []');

// Missing 'afe' in `{ ben: any[]; per: any[]; pla: any[]; }`
content = content.replace(/\{ ben: any\[\]; per: any\[\]; pla: any\[\]; \}/g, '{ ben: any[]; per: any[]; afe: any[]; }');

// Any isolated 'p.' that was left as 'p.' inside map of afecciones
content = content.replace(/p\?/g, 'af?');

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed EspecieForm.tsx!');
