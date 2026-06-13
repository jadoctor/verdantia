'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import {
  fetchProfile,
  registerProfile,
  fetchMisLogros,
  fetchTodosLogros,
  fetchMisCultivos,
  fetchMisSemillas,
  fetchMisMensajes,
  deleteCrop,
  deleteSeed,
  updateSeed
} from '../services/dashboardApi';

export interface UserProfile {
  id: number;
  nombre: string;
  apellidos: string;
  email: string;
  roles: string;
  icono: string | null;
  estadoCuenta: string;
  nombreUsuario: string | null;
}

export function useDashboard() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [setupMessage, setSetupMessage] = useState('');
  const [misLogros, setMisLogros] = useState<any[]>([]);
  const [todosLogros, setTodosLogros] = useState<any[]>([]);
  const [misCultivos, setMisCultivos] = useState<any[]>([]);
  const [misSemillas, setMisSemillas] = useState<any[]>([]);
  const [misMensajesComunidad, setMisMensajesComunidad] = useState<any[]>([]);
  const [deletingCropId, setDeletingCropId] = useState<number | null>(null);
  const [deletingSeedId, setDeletingSeedId] = useState<number | null>(null);
  const [showCultivoDetalle, setShowCultivoDetalle] = useState(false);
  const [showSemillasDetalle, setShowSemillasDetalle] = useState(false);
  const [isLogrosExpanded, setIsLogrosExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();

  // 1. Restore state from sessionStorage on mount and setup resize check
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);

    const savedCultivo = sessionStorage.getItem('dashboard_showCultivoDetalle');
    if (savedCultivo === 'true') setShowCultivoDetalle(true);

    const savedSemillas = sessionStorage.getItem('dashboard_showSemillasDetalle');
    if (savedSemillas === 'true') setShowSemillasDetalle(true);
    
    const savedLogros = sessionStorage.getItem('dashboard_isLogrosExpanded');
    if (savedLogros === 'true') setIsLogrosExpanded(true);

    const savedScroll = sessionStorage.getItem('dashboard_scrollY');
    if (savedScroll) {
      setTimeout(() => {
        window.scrollTo({ top: parseInt(savedScroll, 10), behavior: 'instant' });
      }, 50);
    }

    const handleScroll = () => {
      sessionStorage.setItem('dashboard_scrollY', window.scrollY.toString());
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // 2. Persist state shifts in sessionStorage
  useEffect(() => {
    sessionStorage.setItem('dashboard_showCultivoDetalle', showCultivoDetalle.toString());
  }, [showCultivoDetalle]);

  useEffect(() => {
    sessionStorage.setItem('dashboard_showSemillasDetalle', showSemillasDetalle.toString());
  }, [showSemillasDetalle]);

  useEffect(() => {
    sessionStorage.setItem('dashboard_isLogrosExpanded', isLogrosExpanded.toString());
  }, [isLogrosExpanded]);

  // 3. Auto-expand achievements if returning from chat
  useEffect(() => {
    if (searchParams?.get('returnToLogros') === 'true') {
      setIsLogrosExpanded(true);
      setTimeout(() => {
        const el = document.getElementById('chat-requisito-btn');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.style.transition = 'box-shadow 0.3s ease-in-out';
          el.style.boxShadow = '0 0 0 4px rgba(56, 189, 248, 0.5)';
          setTimeout(() => {
            el.style.boxShadow = '';
          }, 2000);
        }
      }, 300);
    }
  }, [searchParams]);

  // 4. API loadProfile orchestrator
  const loadProfileData = async (email: string, uid: string) => {
    setLoading(true);
    try {
      const res = await fetchProfile(email);
      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile);
        setSetupMessage('');
        if (data.profile?.id) {
          const [logros, allLogros, cultivos, semillas, mensajes] = await Promise.all([
            fetchMisLogros(data.profile.id).catch(() => []),
            fetchTodosLogros().catch(() => []),
            fetchMisCultivos(email).catch(() => []),
            fetchMisSemillas(email).catch(() => []),
            fetchMisMensajes(email).catch(() => [])
          ]);
          setMisLogros(logros);
          setTodosLogros(allLogros);
          setMisCultivos(cultivos);
          setMisSemillas(semillas);

          const myMessages = mensajes.filter((m: any) => m.usuario_id === data.profile.id);
          setMisMensajesComunidad(myMessages);
        }
      } else if (res.status === 404) {
        try {
          await registerProfile(uid, email);
          const resRetry = await fetchProfile(email);
          if (resRetry.ok) {
            const dataRetry = await resRetry.json();
            setProfile(dataRetry.profile);
            setSetupMessage('');
          } else {
            setSetupMessage('Estamos configurando tu huerto. Por favor, recarga la página en unos segundos.');
          }
        } catch {
          setSetupMessage('No se pudo sincronizar tu perfil con la base de datos.');
        }
      } else {
        setSetupMessage('Error de conexión con el servidor. Pulsa "Reintentar" o recarga la página.');
      }
    } catch (err) {
      console.error('Error cargando perfil:', err);
      setSetupMessage('Error de red. Comprueba tu conexión y pulsa "Reintentar".');
    } finally {
      setLoading(false);
    }
  };

  // 5. Subscribe to Firebase Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login');
        return;
      }
      loadProfileData(user.email!, user.uid);
    });
    return () => unsubscribe();
  }, [router]);

  // 6. Action handlers
  const executeDeleteCrop = async (cropId: number) => {
    if (!profile?.email) return;
    try {
      const res = await deleteCrop(profile.email, cropId);
      if (res.ok) {
        setDeletingCropId(null);
        await loadProfileData(profile.email, auth.currentUser?.uid || '');
      } else {
        const data = await res.json();
        alert(data.error || 'Error al eliminar el cultivo');
        setDeletingCropId(null);
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión');
      setDeletingCropId(null);
    }
  };

  const executeDeleteSeed = async (seedId: number) => {
    if (!profile?.email) return;
    try {
      const res = await deleteSeed(profile.email, seedId);
      if (res.ok) {
        setDeletingSeedId(null);
        await loadProfileData(profile.email, auth.currentUser?.uid || '');
      } else {
        const data = await res.json();
        alert(data.error || 'Error al eliminar la semilla');
        setDeletingSeedId(null);
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión');
      setDeletingSeedId(null);
    }
  };

  const executeInactivateSeed = async (seedId: number) => {
    if (!profile?.email) return;
    try {
      const res = await updateSeed(profile.email, seedId, { semillasactivosino: 0 });
      if (res.ok) {
        await loadProfileData(profile.email, auth.currentUser?.uid || '');
      } else {
        const data = await res.json();
        alert(data.error || 'Error al inactivar la semilla');
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión');
    }
  };

  const reloadProfile = () => {
    const user = auth.currentUser;
    if (user && user.email) {
      loadProfileData(user.email, user.uid);
    }
  };

  return {
    profile,
    loading,
    setupMessage,
    misLogros,
    todosLogros,
    misCultivos,
    misSemillas,
    misMensajesComunidad,
    deletingCropId,
    setDeletingCropId,
    deletingSeedId,
    setDeletingSeedId,
    showCultivoDetalle,
    setShowCultivoDetalle,
    showSemillasDetalle,
    setShowSemillasDetalle,
    isLogrosExpanded,
    setIsLogrosExpanded,
    executeDeleteCrop,
    executeDeleteSeed,
    executeInactivateSeed,
    reloadProfile,
    router,
    isMobile
  };
}
