'use client';

import React from 'react';
import { SpeciesIcon } from '@/components/ui/SpeciesIcon';
import { getMediaUrl } from '@/lib/media-url';

interface CropWizardModalProps {
  showCropWizard: boolean;
  setShowCropWizard: (val: boolean) => void;
  cropWizardStep: number;
  setCropWizardStep: (step: number) => void;
  cropWizardEspecies: any[];
  cropWizardVariedades: any[];
  selectedCropEspecie: any;
  selectedCropVariedad: any;
  cropSearchTerm: string;
  setCropSearchTerm: (term: string) => void;
  cropAcquiring: boolean;
  cropNextNumero: number | null;
  cropFormData: any;
  setCropFormData: React.Dispatch<React.SetStateAction<any>>;
  cropInputGramos: string;
  cropCustomSemillasPorGramo: string;
  setCropCustomSemillasPorGramo: (val: string) => void;
  handleCropGramosChange: (gramosVal: string, semPorGramoVal?: string) => void;
  selectCropEspecie: (esp: any) => void;
  selectCropVariedad: (v: any) => void;
  handleSaveCrop: () => void;
  getSemillaStock: (idVariedad: number) => any;
  isMobile?: boolean;
}

export default function CropWizardModal({
  showCropWizard,
  setShowCropWizard,
  cropWizardStep,
  setCropWizardStep,
  cropWizardEspecies,
  cropWizardVariedades,
  selectedCropEspecie,
  selectedCropVariedad,
  cropSearchTerm,
  setCropSearchTerm,
  cropAcquiring,
  cropNextNumero,
  cropFormData,
  setCropFormData,
  cropInputGramos,
  cropCustomSemillasPorGramo,
  setCropCustomSemillasPorGramo,
  handleCropGramosChange,
  selectCropEspecie,
  selectCropVariedad,
  handleSaveCrop,
  getSemillaStock,
  isMobile = false
}: CropWizardModalProps) {
  if (!showCropWizard) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(8px)', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px', transition: 'all 0.3s ease'
    }}>
      <div style={{
        background: 'white', borderRadius: '24px', maxWidth: 'min(620px, 95vw)', width: '100%',
        maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.7)',
        animation: 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{
          padding: '24px 28px', borderBottom: '1px solid #e2e8f0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'linear-gradient(135deg, #065f46, #10b981)', color: 'white'
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🌱</span> Asistente de Cultivos
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '0.85rem', opacity: 0.9 }}>
              {cropWizardStep === 1 && 'Paso 1 de 4: Elige la especie/hortaliza'}
              {cropWizardStep === 2 && `Paso 2 de 4: Elige la variedad de ${selectedCropEspecie?.especiesvegetalesnombre}`}
              {cropWizardStep === 3 && `Paso 3 de 4: Método y Origen para ${selectedCropVariedad?.variedadesvegetalesnombre}`}
              {cropWizardStep === 4 && `Paso 4 de 4: Configuración final del cultivo`}
              {cropWizardStep === 5 && '¡Cultivo iniciado con éxito!'}
            </p>
          </div>
          <button 
            onClick={() => setShowCropWizard(false)} 
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

          {/* PASO 1: Elegir especie */}
          {cropWizardStep === 1 && (
            <>
              <input
                type="text"
                placeholder="🔍 Buscar hortaliza..."
                value={cropSearchTerm}
                onChange={e => setCropSearchTerm(e.target.value)}
                style={{
                  width: '100%', padding: '12px 16px', borderRadius: '12px',
                  border: '2px solid #e2e8f0', fontSize: '0.95rem',
                  marginBottom: '20px', boxSizing: 'border-box',
                  outline: 'none', transition: 'all 0.2s', fontWeight: 500
                }}
                onFocus={e => e.target.style.borderColor = '#10b981'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
              />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 160px), 1fr))', gap: '14px' }}>
                {cropWizardEspecies
                  .filter(esp => !cropSearchTerm || esp.especiesvegetalesnombre.toLowerCase().includes(cropSearchTerm.toLowerCase()))
                  .map(esp => (
                    <button key={esp.idespeciesvegetales} onClick={() => selectCropEspecie(esp)} style={{
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
                        <SpeciesIcon icon={esp.especiesvegetalesicono || '🌱'} size="2.2rem" />
                      )}
                      <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#1e293b' }}>{esp.especiesvegetalesnombre}</span>
                    </button>
                  ))}
              </div>
            </>
          )}

          {/* PASO 2: Elegir variedad */}
          {cropWizardStep === 2 && selectedCropEspecie && (
            <>
              <button onClick={() => { setCropWizardStep(1); }}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', marginBottom: '16px', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                ← Volver a especies
              </button>
              <h3 style={{ margin: '0 0 16px', color: '#0f172a', fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <SpeciesIcon icon={selectedCropEspecie.especiesvegetalesicono} size="1.2rem" /> {selectedCropEspecie.especiesvegetalesnombre} — Elige la variedad
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 180px), 1fr))', gap: '14px' }}>
                {cropWizardVariedades.map(v => {
                  const stockInfo = getSemillaStock(v.idvariedadesvegetales);
                  return (
                    <button key={v.idvariedadesvegetales} onClick={() => selectCropVariedad(v)}
                      style={{
                        background: selectedCropVariedad?.idvariedadesvegetales === v.idvariedadesvegetales ? '#f0fdf4' : 'white',
                        border: `2px solid ${selectedCropVariedad?.idvariedadesvegetales === v.idvariedadesvegetales ? '#10b981' : '#e2e8f0'}`,
                        borderRadius: '16px', padding: '16px', cursor: 'pointer',
                        textAlign: 'left', transition: 'all 0.2s',
                        display: 'flex', flexDirection: 'column', gap: '6px'
                      }}
                      onMouseOver={e => e.currentTarget.style.borderColor = '#10b981'}
                      onMouseOut={e => { if (selectedCropVariedad?.idvariedadesvegetales !== v.idvariedadesvegetales) e.currentTarget.style.borderColor = '#e2e8f0'; }}
                    >
                      {v.variedadesvegetalesesgenerica === 1 && <span style={{ fontSize: '0.65rem', background: '#ccfbf1', color: '#0f766e', padding: '2px 8px', borderRadius: '8px', fontWeight: 800, alignSelf: 'flex-start' }}>🏅 Común / Gold</span>}
                      {v.foto ? (
                        <div style={{ width: '48px', height: '48px', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 2px 6px rgba(0,0,0,0.05)' }}>
                          <img src={getMediaUrl(v.foto)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} crossOrigin="anonymous" />
                        </div>
                      ) : (
                        <SpeciesIcon icon={v.variedadesvegetalesicono || selectedCropEspecie.especiesvegetalesicono || '🌱'} size="1.8rem" />
                      )}
                      <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#1e293b' }}>{v.variedadesvegetalesnombre}</span>
                      
                      {stockInfo ? (
                        <div style={{
                          fontSize: '0.72rem',
                          background: '#dcfce7',
                          color: '#15803d',
                          padding: '4px 8px',
                          borderRadius: '8px',
                          fontWeight: 700,
                          marginTop: '4px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          📦 {stockInfo.totalStock} semillas disponibles ({stockInfo.lotesCount} {stockInfo.lotesCount === 1 ? 'lote' : 'lotes'})
                        </div>
                      ) : (
                        <div style={{
                          fontSize: '0.72rem',
                          background: '#f1f5f9',
                          color: '#64748b',
                          padding: '4px 8px',
                          borderRadius: '8px',
                          fontWeight: 600,
                          marginTop: '4px',
                          display: 'inline-flex',
                          alignItems: 'center'
                        }}>
                          ❌ Sin semillas en banco
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* PASO 3: Método y Origen */}
          {cropWizardStep === 3 && selectedCropVariedad && (
            <>
              <button onClick={() => setCropWizardStep(cropWizardVariedades.length > 1 ? 2 : 1)}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', marginBottom: '16px', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                ← Volver
              </button>

              <div style={{ display: 'grid', gap: '22px' }}>
                
                {/* Variedad Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#f0fdf4', border: '1px solid #ccfbf1', padding: '16px', borderRadius: '16px' }}>
                  <span style={{ fontSize: '2rem' }}>🌱</span>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#0f766e', fontWeight: 800, textTransform: 'uppercase' }}>Variedad de Cultivo</div>
                    <h4 style={{ margin: 0, color: '#115e59', fontSize: '1.1rem', fontWeight: 900 }}>
                      {selectedCropEspecie?.especiesvegetalesnombre} ({selectedCropVariedad.variedadesvegetalesnombre})
                    </h4>
                  </div>
                </div>

                {/* Contenedor de línea de tiempo */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', position: 'relative', marginTop: '4px' }}>
                  
                  {/* Método de cultivo */}
                  <div style={{ position: 'relative', zIndex: 2, paddingLeft: isMobile ? '12px' : '24px' }}>
                    <div style={{
                      position: 'absolute',
                      left: '1px',
                      top: '6px',
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      background: '#10b981',
                      border: '2px solid white',
                      boxShadow: '0 0 0 1px #10b981'
                    }} />

                    {cropFormData.metodo !== '' && (
                      <div style={{
                        position: 'absolute',
                        left: '6px',
                        top: '12px',
                        bottom: '-22px',
                        width: '2px',
                        background: cropFormData.origen !== '' ? '#10b981' : '#cbd5e1',
                        zIndex: 1
                      }} />
                    )}

                    {cropFormData.metodo !== '' ? (
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>Método de siembra/cultivo</label>
                          <button
                            type="button"
                            onClick={() => {
                              setCropFormData((prev: any) => ({ 
                                ...prev, 
                                metodo: '', 
                                origen: '' 
                              }));
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#10b981',
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              padding: 0
                            }}
                          >
                            ✏️ Cambiar método
                          </button>
                        </div>
                        {(() => {
                          const m = [
                            { id: 'semillero', label: '📥 Semillero protegido', desc: 'Siembra en contenedores controlados antes de trasplantar.' },
                            { id: 'siembra_directa', label: '🌍 Siembra directa en suelo/maceta', desc: 'Siembra de semillas directamente en su ubicación definitiva o macetas.' },
                            { id: 'trasplante_directo', label: '🪴 Trasplante directo (Plantel vivo)', desc: 'Plantar una planta joven o plantel comprado/regalado.' }
                          ].find(item => item.id === cropFormData.metodo);
                          
                          if (!m) return null;
                          
                          return (
                            <div style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'flex-start',
                              padding: '12px 16px',
                              borderRadius: '12px',
                              border: '2px solid #10b981',
                              background: '#f0fdf4',
                              width: '100%',
                              animation: 'scaleIn 0.2s'
                            }}>
                              <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#065f46' }}>
                                {m.label}
                              </span>
                              <span style={{ fontSize: '0.78rem', color: '#047857', marginTop: '3px' }}>
                                {m.desc}
                              </span>
                            </div>
                          );
                        })()}
                      </div>
                    ) : (
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>Método de siembra/cultivo</label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {[
                            { id: 'semillero', label: '📥 Semillero protegido', desc: 'Siembra en contenedores controlados antes de trasplantar.' },
                            { id: 'siembra_directa', label: '🌍 Siembra directa en suelo/maceta', desc: 'Siembra de semillas directamente en su ubicación definitiva o macetas.' },
                            { id: 'trasplante_directo', label: '🪴 Trasplante directo (Plantel vivo)', desc: 'Plantar una planta joven o plantel comprado/regalado.' }
                          ].map(m => {
                            const isSelected = cropFormData.metodo === m.id;
                            return (
                              <button
                                key={m.id}
                                type="button"
                                onClick={() => {
                                  setCropFormData((prev: any) => ({ 
                                    ...prev, 
                                    metodo: m.id, 
                                    origen: '' 
                                  }));
                                }}
                                style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'flex-start',
                                  padding: '12px 16px',
                                  borderRadius: '12px',
                                  border: isSelected ? '2px solid #10b981' : '1px solid #e2e8f0',
                                  background: isSelected ? '#f0fdf4' : 'white',
                                  cursor: 'pointer',
                                  textAlign: 'left',
                                  width: '100%',
                                  transition: 'all 0.2s',
                                  boxShadow: isSelected ? '0 4px 12px rgba(16, 185, 129, 0.08)' : 'none',
                                  outline: 'none'
                                }}
                                onMouseOver={e => {
                                  if (!isSelected) e.currentTarget.style.borderColor = '#10b981';
                                }}
                                onMouseOut={e => {
                                  if (!isSelected) e.currentTarget.style.borderColor = '#e2e8f0';
                                }}
                              >
                                <span style={{ fontWeight: 800, fontSize: '0.95rem', color: isSelected ? '#065f46' : '#1e293b' }}>
                                  {m.label}
                                </span>
                                <span style={{ fontSize: '0.78rem', color: isSelected ? '#047857' : '#64748b', marginTop: '3px' }}>
                                  {m.desc}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Origen / Procedencia */}
                  {cropFormData.metodo !== '' && (
                    <div style={{ 
                      position: 'relative', 
                      zIndex: 2, 
                      paddingLeft: isMobile ? '16px' : '48px',
                      animation: 'scaleIn 0.2s',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '18px'
                    }}>
                      <div style={{
                        position: 'absolute',
                        left: '1px',
                        top: '6px',
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        background: cropFormData.origen !== '' ? '#10b981' : '#cbd5e1',
                        border: '2px solid white',
                        boxShadow: `0 0 0 1px ${cropFormData.origen !== '' ? '#10b981' : '#cbd5e1'}`
                      }} />

                      {cropFormData.origen !== '' ? (
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>Origen de la planta / semilla</label>
                            <button
                              type="button"
                              onClick={() => {
                                setCropFormData((prev: any) => ({ 
                                  ...prev, 
                                  origen: '' 
                                }));
                              }}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#10b981',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                padding: 0
                              }}
                            >
                              ✏️ Cambiar origen
                            </button>
                          </div>
                          {(() => {
                            const o = [
                              { id: 'semilla_inventario', label: '🤲 Usar de mi Banco digital', desc: 'Descontar semillas de un lote que ya tienes registrado.' },
                              { id: 'semilla_nueva', label: '📦 Registrar nuevo sobre', desc: 'Introducir y registrar un nuevo sobre de semillas comprado.' },
                              { id: 'plantel_comprado', label: '🛒 Plantel de vivero', desc: 'Plantas jóvenes compradas directamente en tienda o vivero.' },
                              { id: 'plantel_regalado', label: '🎁 Plantel regalado/intercambiado', desc: 'Plantel recibido como regalo, obsequio o intercambio.' },
                              { id: 'esqueje', label: '🌿 Esqueje o propagación', desc: 'Propagar a partir de un esqueje o división propia.' }
                            ].find(item => item.id === cropFormData.origen);
                            
                            if (!o) return null;
                            
                            return (
                              <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'flex-start',
                                padding: '12px 16px',
                                borderRadius: '12px',
                                border: '2px solid #10b981',
                                background: '#f0fdf4',
                                width: '100%',
                                animation: 'scaleIn 0.2s'
                              }}>
                                <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#065f46' }}>
                                  {o.label}
                                </span>
                                <span style={{ fontSize: '0.78rem', color: '#047857', marginTop: '3px' }}>
                                  {o.desc}
                                </span>
                              </div>
                            );
                          })()}
                        </div>
                      ) : (
                        <div>
                          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>Origen de la planta / semilla</label>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {[
                              ...(getSemillaStock(selectedCropVariedad.idvariedadesvegetales) !== null ? [{
                                id: 'semilla_inventario',
                                label: '🤲 Usar de mi Banco digital',
                                desc: 'Descontar semillas de un lote que ya tienes registrado.'
                              }] : []),
                              {
                                id: 'semilla_nueva',
                                label: '📦 Registrar nuevo sobre',
                                desc: 'Introducir y registrar un nuevo sobre de semillas comprado.'
                              },
                              ...(cropFormData.metodo !== 'semillero' ? [
                                {
                                  id: 'plantel_comprado',
                                  label: '🛒 Plantel de vivero',
                                  desc: 'Plantas jóvenes compradas directamente en tienda o vivero.'
                                },
                                {
                                  id: 'plantel_regalado',
                                  label: '🎁 Plantel regalado/intercambiado',
                                  desc: 'Plantel recibido como regalo, obsequio o intercambio.'
                                },
                                {
                                  id: 'esqueje',
                                  label: '🌿 Esqueje o propagación',
                                  desc: 'Propagar a partir de un esqueje o división propia.'
                                }
                              ] : [])
                            ].map(o => {
                              return (
                                <button
                                  key={o.id}
                                  type="button"
                                  onClick={() => {
                                    setCropFormData((prev: any) => ({ 
                                      ...prev, 
                                      origen: o.id,
                                      xcultivosidsemillas: '' 
                                    }));
                                  }}
                                  style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'flex-start',
                                    padding: '12px 16px',
                                    borderRadius: '12px',
                                    border: '1px solid #e2e8f0',
                                    background: 'white',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    width: '100%',
                                    transition: 'all 0.2s',
                                    outline: 'none'
                                  }}
                                  onMouseOver={e => {
                                    e.currentTarget.style.borderColor = '#10b981';
                                  }}
                                  onMouseOut={e => {
                                    e.currentTarget.style.borderColor = '#e2e8f0';
                                  }}
                                >
                                  <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#1e293b' }}>
                                    {o.label}
                                  </span>
                                  <span style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '3px' }}>
                                    {o.desc}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Lote / Detalles de la Semilla */}
                  {cropFormData.metodo !== '' && (cropFormData.origen === 'semilla_inventario' || cropFormData.origen === 'semilla_nueva') && (
                    <div style={{ 
                      position: 'relative', 
                      zIndex: 2, 
                      paddingLeft: isMobile ? '20px' : '72px',
                      animation: 'scaleIn 0.2s',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '18px'
                    }}>
                      <div style={{
                        position: 'absolute',
                        left: '1px',
                        top: '6px',
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        background: (cropFormData.origen === 'semilla_inventario' ? cropFormData.xcultivosidsemillas !== '' : cropFormData.semillascantidad !== '') ? '#10b981' : '#cbd5e1',
                        border: '2px solid white',
                        boxShadow: `0 0 0 1px ${(cropFormData.origen === 'semilla_inventario' ? cropFormData.xcultivosidsemillas !== '' : cropFormData.semillascantidad !== '') ? '#10b981' : '#cbd5e1'}`
                      }} />

                      {(cropFormData.origen !== 'semilla_inventario' || cropFormData.xcultivosidsemillas !== '') && (
                        <div style={{
                          position: 'absolute',
                          left: '6px',
                          top: '12px',
                          bottom: '-22px',
                          width: '2px',
                          background: (() => {
                            if (cropFormData.origen === 'semilla_inventario') {
                              return cropFormData.xcultivosidsemillas !== '' ? '#10b981' : '#cbd5e1';
                            }
                            return cropFormData.semillascantidad !== '' ? '#10b981' : '#cbd5e1';
                          })(),
                          zIndex: 1
                        }} />
                      )}

                      {/* A. SEMILLAS DEL INVENTARIO */}
                      {cropFormData.origen === 'semilla_inventario' && (
                        <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px dashed #cbd5e1', display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
                          
                          {cropFormData.xcultivosidsemillas !== '' ? (
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#065f46' }}>Lote de Semillas seleccionado</label>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCropFormData((prev: any) => ({ 
                                      ...prev, 
                                      xcultivosidsemillas: ''
                                    }));
                                  }}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#10b981',
                                    fontSize: '0.8rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    padding: 0
                                  }}
                                >
                                  ✏️ Cambiar lote
                                </button>
                              </div>
                              {(() => {
                                const s = getSemillaStock(selectedCropVariedad.idvariedadesvegetales)?.seedsList.find((item: any) => item.idsemillas === cropFormData.xcultivosidsemillas);
                                if (!s) return null;
                                return (
                                  <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '12px 16px',
                                    borderRadius: '12px',
                                    border: '2px solid #10b981',
                                    background: '#ecfdf5',
                                    width: '100%',
                                    animation: 'scaleIn 0.2s'
                                  }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '2px' }}>
                                      <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#065f46' }}>
                                        🌱 Semilla Nº {s.semillasnumerocoleccion || s.idsemillas}
                                      </span>
                                      <span style={{ fontSize: '0.78rem', color: '#047857' }}>
                                        Marca: {s.semillasmarca || 'Sin marca'} {s.semillaslugarcompra && `— Compra: ${s.semillaslugarcompra}`}
                                      </span>
                                    </div>
                                    <div style={{
                                      fontSize: '0.75rem',
                                      background: '#dcfce7',
                                      color: '#15803d',
                                      padding: '4px 8px',
                                      borderRadius: '8px',
                                      fontWeight: 700
                                    }}>
                                      📦 {s.semillasstockactual !== null ? `${s.semillasstockactual} uds.` : 'Disponible'}
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          ) : (
                            <div>
                              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>Selecciona el lote de Semillas a usar</label>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {getSemillaStock(selectedCropVariedad.idvariedadesvegetales)?.seedsList.map((s: any) => {
                                  return (
                                    <button
                                      key={s.idsemillas}
                                      type="button"
                                      onClick={() => {
                                        setCropFormData((prev: any) => ({ 
                                          ...prev, 
                                          xcultivosidsemillas: s.idsemillas
                                        }));
                                      }}
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '12px 16px',
                                        borderRadius: '12px',
                                        border: '1px solid #e2e8f0',
                                        background: 'white',
                                        cursor: 'pointer',
                                        width: '100%',
                                        transition: 'all 0.2s',
                                        outline: 'none'
                                      }}
                                      onMouseOver={e => {
                                        e.currentTarget.style.borderColor = '#10b981';
                                      }}
                                      onMouseOut={e => {
                                        e.currentTarget.style.borderColor = '#e2e8f0';
                                      }}
                                    >
                                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '2px', textAlign: 'left' }}>
                                        <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#1e293b' }}>
                                          🌱 Semilla Nº {s.semillasnumerocoleccion || s.idsemillas}
                                        </span>
                                        <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                                          Marca: {s.semillasmarca || 'Sin marca'} {s.semillaslugarcompra && `— Compra: ${s.semillaslugarcompra}`}
                                        </span>
                                      </div>
                                      <div style={{
                                        fontSize: '0.75rem',
                                        background: '#f1f5f9',
                                        color: '#475569',
                                        padding: '4px 8px',
                                        borderRadius: '8px',
                                        fontWeight: 700
                                      }}>
                                        📦 {s.semillasstockactual !== null ? `${s.semillasstockactual} disponibles` : 'Disponible'}
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                          <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#475569', lineHeight: 1.4 }}>
                            💡 Al plantar, restaremos automáticamente las semillas que uses de este lote digital para mantener tu banco actualizado.
                          </p>
                        </div>
                      )}

                      {/* B. NUEVO SOBRE DE SEMILLAS */}
                      {cropFormData.origen === 'semilla_nueva' && (
                        <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px dashed #cbd5e1', display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
                          <h4 style={{ margin: 0, color: '#475569', fontSize: '0.9rem' }}>Datos del nuevo sobre</h4>
                           <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '14px' }}>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>Marca / Comercial</label>
                              <input 
                                list="main-brands"
                                type="text" 
                                placeholder="Ej. Batlle, Rocalba..."
                                value={cropFormData.semillasmarca}
                                onChange={e => setCropFormData((prev: any) => ({ ...prev, semillasmarca: e.target.value }))}
                                style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }}
                              />
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>Lugar de compra</label>
                              <input 
                                list="buy-places"
                                type="text" 
                                placeholder="Ej. Leroy Merlin, Vivero..."
                                value={cropFormData.semillaslugarcompra}
                                onChange={e => setCropFormData((prev: any) => ({ ...prev, semillaslugarcompra: e.target.value }))}
                                style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }}
                              />
                            </div>
                          </div>

                          {/* Calculadora de gramos a semillas */}
                          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f766e', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              ⚖️ Calcular semillas por peso (Gramos)
                            </span>
                            
                            {selectedCropEspecie?.especiespeso1000semillas && Number(selectedCropEspecie.especiesvegetalespeso1000semillas) > 0 ? (
                              <div>
                                <p style={{ margin: '0 0 8px', fontSize: '0.8rem', color: '#64748b', lineHeight: 1.4 }}>
                                  Esta especie tiene un peso estándar registrado de <strong>{selectedCropEspecie.especiesvegetalespeso1000semillas}g</strong> por cada 1.000 semillas.
                                  <br />
                                  <span style={{ color: '#0d9488', fontWeight: 700 }}>
                                    Equivalencia: ≈ {Math.round(1000 / Number(selectedCropEspecie.especiesvegetalespeso1000semillas))} semillas por gramo.
                                  </span>
                                </p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <input 
                                    type="number" 
                                    step="0.01" 
                                    min="0"
                                    placeholder="Introduce los gramos del sobre..."
                                    value={cropInputGramos}
                                    onChange={e => handleCropGramosChange(e.target.value)}
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
                                      value={cropInputGramos}
                                      onChange={e => handleCropGramosChange(e.target.value)}
                                      style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }}
                                    />
                                  </div>
                                  <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>Semillas / Gramo</label>
                                    <input 
                                      type="number" 
                                      min="1"
                                      placeholder="Ej. 250"
                                      value={cropCustomSemillasPorGramo}
                                      onChange={e => {
                                        setCropCustomSemillasPorGramo(e.target.value);
                                        handleCropGramosChange(cropInputGramos, e.target.value);
                                      }}
                                      style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }}
                                    />
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Cantidad de semillas */}
                          <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Cantidad aprox. de semillas en sobre (uds)</label>
                            <input 
                              type="number"
                              min="1"
                              placeholder="Ej. 50"
                              value={cropFormData.semillascantidad}
                              onChange={e => setCropFormData((prev: any) => ({ ...prev, semillascantidad: e.target.value }))}
                              style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }}
                            />
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '14px' }}>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>Fecha Envasado / Cosecha</label>
                              <input 
                                type="date"
                                value={cropFormData.semillasfechaenvasado}
                                onChange={e => setCropFormData((prev: any) => ({ ...prev, semillasfechaenvasado: e.target.value }))}
                                style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                              />
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>Fecha Caducidad / Viabilidad</label>
                              <input 
                                type="date"
                                value={cropFormData.semillasfechacaducidad}
                                onChange={e => setCropFormData((prev: any) => ({ ...prev, semillasfechacaducidad: e.target.value }))}
                                style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                              />
                            </div>
                          </div>

                          {/* Agregar al Banco Digital */}
                          <div style={{ background: cropFormData.crearBanco ? '#ecfdf5' : '#f1f5f9', padding: '12px', borderRadius: '10px', border: `1px solid ${cropFormData.crearBanco ? '#10b981' : '#cbd5e1'}`, transition: 'all 0.2s' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 700, color: cropFormData.crearBanco ? '#065f46' : '#475569', fontSize: '0.85rem' }}>
                              <input 
                                type="checkbox"
                                checked={cropFormData.crearBanco}
                                onChange={e => setCropFormData((prev: any) => ({ ...prev, crearBanco: e.target.checked }))}
                                style={{ transform: 'scale(1.2)' }}
                              />
                              📥 Registrar sobre restante en mi Banco de Semillas digital
                            </label>
                            {cropFormData.crearBanco && (
                              <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px', animation: 'fadeIn 0.2s' }}>
                                <p style={{ margin: 0, fontSize: '0.75rem', color: '#047857' }}>
                                  Se guardará con el Nº de colección automático: <strong>#{cropNextNumero || '...'}</strong>
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                    </div>
                  )}

                  {/* Detalles Finales del Cultivo */}
                  {cropFormData.origen !== '' && (cropFormData.origen !== 'semilla_inventario' || cropFormData.xcultivosidsemillas !== '') && (
                    <div style={{ 
                      position: 'relative', 
                      zIndex: 2, 
                      paddingLeft: isMobile ? '16px' : '48px',
                      animation: 'scaleIn 0.2s'
                    }}>
                      <div style={{
                        position: 'absolute',
                        left: '1px',
                        top: '6px',
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        background: '#cbd5e1',
                        border: '2px solid white',
                        boxShadow: '0 0 0 1px #cbd5e1'
                      }} />

                      <div style={{ display: 'grid', gap: '18px', marginTop: '10px' }}>
                        
                        <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '8px 0' }} />
                        <h4 style={{ margin: 0, color: '#1e293b', fontSize: '0.95rem', fontWeight: 800 }}>🌱 Detalles Finales del Cultivo</h4>

                        {/* Fecha de siembra */}
                        <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px solid #cbd5e1' }}>
                          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>📅 Fecha de Inicio / Siembra</label>
                          <input 
                            type="date"
                            value={cropFormData.fechaInicio}
                            onChange={e => setCropFormData((prev: any) => ({ ...prev, fechaInicio: e.target.value }))}
                            style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }}
                          />
                        </div>

                        {/* Grid de cantidad y ubicación */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                              {(() => {
                                if (cropFormData.origen === 'semilla_inventario' || cropFormData.origen === 'semilla_nueva') {
                                  return '🌱 Cantidad de semillas';
                                }
                                if (cropFormData.origen === 'esqueje') {
                                  return '🌿 Cantidad de esquejes';
                                }
                                return '🪴 Cantidad de plantones';
                              })()}
                            </label>
                            <input 
                              type="number" 
                              min="1"
                              placeholder={(() => {
                                if (cropFormData.origen === 'semilla_inventario' || cropFormData.origen === 'semilla_nueva') {
                                  return 'Ej. 10';
                                }
                                if (cropFormData.origen === 'esqueje') {
                                  return 'Ej. 3';
                                }
                                return 'Ej. 5';
                              })()}
                              value={cropFormData.cantidad}
                              onChange={e => setCropFormData((prev: any) => ({ ...prev, cantidad: parseInt(e.target.value) || 1 }))}
                              style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }}
                            />
                            <p style={{ margin: '4px 0 0', fontSize: '0.72rem', color: '#64748b' }}>
                              {(() => {
                                if (cropFormData.origen === 'semilla_inventario' || cropFormData.origen === 'semilla_nueva') {
                                  return 'Número de semillas que vas a sembrar.';
                                }
                                if (cropFormData.origen === 'esqueje') {
                                  return 'Número de esquejes que vas a plantar.';
                                }
                                return 'Número de plantones vivos que vas a plantar.';
                              })()}
                            </p>
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Ubicación</label>
                            <input 
                              list="ubicaciones-list"
                              type="text" 
                              placeholder="Ej. Bancal 1, Maceta..."
                              value={cropFormData.ubicacion}
                              onChange={e => setCropFormData((prev: any) => ({ ...prev, ubicacion: e.target.value }))}
                              style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.95rem', outline: 'none' }}
                            />
                          </div>
                        </div>

                        {/* Botón Registrar */}
                        <button 
                          onClick={handleSaveCrop}
                          disabled={cropAcquiring}
                          style={{
                            background: 'linear-gradient(135deg, #065f46, #10b981)',
                            color: 'white', border: 'none', padding: '14px', borderRadius: '12px',
                            fontWeight: 800, fontSize: '1rem', cursor: cropAcquiring ? 'not-allowed' : 'pointer',
                            marginTop: '10px', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                            transition: 'all 0.2s'
                          }}
                          onMouseOver={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                          onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                          {cropAcquiring ? '⏳ Preparando tierra...' : '🚀 ¡Sembrar / Plantar Cultivo!'}
                        </button>

                      </div>
                    </div>
                  )}

                </div>
              </div>

            </>
          )}

          {/* PASO 5: ÉXITO */}
          {cropWizardStep === 5 && (
            <div style={{ padding: '40px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: '4.5rem', marginBottom: '16px' }}>🎉</div>
              <h3 style={{ color: '#065f46', margin: '0 0 8px', fontSize: '1.4rem', fontWeight: 900 }}>¡Cultivo Registrado con Éxito!</h3>
              <p style={{ color: '#64748b', margin: 0, fontSize: '0.95rem', lineHeight: 1.5 }}>
                Tu cultivo de <strong>{selectedCropVariedad?.variedadesvegetalesnombre}</strong> ya está activo. El progreso de logros se actualizará al instante.
              </p>
            </div>
          )}

        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}} />

      <datalist id="main-brands">
        <option value="Semillas Fitó" />
        <option value="Semillas Batlle" />
        <option value="Rocalba" />
        <option value="Vilmorin" />
        <option value="Clemente Viven" />
        <option value="EuroGarden" />
        <option value="Koprima" />
        <option value="Semillas Madre Tierra" />
        <option value="Fito Agrícola" />
        <option value="Semillas Cantueso" />
        <option value="Semillas Silvestres" />
      </datalist>
      <datalist id="buy-places">
        <option value="Leroy Merlin" />
        <option value="Verdecora" />
        <option value="Vivero local" />
        <option value="Amazon" />
        <option value="Lidl" />
        <option value="Aldi" />
        <option value="Ferretería local" />
        <option value="Cooperativa agrícola" />
      </datalist>
    </div>
  );
}
