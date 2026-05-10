'use client';
import React, { useState, useEffect } from 'react';
import { Blurhash } from 'react-blurhash';
import { getMediaUrl } from '@/lib/media-url';
import { storage } from '@/lib/firebase/config';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

interface VariedadMediaManagerProps {
  variedadId: string;
  userEmail: string;
  variedadNombre?: string;
  especieNombre?: string;
}

export default function VariedadMediaManager({ variedadId, userEmail, variedadNombre = 'Variedad', especieNombre = 'Especie' }: VariedadMediaManagerProps) {
  const [photos, setPhotos] = useState<any[]>([]);
  const [pdfs, setPdfs] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  // AI Image States
  const [showAiImageModal, setShowAiImageModal] = useState(false);
  const [aiImageConcept, setAiImageConcept] = useState('');
  const [aiImageLoading, setAiImageLoading] = useState(false);
  const [aiImageResult, setAiImageResult] = useState<string | null>(null);
  const [aiImageDescription, setAiImageDescription] = useState('');
  const [aiImagePromptPreview, setAiImagePromptPreview] = useState('');
  const [aiImagePromptEdited, setAiImagePromptEdited] = useState(false);
  const [showPromptDetails, setShowPromptDetails] = useState(false);

  useEffect(() => {
    if (variedadId && userEmail) {
      loadMedia();
    }
  }, [variedadId, userEmail]);

  const loadMedia = async () => {
    try {
      const [resPhotos, resPdfs] = await Promise.all([
        fetch(`/api/admin/variedades/${variedadId}/photos`, { headers: { 'x-user-email': userEmail } }),
        fetch(`/api/admin/variedades/${variedadId}/pdfs`, { headers: { 'x-user-email': userEmail } })
      ]);
      const dataPhotos = await resPhotos.json();
      const dataPdfs = await resPdfs.json();
      setPhotos(dataPhotos.photos || []);
      setPdfs(dataPdfs.pdfs || []);
    } catch (e) {
      console.error('Error loading media:', e);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'photos' | 'pdfs') => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploading(true);

    try {
      const isPhotos = type === 'photos';
      for (let i = 0; i < e.target.files.length; i++) {
        const file = e.target.files[i];
        
        // 1. Upload to temporary Firebase Storage
        const tempPath = `uploads/temp/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const storageRef = ref(storage, tempPath);
        await uploadBytes(storageRef, file);
        const rawStoragePath = storageRef.fullPath;

        // 2. Send to API for processing
        const res = await fetch(`/api/admin/variedades/${variedadId}/${type}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail },
          body: JSON.stringify({ rawStoragePath, originalFilename: file.name })
        });
        
        if (!res.ok) {
          console.error('Failed to process file', await res.text());
        }
      }
      
      await loadMedia();
    } catch (err) {
      console.error(err);
      alert('Error uploading file');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (id: string, type: 'photos' | 'pdfs') => {
    if (!confirm('¿Seguro que quieres eliminar este archivo?')) return;
    
    try {
      const res = await fetch(`/api/admin/variedades/${variedadId}/${type}?id=${id}`, {
        method: 'DELETE',
        headers: { 'x-user-email': userEmail }
      });
      if (res.ok) {
        await loadMedia();
      }
    } catch (e) {
      console.error('Error deleting:', e);
    }
  };

  const setPrimaryPhoto = async (photoId: string) => {
    try {
      const res = await fetch(`/api/admin/variedades/${variedadId}/photos`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail },
        body: JSON.stringify({ action: 'set_primary', photoId })
      });
      if (res.ok) {
        await loadMedia();
      }
    } catch (e) {
      console.error('Error setting primary:', e);
    }
  };

  const buildPromptPreview = () => {
    const defaultConcept = `varios ejemplares de la variedad ${variedadNombre} (perteneciente a la especie ${especieNombre}) recién cosechados, dispuestos sobre una mesa rústica de madera en un huerto al aire libre, con tierra y hojas verdes visibles al fondo`;
    return `Fotografía profesional de stock de alta resolución (8K), tomada con una cámara DSLR Canon EOS R5 y un objetivo macro 100mm f/2.8, iluminación natural suave de hora dorada.\\nSujeto principal: La variedad ${variedadNombre} de la especie ${especieNombre} (hortaliza/planta comestible de huerto).\\nEscena concreta: ${aiImageConcept || defaultConcept}.\\nComposición: regla de los tercios, sujeto nítido en primer plano, fondo suavemente desenfocado (bokeh) mostrando vegetación de huerto.\\nREGLAS ESTRICTAS:\\n1. El sujeto es SIEMPRE una planta, hortaliza, fruto o semilla comestible de huerto (específicamente de la especie ${especieNombre}).\\n2. La fotografía debe parecer tomada por un fotógrafo profesional de gastronomía o agricultura.\\n3. El entorno debe ser siempre agrícola: huerto, bancal, invernadero, mesa de cosecha o cocina rústica.\\n4. NO incluir personas, manos, texto, logotipos ni marcas de agua.\\n5. Mostrar el producto hortícola en su mejor estado: fresco, limpio, apetecible.`;
  };

  const generateAiImage = async () => {
    setAiImageLoading(true);
    setAiImageResult(null);
    setAiImageDescription('');
    try {
      const body: any = { 
        especieNombre: variedadNombre,
        concept: aiImageConcept 
      };
      if (aiImagePromptEdited && aiImagePromptPreview.trim()) {
        body.customPrompt = aiImagePromptPreview;
      }
      const res = await fetch('/api/ai/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail || '' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.success && data.base64) {
        setAiImageResult(`data:image/jpeg;base64,${data.base64}`);
        if (data.description) setAiImageDescription(data.description);
        if (data.promptUsed) {
          setAiImagePromptPreview(data.promptUsed);
          setAiImagePromptEdited(false);
        }
      } else {
        alert(data.error || 'Error al generar la imagen.');
      }
    } catch (e) {
      console.error(e);
      alert('Error de conexión al generar la imagen.');
    } finally {
      setAiImageLoading(false);
    }
  };

  const uploadAiImage = async () => {
    if (!aiImageResult) return;
    setUploading(true);
    try {
      const base64Data = aiImageResult.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/jpeg' });
      
      const file = new File([blob], `ai_generated_${Date.now()}.jpg`, { type: 'image/jpeg' });
      
      const tempPath = `uploads/temp/${Date.now()}_ai_variedad_${variedadId}.jpg`;
      const storageRef = ref(storage, tempPath);
      await uploadBytes(storageRef, file);
      
      const saveRes = await fetch(`/api/admin/variedades/${variedadId}/photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail || '' },
        body: JSON.stringify({
          rawStoragePath: tempPath,
          originalFilename: file.name
        })
      });
      if (!saveRes.ok) {
        throw new Error('Error guardando en BD');
      }
      await loadMedia();
      setAiImageResult(null);
      setAiImageConcept('');
      setAiImageDescription('');
      setAiImagePromptPreview('');
      setAiImagePromptEdited(false);
      setShowAiImageModal(false);
    } catch (error) {
      console.error('Error uploading AI image:', error);
      alert('Error al guardar la imagen generada.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
        
        {/* PHOTOS */}
        <div className="form-group full" style={{ marginBottom: '30px' }}>
        <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            Fotos
          </span>
          <small style={{ color: photos.length >= 4 ? '#ef4444' : '#64748b' }}>
            {photos.length} / 4 permitidas
          </small>
        </label>
        
        <div className="gallery">
          {photos.map(p => {
            const isPrimary = p.esPrincipal === 1;
            let meta: any = {};
            try { meta = JSON.parse(p.resumen || '{}'); } catch(e){}

            return (
              <div key={p.id} className={`gallery-item ${isPrimary ? 'is-preferred' : ''}`} style={{ border: isPrimary ? '3px solid #f59e0b' : '1px solid #e2e8f0' }}>
                {meta.blurhash && (
                  <div style={{ position: 'absolute', inset: 0 }}>
                    <Blurhash hash={meta.blurhash} width="100%" height="100%" resolutionX={32} resolutionY={32} punch={1} />
                  </div>
                )}
                <img src={getMediaUrl(p.ruta)} alt="Variedad" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} crossOrigin="anonymous" />
                
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.5)', padding: '4px', display: 'flex', justifyContent: 'space-between', zIndex: 10 }}>
                  <button onClick={() => setPrimaryPhoto(p.id)} style={{ background: 'transparent', border: 'none', color: isPrimary ? '#f59e0b' : 'white', cursor: 'pointer', fontSize: '1.2rem' }}>
                    {isPrimary ? '★' : '☆'}
                  </button>
                  <button onClick={() => handleDelete(p.id, 'photos')} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold' }}>
                    ✕
                  </button>
                </div>
              </div>
            );
          })}
          
          {photos.length < 4 && (
            <div className={`custom-file-upload drop-zone inline-drop-zone ${uploading ? 'drag-over' : ''}`}>
              <input type="file" id="upload-photos-variedad" multiple accept="image/*" onChange={(e) => handleFileUpload(e, 'photos')} disabled={uploading} />
              
              {uploading ? (
                <div className="drop-zone-content">
                  <span style={{ fontSize: '1.5rem', animation: 'spin 2s linear infinite', display: 'inline-block' }}>⏳</span>
                  <span style={{ color: '#10b981', fontWeight: 'bold', fontSize: '0.75rem', textAlign: 'center' }}>Procesando...</span>
                </div>
              ) : (
                <div className="drop-zone-content">
                  <div className="drop-zone-buttons" style={{ flexDirection: 'column' }}>
                    <label htmlFor="upload-photos-variedad" className="btn-upload primary" style={{ padding: '8px', fontSize: '0.8rem' }}>
                      <span className="icon" style={{ fontSize: '1.2rem', marginBottom: '4px', display: 'block' }}>📁</span> Galería
                    </label>
                    <button type="button" onClick={() => {
                      setAiImagePromptPreview(buildPromptPreview());
                      setShowAiImageModal(true);
                    }} className="btn-upload" style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', color: 'white', border: 'none', padding: '8px', fontSize: '0.8rem' }}>
                      <span className="icon" style={{ fontSize: '1.2rem', marginBottom: '4px', display: 'block' }}>✨</span> Generar IA
                    </button>
                  </div>
                  <span className="drop-hint" style={{ fontSize: '0.7rem', textAlign: 'center', marginTop: '4px' }}>arrastra y suelta<br/>aquí</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* PDFS */}
      <div>
        <h3 style={{ margin: '0 0 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>📄 Documentos PDF</span>
          <label style={{ background: '#3b82f6', color: 'white', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
            {uploading ? 'Subiendo...' : '+ Añadir PDF'}
            <input type="file" multiple accept=".pdf" style={{ display: 'none' }} onChange={(e) => handleFileUpload(e, 'pdfs')} disabled={uploading} />
          </label>
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {pdfs.map(p => (
            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.5rem' }}>📄</span>
                <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>{p.ruta.split('/').pop()}</span>
              </div>
              <button onClick={() => handleDelete(p.id, 'pdfs')} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>
                Eliminar
              </button>
            </div>
          ))}
        </div>
      </div>

    </div>

      {showAiImageModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.85)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', padding: '20px' }}>
          <div style={{ background: 'white', borderRadius: '20px', width: '100%', maxWidth: '600px', display: 'flex', flexDirection: 'column', maxHeight: '90vh', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', background: 'linear-gradient(to right, #f8fafc, #f1f5f9)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1.5rem' }}>✨</span> Generador de Imágenes IA
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748b' }}>Especie: <strong>{especieNombre}</strong> | Variedad: <strong>{variedadNombre || 'Sin nombre'}</strong></p>
              </div>
              <button onClick={() => setShowAiImageModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', color: '#94a3b8', cursor: 'pointer' }}>&times;</button>
            </div>
            
            <div style={{ padding: '24px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {!aiImageResult ? (
                <>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#334155' }}>
                      Contexto de la foto deseada
                    </label>
                    <textarea 
                      value={aiImageConcept} 
                      onChange={e => { setAiImageConcept(e.target.value); if (!aiImagePromptEdited) setAiImagePromptPreview(buildPromptPreview()); }}
                      placeholder={`Ej. Fotografía macro de la variedad ${variedadNombre} de la especie ${especieNombre}...`}
                      rows={3}
                      style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '0.95rem', resize: 'vertical' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#334155', fontSize: '0.85rem' }}>
                      Sugerencias Rápidas:
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {[
                        "En la planta con fruto maduro",
                        "En la planta y tras el riego",
                        "En la tabla de cocina preparándolo para crear un plato",
                        "Como plato precocinado"
                      ].map(preset => (
                        <button 
                          key={preset}
                          type="button"
                          onClick={() => { setAiImageConcept(preset); if (!aiImagePromptEdited) setAiImagePromptPreview(buildPromptPreview()); }}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '20px',
                            border: `1px solid ${aiImageConcept === preset ? '#8b5cf6' : '#e2e8f0'}`,
                            background: aiImageConcept === preset ? '#f3e8ff' : '#f8fafc',
                            color: aiImageConcept === preset ? '#6d28d9' : '#475569',
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  <details open={showPromptDetails} onToggle={(e: any) => setShowPromptDetails(e.target.open)} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                    <summary style={{ padding: '10px 14px', background: '#f8fafc', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '8px', userSelect: 'none', listStyle: 'none' }}>
                      <span style={{ transition: 'transform 0.2s', transform: showPromptDetails ? 'rotate(90deg)' : 'rotate(0deg)', display: 'inline-block' }}>▶</span>
                      🔧 Prompt técnico {aiImagePromptEdited && <span style={{ background: '#fef08a', color: '#854d0e', padding: '1px 6px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 'bold' }}>Editado</span>}
                    </summary>
                    <div style={{ padding: '12px 14px', borderTop: '1px solid #e2e8f0' }}>
                      <textarea
                        value={aiImagePromptPreview || buildPromptPreview()}
                        onChange={e => { setAiImagePromptPreview(e.target.value); setAiImagePromptEdited(true); }}
                        rows={8}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.8rem', fontFamily: 'monospace', resize: 'vertical', lineHeight: '1.5', color: '#334155', background: aiImagePromptEdited ? '#fffbeb' : '#f8fafc' }}
                      />
                      {aiImagePromptEdited && (
                        <button type="button" onClick={() => { setAiImagePromptPreview(buildPromptPreview()); setAiImagePromptEdited(false); }} style={{ marginTop: '8px', padding: '4px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white', color: '#64748b', fontSize: '0.75rem', cursor: 'pointer' }}>
                          ↩️ Restaurar prompt original
                        </button>
                      )}
                    </div>
                  </details>

                  <button 
                    type="button" 
                    onClick={generateAiImage} 
                    disabled={aiImageLoading}
                    style={{ 
                      padding: '14px', 
                      borderRadius: '12px', 
                      border: 'none', 
                      background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', 
                      color: 'white', 
                      fontWeight: 'bold', 
                      fontSize: '1rem', 
                      cursor: aiImageLoading ? 'not-allowed' : 'pointer',
                      opacity: aiImageLoading ? 0.7 : 1,
                      marginTop: '10px'
                    }}
                  >
                    {aiImageLoading ? 'Generando Imagen...' : '✨ Generar Ahora'}
                  </button>
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '100%', aspectRatio: '1/1', borderRadius: '16px', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}>
                    <img src={aiImageResult} alt="Generated by AI" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  
                  <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                    <button 
                      type="button" 
                      onClick={() => setAiImageResult(null)} 
                      style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #cbd5e1', background: 'white', color: '#475569', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      Descartar y Reintentar
                    </button>
                    <button 
                      type="button" 
                      onClick={uploadAiImage} 
                      disabled={uploading}
                      style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: '#10b981', color: 'white', fontWeight: 'bold', cursor: uploading ? 'not-allowed' : 'pointer', opacity: uploading ? 0.7 : 1 }}
                    >
                      {uploading ? 'Guardando...' : 'Guardar en Galería'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
