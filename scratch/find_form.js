const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../src/components/admin/EspecieForm.tsx');
const content = fs.readFileSync(filePath, 'utf-8');
const lines = content.split('\n');

lines.forEach((line, idx) => {
  const lineNum = idx + 1;
  if (line.includes('</form>') || line.includes('isEspecieOpen') || line.includes('especie-form-container')) {
    console.log(`Line ${lineNum}: ${line.trim()}`);
  }
});
