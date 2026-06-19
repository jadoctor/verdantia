'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { getMediaUrl } from '@/lib/media-url';
import VariedadMediaManager from '@/components/admin/VariedadMediaManager';

export default function PlantasParteForm({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const isNew = resolvedParams.id === 'nueva' || resolvedParams.id === 'nuevo';
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('datos');
  const [photos, setPhotos] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    plantaspartenombre: '',
    plantasparteemoji: '🌱',
    plantaspartedescripcion: '',
    plantasparteactivo: 1
  });
  const [initialData, setInitialData] = useState(formData);

  const isFormDirty = JSON.stringify(formData) !== JSON.stringify(initialData);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'no-changes'>('idle');
  const [loading, setLoading] = useState(!isNew);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.email) {
        setUserEmail(user.email);
      } else {
        setUserEmail(null);
        if (!isNew) setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [isNew]);

  useEffect(() => {
    if (!isNew && userEmail) {
      fetch(`/api/admin/plantasparte/${resolvedParams.id}`, {
        headers: { 'x-user-email': userEmail }
      })
        .then(r => r.json())
        .then(d => {
          if (d.plantasparte) {
            setFormData(d.plantasparte);
            setInitialData(d.plantasparte);
          }
          setLoading(false);
        })
        .catch(e => {
          console.error(e);
          setLoading(false);
        });

      loadPhotos();
    }
  }, [resolvedParams.id, isNew, userEmail]);

  const loadPhotos = async () => {
    if (!userEmail || isNew) return;
    try {
      const res = await fetch(`/api/admin/plantasparte/${resolvedParams.id}/photos`, {
        headers: { 'x-user-email': userEmail }
      });
      const data = await res.json();
      setPhotos(data.photos || []);
    } catch (e) {
      console.error(e);
    }
  };

  // Debounced Auto-save
  useEffect(() => {
    if (!isNew && isFormDirty && saveStatus !== 'saving' && saveStatus !== 'no-changes') {
      const timer = setTimeout(() => {
        handleSubmit();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [formData, isNew, isFormDirty, saveStatus]);

  const handleSubmit = async (e?: any) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!userEmail) return alert('No autenticado');
    if (!isNew && !isFormDirty) {
      setSaveStatus('no-changes');
      setTimeout(() => setSaveStatus('idle'), 2000);
      return;
    }

    setSaveStatus('saving');

    const url = isNew ? '/api/admin/plantasparte' : `/api/admin/plantasparte/${resolvedParams.id}`;
    const method = isNew ? 'POST' : 'PUT';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': userEmail
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        if (isNew) {
          const data = await res.json();
          router.push(`/dashboard/admin/tareas/plantasparte/${data.id}`);
        } else {
          setInitialData(formData);
          setSaveStatus('idle');
        }
      } else {
        alert('Error guardando la parte de planta');
        setSaveStatus('idle');
      }
    } catch (err) {
      console.error(err);
      alert('Error guardando la parte de planta');
      setSaveStatus('idle');
    }
  };

  const handleMediaChange = () => {
    loadPhotos();
  };

  const primaryPhoto = photos.find(p => p.esPrincipal === 1) || photos[0] || null;
  let primaryPhotoMeta: any = {};
  if (primaryPhoto) {
    try { primaryPhotoMeta = JSON.parse(primaryPhoto.resumen || '{}'); } catch (e) {}
  }
  const vibrantColor = primaryPhotoMeta.vibrant_color || null;

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Cargando datos...</div>;

  return (
    <div style={{ padding: '24px', width: '100%', boxSizing: 'border-box' }}>
      
      {/* ── Navegación Jerárquica Superior ── */}
      <div style={{ marginBottom: '16px', display: 'flex', gap: '8px' }}>
        <button onClick={() => router.push('/dashboard')} style={{ background: 'white', border: '1px solid #cbd5e1', color: '#475569', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
          🏠 Volver al Inicio
        </button>
        <button onClick={() => router.push('/dashboard/admin/tareas/plantasparte')} style={{ background: 'white', border: '1px solid #cbd5e1', color: '#475569', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
          🔙 Volver a Partes de la Planta
        </button>
      </div>

      {/* ── Subheader Contextual y Autoguardado ── */}
      <div style={{ 
        background: 'linear-gradient(135deg, #14532d, #16a34a)', 
        borderRadius: '14px', 
        padding: '12px 20px', 
        marginBottom: '24px', 
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        boxShadow: '0 4px 12px rgba(20, 83, 45, 0.12)'
      }}>
        {/* Bloque Izquierdo */}
        <div>
          <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>{formData.plantasparteemoji || '🍃'}</span>
            <span>{formData.plantaspartenombre || 'Nueva Parte'}</span>
          </h1>
          <p style={{ margin: '2px 0 0', opacity: 0.85, fontSize: '0.78rem' }}>
            ✏️ Editar Parte de la Planta · ID del Registro: {isNew ? 'Nuevo' : resolvedParams.id}
          </p>
        </div>

        {/* Bloque Derecho (Datos y Autoguardado) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ background: 'rgba(255, 255, 255, 0.2)', color: 'white', padding: '3px 8px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 600 }}>
            {formData.plantaspartenombre ? `@${formData.plantaspartenombre.toLowerCase().replace(/\s+/g, '')}` : '@nueva'}
          </span>
          
          {/* Indicador de Autoguardado con Debounce */}
          {!isNew && (
            <div style={{
              background: saveStatus === 'saving' ? '#fef3c7' : '#dcfce7',
              color: saveStatus === 'saving' ? '#b45309' : '#15803d',
              padding: '3px 8px',
              borderRadius: '8px',
              fontSize: '0.74rem',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              border: `1px solid ${saveStatus === 'saving' ? '#fde68a' : '#bbf7d0'}`
            }}>
              {saveStatus === 'saving' ? '⏳ Guardando...' : isFormDirty ? '✏️ Cambios sin guardar' : '✅ Guardado'}
            </div>
          )}
        </div>
      </div>

      {/* ── Estado Global/Activo en Primer Lugar ── */}
      <div style={{ 
        background: 'white', 
        padding: '16px 20px', 
        borderRadius: '12px', 
        border: '1px solid #e2e8f0', 
        marginBottom: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <strong style={{ color: '#1e293b', fontSize: '0.95rem', display: 'block' }}>Estado de Visibilidad</strong>
          <span style={{ color: '#64748b', fontSize: '0.82rem' }}>Define si esta parte se puede asociar a consumos en el catálogo</span>
        </div>
        <button
          type="button"
          onClick={() => setFormData({ ...formData, plantasparteactivo: formData.plantasparteactivo ? 0 : 1 })}
          style={{
            background: formData.plantasparteactivo ? '#dcfce7' : '#fee2e2',
            border: `1px solid ${formData.plantasparteactivo ? '#22c55e' : '#ef4444'}`,
            color: formData.plantasparteactivo ? '#166534' : '#b91c1c',
            padding: '8px 16px',
            borderRadius: '20px',
            fontWeight: 600,
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
        >
          <div style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            background: formData.plantasparteactivo ? '#22c55e' : '#ef4444',
            boxShadow: `0 0 8px ${formData.plantasparteactivo ? '#22c55e' : '#ef4444'}`
          }}></div>
          {formData.plantasparteactivo ? 'Parte Activa' : 'Parte Inactiva'}
        </button>
      </div>

      {/* ── Hero Carousel Encabezado Visual (Regla 9) ── */}
      {!isNew && (
        <div style={{
          marginBottom: '24px',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          background: vibrantColor ? `linear-gradient(135deg, #f8fafc 0%, ${vibrantColor}12 60%, ${vibrantColor}25 100%)` : '#f8fafc',
          transition: 'background 0.6s ease',
          overflow: 'hidden',
          display: 'flex',
          padding: '16px',
          gap: '16px',
          alignItems: 'center'
        }}>
          {photos.length > 0 ? (
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              {/* Foto Principal Hero */}
              <div style={{ width: '180px', height: '220px', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', flexShrink: 0 }}>
                {primaryPhoto && (
                  <img 
                    src={getMediaUrl(primaryPhoto.ruta)}
                    alt={formData.plantaspartenombre}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      objectPosition: `${primaryPhotoMeta.profile_object_x ?? 50}% ${primaryPhotoMeta.profile_object_y ?? 50}%`,
                      transform: `scale(${(primaryPhotoMeta.profile_object_zoom ?? 100) / 100})`,
                      filter: primaryPhotoMeta.profile_style ? `brightness(${primaryPhotoMeta.profile_brightness ?? 100}%) contrast(${primaryPhotoMeta.profile_contrast ?? 100}%) contrast(1.1)` : undefined
                    }}
                    crossOrigin="anonymous" 
                  />
                )}
              </div>

              {/* Miniaturas Apiladas (Verticales, máx 3) */}
              {photos.length > 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {photos.filter(p => p.id !== primaryPhoto.id).slice(0, 3).map(p => {
                    return (
                      <div 
                        key={p.id}
                        style={{ 
                          width: '52px', 
                          height: '70px', 
                          borderRadius: '6px', 
                          overflow: 'hidden', 
                          border: '1px solid #cbd5e1',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                          flexShrink: 0
                        }}
                      >
                        <img 
                          src={getMediaUrl(p.ruta)} 
                          alt="" 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          crossOrigin="anonymous" 
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px' }}>
              <span style={{ fontSize: '2.5rem' }}>🍃</span>
              <div>
                <h3 style={{ margin: 0, color: '#334155' }}>Sin fotos descriptivas</h3>
                <p style={{ margin: '2px 0 0', color: '#64748b', fontSize: '0.85rem' }}>Sube hasta 4 fotos en la pestaña Fotos para ilustrar esta parte anatómica</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Formulario Principal con Pestañas */}
      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)', overflow: 'hidden' }}>
        
        {/* Pestañas (Tabs) */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
          <button 
            type="button"
            onClick={() => setActiveTab('datos')} 
            style={{ 
              padding: '14px 20px', 
              border: 'none', 
              background: activeTab === 'datos' ? 'white' : 'transparent', 
              borderBottom: activeTab === 'datos' ? '3px solid #16a34a' : 'none',
              fontWeight: 'bold', 
              color: activeTab === 'datos' ? '#14532d' : '#64748b', 
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            📋 Datos Generales
          </button>
          <button 
            type="button"
            onClick={() => setActiveTab('fotos')} 
            disabled={isNew}
            style={{ 
              padding: '14px 20px', 
              border: 'none', 
              background: activeTab === 'fotos' ? 'white' : 'transparent', 
              borderBottom: activeTab === 'fotos' ? '3px solid #16a34a' : 'none',
              fontWeight: 'bold', 
              color: activeTab === 'fotos' ? '#14532d' : '#64748b', 
              cursor: isNew ? 'not-allowed' : 'pointer',
              opacity: isNew ? 0.5 : 1,
              fontSize: '0.9rem'
            }}
          >
            📷 Fotos ({photos.length}/4) {isNew && '(Guarda primero)'}
          </button>
        </div>

        <div style={{ padding: '24px' }}>
          {/* PESTAÑA DATOS (display controlled by CSS to avoid React unmounting) */}
          <div style={{ display: activeTab === 'datos' ? 'block' : 'none' }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#334155', fontSize: '0.9rem' }}>Nombre de la Parte *</label>
                  <input 
                    required 
                    type="text" 
                    value={formData.plantaspartenombre} 
                    onChange={e => setFormData({ ...formData, plantaspartenombre: e.target.value })} 
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} 
                    placeholder="Ej. Hojas, Flores, Frutos, Raíz..." 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#334155', fontSize: '0.9rem' }}>Emoji Representativo</label>
                  <input 
                    type="text" 
                    value={formData.plantasparteemoji} 
                    onChange={e => setFormData({ ...formData, plantasparteemoji: e.target.value })} 
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', textAlign: 'center', fontSize: '1.2rem', boxSizing: 'border-box' }} 
                    placeholder="Ej: 🍃" 
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#334155', fontSize: '0.9rem' }}>Descripción / Notas de Anatomía</label>
                <textarea 
                  value={formData.plantaspartedescripcion} 
                  onChange={e => setFormData({ ...formData, plantaspartedescripcion: e.target.value })} 
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', minHeight: '120px', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }} 
                  placeholder="Detalles sobre las características anatómicas de esta parte, usos culinarios o forrajeros comunes, o consejos de recolección..."
                />
              </div>

              {isNew && (
                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'flex-end' }}>
                  <button 
                    type="submit" 
                    style={{ 
                      background: 'linear-gradient(135deg, #14532d, #16a34a)', 
                      color: 'white', 
                      border: 'none', 
                      padding: '12px 24px', 
                      borderRadius: '8px', 
                      cursor: 'pointer', 
                      fontWeight: 'bold',
                      fontSize: '0.95rem',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                    }}
                  >
                    💾 Crear Parte de Planta
                  </button>
                </div>
              )}
            </form>
          </div>

          {/* PESTAÑA FOTOS (display controlled by CSS to avoid React unmounting, only if not new) */}
          {!isNew && (
            <div style={{ display: activeTab === 'fotos' ? 'block' : 'none' }}>
              <VariedadMediaManager 
                variedadId={resolvedParams.id}
                userEmail={userEmail || ''}
                section="photos"
                apiBasePath={`/api/admin/plantasparte/${resolvedParams.id}`}
                variedadNombre={formData.plantaspartenombre}
                especieNombre="Parte de la Planta"
                onMediaChange={handleMediaChange}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
