'use client';

import React from 'react';

interface BibliaEditorPanelProps {
  rulesContent: string;
  originalRulesContent: string;
  savingRules: boolean;
  rulesStatus: 'idle' | 'success' | 'error';
  onChange: (value: string) => void;
  onSave: () => void;
  onDiscard: () => void;
  isMobile?: boolean;
}

export function BibliaEditorPanel({
  rulesContent,
  originalRulesContent,
  savingRules,
  rulesStatus,
  onChange,
  onSave,
  onDiscard,
  isMobile = false
}: BibliaEditorPanelProps) {
  const hasChanges = rulesContent !== originalRulesContent;

  return (
    <div
      style={{
        background: 'white',
        borderRadius: '16px',
        padding: isMobile ? '16px' : '24px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#1e293b', fontWeight: 'bold' }}>
          ✍️ Editor Markdown
        </h4>
        <span style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'monospace' }}>
          AGENTS.md
        </span>
      </div>
      <textarea
        value={rulesContent}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          minHeight: '480px',
          maxHeight: '650px',
          background: '#0f172a',
          color: '#e2e8f0',
          fontFamily: 'Consolas, Monaco, "Courier New", monospace',
          fontSize: '0.85rem',
          lineHeight: '1.6',
          padding: '16px',
          borderRadius: '8px',
          border: '1px solid #334155',
          resize: 'vertical',
          outline: 'none',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)',
        }}
        placeholder="Define aquí las reglas en formato Markdown..."
      />
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-start', marginTop: '8px', flexWrap: 'wrap' }}>
        <button
          onClick={onSave}
          disabled={savingRules || !hasChanges}
          style={{
            padding: '10px 20px',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 'bold',
            fontSize: '0.9rem',
            cursor: (savingRules || !hasChanges) ? 'not-allowed' : 'pointer',
            opacity: (savingRules || !hasChanges) ? 0.6 : 1,
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          {savingRules ? (
            <>
              <span
                style={{
                  display: 'inline-block',
                  width: '12px',
                  height: '12px',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTop: '2px solid white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }}
              ></span>
              <span>Guardando...</span>
            </>
          ) : (
            <span>💾 Guardar Normas</span>
          )}
        </button>
        <button
          onClick={onDiscard}
          disabled={savingRules || !hasChanges}
          style={{
            padding: '10px 16px',
            background: '#f1f5f9',
            color: '#475569',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            fontWeight: 'bold',
            fontSize: '0.9rem',
            cursor: (savingRules || !hasChanges) ? 'not-allowed' : 'pointer',
            opacity: (savingRules || !hasChanges) ? 0.6 : 1,
            transition: 'all 0.2s',
          }}
        >
          Descartar
        </button>

        {rulesStatus === 'success' && (
          <span
            style={{
              color: '#10b981',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontWeight: 600,
            }}
          >
            ✅ ¡Guardado con éxito!
          </span>
        )}
        {rulesStatus === 'error' && (
          <span
            style={{
              color: '#ef4444',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontWeight: 600,
            }}
          >
            ❌ Error al guardar
          </span>
        )}
      </div>
    </div>
  );
}
