const fs = require('fs');
let code = fs.readFileSync('src/components/admin/EspecieVegetalForm.tsx', 'utf8');

// Find where "const [alimentacionFiltroAptitud, setAlimentacionFiltroAptitud] = useState('');" is
const startStr = "const [alimentacionFiltroAptitud, setAlimentacionFiltroAptitud] = useState('');";
let idx = code.indexOf(startStr);
if (idx !== -1) {
  let endIdx = code.indexOf("});", idx);
  if (endIdx !== -1) {
    code = code.substring(0, idx + startStr.length) + '\n' + code.substring(endIdx + 3);
  }
}
fs.writeFileSync('src/components/admin/EspecieVegetalForm.tsx', code, 'utf8');
console.log('Fixed dangling object completely.');
