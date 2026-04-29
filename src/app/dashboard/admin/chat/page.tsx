'use client';

import { useRouter } from 'next/navigation';

export default function AdminChatPage() {
  const router = useRouter();

  return (
    <div className="dashboard-content" style={{ padding: '20px' }}>
      <div style={{ marginBottom: '16px' }}>
        <button onClick={() => router.push('/dashboard')} style={{ background: 'white', border: '1px solid #cbd5e1', color: '#475569', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          🏠 Volver al Inicio
        </button>
      </div>
      <div style={{ background: 'linear-gradient(135deg, #9f1239, #be123c)', borderRadius: '16px', padding: '24px 28px', marginBottom: '24px', color: 'white' }}>
        <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800 }}>💬 Chat Moderación</h1>
        <p style={{ margin: '4px 0 0', opacity: 0.9, fontSize: '0.9rem' }}>Acceso administrativo preparado para supervisión de comunidad.</p>
      </div>
      <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '22px', color: '#475569' }}>
        Este panel evita enlaces muertos en producción mientras se conecta la bandeja real de moderación.
      </div>
    </div>
  );
}
