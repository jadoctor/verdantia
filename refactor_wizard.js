const fs = require('fs');

const path = 'src/app/dashboard/page.tsx';
let content = fs.readFileSync(path, 'utf8');

const headerOld = `            {/* Header */}
            <div style={{
              padding: '24px 28px', borderBottom: '1px solid #e2e8f0',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: 'linear-gradient(135deg, #115e59, #0d9488)', color: 'white'
            }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span><WheatSeedIcon size="1em" /></span> Asistente de Semillas
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: '0.85rem', opacity: 0.9 }}>
                  {seedStep === 1 && 'Paso 1 de 3: Elige la hortaliza'}
                  {seedStep === 2 && \`Paso 2 de 3: Elige la variedad de \${selectedEspecie?.especiesnombre}\`}
                  {seedStep === 3 && \`Paso 3 de 3: Detalles del lote para \${selectedVariedad?.variedadesnombre}\`}
                  {seedStep === 4 && '¡Lote guardado con éxito!'}
                </p>
              </div>
              <button 
                onClick={() => setShowSeedModal(false)} 
                style={{
                  background: 'rgba(255,255,255,0.15)', 
                  border: 'none', 
                  padding: '6px 14px',
                  borderRadius: '8px', 
                  fontSize: '0.85rem', 
                  fontWeight: 'bold',
                  cursor: 'pointer', 
                  color: 'white',
                  transition: 'all 0.2s'
                }} 
                onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
                onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
              >
                Cancelar
              </button>
            </div>`;

const headerNew = `            {/* Header */}
            <div style={{
              padding: '24px 28px', borderBottom: '1px solid #e2e8f0',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: 'linear-gradient(135deg, #115e59, #0d9488)', color: 'white'
            }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span><WheatSeedIcon size="1em" /></span> Añadir Nueva Semilla
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: '0.85rem', opacity: 0.9 }}>
                  {seedStep === 4 ? '¡Lote guardado con éxito!' : 'Completa los pasos para registrar un nuevo lote'}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={() => setShowSeedModal(false)} 
                  style={{
                    background: 'rgba(255,255,255,0.15)', 
                    border: 'none', 
                    padding: '6px 14px',
                    borderRadius: '8px', 
                    fontSize: '0.85rem', 
                    fontWeight: 'bold',
                    cursor: 'pointer', 
                    color: 'white',
                    transition: 'all 0.2s'
                  }} 
                  onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
                  onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                >
                  Cancelar
                </button>
                {selectedVariedad && seedStep !== 4 && (
                  <button 
                    onClick={handleSaveSeed}
                    disabled={savingSeed}
                    style={{
                      background: 'white', color: '#0f766e', border: 'none', padding: '6px 14px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 'bold', cursor: savingSeed ? 'not-allowed' : 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }} 
                    onMouseOver={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                    onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    {savingSeed ? '⏳ Guardando...' : '💾 Guardar Lote'}
                  </button>
                )}
              </div>
            </div>`;

content = content.replace(headerOld, headerNew);

const bodyOldRegex = /\{\/\* PASO 1: Elegir especie \*\/\}[\s\S]*?\{\/\* PASO 4: ÉXITO \*\/\}[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*\)\}/;

