const fs = require('fs');
const code = fs.readFileSync('src/components/user/IniciarCultivoModal.tsx', 'utf8');
const lines = code.split('\n');

console.log('=== SECTIONS IN STEP 3 ===');
lines.forEach((line, idx) => {
  if (line.includes('step === 3') || line.includes('Paso 3') || line.includes('cantidad') || line.includes('ubicacion')) {
    if (idx >= 800) {
      console.log(`Line ${idx + 1}: ${line.trim()}`);
    }
  }
});
