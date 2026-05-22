const fs = require('fs');
const pagePath = 'src/app/dashboard/cultivos/[id]/page.tsx';
let content = fs.readFileSync(pagePath, 'utf8');

content = content.replace(/\r\n/g, '\n');

// 1. Add fotosLabores state
const stateTarget = `  const [avisosCompletados, setAvisosCompletados] = useState<any[]>([]);`;
const stateReplacement = `  const [avisosCompletados, setAvisosCompletados] = useState<any[]>([]);
  const [fotosLabores, setFotosLabores] = useState<any[]>([]);`;

if (content.includes(stateTarget)) {
    content = content.replace(stateTarget, stateReplacement);
}

const loadTarget = `        setAvisosCompletados(data.avisosCompletados || []);`;
const loadReplacement = `        setAvisosCompletados(data.avisosCompletados || []);
        setFotosLabores(data.fotosLabores || []);`;

if (content.includes(loadTarget)) {
    content = content.replace(loadTarget, loadReplacement);
}

// 2. Fix Lightbox HTML at the bottom
const lightboxTarget = `      {selectedAvisoForPhotos && (
        <GestorFotosLaborModal
          aviso={selectedAvisoForPhotos}
          pautas={pautas}
          userEmail={userEmail!}
          onClose={() => setSelectedAvisoForPhotos(null)}
        />
      )}
    </div>
  );
}`;
const lightboxReplacement = `      {selectedAvisoForPhotos && (
        <GestorFotosLaborModal
          aviso={selectedAvisoForPhotos}
          pautas={pautas}
          userEmail={userEmail!}
          onClose={() => {
            setSelectedAvisoForPhotos(null);
            if (userEmail) loadCultivo(userEmail, cultivoId); // reload photos
          }}
        />
      )}

      {/* Lightbox for zooming photos */}
      {lightboxUrl && (
        <div 
          onClick={() => setLightboxUrl(null)}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.9)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out' }}
        >
          <img src={lightboxUrl} style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }} alt="Ampliación" />
        </div>
      )}
    </div>
  );
}`;

if (content.includes(lightboxTarget)) {
    content = content.replace(lightboxTarget, lightboxReplacement);
}

