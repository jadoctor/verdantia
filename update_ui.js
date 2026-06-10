const fs = require('fs');

const filePath = 'c:\\Users\\jaill\\Documents\\VERDANTIA\\src\\app\\dashboard\\admin\\ajustes\\mantenimiento\\page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Version hot swap
content = content.replace(/__did_reload_v20/g, '__did_reload_v21');

// 2. States
content = content.replace(
  "  const [lastAction, setLastAction] = useState<string>('Nunca');",
  `  const [lastActionLocalCopy, setLastActionLocalCopy] = useState<string>('Nunca');\n  const [lastActionOneDrive, setLastActionOneDrive] = useState<string>('Nunca');\n  const [lastActionGit, setLastActionGit] = useState<string>('Nunca');\n  const [lastActionFirebase, setLastActionFirebase] = useState<string>('Nunca');`
);

// 3. useEffect mount
content = content.replace(
  "  useEffect(() => {\n    setLastAction(localStorage.getItem('last_action_time') || 'Nunca');\n  }, []);",
  `  useEffect(() => {\n    setLastActionLocalCopy(localStorage.getItem('last_action_local') || 'Nunca');\n    setLastActionOneDrive(localStorage.getItem('last_action_onedrive') || 'Nunca');\n    setLastActionGit(localStorage.getItem('last_action_git') || 'Nunca');\n    setLastActionFirebase(localStorage.getItem('last_action_firebase') || 'Nunca');\n  }, []);`
);

// 4. Remove global update from tasks useEffect
content = content.replace(
  "    const dateStr = new Date().toLocaleString('es-ES');\n    localStorage.setItem('last_action_time', dateStr);\n    setLastAction(dateStr);",
  ""
);

// 5. Select All
const handleSelectAllSrc = `  const handleSelectAll = () => {
    const allSelected = optLocalCopy && optOneDrive && optGit && optFirebase;
    setOptLocalCopy(!allSelected);
    setOptOneDrive(!allSelected);
    setOptGit(!allSelected);
    setOptFirebase(!allSelected);
  };`;
const handleSelectAllDst = `  const handleSelectAll = () => {
    const allSelected = optLocalCopy && optOneDrive && optGit && optFirebase;
    const dateStr = new Date().toLocaleString('es-ES');
    setOptLocalCopy(!allSelected);
    if (!allSelected) { localStorage.setItem('last_action_local', dateStr); setLastActionLocalCopy(dateStr); }
    setOptOneDrive(!allSelected);
    if (!allSelected) { localStorage.setItem('last_action_onedrive', dateStr); setLastActionOneDrive(dateStr); }
    setOptGit(!allSelected);
    if (!allSelected) { localStorage.setItem('last_action_git', dateStr); setLastActionGit(dateStr); }
    setOptFirebase(!allSelected);
    if (!allSelected) { localStorage.setItem('last_action_firebase', dateStr); setLastActionFirebase(dateStr); }
  };`;
content = content.replace(handleSelectAllSrc, handleSelectAllDst);

// 6. Action 1 UI
content = content.replace(
  "Extrae los datos en un archivo .sql y comprime el proyecto en un .zip.</span>\n                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>",
  "Extrae los datos en un archivo .sql y comprime el proyecto en un .zip.</span>\n                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}><span>🕒</span> Última ejecución: {lastActionLocalCopy}</div>\n                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>"
);
content = content.replace(
  "onChange={e => setOptLocalCopy(e.target.checked)}",
  "onChange={e => { setOptLocalCopy(e.target.checked); if (e.target.checked) { const dateStr = new Date().toLocaleString('es-ES'); localStorage.setItem('last_action_local', dateStr); setLastActionLocalCopy(dateStr); } }}"
);

// 7. Action 2 UI
content = content.replace(
  "Copia el SQL y ZIP a OneDrive en una carpeta con fecha.</span>\n                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>",
  "Copia el SQL y ZIP a OneDrive en una carpeta con fecha.</span>\n                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}><span>🕒</span> Última ejecución: {lastActionOneDrive}</div>\n                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>"
);
content = content.replace(
  "onChange={e => setOptOneDrive(e.target.checked)}",
  "onChange={e => { setOptOneDrive(e.target.checked); if (e.target.checked) { const dateStr = new Date().toLocaleString('es-ES'); localStorage.setItem('last_action_onedrive', dateStr); setLastActionOneDrive(dateStr); } }}"
);

// 8. Action 3 UI
content = content.replace(
  "Sella los cambios locales y los sube al repositorio remoto sin desplegar a producción.</span>\n                  </div>",
  "Sella los cambios locales y los sube al repositorio remoto sin desplegar a producción.</span>\n                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}><span>🕒</span> Última ejecución: {lastActionGit}</div>\n                  </div>"
);
content = content.replace(
  "onChange={e => setOptGit(e.target.checked)}",
  "onChange={e => { setOptGit(e.target.checked); if (e.target.checked) { const dateStr = new Date().toLocaleString('es-ES'); localStorage.setItem('last_action_git', dateStr); setLastActionGit(dateStr); } }}"
);

// 9. Action 4 UI
content = content.replace(
  "Compila la app y la despliega públicamente en la red.</span>\n                  </div>",
  "Compila la app y la despliega públicamente en la red.</span>\n                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}><span>🕒</span> Última ejecución: {lastActionFirebase}</div>\n                  </div>"
);
content = content.replace(
  "onChange={e => setOptFirebase(e.target.checked)}",
  "onChange={e => { setOptFirebase(e.target.checked); if (e.target.checked) { const dateStr = new Date().toLocaleString('es-ES'); localStorage.setItem('last_action_firebase', dateStr); setLastActionFirebase(dateStr); } }}"
);

// 10. Remove global UI block
const globalBlockSrc = `              {/* Información de Última Acción */}
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
                <div style={{ 
                  fontSize: '0.85rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' 
                }}>
                  <span>🕒</span>
                  <span><strong>Última ejecución:</strong> {lastAction}</span>
                </div>
              </div>`;
content = content.replace(globalBlockSrc, "");

fs.writeFileSync(filePath, content, 'utf8');
console.log('Done replacing strings.');
