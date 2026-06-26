const fs = require('fs');
const file = 'src/components/admin/EspecieForm.tsx';
let content = fs.readFileSync(file, 'utf8');

// The `plagas: ` in the object literal
content = content.replace(/plagas:\s*data\.afecciones/g, 'afecciones: data.afecciones');
content = content.replace(/plagas:\s*newPla/g, 'afecciones: newAfe');
content = content.replace(/plagas:\s*newAfe/g, 'afecciones: newAfe');
content = content.replace(/plagas:\s*\[\.\.\.relaciones\.afecciones/g, 'afecciones: [...relaciones.afecciones');

fs.writeFileSync(file, content, 'utf8');

// Also we need to delete the old plagas folders
const fsExtra = require('fs');
if (fsExtra.existsSync('src/app/dashboard/admin/plagas')) {
    fsExtra.rmSync('src/app/dashboard/admin/plagas', { recursive: true, force: true });
}
if (fsExtra.existsSync('src/app/api/admin/plagas')) {
    fsExtra.rmSync('src/app/api/admin/plagas', { recursive: true, force: true });
}

// Clean .next cache to remove typescript validator errors for deleted routes
if (fsExtra.existsSync('.next')) {
    fsExtra.rmSync('.next', { recursive: true, force: true });
}

console.log('Final fixes applied');
