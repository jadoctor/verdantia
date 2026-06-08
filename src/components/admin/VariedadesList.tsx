// src/components/admin/VariedadesList.tsx
'use client';
import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getMediaUrl } from '@/lib/media-url';

interface VariedadesListProps {
  especieId?: string | null;
  userEmail: string | null;
  focusVariedadId?: string | null;
  especieNombre?: string;
}

export default function VariedadesList({ especieId, userEmail, focusVariedadId, especieNombre }: VariedadesListProps) {
  const router = useRouter();
  const [variedades, setVariedades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'activas' | 'inactivas' | 'todas'>('activas');

  // AI Assistant States
  const [showAiConfig, setShowAiConfig] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSeconds, setAiSeconds] = useState(0);
  const aiTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [aiExtraInstructions, setAiExtraInstructions] = useState('Busca las variedades más populares y recomendadas para cultivo doméstico y comercial. Detalla sus características únicas.');
  const [aiPresetScope, setAiPresetScope] = useState('comercial');
  const [aiProposal, setAiProposal] = useState<any[]>([]);

  const aiPresetPrompts: Record<string, string> = {
    comercial: 'Busca las variedades comerciales y de gran rendimiento más populares en supermercados y fruterías.',
    tradicional: 'Busca variedades tradicionales, reliquia (heirloom), locales o autóctonas conocidas por su gran sabor y resistencia.',
    exotica: 'Busca variedades exóticas, raras, de colores llamativos o híbridos novedosos que sorprendan por su aspecto o sabor.'
  };

  const loadVariedades = async () => {
    if (!userEmail) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/variedades?filter=${filter}`, {
        headers: { 'x-user-email': userEmail },
      });
      const data = await res.json();
      const filtered = especieId
        ? (data.variedades || []).filter((v: any) => v.xvariedadesidespecies == especieId)
        : data.variedades || [];
      setVariedades(filtered);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userEmail) loadVariedades();
  }, [userEmail, especieId, filter]);

  useEffect(() => {
    if (!loading && focusVariedadId) {
      setTimeout(() => {
        const element = document.getElementById(`variedad-row-${focusVariedadId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 500);
    }
  }, [loading, focusVariedadId]);

  useEffect(() => {
    return () => {
      if (aiTimerRef.current) clearInterval(aiTimerRef.current);
    };
  }, []);

  const handleEdit = (id: string | null) => {
    if (id) router.push(`/dashboard/admin/variedades/${id}`);
    else router.push(`/dashboard/admin/variedades/nueva?especieId=${especieId}`);
  };

  const handleDelete = async (id: string) => {
    const variety = variedades.find(v => v.idvariedades.toString() === id);
    const isUsed = variety && (
      (variety.total_asociaciones || 0) > 0 || 
      (variety.total_semillas || 0) > 0 || 
      (variety.total_cultivos || 0) > 0
    );

    const message = isUsed 
      ? 'Esta variedad está siendo utilizada por usuarios, cultivos o inventarios de semillas.\n\nNo se puede eliminar físicamente de la base de datos para no dañar sus registros, pero se INHABILITARÁ (dejará de estar visible en el catálogo general).\n\n¿Quieres inhabilitarla?'
      : '¿Estás seguro de que quieres eliminar esta variedad?';

    if (!confirm(message)) return;
    if (!userEmail) return;
    try {
      const res = await fetch(`/api/admin/variedades/${id}`, {
        method: 'DELETE',
        headers: { 'x-user-email': userEmail },
      });
      const data = await res.json();
      if (data.success) {
        loadVariedades();
      } else {
        alert('Error: ' + data.error);
      }
    } catch (e) {
      alert('Error al realizar la operación');
    }
  };

  const handleReactivate = async (id: string) => {
    if (!userEmail) return;
    try {
      const res = await fetch(`/api/admin/variedades/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-email': userEmail 
        },
        body: JSON.stringify({ variedadesvisibilidadsino: 1 })
      });
      if (res.ok) {
        loadVariedades();
      } else {
        alert('Error al reactivar la variedad');
      }
    } catch (e) {
      alert('Error de red al reactivar la variedad');
    }
  };

  const openAiConfig = () => {
    if (!especieNombre) {
      alert('Se necesita el nombre de la especie para proponer variedades.');
      return;
    }
    setShowAiConfig(true);
  };

  const proponerVariedadesAI = async () => {
    setAiLoading(true);
    setAiSeconds(0);
    aiTimerRef.current = setInterval(() => setAiSeconds(s => s + 1), 1000);
    try {
      const res = await fetch('/api/ai/proponer-variedades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail || '' },
        body: JSON.stringify({
          especieNombre,
          existingVariedades: variedades,
          extraInstructions: `${aiPresetPrompts[aiPresetScope]}\n${aiExtraInstructions}`
        })
      });
      const data = await res.json();
      if (data.success && data.variedades) {
        const propuestos = data.variedades.map((v: any) => ({
          ...v,
          _selected: true
        }));
        setAiProposal(propuestos);
        setShowAiConfig(false);
        setShowAiModal(true);
      } else {
        alert(data.error || 'Error al proponer variedades.');
      }
    } catch (e) {
      console.error(e);
      alert('Error de conexión con la IA.');
    } finally {
      setAiLoading(false);
      if (aiTimerRef.current) {
        clearInterval(aiTimerRef.current);
        aiTimerRef.current = null;
      }
    }
  };

  const handleSaveAiProposal = async () => {
    const selected = aiProposal.filter(p => p._selected);
    if (selected.length === 0) {
      setShowAiModal(false);
      return;
    }

    if (!userEmail || !especieId) return;

    try {
      setLoading(true);
      for (const v of selected) {
        await fetch('/api/admin/variedades', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail },
          body: JSON.stringify({
            variedadesnombre: v.variedadesnombre,
            xvariedadesidespecies: especieId,
            variedadestamano: v.variedadestamano,
            variedadesdiasgerminacion: v.variedadesdiasgerminacion,
            variedadescolor: v.variedadescolor,
            variedadesdescripcion: v.variedadesdescripcion,
            variedadesvisibilidadsino: 1
          })
        });
      }
      setShowAiModal(false);
      await loadVariedades();
    } catch (e) {
      console.error('Error guardando las variedades propuestas:', e);
      alert('Error al guardar las variedades propuestas.');
    } finally {
      setLoading(false);
    }
  };

  if (!especieId) {
    return (
      <div style={{ background: '#f8fafc', padding: '30px', textAlign: 'center', borderRadius: '12px', border: '1px dashed #cbd5e1', color: '#64748b' }}>
        <p>Debes guardar la especie primero para gestionar sus variedades.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
      {/* Botones de acción alineados arriba a la izquierda (sin título redundante) */}
      <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <button
          onClick={openAiConfig}
          type="button"
          style={{ padding: '8px 16px', borderRadius: '8px', background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem', boxShadow: '0 4px 6px rgba(139, 92, 246, 0.2)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          ✨ Asistente IA
        </button>
        <button
          onClick={() => handleEdit(null)}
          style={{ padding: '8px 16px', borderRadius: '8px', background: '#7c3aed', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem', boxShadow: '0 4px 6px rgba(124, 58, 237, 0.2)' }}
        >
          ➕ Nueva Variedad
        </button>
        <div style={{ display: 'inline-flex', background: '#f1f5f9', padding: '4px', borderRadius: '8px', border: '1px solid #cbd5e1', gap: '4px' }}>
          {(['activas', 'inactivas', 'todas'] as const).map((opt) => {
            const isActive = filter === opt;
            const labels = {
              activas: '🟢 Activas',
              inactivas: '🔴 Inactivas',
              todas: '👁️ Todas'
            };
            return (
              <button
                key={opt}
                type="button"
                onClick={() => setFilter(opt)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  background: isActive ? 'white' : 'transparent',
                  color: isActive ? '#1e293b' : '#475569',
                  fontWeight: 'bold',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
                }}
              >
                {labels[opt]}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ position: 'relative', minHeight: '200px', marginTop: '20px' }}>
        {loading && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(255, 255, 255, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            borderRadius: '12px',
            backdropFilter: 'blur(1px)'
          }}>
            <style>{`
              @keyframes spin-loader {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                border: '3px solid #cbd5e1',
                borderTop: '3px solid #7c3aed',
                borderRadius: '50%',
                animation: 'spin-loader 0.8s linear infinite'
              }} />
              <span style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 'bold' }}>Cargando variedades...</span>
            </div>
          </div>
        )}

        {variedades.length === 0 && !loading ? (
          <p style={{ color: '#64748b', textAlign: 'center', padding: '40px' }}>No hay variedades registradas para esta especie.</p>
        ) : (
          <div style={{ overflowX: 'auto', opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s ease' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <tr>
                  <th style={{ padding: '12px', color: '#475569', fontSize: '0.85rem' }}>Nombre de Variedad</th>
                  <th style={{ padding: '12px', color: '#475569', fontSize: '0.85rem' }}>Tamaño</th>
                  <th style={{ padding: '12px', color: '#475569', fontSize: '0.85rem' }}>Germinación</th>
                  <th style={{ padding: '12px', textAlign: 'right', color: '#475569', fontSize: '0.85rem' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {variedades.map((v, i) => {
                  const isFocused = focusVariedadId && v.idvariedades.toString() === focusVariedadId.toString();
                  return (
                    <tr 
                      key={v.idvariedades} 
                      id={`variedad-row-${v.idvariedades}`}
                      style={{ 
                        borderBottom: '1px solid #e2e8f0', 
                        background: isFocused ? '#f5f3ff' : (v.variedadesvisibilidadsino === 0 ? '#f1f5f9' : (i % 2 === 0 ? 'white' : '#f8fafc')),
                        opacity: v.variedadesvisibilidadsino === 0 ? 0.65 : 1,
                        outline: isFocused ? '2px solid #7c3aed' : 'none',
                        outlineOffset: '-2px',
                        transition: 'all 0.5s ease'
                      }}
                    >
                      <td style={{ padding: '12px', fontWeight: 'bold', color: '#1e293b' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {v.primary_photo_ruta ? (
                            <img 
                              src={getMediaUrl(v.primary_photo_ruta)} 
                              alt={v.variedadesnombre} 
                              style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }} 
                              crossOrigin="anonymous"
                            />
                          ) : (
                            <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'linear-gradient(135deg, #f1f5f9, #e2e8f0)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', color: '#94a3b8', border: '1px dashed #cbd5e1' }} title="Sin foto">
                              🌱
                            </div>
                          )}
                          <span>{v.variedadesnombre}</span>
                          {v.variedadesvisibilidadsino === 0 && (
                            <span style={{ fontSize: '0.7rem', background: '#fee2e2', color: '#b91c1c', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              Inactiva
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '12px', textTransform: 'capitalize', color: '#475569' }}>{v.variedadestamano || '-'}</td>
                      <td style={{ padding: '12px', color: '#475569' }}>{v.variedadesdiasgerminacion ? `${v.variedadesdiasgerminacion} d` : '-'}</td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                          <button
                            onClick={() => handleEdit(v.idvariedades.toString())}
                            style={{ background: '#f8fafc', border: '1px solid #cbd5e1', color: '#475569', cursor: 'pointer', fontSize: '0.8rem', padding: '4px 10px', borderRadius: '6px', fontWeight: 'bold' }}
                          >
                            Editar
                          </button>
                          {v.variedadesvisibilidadsino === 0 ? (
                            <button
                              onClick={() => handleReactivate(v.idvariedades.toString())}
                              style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#059669', cursor: 'pointer', fontSize: '0.8rem', padding: '4px 10px', borderRadius: '6px', fontWeight: 'bold' }}
                            >
                              Reactivar
                            </button>
                          ) : (
                            <button
                              onClick={() => handleDelete(v.idvariedades.toString())}
                              style={{ 
                                background: ((v.total_asociaciones || 0) > 0 || (v.total_semillas || 0) > 0 || (v.total_cultivos || 0) > 0) ? '#fef3c7' : '#fee2e2', 
                                border: ((v.total_asociaciones || 0) > 0 || (v.total_semillas || 0) > 0 || (v.total_cultivos || 0) > 0) ? '1px solid #fde68a' : '1px solid #fca5a5', 
                                color: ((v.total_asociaciones || 0) > 0 || (v.total_semillas || 0) > 0 || (v.total_cultivos || 0) > 0) ? '#d97706' : '#ef4444', 
                                cursor: 'pointer', 
                                fontSize: '0.8rem', 
                                padding: '4px 10px', 
                                borderRadius: '6px', 
                                fontWeight: 'bold' 
                              }}
                            >
                              {((v.total_asociaciones || 0) > 0 || (v.total_semillas || 0) > 0 || (v.total_cultivos || 0) > 0) ? 'Inhabilitar' : 'Eliminar'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {variedades.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>No hay variedades registradas para esta especie.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* AI CONFIG MODAL */}
      {showAiConfig && (
        <div 
          style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.45)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(12px) saturate(180%)' }}
          onClick={() => setShowAiConfig(false)}
        >
          <div 
            style={{ background: '#fff', borderRadius: '16px', border: '1px solid rgba(124, 58, 237, 0.2)', width: '90%', maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(124, 58, 237, 0.25)' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTopLeftRadius: '15px', borderTopRightRadius: '15px' }}>
              <h2 style={{ color: 'white', margin: 0, fontSize: '1.2rem', fontWeight: 'bold' }}>✨ Buscador de Variedades con IA</h2>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <button
                  type="button"
                  disabled={aiLoading}
                  onClick={proponerVariedadesAI}
                  style={{
                    padding: '8px 16px', 
                    background: aiLoading ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.15)',
                    color: 'white', 
                    border: '2px solid rgba(255,255,255,0.5)', 
                    borderRadius: '8px', 
                    fontWeight: 'bold',
                    cursor: aiLoading ? 'not-allowed' : 'pointer', 
                    fontSize: '0.9rem',
                    transition: 'all 0.2s', 
                    whiteSpace: 'nowrap'
                  }}
                >
                  {aiLoading ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite', fontSize: '1rem' }}>⏳</span>
                      {aiSeconds}s
                    </span>
                  ) : '🚀 Buscar'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAiConfig(false)}
                  style={{ padding: '8px 12px', background: 'none', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '1.2rem' }}
                >
                  ✖
                </button>
              </div>
            </div>

            <div style={{ padding: '24px' }}>
              <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '16px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
                <p style={{ margin: '0 0 4px', fontWeight: 'bold', color: '#1e293b', fontSize: '1.05rem' }}>
                  Objetivo: Buscar variedades de la especie <span style={{ color: '#7c3aed' }}>"{especieNombre}"</span>
                </p>
                <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem', lineHeight: '1.4' }}>
                  La IA propondrá variedades comerciales o tradicionales y completará automáticamente sus características básicas de tamaño, días de germinación aproximados, color y descripción.
                </p>
              </div>

              {/* Presets */}
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 12px', color: '#1e293b', fontSize: '1rem' }}>🌱 Enfoque de Búsqueda</h4>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {[
                    { key: 'comercial', emoji: '🛒', label: 'Comercial' },
                    { key: 'tradicional', emoji: '🏺', label: 'Tradicional / Reliquia' },
                    { key: 'exotica', emoji: '🌟', label: 'Exótica / Rara' }
                  ].map(preset => (
                    <label 
                      key={preset.key} 
                      style={{
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px', 
                        padding: '10px 16px',
                        border: aiPresetScope === preset.key ? '2px solid #7c3aed' : '1px solid #e2e8f0',
                        borderRadius: '8px', 
                        cursor: 'pointer',
                        background: aiPresetScope === preset.key ? '#f5f3ff' : '#fff',
                        transition: 'all 0.2s', 
                        flex: '1', 
                        minWidth: '150px'
                      }}
                    >
                      <input
                        type="radio"
                        name="aiPresetScope"
                        checked={aiPresetScope === preset.key}
                        onChange={() => setAiPresetScope(preset.key)}
                        style={{ width: '18px', height: '18px', accentColor: '#7c3aed' }}
                      />
                      <span style={{ fontWeight: aiPresetScope === preset.key ? 'bold' : 'normal', color: '#1e293b', fontSize: '0.95rem' }}>
                        {preset.emoji} {preset.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Extra instructions */}
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 8px', color: '#1e293b', fontSize: '1rem' }}>💬 Instrucciones Adicionales</h4>
                <textarea
                  value={aiExtraInstructions}
                  onChange={e => setAiExtraInstructions(e.target.value)}
                  placeholder="Escribe detalles específicos que quieras que la IA priorice..."
                  rows={4}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', resize: 'vertical', fontFamily: 'inherit', lineHeight: '1.5' }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI CHECKLIST MODAL */}
      {showAiModal && (() => {
        const isExisting = (prop: any) => variedades.some(v => 
          v.variedadesnombre?.toLowerCase().trim() === prop.variedadesnombre?.toLowerCase().trim()
        );
        const existingOnes = aiProposal.filter(isExisting);
        const newOnes = aiProposal.filter(p => !isExisting(p));
        const hasBoth = existingOnes.length > 0 && newOnes.length > 0;

        const renderVarietyCard = (prop: any, isAlreadyIncluded: boolean) => {
          return (
            <label 
              key={prop.variedadesnombre} 
              style={{
                display: 'flex', 
                alignItems: 'flex-start', 
                gap: '12px', 
                padding: '14px',
                border: isAlreadyIncluded ? '1px solid #cbd5e1' : prop._selected ? '2px solid #10b981' : '1px solid #e2e8f0',
                borderRadius: '8px', 
                cursor: isAlreadyIncluded ? 'default' : 'pointer',
                background: isAlreadyIncluded ? '#f8fafc' : prop._selected ? '#f0fdf4' : '#fff',
                transition: 'all 0.2s', 
                position: 'relative'
              }}
            >
              {!isAlreadyIncluded && (
                <input
                  type="checkbox"
                  checked={prop._selected}
                  onChange={(e) => {
                    const updated = aiProposal.map(p => 
                      p.variedadesnombre === prop.variedadesnombre ? { ...p, _selected: e.target.checked } : p
                    );
                    setAiProposal(updated);
                  }}
                  style={{ marginTop: '3px', width: '18px', height: '18px', accentColor: '#10b981', flexShrink: 0 }}
                />
              )}
              {isAlreadyIncluded && (
                <span style={{ fontSize: '1.1rem', flexShrink: 0, marginTop: '2px' }}>✅</span>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '1.05rem', color: isAlreadyIncluded ? '#64748b' : '#1e293b' }}>
                    {prop.variedadesnombre}
                  </span>
                  <div style={{ display: 'flex', gap: '6px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                    <span style={{ background: '#e0e7ff', color: '#4338ca', padding: '2px 8px', borderRadius: '4px', textTransform: 'capitalize' }}>
                      📏 {prop.variedadestamano}
                    </span>
                    {prop.variedadesdiasgerminacion && (
                      <span style={{ background: '#ecfdf5', color: '#065f46', padding: '2px 8px', borderRadius: '4px' }}>
                        🌱 {prop.variedadesdiasgerminacion} d
                      </span>
                    )}
                    {prop.variedadescolor && (
                      <span style={{ background: '#fef3c7', color: '#d97706', padding: '2px 8px', borderRadius: '4px' }}>
                        🎨 {prop.variedadescolor}
                      </span>
                    )}
                  </div>
                </div>
                <p style={{ margin: '6px 0 0', fontSize: '0.85rem', color: '#64748b', lineHeight: '1.4' }}>
                  {prop.variedadesdescripcion}
                </p>
              </div>
            </label>
          );
        };

        return (
          <div 
            style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.45)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(12px) saturate(180%)' }}
            onClick={() => setShowAiModal(false)}
          >
            <div 
              style={{ background: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid rgba(124, 58, 237, 0.2)', width: '90%', maxWidth: hasBoth ? '950px' : '650px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(124, 58, 237, 0.25)' }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #e2e8f0', paddingBottom: '12px', marginBottom: '16px' }}>
                <h2 style={{ margin: 0, color: '#1e293b', fontSize: '1.3rem', fontWeight: 'bold' }}>
                  ✨ Variedades Propuestas por la IA
                </h2>
                <button type="button" onClick={() => setShowAiModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#94a3b8' }}>&times;</button>
              </div>

              {hasBoth ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                  {/* Left column: Already registered */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', padding: '8px 12px', background: '#f1f5f9', borderRadius: '8px', borderLeft: '4px solid #94a3b8' }}>
                      <span style={{ fontWeight: 'bold', color: '#475569', fontSize: '0.95rem' }}>Ya registradas ({existingOnes.length})</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {existingOnes.map(prop => renderVarietyCard(prop, true))}
                    </div>
                  </div>

                  {/* Right column: Proposed new ones */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', padding: '8px 12px', background: '#f0fdf4', borderRadius: '8px', borderLeft: '4px solid #10b981' }}>
                      <span style={{ fontWeight: 'bold', color: '#065f46', fontSize: '0.95rem' }}>Disponibles para incorporar ({newOnes.length})</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {newOnes.map(prop => renderVarietyCard(prop, false))}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ marginBottom: '24px' }}>
                  {existingOnes.length > 0 && newOnes.length === 0 && (
                    <div style={{ padding: '24px', textAlign: 'center', background: '#f0fdf4', borderRadius: '12px', border: '2px solid #bbf7d0', marginBottom: '16px' }}>
                      <span style={{ fontSize: '2rem', display: 'block', marginBottom: '8px' }}>🎉</span>
                      <p style={{ color: '#065f46', fontWeight: 'bold', fontSize: '1.1rem', margin: '0 0 4px' }}>¡Todas las variedades propuestas ya existen!</p>
                      <p style={{ color: '#15803d', margin: 0, fontSize: '0.95rem' }}>La base de datos ya cuenta con todas las sugerencias de la IA.</p>
                    </div>
                  )}
                  {newOnes.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', padding: '8px 12px', background: '#f0fdf4', borderRadius: '8px', borderLeft: '4px solid #10b981' }}>
                        <span style={{ fontWeight: 'bold', color: '#065f46', fontSize: '0.95rem' }}>Nuevas variedades sugeridas ({newOnes.length})</span>
                      </div>
                      {newOnes.map(prop => renderVarietyCard(prop, false))}
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '2px solid #e2e8f0', paddingTop: '16px' }}>
                <button 
                  type="button" 
                  onClick={() => setShowAiModal(false)} 
                  style={{ padding: '8px 16px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', color: '#475569' }}
                >
                  Cancelar
                </button>
                {newOnes.filter(p => p._selected).length > 0 && (
                  <button
                    type="button"
                    onClick={handleSaveAiProposal}
                    style={{ padding: '8px 20px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.3)' }}
                  >
                    Guardar Seleccionadas ({newOnes.filter(p => p._selected).length})
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
