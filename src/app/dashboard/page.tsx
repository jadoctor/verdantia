'use client';

import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter, useSearchParams } from 'next/navigation';
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
  // Trigger hot reload
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

  // Restaurar estado al montar y persistirlo
  useEffect(() => {
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
      }, 50); // Pequeño delay para que el DOM esté listo
    }

    const handleScroll = () => {
      sessionStorage.setItem('dashboard_scrollY', window.scrollY.toString());
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    sessionStorage.setItem('dashboard_showCultivoDetalle', showCultivoDetalle.toString());
  }, [showCultivoDetalle]);

  useEffect(() => {
    sessionStorage.setItem('dashboard_showSemillasDetalle', showSemillasDetalle.toString());
  }, [showSemillasDetalle]);

  useEffect(() => {
    sessionStorage.setItem('dashboard_isLogrosExpanded', isLogrosExpanded.toString());
  }, [isLogrosExpanded]);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Auto-expandir logros si venimos de otra pestaña como Chat
  useEffect(() => {
    if (searchParams?.get('returnToLogros') === 'true') {
      setIsLogrosExpanded(true);
      setTimeout(() => {
        const el = document.getElementById('chat-requisito-btn');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Efecto de parpadeo para centrar el foco visual
          el.style.transition = 'box-shadow 0.3s ease-in-out';
          el.style.boxShadow = '0 0 0 4px rgba(56, 189, 248, 0.5)';
          setTimeout(() => el.style.boxShadow = '', 2000);
        }
      }, 300);
    }
  }, [searchParams]);

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
            const [logrosRes, totalRes, cultivosRes, semillasRes, comunidadRes] = await Promise.all([
              fetch(`/api/perfil/logros?userId=${data.profile.id}`),
              fetch('/api/admin/ajustes/logros'),
              fetch('/api/user/cultivos', { headers: { 'x-user-email': email } }),
              fetch('/api/user/semillas', { headers: { 'x-user-email': email } }),
              fetch('/api/user/comunidad', { headers: { 'x-user-email': email } })
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
            if (comunidadRes.ok) {
              const comunidadData = await comunidadRes.json();
              const mios = (comunidadData.mensajes || []).filter((m: any) => m.usuario_id === data.profile.id);
              setMisMensajesComunidad(mios);
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
    <div className="welcome-section" style={{ width: '100%', position: 'relative' }}>
      {/* ── Subheader Global (Regla 6) ── */}
      <div style={{
        background: 'linear-gradient(135deg, #059669, #34d399)',
        borderRadius: '16px', padding: '24px 28px', marginBottom: '24px',
        color: 'white', boxShadow: '0 4px 15px rgba(5, 150, 105, 0.15)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>👋</span> Hola, {displayName}
            </h1>
            <p style={{ margin: '4px 0 0', opacity: 0.9, fontSize: '0.9rem' }}>
              Bienvenido al resumen de tu huerto digital en Verdantia.
            </p>
          </div>
          <button
            onClick={() => openCropWizard()}
            style={{
              background: 'white', color: '#059669', border: 'none',
              padding: '12px 24px', borderRadius: '12px', fontWeight: 800,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
              fontSize: '0.95rem', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.2s'
            }}
            onMouseOver={e => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.15)';
            }}
            onMouseOut={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
            }}
          >
            🌱 Sembrar Cultivo
          </button>
        </div>
      </div>

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
                  display: 'flex', flexDirection: 'column', gap: '8px', width: '100%',
                  background: satis ? 'linear-gradient(135deg, rgba(240, 253, 244, 0.9), rgba(220, 252, 231, 0.8))' : 'linear-gradient(135deg, rgba(255, 251, 235, 0.9), rgba(254, 243, 199, 0.8))', 
                  padding: '16px 20px', 
                  borderRadius: '16px', 
                  border: satis ? '2px solid rgba(52, 211, 153, 0.4)' : '2px solid rgba(251, 191, 36, 0.4)',
                  color: satis ? '#065f46' : '#92400e',
                  boxShadow: satis ? '0 8px 20px rgba(52, 211, 153, 0.15), inset 0 2px 4px rgba(255,255,255,0.5)' : '0 8px 20px rgba(251, 191, 36, 0.15), inset 0 2px 4px rgba(255,255,255,0.5)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                  <div style={{
                    width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'white', borderRadius: '14px',
                    boxShadow: satis ? '0 4px 12px rgba(52, 211, 153, 0.3)' : '0 4px 12px rgba(251, 191, 36, 0.3)',
                    animation: satis ? 'none' : 'float 3s ease-in-out infinite'
                  }}>
                    <svg width="28" height="28" viewBox="0 0 32 32" style={{ filter: 'drop-shadow(0 2px 4px rgba(217, 119, 6, 0.3))' }}>
                      <g transform="translate(-6, 4) rotate(-30 16 16) scale(0.8)">
                        <path d="M16 4C20 10 20 22 16 28C12 22 12 10 16 4Z" fill="#d97706" />
                        <path d="M16 6L16 26" stroke="#92400e" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
                      </g>
                      <g transform="translate(6, 4) rotate(30 16 16) scale(0.8)">
                        <path d="M16 4C20 10 20 22 16 28C12 22 12 10 16 4Z" fill="#d97706" />
                        <path d="M16 6L16 26" stroke="#92400e" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
                      </g>
                      <g transform="translate(0, -2)">
                        <path d="M16 4C20 10 20 22 16 28C12 22 12 10 16 4Z" fill="#f59e0b" />
                        <path d="M16 6L16 26" stroke="#b45309" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
                      </g>
                    </svg>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
                    <span style={{ fontSize: '1.05rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
                      {satis ? '¡Colección de semillas! ✅' : 'Colección de semillas'}
                    </span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: satis ? '#059669' : '#b45309', opacity: 0.9 }}>
                      {totalSemillas} / {siguiente.req_semillas} en inventario
                    </span>
                  </div>
                  <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {misSemillas.length > 0 ? (
                      <>
                        <button onClick={() => setShowSemillasDetalle(v => !v)} style={{ 
                          background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(217,119,6,0.3)', 
                          cursor: 'pointer', fontSize: '0.8rem', color: '#b45309', fontWeight: 700, 
                          padding: '8px 14px', borderRadius: '10px', transition: 'all 0.2s',
                          boxShadow: '0 2px 4px rgba(217,119,6,0.05)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', width: '150px', height: '42px', boxSizing: 'border-box'
                        }} onMouseOver={e => e.currentTarget.style.background = 'white'} onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.6)'}>
                          {showSemillasDetalle ? 'Ocultar semillas ▲' : 'Ver semillas ▼'}
                        </button>
                        <a href="/dashboard/semillas" style={{ 
                          fontSize: '0.85rem', color: satis ? '#065f46' : '#92400e', fontWeight: 800, 
                          border: '1px solid ' + (satis ? 'rgba(5, 150, 105, 0.3)' : 'rgba(217, 119, 6, 0.3)'),
                          background: 'rgba(255,255,255,0.5)', padding: '10px 14px', borderRadius: '12px', 
                          textDecoration: 'none', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', width: '175px', height: '42px', boxSizing: 'border-box', whiteSpace: 'nowrap'
                        }} onMouseOver={e => e.currentTarget.style.background = 'white'} onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.5)'}>
                          Ir a mis semillas ➔
                        </a>
                        <button onClick={() => openSeedModal()} style={{ 
                          fontSize: '0.85rem', color: '#92400e', fontWeight: 800, border: 'none',
                          background: 'linear-gradient(to bottom, #fde047, #facc15)', padding: '10px 18px', 
                          borderRadius: '12px', boxShadow: '0 4px 14px rgba(250, 204, 21, 0.4), inset 0 1px 1px rgba(255,255,255,0.6)',
                          cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', width: '175px', height: '42px', boxSizing: 'border-box', whiteSpace: 'nowrap'
                        }} onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(250, 204, 21, 0.5), inset 0 1px 1px rgba(255,255,255,0.6)'; }} onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(250, 204, 21, 0.4), inset 0 1px 1px rgba(255,255,255,0.6)'; }}>
                          Añadir semillas <span style={{ fontSize: '1rem' }}>+</span>
                        </button>
                      </>
                    ) : (
                      <button onClick={() => openSeedModal()} style={{ 
                        fontSize: '0.85rem', color: '#92400e', fontWeight: 800, border: 'none',
                        background: 'linear-gradient(to bottom, #fde047, #facc15)', padding: '10px 18px', 
                        borderRadius: '12px', boxShadow: '0 4px 14px rgba(250, 204, 21, 0.4), inset 0 1px 1px rgba(255,255,255,0.6)',
                        cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '6px'
                      }} onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(250, 204, 21, 0.5), inset 0 1px 1px rgba(255,255,255,0.6)'; }} onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(250, 204, 21, 0.4), inset 0 1px 1px rgba(255,255,255,0.6)'; }}>
                        Añadir ahora <span style={{ fontSize: '1rem' }}>+</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Desplegable de Semillas */}
                <div style={{
                  maxHeight: showSemillasDetalle && misSemillas.length > 0 ? '500px' : '0',
                  opacity: showSemillasDetalle && misSemillas.length > 0 ? 1 : 0,
                  overflow: 'hidden',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                }}>
                  <div style={{ 
                    display: 'flex', flexDirection: 'column', gap: '10px', 
                    padding: '16px', background: 'rgba(255,255,255,0.5)',
                    borderRadius: '16px', border: '1px solid rgba(217,119,6,0.2)',
                    boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.02)',
                    marginTop: '4px'
                  }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#92400e', marginBottom: '4px' }}>
                      Tus Semillas Recientes
                    </div>
                    {misSemillas.slice(0, 5).map((s: any) => (
                      <div key={s.idsemillas} style={{ 
                        background: 'white', padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(217,119,6,0.1)',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                      }}>
                        <span style={{ fontWeight: 800, color: '#1e293b', fontSize: '0.9rem' }}>
                          🌱 {s.especiesnombre}{s.variedades_nombre ? ` (${s.variedades_nombre})` : ''}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ fontSize: '0.75rem', background: '#fef3c7', padding: '2px 8px', borderRadius: '6px', color: '#92400e', fontWeight: 700 }}>
                            Stock: {s.semillasstockactual}
                          </span>
                          <a href={`/dashboard/semillas/${s.idsemillas}`} style={{ fontSize: '0.65rem', color: '#d97706', fontWeight: 800, textDecoration: 'none' }}>Editar ➔</a>
                        </div>
                      </div>
                    ))}
                    {misSemillas.length > 5 && (
                      <div style={{ textAlign: 'center', marginTop: '8px' }}>
                        <a href="/dashboard/semillas" style={{ fontSize: '0.8rem', color: '#d97706', fontWeight: 800, textDecoration: 'none' }}>
                          Ver {misSemillas.length - 5} más ➔
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
            }

            // 🌱 Requisito de Cultivos
            if (siguiente.req_siembras > 0) {
              const cultivosCompletados = misCultivos.filter((c: any) => c.cultivosestado === 'finalizado' && c.cultivosfecharecoleccion && c.fotos_propias_count > 0).length;
              const cultivosEnCurso = misCultivos.filter((c: any) => c.cultivosestado !== 'finalizado' && c.cultivosestado !== 'perdido').length;
              const cultivosEnRecoleccion = misCultivos.filter((c: any) => c.cultivosestado === 'recoleccion').length;
              const satis = cultivosCompletados >= siguiente.req_siembras;
              reqList.push(
                <div key="siembras" style={{ 
                  display: 'flex', flexDirection: 'column', gap: '8px', width: '100%',
                  background: satis ? 'linear-gradient(135deg, rgba(240, 253, 244, 0.9), rgba(220, 252, 231, 0.8))' : 'linear-gradient(135deg, rgba(254, 242, 242, 0.9), rgba(254, 226, 226, 0.8))', 
                  padding: '16px 20px', 
                  borderRadius: '16px', 
                  border: satis ? '2px solid rgba(52, 211, 153, 0.4)' : '2px solid rgba(248, 113, 113, 0.4)',
                  color: satis ? '#065f46' : '#991b1b',
                  boxShadow: satis ? '0 8px 20px rgba(52, 211, 153, 0.15), inset 0 2px 4px rgba(255,255,255,0.5)' : '0 8px 20px rgba(248, 113, 113, 0.15), inset 0 2px 4px rgba(255,255,255,0.5)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    flexWrap: 'wrap', 
                    gap: '16px'
                  }}>
                    <div style={{
                      width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'white', borderRadius: '14px',
                      boxShadow: satis ? '0 4px 12px rgba(52, 211, 153, 0.3)' : '0 4px 12px rgba(248, 113, 113, 0.3)',
                      animation: satis ? 'none' : 'float 3.5s ease-in-out infinite'
                    }}>
                      <svg width="28" height="28" viewBox="0 0 32 32" style={{ filter: 'drop-shadow(0 3px 5px rgba(20, 184, 166, 0.3))' }}>
                        {/* Tallo */}
                        <line x1="18" y1="23" x2="18" y2="6" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />
                        <line x1="18" y1="23" x2="18" y2="6" stroke="#84cc16" strokeWidth="1" strokeLinecap="round" />

                        {/* Hojas */}
                        <g stroke="#1e293b" strokeWidth="1.2" strokeLinejoin="round" fill="#84cc16">
                          <path d="M 18 7 Q 14 7, 14 3 Q 18 3, 18 7 Z" />
                          <path d="M 18 7 Q 22 7, 22 3 Q 18 3, 18 7 Z" />
                          <path d="M 18 12 Q 12 12, 12 6 Q 18 6, 18 12 Z" />
                          <path d="M 18 12 Q 24 12, 24 6 Q 18 6, 18 12 Z" />
                          <path d="M 18 17 Q 10 17, 10 9 Q 18 9, 18 17 Z" />
                          <path d="M 18 17 Q 26 17, 26 9 Q 18 9, 18 17 Z" />
                        </g>

                        {/* Mano */}
                        <path d="M 7 25 C 13 28, 20 29, 25 26 Q 31 23, 30 25 C 28 28, 22 32, 15 32 L 7 30 Z" fill="#fcd34d" stroke="#1e293b" strokeWidth="1.2" strokeLinejoin="round" />
                        
                        {/* Tierra */}
                        <path d="M 10 25 C 10 20, 15 19, 18 19 C 22 19, 25 20, 27 23 C 28 25, 25 27, 18 27 C 12 27, 10 26, 10 25 Z" fill="#78350f" stroke="#1e293b" strokeWidth="1.2" strokeLinejoin="round" />
                        <circle cx="14" cy="21" r="0.75" fill="#1e293b" />
                        <circle cx="21" cy="22" r="0.75" fill="#1e293b" />
                        <circle cx="24" cy="24" r="0.75" fill="#1e293b" />

                        {/* Pulgar */}
                        <path d="M 7 22 C 11 21, 14 22, 15 24 C 13 26, 10 26, 7 25 Z" fill="#fcd34d" stroke="#1e293b" strokeWidth="1.2" strokeLinejoin="round" />

                        {/* Manga */}
                        <path d="M 2 19 L 7 19 L 7 32 L 2 32 Z" fill="#0ea5e9" stroke="#1e293b" strokeWidth="1.2" strokeLinejoin="round" />
                        <path d="M 7 18 L 10 18 L 10 32 L 7 32 Z" fill="#0284c7" stroke="#1e293b" strokeWidth="1.2" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
                      <span style={{ fontSize: '1.05rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
                        {satis ? '¡Cultivos finalizados! ✅' : 'Cosecha tus Cultivos'}
                      </span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: satis ? '#059669' : '#b91c1c', opacity: 0.9 }}>
                        {cultivosCompletados} de {siguiente.req_siembras} cultivo{siguiente.req_siembras > 1 ? 's' : ''} completado{siguiente.req_siembras > 1 ? 's' : ''}
                        {cultivosEnCurso > 0 && (
                          <span style={{ marginLeft: '6px', paddingLeft: '6px', borderLeft: '1px solid currentColor', opacity: 0.8 }}>
                            {cultivosEnCurso} en curso
                          </span>
                        )}
                      </span>
                      <div style={{ marginTop: '8px', fontSize: '0.75rem', color: satis ? '#064e3b' : '#7f1d1d', opacity: 0.85, lineHeight: 1.4 }}>
                        <strong style={{ display: 'block', marginBottom: '4px' }}>Criterios para contabilizar:</strong>
                        <ul style={{ margin: 0, paddingLeft: '16px' }}>
                          <li>Cultivo en estado <strong>Finalizado</strong>.</li>
                          <li>Tener registrada <strong>Fecha de Recolección</strong>.</li>
                          <li>Tener al menos <strong>1 foto asociada</strong>.</li>
                        </ul>
                      </div>
                    </div>
                    
                    {!satis && (
                      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {cultivosEnRecoleccion > 0 ? (
                          <a href="/dashboard/mis-plantas" style={{ 
                            fontSize: '0.85rem', 
                            color: '#854d0e', 
                            fontWeight: 800, 
                            textDecoration: 'none', 
                            background: 'linear-gradient(to bottom, #fde047, #facc15)', 
                            padding: '10px 18px', 
                            borderRadius: '12px',
                            boxShadow: '0 4px 14px rgba(250, 204, 21, 0.4), inset 0 1px 1px rgba(255,255,255,0.6)',
                            transition: 'all 0.2s',
                            display: 'flex', alignItems: 'center', gap: '6px'
                          }}>
                            🧺 Recolectar <span style={{ fontSize: '1rem' }}>➔</span>
                          </a>
                        ) : cultivosEnCurso > 0 ? (
                          <>
                            <button onClick={() => setShowCultivoDetalle(v => !v)} style={{ 
                              background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(248,113,113,0.3)', 
                              cursor: 'pointer', fontSize: '0.8rem', color: '#b91c1c', fontWeight: 700, 
                              padding: '8px 14px', borderRadius: '10px', transition: 'all 0.2s',
                              boxShadow: '0 2px 4px rgba(248,113,113,0.05)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', width: '150px', height: '42px', boxSizing: 'border-box'
                            }} onMouseOver={e => e.currentTarget.style.background = 'white'} onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.6)'}>
                              {showCultivoDetalle ? 'Ocultar progreso ▲' : 'Ver progreso ▼'}
                            </button>
                            <a href="/dashboard/mis-plantas" style={{ 
                              fontSize: '0.85rem', 
                              color: '#b91c1c', 
                              fontWeight: 800, 
                              textDecoration: 'none', 
                              border: '1px solid rgba(248, 113, 113, 0.3)',
                              background: 'rgba(255,255,255,0.5)', 
                              padding: '10px 14px', 
                              borderRadius: '12px',
                              transition: 'all 0.2s',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', width: '175px', height: '42px', boxSizing: 'border-box', whiteSpace: 'nowrap'
                            }} onMouseOver={e => e.currentTarget.style.background = 'white'} onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.5)'}>
                              Ir a mis cultivos ➔
                            </a>
                            <button onClick={() => openCropWizard()} style={{ 
                              fontSize: '0.85rem', 
                              color: 'white', 
                              fontWeight: 800, 
                              border: 'none',
                              background: 'linear-gradient(to bottom, #fb7185, #f43f5e)', 
                              padding: '10px 18px', 
                              borderRadius: '12px',
                              boxShadow: '0 4px 14px rgba(244, 63, 94, 0.4), inset 0 1px 1px rgba(255,255,255,0.3)',
                              cursor: 'pointer', transition: 'all 0.2s',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', width: '175px', height: '42px', boxSizing: 'border-box', whiteSpace: 'nowrap'
                            }} onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(244, 63, 94, 0.5), inset 0 1px 1px rgba(255,255,255,0.3)'; }} onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(244, 63, 94, 0.4), inset 0 1px 1px rgba(255,255,255,0.3)'; }}>
                              Añadir cultivo <span style={{ fontSize: '1rem' }}>+</span>
                            </button>
                            </>
                        ) : (
                          <button onClick={() => openCropWizard()} style={{ 
                            fontSize: '0.85rem', 
                            color: 'white', 
                            fontWeight: 800, 
                            border: 'none',
                            background: 'linear-gradient(to bottom, #fb7185, #f43f5e)', 
                            padding: '10px 18px', 
                            borderRadius: '12px',
                            boxShadow: '0 4px 14px rgba(244, 63, 94, 0.4), inset 0 1px 1px rgba(255,255,255,0.3)',
                            cursor: 'pointer', transition: 'all 0.2s',
                            display: 'flex', alignItems: 'center', gap: '6px'
                          }}>
                            Crear nuevo ➔
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Timeline Desplegable Premium */}
                  <div style={{
                    maxHeight: showCultivoDetalle && !satis && cultivosEnCurso > 0 ? '500px' : '0',
                    opacity: showCultivoDetalle && !satis && cultivosEnCurso > 0 ? 1 : 0,
                    overflowX: 'hidden',
                    overflowY: 'hidden',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}>
                    <div style={{ 
                      display: 'flex', flexDirection: 'column', gap: '10px', 
                      padding: '16px', background: 'rgba(255,255,255,0.4)',
                      borderRadius: '16px', border: '1px solid rgba(248,113,113,0.2)',
                      boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.02)',
                      marginTop: '4px'
                    }}>
                      {misCultivos
                        .filter((c: any) => c.cultivosestado !== 'perdido')
                        .map((c: any, ci: number) => {
                          const fmt = (d: string | null) => d ? new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: '2-digit' }) : null;
                          const fases = [
                            { label: 'Inicio', fecha: fmt(c.cultivosfechainicio) },
                            { label: 'Germinación', fecha: fmt(c.cultivosfechagerminacion) },
                            { label: 'Trasplante', fecha: fmt(c.cultivosfechatrasplante) },
                            { label: 'Recolección', fecha: fmt(c.cultivosfecharecoleccion) },
                            { label: 'Finalizado', fecha: fmt(c.cultivosfechafinalizacion) }
                          ];
                          const completadas = fases.filter(f => f.fecha);
                          const proxima = fases.find(f => !f.fecha);
                          return (
                            <div key={ci} style={{ 
                              background: 'white', border: '1px solid rgba(0,0,0,0.05)', 
                              borderRadius: '12px', padding: '12px 16px', 
                              boxShadow: '0 4px 6px rgba(0,0,0,0.02)',
                              display: 'flex', flexDirection: 'column', gap: '8px'
                            }}>
                              <div style={{ fontWeight: 900, color: '#0f172a', fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  🌿 {c.especiesnombre}{c.variedad_nombre ? <span style={{ fontWeight: 500, color: '#64748b' }}> ({c.variedad_nombre})</span> : null}
                                </span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ fontSize: '0.75rem', background: '#f1f5f9', padding: '2px 8px', borderRadius: '6px', color: '#64748b' }}>Nº {c.cultivosnumerocoleccion || c.idcultivos}</span>
                                  <a href={`/dashboard/cultivos/${c.idcultivos}`} style={{ 
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                    width: '26px', height: '26px', background: '#e2e8f0', borderRadius: '6px', 
                                    color: '#475569', textDecoration: 'none', transition: 'all 0.2s'
                                  }} onMouseOver={e => e.currentTarget.style.background = '#cbd5e1'} onMouseOut={e => e.currentTarget.style.background = '#e2e8f0'}>
                                    ✏️
                                  </a>
                                </div>
                              </div>
                              
                              <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '4px' }}>
                                {completadas.map((f, fi) => (
                                  <div key={fi} style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: '80px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                      <span style={{ fontSize: '0.7rem' }}>✅</span>
                                      <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#059669' }}>{f.label}</span>
                                    </div>
                                    <span style={{ fontSize: '0.65rem', color: '#64748b', paddingLeft: '16px' }}>{f.fecha}</span>
                                  </div>
                                ))}
                                {proxima && (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: '90px', borderLeft: '2px dashed #cbd5e1', paddingLeft: '12px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                      <span style={{ fontSize: '0.7rem' }}>⏳</span>
                                      <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#d97706' }}>{proxima.label}</span>
                                    </div>
                                    <a href={`/dashboard/cultivos/${c.idcultivos}`} style={{ fontSize: '0.65rem', color: '#2563eb', fontWeight: 700, paddingLeft: '16px', textDecoration: 'none' }}>Actualizar ➔</a>
                                  </div>
                                )}
                              </div>

                              {/* Bloque de requisitos de rango */}
                              <div style={{
                                marginTop: '4px', paddingTop: '8px', borderTop: '1px solid rgba(0,0,0,0.05)',
                                display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '0.7rem', fontWeight: 700
                              }}>
                                {c.cultivosfechafinalizacion && c.cultivosfecharecoleccion && c.fotos_propias_count > 0 ? (
                                  <span style={{ color: '#059669', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    ✅ Contabilizado para el rango
                                  </span>
                                ) : (
                                  <>
                                    <span style={{ color: '#64748b' }}>Pendiente para contabilizar:</span>
                                    {!c.cultivosfechafinalizacion && (
                                      <span style={{ color: '#d97706', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        ⏳ Falta fecha de finalización
                                      </span>
                                    )}
                                    {!c.cultivosfecharecoleccion && (
                                      <span style={{ color: '#dc2626', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        📅 Falta fecha recolección
                                      </span>
                                    )}
                                    {(!c.fotos_propias_count || c.fotos_propias_count === 0) && (
                                      <span style={{ color: '#dc2626', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        📷 Falta foto
                                      </span>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>
              );
            }

            // 💬 Requisito de Mensajes
            if (siguiente.req_mensajes > 0) {
              const mensajesEnviados = misMensajesComunidad.length;
              const satis = mensajesEnviados >= siguiente.req_mensajes;
              reqList.push(
                <div key="mensajes" style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  flexWrap: 'wrap', 
                  gap: '16px', 
                  background: satis ? 'linear-gradient(135deg, rgba(240, 253, 244, 0.9), rgba(220, 252, 231, 0.8))' : 'linear-gradient(135deg, rgba(240, 249, 255, 0.9), rgba(224, 242, 254, 0.8))', 
                  padding: '16px 20px', 
                  borderRadius: '16px', 
                  border: satis ? '2px solid rgba(52, 211, 153, 0.4)' : '2px solid rgba(56, 189, 248, 0.4)',
                  color: satis ? '#065f46' : '#0369a1',
                  boxShadow: satis ? '0 8px 20px rgba(52, 211, 153, 0.15), inset 0 2px 4px rgba(255,255,255,0.5)' : '0 8px 20px rgba(56, 189, 248, 0.15), inset 0 2px 4px rgba(255,255,255,0.5)'
                }}>
                  <div style={{
                    width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'white', borderRadius: '14px',
                    boxShadow: satis ? '0 4px 12px rgba(52, 211, 153, 0.3)' : '0 4px 12px rgba(56, 189, 248, 0.3)'
                  }}>
                    <span style={{ fontSize: '1.8rem', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}>💬</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
                    <span style={{ fontSize: '1.05rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
                      {satis ? '¡Comunidad activa! ✅' : 'Participa en el Chat'}
                    </span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: satis ? '#059669' : '#0284c7', opacity: 0.9 }}>
                      {mensajesEnviados} de {siguiente.req_mensajes} mensaje{siguiente.req_mensajes > 1 ? 's' : ''} en el grupo de Comunidad Verdantia
                    </span>
                  </div>
                  {!satis && (
                    <a id="chat-requisito-btn" href="/dashboard/comunidad?from=rangos" style={{ 
                      marginLeft: 'auto', 
                      fontSize: '0.85rem', 
                      color: 'white', 
                      fontWeight: 800, 
                      textDecoration: 'none', 
                      background: 'linear-gradient(to bottom, #38bdf8, #0284c7)', 
                      padding: '10px 18px', 
                      borderRadius: '12px',
                      boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4), inset 0 1px 1px rgba(255,255,255,0.3)',
                      transition: 'all 0.2s',
                      display: 'flex', alignItems: 'center', gap: '6px'
                    }}>
                      Ir al Chat ➔
                    </a>
                  )}
                </div>
              );
            }

            // Fallback si no hay requisitos explícitos
            if (reqList.length === 0) {
              reqList.push(
                <div key="fallback" style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '16px', 
                  background: 'linear-gradient(135deg, rgba(248, 250, 252, 0.9), rgba(241, 245, 249, 0.8))', 
                  padding: '16px 20px', 
                  borderRadius: '16px', 
                  border: '1px solid rgba(203, 213, 225, 0.8)',
                  color: '#475569'
                }}>
                  <div style={{ width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white', borderRadius: '14px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                    <span style={{ fontSize: '1.8rem' }}>✉️</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
                    <span style={{ fontSize: '1.05rem', fontWeight: 800 }}>Misión Principal</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{siguiente.logrosdescripcion || 'Completa tu perfil y verifica tu correo para desbloquear el siguiente rango.'}</span>
                  </div>
                </div>
              );
            }

            let totalWeight = 0;
            let currentProgress = 0;

            if (siguiente.req_semillas > 0) {
              totalWeight += 1;
              currentProgress += Math.min(misSemillas.length / siguiente.req_semillas, 1);
            }
            if (siguiente.req_siembras > 0) {
              const cultivosCompletados = misCultivos.filter((c: any) => c.cultivosestado === 'finalizado' && c.cultivosfecharecoleccion && c.fotos_propias_count > 0).length;
              totalWeight += 1;
              currentProgress += Math.min(cultivosCompletados / siguiente.req_siembras, 1);
            }
            if (siguiente.req_mensajes > 0) {
              const mensajesEnviados = misMensajesComunidad.length;
              totalWeight += 1;
              currentProgress += Math.min(mensajesEnviados / siguiente.req_mensajes, 1);
            }
            
            const progresoPorcentaje = totalWeight > 0 ? Math.round((currentProgress / totalWeight) * 100) : 0;

            return (
              <>
                {!isLogrosExpanded ? (
                  <div 
                    onClick={() => setIsLogrosExpanded(true)}
                    style={{
                      marginBottom: '2.5rem',
                      padding: '1rem 1.5rem',
                      background: 'linear-gradient(135deg, rgba(254, 240, 138, 0.4), rgba(253, 224, 71, 0.35))',
                      color: '#854d0e',
                      border: '1.5px solid rgba(234, 179, 8, 0.4)',
                      borderRadius: '16px',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '1.5rem', filter: 'drop-shadow(0 2px 4px rgba(234,179,8,0.25))' }}>{actualLogroIcono}</span>
                      <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>Rango Actual: {actualLogroNombre}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 700, color: '#ca8a04' }}>
                      Progreso {progresoPorcentaje}% <span style={{ fontSize: '1rem' }}>▼</span>
                    </div>
                  </div>
                ) : (
                  <div style={{
                    marginBottom: '2.5rem',
                    padding: '2rem',
                    background: 'linear-gradient(135deg, rgba(254, 240, 138, 0.4), rgba(253, 224, 71, 0.35))',
                    color: '#854d0e',
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
                      
                      {/* Agrupación Izquierda: Botón Colapso + Rango Actual */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <button 
                          onClick={() => setIsLogrosExpanded(false)}
                          style={{
                            background: 'rgba(0,0,0,0.05)', color: '#475569', border: 'none', borderRadius: '50%', 
                            width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', 
                            justifyContent: 'center', transition: 'background 0.2s', flexShrink: 0
                          }}
                          onMouseOver={e => e.currentTarget.style.background = 'rgba(0,0,0,0.1)'}
                          onMouseOut={e => e.currentTarget.style.background = 'rgba(0,0,0,0.05)'}
                          title="Ocultar progreso"
                        >
                          ▲
                        </button>
                        
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
                      </div>

                      {/* Barra de Progreso Central */}
                      <div style={{ flex: 1, minWidth: '200px', display: 'flex', flexDirection: 'column', gap: '8px', padding: '0 10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#475569', fontWeight: 800 }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>📊 Progreso al próximo rango</span>
                          <span style={{ background: 'rgba(0,0,0,0.05)', padding: '2px 8px', borderRadius: '6px', color: '#15803d' }}>{progresoPorcentaje}%</span>
                        </div>
                        <div style={{ height: '16px', background: 'rgba(0, 0, 0, 0.15)', clipPath: 'polygon(0 0, calc(100% - 15px) 0, 100% 50%, calc(100% - 15px) 100%, 0 100%)', position: 'relative', borderRadius: '4px 0 0 4px' }}>
                          <div style={{ position: 'absolute', top: '1px', bottom: '1px', left: '1px', right: '2.125px', background: 'rgba(255, 255, 255, 0.7)', clipPath: 'polygon(0 0, calc(100% - 13.125px) 0, 100% 50%, calc(100% - 13.125px) 100%, 0 100%)', overflow: 'hidden', borderRadius: '3px 0 0 3px' }}>
                            <div style={{ height: '100%', width: `${Math.min(progresoPorcentaje, 100)}%`, background: 'linear-gradient(to right, #fbbf24, #34d399, #3b82f6)', transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                          </div>
                        </div>
                      </div>

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
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {/* Renderizado de Requisitos */}
                      {reqList}
                    </div>

                  </div>
                )}
              </>
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

// force refresh 06/10/2026 17:01:25
