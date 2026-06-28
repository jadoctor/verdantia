import fs from 'fs';
import path from 'path';

const srcDir = path.join(__dirname, '../src');

function moveDir(oldPath: string, newPath: string) {
  const fullOld = path.join(srcDir, oldPath);
  const fullNew = path.join(srcDir, newPath);
  
  if (fs.existsSync(fullOld)) {
    fs.renameSync(fullOld, fullNew);
    console.log(`✅ Renombrado: ${oldPath} -> ${newPath}`);
  } else {
    console.log(`⚠️ No encontrado: ${oldPath}`);
  }
}

// Animales a Especies Animales
moveDir('app/api/admin/animales', 'app/api/admin/especiesanimales');
moveDir('app/dashboard/admin/animales', 'app/dashboard/admin/especiesanimales');

console.log('Renombrado de carpetas animales finalizado.');
