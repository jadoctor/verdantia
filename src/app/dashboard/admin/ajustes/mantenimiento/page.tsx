'use client';

import React, { useState, useEffect, useRef } from 'react';
import { auth } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';

export default function MantenimientoPage() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'backups' | 'diagnostico'>('backups');
  const [logs, setLogs] = useState<string>('🖥️ Consola de comandos inactiva. Elige una acción de copia de seguridad para comenzar.');
  const [isRunning, setIsRunning] = useState(false);
  const [status, setStatus] = useState<'success' | 'error' | 'idle'>('idle');
  const [changesInfo, setChangesInfo] = useState<any>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  const consoleEndRef = useRef<HTMLDivElement>(null);

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

      setLogs(prev => prev + '\n✅ [Copia Local Exitosa] Archivo SQL descargado en tu navegador.');
      setStatus('success');
    } catch (err: any) {
      setLogs(prev => prev + `\n❌ Error al generar la copia local: ${err.message}`);
      setStatus('error');
    } finally {
      setIsRunning(false);
    }
  };

  const handleGitOnly = async () => {
    if (!userEmail || isRunning) return;
    setIsRunning(true);
    setStatus('idle');
    setLogs('> Iniciando subida a GitHub (solo repositorio)...');

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
      setLogs(data.log || data.error || 'Ocurrió un error inesperado');
      if (res.ok && data.success) {
        setStatus('success');
        if (userEmail) loadChangesPreview(userEmail);
      } else {
        setStatus('error');
      }
    } catch (err: any) {
      setLogs(prev => prev + `\n❌ Error de conexión: ${err.message}`);
      setStatus('error');
    } finally {
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

    try {
      const res = await fetch('/api/admin/mantenimiento/backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': userEmail,
        },
        body: JSON.stringify({ 
          action: 'git_and_deploy'
        }),
      });

      const data = await res.json();
      setLogs(data.log || data.error || 'Ocurrió un error inesperado');
      if (res.ok && data.success) {
        setStatus('success');
        if (userEmail) loadChangesPreview(userEmail);
      } else {
        setStatus('error');
      }
    } catch (err: any) {
      setLogs(prev => prev + `\n❌ Error de conexión: ${err.message}`);
      setStatus('error');
    } finally {
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
            <button
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
                outline: 'none'
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
            </button>

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
                    ✓ No hay cambios locales pendientes de commit (directorio limpio).
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Fila de Controles */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            
            {/* Opción 1: Copia Local */}
            <div style={{ 
              background: 'white', 
              borderRadius: '16px', 
              padding: '24px', 
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '1.5rem' }}>📥</span>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b', fontWeight: 'bold' }}>Copia Local (SQL)</h3>
                </div>
                <p style={{ color: '#64748b', fontSize: '0.88rem', lineHeight: '1.5', margin: '0 0 20px' }}>
                  Exporta y descarga de forma inmediata un volcado SQL completo con todas las tablas, esquemas e inserciones de datos desde el servidor Hostinger.
                </p>
              </div>
              <button 
                onClick={handleLocalBackup}
                disabled={isRunning}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  cursor: isRunning ? 'not-allowed' : 'pointer',
                  opacity: isRunning ? 0.6 : 1,
                  transition: 'background 0.2s',
                  fontSize: '0.9rem'
                }}
                onMouseOver={e => !isRunning && (e.currentTarget.style.background = '#059669')}
                onMouseOut={e => !isRunning && (e.currentTarget.style.background = '#10b981')}
              >
                📥 Descargar Backup SQL
              </button>
            </div>

            {/* Opción 2: Subida GitHub */}
            <div style={{ 
              background: 'white', 
              borderRadius: '16px', 
              padding: '24px', 
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '1.5rem' }}>🚀</span>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b', fontWeight: 'bold' }}>Subir a GitHub (Solo Repo)</h3>
                </div>
                <p style={{ color: '#64748b', fontSize: '0.88rem', lineHeight: '1.5', margin: '0 0 20px' }}>
                  Agrega y confirma los cambios locales en el código (commit) y los sube a GitHub mediante push. No realiza el despliegue del sitio en producción.
                </p>
              </div>
              <button 
                onClick={handleGitOnly}
                disabled={isRunning}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  cursor: isRunning ? 'not-allowed' : 'pointer',
                  opacity: isRunning ? 0.6 : 1,
                  transition: 'background 0.2s',
                  fontSize: '0.9rem'
                }}
                onMouseOver={e => !isRunning && (e.currentTarget.style.background = '#2563eb')}
                onMouseOut={e => !isRunning && (e.currentTarget.style.background = '#3b82f6')}
              >
                🚀 Subir a GitHub (Push)
              </button>
            </div>

            {/* Opción 3: GitHub + Despliegue */}
            <div style={{ 
              background: 'white', 
              borderRadius: '16px', 
              padding: '24px', 
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '1.5rem' }}>🌐</span>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b', fontWeight: 'bold' }}>GitHub + Subida a la Red</h3>
                </div>
                <p style={{ color: '#64748b', fontSize: '0.88rem', lineHeight: '1.5', margin: '0 0 20px' }}>
                  Actualiza el estampado de versión de la aplicación, realiza el push a GitHub y publica el nuevo build de producción directamente en la red (Firebase).
                </p>
              </div>
              <button 
                onClick={handleGitAndDeploy}
                disabled={isRunning}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#8b5cf6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  cursor: isRunning ? 'not-allowed' : 'pointer',
                  opacity: isRunning ? 0.6 : 1,
                  transition: 'background 0.2s',
                  fontSize: '0.9rem'
                }}
                onMouseOver={e => !isRunning && (e.currentTarget.style.background = '#7c3aed')}
                onMouseOut={e => !isRunning && (e.currentTarget.style.background = '#8b5cf6')}
              >
                🌐 Subir y Desplegar a Red
              </button>
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

            {/* Inyección de CSS para la animación del spinner */}
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </div>

        </div>
      )}
    </div>
  );
}
