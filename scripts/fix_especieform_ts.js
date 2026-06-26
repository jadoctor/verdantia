const fs = require('fs');

const linesToFix = [
  // 119: An object literal cannot have multiple properties with the same name.
  // 590: Property 'afecciones' is missing...
];

let content = fs.readFileSync('src/components/admin/EspecieForm.tsx', 'utf8');
const lines = content.split('\n');

// Line 588: plagas: data.afecciones || [] -> afecciones: data.afecciones || []
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('plagas: data.afecciones || []')) {
    lines[i] = lines[i].replace('plagas: data.afecciones || []', 'afecciones: data.afecciones || []');
  }
}

// 119-120: An object literal cannot have multiple properties with the same name.
// Probably: plagas: true, afecciones: true ?
for (let i = 110; i < 130; i++) {
  if (lines[i] && lines[i].includes('plagas: true')) {
    lines[i] = lines[i].replace('plagas: true', '// deleted duplicate plagas');
  }
}

// The rest are `Cannot find name 'p'` which are places where I changed the callback argument from `p` to `af` but not the body.
// Or places where I changed the body `p.something` to `af.something` but didn't change the argument `(p) =>`.
// It's probably easier to change `(p)` to `(af)` globally where context implies afecciones.
content = lines.join('\n');

content = content.replace(/\(p\)/g, '(af)');
content = content.replace(/\(p =\>/g, '(af =>');
content = content.replace(/p\?/g, 'af?');
content = content.replace(/p\./g, 'af.');

// But wait! If I replace `p.` with `af.` globally, what about other variables named `p`? 
// E.g. perjudiciales.map(p => ...)
// That's why I only did it for specific properties before.
// I can restore the file from Git to a clean state, and write a safer script!
