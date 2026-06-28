'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { auth } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import Link from 'next/link';
import UserSemillaMediaManager from '@/components/user/UserSemillaMediaManager';
import { getMediaUrl } from '@/lib/media-url';
import '@/components/admin/EspecieVegetalForm.css';

export default function EditarSemillaPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const from = searchParams?.get('from');
  const semillaId = params?.id as string;
  
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({
    xsemillasidvariedadesvegetales: '',
    semillasnumerocoleccion: '',
    semillasorigen: 'cosecha_propia',
    semillasmarca: '',
    semillasfechaorigen: '',
    semillasprecio: '',
    semillasfechacaducidad: '',
    semillaslote: '',
    semillasstockinicial: '',
    semillasstockactual: '',
    semillasunidadmedida: 'unidades',
    semillasobservaciones: '',
    semillascoleccion: '',
    semillasdonante: '',
    semillasactivosino: 1,
    semillascompartir: 0,
    customVarietyName: ''
  });
  const [metaData, setMetaData] = useState<any>({});
  const [catalogo, setCatalogo] = useState<any[]>([]);
  const [selectedEspecieId, setSelectedEspecieId] = useState<string>('');
  const [isVariedadOpen, setIsVariedadOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [initialData, setInitialData] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success'>('idle');

  const [activeTab, setActiveTab] = useState('datos');
  const [photos, setPhotos] = useState<any[]>([]);
  const [suscripcion, setSuscripcion] = useState('Básica');
  const [draggedHeroPhotoId, setDraggedHeroPhotoId] = useState<number | null>(null);
  const [draggedOverHeroPhotoId, setDraggedOverHeroPhotoId] = useState<number | null>(null);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [lugaresCompra, setLugaresCompra] = useState<string[]>([]);
  const [ubicacionesFisicas, setUbicacionesFisicas] = useState<string[]>([]);
  const [showCollectionsDropdown, setShowCollectionsDropdown] = useState(false);

  // IA OCR State
  const [ocrLoading, setOcrLoading] = useState(false);
  const [aiSeconds, setAiSeconds] = useState(0);
  const [ocrData, setOcrData] = useState<any>(null);
  const [showOcrModal, setShowOcrModal] = useState(false);
  const [aiStats, setAiStats] = useState<{ used: number; max: number; remaining: number } | null>(null);
  const [historial, setHistorial] = useState<any[]>([]);
  const [showPrintLabel, setShowPrintLabel] = useState(false);
  const [labelSizeId, setLabelSizeId] = useState('a6');

  const [isMainTabsOpen, setIsMainTabsOpen] = useState(true);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (ocrLoading) {
      setAiSeconds(0);
      interval = setInterval(() => setAiSeconds(s => s + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [ocrLoading]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user && user.email) {
        setUserEmail(user.email);
        // Obtener suscripción
        fetch(`/api/auth/profile?email=${encodeURIComponent(user.email)}`)
          .then(r => r.json())
          .then(d => { if (d.profile?.suscripcion) setSuscripcion(d.profile.suscripcion); })
          .catch(() => {});
        // Obtener stats IA
        fetch('/api/user/ai-stats', { headers: { 'x-user-email': user.email } })
          .then(r => r.json())
          .then(d => setAiStats(d))
          .catch(() => {});
      } else {
        router.push('/login');
      }
    });
    return () => unsub();
  }, [router]);

  useEffect(() => {
    if (userEmail && semillaId) {
      loadSemilla();
      loadCatalogo();
      loadPhotos();
      loadHistorial();
    }
  }, [userEmail, semillaId]);

  const loadHistorial = async () => {
    if (!userEmail || !semillaId) return;
    try {
      const res = await fetch('/api/user/cultivos', { headers: { 'x-user-email': userEmail } });
      if (res.ok) {
        const data = await res.json();
        const related = (data.cultivos || []).filter((c: any) =>
          String(c.xcultivoidsemilla) === String(semillaId) ||
          String(c.idsemillas) === String(semillaId)
        );
        setHistorial(related);
      }
    } catch (e) { console.error('Error loading historial:', e); }
  };

  const loadPhotos = async () => {
    if (!userEmail || !semillaId) return;
    try {
      const res = await fetch(`/api/user/semillas/${semillaId}/photos`, { headers: { 'x-user-email': userEmail } });
      const data = await res.json();
      setPhotos(data.photos || []);
    } catch (e) {
      console.error('Error loading photos:', e);
    }
  };

  const handleSetPrimaryPhoto = async (photoId: number) => {
    try {
      const res = await fetch(`/api/user/semillas/${semillaId}/photos`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail! },
        body: JSON.stringify({ action: 'setPrimary', photoId })
      });
      if (res.ok) {
        loadPhotos();
      }
    } catch (e) {
      console.error('Error setting primary photo', e);
    }
  };

  const handleReorderPhotos = async (newPhotos: any[]) => {
    try {
      // Re-ordenar optimista
      setPhotos(prev => {
        const others = prev.filter(p => p.origen !== 'usuario');
        return [...others, ...newPhotos];
      });
      const photoIds = newPhotos.map(p => p.id);
      await fetch(`/api/user/semillas/${semillaId}/photos`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail! },
        body: JSON.stringify({ action: 'reorder', photoIds })
      });
      loadPhotos();
    } catch (e) {
      console.error('Error reordering', e);
    }
  };

  const handleScanOCR = async (heroPhoto: any) => {
    if (!heroPhoto || !heroPhoto.ruta) return;
    setOcrLoading(true);
    try {
      const res = await fetch('/api/ai/semillas/ocr-compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail! },
        body: JSON.stringify({ storagePath: heroPhoto.ruta })
      });
      if (res.ok) {
        const result = await res.json();
        setOcrData(result.data);
        setShowOcrModal(true);
      } else {
        const err = await res.json();
        alert(err.error || 'Error escaneando la imagen');
      }
    } catch (e) {
      console.error(e);
      alert('Error en la conexión con la IA');
    } finally {
      setOcrLoading(false);
    }
  };

  useEffect(() => {
    if (catalogo.length > 0 && formData.xsemillasidvariedadesvegetales && !selectedEspecieId) {
      for (const esp of catalogo) {
        if (esp.variedades?.some((v: any) => v.idvariedadesvegetales.toString() === formData.xsemillasidvariedadesvegetales.toString())) {
          setSelectedEspecieId(esp.idespeciesvegetales.toString());
          break;
        }
      }
    }
  }, [catalogo, formData.xsemillasidvariedadesvegetales, selectedEspecieId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsVariedadOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadCatalogo = async () => {
    try {
      const res = await fetch('/api/user/catalogo', { headers: { 'x-user-email': userEmail! } });
      const data = await res.json();
      if (res.ok && data.especies) {
        setCatalogo(data.especies);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadSemilla = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/user/semillas`, { headers: { 'x-user-email': userEmail! } });
      const data = await res.json();
      if (res.ok && data.semillas) {
        const semilla = data.semillas.find((s: any) => s.idsemillas.toString() === semillaId);
        if (semilla) {
          const parsed = {
            xsemillasidvariedadesvegetales: semilla.xsemillasidvariedadesvegetales || '',
            semillasnumerocoleccion: semilla.semillasnumerocoleccion || '',
            semillasorigen: semilla.semillasorigen || 'cosecha_propia',
            semillasmarca: semilla.semillasmarca || '',
            semillaslugarcompra: semilla.semillaslugarcompra || '',
            semillasfechaorigen: semilla.semillasfechaorigen ? semilla.semillasfechaorigen.split('T')[0] : '',
            semillasprecio: semilla.semillasprecio || '',
            semillasfechacaducidad: semilla.semillasfechacaducidad ? semilla.semillasfechacaducidad.split('T')[0] : '',
            semillaslote: semilla.semillaslote || '',
            semillasstockinicial: semilla.semillasstockinicial || '',
            semillasstockactual: semilla.semillasstockactual || '',
            semillasunidadmedida: semilla.semillasunidadmedida || 'unidades',
            semillasobservaciones: semilla.semillasobservaciones || '',
            semillascoleccion: semilla.semillascoleccion || '',
            semillasdonante: semilla.donante_nombreusuario ? `@${semilla.donante_nombreusuario}` : (semilla.semillasdonante || ''),
            semillasactivosino: semilla.semillasactivosino !== undefined ? semilla.semillasactivosino : 1,
            semillascompartir: semilla.semillascompartir !== undefined ? semilla.semillascompartir : 0,
            customVarietyName: ''
          };
          setFormData(parsed);
          setInitialData(JSON.stringify(parsed));
          setMetaData({
            especiesvegetalesnombre: semilla.especiesvegetalesnombre,
            variedad_nombre: semilla.variedad_nombre,
            foto: semilla.foto,
            donante_nombreusuario: semilla.donante_nombreusuario,
            donante_email: semilla.donante_email,
            fechacreacion: semilla.semillasfechacreacion ? new Date(semilla.semillasfechacreacion).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute:'2-digit' }) : null,
            cultivos_activos_count: semilla.cultivos_activos_count || 0
          });
        } else {
          alert('Semilla no encontrada');
          router.push('/dashboard/semillas');
        }
      }

      // Cargar lugares de compra únicos del usuario
      const allRes = await fetch('/api/user/semillas', { headers: { 'x-user-email': userEmail! } });
      if (allRes.ok) {
        const allData = await allRes.json();
        const lugares = (allData.semillas || [])
          .map((s: any) => s.semillaslugarcompra)
          .filter((l: any) => l && l.trim() !== '');
        setLugaresCompra([...new Set<string>(lugares)]);

        const ubicaciones = (allData.semillas || [])
          .map((s: any) => s.semillascoleccion)
          .filter((u: any) => u && u.trim() !== '');
        setUbicacionesFisicas([...new Set<string>(ubicaciones)]);
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

  const handleSave = async (dataToSave: any) => {
    setSaveStatus('saving');
    try {
      const res = await fetch(`/api/user/semillas/${semillaId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': userEmail!
        },
        body: JSON.stringify(dataToSave)
      });
      
      if (res.ok) {
        const resData = await res.json().catch(() => ({}));
        if (resData.newVariedadId) {
          const newVarIdStr = resData.newVariedadId.toString();
          const updatedFormData = {
            ...dataToSave,
            xsemillasidvariedadesvegetales: newVarIdStr,
            customVarietyName: ''
          };
          setFormData(updatedFormData);
          setInitialData(JSON.stringify(updatedFormData));
          
          if (resData.newVariedadNombre) {
            setMetaData((prev: any) => ({
              ...prev,
              variedad_nombre: resData.newVariedadNombre
            }));
          }
          
          // Recargar para sincronizar catálogo y semilla
          loadSemilla();
          loadCatalogo();
        } else {
          if (dataToSave.customVarietyName) {
            const updatedFormData = {
              ...dataToSave,
              customVarietyName: ''
            };
            setFormData(updatedFormData);
            setInitialData(JSON.stringify(updatedFormData));
          } else {
            setInitialData(JSON.stringify(dataToSave));
          }
        }
        setSaveStatus('success');
        setTimeout(() => setSaveStatus('idle'), 1500);
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error(errorData.error || 'Error al guardar');
        setSaveStatus('idle');
      }
    } catch (e) {
      console.error(e);
      setSaveStatus('idle');
    }
  };

  // Autosave Effect
  useEffect(() => {
    if (hasChanges && userEmail && semillaId) {
      const timer = setTimeout(() => {
        handleSave(formData);
      }, 800); // 800ms debounce
      return () => clearTimeout(timer);
    }
  }, [formData, hasChanges, userEmail, semillaId]);

  // Recalcular el número de colección al cambiar la colección
  useEffect(() => {
    if (userEmail && formData.semillascoleccion !== undefined) {
      let initialUbicacion = '';
      try {
        const initObj = JSON.parse(initialData);
        initialUbicacion = initObj.semillascoleccion || '';
      } catch (e) {}

      const currentUbicacion = formData.semillascoleccion || '';
      if (initialData && currentUbicacion.trim() !== initialUbicacion.trim()) {
        const timer = setTimeout(async () => {
          try {
            const res = await fetch(`/api/user/semillas/next-numero?ubicacion=${encodeURIComponent(currentUbicacion.trim())}`, {
              headers: { 'x-user-email': userEmail }
            });
            if (res.ok) {
              const data = await res.json();
              setFormData((prev: any) => ({
                ...prev,
                semillasnumerocoleccion: String(data.nextNumero)
              }));
            }
          } catch (err) {
            console.error('Error al actualizar el número de colección:', err);
          }
        }, 300); // Debounce de 300ms
        return () => clearTimeout(timer);
      }
    }
  }, [formData.semillascoleccion, userEmail, initialData]);

  // Auto-off sharing Effect
  useEffect(() => {
    const noStock = formData.semillasstockactual !== '' && Number(formData.semillasstockactual) <= 0;
    const caducada = formData.semillasfechacaducidad && new Date(formData.semillasfechacaducidad) < new Date();
    if ((noStock || caducada) && formData.semillascompartir === 1) {
      setFormData((prev: any) => ({ ...prev, semillascompartir: 0 }));
    }
  }, [formData.semillasstockactual, formData.semillasfechacaducidad, formData.semillascompartir]);

  if (loading) {
    return (
      <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto', textAlign: 'center', color: '#64748b' }}>
        <p>Cargando datos de la semilla...</p>
      </div>
    );
  }

  const handleDeleteSemilla = async () => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta semilla de tu inventario? Esta acción no se puede deshacer.')) return;
    try {
      const res = await fetch(`/api/user/semillas/${semillaId}`, {
        method: 'DELETE',
        headers: { 'x-user-email': userEmail! }
      });
      if (res.ok) {
        router.push('/dashboard/semillas');
      } else {
        const err = await res.json();
        alert(err.error || 'Error al eliminar semilla');
      }
    } catch (e) {
      console.error(e);
      alert('Error de red al eliminar');
    }
  };

  return (
    <div style={{ padding: '20px', width: '100%', boxSizing: 'border-box' }}>
      
      {/* ── Navegación ── */}
      <div style={{ marginBottom: '16px', padding: '0 4px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button 
          onClick={() => router.push('/dashboard')} 
          style={{ background: 'white', border: '1px solid #cbd5e1', color: '#475569', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          🏠 Volver al Inicio
        </button>
        <button 
          onClick={() => router.push('/dashboard/semillas')} 
          style={{ background: 'white', border: '1px solid #cbd5e1', color: '#475569', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          🔙 Volver a Inventario
        </button>
      </div>

      {/* ── Subheader Integrado ── */}
      <div style={{ background: 'linear-gradient(135deg, #0f766e, #10b981)', borderRadius: '16px', padding: '24px 28px', marginBottom: '24px', color: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '12px' }}>
              {metaData.especiesvegetalesnombre} {metaData.variedad_nombre ? `- ${metaData.variedad_nombre}` : ''} 
              
              {/* Indicador de Autoguardado */}
              {saveStatus === 'saving' && (
                <span style={{ background: '#fef08a', color: '#854d0e', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</span> Guardando...
                </span>
              )}
              {saveStatus === 'success' && (
                <span style={{ background: '#d1fae5', color: '#065f46', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  ✓ Guardado
                </span>
              )}
            </h1>
            <p style={{ margin: '4px 0 0', opacity: 0.9, fontSize: '0.9rem' }}>
              Editor de Semilla en Inventario. {formData.semillascoleccion ? `Colección ${formData.semillascoleccion} (${formData.semillasnumerocoleccion || semillaId})` : `Nº ${formData.semillasnumerocoleccion || semillaId}`}
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {metaData.cultivos_activos_count === 0 && (
              <button 
                onClick={handleDeleteSemilla}
                title="Eliminar esta semilla permanentemente"
                style={{ 
                  background: 'rgba(239, 68, 68, 0.2)', 
                  border: '1px solid rgba(255,255,255,0.3)', 
                  color: 'white', 
                  width: '40px', height: '40px', 
                  borderRadius: '10px', 
                  cursor: 'pointer', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s',
                  fontSize: '1.2rem'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.4)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                🗑️
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Ubicación, Número de Colección y Toggles unificados en la misma línea ── */}
      {(() => {
        const noStock = formData.semillasstockactual !== '' && Number(formData.semillasstockactual) <= 0;
        const caducada = formData.semillasfechacaducidad && new Date(formData.semillasfechacaducidad) < new Date();
        const disableShare = noStock || caducada;

        return (
          <div style={{ 
            display: 'flex', 
            alignItems: 'flex-end', 
            gap: '16px', 
            marginBottom: '24px', 
            flexWrap: 'wrap',
            background: '#f8fafc', 
            padding: '20px', 
            borderRadius: '16px', 
            border: '2px solid #cbd5e1',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)' 
          }}>
            {/* Inputs de Ubicación y Número de Colección agrupados y ajustados */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
              {/* Colección */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '150px', position: 'relative' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f766e', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                  <span>📍</span> Colección
                </label>
                <div style={{ position: 'relative', width: '100%' }}>
                  <input
                    type="text"
                    name="semillascoleccion"
                    value={formData.semillascoleccion}
                    onChange={handleChange}
                    onFocus={() => setShowCollectionsDropdown(true)}
                    placeholder="Ej. Caja 3..."
                    style={{ padding: '12px 30px 12px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', outline: 'none', background: 'white', width: '100%', boxSizing: 'border-box' }}
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowCollectionsDropdown(!showCollectionsDropdown);
                    }}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      color: '#64748b',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    ▼
                  </button>
                </div>

                {showCollectionsDropdown && (
                  <>
                    <div 
                      onClick={() => setShowCollectionsDropdown(false)}
                      style={{ position: 'fixed', inset: 0, zIndex: 999 }}
                    />
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      marginTop: '4px',
                      background: 'white',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                      zIndex: 1000,
                      maxHeight: '200px',
                      overflowY: 'auto'
                    }}>
                      {ubicacionesFisicas.length === 0 ? (
                        <div style={{ padding: '10px 12px', fontSize: '0.85rem', color: '#94a3b8' }}>
                          Sin colecciones previas
                        </div>
                      ) : (
                        ubicacionesFisicas.map((ub, idx) => (
                          <div
                            key={idx}
                            onClick={() => {
                              setFormData((prev: any) => ({ ...prev, semillascoleccion: ub }));
                              setShowCollectionsDropdown(false);
                            }}
                            style={{
                              padding: '10px 12px',
                              fontSize: '0.9rem',
                              color: '#1e293b',
                              cursor: 'pointer',
                              background: formData.semillascoleccion === ub ? '#f0fdf4' : 'transparent',
                              fontWeight: formData.semillascoleccion === ub ? '600' : 'normal',
                              textAlign: 'left',
                              transition: 'background 0.15s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                            onMouseLeave={(e) => e.currentTarget.style.background = formData.semillascoleccion === ub ? '#f0fdf4' : 'transparent'}
                          >
                            {ub}
                          </div>
                        ))
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Número de Colección */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '175px' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 800, color: '#475569', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                  <span>🔢</span> Número de Colección
                </label>
                <input 
                  type="text" 
                  name="semillasnumerocoleccion" 
                  value={formData.semillasnumerocoleccion} 
                  onChange={handleChange} 
                  style={{ padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', outline: 'none', background: 'white', width: '100%' }} 
                />
              </div>
            </div>

            {/* Toggle Activo */}
            <div 
              onClick={() => setFormData({ ...formData, semillasactivosino: formData.semillasactivosino === 1 ? 0 : 1 })}
              style={{ 
                padding: '12px 16px', 
                background: formData.semillasactivosino === 1 ? '#f0fdf4' : '#f8fafc', 
                border: `1px solid ${formData.semillasactivosino === 1 ? '#10b981' : '#cbd5e1'}`, 
                borderRadius: '8px', 
                color: formData.semillasactivosino === 1 ? '#065f46' : '#64748b', 
                fontWeight: 600, 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px', 
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: formData.semillasactivosino === 1 ? '0 2px 4px rgba(16,185,129,0.05)' : 'none',
                height: '48px',
                width: '185px',
                flex: '0 0 auto',
                justifyContent: 'center'
              }}
            >
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '24px', height: '24px', borderRadius: '4px',
                background: formData.semillasactivosino === 1 ? '#10b981' : '#cbd5e1',
                color: 'white'
              }}>
                {formData.semillasactivosino === 1 ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                )}
              </div>
              <span>{formData.semillasactivosino === 1 ? 'Semilla Activa' : 'Semilla Inactiva'}</span>
            </div>

            {/* Toggle Compartir */}
            <div 
              onClick={() => {
                if (disableShare) {
                  alert(`No se puede compartir una semilla que ${noStock && caducada ? 'no tiene stock y está caducada' : (noStock ? 'no tiene stock' : 'está caducada')}.`);
                  return;
                }
                setFormData({ ...formData, semillascompartir: formData.semillascompartir === 1 ? 0 : 1 });
              }}
              style={{ 
                padding: '12px 16px', 
                background: formData.semillascompartir === 1 ? '#eff6ff' : (disableShare ? '#f1f5f9' : '#f8fafc'), 
                border: `1px solid ${formData.semillascompartir === 1 ? '#3b82f6' : '#cbd5e1'}`, 
                borderRadius: '8px', 
                color: formData.semillascompartir === 1 ? '#1e40af' : (disableShare ? '#94a3b8' : '#64748b'), 
                fontWeight: 600, 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px', 
                cursor: disableShare ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: formData.semillascompartir === 1 ? '0 2px 4px rgba(59,130,246,0.05)' : 'none',
                height: '48px',
                width: '250px',
                flex: '0 0 auto',
                justifyContent: 'center',
                opacity: disableShare ? 0.7 : 1
              }}
              title={disableShare ? "No disponible: Sin stock o caducada" : ""}
            >
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '24px', height: '24px', borderRadius: '4px',
                background: formData.semillascompartir === 1 ? '#3b82f6' : '#cbd5e1',
                color: 'white'
              }}>
                {formData.semillascompartir === 1 ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                )}
              </div>
              <span>
                {formData.semillascompartir === 1 
                  ? 'Compartida' 
                  : (disableShare 
                      ? (noStock && caducada 
                          ? 'Bloqueada (Stock/Caducidad)' 
                          : (noStock 
                              ? 'Bloqueada (Sin Stock)' 
                              : 'Bloqueada (Caducada)')) 
                      : 'Privada')
                }
              </span>
            </div>
          </div>
        );
      })()}

      {metaData.fechacreacion && (
        <div style={{ marginBottom: '24px', fontSize: '0.85rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>📅</span> Registrado en el sistema el {metaData.fechacreacion}
        </div>
      )}

      {/* ── Aviso de Archivo Recomendado ── */}
      {(() => {
        if (formData.semillasactivosino !== 1) return null;
        
        const noStock = formData.semillasstockactual !== '' && Number(formData.semillasstockactual) <= 0;
        const caducada = formData.semillasfechacaducidad && new Date(formData.semillasfechacaducidad) < new Date();
        
        if (!noStock && !caducada) return null;
        
        let razon = '';
        if (noStock && caducada) {
          razon = 'está caducada y se ha quedado sin stock';
        } else if (noStock) {
          razon = 'se ha quedado sin stock';
        } else if (caducada) {
          razon = 'está caducada';
        }

        return (
          <div style={{ padding: '16px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', color: '#991b1b', marginBottom: '24px', fontSize: '0.9rem', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <span style={{ fontSize: '1.2rem' }}>⚠️</span>
            <div>
              <strong style={{ display: 'block', marginBottom: '4px' }}>Esta semilla debería ser archivada</strong>
              Parece que esta semilla {razon}. Te recomendamos hacer clic en el botón superior para <strong>Inactivarla</strong>. De este modo desaparecerá de tu inventario principal de siembra, pero conservarás todo su historial y fotos.
            </div>
          </div>
        );
      })()}

      {/* ── Hero Gallery (mismo estilo que especies globales) ── */}
      {(() => {
        const userPhotos = photos.filter(p => p.origen === 'usuario');
        if (userPhotos.length === 0) return null;
        const sortedUserPhotos = [...userPhotos].sort((a, b) => (b.esPrincipal ? 1 : 0) - (a.esPrincipal ? 1 : 0));
        const heroPhoto = sortedUserPhotos[0];
        let heroMeta: any = {};
        try { heroMeta = JSON.parse(heroPhoto?.resumen || '{}'); } catch(e){}
        const vibrantColor = heroMeta.vibrant_color || null;
        return (
          <div style={{
            marginBottom: '20px',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            background: vibrantColor ? `linear-gradient(135deg, #f8fafc 0%, ${vibrantColor}18 60%, ${vibrantColor}30 100%)` : '#f8fafc',
            transition: 'background 0.6s ease',
            overflow: 'hidden'
          }}>
            <div style={{ display: 'flex', gap: 0, alignItems: 'center' }}>
              {/* Hero photo */}
              <div 
                onDragOver={(e) => {
                  e.preventDefault();
                  if (draggedHeroPhotoId !== null && draggedHeroPhotoId !== heroPhoto.id) {
                    setDraggedOverHeroPhotoId(heroPhoto.id);
                  }
                }}
                onDragLeave={() => setDraggedOverHeroPhotoId(null)}
                onDrop={() => {
                  if (draggedHeroPhotoId !== null && draggedHeroPhotoId !== heroPhoto.id) {
                    handleSetPrimaryPhoto(draggedHeroPhotoId);
                  }
                  setDraggedHeroPhotoId(null);
                  setDraggedOverHeroPhotoId(null);
                }}
                style={{ position: 'relative', flexShrink: 0, width: '180px', height: '220px', overflow: 'hidden',
                  border: draggedOverHeroPhotoId === heroPhoto.id ? '3px dashed #10b981' : 'none'
                }}>
                <img 
                  src={getMediaUrl(heroPhoto.ruta)}
                  alt={heroMeta.seo_alt || 'Foto semilla'}
                  style={{ 
                    width: '100%', height: '100%', objectFit: 'cover',
                    objectPosition: `${heroMeta.profile_object_x ?? 50}% ${heroMeta.profile_object_y ?? 50}%`,
                    transformOrigin: `${heroMeta.profile_object_x ?? 50}% ${heroMeta.profile_object_y ?? 50}%`,
                    transform: `scale(${(heroMeta.profile_object_zoom ?? 100) / 100})`,
                    filter: `brightness(${heroMeta.profile_brightness ?? 100}%) contrast(${heroMeta.profile_contrast ?? 100}%)`,
                    transition: 'opacity 0.3s ease',
                    opacity: draggedHeroPhotoId === heroPhoto.id ? 0.5 : 1
                  }}
                  crossOrigin="anonymous"
                />
                {/* Botón IA OCR */}
                <button
                  type="button"
                  onClick={() => handleScanOCR(heroPhoto)}
                  disabled={ocrLoading || (aiStats !== null && aiStats.remaining <= 0)}
                  style={{
                    position: 'absolute', bottom: '8px', right: '8px', zIndex: 10,
                    background: ocrLoading
                      ? 'linear-gradient(135deg, #475569, #1e293b)'
                      : (aiStats?.remaining === 0 ? '#94a3b8' : 'linear-gradient(135deg, #8b5cf6, #6d28d9)'),
                    color: 'white',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '20px', padding: '5px 10px', fontSize: '0.72rem',
                    fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px',
                    cursor: (ocrLoading || aiStats?.remaining === 0) ? 'not-allowed' : 'pointer',
                    boxShadow: ocrLoading ? 'none' : '0 4px 12px rgba(109,40,217,0.4)',
                    transition: 'all 0.2s',
                  }}
                  title={aiStats?.remaining === 0 ? 'Has agotado tus escaneos del mes' : 'Extraer datos del sobre con IA'}
                >
                  {ocrLoading
                    ? <span style={{ animation: 'spin 1s linear infinite' }}>⏳</span>
                    : <span>✨</span>}
                  <span>{ocrLoading ? `${aiSeconds}s` : 'Escaneo IA'}</span>
                  {!ocrLoading && aiStats !== null && (
                    <span style={{
                      background: aiStats.remaining > 0 ? 'rgba(255,255,255,0.25)' : 'rgba(239,68,68,0.6)',
                      padding: '1px 5px', borderRadius: '10px', fontSize: '0.65rem', fontWeight: 800
                    }}>
                      {aiStats.remaining}
                    </span>
                  )}
                </button>
              </div>

              {/* Thumbnails strip */}
              {sortedUserPhotos.length > 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '8px 6px', justifyContent: 'center' }}>
                  {sortedUserPhotos.slice(1).map((p: any) => {
                    let tMeta: any = {};
                    try { tMeta = JSON.parse(p.resumen || '{}'); } catch(e){}
                    return (
                      <div key={p.id} 
                        draggable={p.origen === 'usuario'}
                        onDragStart={() => setDraggedHeroPhotoId(p.id)}
                        onDragEnter={() => draggedHeroPhotoId !== null && setDraggedOverHeroPhotoId(p.id)}
                        onDragEnd={() => {
                          if (draggedHeroPhotoId !== null && draggedOverHeroPhotoId !== null && draggedHeroPhotoId !== draggedOverHeroPhotoId) {
                            const newPhotos = [...sortedUserPhotos];
                            const dragIdx = newPhotos.findIndex((pt: any) => pt.id === draggedHeroPhotoId);
                            const dropIdx = newPhotos.findIndex((pt: any) => pt.id === draggedOverHeroPhotoId);
                            if (dragIdx !== -1 && dropIdx !== -1) {
                              const [draggedItem] = newPhotos.splice(dragIdx, 1);
                              newPhotos.splice(dropIdx, 0, draggedItem);
                              handleReorderPhotos(newPhotos);
                            }
                          }
                          setDraggedHeroPhotoId(null);
                          setDraggedOverHeroPhotoId(null);
                        }}
                        onDragOver={(e) => e.preventDefault()}
                        style={{ 
                        width: '52px', height: '70px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0,
                        cursor: p.origen === 'usuario' ? 'grab' : 'default',
                        border: draggedOverHeroPhotoId === p.id ? '2px dashed #10b981' : '2px solid rgba(0,0,0,0.08)',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                        transition: 'all 0.2s ease',
                        opacity: draggedHeroPhotoId === p.id ? 0.5 : 1,
                        transform: draggedOverHeroPhotoId === p.id ? 'scale(1.05)' : 'scale(1)'
                      }}
                      onMouseEnter={e => { if(draggedHeroPhotoId === null && p.origen === 'usuario') e.currentTarget.style.transform = 'scale(1.05)'; }}
                      onMouseLeave={e => { if(draggedHeroPhotoId === null) e.currentTarget.style.transform = 'scale(1)'; }}>
                        {(() => {
                          const STYLE_FILTERS: Record<string, string> = {
                            vibrant: 'saturate(1.5) contrast(1.1)',
                            vintage: 'sepia(0.4) saturate(1.2) contrast(0.9) hue-rotate(-10deg)',
                            cinematic: 'contrast(1.2) saturate(1.1) brightness(0.9)',
                            bnw: 'grayscale(1) contrast(1.2)',
                            fade: 'saturate(0.5) opacity(0.9) brightness(1.1)',
                            comic: 'saturate(2) contrast(1.4)',
                            manga: 'grayscale(1) contrast(1.5) brightness(1.1)',
                            watercolor: 'saturate(1.2) blur(1px) contrast(0.9)'
                          };
                          const fullFilter = `brightness(${tMeta.profile_brightness ?? 100}%) contrast(${tMeta.profile_contrast ?? 100}%) ${tMeta.profile_style ? STYLE_FILTERS[tMeta.profile_style] : ''}`.trim();
                          return (
                            <img src={getMediaUrl(p.ruta)}
                              draggable={false}
                              alt={tMeta.seo_alt || ''}
                              style={{ width: '100%', height: '100%', objectFit: 'cover',
                                objectPosition: 'center center', filter: fullFilter }}
                              crossOrigin="anonymous" />
                          );
                        })()}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      <div style={{ marginTop: '24px' }}>

        <div 
          onClick={() => setIsMainTabsOpen(!isMainTabsOpen)}
          style={{ cursor: 'pointer', padding: '12px 16px', background: '#f1f5f9', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '24px', border: '1px solid #e2e8f0', marginBottom: '16px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ transition: 'transform 0.2s', transform: isMainTabsOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶️</span>
            <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#334155', fontWeight: 'bold' }}>Detalles de la Semilla</h2>
          </div>
          {!isMainTabsOpen && (
            <div style={{ display: 'flex', gap: '16px', fontSize: '0.9rem', color: '#64748b', alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#e2e8f0', padding: '4px 8px', borderRadius: '6px' }}>✅ {formData.semillasstockactual} {formData.semillasunidadmedida}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#e2e8f0', padding: '4px 8px', borderRadius: '6px' }}>✅ Origen: {formData.semillasorigen.replace(/_/g, ' ')}</span>
              {formData.semillasfechaorigen && <span style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#e2e8f0', padding: '4px 8px', borderRadius: '6px' }}>✅ Origen/Cosecha: {formData.semillasfechaorigen}</span>}
              <button 
                onClick={(e) => { e.stopPropagation(); setIsMainTabsOpen(true); }}
                style={{ background: 'white', border: '1px solid #cbd5e1', padding: '4px 12px', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 'bold', color: '#475569' }}
              >
                Cambiar
              </button>
            </div>
          )}
        </div>

        <div style={{ display: isMainTabsOpen ? 'block' : 'none', background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', overflow: 'visible' }}>
        
        {/* HEADER TAB */}
        <div style={{ padding: '0 24px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '24px', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '24px' }}>
            <div onClick={() => setActiveTab('datos')} style={{ padding: '16px 0', borderBottom: activeTab === 'datos' ? '3px solid #0f766e' : '3px solid transparent', color: activeTab === 'datos' ? '#0f766e' : '#64748b', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', transition: 'all 0.2s' }}>
              📋 Datos de la Semilla
            </div>
            <div onClick={() => setActiveTab('fotos')} style={{ padding: '16px 0', borderBottom: activeTab === 'fotos' ? '3px solid #0f766e' : '3px solid transparent', color: activeTab === 'fotos' ? '#0f766e' : '#64748b', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', transition: 'all 0.2s' }}>
              📷 Fotos ({photos.filter(p => p.origen === 'usuario').length})
            </div>
            <div onClick={() => setActiveTab('historial')} style={{ padding: '16px 0', borderBottom: activeTab === 'historial' ? '3px solid #0f766e' : '3px solid transparent', color: activeTab === 'historial' ? '#0f766e' : '#64748b', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap' }}>
              📋 Historial {historial.length > 0 && <span style={{ background: '#dcfce7', color: '#166534', borderRadius: '10px', padding: '1px 7px', fontSize: '0.75rem' }}>{historial.length}</span>}
            </div>
          </div>
          {/* Botón Imprimir Etiqueta */}
          <button
            type="button"
            onClick={() => setShowPrintLabel(true)}
            style={{ padding: '6px 14px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#475569', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', marginRight: '4px' }}
            title="Imprimir etiqueta de la semilla"
          >
            🖸️ Imprimir Etiqueta
          </button>
        </div>

        {/* TABS CON CSS CONTROLLED DISPLAY */}
        <div style={{ display: activeTab === 'datos' ? 'block' : 'none' }}>
          
          <div style={{ padding: '32px 32px 32px 32px', display: 'grid', gap: '32px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#475569' }}>Especie</label>
              <select 
                value={selectedEspecieId} 
                onChange={(e) => {
                  const newEspecieId = e.target.value;
                  setSelectedEspecieId(newEspecieId);
                  
                  // Auto-seleccionar la primera variedad disponible para mayor comodidad
                  const esp = catalogo.find(c => c.idespeciesvegetales.toString() === newEspecieId);
                  if (esp && esp.variedades && esp.variedades.length > 0) {
                    setFormData({ ...formData, xsemillasidvariedadesvegetales: esp.variedades[0].idvariedadesvegetales.toString() });
                  } else {
                    setFormData({ ...formData, xsemillasidvariedadesvegetales: '' });
                  }

                  // Abrir el custom dropdown automáticamente con un pequeñísimo delay para evitar que eventos click/blur lo cierren de inmediato
                  setTimeout(() => {
                    setIsVariedadOpen(true);
                  }, 10);
                }} 
                style={{ padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', background: 'white' }}
              >
                <option value="">Selecciona una especie...</option>
                {catalogo.map((esp: any) => (
                  <option key={esp.idespeciesvegetales} value={esp.idespeciesvegetales.toString()}>
                    {esp.especiesvegetalesnombre}
                  </option>
                ))}
              </select>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }} ref={dropdownRef}>
              <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#475569' }}>Variedad</label>
              <div style={{ position: 'relative' }}>
                <div 
                  onClick={() => selectedEspecieId && setIsVariedadOpen(!isVariedadOpen)}
                  style={{ 
                    padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', 
                    fontSize: '1rem', background: selectedEspecieId ? 'white' : '#f1f5f9',
                    cursor: selectedEspecieId ? 'pointer' : 'not-allowed',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}
                >
                  <span style={{ color: formData.xsemillasidvariedadesvegetales ? '#0f172a' : '#94a3b8' }}>
                    {(() => {
                      if (!selectedEspecieId) return 'Selecciona una variedad...';
                      if (!formData.xsemillasidvariedadesvegetales) return 'Selecciona una variedad...';
                      const esp = catalogo.find(e => e.idespeciesvegetales.toString() === selectedEspecieId);
                      const vari = esp?.variedades?.find((v: any) => v.idvariedadesvegetales.toString() === formData.xsemillasidvariedadesvegetales.toString());
                      return vari?.variedadesvegetalesnombre || 'Variedad estándar';
                    })()}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>▼</span>
                </div>
                
                {isVariedadOpen && selectedEspecieId && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px',
                    background: 'white', borderRadius: '8px', border: '1px solid #cbd5e1',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', zIndex: 50,
                    maxHeight: '200px', overflowY: 'auto'
                  }}>
                    {(() => {
                      const vars = catalogo.find(esp => esp.idespeciesvegetales.toString() === selectedEspecieId)?.variedades || [];
                      const globalVars = vars;
                      if (globalVars.length === 0) {
                        return (
                          <div style={{ padding: '10px 12px', color: '#94a3b8', fontStyle: 'italic' }}>
                            No hay variedades disponibles
                          </div>
                        );
                      }
                      return globalVars.map((v: any) => (
                        <div 
                          key={v.idvariedadesvegetales}
                          onClick={() => {
                            setFormData({ ...formData, xsemillasidvariedadesvegetales: v.idvariedadesvegetales.toString() });
                            setIsVariedadOpen(false);
                          }}
                          style={{
                            padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9',
                            background: formData.xsemillasidvariedadesvegetales?.toString() === v.idvariedadesvegetales.toString() ? '#f0fdf4' : 'white',
                            color: formData.xsemillasidvariedadesvegetales?.toString() === v.idvariedadesvegetales.toString() ? '#166534' : '#334155',
                            fontWeight: formData.xsemillasidvariedadesvegetales?.toString() === v.idvariedadesvegetales.toString() ? 600 : 400,
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = formData.xsemillasidvariedadesvegetales?.toString() === v.idvariedadesvegetales.toString() ? '#f0fdf4' : 'white')}
                        >
                          {v.variedadesvegetalesnombre || 'Variedad estándar'}
                        </div>
                      ));
                    })()}
                  </div>
                )}
              </div>
            </div>

          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#475569' }}>Origen de las Semillas</label>
              <select name="semillasorigen" value={formData.semillasorigen} onChange={handleChange} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem' }}>
                <option value="cosecha_propia">Propia / Extraída</option>
                <option value="intercambio">Intercambio</option>
                <option value="sobre_comprado">Sobre</option>
                <option value="por_definir">Pendiente de asignar</option>
              </select>
            </div>
            
            {formData.semillasorigen === 'intercambio' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: '#f0fdf4', padding: '16px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#166534', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  Donante 
                  {metaData.donante_nombreusuario && formData.semillasdonante === `@${metaData.donante_nombreusuario}` && (
                    <span style={{ background: '#166534', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem' }}>✔ Usuario Registrado</span>
                  )}
                </label>
                <input 
                  type="text" 
                  name="semillasdonante"
                  placeholder="Ej. @juan_perez o mario@email.com" 
                  value={formData.semillasdonante || ''} 
                  onChange={handleChange} 
                  style={{ padding: '12px', borderRadius: '6px', border: '1px solid #86efac', outline: 'none', background: 'white' }} 
                />
                <div style={{ fontSize: '0.75rem', color: '#15803d' }}>
                  Si es un usuario de Verdantia y coinciden los datos, se enlazará automáticamente al guardar.
                </div>
              </div>
            )}
          </div>

          <div style={{ marginTop: '12px' }}>
            <div 
              onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '12px 16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #cbd5e1', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
            >
              <span style={{ fontWeight: 'bold', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1rem', transition: 'transform 0.2s', transform: isAdvancedOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶️</span>
                Datos Avanzados del Lote
              </span>
            </div>

            <div style={{ display: isAdvancedOpen ? 'grid' : 'none', gap: '32px', marginTop: '24px', animation: 'fadeIn 0.3s ease-in-out' }}>
              {(formData.semillasorigen === 'sobre_comprado' || formData.semillasorigen === 'intercambio') && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '24px', background: '#f8fafc', padding: '24px', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                  
                  {formData.semillasorigen === 'sobre_comprado' && (
                    <>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#475569' }}>Marca Comercial</label>
                        <input 
                          list="main-brands"
                          type="text" 
                          name="semillasmarca" 
                          placeholder="Ej. Fito, Batlle..." 
                          value={formData.semillasmarca} 
                          onChange={handleChange} 
                          style={{ padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', outline: 'none' }} 
                        />
                        <datalist id="main-brands">
                          <option value="Semillas Fitó" />
                          <option value="Semillas Batlle" />
                          <option value="Rocalba" />
                          <option value="Vilmorin" />
                          <option value="Clemente Viven" />
                          <option value="EuroGarden" />
                          <option value="Koprima" />
                          <option value="Semillas Madre Tierra" />
                          <option value="Fito Agrícola" />
                          <option value="Semillas Cantueso" />
                          <option value="Semillas Silvestres" />
                        </datalist>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#475569' }}>Lugar de Compra</label>
                        <input 
                          list="user-lugares-compra-detail"
                          type="text" 
                          name="semillaslugarcompra" 
                          placeholder="Ej. Leroy Merlin, Vivero local..." 
                          value={formData.semillaslugarcompra || ''} 
                          onChange={handleChange} 
                          style={{ padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', outline: 'none' }} 
                        />
                        <datalist id="user-lugares-compra-detail">
                          {lugaresCompra.map((lugar, i) => <option key={i} value={lugar} />)}
                        </datalist>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#475569' }}>Precio (€)</label>
                        <input 
                          type="number" 
                          step="0.01"
                          min="0"
                          name="semillasprecio" 
                          placeholder="0.00" 
                          value={formData.semillasprecio || ''} 
                          onChange={handleChange} 
                          style={{ padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', outline: 'none' }} 
                        />
                      </div>
                    </>
                  )}


                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#475569' }}>Precio (€)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      min="0"
                      name="semillasprecio" 
                      placeholder="0.00" 
                      value={formData.semillasprecio} 
                      onChange={handleChange} 
                      style={{ padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', outline: 'none' }} 
                    />
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))', gap: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#475569' }}>Calculadora (Gramos)</label>
                  <input type="number" step="0.01" min="0" placeholder={
                    (() => {
                      if (selectedEspecieId) {
                        const especie = catalogo.find(c => c.idespeciesvegetales.toString() === selectedEspecieId);
                        let peso1000 = especie?.especiespeso1000semillas;
                        if (formData.xsemillasidvariedadesvegetales && especie?.variedades) {
                          const variedad = especie.variedades.find((v: any) => v.idvariedadesvegetales.toString() === formData.xsemillasidvariedadesvegetales.toString());
                          if (variedad?.variedadespeso1000semillas) {
                            peso1000 = variedad.variedadespeso1000semillas;
                          }
                        }
                        if (peso1000) {
                          return `1 g = ${Math.round(1000 / parseFloat(peso1000))} uds`;
                        }
                      }
                      return "Ej. 1.5";
                    })()
                  } onChange={(e) => {
                    const gramos = parseFloat(e.target.value);
                    if (gramos > 0 && selectedEspecieId) {
                      const especie = catalogo.find(c => c.idespeciesvegetales.toString() === selectedEspecieId);
                      let peso1000 = especie?.especiespeso1000semillas;
                      if (formData.xsemillasidvariedadesvegetales && especie?.variedades) {
                        const variedad = especie.variedades.find((v: any) => v.idvariedadesvegetales.toString() === formData.xsemillasidvariedadesvegetales.toString());
                        if (variedad?.variedadespeso1000semillas) {
                          peso1000 = variedad.variedadespeso1000semillas;
                        }
                      }
                      if (peso1000) {
                        const uds = Math.round((gramos / parseFloat(peso1000)) * 1000);
                        setFormData((prev: any) => ({ ...prev, semillasstockinicial: uds.toString(), semillasstockactual: uds.toString() }));
                      } else {
                        alert('No hay datos de peso para esta especie/variedad. Introduce las unidades a mano.');
                      }
                    }
                  }} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#475569' }}>Stock Inicial</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input type="number" min="0" name="semillasstockinicial" value={formData.semillasstockinicial} onChange={handleChange} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', outline: 'none' }} />
                    <select 
                      name="semillasunidadmedida"
                      value={formData.semillasunidadmedida}
                      onChange={handleChange}
                      style={{ width: '100px', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }}
                    >
                      <option value="unidades">Uds</option>
                      <option value="gramos">Gramos</option>
                      <option value="kilos">Kilos</option>
                      <option value="sobres">Sobres</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#16a34a' }}>Stock Actual Disponible</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input type="number" min="0" name="semillasstockactual" value={formData.semillasstockactual} onChange={handleChange} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #16a34a', fontSize: '1rem', background: '#f0fdf4', outline: 'none' }} />
                    <select 
                      disabled
                      value={formData.semillasunidadmedida}
                      style={{ width: '100px', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '0.9rem', outline: 'none', color: '#94a3b8' }}
                    >
                      <option value={formData.semillasunidadmedida}>
                        {formData.semillasunidadmedida === 'unidades' ? 'Uds' : formData.semillasunidadmedida.charAt(0).toUpperCase() + formData.semillasunidadmedida.slice(1)}
                      </option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#475569' }}>Lote / Identificador</label>
                  <input type="text" name="semillaslote" value={formData.semillaslote} onChange={handleChange} placeholder="Ej. L-2026-A" style={{ padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#475569' }}>Fecha Origen / Cosecha</label>
                  <input type="date" name="semillasfechaorigen" value={formData.semillasfechaorigen} onChange={handleChange} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem' }} />
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
          </div>
        </div>
        </div>

        <div style={{ display: activeTab === 'fotos' ? 'block' : 'none' }}>
          <UserSemillaMediaManager 
            semillaId={semillaId} 
            userEmail={userEmail!}
            suscripcion={suscripcion}
            initialPhotos={photos}
            onMediaChange={() => loadPhotos()}
          />
        </div>

        {/* TAB HISTORIAL */}
        <div style={{ display: activeTab === 'historial' ? 'block' : 'none', padding: '24px' }}>
          <h3 style={{ margin: '0 0 16px', color: '#334155', fontSize: '1.1rem' }}>📋 Historial de Uso de esta Semilla</h3>
          {historial.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1', color: '#64748b' }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🌱</div>
              <p style={{ margin: 0 }}>Esta semilla aún no se ha usado en ningún cultivo registrado.</p>
            </div>
          ) : (
            <div style={{ background: 'white', borderRadius: '12px', overflowX: 'auto', border: '1px solid #e2e8f0' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  <tr>
                    <th style={{ padding: '10px 12px', textAlign: 'left', color: '#475569', fontWeight: 700 }}>Cultivo</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', color: '#475569', fontWeight: 700 }}>Bancal</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', color: '#475569', fontWeight: 700 }}>Fecha Inicio</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', color: '#475569', fontWeight: 700 }}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {historial.map((c: any, i: number) => (
                    <tr key={c.idcultivos || i} style={{ borderBottom: '1px solid #e2e8f0', background: i % 2 === 0 ? 'white' : '#f8fafc' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 600, color: '#1e293b' }}>{c.especiesvegetalesnombre || c.variedad_nombre || `Cultivo #${c.idcultivos}`}</td>
                      <td style={{ padding: '10px 12px', color: '#475569' }}>{c.bancalesnombre || '-'}</td>
                      <td style={{ padding: '10px 12px', color: '#475569' }}>
                        {c.cultivosfechainicio ? new Date(c.cultivosfechainicio).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-'}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ background: c.cultivosactivosino === 1 ? '#dcfce7' : '#f1f5f9', color: c.cultivosactivosino === 1 ? '#16a34a' : '#64748b', padding: '2px 8px', borderRadius: '10px', fontSize: '0.78rem', fontWeight: 700 }}>
                          {c.cultivosactivosino === 1 ? '🌿 Activo' : '✅ Finalizado'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        </div>

      </div>
      {/* MODAL IMPRIMIR ETIQUETA */}
      {showPrintLabel && formData && (() => {
        const LABEL_SIZES = [
          { id: 'a4',   name: 'A4',         desc: '210×297mm', w: '420px', h: 'auto',  printW: '210mm', printH: '297mm', compact: false },
          { id: 'a5',   name: 'A5',         desc: '148×210mm', w: '300px', h: 'auto',  printW: '148mm', printH: '210mm', compact: false },
          { id: 'a6',   name: 'A6',         desc: '105×148mm', w: '240px', h: 'auto',  printW: '105mm', printH: '148mm', compact: false },
          { id: '10x5', name: 'Etiq. 10×5', desc: '100×50mm',  w: '320px', h: '160px', printW: '100mm', printH: '50mm',  compact: true  },
          { id: '7x4',  name: 'Etiq. 7×4',  desc: '70×40mm',   w: '280px', h: '128px', printW: '70mm',  printH: '40mm',  compact: true  },
          { id: '5x3',  name: 'Mini 5×3',   desc: '50×30mm',   w: '200px', h: '96px',  printW: '50mm',  printH: '30mm',  compact: true  },
        ];
        const sz = LABEL_SIZES.find(s => s.id === labelSizeId) || LABEL_SIZES[2];

        const origenLabel = formData.semillasorigen === 'sobre_comprado' ? '🛒 Sobre'
          : formData.semillasorigen === 'cosecha_propia' ? '🌱 Cosecha propia'
          : formData.semillasorigen === 'donacion' ? '🤝 Donación'
          : formData.semillasorigen === 'intercambio' ? '🔄 Intercambio'
          : (formData.semillasorigen || '—').replace(/_/g, ' ');

        const fechaCad = formData.semillasfechacaducidad
          ? new Date(formData.semillasfechacaducidad).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) : null;
        const fechaOri = formData.semillasfechaorigen
          ? new Date(formData.semillasfechaorigen).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) : null;

        // Clean species & variety display names to avoid duplication
        const speciesName = (metaData.especiesvegetalesnombre || '').trim();
        let varietyName = (metaData.variedad_nombre || '').trim();
        let cleanVariety = '';
        if (varietyName && speciesName) {
          const speciesLower = speciesName.toLowerCase();
          const varietyLower = varietyName.toLowerCase();

          if (speciesLower !== varietyLower) {
            if (varietyLower.startsWith(speciesLower)) {
              let suffix = varietyName.substring(speciesName.length).trim();
              if (suffix.startsWith('(') && suffix.endsWith(')')) {
                suffix = suffix.substring(1, suffix.length - 1).trim();
              }
              if (suffix) {
                cleanVariety = suffix;
              }
            } else {
              let tempVariety = varietyName;
              if (tempVariety.startsWith('(') && tempVariety.endsWith(')')) {
                tempVariety = tempVariety.substring(1, tempVariety.length - 1).trim();
              }
              cleanVariety = tempVariety;
            }
          }
        } else if (varietyName) {
          cleanVariety = varietyName;
        }

        const handlePrint = () => {
          const el = document.getElementById('print-label-content');
          if (!el) return;
          const baseUrl = window.location.origin;
          const fixedContent = el.innerHTML.split('/logo-verdantia-banner.jpg').join(baseUrl + '/logo-verdantia-banner.jpg');
          const win = window.open('', '_blank');
          if (!win) return;
          win.document.write('<html><head><title>Etiqueta Semilla #' + semillaId + '</title><style>*{box-sizing:border-box;margin:0;padding:0;}body{font-family:system-ui,sans-serif;background:white;}@media print{@page{size:' + sz.printW + ' ' + sz.printH + ';margin:0;}body{margin:0;padding:4mm;}}@media screen{body{padding:20px;}}</style></head><body>' + fixedContent + '</body></html>');
          win.document.close();
          win.focus();
          const img = win.document.querySelector('img');
          if (img && !img.complete) {
            img.onload = () => { win.print(); win.close(); };
          } else {
            setTimeout(() => { win.print(); win.close(); }, 300);
          }
        };

        return (
          <div style={{ position: 'fixed', inset: 0, zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
            <div style={{ background: 'white', borderRadius: '16px', width: '94%', maxWidth: '600px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '95vh' }}>

              {/* HEADER */}
              <div style={{ padding: '14px 20px', background: 'linear-gradient(135deg, #0f766e, #10b981)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                <h2 style={{ margin: 0, fontSize: '1.05rem' }}>🖨️ Imprimir Etiqueta</h2>
                <button onClick={() => setShowPrintLabel(false)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.3)', color: 'white', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '0.85rem' }}>✕</button>
              </div>

              {/* SELECTOR TAMAÑO */}
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', flexShrink: 0 }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>📐 Tamaño de etiqueta</div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {LABEL_SIZES.map(s => (
                    <button key={s.id} onClick={() => setLabelSizeId(s.id)}
                      style={{ padding: '6px 12px', borderRadius: '8px', border: '2px solid ' + (labelSizeId === s.id ? '#0f766e' : '#e2e8f0'), background: labelSizeId === s.id ? '#f0fdf4' : 'white', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', transition: 'all 0.15s', minWidth: '72px' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.85rem', color: labelSizeId === s.id ? '#0f766e' : '#334155' }}>{s.name}</span>
                      <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{s.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* PREVIEW */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', background: '#e2e8f0' }}>
                <div id="print-label-content" style={{ width: sz.w, height: sz.h === 'auto' ? undefined : sz.h, fontFamily: 'system-ui, sans-serif', background: 'white', border: '2px solid #0f766e', borderRadius: sz.compact ? '6px' : '10px', padding: sz.compact ? '8px 10px' : '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', overflow: 'hidden', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: sz.compact ? '4px' : '10px' }}>

                  {/* Cabecera */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: sz.compact ? '0.8rem' : '1.2rem', fontWeight: 900, color: '#0f766e', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: sz.compact ? 'nowrap' : 'normal' }}>
                        {speciesName || '—'}
                        {cleanVariety && (
                          <span style={{ fontWeight: 600, color: '#475569', fontSize: sz.compact ? '0.72rem' : '0.9rem', marginLeft: '5px' }}>
                            ({cleanVariety})
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ background: '#f0fdf4', border: '2px solid #0f766e', borderRadius: '6px', padding: sz.compact ? '3px 7px' : '6px 10px', textAlign: 'center', flexShrink: 0 }}>
                      <div style={{ fontSize: '0.55rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Nº</div>
                      <div style={{ fontWeight: 900, color: '#0f766e', fontSize: sz.compact ? '0.9rem' : '1.2rem', lineHeight: 1 }}>#{formData.semillasnumerocoleccion || semillaId}</div>
                    </div>
                  </div>

                  {/* Datos */}
                  {sz.compact ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px', fontSize: '0.7rem', borderTop: '1px solid #e2e8f0', paddingTop: '5px' }}>
                      <span><span style={{ color: '#94a3b8' }}>Tipo:</span> <strong>{origenLabel}</strong></span>
                      <span><span style={{ color: '#94a3b8' }}>Stock:</span> <strong>{formData.semillasstockactual} {formData.semillasunidadmedida === 'unidades' ? 'uds' : formData.semillasunidadmedida}</strong></span>
                      {fechaCad && <span><span style={{ color: '#94a3b8' }}>Cad:</span> <strong style={{ color: '#92400e' }}>{fechaCad}</strong></span>}
                      {fechaOri && sz.id !== '5x3' && <span><span style={{ color: '#94a3b8' }}>Cosecha:</span> <strong>{fechaOri}</strong></span>}
                      {formData.semillasmarca && sz.id !== '5x3' && <span><span style={{ color: '#94a3b8' }}>Marca:</span> <strong>{formData.semillasmarca}</strong></span>}
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '7px', borderTop: '2px solid #e2e8f0', paddingTop: '10px' }}>
                      <div style={{ background: '#f8fafc', padding: '6px 8px', borderRadius: '6px', borderLeft: '3px solid #0f766e' }}>
                        <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Tipo / Origen</div>
                        <strong style={{ fontSize: '0.82rem', color: '#1e293b' }}>{origenLabel}</strong>
                      </div>
                      <div style={{ background: '#f8fafc', padding: '6px 8px', borderRadius: '6px', borderLeft: '3px solid #10b981' }}>
                        <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Cantidad</div>
                        <strong style={{ fontSize: '0.82rem', color: '#1e293b' }}>{formData.semillasstockactual} {formData.semillasunidadmedida === 'unidades' ? 'uds' : formData.semillasunidadmedida}</strong>
                      </div>
                      {fechaCad && (
                        <div style={{ background: '#fef9f0', padding: '6px 8px', borderRadius: '6px', borderLeft: '3px solid #f59e0b' }}>
                          <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Caduca</div>
                          <strong style={{ fontSize: '0.82rem', color: '#92400e' }}>{fechaCad}</strong>
                        </div>
                      )}
                      {fechaOri && (
                        <div style={{ background: '#f8fafc', padding: '6px 8px', borderRadius: '6px', borderLeft: '3px solid #64748b' }}>
                          <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Cosecha / Origen</div>
                          <strong style={{ fontSize: '0.82rem', color: '#1e293b' }}>{fechaOri}</strong>
                        </div>
                      )}
                      {formData.semillasmarca && (
                        <div style={{ background: '#f8fafc', padding: '6px 8px', borderRadius: '6px', borderLeft: '3px solid #cbd5e1' }}>
                          <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Marca</div>
                          <strong style={{ fontSize: '0.82rem', color: '#1e293b' }}>{formData.semillasmarca}</strong>
                        </div>
                      )}
                      {formData.semillascoleccion && (
                        <div style={{ background: '#f8fafc', padding: '6px 8px', borderRadius: '6px', borderLeft: '3px solid #cbd5e1' }}>
                          <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Colección</div>
                          <strong style={{ fontSize: '0.82rem', color: '#1e293b' }}>{formData.semillascoleccion}</strong>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Logo pie */}
                  <div style={{ marginTop: 'auto', paddingTop: sz.compact ? '4px' : '8px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <img src="/logo-verdantia-banner.jpg" alt="Verdantia" style={{ height: sz.compact ? '18px' : '28px', objectFit: 'contain', opacity: 0.85 }} />
                    {formData.semillaslote && <span style={{ fontSize: '0.62rem', color: '#94a3b8' }}>Lote: {formData.semillaslote}</span>}
                  </div>

                </div>
              </div>

              {/* FOOTER */}
              <div style={{ padding: '12px 20px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Tamaño: <strong style={{ color: '#0f766e' }}>{sz.name}</strong> ({sz.desc})</span>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => setShowPrintLabel(false)} style={{ padding: '8px 16px', border: '1px solid #cbd5e1', background: 'white', borderRadius: '8px', color: '#475569', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' }}>Cancelar</button>
                  <button onClick={handlePrint} style={{ padding: '8px 20px', border: 'none', background: 'linear-gradient(135deg, #0f766e, #10b981)', color: 'white', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    🖨️ Imprimir
                  </button>
                </div>
              </div>

            </div>
          </div>
        );
      })()}

      {/* MODAL IA OCR COMPARE */}
      {showOcrModal && ocrData && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'white', borderRadius: '16px', width: '90%', maxWidth: '600px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', background: 'linear-gradient(to right, #0f172a, #1e293b)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <h2 style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>✨</span> Resultados de la IA
              </h2>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => setShowOcrModal(false)} style={{ padding: '6px 12px', border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', borderRadius: '6px', cursor: 'pointer', color: 'white', fontSize: '0.85rem' }}>
                  Cancelar
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    try {
                      const updates: any = {};
                      ['semillasmarca', 'semillaslote', 'semillasfechaorigen', 'semillasfechacaducidad', 'semillasobservaciones'].forEach(k => {
                        if (ocrData[k]) updates[k] = ocrData[k];
                      });

                      let newEspecieId = selectedEspecieId;
                      let matchedVariety: any = null;

                      const detectedEspecie = ocrData.especie_detectada;
                      const detectedVariedad = ocrData.variedad_detectada;

                      if (detectedEspecie) {
                        const esp = catalogo.find(e => e.especiesvegetalesnombre.toLowerCase() === detectedEspecie.toLowerCase());
                        if (esp) {
                          newEspecieId = esp.idespeciesvegetales.toString();
                          
                          if (detectedVariedad) {
                            matchedVariety = esp.variedades?.find((v: any) =>
                              v.variedadesvegetalesnombre.toLowerCase().includes(detectedVariedad.toLowerCase()) ||
                              detectedVariedad.toLowerCase().includes(v.variedadesvegetalesnombre.toLowerCase())
                            );
                          }
                          
                          if (matchedVariety) {
                            updates.xsemillasidvariedadesvegetales = matchedVariety.idvariedadesvegetales.toString();
                            updates.customVarietyName = '';
                          } else {
                            const genericVar = esp.variedades?.find((v: any) => v.variedadesvegetalesesgenerica === 1) || esp.variedades?.[0];
                            if (genericVar) {
                              updates.xsemillasidvariedadesvegetales = genericVar.idvariedadesvegetales.toString();
                              updates.customVarietyName = detectedVariedad;
                            }
                          }
                        }
                      }

                      if (ocrData.peso_gramos || ocrData.gramos_detectados) {
                        const gramosVal = ocrData.peso_gramos || ocrData.gramos_detectados;
                        let peso1000: number | null = null;
                        if (newEspecieId) {
                          const especie = catalogo.find(c => c.idespeciesvegetales?.toString() === newEspecieId);
                          peso1000 = parseFloat(especie?.especiespeso1000semillas || '0');
                          const targetVariedadId = updates.xsemillasidvariedadesvegetales || formData.xsemillasidvariedadesvegetales;
                          if (targetVariedadId && especie?.variedades) {
                            const variedad = especie.variedades.find((v: any) => v.idvariedadesvegetales?.toString() === targetVariedadId?.toString());
                            if (variedad?.variedadespeso1000semillas) {
                              peso1000 = parseFloat(variedad.variedadespeso1000semillas);
                            }
                          }
                        }
                        if (peso1000 && peso1000 > 0) {
                          const estimatedSeeds = Math.round((parseFloat(gramosVal) / peso1000) * 1000);
                          if (!isNaN(estimatedSeeds)) {
                            updates.semillasstockinicial = estimatedSeeds.toString();
                            updates.semillasstockactual = estimatedSeeds.toString();
                          }
                        }
                      }

                      if (newEspecieId !== selectedEspecieId && newEspecieId) {
                        setSelectedEspecieId(newEspecieId);
                      }

                      setFormData((prev: any) => ({ ...prev, ...updates }));
                      setShowOcrModal(false);
                    } catch (e) {
                      console.error("Error applying all data:", e);
                      alert("Hubo un error al aplicar los datos. Intenta aplicarlos uno por uno.");
                    }
                  }}
                  style={{ padding: '6px 12px', border: 'none', background: '#10b981', borderRadius: '6px', cursor: 'pointer', color: 'white', fontWeight: 'bold', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px', boxShadow: '0 2px 4px rgba(16,185,129,0.3)' }}
                >
                  Aplicar todo
                </button>
              </div>
            </div>
            <div style={{ padding: '24px' }}>
              <p style={{ margin: '0 0 16px 0', fontSize: '0.9rem', color: '#475569' }}>
                La IA ha extraído estos datos de la imagen. Selecciona los campos que deseas sobrescribir en tu base de datos:
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '8px', fontWeight: 'bold', fontSize: '0.8rem', color: '#64748b' }}>
                <div>Datos Actuales</div>
                <div>Extraído de la Imagen</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                
                {[
                  { key: 'semillasmarca', label: 'Marca / Semillera' },
                  { key: 'semillaslote', label: 'Lote' },
                  { key: 'semillasfechaorigen', label: 'Origen / Cosecha' },
                  { key: 'semillasfechacaducidad', label: 'Caducidad' },
                  { key: 'semillasobservaciones', label: 'Observaciones' }
                ].map(({ key, label }) => {
                  const currentValue = (formData as any)[key] || '- Vacío -';
                  const aiValue = ocrData[key] || '';
                  if (!aiValue) return null; // No mostrar si la IA no detectó nada para este campo

                  return (
                    <div key={key} style={{ display: 'flex', alignItems: 'stretch', gap: '12px', background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ flex: 1, fontSize: '0.9rem', color: '#475569' }}>
                        <small style={{ display: 'block', fontSize: '0.7rem', color: '#94a3b8', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</small>
                        <div style={{ textDecoration: 'line-through', opacity: 0.7 }}>{currentValue}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', color: '#94a3b8' }}>→</div>
                      <div style={{ flex: 1, fontSize: '0.9rem', color: '#0f172a', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>{aiValue}</div>
                        <button 
                          type="button"
                          onClick={() => {
                            setFormData((prev: any) => ({ ...prev, [key]: aiValue }));
                            setOcrData((prev: any) => ({ ...prev, [key]: null })); // Quitarlo de la lista tras aplicar
                          }}
                          style={{ background: '#10b981', color: 'white', border: 'none', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                          Aplicar
                        </button>
                      </div>
                    </div>
                  );
                })}

                {ocrData.especie_detectada && (
                  <div style={{ marginTop: '8px', padding: '12px', background: '#f0fdfa', borderRadius: '8px', border: '1px dashed #14b8a6', fontSize: '0.85rem', color: '#0f766e' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong style={{ display: 'block', marginBottom: '4px' }}>🌱 Hortaliza sugerida por IA:</strong>
                        {ocrData.especie_detectada}
                      </div>
                      {(() => {
                        const detected = ocrData.especie_detectada.toLowerCase();
                        const esp = catalogo.find(e => e.especiesvegetalesnombre.toLowerCase() === detected);
                        if (esp) {
                          return (
                            <button 
                              type="button"
                              onClick={() => {
                                setSelectedEspecieId(esp.idespeciesvegetales.toString());
                                const genericVar = esp.variedades?.find((v: any) => v.variedadesvegetalesesgenerica === 1) || esp.variedades?.[0];
                                if (genericVar) {
                                  setFormData((prev: any) => ({ ...prev, xsemillasidvariedadesvegetales: genericVar.idvariedadesvegetales.toString() }));
                                }
                                setOcrData((prev: any) => ({ ...prev, especie_detectada: null }));
                              }}
                              style={{ background: '#10b981', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(16,185,129,0.3)' }}
                            >
                              Aplicar Hortaliza
                            </button>
                          );
                        }
                        return <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontStyle: 'italic' }}>Sin coincidencia en catálogo</span>;
                      })()}
                    </div>
                  </div>
                )}

                {ocrData.variedad_detectada && (
                  <div style={{ marginTop: '8px', padding: '12px', background: '#f5f3ff', borderRadius: '8px', border: '1px dashed #8b5cf6', fontSize: '0.85rem', color: '#5b21b6' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong style={{ display: 'block', marginBottom: '4px' }}>✨ Variedad sugerida por IA:</strong>
                        {ocrData.variedad_detectada}
                      </div>
                      {(() => {
                        let matchedVariety: any = null;
                        let matchedEspecieId: string | null = null;
                        const detected = ocrData.variedad_detectada.toLowerCase();
                        
                        for (const esp of catalogo) {
                          const vMatch = esp.variedades?.find((v: any) => 
                            v.variedadesvegetalesnombre.toLowerCase().includes(detected) || 
                            detected.includes(v.variedadesvegetalesnombre.toLowerCase())
                          );
                          if (vMatch) {
                            matchedVariety = vMatch;
                            matchedEspecieId = esp.idespeciesvegetales.toString();
                            break;
                          }
                        }

                        if (matchedVariety) {
                          return (
                            <button 
                              type="button"
                              onClick={() => {
                                setSelectedEspecieId(matchedEspecieId!);
                                setFormData((prev: any) => ({ 
                                  ...prev, 
                                  xsemillasidvariedadesvegetales: matchedVariety.idvariedadesvegetales.toString(),
                                  customVarietyName: ''
                                }));
                                setOcrData((prev: any) => ({ ...prev, variedad_detectada: null }));
                              }}
                              style={{ background: '#8b5cf6', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(139,92,246,0.3)' }}
                            >
                              Aplicar ({matchedVariety.variedadesvegetalesnombre})
                            </button>
                          );
                        } else {
                          const activeEspId = matchedEspecieId || selectedEspecieId;
                          const esp = catalogo.find(e => e.idespeciesvegetales.toString() === activeEspId);
                          const genericVar = esp?.variedades?.find((v: any) => v.variedadesvegetalesesgenerica === 1) || esp?.variedades?.[0];
                          
                          if (genericVar) {
                            return (
                              <button 
                                type="button"
                                onClick={() => {
                                  if (matchedEspecieId) setSelectedEspecieId(matchedEspecieId);
                                  setFormData((prev: any) => ({ 
                                    ...prev, 
                                    xsemillasidvariedadesvegetales: genericVar.idvariedadesvegetales.toString(),
                                    customVarietyName: ocrData.variedad_detectada
                                  }));
                                  setOcrData((prev: any) => ({ ...prev, variedad_detectada: null }));
                                }}
                                style={{ background: '#6d28d9', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(109,40,217,0.3)' }}
                              >
                                Aplicar (Nueva variedad)
                              </button>
                            );
                          }
                        }
                        return <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontStyle: 'italic' }}>Selecciona hortaliza primero</span>;
                      })()}
                    </div>
                  </div>
                )}

                {ocrData.gramos_detectados && (
                  <div style={{ marginTop: '8px', padding: '12px', background: '#fef2f2', borderRadius: '8px', border: '1px dashed #ef4444', fontSize: '0.85rem', color: '#991b1b' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong style={{ display: 'block', marginBottom: '4px' }}>⚖️ Peso neto del sobre:</strong>
                        {ocrData.gramos_detectados} g
                      </div>
                      {(() => {
                        let peso1000 = null;
                        if (selectedEspecieId) {
                          const especie = catalogo.find(c => c.idespeciesvegetales.toString() === selectedEspecieId);
                          peso1000 = especie?.especiespeso1000semillas;
                          if (formData.xsemillasidvariedadesvegetales && especie?.variedades) {
                            const variedad = especie.variedades.find((v: any) => v.idvariedadesvegetales.toString() === formData.xsemillasidvariedadesvegetales.toString());
                            if (variedad?.variedadespeso1000semillas) {
                              peso1000 = variedad.variedadespeso1000semillas;
                            }
                          }
                        }

                        if (peso1000) {
                          const gramos = parseFloat(ocrData.gramos_detectados);
                          if (!isNaN(gramos)) {
                            const uds = Math.round((gramos / parseFloat(peso1000)) * 1000);
                            return (
                              <button 
                                type="button"
                                onClick={() => {
                                  setFormData((prev: any) => ({ ...prev, semillasstockinicial: uds.toString(), semillasstockactual: uds.toString() }));
                                  setOcrData((prev: any) => ({ ...prev, gramos_detectados: null }));
                                }}
                                style={{ background: '#ef4444', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(239,68,68,0.3)' }}
                              >
                                Calcular Stock (~{uds} uds)
                              </button>
                            );
                          }
                        }
                        return <span style={{ fontSize: '0.7rem', color: '#ef4444', fontStyle: 'italic' }}>Elige una especie primero</span>;
                      })()}
                    </div>
                  </div>
                )}

                {ocrData.peso_gramos && (
                  <div style={{ marginTop: '8px', padding: '12px', background: '#fef3c7', borderRadius: '8px', border: '1px dashed #d97706', fontSize: '0.85rem', color: '#92400e' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong style={{ display: 'block', marginBottom: '4px' }}>⚖️ Peso neto detectado:</strong>
                        {ocrData.peso_gramos} g
                      </div>
                      {(() => {
                        let peso1000: number | null = null;
                        if (selectedEspecieId) {
                          const especie = catalogo.find(c => c.idespeciesvegetales.toString() === selectedEspecieId);
                          peso1000 = parseFloat(especie?.especiespeso1000semillas || '0');
                          if (formData.xsemillasidvariedadesvegetales && especie?.variedades) {
                            const variedad = especie.variedades.find((v: any) => v.idvariedadesvegetales.toString() === formData.xsemillasidvariedadesvegetales.toString());
                            if (variedad?.variedadespeso1000semillas) {
                              peso1000 = parseFloat(variedad.variedadespeso1000semillas);
                            }
                          }
                        }
                        
                        if (peso1000 && peso1000 > 0) {
                          const estimatedSeeds = Math.round((parseFloat(ocrData.peso_gramos) / peso1000) * 1000);
                          return (
                            <button 
                              type="button"
                              onClick={() => {
                                setFormData((prev: any) => ({ 
                                  ...prev, 
                                  semillasstockinicial: estimatedSeeds.toString(),
                                  semillasstockactual: estimatedSeeds.toString()
                                }));
                                setOcrData((prev: any) => ({ ...prev, peso_gramos: null }));
                              }}
                              style={{ background: '#d97706', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(217,119,6,0.3)' }}
                            >
                              Aplicar (≈ {estimatedSeeds} uds)
                            </button>
                          );
                        }
                        return <span style={{ fontSize: '0.7rem', color: '#b45309', fontStyle: 'italic' }}>Selecciona especie/variedad para calcular.</span>;
                      })()}
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
