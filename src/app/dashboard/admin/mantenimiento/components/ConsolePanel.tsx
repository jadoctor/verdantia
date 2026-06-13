'use client';

import React from 'react';

interface ConsolePanelProps {
  isConsoleOpen: boolean;
  setIsConsoleOpen: (open: boolean) => void;
  logs: string;
  isRunning: boolean;
  status: 'success' | 'error' | 'idle';
  consoleEndRef: React.RefObject<HTMLDivElement | null>;
  onCopyLogs: () => void;
  isMobile?: boolean;
}

export function ConsolePanel({
  isConsoleOpen,
  setIsConsoleOpen,
  logs,
  isRunning,
  status,
  consoleEndRef,
  onCopyLogs,
  isMobile = false
}: ConsolePanelProps) {
  return (
    <div
      style={{
        background: 'white',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
        overflow: 'hidden',
      }}
    >
      {/* Cabecera de la Consola Colapsable */}
      <button
        onClick={() => setIsConsoleOpen(!isConsoleOpen)}
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
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: isMobile ? '1.1rem' : '1.4rem' }}>🖥️</span>
          <div>
            <strong style={{ color: '#1e293b', display: 'block', fontSize: isMobile ? '0.85rem' : '0.95rem' }}>
              Registro de Comandos de Consola
            </strong>
            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
              {isRunning ? '⏳ Ejecutando procesos...' : '✓ Inactiva'}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {isRunning && (
            <span
              style={{
                fontSize: '0.75rem',
                color: '#8b5cf6',
                fontWeight: 600,
                background: '#f5f3ff',
                padding: '2px 8px',
                borderRadius: '9999px',
                border: '1px solid #ddd6fe',
              }}
            >
              Trabajando
            </span>
          )}
          <span
            style={{
              fontSize: '0.8rem',
              color: '#64748b',
              transform: isConsoleOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s',
              display: 'inline-block',
            }}
          >
            ▼
          </span>
        </div>
      </button>

      {/* Contenido de la Consola */}
      {isConsoleOpen && (
        <div
          style={{
            padding: isMobile ? '14px' : '24px',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span
              style={{
                fontSize: '0.82rem',
                fontWeight: 700,
                color: '#475569',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Salida de comandos:
            </span>
            <button
              onClick={onCopyLogs}
              style={{
                background: '#f1f5f9',
                color: '#475569',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = '#e2e8f0')}
              onMouseOut={(e) => (e.currentTarget.style.background = '#f1f5f9')}
            >
              📋 Copiar Logs
            </button>
          </div>

          <div
            style={{
              background: '#0f172a',
              color: status === 'success' ? '#4ade80' : status === 'error' ? '#f87171' : '#e2e8f0',
              borderRadius: '8px',
              padding: '16px',
              height: '300px',
              overflowY: 'auto',
              fontFamily: 'Consolas, Monaco, "Courier New", monospace',
              fontSize: '0.85rem',
              lineHeight: '1.6',
              whiteSpace: 'pre-wrap',
              border: '1px solid #334155',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)',
              position: 'relative',
            }}
          >
            {isRunning && (
              <div
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#1e293b',
                  padding: '4px 10px',
                  borderRadius: '12px',
                  border: '1px solid #475569',
                  fontSize: '0.75rem',
                  color: '#94a3b8',
                }}
              >
                <span
                  className="spinner-mini"
                  style={{
                    display: 'inline-block',
                    width: '10px',
                    height: '10px',
                    border: '2px solid #94a3b8',
                    borderTop: '2px solid transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                  }}
                ></span>
                <span>Ejecutando...</span>
              </div>
            )}
            {logs}
            <div ref={consoleEndRef} />
          </div>
        </div>
      )}
    </div>
  );
}
