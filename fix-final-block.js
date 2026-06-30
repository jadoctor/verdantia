const fs = require('fs');
let code = fs.readFileSync('src/components/admin/EspecieVegetalForm.tsx', 'utf8');

const targetStr = `  const [alimentacionFiltroAptitud, setAlimentacionFiltroAptitud] = useState('');
    xlaborespautaidlabores: '',
    laborespautafase: 'planificacion',
    laborespautafrecuenciadias: '',
    laborespautaoffset: 0,
    laborespautanotasia: '',
    laborespautaactivosino: 1,
    idlaborespauta: undefined as number | undefined
  });`;

const replacementStr = `  const [alimentacionFiltroAptitud, setAlimentacionFiltroAptitud] = useState('');`;

code = code.replace(targetStr, replacementStr);
fs.writeFileSync('src/components/admin/EspecieVegetalForm.tsx', code, 'utf8');
console.log('Fixed final syntax block.');
