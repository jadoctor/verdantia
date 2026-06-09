'use client';

import React, { useState, useEffect, useRef } from 'react';
import { auth } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import ReactMarkdown from 'react-markdown';

// FORZAR RECARGA INMEDIATA AL HOT-SWAP (Regla 4)
if (typeof window !== 'undefined') {
  if (!window.sessionStorage.getItem('__did_reload_v8')) {
    window.sessionStorage.setItem('__did_reload_v8', 'true');
    window.location.reload();
  }
}

const DepthContext = React.createContext(0);

export default function MantenimientoPage() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'backups' | 'diagnostico' | 'normas'>('backups');
  const [logs, setLogs] = useState<string>('🖥️ Consola de comandos inactiva. Elige una acción de copia de seguridad para comenzar.');
  const [isRunning, setIsRunning] = useState(false);
  const [status, setStatus] = useState<'success' | 'error' | 'idle'>('idle');
  const [changesInfo, setChangesInfo] = useState<any>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  const consoleEndRef = useRef<HTMLDivElement>(null);

  const [lastLocalBackup, setLastLocalBackup] = useState<string>('Nunca');
  const [lastProjectBackup, setLastProjectBackup] = useState<string>('Nunca');
  const [lastGitOnly, setLastGitOnly] = useState<string>('Nunca');
  const [lastGitAndDeploy, setLastGitAndDeploy] = useState<string>('Nunca');
  const [includeFullBackup, setIncludeFullBackup] = useState<boolean>(false);
  const [isDeployChecked, setIsDeployChecked] = useState<boolean>(false);

  // Estados para las Normas de Funcionamiento
  const [rulesContent, setRulesContent] = useState<string>('');
  const [originalRulesContent, setOriginalRulesContent] = useState<string>('');
  const [loadingRules, setLoadingRules] = useState<boolean>(false);
  const [savingRules, setSavingRules] = useState<boolean>(false);
  const [rulesStatus, setRulesStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [rulesError, setRulesError] = useState<string | null>(null);

  useEffect(() => {
    setLastLocalBackup(localStorage.getItem('last_local_backup') || 'Nunca');
    setLastProjectBackup(localStorage.getItem('last_project_backup') || 'Nunca');
    setLastGitOnly(localStorage.getItem('last_git_only') || 'Nunca');
    setLastGitAndDeploy(localStorage.getItem('last_git_and_deploy') || 'Nunca');
  }, []);

  const loadRules = async (email: string) => {
    setLoadingRules(true);
    setRulesError(null);
    setRulesStatus('idle');
    try {
      const res = await fetch(`/api/admin/mantenimiento/normas?t=${Date.now()}`, {
        headers: { 'x-user-email': email },
        cache: 'no-store'
      });
      if (res.ok) {
        const data = await res.json();
        setRulesContent(data.content || '');
        setOriginalRulesContent(data.content || '');
      } else {
        const errData = await res.json();
        setRulesError(errData.error || 'Error al cargar las normas');
      }
    } catch (err: any) {
      setRulesError(err.message || 'Error de conexión');
    } finally {
      setLoadingRules(false);
    }
  };

  const handleSaveRules = async () => {
    if (!userEmail || savingRules) return;
    setSavingRules(true);
    setRulesStatus('idle');
    setRulesError(null);
    try {
      const res = await fetch('/api/admin/mantenimiento/normas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': userEmail,
        },
        body: JSON.stringify({ content: rulesContent }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRulesStatus('success');
        setOriginalRulesContent(rulesContent);
        setTimeout(() => setRulesStatus('idle'), 3000);
      } else {
        setRulesStatus('error');
        setRulesError(data.error || 'Error al guardar las normas');
      }
    } catch (err: any) {
      setRulesStatus('error');
      setRulesError(err.message || 'Error de conexión');
    } finally {
      setSavingRules(false);
    }
  };

  useEffect(() => {
    if (userEmail && activeTab === 'normas') {
      loadRules(userEmail);
    }
  }, [userEmail, activeTab]);

  useEffect(() => {
    if (isRunning) {
      setIsConsoleOpen(true);
    }
  }, [isRunning]);

  const loadChangesPreview = async (email: string) => {
    setLoadingPreview(true);
    try {
      const res = await fetch('/api/admin/mantenimiento/backup', {
        headers: { 'x-user-email': email }
      });
      if (res.ok) {
        const data = await res.json();
        setChangesInfo(data);
      }
    } catch (err) {
      console.error('Error loading changes preview:', err);
    } finally {
      setLoadingPreview(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.email) {
        setUserEmail(user.email);
        loadChangesPreview(user.email);
      } else {
        setUserEmail(null);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isConsoleOpen]);

  const handleLocalBackup = async () => {
    if (!userEmail || isRunning) return;
    setIsRunning(true);
    setStatus('idle');
    setLogs('> Solicitando exportación de base de datos MySQL (Hostinger)...\n> Consultando tablas y generando sentencias SQL...');

    try {
      const res = await fetch('/api/admin/mantenimiento/backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': userEmail,
        },
        body: JSON.stringify({ action: 'local_backup' }),
      });

      if (!res.ok) {
        throw new Error(`Error en servidor (${res.status})`);
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      a.download = `verdantia-backup-${timestamp}.sql`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      setLogs(prev => prev + '\n✅ [Copia Local Exitosa] Archivo SQL descargado en tu navegador.\n💾 Copia de base de datos (.sql) guardada en:\nC:\\Users\\jaill\\Documents\\VERDANTIAS COPIAS SEGURIDAD');
      setStatus('success');
      const dateStr = new Date().toLocaleString('es-ES');
      localStorage.setItem('last_local_backup', dateStr);
      setLastLocalBackup(dateStr);
    } catch (err: any) {
      setLogs(prev => prev + `\n❌ Error al generar la copia local: ${err.message}`);
      setStatus('error');
    } finally {
      setIsRunning(false);
    }
  };

  const handleProjectBackup = async () => {
    if (!userEmail || isRunning) return;
    setIsRunning(true);
    setStatus('idle');
    setLogs('> Iniciando copia de seguridad del código del proyecto (excluyendo node_modules, .next, etc.)...\n> Comprimiendo archivos en formato ZIP...');

    try {
      const res = await fetch('/api/admin/mantenimiento/backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': userEmail,
        },
        body: JSON.stringify({ action: 'project_backup' }),
      });

      const data = await res.json();
      
      if (!res.ok || !data.success) {
        throw new Error(data.error || `Error en servidor (${res.status})`);
      }

      setLogs(data.log || '✅ [Copia de Código Exitosa] Archivo ZIP guardado en tu carpeta de copias de seguridad.');
      setStatus('success');
      const dateStr = new Date().toLocaleString('es-ES');
      localStorage.setItem('last_project_backup', dateStr);
      setLastProjectBackup(dateStr);
    } catch (err: any) {
      setLogs(`\n❌ Error al generar la copia del proyecto: ${err.message}`);
      setStatus('error');
    } finally {
      setIsRunning(false);
    }
  };

  const handleOpenBackupsFolder = async () => {
    if (!userEmail) return;
    try {
      const res = await fetch('/api/admin/mantenimiento/backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': userEmail,
        },
        body: JSON.stringify({ action: 'open_backups_folder' }),
      });
      if (res.ok) {
        setLogs(prev => prev + '\n📂 Carpeta de copias de seguridad abierta en el explorador de archivos.');
      }
    } catch (err: any) {
      console.error('Error al abrir la carpeta de copias:', err);
    }
  };

  const handleGitOnly = async () => {
    if (!userEmail || isRunning) return;
    setIsRunning(true);
    setStatus('idle');
    setLogs('> Iniciando subida a GitHub (solo repositorio)...');

    const logInterval = setInterval(async () => {
      try {
        const logRes = await fetch('/api/admin/mantenimiento/logs');
        if (logRes.ok) {
          const text = await logRes.text();
          if (text) setLogs(text);
        }
      } catch (e) {}
    }, 1500);

    try {
      const res = await fetch('/api/admin/mantenimiento/backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': userEmail,
        },
        body: JSON.stringify({ 
          action: 'git_only'
        }),
      });

      const data = await res.json();
      clearInterval(logInterval);
      setLogs(data.log || data.error || 'Ocurrió un error inesperado');
      if (res.ok && data.success) {
        setStatus('success');
        const dateStr = new Date().toLocaleString('es-ES');
        localStorage.setItem('last_git_only', dateStr);
        setLastGitOnly(dateStr);
        if (userEmail) loadChangesPreview(userEmail);
      } else {
        setStatus('error');
      }
    } catch (err: any) {
      clearInterval(logInterval);
      setLogs(prev => prev + `\n❌ Error de conexión: ${err.message}`);
      setStatus('error');
    } finally {
      clearInterval(logInterval);
      setIsRunning(false);
    }
  };

  const handleGitAndDeploy = async () => {
    if (!userEmail || isRunning) return;
    
    const confirmDeploy = confirm(
      '⚠️ ¿Estás seguro de que quieres realizar la subida a GitHub Y EL DESPLIEGUE A PRODUCCIÓN?\n\n' +
      'Esto compilará la aplicación (npm run build) y la subirá a la red (firebase deploy).'
    );
    if (!confirmDeploy) return;

    setIsRunning(true);
    setStatus('idle');
    setLogs('> Iniciando flujo de subida y despliegue a producción...\n> Esto puede tardar alrededor de 1-2 minutos...');

    const logInterval = setInterval(async () => {
      try {
        const logRes = await fetch('/api/admin/mantenimiento/logs');
        if (logRes.ok) {
          const text = await logRes.text();
          if (text) setLogs(text);
        }
      } catch (e) {}
    }, 1500);

    try {
      const res = await fetch('/api/admin/mantenimiento/backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': userEmail,
        },
        body: JSON.stringify({ 
          action: 'git_and_deploy',
          includeFullBackup: includeFullBackup
        }),
      });

      const data = await res.json();
      clearInterval(logInterval);
      setLogs(data.log || data.error || 'Ocurrió un error inesperado');
      if (res.ok && data.success) {
        setStatus('success');
        const dateStr = new Date().toLocaleString('es-ES');
        localStorage.setItem('last_git_and_deploy', dateStr);
        setLastGitAndDeploy(dateStr);

        if (includeFullBackup) {
          localStorage.setItem('last_local_backup', dateStr);
          setLastLocalBackup(dateStr);
          localStorage.setItem('last_project_backup', dateStr);
          setLastProjectBackup(dateStr);
        }

        if (userEmail) loadChangesPreview(userEmail);
      } else {
        setStatus('error');
      }
    } catch (err: any) {
      clearInterval(logInterval);
      setLogs(prev => prev + `\n❌ Error de conexión: ${err.message}`);
      setStatus('error');
    } finally {
      clearInterval(logInterval);
      setIsRunning(false);
    }
  };

  const copyLogs = () => {
    navigator.clipboard.writeText(logs);
    alert('¡Logs copiados al portapapeles!');
  };

  return (
    <div className="dashboard-content" style={{ padding: '20px' }}>
      {/* Cabecera Principal */}
      <div style={{ 
        background: 'linear-gradient(135deg, #4f46e5, #8b5cf6)', 
        borderRadius: '16px', 
        padding: '24px 28px', 
        marginBottom: '24px', 
        color: 'white',
        boxShadow: '0 4px 15px rgba(79, 70, 229, 0.2)'
      }}>
        <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800 }}>🔧 Mantenimiento y Diagnóstico</h1>
        <p style={{ margin: '4px 0 0', opacity: 0.9, fontSize: '0.9rem' }}>
          Consola centralizada para realizar copias de seguridad de base de datos, commits a GitHub y despliegues a producción.
        </p>
      </div>

      {/* Selector de Pestañas */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
        <button 
          onClick={() => setActiveTab('backups')}
          style={{
            padding: '8px 16px',
            background: activeTab === 'backups' ? '#4f46e5' : 'transparent',
            color: activeTab === 'backups' ? 'white' : '#64748b',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          📁 Copia de Seguridad
        </button>
        <button 
          onClick={() => setActiveTab('normas')}
          style={{
            padding: '8px 16px',
            background: activeTab === 'normas' ? '#4f46e5' : 'transparent',
            color: activeTab === 'normas' ? 'white' : '#64748b',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          📜 Normas de Funcionamiento
        </button>
        <button 
          onClick={() => setActiveTab('diagnostico')}
          style={{
            padding: '8px 16px',
            background: activeTab === 'diagnostico' ? '#4f46e5' : 'transparent',
            color: activeTab === 'diagnostico' ? 'white' : '#64748b',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          ⚙️ Otras Herramientas
        </button>
      </div>

      {/* Contenido de Pestaña: Diagnóstico */}
      {activeTab === 'diagnostico' && (
        <div style={{ 
          background: 'white', 
          borderRadius: '16px', 
          padding: '32px', 
          border: '1px solid #e2e8f0', 
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
          textAlign: 'center',
          color: '#64748b'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🛠️</div>
          <h3 style={{ fontSize: '1.2rem', color: '#1e293b', marginBottom: '8px' }}>Próximamente</h3>
          <p style={{ maxWidth: '400px', margin: '0 auto', fontSize: '0.9rem', lineHeight: '1.5' }}>
            Aquí se integrarán herramientas de diagnóstico del sistema, optimización de base de datos, depuración de logs e incidencias de usuarios.
          </p>
        </div>
      )}

      {/* Contenido de Pestaña: Normas de Funcionamiento */}
      {activeTab === 'normas' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
          {/* Cabecera explicativa */}
          <div style={{ 
            background: '#f8fafc', 
            borderRadius: '16px', 
            padding: '24px', 
            border: '1px solid #cbd5e1',
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
          }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2rem', color: '#0f172a', fontWeight: 'bold' }}>
              📜 Biblia de Normas de la IA (`AGENTS.md`)
            </h3>
            <p style={{ margin: 0, color: '#475569', fontSize: '0.9rem', lineHeight: '1.6' }}>
              Aquí puedes definir y refinar el conjunto de reglas e instrucciones que el asistente de Inteligencia Artificial (yo) debe acatar obligatoriamente en cada turno.
              Al guardar los cambios, la base de conocimientos se actualiza inmediatamente en tiempo real y guiará mis futuras decisiones.
            </p>
          </div>

          {loadingRules ? (
            <div style={{ 
              padding: '60px', 
              textAlign: 'center', 
              background: 'white', 
              borderRadius: '16px', 
              border: '1px solid #e2e8f0',
              color: '#4f46e5'
            }}>
              <span style={{
                display: 'inline-block',
                width: '32px',
                height: '32px',
                border: '4px solid #e2e8f0',
                borderTop: '4px solid #4f46e5',
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
              {/* Columna Izquierda: Editor */}
              <div style={{ 
                background: 'white', 
                borderRadius: '16px', 
                padding: '24px', 
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}>
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
                  onChange={(e) => setRulesContent(e.target.value)}
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
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)'
                  }}
                  placeholder="Define aquí las reglas en formato Markdown..."
                />
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-start', marginTop: '8px' }}>
                  <button
                    onClick={handleSaveRules}
                    disabled={savingRules || rulesContent === originalRulesContent}
                    style={{
                      padding: '10px 20px',
                      background: 'linear-gradient(135deg, #4f46e5, #8b5cf6)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 'bold',
                      fontSize: '0.9rem',
                      cursor: (savingRules || rulesContent === originalRulesContent) ? 'not-allowed' : 'pointer',
                      opacity: (savingRules || rulesContent === originalRulesContent) ? 0.6 : 1,
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    {savingRules ? (
                      <>
                        <span style={{
                          display: 'inline-block',
                          width: '12px',
                          height: '12px',
                          border: '2px solid rgba(255,255,255,0.3)',
                          borderTop: '2px solid white',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite'
                        }}></span>
                        <span>Guardando...</span>
                      </>
                    ) : (
                      <span>💾 Guardar Normas</span>
                    )}
                  </button>
                  <button
                    onClick={() => setRulesContent(originalRulesContent)}
                    disabled={savingRules || rulesContent === originalRulesContent}
                    style={{
                      padding: '10px 16px',
                      background: '#f1f5f9',
                      color: '#475569',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      fontWeight: 'bold',
                      fontSize: '0.9rem',
                      cursor: (savingRules || rulesContent === originalRulesContent) ? 'not-allowed' : 'pointer',
                      opacity: (savingRules || rulesContent === originalRulesContent) ? 0.6 : 1,
                      transition: 'all 0.2s'
                    }}
                  >
                    Descartar
                  </button>
                  
                  {/* Mensajes de éxito / error */}
                  {rulesStatus === 'success' && (
                    <span style={{ color: '#10b981', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                      ✅ ¡Guardado con éxito!
                    </span>
                  )}
                  {rulesStatus === 'error' && (
                    <span style={{ color: '#ef4444', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                      ❌ Error al guardar
                    </span>
                  )}
                </div>
              </div>

              {/* Columna Derecha: Vista Previa */}
              <div style={{ 
                background: 'white', 
                borderRadius: '16px', 
                padding: '24px', 
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                maxHeight: '760px',
                overflowY: 'auto'
              }}>
                <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#1e293b', fontWeight: 'bold', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
                  👁️ Vista Previa en Tiempo Real
                </h4>
                
                <div className="markdown-preview" style={{ color: '#334155' }}>
                  {rulesContent ? (
                    <DepthContext.Provider value={0}>
                    <ReactMarkdown
                      components={{
                        h1: ({node, ...props}) => <h1 style={{fontSize: '1.4rem', color: '#0f172a', borderBottom: '2px solid #f1f5f9', paddingBottom: '6px', marginTop: '20px', marginBottom: '10px', fontWeight: 800}} {...props} />,
                        h2: ({node, ...props}) => <h2 style={{fontSize: '1.2rem', color: '#1e293b', borderBottom: '1px solid #f8fafc', paddingBottom: '4px', marginTop: '16px', marginBottom: '8px', fontWeight: 700}} {...props} />,
                        h3: ({node, ...props}) => <h3 style={{fontSize: '1.05rem', color: '#334155', marginTop: '14px', marginBottom: '6px', fontWeight: 600}} {...props} />,
                        p: ({node, ...props}) => <p style={{fontSize: '0.88rem', lineHeight: '1.6', marginBottom: '10px'}} {...props} />,
                        ul: ({node, ...props}) => {
                          const depth = React.useContext(DepthContext);
                          return (
                            <DepthContext.Provider value={depth + 1}>
                              <ul style={{paddingLeft: '20px', marginBottom: '10px', listStyleType: 'disc'}} {...props} />
                            </DepthContext.Provider>
                          );
                        },
                        ol: ({node, ...props}) => {
                          const depth = React.useContext(DepthContext);
                          return (
                            <DepthContext.Provider value={depth + 1}>
                              <ol className={depth === 0 ? "rules-ol" : ""} style={{listStyleType: depth === 0 ? 'none' : 'decimal', paddingLeft: depth === 0 ? 0 : '20px', margin: 0, ...(depth === 0 ? {counterReset: 'rule-counter'} : {})}} {...props} />
                            </DepthContext.Provider>
                          );
                        },
                        li: ({node, ordered, ...props}: any) => {
                          const depth = React.useContext(DepthContext);
                          const children = React.Children.toArray(props.children);
                          
                          // Es top-level SOLO si es el primer nivel de anidamiento de listas (depth === 1)
                          const isTopLevel = depth === 1;
                          
                          // Find first meaningful child
                          const nonSpaceChildren = children.filter((child: any) => {
                            if (typeof child === 'string') return child.trim().length > 0;
                            return child !== null && child !== undefined;
                          });
                          
                          let firstMeaningfulChild: any = nonSpaceChildren[0];
                          let isParagraph = false;
                          
                          if (firstMeaningfulChild && firstMeaningfulChild.type === 'p') {
                            isParagraph = true;
                            const pChildren = React.Children.toArray(firstMeaningfulChild.props.children);
                            const nonSpacePChildren = pChildren.filter((child: any) => {
                              if (typeof child === 'string') return child.trim().length > 0;
                              return child !== null && child !== undefined;
                            });
                            firstMeaningfulChild = nonSpacePChildren[0];
                          }
                          
                          const isStrong = firstMeaningfulChild && (
                            firstMeaningfulChild.type === 'strong' || 
                            firstMeaningfulChild.type === 'b'
                          );
                          
                          // Solo los ítems de primer nivel con <strong> son colapsables
                          if (isStrong && isTopLevel) {
                            const title = firstMeaningfulChild;
                            let rest: any[] = [];
                            
                            if (isParagraph) {
                              const pChildren = React.Children.toArray((nonSpaceChildren[0] as any).props.children);
                              const titleIndex = pChildren.findIndex((child: any) => child === firstMeaningfulChild);
                              if (titleIndex !== -1) {
                                rest.push(...pChildren.slice(titleIndex + 1));
                              }
                              rest.push(...nonSpaceChildren.slice(1));
                            } else {
                              const titleIndex = children.findIndex((child: any) => child === firstMeaningfulChild);
                              if (titleIndex !== -1) {
                                rest.push(...children.slice(titleIndex + 1));
                              }
                            }
                            
                            const hasRestContent = rest.some((child: any) => {
                              if (typeof child === 'string') return child.trim().length > 0;
                              return child !== null && child !== undefined;
                            });
                            
                            if (!hasRestContent) {
                              return (
                                <li style={{ fontSize: '0.88rem', marginBottom: '8px', lineHeight: '1.5', listStyleType: 'none' }}>
                                  <strong>{title}</strong>
                                </li>
                              );
                            }
                            
                            return (
                              <li className="rule-li" style={{ 
                                listStyleType: 'none',
                                padding: 0,
                                margin: '0 0 16px 0'
                              }}>
                                <div className="rule-card" style={{
                                  background: '#ffffff',
                                  border: '1px solid #e2e8f0',
                                  borderLeft: '4px solid #4f46e5',
                                  borderRadius: '12px',
                                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                                  color: '#334155',
                                  transition: 'all 0.2s ease'
                                }}>
                                  <div 
                                    onClick={(e) => {
                                      const card = e.currentTarget.parentElement!;
                                      const content = card.querySelector('.rule-content') as HTMLElement;
                                      const arrow = e.currentTarget.querySelector('.rule-arrow') as HTMLElement;
                                      if (content.style.display === 'none') {
                                        content.style.display = 'block';
                                        arrow.style.transform = 'rotate(180deg)';
                                        arrow.style.color = '#4f46e5';
                                        card.style.borderColor = '#c7d2fe';
                                        card.style.boxShadow = '0 10px 15px -3px rgba(79, 70, 229, 0.08)';
                                      } else {
                                        content.style.display = 'none';
                                        arrow.style.transform = 'rotate(0deg)';
                                        arrow.style.color = '#64748b';
                                        card.style.borderColor = '#e2e8f0';
                                        card.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.05)';
                                      }
                                    }}
                                    style={{
                                      cursor: 'pointer',
                                      padding: '14px 18px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      userSelect: 'none'
                                    }}
                                  >
                                    <span className="rule-number-span" />
                                    <span style={{ color: '#1e3a8a', fontWeight: 700, fontSize: '0.92rem' }}>{title}</span>
                                    <span className="rule-arrow" style={{
                                      marginLeft: 'auto',
                                      color: '#64748b',
                                      transition: 'transform 0.2s ease, color 0.2s ease',
                                      fontSize: '0.8rem'
                                    }}>▼</span>
                                  </div>
                                  <div className="rule-content" style={{ 
                                    display: 'none',
                                    padding: '0 18px 16px 18px',
                                    color: '#475569',
                                    fontSize: '0.85rem',
                                    lineHeight: '1.6'
                                  }}>
                                    <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                                      {rest}
                                    </div>
                                  </div>
                                </div>
                              </li>
                            );
                          }
                          
                          return <li style={{ fontSize: '0.88rem', marginBottom: '4px', lineHeight: '1.5' }} {...props} />;
                        },
                        code: ({node, ...props}) => <code style={{background: '#f1f5f9', color: '#db2777', padding: '2px 6px', borderRadius: '4px', fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: 600}} {...props} />,
                        pre: ({node, ...props}) => <pre style={{background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', overflowX: 'auto', marginBottom: '10px'}} {...props} />,
                        blockquote: ({node, ...props}) => <blockquote style={{borderLeft: '4px solid #e2e8f0', paddingLeft: '12px', color: '#64748b', fontStyle: 'italic', margin: '0 0 10px 0'}} {...props} />,
                      }}
                    >
                      {rulesContent}
                    </ReactMarkdown>
                    </DepthContext.Provider>
                  ) : (
                    <div style={{ color: '#94a3b8', fontSize: '0.85rem', fontStyle: 'italic' }}>
                      Escribe algo en el editor para verlo renderizado aquí...
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Contenido de Pestaña: Copias de Seguridad */}
      {activeTab === 'backups' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
          
          {/* Bloque Colapsable de Vista Previa de Commits */}
          <div style={{ 
            background: 'linear-gradient(135deg, #f8fafc, #eff6ff)', 
            borderRadius: '16px', 
            border: '1px solid #bfdbfe', 
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
            overflow: 'hidden',
            transition: 'all 0.3s ease'
          }}>
            {/* Cabecera del Colapsable */}
            <div
              onClick={() => setIsPreviewOpen(!isPreviewOpen)}
              style={{
                width: '100%',
                background: 'none',
                border: 'none',
                padding: '16px 24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer',
                textAlign: 'left',
                outline: 'none',
                userSelect: 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.4rem' }}>🤖</span>
                <div>
                  <strong style={{ color: '#1e3a8a', display: 'block', fontSize: '0.95rem' }}>
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
                    if (userEmail) loadChangesPreview(userEmail);
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
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => !(loadingPreview || isRunning) && (e.currentTarget.style.background = '#f1f5f9')}
                  onMouseLeave={e => !(loadingPreview || isRunning) && (e.currentTarget.style.background = 'white')}
                >
                  {loadingPreview ? '⏳ Analizando...' : '🔄 Recargar'}
                </button>
                <span style={{ 
                  fontSize: '0.8rem', 
                  color: '#1e3a8a', 
                  transform: isPreviewOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s',
                  display: 'inline-block'
                }}>
                  ▼
                </span>
              </div>
            </div>

            {/* Contenido del Colapsable */}
            {isPreviewOpen && (
              <div style={{ 
                padding: '0 24px 24px 24px', 
                borderTop: '1px solid #bfdbfe',
                background: 'white',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}>
                <div style={{ marginTop: '16px', background: '#f8fafc', borderRadius: '8px', padding: '16px', border: '1px solid #e2e8f0' }}>
                  <div style={{ marginBottom: '12px', textAlign: 'left' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Commit para Sincronización Simple:
                    </span>
                    <code style={{ 
                      background: '#f1f5f9', 
                      color: '#0f172a', 
                      padding: '8px 12px', 
                      borderRadius: '6px', 
                      display: 'block', 
                      fontSize: '0.85rem', 
                      fontFamily: 'monospace',
                      border: '1px solid #e2e8f0',
                      wordBreak: 'break-all'
                    }}>
                      {changesInfo ? changesInfo.commitMessage : 'Cargando mensaje...'}
                    </code>
                  </div>

                  <div style={{ textAlign: 'left' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Commit para Despliegue en Red (v{changesInfo?.nextVersion || '?.?.?'}):
                    </span>
                    <code style={{ 
                      background: '#f8fafc', 
                      color: '#4f46e5', 
                      padding: '8px 12px', 
                      borderRadius: '6px', 
                      display: 'block', 
                      fontSize: '0.85rem', 
                      fontFamily: 'monospace',
                      border: '1px solid #e2e8f0',
                      fontWeight: 'bold',
                      wordBreak: 'break-all'
                    }}>
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
                    <div style={{ 
                      background: '#f8fafc', 
                      border: '1px solid #e2e8f0', 
                      borderRadius: '8px', 
                      padding: '12px',
                      maxHeight: '150px',
                      overflowY: 'auto',
                      fontFamily: 'monospace',
                      fontSize: '0.78rem'
                    }}>
                      {changesInfo.added.map((f: string) => (
                        <div key={f} style={{ color: '#059669', marginBottom: '4px' }}>[NUEVO] {f}</div>
                      ))}
                      {changesInfo.modified.map((f: string) => (
                        <div key={f} style={{ color: '#2563eb', marginBottom: '4px' }}>[MODIFICADO] {f}</div>
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

          {/* Fila de Controles */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
            
            {/* Card 1: Copias de Seguridad Locales */}
            <div style={{ 
              background: 'white', 
              borderRadius: '16px', 
              padding: '24px', 
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '1.5rem' }}>💾</span>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#1e293b', fontWeight: 'bold' }}>Copias de Seguridad Locales</h3>
                </div>
                <p style={{ color: '#64748b', fontSize: '0.88rem', margin: '0 0 16px 0', lineHeight: '1.5' }}>
                  Descarga y respalda archivos físicos de la base de datos de Hostinger y el código fuente del proyecto.
                </p>
                
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  background: '#f8fafc',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  fontSize: '0.82rem',
                  marginBottom: '16px'
                }}>
                  <strong style={{ color: '#475569' }}>Ruta local:</strong>
                  <button 
                    onClick={handleOpenBackupsFolder}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#4f46e5',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      textDecoration: 'underline',
                      padding: 0
                    }}
                  >
                    📂 Abrir Carpeta
                  </button>
                </div>
              </div>

              {/* Sección A: MySQL */}
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '0.95rem', color: '#1e293b', fontWeight: 'bold' }}>📥 Volcado de Base de Datos (SQL)</h4>
                <p style={{ margin: '0 0 12px 0', color: '#64748b', fontSize: '0.8rem', lineHeight: '1.4' }}>
                  Exporta un archivo SQL de MySQL y lo guarda de forma física en el directorio de copias de seguridad.
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Último: {lastLocalBackup}</span>
                  <button 
                    onClick={handleLocalBackup}
                    disabled={isRunning}
                    style={{
                      padding: '8px 16px',
                      background: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 'bold',
                      cursor: isRunning ? 'not-allowed' : 'pointer',
                      opacity: isRunning ? 0.6 : 1,
                      transition: 'background 0.2s',
                      fontSize: '0.85rem'
                    }}
                    onMouseOver={e => !isRunning && (e.currentTarget.style.background = '#059669')}
                    onMouseOut={e => !isRunning && (e.currentTarget.style.background = '#10b981')}
                  >
                    Descargar SQL
                  </button>
                </div>
              </div>

              {/* Sección B: ZIP */}
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '0.95rem', color: '#1e293b', fontWeight: 'bold' }}>📦 Comprimir Código del Proyecto (ZIP)</h4>
                <p style={{ margin: '0 0 12px 0', color: '#64748b', fontSize: '0.8rem', lineHeight: '1.4' }}>
                  Genera una copia ZIP comprimida de todo el código de desarrollo del proyecto.
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Último: {lastProjectBackup}</span>
                  <button 
                    onClick={handleProjectBackup}
                    disabled={isRunning}
                    style={{
                      padding: '8px 16px',
                      background: '#f97316',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 'bold',
                      cursor: isRunning ? 'not-allowed' : 'pointer',
                      opacity: isRunning ? 0.6 : 1,
                      transition: 'background 0.2s',
                      fontSize: '0.85rem'
                    }}
                    onMouseOver={e => !isRunning && (e.currentTarget.style.background = '#ea580c')}
                    onMouseOut={e => !isRunning && (e.currentTarget.style.background = '#f97316')}
                  >
                    Respaldar ZIP
                  </button>
                </div>
              </div>
            </div>

            {/* Card 2: Sincronización y Publicación */}
            <div style={{ 
              background: 'white', 
              borderRadius: '16px', 
              padding: '24px', 
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '20px'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '1.5rem' }}>🚀</span>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#1e293b', fontWeight: 'bold' }}>Sincronización y Despliegue</h3>
                </div>
                <p style={{ color: '#64748b', fontSize: '0.88rem', margin: '0 0 16px 0', lineHeight: '1.5' }}>
                  Sincroniza tus cambios locales con el repositorio en la nube y publica las actualizaciones en la red.
                </p>

                {/* Switch de Despliegue */}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  background: 'linear-gradient(135deg, #eff6ff, #f5f3ff)',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  border: '1px solid #ddd6fe',
                  marginBottom: '16px'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#4f46e5' }}>
                      🌐 Desplegar en la Red (Firebase)
                    </span>
                    <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                      Compila la app y actualiza en producción
                    </span>
                  </div>
                  <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px' }}>
                    <input 
                      type="checkbox" 
                      checked={isDeployChecked}
                      onChange={(e) => setIsDeployChecked(e.target.checked)}
                      style={{ opacity: 0, width: 0, height: 0 }} 
                    />
                    <span style={{
                      position: 'absolute',
                      cursor: 'pointer',
                      top: 0, left: 0, right: 0, bottom: 0,
                      backgroundColor: isDeployChecked ? '#4f46e5' : '#cbd5e1',
                      transition: '.3s',
                      borderRadius: '24px'
                    }}>
                      <span style={{
                        position: 'absolute',
                        content: '""',
                        height: '18px', width: '18px',
                        left: isDeployChecked ? '22px' : '3px',
                        bottom: '3px',
                        backgroundColor: 'white',
                        transition: '.3s',
                        borderRadius: '50%',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.15)'
                      }} />
                    </span>
                  </label>
                </div>

                {/* Sub-Switch condicional: Copia Completa Previa (solo si se va a desplegar) */}
                {isDeployChecked && (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    background: '#f8fafc',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0',
                    marginBottom: '16px',
                    animation: 'fadeIn 0.2s'
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 'bold', color: '#1e293b' }}>
                        💾 Copia Completa Previa
                      </span>
                      <span style={{ fontSize: '0.68rem', color: '#64748b' }}>
                        Crea SQL y ZIP local antes de subir
                      </span>
                    </div>
                    <label style={{ position: 'relative', display: 'inline-block', width: '36px', height: '20px' }}>
                      <input 
                        type="checkbox" 
                        checked={includeFullBackup}
                        onChange={(e) => setIncludeFullBackup(e.target.checked)}
                        style={{ opacity: 0, width: 0, height: 0 }} 
                      />
                      <span style={{
                        position: 'absolute',
                        cursor: 'pointer',
                        top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: includeFullBackup ? '#8b5cf6' : '#cbd5e1',
                        transition: '.3s',
                        borderRadius: '20px'
                      }}>
                        <span style={{
                          position: 'absolute',
                          content: '""',
                          height: '14px', width: '14px',
                          left: includeFullBackup ? '19px' : '3px',
                          bottom: '3px',
                          backgroundColor: 'white',
                          transition: '.3s',
                          borderRadius: '50%',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.15)'
                        }} />
                      </span>
                    </label>
                  </div>
                )}
              </div>

              <div>
                <div style={{ 
                  fontSize: '0.8rem', 
                  color: '#475569', 
                  background: '#f8fafc', 
                  padding: '8px 12px', 
                  borderRadius: '8px', 
                  border: '1px solid #e2e8f0', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px',
                  fontWeight: 600,
                  marginBottom: '16px'
                }}>
                  <span>🕒</span>
                  <span><strong>Último:</strong> {isDeployChecked ? lastGitAndDeploy : lastGitOnly}</span>
                </div>

                <button 
                  onClick={isDeployChecked ? handleGitAndDeploy : handleGitOnly}
                  disabled={isRunning}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: isDeployChecked 
                      ? 'linear-gradient(135deg, #4f46e5, #8b5cf6)' 
                      : '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    cursor: isRunning ? 'not-allowed' : 'pointer',
                    opacity: isRunning ? 0.6 : 1,
                    transition: 'all 0.2s',
                    fontSize: '0.95rem',
                    boxShadow: isDeployChecked ? '0 4px 10px rgba(79, 70, 229, 0.2)' : 'none'
                  }}
                  onMouseOver={e => !isRunning && (e.currentTarget.style.background = isDeployChecked ? '' : '#2563eb')}
                  onMouseOut={e => !isRunning && (e.currentTarget.style.background = isDeployChecked ? '' : '#3b82f6')}
                >
                  {isDeployChecked 
                    ? `🌐 Subir y Desplegar a Producción` 
                    : `🚀 Sincronizar en GitHub (Push)`
                  }
                </button>
              </div>
            </div>
          </div>



          {/* Consola Interactiva */}
          <div style={{ 
            background: 'white', 
            borderRadius: '16px', 
            border: '1px solid #e2e8f0', 
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
            overflow: 'hidden'
          }}>
            {/* Cabecera de la Consola Colapsable */}
            <button
              onClick={() => setIsConsoleOpen(!isConsoleOpen)}
              style={{
                width: '100%',
                background: 'none',
                border: 'none',
                padding: '16px 24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer',
                textAlign: 'left',
                outline: 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.4rem' }}>🖥️</span>
                <div>
                  <strong style={{ color: '#1e293b', display: 'block', fontSize: '0.95rem' }}>
                    Registro de Comandos de Consola
                  </strong>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    {isRunning ? '⏳ Ejecutando procesos...' : '✓ Inactiva'}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {isRunning && (
                  <span style={{
                    fontSize: '0.75rem',
                    color: '#8b5cf6',
                    fontWeight: 600,
                    background: '#f5f3ff',
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    border: '1px solid #ddd6fe'
                  }}>
                    Trabajando
                  </span>
                )}
                <span style={{ 
                  fontSize: '0.8rem', 
                  color: '#64748b', 
                  transform: isConsoleOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s',
                  display: 'inline-block'
                }}>
                  ▼
                </span>
              </div>
            </button>

            {/* Contenido de la Consola */}
            {isConsoleOpen && (
              <div style={{ 
                padding: '24px', 
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Salida de comandos:
                  </span>
                  <button 
                    onClick={copyLogs}
                    style={{
                      background: '#f1f5f9',
                      color: '#475569',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      padding: '6px 12px',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={e => e.currentTarget.style.background = '#e2e8f0'}
                    onMouseOut={e => e.currentTarget.style.background = '#f1f5f9'}
                  >
                    📋 Copiar Logs
                  </button>
                </div>

                <div style={{
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
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)',
                  position: 'relative'
                }}>
                  {isRunning && (
                    <div style={{
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
                      color: '#94a3b8'
                    }}>
                      <span className="spinner-mini" style={{
                        display: 'inline-block',
                        width: '10px',
                        height: '10px',
                        border: '2px solid #94a3b8',
                        borderTop: '2px solid transparent',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }}></span>
                      <span>Ejecutando...</span>
                    </div>
                  )}
                  {logs}
                  <div ref={consoleEndRef} />
                </div>
              </div>
            )}

          </div>

        </div>
      )}
      {/* Inyección de CSS global — siempre montado, independiente de la pestaña activa */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Numeración automática de reglas usando contadores CSS */
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
