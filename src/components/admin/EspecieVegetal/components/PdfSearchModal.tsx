import React from 'react';
import PremiumModal from '@/components/ui/PremiumModal';
import PremiumModalHeader from '@/components/ui/PremiumModalHeader';

interface PdfSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfSearchTopic: string;
  setPdfSearchTopic: (val: string) => void;
  handleSearchPdfs: () => void;
  pdfSearchLoading: boolean;
  pdfSearchError: string | null;
  pdfSearchResults: any[];
  handleAddPdfLink: (title: string, url: string, summary?: string, apuntes?: string) => Promise<void>;
  especieNombre: string;
}

export default function PdfSearchModal({
  isOpen,
  onClose,
  pdfSearchTopic,
  setPdfSearchTopic,
  handleSearchPdfs,
  pdfSearchLoading,
  pdfSearchError,
  pdfSearchResults,
  handleAddPdfLink,
  especieNombre
}: PdfSearchModalProps) {
  return (
    <PremiumModal isOpen={isOpen} onClose={onClose} maxWidth="600px" zIndex={9999}>
      <PremiumModalHeader
        title={<>✨ Asistente IA de Documentos</>}
        gradient="linear-gradient(135deg, #8b5cf6, #6d28d9)"
        onClose={onClose}
      />
      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <p style={{ margin: 0, fontSize: '0.95rem', color: '#475569' }}>
          Dile a la Inteligencia Artificial qué tipo de documento necesitas buscar sobre <strong>{especieNombre}</strong> (ej. <em>"poda"</em>, <em>"plagas INTA"</em>, <em>"guía de cultivo"</em>).
        </p>

        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            value={pdfSearchTopic}
            onChange={e => setPdfSearchTopic(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearchPdfs()}
            placeholder="Ej. enfermedades comunes..."
            style={{ flex: 1, padding: '12px', border: '2px solid #cbd5e1', borderRadius: '8px', fontSize: '1rem', outline: 'none' }}
          />
          <button
            type="button"
            onClick={handleSearchPdfs}
            disabled={pdfSearchLoading || !pdfSearchTopic}
            style={{ padding: '0 20px', borderRadius: '8px', border: 'none', background: '#10b981', color: 'white', fontWeight: 'bold', cursor: pdfSearchLoading ? 'wait' : 'pointer', transition: 'all 0.2s', opacity: (pdfSearchLoading || !pdfSearchTopic) ? 0.7 : 1 }}
          >
            {pdfSearchLoading ? 'Buscando...' : 'Buscar'}
          </button>
        </div>

        {pdfSearchLoading && (
          <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
            <span style={{ fontSize: '2rem', display: 'inline-block', animation: 'spin 2s linear infinite' }}>⏳</span>
            <p style={{ marginTop: '10px', fontSize: '0.9rem' }}>Buscando en repositorios agrícolas, por favor espera...</p>
          </div>
        )}

        {pdfSearchError && (
          <div style={{ background: '#fef2f2', border: '1px solid #f87171', borderRadius: '8px', padding: '16px', color: '#991b1b', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '1.5rem' }}>⚠️</span>
            <p style={{ margin: 0, fontSize: '0.95rem', flex: 1 }}>{pdfSearchError}</p>
          </div>
        )}

        {!pdfSearchLoading && pdfSearchResults.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h4 style={{ margin: 0, color: '#334155', fontSize: '1rem' }}>Resultados Encontrados:</h4>
            {pdfSearchResults.map((res, i) => (
              <div key={i} style={{ border: '1px solid #e2e8f0', padding: '12px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', background: '#f8fafc' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <a href={res.url} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 'bold', color: '#0f172a', textDecoration: 'none', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'} onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>
                    {res.title}
                  </a>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px' }}>
                    {res.url}
                  </span>
                  {res.summary && (
                    <p style={{ margin: '6px 0 0', fontSize: '0.8rem', color: '#475569', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      ✨ {res.summary}
                    </p>
                  )}
                </div>
                <button type="button" onClick={() => handleAddPdfLink(res.title, res.url, res.summary, res.apuntes)} style={{ background: 'white', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                  ➕ Añadir
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </PremiumModal>
  );
}
