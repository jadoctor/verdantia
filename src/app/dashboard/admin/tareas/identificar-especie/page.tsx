'use client';

import React, { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, storage } from '@/lib/firebase/config';
import { ref, uploadBytes } from 'firebase/storage';

// Cache global para SPA navigation
let cachedIdentifyState: any = null;

export default function IdentificarEspeciePage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [images, setImages] = useState<{ id: string; data: string; mimeType: string; blob: Blob }[]>(
    cachedIdentifyState?.images || []
  );
  const [isDragging, setIsDragging] = useState(false);
  const [isAILoading, setIsAILoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [aiSeconds, setAiSeconds] = useState(0);
  
  const [aiResult, setAiResult] = useState<any>(cachedIdentifyState?.aiResult || null);
  const [dbStatus, setDbStatus] = useState<any>(cachedIdentifyState?.dbStatus || null);
  const [customPrompt, setCustomPrompt] = useState<string>(cachedIdentifyState?.customPrompt || '');
  const [isPromptOpen, setIsPromptOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Actualizar caché global cada vez que cambian los datos importantes
  React.useEffect(() => {
    cachedIdentifyState = {
      images,
      aiResult,
      dbStatus,
      customPrompt
    };
  }, [images, aiResult, dbStatus, customPrompt]);
  React.useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user?.email) {
        setUserEmail(user.email);
      } else {
        router.push('/login');
      }
    });
    return () => unsub();
  }, [router]);

  // AI Timer
  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isAILoading) {
      setAiSeconds(0);
      interval = setInterval(() => {
        setAiSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isAILoading]);

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Solo se permiten imágenes');
      return;
    }
    if (images.length >= 4) {
      setErrorMsg('Máximo 4 imágenes');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        // Extract base64 part
        const base64Data = result.split(',')[1];
        setImages(prev => [...prev, {
          id: Math.random().toString(36).substring(2, 9),
          data: base64Data,
          mimeType: file.type,
          blob: file
        }]);
        setErrorMsg('');
        setAiResult(null); // Reset result on new photo
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      processFile(file);
    }
  };

  const handlePaste = useCallback((e: ClipboardEvent) => {
    if (e.clipboardData && e.clipboardData.files.length > 0) {
      const file = e.clipboardData.files[0];
      processFile(file);
    }
  }, [images.length]);

  React.useEffect(() => {
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [handlePaste]);

  const removeImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
    setAiResult(null);
  };

  const handleIdentify = async () => {
    if (images.length === 0) return;
    
    setIsAILoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/ai/identificar-imagen', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': userEmail || ''
        },
        body: JSON.stringify({
          images: images.map(img => ({ data: img.data, mimeType: img.mimeType })),
          customPrompt: customPrompt.trim()
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Error en la identificación');
      }

      setAiResult(data.data);
      setDbStatus(data.dbCheck);
    } catch (err: any) {
      setErrorMsg(err.message || 'Fallo de red o del servidor');
    } finally {
      setIsAILoading(false);
    }
  };

  const handleIncorporate = async () => {
    if (!aiResult || !aiResult.especiesnombre) return;
    
    setIsSaving(true);
    setErrorMsg('');
    try {
      // 1. Create Especie
      const createRes = await fetch('/api/admin/especies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail || '' },
        body: JSON.stringify({ 
          especiesnombre: aiResult.especiesnombre,
          especiesnombrecientifico: aiResult.especiesnombrecientifico || '',
          especiestipo: 'otra', // Default, user will change it
          especiesvisibilidadsino: 0
        })
      });
      const createData = await createRes.json();
      if (!createData.success || !createData.id) {
        throw new Error('No se pudo crear la especie base.');
      }
      
      const newEspecieId = createData.id;

      // 2. Upload Photos to Firebase Temp and process them
      for (const img of images) {
        const uniqueId = Math.random().toString(36).substring(2, 15);
        const ext = img.mimeType === 'image/png' ? 'png' : 'jpg';
        const tempStoragePath = `uploads/temp/id_${uniqueId}.${ext}`;
        
        const storageRef = ref(storage, tempStoragePath);
        await uploadBytes(storageRef, img.blob);

        // Process through API
        await fetch(`/api/admin/especies/${newEspecieId}/photos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail || '' },
          body: JSON.stringify({
            storagePath: tempStoragePath,
            especieNombre: aiResult.especiesnombre
          })
        });
      }

      // Save consumos so EspecieForm can read them
      if (aiResult.usos_consumo) {
        sessionStorage.setItem('ai_pending_consumos', JSON.stringify(aiResult.usos_consumo));
      }

      // 3. Navigate to Especie
      const advParam = aiResult.es_adventicia ? '1' : '0';
      router.push(`/dashboard/admin/especies/${newEspecieId}?from=identificar-especie&adv=${advParam}&name=${encodeURIComponent(aiResult.especiesnombre)}`);
      
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Error al incorporar la especie');
      setIsSaving(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', width: '100%', boxSizing: 'border-box', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Botonera Superior Hierárquica */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button onClick={() => router.push('/dashboard')} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 500, color: '#334155' }}>
          🏠 Inicio
        </button>
        <button onClick={() => router.push('/dashboard/admin/especies')} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 500, color: '#334155' }}>
          🔙 Volver a Especies
        </button>
      </div>

      {/* Subheader */}
      <div style={{ 
        background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', 
        borderRadius: '14px', padding: '16px 24px', color: 'white', 
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '24px', flexWrap: 'wrap', gap: '16px'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🔍</span> Identificador Mágico de Especies
          </h1>
          <p style={{ margin: '4px 0 0', opacity: 0.8, fontSize: '0.85rem' }}>
            ✨ Sube una foto y la Inteligencia Artificial te dirá de qué planta, hortaliza o adventicia se trata.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontWeight: 500 }}>
          ⚠️ {errorMsg}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Panel Superior: Uploader */}
        <div style={{ background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
          <h2 style={{ fontSize: '1.1rem', margin: '0 0 16px 0', color: '#1e293b' }}>📷 Fotos a analizar ({images.length}/4)</h2>
          
          <div 
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => images.length < 4 && fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${isDragging ? '#3b82f6' : '#cbd5e1'}`,
              borderRadius: '12px',
              padding: '40px 20px',
              textAlign: 'center',
              background: isDragging ? '#eff6ff' : '#f8fafc',
              cursor: images.length < 4 ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
              marginBottom: '20px'
            }}
          >
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              onChange={(e) => e.target.files && e.target.files.length > 0 && processFile(e.target.files[0])}
            />
            <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>📸</div>
            <div style={{ fontWeight: 500, color: '#475569' }}>
              {images.length < 4 ? 'Arrastra, pega o haz clic para subir foto' : 'Límite de fotos alcanzado'}
            </div>
          </div>

          {/* Miniaturas */}
          {images.length > 0 && (
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
              {images.map(img => (
                <div key={img.id} style={{ position: 'relative', width: '80px', height: '100px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #cbd5e1' }}>
                  <img src={`data:${img.mimeType};base64,${img.data}`} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button 
                    onClick={(e) => { e.stopPropagation(); removeImage(img.id); }}
                    style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '0.7rem' }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Configurador de Prompt IA (Rule 10) */}
          <div style={{ marginBottom: '20px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '16px' }}>
            <button 
              onClick={() => setIsPromptOpen(!isPromptOpen)}
              style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 12px 0', fontWeight: 600, color: '#334155', fontSize: '0.95rem' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>📋</span> Instrucciones del Prompt (técnico)
              </div>
              <span style={{ transform: isPromptOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
            </button>
            
            {isPromptOpen && (
              <div style={{ background: '#1e293b', color: '#cbd5e1', padding: '12px', borderRadius: '8px', fontSize: '0.8rem', fontFamily: 'monospace', whiteSpace: 'pre-wrap', marginBottom: '16px' }}>
{`Eres un experto botánico, agrónomo y biólogo.
Tu tarea es analizar las imágenes adjuntas e identificar de qué especie botánica o variedad vegetal se trata.
[INSTRUCCIONES ADICIONALES DEL USUARIO]
Debes devolver EXCLUSIVAMENTE un objeto JSON válido con la siguiente estructura:
{ "especiesnombre": "...", "especiesnombrecientifico": "...", "confianza": "...", "descripcion": "..." }`}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>✍️</span> Añadir directrices personalizadas a la IA (Opcional):
              </label>
              <textarea
                placeholder="Ej: Si es una mala hierba, céntrate en cómo erradicarla. O: Dime si se puede usar en infusión..."
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                style={{ width: '100%', height: '80px', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', resize: 'vertical', fontFamily: 'inherit', fontSize: '0.9rem' }}
              />
            </div>
          </div>

          {/* Boton IA */}
          <button 
            onClick={handleIdentify}
            disabled={images.length === 0 || isAILoading || isSaving}
            style={{ 
              width: '100%',
              background: isAILoading ? 'linear-gradient(135deg, #475569, #1e293b)' : 'linear-gradient(135deg, #8b5cf6, #6d28d9)', 
              color: 'white', 
              border: 'none', 
              borderRadius: '8px', 
              padding: '14px', 
              fontWeight: 'bold', 
              fontSize: '1rem',
              cursor: images.length === 0 || isAILoading || isSaving ? 'not-allowed' : 'pointer',
              boxShadow: isAILoading ? 'none' : '0 4px 12px rgba(109, 40, 217, 0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              transition: 'all 0.2s',
              opacity: images.length === 0 ? 0.6 : 1
            }}
          >
            {isAILoading ? (
              <><span style={{ fontSize: '1.2rem' }}>⏳</span> Analizando fotos... {aiSeconds}s</>
            ) : (
              <><span style={{ fontSize: '1.2rem' }}>✨</span> Identificar con IA</>
            )}
          </button>
        </div>

        {/* Panel Inferior: Resultados */}
        <div style={{ background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontSize: '1.1rem', margin: '0 0 16px 0', color: '#1e293b' }}>🧠 Veredicto de la IA</h2>
          
          {!aiResult && !isAILoading && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', textAlign: 'center' }}>
              <span style={{ fontSize: '3rem', marginBottom: '16px', opacity: 0.5 }}>🤖</span>
              <p>Sube imágenes y pulsa Identificar para ver la magia.</p>
            </div>
          )}

          {isAILoading && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#6d28d9', textAlign: 'center' }}>
              <div className="spinner" style={{ width: '40px', height: '40px', border: '4px solid rgba(139, 92, 246, 0.2)', borderLeftColor: '#8b5cf6', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '16px' }}></div>
              <p style={{ fontWeight: 500 }}>Consultando a la red botánica...</p>
              <style dangerouslySetInnerHTML={{__html: `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}} />
            </div>
          )}

          {aiResult && !isAILoading && (
            <div style={{ animation: 'fadeIn 0.5s ease' }}>
              <style dangerouslySetInnerHTML={{__html: `@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}} />
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '1.5rem', color: '#0f172a' }}>{aiResult.especiesnombre}</h3>
                  <div style={{ fontStyle: 'italic', color: '#64748b', fontSize: '0.95rem' }}>{aiResult.especiesnombrecientifico}</div>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {aiResult.es_adventicia !== undefined && (
                    <div style={{ 
                      background: aiResult.es_adventicia ? '#fee2e2' : '#f0fdfa', 
                      color: aiResult.es_adventicia ? '#991b1b' : '#0f766e',
                      padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', border: '1px solid ' + (aiResult.es_adventicia ? '#fecaca' : '#ccfbf1')
                    }}>
                      {aiResult.es_adventicia ? '🌿 Adventicia' : '🪴 Cultivo / Ornamental'}
                    </div>
                  )}
                  <div style={{ 
                    background: aiResult.confianza === 'alta' ? '#dcfce7' : aiResult.confianza === 'media' ? '#fef9c3' : '#fee2e2', 
                    color: aiResult.confianza === 'alta' ? '#166534' : aiResult.confianza === 'media' ? '#854d0e' : '#991b1b',
                    padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase'
                  }}>
                    Confianza: {aiResult.confianza}
                  </div>
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', color: '#334155', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '24px' }}>
                {aiResult.descripcion}
              </div>

              {aiResult.usos_consumo && aiResult.usos_consumo.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '1rem', color: '#1e293b' }}>🍽️ Comestibilidad y Forraje</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '12px' }}>
                    {aiResult.usos_consumo.map((uso: any, idx: number) => {
                      const getUsoStyles = (esapto: number) => {
                        if (esapto === 1) {
                          return {
                            background: '#f0fdf4',
                            border: '#bbf7d0',
                            color: '#166534',
                            badgeBg: '#dcfce7',
                            label: 'Apto'
                          };
                        } else if (esapto === 2) {
                          return {
                            background: '#fffbeb',
                            border: '#fde68a',
                            color: '#92400e',
                            badgeBg: '#fef3c7',
                            label: 'Con moderación'
                          };
                        } else {
                          return {
                            background: '#fef2f2',
                            border: '#fecaca',
                            color: '#991b1b',
                            badgeBg: '#fee2e2',
                            label: 'Tóxico'
                          };
                        }
                      };
                      const cardStyle = getUsoStyles(uso.esapto);

                      return (
                        <div key={idx} style={{ background: cardStyle.background, border: '1px solid ' + cardStyle.border, borderRadius: '8px', padding: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <strong style={{ color: cardStyle.color, fontSize: '0.95rem' }}>{uso.nombre}</strong>
                            <span style={{ fontSize: '0.8rem', padding: '2px 8px', borderRadius: '12px', background: cardStyle.badgeBg, color: cardStyle.color, fontWeight: 'bold' }}>
                              {cardStyle.label}
                            </span>
                          </div>
                          {uso.partes && uso.partes !== 'N/A' && (
                            <div style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '4px' }}><strong>Partes:</strong> {uso.partes}</div>
                          )}
                          <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{uso.notas}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Acciones */}
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
                {dbStatus?.existe ? (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#059669', fontWeight: 600, marginBottom: '12px' }}>
                      <span style={{ fontSize: '1.2rem' }}>✅</span> Esta especie ya está en Verdantia
                    </div>
                    <button 
                      onClick={() => router.push(`/dashboard/admin/especies/${dbStatus.especieId}?from=identificar-especie`)}
                      style={{ background: '#f1f5f9', color: '#0f172a', border: '1px solid #cbd5e1', padding: '12px', borderRadius: '8px', width: '100%', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Ir a la Especie
                    </button>
                  </div>
                ) : (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ea580c', fontWeight: 600, marginBottom: '12px' }}>
                      <span style={{ fontSize: '1.2rem' }}>⚠️</span> Esta especie no está en el catálogo
                    </div>
                    <button 
                      onClick={handleIncorporate}
                      disabled={isSaving}
                      style={{ 
                        background: 'linear-gradient(135deg, #10b981, #059669)', 
                        color: 'white', border: 'none', padding: '12px', borderRadius: '8px', 
                        width: '100%', fontWeight: 600, cursor: isSaving ? 'not-allowed' : 'pointer',
                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
                        display: 'flex', justifyContent: 'center', gap: '8px'
                      }}
                    >
                      {isSaving ? '⏳ Guardando y subiendo fotos...' : '➕ Incorporar Especie ahora'}
                    </button>
                  </div>
                )}
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
