import fs from 'fs';
import path from 'path';

const filesToUpdate = [
  'src/app/dashboard/layout.tsx',
  'src/app/dashboard/admin/mantenimiento/analisis/services/analisisApi.ts',
  'src/app/dashboard/admin/especiesvegetales/components/EspeciesHeader.tsx',
  'src/app/dashboard/admin/especiesanimales/page.tsx', // The main list page
  'src/app/dashboard/admin/especiesanimales/[id]/page.tsx'
];

for (const relPath of filesToUpdate) {
  const filePath = path.join(__dirname, '..', relPath);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(/Especies globales/g, 'Especies vegetales');
    content = content.replace(/Especies Globales/g, 'Especies Vegetales');
    
    // Animales
    content = content.replace(/Animales de granja/g, 'Especies animales');
    content = content.replace(/Animal de granja/g, 'Especie animal');
    content = content.replace(/Animales de Granja/g, 'Especies Animales');
    content = content.replace(/Animal de Granja/g, 'Especie Animal');

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Actualizado: ${relPath}`);
  }
}
