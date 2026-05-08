const fs = require('fs');
const file = 'src/components/admin/EspecieForm.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add saveRelacionesNow helper function after the assimilateAll function
const insertAfter = "    setShowAiModal(false);\r\n  };\r\n";
const helperFn = `
  const saveRelacionesNow = async (updatedRels: any) => {
    if (!especieId || !userEmail) return;
    try {
      await fetch(\`/api/admin/especies/\${especieId}/relaciones\`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail },
        body: JSON.stringify(updatedRels)
      });
      setInitialRelaciones(updatedRels);
      setRelacionesDirty(false);
    } catch (e) {
      console.error('Error auto-guardando relaciones:', e);
    }
  };
`;
content = content.replace(insertAfter, insertAfter + helperFn);

// 2. Replace beneficiosas delete handler
content = content.replace(
  `<button type="button" onClick={() => {\r\n                        setRelaciones((prev: any) => ({ ...prev, beneficiosas: prev.beneficiosas.filter((_: any, i: number) => i !== idx) }));\r\n                        setRelacionesDirty(true);\r\n                      }} style={{ color: '#ef4444', border: 'none', background: '#fee2e2', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}>Eliminar</button>`,
  `<button type="button" onClick={() => {\r\n                        const updated = { ...relaciones, beneficiosas: relaciones.beneficiosas.filter((_: any, i: number) => i !== idx) };\r\n                        setRelaciones(updated);\r\n                        saveRelacionesNow(updated);\r\n                      }} style={{ color: '#ef4444', border: 'none', background: '#fee2e2', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}>Eliminar</button>`
);

// 3. Replace perjudiciales delete handler
content = content.replace(
  `<button type="button" onClick={() => {\r\n                        setRelaciones((prev: any) => ({ ...prev, perjudiciales: prev.perjudiciales.filter((_: any, i: number) => i !== idx) }));\r\n                        setRelacionesDirty(true);\r\n                      }} style={{ color: '#ef4444', border: 'none', background: '#fee2e2', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}>Eliminar</button>`,
  `<button type="button" onClick={() => {\r\n                        const updated = { ...relaciones, perjudiciales: relaciones.perjudiciales.filter((_: any, i: number) => i !== idx) };\r\n                        setRelaciones(updated);\r\n                        saveRelacionesNow(updated);\r\n                      }} style={{ color: '#ef4444', border: 'none', background: '#fee2e2', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}>Eliminar</button>`
);

// 4. Replace plagas delete handler
content = content.replace(
  `<button type="button" onClick={() => {\r\n                        setRelaciones((prev: any) => ({ ...prev, plagas: prev.plagas.filter((_: any, i: number) => i !== idx) }));\r\n                        setRelacionesDirty(true);\r\n                      }} style={{ color: '#ef4444', border: 'none', background: '#fee2e2', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}>Eliminar</button>`,
  `<button type="button" onClick={() => {\r\n                        const updated = { ...relaciones, plagas: relaciones.plagas.filter((_: any, i: number) => i !== idx) };\r\n                        setRelaciones(updated);\r\n                        saveRelacionesNow(updated);\r\n                      }} style={{ color: '#ef4444', border: 'none', background: '#fee2e2', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}>Eliminar</button>`
);

fs.writeFileSync(file, content);
console.log('Auto-save on delete applied for all 3 relation types.');
