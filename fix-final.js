const fs = require('fs');
let code = fs.readFileSync('src/components/admin/EspecieVegetalForm.tsx', 'utf8');

// 1. Add isMobile and isDirty if not present
if (!code.includes('const [isMobile, setIsMobile] = useState(false);')) {
  code = code.replace(
    /} = useEspeciePautas\(especieId\);\r?\n/,
    `} = useEspeciePautas(especieId);\n\n  const [isMobile, setIsMobile] = useState(false);\n  const isDirty = isFormDirty || relacionesDirty;`
  );
}

// 2. Remove duplicate timer refs (the ones not destructured)
code = code.replace(/const aiTimerRef = useRef[\s\S]*?;\r?\n/g, '');
code = code.replace(/const assimilationTimerRef = useRef[\s\S]*?;\r?\n/g, '');
code = code.replace(/const pautasTimerRef = useRef[\s\S]*?;\r?\n/g, '');
code = code.replace(/const \[toastMessage, setToastMessage\] = useState[\s\S]*?;\r?\n/g, '');

// 3. Remove subtitle from PremiumSubheader
code = code.replace(/subtitle=\{[^\}]+\}/g, '');

fs.writeFileSync('src/components/admin/EspecieVegetalForm.tsx', code);
console.log('Fixed remaining errors.');
