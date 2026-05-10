const fs = require('fs');

const E_FILE = 'src/components/admin/EspecieForm.tsx';
let content = fs.readFileSync(E_FILE, 'utf8');

// 1. Cambiar el nombre del componente y los props
content = content.split('export default function EspecieForm({ especieId, userEmail }: EspecieFormProps) {')
                 .join(`interface SharedMediaUploaderProps { entityId: string; entityType: 'especies' | 'variedades' | 'labores'; userEmail: string; }
export default function SharedMediaUploader({ entityId, entityType, userEmail }: SharedMediaUploaderProps) {`);

// 2. Reemplazar especieId por entityId
content = content.split('especieId').join('entityId');

// 3. Reemplazar las rutas API (con split/join no hay problema de regex)
content = content.split('/api/admin/especies').join('/api/admin/${entityType}');
// Corrección por si quedaron comillas simples rodeando el backtick en fetches
content = content.split("fetch('/api/admin/${entityType}").join("fetch(`/api/admin/${entityType}");
content = content.split("fetch(`/api/admin/${entityType}").join("fetch(`/api/admin/${entityType}"); // just to be sure it uses backtick
content = content.split("}'").join("}`"); 

// 4. Vamos a purgar el <form> gigantesco y las tabs
// Buscaremos el inicio del grid-form de adjuntos y el final
const adjuntosStart = content.indexOf('{/* ADJUNTOS */}');
const adjuntosEnd = content.indexOf('{/* BLOGS */}');

// Buscaremos donde empieza el <div> principal de la vista
const viewStart = content.indexOf('<div style={{ display: \'flex\', gap: \'20px\', alignItems: \'flex-start\' }}>');
const viewEnd = content.indexOf('{/* EDITOR DE FOTOS MODAL */}');

if (adjuntosStart !== -1 && viewEnd !== -1) {
  // Construiremos el nuevo render
  const beforeView = content.substring(0, viewStart);
  const adjuntosContent = content.substring(adjuntosStart, adjuntosEnd);
  const afterView = content.substring(viewEnd);
  
  // Vamos a envolver los adjuntos
  const newView = `
  <div style={{ background: 'white', padding: '30px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
    <h2 style={{ marginBottom: '20px' }}>Gestor Multimedia ({entityType})</h2>
    ${adjuntosContent.replace("{activeTab === 'adjuntos' && (", "").replace(/}$/, "")}
  </div>
  `;
  
  content = beforeView + newView + '\n' + afterView;
}

// Write the file
fs.writeFileSync('src/components/admin/SharedMediaUploader.tsx', content);
console.log('Done!');
