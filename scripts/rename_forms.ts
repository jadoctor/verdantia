import fs from 'fs';
import path from 'path';

const srcDir = path.join(__dirname, '../src');

// Rename files
const renames = [
  { old: 'components/admin/EspecieForm.tsx', new: 'components/admin/EspecieVegetalForm.tsx' },
  { old: 'components/admin/EspecieForm.css', new: 'components/admin/EspecieVegetalForm.css' },
  { old: 'components/admin/EspecieVariedadesTab.tsx', new: 'components/admin/EspecieVegetalVariedadesTab.tsx' },
  { old: 'components/admin/VariedadForm.tsx', new: 'components/admin/VariedadVegetalForm.tsx' },
  { old: 'components/admin/VariedadesList.tsx', new: 'components/admin/VariedadesVegetalesList.tsx' },
  { old: 'components/admin/VariedadMediaManager.tsx', new: 'components/admin/VariedadVegetalMediaManager.tsx' },
];

for (const r of renames) {
  const oldPath = path.join(srcDir, r.old);
  const newPath = path.join(srcDir, r.new);
  if (fs.existsSync(oldPath)) {
    fs.renameSync(oldPath, newPath);
    console.log(`Renombrado archivo: ${r.old} -> ${r.new}`);
  }
}

// Rename imports
function getAllFiles(dirPath: string, arrayOfFiles: string[] = []) {
  if (!fs.existsSync(dirPath)) return arrayOfFiles;
  const files = fs.readdirSync(dirPath);
  files.forEach(function (file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        arrayOfFiles.push(path.join(dirPath, "/", file));
      }
    }
  });
  return arrayOfFiles;
}

const files = getAllFiles(srcDir);
let changed = 0;
for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  const oldContent = content;

  // Component names
  content = content.replace(/EspecieForm/g, 'EspecieVegetalForm');
  content = content.replace(/EspecieVariedadesTab/g, 'EspecieVegetalVariedadesTab');
  content = content.replace(/VariedadForm/g, 'VariedadVegetalForm');
  content = content.replace(/VariedadesList/g, 'VariedadesVegetalesList');
  content = content.replace(/VariedadMediaManager/g, 'VariedadVegetalMediaManager');
  
  if (content !== oldContent) {
    fs.writeFileSync(file, content, 'utf8');
    changed++;
  }
}
console.log(`Imports actualizados en ${changed} archivos.`);
