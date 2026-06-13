import React, { useState, useEffect, useCallback } from 'react';
import { perfilApi } from '../services/perfilApi';
import { UserProfile } from './useProfileData';

export function useProfileAvisos(profile: UserProfile | null) {
  const [avisosConfig, setAvisosConfig] = useState<any>(null);
  const [avisosLoading, setAvisosLoading] = useState(false);

  const loadAvisos = useCallback(async (email: string) => {
    setAvisosLoading(true);
    try {
      const data = await perfilApi.loadAvisos(email);
      setAvisosConfig(data);
    } catch (err) {
      console.error('Error cargando avisos:', err);
    } finally {
      setAvisosLoading(false);
    }
  }, []);

  useEffect(() => {
    if (profile?.email) {
      loadAvisos(profile.email);
    }
  }, [profile?.email, loadAvisos]);

  const toggleAvisoMaestro = async (avisoId: number, currentVal: number) => {
    if (!profile || !avisosConfig) return;
    const newVal = currentVal === 1 ? 0 : 1;
    setAvisosConfig((prev: any) => ({
      ...prev,
      userPrefs: { ...prev.userPrefs, [avisoId]: newVal }
    }));
    try {
      await perfilApi.saveAviso(profile.email, {
        tipo: 'maestro',
        avisoId,
        activo: newVal
      });
    } catch {
      console.error('Error al guardar aviso maestro');
    }
  };

  const toggleAvisoLabor = async (laborId: number, currentVal: number) => {
    if (!profile || !avisosConfig) return;
    const newVal = currentVal === 1 ? 0 : 1;
    setAvisosConfig((prev: any) => ({
      ...prev,
      userLaboresPrefs: { ...prev.userLaboresPrefs, [laborId]: newVal }
    }));
    try {
      await perfilApi.saveAviso(profile.email, {
        tipo: 'labor',
        laborId,
        activo: newVal
      });
    } catch {
      console.error('Error al guardar aviso labor');
    }
  };

  return {
    avisosConfig,
    avisosLoading,
    toggleAvisoMaestro,
    toggleAvisoLabor,
    loadAvisos
  };
}
