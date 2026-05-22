const fs = require('fs');
const pagePath = 'src/app/dashboard/cultivos/[id]/page.tsx';
let content = fs.readFileSync(pagePath, 'utf8');

// Normalize newlines
content = content.replace(/\r\n/g, '\n');

// 1. Imports
if (!content.includes('import InlineLaborPhotos')) {
  content = content.replace("import { processAlertas } from '@/lib/alertas-utils';", "import { processAlertas } from '@/lib/alertas-utils';\nimport InlineLaborPhotos from './InlineLaborPhotos';");
}

// 2. State
content = content.replace("const [activeTab, setActiveTab] = useState<'ficha' | 'tareas'>('ficha');", "const [activeTab, setActiveTab] = useState<'ficha' | 'tareas' | 'completadas'>('ficha');");
if (!content.includes('expandedPhases')) {
  content = content.replace("const [expandedPautas, setExpandedPautas] = useState<number[]>([]);", "const [expandedPautas, setExpandedPautas] = useState<number[]>([]);\n  const [expandedPhases, setExpandedPhases] = useState<string[]>([]);");
}

// 3. Navigation
const navTarget = `<button 
            onClick={() => setActiveTab('tareas')}`;
const navEnd = `📋 Tareas Programadas
          </button>`;
const navIndex1 = content.indexOf(navTarget);
const navIndex2 = content.indexOf(navEnd) + navEnd.length;

if (navIndex1 !== -1 && navIndex2 !== -1 && !content.includes('Labores Realizadas')) {
  const oldNavButton = content.substring(navIndex1, navIndex2);
  const newNavButton = oldNavButton + `
          <button 
            onClick={() => setActiveTab('completadas')}
            style={{ 
              padding: '8px 16px', borderRadius: '8px', fontWeight: 'bold', border: 'none', cursor: 'pointer', transition: 'all 0.2s',
              background: activeTab === 'completadas' ? '#10b981' : 'white',
              color: activeTab === 'completadas' ? 'white' : '#64748b',
              boxShadow: activeTab === 'completadas' ? '0 2px 4px rgba(16, 185, 129, 0.3)' : '0 1px 2px rgba(0,0,0,0.05)'
            }}
          >
            ✅ Labores Realizadas
          </button>`;
  content = content.substring(0, navIndex1) + newNavButton + content.substring(navIndex2);
}

// 4. Extract the Tareas Section
const tareasStart = `{activeTab === 'tareas' && (`;
const tareasIndex = content.indexOf(tareasStart);

// The Tareas section ends near the end of the file.
// Let's find the trailing tags of the file:
const fileEndTarget = `</div>\n    </div>\n  );\n}`;
const fileEndIndex = content.lastIndexOf(fileEndTarget);

