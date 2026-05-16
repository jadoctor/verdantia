'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { auth } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { getMediaUrl } from '@/lib/media-url';
import UserPlantaMediaManager from '@/components/user/UserPlantaMediaManager';
import IniciarCultivoModal from '@/components/user/IniciarCultivoModal';
import '@/components/admin/EspecieForm.css';

const TIPOS = ['hortaliza', 'fruta', 'aromatica', 'leguminosa', 'cereal', 'otra'];
const CICLOS = ['anual', 'bianual', 'perenne'];

export default function MiPlantaDetail() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const plantaId = params.id as string;
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Drag states for carousel
  const [draggingCarouselId, setDraggingCarouselId] = useState<string | null>(null);
  const [dragOverHero, setDragOverHero] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'no-changes'>('idle');
  const [activeTab, setActiveTab] = useState('datos');
  const [activeSubTab, setActiveSubTab] = useState('taxonomia');
  const [fichaOpen, setFichaOpen] = useState(false);
  const [cultivosOpen, setCultivosOpen] = useState(true);
  const [showCultivoModal, setShowCultivoModal] = useState(false);
  
  const [planta, setPlanta] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [originalData, setOriginalData] = useState<any>({});
  
  // Pautas
  const [pautas, setPautas] = useState<any[]>([]);
  const [loadingPautas, setLoadingPautas] = useState(false);

  // Fotos
  const [photos, setPhotos] = useState<any[]>([]);
  const [primaryPhotoId, setPrimaryPhotoId] = useState<string | null>(null);
  const [mediaRefreshKey, setMediaRefreshKey] = useState(0);

  // Cultivos
  const [cultivos, setCultivos] = useState<any[]>([]);
  const [loadingCultivos, setLoadingCultivos] = useState(false);

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
    if (searchParams.get('startCultivo') === 'true') {
      setShowCultivoModal(true);
      // Opcional: limpiar la URL para que si recarga no se vuelva a abrir
      window.history.replaceState(null, '', `/dashboard/mis-plantas/${plantaId}`);
    }
  }, [searchParams, plantaId]);

  useEffect(() => {
    if (userEmail && plantaId) {
      loadPlanta();
      loadPautas();
      loadPhotos();
      loadCultivos();
    }
  }, [userEmail, plantaId]);

  const loadPhotos = async () => {
    try {
      const res = await fetch(`/api/user/plantas/${plantaId}/photos`, { headers: { 'x-user-email': userEmail! } });
      const data = await res.json();
      setPhotos(data.photos || []);
      setPrimaryPhotoId(null);
    } catch (e) {
      console.error('Error loading photos:', e);
    }
  };

  const loadPlanta = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/user/plantas/${plantaId}`, { headers: { 'x-user-email': userEmail! } });
      if (res.ok) {
        const data = await res.json();
        const p = data.planta;
        // Parsear arrays si vienen como string
        if (p.tiposiembra && typeof p.tiposiembra === 'string' && p.tiposiembra.includes(',')) {
           p.tiposiembra = p.tiposiembra.split(',');
        }
        setPlanta(p);
        
        // El formData guardará solo lo que el usuario ha personalizado.
        // Pero para la UI necesitamos mostrar el valor COALESCE.
        // Lo que haremos es que el input muestre el valor heredado si no hay valor del usuario.
        
        // Creamos un objeto con los campos que el usuario SÍ ha personalizado
        const userOverrides: any = {};
        Object.keys(p).forEach(key => {
          if (key.startsWith('_p_') && p[key] === 1) {
            const fieldName = 'variedades' + key.replace('_p_', '');
            userOverrides[fieldName] = p[key.replace('_p_', '')];
          }
        });
        // Algunos campos no tienen flag _p_ (como los checkbox), los tratamos directamente:
        if (p.variedadesautosuficiencia) userOverrides.variedadesautosuficiencia = p.variedadesautosuficiencia;
        
        setFormData(userOverrides);
        setOriginalData({ ...userOverrides });
      } else {
        router.push('/dashboard/mis-plantas');
      }
    } catch (e) {
      console.error('Error loading planta:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadPautas = async () => {
    try {
      setLoadingPautas(true);
      const res = await fetch(`/api/user/plantas/${plantaId}/pautas`, { headers: { 'x-user-email': userEmail! } });
      if (res.ok) {
        const data = await res.json();
        setPautas(data.pautas || []);
      }
    } catch (e) {
      console.error('Error loading pautas:', e);
    } finally {
      setLoadingPautas(false);
    }
  };

  const loadCultivos = async () => {
    try {
      setLoadingCultivos(true);
      const res = await fetch(`/api/user/cultivos?variedadId=${plantaId}`, { headers: { 'x-user-email': userEmail! } });
      if (res.ok) {
        const data = await res.json();
        setCultivos(data.cultivos || []);
      }
    } catch (e) {
      console.error('Error loading cultivos:', e);
    } finally {
      setLoadingCultivos(false);
    }
  };

  const handleDeleteCultivo = async (id: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este cultivo por completo? Esta acción no se puede deshacer.')) return;
    
    try {
      const res = await fetch(`/api/user/cultivos/${id}`, {
        method: 'DELETE',
        headers: { 'x-user-email': userEmail! }
      });
      if (res.ok) {
        loadCultivos();
      } else {
        alert('Error al eliminar el cultivo');
      }
    } catch (e) {
      console.error(e);
      alert('Error de red al eliminar cultivo');
    }
  };

  const handleEditCultivo = (c: any) => {
    router.push(`/dashboard/cultivos/${c.idcultivos}`);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let finalValue: any = value;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      finalValue = checked ? 1 : 0;
    }

    setFormData((prev: any) => ({
      ...prev,
      [name]: finalValue
    }));
    
    if (type === 'checkbox' || e.target.tagName === 'SELECT') {
      setTimeout(() => saveField(name, finalValue), 100);
    }
  };

  const handleBlurSave = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    saveField(name, value);
  };

  const revertField = (field: string) => {
    // Mandar '__inherit__' para que el backend ponga NULL
    setFormData((prev: any) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
    saveField(field, '__inherit__');
  };

  const saveField = async (fieldName: string, value: any) => {
    // Skip if no real change
    if (value !== '__inherit__' && originalData[fieldName] === value) return;
    if (value === '__inherit__' && originalData[fieldName] === undefined) return;

    setSaveStatus('saving');
    try {
      const body: any = {};
      body[fieldName] = value;

      const res = await fetch(`/api/user/plantas/${plantaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail! },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        setSaveStatus('saved');
        setOriginalData((prev: any) => {
          const next = { ...prev };
          if (value === '__inherit__') delete next[fieldName];
          else next[fieldName] = value;
          return next;
        });
        
        // Recargar para tener el COALESCE actualizado y los flags
        loadPlanta();
        
        setTimeout(() => setSaveStatus('idle'), 2000);
      } else {
        setSaveStatus('idle');
      }
    } catch (e) {
      console.error('Error saving field:', e);
      setSaveStatus('idle');
    }
  };

  // Pautas editing
  const togglePautaActiva = async (p: any) => {
    const newVal = p.activosino === 1 ? 0 : 1;
    await updatePauta(p.xlaborespautaidlabores, p.laborespautafase, p.frecuenciadias, p.notasia, newVal);
  };

  const updatePauta = async (laborId: number, fase: string, frecuencia: number | null, notas: string, activo: number) => {
    try {
      setSaveStatus('saving');
      const res = await fetch(`/api/user/plantas/${plantaId}/pautas`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail! },
        body: JSON.stringify({
          xlaborespautaidlabores: laborId,
          laborespautafase: fase,
          laborespautafrecuenciadias: frecuencia,
          laborespautanotasia: notas,
          laborespautaactivosino: activo
        })
      });
      if (res.ok) {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
        loadPautas();
      } else {
        setSaveStatus('idle');
      }
    } catch(e) {
      console.error(e);
      setSaveStatus('idle');
    }
  };

  const resetPauta = async (p: any) => {
    try {
      setSaveStatus('saving');
      const res = await fetch(`/api/user/plantas/${plantaId}/pautas/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail! },
        body: JSON.stringify({
          xlaborespautaidlabores: p.xlaborespautaidlabores,
          laborespautafase: p.laborespautafase
        })
      });
      if (res.ok) {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
        loadPautas();
      } else {
        setSaveStatus('idle');
      }
    } catch(e) {
      console.error(e);
      setSaveStatus('idle');
    }
  };

  const FieldCompare = ({ label, field, type = 'text', options = null }: { label: string, field: string, type?: string, options?: any[] | null }) => {
    if (!planta) return null;
    
    // Check if it's personalized
    const fieldWithoutPrefix = field.replace('variedades', '');
    const isOverridden = planta[`_p_${fieldWithoutPrefix}`] === 1 || (formData[field] !== undefined && formData[field] !== null);
    
    // Inherited value comes from planta COALESCE properties
    const inheritedValue = planta[fieldWithoutPrefix] || '';
    
    // Current value is formData if overridden, else empty string so placeholder shows inherited
    const currentValue = formData[field] !== undefined ? formData[field] : '';

    return (
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '220px 1fr 50px 1fr', 
        borderBottom: '1px solid #e2e8f0',
        alignItems: 'stretch',
        minHeight: '60px'
      }}>
        {/* Columna 1: Etiqueta */}
        <div style={{ padding: '16px', background: '#f8fafc', borderRight: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', fontWeight: '600', color: '#475569', fontSize: '0.85rem' }}>
          {label}
        </div>

        {/* Columna 2: Valor Estándar (Heredado) */}
        <div style={{ padding: '12px 16px', borderRight: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', background: '#ffffff', opacity: 0.8 }}>
          {options ? (
            <span style={{ color: '#64748b', fontSize: '0.9rem' }}>{options.find(o => o.value == inheritedValue)?.label || inheritedValue || '--'}</span>
          ) : (
            <span style={{ color: '#64748b', fontSize: '0.9rem' }}>{inheritedValue || '--'}</span>
          )}
        </div>

        {/* Columna 3: Estado / Acción */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid #e2e8f0', background: isOverridden ? '#f5f3ff' : '#f0fdf4', transition: 'all 0.3s ease' }}>
          {isOverridden ? (
            <button 
              type="button" 
              onClick={() => revertField(field)}
              title="Restaurar valor heredado"
              style={{ background: '#7c3aed', color: 'white', border: 'none', borderRadius: '50%', width: '26px', height: '26px', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(124, 58, 237, 0.3)', transition: 'transform 0.2s' }}
              onMouseOver={e => e.currentTarget.style.transform = 'rotate(-90deg)'}
              onMouseOut={e => e.currentTarget.style.transform = 'rotate(0deg)'}
            >
              ↺
            </button>
          ) : (
            <span style={{ color: '#22c55e', fontSize: '1.1rem', filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.1))' }} title="Heredando valor">
              {planta.es_generica ? '🌱' : '🏷️'}
            </span>
          )}
        </div>

        {/* Columna 4: Valor Variedad (Editable) */}
        <div style={{ padding: '8px 16px', background: isOverridden ? '#f5f3ff' : 'white', display: 'flex', flexDirection: 'column', justifyContent: 'center', transition: 'all 0.2s ease' }}>
          {options ? (
            <select 
              name={field}
              value={currentValue} 
              onChange={handleChange} 
              onBlur={handleBlurSave}
              style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', fontSize: '0.9rem', color: isOverridden ? '#7c3aed' : '#0f172a', fontWeight: isOverridden ? 'bold' : 'normal', fontStyle: !isOverridden ? 'italic' : 'normal' }}
            >
              <option value="" style={{ fontStyle: 'italic' }}>{options.find(o => o.value == inheritedValue)?.label || inheritedValue || '--'}</option>
              {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          ) : type === 'textarea' ? (
            <textarea 
              name={field}
              value={currentValue} 
              onChange={handleChange} 
              onBlur={handleBlurSave}
              placeholder={String(inheritedValue || '--')}
              rows={3}
              style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', fontSize: '0.9rem', color: isOverridden ? '#7c3aed' : '#0f172a', fontWeight: isOverridden ? 'bold' : 'normal', resize: 'vertical', fontFamily: 'inherit' }}
            />
          ) : type === 'number' ? (
            <input 
              type="number" 
              name={field}
              value={currentValue} 
              onChange={handleChange} 
              onBlur={handleBlurSave}
              placeholder={String(inheritedValue || '--')}
              style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', fontSize: '0.9rem', color: isOverridden ? '#7c3aed' : '#0f172a', fontWeight: isOverridden ? 'bold' : 'normal' }}
            />
          ) : (
            <input 
              type="text" 
              name={field}
              value={currentValue} 
              onChange={handleChange} 
              onBlur={handleBlurSave}
              placeholder={String(inheritedValue || '--')}
              style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', fontSize: '0.9rem', color: isOverridden ? '#7c3aed' : '#0f172a', fontWeight: isOverridden ? 'bold' : 'normal' }}
            />
          )}
        </div>
      </div>
    );
  };

  if (loading || !planta) return <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Cargando datos de la hortaliza...</div>;

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: '16px', padding: '0 4px', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <button type="button" onClick={() => router.push('/dashboard/mis-plantas')} style={{ background: 'white', border: '1px solid #cbd5e1', color: '#475569', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          ← Volver a Mis Hortalizas
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: saveStatus === 'idle' ? '0' : '6px 12px', background: saveStatus === 'idle' ? 'transparent' : '#f1f5f9', borderRadius: '20px', border: saveStatus === 'idle' ? 'none' : '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: saveStatus === 'saved' ? '#10b981' : saveStatus === 'saving' ? '#3b82f6' : 'transparent' }}>
              {saveStatus === 'saving' ? '⏳ Guardando cambios...' : saveStatus === 'saved' ? '✓ Guardado' : ''}
            </span>
          </div>
          <button 
            onClick={() => setShowCultivoModal(true)}
            style={{
              background: '#10b981', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px',
              fontWeight: 'bold', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
              boxShadow: '0 2px 4px rgba(16,185,129,0.2)'
            }}
          >
            🌱 Iniciar Cultivo
          </button>
        </div>
      </div>

      <div style={{ background: 'white', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', border: '1px solid #e2e8f0', position: 'relative' }}>
        
        {/* GREEN TEXT HEADER */}
        <div style={{ 
          padding: '24px 30px', 
          background: '#10b981', 
          borderRadius: '12px', 
          marginBottom: '20px',
          color: 'white',
          boxShadow: '0 4px 6px rgba(16,185,129,0.2)'
        }}>
          <h1 style={{ margin: 0, fontSize: '2.4rem', fontWeight: '800' }}>
            {planta._p_nombre 
              ? planta.nombre 
              : `${planta.especiesnombre} ${!planta.es_generica && planta.nombre_gold ? planta.nombre_gold : ''}`}
          </h1>
          <p style={{ margin: '4px 0 0', fontWeight: '500', fontStyle: 'italic', fontSize: '1.2rem', opacity: 0.9 }}>
            {planta._p_nombre 
              ? `${planta.especiesnombre} ${!planta.es_generica && planta.nombre_gold ? `· ${planta.nombre_gold}` : ''}`
              : planta.especiesnombre}
          </p>
        </div>

        {/* HERO GALLERY */}
        {photos.length > 0 && (
          <div style={{
            marginBottom: '30px',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            background: 'linear-gradient(135deg, #f8fafc 0%, #fef3c7 100%)',
            overflow: 'hidden'
          }}>
            <div style={{ display: 'flex', gap: 0, height: '220px' }}>
              {/* Hero photo */}
              {(() => {
                const sortedPhotos = [...photos].sort((a, b) => {
                  if (a.origen === 'usuario' && b.origen !== 'usuario') return -1;
                  if (a.origen !== 'usuario' && b.origen === 'usuario') return 1;
                  return (b.esPrincipal || 0) - (a.esPrincipal || 0);
                });
                const activePhotoId = primaryPhotoId || sortedPhotos[0]?.id;
                const activePhoto = sortedPhotos.find(p => p.id === activePhotoId) || sortedPhotos[0];
                let meta: any = {};
                try { meta = JSON.parse(activePhoto.resumen || '{}'); } catch(e){}
                
                return (
                  <>
                    <div 
                      style={{ 
                        position: 'relative', flexShrink: 0, width: '165px', minHeight: '220px', overflow: 'hidden',
                        border: dragOverHero ? '3px dashed #10b981' : 'none',
                        transition: 'all 0.2s ease',
                        transform: dragOverHero ? 'scale(1.02)' : 'none'
                      }}
                      onDragOver={(e) => { e.preventDefault(); setDragOverHero(true); }}
                      onDragLeave={() => setDragOverHero(false)}
                      onDrop={async (e) => {
                        e.preventDefault();
                        setDragOverHero(false);
                        if (draggingCarouselId) {
                          try {
                            await fetch(`/api/user/plantas/${plantaId}/photos`, {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail! },
                              body: JSON.stringify({ action: 'setPrimary', photoId: draggingCarouselId })
                            });
                            setPrimaryPhotoId(draggingCarouselId);
                            setDraggingCarouselId(null);
                            setMediaRefreshKey(k => k + 1);
                            loadPhotos();
                          } catch (err) { console.error('Error setting primary', err); }
                        }
                      }}
                    >
                      <img 
                        src={getMediaUrl(activePhoto.ruta)}
                        alt={planta.nombre}
                        style={{ 
                          width: activePhoto.origen === 'usuario' ? '105%' : '100%', 
                          height: activePhoto.origen === 'usuario' ? '105%' : '100%', 
                          objectFit: 'cover',
                          objectPosition: `${meta.profile_object_x ?? 50}% ${meta.profile_object_y ?? 50}%`,
                          transform: `scale(${(meta.profile_object_zoom ?? 100) / 100})`,
                          ...(activePhoto.origen === 'usuario' ? { marginBottom: '-5%', marginRight: '-5%' } : {})
                        }}
                        crossOrigin="anonymous" 
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px', justifyContent: 'center' }}>
                      {(() => {
                        const hasUserPhotos = photos.some(p => p.origen === 'usuario');
                        const carouselPhotos = hasUserPhotos 
                          ? sortedPhotos.filter(p => p.origen === 'usuario' && p.id !== activePhoto.id)
                          : sortedPhotos.filter(p => p.id !== activePhoto.id);
                          
                        return carouselPhotos.slice(0, 3).map((p) => {
                          let tMeta: any = {};
                          try { tMeta = JSON.parse(p.resumen || '{}'); } catch (e) { }
                          return (
                          <div 
                            key={p.id} 
                            onClick={() => {
                              setPrimaryPhotoId(p.id);
                              setMediaRefreshKey(k => k + 1);
                              fetch(`/api/user/plantas/${plantaId}/photos`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail! },
                                body: JSON.stringify({ action: 'setPrimary', photoId: p.id })
                              }).then(loadPhotos);
                            }}
                            draggable={p.origen === 'usuario'}
                            onDragStart={(e) => {
                              setDraggingCarouselId(p.id);
                              e.dataTransfer.effectAllowed = 'move';
                            }}
                            onDragEnd={() => setDraggingCarouselId(null)}
                            style={{ 
                              width: '50px', height: '64px', borderRadius: '8px', overflow: 'hidden', cursor: 'pointer',
                              border: '2px solid rgba(0,0,0,0.1)', transition: 'all 0.2s ease', position: 'relative',
                              opacity: draggingCarouselId === p.id ? 0.4 : 1
                            }}
                          >
                            <img 
                              src={getMediaUrl(p.ruta)}
                              alt=""
                              style={{ 
                                width: '100%', height: '100%', objectFit: 'cover',
                                objectPosition: `${tMeta.profile_object_x ?? 50}% ${tMeta.profile_object_y ?? 50}%`,
                                transform: `scale(${(tMeta.profile_object_zoom ?? 100) / 100})` 
                              }} 
                              crossOrigin="anonymous" 
                            />
                            {p.origen !== 'usuario' && (
                              <div style={{ position: 'absolute', bottom: 0, right: 0, fontSize: '10px', background: 'rgba(0,0,0,0.6)', color: 'white', padding: '1px 3px', borderRadius: '4px 0 0 0' }}>
                                {p.origen === 'gold' ? '🏷️' : '🌱'}
                              </div>
                            )}
                          </div>
                        );
                      });
                    })()}
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {/* ── Desplegable Ficha de Especie ── */}
        <div style={{ marginTop: '30px', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
          <button 
            type="button" 
            onClick={() => setFichaOpen(!fichaOpen)}
            style={{ 
              width: '100%', 
              background: '#f8fafc', 
              border: 'none', 
              padding: '16px 24px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '1.1rem',
              color: '#334155',
              borderBottom: fichaOpen ? '1px solid #e2e8f0' : 'none',
              transition: 'background 0.2s'
            }}
            onMouseOver={e => e.currentTarget.style.background = '#f1f5f9'}
            onMouseOut={e => e.currentTarget.style.background = '#f8fafc'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.3rem' }}>📑</span> Ficha de Especie
            </div>
            <span style={{ transform: fichaOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }}>
              ▼
            </span>
          </button>

          {fichaOpen && (
            <div style={{ padding: '24px' }}>
              <div className="form-tabs">
                <button type="button" className={activeTab === 'datos' ? 'active' : ''} onClick={() => setActiveTab('datos')}>
                  📋 Datos Agronómicos
                </button>
                <button type="button" className={activeTab === 'labores' ? 'active' : ''} onClick={() => setActiveTab('labores')}>
                  🔧 Calendario de Labores
                </button>
                <button type="button" className={activeTab === 'fotos' ? 'active' : ''} onClick={() => setActiveTab('fotos')}>
                  📸 Fotos
                </button>
              </div>

              <div className="form-tab-content" style={{ marginTop: '24px' }}>
                {activeTab === 'datos' && (
                  <div>
                    <div className="form-tabs" style={{ borderBottom: '1px solid #e2e8f0', marginBottom: '16px', paddingBottom: '0' }}>
                      <button type="button" className={activeSubTab === 'taxonomia' ? 'active' : ''} onClick={() => setActiveSubTab('taxonomia')} style={{ background: 'none', border: 'none', padding: '8px 16px', borderBottom: activeSubTab === 'taxonomia' ? '2px solid #10b981' : '2px solid transparent', color: activeSubTab === 'taxonomia' ? '#10b981' : '#64748b', fontWeight: 'bold' }}>Taxonomía</button>
                      <button type="button" className={activeSubTab === 'fisiologia' ? 'active' : ''} onClick={() => setActiveSubTab('fisiologia')} style={{ background: 'none', border: 'none', padding: '8px 16px', borderBottom: activeSubTab === 'fisiologia' ? '2px solid #10b981' : '2px solid transparent', color: activeSubTab === 'fisiologia' ? '#10b981' : '#64748b', fontWeight: 'bold' }}>Fisiología</button>
                      <button type="button" className={activeSubTab === 'calendarios' ? 'active' : ''} onClick={() => setActiveSubTab('calendarios')} style={{ background: 'none', border: 'none', padding: '8px 16px', borderBottom: activeSubTab === 'calendarios' ? '2px solid #10b981' : '2px solid transparent', color: activeSubTab === 'calendarios' ? '#10b981' : '#64748b', fontWeight: 'bold' }}>Calendarios</button>
                      <button type="button" className={activeSubTab === 'biodinamica' ? 'active' : ''} onClick={() => setActiveSubTab('biodinamica')} style={{ background: 'none', border: 'none', padding: '8px 16px', borderBottom: activeSubTab === 'biodinamica' ? '2px solid #10b981' : '2px solid transparent', color: activeSubTab === 'biodinamica' ? '#10b981' : '#64748b', fontWeight: 'bold' }}>🌙 Luna y Biodinámica</button>
                    </div>

                    <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>💡</span>
                      <span>Los valores se heredan automáticamente de <b>{planta.especiesnombre}</b>. Si modificas un campo, quedará marcado con ✏️ y sobrescribirá el valor original.</span>
                    </div>

                    {activeSubTab === 'taxonomia' && (
                      <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr 50px 1fr', background: '#f1f5f9', borderBottom: '2px solid #e2e8f0', fontWeight: '800', fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>
                          <div style={{ padding: '12px 16px', borderRight: '1px solid #e2e8f0' }}>Propiedad</div>
                          <div style={{ padding: '12px 16px', borderRight: '1px solid #e2e8f0' }}>Heredado</div>
                          <div style={{ padding: '12px 16px', borderRight: '1px solid #e2e8f0', textAlign: 'center' }}>Sync</div>
                          <div style={{ padding: '12px 16px' }}>Personalizado</div>
                        </div>
                        <FieldCompare label="Nombre Personalizado" field="variedadesnombre" type="text" />
                        <FieldCompare label="Color Fenotípico" field="variedadescolor" type="text" />
                        <FieldCompare label="Tamaño General" field="variedadestamano" options={[{ value: 'pequeno', label: 'Pequeño' }, { value: 'mediano', label: 'Mediano' }, { value: 'grande', label: 'Grande' }]} />
                        <FieldCompare label="Dificultad" field="variedadesdificultad" options={[{ value: 'baja', label: 'Baja' }, { value: 'media', label: 'Media' }, { value: 'alta', label: 'Alta' }]} />
                        <FieldCompare label="Volumen Maceta (L)" field="variedadesvolumenmaceta" type="number" />
                        <FieldCompare label="Descripción y Notas" field="variedadesdescripcion" type="textarea" />
                      </div>
                    )}

                    {activeSubTab === 'fisiologia' && (
                      <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr 50px 1fr', background: '#f1f5f9', borderBottom: '2px solid #e2e8f0', fontWeight: '800', fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>
                          <div style={{ padding: '12px 16px', borderRight: '1px solid #e2e8f0' }}>Propiedad</div>
                          <div style={{ padding: '12px 16px', borderRight: '1px solid #e2e8f0' }}>Heredado</div>
                          <div style={{ padding: '12px 16px', borderRight: '1px solid #e2e8f0', textAlign: 'center' }}>Sync</div>
                          <div style={{ padding: '12px 16px' }}>Personalizado</div>
                        </div>
                        <FieldCompare label="Días Germinación" field="variedadesdiasgerminacion" type="number" />
                        <FieldCompare label="Días hasta Trasplante" field="variedadesdiashastatrasplante" type="number" />
                        <FieldCompare label="Días hasta Fructificación" field="variedadesdiashastafructificacion" type="number" />
                        <FieldCompare label="Días hasta Recolección" field="variedadesdiashastarecoleccion" type="number" />
                        <FieldCompare label="Temp. Mínima (ºC)" field="variedadestemperaturaminima" type="number" />
                        <FieldCompare label="Temp. Óptima (ºC)" field="variedadestemperaturaoptima" type="number" />
                        <FieldCompare label="Temp. Máxima (ºC)" field="variedadestemperaturamaxima" type="number" />
                      </div>
                    )}

                    {activeSubTab === 'calendarios' && (
                      <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr 50px 1fr', background: '#f1f5f9', borderBottom: '2px solid #e2e8f0', fontWeight: '800', fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>
                          <div style={{ padding: '12px 16px', borderRight: '1px solid #e2e8f0' }}>Propiedad</div>
                          <div style={{ padding: '12px 16px', borderRight: '1px solid #e2e8f0' }}>Heredado</div>
                          <div style={{ padding: '12px 16px', borderRight: '1px solid #e2e8f0', textAlign: 'center' }}>Sync</div>
                          <div style={{ padding: '12px 16px' }}>Personalizado</div>
                        </div>
                        <FieldCompare label="Siembra Semillero Desde" field="variedadessemillerodesde" type="number" />
                        <FieldCompare label="Siembra Semillero Hasta" field="variedadessemillerohasta" type="number" />
                        <FieldCompare label="Siembra Directa Desde" field="variedadessiembradirectadesde" type="number" />
                        <FieldCompare label="Siembra Directa Hasta" field="variedadessiembradirectahasta" type="number" />
                        <FieldCompare label="Trasplante Desde" field="variedadestrasplantedesde" type="number" />
                        <FieldCompare label="Trasplante Hasta" field="variedadestrasplantehasta" type="number" />
                        <FieldCompare label="Recolección Desde" field="variedadesrecolecciondesde" type="number" />
                        <FieldCompare label="Recolección Hasta" field="variedadesrecoleccionhasta" type="number" />
                      </div>
                    )}

                    {activeSubTab === 'biodinamica' && (
                      <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr 50px 1fr', background: '#f1f5f9', borderBottom: '2px solid #e2e8f0', fontWeight: '800', fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>
                          <div style={{ padding: '12px 16px', borderRight: '1px solid #e2e8f0' }}>Propiedad</div>
                          <div style={{ padding: '12px 16px', borderRight: '1px solid #e2e8f0' }}>Heredado</div>
                          <div style={{ padding: '12px 16px', borderRight: '1px solid #e2e8f0', textAlign: 'center' }}>Sync</div>
                          <div style={{ padding: '12px 16px' }}>Personalizado</div>
                        </div>
                        <FieldCompare label="Fase Siembra (Lunar)" field="variedadeslunarfasesiembra" options={[{value:'Creciente',label:'Creciente'},{value:'Menguante',label:'Menguante'},{value:'Nueva',label:'Nueva'},{value:'Llena',label:'Llena'}]} />
                        <FieldCompare label="Fase Trasplante (Lunar)" field="variedadeslunarfasetrasplante" options={[{value:'Creciente',label:'Creciente'},{value:'Menguante',label:'Menguante'},{value:'Nueva',label:'Nueva'},{value:'Llena',label:'Llena'}]} />
                        <FieldCompare label="Notas Lunares" field="variedadeslunarobservaciones" type="textarea" />
                        
                        <FieldCompare label="Categoría Biodinámica" field="variedadesbiodinamicacategoria" options={[{value:'fruto',label:'Fruto'},{value:'raiz',label:'Raíz'},{value:'hoja',label:'Hoja'},{value:'flor',label:'Flor'}]} />
                        <FieldCompare label="Fase Siembra (Biodinámica)" field="variedadesbiodinamicafasesiembra" options={[{value:'Ascendente',label:'Ascendente'},{value:'Descendente',label:'Descendente'}]} />
                        <FieldCompare label="Fase Trasplante (Biodinámica)" field="variedadesbiodinamicafasetrasplante" options={[{value:'Ascendente',label:'Ascendente'},{value:'Descendente',label:'Descendente'}]} />
                        <FieldCompare label="Notas Biodinámicas" field="variedadesbiodinamicanotas" type="textarea" />
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'labores' && (
                  <div>
                    <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>💡</span>
                      <span>Estas pautas de labores se aplicarán automáticamente al iniciar una siembra de esta hortaliza. Puedes personalizar la frecuencia o desactivar labores que no necesites.</span>
                    </div>
                    
                    {loadingPautas ? (
                      <p style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>Cargando calendario de labores...</p>
                    ) : pautas.length === 0 ? (
                      <p style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>No hay labores definidas para esta especie.</p>
                    ) : (
                      <div style={{ display: 'grid', gap: '16px' }}>
                        {pautas.map((p, i) => (
                          <div key={i} style={{ 
                            background: p.activosino === 0 ? '#f8fafc' : (p.personalizada ? '#f5f3ff' : 'white'),
                            border: `1px solid ${p.activosino === 0 ? '#e2e8f0' : (p.personalizada ? '#ddd6fe' : '#e2e8f0')}`,
                            borderRadius: '12px', padding: '16px',
                            opacity: p.activosino === 0 ? 0.6 : 1,
                            transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '16px'
                          }}>
                            <div style={{ fontSize: '2rem', filter: p.activosino === 0 ? 'grayscale(1)' : 'none' }}>
                              {p.laboresicono || '🔧'}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.1rem', textDecoration: p.activosino === 0 ? 'line-through' : 'none' }}>
                                  {p.laboresnombre}
                                </h3>
                                <span style={{ fontSize: '0.7rem', background: '#e2e8f0', padding: '2px 8px', borderRadius: '12px', color: '#475569', textTransform: 'uppercase', fontWeight: 700 }}>
                                  {p.laborespautafase.replace('_', ' ')}
                                </span>
                                {p.personalizada === 1 && (
                                  <span style={{ fontSize: '0.7rem', background: '#ede9fe', padding: '2px 8px', borderRadius: '12px', color: '#6d28d9', fontWeight: 700 }}>
                                    ✏️ Personalizada
                                  </span>
                                )}
                              </div>
                              <div style={{ marginTop: '8px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#475569' }}>
                                  Frecuencia (días):
                                  <input 
                                    type="number" 
                                    value={p.frecuenciadias || ''} 
                                    onChange={(e) => {
                                      const newPautas = [...pautas];
                                      newPautas[i].frecuenciadias = e.target.value ? parseInt(e.target.value) : null;
                                      setPautas(newPautas);
                                    }}
                                    onBlur={(e) => updatePauta(p.xlaborespautaidlabores, p.laborespautafase, p.frecuenciadias, p.notasia, p.activosino)}
                                    placeholder={p.frecuencia_original || '0'}
                                    style={{ width: '60px', padding: '4px 8px', border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none' }}
                                    disabled={p.activosino === 0}
                                  />
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#475569', flex: 1 }}>
                                  Notas IA:
                                  <input 
                                    type="text" 
                                    value={p.notasia || ''} 
                                    onChange={(e) => {
                                      const newPautas = [...pautas];
                                      newPautas[i].notasia = e.target.value;
                                      setPautas(newPautas);
                                    }}
                                    onBlur={(e) => updatePauta(p.xlaborespautaidlabores, p.laborespautafase, p.frecuenciadias, p.notasia, p.activosino)}
                                    placeholder={p.notas_original || 'Añade notas para la IA...'}
                                    style={{ width: '100%', padding: '4px 8px', border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none' }}
                                    disabled={p.activosino === 0}
                                  />
                                </label>
                              </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                              <button 
                                onClick={() => togglePautaActiva(p)}
                                style={{
                                  background: p.activosino === 1 ? '#fee2e2' : '#dcfce7',
                                  color: p.activosino === 1 ? '#ef4444' : '#166534',
                                  border: 'none', padding: '6px 12px', borderRadius: '8px',
                                  cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', width: '90px'
                                }}
                              >
                                {p.activosino === 1 ? 'Desactivar' : 'Activar'}
                              </button>
                              {p.personalizada === 1 && (
                                <button 
                                  onClick={() => resetPauta(p)}
                                  style={{
                                    background: 'transparent', color: '#6d28d9', border: '1px solid #ddd6fe',
                                    padding: '4px 8px', borderRadius: '8px', cursor: 'pointer', 
                                    fontWeight: 600, fontSize: '0.75rem', width: '90px'
                                  }}
                                  title="Restaurar a valor heredado"
                                >
                                  ↺ Restaurar
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'fotos' && (
                  <UserPlantaMediaManager 
                    key={`media-${mediaRefreshKey}`}
                    plantaId={plantaId} 
                    userEmail={userEmail!} 
                    onMediaChange={loadPhotos} 
                  />
                )}
              </div>
            </div>
          )}
        </div>

      {/* ═══════════════════════════════════════ */}
      {/* SECCIÓN: MIS CULTIVOS ACTIVOS           */}
      {/* ═══════════════════════════════════════ */}
      <div style={{ marginTop: '20px', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
        <button 
          onClick={() => setCultivosOpen(!cultivosOpen)}
          style={{ 
            width: '100%', 
            background: '#f8fafc', 
            border: 'none', 
            padding: '16px 24px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '1.1rem',
            color: '#334155',
            borderBottom: cultivosOpen ? '1px solid #e2e8f0' : 'none',
            transition: 'background 0.2s'
          }}
          onMouseOver={e => e.currentTarget.style.background = '#f1f5f9'}
          onMouseOut={e => e.currentTarget.style.background = '#f8fafc'}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.3rem' }}>🌱</span> Cultivos en Curso
          </div>
          <span style={{ transform: cultivosOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }}>
            ▼
          </span>
        </button>

        {cultivosOpen && (
          <div style={{ background: 'white', padding: '24px', borderTop: '1px solid #e2e8f0' }}>
            {loadingCultivos ? (
              <p style={{ color: '#64748b' }}>Cargando cultivos...</p>
            ) : cultivos.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', background: '#f8fafc', borderRadius: '12px', border: '2px dashed #cbd5e1' }}>
                <span style={{ fontSize: '3rem', marginBottom: '10px', display: 'block' }}>🚜</span>
                <h3 style={{ color: '#334155', margin: '0 0 8px' }}>No hay cultivos activos</h3>
                <p style={{ color: '#64748b', margin: '0 0 16px' }}>Todavía no has plantado esta variedad en tu huerto.</p>
                <button 
                  onClick={() => setShowCultivoModal(true)}
                  style={{
                    background: '#10b981', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px',
                    fontWeight: 'bold', fontSize: '0.9rem', cursor: 'pointer'
                  }}
                >
                  🌱 Iniciar Primer Cultivo
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {cultivos.map((c, index) => (
                  <div key={c.idcultivos} style={{
                    border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: '#f8fafc', transition: 'all 0.2s'
                  }}>
                    <div>
                      <h4 style={{ margin: '0 0 4px', fontSize: '1.1rem', color: '#0f172a' }}>
                        Cultivo {c.cultivosnumerocoleccion ? `Nº ${c.cultivosnumerocoleccion}` : `Nº ${index + 1}`} de {c.especiesnombre} {c.variedad_nombre && c.variedad_nombre !== c.especiesnombre ? ` - ${c.variedad_nombre}` : ''}
                      </h4>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
                        <strong>Origen:</strong> {c.cultivosorigen.replace('_', ' ')} • <strong>Método:</strong> {c.cultivosmetodo.replace('_', ' ')} • <strong>Cantidad:</strong> {c.cultivoscantidad}
                      </p>
                      <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                        Iniciado el: {new Date(c.cultivosfechainicio).toLocaleDateString()}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                      <span style={{ 
                        display: 'inline-block', padding: '6px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold',
                        background: c.cultivosestado === 'finalizado' ? '#f1f5f9' : c.cultivosestado === 'perdido' ? '#fee2e2' : c.cultivosestado === 'en_espera' ? '#fef08a' : '#dcfce7',
                        color: c.cultivosestado === 'finalizado' ? '#64748b' : c.cultivosestado === 'perdido' ? '#b91c1c' : c.cultivosestado === 'en_espera' ? '#854d0e' : '#15803d'
                      }}>
                        {c.cultivosestado.replace('_', ' ').toUpperCase()}
                      </span>
                      
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button 
                          onClick={() => handleEditCultivo(c)}
                          style={{
                            background: 'white', color: '#64748b', border: '1px solid #cbd5e1', padding: '6px', borderRadius: '6px',
                            cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}
                          title="Editar Cultivo"
                          onMouseOver={e => { e.currentTarget.style.color = '#3b82f6'; e.currentTarget.style.borderColor = '#3b82f6'; }}
                          onMouseOut={e => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
                        >
                          ✏️
                        </button>
                        <button 
                          onClick={() => handleDeleteCultivo(c.idcultivos)}
                          style={{
                            background: 'white', color: '#64748b', border: '1px solid #cbd5e1', padding: '6px', borderRadius: '6px',
                            cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}
                          title="Eliminar Cultivo"
                          onMouseOver={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.borderColor = '#ef4444'; }}
                          onMouseOut={e => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      {/* END OF BIG WHITE BOX */}
      </div>

      {showCultivoModal && (
        <IniciarCultivoModal 
          isOpen={showCultivoModal}
          onClose={() => { setShowCultivoModal(false); loadCultivos(); }}
          plantaId={Number(plantaId)}
          plantaNombre={planta.nombre || planta.especiesnombre || 'Planta'}
          userEmail={userEmail!}
          calendarioSolar={{
            semillerodesde: planta.semillerodesde,
            semillerohasta: planta.semillerohasta,
            siembradirectadesde: planta.siembradirectadesde,
            siembradirectahasta: planta.siembradirectahasta,
            trasplantedesde: planta.trasplantedesde,
            trasplantehasta: planta.trasplantehasta
          }}
          viabilidadSemilla={planta.viabilidadsemilla}
        />
      )}

    </div>
  );
}
