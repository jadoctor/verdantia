'use client';

import React, { useState, useEffect, useRef } from 'react';
import { auth } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import PremiumModal from './PremiumModal';
import PremiumModalHeader from './PremiumModalHeader';
import { AnalisisRowDetails } from '@/app/dashboard/admin/mantenimiento/analisis/components/AnalisisRowDetails';
import PremiumReanalyzeButton from '@/components/ui/PremiumReanalyzeButton';

interface PremiumDevInsightsProps {
  modulePath: string; // e.g. "admin/especies/page.tsx"
}

export default function PremiumDevInsights({ modulePath }: PremiumDevInsightsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [hasUnanalyzedChanges, setHasUnanalyzedChanges] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const autoReanalyzedRef = useRef(false);
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.email) {
        setUserEmail(user.email);
      } else {
        setUserEmail(null);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (userEmail) {
      loadCachedMetrics();
    }
  }, [userEmail, modulePath]);

  const normalizeMetrics = (rawMetrics: any) => {
    if (!rawMetrics) return null;
    const raw = rawMetrics.raw || rawMetrics;
    const codeScore =
      typeof rawMetrics.codeScore === 'number'
        ? rawMetrics.codeScore
        : typeof raw?.code?.score === 'number'
          ? raw.code.score
          : rawMetrics.codeClean
            ? 100
            : 0;
    const responsiveScore =
      typeof rawMetrics.responsiveScore === 'number'
        ? rawMetrics.responsiveScore
        : typeof raw?.responsiveness?.score === 'number'
          ? raw.responsiveness.score
          : 0;
    const premiumScore =
      typeof rawMetrics.premiumScore === 'number'
        ? rawMetrics.premiumScore
        : typeof raw?.premium?.score === 'number'
          ? raw.premium.score
          : 0;

    return {
      ...rawMetrics,
      raw,
      codeScore,
      responsiveScore,
      premiumScore,
      codeClean: codeScore === 100
    };
  };

  const loadCachedMetrics = async () => {
    if (!userEmail) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/mantenimiento/metrics?path=${encodeURIComponent(modulePath)}`, {
        headers: { 'x-user-email': userEmail }
      });
      const data = await res.json();
      if (data.success && data.metrics) {
        setMetrics(normalizeMetrics(data.metrics));
        const unanalyzed = data.hasUnanalyzedChanges || false;
        setHasUnanalyzedChanges(unanalyzed);
        
        // Si hay cambios no analizados, lanzar el reanalisis automatico en segundo plano
        if (unanalyzed && !autoReanalyzedRef.current) {
          autoReanalyzedRef.current = true;
          setTimeout(() => {
            handleReanalyze();
          }, 150);
        }
      } else if (!data.metrics && !autoReanalyzedRef.current) {
        // Si no hay métricas, analizar por primera vez automaticamente
        autoReanalyzedRef.current = true;
        setTimeout(() => {
          handleReanalyze();
        }, 150);
      }
    } catch (err) {
      console.error('Error loading metrics', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReanalyze = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!userEmail || analyzing) return;
    setAnalyzing(true);
    try {
      // 1. Llamar al analizador
      const resAnalysis = await fetch(`/api/admin/mantenimiento/analizar?path=${encodeURIComponent(modulePath)}&t=${Date.now()}`, {
        headers: { 'x-user-email': userEmail }
      });
      const analysisData = await resAnalysis.json();
      
      // 2. Extraer métricas clave
      const totalLines = analysisData.plan ? analysisData.totalLines || 0 : (analysisData.lines || 0);
      const responsiveScore = analysisData.responsiveness ? analysisData.responsiveness.score : 0;
      const codeScore = analysisData.code ? analysisData.code.score : (analysisData.plan ? (analysisData.plan.every((p: string) => p.startsWith('✅')) ? 100 : 0) : 0);
      const premiumScore = analysisData.premium ? analysisData.premium.score : 0;
      const newMetrics = {
        lines: totalLines,
        codeScore,
        responsiveScore: responsiveScore,
        premiumScore,
        codeClean: analysisData.plan ? analysisData.plan.every((p: string) => p.startsWith('✅')) : false,
        raw: analysisData
      };

      // 3. Guardar métricas
      const resSave = await fetch('/api/admin/mantenimiento/metrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': userEmail
        },
        body: JSON.stringify({
          modulePath,
          metrics: newMetrics
        })
      });
      const saveData = await resSave.json();
      
      if (saveData.success) {
        setMetrics(normalizeMetrics(saveData.metrics));
        setHasUnanalyzedChanges(false);
      }
    } catch (err) {
      console.error('Error reanalyzing', err);
    } finally {
      setAnalyzing(false);
    }
  };

  const formatDate = (isoStr: string) => {
    const d = new Date(isoStr);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
  };

  return (
    <>
      <style>{`
        @keyframes devInsightsBlink {
          0%, 100% { border-color: rgba(255,255,255,0.3); box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          50% { border-color: rgba(234, 179, 8, 0.8); box-shadow: 0 0 8px rgba(234, 179, 8, 0.5); }
        }
        .dev-insights-outdated {
          animation: devInsightsBlink 2s infinite ease-in-out;
        }
      `}</style>
      <button
        className={hasUnanalyzedChanges ? 'dev-insights-outdated' : ''}
        onClick={(e) => { setIsOpen(true); handleReanalyze(e); }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          padding: '6px 12px',
          borderRadius: '10px',
          background: 'rgba(255,255,255,0.2)',
          border: '1px solid rgba(255,255,255,0.3)',
          color: 'white',
          fontSize: '0.85rem',
          fontWeight: 600,
          cursor: 'pointer',
          backdropFilter: 'blur(10px)',
          transition: 'all 0.2s',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}
        title={`Salud del Módulo${metrics && metrics.last_updated ? ` (Últ. Análisis: ${formatDate(metrics.last_updated)})` : ''}`}
      >
        {metrics && metrics.last_updated && (
          <span style={{ fontSize: '0.75rem', opacity: 0.8, marginLeft: '2px', fontWeight: 'normal' }}>
            {formatDate(metrics.last_updated)}
          </span>
        )}
        
        {metrics ? (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginLeft: '8px', paddingLeft: '8px', borderLeft: '1px solid rgba(255,255,255,0.3)' }}>
            <span title={`Código: ${metrics.codeScore ?? 0}%`} style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>💻 {metrics.codeScore ?? 0}%</span>
            <span title={`Responsive: ${metrics.responsiveScore ?? 0}%`} style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>📱 {metrics.responsiveScore ?? 0}%</span>
            <span title={`Premium: ${metrics.premiumScore ?? 0}%`} style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>👑 {metrics.premiumScore ?? 0}%</span>
            {hasUnanalyzedChanges && <span style={{ position: 'relative', top: '-4px', fontSize: '0.6rem', marginLeft: '4px' }}>⚠️</span>}
          </div>
        ) : (
          <span style={{ fontSize: '0.75rem', opacity: 0.9, marginLeft: '4px' }}>⚪ Sin analizar</span>
        )}
      </button>

      {isOpen && (
        <PremiumModal isOpen={isOpen} onClose={() => setIsOpen(false)} maxWidth="900px">
          <PremiumModalHeader
            title={<>🛠️ Dashboard de Mantenimiento <span style={{ fontSize: '0.8rem', opacity: 0.8, marginLeft: '8px' }}>({modulePath})</span></>}
            gradient="linear-gradient(135deg, #0284c7, #3b82f6)"
            actions={
              <>
                <button
                  onClick={() => setIsOpen(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.2)',
                    background: 'rgba(255,255,255,0.1)',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s'
                  }}
                >
                  ✖ Cancelar
                </button>
                <PremiumReanalyzeButton onClick={handleReanalyze} isAnalyzing={analyzing} />
              </>
            }
          />
          
          <div style={{ background: '#f8fafc', maxHeight: '75vh', overflowY: 'auto' }}>
            {hasUnanalyzedChanges && !analyzing && (
              <div style={{ padding: '12px 20px', background: '#fffbeb', color: '#b45309', borderBottom: '1px solid #fde68a', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500 }}>
                <span style={{ fontSize: '1.2rem' }}>⚠️</span>
                Este archivo se ha modificado desde el último análisis. Los datos mostrados podrían estar obsoletos.
              </div>
            )}
            
            <AnalisisRowDetails 
              file={modulePath}
              data={metrics?.raw}
              isLoading={analyzing || loading}
              isMobile={false}
            />
          </div>
        </PremiumModal>
      )}
    </>
  );
}

// refresh trigger