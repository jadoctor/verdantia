import { useState, useEffect, useMemo, useCallback } from 'react';
import { auth } from '@/lib/firebase/config';

export function usePendientes(tab: 'pendientes' | 'recursos') {
  const [pendientes, setPendientes] = useState<any[]>([]);
  const [userStats, setUserStats] = useState<Record<number, any>>({});
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<number | null>(null);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/asuntos-pendientes?tab=${tab}`);
      const data = await res.json();
      setPendientes(data.pendientes || []);
      setUserStats(data.userStats || {});
    } catch (e) {
      console.error('Error cargando pendientes:', e);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  const handleValidar = async (photoId: number) => {
    setProcessing(photoId);
    try {
      await fetch('/api/admin/asuntos-pendientes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoId, action: 'validar', adminEmail: auth.currentUser?.email }),
      });
      setPendientes(prev => prev.filter(p => p.id !== photoId));
      showToast('✅ Foto validada correctamente.');
    } catch (e) {
      console.error(e);
    } finally {
      setProcessing(null);
    }
  };

  const handleRestaurar = async (incidenciaId: number, p: any) => {
    setProcessing(incidenciaId);
    try {
      await fetch('/api/admin/incidencias', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: incidenciaId, estado: 'resuelta', notas: p.motivoRecurso + '\n\n--- RESOLUCIÓN (Admin) ---\nRecurso aceptado. Foto restaurada.' }),
      });
      await fetch('/api/admin/asuntos-pendientes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoId: p.photoId, action: 'validar', adminEmail: auth.currentUser?.email }),
      });
      setPendientes(prev => prev.filter(item => item.id !== incidenciaId));
      showToast('✅ Recurso aceptado. Foto restaurada.');
    } catch (e) {
      console.error(e);
    } finally {
      setProcessing(null);
    }
  };

  const groupedData = useMemo(() => {
    const groups: Record<string, any> = {};
    pendientes.forEach((p: any) => {
      const userKey = p.usuarioId ? `${p.usuarioId}-${p.usuarioNombre}` : `unknown-${p.usuarioNombre}`;
      if (!groups[userKey]) {
        groups[userKey] = {
          usuarioNombre: p.usuarioNombre || 'Usuario Desconocido',
          usuarioEmail: p.usuarioEmail || 'Sin email',
          usuarioId: p.usuarioId,
          usuarioFotoPerfil: p.usuarioFotoPerfil,
          motivos: {},
        };
      }
      let motivoKey = 'Foto de Perfil';
      if (p.fotoTipo === 'planta') {
        motivoKey = `Variedad: ${p.especieNombre || 'Sin especie'}${p.variedadNombre ? ` - ${p.variedadNombre}` : ''}`;
      } else if (p.fotoTipo === 'labor') {
        const especie = p.especieNombre || 'Sin especie';
        const variedad = p.variedadNombre ? ` - ${p.variedadNombre}` : '';
        let cultivoInfo = '';
        if (p.cultivoNumero) {
          const dateStr = p.cultivoFecha ? new Date(p.cultivoFecha).toLocaleDateString('es-ES') : '';
          cultivoInfo = `Cultivo Nº${p.cultivoNumero} ${dateStr ? `(${dateStr})` : ''} - `;
        } else {
          cultivoInfo = 'Cultivo: ';
        }
        motivoKey = `${cultivoInfo}${especie}${variedad}`.trim();
        if (motivoKey.startsWith('- ')) motivoKey = motivoKey.substring(2);
      }

      if (!groups[userKey].motivos[motivoKey]) {
        groups[userKey].motivos[motivoKey] = { nombre: motivoKey, labores: {} };
      }

      let laborKey = 'General (Planta/Variedad)';
      if (p.fotoTipo === 'labor') {
        if (p.laborNombre) {
          laborKey = `Labor Realizada: ${p.laborNombre}`;
        } else {
          let pendingName = 'Labor Pendiente';
          try {
            const resObj = typeof p.resumen === 'string' ? JSON.parse(p.resumen) : (p.resumen || {});
            if (resObj.pending_fechaEmision) pendingName += ` (${new Date(resObj.pending_fechaEmision).toLocaleDateString('es-ES')})`;
          } catch (e) {}
          laborKey = pendingName;
        }
      } else if (p.fotoTipo === 'perfil') {
        laborKey = 'Perfil de Usuario';
      }

      if (!groups[userKey].motivos[motivoKey].labores[laborKey]) {
        groups[userKey].motivos[motivoKey].labores[laborKey] = [];
      }
      groups[userKey].motivos[motivoKey].labores[laborKey].push(p);
    });
    return Object.values(groups);
  }, [pendientes]);

  return { pendientes, setPendientes, userStats, loading, processing, toast, showToast, load, handleValidar, handleRestaurar, groupedData };
}
