'use client';

import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { getMediaUrl } from '@/lib/media-url';
import GardenMap from '@/components/user/GardenMap';
import { Trash2 } from 'lucide-react';
import { SeedWizardModal } from '@/components/SeedWizardModal';
import { SpeciesIcon } from '@/components/ui/SpeciesIcon';

interface UserProfile {
  id: number;
  nombre: string;
  apellidos: string;
  email: string;
  roles: string;
  icono: string | null;
  estadoCuenta: string;
  nombreUsuario: string | null;
}

export default function DashboardHome() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [setupMessage, setSetupMessage] = useState('');
  const [misLogros, setMisLogros] = useState<any[]>([]);
  const [todosLogros, setTodosLogros] = useState<any[]>([]);
  const [misCultivos, setMisCultivos] = useState<any[]>([]);
  const [misSemillas, setMisSemillas] = useState<any[]>([]);
  const [deletingCropId, setDeletingCropId] = useState<number | null>(null);
  const [deletingSeedId, setDeletingSeedId] = useState<number | null>(null);
  const [showCultivoDetalle, setShowCultivoDetalle] = useState(false);
  const router = useRouter();

  // Estados del asistente de semillas
  const [showSeedModal, setShowSeedModal] = useState(false);

  // Estados del asistente unificado de cultivo (emergente)
  const [showCropWizard, setShowCropWizard] = useState(false);
  const [cropWizardStep, setCropWizardStep] = useState(1);
  const [cropWizardEspecies, setCropWizardEspecies] = useState<any[]>([]);
  const [cropWizardVariedades, setCropWizardVariedades] = useState<any[]>([]);
  const [selectedCropEspecie, setSelectedCropEspecie] = useState<any | null>(null);
  const [selectedCropVariedad, setSelectedCropVariedad] = useState<any | null>(null);
  const [cropSearchTerm, setCropSearchTerm] = useState('');
  const [cropAcquiring, setCropAcquiring] = useState(false);
  const [cropNextNumero, setCropNextNumero] = useState<number | null>(null);

  // Datos del formulario de cultivo
  const [cropFormData, setCropFormData] = useState({
    origen: 'semilla_inventario', // 'semilla_inventario' | 'semilla_nueva' | 'plantel_comprado' | 'plantel_regalado' | 'esqueje'
    metodo: 'semillero', // 'semillero' | 'siembra_directa' | 'trasplante_directo'
    cantidad: 10,
    ubicacion: '',
    fechaInicio: new Date().toISOString().split('T')[0],
    
    // Si asocia lote existente
    xcultivosidsemillas: '' as string | number,

    // Si crea semilla nueva
    semillaslugarcompra: '',
    semillasmarca: '',
    semillasfechaenvasado: '',
    semillasfechacaducidad: '',
    semillascantidad: '',
    crearBanco: false
  });


  // Estados y calculadora de gramos a semillas para el Asistente de Cultivos
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

  const executeDeleteCrop = async (cropId: number) => {
    if (!profile?.email) return;
    try {
      const res = await fetch(`/api/user/cultivos/${cropId}`, {
        method: 'DELETE',
        headers: {
          'x-user-email': profile.email
        }
      });
      if (res.ok) {
        setDeletingCropId(null);
        loadProfile(profile.email, auth.currentUser?.uid || '');
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
      const res = await fetch(`/api/user/semillas/${seedId}`, {
        method: 'DELETE',
        headers: {
          'x-user-email': profile.email
        }
      });
      if (res.ok) {
        setDeletingSeedId(null);
        loadProfile(profile.email, auth.currentUser?.uid || '');
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
      const res = await fetch(`/api/user/semillas/${seedId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': profile.email
        },
        body: JSON.stringify({
          semillasactivosino: 0
        })
      });
      if (res.ok) {
        loadProfile(profile.email, auth.currentUser?.uid || '');
      } else {
        const data = await res.json();
        alert(data.error || 'Error al inactivar la semilla');
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión');
    }
  };

  const openSeedModal = () => {
    setShowSeedModal(true);
  };

  // Funciones del asistente de cultivo (emergente)
  const getSemillaStock = (idVariedad: number) => {
    const seeds = misSemillas.filter(s => 
      Number(s.xsemillasidvariedades) === Number(idVariedad) && 
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

      const res = await fetch('/api/user/catalogo', { headers: { 'x-user-email': email } });
      if (res.ok) {
        const data = await res.json();
        setCropWizardEspecies(data.especies || []);
      }

      const resNum = await fetch('/api/user/semillas/next-numero', { headers: { 'x-user-email': email } });
      if (resNum.ok) {
        const numData = await resNum.json();
        setCropNextNumero(numData.nextNumero);
      }
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

      const res = await fetch(`/api/user/catalogo/${esp.idespecies}/variedades`, { headers: { 'x-user-email': email } });
      if (res.ok) {
        const data = await res.json();
        const vars = data.variedades || [];
        setCropWizardVariedades(vars);
        if (vars.length === 1) {
          selectCropVariedad(vars[0]);
        } else if (vars.length > 0) {
          const gold = vars.find((v: any) => v.variedadesesgenerica === 1);
          if (gold) {
            setSelectedCropVariedad(gold);
          }
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

      // Si es una semilla nueva comprada, creamos primero la entrada en la tabla semillas
      if (cropFormData.origen === 'semilla_nueva') {
        const seedBody: any = {
          xsemillasidvariedades: selectedCropVariedad.idvariedades,
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

        const seedRes = await fetch('/api/user/semillas', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-user-email': email
          },
          body: JSON.stringify(seedBody)
        });

        if (seedRes.ok) {
          const seedData = await seedRes.json();
          seedId = seedData.id;
        }
      } else if (cropFormData.origen === 'semilla_inventario') {
        seedId = cropFormData.xcultivosidsemillas || null;
      }

      // Crear el cultivo
      const cropRes = await fetch('/api/user/cultivos', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-email': email
        },
        body: JSON.stringify({
          xcultivosidvariedades: selectedCropVariedad.idvariedades,
          xcultivosidsemillas: seedId,
          cultivosorigen: cropFormData.origen,
          cultivosmetodo: cropFormData.metodo,
          cultivoscantidad: parseInt(String(cropFormData.cantidad)) || 1,
          cultivosubicacion: cropFormData.ubicacion || null,
          cultivosestado: cropFormData.fechaInicio > new Date().toISOString().split('T')[0] ? 'en_espera' : (cropFormData.metodo === 'semillero' ? 'germinacion' : 'crecimiento'),
          cultivosfechainicio: cropFormData.fechaInicio || new Date().toISOString().split('T')[0]
        })
      });

      if (cropRes.ok) {
        // Decrementar el stock digital de semillas en inventario
        if (seedId && cropFormData.origen === 'semilla_inventario') {
          const seedToUpdate = misSemillas.find(s => s.idsemillas === seedId);
          if (seedToUpdate) {
            const newStock = Math.max(0, (seedToUpdate.semillasstockactual || 0) - (parseInt(String(cropFormData.cantidad)) || 0));
            await fetch(`/api/user/semillas/${seedId}`, {
              method: 'PUT',
              headers: { 
                'Content-Type': 'application/json',
                'x-user-email': email
              },
              body: JSON.stringify({
                ...seedToUpdate,
                semillasstockactual: newStock
              })
            });
          }
        }

        setCropWizardStep(5);
        if (profile?.email) {
          loadProfile(profile.email, auth.currentUser?.uid || '');
        }
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

  const loadProfile = async (email: string, uid: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/auth/profile?email=${encodeURIComponent(email)}`);
      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile);
        setSetupMessage('');
        if (data.profile?.id) {
          try {
            const [logrosRes, totalRes, cultivosRes, semillasRes] = await Promise.all([
              fetch(`/api/perfil/logros?userId=${data.profile.id}`),
              fetch('/api/admin/ajustes/logros'),
              fetch('/api/user/cultivos', { headers: { 'x-user-email': email } }),
              fetch('/api/user/semillas', { headers: { 'x-user-email': email } })
            ]);

            if (logrosRes.ok) {
              const logrosData = await logrosRes.json();
              setMisLogros(logrosData.logros || []);
            }
            if (totalRes.ok) {
              const totalData = await totalRes.json();
              setTodosLogros(Array.isArray(totalData) ? totalData : []);
            }
            if (cultivosRes.ok) {
              const cultivosData = await cultivosRes.json();
              setMisCultivos(cultivosData.cultivos || []);
            }
            if (semillasRes.ok) {
              const semillasData = await semillasRes.json();
              setMisSemillas(semillasData.semillas || []);
            }
          } catch (e) {
            console.error('Error fetching dashboard extra data:', e);
          }
        }
      } else if (res.status === 404) {
        try {
          await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uid, email, nombre: '', apellidos: '' }),
          });
          const resRetry = await fetch(`/api/auth/profile?email=${encodeURIComponent(email)}`);
          if (resRetry.ok) {
            const dataRetry = await resRetry.json();
            setProfile(dataRetry.profile);
            setSetupMessage('');
          } else {
            setSetupMessage('Estamos configurando tu huerto. Por favor, recarga la pagina en unos segundos.');
          }
        } catch {
          setSetupMessage('No se pudo sincronizar tu perfil con la base de datos.');
        }
      } else {
        setSetupMessage('Error de conexion con el servidor. Pulsa "Reintentar" o recarga la pagina.');
      }
    } catch (err) {
      console.error('Error cargando perfil:', err);
      setSetupMessage('Error de red. Comprueba tu conexion y pulsa "Reintentar".');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login');
        return;
      }
      loadProfile(user.email!, user.uid);
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (!loading && profile) {
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.get('startCrop') === 'true') {
        openCropWizard();
        const url = new URL(window.location.href);
        url.searchParams.delete('startCrop');
        window.history.replaceState({}, '', url.pathname + url.searchParams.toString());
      }
    }
  }, [loading, profile]);

  if (loading) return <p className="loading-text">Cargando tu huerto...</p>;

  const isSuperAdmin = profile?.roles?.includes('superadministrador');
  const displayName = profile?.nombreUsuario || profile?.nombre || auth.currentUser?.email?.split('@')[0] || 'Agricultor';

  return (
    <div className="welcome-section">
      {/* Onboarding Call to Action */}
      {profile && (!auth.currentUser?.emailVerified || !profile.nombre) && (
        <div className="card-storm" style={{
          background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
          color: '#064e3b',
          border: '2px solid #22c55e',
          padding: '2rem',
          marginBottom: '2rem',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 10px 25px rgba(34, 197, 94, 0.15)'
        }}>
          <h2 style={{ color: '#15803d', fontSize: '1.4rem', marginTop: 0 }}>
            ¡Bienvenido! Tu huerto te espera
          </h2>
          <p style={{ lineHeight: 1.6, color: '#166534', fontSize: '0.95rem', marginBottom: '1rem' }}>
            Actualmente tienes acceso al <strong>Plan Básico Gratuito</strong>.
          </p>
          
          <div style={{ backgroundColor: 'rgba(255,255,255,0.6)', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
            <p style={{ color: '#15803d', fontSize: '1rem', margin: '0 0 10px 0', fontWeight: 700 }}>
              🎁 ¡Completa tu perfil y obtén 1 MES GRATIS de Plan Premium!
            </p>
            <p style={{ color: '#166534', fontSize: '0.9rem', margin: '0 0 10px 0' }}>
              Desbloquea todas las funciones avanzadas al instante. <strong>No requiere tarjeta de crédito</strong>.
            </p>
            <p style={{ color: '#166534', fontSize: '0.85rem', margin: 0, lineHeight: 1.5 }}>
              <strong>¿Qué datos te pediremos y por qué?</strong><br/>
              Solo necesitamos tu nombre y algunos detalles sobre tu huerto (como tu nivel de experiencia o ubicación aproximada). Esto nos permite <strong>personalizar tus recomendaciones de cultivo</strong>, ajustar las alertas climáticas a tu zona y conectar mejor con la comunidad de Verdantia. ¡Tus datos siempre estarán seguros!
            </p>
          </div>
          <button
            onClick={() => router.push('/dashboard/onboarding')}
            type="button"
            style={{
              background: 'linear-gradient(to right, #10b981, #059669)',
              color: 'white', border: 'none', padding: '12px 24px',
              borderRadius: '8px', fontWeight: 700, cursor: 'pointer'
            }}
          >
            Completar mi Perfil
          </button>
        </div>
      )}

      {setupMessage && !profile && (
        <div className="status-message glass" style={{ padding: '1.5rem', borderLeft: '4px solid var(--primary)', marginBottom: '2rem' }}>
          <p>{setupMessage}</p>
          <button
            type="button"
            onClick={() => { const user = auth.currentUser; if (user) loadProfile(user.email!, user.uid); }}
            style={{ marginTop: '10px', padding: '8px 20px', borderRadius: '8px', background: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 700 }}
          >
            Reintentar
          </button>
        </div>
      )}

      {profile && (
        <>
          {/* TARJETA DE ENCABEZADO PREMIUM: RANGO ACTUAL Y PROGRESO DE NIVEL */}
          {(() => {
            const pendientes = todosLogros.filter((tl: any) => !misLogros.some((ml: any) => ml.nombre_logro === tl.logrosnombre));
            const siguiente = pendientes[0];
            if (!siguiente) return null;

            const actualLogro = misLogros.length > 0 ? misLogros[misLogros.length - 1] : null;
            const actualLogroIcono = actualLogro?.logrosicono || (profile?.roles?.includes('visitante') ? '👁️' : '🧑‍🌾');
            const actualLogroNombre = actualLogro?.nombre_logro || (profile?.roles?.includes('visitante') ? 'Visitante' : 'Aprendiz');
            const actualLogroNivel = actualLogro?.logrosnivel || 1;

            const reqList: React.ReactNode[] = [];

            // 🌰 Requisito de Semillas
            if (siguiente.req_semillas > 0) {
              const totalSemillas = misSemillas.length;
              const satis = totalSemillas >= siguiente.req_semillas;
              reqList.push(
                <div key="semillas" style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  flexWrap: 'wrap', 
                  gap: '12px', 
                  background: satis ? 'rgba(16, 185, 129, 0.08)' : 'rgba(245, 158, 11, 0.08)', 
                  padding: '12px 18px', 
                  borderRadius: '14px', 
                  border: satis ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(245, 158, 11, 0.25)',
                  color: satis ? '#34d399' : '#f59e0b',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)'
                }}>
                  <span style={{ fontSize: '1.4rem', filter: 'drop-shadow(0 2px 4px rgba(245,158,11,0.2))' }}>🌰</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>
                    {satis ? '✅' : '🌰'} {totalSemillas} de {siguiente.req_semillas} semilla{siguiente.req_semillas > 1 ? 's' : ''} en inventario
                  </span>
                  {!satis && (
                    <button 
                      onClick={() => openSeedModal()} 
                      style={{ 
                        marginLeft: 'auto', 
                        fontSize: '0.75rem', 
                        color: '#1e293b', 
                        fontWeight: 800, 
                        border: 'none',
                        background: '#fbbf24', 
                        padding: '5px 12px', 
                        borderRadius: '8px', 
                        boxShadow: '0 4px 12px rgba(245,158,11,0.3)',
                        transition: 'transform 0.2s',
                        cursor: 'pointer'
                      }}
                      onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'}
                      onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      ¡Añade ahora! →
                    </button>
                  )}
                </div>
              );
            }

            // 🌱 Requisito de Cultivos
            if (siguiente.req_siembras > 0) {
              const cultivosCompletados = misCultivos.filter((c: any) => c.cultivosestado === 'finalizado' && c.cultivosfecharecoleccion).length;
              const cultivosEnCurso = misCultivos.filter((c: any) => c.cultivosestado !== 'finalizado' && c.cultivosestado !== 'perdido').length;
              const cultivosEnRecoleccion = misCultivos.filter((c: any) => c.cultivosestado === 'recoleccion').length;
              const satis = cultivosCompletados >= siguiente.req_siembras;
              reqList.push(
                <div key="siembras" style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    flexWrap: 'wrap', 
                    gap: '12px', 
                    background: satis ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)', 
                    padding: '12px 18px', 
                    borderRadius: '14px', 
                    border: satis ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(239, 68, 68, 0.25)',
                    color: satis ? '#34d399' : '#f87171',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)'
                  }}>
                    <span style={{ fontSize: '1.4rem', filter: 'drop-shadow(0 2px 4px rgba(239,68,68,0.2))' }}>🌱</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>
                      {satis ? '✅' : '🌱'} {cultivosCompletados} de {siguiente.req_siembras} cultivo{siguiente.req_siembras > 1 ? 's' : ''} completado{siguiente.req_siembras > 1 ? 's' : ''}
                    </span>
                    {!satis && (
                      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {cultivosEnRecoleccion > 0 ? (
                          <a href="/dashboard/mis-plantas" style={{ 
                            fontSize: '0.75rem', 
                            color: '#1e293b', 
                            fontWeight: 800, 
                            textDecoration: 'none', 
                            background: '#fef08a', 
                            padding: '5px 12px', 
                            borderRadius: '8px',
                            boxShadow: '0 4px 10px rgba(254,240,138,0.3)'
                          }}>
                            🧺 Recolecta y finaliza →
                          </a>
                        ) : cultivosEnCurso > 0 ? (
                          <>
                            <button onClick={() => setShowCultivoDetalle(v => !v)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', fontSize: '0.75rem', color: '#cbd5e1', fontWeight: 700, padding: '5px 10px', borderRadius: '8px' }}>
                              {showCultivoDetalle ? 'Ocultar progreso ▲' : 'Ver progreso ▼'}
                            </button>
                            <a href="/dashboard/mis-plantas" style={{ 
                              fontSize: '0.75rem', 
                              color: '#1e293b', 
                              fontWeight: 800, 
                              textDecoration: 'none', 
                              background: '#fb7185', 
                              padding: '5px 12px', 
                              borderRadius: '8px',
                              boxShadow: '0 4px 10px rgba(251,113,133,0.3)'
                            }}>
                              Ir a cultivos →
                            </a>
                          </>
                        ) : (
                          <button onClick={() => openCropWizard()} style={{ 
                            fontSize: '0.75rem', 
                            color: '#1e293b', 
                            fontWeight: 800, 
                            border: 'none',
                            background: '#fb7185', 
                            padding: '5px 12px', 
                            borderRadius: '8px',
                            boxShadow: '0 4px 10px rgba(251,113,133,0.3)',
                            cursor: 'pointer'
                          }}>
                            Crealo ahora! →
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  {showCultivoDetalle && !satis && cultivosEnCurso > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingLeft: '12px', marginTop: '4px' }}>
                      {misCultivos
                        .filter((c: any) => c.cultivosestado !== 'finalizado' && c.cultivosestado !== 'perdido')
                        .map((c: any, ci: number) => {
                          const fmt = (d: string | null) => d ? new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: '2-digit' }) : null;
                          const fases = [
                            { label: 'Inicio', fecha: fmt(c.cultivosfechainicio) },
                            { label: 'Germinacion', fecha: fmt(c.cultivosfechagerminacion) },
                            { label: 'Trasplante', fecha: fmt(c.cultivosfechatrasplante) },
                            { label: 'Recoleccion', fecha: fmt(c.cultivosfecharecoleccion) },
                          ];
                          const completadas = fases.filter(f => f.fecha);
                          const proxima = fases.find(f => !f.fecha);
                          return (
                            <div key={ci} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '8px 12px', fontSize: '0.76rem', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: '3px', color: 'white' }}>
                              <div style={{ fontWeight: 800, color: '#fef08a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                Cultivo Nº {c.cultivosnumerocoleccion || c.idcultivos}: {c.especiesnombre}{c.variedad_nombre ? <span style={{ fontWeight: 400, color: '#e2e8f0' }}> ({c.variedad_nombre})</span> : null}
                              </div>
                              {completadas.map((f, fi) => (
                                <div key={fi} style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#a7f3d0' }}>
                                  <span style={{ fontSize: '0.65rem' }}>&#x2705;</span>
                                  <span style={{ fontWeight: 600 }}>{f.label}</span>
                                  <span style={{ color: '#cbd5e1', marginLeft: 'auto', fontSize: '0.7rem' }}>{f.fecha}</span>
                                </div>
                              ))}
                              {proxima && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#fde047', borderTop: '1px dashed rgba(255,255,255,0.15)', paddingTop: '4px', marginTop: '2px' }}>
                                  <span style={{ fontSize: '0.65rem' }}>&#x23F3;</span>
                                  <span style={{ fontWeight: 700 }}>Siguiente: {proxima.label}</span>
                                  <a href={`/dashboard/mis-plantas`} style={{ marginLeft: 'auto', fontSize: '0.7rem', color: '#6ee7b7', fontWeight: 700, textDecoration: 'none' }}>Ir &rarr;</a>
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              );
            }

            // 💬 Requisito de Mensajes
            if (siguiente.req_mensajes > 0) {
              reqList.push(
                <div key="mensajes" style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  flexWrap: 'wrap', 
                  gap: '12px', 
                  background: 'rgba(16, 185, 129, 0.08)', 
                  padding: '12px 18px', 
                  borderRadius: '14px', 
                  border: '1px solid rgba(16, 185, 129, 0.25)', 
                  color: '#34d399',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)'
                }}>
                  <span style={{ fontSize: '1.4rem', filter: 'drop-shadow(0 2px 4px rgba(16,185,129,0.2))' }}>💬</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>
                    ✅ 1 de {siguiente.req_mensajes} mensaje{siguiente.req_mensajes > 1 ? 's' : ''} en la comunidad
                  </span>
                  <a href="/dashboard/comunidad" style={{ 
                    marginLeft: 'auto', 
                    fontSize: '0.75rem', 
                    color: '#1e293b', 
                    fontWeight: 800, 
                    textDecoration: 'none', 
                    background: '#34d399', 
                    padding: '5px 12px', 
                    borderRadius: '8px',
                    boxShadow: '0 4px 10px rgba(52,211,153,0.3)'
                  }}>
                    Ir al Chat →
                  </a>
                </div>
              );
            }

            // Fallback si no hay requisitos explícitos
            if (reqList.length === 0) {
              reqList.push(
                <div key="fallback" style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px', 
                  background: 'rgba(255,255,255,0.06)', 
                  padding: '12px 18px', 
                  borderRadius: '14px', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#cbd5e1'
                }}>
                  <span style={{ fontSize: '1.4rem' }}>✉️</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>{siguiente.logrosdescripcion || 'Completa tu perfil y verifica tu correo para desbloquear el siguiente rango.'}</span>
                </div>
              );
            }

            const progresoPorcentaje = todosLogros.length > 0 ? Math.round((misLogros.length / todosLogros.length) * 100) : 0;

            return (
              <div style={{
                marginBottom: '2.5rem',
                padding: '2rem',
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.85), rgba(240, 253, 244, 0.75))',
                color: '#0f172a',
                border: '1.5px solid rgba(255, 255, 255, 0.9)',
                borderRadius: '24px',
                boxShadow: '0 20px 40px rgba(16, 185, 129, 0.08), 0 1px 3px rgba(0,0,0,0.02)',
                position: 'relative',
                overflow: 'hidden',
                backdropFilter: 'blur(20px)'
              }}>
                {/* Capas decorativas de luces incandescentes en tonos pastel */}
                <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: '180px', height: '180px', background: 'rgba(168, 85, 247, 0.15)', filter: 'blur(50px)', borderRadius: '50%', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', bottom: '-20%', left: '-10%', width: '180px', height: '180px', background: 'rgba(34, 197, 94, 0.15)', filter: 'blur(50px)', borderRadius: '50%', pointerEvents: 'none' }} />

                {/* Rango Actual vs Siguiente Nivel */}
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px', borderBottom: '1px solid rgba(0, 0, 0, 0.08)', paddingBottom: '16px', marginBottom: '20px' }}>
                  
                  {/* Rango Actual */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'linear-gradient(135deg, rgba(254, 240, 138, 0.4), rgba(253, 224, 71, 0.35))', padding: '8px 16px', borderRadius: '16px', border: '1.5px solid rgba(234, 179, 8, 0.4)', color: '#854d0e' }}>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '54px', height: '54px', background: 'white', borderRadius: '12px', border: '2px solid rgba(234, 179, 8, 0.6)' }}>
                      <span style={{ fontSize: '2.2rem', filter: 'drop-shadow(0 2px 4px rgba(234,179,8,0.25))' }}>{actualLogroIcono}</span>
                      <span style={{ position: 'absolute', bottom: '-6px', right: '-6px', background: '#ca8a04', color: 'white', width: '22px', height: '22px', borderRadius: '50%', fontSize: '0.8rem', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.15)' }}>
                        {actualLogroNivel}
                      </span>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#b45309', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mi Rango Actual</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 900 }}>{actualLogroNombre}</div>
                    </div>
                  </div>

                  {/* Icono de Conexión (Flecha) */}
                  <div style={{ fontSize: '1.5rem', color: 'rgba(0,0,0,0.15)', display: 'none' }} className="responsive-hide">➔</div>

                  {/* Siguiente Rango */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'linear-gradient(135deg, rgba(233, 213, 255, 0.45), rgba(216, 180, 254, 0.35))', padding: '8px 16px', borderRadius: '16px', border: '1.5px solid rgba(168, 85, 247, 0.4)', color: '#6b21a8' }}>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '54px', height: '54px', background: 'white', borderRadius: '12px', border: '2px solid rgba(168, 85, 247, 0.6)' }}>
                      <span style={{ fontSize: '2.2rem', filter: 'drop-shadow(0 2px 4px rgba(139,92,246,0.3))' }}>{siguiente.logrosicono || '🏆'}</span>
                      <span style={{ position: 'absolute', bottom: '-6px', right: '-6px', background: '#9333ea', color: 'white', width: '22px', height: '22px', borderRadius: '50%', fontSize: '0.8rem', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.15)' }}>
                        {siguiente.logrosnivel || '?'}
                      </span>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#7e22ce', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Siguiente Rango</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 900 }}>{siguiente.logrosnombre}</div>
                    </div>
                  </div>
                </div>

                {/* Requisitos Checklist */}
                <div style={{ fontSize: '0.82rem', color: '#475569', fontWeight: 800, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Para desbloquearlo necesitas:</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                  {/* Renderizado de Requisitos */}
                  {reqList}
                </div>

                {/* Fusión Barra de Progreso Total */}
                <div style={{ paddingTop: '20px', borderTop: '1px solid rgba(0, 0, 0, 0.08)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#475569', marginBottom: '8px', fontWeight: 800 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>📊 Progreso total de nivel</span>
                    <span style={{ background: 'rgba(0,0,0,0.05)', padding: '2px 8px', borderRadius: '6px', color: '#15803d' }}>{progresoPorcentaje}%</span>
                  </div>
                  <div style={{ height: '10px', background: 'rgba(0, 0, 0, 0.06)', borderRadius: '5px', overflow: 'hidden', padding: '1px', border: '1px solid rgba(0,0,0,0.03)' }}>
                    <div style={{ height: '100%', width: `${Math.min(progresoPorcentaje, 100)}%`, background: 'linear-gradient(to right, #fbbf24, #34d399, #3b82f6)', borderRadius: '4px', transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Stats Grid dinámico */}
          <div className="stats-grid">
            {(() => {
              const activeCrops = misCultivos.filter((c: any) => c.cultivosestado !== 'finalizado' && c.cultivosestado !== 'perdido');
              return (
                <div className="stat-card" style={{ cursor: 'pointer', position: 'relative', display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'stretch' }} onClick={() => openCropWizard()}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', width: '100%' }}>
                    <div className="card-icon">&#127807;</div>
                    <div className="card-info" style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ margin: 0, fontSize: '0.9rem', color: '#64748b', fontWeight: 600 }}>Cultivos activos</h3>
                      <div className="value" style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', width: '100%', marginTop: '4px' }}>
                        <span style={{ fontSize: '2rem', fontWeight: 800, color: '#1e293b' }}>{activeCrops.length}</span>
                        <span style={{ fontSize: '0.75rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '2px 8px', borderRadius: '6px', fontWeight: 'bold', flexShrink: 0 }}>+ Sembrar</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Listado de especies y variedades */}
                  <div style={{ borderTop: activeCrops.length > 0 ? '1px dashed #e2e8f0' : 'none', paddingTop: activeCrops.length > 0 ? '8px' : 0, display: 'flex', flexDirection: 'column', gap: '6px', width: '100%', minWidth: 0 }}>
                    {activeCrops.length > 0 ? (
                      activeCrops.slice(0, 3).map((c: any, idx: number) => {
                        const isConfirming = deletingCropId === c.idcultivos;
                        if (isConfirming) {
                          return (
                            <div 
                              key={idx} 
                              onClick={(e) => e.stopPropagation()}
                              style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'space-between',
                                gap: '6px', 
                                fontSize: '0.78rem', 
                                color: '#475569',
                                padding: '4px 8px',
                                borderRadius: '8px',
                                background: 'rgba(239, 68, 68, 0.08)',
                                border: '1px solid rgba(239, 68, 68, 0.2)',
                                width: '100%',
                                minWidth: 0,
                                boxSizing: 'border-box'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: 0 }}>
                                <span style={{ fontSize: '1rem', flexShrink: 0 }}>⚠️</span>
                                <span style={{ fontWeight: 800, color: '#991b1b', fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>¿Eliminar Cultivo?</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                                <button
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    await executeDeleteCrop(c.idcultivos);
                                  }}
                                  style={{
                                    background: '#ef4444',
                                    color: 'white',
                                    border: 'none',
                                    padding: '3px 8px',
                                    borderRadius: '6px',
                                    fontSize: '0.7rem',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                  }}
                                  onMouseOver={e => e.currentTarget.style.background = '#dc2626'}
                                  onMouseOut={e => e.currentTarget.style.background = '#ef4444'}
                                >
                                  Sí
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeletingCropId(null);
                                  }}
                                  style={{
                                    background: 'white',
                                    color: '#475569',
                                    border: '1px solid #cbd5e1',
                                    padding: '2px 8px',
                                    borderRadius: '6px',
                                    fontSize: '0.7rem',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                  }}
                                  onMouseOver={e => e.currentTarget.style.background = '#f1f5f9'}
                                  onMouseOut={e => e.currentTarget.style.background = 'white'}
                                >
                                  No
                                </button>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div 
                            key={idx} 
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/dashboard/cultivos/${c.idcultivos}?from=dashboard`);
                            }}
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'space-between',
                              gap: '6px', 
                              fontSize: '0.78rem', 
                              color: '#475569',
                              cursor: 'pointer',
                              padding: '6px 8px',
                              borderRadius: '8px',
                              transition: 'all 0.2s',
                              width: '100%',
                              minWidth: 0,
                              boxSizing: 'border-box'
                            }}
                            onMouseOver={e => {
                              e.currentTarget.style.background = '#f0fdf4';
                              e.currentTarget.style.color = '#10b981';
                            }}
                            onMouseOut={e => {
                              e.currentTarget.style.background = 'transparent';
                              e.currentTarget.style.color = '#475569';
                            }}
                          >
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', flex: 1, minWidth: 0, width: '100%' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '100%', minWidth: 0 }}>
                                <div style={{ flexShrink: 0, display: 'inline-flex' }}><SpeciesIcon icon={c.especiesicono || '🌱'} size="1rem" /></div>
                                <span style={{ fontWeight: 800, color: '#065f46', background: '#d1fae5', padding: '2px 6px', borderRadius: '6px', fontSize: '0.65rem', flexShrink: 0 }}>Nº {c.cultivosnumerocoleccion || c.idcultivos}</span>
                                <span style={{ 
                                  fontWeight: 700, 
                                  overflow: 'hidden', 
                                  textOverflow: 'ellipsis', 
                                  whiteSpace: 'nowrap', 
                                  display: 'inline-block', 
                                  minWidth: 0,
                                  flex: 1
                                }}>
                                  {c.especiesnombre} <span style={{ fontWeight: 'normal', opacity: 0.85 }}>({c.variedad_nombre || 'Común'})</span>
                                </span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingLeft: '26px', flexWrap: 'wrap' }}>
                                {c.cultivosfechainicio && (
                                  <span style={{ fontSize: '0.62rem', color: '#64748b', background: '#f1f5f9', padding: '1px 5px', borderRadius: '4px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                    📅 {new Date(c.cultivosfechainicio).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                                  </span>
                                )}
                                <span style={{ 
                                  fontSize: '0.62rem', 
                                  padding: '1px 5px', 
                                  borderRadius: '4px', 
                                  fontWeight: 700, 
                                  whiteSpace: 'nowrap',
                                  background: c.cultivosestado === 'germinacion' ? '#fef3c7' : c.cultivosestado === 'crecimiento' ? '#d1fae5' : c.cultivosestado === 'recoleccion' ? '#fce7f3' : c.cultivosestado === 'en_espera' ? '#e0e7ff' : '#f1f5f9',
                                  color: c.cultivosestado === 'germinacion' ? '#92400e' : c.cultivosestado === 'crecimiento' ? '#065f46' : c.cultivosestado === 'recoleccion' ? '#9d174d' : c.cultivosestado === 'en_espera' ? '#3730a3' : '#475569'
                                }}>
                                  {c.cultivosestado === 'germinacion' ? '🌱 Germinación' : c.cultivosestado === 'crecimiento' ? '🌿 Crecimiento' : c.cultivosestado === 'recoleccion' ? '🧺 Recolección' : c.cultivosestado === 'en_espera' ? '⏳ En espera' : c.cultivosestado === 'trasplante' ? '🪴 Trasplante' : c.cultivosestado}
                                </span>
                                {c.cultivoscantidad && (
                                  <span style={{ fontSize: '0.62rem', color: '#0f766e', background: '#ccfbf1', padding: '1px 5px', borderRadius: '4px', fontWeight: 700, whiteSpace: 'nowrap' }}>
                                    ×{c.cultivoscantidad} uds
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeletingCropId(c.idcultivos);
                              }}
                              title="Eliminar cultivo"
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#ef4444',
                                padding: '4px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s',
                                opacity: 0.8
                              }}
                              onMouseOver={e => {
                                e.stopPropagation();
                                e.currentTarget.style.background = '#fee2e2';
                                e.currentTarget.style.opacity = '1';
                                e.currentTarget.style.transform = 'scale(1.1)';
                              }}
                              onMouseOut={e => {
                                e.stopPropagation();
                                e.currentTarget.style.background = 'none';
                                e.currentTarget.style.opacity = '0.8';
                                e.currentTarget.style.transform = 'scale(1)';
                              }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        );
                      })
                    ) : (
                      <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontStyle: 'italic' }}>No hay cultivos activos en marcha.</span>
                    )}
                    {activeCrops.length > 3 && (
                      <div style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 'bold', paddingLeft: '4px' }}>
                        + {activeCrops.length - 3} cultivos más...
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
            {(() => {
              const activeSeeds = misSemillas.filter((s: any) => 
                (s.semillasstockactual === null || s.semillasstockactual > 0) && 
                s.semillasactivosino !== 0
              );
              return (
                <div className="stat-card" style={{ cursor: 'pointer', position: 'relative', display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'stretch' }} onClick={() => openSeedModal()}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', width: '100%' }}>
                    <div className="card-icon">&#128230;</div>
                    <div className="card-info" style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ margin: 0, fontSize: '0.9rem', color: '#64748b', fontWeight: 600 }}>Semillas en banco</h3>
                      <div className="value" style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', width: '100%', marginTop: '4px' }}>
                        <span style={{ fontSize: '2rem', fontWeight: 800, color: '#1e293b' }}>{activeSeeds.length}</span>
                        <span style={{ fontSize: '0.75rem', background: 'rgba(13, 148, 136, 0.1)', color: '#0d9488', padding: '2px 8px', borderRadius: '6px', fontWeight: 'bold', flexShrink: 0 }}>+ Añadir</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Listado de especies y variedades de semillas */}
                  <div style={{ borderTop: activeSeeds.length > 0 ? '1px dashed #e2e8f0' : 'none', paddingTop: activeSeeds.length > 0 ? '8px' : 0, display: 'flex', flexDirection: 'column', gap: '6px', width: '100%', minWidth: 0 }}>
                    {activeSeeds.length > 0 ? (
                      activeSeeds.slice(0, 3).map((s: any, idx: number) => {
                        const isConfirming = deletingSeedId === s.idsemillas;
                        if (isConfirming) {
                          return (
                            <div 
                              key={idx} 
                              onClick={(e) => e.stopPropagation()}
                              style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'space-between',
                                gap: '6px', 
                                fontSize: '0.78rem', 
                                color: '#475569',
                                padding: '4px 8px',
                                borderRadius: '8px',
                                background: 'rgba(239, 68, 68, 0.08)',
                                border: '1px solid rgba(239, 68, 68, 0.2)',
                                width: '100%',
                                minWidth: 0,
                                boxSizing: 'border-box'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: 0 }}>
                                <span style={{ fontSize: '1rem', flexShrink: 0 }}>⚠️</span>
                                <span style={{ fontWeight: 800, color: '#991b1b', fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>¿Eliminar Semilla?</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                                <button
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    await executeDeleteSeed(s.idsemillas);
                                  }}
                                  style={{
                                    background: '#ef4444',
                                    color: 'white',
                                    border: 'none',
                                    padding: '3px 8px',
                                    borderRadius: '6px',
                                    fontSize: '0.7rem',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                  }}
                                  onMouseOver={e => e.currentTarget.style.background = '#dc2626'}
                                  onMouseOut={e => e.currentTarget.style.background = '#ef4444'}
                                >
                                  Sí
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeletingSeedId(null);
                                  }}
                                  style={{
                                    background: 'white',
                                    color: '#475569',
                                    border: '1px solid #cbd5e1',
                                    padding: '2px 8px',
                                    borderRadius: '6px',
                                    fontSize: '0.7rem',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                  }}
                                  onMouseOver={e => e.currentTarget.style.background = '#f1f5f9'}
                                  onMouseOut={e => e.currentTarget.style.background = 'white'}
                                >
                                  No
                                </button>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div 
                            key={idx} 
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/dashboard/semillas/${s.idsemillas}?from=dashboard`);
                            }}
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'space-between',
                              gap: '6px', 
                              fontSize: '0.78rem', 
                              color: '#475569',
                              cursor: 'pointer',
                              padding: '4px 8px',
                              borderRadius: '8px',
                              transition: 'all 0.2s',
                              width: '100%',
                              minWidth: 0,
                              boxSizing: 'border-box'
                            }}
                            onMouseOver={e => {
                              e.currentTarget.style.background = '#f0fdfa';
                              e.currentTarget.style.color = '#0d9488';
                            }}
                            onMouseOut={e => {
                              e.currentTarget.style.background = 'transparent';
                              e.currentTarget.style.color = '#475569';
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: 0, width: '100%' }}>
                              <div style={{ flexShrink: 0, display: 'inline-flex' }}><SpeciesIcon icon={s.especiesicono || '🌰'} size="1rem" /></div>
                              <span style={{ fontWeight: 800, color: '#0f766e', background: '#ccfbf1', padding: '2px 6px', borderRadius: '6px', fontSize: '0.65rem', flexShrink: 0 }}>Semilla Nº {s.semillasnumerocoleccion || s.idsemillas}</span>
                              <span style={{ 
                                fontWeight: 700, 
                                overflow: 'hidden', 
                                textOverflow: 'ellipsis', 
                                whiteSpace: 'nowrap', 
                                display: 'inline-block', 
                                minWidth: 0,
                                flex: 1
                              }}>
                                {s.especiesnombre} <span style={{ fontWeight: 'normal', opacity: 0.85 }}>({s.variedad_nombre || 'Común'})</span>
                              </span>
                            </div>
                            
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeletingSeedId(s.idsemillas);
                              }}
                              title="Eliminar lote de semillas"
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#ef4444',
                                padding: '4px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s',
                                opacity: 0.8
                              }}
                              onMouseOver={e => {
                                e.stopPropagation();
                                e.currentTarget.style.background = '#fee2e2';
                                e.currentTarget.style.opacity = '1';
                                e.currentTarget.style.transform = 'scale(1.1)';
                              }}
                              onMouseOut={e => {
                                e.stopPropagation();
                                e.currentTarget.style.background = 'none';
                                e.currentTarget.style.opacity = '0.8';
                                e.currentTarget.style.transform = 'scale(1)';
                              }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        );
                      })
                    ) : (
                      <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontStyle: 'italic' }}>No hay semillas registradas.</span>
                    )}
                    {activeSeeds.length > 3 && (
                      <div style={{ fontSize: '0.72rem', color: '#0d9488', fontWeight: 'bold', paddingLeft: '4px' }}>
                        + {activeSeeds.length - 3} lotes más...
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
            {(() => {
              const problemSeeds = misSemillas.filter((s: any) => {
                const esActiva = s.semillasactivosino !== 0 && s.semillasactivosino !== false;
                if (!esActiva) return false;
                const caducada = s.semillasfechacaducidad && new Date(s.semillasfechacaducidad) < new Date();
                const sinStock = s.semillasstockactual !== null && s.semillasstockactual !== undefined && Number(s.semillasstockactual) <= 0;
                return caducada || sinStock;
              });

              return (
                <div 
                  className="stat-card" 
                  style={{ 
                    position: 'relative', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '10px', 
                    alignItems: 'stretch',
                    border: problemSeeds.length > 0 ? '1px solid rgba(245, 158, 11, 0.5)' : undefined, 
                    background: problemSeeds.length > 0 ? 'linear-gradient(135deg, var(--bg-card), rgba(254, 243, 199, 0.15))' : undefined 
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', width: '100%' }}>
                    <div className="card-icon" style={{ background: problemSeeds.length > 0 ? '#fef3c7' : undefined }}>
                      {problemSeeds.length > 0 ? '⚠️' : '📋'}
                    </div>
                    <div className="card-info" style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ margin: 0, fontSize: '0.9rem', color: '#64748b', fontWeight: 600 }}>Tareas Pendientes</h3>
                      <div className="value" style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', width: '100%', marginTop: '4px' }}>
                        {problemSeeds.length === 0 ? (
                          <span style={{ fontSize: '1rem', fontWeight: 700, color: '#10b981' }}>Al día</span>
                        ) : (
                          <span style={{ fontSize: '2rem', fontWeight: 800, color: '#d97706' }}>{problemSeeds.length}</span>
                        )}
                        {problemSeeds.length > 0 && (
                          <span style={{ fontSize: '0.75rem', background: 'rgba(245, 158, 11, 0.1)', color: '#d97706', padding: '2px 8px', borderRadius: '6px', fontWeight: 'bold', flexShrink: 0 }}>
                            Revisión necesaria
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {problemSeeds.length > 0 && (
                    <div style={{ borderTop: '1px dashed #e2e8f0', paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px', width: '100%', minWidth: 0 }}>
                      <div style={{ fontSize: '0.75rem', color: '#b45309', fontWeight: 700, marginBottom: '2px' }}>
                        Semillas caducadas o sin stock:
                      </div>
                      {problemSeeds.slice(0, 3).map((s: any, idx: number) => {
                        const caducada = s.semillasfechacaducidad && new Date(s.semillasfechacaducidad) < new Date();
                        const sinStock = s.semillasstockactual !== null && s.semillasstockactual !== undefined && Number(s.semillasstockactual) <= 0;
                        let motivo = '';
                        if (caducada && sinStock) motivo = '📅 Caducada y 📦 sin stock';
                        else if (caducada) motivo = '📅 Caducada';
                        else motivo = '📦 Sin stock';

                        return (
                          <div
                            key={idx}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '6px',
                              fontSize: '0.78rem',
                              color: '#475569',
                              padding: '6px 8px',
                              borderRadius: '8px',
                              background: 'rgba(245, 158, 11, 0.05)',
                              border: '1px solid rgba(245, 158, 11, 0.15)',
                              width: '100%',
                              minWidth: 0,
                              boxSizing: 'border-box'
                            }}
                          >
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', width: '100%', minWidth: 0 }}>
                                <span style={{ fontWeight: 800, color: '#b45309', background: '#fef3c7', padding: '1px 4px', borderRadius: '4px', fontSize: '0.62rem', flexShrink: 0 }}>
                                  Nº {s.semillasnumerocoleccion || s.idsemillas}
                                </span>
                                <span style={{ 
                                  fontWeight: 700, 
                                  overflow: 'hidden', 
                                  textOverflow: 'ellipsis', 
                                  whiteSpace: 'nowrap', 
                                  display: 'inline-block', 
                                  minWidth: 0,
                                  flex: 1
                                }}>
                                  {s.especiesnombre} <span style={{ fontWeight: 'normal', opacity: 0.8 }}>({s.variedad_nombre || 'Común'})</span>
                                </span>
                              </div>
                              <span style={{ fontSize: '0.65rem', color: '#d97706', paddingLeft: '2px' }}>
                                {motivo}
                              </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                              {/* Ir a la semilla */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/dashboard/semillas/${s.idsemillas}?from=dashboard`);
                                }}
                                title="Ir a la semilla"
                                style={{
                                  background: 'white',
                                  border: '1px solid #cbd5e1',
                                  color: '#475569',
                                  padding: '3px 6px',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontSize: '0.7rem',
                                  fontWeight: 'bold',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  transition: 'all 0.2s'
                                }}
                                onMouseOver={e => {
                                  e.currentTarget.style.background = '#f1f5f9';
                                  e.currentTarget.style.borderColor = '#94a3b8';
                                }}
                                onMouseOut={e => {
                                  e.currentTarget.style.background = 'white';
                                  e.currentTarget.style.borderColor = '#cbd5e1';
                                }}
                              >
                                Ir
                              </button>

                              {/* Inactivar directamente */}
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  if (window.confirm(`¿Inactivar semilla Nº ${s.semillasnumerocoleccion || s.idsemillas}? Dejará de mostrarse como activa en tu banco.`)) {
                                    await executeInactivateSeed(s.idsemillas);
                                  }
                                }}
                                title="Inactivar directamente"
                                style={{
                                  background: '#ef4444',
                                  border: '1px solid #ef4444',
                                  color: 'white',
                                  padding: '3px 6px',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontSize: '0.7rem',
                                  fontWeight: 'bold',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  transition: 'all 0.2s'
                                }}
                                onMouseOver={e => {
                                  e.currentTarget.style.background = '#dc2626';
                                  e.currentTarget.style.borderColor = '#dc2626';
                                }}
                                onMouseOut={e => {
                                  e.currentTarget.style.background = '#ef4444';
                                  e.currentTarget.style.borderColor = '#ef4444';
                                }}
                              >
                                Inactivar
                              </button>
                            </div>
                          </div>
                        );
                      })}
                      {problemSeeds.length > 3 && (
                        <div style={{ fontSize: '0.72rem', color: '#d97706', fontWeight: 'bold', paddingLeft: '4px' }}>
                          + {problemSeeds.length - 3} tareas más...
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}
            <div className="stat-card">
              <div className="card-icon">&#127777;</div>
              <div className="card-info"><h3>Meteo Local</h3><div className="value">&mdash;</div></div>
            </div>
          </div>

          {/* Visual Scale Garden Map */}
          {profile && (
            <GardenMap misCultivos={misCultivos} profile={profile} />
          )}

          {/* Seccion de Logros */}
          <div className="logros-section" style={{ marginTop: '2rem', padding: '1.5rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', boxShadow: 'var(--glass-shadow)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', margin: 0 }}>
                Mis Logros
                {todosLogros.length > 0 && (
                  <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-muted)', marginLeft: '8px' }}>
                    {misLogros.length} activo{misLogros.length !== 1 ? 's' : ''} de {todosLogros.length} totales
                  </span>
                )}
              </h2>
              <a href="/dashboard/perfil" style={{ fontSize: '0.85rem', color: 'var(--storm-primary)', textDecoration: 'none', fontWeight: 600 }}>Ver todos &rarr;</a>
            </div>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              {/* Logros ADQUIRIDOS */}
              {misLogros.map((logro: any, i: number) => (
                <div key={`adq-${i}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', width: '90px', textAlign: 'center' }}>
                  <div style={{
                    width: '56px', height: '56px', borderRadius: '50%',
                    background: logro.fecha_fin ? 'linear-gradient(135deg, #d1fae5, #a7f3d0)' : 'linear-gradient(135deg, #fef3c7, #fde68a)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem',
                    border: logro.fecha_fin ? '3px solid #10b981' : '3px solid #f59e0b',
                    boxShadow: logro.fecha_fin ? '0 4px 6px rgba(16,185,129,0.2)' : '0 4px 6px rgba(245,158,11,0.2)'
                  }}>
                    {logro.logrosicono || '?'}
                  </div>
                  <div>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block' }}>{logro.nombre_logro}</span>
                    <span style={{ fontSize: '0.6rem', color: logro.fecha_fin ? '#10b981' : '#f59e0b', fontWeight: 600 }}>
                      {logro.fecha_fin ? '\u2713 Completado' : '\u25cf Activo'}
                    </span>
                  </div>
                </div>
              ))}

              {/* Logros PENDIENTES */}
              {todosLogros.filter((tl: any) => !misLogros.some((ml: any) => ml.nombre_logro === tl.logrosnombre)).map((logro: any, i: number) => (
                <div key={`pend-${i}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', width: '90px', textAlign: 'center', opacity: 0.4, filter: 'grayscale(100%)' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', border: '3px solid #cbd5e1' }}>
                    {logro.logrosicono || '?'}
                  </div>
                  <div>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block' }}>{logro.logrosnombre}</span>
                    <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Bloqueado</span>
                  </div>
                </div>
              ))}
            </div>


            {/* Barra de progreso */}
            {todosLogros.length > 0 && (
              <div style={{ marginTop: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  <span>Progreso total</span>
                  <span>{Math.round((misLogros.length / todosLogros.length) * 100)}%</span>
                </div>
                <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.min(Math.round((misLogros.length / todosLogros.length) * 100), 100)}%`, background: 'linear-gradient(to right, #10b981, #059669)', borderRadius: '3px', transition: 'width 0.5s ease' }} />
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════ */}
      {/* WIZARD/MODAL: Añadir nueva Semilla       */}
      {/* ═══════════════════════════════════════ */}
      <SeedWizardModal
        show={showSeedModal}
        onClose={() => setShowSeedModal(false)}
        onSuccess={() => {
          if (profile?.email) {
            loadProfile(profile.email, auth.currentUser?.uid || '');
          }
        }}
      />

      {/* ═══════════════════════════════════════ */}
      {/* WIZARD/MODAL: Iniciar nuevo Cultivo (Emergente) */}
      {/* ═══════════════════════════════════════ */}
      {showCropWizard && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(8px)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px', transition: 'all 0.3s ease'
        }}>
          <div style={{
            background: 'white', borderRadius: '24px', maxWidth: 620, width: '100%',
            maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.7)',
            animation: 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
          }} onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div style={{
              padding: '24px 28px', borderBottom: '1px solid #e2e8f0',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: 'linear-gradient(135deg, #065f46, #10b981)', color: 'white'
            }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>🌱</span> Asistente de Cultivos
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: '0.85rem', opacity: 0.9 }}>
                  {cropWizardStep === 1 && 'Paso 1 de 4: Elige la especie/hortaliza'}
                  {cropWizardStep === 2 && `Paso 2 de 4: Elige la variedad de ${selectedCropEspecie?.especiesnombre}`}
                  {cropWizardStep === 3 && `Paso 3 de 4: Método y Origen para ${selectedCropVariedad?.variedadesnombre}`}
                  {cropWizardStep === 4 && `Paso 4 de 4: Configuración final del cultivo`}
                  {cropWizardStep === 5 && '¡Cultivo iniciado con éxito!'}
                </p>
              </div>
              <button 
                onClick={() => setShowCropWizard(false)} 
                style={{
                  background: 'rgba(255,255,255,0.15)', 
                  border: 'none', 
                  padding: '6px 14px',
                  borderRadius: '8px', 
                  fontSize: '0.85rem', 
                  fontWeight: 'bold',
                  cursor: 'pointer', 
                  color: 'white',
                  transition: 'all 0.2s'
                }} 
                onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
                onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
              >
                Cancelar
              </button>
            </div>

            {/* Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '28px' }}>

              {/* PASO 1: Elegir especie */}
              {cropWizardStep === 1 && (
                <>
                  <input
                    type="text"
                    placeholder="🔍 Buscar hortaliza..."
                    value={cropSearchTerm}
                    onChange={e => setCropSearchTerm(e.target.value)}
                    style={{
                      width: '100%', padding: '12px 16px', borderRadius: '12px',
                      border: '2px solid #e2e8f0', fontSize: '0.95rem',
                      marginBottom: '20px', boxSizing: 'border-box',
                      outline: 'none', transition: 'all 0.2s', fontWeight: 500
                    }}
                    onFocus={e => e.target.style.borderColor = '#10b981'}
                    onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                  />
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '14px' }}>
                    {cropWizardEspecies
                      .filter(esp => !cropSearchTerm || esp.especiesnombre.toLowerCase().includes(cropSearchTerm.toLowerCase()))
                      .map(esp => (
                        <button key={esp.idespecies} onClick={() => selectCropEspecie(esp)} style={{
                          background: 'white', border: '2px solid #e2e8f0', borderRadius: '16px',
                          padding: '16px', cursor: 'pointer', textAlign: 'center',
                          transition: 'all 0.2s', display: 'flex', flexDirection: 'column', gap: '8px',
                          alignItems: 'center', justifyContent: 'center', minHeight: '120px'
                        }}
                          onMouseOver={e => { e.currentTarget.style.borderColor = '#10b981'; e.currentTarget.style.background = '#f0fdf4'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                          onMouseOut={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = 'white'; e.currentTarget.style.transform = 'translateY(0)'; }}
                        >
                          {esp.foto ? (
                            <div style={{ width: '56px', height: '56px', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
                              <img src={getMediaUrl(esp.foto)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} crossOrigin="anonymous" />
                            </div>
                          ) : (
                            <SpeciesIcon icon={esp.especiesicono || '🌱'} size="2.2rem" />
                          )}
                          <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#1e293b' }}>{esp.especiesnombre}</span>
                        </button>
                      ))}
                  </div>
                </>
              )}

              {/* PASO 2: Elegir variedad y comprobar stock semillas */}
              {cropWizardStep === 2 && selectedCropEspecie && (
                <>
                  <button onClick={() => { setCropWizardStep(1); setSelectedCropVariedad(null); }}
                    style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', marginBottom: '16px', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    ← Volver a especies
                  </button>
                  <h3 style={{ margin: '0 0 16px', color: '#0f172a', fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <SpeciesIcon icon={selectedCropEspecie.especiesicono} size="1.2rem" /> {selectedCropEspecie.especiesnombre} — Elige la variedad
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '14px' }}>
                    {cropWizardVariedades.map(v => {
                      const stockInfo = getSemillaStock(v.idvariedades);
                      return (
                        <button key={v.idvariedades} onClick={() => selectCropVariedad(v)}
                          style={{
                            background: selectedCropVariedad?.idvariedades === v.idvariedades ? '#f0fdf4' : 'white',
                            border: `2px solid ${selectedCropVariedad?.idvariedades === v.idvariedades ? '#10b981' : '#e2e8f0'}`,
                            borderRadius: '16px', padding: '16px', cursor: 'pointer',
                            textAlign: 'left', transition: 'all 0.2s',
                            display: 'flex', flexDirection: 'column', gap: '6px'
                          }}
                          onMouseOver={e => e.currentTarget.style.borderColor = '#10b981'}
                          onMouseOut={e => { if (selectedCropVariedad?.idvariedades !== v.idvariedades) e.currentTarget.style.borderColor = '#e2e8f0'; }}
                        >
                          {v.variedadesesgenerica === 1 && <span style={{ fontSize: '0.65rem', background: '#ccfbf1', color: '#0f766e', padding: '2px 8px', borderRadius: '8px', fontWeight: 800, alignSelf: 'flex-start' }}>🏅 Común / Gold</span>}
                          {v.foto ? (
                            <div style={{ width: '48px', height: '48px', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 2px 6px rgba(0,0,0,0.05)' }}>
                              <img src={getMediaUrl(v.foto)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} crossOrigin="anonymous" />
                            </div>
                          ) : (
                            <SpeciesIcon icon={v.variedadesicono || selectedCropEspecie.especiesicono || '🌱'} size="1.8rem" />
                          )}
                          <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#1e293b' }}>{v.variedadesnombre}</span>
                          
                          {/* BADGE DE STOCK DIGNIFICADO */}
                          {stockInfo ? (
                            <div style={{
                              fontSize: '0.72rem',
                              background: '#dcfce7',
                              color: '#15803d',
                              padding: '4px 8px',
                              borderRadius: '8px',
                              fontWeight: 700,
                              marginTop: '4px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              📦 {stockInfo.totalStock} semillas disponibles ({stockInfo.lotesCount} {stockInfo.lotesCount === 1 ? 'lote' : 'lotes'})
                            </div>
                          ) : (
                            <div style={{
                              fontSize: '0.72rem',
                              background: '#f1f5f9',
                              color: '#64748b',
                              padding: '4px 8px',
                              borderRadius: '8px',
                              fontWeight: 600,
                              marginTop: '4px',
                              display: 'inline-flex',
                              alignItems: 'center'
                            }}>
                              ❌ Sin semillas en banco
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              {/* PASO 3: Método y Origen */}
              {cropWizardStep === 3 && selectedCropVariedad && (
                <>
                  <button onClick={() => setCropWizardStep(cropWizardVariedades.length > 1 ? 2 : 1)}
                    style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', marginBottom: '16px', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    ← Volver
                  </button>

                  <div style={{ display: 'grid', gap: '22px' }}>
                    
                    {/* Variedad Info */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#f0fdf4', border: '1px solid #ccfbf1', padding: '16px', borderRadius: '16px' }}>
                      <span style={{ fontSize: '2rem' }}>🌱</span>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#0f766e', fontWeight: 800, textTransform: 'uppercase' }}>Variedad de Cultivo</div>
                        <h4 style={{ margin: 0, color: '#115e59', fontSize: '1.1rem', fontWeight: 900 }}>
                          {selectedCropEspecie?.especiesnombre} ({selectedCropVariedad.variedadesnombre})
                        </h4>
                      </div>
                    </div>

                    {/* Contenedor de línea de tiempo con conexión vertical */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', position: 'relative', marginTop: '4px' }}>
                      
                      {/* Método de cultivo */}
                      <div style={{ position: 'relative', zIndex: 2, paddingLeft: '24px' }}>
                        {/* Dot indicador paso 1 */}
                        <div style={{
                          position: 'absolute',
                          left: '1px',
                          top: '6px',
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          background: '#10b981',
                          border: '2px solid white',
                          boxShadow: '0 0 0 1px #10b981'
                        }} />

                        {/* Line segment from Step 1 to Step 2 */}
                        {cropFormData.metodo !== '' && (
                          <div style={{
                            position: 'absolute',
                            left: '6px',
                            top: '12px',
                            bottom: '-22px',
                            width: '2px',
                            background: cropFormData.origen !== '' ? '#10b981' : '#cbd5e1',
                            zIndex: 1
                          }} />
                        )}
                      {cropFormData.metodo !== '' ? (
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>Método de siembra/cultivo</label>
                            <button
                              type="button"
                              onClick={() => {
                                setCropFormData({ 
                                  ...cropFormData, 
                                  metodo: '', 
                                  origen: '' 
                                });
                              }}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#10b981',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                padding: 0
                              }}
                            >
                              ✏️ Cambiar método
                            </button>
                          </div>
                          {(() => {
                            const m = [
                              { id: 'semillero', label: '📥 Semillero protegido', desc: 'Siembra en contenedores controlados antes de trasplantar.' },
                              { id: 'siembra_directa', label: '🌍 Siembra directa en suelo/maceta', desc: 'Siembra de semillas directamente en su ubicación definitiva o macetas.' },
                              { id: 'trasplante_directo', label: '🪴 Trasplante directo (Plantel vivo)', desc: 'Plantar una planta joven o plantel comprado/regalado.' }
                            ].find(item => item.id === cropFormData.metodo);
                            
                            if (!m) return null;
                            
                            return (
                              <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'flex-start',
                                padding: '12px 16px',
                                borderRadius: '12px',
                                border: '2px solid #10b981',
                                background: '#f0fdf4',
                                width: '100%',
                                animation: 'scaleIn 0.2s'
                              }}>
                                <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#065f46' }}>
                                  {m.label}
                                </span>
                                <span style={{ fontSize: '0.78rem', color: '#047857', marginTop: '3px' }}>
                                  {m.desc}
                                </span>
                              </div>
                            );
                          })()}
                        </div>
                      ) : (
                        <div>
                          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>Método de siembra/cultivo</label>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {[
                              { id: 'semillero', label: '📥 Semillero protegido', desc: 'Siembra en contenedores controlados antes de trasplantar.' },
                              { id: 'siembra_directa', label: '🌍 Siembra directa en suelo/maceta', desc: 'Siembra de semillas directamente en su ubicación definitiva o macetas.' },
                              { id: 'trasplante_directo', label: '🪴 Trasplante directo (Plantel vivo)', desc: 'Plantar una planta joven o plantel comprado/regalado.' }
                            ].map(m => {
                              const isSelected = cropFormData.metodo === m.id;
                              return (
                                <button
                                  key={m.id}
                                  type="button"
                                  onClick={() => {
                                    setCropFormData({ 
                                      ...cropFormData, 
                                      metodo: m.id, 
                                      origen: '' // Reset origin to blank to force progressive disclosure
                                    });
                                  }}
                                  style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'flex-start',
                                    padding: '12px 16px',
                                    borderRadius: '12px',
                                    border: isSelected ? '2px solid #10b981' : '1px solid #e2e8f0',
                                    background: isSelected ? '#f0fdf4' : 'white',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    width: '100%',
                                    transition: 'all 0.2s',
                                    boxShadow: isSelected ? '0 4px 12px rgba(16, 185, 129, 0.08)' : 'none',
                                    outline: 'none'
                                  }}
                                  onMouseOver={e => {
                                    if (!isSelected) e.currentTarget.style.borderColor = '#10b981';
                                  }}
                                  onMouseOut={e => {
                                    if (!isSelected) e.currentTarget.style.borderColor = '#e2e8f0';
                                  }}
                                >
                                  <span style={{ fontWeight: 800, fontSize: '0.95rem', color: isSelected ? '#065f46' : '#1e293b' }}>
                                    {m.label}
                                  </span>
                                  <span style={{ fontSize: '0.78rem', color: isSelected ? '#047857' : '#64748b', marginTop: '3px' }}>
                                    {m.desc}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      </div>

                      {/* Origen / Procedencia - Solo visible si se ha seleccionado el método */}
                      {cropFormData.metodo !== '' && (
                        <div style={{ 
                          position: 'relative', 
                          zIndex: 2, 
                          paddingLeft: '48px', // Margen mayor que el punto 1 (indented)
                          animation: 'scaleIn 0.2s',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '18px'
                        }}>
                          {/* Dot indicador de paso 2 perfectamente alineado a la línea (left: 1px) */}
                          <div style={{
                            position: 'absolute',
                            left: '1px',
                            top: '6px',
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            background: cropFormData.origen !== '' ? '#10b981' : '#cbd5e1',
                            border: '2px solid white',
                            boxShadow: `0 0 0 1px ${cropFormData.origen !== '' ? '#10b981' : '#cbd5e1'}`
                          }} />

                          {/* Line segment from Step 2 to next step */}
                          {cropFormData.origen !== '' && (
                            <div style={{
                              position: 'absolute',
                              left: '6px',
                              top: '12px',
                              bottom: '-22px',
                              width: '2px',
                              background: (() => {
                                if (cropFormData.origen === 'semilla_inventario') {
                                  return cropFormData.xcultivosidsemillas !== '' ? '#10b981' : '#cbd5e1';
                                }
                                if (cropFormData.origen === 'semilla_nueva') {
                                  return cropFormData.semillascantidad !== '' ? '#10b981' : '#cbd5e1';
                                }
                                return '#10b981'; // Plantel or esqueje is completed directly
                              })(),
                              zIndex: 1
                            }} />
                          )}
                        {cropFormData.origen !== '' ? (
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>Origen de la planta / semilla</label>
                              <button
                                type="button"
                                onClick={() => {
                                  setCropFormData({ 
                                    ...cropFormData, 
                                    origen: '',
                                    xcultivosidsemillas: ''
                                  });
                                }}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#10b981',
                                  fontSize: '0.8rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  padding: 0
                                }}
                              >
                                ✏️ Cambiar origen
                              </button>
                            </div>
                            {(() => {
                              const o = [
                                { id: 'semilla_inventario', label: '🤲 Usar de mi Banco digital', desc: 'Descontar semillas de un lote que ya tienes registrado.' },
                                { id: 'semilla_nueva', label: '📦 Registrar nuevo sobre', desc: 'Introducir y registrar un nuevo sobre de semillas comprado.' },
                                { id: 'plantel_comprado', label: '🛒 Plantel de vivero', desc: 'Plantas jóvenes compradas directamente en tienda o vivero.' },
                                { id: 'plantel_regalado', label: '🎁 Plantel regalado/intercambiado', desc: 'Plantel recibido como regalo, obsequio o intercambio.' },
                                { id: 'esqueje', label: '🌿 Esqueje o propagación', desc: 'Propagar a partir de un esqueje o división propia.' }
                              ].find(item => item.id === cropFormData.origen);
                              
                              if (!o) return null;
                              
                              return (
                                <div style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'flex-start',
                                  padding: '12px 16px',
                                  borderRadius: '12px',
                                  border: '2px solid #10b981',
                                  background: '#f0fdf4',
                                  width: '100%',
                                  animation: 'scaleIn 0.2s'
                                }}>
                                  <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#065f46' }}>
                                    {o.label}
                                  </span>
                                  <span style={{ fontSize: '0.78rem', color: '#047857', marginTop: '3px' }}>
                                    {o.desc}
                                  </span>
                                </div>
                              );
                            })()}
                          </div>
                        ) : (
                          <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>Origen de la planta / semilla</label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                              {[
                                ...(getSemillaStock(selectedCropVariedad.idvariedades) !== null ? [{
                                  id: 'semilla_inventario',
                                  label: '🤲 Usar de mi Banco digital',
                                  desc: 'Descontar semillas de un lote que ya tienes registrado.'
                                }] : []),
                                {
                                  id: 'semilla_nueva',
                                  label: '📦 Registrar nuevo sobre',
                                  desc: 'Introducir y registrar un nuevo sobre de semillas comprado.'
                                },
                                ...(cropFormData.metodo !== 'semillero' ? [
                                  {
                                    id: 'plantel_comprado',
                                    label: '🛒 Plantel de vivero',
                                    desc: 'Plantas jóvenes compradas directamente en tienda o vivero.'
                                  },
                                  {
                                    id: 'plantel_regalado',
                                    label: '🎁 Plantel regalado/intercambiado',
                                    desc: 'Plantel recibido como regalo, obsequio o intercambio.'
                                  },
                                  {
                                    id: 'esqueje',
                                    label: '🌿 Esqueje o propagación',
                                    desc: 'Propagar a partir de un esqueje o división propia.'
                                  }
                                ] : [])
                              ].map(o => {
                                return (
                                  <button
                                    key={o.id}
                                    type="button"
                                    onClick={() => {
                                      setCropFormData({ 
                                        ...cropFormData, 
                                        origen: o.id,
                                        xcultivosidsemillas: '' // Start empty to let them choose lot visually
                                      });
                                    }}
                                    style={{
                                      display: 'flex',
                                      flexDirection: 'column',
                                      alignItems: 'flex-start',
                                      padding: '12px 16px',
                                      borderRadius: '12px',
                                      border: '1px solid #e2e8f0',
                                      background: 'white',
                                      cursor: 'pointer',
                                      textAlign: 'left',
                                      width: '100%',
                                      transition: 'all 0.2s',
                                      outline: 'none'
                                    }}
                                    onMouseOver={e => {
                                      e.currentTarget.style.borderColor = '#10b981';
                                    }}
                                    onMouseOut={e => {
                                      e.currentTarget.style.borderColor = '#e2e8f0';
                                    }}
                                  >
                                    <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#1e293b' }}>
                                      {o.label}
                                    </span>
                                    <span style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '3px' }}>
                                      {o.desc}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        </div>
                      )}

                      {/* Paso 3: Lote / Detalles de la Semilla - Solo visible si hay origen de semilla seleccionado */}
                      {cropFormData.metodo !== '' && (cropFormData.origen === 'semilla_inventario' || cropFormData.origen === 'semilla_nueva') && (
                        <div style={{ 
                          position: 'relative', 
                          zIndex: 2, 
                          paddingLeft: '72px', // Sangría mayor (indented further!)
                          animation: 'scaleIn 0.2s',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '18px'
                        }}>
                          {/* Dot indicador de paso 3 perfectamente alineado a la línea (left: 1px) */}
                          <div style={{
                            position: 'absolute',
                            left: '1px',
                            top: '6px',
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            background: (cropFormData.origen === 'semilla_inventario' ? cropFormData.xcultivosidsemillas !== '' : cropFormData.semillascantidad !== '') ? '#10b981' : '#cbd5e1',
                            border: '2px solid white',
                            boxShadow: `0 0 0 1px ${(cropFormData.origen === 'semilla_inventario' ? cropFormData.xcultivosidsemillas !== '' : cropFormData.semillascantidad !== '') ? '#10b981' : '#cbd5e1'}`
                          }} />

                          {/* Line segment from Step 3 to Step 4 */}
                          {(cropFormData.origen !== 'semilla_inventario' || cropFormData.xcultivosidsemillas !== '') && (
                            <div style={{
                              position: 'absolute',
                              left: '6px',
                              top: '12px',
                              bottom: '-22px',
                              width: '2px',
                              background: (() => {
                                if (cropFormData.origen === 'semilla_inventario') {
                                  return cropFormData.xcultivosidsemillas !== '' ? '#10b981' : '#cbd5e1';
                                }
                                return cropFormData.semillascantidad !== '' ? '#10b981' : '#cbd5e1';
                              })(),
                              zIndex: 1
                            }} />
                          )}

                          {/* A. SEMILLAS DEL INVENTARIO (Lotes disponibles) */}
                          {cropFormData.origen === 'semilla_inventario' && (
                            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px dashed #cbd5e1', display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
                              
                              {cropFormData.xcultivosidsemillas !== '' ? (
                                <div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#065f46' }}>Lote de Semillas seleccionado</label>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setCropFormData({ 
                                          ...cropFormData, 
                                          xcultivosidsemillas: ''
                                        });
                                      }}
                                      style={{
                                        background: 'none',
                                        border: 'none',
                                        color: '#10b981',
                                        fontSize: '0.8rem',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        padding: 0
                                      }}
                                    >
                                      ✏️ Cambiar lote
                                    </button>
                                  </div>
                                  {(() => {
                                    const s = getSemillaStock(selectedCropVariedad.idvariedades)?.seedsList.find(item => item.idsemillas === cropFormData.xcultivosidsemillas);
                                    if (!s) return null;
                                    return (
                                      <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '12px 16px',
                                        borderRadius: '12px',
                                        border: '2px solid #10b981',
                                        background: '#ecfdf5',
                                        width: '100%',
                                        animation: 'scaleIn 0.2s'
                                      }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '2px' }}>
                                          <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#065f46' }}>
                                            🌱 Semilla Nº {s.semillasnumerocoleccion || s.idsemillas}
                                          </span>
                                          <span style={{ fontSize: '0.78rem', color: '#047857' }}>
                                            Marca: {s.semillasmarca || 'Sin marca'} {s.semillaslugarcompra && `— Compra: ${s.semillaslugarcompra}`}
                                          </span>
                                        </div>
                                        <div style={{
                                          fontSize: '0.75rem',
                                          background: '#dcfce7',
                                          color: '#15803d',
                                          padding: '4px 8px',
                                          borderRadius: '8px',
                                          fontWeight: 700
                                        }}>
                                          📦 {s.semillasstockactual !== null ? `${s.semillasstockactual} uds.` : 'Disponible'}
                                        </div>
                                      </div>
                                    );
                                  })()}
                                </div>
                              ) : (
                                <div>
                                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>Selecciona el lote de Semillas a usar</label>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {getSemillaStock(selectedCropVariedad.idvariedades)?.seedsList.map(s => {
                                      return (
                                        <button
                                          key={s.idsemillas}
                                          type="button"
                                          onClick={() => {
                                            setCropFormData({ 
                                              ...cropFormData, 
                                              xcultivosidsemillas: s.idsemillas
                                            });
                                          }}
                                          style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '12px 16px',
                                            borderRadius: '12px',
                                            border: '1px solid #e2e8f0',
                                            background: 'white',
                                            cursor: 'pointer',
                                            width: '100%',
                                            transition: 'all 0.2s',
                                            outline: 'none'
                                          }}
                                          onMouseOver={e => {
                                            e.currentTarget.style.borderColor = '#10b981';
                                          }}
                                          onMouseOut={e => {
                                            e.currentTarget.style.borderColor = '#e2e8f0';
                                          }}
                                        >
                                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '2px', textAlign: 'left' }}>
                                            <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#1e293b' }}>
                                              🌱 Semilla Nº {s.semillasnumerocoleccion || s.idsemillas}
                                            </span>
                                            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                                              Marca: {s.semillasmarca || 'Sin marca'} {s.semillaslugarcompra && `— Compra: ${s.semillaslugarcompra}`}
                                            </span>
                                          </div>
                                          <div style={{
                                            fontSize: '0.75rem',
                                            background: '#f1f5f9',
                                            color: '#475569',
                                            padding: '4px 8px',
                                            borderRadius: '8px',
                                            fontWeight: 700
                                          }}>
                                            📦 {s.semillasstockactual !== null ? `${s.semillasstockactual} disponibles` : 'Disponible (cant. no especificada)'}
                                          </div>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                              <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#475569', lineHeight: 1.4 }}>
                                💡 Al plantar, restaremos automáticamente las semillas que uses de este lote digital para mantener tu banco actualizado.
                              </p>
                            </div>
                          )}

                          {/* B. NUEVO SOBRE DE SEMILLAS */}
                          {cropFormData.origen === 'semilla_nueva' && (
                            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px dashed #cbd5e1', display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
                              <h4 style={{ margin: 0, color: '#475569', fontSize: '0.9rem' }}>Datos del nuevo sobre</h4>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                <div>
                                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>Marca / Comercial</label>
                                  <input 
                                    list="main-brands"
                                    type="text" 
                                    placeholder="Ej. Batlle, Rocalba..."
                                    value={cropFormData.semillasmarca}
                                    onChange={e => setCropFormData({ ...cropFormData, semillasmarca: e.target.value })}
                                    style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }}
                                  />
                                </div>
                                <div>
                                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>Lugar de compra</label>
                                  <input 
                                    list="buy-places"
                                    type="text" 
                                    placeholder="Ej. Leroy Merlin, Vivero..."
                                    value={cropFormData.semillaslugarcompra}
                                    onChange={e => setCropFormData({ ...cropFormData, semillaslugarcompra: e.target.value })}
                                    style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }}
                                  />
                                </div>
                              </div>

                              {/* Calculadora de gramos a semillas (Crop Wizard) */}
                              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f766e', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  ⚖️ Calcular semillas por peso (Gramos)
                                </span>
                                
                                {selectedCropEspecie?.especiespeso1000semillas && Number(selectedCropEspecie.especiespeso1000semillas) > 0 ? (
                                  <div>
                                    <p style={{ margin: '0 0 8px', fontSize: '0.8rem', color: '#64748b', lineHeight: 1.4 }}>
                                      Esta especie tiene un peso estándar registrado de <strong>{selectedCropEspecie.especiespeso1000semillas}g</strong> por cada 1.000 semillas.
                                      <br />
                                      <span style={{ color: '#0d9488', fontWeight: 700 }}>
                                        Equivalencia: ≈ {Math.round(1000 / Number(selectedCropEspecie.especiespeso1000semillas))} semillas por gramo.
                                      </span>
                                    </p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      <input 
                                        type="number" 
                                        step="0.01" 
                                        min="0"
                                        placeholder="Introduce los gramos del sobre..."
                                        value={cropInputGramos}
                                        onChange={e => handleCropGramosChange(e.target.value)}
                                        style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }}
                                      />
                                      <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#475569' }}>gramos</span>
                                    </div>
                                  </div>
                                ) : (
                                  <div>
                                    <p style={{ margin: '0 0 8px', fontSize: '0.8rem', color: '#64748b', lineHeight: 1.4 }}>
                                      Esta hortaliza no tiene registrado un peso estándar. Introduce los gramos y el equivalente aproximado de semillas por gramo:
                                    </p>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                      <div>
                                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>Gramos</label>
                                        <input 
                                          type="number" 
                                          step="0.01" 
                                          min="0"
                                          placeholder="Ej. 5"
                                          value={cropInputGramos}
                                          onChange={e => handleCropGramosChange(e.target.value)}
                                          style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }}
                                        />
                                      </div>
                                      <div>
                                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>Semillas / Gramo</label>
                                        <input 
                                          type="number" 
                                          min="1"
                                          placeholder="Ej. 250"
                                          value={cropCustomSemillasPorGramo}
                                          onChange={e => {
                                            setCropCustomSemillasPorGramo(e.target.value);
                                            handleCropGramosChange(cropInputGramos, e.target.value);
                                          }}
                                          style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Cantidad de semillas */}
                              <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Cantidad aprox. de semillas en sobre (uds)</label>
                                <input 
                                  type="number"
                                  min="1"
                                  placeholder="Ej. 50"
                                  value={cropFormData.semillascantidad}
                                  onChange={e => setCropFormData({ ...cropFormData, semillascantidad: e.target.value })}
                                  style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }}
                                />
                              </div>

                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                <div>
                                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>Fecha Envasado / Cosecha</label>
                                  <input 
                                    type="date"
                                    value={cropFormData.semillasfechaenvasado}
                                    onChange={e => setCropFormData({ ...cropFormData, semillasfechaenvasado: e.target.value })}
                                    style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                                  />
                                </div>
                                <div>
                                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>Fecha Caducidad / Viabilidad</label>
                                  <input 
                                    type="date"
                                    value={cropFormData.semillasfechacaducidad}
                                    onChange={e => setCropFormData({ ...cropFormData, semillasfechacaducidad: e.target.value })}
                                    style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                                  />
                                </div>
                              </div>

                              {/* Agregar al Banco Digital */}
                              <div style={{ background: cropFormData.crearBanco ? '#ecfdf5' : '#f1f5f9', padding: '12px', borderRadius: '10px', border: `1px solid ${cropFormData.crearBanco ? '#10b981' : '#cbd5e1'}`, transition: 'all 0.2s' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 700, color: cropFormData.crearBanco ? '#065f46' : '#475569', fontSize: '0.85rem' }}>
                                  <input 
                                    type="checkbox"
                                    checked={cropFormData.crearBanco}
                                    onChange={e => setCropFormData({ ...cropFormData, crearBanco: e.target.checked })}
                                    style={{ transform: 'scale(1.2)' }}
                                  />
                                  📥 Registrar sobre restante en mi Banco de Semillas digital
                                </label>
                                {cropFormData.crearBanco && (
                                  <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px', animation: 'fadeIn 0.2s' }}>
                                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#047857' }}>
                                      Se guardará con el Nº de colección automático: <strong>#{cropNextNumero || '...'}</strong>
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                        </div>
                      )}

                      {/* Detalles Finales del Cultivo - Solo visibles si hay origen y lote (si aplica) seleccionado */}
                      {cropFormData.origen !== '' && (cropFormData.origen !== 'semilla_inventario' || cropFormData.xcultivosidsemillas !== '') && (
                        <div style={{ 
                          position: 'relative', 
                          zIndex: 2, 
                          paddingLeft: '48px', // Aligns visual step 4 back with step 2
                          animation: 'scaleIn 0.2s'
                        }}>
                          {/* Dot indicador de paso 4 (Detalles finales) perfectamente alineado a la línea (left: 1px) */}
                          <div style={{
                            position: 'absolute',
                            left: '1px',
                            top: '6px',
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            background: '#cbd5e1', // Slate since it's the final action step
                            border: '2px solid white',
                            boxShadow: '0 0 0 1px #cbd5e1'
                          }} />

                          <div style={{ display: 'grid', gap: '18px', marginTop: '10px' }}>
                            
                            <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '8px 0' }} />
                            <h4 style={{ margin: 0, color: '#1e293b', fontSize: '0.95rem', fontWeight: 800 }}>🌱 Detalles Finales del Cultivo</h4>

                            {/* Fecha de siembra */}
                            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px solid #cbd5e1' }}>
                              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>📅 Fecha de Inicio / Siembra</label>
                              <input 
                                type="date"
                                value={cropFormData.fechaInicio}
                                onChange={e => setCropFormData({ ...cropFormData, fechaInicio: e.target.value })}
                                style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }}
                              />
                            </div>

                            {/* Grid de cantidad y ubicación */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                              <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                                  {(() => {
                                    if (cropFormData.origen === 'semilla_inventario' || cropFormData.origen === 'semilla_nueva') {
                                      return '🌱 Cantidad de semillas';
                                    }
                                    if (cropFormData.origen === 'esqueje') {
                                      return '🌿 Cantidad de esquejes';
                                    }
                                    return '🪴 Cantidad de plantones';
                                  })()}
                                </label>
                                <input 
                                  type="number" 
                                  min="1"
                                  placeholder={(() => {
                                    if (cropFormData.origen === 'semilla_inventario' || cropFormData.origen === 'semilla_nueva') {
                                      return 'Ej. 10';
                                    }
                                    if (cropFormData.origen === 'esqueje') {
                                      return 'Ej. 3';
                                    }
                                    return 'Ej. 5';
                                  })()}
                                  value={cropFormData.cantidad}
                                  onChange={e => setCropFormData({ ...cropFormData, cantidad: parseInt(e.target.value) || 1 })}
                                  style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }}
                                />
                                <p style={{ margin: '4px 0 0', fontSize: '0.72rem', color: '#64748b' }}>
                                  {(() => {
                                    if (cropFormData.origen === 'semilla_inventario' || cropFormData.origen === 'semilla_nueva') {
                                      return 'Número de semillas que vas a sembrar.';
                                    }
                                    if (cropFormData.origen === 'esqueje') {
                                      return 'Número de esquejes que vas a plantar.';
                                    }
                                    return 'Número de plantones vivos que vas a plantar.';
                                  })()}
                                </p>
                              </div>
                              <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Ubicación</label>
                                <input 
                                  list="ubicaciones-list"
                                  type="text" 
                                  placeholder="Ej. Bancal 1, Maceta..."
                                  value={cropFormData.ubicacion}
                                  onChange={e => setCropFormData({ ...cropFormData, ubicacion: e.target.value })}
                                  style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.95rem', outline: 'none' }}
                                />
                              </div>
                            </div>

                            {/* Botón Registrar final */}
                            <button 
                              onClick={handleSaveCrop}
                              disabled={cropAcquiring}
                              style={{
                                background: 'linear-gradient(135deg, #065f46, #10b981)',
                                color: 'white', border: 'none', padding: '14px', borderRadius: '12px',
                                fontWeight: 800, fontSize: '1rem', cursor: cropAcquiring ? 'not-allowed' : 'pointer',
                                marginTop: '10px', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                                transition: 'all 0.2s'
                              }}
                              onMouseOver={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                              onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                              {cropAcquiring ? '⏳ Preparando tierra...' : '🚀 ¡Sembrar / Plantar Cultivo!'}
                            </button>

                          </div>
                        </div>
                      )}

                    </div>
                  </div>

                </>
              )}

              {/* PASO 5: ÉXITO */}
              {cropWizardStep === 5 && (
                <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                  <div style={{ fontSize: '4.5rem', marginBottom: '16px' }}>🎉</div>
                  <h3 style={{ color: '#065f46', margin: '0 0 8px', fontSize: '1.4rem', fontWeight: 900 }}>¡Cultivo Registrado con Éxito!</h3>
                  <p style={{ color: '#64748b', margin: 0, fontSize: '0.95rem', lineHeight: 1.5 }}>
                    Tu cultivo de <strong>{selectedCropVariedad?.variedadesnombre}</strong> ya está activo. El progreso de logros se actualizará al instante.
                  </p>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}} />

      {/* Datalists globales para autocompletado en asistentes */}
      <datalist id="main-brands">
        <option value="Semillas Fitó" />
        <option value="Semillas Batlle" />
        <option value="Rocalba" />
        <option value="Vilmorin" />
        <option value="Clemente Viven" />
        <option value="EuroGarden" />
        <option value="Koprima" />
        <option value="Semillas Madre Tierra" />
        <option value="Fito Agrícola" />
        <option value="Semillas Cantueso" />
        <option value="Semillas Silvestres" />
      </datalist>
      <datalist id="buy-places">
        <option value="Leroy Merlin" />
        <option value="Verdecora" />
        <option value="Vivero local" />
        <option value="Amazon" />
        <option value="Lidl" />
        <option value="Aldi" />
        <option value="Ferretería local" />
        <option value="Cooperativa agrícola" />
      </datalist>
    </div>
  );
}
