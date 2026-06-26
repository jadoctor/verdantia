const fs = require('fs');
const path = require('path');

try {
  // Read git_diff_variedad.txt in UTF-16LE
  const diffPath = path.join(__dirname, '..', 'git_diff_variedad.txt');
  const content = fs.readFileSync(diffPath, 'utf16le');
  
  // Clean carriage returns and ensure standard LF or CRLF
  const cleaned = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  // Write to a clean UTF-8 file
  const outPath = path.join(__dirname, '..', 'git_diff_variedad_clean.patch');
  fs.writeFileSync(outPath, cleaned, 'utf8');
  console.log('Patch decoded and cleaned successfully to git_diff_variedad_clean.patch');
} catch (e) {
  console.error('Error cleaning patch:', e);
}