const bodyNew = `{seedStep === 4 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                  <div style={{ fontSize: '4.5rem', marginBottom: '16px' }}>🎉</div>
                  <h3 style={{ color: '#0f766e', margin: '0 0 8px', fontSize: '1.4rem', fontWeight: 900 }}>¡Semillas Registradas!</h3>
                  <p style={{ color: '#64748b', margin: 0, fontSize: '0.95rem', lineHeight: 1.5 }}>
                    El lote se ha añadido correctamente a tu banco de semillas.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  
                  {/* FASE 1: Hortaliza */}
                  <div style={{ marginLeft: '0px' }}>
                    {selectedEspecie ? (
                      <div style={{ background: '#f0fdfa', border: '2px solid #0d9488', borderRadius: '16px', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 6px -1px rgba(13, 148, 136, 0.1)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                           <span style={{fontSize: '1.5rem'}}>✅</span>
                           <h3 style={{ margin: 0, color: '#115e59', fontSize: '1.1rem', fontWeight: 800 }}>Hortaliza: {selectedEspecie.especiesnombre}</h3>
                        </div>
                        <button onClick={() => { setSelectedEspecie(null); setSelectedVariedad(null); }} style={{ background: 'white', border: '1px solid #99f6e4', color: '#0d9488', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}>Cambiar</button>
                      </div>
                    ) : (
                      <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                        <h3 style={{ margin: '0 0 16px', color: '#0f172a', fontSize: '1.1rem', fontWeight: 800 }}>1. Selecciona una hortaliza</h3>
                        <input
                          type="text"
                          placeholder="🔍 Buscar hortaliza/especie..."
                          value={searchTerm}
                          onChange={e => setSearchTerm(e.target.value)}
                          style={{
                            width: '100%', padding: '12px 16px', borderRadius: '12px',
                            border: '2px solid #e2e8f0', fontSize: '0.95rem',
                            marginBottom: '20px', boxSizing: 'border-box',
                            outline: 'none', transition: 'all 0.2s', fontWeight: 500
                          }}
                          onFocus={e => e.target.style.borderColor = '#0d9488'}
                          onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                        />
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '14px', maxHeight: '400px', overflowY: 'auto', padding: '4px' }}>
                          {catalogoEspecies
                            .filter(esp => !searchTerm || esp.especiesnombre.toLowerCase().includes(searchTerm.toLowerCase()))
                            .map(esp => (
                              <button key={esp.idespecies} onClick={() => selectSeedEspecie(esp)} style={{
                                background: 'white', border: '2px solid #e2e8f0', borderRadius: '16px',
                                padding: '16px', cursor: 'pointer', textAlign: 'center',
                                transition: 'all 0.2s', display: 'flex', flexDirection: 'column', gap: '8px',
                                alignItems: 'center', justifyContent: 'center', minHeight: '120px'
                              }}
                                onMouseOver={e => { e.currentTarget.style.borderColor = '#0d9488'; e.currentTarget.style.background = '#f0fdfa'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                                onMouseOut={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = 'white'; e.currentTarget.style.transform = 'translateY(0)'; }}
                              >
                                {esp.foto ? (
                                  <div style={{ width: '56px', height: '56px', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
                                    <img src={getMediaUrl(esp.foto)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} crossOrigin="anonymous" />
                                  </div>
                                ) : (
                                  <SpeciesIcon icon={esp.especiesicono} size="2.2rem" />
                                )}
                                <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#1e293b' }}>{esp.especiesnombre}</span>
                              </button>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* FASE 2: Variedad */}
                  {selectedEspecie && (
                    <div style={{ marginLeft: '24px' }}>
                      {selectedVariedad ? (
                        <div style={{ background: '#eff6ff', border: '2px solid #3b82f6', borderRadius: '16px', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.1)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                             <span style={{fontSize: '1.5rem'}}>✅</span>
                             <h3 style={{ margin: 0, color: '#1e40af', fontSize: '1.1rem', fontWeight: 800 }}>Variedad: {selectedVariedad.variedadesnombre}</h3>
                          </div>
                          <button onClick={() => setSelectedVariedad(null)} style={{ background: 'white', border: '1px solid #bfdbfe', color: '#3b82f6', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}>Cambiar</button>
                        </div>
                      ) : (
                        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', animation: 'fadeInDown 0.3s' }}>
                           <h3 style={{ margin: '0 0 16px', color: '#0f172a', fontSize: '1.1rem', fontWeight: 800 }}>2. Selecciona una variedad</h3>
                           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '14px', maxHeight: '400px', overflowY: 'auto', padding: '4px' }}>
                            {catalogoVariedades.map(v => (
                              <button key={v.idvariedades} onClick={() => { setSelectedVariedad(v); setSeedStep(3); }}
                                style={{
                                  background: 'white',
                                  border: '2px solid #e2e8f0',
                                  borderRadius: '16px', padding: '16px', cursor: 'pointer',
                                  textAlign: 'left', transition: 'all 0.2s',
                                  display: 'flex', flexDirection: 'column', gap: '6px'
                                }}
                                onMouseOver={e => e.currentTarget.style.borderColor = '#3b82f6'}
                                onMouseOut={e => e.currentTarget.style.borderColor = '#e2e8f0'}
                              >
                                {v.variedadesesgenerica === 1 && <span style={{ fontSize: '0.65rem', background: '#ccfbf1', color: '#0f766e', padding: '2px 8px', borderRadius: '8px', fontWeight: 800, alignSelf: 'flex-start' }}>🏅 Común / Gold</span>}
                                {v.foto ? (
                                  <div style={{ width: '48px', height: '48px', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 2px 6px rgba(0,0,0,0.05)' }}>
                                    <img src={getMediaUrl(v.foto)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} crossOrigin="anonymous" />
                                  </div>
                                ) : (
                                  <SpeciesIcon icon={v.variedadesicono || selectedEspecie.especiesicono} size="1.8rem" />
                                )}
                                <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#1e293b' }}>{v.variedadesnombre}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* FASE 3: Procedencia y Cantidad */}
                  {selectedVariedad && (
                    <div style={{ marginLeft: '48px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', animation: 'fadeInDown 0.3s' }}>
                       <h3 style={{ margin: '0 0 20px', color: '#0f172a', fontSize: '1.2rem', fontWeight: 800 }}>3. Procedencia y Cantidad</h3>
                       <div style={{ display: 'grid', gap: '18px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#f8fafc', border: '1px dashed #cbd5e1', padding: '12px', borderRadius: '12px' }}>
                            <div style={{ background: '#e2e8f0', color: '#475569', padding: '4px 10px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 800 }}>
                              Lote Asignado Nº {seedFormData.semillasnumerocoleccion || nextNumero}
                            </div>
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Origen de las semillas</label>
                            <select 
                              value={seedFormData.semillasorigen}
                              onChange={e => setSeedFormData({ ...seedFormData, semillasorigen: e.target.value })}
                              style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.95rem', color: '#1e293b', outline: 'none' }}
                            >
                              <option value="sobre_comprado">🛒 Sobre comprado</option>
                              <option value="propia">🤲 Propia / Extraída</option>
                              <option value="intercambio">🤝 Intercambio</option>
                              <option value="regalo">🎁 Regalo</option>
                            </select>
                          </div>

                          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f766e', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              ⚖️ Calcular semillas por peso (Gramos)
                            </span>
                            {selectedEspecie?.especiespeso1000semillas && Number(selectedEspecie.especiespeso1000semillas) > 0 ? (
                              <div>
                                <p style={{ margin: '0 0 8px', fontSize: '0.8rem', color: '#64748b', lineHeight: 1.4 }}>
                                  Peso estándar: <strong>{selectedEspecie.especiespeso1000semillas}g</strong> por 1.000 semillas.
                                  <br />
                                  <span style={{ color: '#0d9488', fontWeight: 700 }}>
                                    Equivalencia: ≈ {Math.round(1000 / Number(selectedEspecie.especiespeso1000semillas))} semillas / gramo.
                                  </span>
                                </p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <input 
                                    type="number" step="0.01" min="0" placeholder="Introduce los gramos del sobre..."
                                    value={inputGramos} onChange={e => handleGramosChange(e.target.value)}
                                    style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }}
                                  />
                                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#475569' }}>gramos</span>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                  <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>Gramos</label>
                                    <input type="number" step="0.01" min="0" placeholder="Ej. 5" value={inputGramos} onChange={e => handleGramosChange(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }} />
                                  </div>
                                  <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>Semillas / Gramo</label>
                                    <input type="number" min="1" placeholder="Ej. 250" value={customSemillasPorGramo} onChange={e => { setCustomSemillasPorGramo(e.target.value); handleGramosChange(inputGramos, e.target.value); }} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }} />
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Cantidad Inicial (uds)</label>
                              <input type="number" min="1" value={seedFormData.semillasstockinicial} onChange={e => { const val = parseInt(e.target.value) || 0; setSeedFormData({ ...seedFormData, semillasstockinicial: val, semillasstockactual: val }); }} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }} />
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Stock Actual (uds)</label>
                              <input type="number" min="0" value={seedFormData.semillasstockactual} onChange={e => setSeedFormData({ ...seedFormData, semillasstockactual: parseInt(e.target.value) || 0 })} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.95rem', outline: 'none' }} />
                            </div>
                          </div>
                       </div>
                    </div>
                  )}

                  {/* FASE 4: Detalles Adicionales */}
                  {selectedVariedad && (
                    <div style={{ marginLeft: '72px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', animation: 'fadeInDown 0.3s', marginBottom: '20px' }}>
                       <h3 style={{ margin: '0 0 20px', color: '#0f172a', fontSize: '1.2rem', fontWeight: 800 }}>4. Detalles Finales</h3>
                       <div style={{ display: 'grid', gap: '18px' }}>
                          
                          {seedFormData.semillasorigen === 'sobre_comprado' && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                              <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>Marca / Comercial</label>
                                <input list="main-brands" type="text" placeholder="Ej. Batlle, Rocalba..." value={seedFormData.semillasmarca} onChange={e => setSeedFormData({ ...seedFormData, semillasmarca: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }} />
                                <datalist id="main-brands">
                                  <option value="Semillas Fitó" /><option value="Semillas Batlle" /><option value="Rocalba" /><option value="Vilmorin" /><option value="Clemente Viven" /><option value="EuroGarden" />
                                </datalist>
                              </div>
                              <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>Lugar de compra</label>
                                <input list="buy-places" type="text" placeholder="Ej. Leroy Merlin, Vivero..." value={seedFormData.semillaslugarcompra} onChange={e => setSeedFormData({ ...seedFormData, semillaslugarcompra: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }} />
                                <datalist id="buy-places">
                                  <option value="Leroy Merlin" /><option value="Verdecora" /><option value="Vivero local" /><option value="Amazon" />
                                </datalist>
                              </div>
                            </div>
                          )}

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Fecha Envasado / Cosecha</label>
                              <input type="date" value={seedFormData.semillasfechaenvasado} onChange={e => setSeedFormData({ ...seedFormData, semillasfechaenvasado: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }} />
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Fecha Caducidad / Viabilidad</label>
                              <input type="date" value={seedFormData.semillasfechacaducidad} onChange={e => setSeedFormData({ ...seedFormData, semillasfechacaducidad: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }} />
                            </div>
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Notas y Observaciones</label>
                            <textarea placeholder="Ej. Guardadas en botes herméticos con gel de sílice..." value={seedFormData.semillasobservaciones} onChange={e => setSeedFormData({ ...seedFormData, semillasobservaciones: e.target.value })} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.95rem', minHeight: '80px', fontFamily: 'inherit', resize: 'vertical' }} />
                          </div>
                       </div>
                    </div>
                  )}

                </div>
              )}
            </div>
          </div>
        </div>
      )}`;

content = content.replace(bodyOldRegex, bodyNew);

fs.writeFileSync(path, content);
console.log('Wizard refactored!');