// 3. Fix Tareas Pendientes visual layout (collapsed/expanded text and photo button sizes)
// We will replace the entire pending task item rendering block (from "<div key={i} style={{ background: 'white'" to "</div>\n                    );")
const pendingItemRegex = /<div key=\{i\} style=\{\{ background: 'white', border: '1px solid #e2e8f0'[\s\S]*?<\/div>\n                    \);/g;

content = content.replace(pendingItemRegex, (match) => {
    return `<div key={i} style={{ background: 'white', border: '1px solid #e2e8f0', borderLeft: \`4px solid \${a.pauta.laborescolor || '#3b82f6'}\`, borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div 
                            style={{ display: 'flex', gap: '16px', alignItems: 'center', cursor: 'pointer', flex: 1 }}
                            onClick={() => setExpandedPautas(prev => prev.includes(a.pauta.idlaborespauta) ? prev.filter(id => id !== a.pauta.idlaborespauta) : [...prev, a.pauta.idlaborespauta])}
                            title="Click para ver detalles"
                          >
                            <div style={{ fontSize: '2rem' }}>{icon}</div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <h4 style={{ margin: '0 0 4px', fontSize: '1.1rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {a.pauta.laboresnombre}
                                {!expandedPautas.includes(a.pauta.idlaborespauta) && a.pauta.laborespautanotasia && (
                                  <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 'normal', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '300px' }}>
                                    — {a.pauta.laborespautanotasia}
                                  </span>
                                )}
                                <span style={{ fontSize: '0.8rem', marginLeft: 'auto', color: '#94a3b8' }}>
                                  {expandedPautas.includes(a.pauta.idlaborespauta) ? '▲' : '▼'}
                                </span>
                              </h4>
                              
                              <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                                <div style={{ fontSize: '0.8rem', color: '#64748b', background: '#f1f5f9', display: 'inline-block', padding: '2px 8px', borderRadius: '4px' }}>
                                  Fase: {a.faseActual}
                                </div>
                                {a.fechaEmision && (
                                  <div style={{ fontSize: '0.8rem', color: '#10b981', background: '#ecfdf5', display: 'inline-block', padding: '2px 8px', borderRadius: '4px', border: '1px solid #d1fae5' }}>
                                    Emitida: {new Date(a.fechaEmision).toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.4rem', padding: '4px 8px', transition: 'transform 0.2s' }}
                              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                              title="Subir fotos a esta tarea"
                            >📸</button>

                            <button 
                              onClick={() => handleMarkAsDone(a.pauta.idlaborespauta, a.faseActual, a.fechaEmision)}
                              style={{ 
                                background: isSimulating ? '#f1f5f9' : '#10b981', 
                                color: isSimulating ? '#94a3b8' : 'white', 
                                border: 'none', padding: '10px 16px', borderRadius: '8px', 
                                fontWeight: 'bold', fontSize: '0.9rem', cursor: isSimulating ? 'not-allowed' : 'pointer',
                                display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s',
                                boxShadow: isSimulating ? 'none' : '0 2px 4px rgba(16, 185, 129, 0.2)'
                              }}
                              title={isSimulating ? 'Desactiva el simulador para marcar tareas' : 'Marcar labor como completada'}
                            >
                              ✓ Completado
                            </button>
                          </div>
                        </div>
                        
                        {expandedPautas.includes(a.pauta.idlaborespauta) && (
                          <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px', animation: 'fadeIn 0.2s ease-in-out', borderTop: '1px dashed #e2e8f0', paddingTop: '12px' }}>
                            {a.pauta.laborespautanotasia && (
                              <div style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#334155', fontSize: '0.9rem', lineHeight: '1.5' }}>
                                <strong style={{ display: 'block', marginBottom: '4px', color: '#1e293b' }}>Indicaciones:</strong>
                                {a.pauta.laborespautanotasia}
                              </div>
                            )}
                            {a.pauta.laboresdescripcion && (
                              <p style={{ margin: 0, padding: '0 8px', fontSize: '0.9rem', color: '#475569', fontStyle: 'italic' }}>
                                {a.pauta.laboresdescripcion}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );`;
});


// 4. Rewrite 'completadas' block entirely!
const completadasTabRegex = /\{activeTab === 'completadas' && \([\s\S]*?\)\}\n/g;

const newCompletadasBlock = `{activeTab === 'completadas' && (() => {
          const FASE_NAMES: Record<string, string> = {
            'general': 'General', 'presiembra': 'Pre-Siembra', 'siembra': 'Siembra', 
            'pregerminacion': 'Pre-Germinación', 'germinacion': 'Germinación', 
            'trasplante': 'Trasplante', 'crecimiento_inicial': 'Crecimiento Inicial', 
            'crecimiento': 'Crecimiento Firme', 'fructificacion': 'Fructificación', 
            'recoleccion': 'Recolección', 'finalizacion': 'Finalización'
          };
          
          const FASE_ORDER: Record<string, number> = {
            'general': 0, 'presiembra': 1, 'siembra': 2, 'pregerminacion': 3, 
            'germinacion': 4, 'trasplante': 5, 'crecimiento_inicial': 6, 
            'crecimiento': 7, 'fructificacion': 8, 'recoleccion': 9, 'finalizacion': 10
          };

          const groupedCompletadas = avisosCompletados.reduce((acc: any, ac: any) => {
            const phase = ac.fase || 'general';
            if (!acc[phase]) acc[phase] = [];
            acc[phase].push(ac);
            return acc;
          }, {});

          const sortedPhases = Object.keys(groupedCompletadas).sort((a, b) => (FASE_ORDER[a] || 99) - (FASE_ORDER[b] || 99));

          return (
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                {sortedPhases.map((phase: string) => {
                  const phaseCompletadas = groupedCompletadas[phase];
                  const phaseName = FASE_NAMES[phase] || phase.replace('_', ' ');
                  const phaseIconMap: Record<string, string> = {
                    'general': '📋', 'presiembra': '🕳️', 'siembra': '🌱', 'pregerminacion': '💧',
                    'germinacion': '🌿', 'trasplante': '🪴', 'crecimiento_inicial': '🪴',
                    'crecimiento': '🌳', 'fructificacion': '🌸', 'recoleccion': '🍅', 'finalizacion': '🛑'
                  };
                  const pIcon = phaseIconMap[phase] || '📋';

                  return (
                    <div key={phase} style={{ background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                      <div 
                        onClick={() => setExpandedPautas(prev => prev.includes(phase.hashCode?.() || phase.length) ? prev.filter(id => id !== (phase.hashCode?.() || phase.length)) : [...prev, phase.hashCode?.() || phase.length])}
                        style={{ padding: '16px 20px', background: 'white', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid #e2e8f0', cursor: 'pointer' }}
                      >
                        <div style={{ fontSize: '1.6rem' }}>{pIcon}</div>
                        <div>
                          <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#1e293b' }}>Fase: {phaseName}</h3>
                          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{phaseCompletadas.length} labores</span>
                        </div>
                        <div style={{ marginLeft: 'auto', color: '#94a3b8' }}>
                           {expandedPautas.includes(phase.hashCode?.() || phase.length) ? '▲' : '▼'}
                        </div>
                      </div>

                      {!expandedPautas.includes(phase.hashCode?.() || phase.length) && (
                        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          {phaseCompletadas.map((ac: any, i: number) => {
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

                            // Fotos asociadas a esta tarea
                            const fotosAsociadas = fotosLabores.filter((f: any) => 
                              (f.idAviso && f.idAviso === ac.idcultivosavisos) || 
                              (!f.idAviso && ac.idpauta && f.resumen && f.resumen.includes(\`"idpauta":\${ac.idpauta}\`))
                            );

                            return (
                              <div key={i} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                                <div style={{ padding: '12px 16px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                                  <div style={{ fontSize: '1.8rem', filter: 'grayscale(0.8)' }}>{icon}</div>
                                  <div style={{ flex: 1 }}>
                                    <h4 style={{ margin: '0 0 2px', fontSize: '1.1rem', color: '#475569', textDecoration: 'line-through', display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', padding: 0 }}
                                        title={fotosAsociadas.length > 0 ? "Ver o Editar Fotos" : "📸 Añadir Foto"}
                                      >📸</button>
                                    </h4>
                                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                      Fecha: {ac.fechaRealizacion ? new Date(ac.fechaRealizacion).toLocaleDateString() : 'Registrada'}
                                    </span>
                                  </div>
                                  <div style={{ color: '#10b981', fontWeight: 'bold' }}>
                                    ✓ Completado
                                  </div>
                                </div>

                                {/* Fotos Section */}
                                {fotosAsociadas.length > 0 && (
                                  <div style={{ padding: '0 16px 16px 16px', display: 'flex', gap: '8px', overflowX: 'auto' }}>
                                    {fotosAsociadas.map((f: any, fIdx: number) => (
                                      <img 
                                        key={fIdx}
                                        src={getMediaUrl(f.ruta)} 
                                        alt="Foto Labor"
                                        style={{ height: '80px', width: '80px', objectFit: 'cover', borderRadius: '8px', border: f.esPrincipal ? '2px solid #3b82f6' : '1px solid #cbd5e1', cursor: 'zoom-in' }}
                                        onClick={() => setLightboxUrl(getMediaUrl(f.ruta))}
                                      />
                                    ))}
                                  </div>
                                )}
                                
                                {/* Descripciones */}
                                <div style={{ padding: '12px 16px', background: '#f1f5f9', borderTop: '1px solid #e2e8f0', fontSize: '0.9rem', color: '#475569' }}>
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
                  );
                })}
              </div>
            )}
          </div>
          );
        })()}
`;

content = content.replace(completadasTabRegex, newCompletadasBlock);

fs.writeFileSync(pagePath, content);
console.log('UI Restoration script finished!');
