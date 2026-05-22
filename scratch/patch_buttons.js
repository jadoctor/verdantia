const fs = require('fs');
const pagePath = 'src/app/dashboard/cultivos/[id]/page.tsx';
let content = fs.readFileSync(pagePath, 'utf8');

// 1. Patch pending task
const pendingTarget = `                              <h4 style={{ margin: '0 0 4px', fontSize: '1.1rem', color: '#1e293b' }}>
                                {a.pauta.laboresnombre}
                                <span style={{ fontSize: '0.8rem', marginLeft: '8px', color: '#94a3b8' }}>`;

const pendingReplacement = `                              <h4 style={{ margin: '0 0 4px', fontSize: '1.1rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {a.pauta.laboresnombre}
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedAvisoForPhotos({
                                      id: \`pending_\${a.pauta.idlaborespauta}_\${a.fechaEmision}\`,
                                      isPending: true,
                                      idcultivos: cultivoId,
                                      idpauta: a.pauta.idlaborespauta,
                                      fechaEmision: a.fechaEmision
                                    });
                                  }}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', padding: 0 }}
                                  title="Gestionar Fotos"
                                >📸</button>
                                <span style={{ fontSize: '0.8rem', marginLeft: '8px', color: '#94a3b8' }}>`;

if (content.includes(pendingTarget)) {
    content = content.replace(pendingTarget, pendingReplacement);
}

// 2. Patch completed task
const completedTarget = `                            <h4 style={{ margin: '0 0 2px', fontSize: '1rem', color: '#475569', textDecoration: 'line-through' }}>
                              {pautaRef.laboresnombre}
                            </h4>`;

const completedReplacement = `                            <h4 style={{ margin: '0 0 2px', fontSize: '1rem', color: '#475569', textDecoration: 'line-through', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {pautaRef.laboresnombre}
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedAvisoForPhotos({
                                    id: ac.idcultivosavisos,
                                    isPending: false,
                                    idpauta: ac.xcultivosavisosidpautas
                                  });
                                }}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', padding: 0 }}
                                title="Gestionar Fotos"
                              >📸</button>
                            </h4>`;

if (content.includes(completedTarget)) {
    content = content.replace(completedTarget, completedReplacement);
}

fs.writeFileSync(pagePath, content);
console.log('Buttons patched!');
