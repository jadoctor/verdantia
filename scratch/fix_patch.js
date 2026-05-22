const fs = require('fs');
const pagePath = 'src/app/dashboard/cultivos/[id]/page.tsx';
let content = fs.readFileSync(pagePath, 'utf8');

// Normalize newlines to \n for easy matching
content = content.replace(/\r\n/g, '\n');

// 1. Add 'completadas' to the tab menu
const tabMenuTarget = `          <div 
            onClick={() => setActiveTab('tareas')}
            style={{ padding: '16px 0', borderBottom: activeTab === 'tareas' ? '3px solid #ef4444' : '3px solid transparent', color: activeTab === 'tareas' ? '#ef4444' : '#64748b', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', transition: 'all 0.2s' }}>
            🔔 Tareas Pendientes
          </div>
        </div>`;

const tabMenuReplacement = `          <div 
            onClick={() => setActiveTab('tareas')}
            style={{ padding: '16px 0', borderBottom: activeTab === 'tareas' ? '3px solid #ef4444' : '3px solid transparent', color: activeTab === 'tareas' ? '#ef4444' : '#64748b', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', transition: 'all 0.2s' }}>
            🔔 Tareas Pendientes
          </div>
          <div 
            onClick={() => setActiveTab('completadas')}
            style={{ padding: '16px 0', borderBottom: activeTab === 'completadas' ? '3px solid #10b981' : '3px solid transparent', color: activeTab === 'completadas' ? '#10b981' : '#64748b', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', transition: 'all 0.2s' }}>
            ✅ Labores Realizadas ({avisosCompletados.length})
          </div>
        </div>`;

if (content.includes(tabMenuTarget)) {
    content = content.replace(tabMenuTarget, tabMenuReplacement);
    console.log('Tab menu injected.');
} else {
    console.log('Failed to find tabMenuTarget!');
}

// 2. Remove the old completed block from 'tareas'
const completadasBlockStart = `              {avisosCompletados.length > 0 && (
                <div style={{ marginTop: '32px' }}>
                  <div style={{ background: '#ecfdf5', padding: '16px', borderRadius: '16px', border: '1px solid #d1fae5', marginBottom: '16px' }}>`;
                  
const endTareasTarget = `            </div>
          );
        })()}`;

if (content.includes(completadasBlockStart) && content.includes(endTareasTarget)) {
    const startIndex = content.indexOf(completadasBlockStart);
    const endIndex = content.indexOf(endTareasTarget);
    if (startIndex < endIndex) {
        // Remove everything from startIndex to the start of endTareasTarget
        content = content.slice(0, startIndex) + content.slice(endIndex);
        console.log('Old completed block removed.');
    }
} else {
    console.log('Failed to find completadasBlockStart!');
}

// Now insert the new completadas tab content right after the 'tareas' block
const completadasTabContent = `
        {activeTab === 'completadas' && (
          <div style={{ padding: '30px' }}>
            <div style={{ background: '#ecfdf5', padding: '24px', borderRadius: '16px', border: '1px solid #d1fae5', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, fontSize: '1.4rem', color: '#065f46', display: 'flex', alignItems: 'center', gap: '8px' }}>
                ✅ Labores Realizadas
              </h2>
              <p style={{ margin: '4px 0 0', color: '#047857', fontSize: '0.9rem' }}>
                {avisosCompletados.length === 0 ? 'No hay labores registradas como completadas todavía.' : \`Has completado \${avisosCompletados.length} labores en este cultivo.\`}
              </p>
            </div>

            {avisosCompletados.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '40px 20px', background: '#f8fafc',
                borderRadius: '16px', border: '1px dashed #cbd5e1', color: '#64748b'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🌱</div>
                <h4 style={{ margin: '0 0 4px', color: '#1e293b', fontSize: '1.1rem' }}>Sin labores registradas</h4>
                <p style={{ margin: 0, fontSize: '0.9rem' }}>Las labores que completes en la pestaña de tareas pendientes aparecerán aquí.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {avisosCompletados.map((ac: any, i: number) => {
                  const pautaRef = pautas.find(p => p.idlaborespauta === ac.idpauta);
                  if (!pautaRef) return null;
                  
                  let icon = pautaRef.laboresicono || '📋';
                  if (icon.startsWith('mdi-')) {
                    const MDI_TO_EMOJI: Record<string, string> = {
                      'mdi-water': '💧', 'mdi-sprout': '🌱', 'mdi-leaf': '🍃', 'mdi-flower': '🌺',
                      'mdi-tree': '🌳', 'mdi-scissors-cutting': '✂️', 'mdi-tractor': '🚜',
                      'mdi-shovel': '⛏️', 'mdi-shield-bug': '🛡️', 'mdi-spray': '💦',
                      'mdi-weather-sunny': '☀️', 'mdi-thermometer': '🌡️', 'mdi-basket': '🧺',
                      'mdi-hand-water': '🖐️', 'mdi-format-list-bulleted': '🏷️', 'mdi-bottle-tonic-plus': '🧪'
                    };
                    icon = MDI_TO_EMOJI[icon] || '🌱';
                  }

                  return (
                    <div key={i} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px 16px', display: 'flex', gap: '16px', alignItems: 'center', opacity: 0.8 }}>
                      <div style={{ fontSize: '1.5rem', filter: 'grayscale(1)' }}>{icon}</div>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: '0 0 2px', fontSize: '1rem', color: '#475569', textDecoration: 'line-through', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {pautaRef.laboresnombre}
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedAvisoForPhotos({
                                id: ac.idcultivosavisos,
                                isPending: false,
                                idpauta: ac.idpauta || ac.xcultivosavisosidpautas
                              });
                            }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', padding: 0 }}
                            title="Gestionar Fotos"
                          >📸</button>
                        </h4>
                        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                          Fase: {ac.fase}
                        </span>
                      </div>
                      <div style={{ color: '#10b981', fontWeight: 'bold' }}>
                        ✓ Hecho
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
`;

