const fs = require('fs');
let code = fs.readFileSync('src/components/admin/EspecieVegetalForm.tsx', 'utf8');

function removeFunction(source, funcName) {
  const match = source.match(new RegExp(`const ${funcName} = (?:async )?\\([\\s\\S]*?\\) => \\{`));
  if (!match) return source;
  const startIndex = match.index;
  let i = startIndex + match[0].length;
  let braceCount = 1;
  while (i < source.length && braceCount > 0) {
    if (source[i] === '{') braceCount++;
    if (source[i] === '}') braceCount--;
    i++;
  }
  // Include the trailing semicolon/newline if present
  while (i < source.length && (source[i] === ';' || source[i] === '\n' || source[i] === '\r')) {
    i++;
  }
  console.log(`Removed ${funcName}`);
  return source.slice(0, startIndex) + source.slice(i);
}

const funcsToRemove = [
  'loadEspecie', 'saveFormData', 'loadAttachments', 'handleFileUpload',
  'handlePhotoReorder', 'handleReorderPhotos', 'handleSetPrimaryPhoto',
  'savePhotoEdits', 'savePdfEdits', 'confirmDelete', 'handleRunPdfSearch',
  'handleGenerateBlog', 'generatePdfCover'
];

funcsToRemove.forEach(f => {
  code = removeFunction(code, f);
});

fs.writeFileSync('src/components/admin/EspecieVegetalForm.tsx', code);
console.log("Functions successfully removed.");
