const fs = require('fs');

let content = fs.readFileSync('src/components/admin/SharedMediaUploader.tsx', 'utf8');

// Find the main return
const returnStart = content.indexOf('  return (\n    <>');

if (returnStart !== -1) {
  const beforeReturn = content.substring(0, returnStart);
  
  // Extract adjuntos content
  const adjuntosStart = content.indexOf('{/* ADJUNTOS */}');
  const adjuntosEnd = content.indexOf('{/* BLOGS */}');
  let adjuntosContent = '';
  if (adjuntosStart !== -1 && adjuntosEnd !== -1) {
    adjuntosContent = content.substring(adjuntosStart, adjuntosEnd);
    adjuntosContent = adjuntosContent.replace("{activeTab === 'adjuntos' && (", "").replace(/}$/, "");
  }

  // Extract modales
  const viewEnd = content.indexOf('{/* EDITOR DE FOTOS MODAL */}');
  let afterView = '';
  if (viewEnd !== -1) {
    afterView = content.substring(viewEnd);
    // remove the last `</>\n  );\n}` because we will rebuild it
    afterView = afterView.replace('</>\n  );\n}', '');
  }

  const newReturn = `  return (
    <>
      <div style={{ background: 'white', padding: '30px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
        <h2 style={{ marginBottom: '20px' }}>Gestor Multimedia ({entityType})</h2>
        ${adjuntosContent}
      </div>
      ${afterView}
    </>
  );
}
`;

  content = beforeReturn + newReturn;
  fs.writeFileSync('src/components/admin/SharedMediaUploader.tsx', content);
  console.log('Fixed return statement!');
} else {
  console.log('Could not find return statement.');
}
