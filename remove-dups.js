const fs = require('fs');
let content = fs.readFileSync('src/components/admin/EspecieVegetalForm.tsx', 'utf8');

// I will remove the duplicate declarations. 
// Since they might be destructured vs standard useState, I will explicitly target the useState declarations:

const varsToRemove = [
  'loading', 'isFormDirty', 'photos', 'pdfs', 'blogs',
  'dragOverPhotos', 'dragOverPdfs', 'uploadingPhotos', 'uploadingPdfs',
  'draggedPhotoIndex', 'draggedOverPhotoIndex', 'draggedHeroPhotoId', 'draggedOverHeroPhotoId',
  'masterLabores', 'sinScopePresets'
];

let lines = content.split('\n');
let newLines = [];
let removedCount = 0;

for (let i = 0; i < lines.length; i++) {
  let line = lines[i];
  let keep = true;

  // We only want to remove the standard `const [var, setVar] = useState` or `const var = ...`
  // We DO NOT want to remove the destructuring from useEspecieMedia or useEspecieTaxonomy or useEspecieCore!
  // The destructuring lines look like `  photos, setPhotos, pdfs, setPdfs,` etc.
  // The duplicate declarations look like `const [photos, setPhotos] = useState<any[]>([]);`
  
  if (line.trim().startsWith('const [') || line.trim().startsWith('const isFormDirty =') || line.trim().startsWith('const sinScopePresets:')) {
    for (const v of varsToRemove) {
      if (line.includes(`const [${v},`) || line.trim().startsWith(`const ${v} =`) || line.trim().startsWith(`const ${v}:`)) {
        // Wait! We ONLY want to remove the duplicated ones.
        // We know masterLabores is destructured in useEspecieTaxonomy. So removing its useState is correct!
        keep = false;
        removedCount++;
        break;
      }
    }
  }

  // Also sinScopePresets spans multiple lines
  if (!keep && line.includes('sinScopePresets')) {
     // skip next 4 lines
     i += 4;
  }

  if (keep) {
    newLines.push(line);
  }
}

fs.writeFileSync('src/components/admin/EspecieVegetalForm.tsx', newLines.join('\n'));
console.log(`Removed ${removedCount} duplicate declarations.`);
