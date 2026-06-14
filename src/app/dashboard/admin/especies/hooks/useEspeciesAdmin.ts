import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { getEspecies, deleteEspecie, reactivateEspecie } from '../services/especiesApi';

export function useEspeciesAdmin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const focusParam = searchParams.get('focus');

  const [allEspecies, setAllEspecies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTipo, setFilterTipo] = useState('');
  const [filterFamilia, setFilterFamilia] = useState('');
  const [filter, setFilter] = useState<'activas' | 'inactivas' | 'todas'>('activas');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUserEmail(user?.email || null);
    });
    return () => unsubscribe();
  }, []);

  const loadEspecies = async () => {
    if (!userEmail) return;
    try {
      setLoading(true);
      const data = await getEspecies(userEmail, '', 'todas'); // Fetch all
      setAllEspecies(data.especies || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userEmail) {
      loadEspecies();
    }
  }, [userEmail]);

  useEffect(() => {
    if (!loading && focusParam) {
      setTimeout(() => {
        const element = document.getElementById(`especie-row-${focusParam}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 500);
    }
  }, [loading, focusParam]);

  const handleEdit = (id: string | null) => {
    if (id) {
      router.push(`/dashboard/admin/especies/${id}`);
    } else {
      router.push(`/dashboard/admin/especies/nueva`);
    }
  };

  const handleDelete = async (id: string, hasDependencies: boolean) => {
    const message = hasDependencies
      ? 'Esta especie tiene variedades específicas, semillas o cultivos asociados.\n\nNo se puede eliminar físicamente de la base de datos para no dañar sus registros, pero se INHABILITARÁ (dejará de estar visible en el catálogo general).\n\n¿Quieres inhabilitarla?'
      : '¿Estás seguro de que quieres eliminar esta especie?';

    if (!confirm(message)) return;
    if (!userEmail) return;
    try {
      const data = await deleteEspecie(id, userEmail);
      if (data.success) {
        loadEspecies();
      } else {
        alert('Error: ' + data.error);
      }
    } catch (e) {
      alert('Error eliminando la especie');
    }
  };

  const handleReactivate = async (id: string) => {
    if (!userEmail) return;
    try {
      await reactivateEspecie(id, userEmail);
      loadEspecies();
    } catch (e) {
      alert('Error al reactivar la especie');
    }
  };

  const activeFiltered = allEspecies.filter(e => {
    if (filter === 'activas') return e.especiesvisibilidadsino === 1;
    if (filter === 'inactivas') return e.especiesvisibilidadsino === 0;
    return true;
  });

  const countsStatus = {
    activas: allEspecies.filter(e => e.especiesvisibilidadsino === 1).length,
    inactivas: allEspecies.filter(e => e.especiesvisibilidadsino === 0).length,
    todas: allEspecies.length,
  };

  const counts = {
    '': activeFiltered.length,
    'hortaliza': activeFiltered.filter(e => e.especiestipo?.includes('hortaliza')).length,
    'fruta': activeFiltered.filter(e => e.especiestipo?.includes('fruta')).length,
    'aromatica': activeFiltered.filter(e => e.especiestipo?.includes('aromatica')).length,
    'leguminosa': activeFiltered.filter(e => e.especiestipo?.includes('leguminosa')).length,
    'cereal': activeFiltered.filter(e => e.especiestipo?.includes('cereal')).length,
    'otra': activeFiltered.filter(e => e.especiestipo?.includes('otra')).length,
  };

  const especies = activeFiltered.filter(e => {
    if (filterTipo && !e.especiestipo?.includes(filterTipo)) return false;
    if (filterFamilia && e.xespeciesidfamilias?.toString() !== filterFamilia) return false;
    return true;
  });

  const uniqueFamiliasMap = new Map();
  allEspecies.forEach(e => {
    if (e.xespeciesidfamilias && e.familiasnombre) {
      if (!uniqueFamiliasMap.has(e.xespeciesidfamilias)) {
        uniqueFamiliasMap.set(e.xespeciesidfamilias, { 
          id: e.xespeciesidfamilias, 
          nombre: e.familiasnombre, 
          emoji: e.familiasemoji, 
          count: 0 
        });
      }
      uniqueFamiliasMap.get(e.xespeciesidfamilias).count += 1;
    }
  });
  const uniqueFamilias = Array.from(uniqueFamiliasMap.values()).sort((a: any, b: any) => a.nombre.localeCompare(b.nombre));

  return {
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
    userEmail,
    handleEdit,
    handleDelete,
    handleReactivate,
    loadEspecies,
    isMobile
  };
}
