'use client';
// Next.js Hot Reload Refresh Trigger - PDF Standard Rule 21 and useTratamientoPhotos Hook fixed
import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import TratamientoHero from './components/TratamientoHero';
import { useTratamientoPhotos } from './hooks/useTratamientoPhotos';
import VariedadMediaManager from '@/components/admin/VariedadMediaManager';
import TratamientoAIAssistant from '@/components/admin/TratamientoAIAssistant';
import TratamientoHealthCheck from '@/components/admin/TratamientoHealthCheck';
import '@/components/admin/EspecieForm.css';

const defaultFormData = {
  tratamientosactivo: 1,
  tratamientosnombre: '',
  tratamientostipo: 'ecológico',
  tratamientosdescripcion: '',
  tratamientospreparacion: '',
  tratamientosprecauciones: '',
  partes: [] as number[]
};

export default function EditarTratamientoPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params);
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const searchParams = useSearchParams();
  const editPdfParam = searchParams.get('editPdf');
  const [activeTab, setActiveTab] = useState(() => {
    const tabParam = searchParams.get('tab');
    return tabParam && ['detalles', 'fotos', 'pdfs', 'blogs'].includes(tabParam) ? tabParam : 'detalles';
  });
  const [isFichaOpen, setIsFichaOpen] = useState(true);
  const [showAiModal, setShowAiModal] = useState(false);
  const [mediaRefreshTrigger, setMediaRefreshTrigger] = useState(0);

  const [formData, setFormData] = useState<any>(defaultFormData);
  const [initialData, setInitialData] = useState<any>(defaultFormData);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [plantasParteCatalog, setPlantasParteCatalog] = useState<any[]>([]);
  
  const { photos, refreshPhotos } = useTratamientoPhotos(resolvedParams.id, userEmail);

  const handleSetPrimaryPhoto = async (photoId: number) => {
    if (!userEmail || resolvedParams.id === 'nuevo') return;
    try {
      await fetch(`/api/admin/tratamientos/${resolvedParams.id}/photos`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail },
        body: JSON.stringify({ photoId, action: 'setPrimary' })
      });
      refreshPhotos();
    } catch (e) {
      console.error(e);
    }
  };
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const checkResize = () => setIsMobile(window.innerWidth <= 768);
      checkResize();
      window.addEventListener('resize', checkResize);
      return () => window.removeEventListener('resize', checkResize);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.email) {
        setUserEmail(user.email);
        setAuthReady(true);
      } else {
        router.push('/login');
      }
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (authReady && userEmail) {
      fetchCatalogos();
      if (resolvedParams.id !== 'nuevo') {
        fetchTratamiento();
      } else {
        setLoading(false);
      }
    }
  }, [authReady, userEmail, resolvedParams.id]);

  const fetchCatalogos = async () => {
    try {
      const res = await fetch('/api/admin/plantasparte', { headers: { 'x-user-email': userEmail || '' } });
      if (res.ok) {
        const data = await res.json();
        setPlantasParteCatalog(data.plantaspartes || []);
      }
    } catch (error) {
      console.error('Error fetching catalogos:', error);
    }
  };

  const fetchTratamiento = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/tratamientos`, {
        headers: { 'x-user-email': userEmail || '' },
        cache: 'no-store'
      });
      if (res.ok) {
        const data = await res.json();
        const tratamiento = data.tratamientos?.find((t: any) => t.idtratamientos.toString() === resolvedParams.id);
        if (tratamiento) {
          const loadedData = {
            tratamientosactivo: tratamiento.tratamientosactivo ?? 1,
            tratamientosnombre: tratamiento.tratamientosnombre || '',
            tratamientostipo: tratamiento.tratamientostipo || 'ecológico',
            tratamientosdescripcion: tratamiento.tratamientosdescripcion || '',
            tratamientospreparacion: tratamiento.tratamientospreparacion || '',
            tratamientosprecauciones: tratamiento.tratamientosprecauciones || '',
            tratamientosdosis: tratamiento.tratamientosdosis || '',
            tratamientosfrecuencia: tratamiento.tratamientosfrecuencia || '',
            tratamientosaccion: tratamiento.tratamientosaccion || '',
            tratamientoscarencia: tratamiento.tratamientoscarencia || '',
            tratamientosmecanismo: tratamiento.tratamientosmecanismo || '',
            partes: tratamiento.partes ? tratamiento.partes.map((p: any) => p.idplantasparte) : []
          };
          setFormData(loadedData);
          setInitialData(loadedData);
        }
      }
    } catch (error) {
      console.error('Error fetching tratamiento:', error);
    } finally {
      setLoading(false);
    }
  };

  const autoSave = async (dataToSave: any) => {
    setSaveStatus('saving');
    try {
      const url = resolvedParams.id !== 'nuevo' ? `/api/admin/tratamientos/${resolvedParams.id}` : '/api/admin/tratamientos';
      const method = resolvedParams.id !== 'nuevo' ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': userEmail || ''
        },
        body: JSON.stringify(dataToSave),
        keepalive: true
      });

      if (res.ok) {
        if (resolvedParams.id === 'nuevo') {
          const data = await res.json();
          if (data.id) {
            router.replace(`/dashboard/admin/tratamientos/${data.id}`);
          }
        } else {
          setInitialData(dataToSave);
          setSaveStatus('saved');
          setTimeout(() => setSaveStatus('idle'), 2000);
        }
      } else {
        setSaveStatus('idle');
        console.error('Error auto-guardando');
      }
    } catch (error) {
      console.error('Error in autoSave:', error);
      setSaveStatus('idle');
    }
  };


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let newValue: any = value;
    if (type === 'checkbox') {
      newValue = (e.target as HTMLInputElement).checked ? 1 : 0;
    }
    
    const newData = { ...formData, [name]: newValue };
    setFormData(newData);
    setSaveStatus('saving');

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      autoSave(newData);
    }, 1200);
  };

  const handleMultiSelectChange = (name: string, value: string) => {
    setFormData((prev: any) => {
      const currentValues = prev[name] ? prev[name].split(', ') : [];
      let newValues;
      if (currentValues.includes(value)) {
        newValues = currentValues.filter((v: string) => v !== value);
      } else {
        newValues = [...currentValues, value];
      }
      const newData = { ...prev, [name]: newValues.join(', ') };
      
      setSaveStatus('saving');
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        autoSave(newData);
      }, 1200);

      return newData;
    });
  };

  const handleParteToggle = (idparte: number) => {
    const currentPartes = formData.partes || [];
    const newPartes = currentPartes.includes(idparte)
      ? currentPartes.filter((id: number) => id !== idparte)
      : [...currentPartes, idparte];

    const newData = { ...formData, partes: newPartes };
    setFormData(newData);
    setSaveStatus('saving');

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      autoSave(newData);
    }, 1200);
  };

  const getViaAplicacionVisual = (p: any) => {
    switch (p.idplantasparte) {
      case 1: return 'Vía Foliar / Aérea (Hojas)';
      case 3: return 'Vía Radicular (Suelo / Riego)';
      case 4: return 'Inyección / Pintado (Tronco)';
      case 7: return 'Drench / Entorno General';
      default: return `Aplicación en ${p.plantaspartenombre}`;
    }
  };

  if (!authReady || loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
        <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🧪</div>
        <p>Cargando tratamiento...</p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', padding: isMobile ? '0' : '20px', boxSizing: 'border-box', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* Navegación Hierárquica */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', padding: isMobile ? '10px' : '0' }}>
        <button onClick={() => router.push('/dashboard')} style={{ background: 'white', border: '1px solid #cbd5e1', color: '#475569', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
          🏠 Volver al Inicio
        </button>
        {searchParams.get('from') === 'enlaces' ? (
          <button onClick={() => router.push('/dashboard/admin/mantenimiento/enlaces')} style={{ background: 'white', border: '1px solid #cbd5e1', color: '#475569', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
            🔗 Volver a Salud de Enlaces
          </button>
        ) : searchParams.get('from') === 'pdfs' ? (
          <button onClick={() => router.push('/dashboard/admin/pdfs')} style={{ background: 'white', border: '1px solid #cbd5e1', color: '#475569', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
            🔙 Volver a Gestor de PDFs
          </button>
        ) : (
          <button onClick={() => router.push('/dashboard/admin/tratamientos')} style={{ background: 'white', border: '1px solid #cbd5e1', color: '#475569', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
            🔙 Volver a Tratamientos
          </button>
        )}
      </div>

      {/* Subheader Contextual */}
      <div style={{ 
        background: 'linear-gradient(135deg, #0f766e, #3b82f6)', borderRadius: isMobile ? '0' : '14px', 
        padding: '12px 20px', color: 'white', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' 
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>
            🧪 {resolvedParams.id === 'nuevo' ? 'Nuevo Tratamiento' : formData.tratamientosnombre || 'Edición de Tratamiento'}
          </h1>
          <p style={{ margin: '4px 0 0', opacity: 0.8, fontSize: '0.85rem' }}>✏️ Editar Tratamiento · ID: {resolvedParams.id}</p>
        </div>
      </div>

      {/* Estado Global (Activo) */}
      <div style={{ marginBottom: '24px', background: 'white', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold', color: formData.tratamientosactivo ? '#166534' : '#94a3b8' }}>
          <input 
            type="checkbox" 
            name="tratamientosactivo" 
            checked={!!formData.tratamientosactivo} 
            onChange={handleChange}
            style={{ width: '20px', height: '20px', accentColor: '#10b981' }}
          />
          {formData.tratamientosactivo ? 'Tratamiento Activo y Disponible' : 'Tratamiento Inhabilitado'}
        </label>
        <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Controla si este tratamiento puede ser vinculado a las afecciones.</span>
      </div>

      {/* Hero Carousel */}
      <TratamientoHero photos={photos} onSetPrimary={handleSetPrimaryPhoto} />

      {/* Ficha de Tratamiento Colapsable */}
      <div className="especie-form-container">
        <form onSubmit={(e) => e.preventDefault()} className="especie-form-body">
          <div
            className="collapsible-header"
            onClick={() => setIsFichaOpen(!isFichaOpen)}
            style={{ padding: '15px 24px', background: '#e2e8f0', cursor: 'pointer', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <span>
              Ficha de Tratamiento
              {!isFichaOpen && formData.tratamientosnombre && (
                <span style={{ color: '#475569', marginLeft: '10px', fontWeight: 'normal' }}>
                  — {formData.tratamientosnombre}
                </span>
              )}
            </span>
            <span>{isFichaOpen ? '▲' : '▼'}</span>
          </div>

          {isFichaOpen && (
            <div className="collapsible-content">
              
              {/* Action Bar */}
              <div style={{ padding: '15px 24px', background: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '16px' }}>
                <button type="button" onClick={() => setShowAiModal(true)} className="btn-ai" style={{ 
                  margin: 0,
                  background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
                  color: 'white',
                  fontWeight: 'bold',
                  boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
                  cursor: 'pointer',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease',
                  flexShrink: 0
                }}>
                  <span style={{ fontSize: '1.25rem' }}>✨</span> Asistente IA
                </button>
                {resolvedParams.id !== 'nuevo' && (
                  <div style={{ flex: 1 }}>
                    <TratamientoHealthCheck 
                      formData={formData} 
                      tratamientoId={resolvedParams.id} 
                      userEmail={userEmail!} 
                      onNavigateTab={setActiveTab} 
                      refreshTrigger={mediaRefreshTrigger}
                    />
                  </div>
                )}
              </div>

              <div className="form-tabs">
                <button type="button" className={activeTab === 'detalles' ? 'active' : ''} onClick={() => setActiveTab('detalles')}>📝 Detalles</button>
                <button type="button" className={activeTab === 'fotos' ? 'active' : ''} onClick={() => setActiveTab('fotos')}>📷 Fotos</button>
                <button type="button" className={activeTab === 'pdfs' ? 'active' : ''} onClick={() => setActiveTab('pdfs')}>📄 PDFs</button>
                <button type="button" className={activeTab === 'blogs' ? 'active' : ''} onClick={() => setActiveTab('blogs')}>✍️ Blogs IA</button>
              </div>

              <div className="form-tab-content">
                
                {/* TAB: Detalles */}
                <div className="grid-form" style={{ display: activeTab === 'detalles' ? 'block' : 'none', padding: isMobile ? '16px' : '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#475569' }}>Nombre del Tratamiento *</label>
              <input 
                type="text" name="tratamientosnombre" required
                value={formData.tratamientosnombre} onChange={handleChange}
                style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem' }}
                placeholder="Ej: Jabón Potásico 20%"
              />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#475569' }}>Naturaleza / Origen</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc' }}>
                {[
                  { id: 'ecológico', label: 'Ecológico' },
                  { id: 'orgánico', label: 'Orgánico' },
                  { id: 'químico', label: 'Químico / Sintético' },
                  { id: 'biológico', label: 'Biológico (Depredadores, etc)' },
                  { id: 'físico', label: 'Físico / Mecánico' }
                ].map(opt => (
                  <label key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', cursor: 'pointer', background: 'white', padding: '4px 10px', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
                    <input 
                      type="checkbox" 
                      checked={(formData.tratamientostipo || '').toLowerCase().split(',').map((s: string) => s.trim()).includes(opt.id)}
                      onChange={() => handleMultiSelectChange('tratamientostipo', opt.id)}
                      style={{ accentColor: '#10b981' }}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#475569' }}>Modo de Acción (Finalidad)</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc' }}>
                {[
                  { id: 'preventivo', label: 'Preventivo (Protector)' },
                  { id: 'curativo', label: 'Curativo (Contacto / Choque)' },
                  { id: 'sistémico', label: 'Sistémico (Absorción interna)' },
                  { id: 'erradicante', label: 'Erradicante' }
                ].map(opt => (
                  <label key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', cursor: 'pointer', background: 'white', padding: '4px 10px', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
                    <input 
                      type="checkbox" 
                      checked={(formData.tratamientosaccion || '').toLowerCase().split(',').map((s: string) => s.trim()).includes(opt.id)}
                      onChange={() => handleMultiSelectChange('tratamientosaccion', opt.id)}
                      style={{ accentColor: '#3b82f6' }}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#475569' }}>Plazo de Seguridad (Carencia)</label>
              <input 
                type="text" name="tratamientoscarencia"
                value={formData.tratamientoscarencia || ''} onChange={handleChange}
                style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem' }}
                placeholder="Ej: 3 días / Sin carencia"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#475569' }}>Dosis Recomendada</label>
              <input 
                type="text" name="tratamientosdosis"
                value={formData.tratamientosdosis || ''} onChange={handleChange}
                style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem' }}
                placeholder="Ej: 5 ml/L de agua"
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#475569' }}>Frecuencia de Aplicación</label>
              <input 
                type="text" name="tratamientosfrecuencia"
                value={formData.tratamientosfrecuencia || ''} onChange={handleChange}
                style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem' }}
                placeholder="Ej: Cada 15 días"
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#475569' }}>Mecanismo de Acción (Cómo funciona)</label>
            <textarea 
              name="tratamientosmecanismo" rows={2}
              value={formData.tratamientosmecanismo || ''} onChange={handleChange}
              style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', resize: 'vertical' }}
              placeholder="Ej: Actúa por asfixia y reblandecimiento del exoesqueleto de los insectos..."
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#475569' }}>Descripción General</label>
            <textarea 
              name="tratamientosdescripcion" rows={3}
              value={formData.tratamientosdescripcion} onChange={handleChange}
              style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', resize: 'vertical' }}
              placeholder="Ej: Insecticida ecológico de contacto a base de sales potásicas..."
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#475569' }}>Preparación y Uso Genérico</label>
            <textarea 
              name="tratamientospreparacion" rows={3}
              value={formData.tratamientospreparacion} onChange={handleChange}
              style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', resize: 'vertical' }}
              placeholder="Ej: Diluir 20ml por litro de agua. Agitar bien antes de usar."
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#475569' }}>Precauciones / Toxicidad</label>
            <textarea 
              name="tratamientosprecauciones" rows={2}
              value={formData.tratamientosprecauciones} onChange={handleChange}
              style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', resize: 'vertical' }}
              placeholder="Ej: No aplicar a pleno sol para evitar quemaduras."
            />
          </div>

          <div id="partes" style={{ marginTop: '30px', padding: '24px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🎯 Vías de Aplicación
            </h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '0.9rem', color: '#64748b' }}>
              Selecciona a qué partes de la planta se puede aplicar este tratamiento. Esto afectará a cómo se muestra en los asistentes IA y manuales agronómicos.
            </p>
            
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
              {plantasParteCatalog.map(p => {
                const isSelected = formData.partes?.includes(p.idplantasparte);
                return (
                  <div 
                    key={p.idplantasparte}
                    onClick={() => handleParteToggle(p.idplantasparte)}
                    style={{
                      padding: '16px', borderRadius: '12px', cursor: 'pointer',
                      border: isSelected ? '2px solid #3b82f6' : '2px solid transparent',
                      background: isSelected ? '#eff6ff' : 'white',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                      display: 'flex', alignItems: 'center', gap: '12px', transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ fontSize: '2rem' }}>{p.plantasparteemoji}</div>
                    <div>
                      <div style={{ fontWeight: 'bold', color: isSelected ? '#1e40af' : '#334155', fontSize: '0.95rem' }}>
                        {getViaAplicacionVisual(p)}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        Base: {p.plantaspartenombre}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* TAB: Fotos */}
        <div style={{ display: activeTab === 'fotos' ? 'block' : 'none' }}>
          {resolvedParams.id === 'nuevo' ? (
            <div style={{ padding: '40px', textAlign: 'center', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1', color: '#64748b' }}>
              Guarda un nombre para el tratamiento primero antes de poder subir fotos.
            </div>
          ) : (
            <VariedadMediaManager 
              variedadId={resolvedParams.id} 
              userEmail={userEmail!} 
              variedadNombre={formData.tratamientosnombre}
              especieNombre="Tratamiento"
              apiBasePath={`/api/admin/tratamientos/${resolvedParams.id}`}
              section="photos"
              onMediaChange={() => { refreshPhotos(); setMediaRefreshTrigger(p => p + 1); }}
              entityType="tratamientos"
            />
          )}
        </div>

        {/* TAB: PDFs */}
        <div style={{ display: activeTab === 'pdfs' ? 'block' : 'none' }}>
          {resolvedParams.id === 'nuevo' ? (
            <div style={{ padding: '40px', textAlign: 'center', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1', color: '#64748b' }}>
              Guarda un nombre para el tratamiento primero antes de poder subir documentos.
            </div>
          ) : (
            <VariedadMediaManager 
              variedadId={resolvedParams.id} 
              userEmail={userEmail!} 
              variedadNombre={formData.tratamientosnombre}
              especieNombre="Tratamiento"
              apiBasePath={`/api/admin/tratamientos/${resolvedParams.id}`}
              section="pdfs"
              onMediaChange={() => setMediaRefreshTrigger(p => p + 1)}
              entityType="tratamientos"
              initialEditPdfId={editPdfParam ? parseInt(editPdfParam, 10) : null}
            />
          )}
        </div>

        {/* TAB: Blogs */}
        <div style={{ display: activeTab === 'blogs' ? 'block' : 'none' }}>
          {resolvedParams.id === 'nuevo' ? (
            <div style={{ padding: '40px', textAlign: 'center', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1', color: '#64748b' }}>
              Guarda un nombre para el tratamiento primero antes de poder gestionar blogs.
            </div>
          ) : (
            <VariedadMediaManager 
              variedadId={resolvedParams.id} 
              userEmail={userEmail!} 
              variedadNombre={formData.tratamientosnombre}
              especieNombre="Tratamiento"
              apiBasePath={`/api/admin/tratamientos/${resolvedParams.id}`}
              section="blogs"
              onMediaChange={() => setMediaRefreshTrigger(p => p + 1)}
              entityType="tratamientos"
            />
          )}
        </div>

              </div>
            </div>
          )}
        </form>
      </div>

      <TratamientoAIAssistant 
        show={showAiModal} 
        onClose={() => setShowAiModal(false)} 
        currentData={formData} 
        onApplyChanges={async (newData) => {
          setFormData(newData);
          await autoSave(newData);
        }} 
      />

    </div>
  );
}
