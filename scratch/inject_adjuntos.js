const fs = require('fs');

const E_FILE = 'src/components/admin/EspecieForm.tsx';
const V_FILE = 'src/components/admin/VariedadForm.tsx';

let especie = fs.readFileSync(E_FILE, 'utf8');
let variedad = fs.readFileSync(V_FILE, 'utf8');

// Extraer imports de EspecieForm (Blurhash, etc)
if (!variedad.includes('Blurhash')) {
  variedad = variedad.replace("import './EspecieForm.css';", "import './EspecieForm.css';\nimport { Blurhash } from 'react-blurhash';");
}

// Estados a inyectar
const estados = `
  const [photos, setPhotos] = useState<any[]>([]);
  const [pdfs, setPdfs] = useState<any[]>([]);
  const [dragOverPhotos, setDragOverPhotos] = useState(false);
  const [dragOverPdfs, setDragOverPdfs] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<{ [key: string]: number }>({});
  const [draggedPhotoIndex, setDraggedPhotoIndex] = useState<number | null>(null);
  const [draggedOverPhotoIndex, setDraggedOverPhotoIndex] = useState<number | null>(null);
  const [isPhotoEditorOpen, setIsPhotoEditorOpen] = useState(false);
  const [photoToEdit, setPhotoToEdit] = useState<any>(null);
`;
variedad = variedad.replace("const [saveStatus", estados + "\n  const [saveStatus");

// Extraer las funciones desde "const getMediaUrl" hasta "const savePhotoMeta"
const startFuncs = especie.indexOf("const getMediaUrl");
const endFuncs = especie.indexOf("const handleOpenAsociaciones");
let funcs = especie.substring(startFuncs, endFuncs);

// Reemplazos de especie a variedad en las funciones
funcs = funcs.replace(/especieId/g, 'variedadId');
funcs = funcs.replace(/\/api\/admin\/especies\//g, '/api/admin/variedades/');
funcs = funcs.replace(/formData\.especiesnombre/g, 'formData.variedadesnombre');

variedad = variedad.replace("const handleGlobalSave = async", funcs + "\n\n  const handleGlobalSave = async");

// Y necesitamos cargar los datos adjuntos en loadVariedad()
const loadAdjuntos = `
    try {
      const [resPhotos, resPdfs] = await Promise.all([
        fetch(\`/api/admin/variedades/\${variedadId}/photos\`, { headers: { 'x-user-email': userEmail! } }),
        fetch(\`/api/admin/variedades/\${variedadId}/pdfs\`, { headers: { 'x-user-email': userEmail! } })
      ]);
      const dataPhotos = await resPhotos.json();
      const dataPdfs = await resPdfs.json();
      setPhotos(dataPhotos.photos || []);
      setPdfs(dataPdfs.pdfs || []);
    } catch(e) {
      console.error('Error cargando adjuntos', e);
    }
`;
variedad = variedad.replace("setOriginalData(mapped);\n      }", "setOriginalData(mapped);\n      }\n" + loadAdjuntos);

// Extraer el tab de adjuntos
const tabStartStr = "{activeTab === 'adjuntos' && (";
const tabStart = especie.indexOf(tabStartStr);
const tabEndStr = "{/* FIN BLOGS */}";
let tabContent = "";

// Para encontrar el fin del tab adjuntos, buscaremos el siguiente tab (blogs)
const tabEnd = especie.indexOf("{/* BLOGS */}");
if (tabStart !== -1 && tabEnd !== -1) {
  tabContent = especie.substring(tabStart, tabEnd);
  // Reemplazar especieId por variedadId
  tabContent = tabContent.replace(/especieId/g, 'variedadId');
}

// Reemplazar el placeholder de adjuntos en VariedadForm
const vTabStartStr = "{activeTab === 'adjuntos' && (";
const vTabStart = variedad.indexOf(vTabStartStr);
const vTabEnd = variedad.indexOf(")}", vTabStart + vTabStartStr.length);
if (vTabStart !== -1 && tabContent) {
  variedad = variedad.substring(0, vTabStart) + tabContent + variedad.substring(variedad.indexOf("</div>", vTabEnd) + 6);
}

// Y necesitamos añadir el Photo Editor Modal al final de VariedadForm
const modalStartStr = "{isPhotoEditorOpen && photoToEdit && (";
const modalStart = especie.indexOf(modalStartStr);
const modalEndStr = "{/* Modal de Confirmación Sin Cambios */";
let modalContent = "";
if (modalStart !== -1) {
  modalContent = especie.substring(modalStart, especie.indexOf(modalEndStr));
}
variedad = variedad.replace("</form>\n      </div>\n    </>\n  );\n}", "</form>\n      </div>\n" + modalContent + "    </>\n  );\n}");

fs.writeFileSync(V_FILE, variedad);
console.log('Adjuntos inyectados en VariedadForm.tsx');
