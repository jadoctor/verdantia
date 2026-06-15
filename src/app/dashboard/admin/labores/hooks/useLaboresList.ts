import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { laboresApi } from '../services/laboresApi';

export function useLaboresList() {
  const [labores, setLabores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [filter, setFilter] = useState<'todos' | 'convencional' | 'minimo' | 'nolaboreo'>('todos');
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedSort = sessionStorage.getItem('laboresSortConfig');
      if (savedSort) {
        try { setSortConfig(JSON.parse(savedSort)); } catch (e) {}
      }
      const savedFilter = sessionStorage.getItem('laboresFilter');
      if (savedFilter) {
        setFilter(savedFilter as any);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('laboresFilter', filter);
    }
  }, [filter]);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    const newConfig = { key, direction };
    setSortConfig(newConfig);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('laboresSortConfig', JSON.stringify(newConfig));
    }
  };

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

  const loadLabores = async () => {
    if (!userEmail) return;
    try {
      setLoading(true);
      const data = await laboresApi.getLabores(userEmail);
      if (data.success) {
        setLabores(data.labores || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userEmail) loadLabores();
  }, [userEmail]);

  const handleDelete = async (id: number) => {
    if (!confirm('¿Seguro que quieres eliminar esta labor? Se desvinculará de todas las tareas.')) return;
    try {
      const data = await laboresApi.deleteLabor(id, userEmail!);
      if (data.success) {
        loadLabores();
      } else {
        alert('Error: ' + data.error);
      }
    } catch (e) {
      alert('Error eliminando la labor.');
    }
  };

  const filteredLabores = labores.filter(labor => {
    if (filter === 'convencional') return labor.laboresaplicaconvencional === 1;
    if (filter === 'minimo') return labor.laboresaplicaminimo === 1;
    if (filter === 'nolaboreo') return labor.laboresaplicanolaboreo === 1;
    return true;
  });

  const filterCounts = {
    todos: labores.length,
    convencional: labores.filter(l => l.laboresaplicaconvencional === 1).length,
    minimo: labores.filter(l => l.laboresaplicaminimo === 1).length,
    nolaboreo: labores.filter(l => l.laboresaplicanolaboreo === 1).length,
  };

  const sortedLabores = [...filteredLabores].sort((a, b) => {
    if (!sortConfig) return 0;
    const { key, direction } = sortConfig;
    let valA = a[key];
    let valB = b[key];
    if (typeof valA === 'string') valA = valA.toLowerCase();
    if (typeof valB === 'string') valB = valB.toLowerCase();
    
    if (valA < valB) return direction === 'asc' ? -1 : 1;
    if (valA > valB) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  return {
    labores: sortedLabores,
    loading,
    filter,
    setFilter,
    filterCounts,
    handleDelete,
    sortConfig,
    handleSort
  };
}
