import React from 'react';
import PremiumModal from '@/components/ui/PremiumModal';
import PremiumModalHeader from '@/components/ui/PremiumModalHeader';
import { getMediaUrl } from '@/lib/media-url';

interface PdfEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingPdf: any;
  pdfTitle: string;
  setPdfTitle: (val: string) => void;
  pdfSummary: string;
  setPdfSummary: (val: string) => void;
  pdfApuntes: string;
  setPdfApuntes: (val: string) => void;
  generatePdfCover: (pdf: any) => void;
  generatingCoverId: string | number | null;
  savePdfEdits: () => void;
  pdfEditorSaveStatus: string;
  especieNombre: string;
  hasPdfChanges: boolean;
}

export default function PdfEditModal({
  isOpen,
  onClose,
  editingPdf,
  pdfTitle,
  setPdfTitle,
  pdfSummary,
  setPdfSummary,
  pdfApuntes,
  setPdfApuntes,
  generatePdfCover,
  generatingCoverId,
  savePdfEdits,
  pdfEditorSaveStatus,
  especieNombre,
  hasPdfChanges,
}: PdfEditModalProps) {
  if (!editingPdf) return null;

  return (
    <PremiumModal isOpen={isOpen} onClose={onClose} maxWidth="800px" zIndex={9999}>
      <PremiumModalHeader
        title={<>📄 Editar Metadatos del PDF</>}
        actions={
          <span style={{ display: 'inline-block', background: 'rgba(255,255,255,0.2)', color: 'white', padding: '4px 12px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 'bold' }}>
            🌱 Especie: {especieNombre || 'Sin nombre'}
          </span>
        }
        onClose={onClose}
      />
      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '24px', flexDirection: 'row', flexWrap: 'wrap' }}>
          <div style={{ flex: '0 0 250px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ width: '100%', height: '350px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {editingPdf.portada ? (
                <img src={getMediaUrl(editingPdf.portada)} alt="Portada PDF" style={{ width: '100%', height: '100%', objectFit: 'cover' }} crossOrigin="anonymous" />
              ) : (
                <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>
                  <span style={{ fontSize: '3rem', display: 'block', marginBottom: '10px' }}>📄</span>
                  <p style={{ margin: 0, fontSize: '0.9rem' }}>Sin portada generada</p>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                generatePdfCover({ ...editingPdf, titulo: pdfTitle, resumen: pdfSummary });
              }}
              disabled={generatingCoverId === editingPdf.id}
              style={{ width: '100%', padding: '8px', background: '#e0e7ff', color: '#4338ca', border: '1px solid #c7d2fe', borderRadius: '6px', fontWeight: 'bold', cursor: generatingCoverId === editingPdf.id ? 'wait' : 'pointer', fontSize: '0.85rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}
            >
              {generatingCoverId === editingPdf.id ? '⏳ Generando...' : (editingPdf.portada ? '✨ Regenerar Portada IA' : '✨ Generar Portada IA')}
            </button>
          </div>

          <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', fontSize: '0.9rem', color: '#334155' }}>Nombre del Documento</label>
              <input
                type="text"
                value={pdfTitle}
                onChange={e => setPdfTitle(e.target.value)}
                placeholder={editingPdf.nombreOriginal}
                style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.95rem' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', fontSize: '0.9rem', color: '#334155' }}>Resumen Corto</label>
              <textarea
                value={pdfSummary}
                onChange={e => setPdfSummary(e.target.value)}
                placeholder="Describe brevemente el documento (1-2 líneas)..."
                rows={3}
                style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.95rem', resize: 'vertical' }}
              />
            </div>
            <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
              <label style={{ marginBottom: '4px', fontWeight: 'bold', fontSize: '0.9rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                🎓 Apuntes (Modo Estudiante)
              </label>
              <textarea
                value={pdfApuntes}
                onChange={e => setPdfApuntes(e.target.value)}
                placeholder="Apuntes técnicos detallados extraídos del PDF..."
                style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.95rem', resize: 'vertical', flexGrow: 1, minHeight: '120px' }}
              />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
          <button type="button" onClick={onClose}
            style={{ padding: '10px 20px', borderRadius: '6px', border: '1px solid #cbd5e1', background: 'white', color: '#475569', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' }}>
            Cancelar
          </button>
          {hasPdfChanges && (
            <button type="button" onClick={savePdfEdits} disabled={pdfEditorSaveStatus === 'saving'}
              style={{ padding: '10px 20px', borderRadius: '6px', border: 'none', background: '#10b981', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {pdfEditorSaveStatus === 'saving' ? '⏳ Guardando...' : '💾 Guardar Metadatos'}
            </button>
          )}
        </div>
      </div>
    </PremiumModal>
  );
}
