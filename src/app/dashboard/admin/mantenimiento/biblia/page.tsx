'use client';

import React from 'react';
import { useBibliaEditor } from './hooks/useBibliaEditor';
import { BibliaHeader } from './components/BibliaHeader';
import { BibliaEditorPanel } from './components/BibliaEditorPanel';
import { BibliaPreviewPanel } from './components/BibliaPreviewPanel';

// FORZAR RECARGA INMEDIATA AL HOT-SWAP (Regla 4)
if (typeof window !== 'undefined') {
  if (!window.sessionStorage.getItem('__did_reload_v26')) {
    window.sessionStorage.setItem('__did_reload_v26', 'true');
    window.location.reload();
  }
}

export default function LaBibliaPage() {
  const {
    userEmail,
    rulesContent,
    setRulesContent,
    originalRulesContent,
    loadingRules,
    savingRules,
    rulesStatus,
    rulesError,
    loadRules,
    handleSaveRules,
    handleDiscard,
    isMobile
  } = useBibliaEditor();

  return (
    <div className="dashboard-content" style={{ padding: isMobile ? '12px 10px' : '20px', width: '100%' }}>
      <BibliaHeader isMobile={isMobile} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
        {loadingRules ? (
          <div style={{ 
            padding: '60px', 
            textAlign: 'center', 
            background: 'white', 
            borderRadius: '16px', 
            border: '1px solid #e2e8f0',
            color: '#10b981'
          }}>
            <span style={{
              display: 'inline-block',
              width: '32px',
              height: '32px',
              border: '4px solid #e2e8f0',
              borderTop: '4px solid #10b981',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              marginBottom: '12px'
            }}></span>
            <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>Cargando normas de funcionamiento...</div>
          </div>
        ) : rulesError ? (
          <div style={{ 
            padding: '32px', 
            background: '#fef2f2', 
            borderRadius: '16px', 
            border: '1px solid #fca5a5', 
            color: '#991b1b',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>⚠️</div>
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Error al cargar las normas</div>
            <div style={{ fontSize: '0.85rem' }}>{rulesError}</div>
            <button 
              onClick={() => userEmail && loadRules(userEmail)}
              style={{
                marginTop: '16px',
                background: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '8px 16px',
                fontSize: '0.85rem',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Reintentar
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '20px' }}>
            <BibliaEditorPanel
              rulesContent={rulesContent}
              originalRulesContent={originalRulesContent}
              savingRules={savingRules}
              rulesStatus={rulesStatus}
              onChange={setRulesContent}
              onSave={handleSaveRules}
              onDiscard={handleDiscard}
              isMobile={isMobile}
            />
            <BibliaPreviewPanel rulesContent={rulesContent} isMobile={isMobile} />
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .rules-ol {
          counter-reset: rule-counter;
        }
        .rule-li {
          counter-increment: rule-counter;
        }
        .rule-number-span::before {
          content: counter(rule-counter) ". ";
          color: #4f46e5;
          font-weight: 800;
          font-size: 1.05rem;
          margin-right: 8px;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />
    </div>
  );
}
