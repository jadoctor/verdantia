const fs = require('fs');
const pagePath = 'src/app/dashboard/cultivos/[id]/page.tsx';
let content = fs.readFileSync(pagePath, 'utf8');

// Normalize newlines to \n for easier regex
content = content.replace(/\r\n/g, '\n');

// 1. Swap imports
content = content.replace("import GestorFotosLaborModal from './GestorFotosLaborModal';", "import InlineLaborPhotos from './InlineLaborPhotos';");

// 2. Remove the selectedAvisoForPhotos state and its modal rendering
content = content.replace(/  const \[selectedAvisoForPhotos, setSelectedAvisoForPhotos\] = useState<any>\(null\);\n/, "");

// Remove the modal block at the bottom
const modalRegex = /      \{selectedAvisoForPhotos && \([\s\S]*?\}\)\s*\/>\s*\)\}\n/;
content = content.replace(modalRegex, "");

// 3. Remove the standalone 📸 button from Tareas Pendientes
// The button is inside <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
const pendingButtonRegex = /<button[\s\S]*?title="Subir fotos a esta tarea"[\s\S]*?>📸<\/button>/;
content = content.replace(pendingButtonRegex, "");

// 4. Inject <InlineLaborPhotos /> in Tareas Pendientes when expanded
const pendingExpandedRegex = /(\{expandedPautas\.includes\(a\.pauta\.idlaborespauta\) && \([\s\S]*?)<\/div>\n                        \)\}/;
content = content.replace(pendingExpandedRegex, (match, p1) => {
    return p1 + `\n                            <InlineLaborPhotos 
                              isPending={true}
                              idcultivos={cultivoId}
                              idpauta={a.pauta.idlaborespauta}
                              fechaEmision={a.fechaEmision}
                              userEmail={userEmail!}
                              setLightboxUrl={setLightboxUrl}
                            />\n                          </div>\n                        )}`;
});

// 5. In Labores Realizadas, remove the standalone 📸 button
const completedButtonRegex = /<button[\s\S]*?title=\{fotosAsociadas\.length > 0 \? "Ver o Editar Fotos" : "📸 Añadir Foto"\}[\s\S]*?>📸<\/button>/g;
content = content.replace(completedButtonRegex, "");

// 6. In Labores Realizadas, replace the entire {/* Fotos Section */} with InlineLaborPhotos
const completedFotosRegex = /\{\/\* Fotos Section \*\/\}[\s\S]*?\{\/\* Descripciones \*\/\}/g;
content = content.replace(completedFotosRegex, (match) => {
    return `{/* Fotos Section */}
                                <div style={{ padding: '0 16px 16px 16px' }}>
                                  <InlineLaborPhotos 
                                    isPending={false}
                                    idcultivos={cultivoId}
                                    idpauta={ac.idpauta}
                                    fechaEmision=""
                                    idcultivosavisos={ac.idcultivosavisos}
                                    userEmail={userEmail!}
                                    setLightboxUrl={setLightboxUrl}
                                  />
                                </div>
                                
                                {/* Descripciones */}`;
});


fs.writeFileSync(pagePath, content);

// Delete the modal file
try {
  fs.unlinkSync('src/app/dashboard/cultivos/[id]/GestorFotosLaborModal.tsx');
  console.log('GestorFotosLaborModal.tsx deleted.');
} catch (e) {
  console.log('Could not delete modal: ', e.message);
}

console.log('page.tsx patched successfully for InlineLaborPhotos!');
