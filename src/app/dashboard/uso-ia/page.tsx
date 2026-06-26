'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';

export default function MiUsoIAPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{ used: number, max: number, remaining: number, maxImages?: number } | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [iaFilter, setIaFilter] = useState<string>('todos');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login');
        return;
      }
      setUserEmail(user.email);
      await loadData(user.email!);
    });
    return () => unsubscribe();
  }, [router]);

  const loadData = async (email: string) => {
    setLoading(true);
    try {
      const [statsRes, historyRes] = await Promise.all([
        fetch('/api/user/ai-stats', { headers: { 'x-user-email': email } }),
        fetch('/api/user/ai-stats/history', { headers: { 'x-user-email': email } })
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (historyRes.ok) {
        const historyData = await historyRes.json();
        setHistory(historyData.history || []);
      }
    } catch (e) {
      console.error('Error cargando datos de IA:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50vh', color: '#64748b' }}>
        <div style={{ width: '40px', height: '40px', border: '4px solid #e2e8f0', borderTop: '4px solid #8b5cf6', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '16px' }} />
        <p>Cargando consumo de IA...</p>
        <style dangerouslySetInnerHTML={{ __html: `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }` }} />
      </div>
    );
  }

  const getPercentage = () => {
    if (!stats || stats.max === 0) return 0;
    return Math.min(100, Math.round((stats.used / stats.max) * 100));
  };

  const percent = getPercentage();
  const isNearLimit = percent >= 80;
  const isAtLimit = percent >= 100;

  const barColor = isAtLimit ? '#ef4444' : isNearLimit ? '#f59e0b' : '#10b981';

  const iaModules = Array.from(new Set(history.map((i: any) => i.historialiamodulo)));
  const filteredHistory = history.filter((i: any) => iaFilter === 'todos' || i.historialiamodulo === iaFilter);

  return (
    <div style={{ padding: '24px', width: '100%', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', padding: '16px 24px', borderRadius: '16px', color: 'white', boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🤖 Mi Consumo de IA
          </h1>
          <p style={{ margin: '4px 0 0', opacity: 0.9, fontSize: '0.9rem' }}>
            Monitoriza tus interacciones mensuales con los asistentes inteligentes.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '24px', marginBottom: '32px' }}>
        <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <h3 style={{ margin: '0 0 16px', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px' }}>
            📊 Interacciones este mes
          </h3>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
            <span style={{ fontSize: '2.5rem', fontWeight: 800, color: barColor }}>{stats?.used || 0}</span>
            <span style={{ fontSize: '1rem', color: '#64748b', fontWeight: 600 }}>/ {stats?.max || 0} de límite</span>
          </div>

          <div style={{ width: '100%', height: '12px', background: '#f1f5f9', borderRadius: '6px', overflow: 'hidden', marginBottom: '8px' }}>
            <div style={{ height: '100%', background: barColor, width: percent + '%', transition: 'width 0.5s ease-out' }} />
          </div>
          
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', textAlign: 'right' }}>
            {stats?.remaining || 0} consultas restantes
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <h3 style={{ margin: 0, color: '#334155', display: 'flex', alignItems: 'center', gap: '8px' }}>
          📝 Historial de consultas recientes
        </h3>
        {history.length > 0 && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setIaFilter('todos')}
              style={{
                background: iaFilter === 'todos' ? '#8b5cf6' : '#f1f5f9',
                color: iaFilter === 'todos' ? 'white' : '#64748b',
                border: 'none',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Todos ({history.length})
            </button>
            {iaModules.map((mod: any) => {
              const count = history.filter((i: any) => i.historialiamodulo === mod).length;
              return (
                <button
                  key={mod}
                  onClick={() => setIaFilter(mod)}
                  style={{
                    background: iaFilter === mod ? '#8b5cf6' : '#f1f5f9',
                    color: iaFilter === mod ? 'white' : '#64748b',
                    border: 'none',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {mod} ({count})
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <div style={{ width: '100%', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 600, width: '120px' }}>Fecha</th>
                <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 600, width: '150px' }}>Módulo</th>
                <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 600 }}>Consulta / Acción</th>
                <th style={{ padding: '12px 16px', color: '#64748b', fontWeight: 600, width: '100px' }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📭</div>
                    Aún no has utilizado la IA este mes o no hay consultas para el filtro seleccionado.
                  </td>
                </tr>
              ) : (
                filteredHistory.map((item) => (
                  <tr key={item.idhistorialia} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 16px', color: '#475569', whiteSpace: 'nowrap' }}>
                      {new Date(item.historialiafecha).toLocaleDateString()} {new Date(item.historialiafecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ background: '#f1f5f9', color: '#475569', padding: '4px 8px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 500 }}>
                        {item.historialiamodulo}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#334155' }}>
                      <div style={{ maxWidth: '400px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={item.historialiaprompt || 'Acción automatizada'}>
                        {item.historialiaprompt || 'Acción automatizada'}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {item.historialiaexito ? (
                        <span style={{ color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600 }}>✅ Éxito</span>
                      ) : (
                        <span style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600 }}>❌ Error</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
