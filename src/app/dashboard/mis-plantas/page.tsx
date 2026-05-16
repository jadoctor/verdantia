'use client';

import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { getMediaUrl } from '@/lib/media-url';

interface Planta {
  idvariedades: number;
  nombre: string;
  descripcion: string;
  icono: string;
  dificultad: string;
  especiesnombre: string;
  especiesicono: string;
  nombre_gold: string;
  es_generica: number;
  foto: string | null;
  campos_personalizados: number;
}

interface CatalogoEspecie {
  idespecies: number;
  especiesnombre: string;
  especiesnombrecientifico: string;
  especiesfamilia: string;
  especiestipo: string;
  especiesicono: string;
  especiesdescripcion: string;
  especiesdificultad: string;
  foto: string | null;
  total_variedades: number;
}

interface CatalogoVariedad {
  idvariedades: number;
  variedadesnombre: string;
  variedadesdescripcion: string;
  variedadesicono: string;
  variedadesesgenerica: number;
  variedadesdificultad: string;
  foto: string | null;
}

export default function MisPlantasPage() {
  const [plantas, setPlantas] = useState<Planta[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const router = useRouter();

  // Wizard state
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [catalogoEspecies, setCatalogoEspecies] = useState<CatalogoEspecie[]>([]);
  const [catalogoVariedades, setCatalogoVariedades] = useState<CatalogoVariedad[]>([]);
  const [selectedEspecie, setSelectedEspecie] = useState<CatalogoEspecie | null>(null);
  const [selectedVariedad, setSelectedVariedad] = useState<CatalogoVariedad | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [acquiring, setAcquiring] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) { router.push('/login'); return; }
      setUserEmail(user.email);
    });
    return () => unsub();
  }, [router]);

  useEffect(() => {
    if (userEmail) loadPlantas();
  }, [userEmail]);

  const loadPlantas = async () => {
    try {
      const res = await fetch('/api/user/plantas', { headers: { 'x-user-email': userEmail! } });
      if (res.ok) {
        const data = await res.json();
        setPlantas(data.plantas || []);
      }
    } catch (e) { console.error('Error loading plantas:', e); }
    finally { setLoading(false); }
  };

  const openWizard = async () => {
    setWizardOpen(true);
    setWizardStep(1);
    setSelectedEspecie(null);
    setSelectedVariedad(null);
    setSearchTerm('');
    try {
      const res = await fetch('/api/user/catalogo', { headers: { 'x-user-email': userEmail! } });
      if (res.ok) {
        const data = await res.json();
        setCatalogoEspecies(data.especies || []);
      }
    } catch (e) { console.error('Error loading catalogo:', e); }
  };

  const selectEspecie = async (esp: CatalogoEspecie) => {
    setSelectedEspecie(esp);
    setWizardStep(2);
    try {
      const res = await fetch(`/api/user/catalogo/${esp.idespecies}/variedades`, { headers: { 'x-user-email': userEmail! } });
      if (res.ok) {
        const data = await res.json();
        const vars = data.variedades || [];
        setCatalogoVariedades(vars);
        // Si solo hay Gold, preseleccionar y saltar al paso 3
        if (vars.length === 1) {
          setSelectedVariedad(vars[0]);
          setWizardStep(3);
        } else if (vars.length > 0) {
          // Preseleccionar la genérica (Gold)
          const gold = vars.find((v: CatalogoVariedad) => v.variedadesesgenerica === 1);
          if (gold) setSelectedVariedad(gold);
        }
      }
    } catch (e) { console.error('Error loading variedades:', e); }
  };

  const confirmAcquisition = async (startCultivo: boolean) => {
    if (!selectedEspecie || acquiring) return;
    setAcquiring(true);
    try {
      const res = await fetch('/api/user/plantas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail! },
        body: JSON.stringify({
          especieId: selectedEspecie.idespecies,
          variedadId: selectedVariedad?.idvariedades || null
        })
      });
      if (res.ok) {
        const data = await res.json();
        setWizardOpen(false);
        await loadPlantas();
        // Redirigir al detalle con o sin la intención de iniciar cultivo
        router.push(`/dashboard/mis-plantas/${data.id}${startCultivo ? '?startCultivo=true' : ''}`);
      } else {
        const err = await res.json();
        alert(err.error || 'Error al adquirir la planta');
      }
    } catch (e) { console.error('Error acquiring:', e); }
    finally { setAcquiring(false); }
  };

  const deletePlanta = async (id: number) => {
    if (!confirm('¿Seguro que quieres eliminar esta planta de tu huerto?')) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/user/plantas/${id}`, {
        method: 'DELETE',
        headers: { 'x-user-email': userEmail! }
      });
      if (res.ok) {
        setPlantas(prev => prev.filter(p => p.idvariedades !== id));
      }
    } catch (e) { console.error('Error deleting:', e); }
    finally { setDeleting(null); }
  };

  const filteredEspecies = catalogoEspecies.filter(e =>
    !searchTerm || e.especiesnombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (e.especiesnombrecientifico && e.especiesnombrecientifico.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) return <p className="loading-text">Cargando tus plantas...</p>;

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.6rem', color: 'var(--text-primary)' }}>🌱 Mis Hortalizas</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {plantas.length} {plantas.length === 1 ? 'planta' : 'plantas'} en tu huerto
          </p>
        </div>
        <button
          onClick={openWizard}
          style={{
            background: 'linear-gradient(135deg, #10b981, #059669)',
            color: 'white', border: 'none', padding: '12px 24px',
            borderRadius: '12px', fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '8px',
            fontSize: '0.95rem', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
            transition: 'all 0.2s'
          }}
          onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          ➕ Añadir nueva planta
        </button>
      </div>

      {/* Estado vacío */}
      {plantas.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '4rem 2rem',
          background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
          borderRadius: '16px', border: '2px dashed #86efac'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🌿</div>
          <h2 style={{ color: '#166534', margin: '0 0 8px' }}>Tu huerto está vacío</h2>
          <p style={{ color: '#15803d', maxWidth: 400, margin: '0 auto 1.5rem', lineHeight: 1.6 }}>
            Empieza añadiendo tu primera planta. Podrás personalizar sus datos, labores y calendario.
          </p>
          <button
            onClick={openWizard}
            style={{
              background: '#10b981', color: 'white', border: 'none',
              padding: '14px 28px', borderRadius: '12px', fontWeight: 700,
              cursor: 'pointer', fontSize: '1rem'
            }}
          >
            🌱 Añadir mi primera planta
          </button>
        </div>
      )}

      {/* Grid de plantas */}
      {plantas.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {plantas.map(p => (
            <div key={p.idvariedades} style={{
              background: 'var(--bg-card)', borderRadius: '16px',
              border: '1px solid var(--border-color)', overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)', transition: 'all 0.2s',
              cursor: 'pointer', position: 'relative'
            }}
              onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)'; }}
              onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'; }}
              onClick={() => router.push(`/dashboard/mis-plantas/${p.idvariedades}`)}
            >
              {/* Header de la tarjeta */}
              <div style={{ padding: '12px 16px', background: '#f8fafc', borderBottom: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '2px', paddingRight: '40px' }}>
                <span style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 700 }}>
                  {p.especiesnombre}
                </span>
                {!p.es_generica && (
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    🏷️ {p.nombre_gold}
                  </span>
                )}
              </div>

              {/* Foto */}
              <div style={{ height: 160, background: p.foto ? '#000' : 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
                {p.foto && (
                  <img src={getMediaUrl(p.foto)} alt={p.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} crossOrigin="anonymous" />
                )}
              </div>

              {/* Info */}
              <div style={{ padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>{p.nombre}</h3>
                </div>
                
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {p.campos_personalizados > 0 && (
                    <span 
                      style={{ fontSize: '0.7rem', background: '#ede9fe', color: '#6d28d9', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}
                      title={`${p.campos_personalizados} dato(s) agronómico(s) modificado(s) por ti frente a la ficha estándar.`}
                    >
                      ✏️ {p.campos_personalizados} dato{p.campos_personalizados > 1 ? 's' : ''} modificado{p.campos_personalizados > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>

              {/* Delete button */}
              <button
                onClick={(e) => { e.stopPropagation(); deletePlanta(p.idvariedades); }}
                disabled={deleting === p.idvariedades}
                style={{
                  position: 'absolute', top: 8, right: 8,
                  background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none',
                  width: 28, height: 28, borderRadius: '50%',
                  cursor: 'pointer', fontSize: '0.75rem', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', opacity: 0.6,
                  transition: 'opacity 0.2s'
                }}
                onMouseOver={e => e.currentTarget.style.opacity = '1'}
                onMouseOut={e => e.currentTarget.style.opacity = '0.6'}
                title="Eliminar del huerto"
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ═══════════════════════════════════════ */}
      {/* WIZARD: Añadir nueva planta             */}
      {/* ═══════════════════════════════════════ */}
      {wizardOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px'
        }} onClick={() => setWizardOpen(false)}>
          <div style={{
            background: 'white', borderRadius: '20px', maxWidth: 700, width: '100%',
            maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }} onClick={e => e.stopPropagation()}>

            {/* Wizard header */}
            <div style={{
              padding: '20px 24px', borderBottom: '1px solid #e2e8f0',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: 'linear-gradient(135deg, #f0fdf4, #ecfdf5)'
            }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#166534' }}>🌱 Añadir nueva planta</h2>
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  {[1, 2, 3].map(s => (
                    <div key={s} style={{
                      width: 80, height: 4, borderRadius: 2,
                      background: s <= wizardStep ? '#10b981' : '#d1d5db',
                      transition: 'background 0.3s'
                    }} />
                  ))}
                </div>
                <p style={{ margin: '6px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                  Paso {wizardStep} de 3: {wizardStep === 1 ? 'Elige especie' : wizardStep === 2 ? 'Elige variedad' : 'Confirmar'}
                </p>
              </div>
              <button onClick={() => setWizardOpen(false)} style={{
                background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#94a3b8'
              }}>✕</button>
            </div>

            {/* Wizard body */}
            <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>

              {/* PASO 1: Elegir especie */}
              {wizardStep === 1 && (
                <>
                  <input
                    type="text"
                    placeholder="🔍 Buscar especie..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    style={{
                      width: '100%', padding: '12px 16px', borderRadius: '12px',
                      border: '2px solid #e2e8f0', fontSize: '0.95rem',
                      marginBottom: '16px', boxSizing: 'border-box',
                      outline: 'none', transition: 'border-color 0.2s'
                    }}
                    onFocus={e => e.target.style.borderColor = '#10b981'}
                    onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                  />
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                    {filteredEspecies.map(esp => (
                      <button key={esp.idespecies} onClick={() => selectEspecie(esp)} style={{
                        background: 'white', border: '2px solid #e2e8f0', borderRadius: '12px',
                        padding: '16px', cursor: 'pointer', textAlign: 'left',
                        transition: 'all 0.2s', display: 'flex', flexDirection: 'column', gap: '8px'
                      }}
                        onMouseOver={e => { e.currentTarget.style.borderColor = '#10b981'; e.currentTarget.style.background = '#f0fdf4'; }}
                        onMouseOut={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = 'white'; }}
                      >
                        {esp.foto ? (
                          <div style={{ width: '64px', height: '64px', borderRadius: '10px', overflow: 'hidden', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                            <img src={getMediaUrl(esp.foto)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} crossOrigin="anonymous" />
                          </div>
                        ) : (
                          <span style={{ fontSize: '2.5rem' }}>{esp.especiesicono || '🌱'}</span>
                        )}
                        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>{esp.especiesnombre}</span>
                        {esp.especiesnombrecientifico && (
                          <span style={{ fontSize: '0.75rem', color: '#64748b', fontStyle: 'italic' }}>{esp.especiesnombrecientifico}</span>
                        )}
                        <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                          {esp.total_variedades} variedad{esp.total_variedades !== 1 ? 'es' : ''}
                        </span>
                      </button>
                    ))}
                  </div>
                  {filteredEspecies.length === 0 && (
                    <p style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>No se encontraron especies</p>
                  )}
                </>
              )}

              {/* PASO 2: Elegir variedad */}
              {wizardStep === 2 && selectedEspecie && (
                <>
                  <button onClick={() => { setWizardStep(1); setSelectedVariedad(null); }}
                    style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', marginBottom: '12px', fontSize: '0.85rem' }}>
                    ← Volver a especies
                  </button>
                  <h3 style={{ margin: '0 0 16px', color: '#0f172a' }}>
                    {selectedEspecie.especiesicono} {selectedEspecie.especiesnombre} — Elige variedad
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                    {catalogoVariedades.map(v => (
                      <button key={v.idvariedades} onClick={() => { setSelectedVariedad(v); setWizardStep(3); }}
                        style={{
                          background: selectedVariedad?.idvariedades === v.idvariedades ? '#f0fdf4' : 'white',
                          border: `2px solid ${selectedVariedad?.idvariedades === v.idvariedades ? '#10b981' : '#e2e8f0'}`,
                          borderRadius: '12px', padding: '16px', cursor: 'pointer',
                          textAlign: 'left', transition: 'all 0.2s',
                          display: 'flex', flexDirection: 'column', gap: '6px'
                        }}
                        onMouseOver={e => e.currentTarget.style.borderColor = '#10b981'}
                        onMouseOut={e => { if (selectedVariedad?.idvariedades !== v.idvariedades) e.currentTarget.style.borderColor = '#e2e8f0'; }}
                      >
                        {v.variedadesesgenerica === 1 && <span style={{ fontSize: '0.7rem', background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: '8px', fontWeight: 700, alignSelf: 'flex-start' }}>🏅 Recomendada</span>}
                        {v.foto ? (
                          <div style={{ width: '56px', height: '56px', borderRadius: '10px', overflow: 'hidden', flexShrink: 0, boxShadow: '0 2px 6px rgba(0,0,0,0.05)' }}>
                            <img src={getMediaUrl(v.foto)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} crossOrigin="anonymous" />
                          </div>
                        ) : selectedEspecie.foto ? (
                          <div style={{ width: '56px', height: '56px', borderRadius: '10px', overflow: 'hidden', flexShrink: 0, boxShadow: '0 2px 6px rgba(0,0,0,0.05)' }}>
                            <img src={getMediaUrl(selectedEspecie.foto)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} crossOrigin="anonymous" />
                          </div>
                        ) : (
                          <span style={{ fontSize: '2rem' }}>{v.variedadesicono || selectedEspecie.especiesicono || '🌱'}</span>
                        )}
                        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>{v.variedadesnombre}</span>
                        {v.variedadesdescripcion && <span style={{ fontSize: '0.75rem', color: '#64748b', lineHeight: 1.4 }}>{v.variedadesdescripcion.substring(0, 80)}...</span>}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* PASO 3: Confirmar */}
              {wizardStep === 3 && selectedEspecie && (
                <>
                  <button onClick={() => setWizardStep(catalogoVariedades.length > 1 ? 2 : 1)}
                    style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', marginBottom: '12px', fontSize: '0.85rem' }}>
                    ← Volver
                  </button>
                  <div style={{
                    textAlign: 'center', padding: '2rem',
                    background: 'linear-gradient(135deg, #f0fdf4, #ecfdf5)',
                    borderRadius: '16px', border: '1px solid #bbf7d0'
                  }}>
                    <div style={{ fontSize: '5rem', marginBottom: '16px' }}>
                      {selectedVariedad?.foto ? (
                        <div style={{ width: '120px', height: '120px', borderRadius: '24px', overflow: 'hidden', margin: '0 auto', boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}>
                          <img src={getMediaUrl(selectedVariedad.foto)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} crossOrigin="anonymous" />
                        </div>
                      ) : selectedEspecie.foto ? (
                        <div style={{ width: '120px', height: '120px', borderRadius: '24px', overflow: 'hidden', margin: '0 auto', boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}>
                          <img src={getMediaUrl(selectedEspecie.foto)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} crossOrigin="anonymous" />
                        </div>
                      ) : (
                        selectedVariedad?.variedadesicono || selectedEspecie.especiesicono || '🌱'
                      )}
                    </div>
                    <h3 style={{ margin: '0 0 4px', color: '#166534', fontSize: '1.3rem' }}>
                      {selectedVariedad?.variedadesnombre || selectedEspecie.especiesnombre}
                    </h3>
                    <p style={{ color: '#15803d', margin: '0 0 20px', fontSize: '0.9rem' }}>
                      Especie: {selectedEspecie.especiesnombre}
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: 350, margin: '0 auto 24px', textAlign: 'left' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#166534' }}>
                        <span>✅</span> Datos agronómicos heredados de la especie
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#166534' }}>
                        <span>✅</span> Pautas de labores predefinidas
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#166534' }}>
                        <span>✅</span> Personalizable en cualquier momento
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                      <button onClick={() => confirmAcquisition(false)} disabled={acquiring}
                        style={{
                          background: 'white', color: '#10b981', border: '2px solid #10b981', padding: '12px 24px',
                          borderRadius: '12px', fontWeight: 600, cursor: acquiring ? 'not-allowed' : 'pointer',
                          fontSize: '0.95rem'
                        }}
                      >
                        {acquiring ? '⏳' : 'Guardar para luego'}
                      </button>
                      <button onClick={() => confirmAcquisition(true)} disabled={acquiring}
                        style={{
                          background: acquiring ? '#94a3b8' : 'linear-gradient(135deg, #10b981, #059669)',
                          color: 'white', border: 'none', padding: '12px 24px',
                          borderRadius: '12px', fontWeight: 700, cursor: acquiring ? 'not-allowed' : 'pointer',
                          fontSize: '0.95rem', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                        }}
                      >
                        {acquiring ? '⏳ Añadiendo...' : '🌱 Añadir e Iniciar Cultivo Ahora'}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
