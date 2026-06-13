'use client';

import React from 'react';
import { useAnalisisDashboards } from './hooks/useAnalisisDashboards';
import { AnalisisHeader } from './components/AnalisisHeader';
import { AnalisisStats } from './components/AnalisisStats';
import { AnalisisTable } from './components/AnalisisTable';

export default function AnalisisDashboardsPage() {
  const {
    activeFilter,
    activeGroupFilter,
    isFiltering,
    sortedDashboards,
    sortBy,
    sortDirection,
    maxLines,
    totalLines,
    loadingCode,
    loadingResponsive,
    expandedCode,
    expandedResponsive,
    analysisData,
    changesInfo,
    completedDates,
    restored,
    focoFile,
    setLastFocusedFile,
    handleSort,
    handleSelectGroup,
    handleSelectFilter,
    handleReloadAndSaveState,
    handleTriggerAnalysis,
    saveAndNavigate,
    isMobile
  } = useAnalisisDashboards();

  return (
    <div className="dashboard-content" style={{ padding: isMobile ? '12px 10px' : '20px', width: '100%' }}>
      <AnalisisHeader
        activeFilter={activeFilter}
        activeGroupFilter={activeGroupFilter}
        handleSelectFilter={handleSelectFilter}
        handleSelectGroup={handleSelectGroup}
        handleReloadAndSaveState={handleReloadAndSaveState}
        isMobile={isMobile}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <AnalisisStats
          totalDashboards={sortedDashboards.length}
          totalLines={totalLines}
          maxLines={maxLines}
          isMobile={isMobile}
        />

        {/* Animación local para el spinner de la cabecera degradada */}
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes spin-loader {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}} />

        {/* Tabla */}
        <div style={{ 
          background: 'white', 
          borderRadius: '16px', 
          border: '1px solid #e2e8f0', 
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', 
          overflow: 'hidden',
          position: 'relative'
        }}>
          {/* Overlay de carga sin flickering (Regla 7) */}
          {isFiltering && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(255, 255, 255, 0.65)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 20,
              animation: 'fadeIn 0.2s ease-in-out'
            }}>
              <span style={{ 
                display: 'inline-block', 
                width: '32px', 
                height: '32px', 
                border: '3px solid #e2e8f0', 
                borderTop: '3px solid #6366f1', 
                borderRadius: '50%', 
                animation: 'spin-loader 0.8s linear infinite' 
              }} />
            </div>
          )}

          <AnalisisTable
            sortedDashboards={sortedDashboards}
            sortBy={sortBy}
            sortDirection={sortDirection}
            handleSort={handleSort}
            maxLines={maxLines}
            loadingCode={loadingCode}
            loadingResponsive={loadingResponsive}
            expandedCode={expandedCode}
            expandedResponsive={expandedResponsive}
            analysisData={analysisData}
            changesInfo={changesInfo}
            completedDates={completedDates}
            restored={restored}
            focoFile={focoFile}
            setLastFocusedFile={setLastFocusedFile}
            handleTriggerAnalysis={handleTriggerAnalysis}
            saveAndNavigate={saveAndNavigate}
            isMobile={isMobile}
          />
        </div>
      </div>
    </div>
  );
}

// reload 13/06/2026 17:02:00
