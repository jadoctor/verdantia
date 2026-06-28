'use client';

import React from 'react';
import PremiumBackButton from '@/components/ui/PremiumBackButton';
import { useTratamientos } from './hooks/useTratamientos';
import { TratamientosHeader } from './components/TratamientosHeader';
import { TratamientosTable } from './components/TratamientosTable';

export default function TratamientosAdminPage() {
  const {
    tratamientos,
    loading,
    searchTerm,
    setSearchTerm,
    sortConfig,
    activeFilter,
    setActiveFilter,
    isMobile,
    handleSort,
    filteredTratamientos,
    sortedTratamientos,
    getCompleteness,
    countByTag,
    parseTags,
    router
  } = useTratamientos();

  return (
    <div style={{ width: '100%', padding: isMobile ? '12px 8px' : '20px', boxSizing: 'border-box', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Navegación Superior */}
      <div style={{ marginBottom: '16px', padding: '0 4px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <PremiumBackButton onClick={() => router.push('/dashboard')} text="🏠 Volver al Inicio" />
      </div>

      <TratamientosHeader
        tratamientosLength={tratamientos.length}
        activeFilter={activeFilter}
        setActiveFilter={setActiveFilter}
        countByTag={countByTag}
        isMobile={isMobile}
        router={router}
      />

      <TratamientosTable
        filteredTratamientos={filteredTratamientos}
        sortedTratamientos={sortedTratamientos}
        loading={loading}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        sortConfig={sortConfig}
        handleSort={handleSort}
        getCompleteness={getCompleteness}
        parseTags={parseTags}
        router={router}
      />
    </div>
  );
}
// reload 28/06/2026 18:09:00
