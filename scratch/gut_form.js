const fs = require('fs');

let content = fs.readFileSync('src/components/admin/SharedMediaUploader.tsx', 'utf8');

const returnStart = content.indexOf('  return (\n    <>');
const adjuntosStart = content.indexOf('{/* ADJUNTOS */}');
const adjuntosEnd = content.indexOf('{/* BLOGS */}');
const modalsStart = content.indexOf('{/* EDITOR DE FOTOS MODAL */}');

if (returnStart !== -1 && adjuntosStart !== -1 && adjuntosEnd !== -1 && modalsStart !== -1) {
  const beforeReturn = content.substring(0, returnStart);
  
  let adjuntosContent = content.substring(adjuntosStart, adjuntosEnd);
  // Limpiar el envoltorio de la tab original
  adjuntosContent = adjuntosContent.replace("{activeTab === 'adjuntos' && (", "").replace(/}$/, "").trim();

  // En EspecieForm, había un <div> extra envolviendo el tab. Vamos a quitar el último </div>
  if (adjuntosContent.endsWith('</div>\n            </div>\n          )}')) {
     adjuntosContent = adjuntosContent.replace('</div>\n            </div>\n          )}', '');
  }

  // Modales empiezan desde modalsStart hasta el final, menos la basura del formulario
  // El formulario se cerraba antes de los modales. En el archivo copiado, los modales van hasta el final.
  const modalsContent = content.substring(modalsStart);

  const newReturn = `  return (
    <div className="shared-media-uploader">
      <div className="grid-form">
        ${adjuntosContent.split('</div>\\n            </div>\\n          )}')[0]}
      </div>
      
      ${modalsContent}
`;

  content = beforeReturn + newReturn;
  fs.writeFileSync('src/components/admin/SharedMediaUploader.tsx', content);
  console.log('Gutted successfully');
} else {
  console.log('Markers not found');
}
