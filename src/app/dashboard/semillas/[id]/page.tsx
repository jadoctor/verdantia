'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { auth } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import Link from 'next/link';

export default function EditarSemillaPage() {
  const router = useRouter();
  const params = useParams();
  const semillaId = params?.id as string;
  
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [initialData, setInitialData] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success'>('idle');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user && user.email) {
        setUserEmail(user.email);
      } else {
        router.push('/login');
      }
    });
    return () => unsub();
  }, [router]);

  useEffect(() => {
    if (userEmail && semillaId) {
      loadSemilla();
    }
  }, [userEmail, semillaId]);

  const loadSemilla = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/user/semillas`, { headers: { 'x-user-email': userEmail! } });
      const data = await res.json();
      if (res.ok && data.semillas) {
        const semilla = data.semillas.find((s: any) => s.idsemillas.toString() === semillaId);
        if (semilla) {
          const parsed = {
            semillasnumerocoleccion: semilla.semillasnumerocoleccion || '',
            semillasorigen: semilla.semillasorigen || 'propia',
            semillaslugarcompra: semilla.semillaslugarcompra || '',
            semillasmarca: semilla.semillasmarca || '',
            semillasfecharecoleccion: semilla.semillasfecharecoleccion ? semilla.semillasfecharecoleccion.split('T')[0] : '',
            semillasfechaenvasado: semilla.semillasfechaenvasado ? semilla.semillasfechaenvasado.split('T')[0] : '',
            semillasfechacaducidad: semilla.semillasfechacaducidad ? semilla.semillasfechacaducidad.split('T')[0] : '',
            semillaslote: semilla.semillaslote || '',
            semillasstockinicial: semilla.semillasstockinicial || '',
            semillasstockactual: semilla.semillasstockactual || '',
            semillasobservaciones: semilla.semillasobservaciones || ''
          };
          setFormData(parsed);
          setInitialData(JSON.stringify(parsed));
        } else {
          alert('Semilla no encontrada');
          router.push('/dashboard/semillas');
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const hasChanges = JSON.stringify(formData) !== initialData;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSave = async () => {
    if (!hasChanges) {
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 1500);
      return;
    }

    setSaveStatus('saving');
    try {
      const res = await fetch(`/api/user/semillas/${semillaId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': userEmail!
        },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        setInitialData(JSON.stringify(formData));
        setSaveStatus('success');
        setTimeout(() => setSaveStatus('idle'), 1500);
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(errorData.error || 'Error al guardar');
        setSaveStatus('idle');
      }
    } catch (e) {
      console.error(e);
      alert('Error de conexión');
      setSaveStatus('idle');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto', textAlign: 'center', color: '#64748b' }}>
        <p>Cargando datos de la semilla...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* ── Navegación ── */}
      <div style={{ marginBottom: '16px', padding: '0 4px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button onClick={() => router.push('/dashboard/semillas')} style={{ background: 'white', border: '1px solid #cbd5e1', color: '#475569', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          ← Volver a Inventario
        </button>
      </div>

      {/* ── Subheader Integrado ── */}
      <div style={{ background: 'linear-gradient(135deg, #0f766e, #10b981)', borderRadius: '16px', padding: '24px 28px', marginBottom: '24px', color: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '2rem' }}>🌱</span> Lote de Semillas Nº {formData.semillasnumerocoleccion || semillaId}
              {hasChanges && <span style={{ background: '#fef08a', color: '#854d0e', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold' }}>Cambios sin guardar</span>}
            </h1>
            <p style={{ margin: '4px 0 0', opacity: 0.9, fontSize: '0.9rem' }}>
              Editor de Semilla
            </p>
          </div>
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', overflow: 'hidden' }}>
        
        {/* HEADER TAB (Solo para simular la estructura del EspecieForm) */}
        <div style={{ padding: '0 24px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '24px' }}>
          <div style={{ padding: '16px 0', borderBottom: '3px solid #0f766e', color: '#0f766e', fontWeight: 'bold', fontSize: '1rem' }}>
            ✏️ Edición de Lote
          </div>
        </div>

        <div style={{ padding: '32px', display: 'grid', gap: '32px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#475569' }}>Número de Colección</label>
              <input type="text" name="semillasnumerocoleccion" value={formData.semillasnumerocoleccion} onChange={handleChange} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#475569' }}>Origen de las Semillas</label>
              <select name="semillasorigen" value={formData.semillasorigen} onChange={handleChange} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem' }}>
                <option value="propia">Propia / Extraída</option>
                <option value="intercambio">Intercambio</option>
                <option value="sobre_comprado">Sobre Comprado</option>
                <option value="regalo">Regalo</option>
              </select>
            </div>
          </div>

          {formData.semillasorigen === 'sobre_comprado' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', background: '#f8fafc', padding: '24px', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#475569' }}>Marca Comercial</label>
                <input type="text" name="semillasmarca" placeholder="Ej. Fito, Batlle..." value={formData.semillasmarca} onChange={handleChange} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#475569' }}>Lugar de Compra</label>
                <input type="text" name="semillaslugarcompra" placeholder="Ej. Leroy Merlin, Vivero Local" value={formData.semillaslugarcompra} onChange={handleChange} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem' }} />
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#475569' }}>Stock Inicial (Unidades)</label>
              <input type="number" min="0" name="semillasstockinicial" value={formData.semillasstockinicial} onChange={handleChange} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#16a34a' }}>Stock Actual Disponible</label>
              <input type="number" min="0" name="semillasstockactual" value={formData.semillasstockactual} onChange={handleChange} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #16a34a', fontSize: '1rem', background: '#f0fdf4' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
            {formData.semillasorigen === 'propia' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#475569' }}>Fecha de Recolección</label>
                <input type="date" name="semillasfecharecoleccion" value={formData.semillasfecharecoleccion} onChange={handleChange} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem' }} />
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#475569' }}>Fecha de Envasado</label>
              <input type="date" name="semillasfechaenvasado" value={formData.semillasfechaenvasado} onChange={handleChange} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#475569' }}>Caducidad / Viabilidad</label>
              <input type="date" name="semillasfechacaducidad" value={formData.semillasfechacaducidad} onChange={handleChange} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem' }} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#475569' }}>Observaciones del Lote</label>
            <textarea 
              name="semillasobservaciones" 
              value={formData.semillasobservaciones} 
              onChange={handleChange} 
              placeholder="Escribe aquí notas adicionales sobre cómo guardaste este lote, viabilidad, porcentaje de germinación probado..."
              style={{ padding: '16px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', minHeight: '120px', fontFamily: 'inherit', resize: 'vertical' }} 
            />
          </div>

        </div>

        {/* CONTROLES DE GUARDADO FLOTANTES */}
        {hasChanges && (
          <div style={{ position: 'sticky', bottom: 0, padding: '24px 32px', background: 'white', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '16px', boxShadow: '0 -4px 6px -1px rgba(0,0,0,0.05)' }}>
            <button 
              onClick={() => {
                setFormData(JSON.parse(initialData));
              }}
              style={{ padding: '12px 24px', border: '1px solid #cbd5e1', background: 'white', color: '#475569', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '1rem' }}
            >
              Deshacer Cambios
            </button>
            <button 
              onClick={handleSave} 
              disabled={saveStatus === 'saving'}
              style={{ 
                padding: '12px 32px', border: 'none', background: saveStatus === 'success' ? '#10b981' : '#0f766e', 
                color: 'white', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.3s', fontSize: '1rem',
                minWidth: '200px'
              }}
            >
              {saveStatus === 'saving' ? '⏳ Guardando...' : saveStatus === 'success' ? '✓ Guardado con éxito' : '💾 Guardar Cambios'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
