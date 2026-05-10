const fs = require('fs');

const E_FILE = 'src/components/admin/EspecieForm.tsx';
let content = fs.readFileSync(E_FILE, 'utf8');

// 1. Extraer los imports
const importEnd = content.indexOf('interface EspecieFormProps');
let newContent = content.substring(0, importEnd);

// 2. Definir Props de VariedadMediaManager
newContent += `interface VariedadMediaManagerProps {
  variedadId: string;
  userEmail: string;
}

export default function VariedadMediaManager({ variedadId, userEmail }: VariedadMediaManagerProps) {
`;

// 3. Extraer states de media
const getMediaUrlPos = content.indexOf('const getMediaUrl = (ruta: string) =>');
const handleOpenAsoc = content.indexOf('const handleOpenAsociaciones = (type');

let statesAndFuncs = content.substring(getMediaUrlPos, handleOpenAsoc);

// Reemplazar especieId por variedadId en statesAndFuncs
statesAndFuncs = statesAndFuncs.replace(/especieId/g, 'variedadId');
statesAndFuncs = statesAndFuncs.replace(/\/api\/admin\/especies/g, '/api/admin/variedades');
statesAndFuncs = statesAndFuncs.replace(/formData\.especiesnombre/g, '""');

// Necesitamos declarar el array vacío de 'blogs' porque uploadAiImage actualiza pdfs
statesAndFuncs = `  const [photos, setPhotos] = useState<any[]>([]);
  const [pdfs, setPdfs] = useState<any[]>([]);
  const [blogs, setBlogs] = useState<any[]>([]);
  const [dragOverPhotos, setDragOverPhotos] = useState(false);
  const [dragOverPdfs, setDragOverPdfs] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [uploadingPdfs, setUploadingPdfs] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<{ [key: string]: number }>({});
  const [draggedPhotoIndex, setDraggedPhotoIndex] = useState<number | null>(null);
  const [draggedOverPhotoIndex, setDraggedOverPhotoIndex] = useState<number | null>(null);
  
  // -- Photo Editor State --
  const [isPhotoEditorOpen, setIsPhotoEditorOpen] = useState(false);
  const [photoToEdit, setPhotoToEdit] = useState<any>(null);
  const [photoEditorScale, setPhotoEditorScale] = useState(1);
  const [photoEditorPan, setPhotoEditorPan] = useState({ x: 0, y: 0 });
  const [photoEditorBrightness, setPhotoEditorBrightness] = useState(100);
  const [photoEditorContrast, setPhotoEditorContrast] = useState(100);
  const [photoEditorFilter, setPhotoEditorFilter] = useState('none');
  const [photoEditorAltText, setPhotoEditorAltText] = useState('');
  const [isDraggingPan, setIsDraggingPan] = useState(false);
  const [dragPanStart, setDragPanStart] = useState({ x: 0, y: 0 });
  const [photoEditorSaveStatus, setPhotoEditorSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'no-changes'>('idle');
  const [initialPhotoEditorState, setInitialPhotoEditorState] = useState<any>(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  // -- PDF Editor State --
  const [editingPdf, setEditingPdf] = useState<any>(null);
  const [pdfTitle, setPdfTitle] = useState('');
  const [pdfSummary, setPdfSummary] = useState('');
  const [pdfApuntes, setPdfApuntes] = useState('');
  const [pdfEditorSaveStatus, setPdfEditorSaveStatus] = useState<'idle' | 'saving'>('idle');
  const [initialPdfState, setInitialPdfState] = useState<any>(null);
  const [generatingCoverId, setGeneratingCoverId] = useState<number | null>(null);
  const [showPdfSearchModal, setShowPdfSearchModal] = useState(false);
  const [pdfSearchTopic, setPdfSearchTopic] = useState('');
  const [pdfSearchLoading, setPdfSearchLoading] = useState(false);

  useEffect(() => {
    if (!variedadId || !userEmail) return;
    const fetchAdjuntos = async () => {
      try {
        const [resPhotos, resPdfs] = await Promise.all([
          fetch(\`/api/admin/variedades/\${variedadId}/photos\`, { headers: { 'x-user-email': userEmail } }),
          fetch(\`/api/admin/variedades/\${variedadId}/pdfs\`, { headers: { 'x-user-email': userEmail } })
        ]);
        const dataPhotos = await resPhotos.json();
        const dataPdfs = await resPdfs.json();
        setPhotos(dataPhotos.photos || []);
        setPdfs(dataPdfs.pdfs || []);
      } catch(e) {
        console.error(e);
      }
    };
    fetchAdjuntos();
  }, [variedadId, userEmail]);

` + statesAndFuncs;

newContent += statesAndFuncs;

// 4. Extraer el render de ADJUNTOS
const adjuntosStart = content.indexOf("{activeTab === 'adjuntos' && (");
const adjuntosEnd = content.indexOf("{/* BLOGS */}");

let adjuntosJsx = content.substring(adjuntosStart, adjuntosEnd);
adjuntosJsx = adjuntosJsx.replace("{activeTab === 'adjuntos' && (", "return (\n  <div className='form-tab-content'>\n    {true && (");

adjuntosJsx = adjuntosJsx.replace(/especieId/g, 'variedadId');
adjuntosJsx = adjuntosJsx.replace(/formData\.especiesnombre/g, '""');

newContent += adjuntosJsx;

// 5. Extraer Modales (Photo Editor y PDF Editor)
const modalesStart = content.indexOf('{isPhotoEditorOpen && photoToEdit && (');
const modalesEnd = content.indexOf('{/* Modal de Confirmación Sin Cambios */}');
let modalesJsx = content.substring(modalesStart, modalesEnd);
modalesJsx = modalesJsx.replace(/especieId/g, 'variedadId');
modalesJsx = modalesJsx.replace(/formData\.especiesnombre/g, '""');

// Remover Modal de IA Sinonimos si se coló
const sinAiStart = modalesJsx.indexOf('{/* SINÓNIMOS (Inteligencia Artificial) */}');
if (sinAiStart !== -1) {
  modalesJsx = modalesJsx.substring(0, sinAiStart) + "</div></div></div>)}";
}

newContent += modalesJsx;

// Cerrar componente principal
newContent += `\n  </div>\n);\n}`;

fs.writeFileSync('src/components/admin/VariedadMediaManager.tsx', newContent);
console.log('Componente VariedadMediaManager.tsx creado.');
