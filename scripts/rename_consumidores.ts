import fs from 'fs';
import path from 'path';

const filesToProcess = [
  'src/app/dashboard/admin/animales/[id]/page.tsx',
  'src/components/admin/SuperadminSidebar.tsx',
  'src/components/admin/EspecieForm.tsx'
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

  // React component and hooks specific
  content = content.replace(/ConsumidorForm/g, 'AnimalForm');
  content = content.replace(/ConsumidoresDashboard/g, 'AnimalesDashboard');
  content = content.replace(/ConsumidorEditPage/g, 'AnimalEditPage');
  
  content = content.replace(/fetchConsumidor/g, 'fetchAnimal');
  content = content.replace(/masterConsumidores/g, 'masterAnimales');
  content = content.replace(/setMasterConsumidores/g, 'setMasterAnimales');
  content = content.replace(/consumidoresSortKey/g, 'animalesSortKey');
  content = content.replace(/consumidoresSortOrder/g, 'animalesSortOrder');
  content = content.replace(/consumidoresFilterActive/g, 'animalesFilterActive');
  
  // URL replacements
  content = content.replace(/\/api\/admin\/consumidores/g, '/api/admin/animales');
  content = content.replace(/\/dashboard\/admin\/consumidores/g, '/dashboard/admin/animales');
  
  // Text content replacements
  content = content.replace(/Consumidores/g, 'Animales');
  content = content.replace(/Consumidor/g, 'Animal');
  content = content.replace(/consumidores/g, 'animales');
  content = content.replace(/consumidor/g, 'animal');
  content = content.replace(/Consumos/g, 'Alimentacion');
  content = content.replace(/consumos/g, 'alimentacion');

  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`✅ Procesado: ${filePath}`);
}

filesToProcess.forEach(replaceInFile);
