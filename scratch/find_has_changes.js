const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../src/components/admin/EspecieForm.tsx');
const content = fs.readFileSync(filePath, 'utf-8');
const lines = content.split('\n');

lines.forEach((line, idx) => {
  if (line.includes('hasChanges')) {
    console.log(`Line ${idx + 1}: ${line.trim()}`);
  }
});
