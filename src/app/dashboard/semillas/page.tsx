'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { getMediaUrl } from '@/lib/media-url';
import { SeedWizardModal } from '@/components/SeedWizardModal';

export default function SemillasDashboard() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [semillas, setSemillas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSeedModal, setShowSeedModal] = useState(false);
  
  // Custom Modal State
  const [uiModal, setUiModal] = useState<{ show: boolean, type: 'confirm' | 'error', title: string, message: string, onConfirm?: () => void }>({
    show: false, type: 'error', title: '', message: ''
  });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user && user.email) {
        setUserEmail(user.email);
        loadSemillas(user.email);
      } else {
        router.push('/login');
      }
    });
    return () => unsub();
  }, [router]);

  const loadSemillas = async (email: string) => {
    try {
      setLoading(true);
      const res = await fetch('/api/user/semillas', { headers: { 'x-user-email': email } });
      if (res.ok) {
        const data = await res.json();
        setSemillas(data.semillas?.filter((s: any) => s.semillasactivosino === 1) || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const triggerDelete = (s: any) => {
    if (s.cultivos_activos_count && s.cultivos_activos_count > 0) {
      const listaCultivos = s.cultivos_activos_lista ? s.cultivos_activos_lista.split('|') : [];
      setUiModal({
        show: true,
        type: 'confirm', // Changed to confirm so they can still proceed
        title: 'Cultivos Asociados',
        message: `Esta semilla no se puede eliminar definitivamente de la base de datos porque rompería el historial de los siguientes cultivos activos:\n\n${listaCultivos.map((c: string) => `• Cultivo ${c}`).join('\n')}\n\nEn todo caso, sí puedes Inactivarla para que deje de aparecer en tu banco activo. ¿Deseas inactivarla?`,
        onConfirm: () => executeDelete(s.idsemillas)
      });
      return;
    }

    setUiModal({
      show: true,
      type: 'confirm',
      title: 'Inactivar Semilla',
      message: '¿Estás seguro de que quieres archivar este lote? Desaparecerá de tu banco activo, pero el historial se mantendrá intacto.',
      onConfirm: () => executeDelete(s.idsemillas)
    });
  };

  const executeDelete = async (id: string) => {
    setUiModal({ ...uiModal, show: false });
    try {
      const res = await fetch(`/api/user/semillas/${id}`, {
        method: 'DELETE',
        headers: { 'x-user-email': userEmail! }
      });
      if (res.ok) {
        loadSemillas(userEmail!);
      } else {
        const errorData = await res.json().catch(() => ({}));
        setUiModal({
          show: true, type: 'error', title: 'Error', message: errorData.error || 'Error al inactivar la semilla'
        });
      }
    } catch (e) {
      console.error(e);
      setUiModal({
        show: true, type: 'error', title: 'Error', message: 'Error de red al inactivar la semilla'
      });
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
        <h2>Cargando Banco de Semillas...</h2>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ marginBottom: '16px' }}>
        <button onClick={() => router.push('/dashboard')} style={{ background: 'white', border: '1px solid #cbd5e1', color: '#475569', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          🏠 Volver al Inicio
        </button>
      </div>
      <div style={{ background: 'linear-gradient(135deg, #0f766e, #10b981)', borderRadius: '16px', padding: '24px 28px', marginBottom: '24px', color: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800 }}>🌾 Banco de Semillas</h1>
            <p style={{ margin: '4px 0 0', opacity: 0.9, fontSize: '0.9rem' }}>
              Tu inventario personal de semillas propias y compradas
            </p>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
            <button 
              onClick={() => setShowSeedModal(true)}
              style={{ padding: '8px 16px', borderRadius: '8px', background: 'white', color: '#0f766e', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.95rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
            >
              ➕ Añadir Semilla
            </button>
          </div>
        </div>
      </div>

      {semillas.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', background: '#f8fafc', borderRadius: '16px', border: '2px dashed #cbd5e1' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🌱</div>
          <h3 style={{ margin: '0 0 8px', color: '#334155' }}>Aún no tienes semillas guardadas</h3>
          <p style={{ color: '#64748b', margin: 0 }}>Inicia un cultivo y añade semillas sobrantes al banco para verlas aquí.</p>
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: '12px', overflowX: 'auto', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              <tr>
                <th style={{ padding: '12px', position: 'sticky', left: 0, zIndex: 2, background: '#f8fafc', width: '70px', minWidth: '70px' }}>Foto</th>
                <th style={{ padding: '12px' }}>Nº Colección</th>
                <th style={{ padding: '12px' }}>Especie</th>
                <th style={{ padding: '12px' }}>Variedad</th>
                <th style={{ padding: '12px' }}>Origen</th>
                <th style={{ padding: '12px' }}>Stock</th>
                <th style={{ padding: '12px' }}>Caducidad</th>
                <th style={{ padding: '12px' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {semillas.map((s, i) => {
                const isExpired = s.semillasfechacaducidad && new Date(s.semillasfechacaducidad) < new Date();
                const isOutOfStock = s.semillasstockactual !== null && Number(s.semillasstockactual) <= 0;
                const needsArchiving = isExpired || isOutOfStock;

                return (
                <tr 
                  key={s.idsemillas} 
                  style={{ 
                    borderBottom: '1px solid #e2e8f0', 
                    background: needsArchiving ? '#fef2f2' : (i % 2 === 0 ? 'white' : '#f8fafc'),
                    transition: 'all 0.3s ease'
                  }}
                >
                  <td style={{ padding: '12px', position: 'sticky', left: 0, zIndex: 1, background: needsArchiving ? '#fef2f2' : (i % 2 === 0 ? 'white' : '#f8fafc'), width: '70px', minWidth: '70px', textAlign: 'center', verticalAlign: 'middle' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '8px', overflow: 'hidden', margin: '0 auto', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {s.foto ? (
                        <img src={getMediaUrl(s.foto)} alt={s.variedad_nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} crossOrigin="anonymous" loading="lazy" />
                      ) : (
                        <span style={{ fontSize: '1.5rem' }}>{s.especiesicono || '🌱'}</span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '12px', fontWeight: 'bold', color: '#0f766e' }}>
                    Nº {s.semillasnumerocoleccion || s.idsemillas}
                  </td>
                  <td style={{ padding: '12px', fontWeight: 'bold', color: '#1e293b' }}>
                    {s.especiesnombre}
                  </td>
                  <td style={{ padding: '12px', color: '#475569' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span>{s.variedad_nombre || s.especiesnombre}</span>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {needsArchiving && (
                          <span style={{ fontSize: '0.7rem', color: '#b91c1c', background: '#fee2e2', padding: '2px 6px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold' }}>
                            ⚠️ {isOutOfStock ? 'Sin Stock' : 'Caducada'}
                          </span>
                        )}
                        {s.semillascompartir === 1 && (
                          <span style={{ fontSize: '0.7rem', color: '#1d4ed8', background: '#dbeafe', padding: '2px 6px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold' }}>
                            🤝 Compartida
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ 
                      background: s.semillasorigen === 'por_definir' ? '#f1f5f9' : '#dcfce7', 
                      color: s.semillasorigen === 'por_definir' ? '#475569' : '#16a34a', 
                      padding: '4px 10px', 
                      borderRadius: '12px', 
                      fontSize: '0.8rem', 
                      fontWeight: 600 
                    }}>
                      {s.semillasorigen === 'por_definir' ? 'PENDIENTE DE ASIGNAR' : s.semillasorigen.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    {s.semillasstockinicial > 0 && s.semillasstockactual !== null ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ 
                          fontWeight: 'bold', 
                          color: isOutOfStock ? '#b91c1c' : (s.semillasstockactual / s.semillasstockinicial) > 0.5 ? '#16a34a' : (s.semillasstockactual / s.semillasstockinicial) > 0.2 ? '#d97706' : '#dc2626'
                        }}>
                          {isOutOfStock ? '0%' : `${Math.round((s.semillasstockactual / s.semillasstockinicial) * 100)}%`}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: isOutOfStock ? '#b91c1c' : '#64748b' }}>
                          {s.semillasstockactual} / {s.semillasstockinicial} uds
                        </span>
                      </div>
                    ) : (
                      <span style={{ color: '#94a3b8' }}>-</span>
                    )}
                  </td>
                  <td style={{ padding: '12px', color: '#475569' }}>
                    {s.semillasfechacaducidad ? (
                      <span style={{ color: isExpired ? '#b91c1c' : 'inherit', fontWeight: isExpired ? 'bold' : 'normal' }}>
                        {new Date(s.semillasfechacaducidad).toLocaleDateString()}
                      </span>
                    ) : '-'}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        style={{ background: '#f8fafc', border: '1px solid #cbd5e1', color: '#475569', cursor: 'pointer', fontSize: '0.85rem', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold' }}
                        onClick={() => router.push(`/dashboard/semillas/${s.idsemillas}`)}
                      >
                        ✏️ Editar
                      </button>
                      <button 
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', display: 'flex', alignItems: 'center' }}
                        onClick={() => triggerDelete(s)}
                        title="Inactivar / Archivar Lote"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* CUSTOM UI MODAL */}
      {uiModal.show && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: 'white', borderRadius: '16px', width: '90%', maxWidth: '400px', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)' }}>
            <div style={{ background: uiModal.type === 'error' ? '#fef2f2' : '#f0fdf4', padding: '16px 24px', borderBottom: `1px solid ${uiModal.type === 'error' ? '#fee2e2' : '#dcfce7'}` }}>
              <h3 style={{ margin: 0, color: uiModal.type === 'error' ? '#991b1b' : '#166534', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {uiModal.type === 'error' ? '⚠️' : 'ℹ️'} {uiModal.title}
              </h3>
            </div>
            <div style={{ padding: '24px' }}>
              <p style={{ margin: 0, color: '#475569', lineHeight: '1.5', fontSize: '0.95rem', whiteSpace: 'pre-wrap' }}>{uiModal.message}</p>
            </div>
            <div style={{ padding: '16px 24px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              {uiModal.type === 'confirm' ? (
                <>
                  <button onClick={() => setUiModal({ ...uiModal, show: false })} style={{ padding: '8px 16px', border: '1px solid #cbd5e1', background: 'white', borderRadius: '8px', color: '#475569', fontWeight: 600, cursor: 'pointer' }}>
                    Cancelar
                  </button>
                  <button onClick={uiModal.onConfirm} style={{ padding: '8px 16px', border: 'none', background: '#ef4444', color: 'white', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
                    Sí, Inactivar
                  </button>
                </>
              ) : (
                <button onClick={() => setUiModal({ ...uiModal, show: false })} style={{ padding: '8px 16px', border: 'none', background: '#3b82f6', color: 'white', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
                  Entendido
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <SeedWizardModal
        show={showSeedModal}
        onClose={() => setShowSeedModal(false)}
        onSuccess={() => {
          if (userEmail) loadSemillas(userEmail);
        }}
      />
    </div>
  );
}
