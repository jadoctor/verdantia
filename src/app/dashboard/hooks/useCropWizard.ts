'use client';

import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase/config';
import {
  fetchCatalogo,
  fetchCatalogoVariedades,
  fetchNextSeedNumero,
  createSeed,
  createCrop,
  updateSeed
} from '../services/dashboardApi';

interface CropFormData {
  origen: string;
  metodo: string;
  cantidad: number;
  ubicacion: string;
  fechaInicio: string;
  xcultivosidsemillas: string | number;
  semillaslugarcompra: string;
  semillasmarca: string;
  semillasfechaenvasado: string;
  semillasfechacaducidad: string;
  semillascantidad: string;
  crearBanco: boolean;
}

export function useCropWizard(misSemillas: any[], onSuccess: () => void) {
  const [showCropWizard, setShowCropWizard] = useState(false);
  const [cropWizardStep, setCropWizardStep] = useState(1);
  const [cropWizardEspecies, setCropWizardEspecies] = useState<any[]>([]);
  const [cropWizardVariedades, setCropWizardVariedades] = useState<any[]>([]);
  const [selectedCropEspecie, setSelectedCropEspecie] = useState<any | null>(null);
  const [selectedCropVariedad, setSelectedCropVariedad] = useState<any | null>(null);
  const [cropSearchTerm, setCropSearchTerm] = useState('');
  const [cropAcquiring, setCropAcquiring] = useState(false);
  const [cropNextNumero, setCropNextNumero] = useState<number | null>(null);

  const [cropFormData, setCropFormData] = useState<CropFormData>({
    origen: 'semilla_inventario',
    metodo: 'semillero',
    cantidad: 10,
    ubicacion: '',
    fechaInicio: new Date().toISOString().split('T')[0],
    xcultivosidsemillas: '',
    semillaslugarcompra: '',
    semillasmarca: '',
    semillasfechaenvasado: '',
    semillasfechacaducidad: '',
    semillascantidad: '',
    crearBanco: false
  });

  const [cropInputGramos, setCropInputGramos] = useState<string>('');
  const [cropCustomSemillasPorGramo, setCropCustomSemillasPorGramo] = useState<string>('');

  const handleCropGramosChange = (gramosVal: string, semPorGramoVal?: string) => {
    setCropInputGramos(gramosVal);
    
    const pesos1000 = selectedCropEspecie?.especiespeso1000semillas;
    let rate = 0;
    if (pesos1000 && Number(pesos1000) > 0) {
      rate = 1000 / Number(pesos1000);
    } else {
      rate = Number(semPorGramoVal !== undefined ? semPorGramoVal : cropCustomSemillasPorGramo) || 0;
    }

    if (rate > 0 && gramosVal !== '') {
      const calculated = Math.round(parseFloat(gramosVal) * rate);
      setCropFormData(prev => ({
        ...prev,
        semillascantidad: String(calculated)
      }));
    }
  };

  const getSemillaStock = (idVariedad: number) => {
    const seeds = misSemillas.filter(s => 
      Number(s.xsemillasidvariedadesvegetales) === Number(idVariedad) && 
      (s.semillasstockactual === null || s.semillasstockactual > 0) && 
      s.semillasactivosino !== 0
    );
    if (seeds.length === 0) return null;
    const total = seeds.reduce((acc, s) => acc + (s.semillasstockactual || 0), 0);
    return {
      lotesCount: seeds.length,
      totalStock: total,
      seedsList: seeds
    };
  };

  const openCropWizard = async () => {
    setShowCropWizard(true);
    setCropWizardStep(1);
    setSelectedCropEspecie(null);
    setSelectedCropVariedad(null);
    setCropSearchTerm('');
    setCropInputGramos('');
    setCropCustomSemillasPorGramo('');
    setCropFormData({
      origen: '',
      metodo: '',
      cantidad: 10,
      ubicacion: '',
      fechaInicio: new Date().toISOString().split('T')[0],
      xcultivosidsemillas: '',
      semillaslugarcompra: '',
      semillasmarca: '',
      semillasfechaenvasado: '',
      semillasfechacaducidad: '',
      semillascantidad: '',
      crearBanco: false
    });

    try {
      const email = auth.currentUser?.email;
      if (!email) return;

      const especies = await fetchCatalogo(email);
      setCropWizardEspecies(especies);

      const nextNum = await fetchNextSeedNumero(email);
      setCropNextNumero(nextNum);
    } catch (e) {
      console.error('Error opening crop wizard:', e);
    }
  };

  const selectCropEspecie = async (esp: any) => {
    setSelectedCropEspecie(esp);
    setCropWizardStep(2);
    try {
      const email = auth.currentUser?.email;
      if (!email) return;

      const vars = await fetchCatalogoVariedades(email, esp.idespeciesvegetales);
      setCropWizardVariedades(vars);
      if (vars.length === 1) {
        selectCropVariedad(vars[0]);
      } else if (vars.length > 0) {
        const gold = vars.find((v: any) => v.variedadesvegetalesesgenerica === 1);
        if (gold) {
          setSelectedCropVariedad(gold);
        }
      }
    } catch (e) {
      console.error('Error loading varieties for crop:', e);
    }
  };

  const selectCropVariedad = (v: any) => {
    setSelectedCropVariedad(v);
    setCropWizardStep(3);
    setCropFormData(prev => ({
      ...prev,
      metodo: '',
      origen: '',
      xcultivosidsemillas: ''
    }));
  };

  const handleSaveCrop = async () => {
    if (!selectedCropVariedad || cropAcquiring) return;
    setCropAcquiring(true);

    try {
      const email = auth.currentUser?.email;
      if (!email) return;

      let seedId = null;

      if (cropFormData.origen === 'semilla_nueva') {
        const seedBody: any = {
          xsemillasidvariedadesvegetales: selectedCropVariedad.idvariedadesvegetales,
          semillasorigen: 'sobre_comprado',
          semillaslugarcompra: cropFormData.semillaslugarcompra || null,
          semillasmarca: cropFormData.semillasmarca || null,
          semillasfechaenvasado: cropFormData.semillasfechaenvasado || null,
          semillasfechacaducidad: cropFormData.semillasfechacaducidad || null,
          semillasstock: 'medio'
        };

        if (cropFormData.crearBanco) {
          const totalCantidad = parseInt(cropFormData.semillascantidad) || 50;
          const plantedCantidad = parseInt(String(cropFormData.cantidad)) || 1;
          seedBody.semillasstockinicial = totalCantidad;
          seedBody.semillasstockactual = Math.max(0, totalCantidad - plantedCantidad);
          seedBody.semillasnumerocoleccion = cropNextNumero ? String(cropNextNumero) : null;
        }

        const seedRes = await createSeed(email, seedBody);
        if (seedRes.ok) {
          const seedData = await seedRes.json();
          seedId = seedData.id;
        }
      } else if (cropFormData.origen === 'semilla_inventario') {
        seedId = cropFormData.xcultivosidsemillas || null;
      }

      const cropRes = await createCrop(email, {
        xcultivosidvariedadesvegetales: selectedCropVariedad.idvariedadesvegetales,
        xcultivosidsemillas: seedId,
        cultivosorigen: cropFormData.origen,
        cultivosmetodo: cropFormData.metodo,
        cultivoscantidad: parseInt(String(cropFormData.cantidad)) || 1,
        cultivosubicacion: cropFormData.ubicacion || null,
        cultivosestado: cropFormData.fechaInicio > new Date().toISOString().split('T')[0] ? 'en_espera' : 'germinacion',
        cultivosfechainicio: cropFormData.fechaInicio || new Date().toISOString().split('T')[0]
      });

      if (cropRes.ok) {
        if (seedId && cropFormData.origen === 'semilla_inventario') {
          const seedToUpdate = misSemillas.find(s => s.idsemillas === seedId);
          if (seedToUpdate) {
            const newStock = Math.max(0, (seedToUpdate.semillasstockactual || 0) - (parseInt(String(cropFormData.cantidad)) || 0));
            await updateSeed(email, seedId, {
              ...seedToUpdate,
              semillasstockactual: newStock
            });
          }
        }

        setCropWizardStep(5);
        onSuccess();
        setTimeout(() => {
          setShowCropWizard(false);
          setCropWizardStep(1);
        }, 2200);
      } else {
        const errorData = await cropRes.json().catch(() => ({}));
        alert(errorData.error || 'Error al registrar el cultivo');
      }
    } catch (e) {
      console.error(e);
      alert('Error de conexión');
    } finally {
      setCropAcquiring(false);
    }
  };

  return {
    showCropWizard,
    setShowCropWizard,
    cropWizardStep,
    setCropWizardStep,
    cropWizardEspecies,
    cropWizardVariedades,
    selectedCropEspecie,
    selectedCropVariedad,
    cropSearchTerm,
    setCropSearchTerm,
    cropAcquiring,
    cropNextNumero,
    cropFormData,
    setCropFormData,
    cropInputGramos,
    cropCustomSemillasPorGramo,
    setCropCustomSemillasPorGramo,
    handleCropGramosChange,
    openCropWizard,
    selectCropEspecie,
    selectCropVariedad,
    handleSaveCrop,
    getSemillaStock
  };
}
