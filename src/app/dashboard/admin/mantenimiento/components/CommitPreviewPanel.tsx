'use client';

import React from 'react';

interface CommitPreviewPanelProps {
  isPreviewOpen: boolean;
  setIsPreviewOpen: (open: boolean) => void;
  changesInfo: any;
  loadingPreview: boolean;
  isRunning: boolean;
  userEmail: string | null;
  onReload: (email: string) => void;
  isMobile?: boolean;
}

export function CommitPreviewPanel({
  isPreviewOpen,
  setIsPreviewOpen,
  changesInfo,
  loadingPreview,
  isRunning,
  userEmail,
  onReload,
  isMobile = false
}: CommitPreviewPanelProps) {
  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #f8fafc, #eff6ff)',
        borderRadius: '16px',
        border: '1px solid #bfdbfe',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
        overflow: 'hidden',
        transition: 'all 0.3s ease',
      }}
    >
      {/* Cabecera del Colapsable */}
      <div
        onClick={() => setIsPreviewOpen(!isPreviewOpen)}
        style={{
          width: '100%',
          background: 'none',
          border: 'none',
          padding: isMobile ? '12px 14px' : '16px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          textAlign: 'left',
          outline: 'none',
          userSelect: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: isMobile ? '1.1rem' : '1.4rem' }}>🤖</span>
          <div>
            <strong style={{ color: '#1e3a8a', display: 'block', fontSize: isMobile ? '0.85rem' : '0.95rem' }}>
              Vista Previa del Commit Automático
            </strong>
            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
              {changesInfo && (changesInfo.added?.length > 0 || changesInfo.modified?.length > 0)
                ? `${changesInfo.added.length + changesInfo.modified.length} archivos detectados con cambios`
                : 'Sin cambios locales detectados'}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Botón de recarga individual */}
          <button
            onClick={(e) => {
              e.stopPropagation(); // Evita colapsar/expandir al hacer clic en recargar
              if (userEmail) onReload(userEmail);
            }}
            disabled={loadingPreview || isRunning}
            style={{
              background: 'white',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              padding: '4px 10px',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: (loadingPreview || isRunning) ? 'not-allowed' : 'pointer',
              color: '#1e3a8a',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => !(loadingPreview || isRunning) && (e.currentTarget.style.background = '#f1f5f9')}
            onMouseLeave={(e) => !(loadingPreview || isRunning) && (e.currentTarget.style.background = 'white')}
          >
            {loadingPreview ? '⏳ Analizando...' : '🔄 Recargar'}
          </button>
          <span
            style={{
              fontSize: '0.8rem',
              color: '#1e3a8a',
              transform: isPreviewOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s',
              display: 'inline-block',
            }}
          >
            ▼
          </span>
        </div>
      </div>

      {/* Contenido del Colapsable */}
      {isPreviewOpen && (
        <div
          style={{
            padding: isMobile ? '0 14px 14px 14px' : '0 24px 24px 24px',
            borderTop: '1px solid #bfdbfe',
            background: 'white',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <div
            style={{
              marginTop: '16px',
              background: '#f8fafc',
              borderRadius: '8px',
              padding: '16px',
              border: '1px solid #e2e8f0',
            }}
          >
            <div style={{ marginBottom: '12px', textAlign: 'left' }}>
              <span
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: '#475569',
                  display: 'block',
                  marginBottom: '4px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Commit para Sincronización Simple:
              </span>
              <code
                style={{
                  background: '#f1f5f9',
                  color: '#0f172a',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  display: 'block',
                  fontSize: '0.85rem',
                  fontFamily: 'monospace',
                  border: '1px solid #e2e8f0',
                  wordBreak: 'break-all',
                }}
              >
                {changesInfo ? changesInfo.commitMessage : 'Cargando mensaje...'}
              </code>
            </div>

            <div style={{ textAlign: 'left' }}>
              <span
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: '#475569',
                  display: 'block',
                  marginBottom: '4px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Commit para Despliegue en Red (v{changesInfo?.nextVersion || '?.?.?'}):
              </span>
              <code
                style={{
                  background: '#f8fafc',
                  color: '#4f46e5',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  display: 'block',
                  fontSize: '0.85rem',
                  fontFamily: 'monospace',
                  border: '1px solid #e2e8f0',
                  fontWeight: 'bold',
                  wordBreak: 'break-all',
                }}
              >
                {changesInfo ? `Despliegue v${changesInfo.nextVersion}: ${changesInfo.commitMessage}` : 'Cargando mensaje...'}
              </code>
            </div>
          </div>

          {/* Listado resumido de archivos detectados */}
          {changesInfo && (changesInfo.added?.length > 0 || changesInfo.modified?.length > 0) ? (
            <div style={{ textAlign: 'left' }}>
              <strong style={{ display: 'block', fontSize: '0.85rem', color: '#1e3a8a', marginBottom: '8px' }}>
                📁 Archivos involucrados en el commit ({changesInfo.added.length + changesInfo.modified.length}):
              </strong>
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '12px',
                  maxHeight: '150px',
                  overflowY: 'auto',
                  fontFamily: 'monospace',
                  fontSize: '0.78rem',
                }}
              >
                {changesInfo.added.map((f: string) => (
                  <div key={f} style={{ color: '#059669', marginBottom: '4px' }}>
                    [NUEVO] {f}
                  </div>
                ))}
                {changesInfo.modified.map((f: string) => (
                  <div key={f} style={{ color: '#2563eb', marginBottom: '4px' }}>
                    [MODIFICADO] {f}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ fontSize: '0.82rem', color: '#64748b', fontStyle: 'italic', textAlign: 'left' }}>
              ✓ No hay cambios locales pendientes.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
