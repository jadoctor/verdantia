import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { tratamientosApi } from '../services/tratamientosApi';

export function useTratamientos() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [tratamientos, setTratamientos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsMobile(window.innerWidth < 768);
      const savedSort = sessionStorage.getItem('tratamientosSortConfig');
      if (savedSort) {
        try { setSortConfig(JSON.parse(savedSort)); } catch (e) {}
      }
    }
  }, []);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    const newConfig = { key, direction };
    setSortConfig(newConfig);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('tratamientosSortConfig', JSON.stringify(newConfig));
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.email) {
        setUserEmail(user.email);
      } else {
        setUserEmail(null);
        router.push('/login');
      }
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (userEmail) {
      fetchTratamientos();
    }
  }, [userEmail]);

  const fetchTratamientos = async () => {
    setLoading(true);
    try {
      const data = await tratamientosApi.getTratamientos(userEmail || '');
      setTratamientos(data.tratamientos || []);
    } catch (error) {
      console.error('Error fetching tratamientos:', error);
    } finally {
      setLoading(false);
    }
  };

  const parseTags = (val: string) => (val || '').split(',').map((s: string) => s.trim().toLowerCase()).filter(Boolean);

  const getCompleteness = (t: any) => {
    const FIELDS = ['tratamientosnombre','tratamientostipo','tratamientosaccion','tratamientosdosis','tratamientosfrecuencia','tratamientoscarencia','tratamientosmecanismo','tratamientosdescripcion','tratamientospreparacion','tratamientosprecauciones'];
    let pts = 0;
    FIELDS.forEach(f => { if (t[f] && String(t[f]).trim().length > 0) pts++; });
    if (t.partes && t.partes.length > 0) pts++;
    pts += Math.min(t.photosCount || 0, 4);
    pts += Math.min(t.pdfsCount || 0, 4);
    const pct = Math.round((pts / 23) * 100);
    const color = pct < 40 ? '#ef4444' : pct < 75 ? '#f59e0b' : pct < 100 ? '#10b981' : '#8b5cf6';
    return { pct, color };
  };

  const countByTag = (field: string, tag: string) => tratamientos.filter(t => parseTags(t[field]).includes(tag)).length;

  const filteredTratamientos = tratamientos.filter(t => {
    const matchSearch = !searchTerm || 
      t.tratamientosnombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.tratamientostipo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.tratamientosaccion?.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchSearch) return false;
    if (activeFilter === 'all') return true;
    return parseTags(t.tratamientostipo).includes(activeFilter) || parseTags(t.tratamientosaccion).includes(activeFilter);
  });

  const sortedTratamientos = [...filteredTratamientos].sort((a, b) => {
    if (!sortConfig) return 0;
    const { key, direction } = sortConfig;
    
    let valA: any, valB: any;
    if (key === '_completeness') {
      valA = getCompleteness(a).pct;
      valB = getCompleteness(b).pct;
    } else {
      valA = a[key] || '';
      valB = b[key] || '';
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
    }
    
    if (valA < valB) return direction === 'asc' ? -1 : 1;
    if (valA > valB) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  return {
    tratamientos,
    loading,
    searchTerm,
    setSearchTerm,
    sortConfig,
    activeFilter,
    setActiveFilter,
    isMobile,
    handleSort,
    filteredTratamientos,
    sortedTratamientos,
    getCompleteness,
    countByTag,
    parseTags,
    router
  };
}
