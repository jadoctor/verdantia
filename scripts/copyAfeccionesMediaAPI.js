const fs = require('fs');
const path = require('path');

function duplicateAndReplace(srcPath, destPath, replacements) {
    if (!fs.existsSync(srcPath)) return;
    let content = fs.readFileSync(srcPath, 'utf8');
    for (const [key, value] of Object.entries(replacements)) {
        content = content.split(key).join(value);
    }
    const destDir = path.dirname(destPath);
    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
    fs.writeFileSync(destPath, content, 'utf8');
}

const replacements = {
    'xdatosadjuntosidvariedades': 'xdatosadjuntosidafecciones',
    'idvariedades': 'idafecciones',
    'variedades': 'afecciones',
    'variedadesnombre': 'afeccionesnombre',
    'Variedades': 'Afecciones',
    'Variedad': 'Afeccion'
};

duplicateAndReplace(
    'src/app/api/admin/variedades/[id]/photos/route.ts',
    'src/app/api/admin/afecciones/[id]/photos/route.ts',
    replacements
);

duplicateAndReplace(
    'src/app/api/admin/variedades/[id]/pdfs/route.ts',
    'src/app/api/admin/afecciones/[id]/pdfs/route.ts',
    replacements
);

duplicateAndReplace(
    'src/app/api/admin/variedades/[id]/pdfs/link/route.ts',
    'src/app/api/admin/afecciones/[id]/pdfs/link/route.ts',
    replacements
);

console.log("Media API routes for afecciones created.");
