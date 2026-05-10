'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import PlagaForm from '@/components/admin/PlagaForm';
import { getMediaUrl } from '@/lib/media-url';

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

  const getPlagaIcon = (nombre: string, tipo: string) => {
    const nameLower = (nombre || '').toLowerCase();
    
    // Asignación por nombre específico (más preciso)
    if (nameLower.includes('araña') || nameLower.includes('ácaro')) return '🕷️';
    if (nameLower.includes('caracol') || nameLower.includes('babosa')) return '🐌';
    if (nameLower.includes('hormiga')) return '🐜';
    if (nameLower.includes('mosca') || nameLower.includes('mosquito')) return '🦟';
    if (nameLower.includes('gusano') || nameLower.includes('oruga') || nameLower.includes('polilla')) return '🐛';
    if (nameLower.includes('pulgón') || nameLower.includes('cochinilla') || nameLower.includes('chinche')) return '🐞';
    if (nameLower.includes('nematodo') || nameLower.includes('lombriz')) return '🪱';
    if (nameLower.includes('pájaro') || nameLower.includes('ave') || nameLower.includes('cuervo')) return '🐦';
    if (nameLower.includes('ratón') || nameLower.includes('rata') || nameLower.includes('roedor')) return '🐁';
    if (nameLower.includes('conejo') || nameLower.includes('liebre')) return '🐇';
    if (nameLower.includes('topo')) return '🦡';
    if (nameLower.includes('jabalí')) return '🐗';
    if (nameLower.includes('ciervo') || nameLower.includes('venado')) return '🦌';
    if (nameLower.includes('mildiu') || nameLower.includes('oídio') || nameLower.includes('roya') || nameLower.includes('botrytis')) return '🌫️';

    // Fallback por tipo general si no coincide el nombre
    switch (tipo?.toLowerCase()) {
      case 'hongo': return '🍄';
      case 'insecto': return '🪲';
      case 'bacteria': return '🦠';
      case 'virus': return '🧬';
      case 'mamifero': return '🐾';
      case 'ave': return '🪶';
      default: return '⚠️';
    }
  };

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

      {filteredPlagas.length > 0 ? (
        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.95rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.05em' }}>
                <th style={{ padding: '12px', position: 'sticky', left: 0, zIndex: 2, background: '#f8fafc' }}>Foto</th>
                <th style={{ padding: '12px' }}>Nombre</th>
                <th style={{ padding: '12px' }}>Nombre Científico</th>
                <th style={{ padding: '12px' }}>Tipo</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredPlagas.map((plaga, i) => (
                <tr key={plaga.idplagas} style={{ borderBottom: '1px solid #e2e8f0', background: i % 2 === 0 ? 'white' : '#f8fafc' }}>
                  <td style={{ padding: '8px', position: 'sticky', left: 0, zIndex: 1, background: i % 2 === 0 ? 'white' : '#f8fafc', width: '80px', minWidth: '80px', textAlign: 'center', verticalAlign: 'middle' }}>
                    {(() => {
                      if (plaga.primary_photo_ruta) {
                        let meta: any = {};
                        try { meta = JSON.parse(plaga.primary_photo_resumen || '{}'); } catch(err){}
                        const STYLE_FILTERS: Record<string, string> = {
                          none: 'none', vivid: 'saturate(1.3) contrast(1.1)', warm: 'sepia(0.25) saturate(1.2)',
                          cool: 'saturate(0.9) hue-rotate(15deg)', bw: 'grayscale(1)', vintage: 'sepia(0.4) contrast(0.9) brightness(1.1)',
                          dramatic: 'contrast(1.4) saturate(1.2)', soft: 'brightness(1.1) contrast(0.9) saturate(0.9)',
                        };
                        let baseFilter = meta.profile_style ? STYLE_FILTERS[meta.profile_style] : 'none';
                        if (meta.profile_brightness !== undefined || meta.profile_contrast !== undefined) {
                          baseFilter = `brightness(${meta.profile_brightness ?? 100}%) contrast(${meta.profile_contrast ?? 100}%) ${meta.profile_style ? STYLE_FILTERS[meta.profile_style] : ''}`.trim();
                        }
                        return (
                          <div style={{ width: '56px', height: '56px', borderRadius: '8px', overflow: 'hidden', margin: '0 auto', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', backgroundColor: meta.dominant_color || '#f1f5f9', position: 'relative' }}>
                            <img 
                              src={getMediaUrl(plaga.primary_photo_ruta)} 
                              alt={plaga.plagasnombre}
                              crossOrigin="anonymous"
                              loading="lazy"
                              style={{ 
                                width: '100%', height: '100%', objectFit: 'cover',
                                filter: baseFilter,
                                objectPosition: `${meta.profile_object_x ?? 50}% ${meta.profile_object_y ?? 50}%`,
                                transformOrigin: `${meta.profile_object_x ?? 50}% ${meta.profile_object_y ?? 50}%`,
                                transform: `scale(${(meta.profile_object_zoom ?? 100) / 100})`,
                                position: 'absolute', top: 0, left: 0, zIndex: 1
                              }} 
                            />
                          </div>
                        );
                      }
                      return (
                        <span style={{ fontSize: '2rem' }}>
                          {getPlagaIcon(plaga.plagasnombre, plaga.plagastipo)}
                        </span>
                      );
                    })()}
                  </td>
                  <td style={{ padding: '12px', fontWeight: 'bold', color: '#1e293b' }}>
                    {plaga.plagasnombre}
                  </td>
                  <td style={{ padding: '12px', fontStyle: 'italic', color: '#64748b' }}>
                    {plaga.plagasnombrecientifico || '-'}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ 
                      background: plaga.plagastipo === 'hongo' ? '#fee2e2' : plaga.plagastipo === 'insecto' ? '#dbeafe' : '#f3f4f6', 
                      color: plaga.plagastipo === 'hongo' ? '#991b1b' : plaga.plagastipo === 'insecto' ? '#1e40af' : '#475569', 
                      padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase'
                    }}>
                      {plaga.plagastipo || 'N/A'}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '10px' }}>
                      <button 
                        onClick={() => { setEditingPlagaId(plaga.idplagas); setIsModalOpen(true); }}
                        style={{ background: '#f8fafc', border: '1px solid #cbd5e1', color: '#475569', cursor: 'pointer', fontSize: '0.85rem', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold' }}
                      >
                        Editor de Plaga
                      </button>
                      
                      {deleteConfirmId === plaga.idplagas ? (
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button onClick={() => handleDelete(plaga.idplagas)} style={{ padding: '4px 8px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>✓</button>
                          <button onClick={() => setDeleteConfirmId(null)} style={{ padding: '4px 8px', background: '#e2e8f0', color: '#334155', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>✕</button>
                        </div>
                      ) : (
                        <button onClick={() => setDeleteConfirmId(plaga.idplagas)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', display: 'flex', alignItems: 'center' }}>🗑️</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
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
