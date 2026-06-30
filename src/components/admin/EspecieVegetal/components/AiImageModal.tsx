import React from 'react';
import PremiumModal from '@/components/ui/PremiumModal';
import PremiumModalHeader from '@/components/ui/PremiumModalHeader';

interface AiImageModalProps {
  showAiImageModal: boolean;
  setShowAiImageModal: (val: boolean) => void;
  aiImageConcept: string;
  setAiImageConcept: (val: string) => void;
  aiImagePromptPreview: string;
  setAiImagePromptPreview: (val: string) => void;
  aiImagePromptEdited: boolean;
  setAiImagePromptEdited: (val: boolean) => void;
  showPromptDetails: boolean;
  setShowPromptDetails: (val: boolean) => void;
  aiImageLoading: boolean;
  setAiImageLoading: (val: boolean) => void;
  aiImageResult: string | null;
  setAiImageResult: (val: string | null) => void;
  aiImageDescription: string;
  setAiImageDescription: (val: string) => void;
  uploadingPhotos: boolean;
  setUploadingPhotos: (val: boolean) => void;
  formData: any;
  especieId: string | null;
  userEmail: string | null;
  storage: any;
  loadAttachments: (id: string) => Promise<void>;
  aiReplacingPhotoId?: string | number | null;
  setAiReplacingPhotoId?: (val: string | number | null) => void;
  closePhotoEditor?: () => void;
}

export default function AiImageModal({
  showAiImageModal,
  setShowAiImageModal,
  aiImageConcept,
  setAiImageConcept,
  aiImagePromptPreview,
  setAiImagePromptPreview,
  aiImagePromptEdited,
  setAiImagePromptEdited,
  showPromptDetails,
  setShowPromptDetails,
  aiImageLoading,
  setAiImageLoading,
  aiImageResult,
  setAiImageResult,
  aiImageDescription,
  setAiImageDescription,
  uploadingPhotos,
  setUploadingPhotos,
  formData,
  especieId,
  userEmail,
  storage,
  loadAttachments,
  aiReplacingPhotoId,
  setAiReplacingPhotoId,
  closePhotoEditor
}: AiImageModalProps) {

  // Construcción del Prompt Preview
  const buildPromptPreview = () => {
    const nombre = formData.especiesvegetalesnombre || 'especie';
    const sciCtx = formData.especiesvegetalesnombrecientifico ? ` Nombre científico: ${formData.especiesvegetalesnombrecientifico}.` : '';
    const famCtx = formData.xespeciesvegetalesidfamilias ? ` ID Familia: ${formData.xespeciesvegetalesidfamilias}.` : '';
    const defaultConcept = `varios ejemplares de ${nombre} recién cosechados, dispuestos sobre una mesa rústica de madera en un huerto al aire libre, con tierra y hojas verdes visibles al fondo`;
    return `Fotografía profesional de stock de alta resolución (8K), tomada con una cámara DSLR Canon EOS R5 y un objetivo macro 100mm f/2.8, iluminación natural suave de hora dorada.\nSujeto principal: ${nombre} (hortaliza/planta comestible de huerto).${sciCtx}${famCtx}\nEscena concreta: ${aiImageConcept || defaultConcept}.\nComposición: regla de los tercios, sujeto nítido en primer plano, fondo suavemente desenfocado (bokeh) mostrando vegetación de huerto.\nREGLAS ESTRICTAS:\n1. El sujeto es SIEMPRE una planta, hortaliza, fruto o semilla comestible de huerto.\n2. La fotografía debe parecer tomada por un fotógrafo profesional de gastronomía o agricultura.\n3. El entorno debe ser siempre agrícola: huerto, bancal, invernadero, mesa de cosecha o cocina rústica.\n4. NO incluir personas, manos, texto, logotipos ni marcas de agua.\n5. Mostrar el producto hortícola en su mejor estado: fresco, limpio, apetecible.`;
  };

  // Generar Imagen IA
  const generateAiImage = async () => {
    if (!formData.especiesvegetalesnombre) {
      alert('Se necesita el nombre de la especie para generar la imagen.');
      return;
    }
    setAiImageLoading(true);
    setAiImageResult(null);
    setAiImageDescription('');
    try {
      const body: any = {
        especieNombre: formData.especiesvegetalesnombre,
        especieNombreCientifico: formData.especiesvegetalesnombrecientifico,
        especieFamiliaId: formData.xespeciesvegetalesidfamilias,
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

  // Subir foto generada
  const uploadAiImage = async () => {
    if (!aiImageResult || !especieId) return;
    setUploadingPhotos(true);
    setShowAiImageModal(false);
    try {
      const res = await fetch(aiImageResult);
      const blob = await res.blob();
      const descBase = aiImageDescription || formData.especiesvegetalesnombre || 'especie';

      const storageApi = await import('firebase/storage');
      const tempFileName = `temp-ai-${Date.now()}-${descBase.replace(/[^a-zA-Z0-9.-]/g, '')}.webp`;
      const tempPath = `uploads/temp/${tempFileName}`;
      const storageRef = storageApi.ref(storage, tempPath);
      await storageApi.uploadBytes(storageRef, blob);

      const saveRes = await fetch(`/api/admin/especiesvegetales/${especieId}/photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail || '' },
        body: JSON.stringify({
          rawStoragePath: tempPath,
          especieNombre: formData.especiesvegetalesnombre || 'especie',
          replacePhotoId: aiReplacingPhotoId || undefined
        })
      });
      if (!saveRes.ok) {
        const errData = await saveRes.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP Error ${saveRes.status}`);
      }

      if (setAiReplacingPhotoId) {
        setAiReplacingPhotoId(null);
      }
      if (closePhotoEditor) {
        closePhotoEditor();
      }

      await loadAttachments(especieId);
      setAiImageResult(null);
      setAiImageConcept('');
      setAiImageDescription('');
      setAiImagePromptPreview('');
      setAiImagePromptEdited(false);
    } catch (error) {
      console.error('Error uploading AI image:', error);
      alert('Error al guardar la imagen generada.');
    } finally {
      setUploadingPhotos(false);
    }
  };

  const handleClose = () => {
    setShowAiImageModal(false);
    if (setAiReplacingPhotoId) setAiReplacingPhotoId(null);
  };

  return (
    <PremiumModal isOpen={showAiImageModal} onClose={handleClose} maxWidth="600px" zIndex={10000}>
      <PremiumModalHeader
        title={<><span style={{ fontSize: '1.5rem' }}>✨</span> Generador de Imágenes IA</>}
        actions={
          <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.9)' }}>
            Especie: <strong>{formData.especiesvegetalesnombre || 'Sin nombre'}</strong>
          </span>
        }
        gradient="linear-gradient(135deg, #8b5cf6, #6d28d9)"
        onClose={handleClose}
      />
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
                placeholder="Ej. Fotografía macro de las hojas con rocío de la mañana..."
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
                disabled={uploadingPhotos}
                style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: '#10b981', color: 'white', fontWeight: 'bold', cursor: uploadingPhotos ? 'not-allowed' : 'pointer', opacity: uploadingPhotos ? 0.7 : 1 }}
              >
                {uploadingPhotos ? 'Guardando...' : 'Guardar en Galería'}
              </button>
            </div>
          </div>
        )}
      </div>
    </PremiumModal>
  );
}
