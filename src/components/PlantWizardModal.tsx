'use client';

import React, { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase/config';
import { getMediaUrl } from '@/lib/media-url';
import { SpeciesIcon } from '@/components/ui/SpeciesIcon';

interface CatalogoEspecie {
  idespeciesvegetales: number;
  especiesvegetalesnombre: string;
  especiesvegetalesnombrecientifico: string;
  especiesfamilia: string;
  especiestipo: string;
  especiesvegetalesicono: string;
  especiesvegetalesdescripcion: string;
  especiesdificultad: string;
  foto: string | null;
  total_variedades: number;
}

interface CatalogoVariedad {
  idvariedadesvegetales: number;
  variedadesvegetalesnombre: string;
  variedadesvegetalesdescripcion: string;
  variedadesvegetalesicono: string;
  variedadesvegetalesesgenerica: number;
  variedadesdificultad: string;
  foto: string | null;
}

interface PlantWizardModalProps {
  show: boolean;
  onClose: () => void;
  onSuccess: (data: { id: number; startCultivo: boolean }) => void;
  userEmail?: string;
}

export function PlantWizardModal({ show, onClose, onSuccess, userEmail }: PlantWizardModalProps) {
  const [catalogoEspecies, setCatalogoEspecies] = useState<CatalogoEspecie[]>([]);
  const [catalogoVariedades, setCatalogoVariedades] = useState<CatalogoVariedad[]>([]);
  const [userSeeds, setUserSeeds] = useState<any[]>([]);
  const [userPlants, setUserPlants] = useState<any[]>([]);
  const [selectedEspecie, setSelectedEspecie] = useState<CatalogoEspecie | null>(null);
  const [selectedVariedad, setSelectedVariedad] = useState<CatalogoVariedad | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [acquiring, setAcquiring] = useState(false);
  const [step, setStep] = useState(1); // 1=especie, 2=variedad, 3=confirmar, 4=done

  useEffect(() => {
    if (show) {
      setSelectedEspecie(null);
      setSelectedVariedad(null);
      setSearchTerm('');
      setStep(1);
      setUserSeeds([]);
      setUserPlants([]);

      const activeEmail = userEmail || auth.currentUser?.email;
      console.log('PlantWizardModal opened, activeEmail:', activeEmail);

      const loadCatalog = async () => {
        try {
          const email = activeEmail;
          if (!email) return;
          const res = await fetch('/api/user/catalogo', { headers: { 'x-user-email': email } });
          if (res.ok) {
            const data = await res.json();
            setCatalogoEspecies(data.especies || []);
          }
        } catch (e) {
          console.error('Error loading catalogo:', e);
        }
      };

      const loadSeeds = async () => {
        try {
          const email = activeEmail;
          if (!email) {
            console.warn('PlantWizardModal: No email provided to load seeds.');
            return;
          }
          console.log('PlantWizardModal: Fetching seeds for email:', email);
          const res = await fetch('/api/user/semillas', { headers: { 'x-user-email': email } });
          console.log('PlantWizardModal: Fetch seeds response status:', res.status, res.ok);
          if (res.ok) {
            const data = await res.json();
            console.log('PlantWizardModal fetched seeds:', data.semillas);
            setUserSeeds(data.semillas || []);
          } else {
            const errText = await res.text();
            console.error('PlantWizardModal: Fetch seeds failed with status:', res.status, errText);
          }
        } catch (e) {
          console.error('Error loading seeds:', e);
        }
      };

      const loadPlants = async () => {
        try {
          const email = activeEmail;
          if (!email) {
            console.warn('PlantWizardModal: No email provided to load user plants.');
            return;
          }
          console.log('PlantWizardModal: Fetching user plants for email:', email);
          const res = await fetch('/api/user/plantas', { headers: { 'x-user-email': email } });
          console.log('PlantWizardModal: Fetch plants response status:', res.status, res.ok);
          if (res.ok) {
            const data = await res.json();
            console.log('PlantWizardModal fetched user plants:', data.plantas);
            setUserPlants(data.plantas || []);
          } else {
            const errText = await res.text();
            console.error('PlantWizardModal: Fetch plants failed with status:', res.status, errText);
          }
        } catch (e) {
          console.error('Error loading user plants:', e);
        }
      };

      loadCatalog();
      loadSeeds();
      loadPlants();
    }
  }, [show, userEmail]);

  const renderVarietyCard = (v: CatalogoVariedad, matchingSeeds: any[]) => {
    const hasSeeds = matchingSeeds.length > 0;
    const isIncorporated = userPlants.some(p => 
      (p.xvariedadesvegetalesidvariedadorigen && Number(p.xvariedadesvegetalesidvariedadorigen) === Number(v.idvariedadesvegetales)) ||
      (p.nombre && v.variedadesvegetalesnombre && p.nombre.toLowerCase().trim() === v.variedadesvegetalesnombre.toLowerCase().trim())
    );
    const totalStock = matchingSeeds.reduce((acc, curr) => acc + (Number(curr.semillasstockactual) || 0), 0);
    const hasUnquantified = matchingSeeds.some(s => s.semillasstockactual === null);
    const stockText = hasUnquantified
      ? (totalStock > 0 ? `${totalStock}+` : '')
      : `${totalStock}`;

    // Determine card background and border colors based on seeds and incorporation
    let cardBg = 'white';
    let cardBorder = '2px solid #e2e8f0';
    let hoverBorder = '#3b82f6';

    if (hasSeeds) {
      cardBg = '#f0fdf4';
      cardBorder = '2px solid #22c55e';
      hoverBorder = '#166534';
    } else if (isIncorporated) {
      cardBg = '#f0f9ff';
      cardBorder = '2px solid #60a5fa';
      hoverBorder = '#1d4ed8';
    }

    return (
      <button
        key={v.idvariedadesvegetales}
        onClick={() => { setSelectedVariedad(v); setStep(3); }}
        style={{
          background: cardBg,
          border: cardBorder,
          borderRadius: '16px',
          padding: '16px',
          cursor: 'pointer',
          textAlign: 'left',
          transition: 'all 0.2s',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          width: '100%',
          boxSizing: 'border-box'
        }}
        onMouseOver={e => {
          e.currentTarget.style.borderColor = hoverBorder;
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseOut={e => {
          e.currentTarget.style.borderColor = cardBorder.split(' ')[2];
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {v.variedadesvegetalesesgenerica === 1 && (
            <span style={{ fontSize: '0.65rem', background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '8px', fontWeight: 800 }}>
              🏅 Recomendada
            </span>
          )}
          {hasSeeds && (
            <span style={{ fontSize: '0.65rem', background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '8px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
              🎒 Semillas disponibles {stockText ? `(${stockText})` : ''}
            </span>
          )}
          {isIncorporated && (
            <span style={{ fontSize: '0.65rem', background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '8px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
              🏡 Ya en tu huerto
            </span>
          )}
        </div>
        {v.foto ? (
          <div style={{ width: '48px', height: '48px', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 2px 6px rgba(0,0,0,0.05)' }}>
            <img src={getMediaUrl(v.foto)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} crossOrigin="anonymous" />
          </div>
        ) : selectedEspecie?.foto ? (
          <div style={{ width: '48px', height: '48px', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 2px 6px rgba(0,0,0,0.05)' }}>
            <img src={getMediaUrl(selectedEspecie.foto)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} crossOrigin="anonymous" />
          </div>
        ) : (
          <SpeciesIcon icon={v.variedadesvegetalesicono || selectedEspecie?.especiesvegetalesicono || '🌱'} size="1.8rem" />
        )}
        <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#1e293b' }}>{v.variedadesvegetalesnombre}</span>
        {v.variedadesvegetalesdescripcion && (
          <span style={{ fontSize: '0.75rem', color: '#64748b', lineHeight: 1.4 }}>
            {v.variedadesvegetalesdescripcion.substring(0, 80)}...
          </span>
        )}
        {hasSeeds && (
          <div style={{ marginTop: '8px', width: '100%', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {matchingSeeds.map(seed => (
              <div key={seed.idsemillas} style={{
                padding: '8px',
                background: '#ffffff',
                border: '1px solid #bbf7d0',
                borderRadius: '8px',
                fontSize: '0.72rem',
                color: '#14532d',
                lineHeight: '1.3',
                width: '100%',
                boxSizing: 'border-box'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 'bold' }}>
                  <span>🎒 Semilla Nº {seed.semillasnumerocoleccion || seed.idsemillas}</span>
                  <span style={{ color: '#16a34a', fontWeight: 'bold' }}>
                    {seed.semillasstockactual !== null ? `${seed.semillasstockactual} uds` : 'Disponible'}
                  </span>
                </div>
                {seed.semillasmarca && <div style={{ fontSize: '0.65rem', color: '#166534', marginTop: '2px' }}>Marca: {seed.semillasmarca}</div>}
                {seed.semillaslote && <div style={{ fontSize: '0.65rem', color: '#166534' }}>Lote: {seed.semillaslote}</div>}
                {seed.semillasfechacaducidad && (
                  <div style={{ fontSize: '0.65rem', color: '#b91c1c', marginTop: '2px', fontWeight: '500' }}>
                    📅 Caducidad: {new Date(seed.semillasfechacaducidad).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </button>
    );
  };


  const selectEspecie = async (esp: CatalogoEspecie) => {
    setSelectedEspecie(esp);
    setStep(2);
    try {
      const email = userEmail || auth.currentUser?.email;
      if (!email) return;
      const res = await fetch(`/api/user/catalogo/${esp.idespeciesvegetales}/variedades`, { headers: { 'x-user-email': email } });
      if (res.ok) {
        const data = await res.json();
        const vars = data.variedades || [];
        setCatalogoVariedades(vars);
        setSelectedVariedad(null);
        // Si solo hay 1 variedad, preseleccionar y saltar
        if (vars.length === 1) {
          setSelectedVariedad(vars[0]);
          setStep(3);
        }
      }
    } catch (e) {
      console.error('Error loading variedades:', e);
    }
  };

  const handleContinueWithGeneric = () => {
    const gold = catalogoVariedades.find(v => v.variedadesvegetalesesgenerica === 1) || catalogoVariedades[0];
    if (gold) {
      setSelectedVariedad(gold);
      setStep(3);
    }
  };

  const confirmAcquisition = async (startCultivo: boolean) => {
    if (!selectedEspecie || acquiring) return;
    setAcquiring(true);
    try {
      const email = auth.currentUser?.email;
      if (!email) return;
      const res = await fetch('/api/user/plantas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-email': email },
        body: JSON.stringify({
          especieId: selectedEspecie.idespeciesvegetales,
          variedadId: selectedVariedad?.idvariedadesvegetales || null
        })
      });
      if (res.ok) {
        const data = await res.json();
        setStep(4);
        setTimeout(() => {
          onSuccess({ id: data.id, startCultivo });
        }, 1500);
      } else {
        const err = await res.json();
        alert(err.error || 'Error al adquirir la planta');
      }
    } catch (e) {
      console.error('Error acquiring:', e);
    } finally {
      setAcquiring(false);
    }
  };

  if (!show) return null;

  const filteredEspecies = catalogoEspecies.filter(e =>
    !searchTerm || e.especiesvegetalesnombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (e.especiesvegetalesnombrecientifico && e.especiesvegetalesnombrecientifico.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(8px)', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px', transition: 'all 0.3s ease'
    }} onClick={onClose}>
      <div style={{
        background: 'white', borderRadius: '24px', maxWidth: 650, width: '100%',
        maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.7)',
        animation: 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }} onClick={e => e.stopPropagation()}>

        {/* ─── Header ─── */}
        <div style={{
          padding: '24px 28px', borderBottom: '1px solid #e2e8f0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'linear-gradient(135deg, #065f46, #10b981)', color: 'white'
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🌱</span> Asistente de Nueva Planta
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '0.85rem', opacity: 0.9 }}>
              {step === 1 && 'Paso 1 de 3: Elige la hortaliza'}
              {step === 2 && `Paso 2 de 3: Elige la variedad de ${selectedEspecie?.especiesvegetalesnombre}`}
              {step === 3 && 'Paso 3 de 3: Confirmar tu nueva planta'}
              {step === 4 && '¡Planta añadida con éxito!'}
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

        {/* ─── Body ─── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '28px' }}>

          {step === 4 ? (
            /* ════ ÉXITO ════ */
            <div style={{ padding: '40px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: '4.5rem', marginBottom: '16px' }}>🎉</div>
              <h3 style={{ color: '#065f46', margin: '0 0 8px', fontSize: '1.4rem', fontWeight: 900 }}>¡Planta Añadida!</h3>
              <p style={{ color: '#64748b', margin: 0, fontSize: '0.95rem', lineHeight: 1.5 }}>
                <strong>{selectedVariedad?.variedadesvegetalesnombre || selectedEspecie?.especiesvegetalesnombre}</strong> se ha añadido a tu huerto.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

              {/* ════ FASE 1: Especie ════ */}
              <div>
                {selectedEspecie ? (
                  /* Confirmada */
                  <div style={{
                    background: '#f0fdf4', border: '2px solid #10b981', borderRadius: '16px',
                    padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.1)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '1.5rem' }}>✅</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {selectedEspecie.foto ? (
                          <div style={{ width: '40px', height: '40px', borderRadius: '10px', overflow: 'hidden', flexShrink: 0 }}>
                            <img src={getMediaUrl(selectedEspecie.foto)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} crossOrigin="anonymous" />
                          </div>
                        ) : (
                          <SpeciesIcon icon={selectedEspecie.especiesvegetalesicono} size="1.5rem" />
                        )}
                        <h3 style={{ margin: 0, color: '#065f46', fontSize: '1.1rem', fontWeight: 800 }}>
                          Hortaliza: {selectedEspecie.especiesvegetalesnombre}
                        </h3>
                      </div>
                    </div>
                    <button
                      onClick={() => { setSelectedEspecie(null); setSelectedVariedad(null); setStep(1); }}
                      style={{
                        background: 'white', border: '1px solid #a7f3d0', color: '#10b981',
                        padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem'
                      }}
                    >Cambiar</button>
                  </div>
                ) : (
                  /* Selector */
                  <div style={{
                    background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px',
                    padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
                  }}>
                    <h3 style={{ margin: '0 0 16px', color: '#0f172a', fontSize: '1.1rem', fontWeight: 800 }}>
                      1. Selecciona una hortaliza
                    </h3>
                    <input
                      type="text"
                      placeholder="🔍 Buscar hortaliza / especie..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      style={{
                        width: '100%', padding: '12px 16px', borderRadius: '12px',
                        border: '2px solid #e2e8f0', fontSize: '0.95rem',
                        marginBottom: '20px', boxSizing: 'border-box',
                        outline: 'none', transition: 'all 0.2s', fontWeight: 500
                      }}
                      onFocus={e => e.target.style.borderColor = '#10b981'}
                      onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                    />
                    <div style={{
                      display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 160px), 1fr))',
                      gap: '14px', maxHeight: '400px', overflowY: 'auto', padding: '4px'
                    }}>
                      {filteredEspecies.map(esp => (
                        <button key={esp.idespeciesvegetales} onClick={() => selectEspecie(esp)} style={{
                          background: 'white', border: '2px solid #e2e8f0', borderRadius: '16px',
                          padding: '16px', cursor: 'pointer', textAlign: 'center',
                          transition: 'all 0.2s', display: 'flex', flexDirection: 'column', gap: '8px',
                          alignItems: 'center', justifyContent: 'center', minHeight: '120px'
                        }}
                          onMouseOver={e => { e.currentTarget.style.borderColor = '#10b981'; e.currentTarget.style.background = '#f0fdf4'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                          onMouseOut={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = 'white'; e.currentTarget.style.transform = 'translateY(0)'; }}
                        >
                          {esp.foto ? (
                            <div style={{ width: '56px', height: '56px', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
                              <img src={getMediaUrl(esp.foto)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} crossOrigin="anonymous" />
                            </div>
                          ) : (
                            <SpeciesIcon icon={esp.especiesvegetalesicono} size="2.2rem" />
                          )}
                          <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#1e293b' }}>{esp.especiesvegetalesnombre}</span>
                          {esp.especiesvegetalesnombrecientifico && (
                            <span style={{ fontSize: '0.7rem', color: '#64748b', fontStyle: 'italic' }}>{esp.especiesvegetalesnombrecientifico}</span>
                          )}
                          <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>
                            {esp.total_variedades} variedad{esp.total_variedades !== 1 ? 'es' : ''}
                          </span>
                        </button>
                      ))}
                    </div>
                    {filteredEspecies.length === 0 && (
                      <p style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>No se encontraron especies</p>
                    )}
                  </div>
                )}
              </div>

              {/* ════ FASE 2: Variedad ════ */}
              {selectedEspecie && (
                <div style={{ marginLeft: '24px' }}>
                  {selectedVariedad ? (
                    /* Confirmada */
                    <div style={{
                      background: '#eff6ff', border: '2px solid #3b82f6', borderRadius: '16px',
                      padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.1)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '1.5rem' }}>✅</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {selectedVariedad.foto ? (
                            <div style={{ width: '40px', height: '40px', borderRadius: '10px', overflow: 'hidden', flexShrink: 0 }}>
                              <img src={getMediaUrl(selectedVariedad.foto)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} crossOrigin="anonymous" />
                            </div>
                          ) : (
                            <SpeciesIcon icon={selectedVariedad.variedadesvegetalesicono || selectedEspecie.especiesvegetalesicono || '🌱'} size="1.5rem" />
                          )}
                          <h3 style={{ margin: 0, color: '#1e40af', fontSize: '1.1rem', fontWeight: 800 }}>
                            Variedad: {selectedVariedad.variedadesvegetalesnombre}
                          </h3>
                        </div>
                      </div>
                      <button
                        onClick={() => { setSelectedVariedad(null); setStep(2); }}
                        style={{
                          background: 'white', border: '1px solid #bfdbfe', color: '#3b82f6',
                          padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem'
                        }}
                      >Cambiar</button>
                    </div>
                  ) : (
                    /* Selector */
                    <div style={{
                      background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px',
                      padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                      animation: 'fadeInDown 0.3s'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                        <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.1rem', fontWeight: 800 }}>
                          2. Selecciona una variedad
                        </h3>
                        <button
                          type="button"
                          onClick={handleContinueWithGeneric}
                          style={{
                            background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#475569',
                            padding: '8px 16px', borderRadius: '10px', fontWeight: 700, fontSize: '0.85rem',
                            cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '6px'
                          }}
                          onMouseOver={e => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.borderColor = '#94a3b8'; }}
                          onMouseOut={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
                        >
                          <span>🌱</span> Usar variedad genérica
                        </button>
                      </div>

                      {(() => {
                        const varietiesWithSeeds: Array<{ variety: CatalogoVariedad, seeds: any[] }> = [];
                        const varietiesWithoutSeeds: CatalogoVariedad[] = [];

                        catalogoVariedades.forEach(v => {
                          const matchingSeeds = userSeeds.filter(
                            s => Number(s.global_variedad_id) === Number(v.idvariedadesvegetales) && 
                                 (s.semillasstockactual === null || s.semillasstockactual > 0) &&
                                 s.semillasactivosino !== 0
                          );
                          if (matchingSeeds.length > 0) {
                            varietiesWithSeeds.push({ variety: v, seeds: matchingSeeds });
                          } else {
                            varietiesWithoutSeeds.push(v);
                          }
                        });

                        // Sort both lists alphabetically
                        varietiesWithSeeds.sort((a, b) => a.variety.variedadesvegetalesnombre.localeCompare(b.variety.variedadesvegetalesnombre));
                        varietiesWithoutSeeds.sort((a, b) => a.variedadesvegetalesnombre.localeCompare(b.variedadesvegetalesnombre));

                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            {/* 1. Varieties with seeds */}
                            {varietiesWithSeeds.length > 0 && (
                              <div>
                                <h4 style={{ margin: '0 0 12px 4px', color: '#166534', fontSize: '0.95rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span>🎒</span> Variedades con semillas en tu colección
                                </h4>
                                <div style={{
                                  display: 'grid',
                                  gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 180px), 1fr))',
                                  gap: '14px',
                                  maxHeight: '400px',
                                  overflowY: 'auto',
                                  padding: '4px',
                                  background: '#f8fafc',
                                  borderRadius: '16px',
                                  border: '1px dashed #cbd5e1',
                                  boxSizing: 'border-box'
                                }}>
                                  {varietiesWithSeeds.map(ws => renderVarietyCard(ws.variety, ws.seeds))}
                                </div>
                              </div>
                            )}

                            {/* 2. Other varieties */}
                            <div>
                              {varietiesWithSeeds.length > 0 && (
                                <h4 style={{ margin: '0 0 12px 4px', color: '#475569', fontSize: '0.95rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span>📋</span> Resto de variedades (catálogo)
                                </h4>
                              )}
                              <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 180px), 1fr))',
                                gap: '14px',
                                maxHeight: '400px',
                                overflowY: 'auto',
                                padding: '4px'
                              }}>
                                {varietiesWithoutSeeds.map(v => renderVarietyCard(v, []))}
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              )}

              {/* ════ FASE 3: Confirmación ════ */}
              {selectedEspecie && selectedVariedad && step >= 3 && (
                <div style={{ marginLeft: '48px' }}>
                  <div style={{
                    background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px',
                    padding: '28px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                    animation: 'fadeInDown 0.3s'
                  }}>
                    <h3 style={{ margin: '0 0 20px', color: '#0f172a', fontSize: '1.2rem', fontWeight: 800 }}>
                      3. Confirmar tu nueva planta
                    </h3>

                    {/* Resumen visual */}
                    <div style={{
                      textAlign: 'center', padding: '24px',
                      background: 'linear-gradient(135deg, #f0fdf4, #ecfdf5)',
                      borderRadius: '16px', border: '1px solid #bbf7d0', marginBottom: '24px'
                    }}>
                      <div style={{ marginBottom: '16px' }}>
                        {selectedVariedad.foto ? (
                          <div style={{ width: '100px', height: '100px', borderRadius: '20px', overflow: 'hidden', margin: '0 auto', boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}>
                            <img src={getMediaUrl(selectedVariedad.foto)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} crossOrigin="anonymous" />
                          </div>
                        ) : selectedEspecie.foto ? (
                          <div style={{ width: '100px', height: '100px', borderRadius: '20px', overflow: 'hidden', margin: '0 auto', boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}>
                            <img src={getMediaUrl(selectedEspecie.foto)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} crossOrigin="anonymous" />
                          </div>
                        ) : (
                          <SpeciesIcon icon={selectedVariedad.variedadesvegetalesicono || selectedEspecie.especiesvegetalesicono || '🌱'} size="4rem" />
                        )}
                      </div>
                      <h4 style={{ margin: '0 0 4px', color: '#166534', fontSize: '1.2rem', fontWeight: 800 }}>
                        {selectedVariedad.variedadesvegetalesnombre}
                      </h4>
                      <p style={{ color: '#15803d', margin: '0 0 16px', fontSize: '0.85rem' }}>
                        Especie: {selectedEspecie.especiesvegetalesnombre}
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxWidth: 320, margin: '0 auto', textAlign: 'left' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#166534' }}>
                          <span>✅</span> Datos agronómicos heredados de la especie
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#166534' }}>
                          <span>✅</span> Pautas de labores predefinidas
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#166534' }}>
                          <span>✅</span> Personalizable en cualquier momento
                        </div>
                      </div>
                    </div>

                    {/* Botones de acción */}
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => confirmAcquisition(false)}
                        disabled={acquiring}
                        style={{
                          background: 'white', color: '#10b981', border: '2px solid #10b981',
                          padding: '14px 24px', borderRadius: '12px', fontWeight: 700,
                          cursor: acquiring ? 'not-allowed' : 'pointer', fontSize: '0.95rem',
                          transition: 'all 0.2s', flex: '1', minWidth: '160px'
                        }}
                        onMouseOver={e => { if (!acquiring) { e.currentTarget.style.background = '#f0fdf4'; e.currentTarget.style.transform = 'translateY(-1px)'; }}}
                        onMouseOut={e => { if (!acquiring) { e.currentTarget.style.background = 'white'; e.currentTarget.style.transform = 'translateY(0)'; }}}
                      >
                        {acquiring ? '⏳' : '📋 Guardar para luego'}
                      </button>
                      <button
                        onClick={() => confirmAcquisition(true)}
                        disabled={acquiring}
                        style={{
                          background: acquiring ? '#94a3b8' : 'linear-gradient(135deg, #10b981, #059669)',
                          color: 'white', border: 'none', padding: '14px 24px',
                          borderRadius: '12px', fontWeight: 800, cursor: acquiring ? 'not-allowed' : 'pointer',
                          fontSize: '0.95rem', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                          transition: 'all 0.2s', flex: '1', minWidth: '160px'
                        }}
                        onMouseOver={e => { if (!acquiring) e.currentTarget.style.transform = 'translateY(-1px)'; }}
                        onMouseOut={e => { if (!acquiring) e.currentTarget.style.transform = 'translateY(0)'; }}
                      >
                        {acquiring ? '⏳ Añadiendo...' : '🌱 Añadir e Iniciar Cultivo'}
                      </button>
                    </div>
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
