'use client';

import React, { useEffect, useState } from 'react';
import { getMediaUrl } from '@/lib/media-url';

interface Conflicto {
  id: number;
  ruta: string;
  motivoRechazo: string;
  variedadNombre: string | null;
  especieNombre: string | null;
  incidenciaId: number;
  estadoIncidencia: string | null;
  notasIncidencia: string | null;
  fechaSubida: string;
  fechaRechazo: string;
}

export default function ConflictosDashboard({
  email,
  onResolved
}: {
  email: string;
  onResolved: () => void;
}) {
  const [conflictos, setConflictos] = useState<Conflicto[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [appealingId, setAppealingId] = useState<number | null>(null);
  const [motivoRecurso, setMotivoRecurso] = useState('');

  useEffect(() => {
    fetch(`/api/user/conflictos?email=${encodeURIComponent(email)}`, { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } })
      .then(res => res.json())
      .then(data => {
        if (data.conflictos) {
          setConflictos(data.conflictos);
          if (data.conflictos.length === 0) onResolved();
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [email, onResolved]);

  const [replacingId, setReplacingId] = useState<number | null>(null);

  // El timer JS se elimina a favor de un timer CSS por hardware

  const handleEliminar = async (photoId: number) => {
    setDeletingId(photoId);
    try {
      const res = await fetch(`/api/user/conflictos?photoId=${photoId}&email=${encodeURIComponent(email)}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        const remaining = conflictos.filter(c => c.id !== photoId);
        setConflictos(remaining);
        setTimeout(onResolved, 500); // Llamamos siempre para actualizar el perfil del layout
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDeletingId(null);
    }
  };

  const handleRecurrir = async (incidenciaId: number, photoId: number) => {
    if (!motivoRecurso.trim()) {
      alert('Por favor, explica brevemente por qué crees que la foto es válida.');
      return;
    }
    setAppealingId(photoId);
    try {
      const res = await fetch(`/api/user/conflictos`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, incidenciaId, motivoRecurso })
      });
      if (res.ok) {
        const remaining = conflictos.filter(c => c.id !== photoId);
        setConflictos(remaining);
        setMotivoRecurso('');
        if (remaining.length === 0) {
          setTimeout(onResolved, 500);
        }
      } else {
        alert('Hubo un error enviando tu recurso. Inténtalo de nuevo.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAppealingId(null);
    }
  };

  const formatDate = (d: string) => {
    try {
      if (!d) return 'Desconocida';
      return new Date(d).toLocaleString('es-ES', { 
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch { return 'Desconocida'; }
  };

  const handleReemplazarFoto = async (conflictoId: number, file: File) => {
    setReplacingId(conflictoId);
    // Forzamos un pequeño respiro al navegador para que pinte la pantalla de carga y arranque el timer antes de bloquear el hilo con la IA
    await new Promise(r => setTimeout(r, 100));

    try {
      let fileToUpload = file;
      
      const conflicto = conflictos.find(c => c.id === conflictoId);
      const isProfilePhoto = conflicto && !conflicto.especieNombre;

      if (isProfilePhoto) {
        try {
          const isMobile = typeof window !== 'undefined' && (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768);
          
          if (!isMobile) {
            // ── Paso 1: Eliminar fondo con IA ──
            const { removeBackground } = await import('@imgly/background-removal');
            
            const resultBlob = await Promise.race([
              removeBackground(file, { output: { format: 'image/png' } }),
              new Promise<null>((_, reject) => setTimeout(() => reject(new Error('timeout')), 15000))
            ]);

            if (resultBlob) {
              // Poner fondo blanco en lugar de transparente
              const img = new Image();
              const blobUrl = URL.createObjectURL(resultBlob);
              await new Promise<void>((resolve, reject) => {
                img.onload = () => resolve();
                img.onerror = () => reject(new Error('Error cargando imagen procesada'));
                img.src = blobUrl;
              });
              const canvas = document.createElement('canvas');
              canvas.width = img.naturalWidth;
              canvas.height = img.naturalHeight;
              const ctx = canvas.getContext('2d')!;
              ctx.fillStyle = '#FFFFFF';
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              ctx.drawImage(img, 0, 0);
              URL.revokeObjectURL(blobUrl);
              const processedBlob = await new Promise<Blob>((resolve) =>
                canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.92)
              );
              
              fileToUpload = new File([processedBlob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", { type: 'image/jpeg' });
            }
          }
        } catch (e) {
          console.warn('Error en limpieza de fondo IA, subiendo original:', e);
        }
      }

      const formData = new FormData();
      formData.append('oldId', conflictoId.toString());
      formData.append('file', fileToUpload);
      formData.append('userEmail', email);

      const res = await fetch('/api/user/conflictos/reemplazar', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) throw new Error('Error reemplazando foto');

      // Actualizar UI
      setConflictos(prev => prev.filter(c => c.id !== conflictoId));
      if (onResolved) setTimeout(onResolved, 500);
      
      // Si era el último, el layout lo detectará y se cerrará
    } catch (e) {
      console.error(e);
      alert('Hubo un error al reemplazar la foto');
    } finally {
      setReplacingId(null);
    }
  };

  if (loading) return null;
  if (conflictos.length === 0 && !replacingId) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.85)',
      backdropFilter: 'blur(10px)',
      zIndex: 999999, // Por encima de todo
      display: 'flex',
      flexDirection: 'column',
      padding: '20px',
      overflowY: 'auto'
    }}>
      {replacingId && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(255,255,255,0.9)', zIndex: 9999999,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
        }}>
          <style>{`
            @property --sec {
              syntax: "<integer>";
              initial-value: 0;
              inherits: false;
            }
            @keyframes hardware-timer-anim {
              from { --sec: 0; }
              to { --sec: 59; }
            }
            .hardware-timer::after {
              animation: hardware-timer-anim 59s linear forwards;
              counter-reset: sec-counter var(--sec);
              content: "00:" counter(sec-counter, decimal-leading-zero);
            }
            @keyframes spin-hourglass { 0% { transform: rotate(0deg); } 50% { transform: rotate(180deg); } 100% { transform: rotate(180deg); } }
            @keyframes pulse-text { 0% { opacity: 0.7; } 50% { opacity: 1; } 100% { opacity: 0.7; } }
          `}</style>
          <div style={{ fontSize: '4rem', animation: 'spin-hourglass 2s infinite ease-in-out' }}>⏳</div>
          <h2 style={{ color: '#0f172a', marginTop: '24px', animation: 'pulse-text 1.5s infinite ease-in-out' }}>Procesando y Subiendo...</h2>
          <div className="hardware-timer" style={{ fontSize: '1.5rem', color: '#64748b', fontWeight: 600, marginTop: '8px', fontVariantNumeric: 'tabular-nums' }}>
          </div>
          <p style={{ color: '#94a3b8', marginTop: '16px', maxWidth: '300px', textAlign: 'center' }}>
            Aplicando IA para eliminar el fondo y optimizando la imagen...
          </p>
        </div>
      )}

      <div style={{
        maxWidth: '800px',
        width: '100%',
        margin: '40px auto',
        flexShrink: 0,
        background: 'white',
        borderRadius: '24px',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
        overflow: 'hidden'
      }}>
        <div style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', padding: '30px', color: 'white', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '10px' }}>⚠️</div>
          <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 900 }}>Acción Requerida</h2>
          <p style={{ margin: '10px 0 0', opacity: 0.9, fontSize: '1.05rem', lineHeight: 1.5 }}>
            Tienes {conflictos.length} {conflictos.length === 1 ? 'foto rechazada' : 'fotos rechazadas'} por el equipo de moderación debido a infracciones de la normativa.
            <br/>Debes eliminarlas para poder continuar usando la plataforma.
          </p>
        </div>

        <div style={{ padding: '30px', paddingBottom: '50px' }}>
          <div style={{ display: 'grid', gap: '24px' }}>
            {conflictos.map(c => (
              <div key={c.id} style={{
                display: 'flex', gap: '20px', border: '1px solid #fca5a5', background: '#fef2f2',
                borderRadius: '16px', padding: '16px', alignItems: 'flex-start',
                flexDirection: window.innerWidth < 600 ? 'column' : 'row'
              }}>
                <div style={{
                  flexShrink: 0, display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
                  width: window.innerWidth < 600 ? '100%' : '160px'
                }}>
                  <img 
                    src={getMediaUrl(c.ruta)} 
                    alt="Rechazada" 
                    crossOrigin="anonymous"
                    style={{ 
                      maxWidth: '100%', 
                      maxHeight: window.innerWidth < 600 ? '250px' : '160px', 
                      borderRadius: '12px', 
                      objectFit: 'contain',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }} 
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 8px', color: '#7f1d1d', fontSize: '1.1rem' }}>
                    {c.especieNombre ? `🌱 ${c.especieNombre} ${c.variedadNombre ? `(${c.variedadNombre})` : ''}` : '👤 Foto de Perfil'}
                  </h3>
                  
                  {(() => {
                    const partes = c.notasIncidencia?.split(/--- RESOLUCIÓN DEL EQUIPO \([^)]+\) ---/);
                    const bloqueRecurso = partes?.[0] || '';
                    const bloqueResolucion = partes?.[1] || '';
                    
                    const matchRecurso = c.notasIncidencia?.match(/RECURSO DEL USUARIO \(([^)]+)\)/);
                    const fechaRecurso = matchRecurso ? matchRecurso[1] : null;

                    const matchResolucion = c.notasIncidencia?.match(/RESOLUCIÓN DEL EQUIPO \(([^)]+)\)/);
                    const fechaResolucion = matchResolucion ? matchResolucion[1] : null;

                    const textoRecurso = bloqueRecurso.replace(/--- RECURSO DEL USUARIO \([^)]+\) ---/, '').trim();
                    const textoResolucion = bloqueResolucion.trim();

                    const tieneAlegacion = Boolean(textoRecurso && textoRecurso.length > 0) || c.estadoIncidencia === 'apelada';
                    const estaResuelto = c.estadoIncidencia === 'resuelta';

                    return (
                      <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
                        <h4 style={{ margin: '0 0 16px', color: '#0f172a', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          ⏱️ Cronología del Conflicto
                        </h4>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '0.9rem', color: '#334155', position: 'relative', paddingLeft: '24px', borderLeft: '3px solid #cbd5e1', marginLeft: '8px' }}>
                          
                          {/* 1. Subida */}
                          <div style={{ position: 'relative' }}>
                            <div style={{ position: 'absolute', left: '-33px', top: '4px', width: '12px', height: '12px', borderRadius: '50%', background: '#94a3b8', border: '2px solid #f8fafc' }} />
                            <b style={{ color: '#0f172a' }}>1. Foto subida</b> <span style={{ color: '#64748b' }}>({formatDate(c.fechaSubida)})</span>
                          </div>

                          {/* 2. Rechazo */}
                          <div style={{ position: 'relative' }}>
                            <div style={{ position: 'absolute', left: '-33px', top: '4px', width: '12px', height: '12px', borderRadius: '50%', background: '#ef4444', border: '2px solid #f8fafc' }} />
                            <b style={{ color: '#ef4444' }}>2. Foto rechazada</b> <span style={{ color: '#64748b' }}>({formatDate(c.fechaRechazo)})</span>
                            <div style={{ marginTop: '8px', padding: '12px', background: 'white', borderRadius: '8px', border: '1px solid #fecaca', color: '#991b1b', fontSize: '0.85rem' }}>
                              <b>Motivo:</b> {c.motivoRechazo}
                            </div>
                          </div>

                          {/* 3. Alegación */}
                          {tieneAlegacion && (
                            <div style={{ position: 'relative' }}>
                              <div style={{ position: 'absolute', left: '-33px', top: '4px', width: '12px', height: '12px', borderRadius: '50%', background: '#8b5cf6', border: '2px solid #f8fafc' }} />
                              <b style={{ color: '#8b5cf6' }}>3. Alegación enviada</b> {fechaRecurso && <span style={{ color: '#64748b' }}>({formatDate(fechaRecurso)})</span>}
                              <div style={{ marginTop: '8px', padding: '12px', background: 'white', borderRadius: '8px', border: '1px solid #ddd6fe', color: '#5b21b6', fontSize: '0.85rem', whiteSpace: 'pre-wrap', fontStyle: 'italic' }}>
                                "{textoRecurso || 'Sin texto de alegación'}"
                              </div>
                            </div>
                          )}

                          {/* 4. Resolución */}
                          {estaResuelto && (
                            <div style={{ position: 'relative' }}>
                              <div style={{ position: 'absolute', left: '-33px', top: '4px', width: '12px', height: '12px', borderRadius: '50%', background: '#dc2626', border: '2px solid #f8fafc' }} />
                              <b style={{ color: '#dc2626' }}>4. Resolución Final</b> {fechaResolucion && <span style={{ color: '#64748b' }}>({formatDate(fechaResolucion)})</span>}
                              <div style={{ marginTop: '8px', padding: '12px', background: '#fef2f2', borderRadius: '8px', border: '1px solid #fca5a5', color: '#991b1b', fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>
                                <b>Resolución del equipo:</b><br />
                                {textoResolucion || 'Recurso denegado por incumplimiento de normativa.'}
                              </div>
                            </div>
                          )}
                          
                        </div>

                        {estaResuelto && (
                          <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.9rem', color: '#dc2626', fontWeight: 700, textAlign: 'center' }}>
                              ❌ {tieneAlegacion ? 'Vía de apelación agotada.' : 'Resolución definitiva.'} La foto debe ser eliminada.
                            </span>
                            <div style={{ display: 'flex', gap: '12px', width: '100%', maxWidth: '500px', flexDirection: window.innerWidth < 600 ? 'column' : 'row' }}>
                              <button
                                onClick={() => handleEliminar(c.id)}
                                disabled={deletingId === c.id || replacingId === c.id}
                                style={{
                                  background: '#dc2626', color: 'white', border: 'none', padding: '12px 24px',
                                  borderRadius: '8px', fontWeight: 700, cursor: (deletingId === c.id || replacingId === c.id) ? 'not-allowed' : 'pointer',
                                  flex: 1, fontSize: '1rem',
                                  boxShadow: '0 4px 6px -1px rgba(220, 38, 38, 0.3)',
                                  opacity: (deletingId === c.id || replacingId === c.id) ? 0.7 : 1
                                }}
                              >
                                {deletingId === c.id ? '⏳ Eliminando...' : '🗑️ ELIMINAR FOTO'}
                              </button>

                              <label style={{ flex: 1 }}>
                                <input 
                                  type="file" 
                                  accept="image/*" 
                                  style={{ display: 'none' }}
                                  disabled={deletingId === c.id || replacingId === c.id}
                                  onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                      handleReemplazarFoto(c.id, e.target.files[0]);
                                    }
                                  }}
                                />
                                <div style={{
                                  background: '#10b981', color: 'white', padding: '12px 24px',
                                  borderRadius: '8px', fontWeight: 700, cursor: (deletingId === c.id || replacingId === c.id) ? 'not-allowed' : 'pointer',
                                  textAlign: 'center', fontSize: '1rem',
                                  boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.3)',
                                  opacity: (deletingId === c.id || replacingId === c.id) ? 0.7 : 1
                                }}>
                                  {replacingId === c.id ? '⏳ Subiendo...' : '📸 SUBIR REEMPLAZO'}
                                </div>
                              </label>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                  
                  {/* Ocultamos los botones antiguos si está resuelta porque ahora está el botón integrado arriba */}
                  {c.estadoIncidencia !== 'resuelta' && (
                    appealingId === c.id ? (
                      <div style={{ background: 'white', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                        <p style={{ margin: '0 0 8px', fontSize: '0.9rem', fontWeight: 600 }}>Motivo del recurso:</p>
                        <textarea 
                          value={motivoRecurso}
                          onChange={e => setMotivoRecurso(e.target.value)}
                          placeholder="Explica por qué la foto cumple con las normas..."
                          style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #94a3b8', minHeight: '80px', marginBottom: '8px', fontFamily: 'inherit' }}
                        />
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => handleRecurrir(c.incidenciaId, c.id)} style={{ flex: 1, background: '#3b82f6', color: 'white', border: 'none', padding: '8px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>Enviar Recurso</button>
                          <button onClick={() => { setAppealingId(null); setMotivoRecurso(''); }} style={{ flex: 1, background: '#e2e8f0', color: '#334155', border: 'none', padding: '8px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => handleEliminar(c.id)}
                          disabled={deletingId === c.id || replacingId === c.id}
                          style={{
                            background: '#ef4444', color: 'white', border: 'none', padding: '10px 20px',
                            borderRadius: '8px', fontWeight: 700, cursor: (deletingId === c.id || replacingId === c.id) ? 'not-allowed' : 'pointer',
                            flex: 1, minWidth: '150px', transition: 'all 0.2s',
                            opacity: (deletingId === c.id || replacingId === c.id) ? 0.7 : 1
                          }}
                        >
                          {deletingId === c.id ? '⏳ Eliminando...' : '🗑️ Eliminar foto'}
                        </button>

                        <label style={{ flex: 1, minWidth: '150px' }}>
                          <input 
                            type="file" 
                            accept="image/*" 
                            style={{ display: 'none' }}
                            disabled={deletingId === c.id || replacingId === c.id}
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                handleReemplazarFoto(c.id, e.target.files[0]);
                              }
                            }}
                          />
                          <div style={{
                            background: '#10b981', color: 'white', padding: '10px 20px',
                            borderRadius: '8px', fontWeight: 700, cursor: (deletingId === c.id || replacingId === c.id) ? 'not-allowed' : 'pointer',
                            textAlign: 'center', transition: 'all 0.2s',
                            opacity: (deletingId === c.id || replacingId === c.id) ? 0.7 : 1
                          }}>
                            {replacingId === c.id ? '⏳ Subiendo...' : '📸 Reemplazar foto'}
                          </div>
                        </label>
                        
                        <button
                          onClick={() => setAppealingId(c.id)}
                          disabled={deletingId === c.id || replacingId === c.id}
                          style={{
                            background: '#f8fafc', color: '#475569', border: '1px solid #cbd5e1', padding: '10px 20px',
                            borderRadius: '8px', fontWeight: 600, cursor: 'pointer',
                            flex: 1, minWidth: '150px', transition: 'all 0.2s'
                          }}
                        >
                          ⚖️ Recurrir decisión
                        </button>
                      </div>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
