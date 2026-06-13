'use client';

import React from 'react';

interface BackupControlPanelProps {
  optLocalCopy: boolean;
  setOptLocalCopy: (val: boolean) => void;
  optOneDrive: boolean;
  setOptOneDrive: (val: boolean) => void;
  optGit: boolean;
  setOptGit: (val: boolean) => void;
  optFirebase: boolean;
  setOptFirebase: (val: boolean) => void;
  lastActionLocalCopy: string;
  lastActionOneDrive: string;
  lastActionGit: string;
  lastActionFirebase: string;
  handleSelectAll: () => void;
  handleOpenBackupsFolder: () => void;
  handleOpenOneDriveFolder: () => void;
  setLastActionLocalCopy: (val: string) => void;
  setLastActionOneDrive: (val: string) => void;
  setLastActionGit: (val: string) => void;
  setLastActionFirebase: (val: string) => void;
  isMobile?: boolean;
}

export function BackupControlPanel({
  optLocalCopy,
  setOptLocalCopy,
  optOneDrive,
  setOptOneDrive,
  optGit,
  setOptGit,
  optFirebase,
  setOptFirebase,
  lastActionLocalCopy,
  lastActionOneDrive,
  lastActionGit,
  lastActionFirebase,
  handleSelectAll,
  handleOpenBackupsFolder,
  handleOpenOneDriveFolder,
  setLastActionLocalCopy,
  setLastActionOneDrive,
  setLastActionGit,
  setLastActionFirebase,
  isMobile = false
}: BackupControlPanelProps) {
  const allSelected = optLocalCopy && optOneDrive && optGit && optFirebase;

  const updateActionDate = (type: 'local' | 'onedrive' | 'git' | 'firebase') => {
    const dateStr = new Date().toLocaleString('es-ES');
    if (type === 'local') {
      localStorage.setItem('last_action_local', dateStr);
      setLastActionLocalCopy(dateStr);
    } else if (type === 'onedrive') {
      localStorage.setItem('last_action_onedrive', dateStr);
      setLastActionOneDrive(dateStr);
    } else if (type === 'git') {
      localStorage.setItem('last_action_git', dateStr);
      setLastActionGit(dateStr);
    } else if (type === 'firebase') {
      localStorage.setItem('last_action_firebase', dateStr);
      setLastActionFirebase(dateStr);
    }
  };

  return (
    <div
      style={{
        background: 'white',
        borderRadius: '16px',
        padding: isMobile ? '16px' : '28px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
      }}
    >
      {/* Cabecera del Panel */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{ fontSize: '1.8rem' }}>🚀</span>
            <h3 style={{ margin: 0, fontSize: '1.3rem', color: '#1e293b', fontWeight: 'bold' }}>
              Sincronización, Copia y Despliegue
            </h3>
          </div>
          <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0, lineHeight: '1.5' }}>
            Selecciona las acciones que deseas delegar a Antigravity. El sistema generará la orden inteligente
            lista para ejecutar.
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
          <button
            onClick={handleSelectAll}
            style={{
              background: 'none',
              border: 'none',
              color: allSelected ? '#64748b' : '#3b82f6',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '0.8rem',
              textDecoration: 'underline',
              padding: 0,
            }}
          >
            {allSelected ? '❌ Desmarcar Todas' : '✅ Seleccionar Todas'}
          </button>
        </div>
      </div>

      {/* Lista de Interruptores (Switches) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* 1. Copia Local (SQL y ZIP) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: optLocalCopy ? '#f0fdf4' : '#f8fafc',
            padding: '16px 20px',
            borderRadius: '12px',
            border: optLocalCopy ? '1px solid #bbf7d0' : '1px solid #e2e8f0',
            transition: 'all 0.3s',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: '1', minWidth: '240px' }}>
            <span style={{ fontSize: '0.95rem', fontWeight: 'bold', color: optLocalCopy ? '#166534' : '#334155' }}>
              💾 1. Copia Local (SQL y ZIP)
            </span>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Extrae los datos en un archivo .sql y comprime el proyecto en un .zip.
            </span>
            <div
              style={{
                fontSize: '0.75rem',
                color: '#94a3b8',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                marginTop: '2px',
              }}
            >
              <span>🕒</span> Última ejecución: {lastActionLocalCopy}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontFamily: 'monospace',
                  background: '#e2e8f0',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  color: '#475569',
                  wordBreak: 'break-all',
                }}
              >
                C:\Users\jaill\Documents\VERDANTIA COPIAS SEGURIDAD
              </span>
              <button
                onClick={handleOpenBackupsFolder}
                style={{
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  color: '#4f46e5',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  transition: 'all 0.2s',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = '#e2e8f0')}
                onMouseOut={(e) => (e.currentTarget.style.background = '#f1f5f9')}
              >
                📂 Abrir Carpeta
              </button>
            </div>
          </div>
          <label style={{ position: 'relative', display: 'inline-block', width: '50px', height: '28px', flexShrink: 0 }}>
            <input
              type="checkbox"
              checked={optLocalCopy}
              onChange={(e) => {
                setOptLocalCopy(e.target.checked);
                if (e.target.checked) updateActionDate('local');
              }}
              style={{ opacity: 0, width: 0, height: 0 }}
            />
            <span
              style={{
                position: 'absolute',
                cursor: 'pointer',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: optLocalCopy ? '#22c55e' : '#cbd5e1',
                transition: '.3s',
                borderRadius: '28px',
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  content: '""',
                  height: '20px',
                  width: '20px',
                  left: optLocalCopy ? '26px' : '4px',
                  bottom: '4px',
                  backgroundColor: 'white',
                  transition: '.3s',
                  borderRadius: '50%',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                }}
              />
            </span>
          </label>
        </div>

        {/* 2. OneDrive */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: optOneDrive ? '#fdf4ff' : '#f8fafc',
            padding: '16px 20px',
            borderRadius: '12px',
            border: optOneDrive ? '1px solid #f5d0fe' : '1px solid #e2e8f0',
            transition: 'all 0.3s',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: '1', minWidth: '240px' }}>
            <span style={{ fontSize: '0.95rem', fontWeight: 'bold', color: optOneDrive ? '#86198f' : '#334155' }}>
              ☁️ 2. Copia en la nube (SQL y zip)
            </span>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Copia el SQL y ZIP a OneDrive en una carpeta con fecha.
            </span>
            <div
              style={{
                fontSize: '0.75rem',
                color: '#94a3b8',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                marginTop: '2px',
              }}
            >
              <span>🕒</span> Última ejecución: {lastActionOneDrive}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontFamily: 'monospace',
                  background: '#e2e8f0',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  color: '#475569',
                  wordBreak: 'break-all',
                }}
              >
                C:\Users\Public\OneDrive\PROYECTOS\VERDANTIA
              </span>
              <button
                onClick={handleOpenOneDriveFolder}
                style={{
                  background: '#fdf4ff',
                  border: '1px solid #f5d0fe',
                  color: '#a21caf',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  transition: 'all 0.2s',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = '#fae8ff')}
                onMouseOut={(e) => (e.currentTarget.style.background = '#fdf4ff')}
              >
                📂 Abrir Carpeta
              </button>
            </div>
          </div>
          <label style={{ position: 'relative', display: 'inline-block', width: '50px', height: '28px', flexShrink: 0 }}>
            <input
              type="checkbox"
              checked={optOneDrive}
              onChange={(e) => {
                setOptOneDrive(e.target.checked);
                if (e.target.checked) updateActionDate('onedrive');
              }}
              style={{ opacity: 0, width: 0, height: 0 }}
            />
            <span
              style={{
                position: 'absolute',
                cursor: 'pointer',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: optOneDrive ? '#d946ef' : '#cbd5e1',
                transition: '.3s',
                borderRadius: '28px',
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  content: '""',
                  height: '20px',
                  width: '20px',
                  left: optOneDrive ? '26px' : '4px',
                  bottom: '4px',
                  backgroundColor: 'white',
                  transition: '.3s',
                  borderRadius: '50%',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                }}
              />
            </span>
          </label>
        </div>

        {/* 3. GitHub */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: optGit ? '#eff6ff' : '#f8fafc',
            padding: '16px 20px',
            borderRadius: '12px',
            border: optGit ? '1px solid #bfdbfe' : '1px solid #e2e8f0',
            transition: 'all 0.3s',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: '1', minWidth: '240px' }}>
            <span style={{ fontSize: '0.95rem', fontWeight: 'bold', color: optGit ? '#1e40af' : '#334155' }}>
              🐙 3. Guardar en GitHub (Commit & Push)
            </span>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Sella los cambios locales y los sube al repositorio remoto sin desplegar a producción.
            </span>
            <div
              style={{
                fontSize: '0.75rem',
                color: '#94a3b8',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                marginTop: '2px',
              }}
            >
              <span>🕒</span> Última ejecución: {lastActionGit}
            </div>
          </div>
          <label style={{ position: 'relative', display: 'inline-block', width: '50px', height: '28px', flexShrink: 0 }}>
            <input
              type="checkbox"
              checked={optGit}
              onChange={(e) => {
                setOptGit(e.target.checked);
                if (e.target.checked) updateActionDate('git');
              }}
              style={{ opacity: 0, width: 0, height: 0 }}
            />
            <span
              style={{
                position: 'absolute',
                cursor: 'pointer',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: optGit ? '#3b82f6' : '#cbd5e1',
                transition: '.3s',
                borderRadius: '28px',
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  content: '""',
                  height: '20px',
                  width: '20px',
                  left: optGit ? '26px' : '4px',
                  bottom: '4px',
                  backgroundColor: 'white',
                  transition: '.3s',
                  borderRadius: '50%',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                }}
              />
            </span>
          </label>
        </div>

        {/* 4. Firebase */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: optFirebase ? '#faf5ff' : '#f8fafc',
            padding: '16px 20px',
            borderRadius: '12px',
            border: optFirebase ? '1px solid #e9d5ff' : '1px solid #e2e8f0',
            transition: 'all 0.3s',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: '1', minWidth: '240px' }}>
            <span style={{ fontSize: '0.95rem', fontWeight: 'bold', color: optFirebase ? '#6b21a8' : '#334155' }}>
              🔥 4. Desplegar en Firebase (Producción)
            </span>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Compila la app y la despliega públicamente en la red.
            </span>
            <div
              style={{
                fontSize: '0.75rem',
                color: '#94a3b8',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                marginTop: '2px',
              }}
            >
              <span>🕒</span> Última ejecución: {lastActionFirebase}
            </div>
          </div>
          <label style={{ position: 'relative', display: 'inline-block', width: '50px', height: '28px', flexShrink: 0 }}>
            <input
              type="checkbox"
              checked={optFirebase}
              onChange={(e) => {
                setOptFirebase(e.target.checked);
                if (e.target.checked) updateActionDate('firebase');
              }}
              style={{ opacity: 0, width: 0, height: 0 }}
            />
            <span
              style={{
                position: 'absolute',
                cursor: 'pointer',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: optFirebase ? '#8b5cf6' : '#cbd5e1',
                transition: '.3s',
                borderRadius: '28px',
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  content: '""',
                  height: '20px',
                  width: '20px',
                  left: optFirebase ? '26px' : '4px',
                  bottom: '4px',
                  backgroundColor: 'white',
                  transition: '.3s',
                  borderRadius: '50%',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                }}
              />
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}
