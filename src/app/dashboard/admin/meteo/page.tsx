'use client';

import { useRouter } from 'next/navigation';

export default function AdminMeteoPage() {
  const router = useRouter();

  return (
    <div className="dashboard-content" style={{ padding: '20px' }}>
      <div style={{ marginBottom: '16px' }}>
        <button onClick={() => router.push('/dashboard')} style={{ background: 'white', border: '1px solid #cbd5e1', color: '#475569', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          🏠 Volver al Inicio
        </button>
      </div>
      <div style={{ background: 'linear-gradient(135deg, #0369a1, #0ea5e9)', borderRadius: '16px', padding: '24px 28px', marginBottom: '24px', color: 'white' }}>
        <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800 }}>🌐 Meteo Red Global</h1>
        <p style={{ margin: '4px 0 0', opacity: 0.9, fontSize: '0.9rem' }}>Acceso administrativo preparado para observación meteorológica global.</p>
      </div>
      <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '22px', color: '#475569' }}>
        Este panel queda visible en el menú de superadministrador y listo para enlazar métricas agregadas.
      </div>
    </div>
  );
}
