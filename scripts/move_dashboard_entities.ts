import fs from 'fs';
import path from 'path';

const srcDir = path.join(__dirname, '../src');

// 1. Move folders
const foldersToMove = [
  {
    from: 'src/app/dashboard/admin/tareas/contenedores',
    to: 'src/app/dashboard/admin/contenedores'
  },
  {
    from: 'src/app/dashboard/admin/tareas/plantasparte',
    to: 'src/app/dashboard/admin/plantasparte'
  }
];

for (const move of foldersToMove) {
  const fromPath = path.join(__dirname, '..', move.from);
  const toPath = path.join(__dirname, '..', move.to);
  if (fs.existsSync(fromPath)) {
    fs.renameSync(fromPath, toPath);
    console.log(`Moved ${move.from} to ${move.to}`);
  }
}

// 2. Search and replace links
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

const files = getAllFiles(srcDir);
let changed = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  const original = content;

  content = content.replace(/\/dashboard\/admin\/tareas\/contenedores/g, '/dashboard/admin/contenedores');
  content = content.replace(/\/dashboard\/admin\/tareas\/plantasparte/g, '/dashboard/admin/plantasparte');

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    changed++;
    console.log(`Updated links in: ${file}`);
  }
}

console.log(`Completed. Updated ${changed} files.`);
