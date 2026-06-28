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

// 1. API - Especies a Especies Vegetales
moveDir('app/api/admin/especies', 'app/api/admin/especiesvegetales');

// 2. Dashboard - Especies a Especies Vegetales
moveDir('app/dashboard/admin/especies', 'app/dashboard/admin/especiesvegetales');

// 3. API - Variedades a Variedades Vegetales
moveDir('app/api/admin/variedades', 'app/api/admin/variedadesvegetales');

// 4. Dashboard - Variedades a Variedades Vegetales
moveDir('app/dashboard/admin/variedades', 'app/dashboard/admin/variedadesvegetales');

console.log('Renombrado de carpetas finalizado.');