if (tareasIndex !== -1 && fileEndIndex !== -1) {
  // We will replace EVERYTHING from tareasIndex to fileEndIndex with our newly crafted UI.
  
  const newUI = `{activeTab === 'tareas' && (
          <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                📋 Tareas Programadas
              </h2>
            </div>
            
            {pendingAvisos.length === 0 ? (
              <div style={{ background: 'white', borderRadius: '16px', padding: '40px 20px', textAlign: 'center', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🎉</div>
                <h3 style={{ margin: '0 0 8px', color: '#334155' }}>¡Todo al día!</h3>
                <p style={{ margin: 0, color: '#64748b' }}>No tienes tareas pendientes para este cultivo en este momento.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {pendingAvisos.map((a: any, i: number) => {
                  let icon = a.pauta.laboresicono || '📋';
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

                  const isExpanded = expandedPautas.includes(a.pauta.idlaborespauta);

                  return (
                    <div key={i} style={{ background: 'white', border: '1px solid #e2e8f0', borderLeft: \`4px solid \${a.pauta.laborescolor || '#3b82f6'}\`, borderRadius: '12px', padding: '0', display: 'flex', flexDirection: 'column', overflow: 'hidden', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                      
                      {/* Compact Header */}
                      <div 
                        style={{ padding: '16px', display: 'flex', gap: '16px', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', background: isExpanded ? '#f8fafc' : 'white' }}
                        onClick={() => setExpandedPautas(prev => isExpanded ? prev.filter(id => id !== a.pauta.idlaborespauta) : [...prev, a.pauta.idlaborespauta])}
                      >
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flex: 1 }}>
                          <div style={{ fontSize: '2rem' }}>{icon}</div>
                          <div>
                            <h4 style={{ margin: '0 0 4px', fontSize: '1.1rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {a.pauta.laboresnombre}
                            </h4>
                            
                            {!isExpanded && a.pauta.laborespautanotasia && (
                              <div style={{ margin: '4px 0 0 0', fontSize: '0.9rem', color: '#0f172a', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                — {a.pauta.laborespautanotasia.substring(0, 100)}...
                              </div>
                            )}

                            <div style={{ display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
                              <div style={{ fontSize: '0.75rem', color: '#64748b', background: '#f1f5f9', display: 'inline-block', padding: '2px 8px', borderRadius: '12px', fontWeight: '500' }}>
                                Fase: {a.faseActual}
                              </div>
                              {a.fechaEmision && (
                                <div style={{ fontSize: '0.75rem', color: '#b45309', background: '#fef3c7', display: 'inline-block', padding: '2px 8px', borderRadius: '12px', fontWeight: '500' }}>
                                  Emitida: {new Date(a.fechaEmision).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsDone(a.pauta.idlaborespauta, a.faseActual, a.fechaEmision);
                            }}
                            style={{ 
                              background: isSimulating ? '#f1f5f9' : '#10b981', 
                              color: isSimulating ? '#94a3b8' : 'white', 
                              border: 'none', padding: '8px 16px', borderRadius: '8px', 
                              fontWeight: 'bold', fontSize: '0.9rem', cursor: isSimulating ? 'not-allowed' : 'pointer',
                              display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s',
                              boxShadow: isSimulating ? 'none' : '0 2px 4px rgba(16, 185, 129, 0.2)'
                            }}
                            title={isSimulating ? 'Desactiva el simulador para marcar tareas' : 'Marcar labor como completada'}
                          >
                            ✓ Completar
                          </button>
                          <span style={{ color: '#94a3b8', padding: '4px' }}>
                            {isExpanded ? '▲' : '▼'}
                          </span>
                        </div>
                      </div>
                      
                      {/* Expanded Details */}
                      {isExpanded && (
                        <div>
                          <div style={{ padding: '0 16px 16px 16px' }}>
                            <InlineLaborPhotos 
                              isPending={true}
                              idcultivos={cultivoId}
                              idpauta={a.pauta.idlaborespauta}
                              fechaEmision={a.fechaEmision}
                              userEmail={userEmail!}
                              setLightboxUrl={setLightboxUrl}
                            />
                          </div>
                          <div style={{ padding: '16px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', color: '#334155', fontSize: '0.95rem' }}>
                            {a.pauta.laborespautanotasia && (
                              <div style={{ marginBottom: '12px', color: '#0f172a', fontWeight: '500', lineHeight: '1.6' }}>
                                {a.pauta.laborespautanotasia}
                              </div>
                            )}
                            <div style={{ fontStyle: 'italic', color: '#64748b', fontSize: '0.9rem' }}>
                              {a.pauta.laboresdescripcion || 'Sin descripción general.'}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'completadas' && (() => {
          const FASE_ORDER = [
            'Semillero', 'Germinación', 'Desarrollo Inicial', 'Crecimiento Firme',
            'Pre-floración', 'Floración', 'Desarrollo del Fruto', 'Cosecha Temprana',
            'Plena Cosecha', 'Cosecha Tardía', 'Senescencia', 'Post-cosecha'
          ];
          const FASE_NAMES: Record<string, string> = {
            'semillero': 'Semillero', 'germinacion': 'Germinación', 'desarrollo_inicial': 'Desarrollo Inicial',
            'crecimiento': 'Crecimiento Firme', 'pre_floracion': 'Pre-floración', 'floracion': 'Floración',
            'desarrollo_fruto': 'Desarrollo del Fruto', 'cosecha_temprana': 'Cosecha Temprana',
            'plena_cosecha': 'Plena Cosecha', 'cosecha_tardia': 'Cosecha Tardía',
            'senescencia': 'Senescencia', 'post_cosecha': 'Post-cosecha', 'mantenimiento': 'Mantenimiento General',
            'general': 'Mantenimiento General'
          };
          
          const grouped = avisosCompletados.reduce((acc: any, ac: any) => {
            const phaseStr = ac.fase || 'general';
            const phaseKey = phaseStr.toLowerCase();
            const displayName = FASE_NAMES[phaseKey] || phaseStr;
            if (!acc[displayName]) acc[displayName] = [];
            acc[displayName].push(ac);
            return acc;
          }, {});

          const sortedPhases = Object.keys(grouped).sort((a, b) => {
            const idxA = FASE_ORDER.indexOf(a);
            const idxB = FASE_ORDER.indexOf(b);
            if (idxA !== -1 && idxB !== -1) return idxA - idxB;
            if (idxA !== -1) return -1;
            if (idxB !== -1) return 1;
            return a.localeCompare(b);
          });

          return (
          <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
            <h2 style={{ margin: '0 0 24px', fontSize: '1.5rem', color: '#065f46', display: 'flex', alignItems: 'center', gap: '8px' }}>
              ✅ Labores Realizadas
            </h2>
            
            {sortedPhases.length === 0 ? (
              <div style={{ background: 'white', borderRadius: '16px', padding: '40px 20px', textAlign: 'center', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🌱</div>
                <h3 style={{ margin: '0 0 8px', color: '#334155' }}>Aún no hay labores completadas</h3>
                <p style={{ margin: 0, color: '#64748b' }}>Las tareas que vayas marcando aparecerán organizadas aquí.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {sortedPhases.map(phase => (
                  <div key={phase} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                    <div 
                      style={{ padding: '16px', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', borderBottom: expandedPhases.includes(phase) ? '1px solid #e2e8f0' : 'none' }}
                      onClick={() => setExpandedPhases(prev => prev.includes(phase) ? prev.filter(p => p !== phase) : [...prev, phase])}
                    >
                      <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        🌿 {phase}
                        <span style={{ fontSize: '0.8rem', background: '#e2e8f0', color: '#475569', padding: '2px 8px', borderRadius: '12px' }}>
                          {grouped[phase].length}
                        </span>
                      </h3>
                      <span style={{ color: '#94a3b8' }}>{expandedPhases.includes(phase) ? '▲' : '▼'}</span>
                    </div>

                    {expandedPhases.includes(phase) && (
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {grouped[phase].map((ac: any, i: number) => {
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
                            <div key={i} style={{ padding: '0', borderBottom: i < grouped[phase].length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                              <div style={{ padding: '16px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                                <div style={{ fontSize: '1.5rem', filter: 'grayscale(1)', opacity: 0.7 }}>{icon}</div>
                                <div style={{ flex: 1 }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <h4 style={{ margin: '0 0 2px', fontSize: '1.1rem', color: '#475569', textDecoration: 'line-through' }}>
                                      {pautaRef.laboresnombre}
                                    </h4>
                                    <div style={{ color: '#10b981', fontWeight: 'bold' }}>
                                      ✓ Completado
                                    </div>
                                  </div>
                                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                    Fecha: {ac.fechaRealizacion ? new Date(ac.fechaRealizacion).toLocaleDateString() : 'Registrada'}
                                  </span>
                                </div>
                              </div>

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
                              
                              <div style={{ padding: '12px 16px', background: '#f8fafc', borderTop: '1px solid #f1f5f9', fontSize: '0.9rem', color: '#475569' }}>
                                {pautaRef.laborespautanotasia && (
                                  <div style={{ marginBottom: '6px', fontWeight: 'bold', color: '#334155' }}>
                                    {pautaRef.laborespautanotasia}
                                  </div>
                                )}
                                <div style={{ fontStyle: 'italic' }}>
                                  {pautaRef.laboresdescripcion || 'Sin descripción general.'}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          );
        })()}
\n`;

  content = content.substring(0, tareasIndex) + newUI + content.substring(fileEndIndex);
  
  fs.writeFileSync(pagePath, content);
  console.log('Patch complete!');
} else {
  console.log('Error: Could not find indices');
}
