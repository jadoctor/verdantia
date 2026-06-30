import React from 'react';
import PremiumModal from '@/components/ui/PremiumModal';
import PremiumModalHeader from '@/components/ui/PremiumModalHeader';

interface CheckSpeciesModalProps {
  isOpen: boolean;
  onClose: () => void;
  checkResults: any;
  setActiveTab: (tab: string) => void;
}

export default function CheckSpeciesModal({
  isOpen,
  onClose,
  checkResults,
  setActiveTab
}: CheckSpeciesModalProps) {
  return (
    <PremiumModal isOpen={isOpen} onClose={onClose} maxWidth="650px" zIndex={10500}>
      {checkResults && (
        <>
          <PremiumModalHeader
            title={<>🔍 Diagnóstico de Completitud</>}
            gradient="linear-gradient(135deg, #0284c7, #0369a1)"
            onClose={onClose}
          />
          {/* Content */}
          <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Completeness Health/Progress Bar */}
            <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#334155' }}>Nivel de Completitud:</span>
                <span style={{ fontSize: '1.2rem', fontWeight: '900', color: checkResults.score >= 80 ? '#10b981' : checkResults.score >= 50 ? '#f59e0b' : '#ef4444' }}>
                  {checkResults.score}%
                </span>
              </div>
              
              {/* Progress bar container */}
              <div style={{ width: '100%', height: '12px', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden', position: 'relative' }}>
                <div style={{
                  width: `${checkResults.score}%`,
                  height: '100%',
                  background: `linear-gradient(90deg, 
                    ${checkResults.score >= 80 ? '#10b981, #059669' : checkResults.score >= 50 ? '#f59e0b, #d97706' : '#ef4444, #dc2626'}
                  )`,
                  borderRadius: '999px',
                  transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
                }} />
              </div>
              
              <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748b', lineHeight: '1.4' }}>
                {checkResults.score === 100 
                  ? '🎉 ¡Enhorabuena! La ficha de esta especie está 100% completa.'
                  : checkResults.score >= 80 
                    ? '✨ ¡Excelente trabajo! Solo faltan algunos detalles menores.'
                    : '💡 Completa las secciones y campos vacíos indicados abajo para mejorar la calidad de esta ficha en el catálogo.'}
              </p>
            </div>

            {/* Related Sections Checklist */}
            <div>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '1rem', color: '#1e293b', fontWeight: 'bold' }}>📋 Secciones de Contenido</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
                {[
                  { label: '🗣️ Sinónimos', active: checkResults.hasSinonimos, count: checkResults.sinonimosCount, desc: 'Nombres locales o alternativos', tab: 'taxonomia' },
                  { label: '📋 Labores/Tareas', active: checkResults.hasLabores, count: checkResults.laboresCount, desc: 'Instrucciones y pautas de cuidado', tab: 'pautas' },
                  { label: '📷 Fotos', active: checkResults.hasPhotos, count: checkResults.photosCount, desc: 'Imágenes botánicas o de cultivos', tab: 'photos' },
                  { label: '📄 PDFs', active: checkResults.hasPdfs, count: checkResults.pdfsCount, desc: 'Fichas técnicas y guías en PDF', tab: 'pdfs' },
                  { label: '🤝 Ecosistema (Asociaciones)', active: checkResults.hasEcosystem, count: checkResults.ecosystemCount, desc: 'Relaciones beneficiosas y plagas', tab: 'asociaciones' },
                  { label: '🌱 Variedades', active: checkResults.hasVarieties, count: checkResults.varietiesCount, desc: 'Variedades registradas de la especie', tab: 'variedades' },
                  { label: '🍽️ Usos y Consumo', active: checkResults.hasAlimentacion, count: checkResults.alimentacionCount, desc: 'Animales aptos en granja', tab: 'alimentacion' },
                ].map((sec, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '1.15rem' }}>{sec.active ? '✅' : '❌'}</span>
                      <div>
                        <strong style={{ color: '#1e293b' }}>{sec.label}</strong>
                        <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b' }}>
                          {sec.active ? `${sec.count} ${sec.count === 1 ? 'registrado' : 'registrados'}` : sec.desc}
                        </span>
                      </div>
                    </div>
                    
                    {!sec.active && (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab(sec.tab);
                          onClose();
                        }}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          background: '#fff',
                          color: '#475569',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          transition: 'all 0.2s',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                        }}
                      >
                        Ir a sección →
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Missing Basic Fields */}
            {checkResults.missingFields.length > 0 && (
              <div>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem', color: '#1e293b', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: '#ef4444' }}>⚠️</span>
                  <span>Campos Básicos Vacíos ({checkResults.missingFields.length})</span>
                </h3>
                <div style={{ background: '#fff5f5', border: '1px solid #fee2e2', borderRadius: '12px', padding: '14px 18px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {checkResults.missingFields.map((field: string, idx: number) => (
                    <span key={idx} style={{ background: '#fecaca', color: '#b91c1c', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600 }}>
                      {field}
                    </span>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Footer */}
          <div style={{ padding: '16px 24px', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
            <button
              type="button"
              onClick={onClose}
              style={{ padding: '10px 20px', background: '#0284c7', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem', boxShadow: '0 4px 6px rgba(2,132,199,0.2)', transition: 'all 0.2s' }}
            >
              Entendido
            </button>
          </div>
        </>
      )}
    </PremiumModal>
  );
}
