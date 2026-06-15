import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { FamiliaList } from '../types';
import { fetchFamiliasData, createFamiliaData, toggleFamiliaActive, deleteFamiliaHard } from '../services/familiasListApi';

export function useFamiliasList() {
  const router = useRouter();
  const [familias, setFamilias] = useState<FamiliaList[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'activas' | 'inactivas'>('all');
  const [showNewForm, setShowNewForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newFamilia, setNewFamilia] = useState({
    familiasnombre: '',
    familiasnombrecientifico: '',
    familiasgruporotacion: '',
    familiasanosdescanso: 3,
    familiascolor: '#64748b',
    familiasemoji: '🌿',
    familiasnotas: ''
  });

  const [focusedRowId, setFocusedRowId] = useState<number | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get('clean') === 'true') {
      sessionStorage.removeItem('familias_filter');
      sessionStorage.removeItem('familias_scroll');
      sessionStorage.removeItem('familias_focus_id');
      return;
    }
    const savedFilter = sessionStorage.getItem('familias_filter');
    if (savedFilter) setFilter(savedFilter as any);
    const savedFocusId = sessionStorage.getItem('familias_focus_id');
    if (savedFocusId) {
      setFocusedRowId(parseInt(savedFocusId));
      sessionStorage.removeItem('familias_focus_id');
      setTimeout(() => setFocusedRowId(null), 3000);
    }
    const savedSort = sessionStorage.getItem('familiasSortConfig');
    if (savedSort) {
      try { setSortConfig(JSON.parse(savedSort)); } catch (e) {}
    }
  }, []);

  useEffect(() => {
    sessionStorage.setItem('familias_filter', filter);
  }, [filter]);

  useEffect(() => {
    const savedScroll = sessionStorage.getItem('familias_scroll');
    if (savedScroll && !loading) {
      setTimeout(() => window.scrollTo(0, parseInt(savedScroll)), 100);
      sessionStorage.removeItem('familias_scroll');
    }
  }, [loading]);

  const fetchFamilias = useCallback(async () => {
    try {
      const data = await fetchFamiliasData();
      setFamilias(data);
    } catch (err) {
      console.error('Error fetching familias:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchFamilias(); }, [fetchFamilias]);

  const filteredFamilias = familias.filter(f => {
    if (filter === 'activas') return f.familiasactivosino === 1;
    if (filter === 'inactivas') return f.familiasactivosino === 0;
    return true;
  });

  const sortedFilteredFamilias = [...filteredFamilias].sort((a, b) => {
    if (!sortConfig) return 0;
    const { key, direction } = sortConfig;
    let valA = (a as any)[key];
    let valB = (b as any)[key];

    if (key === 'familiasanosdescanso' || key === 'total_especies') {
      valA = Number(valA) || 0;
      valB = Number(valB) || 0;
    } else {
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
    }

    if (valA < valB) return direction === 'asc' ? -1 : 1;
    if (valA > valB) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    const newConfig = { key, direction };
    setSortConfig(newConfig);
    sessionStorage.setItem('familiasSortConfig', JSON.stringify(newConfig));
  };

  const filterCounts = {
    all: familias.length,
    activas: familias.filter(f => f.familiasactivosino === 1).length,
    inactivas: familias.filter(f => f.familiasactivosino === 0).length,
  };

  const handleEdit = (id: number) => {
    sessionStorage.setItem('familias_scroll', String(window.scrollY));
    sessionStorage.setItem('familias_focus_id', String(id));
    router.push(`/dashboard/admin/familias/${id}`);
  };

  const handleToggleActive = async (id: number, currentActive: number) => {
    try {
      await toggleFamiliaActive(id, currentActive);
      fetchFamilias();
    } catch (err) {
      console.error('Error toggling familia:', err);
    }
  };

  const handleHardDelete = async (id: number, nombre: string) => {
    if (!confirm(`⚠️ ¿Eliminar definitivamente la familia "${nombre}"?\n\nLas especies asociadas perderán su familia asignada.`)) return;
    try {
      await deleteFamiliaHard(id);
      fetchFamilias();
    } catch (err) {
      console.error('Error deleting familia:', err);
    }
  };

  const handleCreateNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFamilia.familiasnombre || !newFamilia.familiasgruporotacion) return;
    setSaving(true);
    try {
      await createFamiliaData(newFamilia);
      setShowNewForm(false);
      setNewFamilia({ familiasnombre: '', familiasnombrecientifico: '', familiasgruporotacion: '', familiasanosdescanso: 3, familiascolor: '#64748b', familiasemoji: '🌿', familiasnotas: '' });
      fetchFamilias();
    } catch (err: any) {
      alert(err.message || 'Error al crear familia');
      console.error('Error creating familia:', err);
    } finally {
      setSaving(false);
    }
  };

  return {
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
    filteredFamilias: sortedFilteredFamilias,
    filterCounts,
    sortConfig,
    handleSort,
    handleEdit,
    handleToggleActive,
    handleHardDelete,
    handleCreateNew
  };
}
