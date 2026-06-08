'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { auth } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import Link from 'next/link';
import UserSemillaMediaManager from '@/components/user/UserSemillaMediaManager';
import { getMediaUrl } from '@/lib/media-url';
import '@/components/admin/EspecieForm.css';

export default function EditarSemillaPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const from = searchParams?.get('from');
  const semillaId = params?.id as string;
  
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({
    xsemillasidvariedades: '',
    semillasnumerocoleccion: '',
    semillasorigen: 'cosecha_propia',
    semillaslugarcompra: '',
    semillasmarca: '',
    semillasfecharecoleccion: '',
    semillasfechaenvasado: '',
    semillasfechaadquisicion: '',
    semillasprecio: '',
    semillasfechacaducidad: '',
    semillaslote: '',
    semillasstockinicial: '',
    semillasstockactual: '',
    semillasobservaciones: '',
    semillasdonante: '',
    semillasactivosino: 1,
    semillascompartir: 0
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

  // IA OCR State
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrData, setOcrData] = useState<any>(null);
  const [showOcrModal, setShowOcrModal] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user && user.email) {
        setUserEmail(user.email);
        // Obtener suscripción
        fetch(`/api/auth/profile?email=${encodeURIComponent(user.email)}`)
          .then(r => r.json())
          .then(d => { if (d.profile?.suscripcion) setSuscripcion(d.profile.suscripcion); })
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
    }
  }, [userEmail, semillaId]);

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
    if (catalogo.length > 0 && formData.xsemillasidvariedades && !selectedEspecieId) {
      for (const esp of catalogo) {
        if (esp.variedades?.some((v: any) => v.idvariedades.toString() === formData.xsemillasidvariedades.toString())) {
          setSelectedEspecieId(esp.idespecies.toString());
          break;
        }
      }
    }
  }, [catalogo, formData.xsemillasidvariedades, selectedEspecieId]);

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
            xsemillasidvariedades: semilla.xsemillasidvariedades || '',
            semillasnumerocoleccion: semilla.semillasnumerocoleccion || '',
            semillasorigen: semilla.semillasorigen || 'cosecha_propia',
            semillaslugarcompra: semilla.semillaslugarcompra || '',
            semillasmarca: semilla.semillasmarca || '',
            semillasfecharecoleccion: semilla.semillasfecharecoleccion ? semilla.semillasfecharecoleccion.split('T')[0] : '',
            semillasfechaenvasado: semilla.semillasfechaenvasado ? semilla.semillasfechaenvasado.split('T')[0] : '',
            semillasfechaadquisicion: semilla.semillasfechaadquisicion ? semilla.semillasfechaadquisicion.split('T')[0] : '',
            semillasprecio: semilla.semillasprecio || '',
            semillasfechacaducidad: semilla.semillasfechacaducidad ? semilla.semillasfechacaducidad.split('T')[0] : '',
            semillaslote: semilla.semillaslote || '',
            semillasstockinicial: semilla.semillasstockinicial || '',
            semillasstockactual: semilla.semillasstockactual || '',
            semillasobservaciones: semilla.semillasobservaciones || '',
            semillasdonante: semilla.donante_nombreusuario ? `@${semilla.donante_nombreusuario}` : (semilla.semillasdonante || ''),
            semillasactivosino: semilla.semillasactivosino !== undefined ? semilla.semillasactivosino : 1,
            semillascompartir: semilla.semillascompartir !== undefined ? semilla.semillascompartir : 0
          };
          setFormData(parsed);
          setInitialData(JSON.stringify(parsed));
          setMetaData({
            especiesnombre: semilla.especiesnombre,
            variedad_nombre: semilla.variedad_nombre,
            foto: semilla.foto,
            donante_nombreusuario: semilla.donante_nombreusuario,
            donante_email: semilla.donante_email,
            fechacreacion: semilla.semillasfechacreacion ? new Date(semilla.semillasfechacreacion).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute:'2-digit' }) : null
          });
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
        setInitialData(JSON.stringify(dataToSave));
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

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* ── Navegación ── */}
      <div style={{ marginBottom: '16px', padding: '0 4px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button 
          onClick={() => {
            if (from === 'dashboard') {
              router.push('/dashboard');
            } else {
              router.push('/dashboard/semillas');
            }
          }} 
          style={{ background: 'white', border: '1px solid #cbd5e1', color: '#475569', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          {from === 'dashboard' ? '← Volver al Dashboard' : '← Volver a Inventario'}
        </button>
      </div>

      {/* ── Subheader Integrado ── */}
      <div style={{ background: 'linear-gradient(135deg, #0f766e, #10b981)', borderRadius: '16px', padding: '24px 28px', marginBottom: '24px', color: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '2rem' }}>🌱</span> 
              {metaData.especiesnombre} {metaData.variedad_nombre ? `- ${metaData.variedad_nombre}` : ''} 
              <span style={{ fontSize: '1.2rem', fontWeight: 600, color: '#a7f3d0' }}>(Nº {formData.semillasnumerocoleccion || semillaId})</span>
              
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
              Editor de Semilla en Inventario (Autoguardado activado)
            </p>
          </div>
        </div>
      </div>

      {/* ── Toggles Activo y Compartir ── */}
      {(() => {
        const noStock = formData.semillasstockactual !== '' && Number(formData.semillasstockactual) <= 0;
        const caducada = formData.semillasfechacaducidad && new Date(formData.semillasfechacaducidad) < new Date();
        const disableShare = noStock || caducada;

        return (
          <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
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
                flex: '1 1 min-content'
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
          <span>{formData.semillasactivosino === 1 ? 'Semilla Activa (Disponible)' : 'Semilla Inactiva (Archivada)'}</span>
        </div>

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
                flex: '1 1 min-content',
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
                  ? 'Compartida (Comunidad)' 
                  : (disableShare 
                      ? (noStock && caducada 
                          ? 'Privada (Bloqueo: Sin stock y Caducada)' 
                          : (noStock 
                              ? 'Privada (Bloqueo: Sin stock)' 
                              : 'Privada (Bloqueo: Caducada)')) 
                      : 'Privada (Solo tú)')
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
                  disabled={ocrLoading}
                  style={{
                    position: 'absolute', bottom: '8px', right: '8px', zIndex: 10,
                    background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)',
                    color: 'white', border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '20px', padding: '6px 12px', fontSize: '0.75rem',
                    fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px',
                    cursor: ocrLoading ? 'not-allowed' : 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)', transition: 'all 0.2s'
                  }}
                  title="Extraer datos del sobre con IA"
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(15, 23, 42, 0.9)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(15, 23, 42, 0.7)'}
                >
                  {ocrLoading ? (
                    <span style={{ animation: 'spin 1s linear infinite' }}>⏳</span>
                  ) : (
                    <span>✨</span>
                  )}
                  {ocrLoading ? 'Analizando...' : 'Escanear'}
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

      <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', overflow: 'visible' }}>
        
        {/* HEADER TAB */}
        <div style={{ padding: '0 24px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '24px' }}>
          <div 
            onClick={() => setActiveTab('datos')}
            style={{ padding: '16px 0', borderBottom: activeTab === 'datos' ? '3px solid #0f766e' : '3px solid transparent', color: activeTab === 'datos' ? '#0f766e' : '#64748b', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', transition: 'all 0.2s' }}>
            📋 Datos de la Semilla
          </div>
          <div 
            onClick={() => setActiveTab('fotos')}
            style={{ padding: '16px 0', borderBottom: activeTab === 'fotos' ? '3px solid #0f766e' : '3px solid transparent', color: activeTab === 'fotos' ? '#0f766e' : '#64748b', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', transition: 'all 0.2s' }}>
            📸 Fotos ({photos.filter(p => p.origen === 'usuario').length})
          </div>
        </div>

        {activeTab === 'datos' ? (
          <>
            <div style={{ padding: '32px', display: 'grid', gap: '32px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#475569' }}>Especie</label>
              <select 
                value={selectedEspecieId} 
                onChange={(e) => {
                  const newEspecieId = e.target.value;
                  setSelectedEspecieId(newEspecieId);
                  
                  // Auto-seleccionar la primera variedad disponible para mayor comodidad
                  const esp = catalogo.find(c => c.idespecies.toString() === newEspecieId);
                  if (esp && esp.variedades && esp.variedades.length > 0) {
                    setFormData({ ...formData, xsemillasidvariedades: esp.variedades[0].idvariedades.toString() });
                  } else {
                    setFormData({ ...formData, xsemillasidvariedades: '' });
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
                  <option key={esp.idespecies} value={esp.idespecies.toString()}>
                    {esp.especiesnombre}
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
                  <span style={{ color: formData.xsemillasidvariedades ? '#0f172a' : '#94a3b8' }}>
                    {(() => {
                      if (!selectedEspecieId) return 'Selecciona una variedad...';
                      if (!formData.xsemillasidvariedades) return 'Selecciona una variedad...';
                      const esp = catalogo.find(e => e.idespecies.toString() === selectedEspecieId);
                      const vari = esp?.variedades?.find((v: any) => v.idvariedades.toString() === formData.xsemillasidvariedades.toString());
                      return vari?.variedadesnombre || 'Variedad estándar';
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
                      const vars = catalogo.find(esp => esp.idespecies.toString() === selectedEspecieId)?.variedades || [];
                      const globalVars = vars.filter((v: any) => !v.xvariedadesidusuarios);
                      if (globalVars.length === 0) {
                        return (
                          <div style={{ padding: '10px 12px', color: '#94a3b8', fontStyle: 'italic' }}>
                            No hay variedades disponibles
                          </div>
                        );
                      }
                      return globalVars.map((v: any) => (
                        <div 
                          key={v.idvariedades}
                          onClick={() => {
                            setFormData({ ...formData, xsemillasidvariedades: v.idvariedades.toString() });
                            setIsVariedadOpen(false);
                          }}
                          style={{
                            padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9',
                            background: formData.xsemillasidvariedades?.toString() === v.idvariedades.toString() ? '#f0fdf4' : 'white',
                            color: formData.xsemillasidvariedades?.toString() === v.idvariedades.toString() ? '#166534' : '#334155',
                            fontWeight: formData.xsemillasidvariedades?.toString() === v.idvariedades.toString() ? 600 : 400,
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = formData.xsemillasidvariedades?.toString() === v.idvariedades.toString() ? '#f0fdf4' : 'white')}
                        >
                          {v.variedadesnombre || 'Variedad estándar'}
                        </div>
                      ));
                    })()}
                  </div>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#475569' }}>Número de Colección</label>
              <input type="text" name="semillasnumerocoleccion" value={formData.semillasnumerocoleccion} onChange={handleChange} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#475569' }}>Origen de las Semillas</label>
              <select name="semillasorigen" value={formData.semillasorigen} onChange={handleChange} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem' }}>
                <option value="cosecha_propia">Propia / Extraída</option>
                <option value="intercambio">Intercambio</option>
                <option value="sobre_comprado">Sobre Comprado</option>
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

          {(formData.semillasorigen === 'sobre_comprado' || formData.semillasorigen === 'intercambio') && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', background: '#f8fafc', padding: '24px', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
              
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
                      list="buy-places"
                      type="text" 
                      name="semillaslugarcompra" 
                      placeholder="Ej. Leroy Merlin, Vivero Local" 
                      value={formData.semillaslugarcompra} 
                      onChange={handleChange} 
                      style={{ padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', outline: 'none' }} 
                    />
                    <datalist id="buy-places">
                      <option value="Leroy Merlin" />
                      <option value="Verdecora" />
                      <option value="Vivero local" />
                      <option value="Amazon" />
                      <option value="Lidl" />
                      <option value="Aldi" />
                      <option value="Ferretería local" />
                      <option value="Cooperativa agrícola" />
                    </datalist>
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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#475569' }}>Calculadora (Gramos)</label>
              <input type="number" step="0.01" min="0" placeholder={
                (() => {
                  if (selectedEspecieId) {
                    const especie = catalogo.find(c => c.idespecies.toString() === selectedEspecieId);
                    let peso1000 = especie?.especiespeso1000semillas;
                    if (formData.xsemillasidvariedades && especie?.variedades) {
                      const variedad = especie.variedades.find((v: any) => v.idvariedades.toString() === formData.xsemillasidvariedades.toString());
                      if (variedad?.variedadespeso1000semillas) {
                        peso1000 = variedad.variedadespeso1000semillas;
                      }
                    }
                    if (peso1000) {
                      return `1g ≈ ${Math.round(1000 / parseFloat(peso1000))} uds`;
                    }
                  }
                  return "Ej. 1.5";
                })()
              } onChange={(e) => {
                const gramos = parseFloat(e.target.value);
                if (gramos > 0 && selectedEspecieId) {
                  const especie = catalogo.find(c => c.idespecies.toString() === selectedEspecieId);
                  let peso1000 = especie?.especiespeso1000semillas;
                  if (formData.xsemillasidvariedades && especie?.variedades) {
                    const variedad = especie.variedades.find((v: any) => v.idvariedades.toString() === formData.xsemillasidvariedades.toString());
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
              <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#475569' }}>Stock Inicial (Unidades)</label>
              <input type="number" min="0" name="semillasstockinicial" value={formData.semillasstockinicial} onChange={handleChange} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#16a34a' }}>Stock Actual Disponible</label>
              <input type="number" min="0" name="semillasstockactual" value={formData.semillasstockactual} onChange={handleChange} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #16a34a', fontSize: '1rem', background: '#f0fdf4' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#475569' }}>Lote / Identificador</label>
              <input type="text" name="semillaslote" value={formData.semillaslote} onChange={handleChange} placeholder="Ej. L-2026-A" style={{ padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
            {(formData.semillasorigen === 'cosecha_propia' || formData.semillasorigen === 'intercambio') && (
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
              <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#475569' }}>Fecha de Adquisición</label>
              <input type="date" name="semillasfechaadquisicion" value={formData.semillasfechaadquisicion} onChange={handleChange} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem' }} />
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
                 </>
        ) : (
          <UserSemillaMediaManager 
            semillaId={semillaId} 
            userEmail={userEmail!}
            suscripcion={suscripcion}
            initialPhotos={photos}
            onMediaChange={() => loadPhotos()}
          />
        )}

      </div>
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
                      ['semillasmarca', 'semillaslote', 'semillasfechaenvasado', 'semillasfechacaducidad', 'semillasobservaciones'].forEach(k => {
                        if (ocrData[k]) updates[k] = ocrData[k];
                      });

                      let newEspecieId = selectedEspecieId;
                      if (ocrData.especie_detectada) {
                        const detected = ocrData.especie_detectada.toLowerCase();
                        for (const esp of catalogo) {
                          const vMatch = esp.variedades?.find((v: any) => {
                            const vNombre = v.variedadesnombre?.toLowerCase() || '';
                            return vNombre && (vNombre.includes(detected) || detected.includes(vNombre));
                          });
                          if (vMatch && vMatch.idvariedades) {
                            updates.xsemillasidvariedades = vMatch.idvariedades.toString();
                            newEspecieId = esp.idespecies?.toString();
                            break;
                          }
                        }
                      }

                      if (ocrData.peso_gramos || ocrData.gramos_detectados) {
                        const gramosVal = ocrData.peso_gramos || ocrData.gramos_detectados;
                        let peso1000: number | null = null;
                        if (newEspecieId) {
                          const especie = catalogo.find(c => c.idespecies?.toString() === newEspecieId);
                          peso1000 = parseFloat(especie?.especiespeso1000semillas || '0');
                          const targetVariedadId = updates.xsemillasidvariedades || formData.xsemillasidvariedades;
                          if (targetVariedadId && especie?.variedades) {
                            const variedad = especie.variedades.find((v: any) => v.idvariedades?.toString() === targetVariedadId?.toString());
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
                  { key: 'semillasfechaenvasado', label: 'Envasado' },
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
                        <strong style={{ display: 'block', marginBottom: '4px' }}>🌱 Variedad sugerida por IA:</strong>
                        {ocrData.especie_detectada}
                      </div>
                      {(() => {
                        let matchedVariety: any = null;
                        let matchedEspecieId: string | null = null;
                        const detected = ocrData.especie_detectada.toLowerCase();
                        for (const esp of catalogo) {
                          const vMatch = esp.variedades?.find((v: any) => 
                            v.variedadesnombre.toLowerCase().includes(detected) || 
                            detected.includes(v.variedadesnombre.toLowerCase())
                          );
                          if (vMatch) {
                            matchedVariety = vMatch;
                            matchedEspecieId = esp.idespecies.toString();
                            break;
                          }
                        }
                        
                        if (matchedVariety) {
                          return (
                            <button 
                              type="button"
                              onClick={() => {
                                setSelectedEspecieId(matchedEspecieId!);
                                setFormData((prev: any) => ({ ...prev, xsemillasidvariedades: matchedVariety.idvariedades.toString() }));
                                setOcrData((prev: any) => ({ ...prev, especie_detectada: null }));
                              }}
                              style={{ background: '#10b981', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(16,185,129,0.3)' }}
                            >
                              Aplicar ({matchedVariety.variedadesnombre})
                            </button>
                          );
                        }
                        return <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontStyle: 'italic' }}>Sin coincidencia en catálogo</span>;
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
                          const especie = catalogo.find(c => c.idespecies.toString() === selectedEspecieId);
                          peso1000 = especie?.especiespeso1000semillas;
                          if (formData.xsemillasidvariedades && especie?.variedades) {
                            const variedad = especie.variedades.find((v: any) => v.idvariedades.toString() === formData.xsemillasidvariedades.toString());
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
                          const especie = catalogo.find(c => c.idespecies.toString() === selectedEspecieId);
                          peso1000 = parseFloat(especie?.especiespeso1000semillas || '0');
                          if (formData.xsemillasidvariedades && especie?.variedades) {
                            const variedad = especie.variedades.find((v: any) => v.idvariedades.toString() === formData.xsemillasidvariedades.toString());
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