if (content.includes(endTareasTarget)) {
    content = content.replace(endTareasTarget, endTareasTarget + '\n' + completadasTabContent);
    console.log('New completadas tab injected.');
}

// 3. Improve handleMarkAsDone
const handleMarkAsDoneTarget = `          const handleMarkAsDone = async (pautaId: number, fase: string, fechaEmision: string) => {
            if (isSimulating) {
              alert('No puedes marcar tareas como completadas mientras estás usando el simulador del futuro.');
              return;
            }
            if (!userEmail) return;

            setAvisosCompletados(prev => [...prev, { idpauta: pautaId, fase }]);

            try {
              const res = await fetch('/api/user/cultivos/avisos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail },
                body: JSON.stringify({ idcultivos: cultivoId, idpauta: pautaId, fase, fechaEmision })
              });
              if (!res.ok) {
                console.error('Error guardando la labor completada');
              }
            } catch(e) {
              console.error(e);
            }
          };`;

const handleMarkAsDoneReplacement = `          const handleMarkAsDone = async (pautaId: number, fase: string, fechaEmision: string) => {
            if (isSimulating) {
              alert('No puedes marcar tareas como completadas mientras estás usando el simulador del futuro.');
              return;
            }
            if (!userEmail) return;

            // Encontrar tareas anteriores obsoletas
            const currentAlert = alertas.find((alt: any) => alt.pauta.idlaborespauta === pautaId);
            const currentName = currentAlert?.pauta?.laboresnombre;
            const currentEmisionTime = currentAlert ? new Date(currentAlert.fechaEmision).getTime() : 0;
            const FASE_ORDER: Record<string, number> = { 'general': 0, 'pregerminacion': 1, 'germinacion': 2, 'crecimiento_inicial': 3, 'crecimiento': 4, 'fructificacion': 5, 'recoleccion': 6, 'finalizacion': 7 };
            const pIdx = FASE_ORDER[fase] || 99;

            const priorAlerts = alertas.filter((alt: any) => {
              const altPhase = alt.pauta.laborespautafase || 'general';
              const altIdx = FASE_ORDER[altPhase] || 99;
              if (altIdx < pIdx) return true;
              const isSameTask = currentName && alt.pauta?.laboresnombre === currentName;
              const altEmisionTime = new Date(alt.fechaEmision).getTime();
              if (isSameTask && altIdx === pIdx && altEmisionTime < currentEmisionTime) return true;
              return false;
            });

            try {
              setLoading(true);
              const res = await fetch('/api/user/cultivos/avisos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail },
                body: JSON.stringify({ idcultivos: cultivoId, idpauta: pautaId, fase, fechaEmision })
              });
              
              let newAvisoId = null;
              if (res.ok) {
                const data = await res.json();
                newAvisoId = data.id;
              }

              // Anular obsoletas
              for (const pAlt of priorAlerts) {
                 await fetch('/api/user/cultivos/avisos', {
                   method: 'POST',
                   headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail },
                   body: JSON.stringify({ idcultivos: cultivoId, idpauta: pAlt.pauta.idlaborespauta, fase: pAlt.faseActual, fechaEmision: pAlt.fechaEmision, validado: 0 })
                 });
              }

              // Actualizar estado local
              setAvisosCompletados(prev => {
                const updated = [...prev, { idpauta: pautaId, fase, idcultivosavisos: newAvisoId, xcultivosavisosidpautas: pautaId }];
                priorAlerts.forEach((pa: any) => updated.push({ idpauta: pa.pauta.idlaborespauta, fase: pa.faseActual }));
                return updated;
              });

            } catch(e) {
              console.error(e);
            } finally {
              setLoading(false);
            }
          };`;

if (content.includes(handleMarkAsDoneTarget)) {
    content = content.replace(handleMarkAsDoneTarget, handleMarkAsDoneReplacement);
    console.log('handleMarkAsDone logic injected.');
} else {
    console.log('Failed to find handleMarkAsDoneTarget!');
}

// Convert back to original line endings if needed (optional, node handles both)
fs.writeFileSync(pagePath, content);
console.log('Fix script finished!');
