'use client';

import './dashboard.css';
import { auth } from '@/lib/firebase/config';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

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
  const [weatherData, setWeatherData] = useState<any>(null);
  const [emailVerified, setEmailVerified] = useState(false);

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

  // Escuchar eventos de actualización del perfil desde otras páginas (ej: cambio de calendario)
  useEffect(() => {
    const handleProfileUpdate = (e: any) => {
      if (e.detail) {
        setProfile((prev) => prev ? { ...prev, ...e.detail } : null);
      }
    };
    window.addEventListener('profile_updated', handleProfileUpdate);
    return () => window.removeEventListener('profile_updated', handleProfileUpdate);
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
  
  let AvatarComponent;
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

    AvatarComponent = (
      <img 
        src={`/${profile.fotoPreferida}`} 
        alt="Avatar" 
        style={{ 
          width: '100%', 
          height: '100%', 
          objectFit: 'cover', 
          borderRadius: '50%',
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
        {/* BLOQUE SUPERADMINISTRADOR (Rojo/Granate)   */}
        {/* ═══════════════════════════════════════════ */}
        {isSuperAdmin && (
          <div className="sidebar-section admin-section">
            <div className="section-header admin-header">
              <span>🛡️ Superadministrador</span>
            </div>
            <nav className="sidebar-nav">
              <a href="/dashboard/admin/usuarios" className={`nav-item ${isActive('/dashboard/admin/usuarios')}`} onClick={handleNavClick}>
                <span className="nav-icon">👥</span>
                <span>Usuarios</span>
              </a>
              <a href="/dashboard/admin/chat" className={`nav-item ${isActive('/dashboard/admin/chat')}`} onClick={handleNavClick}>
                <span className="nav-icon">💬</span>
                <span>Chat</span>
              </a>
              <a href="/dashboard/admin/especies" className={`nav-item ${isActive('/dashboard/admin/especies')}`} onClick={handleNavClick}>
                <span className="nav-icon">🌍</span>
                <span>Especies</span>
              </a>
              <a href="/dashboard/admin/variedades" className={`nav-item ${isActive('/dashboard/admin/variedades')}`} onClick={handleNavClick}>
                <span className="nav-icon">🏷️</span>
                <span>Variedades</span>
              </a>
              <a href="/dashboard/admin/labores" className={`nav-item ${isActive('/dashboard/admin/labores')}`} onClick={handleNavClick}>
                <span className="nav-icon">🔧</span>
                <span>Labores</span>
              </a>
              <a href="/dashboard/admin/meteo" className={`nav-item ${isActive('/dashboard/admin/meteo')}`} onClick={handleNavClick}>
                <span className="nav-icon">🌐</span>
                <span>Meteo Red Global</span>
              </a>
            </nav>
          </div>
        )}

        {/* ═══════════════════════════════════════════ */}
        {/* BLOQUE MI HUERTO (Verde)                    */}
        {/* ═══════════════════════════════════════════ */}
        <div className="sidebar-section huerto-section">
          <div className="section-header huerto-header">
            <span>🌱 Mi Huerto & Semillas</span>
          </div>
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
        </div>

        {/* ═══════════════════════════════════════════ */}
        {/* BLOQUE UTILIDADES (Azul)                    */}
        {/* ═══════════════════════════════════════════ */}
        <div className="sidebar-section utilidades-section">
          <div className="section-header utilidades-header">
            <span>🧰 Utilidades</span>
          </div>
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
        </div>

        {/* Pie del Sidebar: perfil + logout */}
        <div className="sidebar-footer">
          <a href="/dashboard/perfil" className="sidebar-profile">
            <span className="profile-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>{AvatarComponent}</span>
            <div className="profile-info">
              <span className="profile-name">{displayName}</span>
              {isSuperAdmin && <span className="role-badge superadmin">SUPERADMIN</span>}
              {!isSuperAdmin && isAdmin && <span className="role-badge admin">ADMIN</span>}
              <span className="profile-edit-hint">✏️ Editar perfil</span>
            </div>
          </a>
          <button onClick={handleLogout} className="logout-btn">Cerrar Sesión</button>
        </div>
      </aside>

      {/* Contenido Principal */}
      <main className="dashboard-main">
        <header className="dashboard-header">
          <div className="header-left" style={{ display: 'flex', alignItems: 'center' }}>
            <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
            <div className="current-medal" style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(245, 158, 11, 0.1)', padding: '4px 10px', borderRadius: '20px', border: '1px solid rgba(245, 158, 11, 0.3)', cursor: 'help' }} title="Rango Actual">
               <span style={{ fontSize: '1.2rem' }}>{profile?.roles?.includes('visitante') ? '🧳' : '🧑‍🌾'}</span>
               <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>{profile?.roles?.includes('visitante') ? 'Visitante' : 'Aprendiz'}</span>
            </div>
            {profile && (
              <div className="current-calendar" style={{ display: 'flex', alignItems: 'center', gap: '6px', background: profile.tipoCalendario === 'Biodinámico' ? 'rgba(139, 92, 246, 0.1)' : profile.tipoCalendario === 'Lunar' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)', padding: '4px 10px', borderRadius: '20px', border: `1px solid ${profile.tipoCalendario === 'Biodinámico' ? 'rgba(139, 92, 246, 0.3)' : profile.tipoCalendario === 'Lunar' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`, marginLeft: '10px' }} title="Calendario Agrícola Activo">
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
                    <span style={{ color: '#3b82f6' }} title="Mínima hoy">Mín {weatherData.min}º</span>
                    <span style={{ color: '#94a3b8' }}>/</span>
                    <span style={{ color: '#ef4444' }} title="Máxima hoy">Máx {weatherData.max}º</span>
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
              <span className="header-greeting">Hola, <strong>{displayName}</strong></span>
              <a href="/dashboard/perfil" className="profile-avatar" title="Ir a mi perfil" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>{AvatarComponent}</a>
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
