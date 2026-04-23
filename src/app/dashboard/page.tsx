'use client';

import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';

export default function DashboardHome() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserEmail(user.email);
      } else {
        // Redirigir al login si no hay usuario autenticado
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (!userEmail) return <p>Cargando tu huerto...</p>;

  return (
    <div className="welcome-section">
      <h1>¡Bienvenido de vuelta!</h1>
      <p>Has iniciado sesión de forma segura como <strong>{userEmail}</strong></p>

      <div className="stats-grid">
        <div className="stat-card glass">
          <h3>Plantas Activas</h3>
          <div className="value">12</div>
        </div>
        <div className="stat-card glass">
          <h3>Cosechas Totales</h3>
          <div className="value">48</div>
        </div>
        <div className="stat-card glass">
          <h3>Nivel de Agricultor</h3>
          <div className="value">Pro 🌱</div>
        </div>
      </div>
    </div>
  );
}
