'use client';

import React from 'react';
import { useFamiliasList } from './hooks/useFamiliasList';
import { FamiliasHeader } from './components/FamiliasHeader';
import { NewFamiliaModal } from './components/NewFamiliaModal';
import { FamiliasTable } from './components/FamiliasTable';

export default function FamiliasPage() {
  const {
    familias,
    loading,
    filter,
    setFilter,
    showNewForm,
    setShowNewForm,
    saving,
    newFamilia,
    setNewFamilia,
    focusedRowId,
    filteredFamilias,
    filterCounts,
    sortConfig,
    handleSort,
    handleEdit,
    handleToggleActive,
    handleHardDelete,
    handleCreateNew
  } = useFamiliasList();

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <div style={{ width: '100%', padding: isMobile ? '12px 8px' : '20px' }}>
      <FamiliasHeader 
        filter={filter} 
        setFilter={setFilter} 
        filterCounts={filterCounts} 
        setShowNewForm={setShowNewForm} 
        isMobile={isMobile}
      />

      <NewFamiliaModal 
        showNewForm={showNewForm} 
        setShowNewForm={setShowNewForm} 
        newFamilia={newFamilia} 
        setNewFamilia={setNewFamilia} 
        saving={saving} 
        handleCreateNew={handleCreateNew} 
      />

      <FamiliasTable 
        familias={filteredFamilias} 
        loading={loading} 
        focusedRowId={focusedRowId} 
        handleEdit={handleEdit} 
        handleToggleActive={handleToggleActive} 
        handleHardDelete={handleHardDelete} 
        sortConfig={sortConfig}
        onSort={handleSort}
      />

      {/* Spinner animation */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
