const fs = require('fs');
const pagePath = 'src/app/dashboard/cultivos/[id]/page.tsx';
let content = fs.readFileSync(pagePath, 'utf8');

// 1. Lightbox State
if (!content.includes('lightboxUrl')) {
  const stateAnchor = `const [activeTab, setActiveTab]`;
  content = content.replace(stateAnchor, `const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);\n  ${stateAnchor}`);
}

// 2. Lightbox Render at the very end
if (!content.includes('lightboxUrl && (')) {
  const endAnchor = `</div>\n    </div>\n  );\n}`;
  const lightboxRender = `
      {/* Lightbox Global */}
      {lightboxUrl && (
        <div 
          onClick={() => setLightboxUrl(null)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 999999, cursor: 'zoom-out'
          }}
        >
          <img src={lightboxUrl} alt="Vista ampliada" style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain', borderRadius: '8px' }} />
        </div>
      )}
  `;
  content = content.replace(endAnchor, lightboxRender + '\n' + endAnchor);
}

// 3. handleMarkAsDone function
if (!content.includes('const handleMarkAsDone')) {
  const funcAnchor = `const loadCultivo = async`;
  const handleMarkAsDoneCode = `
  const handleMarkAsDone = async (idpauta: number, fase: string, fechaEmision: string | null) => {
    if (isSimulating) return;
    if (!window.confirm('¿Marcar esta labor como completada?')) return;
    
    try {
      const res = await fetch(\`/api/user/cultivos/\${cultivoId}/completar-labor\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail! },
        body: JSON.stringify({ idpauta, fase, fechaEmision })
      });
      if (res.ok) {
        await loadCultivo(userEmail!, cultivoId);
      } else {
        alert('Error al completar labor');
      }
    } catch (e) {
      console.error(e);
      alert('Error de red');
    }
  };
  `;
  content = content.replace(funcAnchor, handleMarkAsDoneCode + '\n  ' + funcAnchor);
}

// 4. pendingAvisos vs avisosPendientes or whatever it was
// Let's find out how pending tasks are defined.
// In my patch, I used `pendingAvisos.length` and `pendingAvisos.map`.
// If `pendingAvisos` doesn't exist, we need to create it!
// Cultivo object usually has `avisosPendientes`. Let's check where it is created.
if (!content.includes('const pendingAvisos =')) {
  // We can just define pendingAvisos before we use it!
  // Before `{activeTab === 'tareas' && (`
  const tareasAnchor = `{activeTab === 'tareas' && (`;
  const pendingAvisosDef = `
        {/* Variables calculadas */}
        {(() => {
          const pendingAvisos = (cultivo?.avisos || []).filter((a: any) => !a.completada && !ignoredPautas.includes(a.pauta.idlaborespauta));
          return null;
        })()}
  `;
  // Actually, better to just replace `pendingAvisos` with `((cultivo?.avisos || []).filter((a: any) => !a.completada && !ignoredPautas.includes(a.pauta.idlaborespauta)))`
  content = content.replace(/pendingAvisos\.length/g, `((cultivo?.avisos || []).filter((a: any) => !a.completada && !ignoredPautas.includes(a.pauta.idlaborespauta))).length`);
  content = content.replace(/pendingAvisos\.map/g, `((cultivo?.avisos || []).filter((a: any) => !a.completada && !ignoredPautas.includes(a.pauta.idlaborespauta))).map`);
}

fs.writeFileSync(pagePath, content);
console.log('Missing functions injected!');
