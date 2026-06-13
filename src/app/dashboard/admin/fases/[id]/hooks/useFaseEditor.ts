import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { fasesApi, FaseFormData } from '../services/fasesApi';

export function useFaseEditor(id: string) {
  const router = useRouter();
  const isNew = id === 'nueva';

  const [formData, setFormData] = useState<FaseFormData>({
    fasescultivoclave: '',
    fasescultivonombre: '',
    fasescultivoorden: 1,
    fasescultivocolor: '#3b82f6',
    fasescultivoicono: '🌱',
    fasescultivodescripcion: '',
    fasescultivoesfin: 0,
    fasescultivotipo: 'Fase',
    fasescultivodesde: '',
    fasescultivohasta: ''
  });

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [initialData, setInitialData] = useState<string>('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success'>('idle');
  const [hitosList, setHitosList] = useState<any[]>([]);
  const [allFasesList, setAllFasesList] = useState<any[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const checkResize = () => setIsMobile(window.innerWidth <= 768);
    checkResize();
    window.addEventListener('resize', checkResize);
    return () => window.removeEventListener('resize', checkResize);
  }, []);

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
    if (isNew) {
      setInitialData(JSON.stringify(formData));
    }
  }, [isNew]);

  // Cargar lista de hitos de la BD
  useEffect(() => {
    if (userEmail) {
      fasesApi.getAllFases(userEmail)
        .then(data => {
          if (data.fases) {
            setAllFasesList(data.fases);
            const hitos = data.fases.filter((f: any) => f.fasescultivotipo === 'Hito' || f.fasescultivotipo === 'Hito Final');
            setHitosList(hitos);
          }
        })
        .catch(console.error);
    }
  }, [userEmail]);

  const loadFase = async () => {
    if (!userEmail) return;
    try {
      const data = await fasesApi.getFaseById(id, userEmail);
      if (data.fase) {
        const parsedFase = {
          ...data.fase,
          fasescultivodesde: data.fase.fasescultivodesde || '',
          fasescultivohasta: data.fase.fasescultivohasta || ''
        };
        setFormData(parsedFase);
        setInitialData(JSON.stringify(parsedFase));
      } else {
        alert('Fase no encontrada');
        router.push('/dashboard/admin/fases');
      }
    } catch (e) {
      console.error(e);
      alert('Error cargando la fase');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userEmail && !isNew) {
      loadFase();
    }
  }, [userEmail, isNew]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const target = e.target as HTMLInputElement;
    const { name, value, type, checked } = target;
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked ? 1 : 0 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'fasescultivotipo' ? { fasescultivoesfin: value === 'Hito Final' ? 1 : 0 } : {})
    }));
  };

  const handleSave = async (dataToSave: typeof formData, redirectAfterSave = false) => {
    if (!userEmail) return;
    const finalData = {
      ...dataToSave,
      fasescultivoesfin: dataToSave.fasescultivotipo === 'Hito Final' ? 1 : 0
    };
    setSaving(true);
    setSaveStatus('saving');
    try {
      const data = await fasesApi.saveFase(id, isNew, finalData, userEmail);
      if (data.success) {
        setInitialData(JSON.stringify(finalData));
        setSaveStatus('success');
        setTimeout(() => setSaveStatus('idle'), 1500);
        if (redirectAfterSave) {
          router.push('/dashboard/admin/fases');
        }
      } else {
        setSaveStatus('idle');
        console.error('Error al guardar:', data.error);
        if (redirectAfterSave) {
          alert('Error: ' + data.error);
        }
      }
    } catch (e) {
      console.error(e);
      setSaveStatus('idle');
      if (redirectAfterSave) {
        alert('Error al guardar la fase');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSaveManual = () => {
    if (!formData.fasescultivoclave || !formData.fasescultivonombre || !formData.fasescultivoorden) {
      alert('La clave, el nombre y el orden son obligatorios.');
      return;
    }
    handleSave(formData, true);
  };

  const hasChanges = JSON.stringify(formData) !== initialData;

  // Autosave Effect
  useEffect(() => {
    if (hasChanges && userEmail && !isNew && initialData) {
      const timer = setTimeout(() => {
        handleSave(formData, false);
      }, 800); // 800ms debounce
      return () => clearTimeout(timer);
    }
  }, [formData, hasChanges, userEmail, isNew, initialData]);

  return {
    isNew,
    formData,
    setFormData,
    loading,
    saving,
    isMobile,
    saveStatus,
    hitosList,
    allFasesList,
    router,
    handleChange,
    handleSelectChange,
    handleSaveManual
  };
}
