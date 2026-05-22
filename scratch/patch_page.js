const fs = require('fs');
const pagePath = 'src/app/dashboard/cultivos/[id]/page.tsx';
let page = fs.readFileSync(pagePath, 'utf8');

// 1. Add useState variables if they don't exist
if (!page.includes('const [selectedAvisoForPhotos, setSelectedAvisoForPhotos]')) {
  page = page.replace(
    'const [loading, setLoading] = useState(true);',
    'const [loading, setLoading] = useState(true);\n  const [selectedAvisoForPhotos, setSelectedAvisoForPhotos] = useState<any>(null);\n  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);'
  );
}

// 2. Add the modal rendering inside the return statement (right before the final </div> of CultivoDashboard)
if (!page.includes('<GestorFotosLaborModal')) {
  const insertIndex = page.lastIndexOf('</div>\n    </div>\n  );\n}');
  if (insertIndex !== -1) {
    const modalJSX = `
      {/* Modal Gestor de Fotos */}
      {selectedAvisoForPhotos && (
        <GestorFotosLaborModal
          aviso={selectedAvisoForPhotos}
          pautas={pautas}
          userEmail={userEmail!}
          onClose={() => setSelectedAvisoForPhotos(null)}
          onRefresh={() => loadCultivo(userEmail!, cultivoId)}
          setLightboxUrl={setLightboxUrl}
        />
      )}
    `;
    page = page.slice(0, insertIndex) + modalJSX + page.slice(insertIndex);
  }
}

// 3. Append the clean modal code at the bottom of the file
const modalCode = fs.readFileSync('scratch/clean_modal.tsx', 'utf8');
if (!page.includes('function GestorFotosLaborModal')) {
  page = page + '\n\n' + modalCode;
}

fs.writeFileSync(pagePath, page);
console.log('Patch applied successfully!');
