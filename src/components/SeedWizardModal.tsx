'use client';

import React, { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase/config';
import { getMediaUrl } from '@/lib/media-url';
import { SpeciesIcon } from '@/components/ui/SpeciesIcon';

interface SeedWizardModalProps {
  show: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialEspecieId?: number;
  initialVariedadId?: number;
}

export function SeedWizardModal({ show, onClose, onSuccess, initialEspecieId, initialVariedadId }: SeedWizardModalProps) {
  const [seedStep, setSeedStep] = useState(1);
  const [catalogoEspecies, setCatalogoEspecies] = useState<any[]>([]);
  const [catalogoVariedades, setCatalogoVariedades] = useState<any[]>([]);
  const [selectedEspecie, setSelectedEspecie] = useState<any | null>(null);
  const [selectedVariedad, setSelectedVariedad] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [seedFormData, setSeedFormData] = useState<{
    semillasorigen: string;
    semillasstockinicial: number | string;
    semillasstockactual: number | string;
    semillasmarca: string;
    semillaslugarcompra: string;
    semillasfechaenvasado: string;
    semillasfechacaducidad: string;
    semillasobservaciones: string;
    semillasnumerocoleccion: string;
  }>({
    semillasorigen: '',
    semillasstockinicial: '',
    semillasstockactual: '',
    semillasmarca: '',
    semillaslugarcompra: '',
    semillasfechaenvasado: '',
    semillasfechacaducidad: '',
    semillasobservaciones: '',
    semillasnumerocoleccion: ''
  });
  const [savingSeed, setSavingSeed] = useState(false);
  const [nextNumero, setNextNumero] = useState<number | null>(null);
  const [inputGramos, setInputGramos] = useState<string>('');
  const [customSemillasPorGramo, setCustomSemillasPorGramo] = useState<string>('');

  useEffect(() => {
    if (show) {
      setSearchTerm('');
      setInputGramos('');
      setCustomSemillasPorGramo('');
      setSeedFormData({
        semillasorigen: '',
        semillasstockinicial: '',
        semillasstockactual: '',
        semillasmarca: '',
        semillaslugarcompra: '',
        semillasfechaenvasado: '',
        semillasfechacaducidad: '',
        semillasobservaciones: '',
        semillasnumerocoleccion: ''
      });

      const loadCatalogData = async () => {
        try {
          const email = auth.currentUser?.email;
          if (!email) return;

          const res = await fetch('/api/user/catalogo', { headers: { 'x-user-email': email } });
          if (res.ok) {
            const data = await res.json();
            const especiesList = data.especies || [];
            setCatalogoEspecies(especiesList);

            if (initialEspecieId) {
              const esp = especiesList.find((e: any) => e.idespecies === initialEspecieId);
              if (esp) {
                setSelectedEspecie(esp);
              }
            } else {
              setSelectedEspecie(null);
              setSeedStep(1);
            }
          }

          const resNum = await fetch('/api/user/semillas/next-numero', { headers: { 'x-user-email': email } });
          if (resNum.ok) {
            const numData = await resNum.json();
            setNextNumero(numData.nextNumero);
            setSeedFormData(prev => ({ ...prev, semillasnumerocoleccion: String(numData.nextNumero) }));
          }

          if (initialEspecieId) {
            const resVars = await fetch(`/api/user/catalogo/${initialEspecieId}/variedades`, { headers: { 'x-user-email': email } });
            if (resVars.ok) {
              const dataVars = await resVars.json();
              const vars = dataVars.variedades || [];
              setCatalogoVariedades(vars);
              
              const targetVar = vars.find((v: any) => 
                v.idvariedades === initialVariedadId || 
                v.xvariedadesidoriginal === initialVariedadId
              );
              if (targetVar) {
                setSelectedVariedad(targetVar);
                setSeedStep(3);
              } else {
                setSelectedVariedad(null);
                setSeedStep(2);
              }
            }
          } else {
            setSelectedVariedad(null);
          }
        } catch (e) {
          console.error('Error opening seed modal:', e);
        }
      };

      loadCatalogData();
    }
  }, [show, initialEspecieId, initialVariedadId]);

  const selectSeedEspecie = async (esp: any) => {
    setSelectedEspecie(esp);
    setSeedStep(2);
    try {
      const email = auth.currentUser?.email;
      if (!email) return;

      const res = await fetch(`/api/user/catalogo/${esp.idespecies}/variedades`, { headers: { 'x-user-email': email } });
      if (res.ok) {
        const data = await res.json();
        const vars = data.variedades || [];
        setCatalogoVariedades(vars);
        setSelectedVariedad(null);
      }
    } catch (e) {
      console.error('Error loading varieties for seed:', e);
    }
  };

  const handleContinueWithoutVariety = () => {
    const genericVar = catalogoVariedades.find(v => v.variedadesesgenerica === 1) || catalogoVariedades[0];
    if (genericVar) {
      setSelectedVariedad(genericVar);
      setSeedStep(3);
    } else {
      alert('No hay variedades disponibles para esta hortaliza.');
    }
  };

  const handleGramosChange = (gramosVal: string, semPorGramoVal?: string) => {
    setInputGramos(gramosVal);
    
    const pesos1000 = selectedEspecie?.especiespeso1000semillas;
    let rate = 0;
    if (pesos1000 && Number(pesos1000) > 0) {
      rate = 1000 / Number(pesos1000);
    } else {
      rate = Number(semPorGramoVal !== undefined ? semPorGramoVal : customSemillasPorGramo) || 0;
    }

    if (rate > 0 && gramosVal !== '') {
      const calculated = Math.round(parseFloat(gramosVal) * rate);
      setSeedFormData(prev => ({
        ...prev,
        semillasstockinicial: calculated,
        semillasstockactual: calculated
      }));
    }
  };

  const handleSaveSeed = async () => {
    if (!selectedVariedad) return;
    setSavingSeed(true);

    try {
      const email = auth.currentUser?.email;
      if (!email) return;

      const body = {
        xsemillasidvariedades: selectedVariedad.idvariedades,
        semillasorigen: seedFormData.semillasorigen,
        semillasnumerocoleccion: seedFormData.semillasnumerocoleccion,
        semillaslugarcompra: seedFormData.semillaslugarcompra || null,
        semillasmarca: seedFormData.semillasmarca || null,
        semillasfechaenvasado: seedFormData.semillasfechaenvasado || null,
        semillasfechacaducidad: seedFormData.semillasfechacaducidad || null,
        semillasstockinicial: parseInt(String(seedFormData.semillasstockinicial)) || 0,
        semillasstockactual: parseInt(String(seedFormData.semillasstockactual)) || 0,
        semillasobservaciones: seedFormData.semillasobservaciones || null
      };

      const res = await fetch('/api/user/semillas', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-email': email
        },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        setSeedStep(4);
        if (onSuccess) {
          onSuccess();
        }
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(errorData.error || 'Error al guardar la semilla');
      }
    } catch (e) {
      console.error(e);
      alert('Error de conexión');
    } finally {
      setSavingSeed(false);
    }
  };

  if (!show) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(8px)', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px', transition: 'all 0.3s ease'
    }} onClick={onClose}>
      <div style={{
        background: 'white', borderRadius: '24px', maxWidth: 600, width: '100%',
        maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.7)',
        animation: 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{
          padding: '24px 28px', borderBottom: '1px solid #e2e8f0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'linear-gradient(135deg, #115e59, #0d9488)', color: 'white'
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span>🌰</span> Asistente de Semillas
              {(seedFormData.semillasnumerocoleccion || nextNumero) && (
                <span style={{
                  fontSize: '0.8rem',
                  background: 'rgba(255, 255, 255, 0.2)',
                  padding: '4px 10px',
                  borderRadius: '8px',
                  fontWeight: 800,
                  marginLeft: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  letterSpacing: '0.05em'
                }}>
                  SEMILLA Nº {seedFormData.semillasnumerocoleccion || nextNumero}
                </span>
              )}
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '0.85rem', opacity: 0.9 }}>
              {seedStep === 1 && 'Paso 1 de 3: Elige la hortaliza'}
              {seedStep === 2 && `Paso 2 de 3: Elige la variedad de ${selectedEspecie?.especiesnombre}`}
              {seedStep === 3 && `Paso 3 de 3: Detalles de la semilla para ${selectedVariedad?.variedadesnombre}`}
              {seedStep === 4 && '¡Semilla guardada con éxito!'}
            </p>
          </div>
          <button 
            onClick={onClose} 
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
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '28px' }}>

          {seedStep === 4 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: '4.5rem', marginBottom: '16px' }}>🎉</div>
              <h3 style={{ color: '#0f766e', margin: '0 0 8px', fontSize: '1.4rem', fontWeight: 900 }}>¡Semillas Registradas!</h3>
              <p style={{ color: '#64748b', margin: 0, fontSize: '0.95rem', lineHeight: 1.5 }}>
                La semilla de <strong>{selectedVariedad?.variedadesnombre}</strong> se ha añadido correctamente a tu banco de semillas.
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
                    <button onClick={() => { setSelectedEspecie(null); setSelectedVariedad(null); setSeedStep(1); }} style={{ background: 'white', border: '1px solid #99f6e4', color: '#0d9488', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}>Cambiar</button>
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
                      <button onClick={() => { setSelectedVariedad(null); setSeedStep(2); }} style={{ background: 'white', border: '1px solid #bfdbfe', color: '#3b82f6', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}>Cambiar</button>
                    </div>
                  ) : (
                    <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', animation: 'fadeInDown 0.3s' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                          <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.1rem', fontWeight: 800 }}>2. Selecciona una variedad</h3>
                          <button 
                            type="button"
                            onClick={handleContinueWithoutVariety}
                            style={{
                              background: '#f1f5f9',
                              border: '1px solid #cbd5e1',
                              color: '#475569',
                              padding: '8px 16px',
                              borderRadius: '10px',
                              fontWeight: 700,
                              fontSize: '0.85rem',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                            onMouseOver={e => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.borderColor = '#94a3b8'; }}
                            onMouseOut={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
                          >
                            <span>🌱</span> Continuar sin seleccionar
                          </button>
                        </div>
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

              {/* FASE 3: Procedencia */}
              {selectedVariedad && (
                <div style={{ marginLeft: '48px' }}>
                   {seedFormData.semillasorigen ? (
                     <div style={{ background: '#f0fdf4', border: '2px solid #10b981', borderRadius: '16px', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.1)' }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{fontSize: '1.5rem'}}>✅</span>
                          <h3 style={{ margin: 0, color: '#065f46', fontSize: '1.1rem', fontWeight: 800 }}>
                            Origen: {
                              seedFormData.semillasorigen === 'sobre_comprado' ? 'Sobre comprado 🛒' :
                              seedFormData.semillasorigen === 'cosecha_propia' ? 'Propia / Extraída 🤲' :
                              seedFormData.semillasorigen === 'intercambio' ? 'Intercambio 🤝' :
                              seedFormData.semillasorigen === 'por_definir' ? 'Pendiente de asignar ⏳' : ''
                            }
                          </h3>
                       </div>
                       <button onClick={() => { setSeedFormData({ ...seedFormData, semillasorigen: '' }); setSeedStep(3); }} style={{ background: 'white', border: '1px solid #a7f3d0', color: '#10b981', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}>Cambiar</button>
                     </div>
                   ) : (
                     <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', animation: 'fadeInDown 0.3s' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                          <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.2rem', fontWeight: 800 }}>3. Origen de las semillas</h3>
                          <button 
                            type="button"
                            onClick={() => setSeedFormData({ ...seedFormData, semillasorigen: 'por_definir' })}
                            style={{
                              background: '#f1f5f9',
                              border: '1px solid #cbd5e1',
                              color: '#475569',
                              padding: '8px 16px',
                              borderRadius: '10px',
                              fontWeight: 700,
                              fontSize: '0.85rem',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                            onMouseOver={e => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.borderColor = '#94a3b8'; }}
                            onMouseOut={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
                          >
                            <span>⏳</span> Continuar sin seleccionar
                          </button>
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <button
                            type="button"
                            onClick={() => setSeedFormData({ ...seedFormData, semillasorigen: 'sobre_comprado' })}
                            style={{
                              width: '100%',
                              padding: '16px 20px',
                              borderRadius: '16px',
                              border: '2px solid #e2e8f0',
                              background: 'white',
                              color: '#1e293b',
                              fontWeight: 800,
                              fontSize: '0.95rem',
                              cursor: 'pointer',
                              textAlign: 'left',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              transition: 'all 0.2s'
                            }}
                            onMouseOver={e => e.currentTarget.style.borderColor = '#0d9488'}
                            onMouseOut={e => e.currentTarget.style.borderColor = '#e2e8f0'}
                          >
                            <span style={{ fontSize: '1.6rem' }}>🛒</span>
                            <span>Sobre comprado</span>
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => setSeedFormData({ ...seedFormData, semillasorigen: 'cosecha_propia' })}
                            style={{
                              width: '100%',
                              padding: '16px 20px',
                              borderRadius: '16px',
                              border: '2px solid #e2e8f0',
                              background: 'white',
                              color: '#1e293b',
                              fontWeight: 800,
                              fontSize: '0.95rem',
                              cursor: 'pointer',
                              textAlign: 'left',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              transition: 'all 0.2s'
                            }}
                            onMouseOver={e => e.currentTarget.style.borderColor = '#0d9488'}
                            onMouseOut={e => e.currentTarget.style.borderColor = '#e2e8f0'}
                          >
                            <span style={{ fontSize: '1.6rem' }}>🤲</span>
                            <span>Propia / Extraída</span>
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => setSeedFormData({ ...seedFormData, semillasorigen: 'intercambio' })}
                            style={{
                              width: '100%',
                              padding: '16px 20px',
                              borderRadius: '16px',
                              border: '2px solid #e2e8f0',
                              background: 'white',
                              color: '#1e293b',
                              fontWeight: 800,
                              fontSize: '0.95rem',
                              cursor: 'pointer',
                              textAlign: 'left',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              transition: 'all 0.2s'
                            }}
                            onMouseOver={e => e.currentTarget.style.borderColor = '#0d9488'}
                            onMouseOut={e => e.currentTarget.style.borderColor = '#e2e8f0'}
                          >
                            <span style={{ fontSize: '1.6rem' }}>🤝</span>
                            <span>Intercambio</span>
                          </button>
                        </div>
                     </div>
                   )}
                </div>
              )}

              {/* FASE 4: Detalles Adicionales */}
              {selectedVariedad && seedFormData.semillasorigen !== '' && (
                <div style={{ marginLeft: '72px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', animation: 'fadeInDown 0.3s', marginBottom: '20px' }}>
                   <h3 style={{ margin: '0 0 20px', color: '#0f172a', fontSize: '1.2rem', fontWeight: 800 }}>4. Detalles Finales</h3>
                   <div style={{ display: 'grid', gap: '18px' }}>
                      
                      {/* Cantidad Inicial y Stock */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Cantidad Inicial (uds)</label>
                          <input 
                            type="number" 
                            min="1"
                            value={seedFormData.semillasstockinicial}
                            onChange={e => {
                              const val = e.target.value === '' ? '' : parseInt(e.target.value);
                              setSeedFormData({ ...seedFormData, semillasstockinicial: val, semillasstockactual: val });
                            }}
                            style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Stock Actual (uds)</label>
                          <input 
                            type="number" 
                            min="0"
                            value={seedFormData.semillasstockactual}
                            onChange={e => {
                              const val = e.target.value === '' ? '' : parseInt(e.target.value);
                              setSeedFormData({ ...seedFormData, semillasstockactual: val });
                            }}
                            style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.95rem', outline: 'none' }}
                          />
                        </div>
                      </div>

                      {/* Peso de semillas calculator */}
                      <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f766e', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          ⚖️ Calcular semillas por peso (Gramos)
                        </span>
                        
                        {selectedEspecie?.especiespeso1000semillas && Number(selectedEspecie.especiespeso1000semillas) > 0 ? (
                          <div>
                            <p style={{ margin: '0 0 8px', fontSize: '0.8rem', color: '#64748b', lineHeight: 1.4 }}>
                              Esta especie tiene un peso estándar registrado de <strong>{selectedEspecie.especiespeso1000semillas}g</strong> por cada 1.000 semillas.
                              <br />
                              <span style={{ color: '#0d9488', fontWeight: 700 }}>
                                Equivalencia: ≈ {Math.round(1000 / Number(selectedEspecie.especiespeso1000semillas))} semillas por gramo.
                              </span>
                            </p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <input 
                                type="number" 
                                step="0.01" 
                                min="0"
                                placeholder="Introduce los gramos del sobre..."
                                value={inputGramos}
                                onChange={e => handleGramosChange(e.target.value)}
                                style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }}
                              />
                              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#475569' }}>gramos</span>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <p style={{ margin: '0 0 8px', fontSize: '0.8rem', color: '#64748b', lineHeight: 1.4 }}>
                              Esta hortaliza no tiene registrado un peso estándar. Introduce los gramos y el equivalente aproximado de semillas por gramo:
                            </p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                              <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>Gramos</label>
                                <input 
                                  type="number" 
                                  step="0.01" 
                                  min="0"
                                  placeholder="Ej. 5"
                                  value={inputGramos}
                                  onChange={e => handleGramosChange(e.target.value)}
                                  style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }}
                                />
                              </div>
                              <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>Semillas / Gramo</label>
                                <input 
                                  type="number" 
                                  min="1"
                                  placeholder="Ej. 250"
                                  value={customSemillasPorGramo}
                                  onChange={e => {
                                    setCustomSemillasPorGramo(e.target.value);
                                    handleGramosChange(inputGramos, e.target.value);
                                  }}
                                  style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }}
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {seedFormData.semillasorigen !== 'por_definir' && (
                        <>
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
                        </>
                      )}

                      {/* Botón Guardar */}
                      <button 
                        onClick={handleSaveSeed}
                        disabled={savingSeed}
                        style={{
                          background: 'linear-gradient(135deg, #0f766e, #0d9488)',
                          color: 'white', border: 'none', padding: '14px', borderRadius: '12px',
                          fontWeight: 800, fontSize: '1rem', cursor: savingSeed ? 'not-allowed' : 'pointer',
                          marginTop: '10px', boxShadow: '0 4px 12px rgba(13, 148, 136, 0.3)',
                          transition: 'all 0.2s'
                        }}
                        onMouseOver={e => { if (!savingSeed) e.currentTarget.style.transform = 'translateY(-1px)'; }}
                        onMouseOut={e => { if (!savingSeed) e.currentTarget.style.transform = 'translateY(0)'; }}
                      >
                        {savingSeed ? '⏳ Guardando...' : '💾 Registrar Semilla'}
                      </button>
                   </div>
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
