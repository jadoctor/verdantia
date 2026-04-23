'use client';

import './dashboard.css';
import { auth } from '@/lib/firebase/config';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar Lateral */}
      <aside className="sidebar glass">
        <div className="sidebar-logo">
          <h2>Verdantia</h2>
        </div>
        <nav className="sidebar-nav">
          <a href="/dashboard" className="nav-item active">🏠 Inicio</a>
          <a href="/dashboard/huertos" className="nav-item">🌱 Mis Huertos</a>
          <a href="/dashboard/catalogo" className="nav-item">📚 Catálogo</a>
          <a href="/dashboard/comunidad" className="nav-item">🌍 Comunidad</a>
        </nav>
        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn">Cerrar Sesión</button>
        </div>
      </aside>

      {/* Contenido Principal */}
      <main className="dashboard-main">
        {/* Cabecera Superior */}
        <header className="dashboard-header glass">
          <div className="header-search">
            <input type="text" placeholder="Buscar especies, huertos..." />
          </div>
          <div className="header-profile">
            <div className="profile-avatar">👨‍🌾</div>
          </div>
        </header>

        {/* Lienzo donde se renderizan las páginas */}
        <div className="dashboard-content">
          {children}
        </div>
      </main>
    </div>
  );
}
