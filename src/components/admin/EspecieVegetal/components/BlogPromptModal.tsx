import React from 'react';
import PremiumModal from '@/components/ui/PremiumModal';
import PremiumModalHeader from '@/components/ui/PremiumModalHeader';

interface BlogPromptModalProps {
  blogGenPdf: any;
  setBlogGenPdf: (val: any) => void;
  blogGenInstructions: string;
  setBlogGenInstructions: (val: string) => void;
  showBlogPrompt: boolean;
  setShowBlogPrompt: (val: boolean) => void;
  blogGenLoading: boolean;
  blogGenProgress: string;
  submitBlogGen: () => Promise<void>;
  formData: any;
  pdfs: any[];
}

export default function BlogPromptModal({
  blogGenPdf,
  setBlogGenPdf,
  blogGenInstructions,
  setBlogGenInstructions,
  showBlogPrompt,
  setShowBlogPrompt,
  blogGenLoading,
  blogGenProgress,
  submitBlogGen,
  formData,
  pdfs
}: BlogPromptModalProps) {
  if (!blogGenPdf) return null;

  // Encontrar el PDF correspondiente para mostrar su nombre
  const pdfObj = pdfs.find(p => p.id?.toString() === blogGenPdf.toString()) || { titulo: 'Documento PDF', nombreOriginal: 'Guía de cultivo' };

  return (
    <PremiumModal isOpen={blogGenPdf !== null} onClose={() => setBlogGenPdf(null)} maxWidth="600px" zIndex={10000}>
      <PremiumModalHeader
        title={<>📝 Generar Artículo Automático</>}
        gradient="linear-gradient(135deg, #f59e0b, #d97706)"
        onClose={() => setBlogGenPdf(null)}
      />
      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Contexto: Entidad + PDF */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px', background: 'linear-gradient(135deg, #ecfdf5, #f0fdf4)', border: '1px solid #a7f3d0', borderRadius: '10px', padding: '12px 16px' }}>
            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#64748b', fontWeight: 700, marginBottom: '4px' }}>🌱 Especie</div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f766e' }}>{formData.especiesvegetalesnombre || 'Sin nombre'}</div>
          </div>
          <div style={{ flex: 1, minWidth: '200px', background: 'linear-gradient(135deg, #fffbeb, #fef3c7)', border: '1px solid #fcd34d', borderRadius: '10px', padding: '12px 16px' }}>
            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#64748b', fontWeight: 700, marginBottom: '4px' }}>📄 Documento PDF</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#92400e', wordBreak: 'break-word' }}>{pdfObj.titulo || pdfObj.nombreOriginal}</div>
          </div>
        </div>

        <div className="form-group full">
          <label>Instrucciones de estilo y enfoque (Prompt)</label>
          <textarea
            value={blogGenInstructions}
            onChange={(e) => setBlogGenInstructions(e.target.value)}
            style={{ width: '100%', minHeight: '100px', padding: '12px', border: '2px solid #cbd5e1', borderRadius: '8px', fontSize: '0.95rem', resize: 'vertical' }}
            placeholder="Ej: Escribe un post en tono amigable, para niños, que hable sobre..."
          />
        </div>

        {/* Toggle para ver el prompt del sistema */}
        <button type="button" onClick={() => setShowBlogPrompt(!showBlogPrompt)} style={{ background: 'none', border: '1px dashed #94a3b8', borderRadius: '8px', padding: '8px 14px', color: '#64748b', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', width: '100%', justifyContent: 'center' }}>
          {showBlogPrompt ? '🔽 Ocultar' : '👁️ Ver'} Prompt del Sistema enviado a Gemini
        </button>
        {showBlogPrompt && (
          <div style={{ background: '#0f172a', color: '#e2e8f0', borderRadius: '8px', padding: '16px', fontSize: '0.75rem', fontFamily: 'monospace', maxHeight: '300px', overflowY: 'auto', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
            {`Actúa como un experto redactor de blogs agronómicos y de jardinería moderna. Vas a leer el documento adjunto sobre la especie "${formData.especiesvegetalesnombre || 'agricultura'}" y vas a escribir un artículo de blog profesional, SEO-optimizado y visualmente estructurado.

CONTEXTO: Este blog trata sobre una ESPECIE vegetal/hortaliza.

INDICACIONES DEL USUARIO: "${blogGenInstructions}"

REGLAS DE ESTRUCTURA OBLIGATORIAS (Blog Verdantia):
1. SIN PAJA: Párrafos de máximo 3 líneas.
2. NEGRITAS en conceptos clave. DATOS CONCRETOS.
3. TONO: Profesional pero cercano.
4. TÍTULO: Interrogativo siempre que sea posible (ej: "¿Cómo cultivar...?").

JSON de salida obligatorio:
→ titulo, slug, resumen, tags[]
→ ficha_rapida[6]: 🌡️ Temp, 🗓️ Siembra, 🌱 Germinación, 📏 Marco, 🕐 Cosecha, 💧 Riego
→ introduccion (max 100 palabras)
→ secciones[]: {titulo_h2, contenido_markdown, imagen_posicion}
→ consejos: {titulo, items[]}
→ cta: {titulo, subtitulo, botones}
→ imagenes[3]: {prompt_en, titulo_seo, descripcion_seo}`}
          </div>
        )}

        {blogGenLoading ? (
          <div style={{ padding: '30px 20px', textAlign: 'center', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '2.5rem', display: 'inline-block', animation: 'spin 2s linear infinite', marginBottom: '15px' }}>⏳</span>
            <h4 style={{ margin: '0 0 8px 0', color: '#0f766e', fontSize: '1.1rem' }}>Generación en curso</h4>
            <p style={{ margin: 0, fontSize: '0.95rem', color: '#475569', fontWeight: 500, minHeight: '24px', transition: 'all 0.3s' }}>
              {blogGenProgress}
            </p>
            <div style={{ width: '100%', background: '#e2e8f0', height: '6px', borderRadius: '3px', marginTop: '16px', overflow: 'hidden' }}>
              <div style={{ height: '100%', background: '#10b981', width: '100%', animation: 'progress 60s ease-out forwards' }}></div>
            </div>
            <style>{`@keyframes progress { 0% { width: 0%; } 100% { width: 95%; } }`}</style>
          </div>
        ) : (
          <button
            type="button"
            onClick={submitBlogGen}
            style={{ padding: '12px', borderRadius: '8px', border: 'none', background: '#f59e0b', color: 'white', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '10px' }}
          >
            🚀 ¡Crear Artículo Ahora!
          </button>
        )}
      </div>
    </PremiumModal>
  );
}
