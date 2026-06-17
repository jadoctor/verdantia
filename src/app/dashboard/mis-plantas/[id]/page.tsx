'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { auth } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { getMediaUrl } from '@/lib/media-url';
import UserPlantaMediaManager from '@/components/user/UserPlantaMediaManager';
import IniciarCultivoModal from '@/components/user/IniciarCultivoModal';
import { SeedWizardModal } from '@/components/SeedWizardModal';
import { SpeciesIcon } from '@/components/ui/SpeciesIcon';
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
  const [activeTab, setActiveTab] = useState('taxonomia');
  const [fichaOpen, setFichaOpen] = useState(true);
  const [cultivosOpen, setCultivosOpen] = useState(true);
  const [showCultivoModal, setShowCultivoModal] = useState(false);
  
  const [planta, setPlanta] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [originalData, setOriginalData] = useState<any>({});
  const isDirty = Object.keys(formData).some(key => formData[key] !== originalData[key]);
  
  const [pautas, setPautas] = useState<any[]>([]);
  const [loadingPautas, setLoadingPautas] = useState(false);

  const [photos, setPhotos] = useState<any[]>([]);
  const [primaryPhotoId, setPrimaryPhotoId] = useState<string | null>(null);
  const [mediaRefreshKey, setMediaRefreshKey] = useState(0);
  const [suscripcion, setSuscripcion] = useState('Básica');

  const [cultivos, setCultivos] = useState<any[]>([]);
  const [loadingCultivos, setLoadingCultivos] = useState(false);

  const [semillas, setSemillas] = useState<any[]>([]);
  const [loadingSemillas, setLoadingSemillas] = useState(false);
  const [semillasOpen, setSemillasOpen] = useState(true);
  const [showSeedWizard, setShowSeedWizard] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user && user.email) {
        setUserEmail(user.email);
        fetch('/api/perfil', { headers: { 'x-user-email': user.email } })
          .then(res => res.json())
          .then(data => {
            if (data.profile?.suscripcion) {
              setSuscripcion(data.profile.suscripcion);
            }
          })
          .catch(err => console.error('Error fetching profile in mis-plantas:', err));
      } else {
        router.push('/login');
      }
    });
    return () => unsub();
  }, [router]);

  useEffect(() => {
    if (searchParams.get('startCultivo') === 'true') {
      setShowCultivoModal(true);
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
        if (p.tiposiembra && typeof p.tiposiembra === 'string' && p.tiposiembra.includes(',')) {
           p.tiposiembra = p.tiposiembra.split(',');
        }
        setPlanta(p);
        loadSemillas(p);
        
        const userOverrides: any = {};
        Object.keys(p).forEach(key => {
          if (key.startsWith('_p_') && p[key] === 1) {
            const fieldName = 'variedades' + key.replace('_p_', '');
            userOverrides[fieldName] = p[key.replace('_p_', '')];
          }
        });
        if (p.variedadesautosuficiencia) userOverrides.variedadesautosuficiencia = p.variedadesautosuficiencia;
        userOverrides.variedadesvisibilidadsino = p.variedadesvisibilidadsino !== undefined ? p.variedadesvisibilidadsino : 1;
        
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

  const loadSemillas = async (currentPlanta?: any) => {
    if (!userEmail) return;
    try {
      setLoadingSemillas(true);
      const res = await fetch('/api/user/semillas', { headers: { 'x-user-email': userEmail } });
      if (res.ok) {
        const data = await res.json();
        const targetPlanta = currentPlanta || planta;
        const filtered = (data.semillas || []).filter((s: any) => 
          s.xsemillasidvariedades === Number(plantaId) ||
          (targetPlanta && s.xsemillasidvariedades === targetPlanta.xvariedadesidvariedadorigen)
        );
        setSemillas(filtered);
      }
    } catch (e) {
      console.error('Error loading seeds:', e);
    } finally {
      setLoadingSemillas(false);
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
    setFormData((prev: any) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
    saveField(field, '__inherit__');
  };

  const saveField = async (fieldName: string, value: any) => {
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
    const fieldWithoutPrefix = field.replace('variedades', '');
    const isOverridden = planta[`_p_${fieldWithoutPrefix}`] === 1 || (formData[field] !== undefined && formData[field] !== null);
    const inheritedValue = planta[`h_${fieldWithoutPrefix}`] !== undefined ? planta[`h_${fieldWithoutPrefix}`] : (planta[fieldWithoutPrefix] || '');
    const currentValue = formData[field] !== undefined ? formData[field] : '';

    return (
      <div className="field-compare-grid">
        <div className="field-compare-label">
          {label}
        </div>
        <div className="field-compare-inherited">
          {options ? (
            <span>{options.find(o => o.value == inheritedValue)?.label || inheritedValue || '--'}</span>
          ) : (
            <span>{inheritedValue || '--'}</span>
          )}
        </div>
        <div className={`field-compare-sync ${isOverridden ? 'overridden' : 'inherited'}`}>
          {isOverridden ? (
            <button 
              type="button" 
              onClick={() => revertField(field)}
              title="Restaurar valor heredado"
              className="sync-button"
            >
              ↺
            </button>
          ) : (
            <span title="Heredando valor">
              {planta.es_generica ? '🌱' : '🏷️'}
            </span>
          )}
        </div>
        <div className={`field-compare-editable ${isOverridden ? 'overridden' : ''}`}>
          {options ? (
            <select 
              name={field}
              value={currentValue} 
              onChange={handleChange} 
              onBlur={handleBlurSave}
              className="field-compare-select"
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
              className="field-compare-textarea"
            />
          ) : type === 'number' ? (
            <input 
              type="number" 
              name={field}
              value={currentValue} 
              onChange={handleChange} 
              onBlur={handleBlurSave}
              placeholder={String(inheritedValue || '--')}
              className="field-compare-input"
            />
          ) : (
            <input 
              type="text" 
              name={field}
              value={currentValue} 
              onChange={handleChange} 
              onBlur={handleBlurSave}
              placeholder={String(inheritedValue || '--')}
              className="field-compare-input"
            />
          )}
        </div>
      </div>
    );
  };

  if (loading || !planta) return <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Cargando datos de la hortaliza...</div>;

  return (
    <div style={{ width: '100%' }}>
      <div style={{ marginBottom: '16px', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            style={{
              background: 'white', border: '1px solid #cbd5e1', color: '#475569',
              padding: '6px 14px', borderRadius: '8px', cursor: 'pointer',
              fontWeight: 600, fontSize: '0.85rem', display: 'inline-flex',
              alignItems: 'center', gap: '6px', transition: 'all 0.2s'
            }}
            onMouseOver={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#94a3b8'; }}
            onMouseOut={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
          >
            🏠 Volver al Inicio
          </button>
          <button
            type="button"
            onClick={() => router.push('/dashboard/mis-plantas')}
            style={{
              background: 'white', border: '1px solid #cbd5e1', color: '#475569',
              padding: '6px 14px', borderRadius: '8px', cursor: 'pointer',
              fontWeight: 600, fontSize: '0.85rem', display: 'inline-flex',
              alignItems: 'center', gap: '6px', transition: 'all 0.2s'
            }}
            onMouseOver={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#94a3b8'; }}
            onMouseOut={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
          >
            🌱 Volver a Mis Hortalizas
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            onClick={() => setShowCultivoModal(true)}
            style={{
              background: '#10b981', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px',
              fontWeight: 'bold', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
              boxShadow: '0 2px 4px rgba(16,185,129,0.2)', transition: 'all 0.2s'
            }}
            onMouseOver={e => { e.currentTarget.style.background = '#059669'; }}
            onMouseOut={e => { e.currentTarget.style.background = '#10b981'; }}
          >
            🌱 Iniciar Cultivo
          </button>
        </div>
      </div>

      <div style={{
        background: 'linear-gradient(135deg, #065f46, #10b981)',
        borderRadius: '16px', padding: '24px 28px', marginBottom: '24px',
        color: 'white', boxShadow: '0 4px 15px rgba(6, 95, 70, 0.15)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              {/* Nombre: si el usuario ha puesto uno (y no es vacío), mostrarlo; si no, componer desde especie + variedad gold */}
              {(planta._p_nombre && planta.nombre && planta.nombre.trim() !== '')
                ? planta.nombre 
                : `${planta.especiesnombre}${!planta.es_generica && planta.nombre_gold ? ` ${planta.nombre_gold}` : ''}`}
              
              {isDirty && (
                <span style={{ background: '#fef08a', color: '#854d0e', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                  Cambios sin guardar
                </span>
              )}

              {saveStatus === 'saving' && (
                <span style={{ background: '#dbeafe', color: '#1e40af', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                  ⏳ Guardando...
                </span>
              )}
              {saveStatus === 'saved' && (
                <span style={{ background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                  ✓ Guardado
                </span>
              )}
            </h1>
            <p style={{ margin: '4px 0 0', fontWeight: '500', fontStyle: 'italic', fontSize: '1.1rem', opacity: 0.9 }}>
              {(planta._p_nombre && planta.nombre && planta.nombre.trim() !== '')
                ? `${planta.especiesnombre}${!planta.es_generica && planta.nombre_gold ? ` · ${planta.nombre_gold}` : ''}`
                : planta.especiesnombre}
            </p>
          </div>
        </div>
      </div>

      {/* ── Toggles Activo ── */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div 
          onClick={() => {
            const nextVal = formData.variedadesvisibilidadsino === 1 ? 0 : 1;
            setFormData({ ...formData, variedadesvisibilidadsino: nextVal });
            saveField('variedadesvisibilidadsino', nextVal);
          }}
          style={{ 
            padding: '12px 16px', 
            background: formData.variedadesvisibilidadsino === 1 ? '#f0fdf4' : '#f8fafc', 
            border: `1px solid ${formData.variedadesvisibilidadsino === 1 ? '#10b981' : '#cbd5e1'}`, 
            borderRadius: '8px', 
            color: formData.variedadesvisibilidadsino === 1 ? '#065f46' : '#64748b', 
            fontWeight: 600, 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px', 
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: formData.variedadesvisibilidadsino === 1 ? '0 2px 4px rgba(16,185,129,0.05)' : 'none',
            flex: '1 1 min-content'
          }}
        >
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '24px', height: '24px', borderRadius: '4px',
            background: formData.variedadesvisibilidadsino === 1 ? '#10b981' : '#cbd5e1',
            color: 'white'
          }}>
            {formData.variedadesvisibilidadsino === 1 ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            )}
          </div>
          <span>{formData.variedadesvisibilidadsino === 1 ? 'Hortaliza Activa (Visible en tu huerto)' : 'Hortaliza Inactiva (Archivada)'}</span>
        </div>
      </div>

      {Number(planta.origen_visibilidad ?? 1) === 0 && (
        <div style={{
          padding: '16px 20px',
          background: 'linear-gradient(135deg, #fef2f2, #fee2e2)',
          border: '1px solid #fca5a5',
          borderRadius: '12px',
          color: '#991b1b',
          fontSize: '0.9rem',
          fontWeight: 500,
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
        }}>
          <span style={{ fontSize: '1.4rem' }}>⚠️</span>
          <div>
            <strong>Variedad descatalogada:</strong> Esta variedad ha sido retirada del catálogo general por el administrador, pero puedes seguir disponiendo de ella y cultivándola sin ningún tipo de restricción.
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {photos.length > 0 && (
          <div style={{
            background: 'white',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
            overflow: 'hidden',
            padding: '24px'
          }}>
            <h3 style={{ margin: '0 0 16px', color: '#334155', fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📸</span> Galería de Portadas
            </h3>
            <div style={{
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
              overflow: 'hidden'
            }}>
              <div style={{ display: 'flex', gap: 0, height: '220px', alignItems: 'center' }}>
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
                          position: 'relative', flexShrink: 0, width: '165px', height: '220px', overflow: 'hidden',
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
          </div>
        )}

        <div style={{ border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden', background: 'white', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <button 
            type="button" 
            onClick={() => setFichaOpen(!fichaOpen)}
            style={{ 
              width: '100%', 
              background: '#f8fafc', 
              border: 'none', 
              padding: '20px 24px', 
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
              <span style={{ fontSize: '1.3rem' }}>📑</span> Ficha de Especie y Datos Agronómicos
              {Object.keys(originalData).length > 0 && (
                <span 
                  style={{ fontSize: '0.75rem', background: '#ede9fe', color: '#6d28d9', padding: '4px 10px', borderRadius: '12px', fontWeight: 700, marginLeft: '8px' }}
                  title={`${Object.keys(originalData).length} dato(s) agronómico(s) modificado(s) por ti frente a la ficha estándar.`}
                >
                  ✏️ {Object.keys(originalData).length} modificado{Object.keys(originalData).length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            <span style={{ transform: fichaOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }}>
              ▼
            </span>
          </button>

          {fichaOpen && (
            <div style={{ padding: '24px' }}>
              <div className="form-tabs">
                <button type="button" className={activeTab === 'taxonomia' ? 'active' : ''} onClick={() => setActiveTab('taxonomia')}>
                  🧬 Taxonomía
                </button>
                <button type="button" className={activeTab === 'cultivo' ? 'active' : ''} onClick={() => setActiveTab('cultivo')}>
                  🚜 Cultivo
                </button>
                <button type="button" className={activeTab === 'fisiologia' ? 'active' : ''} onClick={() => setActiveTab('fisiologia')}>
                  🌱 Fisiología
                </button>
                <button type="button" className={activeTab === 'calendarios' ? 'active' : ''} onClick={() => setActiveTab('calendarios')}>
                  📅 Calendarios
                </button>
                <button type="button" className={activeTab === 'biodinamica' ? 'active' : ''} onClick={() => setActiveTab('biodinamica')}>
                  🌙 Luna y Biodinámica
                </button>
                <button type="button" className={activeTab === 'labores' ? 'active' : ''} onClick={() => setActiveTab('labores')}>
                  🔧 Calendario de Labores
                </button>
                <button type="button" className={activeTab === 'fotos' ? 'active' : ''} onClick={() => setActiveTab('fotos')}>
                  📸 Fotos
                </button>
              </div>

              <div className="form-tab-content" style={{ marginTop: '24px' }}>
                {activeTab === 'taxonomia' && (
                  <div>
                    <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>💡</span>
                      <span>Los valores se heredan automáticamente de <b>{planta.nombre_gold || planta.especiesnombre}</b>. Si modificas un campo, quedará marcado con ✏️ y sobrescribirá el valor original.</span>
                    </div>
                    <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                      <div className="field-compare-header-grid">
                        <div style={{ padding: '12px 16px', borderRight: '1px solid #e2e8f0' }}>Propiedad</div>
                        <div style={{ padding: '12px 16px', borderRight: '1px solid #e2e8f0' }}>Heredado</div>
                        <div style={{ padding: '12px 16px', borderRight: '1px solid #e2e8f0', textAlign: 'center' }}>Sync</div>
                        <div style={{ padding: '12px 16px' }}>Personalizado</div>
                      </div>
                      <FieldCompare label="Nombre Personalizado" field="variedadesnombre" type="text" />
                      <FieldCompare label="Color Fenotípico" field="variedadescolor" type="text" />
                      <FieldCompare label="Tamaño General" field="variedadestamano" options={[{ value: 'pequeno', label: 'Pequeño' }, { value: 'mediano', label: 'Mediano' }, { value: 'grande', label: 'Grande' }]} />
                      <FieldCompare label="Descripción y Notas" field="variedadesdescripcion" type="textarea" />
                    </div>
                  </div>
                )}

                {activeTab === 'cultivo' && (
                  <div>
                    <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>💡</span>
                      <span>Los valores se heredan automáticamente de <b>{planta.nombre_gold || planta.especiesnombre}</b>. Si modificas un campo, quedará marcado con ✏️ y sobrescribirá el valor original.</span>
                    </div>
                    <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                      <div className="field-compare-header-grid">
                        <div style={{ padding: '12px 16px', borderRight: '1px solid #e2e8f0' }}>Propiedad</div>
                        <div style={{ padding: '12px 16px', borderRight: '1px solid #e2e8f0' }}>Heredado</div>
                        <div style={{ padding: '12px 16px', borderRight: '1px solid #e2e8f0', textAlign: 'center' }}>Sync</div>
                        <div style={{ padding: '12px 16px' }}>Personalizado</div>
                      </div>
                      <FieldCompare label="Dificultad" field="variedadesdificultad" options={[{ value: 'baja', label: 'Baja' }, { value: 'media', label: 'Media' }, { value: 'alta', label: 'Alta' }]} />
                      <FieldCompare label="Luz Solar" field="variedadesluzsolar" options={[{ value: 'pleno_sol', label: 'Pleno Sol' }, { value: 'semisombra', label: 'Semisombra' }, { value: 'sombra', label: 'Sombra' }]} />
                      <FieldCompare label="Necesidad de Riego" field="variedadesnecesidadriego" options={[{ value: 'baja', label: 'Baja' }, { value: 'media', label: 'Media' }, { value: 'alta', label: 'Alta' }]} />
                      <FieldCompare label="Volumen Maceta (L)" field="variedadesvolumenmaceta" type="number" />
                      <FieldCompare label="pH del Suelo" field="variedadesphsuelo" type="text" />
                      <FieldCompare label="Características del Suelo" field="variedadescaracteristicassuelo" type="textarea" />
                      <FieldCompare label="Profundidad de Siembra (cm)" field="variedadesprofundidadsiembra" type="number" />
                      <FieldCompare label="Profundidad de Trasplante" field="variedadesprofundidadtrasplante" type="text" />
                    </div>
                  </div>
                )}

                {activeTab === 'fisiologia' && (
                  <div>
                    <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>💡</span>
                      <span>Los valores se heredan automáticamente de <b>{planta.nombre_gold || planta.especiesnombre}</b>. Si modificas un campo, quedará marcado con ✏️ y sobrescribirá el valor original.</span>
                    </div>
                    <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                      <div className="field-compare-header-grid">
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
                      <FieldCompare label="Margen al Borde (cm)" field="variedadesmarcomargen" type="number" />
                    </div>
                  </div>
                )}

                {activeTab === 'calendarios' && (
                  <div>
                    <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>💡</span>
                      <span>Los valores se heredan automáticamente de <b>{planta.nombre_gold || planta.especiesnombre}</b>. Si modificas un campo, quedará marcado con ✏️ y sobrescribirá el valor original.</span>
                    </div>
                    <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                      <div className="field-compare-header-grid">
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
                  </div>
                )}

                {activeTab === 'biodinamica' && (
                  <div>
                    <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>💡</span>
                      <span>Los valores se heredan automáticamente de <b>{planta.nombre_gold || planta.especiesnombre}</b>. Si modificas un campo, quedará marcado con ✏️ y sobrescribirá el valor original.</span>
                    </div>
                    <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                      <div className="field-compare-header-grid">
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
                    suscripcion={suscripcion}
                    onMediaChange={loadPhotos} 
                  />
                )}
              </div>
            </div>
          )}
        </div>

        <div style={{ border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden', background: 'white', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <button 
            onClick={() => setCultivosOpen(!cultivosOpen)}
            style={{ 
              width: '100%', 
              background: '#f8fafc', 
              border: 'none', 
              padding: '20px 24px', 
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
              <span style={{ fontSize: '1.3rem' }}>🌱</span> Cultivos en Curso de esta Hortaliza
            </div>
            <span style={{ transform: cultivosOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }}>
              ▼
            </span>
          </button>

          {cultivosOpen && (
            <div style={{ padding: '24px' }}>
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
                      fontWeight: 'bold', fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s'
                    }}
                    onMouseOver={e => e.currentTarget.style.background = '#059669'}
                    onMouseOut={e => e.currentTarget.style.background = '#10b981'}
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
                    }}
                      onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.05)'; }}
                      onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                    >
                      <div>
                        <h4 style={{ margin: '0 0 4px', fontSize: '1.1rem', color: '#0f172a', fontWeight: 'bold' }}>
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

        <div style={{ border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden', background: 'white', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <button 
            type="button"
            onClick={() => setSemillasOpen(!semillasOpen)}
            style={{ 
              width: '100%', 
              background: '#f8fafc', 
              border: 'none', 
              padding: '20px 24px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '1.1rem',
              color: '#334155',
              borderBottom: semillasOpen ? '1px solid #e2e8f0' : 'none',
              transition: 'background 0.2s'
            }}
            onMouseOver={e => e.currentTarget.style.background = '#f1f5f9'}
            onMouseOut={e => e.currentTarget.style.background = '#f8fafc'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.3rem' }}>🌰</span> Lotes de Semillas en Banco ({semillas.length})
            </div>
            <span style={{ transform: semillasOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }}>
              ▼
            </span>
          </button>

          {semillasOpen && (
            <div style={{ padding: '24px' }}>
              {loadingSemillas ? (
                <p style={{ color: '#64748b' }}>Cargando semillas...</p>
              ) : semillas.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', background: '#f8fafc', borderRadius: '12px', border: '2px dashed #cbd5e1' }}>
                  <span style={{ fontSize: '3rem', marginBottom: '10px', display: 'block' }}>🌰</span>
                  <h3 style={{ color: '#334155', margin: '0 0 8px' }}>No hay semillas activas</h3>
                  <p style={{ color: '#64748b', margin: '0 0 16px' }}>No tienes ningún lote de semillas de esta variedad en tu banco digital.</p>
                  <button 
                    onClick={() => setShowSeedWizard(true)}
                    style={{
                      background: '#0f766e', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px',
                      fontWeight: 'bold', fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s'
                    }}
                    onMouseOver={e => e.currentTarget.style.background = '#0d5c56'}
                    onMouseOut={e => e.currentTarget.style.background = '#0f766e'}
                  >
                    🌰 Añadir Semillas
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {semillas.map((s) => {
                    const isExpired = s.semillasfechacaducidad && new Date(s.semillasfechacaducidad) < new Date();
                    const isOutOfStock = s.semillasstockactual !== null && Number(s.semillasstockactual) <= 0;
                    return (
                      <div key={s.idsemillas} style={{
                        border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        background: isExpired || isOutOfStock ? '#fef2f2' : '#f8fafc', transition: 'all 0.2s'
                      }}
                        onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.05)'; }}
                        onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div style={{ width: '48px', height: '48px', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {s.foto ? (
                              <img src={getMediaUrl(s.foto)} alt={s.variedad_nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} crossOrigin="anonymous" />
                            ) : (
                              <SpeciesIcon icon={s.especiesicono || '🌱'} size="1.5rem" />
                            )}
                          </div>
                          <div>
                            <h4 style={{ margin: '0 0 4px', fontSize: '1.1rem', color: '#0f766e', fontWeight: 'bold' }}>
                              Semilla Nº {s.semillasnumerocoleccion || s.idsemillas}
                            </h4>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
                              <strong>Origen:</strong> {s.semillasorigen === 'por_definir' ? 'PENDIENTE DE ASIGNAR' : s.semillasorigen.replace('_', ' ').toUpperCase()}
                              {s.semillasmarca && ` • Marca: ${s.semillasmarca}`}
                              {s.semillaslugarcompra && ` • Comprado en: ${s.semillaslugarcompra}`}
                            </p>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px', alignItems: 'center' }}>
                              {(isExpired || isOutOfStock) && (
                                <span style={{ fontSize: '0.7rem', color: '#b91c1c', background: '#fee2e2', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                                  ⚠️ {isOutOfStock ? 'Sin Stock' : 'Caducada'}
                                </span>
                              )}
                              {s.semillasfechacaducidad && (
                                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                  Caduca: {new Date(s.semillasfechacaducidad).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '16px' }}>
                          {s.semillasstockinicial > 0 && s.semillasstockactual !== null && (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                              <span style={{ 
                                fontWeight: 'bold', 
                                color: isOutOfStock ? '#b91c1c' : (s.semillasstockactual / s.semillasstockinicial) > 0.5 ? '#16a34a' : (s.semillasstockactual / s.semillasstockinicial) > 0.2 ? '#d97706' : '#dc2626'
                              }}>
                                {s.semillasstockactual} / {s.semillasstockinicial} uds
                              </span>
                              <small style={{ color: '#64748b', fontSize: '0.75rem' }}>
                                ({isOutOfStock ? '0%' : `${Math.round((s.semillasstockactual / s.semillasstockinicial) * 100)}%`})
                              </small>
                            </div>
                          )}
                          <button 
                            type="button"
                            onClick={() => router.push(`/dashboard/semillas/${s.idsemillas}`)}
                            style={{
                              background: 'white', color: '#0f766e', border: '1px solid #0f766e', padding: '8px 16px', borderRadius: '8px',
                              fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s'
                            }}
                            onMouseOver={e => { e.currentTarget.style.background = '#0f766e'; e.currentTarget.style.color = 'white'; }}
                            onMouseOut={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = '#0f766e'; }}
                          >
                            Ver Semilla ➔
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

      </div>

      {showCultivoModal && (
        <IniciarCultivoModal 
          isOpen={showCultivoModal}
          onClose={() => { setShowCultivoModal(false); loadCultivos(); }}
          plantaId={Number(plantaId)}
          xvariedadesidvariedadorigen={planta.xvariedadesidvariedadorigen}
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
          tiposiembra={planta.tiposiembra}
        />
      )}

      {showSeedWizard && (
        <SeedWizardModal 
          show={showSeedWizard}
          onClose={() => { setShowSeedWizard(false); loadSemillas(planta); }}
          onSuccess={() => { loadSemillas(planta); }}
        />
      )}

    </div>
  );
}
