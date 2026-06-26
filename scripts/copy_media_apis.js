const fs = require('fs');
const path = require('path');

function processFile(srcPath, destPath) {
  let content = fs.readFileSync(srcPath, 'utf8');
  
  // Replacements
  content = content.replace(/idafecciones/g, 'idtratamientos');
  content = content.replace(/afeccionesnombre/g, 'tratamientosnombre');
  content = content.replace(/afecciones/g, 'tratamientos');
  content = content.replace(/Afeccion/g, 'Tratamiento');
  content = content.replace(/xdatosadjuntosidtratamientos/g, 'xdatosadjuntosidtratamientos'); // redundant but safe
  
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.writeFileSync(destPath, content, 'utf8');
  console.log(`Copied and transformed: ${destPath}`);
}

const baseDir = path.join(__dirname, '../src/app/api/admin');
const srcPhotos = path.join(baseDir, 'afecciones/[id]/photos/route.ts');
const srcPdfs = path.join(baseDir, 'afecciones/[id]/pdfs/route.ts');

const destPhotos = path.join(baseDir, 'tratamientos/[id]/photos/route.ts');
const destPdfs = path.join(baseDir, 'tratamientos/[id]/pdfs/route.ts');

processFile(srcPhotos, destPhotos);
processFile(srcPdfs, destPdfs);
