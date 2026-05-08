'use client';

import './dashboard.css';
import { auth } from '@/lib/firebase/config';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getMediaUrl } from '@/lib/media-url';

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

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
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
    '/dashboard/hortalizas': { label: 'Mis Hortalizas', icon: '🥬' },
    '/dashboard/variedades': { label: 'Variedades', icon: '🍅' },
    '/dashboard/semillas': { label: 'Semillas', icon: '🌾' },
    '/dashboard/siembras': { label: 'Siembras', icon: '🌿' },
    '/dashboard/tareas': { label: 'Tareas', icon: '🔔' },
    '/dashboard/admin/especies': { label: 'Cuarentena de Especies', icon: '🌍' },
    '/dashboard/admin/especies/nueva': { label: 'Nueva Especie', icon: '🌱' },
    '/dashboard/admin/variedades': { label: 'Variedades Globales', icon: '🏷️' },
    '/dashboard/admin/labores': { label: 'Labores Globales', icon: '🔧' },
    '/dashboard/admin/labores/nueva': { label: 'Nueva Labor', icon: '🛠️' },
    '/dashboard/admin/plagas': { label: 'Plagas Globales', icon: '🐛' },
    '/dashboard/admin/usuarios': { label: 'Usuarios', icon: '👥' },
    '/dashboard/admin/chat': { label: 'Chat Admin', icon: '💬' },
    '/dashboard/admin/meteo': { label: 'Meteo Red Global', icon: '🌐' },
    '/dashboard/admin/guia-usuario': { label: 'Guía de Usuario', icon: '📖' },
    '/dashboard/admin/blog': { label: 'Gestor Blog IA', icon: '📝' },
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
    const laborMatch = pathname.match(/^\/dashboard\/admin\/labores\/(\d+)$/);
    if (laborMatch) {
      return [
        ROUTE_MAP['/dashboard/admin/labores'],
        { label: 'Detalle Labor', icon: '🔨' },
      ];
    }
    const usuarioMatch = pathname.match(/^\/dashboard\/admin\/usuarios\/(\d+)$/);
    if (usuarioMatch) {
      return [
        ROUTE_MAP['/dashboard/admin/usuarios'],
        { label: 'Perfil de Usuario', icon: '👤' },
      ];
    }
    return [];
  };

  const breadcrumbs = getBreadcrumbs();
  // URL padre (penúltimo nivel) para el botón de retroceso
  const getParentUrl = () => {
    const especieMatch = pathname.match(/^\/dashboard\/admin\/especies\/(\d+)$/);
    if (especieMatch) return '/dashboard/admin/especies';
    const laborMatch = pathname.match(/^\/dashboard\/admin\/labores\/(\d+)$/);
    if (laborMatch) return '/dashboard/admin/labores';
    const usuarioMatch = pathname.match(/^\/dashboard\/admin\/usuarios\/(\d+)$/);
    if (usuarioMatch) return '/dashboard/admin/usuarios';
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
        const res = await fetch(`/api/auth/profile?email=${encodeURIComponent(user.email!)}`);
        if (res.ok) {
          const data = await res.json();
          setProfile(data.profile);
        }
      } catch (err) {
        console.error('Error cargando perfil:', err);
      } finally {
        setLoading(false);
      }
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
                  <a href="/dashboard/admin/especies" className={`nav-item ${isActive('/dashboard/admin/especies')}`} onClick={handleNavClick}>
                    <span className="nav-icon">🌍</span>
                    <span>Especies Globales</span>
                  </a>
                  <a href="/dashboard/admin/variedades" className={`nav-item ${isActive('/dashboard/admin/variedades')}`} onClick={handleNavClick}>
                    <span className="nav-icon">🏷️</span>
                    <span>Variedades Globales</span>
                  </a>
                  <a href="/dashboard/admin/labores" className={`nav-item ${isActive('/dashboard/admin/labores')}`} onClick={handleNavClick}>
                    <span className="nav-icon">🔧</span>
                    <span>Labores Globales</span>
                  </a>
                  <a href="/dashboard/admin/plagas" className={`nav-item ${isActive('/dashboard/admin/plagas')}`} onClick={handleNavClick}>
                    <span className="nav-icon">🐛</span>
                    <span>Plagas Globales</span>
                  </a>
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
                  <a href="/dashboard/admin/guia-usuario" className={`nav-item ${isActive('/dashboard/admin/guia-usuario')}`} onClick={handleNavClick}>
                    <span className="nav-icon">📖</span>
                    <span>Guía de Usuario</span>
                  </a>
                  <div className="nav-submenu-wrapper" onMouseEnter={() => setAjustesHover(true)} onMouseLeave={() => setAjustesHover(false)}>
                    <a href="/dashboard/admin/ajustes" className={`nav-item ${pathname.includes('/admin/ajustes') ? 'active' : ''}`} onClick={handleNavClick}>
                      <span className="nav-icon">⚙️</span>
                      <span style={{flex: 1}}>Ajustes de Programa</span>
                      <span style={{ fontSize: '0.6rem', transition: 'transform 0.2s', transform: ajustesHover || pathname.includes('/admin/ajustes') ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
                    </a>
                    <div style={{ display: ajustesHover || pathname.includes('/admin/ajustes') ? 'flex' : 'none', flexDirection: 'column', paddingLeft: '32px', gap: '4px', marginTop: '4px' }}>
                      <a href="/dashboard/admin/ajustes/idiomas" className={`nav-item ${pathname.includes('/admin/ajustes/idiomas') ? 'active' : ''}`} style={{ fontSize: '0.85rem', padding: '6px 12px' }} onClick={handleNavClick}>🗣️ Idiomas</a>
                      <a href="/dashboard/admin/ajustes/paises" className={`nav-item ${pathname.includes('/admin/ajustes/paises') ? 'active' : ''}`} style={{ fontSize: '0.85rem', padding: '6px 12px' }} onClick={handleNavClick}>🌎 Países</a>
                      <a href="/dashboard/admin/ajustes/avisos" className={`nav-item ${pathname.includes('/admin/ajustes/avisos') ? 'active' : ''}`} style={{ fontSize: '0.85rem', padding: '6px 12px' }} onClick={handleNavClick}>🔔 Avisos y Reglas</a>
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
                <a href="/dashboard/hortalizas" className={`nav-item ${isActive('/dashboard/hortalizas')}`} onClick={handleNavClick}>
                  <span className="nav-icon">🥬</span>
                  <span>Mis Hortalizas Preferidas</span>
                </a>
                <a href="/dashboard/variedades" className={`nav-item ${isActive('/dashboard/variedades')}`} onClick={handleNavClick}>
                  <span className="nav-icon">🍅</span>
                  <span>Variedades</span>
                </a>
                <a href="/dashboard/semillas" className={`nav-item ${isActive('/dashboard/semillas')}`} onClick={handleNavClick}>
                  <span className="nav-icon">🌾</span>
                  <span>Semillas (Inventario)</span>
                </a>
                <a href="/dashboard/siembras" className={`nav-item ${isActive('/dashboard/siembras')}`} onClick={handleNavClick}>
                  <span className="nav-icon">🌿</span>
                  <span>Siembras</span>
                </a>
                <a href="/dashboard/tareas" className={`nav-item ${isActive('/dashboard/tareas')}`} onClick={handleNavClick}>
                  <span className="nav-icon">🔔</span>
                  <span>Tareas Pendientes</span>
                </a>
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
              <span className="profile-achievement">
                <span>{profile?.roles?.includes('visitante') ? '🧳' : (profile?.iconoLogro || '🧑‍🌾')}</span>
                <span>{profile?.roles?.includes('visitante') ? 'Visitante' : 'Aprendiz'}</span>
              </span>
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
          {children}
        </div>
      </main>
    </div>
  );
}
