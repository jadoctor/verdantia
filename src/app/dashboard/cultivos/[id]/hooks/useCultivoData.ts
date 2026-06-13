import { useState, useEffect, useCallback, useRef } from 'react';
import { cultivosApi } from '../services/cultivosApi';
import { processAlertas } from '@/lib/alertas-utils';
import { useCultivoPhases } from './useCultivoPhases';

export function useCultivoData(cultivoId: string, userEmail: string | null) {
  const [cultivo, setCultivo] = useState<any>(null);
  const [pautas, setPautas] = useState<any[]>([]);
  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  
  const [ignoredPautas, setIgnoredPautas] = useState<number[]>([]);
  const [forcedPautas, setForcedPautas] = useState<number[]>([]);
  
  const [avisosCompletados, setAvisosCompletados] = useState<any[]>([]);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [timeOffsetDays, setTimeOffsetDays] = useState<number>(0);

  const [phaseModal, setPhaseModal] = useState<any>(null);
  const [undoState, setUndoState] = useState<any>(null);
  const [showConsentModalForPhase, setShowConsentModalForPhase] = useState(false);

  const saveTimeoutRef = useRef<Record<string, NodeJS.Timeout>>({});

  useEffect(() => {
    return () => {
      const currentTimeouts = saveTimeoutRef.current;
      Object.keys(currentTimeouts).forEach(key => {
        if (currentTimeouts[key]) clearTimeout(currentTimeouts[key]);
      });
    };
  }, []);

  const loadCultivo = useCallback(async () => {
    if (!userEmail) return;
    try {
      setLoading(true);
      const data = await cultivosApi.get(cultivoId, userEmail);
      
      const c = data.cultivo;
      c.pautas = data.pautas || [];
      c.avisosCompletados = data.avisosCompletados || [];
      c.fotosLabores = data.fotosLabores || [];
      const alertas = processAlertas([c], isSimulating ? Date.now() + timeOffsetDays * 86400000 : undefined);
      c.avisos = alertas;
      
      setCultivo(c);
      setPautas(data.pautas || []);
      setAvisosCompletados(data.avisosCompletados || []);
      
      let ign = [];
      try { ign = typeof c.cultivosalertas_ignoradas === 'string' ? JSON.parse(c.cultivosalertas_ignoradas) : (c.cultivosalertas_ignoradas || []); } catch(e){}
      setIgnoredPautas(ign);

      let frc = [];
      try { frc = typeof c.cultivosalertas_forzadas === 'string' ? JSON.parse(c.cultivosalertas_forzadas) : (c.cultivosalertas_forzadas || []); } catch(e){}
      setForcedPautas(frc);

      setFormData({
        cultivosestado: c.cultivosestado || 'en_espera',
        cultivoscantidad: c.cultivoscantidad || 1,
        cultivosubicacion: c.cultivosubicacion || '',
        cultivosfechainicio: c.cultivosfechainicio ? new Date(c.cultivosfechainicio).toISOString().split('T')[0] : '',
        cultivosfechagerminacion: c.cultivosfechagerminacion ? new Date(c.cultivosfechagerminacion).toISOString().split('T')[0] : '',
        cultivosfechatrasplante: c.cultivosfechatrasplante ? new Date(c.cultivosfechatrasplante).toISOString().split('T')[0] : '',
        cultivosfechacrecimiento: c.cultivosfechacrecimiento ? new Date(c.cultivosfechacrecimiento).toISOString().split('T')[0] : '',
        cultivosfechafructificacion: c.cultivosfechafructificacion ? new Date(c.cultivosfechafructificacion).toISOString().split('T')[0] : '',
        cultivosfecharecoleccion: c.cultivosfecharecoleccion ? new Date(c.cultivosfecharecoleccion).toISOString().split('T')[0] : '',
        cultivosfechafinalizacion: c.cultivosfechafinalizacion ? new Date(c.cultivosfechafinalizacion).toISOString().split('T')[0] : '',
        cultivosobservaciones: c.cultivosobservaciones || ''
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [userEmail, cultivoId, isSimulating, timeOffsetDays]);

  useEffect(() => {
    loadCultivo();
  }, [loadCultivo]);

  const saveField = async (field: string, value: any) => {
    if (!userEmail) return;
    setSaveStatus('saving');
    try {
      await cultivosApi.update(cultivoId, userEmail, { [field]: value });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (e) {
      console.error(e);
      setSaveStatus('idle');
    }
  };

  const handleMarkAsDone = async (idpauta: number, fase: string, fechaEmision: string | null) => {
    if (isSimulating || !userEmail) return;
    if (!window.confirm('¿Marcar esta labor como completada?')) return;
    
    try {
      await cultivosApi.completarLabor(cultivoId, userEmail, { idpauta, fase, fechaEmision });
      await loadCultivo();
    } catch (e) {
      console.error(e);
      alert('Error al completar labor');
    }
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Si el name empieza por fase_, es una fecha de fase
    if (name.startsWith('fase_')) {
      const idfase = parseInt(name.split('_')[1], 10);
      
      // Update local state for immediate feedback
      setCultivo((prev: any) => ({
        ...prev,
        fases_historial: {
          ...(prev?.fases_historial || {}),
          [idfase]: value
        }
      }));

      // Directly save the phase to backend
      setSaveStatus('saving');
      try {
        await cultivosApi.updatePhase(cultivoId, userEmail!, idfase, value);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (e) {
        console.error(e);
        setSaveStatus('idle');
      }
      return;
    }

    let updates: any = { [name]: value };
    if (name === 'cultivosestado') {
      // Dejamos que el usuario decida el estado, no auto-rellenamos fechas
      saveField('cultivosestado', value);
    }
    
    setFormData((prev: any) => ({ ...prev, ...updates }));

    if (saveTimeoutRef.current[name]) clearTimeout(saveTimeoutRef.current[name]);

    const isDate = e.target.tagName === 'INPUT' && (e.target as HTMLInputElement).type === 'date';
    const isSelect = e.target.tagName === 'SELECT';

    if (isDate || isSelect) {
      saveField(name, value);
    } else {
      saveTimeoutRef.current[name] = setTimeout(() => {
        saveField(name, value);
      }, 800);
    }
  };

  const handleBlurSave = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (saveTimeoutRef.current[name]) clearTimeout(saveTimeoutRef.current[name]);
    saveField(name, value);
  };

  const handleOpenPhaseModal = (field: string, title: string, idfase?: number) => {
    const today = new Date().toISOString().split('T')[0];
    
    let prevVal = formData[field];
    if (field.startsWith('fase_') && idfase) {
      prevVal = cultivo?.fases_historial?.[idfase] || '';
    }

    setPhaseModal({ 
      field, idfase, date: today, nota: '', open: true, title, previousValue: prevVal,
      isHarvest: title.toLowerCase().includes('recolección') || title.toLowerCase().includes('finalización'),
      cosechaCantidad: '',
      cosechaUnidad: 'kilos',
      cosechaEstrellas: 5
    });
  };

  const handleConfirmPhaseModal = async () => {
    if (!phaseModal) return;
    const { field, idfase, date, nota, title, isHarvest, cosechaCantidad, cosechaUnidad, cosechaEstrellas } = phaseModal;
    
    const updates: any = {};
    if (!field.startsWith('fase_')) {
      updates[field] = date;
    }

    let newObs = formData.cultivosobservaciones || '';
    if (isHarvest && cosechaCantidad) {
      newObs = `[🏆 Cosecha: ${cosechaCantidad} ${cosechaUnidad}] [⭐ ${cosechaEstrellas}/5]\n` + newObs;
    }
    
    if (nota.trim()) {
      const dateFormatted = new Date(date).toLocaleDateString('es-ES');
      newObs = `[${dateFormatted}] Fase de ${title} completada. Nota: ${nota.trim()}\n` + newObs;
    }
    
    if (newObs !== formData.cultivosobservaciones) {
      updates['cultivosobservaciones'] = newObs;
    }

    if (Object.keys(updates).length > 0) {
      setFormData((prev: any) => ({ ...prev, ...updates }));
    }

    setPhaseModal(null);

    // Subir foto si existe
    if (phaseModal.file) {
      try {
        const resConsent = await fetch('/api/user/consentimiento-foto', { headers: { 'x-user-email': userEmail! } });
        const dataConsent = await resConsent.json();
        
        if (dataConsent.consentimiento === 1) {
          const file = phaseModal.file;
          const { storage } = await import('@/lib/firebase/config');
          const { ref, uploadBytes } = await import('firebase/storage');
          
          const tempPath = `uploads/temp/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
          const storageRef = ref(storage, tempPath);
          await uploadBytes(storageRef, file);
          const rawStoragePath = storageRef.fullPath;

          await fetch(`/api/user/cultivos/${cultivoId}/photos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail! },
            body: JSON.stringify({ rawStoragePath, originalFilename: file.name, fase: title })
          });
        } else {
          alert('Debes aceptar las condiciones en la pestaña "Fotos" para poder adjuntar imágenes.');
        }
      } catch (e) {
        console.error('Error al subir foto del hito', e);
      }
    }

    setSaveStatus('saving');
    try {
      if (Object.keys(updates).length > 0) {
        await cultivosApi.update(cultivoId, userEmail!, updates);
      }
      
      if (field.startsWith('fase_') && idfase) {
        await cultivosApi.updatePhase(cultivoId, userEmail!, idfase, date);
      }

      setSaveStatus('saved');
      
      let undoToastId = setTimeout(() => setUndoState(null), 7000);
      setUndoState({
        field, idfase, oldDate: phaseModal.previousValue, oldObs: formData.cultivosobservaciones, timeoutId: undoToastId
      });
      loadCultivo(); // Recargar para ver la foto y nuevas fases
    } catch (e) {
      console.error(e);
      setSaveStatus('idle');
    }
  };

  const handleUndo = async () => {
    if (!undoState) return;
    clearTimeout(undoState.timeoutId);
    
    if (!undoState.field.startsWith('fase_')) {
      setFormData((prev: any) => ({
        ...prev, [undoState.field]: undoState.oldDate, cultivosobservaciones: undoState.oldObs
      }));
    }
    
    setSaveStatus('saving');
    try {
      if (!undoState.field.startsWith('fase_')) {
        await cultivosApi.update(cultivoId, userEmail!, {
          [undoState.field]: undoState.oldDate || null,
          cultivosobservaciones: undoState.oldObs || null
        });
      } else {
        await cultivosApi.updatePhase(cultivoId, userEmail!, undoState.idfase, undoState.oldDate || null);
        await cultivosApi.update(cultivoId, userEmail!, { cultivosobservaciones: undoState.oldObs || null });
      }
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
      loadCultivo();
    } catch (e) {
      console.error(e);
      setSaveStatus('idle');
    }
    setUndoState(null);
  };

  // Remove auto state transition, or base it on actual dynamic phases completed
  useEffect(() => {
    if (!cultivo || formData.cultivosestado === 'perdido') return;

    let newState = 'en_espera';
    if (formData.cultivosfechainicio) {
      newState = 'germinacion';
    }

    // A real auto-state transition could inspect cultivo.fases_historial
    // Since phases are dynamic, mapping them exactly to fixed strings ('recoleccion', 'fructificacion') is tricky.
    // For now, let the user change the state manually, or just leave it.
  }, [formData.cultivosfechainicio, formData.cultivosestado, cultivo]);

  const phaseLogic = useCultivoPhases(cultivo, isSimulating, timeOffsetDays);
  
  const cultivoConEstancamientos = cultivo ? {
    ...cultivo,
    avisos: {
      ...cultivo.avisos,
      alertasPendientes: [
        ...(cultivo.avisos?.alertasPendientes || []),
        ...(phaseLogic?.alertasEstancamiento || [])
      ]
    }
  } : null;

  return {
    cultivo: cultivoConEstancamientos, pautas, formData, setFormData, loading, saveStatus, setSaveStatus,
    ignoredPautas, setIgnoredPautas, forcedPautas, setForcedPautas,
    avisosCompletados, isSimulating, setIsSimulating, timeOffsetDays, setTimeOffsetDays,
    phaseModal, setPhaseModal, undoState, setUndoState, showConsentModalForPhase, setShowConsentModalForPhase,
    loadCultivo, saveField, handleMarkAsDone, handleChange, handleBlurSave, 
    handleOpenPhaseModal, handleConfirmPhaseModal, handleUndo
  };
}
