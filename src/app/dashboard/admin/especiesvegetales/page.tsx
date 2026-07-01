'use client';
import React from 'react';
import { useEspeciesAdmin } from './hooks/useEspeciesAdmin';
import EspeciesHeader from './components/EspeciesHeader';
import EspeciesTable from './components/EspeciesTable';
import styles from './EspeciesPage.module.css';

export default function EspeciesAdminPage() {
  const {
    router,
    focusParam,
    especies,
    counts,
    countsStatus,
    uniqueFamilias,
    loading,
    filterTipo,
    setFilterTipo,
    filterFamilia,
    setFilterFamilia,
    filter,
    setFilter,
    handleEdit,
    handleDelete,
    handleReactivate,
    sortConfig,
    handleSort
  } = useEspeciesAdmin();

  return (
    <div className={`dashboard-content ${styles.dashboardContent}`}>
      <EspeciesHeader
        filterTipo={filterTipo}
        setFilterTipo={setFilterTipo}
        filterFamilia={filterFamilia}
        setFilterFamilia={setFilterFamilia}
        filter={filter}
        setFilter={setFilter}
        counts={counts}
        countsStatus={countsStatus}
        uniqueFamilias={uniqueFamilias}
        onNewEspecie={() => handleEdit(null)}
        onGoHome={() => router.push('/dashboard')}
      />
      <EspeciesTable
        especies={especies}
        loading={loading}
        focusParam={focusParam}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onReactivate={handleReactivate}
        sortConfig={sortConfig}
        onSort={handleSort}
      />
    </div>
  );
}

