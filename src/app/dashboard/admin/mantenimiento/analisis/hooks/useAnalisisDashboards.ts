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
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [completedDates, setCompletedDates] = useState<Record<string, { refactoredAt: string | null; responsiveAt: string | null; premiumAt: string | null }>>({});

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

  const loadAnalysis = async (file: string, email: string) => {
    setAnalysisData(prev => ({ ...prev, [file]: null }));
    setLoading(prev => ({ ...prev, [file]: true }));

    try {
      const data = await analisisApi.runAnalysis(file, email);
      setAnalysisData(prev => ({ ...prev, [file]: data }));

      const isCodeClean = data.plan && data.plan.every((p: string) => p.startsWith('✅'));
      const isResponsiveClean = data.responsiveness && data.responsiveness.score === 100;
      const isPremiumClean = data.premium && data.premium.score === 100;

      const now = new Date();
      const formattedDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;

      setCompletedDates(prev => ({
        ...prev,
        [file]: {
          refactoredAt: isCodeClean ? formattedDate : null,
          responsiveAt: isResponsiveClean ? formattedDate : null,
          premiumAt: isPremiumClean ? formattedDate : null
        }
      }));

      // Construir comando combinado para el portapapeles
      const matched = dashboards.find(d => d.file === file);
      const dashPath = matched ? matched.path : '';
      const parts: string[] = [];

      if (!isCodeClean) {
        parts.push(`--- 💻 REFACTORIZACIÓN DE CÓDIGO ---\nAntigravity, ejecuta el plan de refactorización del archivo src/app/dashboard/${file}. Analiza el código, extrae los custom hooks necesarios, los componentes reutilizables y los servicios de API. Hazlo de forma segura, paso a paso, sin romper la funcionalidad existente del dashboard en ${dashPath}.`);
      }

      if (!isResponsiveClean && data.responsiveness?.improvementsForAgent) {
        parts.push(`--- 📱 OPTIMIZACIÓN RESPONSIVE ---\n${data.responsiveness.improvementsForAgent}`);
      }

      if (!isPremiumClean && data.premium?.improvementsForAgent) {
        parts.push(`--- 👑 CRITERIOS PREMIUM ---\n${data.premium.improvementsForAgent}`);
      }

      if (parts.length > 0) {
        const combined = parts.join('\n\n') + `\n\nAl finalizar, cuenta las líneas resultantes de src/app/dashboard/${file} y actualiza su entrada en el array dashboards en src/app/dashboard/admin/mantenimiento/analisis/services/analisisApi.ts con el nuevo número de líneas y la fecha de hoy en los campos correspondientes (refactoredAt, responsiveAt, premiumAt) para que se muestre actualizado al instante.`;
        navigator.clipboard.writeText(combined)
          .then(() => console.log('📋 Comando combinado (Código + Responsive + Premium) copiado al portapapeles.'))
          .catch(err => console.error('Error copying:', err));
      }
    } catch (err) {
      console.error('Error running analysis:', err);
    } finally {
      setLoading(prev => ({ ...prev, [file]: false }));
    }
  };

  const handleTriggerAnalysis = async (file: string) => {
    if (!userEmail) return;
    setLastFocusedFile(file);
    setExpanded(prev => ({ ...prev, [file]: true }));
    loadAnalysis(file, userEmail);
  };

  const saveAndNavigate = (path: string, file: string) => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('analisis_scroll', window.scrollY.toString());
      sessionStorage.setItem('analisis_filter', activeFilter);
      sessionStorage.setItem('analisis_group_filter', activeGroupFilter);
      sessionStorage.setItem('analisis_expanded', JSON.stringify(expanded));
      sessionStorage.setItem('analisis_sort_by', sortBy);
      sessionStorage.setItem('analisis_sort_direction', sortDirection);
      sessionStorage.setItem('analisis_foco_file', file);
    }
    const separator = path.includes('?') ? '&' : '?';
    window.location.href = `${path}${separator}from=analisis`;
  };

  // Restaurar estado desde sessionStorage al montar
  useEffect(() => {
    if (typeof window === 'undefined' || restored) return;

    const queryParams = new URLSearchParams(window.location.search);
    const shouldClean = queryParams.get('clean') === 'true';

    if (shouldClean) {
      sessionStorage.removeItem('analisis_filter');
      sessionStorage.removeItem('analisis_group_filter');
      sessionStorage.removeItem('analisis_expanded');
      sessionStorage.removeItem('analisis_scroll');
      sessionStorage.removeItem('analisis_foco_file');
      
      setActiveFilter('all');
      setActiveGroupFilter('all');
      setRestored(true);
      
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, '', cleanUrl);
      return;
    }

    const savedFilter = sessionStorage.getItem('analisis_filter');
    const savedGroupFilter = sessionStorage.getItem('analisis_group_filter');
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

        sessionStorage.removeItem('analisis_scroll');
        sessionStorage.removeItem('analisis_foco_file');
      }, 350);
    }
  }, [restored]);

  // Guardar estado en sessionStorage automáticamente
  useEffect(() => {
    if (typeof window === 'undefined' || !restored) return;
    sessionStorage.setItem('analisis_filter', activeFilter);
    sessionStorage.setItem('analisis_group_filter', activeGroupFilter);
    sessionStorage.setItem('analisis_expanded', JSON.stringify(expanded));
    sessionStorage.setItem('analisis_sort_by', sortBy);
    sessionStorage.setItem('analisis_sort_direction', sortDirection);
    if (lastFocusedFile) {
      sessionStorage.setItem('analisis_foco_file', lastFocusedFile);
    }
  }, [restored, activeFilter, activeGroupFilter, expanded, sortBy, sortDirection, lastFocusedFile]);

  // Guardar completedDates en localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && restored) {
      localStorage.setItem('analisis_completed_dates', JSON.stringify(completedDates));
    }
  }, [completedDates, restored]);

  // Cargar análisis para filas expandidas restauradas
  useEffect(() => {
    if (!userEmail || !restored) return;

    Object.entries(expanded).forEach(([file, isExp]) => {
      if (isExp && !analysisData[file] && !loading[file]) {
        loadAnalysis(file, userEmail);
      }
    });
  }, [userEmail, restored, expanded, analysisData, loading]);

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
      sessionStorage.setItem('analisis_expanded', JSON.stringify(expanded));
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
    const effectivePremiumAt = (restored && completedDates[d.file] && completedDates[d.file].premiumAt) || d.premiumAt;

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
    if (activeFilter === 'premium_si' && !effectivePremiumAt) return false;
    if (activeFilter === 'premium_no' && effectivePremiumAt) return false;

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
    } else {
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
    loading,
    expanded,
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
