const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'admin', 'EspecieForm.tsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

for (let i = 480; i < 580; i++) {
  if (lines[i] !== undefined) {
    console.log(`${i + 1}: ${lines[i]}`);
  }
}
