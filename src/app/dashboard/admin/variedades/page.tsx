'use client';

import { useRouter } from 'next/navigation';

export default function AdminVariedadesPage() {
  const router = useRouter();

  return (
    <div className="dashboard-content" style={{ padding: '20px' }}>
      <div style={{ marginBottom: '16px' }}>
        <button onClick={() => router.push('/dashboard')} style={{ background: 'white', border: '1px solid #cbd5e1', color: '#475569', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          🏠 Volver al Inicio
        </button>
      </div>
      <div style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)', borderRadius: '16px', padding: '24px 28px', marginBottom: '24px', color: 'white' }}>
        <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800 }}>🏷️ Variedades Globales</h1>
        <p style={{ margin: '4px 0 0', opacity: 0.9, fontSize: '0.9rem' }}>Acceso administrativo preparado para el módulo de variedades.</p>
      </div>
      <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '22px', color: '#475569' }}>
        Este panel queda visible en el menú de superadministrador. La gestión fina de variedades se mantiene vinculada al editor de cada especie hasta activar este dashboard global.
      </div>
    </div>
  );
}
