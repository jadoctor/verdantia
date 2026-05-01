'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import PlagaForm from '@/components/admin/PlagaForm';

export default function PlagasAdminPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [plagas, setPlagas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlagaId, setEditingPlagaId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.email) {
        setUserEmail(user.email);
        setAuthLoading(false);
      } else {
        setUserEmail(null);
        router.push('/login');
      }
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (userEmail) {
      fetchPlagas();
    }
  }, [userEmail]);

  const fetchPlagas = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/plagas', {
        headers: { 'x-user-email': userEmail || '' }
      });
      if (response.ok) {
        const data = await response.json();
        setPlagas(data.plagas || []);
      }
    } catch (error) {
      console.error('Error fetching plagas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/plagas/${id}`, {
        method: 'DELETE',
        headers: { 'x-user-email': userEmail || '' }
      });
      if (response.ok) {
        setPlagas(plagas.filter(p => p.idplagas !== id));
        setDeleteConfirmId(null);
      } else {
        alert('Error al eliminar. Puede que la plaga esté vinculada a alguna especie.');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const filteredPlagas = plagas.filter(p => 
    p.plagasnombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.plagasnombrecientifico?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (authLoading || loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Cargando catálogo...</div>;

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      <div style={{
        background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
        borderRadius: '16px', padding: '32px', marginBottom: '32px',
        color: 'white', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div>
          <h1 style={{ margin: '0 0 8px 0', fontSize: '2rem', fontWeight: '800', letterSpacing: '-0.02em' }}>
            🐛 Catálogo Maestro de Plagas
          </h1>
          <p style={{ margin: 0, opacity: 0.8, fontSize: '1.05rem', maxWidth: '600px' }}>
            Gestiona el diccionario global de plagas, hongos y enfermedades. Estos registros se utilizarán para vincularlos con las diferentes especies del sistema.
          </p>
        </div>
        <div>
          <button 
            onClick={() => { setEditingPlagaId(null); setIsModalOpen(true); }}
            style={{
              background: '#10b981', color: 'white', border: 'none',
              padding: '12px 24px', borderRadius: '12px', fontSize: '1rem',
              fontWeight: '600', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.3)',
              display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s'
            }}
          >
            <span>+</span> Nueva Plaga
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'center' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</span>
          <input 
            type="text" 
            placeholder="Buscar por nombre común o científico..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ 
              width: '100%', padding: '14px 14px 14px 44px', borderRadius: '12px', 
              border: '1px solid #e2e8f0', fontSize: '1rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', boxSizing: 'border-box'
            }}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
        {filteredPlagas.map(plaga => (
          <div key={plaga.idplagas} style={{
            background: 'white', borderRadius: '16px', padding: '24px',
            border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div>
                <h3 style={{ margin: '0 0 4px 0', color: '#1e293b', fontSize: '1.2rem' }}>{plaga.plagasnombre}</h3>
                {plaga.plagasnombrecientifico && (
                  <p style={{ margin: 0, fontStyle: 'italic', color: '#64748b', fontSize: '0.9rem' }}>
                    {plaga.plagasnombrecientifico}
                  </p>
                )}
              </div>
              <span style={{ 
                background: plaga.plagastipo === 'hongo' ? '#fee2e2' : plaga.plagastipo === 'insecto' ? '#dbeafe' : '#f3f4f6', 
                color: plaga.plagastipo === 'hongo' ? '#991b1b' : plaga.plagastipo === 'insecto' ? '#1e40af' : '#475569', 
                padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase'
              }}>
                {plaga.plagastipo || 'N/A'}
              </span>
            </div>

            <p style={{ margin: '0 0 20px 0', fontSize: '0.9rem', color: '#475569', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {plaga.plagasdescripcion || 'Sin descripción.'}
            </p>

            <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
              <button 
                onClick={() => { setEditingPlagaId(plaga.idplagas); setIsModalOpen(true); }}
                style={{
                  flex: 1, padding: '8px', background: '#f8fafc', border: '1px solid #cbd5e1', 
                  borderRadius: '8px', cursor: 'pointer', fontWeight: '600', color: '#334155'
                }}>
                Editar
              </button>
              
              {deleteConfirmId === plaga.idplagas ? (
                <div style={{ display: 'flex', gap: '4px', flex: 1 }}>
                  <button onClick={() => handleDelete(plaga.idplagas)} style={{ flex: 1, background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>✓</button>
                  <button onClick={() => setDeleteConfirmId(null)} style={{ flex: 1, background: '#e2e8f0', color: '#334155', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>✕</button>
                </div>
              ) : (
                <button 
                  onClick={() => setDeleteConfirmId(plaga.idplagas)}
                  style={{
                    padding: '8px 16px', background: '#fee2e2', border: 'none', 
                    borderRadius: '8px', cursor: 'pointer', color: '#ef4444'
                  }}>
                  🗑️
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredPlagas.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
          <span style={{ fontSize: '3rem' }}>🍃</span>
          <h3 style={{ color: '#475569', marginTop: '16px' }}>No hay plagas registradas</h3>
        </div>
      )}

      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'white', width: '100%', maxWidth: '600px', borderRadius: '16px', maxHeight: '90vh', overflowY: 'auto' }}>
            <PlagaForm 
              plagaId={editingPlagaId} 
              userEmail={userEmail || ''} 
              onClose={() => { setIsModalOpen(false); fetchPlagas(); }} 
            />
          </div>
        </div>
      )}
    </div>
  );
}
