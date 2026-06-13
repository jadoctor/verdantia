const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');

function getFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
        results = results.concat(getFiles(filePath));
      }
    } else {
      if (/\.(ts|tsx|js|jsx)$/.test(file)) {
        results.push(filePath);
      }
    }
  });
  return results;
}

// Check if a path exists case-sensitively on disk
function checkCaseSensitivePath(targetPath) {
  // Normalize path
  const normalized = path.normalize(targetPath);
  const parts = normalized.split(path.sep);
  
  let current = '';
  // On Windows, the first part is the drive letter (e.g., "C:")
  let startIndex = 0;
  if (parts[0].endsWith(':')) {
    current = parts[0].toUpperCase() + path.sep;
    startIndex = 1;
  } else if (parts[0] === '') {
    current = path.sep;
    startIndex = 1;
  }

  for (let i = startIndex; i < parts.length; i++) {
    const part = parts[i];
    if (!part) continue;

    try {
      const files = fs.readdirSync(current);
      if (!files.includes(part)) {
        const matching = files.find(f => f.toLowerCase() === part.toLowerCase());
        if (matching) {
          return {
            valid: false,
            expected: matching,
            actual: part,
            segmentPath: path.join(current, part)
          };
        } else {
          // File doesn't exist at all (might be resolved with extension later, handled in resolveImport)
          return { valid: false, notFound: true };
        }
      }
      current = path.join(current, part);
    } catch (e) {
      return { valid: false, error: e.message };
    }
  }
  return { valid: true };
}

// Resolve an import source to an actual file path
function resolveImport(importerFile, importSource) {
  let resolvedBase = '';
  if (importSource.startsWith('@/')) {
    resolvedBase = path.join(SRC, importSource.slice(2));
  } else if (importSource.startsWith('.')) {
    resolvedBase = path.resolve(path.dirname(importerFile), importSource);
  } else {
    // Third-party module (npm)
    return null;
  }

  // Extensions to try
  const extensions = ['', '.tsx', '.ts', '.jsx', '.js', '/index.tsx', '/index.ts', '/index.jsx', '/index.js'];
  for (const ext of extensions) {
    const p = resolvedBase + ext;
    if (fs.existsSync(p) && fs.statSync(p).isFile()) {
      return p;
    }
  }
  return null;
}

function main() {
  const files = getFiles(SRC);
  console.log(`Analyzing imports in ${files.length} files...`);

  let errors = 0;

  files.forEach((file) => {
    const content = fs.readFileSync(file, 'utf8');
    
    // Simple regex to extract import sources
    const importRegex = /(?:import|from|require)\s*\(\s*['"]([^'"]+)['"]\s*\)|(?:import\s+type\s+.*?\s+from|import\s+.*?\s+from|from|require)\s*['"]([^'"]+)['"]/g;
    let match;
    const imports = new Set();
    
    while ((match = importRegex.exec(content)) !== null) {
      const source = match[1] || match[2];
      if (source) imports.add(source);
    }

    imports.forEach((source) => {
      const resolved = resolveImport(file, source);
      if (resolved) {
        const check = checkCaseSensitivePath(resolved);
        if (!check.valid && !check.notFound) {
          errors++;
          const relativeImporter = path.relative(ROOT, file);
          console.error(`Case Mismatch in ${relativeImporter}:`);
          console.error(`  Import source: "${source}"`);
          console.error(`  Resolved file: ${path.relative(ROOT, resolved)}`);
          console.log(`  Mismatch details: Found on disk as "${check.expected}" but imported/cased as "${check.actual}"`);
          console.log();
        }
      }
    });
  });

  console.log(`Analysis complete. Found ${errors} casing errors.`);
}

main();
