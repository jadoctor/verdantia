import fs from 'fs';
import path from 'path';

const srcDir = path.join(__dirname, '../src');

function getAllFiles(dirPath: string, arrayOfFiles: string[] = []) {
  if (!fs.existsSync(dirPath)) return arrayOfFiles;
  const files = fs.readdirSync(dirPath);

  files.forEach(function (file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.css') || file.endsWith('.json')) {
        arrayOfFiles.push(path.join(dirPath, "/", file));
      }
    }
  });

  return arrayOfFiles;
}

function processFiles() {
  const files = getAllFiles(srcDir);
  let changedFiles = 0;

  for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    const originalContent = content;

    // 1. Rename DB columns and SQL parameters
    content = content.replace(/idespecies/g, 'idespeciesvegetales');
    content = content.replace(/especiesnombre/g, 'especiesvegetalesnombre');
    content = content.replace(/especiesdescripcion/g, 'especiesvegetalesdescripcion');
    content = content.replace(/especiesicono/g, 'especiesvegetalesicono');
    content = content.replace(/especiesvisibilidadsino/g, 'especiesvegetalesvisibilidadsino');
    content = content.replace(/especiesespremium/g, 'especiesvegetalesespremium');
    content = content.replace(/especiesperenne/g, 'especiesvegetalesperenne');
    
    // Fix over-replacements
    content = content.replace(/idespeciesvegetalesanimales/g, 'idespeciesanimales'); // Fix animal ID
    content = content.replace(/idespeciesvegetalesvegetales/g, 'idespeciesvegetales'); 

    // Variedades
    content = content.replace(/idvariedades/g, 'idvariedadesvegetales');
    content = content.replace(/variedadesnombre/g, 'variedadesvegetalesnombre');
    content = content.replace(/variedadesesgenerica/g, 'variedadesvegetalesesgenerica');
    content = content.replace(/xvariedadesidespeciesvegetales/g, 'xvariedadesvegetalesidespeciesvegetales');
    content = content.replace(/xvariedadesid/g, 'xvariedadesvegetalesid');
    content = content.replace(/variedadesusuarios/g, 'variedadesvegetalesusuarios');

    // Animales
    content = content.replace(/animalesnombre/g, 'especiesanimalesnombre');
    content = content.replace(/animalesdescripcion/g, 'especiesanimalesdescripcion');
    content = content.replace(/animalesicono/g, 'especiesanimalesicono');
    content = content.replace(/animalesactivo/g, 'especiesanimalesactivo');
    content = content.replace(/idanimales/g, 'idespeciesanimales');
    content = content.replace(/idanimal/g, 'idespeciesanimales'); // Sometimes singular was used

    // Replace the exact API strings and URL paths
    content = content.replace(/\/api\/admin\/especies/g, '/api/admin/especiesvegetales');
    content = content.replace(/\/dashboard\/admin\/especies/g, '/dashboard/admin/especiesvegetales');
    
    content = content.replace(/\/api\/admin\/variedades/g, '/api/admin/variedadesvegetales');
    content = content.replace(/\/dashboard\/admin\/variedades/g, '/dashboard/admin/variedadesvegetales');

    content = content.replace(/\/api\/admin\/animales/g, '/api/admin/especiesanimales');
    content = content.replace(/\/dashboard\/admin\/animales/g, '/dashboard/admin/especiesanimales');

    // Rename generic "especies" usage in DB tables specifically for queries
    content = content.replace(/FROM especies /g, 'FROM especiesvegetales ');
    content = content.replace(/UPDATE especies /g, 'UPDATE especiesvegetales ');
    content = content.replace(/INTO especies /g, 'INTO especiesvegetales ');
    content = content.replace(/JOIN especies /g, 'JOIN especiesvegetales ');
    content = content.replace(/FROM variedades /g, 'FROM variedadesvegetales ');
    content = content.replace(/UPDATE variedades /g, 'UPDATE variedadesvegetales ');
    content = content.replace(/INTO variedades /g, 'INTO variedadesvegetales ');
    content = content.replace(/JOIN variedades /g, 'JOIN variedadesvegetales ');

    content = content.replace(/FROM animales /g, 'FROM especiesanimales ');
    content = content.replace(/UPDATE animales /g, 'UPDATE especiesanimales ');
    content = content.replace(/INTO animales /g, 'INTO especiesanimales ');
    
    // For specific cross-tables
    content = content.replace(/plantasespeciesanimales/g, 'vegetalesanimales');
    content = content.replace(/especiesconsumidoresnotas/g, 'vegetalesanimalesnotas');
    
    // React Components / states (Careful not to break logic, just literal strings and obvious states)
    content = content.replace(/setEspecieId/g, 'setEspecieVegetalId');
    content = content.replace(/setEspecieNombre/g, 'setEspecieVegetalNombre');

    if (content !== originalContent) {
      fs.writeFileSync(file, content, 'utf8');
      changedFiles++;
    }
  }

  console.log(`Reemplazos completados en ${changedFiles} archivos.`);
}

processFiles();
