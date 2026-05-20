'use client';

import React, { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { processAlertas } from '@/lib/alertas-utils';

export default function DashboardAlertsWidget() {
  const [loading, setLoading] = useState(true);
  const [alertas, setAlertas] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user && user.email) {
        fetchAlertas(user.email);
      }
    });
    return () => unsub();
  }, []);

  const fetchAlertas = async (email: string) => {
    try {
      const res = await fetch('/api/user/cultivos/alertas-hoy', {
        headers: { 'x-user-email': email }
      });
      if (res.ok) {
        const data = await res.json();
        const finalAlerts = processAlertas(data.cultivos || []);
        setAlertas(finalAlerts);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>
      Cargando labores diarias...
    </div>
  );

  if (alertas.length === 0) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, #fff, #f8fafc)', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', marginBottom: '2rem', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: '#10b981', color: 'white', width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
            🎉
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.4rem', color: '#0f172a' }}>¡Día libre!</h2>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>No tienes labores pendientes recomendadas para hoy en tus cultivos activos.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, #fff, #f8fafc)',
      borderRadius: '16px',
      border: '1px solid #e2e8f0',
      padding: '24px',
      marginBottom: '2rem',
      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <div style={{ background: '#ef4444', color: 'white', width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', boxShadow: '0 4px 10px rgba(239, 68, 68, 0.3)' }}>
          🔔
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.4rem', color: '#0f172a' }}>Labores Pendientes de Hoy</h2>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>Tienes {alertas.length} {alertas.length === 1 ? 'tarea' : 'tareas'} recomendadas para hoy en tu huerto.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
        {alertas.map((a, i) => {
          let icon = a.pauta.laboresicono || '📋';
          if (icon.startsWith('mdi-')) {
            const MDI_TO_EMOJI: Record<string, string> = {
              'mdi-water': '💧', 'mdi-sprout': '🌱', 'mdi-leaf': '🍃', 'mdi-flower': '🌺',
              'mdi-tree': '🌳', 'mdi-scissors-cutting': '✂️', 'mdi-tractor': '🚜',
              'mdi-shovel': '⛏️', 'mdi-shield-bug': '🛡️', 'mdi-spray': '💦',
              'mdi-weather-sunny': '☀️', 'mdi-thermometer': '🌡️', 'mdi-basket': '🧺',
              'mdi-hand-water': '🖐️', 'mdi-format-list-bulleted': '🏷️', 'mdi-bottle-tonic-plus': '🧪'
            };
            icon = MDI_TO_EMOJI[icon] || '🌱';
          }

          return (
            <div key={i} onClick={() => router.push(`/dashboard/cultivos/${a.cultivo.idcultivos}`)} style={{
              background: 'white',
              border: '1px solid #e2e8f0',
              borderLeft: `4px solid ${a.pauta.laborescolor || '#3b82f6'}`,
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              gap: '12px',
              cursor: 'pointer',
              boxShadow: '0 2px 5px rgba(0,0,0,0.02)',
              transition: 'all 0.2s',
            }}
            onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ fontSize: '2rem' }}>{icon}</div>
              <div>
                <h4 style={{ margin: '0 0 4px 0', color: '#1e293b', fontSize: '1.05rem' }}>
                  {a.pauta.laboresnombre}
                </h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: '#475569', marginBottom: '6px' }}>
                  <span>{a.cultivo.especiesicono || '🌿'}</span>
                  <strong>{a.cultivo.nombre_variedad_usuario || a.cultivo.nombre_variedad_gold || a.cultivo.especiesnombre}</strong>
                  <span>({a.cultivo.cultivosubicacion || `Cultivo #${a.cultivo.cultivosnumerocoleccion}`})</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', background: '#f8fafc', padding: '2px 8px', borderRadius: '4px', display: 'inline-block' }}>
                  Fase: {a.faseActual}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
