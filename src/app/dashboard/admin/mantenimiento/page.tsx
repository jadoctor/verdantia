'use client';

import React from 'react';
import { useMantenimiento } from './hooks/useMantenimiento';
import { MantenimientoHeader } from './components/MantenimientoHeader';
import { CommitPreviewPanel } from './components/CommitPreviewPanel';
import { BackupControlPanel } from './components/BackupControlPanel';
import { ConsolePanel } from './components/ConsolePanel';

// FORZAR RECARGA INMEDIATA AL HOT-SWAP (Regla 4)
if (typeof window !== 'undefined') {
  if (!window.sessionStorage.getItem('__did_reload_v24')) {
    window.sessionStorage.setItem('__did_reload_v24', 'true');
    window.location.reload();
  }
}

export default function MantenimientoPage() {
  const {
    userEmail,
    logs,
    isRunning,
    status,
    changesInfo,
    loadingPreview,
    isPreviewOpen,
    setIsPreviewOpen,
    isConsoleOpen,
    setIsConsoleOpen,
    consoleEndRef,
    lastActionLocalCopy,
    lastActionOneDrive,
    lastActionGit,
    lastActionFirebase,
    optLocalCopy,
    setOptLocalCopy,
    optGit,
    setOptGit,
    optFirebase,
    setOptFirebase,
    optOneDrive,
    setOptOneDrive,
    setLastActionLocalCopy,
    setLastActionOneDrive,
    setLastActionGit,
    setLastActionFirebase,
    loadChangesPreview,
    handleSelectAll,
    handleOpenBackupsFolder,
    handleOpenOneDriveFolder,
    copyLogs,
    isMobile
  } = useMantenimiento();

  return (
    <div className="dashboard-content" style={{ padding: isMobile ? '12px 10px' : '20px' }}>
      <MantenimientoHeader isMobile={isMobile} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
        <CommitPreviewPanel
          isPreviewOpen={isPreviewOpen}
          setIsPreviewOpen={setIsPreviewOpen}
          changesInfo={changesInfo}
          loadingPreview={loadingPreview}
          isRunning={isRunning}
          userEmail={userEmail}
          onReload={loadChangesPreview}
          isMobile={isMobile}
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
          <BackupControlPanel
            optLocalCopy={optLocalCopy}
            setOptLocalCopy={setOptLocalCopy}
            optOneDrive={optOneDrive}
            setOptOneDrive={setOptOneDrive}
            optGit={optGit}
            setOptGit={setOptGit}
            optFirebase={optFirebase}
            setOptFirebase={setOptFirebase}
            lastActionLocalCopy={lastActionLocalCopy}
            lastActionOneDrive={lastActionOneDrive}
            lastActionGit={lastActionGit}
            lastActionFirebase={lastActionFirebase}
            handleSelectAll={handleSelectAll}
            handleOpenBackupsFolder={handleOpenBackupsFolder}
            handleOpenOneDriveFolder={handleOpenOneDriveFolder}
            setLastActionLocalCopy={setLastActionLocalCopy}
            setLastActionOneDrive={setLastActionOneDrive}
            setLastActionGit={setLastActionGit}
            setLastActionFirebase={setLastActionFirebase}
            isMobile={isMobile}
          />

          <ConsolePanel
            isConsoleOpen={isConsoleOpen}
            setIsConsoleOpen={setIsConsoleOpen}
            logs={logs}
            isRunning={isRunning}
            status={status}
            consoleEndRef={consoleEndRef}
            onCopyLogs={copyLogs}
            isMobile={isMobile}
          />
        </div>
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
