import { useState, useEffect, useRef } from 'react';
import { auth } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { mantenimientoApi } from '../services/mantenimientoApi';

export function useMantenimiento() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [origin, setOrigin] = useState('http://localhost:3000');
  const [logs, setLogs] = useState<string>('🖥️ Consola de comandos inactiva. Elige una acción de copia de seguridad para comenzar.');
  const [isRunning, setIsRunning] = useState(false);
  const [status, setStatus] = useState<'success' | 'error' | 'idle'>('idle');
  const [changesInfo, setChangesInfo] = useState<any>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  const consoleEndRef = useRef<HTMLDivElement>(null);

  const [lastActionLocalCopy, setLastActionLocalCopy] = useState<string>('Nunca');
  const [lastActionOneDrive, setLastActionOneDrive] = useState<string>('Nunca');
  const [lastActionGit, setLastActionGit] = useState<string>('Nunca');
  const [lastActionFirebase, setLastActionFirebase] = useState<string>('Nunca');
  
  const [optLocalCopy, setOptLocalCopy] = useState<boolean>(false);
  const [optGit, setOptGit] = useState<boolean>(false);
  const [optFirebase, setOptFirebase] = useState<boolean>(false);
  const [optOneDrive, setOptOneDrive] = useState<boolean>(false);

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
      const checkResize = () => setIsMobile(window.innerWidth <= 768);
      checkResize();
      window.addEventListener('resize', checkResize);
      return () => window.removeEventListener('resize', checkResize);
    }
  }, []);

  useEffect(() => {
    setLastActionLocalCopy(localStorage.getItem('last_action_local') || 'Nunca');
    setLastActionOneDrive(localStorage.getItem('last_action_onedrive') || 'Nunca');
    setLastActionGit(localStorage.getItem('last_action_git') || 'Nunca');
    setLastActionFirebase(localStorage.getItem('last_action_firebase') || 'Nunca');

    // Restaurar posición al volver desde un dashboard
    if (typeof window !== 'undefined') {
      const savedScroll = sessionStorage.getItem('mantenimiento_scroll');
      if (savedScroll) {
        setTimeout(() => {
          window.scrollTo(0, parseInt(savedScroll, 10));
          sessionStorage.removeItem('mantenimiento_scroll');
        }, 80);
      }
    }
  }, []);

  useEffect(() => {
    if (isRunning) {
      setIsConsoleOpen(true);
    }
  }, [isRunning]);

  const loadChangesPreview = async (email: string) => {
    setLoadingPreview(true);
    try {
      const data = await mantenimientoApi.getChangesPreview(email);
      setChangesInfo(data);
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
    if (optGit && optFirebase) {
      tasks.push('ejecutar npm run build localmente para validar');
      tasks.push('guardar los cambios locales y subirlos al repositorio remoto de GitHub (solo commit y push)');
      tasks.push('desplegar en Firebase (producción)');
    } else if (optGit) {
      tasks.push('ejecutar npm run build localmente para validar');
      tasks.push('guardar los cambios locales y subirlos al repositorio remoto de GitHub (solo commit y push, NO desplegar a producción)');
    } else if (optFirebase) {
      tasks.push('ejecutar npm run build localmente para validar');
      tasks.push('desplegar en Firebase (producción)');
    }

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
  }, [optLocalCopy, optOneDrive, optGit, optFirebase]);

  const handleSelectAll = () => {
    const allSelected = optLocalCopy && optOneDrive && optGit && optFirebase;
    const dateStr = new Date().toLocaleString('es-ES');
    setOptLocalCopy(!allSelected);
    if (!allSelected) { localStorage.setItem('last_action_local', dateStr); setLastActionLocalCopy(dateStr); }
    setOptOneDrive(!allSelected);
    if (!allSelected) { localStorage.setItem('last_action_onedrive', dateStr); setLastActionOneDrive(dateStr); }
    setOptGit(!allSelected);
    if (!allSelected) { localStorage.setItem('last_action_git', dateStr); setLastActionGit(dateStr); }
    setOptFirebase(!allSelected);
    if (!allSelected) { localStorage.setItem('last_action_firebase', dateStr); setLastActionFirebase(dateStr); }
  };

  const handleOpenBackupsFolder = async () => {
    if (!userEmail) return;
    try {
      await mantenimientoApi.openBackupsFolder(userEmail);
    } catch (err) {
      console.error("No se pudo abrir la carpeta", err);
    }
  };

  const handleOpenOneDriveFolder = async () => {
    if (!userEmail) return;
    try {
      await mantenimientoApi.openOneDriveFolder(userEmail);
    } catch (err) {
      console.error("No se pudo abrir la carpeta OneDrive", err);
    }
  };

  const copyLogs = () => {
    navigator.clipboard.writeText(logs);
    alert('¡Logs copiados al portapapeles!');
  };

  const saveAndNavigate = (path: string) => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('mantenimiento_scroll', window.scrollY.toString());
    }
    const separator = path.includes('?') ? '&' : '?';
    window.location.href = `${path}${separator}from=mantenimiento`;
  };

  return {
    userEmail,
    origin,
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
    saveAndNavigate,
    isMobile
  };
}
