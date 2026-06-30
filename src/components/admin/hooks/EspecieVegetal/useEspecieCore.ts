import { useState, useCallback } from 'react';

export const defaultFormData = {
  especiesvegetalesnombre: '', especiesvegetalesnombrecientifico: '', xespeciesvegetalesidfamilias: '',
  especiestipo: [], especiesciclo: [], especiescolor: '', especiestamano: 'mediano',
  especiesviabilidadsemilla: '',
  especiestemperaturaminima: '', especiestemperaturaoptima: '',
  especiesmarcoplantas: '', especiesmarcofilas: '', especiesmarcomargen: '', especiesprofundidadsiembra: '',
  especiesfechasemillerodesde: '', especiesfechasemillerohasta: '',
  especiesfechasiembradirectadesde: '', especiesfechasiembradirectahasta: '',
  especiestrasplantedesde: '', especiestrasplantehasta: '',
  especiesfecharecolecciondesde: '', especiesfecharecoleccionhasta: '',
  especieshistoria: '', especiesvegetalesdescripcion: '', especiesfuentesinformacion: '',
  especiesautosuficiencia: '', especiesautosuficienciaparcial: '', especiesautosuficienciaconserva: '', especiesvegetalesvisibilidadsino: 1,
  especiesvegetalesicono: '', especiesorganocomestible: '', especiesbiodinamicanotas: '', especiesprofundidadtrasplante: '',
  especiesphminimosuelo: '', especiesphmaximosuelo: '', especiesnecesidadriego: '', especiestiposiembra: [], especiestiposiembrapreferente: [],
  especiesvolumenmaceta: '', especiesemillerovolumendesde: '', especiesemillerovolumenhasta: '', especiesluzsolar: '', especiescaracteristicassuelo: '', especiesdificultad: '', especiestemperaturamaxima: '',
  especiespreparacionconvencional: '', especiespreparacionminima: '', especiespreparacionnolaboreo: '',
  especiespeso1000semillas: '',
  especieslunarfasesiembra: '',
  especieslunarfasetrasplante: '',
  especieslunarobservaciones: '',
  especiesbiodinamicafasesiembra: '',
  especiesbiodinamicafasetrasplante: '',
  especiesresistenciahelada: '',
  especiesnecesidadtutoraje: '',
  especiesporteplanta: '',
  especiesrendimientoestimado: '',
  especiespartecosechable: [],
  especiesgerminaroscuridad: '',
  fases_duracion: {}
};

export function useEspecieCore(especieId: string | null, userEmail: string | null) {
  const [formData, setFormData] = useState<any>(defaultFormData);
  const [initialData, setInitialData] = useState<any>(defaultFormData);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'no-changes'>('idle');
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const isFormDirty = JSON.stringify(formData) !== JSON.stringify(initialData);

  const loadEspecie = useCallback(async (id: string) => {
    if (!userEmail) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/especiesvegetales/${id}`, {
        headers: { 'x-user-email': userEmail }
      });
      const data = await res.json();
      const especie = data.especie;
      if (especie) {
        const parsedEspecie = {
          ...especie,
          especiestemperaturaminima: especie.especiesvegetalestemperaturaminima !== null ? parseFloat(especie.especiesvegetalestemperaturaminima).toString() : '',
          especiestemperaturaoptima: especie.especiesvegetalestemperaturaoptima !== null ? parseFloat(especie.especiesvegetalestemperaturaoptima).toString() : '',
          especiesmarcoplantas: especie.especiesvegetalesmarcoplantas !== null ? parseInt(especie.especiesvegetalesmarcoplantas, 10).toString() : '',
          especiesmarcofilas: especie.especiesvegetalesmarcofilas !== null ? parseInt(especie.especiesvegetalesmarcofilas, 10).toString() : '',
          especiesmarcomargen: especie.especiesvegetalesmarcomargen !== null ? parseInt(especie.especiesvegetalesmarcomargen, 10).toString() : '',
          especiestipo: especie.especiesvegetalestipo ? especie.especiesvegetalestipo.split(',') : [],
          especiesciclo: especie.especiesvegetalesciclo ? especie.especiesvegetalesciclo.split(',') : [],
          especiestiposiembra: especie.especiesvegetalestiposiembra ? especie.especiesvegetalestiposiembra.split(',') : [],
          especiestiposiembrapreferente: especie.especiesvegetalestiposiembrapreferente ? especie.especiesvegetalestiposiembrapreferente.split(',') : [],
          especiesviabilidadsemilla: especie.especiesvegetalesviabilidadsemilla !== null ? parseFloat(especie.especiesvegetalesviabilidadsemilla).toString() : '',
          especiespeso1000semillas: especie.especiesvegetalespeso1000semillas !== null ? parseFloat(especie.especiesvegetalespeso1000semillas).toString() : '',
          especiespreparacionconvencional: especie.especiesvegetalespreparacionconvencional !== null && especie.especiesvegetalespreparacionconvencional !== undefined ? parseInt(especie.especiesvegetalespreparacionconvencional, 10).toString() : '',
          especiespreparacionminima: especie.especiesvegetalespreparacionminima !== null && especie.especiesvegetalespreparacionminima !== undefined ? parseInt(especie.especiesvegetalespreparacionminima, 10).toString() : '',
          especiespreparacionnolaboreo: especie.especiesvegetalespreparacionnolaboreo !== null && especie.especiesvegetalespreparacionnolaboreo !== undefined ? parseInt(especie.especiesvegetalespreparacionnolaboreo, 10).toString() : ''
        };
        setFormData(parsedEspecie);
        setInitialData(parsedEspecie);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [userEmail]);

  const saveFormData = useCallback(async (customFormData: any) => {
    if (!especieId || !userEmail) return;
    setSaveStatus('saving');
    const { fases_duracion, ...dataToSave } = customFormData;
    try {
      const res = await fetch(`/api/admin/especiesvegetales/${especieId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': userEmail
        },
        body: JSON.stringify(dataToSave)
      });
      const data = await res.json();
      if (data.success) {
        setInitialData(customFormData);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } else {
        setSaveStatus('idle');
      }
    } catch (e) {
      console.error('Error saving form data:', e);
      setSaveStatus('idle');
    }
  }, [especieId, userEmail]);

  const autoSaveFases = useCallback(async (fasesData: any) => {
    if (!especieId || !userEmail) return;
    setSaveStatus('saving');
    try {
      const res = await fetch(`/api/admin/especiesvegetales/${especieId}/fases`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': userEmail
        },
        body: JSON.stringify({ fases_duracion: fasesData })
      });
      const data = await res.json();
      if (data.success) {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } else {
        setSaveStatus('idle');
      }
    } catch (e) {
      console.error('Error in autoSaveFases:', e);
      setSaveStatus('idle');
    }
  }, [especieId, userEmail]);

  return {
    formData,
    setFormData,
    initialData,
    setInitialData,
    saveStatus,
    setSaveStatus,
    loading,
    setLoading,
    toastMessage,
    setToastMessage,
    isFormDirty,
    loadEspecie,
    saveFormData,
    autoSaveFases
  };
}
