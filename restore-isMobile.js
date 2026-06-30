const fs = require('fs');
let content = fs.readFileSync('src/components/admin/EspecieVegetalForm.tsx', 'utf8');

const toRestore = `
  const [isMobile, setIsMobile] = useState(false);
  const isDirty = isFormDirty || relacionesDirty;
`;

content = content.replace(
  /} = useEspecieAiConfig\(especieId, userEmail\);\r?\n/,
  `} = useEspecieAiConfig(especieId, userEmail);\n\n${toRestore}`
);

fs.writeFileSync('src/components/admin/EspecieVegetalForm.tsx', content);
console.log("Restored isMobile and isDirty");
