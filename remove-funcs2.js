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
  while (i < source.length && (source[i] === ';' || source[i] === '\n' || source[i] === '\r')) {
    i++;
  }
  console.log(`Removed ${funcName}`);
  return source.slice(0, startIndex) + source.slice(i);
}

const funcsToRemove = [
  'handleSearchPdfs', 'submitBlogGen'
];

funcsToRemove.forEach(f => {
  code = removeFunction(code, f);
});

// Remove generatingCoverId declaration
code = code.replace(/const \[generatingCoverId, setGeneratingCoverId\] = useState<number \| null>\(null\);\r?\n/, '');

// Fix the mapping in destructuring
code = code.replace(
  'handleRunPdfSearch, handleGenerateBlog, generatePdfCover',
  'handleRunPdfSearch: handleSearchPdfs, handleGenerateBlog: submitBlogGen, generatePdfCover'
);

// Fix PremiumSubheader error (remove subtitle prop)
code = code.replace(/subtitle=\{`Catálogo \/ \$\{.*?\}`\}/g, '');

fs.writeFileSync('src/components/admin/EspecieVegetalForm.tsx', code);
console.log("Functions and duplicates successfully removed.");
