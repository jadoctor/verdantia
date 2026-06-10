'use client';

import React, { useState, useEffect, useRef } from 'react';
import { auth } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import ReactMarkdown from 'react-markdown';

// FORZAR RECARGA INMEDIATA AL HOT-SWAP (Regla 4)
if (typeof window !== 'undefined') {
  if (!window.sessionStorage.getItem('__did_reload_v20')) {
    window.sessionStorage.setItem('__did_reload_v20', 'true');
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

  const [lastAction, setLastAction] = useState<string>('Nunca');
  const [optLocalCopy, setOptLocalCopy] = useState<boolean>(false);
  const [optGit, setOptGit] = useState<boolean>(false);
  const [optFirebase, setOptFirebase] = useState<boolean>(false);
  const [optOneDrive, setOptOneDrive] = useState<boolean>(false);

  // Estados para las Normas de Funcionamiento
  const [rulesContent, setRulesContent] = useState<string>('');
  const [originalRulesContent, setOriginalRulesContent] = useState<string>('');
  const [loadingRules, setLoadingRules] = useState<boolean>(false);
  const [savingRules, setSavingRules] = useState<boolean>(false);
  const [rulesStatus, setRulesStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [rulesError, setRulesError] = useState<string | null>(null);

  useEffect(() => {
    setLastAction(localStorage.getItem('last_action_time') || 'Nunca');
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

  useEffect(() => {
    if (!optLocalCopy && !optOneDrive && !optGit && !optFirebase) {
      setLogs('🖥️ Consola de comandos inactiva. Elige una acción de copia de seguridad para comenzar.');
      return;
    }

    const tasks = [];
    if (optLocalCopy) tasks.push('volcado de la base de datos local (SQL) y comprimir el código del proyecto local (ZIP) guardándolos en una carpeta con la fecha y hora dentro de C:\\\\Users\\\\jaill\\\\Documents\\\\VERDANTIA COPIAS SEGURIDAD');
    if (optOneDrive) tasks.push('respaldar en la nube (crear carpeta con fecha en C:\\Users\\Public\\OneDrive\\PROYECTOS\\VERDANTIA y copiar allí el SQL y el ZIP)');
    if (optGit) tasks.push('guardar los cambios locales y subirlos al repositorio remoto de GitHub (solo hacer commit y push, NO desplegar a producción)');
    if (optFirebase) tasks.push('desplegar en Firebase (producción)');

    const tasksStr = tasks.join(', ').replace(/, ([^,]*)$/, ' y $1');
    const isDeploy = optFirebase;
    const comandoPrefix = isDeploy ? "Antigravity, SUBE A PRODUCCION: realiza las siguientes tareas: " : "Antigravity, realiza las siguientes tareas: ";
    const comando = `${comandoPrefix}${tasksStr}.`;

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(comando);
      }
    } catch (err) {
      console.warn("Clipboard API no disponible", err);
    }
    setLogs(`> 🤖 MODO IA ACTIVADO\n\nSe ha generado el comando (cópialo manualmente si no se ha copiado al portapapeles):\n\n"${comando}"\n\n👉 Pega este comando en el chat de Antigravity para que yo ejecute todo el proceso de forma autónoma.`);
    setIsConsoleOpen(true);
    setStatus('idle');

    const dateStr = new Date().toLocaleString('es-ES');
    localStorage.setItem('last_action_time', dateStr);
    setLastAction(dateStr);
  }, [optLocalCopy, optOneDrive, optGit, optFirebase]);

  const handleSelectAll = () => {
    const allSelected = optLocalCopy && optOneDrive && optGit && optFirebase;
    setOptLocalCopy(!allSelected);
    setOptOneDrive(!allSelected);
    setOptGit(!allSelected);
    setOptFirebase(!allSelected);
  };

  const handleOpenBackupsFolder = async () => {
    try {
      await fetch('/api/admin/mantenimiento/backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': userEmail || '',
        },
        body: JSON.stringify({ action: 'open_backups_folder' }),
      });
    } catch (err) {
      console.error("No se pudo abrir la carpeta", err);
    }
  };

  const handleOpenOneDriveFolder = async () => {
    try {
      await fetch('/api/admin/mantenimiento/backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': userEmail || '',
        },
        body: JSON.stringify({ action: 'open_onedrive_folder' }),
      });
    } catch (err) {
      console.error("No se pudo abrir la carpeta OneDrive", err);
    }
  };

  // Funciones obsoletas eliminadas

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

          {/* Fila de Controles Unificada */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
            
            {/* Panel Centralizado: Tareas Autónomas */}
            <div style={{ 
              background: 'white', 
              borderRadius: '16px', 
              padding: '28px', 
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px'
            }}>
              {/* Cabecera del Panel */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '1.8rem' }}>🚀</span>
                    <h3 style={{ margin: 0, fontSize: '1.3rem', color: '#1e293b', fontWeight: 'bold' }}>Sincronización, Copia y Despliegue</h3>
                  </div>
                  <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0, lineHeight: '1.5' }}>
                    Selecciona las acciones que deseas delegar a Antigravity. El sistema generará la orden inteligente lista para ejecutar.
                  </p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {/* Botones movidos a los puntos respectivos */}
                  </div>
                  
                  <button 
                    onClick={handleSelectAll}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: (optLocalCopy && optOneDrive && optGit && optFirebase) ? '#64748b' : '#3b82f6',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '0.8rem',
                      textDecoration: 'underline',
                      padding: 0
                    }}
                  >
                    {(optLocalCopy && optOneDrive && optGit && optFirebase) ? '❌ Desmarcar Todas' : '✅ Seleccionar Todas'}
                  </button>
                </div>
              </div>

              {/* Lista de Interruptores (Switches) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                
                {/* 1. Copia Local (SQL y ZIP) */}
                <div style={{ 
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: optLocalCopy ? '#f0fdf4' : '#f8fafc',
                  padding: '16px 20px', borderRadius: '12px', border: optLocalCopy ? '1px solid #bbf7d0' : '1px solid #e2e8f0',
                  transition: 'all 0.3s'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span style={{ fontSize: '0.95rem', fontWeight: 'bold', color: optLocalCopy ? '#166534' : '#334155' }}>
                      💾 1. Copia Local (SQL y ZIP)
                    </span>
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Extrae los datos en un archivo .sql y comprime el proyecto en un .zip.</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                      <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', background: '#e2e8f0', padding: '2px 6px', borderRadius: '4px', color: '#475569' }}>
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
                          boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                        }}
                        onMouseOver={e => e.currentTarget.style.background = '#e2e8f0'}
                        onMouseOut={e => e.currentTarget.style.background = '#f1f5f9'}
                      >
                        📂 Abrir Carpeta
                      </button>
                    </div>
                  </div>
                  <label style={{ position: 'relative', display: 'inline-block', width: '50px', height: '28px' }}>
                    <input type="checkbox" checked={optLocalCopy} onChange={e => setOptLocalCopy(e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
                    <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: optLocalCopy ? '#22c55e' : '#cbd5e1', transition: '.3s', borderRadius: '28px' }}>
                      <span style={{ position: 'absolute', content: '""', height: '20px', width: '20px', left: optLocalCopy ? '26px' : '4px', bottom: '4px', backgroundColor: 'white', transition: '.3s', borderRadius: '50%', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
                    </span>
                  </label>
                </div>

                {/* 2. OneDrive */}
                <div style={{ 
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: optOneDrive ? '#fdf4ff' : '#f8fafc',
                  padding: '16px 20px', borderRadius: '12px', border: optOneDrive ? '1px solid #f5d0fe' : '1px solid #e2e8f0',
                  transition: 'all 0.3s'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span style={{ fontSize: '0.95rem', fontWeight: 'bold', color: optOneDrive ? '#86198f' : '#334155' }}>
                      ☁️ 2. Copia en la nube (SQL y zip)
                    </span>
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Copia el SQL y ZIP a OneDrive en una carpeta con fecha.</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                      <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', background: '#e2e8f0', padding: '2px 6px', borderRadius: '4px', color: '#475569' }}>
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
                          boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                        }}
                        onMouseOver={e => e.currentTarget.style.background = '#fae8ff'}
                        onMouseOut={e => e.currentTarget.style.background = '#fdf4ff'}
                      >
                        📂 Abrir Carpeta
                      </button>
                    </div>
                  </div>
                  <label style={{ position: 'relative', display: 'inline-block', width: '50px', height: '28px' }}>
                    <input type="checkbox" checked={optOneDrive} onChange={e => setOptOneDrive(e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
                    <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: optOneDrive ? '#d946ef' : '#cbd5e1', transition: '.3s', borderRadius: '28px' }}>
                      <span style={{ position: 'absolute', content: '""', height: '20px', width: '20px', left: optOneDrive ? '26px' : '4px', bottom: '4px', backgroundColor: 'white', transition: '.3s', borderRadius: '50%', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
                    </span>
                  </label>
                </div>

                {/* 4. GitHub */}
                <div style={{ 
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: optGit ? '#eff6ff' : '#f8fafc',
                  padding: '16px 20px', borderRadius: '12px', border: optGit ? '1px solid #bfdbfe' : '1px solid #e2e8f0',
                  transition: 'all 0.3s'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '0.95rem', fontWeight: 'bold', color: optGit ? '#1e40af' : '#334155' }}>
                      🐙 3. Guardar en GitHub (Commit & Push)
                    </span>
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Sella los cambios locales y los sube al repositorio remoto sin desplegar a producción.</span>
                  </div>
                  <label style={{ position: 'relative', display: 'inline-block', width: '50px', height: '28px' }}>
                    <input type="checkbox" checked={optGit} onChange={e => setOptGit(e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
                    <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: optGit ? '#3b82f6' : '#cbd5e1', transition: '.3s', borderRadius: '28px' }}>
                      <span style={{ position: 'absolute', content: '""', height: '20px', width: '20px', left: optGit ? '26px' : '4px', bottom: '4px', backgroundColor: 'white', transition: '.3s', borderRadius: '50%', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
                    </span>
                  </label>
                </div>

                {/* 5. Firebase */}
                <div style={{ 
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: optFirebase ? '#faf5ff' : '#f8fafc',
                  padding: '16px 20px', borderRadius: '12px', border: optFirebase ? '1px solid #e9d5ff' : '1px solid #e2e8f0',
                  transition: 'all 0.3s'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '0.95rem', fontWeight: 'bold', color: optFirebase ? '#6b21a8' : '#334155' }}>
                      🔥 4. Desplegar en Firebase (Producción)
                    </span>
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Compila la app y la despliega públicamente en la red.</span>
                  </div>
                  <label style={{ position: 'relative', display: 'inline-block', width: '50px', height: '28px' }}>
                    <input type="checkbox" checked={optFirebase} onChange={e => setOptFirebase(e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
                    <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: optFirebase ? '#8b5cf6' : '#cbd5e1', transition: '.3s', borderRadius: '28px' }}>
                      <span style={{ position: 'absolute', content: '""', height: '20px', width: '20px', left: optFirebase ? '26px' : '4px', bottom: '4px', backgroundColor: 'white', transition: '.3s', borderRadius: '50%', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
                    </span>
                  </label>
                </div>

              </div>

              {/* Información de Última Acción */}
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
                <div style={{ 
                  fontSize: '0.85rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' 
                }}>
                  <span>🕒</span>
                  <span><strong>Última ejecución:</strong> {lastAction}</span>
                </div>
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
