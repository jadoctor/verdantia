const fs = require('fs');

let c = fs.readFileSync('src/app/dashboard/perfil/page.tsx', 'utf8');

const insertFuncs = `
  // ── Cargar Avisos ──
  const loadAvisos = useCallback(async (email: string) => {
    setAvisosLoading(true);
    try {
      const res = await fetch(\`/api/perfil/avisos?email=\${encodeURIComponent(email)}\`);
      if (res.ok) {
        const data = await res.json();
        setAvisosConfig(data);
      }
    } catch (err) {
      console.error('Error cargando avisos:', err);
    } finally {
      setAvisosLoading(false);
    }
  }, []);

  const toggleAvisoMaestro = async (avisoId: number, currentVal: number) => {
    if (!profile || !avisosConfig) return;
    const newVal = currentVal === 1 ? 0 : 1;
    setAvisosConfig((prev: any) => ({ ...prev, userPrefs: { ...prev.userPrefs, [avisoId]: newVal } }));
    try {
      await fetch('/api/perfil/avisos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: profile.email, tipo: 'maestro', avisoId, activo: newVal })
      });
      // no mostramos toast para no saturar si hacen click rápido
    } catch { console.error('Error'); }
  };

  const toggleAvisoLabor = async (laborId: number, currentVal: number) => {
    if (!profile || !avisosConfig) return;
    const newVal = currentVal === 1 ? 0 : 1;
    setAvisosConfig((prev: any) => ({ ...prev, userLaboresPrefs: { ...prev.userLaboresPrefs, [laborId]: newVal } }));
    try {
      await fetch('/api/perfil/avisos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: profile.email, tipo: 'labor', laborId, activo: newVal })
      });
    } catch { console.error('Error'); }
  };

  useEffect(() => {`;

c = c.replace(/\n\s*useEffect\(\(\) => \{/, '\n' + insertFuncs);

const insertUI = `
          {/* ── CENTRO DE COMUNICACIONES ── */}
          <div className="optional-zone" style={{ marginTop: '20px' }}>
            <div className="optional-zone-header">
              <h3>🔔 Centro de Comunicaciones</h3>
              <p>Gestiona los canales por los que Verdantia se comunica contigo.</p>
            </div>
            
            <div className="form-grid">
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                {avisosLoading || !avisosConfig ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>Cargando preferencias...</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {avisosConfig.tiposAvisos.map((aviso: any) => {
                      const reglaEstado = avisosConfig.reglas[aviso.idtiposavisos] ?? 0;
                      let isActivo = true;
                      if (reglaEstado === 2) isActivo = false;
                      else if (reglaEstado === 1) isActivo = true;
                      else if (avisosConfig.userPrefs[aviso.idtiposavisos] === 0) isActivo = false;

                      const isTareasDelHuerto = aviso.tiposavisoscodigo === 'TAREAS';

                      return (
                        <div key={aviso.idtiposavisos} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', background: '#fff' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: reglaEstado === 2 ? '#f8fafc' : '#ffffff' }}>
                            <div>
                              <h4 style={{ margin: '0 0 4px 0', color: reglaEstado === 2 ? '#94a3b8' : '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {aviso.tiposavisosnombre}
                                {reglaEstado === 2 && <span style={{ fontSize: '0.8rem', padding: '2px 8px', background: '#e2e8f0', color: '#475569', borderRadius: '12px' }}>🔒 Bloqueado en tu plan</span>}
                                {reglaEstado === 1 && <span style={{ fontSize: '0.8rem', padding: '2px 8px', background: '#fef3c7', color: '#b45309', borderRadius: '12px' }}>Obligatorio</span>}
                              </h4>
                              <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>{aviso.tiposavisosdescripcion}</p>
                            </div>

                            <div style={{ marginLeft: '16px' }}>
                              {reglaEstado === 2 ? (
                                <button type="button" style={{ padding: '6px 12px', fontSize: '0.85rem', opacity: 0.7, border: '1px solid #cbd5e1', borderRadius: '8px', background: 'transparent' }} disabled>Bloqueado</button>
                              ) : reglaEstado === 1 ? (
                                <div style={{ width: '44px', height: '24px', background: '#10b981', borderRadius: '12px', position: 'relative', opacity: 0.6 }}>
                                  <div style={{ width: '20px', height: '20px', background: '#fff', borderRadius: '50%', position: 'absolute', top: '2px', right: '2px' }} />
                                </div>
                              ) : (
                                <div 
                                  onClick={() => toggleAvisoMaestro(aviso.idtiposavisos, isActivo ? 1 : 0)}
                                  style={{ 
                                    width: '44px', height: '24px', 
                                    background: isActivo ? '#10b981' : '#cbd5e1', 
                                    borderRadius: '12px', position: 'relative', cursor: 'pointer', transition: 'all 0.2s' 
                                  }}>
                                  <div style={{ 
                                    width: '20px', height: '20px', background: '#fff', borderRadius: '50%', position: 'absolute', top: '2px', 
                                    left: isActivo ? '22px' : '2px', transition: 'all 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' 
                                  }} />
                                </div>
                              )}
                            </div>
                          </div>

                          {isTareasDelHuerto && isActivo && (
                            <div style={{ borderTop: '1px solid #f1f5f9', padding: '16px', background: '#f8fafc' }}>
                              <p style={{ margin: '0 0 12px 0', fontSize: '0.85rem', color: '#475569', fontWeight: 600 }}>Desmarca las labores que NO te interesan (Opt-Out):</p>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
                                {avisosConfig.labores.map((labor: any) => {
                                  const laborActiva = avisosConfig.userLaboresPrefs[labor.idlabores] !== 0;
                                  return (
                                    <label key={labor.idlabores} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: '#fff', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                                      <input 
                                        type="checkbox" 
                                        checked={laborActiva}
                                        onChange={() => toggleAvisoLabor(labor.idlabores, laborActiva ? 1 : 0)}
                                        style={{ accentColor: '#10b981', width: '16px', height: '16px', cursor: 'pointer' }}
                                      />
                                      <span style={{ fontSize: '0.85rem', color: '#334155' }}>{labor.laboresnombre}</span>
                                    </label>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── CAMPOS OPCIONALES ── */}`;

c = c.replace(/\n\s*\{\/\* ── CAMPOS OPCIONALES ── \*\/\}/, '\n' + insertUI);

fs.writeFileSync('src/app/dashboard/perfil/page.tsx', c);
