const fs = require('fs');

const snippets = fs.readFileSync('scratch/snippets.txt', 'utf8');
const chunks = snippets.split('--- REPLACEMENT ---');

let largestModal = '';

for (const chunk of chunks) {
  if (chunk.includes('function GestorFotosLaborModal')) {
    if (chunk.length > largestModal.length) {
      largestModal = chunk;
    }
  }
}

fs.writeFileSync('scratch/modal_backup.tsx', largestModal.trim());
console.log('Modal extracted! Size: ' + largestModal.length + ' bytes');
