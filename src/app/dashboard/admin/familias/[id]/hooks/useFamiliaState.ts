import { useState, useEffect, useRef, useCallback } from 'react';
import { Familia, FamiliaMin, Especie } from '../types';
import { fetchFamiliaData, updateFamiliaData } from '../services/familiaApi';

export function useFamiliaState(familiaId: string, userEmail: string | null) {
  const [familia, setFamilia] = useState<Familia | null>(null);
  const [especies, setEspecies] = useState<Especie[]>([]);
  const [todasFamilias, setTodasFamilias] = useState<FamiliaMin[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const hasLoadedRef = useRef(false);

  const fetchFamilia = useCallback(async () => {
    if (!userEmail) return;
    try {
      const data = await fetchFamiliaData(familiaId, userEmail);
      setFamilia(data.familia);
      setEspecies(data.especies || []);
      setTodasFamilias(data.todasFamilias || []);
    } catch (err) {
      console.error('Error fetching familia:', err);
    } finally {
      setLoading(false);
      hasLoadedRef.current = true;
    }
  }, [familiaId, userEmail]);

  useEffect(() => { 
    if (userEmail) fetchFamilia(); 
  }, [fetchFamilia, userEmail]);

  const autoSave = useCallback(async (data: Partial<Familia>) => {
    if (!hasLoadedRef.current || !userEmail) return;
    setSaveStatus('saving');
    try {
      await updateFamiliaData(familiaId, data, userEmail);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  }, [familiaId, userEmail]);

  const handleChange = (field: string, value: any) => {
    setFamilia(prev => {
      if (!prev) return prev;
      const updated = { ...prev, [field]: value };
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        autoSave(updated);
      }, 800);
      return updated;
    });
  };

  const toggleRotacion = (campo: 'familiasprecedentes' | 'familiassucesores', id: number) => {
    setFamilia(prev => {
      if (!prev) return prev;
      let arrayActual: any = prev[campo] || [];
      if (typeof arrayActual === 'string') {
        arrayActual = arrayActual.replace(/[\[\]"]/g, '').split(',').map((s: string) => parseInt(s.trim())).filter((n: number) => !isNaN(n));
      } else if (!Array.isArray(arrayActual)) {
        arrayActual = [arrayActual];
      }
      
      let nuevoArray;
      if (arrayActual.includes(id)) {
        nuevoArray = arrayActual.filter((val: number) => val !== id);
      } else {
        nuevoArray = [...arrayActual, id];
      }

      const updated = { ...prev, [campo]: nuevoArray };
      
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        autoSave(updated);
      }, 800);
      return updated;
    });
  };

  return {
    familia,
    setFamilia,
    especies,
    todasFamilias,
    loading,
    saveStatus,
    handleChange,
    toggleRotacion,
    autoSave
  };
}
