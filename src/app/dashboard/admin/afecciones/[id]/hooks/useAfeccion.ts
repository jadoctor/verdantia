'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export const defaultAfeccionData = {
  afeccionesactivo: 1,
  afeccionesnombre: '',
  afeccionesnombrecientifico: '',
  afeccionescategoria: 'plaga',
  afeccionesagente: '',
  afeccionesgravedad: 'media',
  afeccionesorganosafectados: '',
  afeccionesmesesriesgo: '',
  afeccionessintomas: '',
  afeccionescondiciones: '',
  afeccionesprevencion: ''
};

export function useAfeccion(id: string, userEmail: string | null) {
  const router = useRouter();
  const [formData, setFormData] = useState<any>(defaultAfeccionData);
  const [initialData, setInitialData] = useState<any>(defaultAfeccionData);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (userEmail && id !== 'nueva') {
      fetchAfeccion();
    } else {
      setLoading(false);
    }
  }, [userEmail, id]);

  const fetchAfeccion = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/afecciones`, {
        headers: { 'x-user-email': userEmail || '' }
      });
      if (res.ok) {
        const data = await res.json();
        const afeccion = data.afecciones?.find((a: any) => a.idafecciones.toString() === id);
        if (afeccion) {
          const loadedData = {
            afeccionesactivo: afeccion.afeccionesactivo ?? 1,
            afeccionesnombre: afeccion.afeccionesnombre || '',
            afeccionesnombrecientifico: afeccion.afeccionesnombrecientifico || '',
            afeccionescategoria: afeccion.afeccionescategoria || 'plaga',
            afeccionesagente: afeccion.afeccionesagente || '',
            afeccionesgravedad: afeccion.afeccionesgravedad || 'media',
            afeccionesorganosafectados: afeccion.afeccionesorganosafectados || '',
            afeccionesmesesriesgo: afeccion.afeccionesmesesriesgo || '',
            afeccionessintomas: afeccion.afeccionessintomas || '',
            afeccionescondiciones: afeccion.afeccionescondiciones || '',
            afeccionesprevencion: afeccion.afeccionesprevencion || ''
          };
          setFormData(loadedData);
          setInitialData(loadedData);
        }
      }
    } catch (error) {
      console.error('Error fetching afeccion:', error);
    } finally {
      setLoading(false);
    }
  };

  const autoSave = async (dataToSave: any) => {
    setSaveStatus('saving');
    try {
      const url = id !== 'nueva' ? `/api/admin/afecciones/${id}` : '/api/admin/afecciones';
      const method = id !== 'nueva' ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': userEmail || ''
        },
        body: JSON.stringify(dataToSave)
      });

      if (res.ok) {
        if (id === 'nueva') {
          const data = await res.json();
          if (data.id) {
            router.replace(`/dashboard/admin/afecciones/${data.id}`);
          }
        } else {
          setInitialData(dataToSave);
          setSaveStatus('saved');
          setTimeout(() => setSaveStatus('idle'), 2000);
        }
      } else {
        setSaveStatus('idle');
        console.error('Error auto-guardando');
      }
    } catch (e) {
      setSaveStatus('idle');
      console.error(e);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let newValue: any = value;
    if (type === 'checkbox') {
      newValue = (e.target as HTMLInputElement).checked ? 1 : 0;
    }
    
    const newData = { ...formData, [name]: newValue };
    setFormData(newData);
    setSaveStatus('saving');

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      autoSave(newData);
    }, 1200);
  };

  return {
    formData,
    loading,
    saveStatus,
    handleChange,
    setFormData
  };
}
