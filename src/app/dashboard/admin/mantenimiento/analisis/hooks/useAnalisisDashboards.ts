import React, { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { analisisApi, dashboards, getDashboardGroup, FRIENDLY_NAMES } from '../services/analisisApi';

export function useAnalisisDashboards() {
  const ANALYSIS_CACHE_KEY = 'analisis_cached_results';
  const getAnalysisKey = (file: string, analyzeFile?: string) => analyzeFile || file;
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [origin, setOrigin] = useState('http://localhost:3000');
  const [changesInfo, setChangesInfo] = useState<any>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  const [analysisData, setAnalysisData] = useState<Record<string, any>>({});
  const [lastAnalyzedAt, setLastAnalyzedAt] = useState<Record<string, string | null>>({});
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

  const hydrateFromBackendMetrics = async (email: string) => {
    try {
      const response = await analisisApi.getSavedMetrics(email);
      const allMetrics = response?.metrics || {};
      if (!allMetrics || typeof allMetrics !== 'object') return;

      const restoredData: Record<string, any> = {};
      const restoredDates: Record<string, string | null> = {};
      const restoredCompleted: Record<string, { refactoredAt: string | null; responsiveAt: string | null; premiumAt: string | null }> = {};

      dashboards.forEach((dashboard) => {
        const analysisKey = getAnalysisKey(dashboard.file, dashboard.analyzeFile);
        const metric = allMetrics[analysisKey];
        if (!metric) return;

        if (metric.raw) {
          restoredData[analysisKey] = metric.raw;
        }

        const isoDate = metric.last_updated || null;
        if (isoDate) {
          const dateObj = new Date(isoDate);
          const formattedDate = `${String(dateObj.getDate()).padStart(2, '0')}/${String(dateObj.getMonth() + 1).padStart(2, '0')}/${dateObj.getFullYear()}`;
          const formattedDateTime = `${formattedDate} ${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')}`;
          restoredDates[analysisKey] = formattedDateTime;
          restoredCompleted[analysisKey] = {
            refactoredAt: typeof metric.codeScore === 'number' && metric.codeScore === 100 ? formattedDate : null,
            responsiveAt: typeof metric.responsiveScore === 'number' && metric.responsiveScore === 100 ? formattedDate : null,
            premiumAt: typeof metric.premiumScore === 'number' && metric.premiumScore === 100 ? formattedDate : null
          };
        }
      });

      if (Object.keys(restoredData).length > 0) {
        setAnalysisData(prev => ({ ...prev, ...restoredData }));
      }
      if (Object.keys(restoredDates).length > 0) {
        setLastAnalyzedAt(prev => ({ ...prev, ...restoredDates }));
      }
      if (Object.keys(restoredCompleted).length > 0) {
        setCompletedDates(prev => ({ ...prev, ...restoredCompleted }));
      }

      // Analizar automáticamente en segundo plano los archivos modificados
      const unanalyzed = response?.unanalyzedFiles || [];
      if (unanalyzed.length > 0) {
        unanalyzed.forEach((fileKey: string) => {
          const matched = dashboards.find(d => getAnalysisKey(d.file, d.analyzeFile) === fileKey);
          if (matched) {
            setTimeout(() => {
              loadAnalysis(matched.file, email, matched.analyzeFile);
            }, 200);
          }
        });
      }
    } catch (err) {
      console.error('Error hydrating backend metrics:', err);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.email) {
        setUserEmail(user.email);
        loadChangesPreview(user.email);
        hydrateFromBackendMetrics(user.email);
      } else {
        setUserEmail(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const loadAnalysis = async (file: string, email: string, analyzeFile?: string) => {
    const analysisKey = getAnalysisKey(file, analyzeFile);
    setAnalysisData(prev => ({ ...prev, [analysisKey]: null }));
    setLoading(prev => ({ ...prev, [analysisKey]: true }));

    try {
      const data = await analisisApi.runAnalysis(file, email, analyzeFile);
      setAnalysisData(prev => ({ ...prev, [analysisKey]: data }));

      const isCodeClean = data.plan && data.plan.every((p: string) => p.startsWith('✅'));
      const isResponsiveClean = data.responsiveness && data.responsiveness.score === 100;
      const isPremiumClean = data.premium && data.premium.score === 100;

      const now = new Date();
      const formattedDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
      const formattedDateTime = `${formattedDate} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      setCompletedDates(prev => ({
        ...prev,
        [analysisKey]: {
          refactoredAt: isCodeClean ? formattedDate : null,
          responsiveAt: isResponsiveClean ? formattedDate : null,
          premiumAt: isPremiumClean ? formattedDate : null
        }
      }));
      setLastAnalyzedAt(prev => ({ ...prev, [analysisKey]: formattedDateTime }));

      const codeScore = data.code ? data.code.score : (data.plan ? (data.plan.every((p: string) => p.startsWith('✅')) ? 100 : 0) : 0);
      const responsiveScore = data.responsiveness ? data.responsiveness.score : 0;
      const premiumScore = data.premium ? data.premium.score : 0;

      try {
        await fetch('/api/admin/mantenimiento/metrics', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-email': email
          },
          body: JSON.stringify({
            modulePath: analysisKey,
            metrics: {
              lines: data.totalLines || 0,
              codeScore,
              responsiveScore,
              premiumScore,
              codeClean: codeScore === 100,
              raw: data
            }
          })
        });
      } catch (saveErr) {
        console.error('Error saving backend metrics:', saveErr);
      }

      // Construir comando combinado para el portapapeles
      const matched = dashboards.find(d => d.file === file);
      const dashPath = matched ? matched.path : '';
      const dashAnalyzeFile = matched?.analyzeFile;
      const parts: string[] = [];

      if (!isCodeClean) {
        const targetPath = dashAnalyzeFile ? dashAnalyzeFile : `src/app/dashboard/${file}`;
        parts.push(`--- 💻 REFACTORIZACIÓN DE CÓDIGO ---\nAntigravity, ejecuta el plan de refactorización del archivo ${targetPath}. Analiza el código, extrae los custom hooks necesarios, los componentes reutilizables y los servicios de API. Hazlo de forma segura, paso a paso, sin romper la funcionalidad existente del dashboard en ${dashPath}.`);
      }

      if (!isResponsiveClean && data.responsiveness?.improvementsForAgent) {
        parts.push(`--- 📱 OPTIMIZACIÓN RESPONSIVE ---\n${data.responsiveness.improvementsForAgent}`);
      }

      if (!isPremiumClean && data.premium?.improvementsForAgent) {
        parts.push(`--- 👑 CRITERIOS PREMIUM ---\n${data.premium.improvementsForAgent}`);
      }

      if (parts.length > 0) {
        const targetFile = dashAnalyzeFile ? dashAnalyzeFile : `src/app/dashboard/${file}`;
        const combined = parts.join('\n\n') + `\n\nAl finalizar, cuenta las líneas resultantes de ${targetFile} y actualiza su entrada en el array dashboards en src/app/dashboard/admin/mantenimiento/analisis/services/analisisApi.ts con el nuevo número de líneas y la fecha de hoy en los campos correspondientes (refactoredAt, responsiveAt, premiumAt) para que se muestre actualizado al instante.`;
        navigator.clipboard.writeText(combined)
          .then(() => console.log('📋 Comando combinado (Código + Responsive + Premium) copiado al portapapeles.'))
          .catch(err => console.error('Error copying:', err));
      }
    } catch (err) {
      console.error('Error running analysis:', err);
      setAnalysisData(prev => ({ ...prev, [analysisKey]: { error: true, message: String(err) } }));
    } finally {
      setLoading(prev => ({ ...prev, [analysisKey]: false }));
    }
  };

  const handleTriggerAnalysis = async (file: string, analyzeFile?: string) => {
    if (!userEmail) return;
    setLastFocusedFile(file);
    loadAnalysis(file, userEmail, analyzeFile);
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
    const savedAnalysisCache = localStorage.getItem(ANALYSIS_CACHE_KEY);

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

    if (savedAnalysisCache) {
      try {
        const parsed = JSON.parse(savedAnalysisCache) as Record<string, { data: any; lastAnalyzedAt: string | null }>;
        const restoredData: Record<string, any> = {};
        const restoredDates: Record<string, string | null> = {};
        Object.entries(parsed).forEach(([file, value]) => {
          restoredData[file] = value.data;
          restoredDates[file] = value.lastAnalyzedAt;
        });
        setAnalysisData(restoredData);
        setLastAnalyzedAt(restoredDates);
      } catch (e) {
        console.error('Error parsing analysis cache:', e);
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

  useEffect(() => {
    if (typeof window === 'undefined' || !restored) return;
    const cache: Record<string, { data: any; lastAnalyzedAt: string | null }> = {};
    Object.keys(analysisData).forEach((file) => {
      if (analysisData[file]) {
        cache[file] = {
          data: analysisData[file],
          lastAnalyzedAt: lastAnalyzedAt[file] || null
        };
      }
    });
    localStorage.setItem(ANALYSIS_CACHE_KEY, JSON.stringify(cache));
  }, [analysisData, lastAnalyzedAt, restored]);

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

  const getEffectiveLines = (d: typeof dashboards[0]) => {
    const analysisKey = getAnalysisKey(d.file, d.analyzeFile);
    const data = analysisData[analysisKey];
    if (data) {
      if (typeof data.totalLines === 'number') return data.totalLines;
      if (typeof data.lines === 'number') return data.lines;
    }
    return (d.componentLines || 0) + d.lines;
  };
  const filteredDashboards = dashboards.filter(d => {
    const analysisKey = getAnalysisKey(d.file, d.analyzeFile);
    const fallbackRefactoredAt = d.analyzeFile ? null : d.refactoredAt;
    const fallbackResponsiveAt = d.analyzeFile ? null : d.responsiveAt;
    const fallbackPremiumAt = d.analyzeFile ? null : d.premiumAt;
    const effectiveRefactoredAt = (restored && completedDates[analysisKey] && completedDates[analysisKey].refactoredAt) || fallbackRefactoredAt;
    const effectiveResponsiveAt = (restored && completedDates[analysisKey] && completedDates[analysisKey].responsiveAt) || fallbackResponsiveAt;
    const effectivePremiumAt = (restored && completedDates[analysisKey] && completedDates[analysisKey].premiumAt) || fallbackPremiumAt;

    if (activeFilter === 'superadmin' && !d.path.startsWith('/dashboard/admin/')) return false;
    if (activeFilter === 'general' && d.path.startsWith('/dashboard/admin/')) return false;
    const effLines = getEffectiveLines(d);
    if (activeFilter === 'monolito' && effLines <= 1000) return false;
    if (activeFilter === 'complejo' && (effLines <= 500 || effLines > 1000)) return false;
    if (activeFilter === 'estandar' && (effLines <= 200 || effLines > 500)) return false;
    if (activeFilter === 'ligero_stub' && effLines > 200) return false;
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
      valA = getEffectiveLines(a);
      valB = getEffectiveLines(b);
    } else {
      valA = getEffectiveLines(a);
      valB = getEffectiveLines(b);
    }

    if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
    if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const totalLines = filteredDashboards.reduce((sum, d) => sum + getEffectiveLines(d), 0);
  const maxLines = filteredDashboards.length > 0 ? Math.max(...filteredDashboards.map(getEffectiveLines), 1) : 1;

  const getLargestDashboard = () => {
    if (filteredDashboards.length === 0) return null;
    return filteredDashboards.reduce((max, d) => {
      return getEffectiveLines(d) > getEffectiveLines(max) ? d : max;
    }, filteredDashboards[0]);
  };
  const largestDashboard = getLargestDashboard();
  const largestDashboardFile = largestDashboard 
    ? (FRIENDLY_NAMES[largestDashboard.path] || largestDashboard.file).replace(/^[\p{Emoji_Presentation}\p{Emoji}\u200d\uFE0F\s]+/gu, '') 
    : 'Ninguno';

  return {
    userEmail,
    origin,
    isMobile,
    changesInfo,
    loadingPreview,
    analysisData,
    loading,
    lastAnalyzedAt,
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
    largestDashboardFile,
    sortedDashboards,
    handleSort,
    handleSelectGroup,
    handleSelectFilter,
    handleReloadAndSaveState,
    handleTriggerAnalysis,
    handleCloseAnalysis: (file: string) => setExpanded(prev => ({ ...prev, [file]: false })),
    saveAndNavigate
  };
}
