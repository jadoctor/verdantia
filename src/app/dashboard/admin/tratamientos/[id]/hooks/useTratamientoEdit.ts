import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { tratamientoEditApi } from '../services/tratamientoEditApi';
import { useTratamientoPhotos } from './useTratamientoPhotos';

const defaultFormData = {
  tratamientosactivo: 1,
  tratamientosnombre: '',
  tratamientostipo: 'ecológico',
  tratamientosdescripcion: '',
  tratamientospreparacion: '',
  tratamientosprecauciones: '',
  partes: [] as number[]
};

export function useTratamientoEdit(id: string) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editPdfParam = searchParams.get('editPdf');

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState(() => {
    const tabParam = searchParams.get('tab');
    return tabParam && ['detalles', 'fotos', 'pdfs', 'blogs'].includes(tabParam) ? tabParam : 'detalles';
  });
  const [isFichaOpen, setIsFichaOpen] = useState(true);
  const [showAiModal, setShowAiModal] = useState(false);
  const [mediaRefreshTrigger, setMediaRefreshTrigger] = useState(0);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const [formData, setFormData] = useState<any>(defaultFormData);
  const [initialData, setInitialData] = useState<any>(defaultFormData);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [plantasParteCatalog, setPlantasParteCatalog] = useState<any[]>([]);

  const { photos, refreshPhotos } = useTratamientoPhotos(id, userEmail);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Responsive detection
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const checkResize = () => setIsMobile(window.innerWidth <= 768);
      checkResize();
      window.addEventListener('resize', checkResize);
      return () => window.removeEventListener('resize', checkResize);
    }
  }, []);

  // Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.email) {
        setUserEmail(user.email);
        setAuthReady(true);
      } else {
        router.push('/login');
      }
    });
    return () => unsubscribe();
  }, [router]);

  // Initial data load
  useEffect(() => {
    if (authReady && userEmail) {
      fetchCatalogos();
      if (id !== 'nuevo') {
        fetchTratamiento();
      } else {
        setLoading(false);
      }
    }
  }, [authReady, userEmail, id]);

  const fetchCatalogos = async () => {
    try {
      const data = await tratamientoEditApi.fetchPlantasParte(userEmail || '');
      setPlantasParteCatalog(data.plantaspartes || []);
    } catch (error) {
      console.error('Error fetching catalogos:', error);
    }
  };

  const fetchTratamiento = async () => {
    setLoading(true);
    try {
      const data = await tratamientoEditApi.fetchTratamiento(userEmail || '');
      const tratamiento = data.tratamientos?.find((t: any) => t.idtratamientos.toString() === id);
      if (tratamiento) {
        const loadedData = {
          tratamientosactivo: tratamiento.tratamientosactivo ?? 1,
          tratamientosnombre: tratamiento.tratamientosnombre || '',
          tratamientostipo: tratamiento.tratamientostipo || 'ecológico',
          tratamientosdescripcion: tratamiento.tratamientosdescripcion || '',
          tratamientospreparacion: tratamiento.tratamientospreparacion || '',
          tratamientosprecauciones: tratamiento.tratamientosprecauciones || '',
          tratamientosdosis: tratamiento.tratamientosdosis || '',
          tratamientosfrecuencia: tratamiento.tratamientosfrecuencia || '',
          tratamientosaccion: tratamiento.tratamientosaccion || '',
          tratamientoscarencia: tratamiento.tratamientoscarencia || '',
          tratamientosmecanismo: tratamiento.tratamientosmecanismo || '',
          partes: tratamiento.partes ? tratamiento.partes.map((p: any) => p.idplantasparte) : []
        };
        setFormData(loadedData);
        setInitialData(loadedData);
      }
    } catch (error) {
      console.error('Error fetching tratamiento:', error);
    } finally {
      setLoading(false);
    }
  };

  const autoSave = async (dataToSave: any) => {
    setSaveStatus('saving');
    try {
      if (id === 'nuevo') {
        const data = await tratamientoEditApi.saveTratamiento(id, dataToSave, userEmail || '');
        if (data.id) {
          router.replace(`/dashboard/admin/tratamientos/${data.id}`);
        }
      } else {
        await tratamientoEditApi.saveTratamiento(id, dataToSave, userEmail || '');
        setInitialData(dataToSave);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      }
    } catch (error) {
      console.error('Error in autoSave:', error);
      setSaveStatus('idle');
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

  const handleMultiSelectChange = (name: string, value: string) => {
    setFormData((prev: any) => {
      const currentValues = prev[name] ? prev[name].split(', ') : [];
      let newValues;
      if (currentValues.includes(value)) {
        newValues = currentValues.filter((v: string) => v !== value);
      } else {
        newValues = [...currentValues, value];
      }
      const newData = { ...prev, [name]: newValues.join(', ') };
      
      setSaveStatus('saving');
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        autoSave(newData);
      }, 1200);

      return newData;
    });
  };

  const handleParteToggle = (idparte: number) => {
    const currentPartes = formData.partes || [];
    const newPartes = currentPartes.includes(idparte)
      ? currentPartes.filter((pid: number) => pid !== idparte)
      : [...currentPartes, idparte];

    const newData = { ...formData, partes: newPartes };
    setFormData(newData);
    setSaveStatus('saving');

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      autoSave(newData);
    }, 1200);
  };

  const handleDelete = async () => {
    if (!id || id === 'nuevo') return;
    if (!confirm('¿Seguro que quieres eliminar este tratamiento?')) return;
    try {
      await tratamientoEditApi.deleteTratamiento(id, userEmail || '');
      router.push('/dashboard/admin/tratamientos');
    } catch (error) {
      console.error('Error deleting tratamiento:', error);
    }
  };

  const handleSetPrimaryPhoto = async (photoId: number) => {
    if (!userEmail || id === 'nuevo') return;
    try {
      await tratamientoEditApi.setPrimaryPhoto(id, photoId, userEmail);
      refreshPhotos();
    } catch (e) {
      console.error(e);
    }
  };

  const triggerMediaRefresh = () => setMediaRefreshTrigger(p => p + 1);

  return {
    router,
    searchParams,
    editPdfParam,
    userEmail,
    authReady,
    isMobile,
    activeTab,
    setActiveTab,
    isFichaOpen,
    setIsFichaOpen,
    showAiModal,
    setShowAiModal,
    mediaRefreshTrigger,
    triggerMediaRefresh,
    deleteConfirm,
    setDeleteConfirm,
    formData,
    setFormData,
    loading,
    saveStatus,
    plantasParteCatalog,
    photos,
    refreshPhotos,
    handleChange,
    handleMultiSelectChange,
    handleParteToggle,
    handleDelete,
    handleSetPrimaryPhoto,
    autoSave
  };
}
