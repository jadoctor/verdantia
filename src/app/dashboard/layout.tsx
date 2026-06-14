'use client';
// Force reload layout after maintenance path move
import './dashboard.css';
import { auth } from '@/lib/firebase/config';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useState, useCallback, Suspense } from 'react';
import { getMediaUrl } from '@/lib/media-url';
import ConflictosDashboard from '@/components/user/ConflictosDashboard';
import { getPlanConfig } from '@/lib/plan-config';
import RangoBadge from '@/components/ui/RangoBadge';

interface UserProfile {
  id: number;
  nombre: string;
  apellidos: string;
  email: string;
  roles: string;
  icono: string | null;
  estadoCuenta: string;
  nombreUsuario: string | null;
  fotoPreferida?: string | null;
  fotoPreferidaMeta?: string | null;
  iconoLogro?: string | null;
  correoVerificado?: boolean;
  codigoPostal?: string | null;
  poblacion?: string | null;
  tipoCalendario?: string;
  fotosRechazadasCount?: number;
  suscripcion?: string;
  nombreLogro?: string | null;
  nivelLogro?: number | null;
}

// Función sencilla para calcular la fase lunar aproximada
function getMoonPhase() {
  const LUNAR_MONTH = 29.53058867;
  const knownNewMoon = new Date('2000-01-06T18:14:00Z').getTime();
  const now = new Date().getTime();
  
  const diff = now - knownNewMoon;
  const days = diff / (1000 * 60 * 60 * 24);
  const phase = days % LUNAR_MONTH;
  
  if (phase < 1.84 || phase > 27.68) return { name: 'Luna Nueva', icon: '🌑' };
  if (phase < 5.53) return { name: 'Luna Creciente', icon: '🌒' };
  if (phase < 9.22) return { name: 'Cuarto Creciente', icon: '🌓' };
  if (phase < 12.91) return { name: 'Gibosa Creciente', icon: '🌔' };
  if (phase < 16.61) return { name: 'Luna Llena', icon: '🌕' };
  if (phase < 20.30) return { name: 'Gibosa Menguante', icon: '🌖' };
  if (phase < 24.00) return { name: 'Cuarto Menguante', icon: '🌗' };
  return { name: 'Luna Menguante', icon: '🌘' };
}

// Función sencilla para simular el ciclo sideral de la luna (elementos biodinámicos)
function getBiodynamicDay() {
  const SIDEREAL_MONTH = 27.32166;
  const referenceTime = new Date('2024-01-01T00:00:00Z').getTime(); 
  const now = new Date().getTime();
  
  const diff = now - referenceTime;
  const days = diff / (1000 * 60 * 60 * 24);
  const cyclePosition = (days % SIDEREAL_MONTH) / SIDEREAL_MONTH;
  const zodiacIndex = Math.floor(cyclePosition * 12);
  
  const types = [
    { name: 'Día de Fruto', icon: '🍅' }, // Aries
    { name: 'Día de Raíz', icon: '🥕' }, // Tauro
    { name: 'Día de Flor', icon: '🌻' }, // Géminis
    { name: 'Día de Hoja', icon: '🥬' }, // Cáncer
    { name: 'Día de Fruto', icon: '🍅' }, // Leo
    { name: 'Día de Raíz', icon: '🥕' }, // Virgo
    { name: 'Día de Flor', icon: '🌻' }, // Libra
    { name: 'Día de Hoja', icon: '🥬' }, // Escorpio
    { name: 'Día de Fruto', icon: '🍅' }, // Sagitario
    { name: 'Día de Raíz', icon: '🥕' }, // Capricornio
    { name: 'Día de Flor', icon: '🌻' }, // Acuario
    { name: 'Día de Hoja', icon: '🥬' }  // Piscis
  ];
  
  return types[zodiacIndex];
}

function DashboardLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const fromParam = searchParams.get('from');

  const FROM_LABELS: Record<string, { label: string; path: string; icon: string }> = {
    mantenimiento: { label: 'Copias de Seguridad', path: '/dashboard/admin/mantenimiento', icon: '📁' },
    analisis: { label: 'Análisis de Dashboard', path: '/dashboard/admin/mantenimiento/analisis', icon: '📊' },
  };
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth > 768;
    }
    return true;
  });
  const [superAdminExpanded, setSuperAdminExpanded] = useState(true);
  const [huertoExpanded, setHuertoExpanded] = useState(true);
  const [utilidadesExpanded, setUtilidadesExpanded] = useState(true);
  const [ajustesHover, setAjustesHover] = useState(false);
  const [tareasAgricolasHover, setTareasAgricolasHover] = useState(false);
  const [tareasAdministrativasHover, setTareasAdministrativasHover] = useState(false);
  const [bancalesHover, setBancalesHover] = useState(false);
  const [mantenimientoHover, setMantenimientoHover] = useState(false);
  const [bancalesList, setBancalesList] = useState<any[]>([]);
  const [weatherData, setWeatherData] = useState<any>(null);
  const [emailVerified, setEmailVerified] = useState(false);

  // ── Breadcrumb contextual derivado del pathname ──
  const ROUTE_MAP: Record<string, { label: string; icon: string }> = {
    '/dashboard': { label: 'Inicio', icon: '🏠' },
    '/dashboard/perfil': { label: 'Mi Perfil', icon: '👤' },
    '/dashboard/meteo': { label: 'Mi Meteo Local', icon: '⛅' },
    '/dashboard/comunidad': { label: 'Chat Comunidad', icon: '💬' },
    '/dashboard/plantar': { label: '¿Qué Plantar?', icon: '✨' },
    '/dashboard/calculadora': { label: 'Calculadora', icon: '🧮' },
    '/dashboard/mis-plantas': { label: 'Mis Hortalizas', icon: '🌱' },
    '/dashboard/semillas': { label: 'Semillas', icon: '🌾' },
    '/dashboard/cultivos': { label: 'Mis Cultivos', icon: '🌿' },
    '/dashboard/tareas': { label: 'Tareas', icon: '🔔' },
    '/dashboard/admin/especies': { label: 'Gestor de Especies Globales', icon: '🌍' },
    '/dashboard/admin/especies/nueva': { label: 'Nueva Especie', icon: '➕' },
    '/dashboard/admin/fases': { label: 'Fases de Cultivo', icon: '🌱' },
    '/dashboard/admin/fases/nueva': { label: 'Nueva Fase', icon: '➕' },
    '/dashboard/admin/variedades': { label: 'Variedades Globales', icon: '🏷️' },
    '/dashboard/admin/labores': { label: 'Labores Globales', icon: '🔧' },
    '/dashboard/admin/labores/nueva': { label: 'Nueva Labor', icon: '🛠️' },
    '/dashboard/admin/plagas': { label: 'Plagas Globales', icon: '🐛' },
    '/dashboard/admin/tareas/contenedores': { label: 'Contenedores', icon: '🌱' },
    '/dashboard/admin/familias': { label: 'Familias Botánicas', icon: '🧬' },
    '/dashboard/admin/usuarios': { label: 'Usuarios', icon: '👥' },
    '/dashboard/admin/chat': { label: 'Chat Admin', icon: '💬' },
    '/dashboard/admin/meteo': { label: 'Meteo Red Global', icon: '🌐' },
    '/dashboard/bancales': { label: 'Mis Bancales', icon: '🌿' },
    '/dashboard/admin/guia-usuario': { label: 'Guía de Usuario', icon: '📖' },
    '/dashboard/admin/asuntos-pendientes': { label: 'Asuntos Pendientes', icon: '📋' },
    '/dashboard/admin/asuntos-realizados': { label: 'Asuntos Realizados', icon: '✅' },
    '/dashboard/admin/blog': { label: 'Gestor Blog IA', icon: '📝' },
    '/dashboard/admin/mantenimiento': { label: 'Copias de Seguridad', icon: '📁' },
    '/dashboard/admin/mantenimiento/analisis': { label: 'Análisis de Dashboard', icon: '📊' },
    '/dashboard/admin/mantenimiento/biblia': { label: 'La Biblia', icon: '📜' },
  };

  const getBreadcrumbs = () => {
    // Ruta exacta
    if (ROUTE_MAP[pathname]) {
      if (pathname === '/dashboard') return [];
      return [ROUTE_MAP[pathname]];
    }
    // Rutas dinámicas: /dashboard/admin/especies/[id]
    const especieMatch = pathname.match(/^\/dashboard\/admin\/especies\/(\d+)$/);
    if (especieMatch) {
      return [
        ROUTE_MAP['/dashboard/admin/especies'],
        { label: 'Detalle Especie', icon: '🌿' },
      ];
    }
    // Rutas dinámicas: /dashboard/admin/fases/[id]
    const faseMatch = pathname.match(/^\/dashboard\/admin\/fases\/(\d+)$/);
    if (faseMatch) {
      return [
        ROUTE_MAP['/dashboard/admin/fases'],
        { label: 'Detalle Fase', icon: '✏️' },
      ];
    }
    const laborMatch = pathname.match(/^\/dashboard\/admin\/labores\/(\d+)$/);
    if (laborMatch) {
      return [
        ROUTE_MAP['/dashboard/admin/labores'],
        { label: 'Detalle Labor', icon: '🔨' },
      ];
    }
    const familiaMatch = pathname.match(/^\/dashboard\/admin\/familias\/(\d+)$/);
    if (familiaMatch) {
      return [
        ROUTE_MAP['/dashboard/admin/familias'],
        { label: 'Detalle Familia', icon: '🧬' },
      ];
    }
    const contenedorMatch = pathname.match(/^\/dashboard\/admin\/tareas\/contenedores\/(.+)$/);
    if (contenedorMatch) {
      return [
        ROUTE_MAP['/dashboard/admin/tareas/contenedores'],
        { label: 'Editar Contenedor', icon: '🌱' },
      ];
    }
    const usuarioMatch = pathname.match(/^\/dashboard\/admin\/usuarios\/(\d+)$/);
    if (usuarioMatch) {
      return [
        ROUTE_MAP['/dashboard/admin/usuarios'],
        { label: 'Perfil de Usuario', icon: '👤' },
      ];
    }
    const misPlantasMatch = pathname.match(/^\/dashboard\/mis-plantas\/(\d+)$/);
    if (misPlantasMatch) {
      return [
        ROUTE_MAP['/dashboard/mis-plantas'],
        { label: 'Detalle de Hortaliza', icon: '🌿' },
      ];
    }
    const bancalMatch = pathname.match(/^\/dashboard\/bancales\/(\d+)$/);
    if (bancalMatch) {
      return [
        { label: 'Mis Bancales', icon: '🌿' },
        { label: 'Detalle Bancal', icon: '🛏️' },
      ];
    }
    return [];
  };

  const breadcrumbs = getBreadcrumbs();
  // URL padre (penúltimo nivel) para el botón de retroceso
  const getParentUrl = () => {
    const especieMatch = pathname.match(/^\/dashboard\/admin\/especies\/(\d+)$/);
    if (especieMatch) return '/dashboard/admin/especies';
    const faseMatch = pathname.match(/^\/dashboard\/admin\/fases\/(\d+)$/);
    if (faseMatch) return '/dashboard/admin/fases';
    const laborMatch = pathname.match(/^\/dashboard\/admin\/labores\/(\d+)$/);
    if (laborMatch) return '/dashboard/admin/labores';
    const familiaMatch = pathname.match(/^\/dashboard\/admin\/familias\/(\d+)$/);
    if (familiaMatch) return '/dashboard/admin/familias';
    const usuarioMatch = pathname.match(/^\/dashboard\/admin\/usuarios\/(\d+)$/);
    if (usuarioMatch) return '/dashboard/admin/usuarios';
    const misPlantasMatch = pathname.match(/^\/dashboard\/mis-plantas\/(\d+)$/);
    if (misPlantasMatch) return '/dashboard/mis-plantas';
    const bancalMatch = pathname.match(/^\/dashboard\/bancales\/(\d+)$/);
    if (bancalMatch) return '/dashboard';
    return '/dashboard';
  };
  const parentUrl = getParentUrl();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login');
        return;
      }
      setEmailVerified(user.emailVerified);

      // Buscar perfil en Cloud SQL
      try {
        const res = await fetch(`/api/auth/profile?email=${encodeURIComponent(user.email!)}`, { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } });
        if (res.ok) {
          const data = await res.json();
          setProfile(data.profile as UserProfile);
        }
      } catch (err) {
        console.error('Error cargando perfil:', err);
      } finally {
        setLoading(false);
      }
    });

    // Fetch bancales del usuario
    const fetchBancales = async (userEmail: string) => {
      try {
        const res = await fetch('/api/user/bancales', { headers: { 'x-user-email': userEmail } });
        if (res.ok) {
          const data = await res.json();
          setBancalesList(data.bancales || []);
        }
      } catch (err) {
        console.error('Error cargando bancales:', err);
      }
    };

    onAuthStateChanged(auth, (user) => {
      if (user?.email) fetchBancales(user.email);
    });

    return () => unsubscribe();
  }, [router]);

  // Escuchar eventos de actualización del perfil (BroadcastChannel es más fiable entre contextos)
  useEffect(() => {
    const channel = new BroadcastChannel('verdantia_profile');
    
    const handleUpdate = (data: any) => {
      console.log("📢 Verdantia Sync: Actualizando UI...", data);
      setProfile((prev) => {
        if (!prev) return null;
        return { ...prev, ...data };
      });
    };

    channel.onmessage = (event) => handleUpdate(event.data);

    // Mantener compatibilidad con CustomEvent por si acaso
    const handleCustomEvent = (e: any) => handleUpdate(e.detail);
    window.addEventListener('profile_updated', handleCustomEvent);

    return () => {
      channel.close();
      window.removeEventListener('profile_updated', handleCustomEvent);
    };
  }, []);

  const handleConflictResolved = useCallback(() => {
    if (auth.currentUser) {
      fetch(`/api/auth/profile?email=${encodeURIComponent(auth.currentUser.email!)}`, { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } })
        .then(res => res.json())
        .then(data => {
          if (data.profile) setProfile(data.profile);
        });
    }
  }, []);

  useEffect(() => {
    if (!profile || !emailVerified || (!profile.codigoPostal && !profile.poblacion)) return;

    const fetchWeather = async () => {
      const zip = profile.codigoPostal || '';
      const poblacion = profile.poblacion || '';
      // Cache por fecha Y HORA (se actualizará automáticamente al cambiar de hora)
      const currentHour = new Date().getHours();
      const cacheKey = `v_weather_${zip}_${poblacion}_${new Date().toISOString().split('T')[0]}_H${currentHour}`;
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        try { 
          const parsed = JSON.parse(cached);
          if (parsed.lat && parsed.lon) {
            setWeatherData(parsed); 
            return; 
          }
        } catch(e){}
      }

      try {
        let lat, lon, pName;
        if (poblacion) {
          const geoCtx = await fetch('https://geocoding-api.open-meteo.com/v1/search?name=' + encodeURIComponent(poblacion) + '&language=es&count=1');
          const geoInfo = await geoCtx.json();
          if (geoInfo.results?.length > 0) {
            lat = geoInfo.results[0].latitude;
            lon = geoInfo.results[0].longitude;
            pName = geoInfo.results[0].name;
          }
        }
        if (!lat && zip) {
          const geoCtx = await fetch('https://api.zippopotam.us/es/' + encodeURIComponent(zip));
          if (geoCtx.ok) {
            const geoInfo = await geoCtx.json();
            lat = geoInfo.places[0].latitude;
            lon = geoInfo.places[0].longitude;
            pName = geoInfo.places[0]['place name'];
          }
        }
        if (!lat) return;

        const meteoCtx = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&current=temperature_2m&hourly=temperature_2m&past_hours=2&forecast_days=1&timezone=auto`);
        if (!meteoCtx.ok) return;
        const mInfo = await meteoCtx.json();

        const tMax = Math.round(mInfo.daily.temperature_2m_max[0]);
        const tMin = Math.round(mInfo.daily.temperature_2m_min[0]);
        const tRain = mInfo.daily.precipitation_sum[0] || 0;
        const tCurr = Math.round(mInfo.current.temperature_2m);

        let trend = 'estable';
        if (mInfo.hourly?.temperature_2m && mInfo.hourly?.time) {
          let currTimeIdx = mInfo.hourly.time.indexOf(mInfo.current.time);
          if (currTimeIdx === -1) currTimeIdx = 2; 
          if (currTimeIdx >= 1 && mInfo.hourly.temperature_2m.length > currTimeIdx) {
            const prevTemp = mInfo.hourly.temperature_2m[currTimeIdx - 1];
            const currHourlyTemp = mInfo.hourly.temperature_2m[currTimeIdx];
            if (currHourlyTemp > prevTemp) trend = 'subiendo';
            else if (currHourlyTemp < prevTemp) trend = 'bajando';
          }
        }

        const finalLocName = poblacion ? poblacion : pName;
        const updateTime = new Date().toLocaleTimeString('es-ES', {hour: '2-digit', minute:'2-digit'});
        
        const wData = { 
          max: tMax, min: tMin, current: tCurr, trend, name: finalLocName, rain: tRain, updated: updateTime,
          lat: Number(lat).toFixed(4), lon: Number(lon).toFixed(4)
        };
        sessionStorage.setItem(cacheKey, JSON.stringify(wData));
        window.dispatchEvent(new Event('weather_updated'));
        setWeatherData(wData);
      } catch (err) {
        console.warn('Weather fetch failed', err);
      }
    };

    fetchWeather();
  }, [profile, emailVerified]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const isSuperAdmin = profile?.roles?.includes('superadministrador');
  const isAdmin = profile?.roles?.includes('administrador') || isSuperAdmin;
  const displayName = profile?.nombreUsuario || profile?.nombre || 'Agricultor';
  
  let AvatarComponent: React.ReactNode = null;
  // Lista de emojis permitidos (la misma que en la versión PHP)
  const allowedIcons = ['🌱','🌿','🍀','🍃','🌾','🌻','🌷','🌹','🌵','🌴','🍄','🪴','🐝','🦋','🐞','🐛','🐌','🐇','🦉','🐦','🦆','🐓','🐢','🦔','🐸','🐟','🐑','🐐','🐄','🐎','🐕','🐈','🦜','🦚','🦢'];
  
  const hasCustomIcon = profile?.icono && allowedIcons.includes(profile.icono);

  if (hasCustomIcon) {
    AvatarComponent = <span title="Icono personalizado" style={{ fontSize: '1.4rem' }}>{profile.icono}</span>;
  } else if (profile?.fotoPreferida) {
    let meta: any = { profile_object_x: 50, profile_object_y: 38, profile_object_zoom: 100, profile_style: '', profile_brightness: 100, profile_contrast: 100 };
    try {
      if (profile.fotoPreferidaMeta) {
        meta = { ...meta, ...JSON.parse(profile.fotoPreferidaMeta) };
      }
    } catch {}

    const STYLE_FILTERS: Record<string, string> = {
      '': 'none',
      comic: 'contrast(1.45) saturate(1.55) brightness(1.08)',
      manga: 'grayscale(1) contrast(1.85) brightness(1.1)',
      watercolor: 'saturate(1.35) contrast(0.88) brightness(1.14)',
      sketch: 'grayscale(1) contrast(2.2) brightness(1.18)',
      pop: 'saturate(1.95) contrast(1.3) brightness(1.06)',
      vintage: 'sepia(0.65) contrast(1.08) saturate(0.78) brightness(1.03)',
      cinematic: 'contrast(1.22) saturate(0.72) hue-rotate(338deg) brightness(0.98)',
      hdr: 'contrast(1.35) saturate(1.3) brightness(1.07)'
    };

    const filterStyle = `${STYLE_FILTERS[meta.profile_style] === 'none' ? '' : (STYLE_FILTERS[meta.profile_style] || '')} brightness(${meta.profile_brightness ?? 100}%) contrast(${meta.profile_contrast ?? 100}%)`.trim();

    const photoUrl = getMediaUrl(profile.fotoPreferida, { cacheBust: true });

    AvatarComponent = (
      <img 
        src={photoUrl} 
        alt="Avatar" 
        crossOrigin="anonymous"
        style={{ 
          width: '100%', 
          height: '100%', 
          objectFit: 'cover', 
          objectPosition: `${meta.profile_object_x}% ${meta.profile_object_y}%`,
          transformOrigin: `${meta.profile_object_x}% ${meta.profile_object_y}%`,
          transform: meta.profile_object_zoom > 100 ? `scale(${meta.profile_object_zoom / 100})` : undefined,
          filter: filterStyle || undefined
        }} 
      />
    );
  } else if (profile?.iconoLogro && allowedIcons.includes(profile.iconoLogro)) {
    AvatarComponent = <span>{profile.iconoLogro}</span>;
  } else if (profile?.roles?.includes('visitante')) {
    AvatarComponent = <span title="Visitante">🧳</span>;
  } else {
    AvatarComponent = <span title="Agricultor">🌱</span>;
  }

  const isActive = (path: string) => pathname === path ? 'active' : '';

  const handleNavClick = () => {
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      setSidebarOpen(false);
    }
  };

  const moon = getMoonPhase();
  const bio = getBiodynamicDay();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Preparando tu huerto...</p>
      </div>
    );
  }

  // Muro de Hibernación
  if (profile?.estadoCuenta === 'inactiva' || profile?.estadoCuenta === 'pausada') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f8fafc', padding: '20px', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ background: 'white', padding: '40px', borderRadius: '16px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', maxWidth: '450px', textAlign: 'center', borderTop: '6px solid #64748b', width: '100%' }}>
          <div style={{ fontSize: '54px', marginBottom: '20px' }}>💤</div>
          <h1 style={{ margin: '0 0 10px', color: '#0f172a' }}>Cuenta en Hibernación</h1>
          <p style={{ color: '#475569', lineHeight: 1.6, marginBottom: '24px' }}>
            Tu cuenta está pausada. No estás recibiendo notificaciones ni tienes acceso a tu huerto. Para continuar usando Verdantia, elige una de las siguientes opciones:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button 
              onClick={async () => {
                const res = await fetch('/api/auth/account-state', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: profile.email, action: 'reactivate' }) });
                if (res.ok) window.location.reload();
              }}
              style={{ background: '#10b981', color: 'white', padding: '12px 24px', borderRadius: '8px', border: 'none', fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s', fontSize: '1rem' }}
              onMouseOver={e => e.currentTarget.style.background = '#059669'}
              onMouseOut={e => e.currentTarget.style.background = '#10b981'}
            >
              ▶️ Reactivar mi cuenta (y correos)
            </button>
            <button 
              onClick={async () => {
                const res = await fetch('/api/auth/account-state', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: profile.email, action: 'reactivate' }) });
                if (res.ok) window.location.href = '/dashboard/perfil?upgrade=true';
              }}
              style={{ background: '#3b82f6', color: 'white', padding: '12px 24px', borderRadius: '8px', border: 'none', fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s', fontSize: '1rem' }}
              onMouseOver={e => e.currentTarget.style.background = '#2563eb'}
              onMouseOut={e => e.currentTarget.style.background = '#3b82f6'}
            >
              ⭐ Mejorar mi Plan (Premium)
            </button>
            <button 
              onClick={async () => {
                if (confirm('⚠️ ¿Estás seguro de que quieres eliminar tu cuenta?\\n\\nTus datos personales se destruirán tras 30 días. Esta acción es irreversible pasado ese plazo.')) {
                  if (confirm('🔴 ÚLTIMA CONFIRMACIÓN\\n\\n¿Realmente deseas continuar con el borrado?')) {
                    const res = await fetch('/api/auth/account-state', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: profile.email, action: 'delete' }) });
                    if (res.ok) {
                      handleLogout();
                    }
                  }
                }
              }}
              style={{ background: '#ef4444', color: 'white', padding: '12px 24px', borderRadius: '8px', border: 'none', fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s', fontSize: '1rem' }}
              onMouseOver={e => e.currentTarget.style.background = '#dc2626'}
              onMouseOut={e => e.currentTarget.style.background = '#ef4444'}
            >
              🗑️ Cancelar cuenta definitivamente
            </button>
            <button 
              onClick={handleLogout}
              style={{ background: 'transparent', color: '#64748b', padding: '12px 24px', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 600, cursor: 'pointer', marginTop: '10px' }}
              onMouseOver={e => e.currentTarget.style.background = '#f1f5f9'}
              onMouseOut={e => e.currentTarget.style.background = 'transparent'}
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      {/* Sidebar Lateral */}
      <aside className={`sidebar ${sidebarOpen ? '' : 'collapsed'}`}>
        <div className="sidebar-logo" style={{ padding: '1.2rem', background: '#ffffff', borderBottom: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <img 
            src="/logo-verdantia-banner.jpg" 
            alt="Verdantia" 
            style={{ width: '100%', maxWidth: '220px', height: 'auto' }} 
          />
        </div>

        {/* ═══════════════════════════════════════════ */}
        {/* ZONA SCROLLABLE DE NAVEGACIÓN               */}
        {/* ═══════════════════════════════════════════ */}
        <div className="sidebar-nav-area">
          {/* ═══════════════════════════════════════════ */}
          {/* BLOQUE SUPERADMINISTRADOR (Rojo/Granate)   */}
          {/* ═══════════════════════════════════════════ */}
          {isSuperAdmin && (
            <div className="sidebar-section admin-section">
              {/* Header clickable para colapsar/expandir */}
              <button
                onClick={() => setSuperAdminExpanded(p => !p)}
                className="section-header admin-header"
                style={{
                  width: '100%', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0.6rem 1.25rem',
                  background: 'linear-gradient(135deg, #9f1239, #be123c)',
                  color: 'white',
                }}
              >
                <span>🛡️ Superadministrador</span>
                <span style={{ fontSize: '0.75rem', opacity: 0.8, transition: 'transform 0.2s', transform: superAdminExpanded ? 'rotate(90deg)' : 'rotate(0deg)', display: 'inline-block' }}>▶</span>
              </button>
              {superAdminExpanded && (
                <nav className="sidebar-nav">

                  <a href="/dashboard/admin/usuarios" className={`nav-item ${isActive('/dashboard/admin/usuarios')}`} onClick={handleNavClick}>
                    <span className="nav-icon">👥</span>
                    <span>Usuarios</span>
                  </a>
                  <div className="nav-submenu-wrapper" onMouseEnter={() => setTareasAgricolasHover(true)} onMouseLeave={() => setTareasAgricolasHover(false)}>
                    <button type="button" className={`nav-item ${pathname.includes('/admin/especies') || pathname.includes('/admin/labores') || pathname.includes('/admin/plagas') || pathname.includes('/admin/tareas/contenedores') || pathname.includes('/admin/familias') ? 'active' : ''}`}
                      onClick={(e) => { e.preventDefault(); setTareasAgricolasHover(h => !h); }}
                      style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', color: 'inherit', display: 'flex', alignItems: 'center', padding: undefined }}>
                      <span className="nav-icon">🚜</span>
                      <span style={{flex: 1}}>Tareas Agrícolas</span>
                      <span style={{ fontSize: '0.6rem', transition: 'transform 0.2s', transform: tareasAgricolasHover || pathname.includes('/admin/especies') || pathname.includes('/admin/labores') || pathname.includes('/admin/plagas') || pathname.includes('/admin/tareas/contenedores') || pathname.includes('/admin/familias') ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
                    </button>
                    <div style={{ display: tareasAgricolasHover || pathname.includes('/admin/fases') || pathname.includes('/admin/especies') || pathname.includes('/admin/labores') || pathname.includes('/admin/plagas') || pathname.includes('/admin/tareas/contenedores') || pathname.includes('/admin/familias') ? 'flex' : 'none', flexDirection: 'column', paddingLeft: '32px', gap: '4px', marginTop: '4px' }}>
                      <a href="/dashboard/admin/especies" className={`nav-item ${isActive('/dashboard/admin/especies')}`} style={{ fontSize: '0.85rem', padding: '6px 12px' }} onClick={handleNavClick}>🌍 Especies Globales</a>
                      <a href="/dashboard/admin/fases" className={`nav-item ${isActive('/dashboard/admin/fases')}`} style={{ fontSize: '0.85rem', padding: '6px 12px' }} onClick={handleNavClick}>🌱 Fases de Cultivo</a>
                      <a href="/dashboard/admin/labores" className={`nav-item ${isActive('/dashboard/admin/labores')}`} style={{ fontSize: '0.85rem', padding: '6px 12px' }} onClick={handleNavClick}>🔧 Labores Globales</a>
                      <a href="/dashboard/admin/plagas" className={`nav-item ${isActive('/dashboard/admin/plagas')}`} style={{ fontSize: '0.85rem', padding: '6px 12px' }} onClick={handleNavClick}>🐛 Plagas Globales</a>
                      <a href="/dashboard/admin/tareas/contenedores" className={`nav-item ${isActive('/dashboard/admin/tareas/contenedores')}`} style={{ fontSize: '0.85rem', padding: '6px 12px' }} onClick={handleNavClick}>🌱 Contenedores</a>
                      <a href="/dashboard/admin/familias" className={`nav-item ${isActive('/dashboard/admin/familias')}`} style={{ fontSize: '0.85rem', padding: '6px 12px' }} onClick={handleNavClick}>🧬 Familias Botánicas</a>
                    </div>
                  </div>
                  <a href="/dashboard/admin/blog" className={`nav-item ${isActive('/dashboard/admin/blog')}`} onClick={handleNavClick}>
                    <span className="nav-icon">📝</span>
                    <span>Gestor Blog IA</span>
                  </a>
                  <a href="/dashboard/admin/chat" className={`nav-item ${isActive('/dashboard/admin/chat')}`} onClick={handleNavClick}>
                    <span className="nav-icon">💬</span>
                    <span>Chat Moderación</span>
                  </a>
                  <a href="/dashboard/admin/meteo" className={`nav-item ${isActive('/dashboard/admin/meteo')}`} onClick={handleNavClick}>
                    <span className="nav-icon">🌐</span>
                    <span>Meteo Red Global</span>
                  </a>

                  <div className="nav-submenu-wrapper" onMouseEnter={() => setTareasAdministrativasHover(true)} onMouseLeave={() => setTareasAdministrativasHover(false)}>
                    <button type="button" className={`nav-item ${pathname.includes('/admin/asuntos-pendientes') || pathname.includes('/admin/asuntos-realizados') ? 'active' : ''}`}
                      onClick={(e) => { e.preventDefault(); setTareasAdministrativasHover(h => !h); }}
                      style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', color: 'inherit', display: 'flex', alignItems: 'center', padding: undefined }}>
                      <span className="nav-icon">🏢</span>
                      <span style={{flex: 1}}>Tareas Administrativas</span>
                      <span style={{ fontSize: '0.6rem', transition: 'transform 0.2s', transform: tareasAdministrativasHover || pathname.includes('/admin/asuntos-pendientes') || pathname.includes('/admin/asuntos-realizados') ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
                    </button>
                    <div style={{ display: tareasAdministrativasHover || pathname.includes('/admin/asuntos-pendientes') || pathname.includes('/admin/asuntos-realizados') ? 'flex' : 'none', flexDirection: 'column', paddingLeft: '32px', gap: '4px', marginTop: '4px' }}>
                      <a href="/dashboard/admin/asuntos-pendientes" className={`nav-item ${isActive('/dashboard/admin/asuntos-pendientes')}`} style={{ fontSize: '0.85rem', padding: '6px 12px' }} onClick={handleNavClick}>📋 Asuntos Pendientes</a>
                      <a href="/dashboard/admin/asuntos-realizados" className={`nav-item ${isActive('/dashboard/admin/asuntos-realizados')}`} style={{ fontSize: '0.85rem', padding: '6px 12px' }} onClick={handleNavClick}>✅ Asuntos Realizados</a>
                    </div>
                  </div>
                  <div className="nav-submenu-wrapper" onMouseEnter={() => setMantenimientoHover(true)} onMouseLeave={() => setMantenimientoHover(false)}>
                    <button type="button" className={`nav-item ${pathname.includes('/admin/mantenimiento') ? 'active' : ''}`}
                      onClick={(e) => { e.preventDefault(); setMantenimientoHover(h => !h); }}
                      style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', color: 'inherit', display: 'flex', alignItems: 'center', padding: undefined }}>
                      <span className="nav-icon">🛠️</span>
                      <span style={{flex: 1}}>Mantenimiento</span>
                      <span style={{ fontSize: '0.6rem', transition: 'transform 0.2s', transform: mantenimientoHover || pathname.includes('/admin/mantenimiento') ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
                    </button>
                    <div style={{ display: mantenimientoHover || pathname.includes('/admin/mantenimiento') ? 'flex' : 'none', flexDirection: 'column', paddingLeft: '32px', gap: '4px', marginTop: '4px' }}>
                      <a href="/dashboard/admin/mantenimiento" className={`nav-item ${pathname === '/dashboard/admin/mantenimiento' ? 'active' : ''}`} style={{ fontSize: '0.85rem', padding: '6px 12px' }} onClick={handleNavClick}>📁 Copias de Seguridad</a>
                      <a href="/dashboard/admin/mantenimiento/analisis?clean=true" className={`nav-item ${pathname === '/dashboard/admin/mantenimiento/analisis' ? 'active' : ''}`} style={{ fontSize: '0.85rem', padding: '6px 12px' }} onClick={(e) => {
                        if (typeof window !== 'undefined') {
                          sessionStorage.removeItem('analisis_filter');
                          sessionStorage.removeItem('analisis_group_filter');
                          sessionStorage.removeItem('analisis_expanded_code');
                          sessionStorage.removeItem('analisis_expanded_responsive');
                          sessionStorage.removeItem('analisis_scroll');
                          sessionStorage.removeItem('analisis_foco_file');
                        }
                        handleNavClick();
                      }}>📊 Análisis de Dashboard</a>
                      <a href="/dashboard/admin/mantenimiento/biblia" className={`nav-item ${pathname === '/dashboard/admin/mantenimiento/biblia' ? 'active' : ''}`} style={{ fontSize: '0.85rem', padding: '6px 12px' }} onClick={handleNavClick}>📜 La Biblia</a>
                    </div>
                  </div>

                  <div className="nav-submenu-wrapper" onMouseEnter={() => setAjustesHover(true)} onMouseLeave={() => setAjustesHover(false)}>
                    <button type="button" className={`nav-item ${pathname.includes('/admin/ajustes') ? 'active' : ''}`}
                      onClick={(e) => { e.preventDefault(); setAjustesHover(h => !h); }}
                      style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', color: 'inherit', display: 'flex', alignItems: 'center', padding: undefined }}>
                      <span className="nav-icon">⚙️</span>
                      <span style={{flex: 1}}>Ajustes de Programa</span>
                      <span style={{ fontSize: '0.6rem', transition: 'transform 0.2s', transform: ajustesHover || pathname.includes('/admin/ajustes') ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
                    </button>
                    <div style={{ display: ajustesHover || pathname.includes('/admin/ajustes') ? 'flex' : 'none', flexDirection: 'column', paddingLeft: '32px', gap: '4px', marginTop: '4px' }}>
                      <a href="/dashboard/admin/ajustes/idiomas" className={`nav-item ${pathname.includes('/admin/ajustes/idiomas') ? 'active' : ''}`} style={{ fontSize: '0.85rem', padding: '6px 12px' }} onClick={handleNavClick}>🗣️ Idiomas</a>
                      <a href="/dashboard/admin/ajustes/paises" className={`nav-item ${pathname.includes('/admin/ajustes/paises') ? 'active' : ''}`} style={{ fontSize: '0.85rem', padding: '6px 12px' }} onClick={handleNavClick}>🌎 Países</a>
                      <a href="/dashboard/admin/ajustes/avisos" className={`nav-item ${pathname.includes('/admin/ajustes/avisos') ? 'active' : ''}`} style={{ fontSize: '0.85rem', padding: '6px 12px' }} onClick={handleNavClick}>🔔 Avisos y Reglas</a>
                      <a href="/dashboard/admin/ajustes/logros" className={`nav-item ${pathname.includes('/admin/ajustes/logros') ? 'active' : ''}`} style={{ fontSize: '0.85rem', padding: '6px 12px' }} onClick={handleNavClick}>🏆 Sistema de Rangos</a>
                    </div>
                  </div>
                </nav>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════ */}
          {/* BLOQUE MI HUERTO (Verde)                    */}
          {/* ═══════════════════════════════════════════ */}
          <div className="sidebar-section huerto-section">
            <button
              onClick={() => setHuertoExpanded(p => !p)}
              className="section-header huerto-header"
              style={{
                width: '100%', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between'
              }}
            >
              <span>🌱 Mi Huerto & Semillas</span>
              <span style={{ fontSize: '0.75rem', opacity: 0.8, transition: 'transform 0.2s', transform: huertoExpanded ? 'rotate(90deg)' : 'rotate(0deg)', display: 'inline-block' }}>▶</span>
            </button>
            {huertoExpanded && (
              <nav className="sidebar-nav">
                <a href="/dashboard" className={`nav-item ${isActive('/dashboard')}`} onClick={handleNavClick}>
                  <span className="nav-icon">🏠</span>
                  <span>Inicio</span>
                </a>
                <a href="/dashboard/mis-plantas" className={`nav-item ${isActive('/dashboard/mis-plantas')}`} onClick={handleNavClick}>
                  <span className="nav-icon">🌱</span>
                  <span>Mis Hortalizas</span>
                </a>
                <a href="/dashboard/semillas" className={`nav-item ${isActive('/dashboard/semillas')}`} onClick={handleNavClick}>
                  <span className="nav-icon">🌾</span>
                  <span>Mis Semillas</span>
                </a>
                <a href="/dashboard/cultivos" className={`nav-item ${isActive('/dashboard/cultivos')}`} onClick={handleNavClick}>
                  <span className="nav-icon" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="1.2em" height="1.2em" viewBox="0 0 32 32" style={{ filter: 'drop-shadow(0 2px 3px rgba(20, 184, 166, 0.3))' }}>
                      <line x1="18" y1="23" x2="18" y2="6" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />
                      <line x1="18" y1="23" x2="18" y2="6" stroke="#84cc16" strokeWidth="1" strokeLinecap="round" />
                      <g stroke="#1e293b" strokeWidth="1.2" strokeLinejoin="round" fill="#84cc16">
                        <path d="M 18 7 Q 14 7, 14 3 Q 18 3, 18 7 Z" />
                        <path d="M 18 7 Q 22 7, 22 3 Q 18 3, 18 7 Z" />
                        <path d="M 18 12 Q 12 12, 12 6 Q 18 6, 18 12 Z" />
                        <path d="M 18 12 Q 24 12, 24 6 Q 18 6, 18 12 Z" />
                        <path d="M 18 17 Q 10 17, 10 9 Q 18 9, 18 17 Z" />
                        <path d="M 18 17 Q 26 17, 26 9 Q 18 9, 18 17 Z" />
                      </g>
                      <path d="M 7 25 C 13 28, 20 29, 25 26 Q 31 23, 30 25 C 28 28, 22 32, 15 32 L 7 30 Z" fill="#fcd34d" stroke="#1e293b" strokeWidth="1.2" strokeLinejoin="round" />
                      <path d="M 10 25 C 10 20, 15 19, 18 19 C 22 19, 25 20, 27 23 C 28 25, 25 27, 18 27 C 12 27, 10 26, 10 25 Z" fill="#78350f" stroke="#1e293b" strokeWidth="1.2" strokeLinejoin="round" />
                      <circle cx="14" cy="21" r="0.75" fill="#1e293b" />
                      <circle cx="21" cy="22" r="0.75" fill="#1e293b" />
                      <circle cx="24" cy="24" r="0.75" fill="#1e293b" />
                      <path d="M 7 22 C 11 21, 14 22, 15 24 C 13 26, 10 26, 7 25 Z" fill="#fcd34d" stroke="#1e293b" strokeWidth="1.2" strokeLinejoin="round" />
                      <path d="M 2 19 L 7 19 L 7 32 L 2 32 Z" fill="#0ea5e9" stroke="#1e293b" strokeWidth="1.2" strokeLinejoin="round" />
                      <path d="M 7 18 L 10 18 L 10 32 L 7 32 Z" fill="#0284c7" stroke="#1e293b" strokeWidth="1.2" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <span>Mis cultivos</span>
                </a>
                <a href="/dashboard/tareas" className={`nav-item ${isActive('/dashboard/tareas')}`} onClick={handleNavClick}>
                  <span className="nav-icon">🔔</span>
                  <span>Tareas Pendientes</span>
                </a>
                {/* Submenú Mis Bancales */}
                <div className="nav-submenu-wrapper" onMouseEnter={() => setBancalesHover(true)} onMouseLeave={() => setBancalesHover(false)}>
                  <button type="button" className={`nav-item ${pathname.includes('/dashboard/bancales') ? 'active' : ''}`}
                    onClick={(e) => { e.preventDefault(); setBancalesHover(h => !h); }}
                    style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', color: 'inherit', display: 'flex', alignItems: 'center', padding: undefined }}>
                    <span className="nav-icon">🛏️</span>
                    <span style={{flex: 1}}>Mis Bancales</span>
                    <span style={{ fontSize: '0.6rem', transition: 'transform 0.2s', transform: bancalesHover || pathname.includes('/dashboard/bancales') ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
                  </button>
                  <div style={{ display: bancalesHover || pathname.includes('/dashboard/bancales') ? 'flex' : 'none', flexDirection: 'column', paddingLeft: '32px', gap: '4px', marginTop: '4px' }}>
                    {bancalesList.length === 0 && (
                      <span style={{ fontSize: '0.8rem', color: '#94a3b8', padding: '6px 12px', fontStyle: 'italic' }}>Sin bancales aún</span>
                    )}
                    {bancalesList.map((b: any) => (
                      <a key={b.idbancales} href={`/dashboard/bancales/${b.idbancales}`} className={`nav-item ${pathname === `/dashboard/bancales/${b.idbancales}` ? 'active' : ''}`} style={{ fontSize: '0.85rem', padding: '6px 12px' }} onClick={handleNavClick}>
                        🌿 {b.bancalesnombre}
                      </a>
                    ))}
                  </div>
                </div>
              </nav>
            )}
          </div>

          {/* ═══════════════════════════════════════════ */}
          {/* BLOQUE UTILIDADES (Azul)                    */}
          {/* ═══════════════════════════════════════════ */}
          <div className="sidebar-section utilidades-section">
            <button
              onClick={() => setUtilidadesExpanded(p => !p)}
              className="section-header utilidades-header"
              style={{
                width: '100%', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between'
              }}
            >
              <span>🧰 Utilidades</span>
              <span style={{ fontSize: '0.75rem', opacity: 0.8, transition: 'transform 0.2s', transform: utilidadesExpanded ? 'rotate(90deg)' : 'rotate(0deg)', display: 'inline-block' }}>▶</span>
            </button>
            {utilidadesExpanded && (
              <nav className="sidebar-nav">
                <a href="/dashboard/plantar" className={`nav-item ${isActive('/dashboard/plantar')}`} onClick={handleNavClick}>
                  <span className="nav-icon">✨</span>
                  <span>¿Qué plantar?</span>
                </a>
                <a href="/dashboard/calculadora" className={`nav-item ${isActive('/dashboard/calculadora')}`} onClick={handleNavClick}>
                  <span className="nav-icon">🧮</span>
                  <span>Calculadora</span>
                </a>
                <a href="/dashboard/comunidad" className={`nav-item ${isActive('/dashboard/comunidad')}`} onClick={handleNavClick}>
                  <span className="nav-icon">💬</span>
                  <span>Chat Comunidad</span>
                </a>
                <a href="/dashboard/meteo" className={`nav-item ${isActive('/dashboard/meteo')}`} onClick={handleNavClick}>
                  <span className="nav-icon">⛅</span>
                  <span>Mi Meteo Local</span>
                </a>
                <a href="/dashboard/admin/guia-usuario" className={`nav-item ${isActive('/dashboard/admin/guia-usuario')}`} onClick={handleNavClick}>
                  <span className="nav-icon">📖</span>
                  <span>Guía de Usuario</span>
                </a>
              </nav>
            )}
          </div>
        </div>

        {/* Pie del Sidebar: perfil + logout */}
        <div className="sidebar-footer">
          <a href="/dashboard/perfil" className="sidebar-profile">
            <span className="profile-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>{AvatarComponent}</span>
            <div className="profile-info">
              <span className="profile-name">Hola, {displayName}</span>
              {isSuperAdmin && <span className="role-badge superadmin">SUPERADMIN</span>}
              {!isSuperAdmin && isAdmin && <span className="role-badge admin">ADMIN</span>}
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                {/* Placa de Logro */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '6px 10px', borderRadius: '12px', color: '#92400e' }}>
                  <RangoBadge icono={profile?.iconoLogro || '1️⃣👶'} nivel={profile?.nivelLogro} size={28} />
                  <span style={{ fontSize: '0.65rem', fontWeight: 800, textAlign: 'center', lineHeight: 1.1 }}>{profile?.nombreLogro || 'Visitante'}</span>
                </div>
                
                {/* Placa de Suscripción */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', background: getPlanConfig(profile?.suscripcion).bg, border: `1px solid ${getPlanConfig(profile?.suscripcion).color}40`, padding: '6px 10px', borderRadius: '12px', color: getPlanConfig(profile?.suscripcion).color }}>
                  <span style={{ fontSize: '28px', lineHeight: 1, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}>{getPlanConfig(profile?.suscripcion).icon}</span>
                  <span style={{ fontSize: '0.65rem', fontWeight: 800, textAlign: 'center', lineHeight: 1.1, textTransform: 'uppercase' }}>{profile?.suscripcion || 'Gratuito'}</span>
                </div>
              </div>
              <span className="profile-edit-hint">✏️ Editar perfil</span>
            </div>
          </a>
          <button onClick={handleLogout} className="logout-btn">Cerrar Sesión</button>
        </div>
      </aside>

      {/* Contenido Principal */}
      <main className="dashboard-main">
        <header className="dashboard-header">
        <div className="header-left" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>

            {/* Breadcrumbs eliminados para evitar duplicidad con botones inferiores */}

            {profile && (
              <div className="current-calendar" style={{ display: 'flex', alignItems: 'center', gap: '6px', background: profile.tipoCalendario === 'Biodinámico' ? 'rgba(139, 92, 246, 0.1)' : profile.tipoCalendario === 'Lunar' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)', padding: '4px 10px', borderRadius: '20px', border: `1px solid ${profile.tipoCalendario === 'Biodinámico' ? 'rgba(139, 92, 246, 0.3)' : profile.tipoCalendario === 'Lunar' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`, marginLeft: '10px' }} 
                title={`Calendario Agrícola Activo: Calendario de siembra ${profile.tipoCalendario || 'Normal'}${profile.tipoCalendario === 'Lunar' ? ` (${moon.name})` : profile.tipoCalendario === 'Biodinámico' ? ` (${bio.name})` : ''}`}
              >
                <span style={{ fontSize: '1.1rem' }}>
                  {profile.tipoCalendario === 'Biodinámico' ? bio.icon : profile.tipoCalendario === 'Lunar' ? moon.icon : '🌱'}
                </span>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: profile.tipoCalendario === 'Biodinámico' ? '#4c1d95' : profile.tipoCalendario === 'Lunar' ? '#1e3a8a' : '#064e3b' }}>
                  Cal. {profile.tipoCalendario || 'Normal'} {profile.tipoCalendario === 'Lunar' ? `(${moon.name})` : profile.tipoCalendario === 'Biodinámico' ? `(${bio.name})` : ''}
                </span>
              </div>
            )}
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Widget del Clima (Solo visible con email verificado y datos de localización) */}
            {emailVerified && weatherData && (
              <div className="weather-widget" style={{ 
                display: 'flex', alignItems: 'center', gap: '10px', 
                background: 'rgba(255,255,255,0.7)', padding: '6px 14px', 
                borderRadius: '12px', border: '1px solid var(--border-color)',
                fontSize: '0.85rem', color: '#334155'
              }}>
                <div className="weather-city" style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
                  <span style={{ fontWeight: 600, maxWidth: '90px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={weatherData.name}>{weatherData.name}</span>
                  <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{weatherData.updated}</span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500 }}>
                  <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: '12px' }}>
                    <span style={{ color: 'var(--primary-color, #10b981)', fontSize: '1.1rem', fontWeight: 700 }} title="Temperatura Actual">{weatherData.current}º</span>
                    {weatherData.trend === 'subiendo' && <span style={{ color: '#ef4444', fontSize: '1rem', marginLeft: '2px' }} title="Tendencia: Subiendo">↑</span>}
                    {weatherData.trend === 'bajando' && <span style={{ color: '#3b82f6', fontSize: '1rem', marginLeft: '2px' }} title="Tendencia: Bajando">↓</span>}
                    {weatherData.trend === 'estable' && <span style={{ color: '#94a3b8', fontSize: '1rem', marginLeft: '2px' }} title="Tendencia: Estable">→</span>}
                  </div>
                  
                  <div className="weather-details" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}>
                    <span style={{ color: '#3b82f6' }} title="Mínima hoy"><span className="weather-label">Mín </span>{weatherData.min}º</span>
                    <span style={{ color: '#94a3b8' }}>/</span>
                    <span style={{ color: '#ef4444' }} title="Máxima hoy"><span className="weather-label">Máx </span>{weatherData.max}º</span>
                  </div>
                  
                  {weatherData.rain > 0 && (
                    <span className="weather-details" style={{ color: '#0ea5e9', display: 'flex', alignItems: 'center', gap: '2px' }} title="Lluvia hoy">
                      💧 {weatherData.rain}mm
                    </span>
                  )}
                </div>
              </div>
            )}
            
            <div className="header-profile">
            </div>
          </div>
        </header>

        <div className="dashboard-content">
          {/* Barra de Retorno Contextual — Regla 10 */}
          {fromParam && FROM_LABELS[fromParam] && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              marginBottom: '16px', padding: '10px 16px',
              background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
              border: '1px solid #bbf7d0', borderRadius: '10px',
              borderLeft: '4px solid #10b981'
            }}>
              <span style={{ fontSize: '0.85rem', color: '#065f46', fontWeight: 600 }}>
                Viniste desde:
              </span>
              <button
                onClick={() => {
                  sessionStorage.setItem('mantenimiento_tab', 'codigo');
                  window.location.href = FROM_LABELS[fromParam].path;
                }}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '5px 14px', borderRadius: '8px',
                  background: '#10b981', color: 'white',
                  border: 'none', fontSize: '0.82rem', fontWeight: 700,
                  cursor: 'pointer', transition: 'opacity 0.2s'
                }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '0.85'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '1'}
              >
                {FROM_LABELS[fromParam].icon} ← Volver a {FROM_LABELS[fromParam].label}
              </button>
            </div>
          )}
          {children}
          {/* DASHBOARD CONFLICTOS (Bloqueador de Pantalla si hay fotos rechazadas) */}
          {profile?.fotosRechazadasCount ? (
            <ConflictosDashboard email={profile.email} onResolved={handleConflictResolved} />
          ) : null}
        </div>
      </main>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Cargando panel...</p>
      </div>
    }>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </Suspense>
  );
}
