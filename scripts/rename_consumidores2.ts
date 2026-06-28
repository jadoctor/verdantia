import fs from 'fs';
import path from 'path';

const filesToProcess = [
  'src/app/api/ai/identificar-imagen/route.ts',
  'src/app/api/ai/especie-assistant/route.ts',
  'src/app/api/admin/animales/[id]/alimentacion/route.ts',
  'src/app/api/admin/animales/[id]/photos/route.ts',
  'src/app/dashboard/layout.tsx'
];

const basePath = 'c:/Users/jaill/Documents/VERDANTIA';

function replaceInFile(filePath: string) {
  const fullPath = path.join(basePath, filePath);
  if (!fs.existsSync(fullPath)) {
    console.log(`No se encontro: ${fullPath}`);
    return;
  }
  let content = fs.readFileSync(fullPath, 'utf8');

  // Replace Exact matches first
  content = content.replace(/consumidoresnombre/g, 'animalesnombre');
  content = content.replace(/consumidoresicono/g, 'animalesicono');
  content = content.replace(/consumidoresdescripcion/g, 'animalesdescripcion');
  content = content.replace(/consumidoresactivo/g, 'animalesactivo');
  
  content = content.replace(/idconsumidores/g, 'idanimales');
  content = content.replace(/idconsumidor/g, 'idanimal');

  content = content.replace(/especiesconsumidoresesapto/g, 'especiesanimalesesapto');
  content = content.replace(/especiesconsumidorespartes/g, 'especiesanimalespartes');
  content = content.replace(/especiesconsumidoresnotas/g, 'especiesanimalesnotas');
  content = content.replace(/especiesconsumidoresemoji/g, 'especiesanimalesemoji');
  
  content = content.replace(/xespeciesconsumidoresidespecies/g, 'xespeciesanimalesidespecies');
  content = content.replace(/xespeciesconsumidoresidconsumidores/g, 'xespeciesanimalesidanimales');
  content = content.replace(/xespeciesconsumidoresidplantasparte/g, 'xespeciesanimalesidplantasparte');
  content = content.replace(/idespeciesconsumidores/g, 'idespeciesanimales');
  content = content.replace(/especiesconsumidores/g, 'especiesanimales');

  content = content.replace(/xdatosadjuntosidconsumidores/g, 'xdatosadjuntosidanimales');

  // Text content replacements
  content = content.replace(/Consumidores/g, 'Animales');
  content = content.replace(/Consumidor/g, 'Animal');
  content = content.replace(/consumidores/g, 'animales');
  content = content.replace(/consumidor/g, 'animal');

  // Specific UI string overrides
  content = content.replace(/Especies de Granja/g, 'Animales de granja');
  content = content.replace(/Especie de Granja/g, 'Animal de granja');
  content = content.replace(/Nueva Animal de granja/g, 'Nuevo Animal de granja');

  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`✅ Procesado: ${filePath}`);
}

filesToProcess.forEach(replaceInFile);
