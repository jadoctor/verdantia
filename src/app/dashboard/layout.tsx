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
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login');
        return;
      }

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

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const isSuperAdmin = profile?.roles?.includes('superadministrador');
  const isAdmin = profile?.roles?.includes('administrador') || isSuperAdmin;
  const displayName = profile?.nombreUsuario || profile?.nombre || 'Agricultor';
  const userIcon = profile?.icono || '🌱';

  const isActive = (path: string) => pathname === path ? 'active' : '';

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
        <div className="sidebar-logo">
          <h2>Verdantia</h2>
          <span className="sidebar-version">v4.0 Cloud</span>
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
              <a href="/dashboard/admin/usuarios" className={`nav-item ${isActive('/dashboard/admin/usuarios')}`}>
                <span className="nav-icon">👥</span>
                <span>Usuarios</span>
              </a>
              <a href="/dashboard/admin/chat" className={`nav-item ${isActive('/dashboard/admin/chat')}`}>
                <span className="nav-icon">💬</span>
                <span>Chat</span>
              </a>
              <a href="/dashboard/admin/especies" className={`nav-item ${isActive('/dashboard/admin/especies')}`}>
                <span className="nav-icon">🌍</span>
                <span>Especies</span>
              </a>
              <a href="/dashboard/admin/variedades" className={`nav-item ${isActive('/dashboard/admin/variedades')}`}>
                <span className="nav-icon">🏷️</span>
                <span>Variedades</span>
              </a>
              <a href="/dashboard/admin/labores" className={`nav-item ${isActive('/dashboard/admin/labores')}`}>
                <span className="nav-icon">🔧</span>
                <span>Labores</span>
              </a>
              <a href="/dashboard/admin/meteo" className={`nav-item ${isActive('/dashboard/admin/meteo')}`}>
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
            <a href="/dashboard" className={`nav-item ${isActive('/dashboard')}`}>
              <span className="nav-icon">🏠</span>
              <span>Inicio</span>
            </a>
            <a href="/dashboard/hortalizas" className={`nav-item ${isActive('/dashboard/hortalizas')}`}>
              <span className="nav-icon">🥬</span>
              <span>Mis Hortalizas Preferidas</span>
            </a>
            <a href="/dashboard/variedades" className={`nav-item ${isActive('/dashboard/variedades')}`}>
              <span className="nav-icon">🍅</span>
              <span>Variedades</span>
            </a>
            <a href="/dashboard/semillas" className={`nav-item ${isActive('/dashboard/semillas')}`}>
              <span className="nav-icon">🌾</span>
              <span>Semillas (Inventario)</span>
            </a>
            <a href="/dashboard/siembras" className={`nav-item ${isActive('/dashboard/siembras')}`}>
              <span className="nav-icon">🌿</span>
              <span>Siembras</span>
            </a>
            <a href="/dashboard/tareas" className={`nav-item ${isActive('/dashboard/tareas')}`}>
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
            <a href="/dashboard/plantar" className={`nav-item ${isActive('/dashboard/plantar')}`}>
              <span className="nav-icon">✨</span>
              <span>¿Qué plantar?</span>
            </a>
            <a href="/dashboard/calculadora" className={`nav-item ${isActive('/dashboard/calculadora')}`}>
              <span className="nav-icon">🧮</span>
              <span>Calculadora</span>
            </a>
            <a href="/dashboard/comunidad" className={`nav-item ${isActive('/dashboard/comunidad')}`}>
              <span className="nav-icon">💬</span>
              <span>Chat Comunidad</span>
            </a>
            <a href="/dashboard/meteo" className={`nav-item ${isActive('/dashboard/meteo')}`}>
              <span className="nav-icon">⛅</span>
              <span>Mi Meteo Local</span>
            </a>
          </nav>
        </div>

        {/* Pie del Sidebar: perfil + logout */}
        <div className="sidebar-footer">
          <a href="/dashboard/perfil" className="sidebar-profile">
            <span className="profile-icon">{userIcon}</span>
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
          <div className="header-left">
            <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
            <div className="header-search">
              <input type="text" placeholder="Buscar especies, huertos..." />
            </div>
          </div>
          <div className="header-profile">
            <span className="header-greeting">Hola, <strong>{displayName}</strong></span>
            <a href="/dashboard/perfil" className="profile-avatar" title="Ir a mi perfil">{userIcon}</a>
          </div>
        </header>

        <div className="dashboard-content">
          {children}
        </div>
      </main>
    </div>
  );
}
