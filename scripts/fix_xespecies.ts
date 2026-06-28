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

  // Replace xespecies... with xespeciesvegetales...
  // but only if it's not already xespeciesvegetales
  content = content.replace(/xespecies(?!vegetales)/g, 'xespeciesvegetales');

  // Fix some edge cases if we accidentally did xespeciesvegetalesvegetales
  content = content.replace(/xespeciesvegetalesvegetales/g, 'xespeciesvegetales');

  // Also replace xvariedades... with xvariedadesvegetales
  content = content.replace(/xvariedades(?!vegetales)/g, 'xvariedadesvegetales');
  content = content.replace(/xvariedadesvegetalesvegetales/g, 'xvariedadesvegetales');

  // Animales
  content = content.replace(/xanimales/g, 'xespeciesanimales');

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    changed++;
    console.log(`Updated file: ${file}`);
  }
}

console.log(`Updated ${changed} files with missing xespecies replacements.`);
