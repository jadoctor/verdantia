import React, { useState, useEffect, useCallback, useRef } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { useRouter } from 'next/navigation';
import { perfilApi } from '../services/perfilApi';

export interface UserProfile {
  id: number;
  nombre: string;
  apellidos: string;
  email: string;
  roles: string;
  icono: string | null;
  codigoPostal: string | null;
  poblacion: string | null;
  estadoCuenta: string;
  nombreUsuario: string | null;
  pais: string | null;
  fechaNacimiento: string | null;
  suscripcion?: string;
  esPrueba?: boolean;
  fechaCaducidadSuscripcion?: string | null;
  passkeysCount?: number;
}

export function useProfileData() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const router = useRouter();

  // Form states
  const [nombre, setNombre] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [pais, setPais] = useState('');
  const [codigoPostal, setCodigoPostal] = useState('');
  const [poblacion, setPoblacion] = useState('');
  const [icono, setIcono] = useState('');
  const [sexo, setSexo] = useState('');
  const [editableEmail, setEditableEmail] = useState('');
  const [domicilio, setDomicilio] = useState('');
  const [telefono, setTelefono] = useState('');
  const [tipoCalendario, setTipoCalendario] = useState('Normal');
  const [tipoLaboreo, setTipoLaboreo] = useState('Convencional');
  const [camaCultivoBilateral, setCamaCultivoBilateral] = useState(1.20);
  const [camaCultivoUnilateral, setCamaCultivoUnilateral] = useState(0.75);
  const [pasillo, setPasillo] = useState(0.50);
  const [collapsedMandatory, setCollapsedMandatory] = useState(false);
  const [collapsedOptional, setCollapsedOptional] = useState(false);

  // Autocomplete states
  const [cpSuggestions, setCpSuggestions] = useState<{cp: string; ciudad: string}[]>([]);
  const [ciudadSuggestions, setCiudadSuggestions] = useState<{cp: string; ciudad: string}[]>([]);
  const [showCpDropdown, setShowCpDropdown] = useState(false);
  const [showCiudadDropdown, setShowCiudadDropdown] = useState(false);
  const [showCpDropdownOpt, setShowCpDropdownOpt] = useState(false);
  const [showCiudadDropdownOpt, setShowCiudadDropdownOpt] = useState(false);
  const cpTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const ciudadTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Climate & Weather states
  const [geoData, setGeoData] = useState<any>(null);
  const [zonaClimatica, setZonaClimatica] = useState('');

  // Email Verification states
  const [verificationSentAt, setVerificationSentAt] = useState<string | null>(null);
  const [, setAuthTick] = useState(0);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  }, []);

  const searchLocation = async (query: string, type: 'cp' | 'ciudad', zone: 'mandatory' | 'optional' = 'mandatory') => {
    try {
      const data = await perfilApi.searchLocation(query, type);
      if (type === 'cp') { 
        setCpSuggestions(data.results); 
        if (zone === 'mandatory') setShowCpDropdown(data.results.length > 0);
        else setShowCpDropdownOpt(data.results.length > 0);
      } else { 
        setCiudadSuggestions(data.results); 
        if (zone === 'mandatory') setShowCiudadDropdown(data.results.length > 0);
        else setShowCiudadDropdownOpt(data.results.length > 0);
      }
    } catch { /* silently fail */ }
  };

  const autoSaveMultiple = async (fields: Record<string, any>) => {
    if (!profile) return;
    try {
      await perfilApi.updateProfile(profile.email, fields);
      showToast('✅ Guardado automáticamente');
    } catch { /* silencioso */ }
  };

  const autoSaveField = useCallback(async (fieldName: string, value: any) => {
    if (!profile) return;
    try {
      const data = await perfilApi.updateProfile(profile.email, { [fieldName]: value });
      if (data.success) {
        showToast('✅ Guardado automáticamente');
        const channel = new BroadcastChannel('verdantia_profile');
        channel.postMessage({ [fieldName]: value });
        window.dispatchEvent(new CustomEvent('profile_updated', { detail: { [fieldName]: value } }));
      } else if (data.error) {
        showToast('❌ ' + data.error);
      }
    } catch { /* silencioso */ }
  }, [profile, showToast]);

  const autoSaveIcon = async (newIcon: string | null) => {
    if (!profile) return;
    setIcono(newIcon || '');
    
    const channel = new BroadcastChannel('verdantia_profile');
    channel.postMessage({ icono: newIcon });
    window.dispatchEvent(new CustomEvent('profile_updated', { detail: { icono: newIcon } }));

    try {
      await perfilApi.updateProfile(profile.email, { icono: newIcon });
      showToast(newIcon ? '✅ Icono de perfil actualizado' : '✅ Icono eliminado. Ahora se mostrará tu foto.');
    } catch { /* silencioso */ }
  };

  const handleSexoChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSexo = e.target.value;
    setSexo(newSexo);
    await autoSaveField('sexo', newSexo);
  };

  const handleSave = async (privacidadAceptada: boolean) => {
    if (!profile) return;
    if (!privacidadAceptada) {
      showToast('⚠️ Debes aceptar la Política de Privacidad para guardar.');
      return;
    }
    setSaving(true);
    try {
      const updates = { apellidos, nombreUsuario, poblacion, domicilio, telefono };
      const data = await perfilApi.updateProfile(profile.email, updates);
      if (data.success) {
        showToast('✅ Perfil actualizado correctamente');
        const channel = new BroadcastChannel('verdantia_profile');
        channel.postMessage(updates);
        window.dispatchEvent(new CustomEvent('profile_updated', { detail: updates }));
      } else {
        showToast('❌ Error: ' + (data.error || 'Algo salió mal'));
      }
    } catch (err: any) {
      showToast('❌ Error de conexión: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleVerifyEmail = async () => {
    if (!profile?.email) return;

    const camposFaltantes: string[] = [];
    if (!fechaNacimiento) camposFaltantes.push('Fecha de Nacimiento');
    if (!sexo) camposFaltantes.push('Sexo');
    if (!nombreUsuario.trim()) camposFaltantes.push('Nombre de Usuario');
    if (!codigoPostal.trim()) camposFaltantes.push('Código Postal');
    if (!poblacion.trim()) camposFaltantes.push('Población');
    if (!pais.trim()) camposFaltantes.push('País');

    if (camposFaltantes.length > 0) {
      showToast(`⚠️ Para verificar tu correo, rellena: ${camposFaltantes.join(', ')}.`);
      return;
    }

    try {
      showToast('Enviando correo de verificación...');
      const data = await perfilApi.sendVerificationEmail(profile.email, nombre || 'Usuario', sexo);
      
      const now = new Date();
      const fechaEnvio = now.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' a las ' + now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
      setVerificationSentAt(fechaEnvio);
      showToast('📧 Correo de verificación enviado. Revisa tu bandeja de entrada.');
    } catch (err: any) {
      showToast('❌ ' + err.message);
    }
  };

  const calcularEdad = () => {
    if (!fechaNacimiento) return '';
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    if (isNaN(nacimiento.getTime())) return '';

    let years = hoy.getFullYear() - nacimiento.getFullYear();
    let months = hoy.getMonth() - nacimiento.getMonth();
    let days = hoy.getDate() - nacimiento.getDate();

    if (days < 0) {
      months--;
      const ultimoDiaMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth(), 0).getDate();
      days += ultimoDiaMesAnterior;
    }

    if (months < 0) {
      years--;
      months += 12;
    }

    const partes = [];
    if (years > 0) partes.push(`${years} año${years > 1 ? 's' : ''}`);
    if (months > 0) partes.push(`${months} mes${months > 1 ? 'es' : ''}`);
    if (days > 0) partes.push(`${days} día${days > 1 ? 's' : ''}`);

    if (partes.length === 0) return '📅 0 días';
    if (partes.length === 1) return `📅 ${partes[0]}`;
    if (partes.length === 2) return `📅 ${partes[0]} y ${partes[1]}`;
    return `📅 ${partes[0]}, ${partes[1]} y ${partes[2]}`;
  };

  const updateLiveHeaderName = (e: React.FormEvent<HTMLInputElement>) => {
    const channel = new BroadcastChannel('verdantia_profile');
    const target = e.target as HTMLInputElement;
    channel.postMessage({ nombreUsuario: target.value });
    window.dispatchEvent(new CustomEvent('profile_updated', { detail: { nombreUsuario: target.value } }));
  };

  const isFirebaseVerified = auth.currentUser?.emailVerified ?? false;

  useEffect(() => {
    if (auth.currentUser && !auth.currentUser.emailVerified) {
      auth.currentUser.reload().then(() => {
        window.dispatchEvent(new Event('auth_reloaded'));
      }).catch(() => {});
    }
  }, []);

  useEffect(() => {
    const handleAuthReload = () => setAuthTick(t => t + 1);
    window.addEventListener('auth_reloaded', handleAuthReload);
    return () => window.removeEventListener('auth_reloaded', handleAuthReload);
  }, []);

  const getClimateText = useCallback((lat: string | number, country: string) => {
    const latitude = Number(lat);
    const hemisphere = latitude >= 0 ? "Hemisferio Norte" : "Hemisferio Sur";
    let climate = "templada";
    
    if (country === 'España') {
      climate = "mediterránea/continental";
    } else if (Math.abs(latitude) > 23.5 && Math.abs(latitude) < 66.5) {
      climate = "templada";
    } else {
      climate = "tropical/subtropical";
    }
    
    return `Te encuentras en una zona ${climate}, correspondiente al calendario agrícola del ${hemisphere}. Verdantia utilizará esta ubicación para sincronizar tus siembras con los ciclos naturales de luz y temperatura de tu región, maximizando el éxito de tus cosechas.`;
  }, []);

  useEffect(() => {
    const loadGeo = () => {
      if (isFirebaseVerified && poblacion) {
        const zip = codigoPostal || '';
        const currentHour = new Date().getHours();
        const cacheKey = `v_weather_${zip}_${poblacion}_${new Date().toISOString().split('T')[0]}_H${currentHour}`;
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          try { 
            const wData = JSON.parse(cached);
            if (wData.lat && wData.lon) {
              setGeoData((prev: any) => JSON.stringify(prev) === JSON.stringify(wData) ? prev : wData);
              if (!zonaClimatica && pais) {
                const text = getClimateText(wData.lat, pais);
                setZonaClimatica(text);
                autoSaveField('zonaClimatica', text);
              }
            }
          } catch(e){}
        }
      } else {
        setGeoData(null);
      }
    };
    
    loadGeo();
    window.addEventListener('weather_updated', loadGeo);
    return () => window.removeEventListener('weather_updated', loadGeo);
  }, [isFirebaseVerified, poblacion, codigoPostal, zonaClimatica, pais, autoSaveField, getClimateText]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.push('/login'); return; }

      try {
        const data = await perfilApi.loadUserProfile(user.email!);
        const p = data.profile;
        setProfile(p);
        setNombre(p.nombre || '');
        setApellidos(p.apellidos || '');
        setNombreUsuario(p.nombreUsuario || '');
        let fn = p.fechaNacimiento || '';
        if (fn) {
          try {
            const d = new Date(fn);
            if (!isNaN(d.getTime())) {
              const yyyy = d.getFullYear();
              const mm = String(d.getMonth() + 1).padStart(2, '0');
              const dd = String(d.getDate()).padStart(2, '0');
              fn = `${yyyy}-${mm}-${dd}`;
            }
          } catch (e) {}
        }
        setFechaNacimiento(fn);
        setPais(p.pais || '');
        setCodigoPostal(p.codigoPostal || '');
        setPoblacion(p.poblacion || '');
        setIcono(p.icono || '');
        setZonaClimatica(p.zonaClimatica || '');
        setSexo(p.sexo || '');
        setEditableEmail(data.profile.email || '');
        setDomicilio(data.profile.domicilio || '');
        setTelefono(data.profile.telefono || '');
        setTipoCalendario(data.profile.tipoCalendario || 'Normal');
        setTipoLaboreo(data.profile.tipoLaboreo || 'Convencional');
        setCamaCultivoBilateral(parseFloat(data.profile.camaCultivoBilateral) || 1.20);
        setCamaCultivoUnilateral(parseFloat(data.profile.camaCultivoUnilateral) || 0.75);
        setPasillo(parseFloat(data.profile.pasillo) || 0.50);

        if (p.id && p.suscripcion && p.suscripcion.toLowerCase() !== 'gratuito') {
          perfilApi.checkPlanDegradation(p.id).then(result => {
            if (result.degraded && result.newPlan) {
              setProfile(prev => prev ? { ...prev, suscripcion: result.newPlan, esPrueba: result.newPlan !== 'Gratuito' } : null);
              showToast(`⏳ Tu plan ha cambiado a ${result.newPlan}. ${result.newPlan === 'Gratuito' ? 'El periodo de prueba ha finalizado.' : 'Siguiente mes: ' + result.newPlan + '.'}`);
            }
          }).catch(() => {});
        }
      } catch (err: any) {
        console.error('Error cargando perfil:', err);
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [router, showToast]);

  return {
    profile,
    setProfile,
    loading,
    saving,
    toast,
    showToast,
    nombre,
    setNombre,
    apellidos,
    setApellidos,
    nombreUsuario,
    setNombreUsuario,
    fechaNacimiento,
    setFechaNacimiento,
    pais,
    setPais,
    codigoPostal,
    setCodigoPostal,
    poblacion,
    setPoblacion,
    icono,
    setIcono,
    sexo,
    setSexo,
    editableEmail,
    setEditableEmail,
    domicilio,
    setDomicilio,
    telefono,
    setTelefono,
    tipoCalendario,
    setTipoCalendario,
    tipoLaboreo,
    setTipoLaboreo,
    camaCultivoBilateral,
    setCamaCultivoBilateral,
    camaCultivoUnilateral,
    setCamaCultivoUnilateral,
    pasillo,
    setPasillo,
    collapsedMandatory,
    setCollapsedMandatory,
    collapsedOptional,
    setCollapsedOptional,
    cpSuggestions,
    setCpSuggestions,
    ciudadSuggestions,
    setCiudadSuggestions,
    showCpDropdown,
    setShowCpDropdown,
    showCiudadDropdown,
    setShowCiudadDropdown,
    showCpDropdownOpt,
    setShowCpDropdownOpt,
    showCiudadDropdownOpt,
    setShowCiudadDropdownOpt,
    searchLocation,
    autoSaveField,
    autoSaveMultiple,
    autoSaveIcon,
    handleSexoChange,
    handleSave,
    calcularEdad,
    updateLiveHeaderName,
    geoData,
    zonaClimatica,
    verificationSentAt,
    setVerificationSentAt,
    handleVerifyEmail,
    isFirebaseVerified,
    cpTimeoutRef,
    ciudadTimeoutRef
  };
}
