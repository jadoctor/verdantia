import React, { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { analisisApi, dashboards, getDashboardGroup, FRIENDLY_NAMES } from '../services/analisisApi';

export function useAnalisisDashboards() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [origin, setOrigin] = useState('http://localhost:3000');
  const [changesInfo, setChangesInfo] = useState<any>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  const [analysisData, setAnalysisData] = useState<Record<string, any>>({});
  const [loadingCode, setLoadingCode] = useState<Record<string, boolean>>({});
  const [loadingResponsive, setLoadingResponsive] = useState<Record<string, boolean>>({});
  const [expandedCode, setExpandedCode] = useState<Record<string, boolean>>({});
  const [expandedResponsive, setExpandedResponsive] = useState<Record<string, boolean>>({});
  const [completedDates, setCompletedDates] = useState<Record<string, { refactoredAt: string | null; responsiveAt: string | null }>>({});

  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [activeGroupFilter, setActiveGroupFilter] = useState<string>('all');
  const [isFiltering, setIsFiltering] = useState(false);
  const [restored, setRestored] = useState(false);
  const [focoFile, setFocoFile] = useState<string | null>(null);
  const [lastFocusedFile, setLastFocusedFile] = useState<string | null>(null);

  const [sortBy, setSortBy] = useState<'ruta' | 'acceso' | 'categoria' | 'lineas'>('lineas');
  const [sortDirection, setSortDirection] = useState<'desc' | 'asc'>('desc');
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

  const loadChangesPreview = async (email: string) => {
    setLoadingPreview(true);
    try {
      const data = await analisisApi.getChangesPreview(email);
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

  const loadAnalysis = async (file: string, type: 'code' | 'responsive', email: string) => {
    setAnalysisData(prev => ({ ...prev, [file]: null }));

    if (type === 'code') {
      setLoadingCode(prev => ({ ...prev, [file]: true }));
    } else {
      setLoadingResponsive(prev => ({ ...prev, [file]: true }));
    }

    try {
      const data = await analisisApi.runAnalysis(file, email);
      setAnalysisData(prev => ({ ...prev, [file]: data }));

      const isCodeClean = type === 'code' && data.plan && data.plan.every((p: string) => p.startsWith('✅'));
      const isResponsiveClean = type === 'responsive' && data.responsiveness && data.responsiveness.score === 100;

      const now = new Date();
      const formattedDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;

      setCompletedDates(prev => {
        const current = prev[file] || { refactoredAt: undefined, responsiveAt: undefined };
        return {
          ...prev,
          [file]: {
            refactoredAt: type === 'code' 
              ? (isCodeClean ? formattedDate : null) 
              : (current.refactoredAt !== undefined ? current.refactoredAt : null),
            responsiveAt: type === 'responsive' 
              ? (isResponsiveClean ? formattedDate : null) 
              : (current.responsiveAt !== undefined ? current.responsiveAt : null)
          }
        };
      });

      // Autocopia al portapapeles si hay pendientes/sugerencias
      if (type === 'code' && !isCodeClean) {
        const matched = dashboards.find(d => d.file === file);
        const path = matched ? matched.path : '';
        const cmd = `Antigravity, ejecuta el plan de refactorización del archivo src/app/dashboard/${file}. Analiza el código, extrae los custom hooks necesarios, los componentes reutilizables y los servicios de API. Hazlo de forma segura, paso a paso, sin romper la funcionalidad existente del dashboard en ${path}. Al finalizar tu faena de refactorización, cuenta las líneas resultantes de src/app/dashboard/${file} y actualiza su entrada en el array dashboards en src/app/dashboard/admin/mantenimiento/analisis/page.tsx y la tabla de líneas del Análisis de Código de src/app/dashboard/admin/mantenimiento/page.tsx con el nuevo número de líneas y la fecha de hoy en refactoredAt para que se muestre actualizado al instante.`;
        navigator.clipboard.writeText(cmd)
          .then(() => console.log('📋 Comando de refactorización para Antigravity copiado al portapapeles.'))
          .catch(err => console.error('Error copying automatically:', err));
      } else if (type === 'responsive' && !isResponsiveClean && data.responsiveness?.improvementsForAgent) {
        const cmd = `${data.responsiveness.improvementsForAgent}\n\nAl finalizar tu faena de optimización responsiva, cuenta las líneas resultantes de src/app/dashboard/${file} y actualiza su entrada en el array dashboards en src/app/dashboard/admin/mantenimiento/analisis/page.tsx y la tabla de líneas del Análisis de Código de src/app/dashboard/admin/mantenimiento/page.tsx con el nuevo número de líneas y la fecha de hoy en responsiveAt para que se muestre actualizado al instante.`;
        navigator.clipboard.writeText(cmd)
          .then(() => console.log('📋 Instrucciones de responsividad para Antigravity copiadas al portapapeles.'))
          .catch(err => console.error('Error copying automatically:', err));
      }
    } catch (err) {
      console.error('Error running analysis:', err);
    } finally {
      if (type === 'code') {
        setLoadingCode(prev => ({ ...prev, [file]: false }));
      } else {
        setLoadingResponsive(prev => ({ ...prev, [file]: false }));
      }
    }
  };

  const handleTriggerAnalysis = async (file: string, type: 'code' | 'responsive') => {
    if (!userEmail) return;
    setLastFocusedFile(file);

    if (type === 'code') {
      setExpandedCode(prev => ({ ...prev, [file]: true }));
      setExpandedResponsive(prev => ({ ...prev, [file]: false }));
      loadAnalysis(file, 'code', userEmail);
    } else {
      setExpandedResponsive(prev => ({ ...prev, [file]: true }));
      setExpandedCode(prev => ({ ...prev, [file]: false }));
      loadAnalysis(file, 'responsive', userEmail);
    }
  };

  const saveAndNavigate = (path: string, file: string) => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('analisis_scroll', window.scrollY.toString());
      sessionStorage.setItem('analisis_filter', activeFilter);
      sessionStorage.setItem('analisis_group_filter', activeGroupFilter);
      sessionStorage.setItem('analisis_expanded_code', JSON.stringify(expandedCode));
      sessionStorage.setItem('analisis_expanded_responsive', JSON.stringify(expandedResponsive));
      sessionStorage.setItem('analisis_sort_by', sortBy);
      sessionStorage.setItem('analisis_sort_direction', sortDirection);
      sessionStorage.setItem('analisis_foco_file', file);
    }
    const separator = path.includes('?') ? '&' : '?';
    window.location.href = `${path}${separator}from=analisis`;
  };

  // Efecto para restaurar el estado desde sessionStorage al montar
  useEffect(() => {
    if (typeof window === 'undefined' || restored) return;

    const queryParams = new URLSearchParams(window.location.search);
    const shouldClean = queryParams.get('clean') === 'true';

    if (shouldClean) {
      sessionStorage.removeItem('analisis_filter');
      sessionStorage.removeItem('analisis_group_filter');
      sessionStorage.removeItem('analisis_expanded_code');
      sessionStorage.removeItem('analisis_expanded_responsive');
      sessionStorage.removeItem('analisis_scroll');
      sessionStorage.removeItem('analisis_foco_file');
      
      setActiveFilter('all');
      setActiveGroupFilter('all');
      setRestored(true);
      
      // Clean query parameter from address bar
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, '', cleanUrl);
      return;
    }

    const savedFilter = sessionStorage.getItem('analisis_filter');
    const savedGroupFilter = sessionStorage.getItem('analisis_group_filter');
    const savedExpandedCode = sessionStorage.getItem('analisis_expanded_code');
    const savedExpandedResponsive = sessionStorage.getItem('analisis_expanded_responsive');
    const savedScroll = sessionStorage.getItem('analisis_scroll');
    const savedFocoFile = sessionStorage.getItem('analisis_foco_file');
    const savedSortBy = sessionStorage.getItem('analisis_sort_by');
    const savedSortDirection = sessionStorage.getItem('analisis_sort_direction');
    const savedCompletedDates = localStorage.getItem('analisis_completed_dates');

    if (savedFilter) setActiveFilter(savedFilter);
    if (savedGroupFilter) setActiveGroupFilter(savedGroupFilter);
    if (savedFocoFile) setLastFocusedFile(savedFocoFile);
    if (savedSortBy) setSortBy(savedSortBy as any);
    if (savedSortDirection) setSortDirection(savedSortDirection as any);

    if (savedCompletedDates) {
      try {
        setCompletedDates(JSON.parse(savedCompletedDates));
      } catch (e) {
        console.error('Error parsing completed dates:', e);
      }
    }

    // Se cierran los desplegables al entrar o actualizar (se comenta la restauración de expandidos)
    /*
    if (savedExpandedCode) {
      try {
        setExpandedCode(JSON.parse(savedExpandedCode));
      } catch (e) {
        console.error(e);
      }
    }
    if (savedExpandedResponsive) {
      try {
        setExpandedResponsive(JSON.parse(savedExpandedResponsive));
      } catch (e) {
        console.error(e);
      }
    }
    */

    setRestored(true);

    if (savedScroll || savedFocoFile) {
      setTimeout(() => {
        if (savedFocoFile) {
          setFocoFile(savedFocoFile);
          const rowElement = document.getElementById(`row-${savedFocoFile.replace(/\//g, '-')}`);
          if (rowElement) {
            rowElement.scrollIntoView({ block: 'center', behavior: 'smooth' });
            const viewBtn = rowElement.querySelector('.ver-link') as HTMLElement;
            if (viewBtn) {
              viewBtn.focus();
            }
          }
          setTimeout(() => {
            setFocoFile(null);
          }, 3000);
        } else if (savedScroll) {
          window.scrollTo({ top: parseInt(savedScroll, 10), behavior: 'smooth' });
        }

        // Limpiar solo los valores temporales de posicionamiento
        sessionStorage.removeItem('analisis_scroll');
        sessionStorage.removeItem('analisis_foco_file');
      }, 350);
    }
  }, [restored]);

  // Guardar estado en sessionStorage automáticamente cuando cambie
  useEffect(() => {
    if (typeof window === 'undefined' || !restored) return;
    sessionStorage.setItem('analisis_filter', activeFilter);
    sessionStorage.setItem('analisis_group_filter', activeGroupFilter);
    sessionStorage.setItem('analisis_expanded_code', JSON.stringify(expandedCode));
    sessionStorage.setItem('analisis_expanded_responsive', JSON.stringify(expandedResponsive));
    sessionStorage.setItem('analisis_sort_by', sortBy);
    sessionStorage.setItem('analisis_sort_direction', sortDirection);
    if (lastFocusedFile) {
      sessionStorage.setItem('analisis_foco_file', lastFocusedFile);
    }
  }, [restored, activeFilter, activeGroupFilter, expandedCode, expandedResponsive, sortBy, sortDirection, lastFocusedFile]);

  // Guardar completedDates en localStorage automáticamente cuando cambie
  useEffect(() => {
    if (typeof window !== 'undefined' && restored) {
      localStorage.setItem('analisis_completed_dates', JSON.stringify(completedDates));
    }
  }, [completedDates, restored]);

  // Cargar análisis para las filas que fueron restauradas como expandidas
  useEffect(() => {
    if (!userEmail || !restored) return;

    Object.entries(expandedCode).forEach(([file, isExp]) => {
      if (isExp && !analysisData[file] && !loadingCode[file]) {
        loadAnalysis(file, 'code', userEmail);
      }
    });

    Object.entries(expandedResponsive).forEach(([file, isExp]) => {
      if (isExp && !analysisData[file] && !loadingResponsive[file]) {
        loadAnalysis(file, 'responsive', userEmail);
      }
    });
  }, [userEmail, restored, expandedCode, expandedResponsive, analysisData, loadingCode, loadingResponsive]);

  const handleSort = (field: 'ruta' | 'acceso' | 'categoria' | 'lineas') => {
    if (sortBy === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection(field === 'lineas' || field === 'categoria' ? 'desc' : 'asc');
    }
  };


  const handleSelectGroup = (groupId: string) => {
    if (activeGroupFilter === groupId) return;
    setIsFiltering(true);
    setTimeout(() => {
      setActiveGroupFilter(groupId);
      setIsFiltering(false);
    }, 350);
  };

  const handleSelectFilter = (filterId: string) => {
    if (activeFilter === filterId) {
      if (filterId === 'all') {
        setActiveGroupFilter('all');
      }
      return;
    }
    setIsFiltering(true);
    setTimeout(() => {
      setActiveFilter(filterId);
      if (filterId === 'all') {
        setActiveGroupFilter('all');
      }
      setIsFiltering(false);
    }, 350);
  };

  const handleReloadAndSaveState = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('analisis_scroll', window.scrollY.toString());
      sessionStorage.setItem('analisis_filter', activeFilter);
      sessionStorage.setItem('analisis_group_filter', activeGroupFilter);
      sessionStorage.setItem('analisis_expanded_code', JSON.stringify(expandedCode));
      sessionStorage.setItem('analisis_expanded_responsive', JSON.stringify(expandedResponsive));
      sessionStorage.setItem('analisis_sort_by', sortBy);
      sessionStorage.setItem('analisis_sort_direction', sortDirection);
      if (lastFocusedFile) {
        sessionStorage.setItem('analisis_foco_file', lastFocusedFile);
      }
      window.location.reload();
    }
  };

  const maxLines = Math.max(...dashboards.map(d => d.lines));
  const totalLines = dashboards.reduce((sum, d) => sum + d.lines, 0);

  const filteredDashboards = dashboards.filter(d => {
    const effectiveRefactoredAt = (restored && completedDates[d.file] && completedDates[d.file].refactoredAt) || d.refactoredAt;
    const effectiveResponsiveAt = (restored && completedDates[d.file] && completedDates[d.file].responsiveAt) || d.responsiveAt;

    // 1. Filtrar por tipo (activeFilter)
    if (activeFilter === 'superadmin' && !d.path.startsWith('/dashboard/admin/')) return false;
    if (activeFilter === 'general' && d.path.startsWith('/dashboard/admin/')) return false;
    if (activeFilter === 'monolito' && d.lines <= 1000) return false;
    if (activeFilter === 'complejo' && (d.lines <= 500 || d.lines > 1000)) return false;
    if (activeFilter === 'estandar' && (d.lines <= 200 || d.lines > 500)) return false;
    if (activeFilter === 'ligero_stub' && d.lines > 200) return false;
    if (activeFilter === 'revisado_si' && !effectiveRefactoredAt) return false;
    if (activeFilter === 'revisado_no' && effectiveRefactoredAt) return false;
    if (activeFilter === 'responsive_si' && !effectiveResponsiveAt) return false;
    if (activeFilter === 'responsive_no' && effectiveResponsiveAt) return false;

    // 2. Filtrar por grupo (activeGroupFilter)
    if (activeGroupFilter !== 'all') {
      const group = getDashboardGroup(d.path);
      if (group !== activeGroupFilter) return false;
    }

    return true;
  });

  const sortedDashboards = [...filteredDashboards].sort((a, b) => {
    let valA: any;
    let valB: any;

    if (sortBy === 'ruta') {
      valA = FRIENDLY_NAMES[a.path] || a.path;
      valB = FRIENDLY_NAMES[b.path] || b.path;
    } else if (sortBy === 'acceso') {
      valA = a.path.startsWith('/dashboard/admin/') ? 1 : 0;
      valB = b.path.startsWith('/dashboard/admin/') ? 1 : 0;
    } else if (sortBy === 'categoria') {
      valA = a.lines;
      valB = b.lines;
    } else { // lineas
      valA = a.lines;
      valB = b.lines;
    }

    if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
    if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  return {
    userEmail,
    origin,
    isMobile,
    changesInfo,
    loadingPreview,
    analysisData,
    loadingCode,
    loadingResponsive,
    expandedCode,
    expandedResponsive,
    completedDates,
    activeFilter,
    activeGroupFilter,
    isFiltering,
    restored,
    focoFile,
    lastFocusedFile,
    setLastFocusedFile,
    sortBy,
    sortDirection,
    maxLines,
    totalLines,
    sortedDashboards,
    handleSort,
    handleSelectGroup,
    handleSelectFilter,
    handleReloadAndSaveState,
    handleTriggerAnalysis,
    saveAndNavigate
  };
}
