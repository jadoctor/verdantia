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
  const original = content;

  // Replace remaining missed columns
  content = content.replace(/variedadesvisibilidadsino/g, 'variedadesvegetalesvisibilidadsino');
  content = content.replace(/variedadesactivo/g, 'variedadesvegetalesactivo');
  
  // Just to be safe, find any other "v.variedades" or "e.especies" that missed
  content = content.replace(/v\.variedades(?!vegetales)/g, 'v.variedadesvegetales');
  content = content.replace(/e\.especies(?!vegetales)/g, 'e.especiesvegetales');

  // Also check if there's any xespeciesusuariosidespeciesvegetales which is probably wrong, 
  // in the error log I saw: "xespeciesusuariosidespeciesvegetales" but the table is "especiesvegetalesusuarios".
  content = content.replace(/xespeciesusuariosidespeciesvegetales/g, 'xespeciesvegetalesusuariosidespeciesvegetales');
  content = content.replace(/xespeciesafeccionesidespeciesvegetales/g, 'xespeciesvegetalesafeccionesidespeciesvegetales');

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    changed++;
    console.log(`Updated file: ${file}`);
  }
}

console.log(`Updated ${changed} files with missed columns.`);
