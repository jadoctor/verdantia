'use client';
import React from 'react';
import '@/app/dashboard/dashboard.css';
import { useLaboresList } from './hooks/useLaboresList';
import { LaboresHeader } from './components/LaboresHeader';
import { LaboresTable } from './components/LaboresTable';

export default function LaboresAdminPage() {
  const { labores, loading, filter, setFilter, filterCounts, handleDelete, sortConfig, handleSort } = useLaboresList();
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  if (loading) {
    return <div style={{ padding: '50px', textAlign: 'center' }}>Cargando Catálogo de Labores...</div>;
  }

  return (
    <div className="dashboard-content" style={{ padding: isMobile ? '10px' : '20px' }}>
      <LaboresHeader isMobile={isMobile} filter={filter} setFilter={setFilter} filterCounts={filterCounts} />
      <LaboresTable labores={labores} handleDelete={handleDelete} isMobile={isMobile} sortConfig={sortConfig} onSort={handleSort} />
    </div>
  );
}
