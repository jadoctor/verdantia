'use client';

import React, { useEffect, useState, useCallback, useRef, Suspense } from 'react';
import { auth } from '@/lib/firebase/config';
import { onAuthStateChanged, sendPasswordResetEmail } from 'firebase/auth';
import { useRouter, useSearchParams } from 'next/navigation';
import { getMediaUrl } from '@/lib/media-url';
import './perfil.css';

interface UserProfile {
  id: number;
  nombre: string;
  apellidos: string;
  email: string;
  roles: string;
  icono: string | null;
  codigoPostal: string | null;
  poblacion: string | null;
  estadoCuenta: string;
  nombreUsuario: string | null;
  pais: string | null;
  fechaNacimiento: string | null;
  suscripcion?: string;
  esPrueba?: boolean;
  fechaCaducidadSuscripcion?: string | null;
  passkeysCount?: number;
}

const getMaxPhotos = (plan: string = 'Gratuito') => {
  const p = (plan || '').toLowerCase();
  if (p === 'premium') return 5;
  if (p === 'avanzado' || p === 'pro') return 3;
  if (p === 'esencial' || p === 'plus') return 2;
  return 1; // Gratuito / Free / visitante / sin plan
};

const AVATAR_ICONS = [
  '🌱','🌿','🍀','🍃','🌾','🌻','🌷','🌹','🌵','🌴','🍄','🪴',
  '🐝','🦋','🐞','🐛','🐌','🐇','🦉','🐦','🦆','🐓','🐢','🦔',
  '🐸','🐟','🐑','🐐','🐄','🐎','🐕','🐈','🦜','🦚','🦢'
];

const MOTIVOS_BAJA = [
  'No encuentro lo que busco',
  'Dudas sobre la privacidad',
  'Faltan funcionalidades',
  'He encontrado otra solución',
  'El precio de los planes es elevado',
  'Recibo demasiadas notificaciones',
  'Solo quería probar la aplicación',
  'Voy a crear una cuenta nueva',
  'Problemas técnicos constantes',
  'Otro'
];

const PAISES = [
  'España', 'Andorra', 'Argentina', 'Bolivia', 'Brasil', 'Chile', 'Colombia',
  'Costa Rica', 'Cuba', 'Ecuador', 'El Salvador', 'Estados Unidos', 'Guatemala',
  'Honduras', 'México', 'Nicaragua', 'Panamá', 'Paraguay', 'Perú', 'Portugal',
  'Puerto Rico', 'República Dominicana', 'Uruguay', 'Venezuela', 'Otro...'
];

function PerfilContent() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [nombre, setNombre] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [pais, setPais] = useState('');
  const [codigoPostal, setCodigoPostal] = useState('');
  const [poblacion, setPoblacion] = useState('');
  const [icono, setIcono] = useState('');
  const [sexo, setSexo] = useState('');
  const [editableEmail, setEditableEmail] = useState('');
  const [domicilio, setDomicilio] = useState('');
  const [telefono, setTelefono] = useState('');
  const [tipoCalendario, setTipoCalendario] = useState('Normal');
  const [avisosConfig, setAvisosConfig] = useState<any>(null);
  const [avisosLoading, setAvisosLoading] = useState(false);

  // Location autocomplete
  const [cpSuggestions, setCpSuggestions] = useState<{cp: string; ciudad: string}[]>([]);
  const [ciudadSuggestions, setCiudadSuggestions] = useState<{cp: string; ciudad: string}[]>([]);
  const [showCpDropdown, setShowCpDropdown] = useState(false);
  const [showCiudadDropdown, setShowCiudadDropdown] = useState(false);
  const [showCpDropdownOpt, setShowCpDropdownOpt] = useState(false);
  const [showCiudadDropdownOpt, setShowCiudadDropdownOpt] = useState(false);
  const cpTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const ciudadTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ── Modales de Plan ──
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showCompareModal, setShowCompareModal] = useState(false);


  const searchLocation = async (query: string, type: 'cp' | 'ciudad', zone: 'mandatory' | 'optional' = 'mandatory') => {
    try {
      const res = await fetch(`/api/location/search?q=${encodeURIComponent(query)}&type=${type}`);
      const data = await res.json();
      if (type === 'cp') { 
        setCpSuggestions(data.results); 
        if (zone === 'mandatory') setShowCpDropdown(data.results.length > 0);
        else setShowCpDropdownOpt(data.results.length > 0);
      } else { 
        setCiudadSuggestions(data.results); 
        if (zone === 'mandatory') setShowCiudadDropdown(data.results.length > 0);
        else setShowCiudadDropdownOpt(data.results.length > 0);
      }
    } catch { /* silently fail */ }
  };


  // Photos
  const [photos, setPhotos] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // Photo Editor Modal
  const [editingPhoto, setEditingPhoto] = useState<any>(null);
  const [editorX, setEditorX] = useState(50);
  const [editorY, setEditorY] = useState(38);
  const [editorZoom, setEditorZoom] = useState(100);
  const [editorBrightness, setEditorBrightness] = useState(100);
  const [editorContrast, setEditorContrast] = useState(100);
  const [editorStyle, setEditorStyle] = useState('');
  const [editorInitialState, setEditorInitialState] = useState('');
  const [photoEditorSaveStatus, setPhotoEditorSaveStatus] = useState<'idle' | 'saving' | 'no-changes'>('idle');

  // Privacy & Danger Zone
  const [privacidadAceptada, setPrivacidadAceptada] = useState(true);
  const [motivoBaja, setMotivoBaja] = useState('');
  const [motivoLibre, setMotivoLibre] = useState('');

  // Password
  const [passwordResetSent, setPasswordResetSent] = useState(false);

  // Gamificación
  const [unlockedAchievement, setUnlockedAchievement] = useState<string | null>(null);
  const [lostAchievement, setLostAchievement] = useState<string | null>(null);
  const [isUnderage, setIsUnderage] = useState<boolean>(false);
  const [achievementsHistory, setAchievementsHistory] = useState<any[]>([]);
  const [geoData, setGeoData] = useState<any>(null);
  const [zonaClimatica, setZonaClimatica] = useState('');

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  }, []);

  // ── Cargar fotos del usuario ──
  const loadPhotos = useCallback(async (userId: number) => {
    try {
      const res = await fetch(`/api/perfil/photos?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setPhotos(data.photos || []);
      }
    } catch (err: any) {
      console.error('Error cargando fotos:', err);
    }
  }, []);

  // ── Cargar historial de logros ──
  const loadAchievementsHistory = useCallback(async (userId: number) => {
    try {
      const res = await fetch(`/api/perfil/logros?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setAchievementsHistory(data.logros || []);
      }
    } catch (err: any) {
      console.error('Error cargando historial de logros:', err);
    }
  }, []);

  // ── Cargar Avisos ──
  const loadAvisos = useCallback(async (email: string) => {
    setAvisosLoading(true);
    try {
      const res = await fetch(`/api/perfil/avisos?email=${encodeURIComponent(email)}`);
      if (res.ok) {
        const data = await res.json();
        setAvisosConfig(data);
      }
    } catch (err) {
      console.error('Error cargando avisos:', err);
    } finally {
      setAvisosLoading(false);
    }
  }, []);

  const toggleAvisoMaestro = async (avisoId: number, currentVal: number) => {
    if (!profile || !avisosConfig) return;
    const newVal = currentVal === 1 ? 0 : 1;
    setAvisosConfig((prev: any) => ({ ...prev, userPrefs: { ...prev.userPrefs, [avisoId]: newVal } }));
    try {
      await fetch('/api/perfil/avisos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: profile.email, tipo: 'maestro', avisoId, activo: newVal })
      });
      // no mostramos toast para no saturar si hacen click rápido
    } catch { console.error('Error'); }
  };

  const toggleAvisoLabor = async (laborId: number, currentVal: number) => {
    if (!profile || !avisosConfig) return;
    const newVal = currentVal === 1 ? 0 : 1;
    setAvisosConfig((prev: any) => ({ ...prev, userLaboresPrefs: { ...prev.userLaboresPrefs, [laborId]: newVal } }));
    try {
      await fetch('/api/perfil/avisos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: profile.email, tipo: 'labor', laborId, activo: newVal })
      });
    } catch { console.error('Error'); }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.push('/login'); return; }

      try {
        const res = await fetch(`/api/auth/profile?email=${encodeURIComponent(user.email!)}`);
        if (res.ok) {
          const data = await res.json();
          const p = data.profile;
          setProfile(p);
          setNombre(p.nombre || '');
          setApellidos(p.apellidos || '');
          setNombreUsuario(p.nombreUsuario || '');
          let fn = p.fechaNacimiento || '';
          if (fn) {
            try {
              const d = new Date(fn);
              if (!isNaN(d.getTime())) {
                const yyyy = d.getFullYear();
                const mm = String(d.getMonth() + 1).padStart(2, '0');
                const dd = String(d.getDate()).padStart(2, '0');
                fn = `${yyyy}-${mm}-${dd}`;
              }
            } catch (e) {}
          }
          setFechaNacimiento(fn);
          setPais(p.pais || '');
          setCodigoPostal(p.codigoPostal || '');
          setPoblacion(p.poblacion || '');
          setIcono(p.icono || '');
          setZonaClimatica(p.zonaClimatica || '');
          setSexo(p.sexo || '');
          setEditableEmail(data.profile.email || '');
          setDomicilio(data.profile.domicilio || '');
          setTelefono(data.profile.telefono || '');
          setTipoCalendario(data.profile.tipoCalendario || 'Normal');
          loadPhotos(p.id);
          loadAchievementsHistory(p.id);
          loadAvisos(p.email);

          // ── Check degradación de plan (lazy) ──
          // Se ejecuta en segundo plano; si el plan ha caducado, lo degrada y avisa
          if (p.id && p.suscripcion && p.suscripcion.toLowerCase() !== 'gratuito') {
            fetch('/api/auth/check-plan-degradation', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId: p.id }),
            }).then(r => r.json()).then(result => {
              if (result.degraded && result.newPlan) {
                setProfile(prev => prev ? { ...prev, suscripcion: result.newPlan, esPrueba: result.newPlan !== 'Gratuito' } : null);
                showToast(`⏳ Tu plan ha cambiado a ${result.newPlan}. ${result.newPlan === 'Gratuito' ? 'El periodo de prueba ha finalizado.' : 'Siguiente mes: ' + result.newPlan + '.'}`);
              }
            }).catch(() => { /* No bloquear si falla */ });
          }
        }
      } catch (err: any) {
        console.error('Error cargando perfil:', err);
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [router, loadPhotos]);

  // ── Manejar query param de achievement (viene de verificación) ──
  useEffect(() => {
    const achievement = searchParams.get('achievement');
    const underage = searchParams.get('underage');
    if (achievement) {
      setUnlockedAchievement(achievement);
      if (underage === '1') setIsUnderage(true);
      // Limpiar URL sin recargar
      window.history.replaceState({}, '', '/dashboard/perfil');
      // Recargar logros e info del perfil
      if (profile?.id) {
        loadAchievementsHistory(profile.id);
      }
    }
  }, [searchParams, profile?.id]);

  // ── Subir foto ──
  const uploadPhoto = async (file: File) => {
    if (!profile) return;
    
    const maxPhotos = getMaxPhotos(profile.suscripcion);
    if (photos.length >= maxPhotos) {
      showToast(`⚠️ Límite alcanzado: Tu plan ${profile.suscripcion || 'Gratuito'} permite un máximo de ${maxPhotos} foto(s).`);
      return;
    }

    if (!file.type.startsWith('image/')) {
      showToast('⚠️ Solo se permiten imágenes.');
      return;
    }
    setUploading(true);
    
    const isMobile = typeof window !== 'undefined' && (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768);

    try {
      // ── Paso 1: Eliminar fondo (Solo en PC o si no es móvil) ──
      let processedBlob: Blob = file;
      
      if (isMobile) {
        showToast('🚀 Subida rápida móvil: saltando limpieza de fondo...');
      } else {
        showToast('🤖 IA procesando: quitando fondo...');
        try {
          const { removeBackground } = await import('@imgly/background-removal');
          
          // Timeout de 15 segundos para la IA
          const resultBlob = await Promise.race([
            removeBackground(file, { output: { format: 'image/png' } }),
            new Promise<null>((_, reject) => setTimeout(() => reject(new Error('timeout')), 15000))
          ]);

          if (resultBlob) {
            // Poner fondo blanco en lugar de transparente
            const img = new Image();
            const blobUrl = URL.createObjectURL(resultBlob);
            await new Promise<void>((resolve, reject) => {
              img.onload = () => resolve();
              img.onerror = () => reject(new Error('Error cargando imagen procesada'));
              img.src = blobUrl;
            });
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d')!;
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            URL.revokeObjectURL(blobUrl);
            processedBlob = await new Promise<Blob>((resolve) =>
              canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.92)
            );
            showToast('✅ Fondo eliminado correctamente');
          }
        } catch (bgErr: any) {
          console.warn('[BG Removal] No disponible o lento, usando original:', bgErr);
          showToast(bgErr.message === 'timeout' ? '⏰ IA demasiado lenta, usando original...' : '⚠️ IA no disponible, usando original...');
          processedBlob = file;
        }
      }

      // ── Paso 2: Detectar cara para centrado automático + zoom ──
      let faceX = 50, faceY = 38, autoZoom = 100;
      try {
        const faceResult = await detectFaceCenter(processedBlob);
        if (faceResult) {
          faceX = faceResult.x;
          faceY = faceResult.y;

          // Calcular zoom automático según la orientación de la imagen
          const tmpImg = new Image();
          const tmpUrl = URL.createObjectURL(processedBlob);
          await new Promise<void>((r) => { tmpImg.onload = () => r(); tmpImg.src = tmpUrl; });
          URL.revokeObjectURL(tmpUrl);
          const ratio = tmpImg.naturalWidth / tmpImg.naturalHeight;
          if (ratio > 1.3) {
            autoZoom = Math.min(200, Math.round(ratio * 110));
          } else if (ratio > 1.05) {
            autoZoom = Math.round(ratio * 105);
          }
          showToast(`🎯 Cara detectada (${Math.round(faceX)}%, ${Math.round(faceY)}%) zoom: ${autoZoom}%`);
        }
      } catch (faceErr: any) {
        console.warn('[FaceDetect] Error en detección facial, usando defaults:', faceErr);
        /* usar defaults: centrado 50/38, zoom 100 */
      }


      // ── Paso 3: Subir la imagen (siempre se ejecuta) directamente a Storage ──
      const ext = (file.name.match(/\.\w+$/) || ['.jpg'])[0];
      const filename = `usuario_${profile.id}_${Date.now()}${ext}`;
      const storagePath = `uploads/usuario/${filename}`;

      const { storage } = await import('@/lib/firebase/config');
      const { ref, uploadBytes } = await import('firebase/storage');
      const storageRef = ref(storage, storagePath);
      
      showToast('☁️ Subiendo imagen a la nube...');
      await uploadBytes(storageRef, processedBlob, {
        cacheControl: 'public, max-age=31536000',
        contentType: processedBlob.type
      });

      // Guardar la referencia en MySQL
      const res = await fetch('/api/perfil/photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: profile.id,
          storagePath,
          faceX: Math.round(faceX),
          faceY: Math.round(faceY),
          faceZoom: autoZoom,
          nombreOriginal: file.name
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast('✅ Foto subida correctamente');
        loadPhotos(profile.id);
      } else {
        showToast('❌ Error: ' + data.error);
      }
    } catch (err: any) {
      showToast('❌ Error subiendo foto: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  /**
   * Detección de cara: FaceDetector API (Chrome/Edge) + fallback skin-tone canvas
   * Portado fielmente del legacy perfil.php
   */
  const detectFaceCenter = async (imageSource: Blob | File): Promise<{x: number, y: number} | null> => {
    return new Promise(async (resolve) => {
      try {
        const img = new Image();
        const url = URL.createObjectURL(imageSource);
        img.src = url;
        await new Promise<void>((r, rej) => { img.onload = () => r(); img.onerror = () => rej(); });
        URL.revokeObjectURL(url);

        if (!img.naturalWidth || !img.naturalHeight) { resolve(null); return; }

        // 1) FaceDetector API nativa (Chrome/Edge)
        if (typeof (window as any).FaceDetector !== 'undefined') {
          try {
            const detector = new (window as any).FaceDetector({ maxDetectedFaces: 5, fastMode: true });
            const faces = await detector.detect(img);
            if (faces && faces.length > 0) {
              let best = faces[0];
              for (const f of faces) {
                if (f.boundingBox.width * f.boundingBox.height > best.boundingBox.width * best.boundingBox.height) best = f;
              }
              const bb = best.boundingBox;
              const cx = ((bb.x + bb.width / 2) / img.naturalWidth) * 100;
              const cy = ((bb.y + bb.height / 2) / img.naturalHeight) * 100;
              console.log(`[FaceDetect] API nativa: cara en (${cx.toFixed(1)}%, ${cy.toFixed(1)}%)`);
              resolve({ x: Math.max(0, Math.min(100, cx)), y: Math.max(0, Math.min(100, cy)) });
              return;
            }
          } catch { console.log('[FaceDetect] FaceDetector API falló, usando fallback.'); }
        }

        // 2) Fallback: detección por tonos de piel con canvas
        const canvas = document.createElement('canvas');
        const maxDim = 400;
        const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
        canvas.width = Math.round(img.naturalWidth * scale);
        canvas.height = Math.round(img.naturalHeight * scale);
        const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const w = canvas.width, h = canvas.height;
        const step = Math.max(2, Math.floor(Math.min(w, h) / 100));

        let sumX = 0, sumY = 0, countSkin = 0;
        const skinPoints: [number, number, number][] = [];

        for (let y = 0; y < h; y += step) {
          for (let x = 0; x < w; x += step) {
            const idx = (y * w + x) * 4;
            const r = data[idx], g = data[idx + 1], b = data[idx + 2];
            const isSkin = (r > 95 && g > 40 && b > 20 &&
              (Math.max(r, g, b) - Math.min(r, g, b)) > 15 &&
              Math.abs(r - g) > 15 && r > g && r > b);
            if (isSkin) {
              const topBias = 1.0 - (y / Math.max(1, h));
              const weight = Math.max(0.15, topBias * topBias);
              sumX += x * weight; sumY += y * weight; countSkin += weight;
              skinPoints.push([x, y, weight]);
            }
          }
        }

        if (countSkin < 10) { resolve(null); return; }

        let faceX = sumX / countSkin, faceY = sumY / countSkin;
        skinPoints.sort((a, b) => a[1] - b[1]);
        const takeTop = Math.max(8, Math.floor(skinPoints.length * 0.28));
        const topSlice = skinPoints.slice(0, takeTop);
        let stX = 0, stY = 0, stW = 0;
        for (const p of topSlice) { const pw = p[2] * 1.25; stX += p[0] * pw; stY += p[1] * pw; stW += pw; }
        const topFaceX = stW > 0 ? stX / stW : faceX;
        const topFaceY = stW > 0 ? stY / stW : faceY;

        const finalX = ((faceX * 0.35 + topFaceX * 0.65) / w) * 100;
        const finalY = ((faceY * 0.25 + topFaceY * 0.75) / h) * 100;

        console.log(`[FaceDetect] Canvas skin-tone: cara en (${finalX.toFixed(1)}%, ${finalY.toFixed(1)}%)`);
        resolve({ x: Math.max(0, Math.min(100, finalX)), y: Math.max(0, Math.min(100, finalY)) });
      } catch (err: any) {
        console.warn('[FaceDetect] Error:', err);
        resolve(null);
      }
    });
  };

  // ── Marcar foto como preferida ──
  const setPhotoPrimary = async (photoId: number) => {
    if (!profile) return;

    // 1. Reordenar localmente (la elegida al principio)
    const targetPhoto = photos.find(p => p.id === photoId);
    const previousPhotos = [...photos]; // Guardamos copia para revertir si falla
    if (targetPhoto) {
      const newPhotos = [
        { ...targetPhoto, esPrincipal: true },
        ...photos.filter(p => p.id !== photoId).map(p => ({ ...p, esPrincipal: false }))
      ];
      setPhotos(newPhotos);
    }

    try {
      const res = await fetch('/api/perfil/photos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoId, userId: profile.id, action: 'setPrincipal' })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        console.error('[Photos] Error al cambiar foto principal:', data);
        showToast('❌ Error al guardar foto preferida: ' + (data.error || 'Error desconocido'));
        setPhotos(previousPhotos); // Revertir cambio local
        return;
      }

      showToast('⭐ Foto preferida actualizada');
      
      // Notificar al Layout global para actualización inmediata de la foto
      if (targetPhoto) {
        const updateData = { 
          fotoPreferida: targetPhoto.ruta,
          fotoPreferidaMeta: targetPhoto.resumen,
          icono: null 
        };
        const channel = new BroadcastChannel('verdantia_profile');
        channel.postMessage(updateData);
        channel.close();
        window.dispatchEvent(new CustomEvent('profile_updated', { detail: updateData }));
      }
    } catch (err: any) {
      console.error('[Photos] Error de red al cambiar foto principal:', err);
      showToast('❌ Error de conexión al guardar foto preferida');
      setPhotos(previousPhotos); // Revertir cambio local
    }
  };

  // ── Eliminar foto ──
  const deletePhoto = async (photoId: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta foto?')) return;
    try {
      await fetch(`/api/perfil/photos?photoId=${photoId}`, { method: 'DELETE' });
      showToast('🗑️ Foto eliminada');
      if (profile) loadPhotos(profile.id);
    } catch { /* silencioso */ }
  };

  // ── Drag & Drop handlers ──
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragOver(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragOver(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadPhoto(file);
  };

  // ── Drag & Drop de fotos (reordenar) ──
  const handlePhotoDragStart = (e: React.DragEvent, id: number) => {
    setDraggingId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handlePhotoDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handlePhotoDrop = async (e: React.DragEvent, targetId: number) => {
    e.preventDefault();
    if (draggingId === null || draggingId === targetId) return;

    const sourceIdx = photos.findIndex(p => p.id === draggingId);
    const targetIdx = photos.findIndex(p => p.id === targetId);
    if (sourceIdx === -1 || targetIdx === -1) return;

    // Crear copia y reordenar
    const newPhotos = [...photos];
    const [moved] = newPhotos.splice(sourceIdx, 1);
    newPhotos.splice(targetIdx, 0, moved);

    // Guardar el valor original ANTES de mutar
    const wasAlreadyPrimary = moved.esPrincipal;

    // Si la que ha caído en primer lugar es nueva, la hacemos principal localmente
    if (targetIdx === 0) {
      newPhotos.forEach(p => p.esPrincipal = (p.id === moved.id));
    }

    // Actualizar estado local inmediatamente
    setPhotos(newPhotos);
    setDraggingId(null);

    // Si la que ha caído en primer lugar no era la principal, avisar al servidor
    if (targetIdx === 0 && !wasAlreadyPrimary) {
      showToast('⭐️ Cambiando foto principal...');
      await setPhotoPrimary(moved.id);
    }
  };

  // ── Filtros de estilo (portados del legacy) ──
  const STYLE_FILTERS: Record<string, string> = {
    '': 'none',
    comic: 'contrast(1.45) saturate(1.55) brightness(1.08)',
    manga: 'grayscale(1) contrast(1.85) brightness(1.1)',
    watercolor: 'saturate(1.35) contrast(0.88) brightness(1.14)',
    sketch: 'grayscale(1) contrast(2.2) brightness(1.18)',
    pop: 'saturate(1.95) contrast(1.3) brightness(1.06)',
    vintage: 'sepia(0.65) contrast(1.08) saturate(0.78) brightness(1.03)',
    cinematic: 'contrast(1.22) saturate(0.72) hue-rotate(338deg) brightness(0.98)',
    hdr: 'contrast(1.35) saturate(1.3) brightness(1.07)'
  };

  // ── Abrir editor de foto ──
  const openPhotoEditor = (photo: any) => {
    try {
      const meta = JSON.parse(photo.resumen || '{}');
      const initial = {
        x: meta.profile_object_x ?? 50,
        y: meta.profile_object_y ?? 38,
        zoom: meta.profile_object_zoom ?? 100,
        brightness: meta.profile_brightness ?? 100,
        contrast: meta.profile_contrast ?? 100,
        style: meta.profile_style ?? ''
      };
      setEditorX(initial.x);
      setEditorY(initial.y);
      setEditorZoom(initial.zoom);
      setEditorBrightness(initial.brightness);
      setEditorContrast(initial.contrast);
      setEditorStyle(initial.style);
      setEditorInitialState(JSON.stringify(initial));
    } catch {
      setEditorX(50); setEditorY(38); setEditorZoom(100); 
      setEditorBrightness(100); setEditorContrast(100); setEditorStyle('');
      setEditorInitialState(JSON.stringify({x: 50, y: 38, zoom: 100, brightness: 100, contrast: 100, style: ''}));
    }
    setEditingPhoto(photo);
  };

  // ── Guardar edición de foto ──
  const savePhotoEdits = async () => {
    if (!editingPhoto || !profile) return;
    
    const current = {
      x: editorX, y: editorY, zoom: editorZoom, 
      brightness: editorBrightness, contrast: editorContrast, style: editorStyle
    };
    
    if (JSON.stringify(current) === editorInitialState) {
      setPhotoEditorSaveStatus('no-changes');
      setTimeout(() => {
        setEditingPhoto(null);
        setPhotoEditorSaveStatus('idle');
      }, 1500);
      return;
    }

    setPhotoEditorSaveStatus('saving');
    const resumen = JSON.stringify({
      profile_object_x: editorX,
      profile_object_y: editorY,
      profile_object_zoom: editorZoom,
      profile_brightness: editorBrightness,
      profile_contrast: editorContrast,
      profile_style: editorStyle
    });
    try {
      await fetch('/api/perfil/photos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoId: editingPhoto.id, userId: profile.id, action: 'updateMeta', resumen })
      });
      showToast('✅ Ajustes de foto guardados');
      setEditingPhoto(null);
      loadPhotos(profile.id);
    } catch { 
      showToast('❌ Error guardando ajustes'); 
    } finally {
      setPhotoEditorSaveStatus('idle');
    }
  };

  // ── Auto-centrar cara desde el editor ──
  const autoCenterFromEditor = async () => {
    if (!editingPhoto) return;
    showToast('🎯 Detectando cara...');
    try {
      const photoUrl = getMediaUrl(editingPhoto.ruta);
      const resp = await fetch(photoUrl);
      const blob = await resp.blob();
      const face = await detectFaceCenter(blob);
      if (face) {
        setEditorX(Math.round(face.x));
        setEditorY(Math.round(face.y));
        showToast(`✅ Cara centrada en (${Math.round(face.x)}%, ${Math.round(face.y)}%)`);
      } else {
        showToast('⚠️ No se detectó cara en esta imagen');
      }
    } catch { showToast('❌ Error en detección facial'); }
  };

  // ── Drag-to-Pan en el editor de fotos ──
  const editorDragRef = React.useRef<{ dragging: boolean; startX: number; startY: number; startPosX: number; startPosY: number }>({
    dragging: false, startX: 0, startY: 0, startPosX: 50, startPosY: 38
  });

  const onEditorMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    editorDragRef.current = { dragging: true, startX: e.clientX, startY: e.clientY, startPosX: editorX, startPosY: editorY };
    const onMove = (ev: MouseEvent) => {
      if (!editorDragRef.current.dragging) return;
      const dx = ev.clientX - editorDragRef.current.startX;
      const dy = ev.clientY - editorDragRef.current.startY;
      // Sensibilidad proporcional al zoom
      const sensitivity = 0.15 * (100 / Math.max(editorZoom, 100));
      setEditorX(Math.max(0, Math.min(100, editorDragRef.current.startPosX - dx * sensitivity)));
      setEditorY(Math.max(0, Math.min(100, editorDragRef.current.startPosY - dy * sensitivity)));
    };
    const onUp = () => {
      editorDragRef.current.dragging = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const onEditorTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    editorDragRef.current = { dragging: true, startX: t.clientX, startY: t.clientY, startPosX: editorX, startPosY: editorY };
  };

  const onEditorTouchMove = (e: React.TouchEvent) => {
    if (!editorDragRef.current.dragging) return;
    const t = e.touches[0];
    const dx = t.clientX - editorDragRef.current.startX;
    const dy = t.clientY - editorDragRef.current.startY;
    const sensitivity = 0.15 * (100 / Math.max(editorZoom, 100));
    setEditorX(Math.max(0, Math.min(100, editorDragRef.current.startPosX - dx * sensitivity)));
    setEditorY(Math.max(0, Math.min(100, editorDragRef.current.startPosY - dy * sensitivity)));
  };

  // ── Auto-save: Icono (al hacer clic, se guarda solo) ──
  const autoSaveIcon = async (newIcon: string | null) => {
    if (!profile) return;
    setIcono(newIcon || '');
    
    // Notificar al Layout global para que actualice el header/sidebar al instante
    const channel = new BroadcastChannel('verdantia_profile');
    channel.postMessage({ icono: newIcon });
    window.dispatchEvent(new CustomEvent('profile_updated', { detail: { icono: newIcon } }));

    try {
      await fetch('/api/perfil', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: profile.email, icono: newIcon })
      });
      showToast(newIcon ? '✅ Icono de perfil actualizado' : '✅ Icono eliminado. Ahora se mostrará tu foto.');
    } catch { /* silencioso */ }
  };

  // ── Auto-save: Población (al salir del campo) ──
  // ── Auto-save para múltiples campos a la vez (ej: ciudad + código postal) ──
  const autoSaveMultiple = async (fields: Record<string, any>) => {
    if (!profile) return;
    try {
      await fetch('/api/perfil', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: profile.email, ...fields })
      });
      showToast('✅ Guardado automáticamente');
    } catch { /* silencioso */ }
  };

  // ── Auto-save genérico para campos obligatorios ──
  const autoSaveField = async (fieldName: string, value: string) => {
    if (!profile) return;
    try {
      const res = await fetch('/api/perfil', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: profile.email, [fieldName]: value })
      });
      const data = await res.json();
      if (data.success) {
        showToast('✅ Guardado automáticamente');
        const channel = new BroadcastChannel('verdantia_profile');
        channel.postMessage({ [fieldName]: value });
        window.dispatchEvent(new CustomEvent('profile_updated', { detail: { [fieldName]: value } }));
      } else if (data.error) {
        showToast('❌ ' + data.error);
      }
    } catch { /* silencioso */ }
  };

  // ── Auto-save: Sexo (al cambiar el desplegable) ──
  const handleSexoChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSexo = e.target.value;
    setSexo(newSexo);
    await autoSaveField('sexo', newSexo);
  };

  // ── Guardar campos opcionales del perfil ──
  const handleSave = async () => {
    if (!profile) return;
    if (!privacidadAceptada) {
      showToast('⚠️ Debes aceptar la Política de Privacidad para guardar.');
      return;
    }
    setSaving(true);
    try {
      const updates = { apellidos, nombreUsuario, poblacion, domicilio, telefono };
      const res = await fetch('/api/perfil', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: profile.email, ...updates })
      });
      const data = await res.json();
      if (data.success) {
        showToast('✅ Perfil actualizado correctamente');
        const channel = new BroadcastChannel('verdantia_profile');
        channel.postMessage(updates);
        window.dispatchEvent(new CustomEvent('profile_updated', { detail: updates }));
      } else {
        showToast('❌ Error: ' + (data.error || 'Algo salió mal'));
      }
    } catch (err: any) {
      showToast('❌ Error de conexión: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Restablecer contraseña via Firebase ──
  const handlePasswordReset = async () => {
    if (!profile?.email) return;
    try {
      await sendPasswordResetEmail(auth, profile.email);
      setPasswordResetSent(true);
      showToast('📧 Email de restablecimiento enviado a ' + profile.email);
    } catch (err: any) {
      showToast('❌ Error al enviar email: ' + err.message);
    }
  };

  
  const handleRegisterPasskey = async () => {
    if (!auth.currentUser?.email) return;
    try {
      const { startRegistration } = await import('@simplewebauthn/browser');
      alert('Se va a solicitar acceso a tu lector de huellas o reconocimiento facial. Sigue las instrucciones de tu pantalla.');
      const res = await fetch('/api/auth/webauthn/register/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: auth.currentUser.email, displayName: profile?.nombre }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Error conectando con el servidor biométrico');
      const options = await res.json();
      let attResp;
      try { attResp = await startRegistration(options); } catch (err: any) {
        if (err.name === 'NotAllowedError' || err.name === 'AbortError') return console.log('Cancelado');
        throw err;
      }
      const verifyRes = await fetch('/api/auth/webauthn/register/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: auth.currentUser.email, registrationResponse: attResp }),
      });
      if (verifyRes.ok) {
        alert('✅ ¡Huella o biometría registrada con éxito!');
        // Actualizar el estado local para que se refleje inmediatamente
        if (profile) {
          setProfile({ ...profile, passkeysCount: (profile.passkeysCount || 0) + 1 });
        }
      }
      else throw new Error((await verifyRes.json()).error || 'Fallo en servidor');
    } catch (err: any) {
      alert('Error al vincular Passkey: ' + err.message);
    }
  };

// ── Enviar correo de verificación ──
  const [verificationSentAt, setVerificationSentAt] = useState<string | null>(null);
  
  const handleVerifyEmail = async () => {
    if (!profile?.email) return;

    // Todos los campos obligatorios deben estar rellenos
    const camposFaltantes: string[] = [];
    if (!nombre.trim()) camposFaltantes.push('Nombre');
    if (!fechaNacimiento) camposFaltantes.push('Fecha de Nacimiento');
    if (!sexo) camposFaltantes.push('Sexo');
    if (!nombreUsuario.trim()) camposFaltantes.push('Nombre de Usuario');
    if (!codigoPostal.trim()) camposFaltantes.push('Código Postal');
    if (!poblacion.trim()) camposFaltantes.push('Población');
    if (!pais.trim()) camposFaltantes.push('País');

    if (camposFaltantes.length > 0) {
      showToast(`⚠️ Para verificar tu correo, rellena: ${camposFaltantes.join(', ')}.`);
      return;
    }

    try {
      showToast('Enviando correo de verificación...');
      const res = await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: profile.email, nombre: nombre || 'Usuario', sexo }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error desconocido');
      
      const now = new Date();
      const fechaEnvio = now.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' a las ' + now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
      setVerificationSentAt(fechaEnvio);
      showToast('📧 Correo de verificación enviado. Revisa tu bandeja de entrada.');
    } catch (err: any) {
      showToast('❌ ' + err.message);
    }
  };

  // ── Cerrar Sesión (Fallback) ──
  const handleLogout = async () => {
    import('firebase/auth').then(({ signOut }) => {
      signOut(auth).then(() => router.push('/login'));
    });
  };

  // ── Cancelar cuenta ──
  const handleCancelAccount = () => {
    if (!motivoBaja) {
      showToast('⚠️ Selecciona un motivo de baja.');
      return;
    }
    const paso1 = confirm('⚠️ ¿Estás seguro de que quieres eliminar tu cuenta?\n\nTus datos personales se destruirán tras 30 días. Esta acción es irreversible pasado ese plazo.');
    if (!paso1) return;
    const paso2 = confirm('🔴 ÚLTIMA CONFIRMACIÓN\n\nEsta acción significará la pérdida permanente de tu identidad en la plataforma.\n\n¿Realmente deseas continuar?');
    if (!paso2) return;
    showToast('🔴 Solicitud de borrado enviada. Tu cuenta entrará en periodo de gracia de 30 días.');
  };

  // ── Seleccionar icono ──
  const selectIcon = (icon: string) => {
    const newIcon = icono === icon ? null : icon;
    autoSaveIcon(newIcon);
  };

  const calcularEdad = () => {
    if (!fechaNacimiento) return '';
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    if (isNaN(nacimiento.getTime())) return '';

    let years = hoy.getFullYear() - nacimiento.getFullYear();
    let months = hoy.getMonth() - nacimiento.getMonth();
    let days = hoy.getDate() - nacimiento.getDate();

    if (days < 0) {
      months--;
      const ultimoDiaMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth(), 0).getDate();
      days += ultimoDiaMesAnterior;
    }

    if (months < 0) {
      years--;
      months += 12;
    }

    const partes = [];
    if (years > 0) partes.push(`${years} año${years > 1 ? 's' : ''}`);
    if (months > 0) partes.push(`${months} mes${months > 1 ? 'es' : ''}`);
    if (days > 0) partes.push(`${days} día${days > 1 ? 's' : ''}`);

    if (partes.length === 0) return '📅 0 días';
    if (partes.length === 1) return `📅 ${partes[0]}`;
    if (partes.length === 2) return `📅 ${partes[0]} y ${partes[1]}`;
    return `📅 ${partes[0]}, ${partes[1]} y ${partes[2]}`;
  };

  // Actualización en vivo del nombre en la cabecera
  const updateLiveHeaderName = (e: React.FormEvent<HTMLInputElement>) => {
    const channel = new BroadcastChannel('verdantia_profile');
    const target = e.target as HTMLInputElement;
    channel.postMessage({ nombreUsuario: target.value });
    window.dispatchEvent(new CustomEvent('profile_updated', { detail: { nombreUsuario: target.value } }));
  };

  const isFirebaseVerified = auth.currentUser?.emailVerified ?? false;

  useEffect(() => {
    // Forzar actualización del token para que emailVerified sea true si acaba de verificarlo
    if (auth.currentUser && !auth.currentUser.emailVerified) {
      auth.currentUser.reload().then(() => {
        // El estado interno se actualiza, pero React no se re-renderiza solo por reload()
        // Así que disparamos un evento para forzar re-evaluación
        window.dispatchEvent(new Event('auth_reloaded'));
      }).catch(() => {});
    }
  }, []);

  // Truco para forzar re-render si el reload tuvo éxito
  const [, setAuthTick] = useState(0);
  useEffect(() => {
    const handleAuthReload = () => setAuthTick(t => t + 1);
    window.addEventListener('auth_reloaded', handleAuthReload);
    return () => window.removeEventListener('auth_reloaded', handleAuthReload);
  }, []);

  useEffect(() => {
    const loadGeo = () => {
      if (isFirebaseVerified && poblacion) {
        const zip = codigoPostal || '';
        const currentHour = new Date().getHours();
        const cacheKey = `v_weather_${zip}_${poblacion}_${new Date().toISOString().split('T')[0]}_H${currentHour}`;
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          try { 
            const wData = JSON.parse(cached);
            if (wData.lat && wData.lon) {
              setGeoData((prev: any) => JSON.stringify(prev) === JSON.stringify(wData) ? prev : wData);
              // Guardar la zona climática en la base de datos la primera vez si está vacía
              if (!zonaClimatica && pais) {
                const text = getClimateText(wData.lat, pais);
                setZonaClimatica(text);
                autoSaveField('zonaClimatica', text);
              }
            }
          } catch(e){}
        }
      } else {
        setGeoData((prev: any) => prev === null ? null : null);
      }
    };
    
    // Ejecutar al inicio
    loadGeo();
    
    // Escuchar actualizaciones asíncronas del layout
    window.addEventListener('weather_updated', loadGeo);
    return () => window.removeEventListener('weather_updated', loadGeo);
  }, [isFirebaseVerified, poblacion, codigoPostal, zonaClimatica, pais, autoSaveField]);

  const getClimateText = (lat: string | number, country: string) => {
    const latitude = Number(lat);
    const hemisphere = latitude >= 0 ? "Hemisferio Norte" : "Hemisferio Sur";
    let climate = "templada";
    
    if (country === 'España') {
      climate = "mediterránea/continental";
    } else if (Math.abs(latitude) > 23.5 && Math.abs(latitude) < 66.5) {
      climate = "templada";
    } else {
      climate = "tropical/subtropical";
    }
    
    return `Te encuentras en una zona ${climate}, correspondiente al calendario agrícola del ${hemisphere}. Verdantia utilizará esta ubicación para sincronizar tus siembras con los ciclos naturales de luz y temperatura de tu región, maximizando el éxito de tus cosechas.`;
  };

  useEffect(() => {
    if (!loading && profile && typeof window !== 'undefined' && window.location.hash) {
      setTimeout(() => {
        const id = window.location.hash.substring(1);
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          element.style.transition = 'box-shadow 0.5s';
          element.style.boxShadow = '0 0 0 4px rgba(16, 185, 129, 0.4)';
          element.style.borderRadius = '12px';
          setTimeout(() => {
            element.style.boxShadow = 'none';
          }, 2000);
        }
      }, 300);
    }
  }, [loading, profile]);

  if (loading) return <div className="loading-screen"><div className="loading-spinner"></div><p>Cargando perfil...</p></div>;
  if (!profile) {
    return (
      <div style={{ textAlign: 'center', marginTop: '100px' }}>
        <h2 style={{ color: 'var(--text-primary)' }}>No se pudo cargar el perfil</h2>
        <p style={{ color: 'var(--text-muted)' }}>Es posible que tu cuenta haya sido eliminada de la base de datos.</p>
        <button onClick={handleLogout} className="btn btn-primary" style={{ marginTop: '20px' }}>Cerrar sesión e ir al Login</button>
      </div>
    );
  }

  const roles = profile.roles.split(',').map(r => r.trim());

  let diasRestantes: number | null = null;
  if (profile.fechaCaducidadSuscripcion) {
    const diff = new Date(profile.fechaCaducidadSuscripcion).getTime() - new Date().getTime();
    diasRestantes = Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  const isProfileComplete = Boolean(
    nombre.trim() && fechaNacimiento && sexo && nombreUsuario.trim() &&
    pais.trim() && codigoPostal.trim() && poblacion.trim()
  );

  return (
    <div className="perfil-page">
      {toast && <div className="perfil-toast">{toast}</div>}

      {/* ═══════════════════════════════════════════ */}
      {/* 1. FOTOGRAFÍA E ICONOS                      */}
      {/* ═══════════════════════════════════════════ */}
      <details open>
        <summary style={{ display: 'flex', alignItems: 'center', gap: '0px', flexWrap: 'nowrap' }}>
          📸 Fotografía e Iconos
          {/* Miniatura de la foto/icono actual */}
          {icono && AVATAR_ICONS.includes(icono) ? (
            <span className="summary-thumb" style={{ fontSize: '1.3rem', lineHeight: 1 }}>{icono}</span>
          ) : photos.length > 0 && photos.find(p => p.esPrincipal) ? (
            (() => {
              const mainPhoto = photos.find(p => p.esPrincipal)!;
              let meta: any = { profile_object_x: 50, profile_object_y: 38, profile_object_zoom: 100, profile_style: '' };
              try { meta = { ...meta, ...JSON.parse(mainPhoto.resumen || '{}') }; } catch {}
              return (
                <span className="summary-thumb" style={{
                  width: '24px', height: '32px', borderRadius: '4px', overflow: 'hidden',
                  display: 'inline-flex', flexShrink: 0, border: '2px solid #f59e0b',
                  boxShadow: '0 2px 6px rgba(245, 158, 11, 0.3)', marginLeft: '6px'
                }}>
                  <img
                    src={getMediaUrl(mainPhoto.ruta)}
                    alt=""
                    crossOrigin="anonymous"
                    style={{
                      width: '100%', height: '100%', objectFit: 'cover',
                      objectPosition: `${meta.profile_object_x}% ${meta.profile_object_y}%`,
                      transformOrigin: `${meta.profile_object_x}% ${meta.profile_object_y}%`,
                      transform: meta.profile_object_zoom > 100 ? `scale(${meta.profile_object_zoom / 100})` : undefined
                    }}
                  />
                </span>
              );
            })()
          ) : null}
        </summary>
        <div className="accordion-body">
          {/* ── Galería de Fotos ── */}
          <label className="section-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
            <span>Fotos de Perfil</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <small style={{ color: photos.length >= getMaxPhotos(profile?.suscripcion) ? '#ef4444' : '#64748b', fontWeight: photos.length >= getMaxPhotos(profile?.suscripcion) ? 'bold' : 'normal' }}>
                {photos.length} / {getMaxPhotos(profile?.suscripcion)} permitidas ({profile?.suscripcion || 'Básica'})
              </small>
              {photos.length >= getMaxPhotos(profile?.suscripcion) && (
                <span style={{ 
                  background: '#fee2e2', color: '#ef4444', fontSize: '0.65rem', 
                  padding: '2px 8px', borderRadius: '10px', border: '1px solid #fecaca',
                  fontWeight: 'bold', textTransform: 'uppercase'
                }}>Límite alcanzado</span>
              )}
            </span>
          </label>
          <div className={`photo-gallery-grid ${dragOver ? 'drag-over' : ''}`}>
            {photos.map((photo, i) => {
              let meta: { profile_object_x: number; profile_object_y: number; profile_object_zoom: number; profile_style: string; profile_brightness?: number; profile_contrast?: number } = { profile_object_x: 50, profile_object_y: 38, profile_object_zoom: 100, profile_style: '' };
              try { meta = { ...meta, ...JSON.parse(photo.resumen || '{}') }; } catch {}
              
              const isLocked = i >= getMaxPhotos(profile?.suscripcion);
              
              return (
              <div
                key={photo.id}
                className={`photo-item ${photo.esPrincipal ? 'is-preferred' : ''} ${isLocked ? 'is-locked' : ''} ${draggingId === photo.id ? 'dragging' : ''}`}
                style={{ position: 'relative' }}
                draggable={!isLocked}
                onDragStart={(e) => handlePhotoDragStart(e, photo.id)}
                onDragOver={handlePhotoDragOver}
                onDrop={(e) => handlePhotoDrop(e, photo.id)}
              >
                <img
                  src={getMediaUrl(photo.ruta)}
                  alt="Foto de perfil"
                  crossOrigin="anonymous"
                  style={{
                    cursor: isLocked ? 'not-allowed' : 'default',
                    objectPosition: `${meta.profile_object_x}% ${meta.profile_object_y}%`,
                    transformOrigin: `${meta.profile_object_x}% ${meta.profile_object_y}%`,
                    transform: meta.profile_object_zoom > 100 ? `scale(${meta.profile_object_zoom / 100})` : undefined,
                    filter: isLocked 
                      ? 'grayscale(100%) blur(2px) brightness(0.7)' 
                      : `${STYLE_FILTERS[meta.profile_style] === 'none' ? '' : (STYLE_FILTERS[meta.profile_style] || '')} brightness(${meta.profile_brightness ?? 100}%) contrast(${meta.profile_contrast ?? 100}%)`.trim()
                  }}
                />

                {isLocked && (
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.8)', pointerEvents: 'none', zIndex: 10
                  }}>
                    <span style={{ fontSize: '2rem', marginBottom: '8px' }}>🔒</span>
                    <small style={{ fontWeight: 'bold', textAlign: 'center', padding: '0 10px' }}>Límite de plan superado</small>
                  </div>
                )}

                <div className="photo-actions" style={{ zIndex: 20 }}>
                  {!isLocked && (
                    <>
                      <button
                        type="button"
                        className={`photo-action-btn btn-photo-primary ${photo.esPrincipal ? 'is-active' : ''}`}
                        onClick={() => setPhotoPrimary(photo.id)}
                        title={photo.esPrincipal ? 'Foto preferida actual' : 'Marcar como foto preferida'}
                      >{photo.esPrincipal ? '★' : '☆'}</button>
                      <button
                        type="button"
                        className="photo-action-btn btn-photo-edit"
                        onClick={() => openPhotoEditor(photo)}
                        title="Editar foto"
                      >✏️</button>
                    </>
                  )}
                  <button
                    type="button"
                    className="photo-action-btn btn-photo-delete"
                    onClick={() => deletePhoto(photo.id)}
                    title="Eliminar"
                  >✕</button>
                </div>
              </div>
              );
            })}

            {/* Zona de Drop / Subir (Solo si no hay límite) */}
            {photos.length < getMaxPhotos(profile?.suscripcion) && (
              <div
                className="photo-add-card"
                onDragOver={handleDragOver}
                onDragEnter={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {uploading ? (
                  <div className="upload-progress">
                    <div className="loading-spinner" style={{ width: '24px', height: '24px' }}></div>
                    <span>Subiendo...</span>
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        type="button"
                        className="btn btn-primary"
                        style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                        onClick={() => fileInputRef.current?.click()}
                      >📁 Galería</button>
                      <button
                        type="button"
                        style={{ padding: '6px 12px', fontSize: '0.78rem', background: '#0ea5e9', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, boxShadow: '0 2px 4px rgba(14, 165, 233, 0.3)' }}
                        onClick={() => cameraInputRef.current?.click()}
                      >📷 Cámara</button>
                    </div>
                      <small className="drop-hint">
                        {dragOver ? '¡Suelta aquí!' : 'También puedes soltar una imagen'}
                      </small>
                    </>
                  )}
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) uploadPhoto(file);
              e.target.value = '';
            }}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            style={{ display: 'none' }}
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) uploadPhoto(file);
              e.target.value = '';
            }}
          />

          {/* ── Icono de Perfil ── */}
          <label className="section-label" style={{ marginTop: '24px' }}>Icono de Perfil Alternativo</label>
          <div className="icon-grid">
            {AVATAR_ICONS.map((icon) => (
              <button
                key={icon}
                type="button"
                className={`icon-btn ${icono === icon ? 'selected' : ''}`}
                onClick={() => selectIcon(icon)}
              >
                {icon}
              </button>
            ))}
          </div>
          <small className="help-text">
            Este icono se mostrará como emoji cuando no tengas fotografía. Su guardado es automático al clicar uno.
          </small>
        </div>
      </details>

      {/* ═══════════════════════════════════════════ */}
      {/* 2. DATOS PERSONALES                          */}
      {/* ═══════════════════════════════════════════ */}
      <details open>
        <summary>
          👤 Datos Personales
          <span className="accordion-preview">({nombre} {apellidos})</span>
        </summary>
        <div className="accordion-body">

          {/* ── CAMPOS OBLIGATORIOS (autoguardado) ── */}
          <div className="mandatory-zone">
            <div className="mandatory-zone-header">
              <span>📋 Campos Obligatorios</span>
            </div>

            <div className="form-grid">
              {/* Fila 1: Nombre + Nombre de Usuario */}
              <div className="form-group">
                <label htmlFor="nombre" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span>Nombre</span>
                  <span className={`required-badge ${nombre.trim() ? 'filled' : 'pending'}`}>{nombre.trim() ? '✓ Completado' : '* Requerido'}</span>
                </label>
                <input id="nombre" type="text" className="form-input" value={nombre}
                  onChange={e => { setNombre(e.target.value); }}
                  onInput={updateLiveHeaderName}
                  onBlur={() => nombre.trim() && autoSaveField('nombre', nombre)}
                  required placeholder="Tu nombre" style={{ borderLeft: `3px solid ${nombre.trim() ? '#10b981' : '#f59e0b'}` }} />
              </div>
              <div className="form-group">
                <label htmlFor="nombre_usuario" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span>Nombre de Usuario</span>
                  <span className={`required-badge ${nombreUsuario.trim() ? 'filled' : 'pending'}`}>{nombreUsuario.trim() ? '✓ Completado' : '* Requerido'}</span>
                </label>
                <input id="nombre_usuario" type="text" className="form-input" value={nombreUsuario}
                  onChange={e => { setNombreUsuario(e.target.value); }}
                  onInput={updateLiveHeaderName}
                  onBlur={() => nombreUsuario.trim() && autoSaveField('nombreUsuario', nombreUsuario)}
                  placeholder="Nombre público visible" maxLength={100}
                  style={{ borderLeft: `3px solid ${nombreUsuario.trim() ? '#10b981' : '#f59e0b'}` }} />
                <small className="help-text">Nombre visible para los demás usuarios.</small>
              </div>

              {/* Fila 2: Fecha de Nacimiento + Sexo */}
              <div className="form-group">
                <label htmlFor="fecha_nacimiento" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span>Fecha de Nacimiento</span>
                  <span className={`required-badge ${fechaNacimiento ? 'filled' : 'pending'}`}>{fechaNacimiento ? '✓ Completado' : '* Requerido'}</span>
                </label>
                <input id="fecha_nacimiento" type="date" className="form-input" value={fechaNacimiento}
                  onChange={e => {
                    setFechaNacimiento(e.target.value);
                    if (e.target.value) autoSaveField('fechaNacimiento', e.target.value);
                  }} style={{ 
                    borderLeft: `3px solid ${fechaNacimiento ? '#10b981' : '#f59e0b'}`, 
                    color: fechaNacimiento ? '#0369a1' : 'var(--text-muted)',
                    backgroundColor: fechaNacimiento ? '#e0f2fe' : undefined,
                    borderColor: fechaNacimiento ? '#7dd3fc' : undefined,
                    fontWeight: fechaNacimiento ? 500 : undefined
                  }} />
                <small className="help-text">{calcularEdad() || 'Necesaria para verificar la mayoría de edad.'}</small>
              </div>
              <div className="form-group">
                <label htmlFor="sexo" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span>Sexo / Género</span>
                  <span className={`required-badge ${sexo ? 'filled' : 'pending'}`}>{sexo ? '✓ Completado' : '* Requerido'}</span>
                </label>
                <select
                  id="sexo"
                  className="form-input"
                  value={sexo}
                  onChange={handleSexoChange}
                  style={{ 
                    borderLeft: `3px solid ${sexo ? '#10b981' : '#f59e0b'}`,
                    color: sexo ? '#0369a1' : 'var(--text-muted)',
                    backgroundColor: sexo ? '#e0f2fe' : undefined,
                    borderColor: sexo ? '#7dd3fc' : undefined,
                    fontWeight: sexo ? 500 : undefined
                  }}
                >
                  <option value="" disabled>Selecciona una opción...</option>
                  <option value="Hombre">Hombre</option>
                  <option value="Mujer">Mujer</option>
                  <option value="Neutro">Prefiero no decirlo (Neutro)</option>
                </select>
                <small className="help-text">Para personalizar nuestras comunicaciones contigo.</small>
              </div>

              {/* Fila 3: Subgrupo Localización */}
              <div className="location-subgroup-mandatory" style={{ gridColumn: 'span 2' }}>
                <div className="location-subgroup-header" style={{ marginBottom: '12px', paddingBottom: '6px' }}>
                  <span>📍 Localización</span>
                  <small>3 campos requeridos</small>
                </div>
                <p className="help-text" style={{ gridColumn: 'span 3', marginBottom: '16px', fontStyle: 'italic', color: 'var(--text-secondary)' }}>
                  💡 Obligatoria para ubicar geográficamente tu huerto, ofrecerte el widget meteorológico en tiempo real y proporcionarte consejos de siembra adaptados a tu clima local.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label htmlFor="pais" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span>País</span>
                      <span className={`required-badge ${pais.trim() ? 'filled' : 'pending'}`}>{pais.trim() ? '✓' : '*'}</span>
                    </label>
                    <select id="pais" className="form-input" value={pais}
                      onChange={e => {
                        setPais(e.target.value);
                        autoSaveField('pais', e.target.value);
                        // Limpiar CP y Población si se cambia de país para evitar datos erróneos
                        if (e.target.value !== 'España' && pais === 'España') {
                          setCodigoPostal('');
                          setPoblacion('');
                          autoSaveMultiple({ codigoPostal: '', poblacion: '' });
                        }
                      }}
                      style={{ 
                        borderLeft: `3px solid ${pais.trim() ? '#10b981' : '#f59e0b'}`, 
                        color: pais ? '#0369a1' : 'var(--text-muted)', 
                        backgroundColor: pais ? '#e0f2fe' : undefined,
                        borderColor: pais ? '#7dd3fc' : undefined,
                        fontWeight: pais ? 500 : undefined,
                        cursor: 'pointer' 
                      }}>
                      <option value="" disabled>Selecciona un país...</option>
                      {PAISES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div className="form-group" style={{ position: 'relative' }}>
                    <label htmlFor="codigo_postal" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span>C. Postal</span>
                      <span className={`required-badge ${codigoPostal.trim() ? 'filled' : 'pending'}`}>{codigoPostal.trim() ? '✓' : '*'}</span>
                    </label>
                    {pais === 'España' ? (
                      <>
                        <div className="autocomplete-wrapper">
                          <input id="codigo_postal" type="text" className="form-input autocomplete-input" value={codigoPostal}
                            autoComplete="off"
                            onChange={e => {
                              const val = e.target.value;
                              setCodigoPostal(val);
                              if (cpTimeoutRef.current) clearTimeout(cpTimeoutRef.current);
                              cpTimeoutRef.current = setTimeout(() => searchLocation(val, 'cp'), 300);
                            }}
                            onFocus={() => searchLocation(codigoPostal, 'cp')}
                            onClick={(e) => {
                              e.stopPropagation();
                              searchLocation(codigoPostal, 'cp');
                            }}
                            onBlur={() => {
                              setTimeout(() => setShowCpDropdown(false), 200);
                              if (codigoPostal.trim()) autoSaveField('codigoPostal', codigoPostal);
                            }}
                            placeholder="C.P." style={{ borderLeft: `3px solid ${codigoPostal.trim() ? '#10b981' : '#f59e0b'}` }} />
                          <svg className="autocomplete-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                          </svg>
                        </div>
                        {showCpDropdown && cpSuggestions.length > 0 && (
                          <ul className="location-dropdown">
                            {cpSuggestions.map((s, i) => (
                              <li key={i} onMouseDown={() => {
                                setCodigoPostal(s.cp);
                                setPoblacion(s.ciudad);
                                setShowCpDropdown(false);
                                setCpSuggestions([]);
                                autoSaveMultiple({ codigoPostal: s.cp, poblacion: s.ciudad });
                              }}>
                                <strong>{s.cp}</strong> — {s.ciudad}
                              </li>
                            ))}
                          </ul>
                        )}
                      </>
                    ) : (
                      <input id="codigo_postal" type="text" className="form-input" value={codigoPostal}
                        onChange={e => setCodigoPostal(e.target.value)}
                        onBlur={() => codigoPostal.trim() && autoSaveField('codigoPostal', codigoPostal)}
                        disabled={!pais}
                        placeholder={pais ? "C.P." : "Selecciona país primero"} style={{ borderLeft: `3px solid ${!pais ? '#cbd5e1' : codigoPostal.trim() ? '#10b981' : '#f59e0b'}`, cursor: !pais ? 'not-allowed' : 'text' }} />
                    )}
                  </div>
                  <div className="form-group" style={{ position: 'relative' }}>
                    <label htmlFor="poblacion" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span>Población</span>
                      <span className={`required-badge ${poblacion.trim() ? 'filled' : 'pending'}`}>{poblacion.trim() ? '✓' : '*'}</span>
                    </label>
                    {pais === 'España' ? (
                      <>
                        <div className="autocomplete-wrapper">
                          <input id="poblacion" type="text" className="form-input autocomplete-input" value={poblacion}
                            autoComplete="off"
                            onChange={e => {
                              const val = e.target.value;
                              setPoblacion(val);
                              if (ciudadTimeoutRef.current) clearTimeout(ciudadTimeoutRef.current);
                              ciudadTimeoutRef.current = setTimeout(() => searchLocation(val, 'ciudad'), 300);
                            }}
                            onFocus={() => searchLocation(poblacion, 'ciudad')}
                            onClick={(e) => {
                              e.stopPropagation();
                              searchLocation(poblacion, 'ciudad');
                            }}
                            onBlur={() => {
                              setTimeout(() => setShowCiudadDropdown(false), 200);
                              if (poblacion.trim()) autoSaveField('poblacion', poblacion);
                            }}
                            placeholder="Ciudad / Municipio" style={{ borderLeft: `3px solid ${poblacion.trim() ? '#10b981' : '#f59e0b'}` }} />
                          <svg className="autocomplete-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                          </svg>
                        </div>
                        {showCiudadDropdown && ciudadSuggestions.length > 0 && (
                          <ul className="location-dropdown">
                            {ciudadSuggestions.map((s, i) => (
                              <li key={i} onMouseDown={() => {
                                setPoblacion(s.ciudad);
                                setCodigoPostal(s.cp);
                                setShowCiudadDropdown(false);
                                setCiudadSuggestions([]);
                                autoSaveMultiple({ poblacion: s.ciudad, codigoPostal: s.cp });
                              }}>
                                <strong>{s.ciudad}</strong> — CP: {s.cp}
                              </li>
                            ))}
                          </ul>
                        )}
                      </>
                    ) : (
                      <input id="poblacion" type="text" className="form-input" value={poblacion}
                        onChange={e => setPoblacion(e.target.value)}
                        onBlur={() => poblacion.trim() && autoSaveField('poblacion', poblacion)}
                        disabled={!pais}
                        placeholder={pais ? "Ciudad / Municipio" : "Selecciona país primero"} style={{ borderLeft: `3px solid ${!pais ? '#cbd5e1' : poblacion.trim() ? '#10b981' : '#f59e0b'}`, cursor: !pais ? 'not-allowed' : 'text' }} />
                    )}
                  </div>
                </div>
                {isFirebaseVerified && geoData && (
                  <div style={{ marginTop: '14px', fontSize: '0.88rem', color: '#064e3b', display: 'flex', flexDirection: 'column', gap: '8px', background: '#d1fae5', padding: '12px 14px', borderRadius: '8px', border: '1px solid #10b981' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1.2rem' }} title="Coordenadas GPS detectadas">🌍</span>
                      <div>
                        <strong style={{ display: 'block', marginBottom: '2px' }}>Zona de Cultivo y Clima Local</strong>
                        <span style={{ opacity: 0.85 }}>Lat: {geoData.lat} | Lon: {geoData.lon}</span>
                      </div>
                    </div>
                    <div style={{ marginTop: '4px', paddingTop: '10px', borderTop: '1px solid rgba(16, 185, 129, 0.2)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <span style={{ fontStyle: 'italic', opacity: 0.9, fontSize: '0.85rem', lineHeight: 1.4 }}>
                        🌱 {zonaClimatica || getClimateText(geoData.lat, pais)}
                      </span>
                      
                      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', fontWeight: 500, background: 'rgba(255,255,255,0.7)', padding: '6px 12px', borderRadius: '12px', alignSelf: 'flex-start', border: '1px solid rgba(16,185,129,0.3)' }}>
                        <span style={{ color: '#047857', fontWeight: 600 }}>{geoData.name} ({geoData.updated})</span>
                        <span style={{ color: '#cbd5e1' }}>|</span>
                        <span style={{ color: '#ef4444' }} title="Máxima">Máx {geoData.max}º</span>
                        <span style={{ color: '#cbd5e1' }}>|</span>
                        <span style={{ color: '#10b981', fontSize: '1.1rem', fontWeight: 700 }} title="Actual">{geoData.current}º {geoData.trend === 'subiendo' ? '↑' : geoData.trend === 'bajando' ? '↓' : '→'}</span>
                        <span style={{ color: '#cbd5e1' }}>|</span>
                        <span style={{ color: '#3b82f6' }} title="Mínima">Mín {geoData.min}º</span>
                        {geoData.rain > 0 && (
                          <>
                            <span style={{ color: '#cbd5e1' }}>|</span>
                            <span style={{ color: '#0ea5e9' }}>💧 {geoData.rain}mm</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Correo y Verificación (Última línea) */}
              <div className="form-group" style={{ 
                gridColumn: 'span 2', 
                marginTop: '10px',
                padding: '16px',
                borderRadius: '10px',
                border: isFirebaseVerified ? '2px solid #10b981' : isProfileComplete ? '2px solid #3b82f6' : '2px solid #f59e0b',
                backgroundColor: isFirebaseVerified ? '#f0fdf4' : isProfileComplete ? '#eff6ff' : '#fffbeb',
                transition: 'all 0.3s ease'
              }}>
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', color: isFirebaseVerified ? '#065f46' : isProfileComplete ? '#1e3a8a' : '#92400e' }}>
                  <span style={{ fontWeight: 'bold' }}>
                    {isFirebaseVerified ? '✅ Correo Electrónico' : isProfileComplete ? '📧 Correo Electrónico' : '⚠️ Correo Electrónico'}
                  </span>
                  {isFirebaseVerified && <span className="verification-badge verified" style={{ margin: 0 }}>✅ Verificado</span>}
                </label>
                
                {isFirebaseVerified ? (
                  <>
                    <input type="email" className="form-input" value={profile.email} readOnly
                      style={{ background: '#ffffff', cursor: 'not-allowed', opacity: 0.8 }} />
                    <small className="help-text" style={{ color: '#065f46', marginTop: '8px', display: 'block' }}>El correo verificado no se puede modificar.</small>
                    {auth.currentUser?.metadata?.lastSignInTime && (
                      <small style={{ color: '#059669', fontSize: '0.78rem', display: 'block', marginTop: '4px' }}>
                        📅 Verificado el {new Date(auth.currentUser.metadata.creationTime || '').toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </small>
                    )}
                  </>
                ) : (
                  <>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                      <input type="email" className="form-input" value={editableEmail}
                        onChange={e => setEditableEmail(e.target.value)}
                        onBlur={async () => {
                          if (!profile || editableEmail === profile.email || !editableEmail.trim()) {
                            setEditableEmail(profile?.email || '');
                            return;
                          }
                          try {
                            const res = await fetch('/api/auth/update-email', {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ currentEmail: profile.email, newEmail: editableEmail })
                            });
                            const data = await res.json();
                            if (data.success) {
                              showToast('✅ Correo actualizado. Recuerda verificarlo.');
                              setProfile({ ...profile, email: editableEmail });
                              setVerificationSentAt(null);
                            } else {
                              showToast('❌ ' + (data.error || 'Error al cambiar email'));
                              setEditableEmail(profile.email);
                            }
                          } catch {
                            showToast('❌ Error de conexión al cambiar email');
                            setEditableEmail(profile.email);
                          }
                        }}
                        placeholder="tu@email.com"
                        style={{ flex: 1, borderLeft: `3px solid ${editableEmail.trim() ? (isProfileComplete ? '#3b82f6' : '#f59e0b') : '#ef4444'}` }} />
                      <button type="button" onClick={handleVerifyEmail} className="btn btn-primary"
                        disabled={!isProfileComplete}
                        style={{ 
                          whiteSpace: 'nowrap', padding: '10px 18px', fontSize: '0.88rem', borderRadius: '8px', 
                          boxShadow: isProfileComplete ? '0 4px 12px rgba(37,99,235,0.3)' : 'none',
                          opacity: isProfileComplete ? 1 : 0.6,
                          cursor: isProfileComplete ? 'pointer' : 'not-allowed',
                          background: isProfileComplete ? '#3b82f6' : '#94a3b8',
                          color: '#ffffff',
                          border: 'none'
                        }}>
                        {verificationSentAt ? '🔄 Volver a enviar' : '✉️ Verificar correo'}
                      </button>
                    </div>
                    {verificationSentAt && (
                      <small style={{ color: '#059669', fontSize: '0.78rem', display: 'block', marginTop: '8px', fontWeight: 600 }}>
                        📧 Correo enviado el {verificationSentAt}
                      </small>
                    )}
                    <small className="help-text" style={{ color: isProfileComplete ? '#1d4ed8' : '#b45309', marginTop: '10px', display: 'block', fontWeight: isProfileComplete ? 'normal' : 'bold' }}>
                      {isProfileComplete 
                        ? (verificationSentAt 
                            ? 'ℹ️ Revisa tu bandeja de entrada y haz clic en el enlace para completar la verificación.' 
                            : 'ℹ️ Haz clic en "Verificar correo" para enviarte un enlace de activación.')
                        : '🚨 Rellena todos los campos obligatorios de arriba para habilitar la verificación del correo.'}
                    </small>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* ── PREFERENCIAS DE ALERTAS AGRÍCOLAS ── */}
          <div className="optional-zone" style={{ marginTop: '20px' }}>
            <div className="optional-zone-header">
              <h3>🌾 Preferencias de Alertas Agrícolas</h3>
              <p>Personaliza las notificaciones de siembra y cosecha según tu filosofía de cultivo y suscripción.</p>
            </div>
            <div className="form-grid">
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
                  
                  {/* Normal */}
                  <div 
                    onClick={() => {
                      setTipoCalendario('Normal');
                      autoSaveField('tipoCalendario', 'Normal');
                      window.dispatchEvent(new CustomEvent('profile_updated', { detail: { tipoCalendario: 'Normal' } }));
                    }}
                    style={{
                      border: tipoCalendario === 'Normal' ? '2px solid #10b981' : '1px solid #cbd5e1',
                      borderRadius: '12px',
                      padding: '16px',
                      cursor: 'pointer',
                      background: tipoCalendario === 'Normal' ? '#f0fdf4' : '#ffffff',
                      transition: 'all 0.2s ease',
                      position: 'relative'
                    }}
                  >
                    <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🌱</div>
                    <h4 style={{ margin: '0 0 5px 0', color: '#064e3b' }}>Calendario Normal</h4>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Basado únicamente en las épocas estándar de siembra y cosecha del año.</p>
                  </div>

                  {/* Lunar */}
                  <div 
                    onClick={() => {
                      // Calendario Lunar: requiere plan Esencial o superior
                      const p = (profile?.suscripcion || '').toLowerCase();
                      const hasAccess = ['esencial','plus','avanzado','pro','premium'].includes(p);
                      if (!hasAccess) {
                        showToast('❌ El calendario Lunar requiere un plan Esencial o superior');
                        return;
                      }
                      setTipoCalendario('Lunar');
                      autoSaveField('tipoCalendario', 'Lunar');
                      window.dispatchEvent(new CustomEvent('profile_updated', { detail: { tipoCalendario: 'Lunar' } }));
                    }}
                    style={{
                      border: tipoCalendario === 'Lunar' ? '2px solid #3b82f6' : '1px solid #cbd5e1',
                      borderRadius: '12px',
                      padding: '16px',
                      cursor: ['esencial','plus','avanzado','pro','premium'].includes((profile?.suscripcion||'').toLowerCase()) ? 'pointer' : 'not-allowed',
                      background: tipoCalendario === 'Lunar' ? '#eff6ff' : (!['esencial','plus','avanzado','pro','premium'].includes((profile?.suscripcion||'').toLowerCase()) ? '#f8fafc' : '#ffffff'),
                      opacity: ['esencial','plus','avanzado','pro','premium'].includes((profile?.suscripcion||'').toLowerCase()) ? 1 : 0.6,
                      transition: 'all 0.2s ease',
                      position: 'relative'
                    }}
                  >
                    {!['esencial','plus','avanzado','pro','premium'].includes((profile?.suscripcion||'').toLowerCase()) && <div style={{ position: 'absolute', top: 10, right: 10, fontSize: '1.2rem' }}>🔒</div>}
                    <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🌔</div>
                    <h4 style={{ margin: '0 0 5px 0', color: '#1e3a8a' }}>Calendario Lunar</h4>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Añade la influencia gravitacional y fases de la luna para optimizar la savia.</p>
                    <span style={{ display: 'inline-block', marginTop: '8px', fontSize: '0.7rem', padding: '3px 8px', background: '#dbeafe', color: '#1d4ed8', borderRadius: '10px', fontWeight: 'bold' }}>Requiere Plan Esencial</span>
                  </div>

                  {/* Biodinámico */}
                  <div 
                    onClick={() => {
                      // Calendario Biod.: requiere Premium
                      const p = (profile?.suscripcion || '').toLowerCase();
                      if (!['avanzado','pro','premium'].includes(p)) {
                        showToast('❌ El calendario Biod. requiere un plan Avanzado o Premium');
                        return;
                      }
                      setTipoCalendario('Biodinámico');
                      autoSaveField('tipoCalendario', 'Biodinámico');
                      window.dispatchEvent(new CustomEvent('profile_updated', { detail: { tipoCalendario: 'Biodinámico' } }));
                    }}
                    style={{
                      border: tipoCalendario === 'Biodinámico' ? '2px solid #8b5cf6' : '1px solid #cbd5e1',
                      borderRadius: '12px',
                      padding: '16px',
                      cursor: !['avanzado','pro','premium'].includes((profile?.suscripcion||'').toLowerCase()) ? 'not-allowed' : 'pointer',
                      background: tipoCalendario === 'Biodinámico' ? '#f5f3ff' : (!['avanzado','pro','premium'].includes((profile?.suscripcion||'').toLowerCase()) ? '#f8fafc' : '#ffffff'),
                      opacity: !['avanzado','pro','premium'].includes((profile?.suscripcion||'').toLowerCase()) ? 0.6 : 1,
                      transition: 'all 0.2s ease',
                      position: 'relative'
                    }}
                  >
                    {!['avanzado','pro','premium'].includes((profile?.suscripcion||'').toLowerCase()) && <div style={{ position: 'absolute', top: 10, right: 10, fontSize: '1.2rem' }}>🔒</div>}
                    <div style={{ fontSize: '2rem', marginBottom: '8px' }}>✨</div>
                    <h4 style={{ margin: '0 0 5px 0', color: '#4c1d95' }}>Calendario Biodinámico</h4>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Cosmos, constelaciones y elementos (raíz, hoja, flor, fruto) según Maria Thun.</p>
                    <span style={{ display: 'inline-block', marginTop: '8px', fontSize: '0.7rem', padding: '3px 8px', background: '#ede9fe', color: '#6d28d9', borderRadius: '10px', fontWeight: 'bold' }}>Requiere Plan Avanzado o Premium</span>
                  </div>

                </div>
              </div>
            </div>
          </div>

          {/* ── CENTRO DE COMUNICACIONES ── */}
          <div id="comunicaciones" className="optional-zone" style={{ marginTop: '20px' }}>
            <div className="optional-zone-header">
              <h3>🔔 Centro de Comunicaciones</h3>
              <p>Gestiona los canales por los que Verdantia se comunica contigo.</p>
            </div>
            
            <div className="form-grid">
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                {avisosLoading || !avisosConfig ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>Cargando preferencias...</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {avisosConfig.tiposAvisos.map((aviso: any) => {
                      const reglaEstado = avisosConfig.reglas[aviso.idtiposavisos] ?? 0;
                      let isActivo = true;
                      if (reglaEstado === 2) isActivo = false;
                      else if (reglaEstado === 1) isActivo = true;
                      else if (avisosConfig.userPrefs[aviso.idtiposavisos] === 0) isActivo = false;

                      const isTareasDelHuerto = aviso.tiposavisoscodigo === 'TAREAS';

                      return (
                        <div key={aviso.idtiposavisos} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', background: '#fff' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: reglaEstado === 2 ? '#f8fafc' : '#ffffff' }}>
                            <div>
                              <h4 style={{ margin: '0 0 4px 0', color: reglaEstado === 2 ? '#94a3b8' : '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {aviso.tiposavisosnombre}
                                {reglaEstado === 2 && <span style={{ fontSize: '0.8rem', padding: '2px 8px', background: '#e2e8f0', color: '#475569', borderRadius: '12px' }}>🔒 Bloqueado en tu plan</span>}
                                {reglaEstado === 1 && <span style={{ fontSize: '0.8rem', padding: '2px 8px', background: '#fef3c7', color: '#b45309', borderRadius: '12px' }}>Obligatorio</span>}
                              </h4>
                              <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>{aviso.tiposavisosdescripcion}</p>
                              {reglaEstado === 2 && (
                                <p style={{ margin: '6px 0 0 0', fontSize: '0.75rem', color: '#b91c1c', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  💡 <span>Mejora a un plan superior para desbloquear esta función.</span>
                                </p>
                              )}
                            </div>

                            <div style={{ marginLeft: '16px' }}>
                              {reglaEstado === 2 ? (
                                <button type="button" style={{ padding: '6px 12px', fontSize: '0.85rem', opacity: 0.7, border: '1px solid #cbd5e1', borderRadius: '8px', background: 'transparent' }} disabled>Bloqueado</button>
                              ) : reglaEstado === 1 ? (
                                <div style={{ width: '44px', height: '24px', background: '#10b981', borderRadius: '12px', position: 'relative', opacity: 0.6 }}>
                                  <div style={{ width: '20px', height: '20px', background: '#fff', borderRadius: '50%', position: 'absolute', top: '2px', right: '2px' }} />
                                </div>
                              ) : (
                                <div 
                                  onClick={() => toggleAvisoMaestro(aviso.idtiposavisos, isActivo ? 1 : 0)}
                                  style={{ 
                                    width: '44px', height: '24px', 
                                    background: isActivo ? '#10b981' : '#cbd5e1', 
                                    borderRadius: '12px', position: 'relative', cursor: 'pointer', transition: 'all 0.2s' 
                                  }}>
                                  <div style={{ 
                                    width: '20px', height: '20px', background: '#fff', borderRadius: '50%', position: 'absolute', top: '2px', 
                                    left: isActivo ? '22px' : '2px', transition: 'all 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' 
                                  }} />
                                </div>
                              )}
                            </div>
                          </div>

                          {isTareasDelHuerto && isActivo && (
                            <div style={{ borderTop: '1px solid #f1f5f9', padding: '16px', background: '#f8fafc' }}>
                              <p style={{ margin: '0 0 12px 0', fontSize: '0.85rem', color: '#475569', fontWeight: 600 }}>Desmarca las labores que NO te interesan (Opt-Out):</p>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
                                {avisosConfig.labores.map((labor: any) => {
                                  const laborActiva = avisosConfig.userLaboresPrefs[labor.idlabores] !== 0;
                                  return (
                                    <label key={labor.idlabores} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: '#fff', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                                      <input 
                                        type="checkbox" 
                                        checked={laborActiva}
                                        onChange={() => toggleAvisoLabor(labor.idlabores, laborActiva ? 1 : 0)}
                                        style={{ accentColor: '#10b981', width: '16px', height: '16px', cursor: 'pointer' }}
                                      />
                                      <span style={{ fontSize: '0.85rem', color: '#334155' }}>{labor.laboresnombre}</span>
                                    </label>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── CAMPOS OPCIONALES ── */}
          <div className="optional-zone">
            <div className="optional-zone-header">
              <span>📝 Datos Complementarios</span>
            </div>

            <div className="form-grid">
              {/* Apellidos */}
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label htmlFor="apellidos" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span>Apellidos</span>
                  <span style={{ fontSize: '0.75rem', backgroundColor: '#f1f5f9', padding: '2px 8px', borderRadius: '12px', color: 'var(--text-muted)' }}>Opcional</span>
                </label>
                <input id="apellidos" type="text" className="form-input" value={apellidos}
                  onChange={e => setApellidos(e.target.value)} 
                  onBlur={() => autoSaveField('apellidos', apellidos)}
                  placeholder="Tus apellidos" />
              </div>
            </div>

            {/* Subgrupo: Localización y Contacto */}
            <div className="location-subgroup">
              <div className="location-subgroup-header">
                <span>📍 Localización y Contacto</span>
                <small>Obligatorio para suscripciones de pago</small>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div className="form-group">
                  <label htmlFor="pais_opt" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span>País</span>
                    <span className={`required-badge ${pais.trim() ? 'filled' : 'pending'}`}>{pais.trim() ? '✓' : '—'}</span>
                  </label>
                  <select id="pais_opt" className="form-input" value={pais}
                    onChange={e => {
                      setPais(e.target.value);
                      autoSaveField('pais', e.target.value);
                      if (e.target.value !== 'España' && pais === 'España') {
                        setCodigoPostal('');
                        setPoblacion('');
                        autoSaveField('codigoPostal', '');
                        autoSaveField('poblacion', '');
                      }
                    }}
                    style={{ 
                      borderLeft: `3px solid ${pais.trim() ? '#10b981' : '#f59e0b'}`,
                      color: pais ? '#0369a1' : 'var(--text-muted)',
                      backgroundColor: pais ? '#e0f2fe' : undefined,
                      borderColor: pais ? '#7dd3fc' : undefined,
                      fontWeight: pais ? 500 : undefined,
                      cursor: 'pointer' 
                    }}>
                    <option value="" disabled>Selecciona un país...</option>
                    {PAISES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ position: 'relative' }}>
                  <label htmlFor="codigo_postal_opt" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span>C. Postal</span>
                    <span className={`required-badge ${codigoPostal.trim() ? 'filled' : 'pending'}`}>{codigoPostal.trim() ? '✓' : '—'}</span>
                  </label>
                  {pais === 'España' ? (
                    <>
                      <div className="autocomplete-wrapper">
                        <input id="codigo_postal_opt" type="text" className="form-input autocomplete-input" value={codigoPostal}
                          autoComplete="off"
                          onChange={e => {
                            const val = e.target.value;
                            setCodigoPostal(val);
                            if (cpTimeoutRef.current) clearTimeout(cpTimeoutRef.current);
                            cpTimeoutRef.current = setTimeout(() => searchLocation(val, 'cp', 'optional'), 300);
                          }}
                          onFocus={() => searchLocation(codigoPostal, 'cp', 'optional')}
                          onClick={(e) => {
                            e.stopPropagation();
                            searchLocation(codigoPostal, 'cp', 'optional');
                          }}
                          onBlur={() => {
                            setTimeout(() => setShowCpDropdownOpt(false), 200);
                            if (codigoPostal.trim()) autoSaveField('codigoPostal', codigoPostal);
                          }}
                          placeholder="C.P." style={{ borderLeft: `3px solid ${codigoPostal.trim() ? '#10b981' : '#f59e0b'}` }} />
                        <svg className="autocomplete-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                        </svg>
                      </div>
                      {showCpDropdownOpt && cpSuggestions.length > 0 && (
                        <ul className="location-dropdown">
                          {cpSuggestions.map((s, i) => (
                            <li key={i} onMouseDown={() => {
                              setCodigoPostal(s.cp);
                              setPoblacion(s.ciudad);
                              setShowCpDropdownOpt(false);
                              setCpSuggestions([]);
                              autoSaveField('codigoPostal', s.cp);
                              autoSaveField('poblacion', s.ciudad);
                            }}>
                              <strong>{s.cp}</strong> — {s.ciudad}
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  ) : (
                    <input id="codigo_postal_opt" type="text" className="form-input" value={codigoPostal}
                      onChange={e => setCodigoPostal(e.target.value)}
                      onBlur={() => codigoPostal.trim() && autoSaveField('codigoPostal', codigoPostal)}
                      disabled={!pais}
                      placeholder={pais ? "C.P." : "Selecciona país primero"} style={{ borderLeft: `3px solid ${!pais ? '#cbd5e1' : codigoPostal.trim() ? '#10b981' : '#f59e0b'}`, cursor: !pais ? 'not-allowed' : 'text' }} />
                  )}
                </div>
                <div className="form-group" style={{ position: 'relative' }}>
                  <label htmlFor="poblacion_opt" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span>Población</span>
                    <span className={`required-badge ${poblacion.trim() ? 'filled' : 'pending'}`}>{poblacion.trim() ? '✓' : '—'}</span>
                  </label>
                  {pais === 'España' ? (
                    <>
                      <div className="autocomplete-wrapper">
                        <input id="poblacion_opt" type="text" className="form-input autocomplete-input" value={poblacion}
                          autoComplete="off"
                          onChange={e => {
                            const val = e.target.value;
                            setPoblacion(val);
                            if (ciudadTimeoutRef.current) clearTimeout(ciudadTimeoutRef.current);
                            ciudadTimeoutRef.current = setTimeout(() => searchLocation(val, 'ciudad', 'optional'), 300);
                          }}
                          onFocus={() => searchLocation(poblacion, 'ciudad', 'optional')}
                          onClick={(e) => {
                            e.stopPropagation();
                            searchLocation(poblacion, 'ciudad', 'optional');
                          }}
                          onBlur={() => {
                            setTimeout(() => setShowCiudadDropdownOpt(false), 200);
                            if (poblacion.trim()) autoSaveField('poblacion', poblacion);
                          }}
                          placeholder="Ciudad / Municipio" style={{ borderLeft: `3px solid ${poblacion.trim() ? '#10b981' : '#f59e0b'}` }} />
                        <svg className="autocomplete-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                        </svg>
                      </div>
                      {showCiudadDropdownOpt && ciudadSuggestions.length > 0 && (
                        <ul className="location-dropdown">
                          {ciudadSuggestions.map((s, i) => (
                            <li key={i} onMouseDown={() => {
                              setPoblacion(s.ciudad);
                              setCodigoPostal(s.cp);
                              setShowCiudadDropdownOpt(false);
                              setCiudadSuggestions([]);
                              autoSaveField('poblacion', s.ciudad);
                              autoSaveField('codigoPostal', s.cp);
                            }}>
                              <strong>{s.ciudad}</strong> — CP: {s.cp}
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  ) : (
                    <input id="poblacion_opt" type="text" className="form-input" value={poblacion}
                      onChange={e => setPoblacion(e.target.value)}
                      onBlur={() => poblacion.trim() && autoSaveField('poblacion', poblacion)}
                      disabled={!pais}
                      placeholder={pais ? "Ciudad / Municipio" : "Selecciona país primero"} style={{ borderLeft: `3px solid ${!pais ? '#cbd5e1' : poblacion.trim() ? '#10b981' : '#f59e0b'}`, cursor: !pais ? 'not-allowed' : 'text' }} />
                  )}
                </div>
              </div>

              <div className="form-grid">
                {/* Domicilio */}
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label htmlFor="domicilio" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span>Domicilio</span>
                    <span style={{ fontSize: '0.75rem', backgroundColor: '#fef3c7', padding: '2px 8px', borderRadius: '12px', color: '#92400e' }}>Para suscripción</span>
                  </label>
                  <input id="domicilio" type="text" className="form-input" value={domicilio}
                    onChange={e => setDomicilio(e.target.value)}
                    onBlur={() => autoSaveField('domicilio', domicilio)}
                    placeholder="Calle, número, piso..." />
                </div>
                {/* Teléfono */}
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label htmlFor="telefono" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span>Teléfono de contacto</span>
                    <span style={{ fontSize: '0.75rem', backgroundColor: '#fef3c7', padding: '2px 8px', borderRadius: '12px', color: '#92400e' }}>Para suscripción</span>
                  </label>
                  <input id="telefono" type="tel" className="form-input" value={telefono}
                    onChange={e => setTelefono(e.target.value)}
                    onBlur={() => autoSaveField('telefono', telefono)}
                    placeholder="+34 600 000 000" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </details>

      {/* ═══════════════════════════════════════════ */}
      {/* 3. SEGURIDAD                                 */}
      {/* ═══════════════════════════════════════════ */}
      <details open>
        <summary>🔒 Seguridad</summary>
        <div className="accordion-body">
          <div className="form-grid">
            {/* Restablecer contraseña */}
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label>Contraseña</label>
              <div className="password-reset-box">
                <p>Con Firebase Authentication, las contraseñas se gestionan de forma segura. Pulsa el botón para recibir un email de restablecimiento.</p>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={handlePasswordReset}
                  disabled={passwordResetSent}
                  style={{ marginTop: '8px' }}
                >
                  {passwordResetSent ? '📧 Email enviado — revisa tu bandeja' : '🔑 Enviar email de restablecimiento de contraseña'}
                </button>
              </div>
            </div>

            {/* Passkeys (WebAuthn) */}
            <div className="form-group" style={{ gridColumn: 'span 2', marginTop: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                Huella Digital o FaceID (Passkey)
                {profile?.passkeysCount && profile.passkeysCount > 0 ? (
                  <span style={{ fontSize: '0.75rem', background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold' }}>
                    ✅ Activada ({profile.passkeysCount})
                  </span>
                ) : (
                  <span style={{ fontSize: '0.75rem', background: '#f1f5f9', color: '#64748b', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold' }}>
                    Inactiva
                  </span>
                )}
              </label>
              <div className="password-reset-box" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                {profile?.passkeysCount && profile.passkeysCount > 0 ? (
                  <p style={{ color: '#15803d', fontWeight: 500 }}>¡Genial! Tienes la biometría configurada. Puedes iniciar sesión de forma rápida y segura en tus dispositivos registrados.</p>
                ) : (
                  <p>Usa la biometría nativa de tu dispositivo para iniciar sesión sin contraseña, con la máxima seguridad y comodidad.</p>
                )}
                <button
                  type="button"
                  onClick={handleRegisterPasskey}
                  style={{ marginTop: '8px', padding: '8px 16px', background: '#f8fafc', color: '#1e293b', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  <span style={{ fontSize: '1.2rem' }}>👁️</span> {profile?.passkeysCount && profile.passkeysCount > 0 ? 'Vincular otro dispositivo' : 'Vincular Nueva Huella / Dispositivo'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </details>

      {/* ═══════════════════════════════════════════ */}
      {/* 4. ROLES Y SUSCRIPCIONES                     */}
      {/* ═══════════════════════════════════════════ */}
      <details open>
        <summary>⭐ Roles y Suscripciones</summary>
        <div className="accordion-body">
          <label className="section-label">Roles Actuales Aprobados</label>
          <div className="roles-display">
{roles.map((rol) => (
              <span key={rol} className="role-tag">✅ {rol}</span>
            ))}
          </div>

          <label className="section-label" style={{ marginTop: '20px' }}>Vitrina Temporal de Logros</label>
          <div className="achievements-timeline" style={{ background: 'var(--bg-card)', padding: '15px', borderRadius: '12px', border: '1px solid var(--border-color)', marginTop: '10px' }}>
            {achievementsHistory.length > 0 ? (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, borderLeft: '2px solid var(--accent-amber)', marginLeft: '10px' }}>
                {achievementsHistory.map((logro, i) => (
                  <li key={i} style={{ paddingLeft: '20px', position: 'relative', marginBottom: i === achievementsHistory.length - 1 ? '0' : '15px' }}>
                    <span style={{
                      position: 'absolute', left: '-11px', top: '2px', width: '20px', height: '20px',
                      background: 'var(--accent-amber)', borderRadius: '50%', border: '4px solid var(--bg-card)'
                    }}></span>
                    <strong style={{ color: 'var(--accent-amber)', fontSize: '1.05rem', display: 'block' }}>{logro.nombre_logro}</strong>
                    <small style={{ color: 'var(--text-muted)' }}>Desbloqueado el {new Date(logro.fecha_desbloqueo).toLocaleDateString('es-ES')} a las {new Date(logro.fecha_desbloqueo).toLocaleTimeString('es-ES', {hour: '2-digit', minute:'2-digit'})}</small>
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>Aún no has desbloqueado ningún logro. ¡Sigue interactuando en la comunidad!</p>
            )}
          </div>

          <label className="section-label" style={{ marginTop: '20px' }}>Nivel de Suscripción Actual</label>

          {/* ── Timeline de Suscripción ── */}
          {(() => {
            const plan = (profile?.suscripcion || 'Gratuito').toLowerCase();
            const isPremium = plan === 'premium';
            const isAvanzado = plan === 'avanzado' || plan === 'pro';
            const isEsencial = plan === 'esencial' || plan === 'plus';
            const isGratuito = !isPremium && !isAvanzado && !isEsencial;

            const segments = [
              { key: 'premium',  label: 'Premium',  icon: '🌳', color: '#d97706', bg: '#fffbeb', price: '14,99€' },
              { key: 'avanzado', label: 'Avanzado', icon: '🌿', color: '#2563eb', bg: '#eff6ff', price: '9,99€' },
              { key: 'esencial', label: 'Esencial', icon: '🌱', color: '#059669', bg: '#f0fdf4', price: '4,99€' },
              { key: 'gratuito', label: 'Gratuito', icon: '🌰', color: '#94a3b8', bg: '#f8fafc', price: 'Gratis' },
            ];

            const currentIdx = isPremium ? 0 : isAvanzado ? 1 : isEsencial ? 2 : 3;
            const currentSeg = segments[currentIdx];

            const DAYS_PER_SEG = 30;
            const diasRestantes = profile?.fechaCaducidadSuscripcion ? Math.ceil((new Date(profile.fechaCaducidadSuscripcion).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null;
            const daysInCurrent = diasRestantes !== null ? Math.min(diasRestantes, DAYS_PER_SEG) : DAYS_PER_SEG;
            const elapsedInCurrent = DAYS_PER_SEG - daysInCurrent;
            const totalTrialDays = DAYS_PER_SEG * 3;
            const globalElapsed = isGratuito ? totalTrialDays : (currentIdx * DAYS_PER_SEG) + elapsedInCurrent;
            const markerPct = Math.min(100, (globalElapsed / totalTrialDays) * 100);
            const urgentColor = diasRestantes !== null && diasRestantes <= 7 ? '#ef4444' : currentSeg.color;
            const showTimeline = !isGratuito;


            return (
              <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: showTimeline ? '18px' : '0', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '2rem' }}>{currentSeg.icon}</span>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '1.05rem', color: currentSeg.color, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        Plan {currentSeg.label}
                        {profile?.esPrueba && <span style={{ fontSize: '0.68rem', background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: '10px', fontWeight: 700 }}>PERIODO DE PRUEBA</span>}
                      </div>
                      {!isGratuito && <small style={{ color: '#94a3b8', fontSize: '0.78rem' }}>{currentSeg.price}/mes</small>}
                    </div>
                  </div>
                  {diasRestantes !== null && diasRestantes >= 0 && profile?.fechaCaducidadSuscripcion && (
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{profile.esPrueba ? 'Baja al siguiente el' : 'Expira el'}</div>
                      <div style={{ fontWeight: 700, color: urgentColor, fontSize: '0.95rem' }}>
                        {new Date(profile.fechaCaducidadSuscripcion).toLocaleDateString('es-ES')}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: urgentColor, fontWeight: 600 }}>
                        {diasRestantes === 1 ? '1 día' : `${diasRestantes} días`}
                        {segments[currentIdx + 1] && <span style={{ fontWeight: 400, color: '#94a3b8' }}>{' '}para bajar a {segments[currentIdx + 1].label}</span>}
                      </div>
                    </div>
                  )}
                </div>
                {showTimeline && (() => {
                  const BLOCKS = 30;
                  const daysLeft = Math.max(0, Math.min(diasRestantes ?? BLOCKS, BLOCKS));

                  // Calcular fechas de transición desde la fecha de caducidad actual
                  const expiry = profile?.fechaCaducidadSuscripcion ? new Date(profile.fechaCaducidadSuscripcion) : null;
                  const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86400000);
                  const fmt = (d: Date | null) => d ? d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) : '';

                  // Fechas cuando cada plan termina (= empieza el siguiente)
                  const datePremEnd   = isPremium   ? expiry         : isAvanzado ? (expiry ? addDays(expiry, -30) : null) : isEsencial ? (expiry ? addDays(expiry, -60) : null) : null;
                  const dateAvzEnd    = isPremium   ? (expiry ? addDays(expiry,  30) : null) : isAvanzado ? expiry : isEsencial ? (expiry ? addDays(expiry, -30) : null) : null;
                  const dateEsEnd     = isPremium   ? (expiry ? addDays(expiry,  60) : null) : isAvanzado ? (expiry ? addDays(expiry,  30) : null) : isEsencial ? expiry : null;

                  const segDates = [datePremEnd, dateAvzEnd, dateEsEnd];

                  return (
                    <div style={{ marginTop: '4px' }}>
                      {/* Grupos de bloques */}
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                        {segments.slice(0, 3).map((seg, segIdx) => {
                          const isPast    = segIdx < currentIdx;
                          const isCurrent = segIdx === currentIdx;
                          const isFuture  = segIdx > currentIdx;
                          return (
                            <div key={seg.key} style={{ flex: 1, minWidth: 0 }}>
                              {/* Icono + label */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '5px' }}>
                                <span style={{ fontSize: '0.9rem', opacity: isPast ? 0.3 : 1 }}>{seg.icon}</span>
                                <span style={{ fontSize: '0.62rem', fontWeight: isCurrent ? 800 : 500, color: isCurrent ? seg.color : '#94a3b8', opacity: isPast ? 0.4 : 1 }}>{seg.label}</span>
                              </div>
                              {/* 30 bloques */}
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px' }}>
                                {Array.from({ length: BLOCKS }).map((_, dayIdx) => {
                                  const globalIdx = segIdx * 30 + dayIdx;
                                  const lightness = 30 + (globalIdx / 89) * 50;
                                  const bg = `hsl(142, 76%, ${lightness}%)`;
                                  let opacity: number;
                                  if (isPast) {
                                    opacity = 0.1;
                                  } else if (isCurrent) {
                                    const elapsed = BLOCKS - daysLeft;
                                    opacity = dayIdx < elapsed ? 0.12 : 1;
                                  } else {
                                    opacity = 0.25;
                                  }
                                  return (
                                    <div key={dayIdx} style={{
                                      width: 'calc((100% - 58px) / 30)',
                                      minWidth: '5px',
                                      height: '12px',
                                      borderRadius: '2px',
                                      background: bg,
                                      opacity,
                                      transition: 'opacity 0.3s ease',
                                      flexShrink: 0,
                                    }} />
                                  );
                                })}
                              </div>
                              {/* Fechas inicio (izq) y fin (der) del segmento */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                                {/* Fecha inicio: solo en el primer segmento */}
                                <div style={{ fontSize: '0.58rem', color: '#64748b', fontWeight: 500, opacity: segIdx === 0 ? 1 : 0 }}>
                                  {segIdx === 0 ? fmt(expiry ? addDays(expiry, -(currentIdx + 1) * 30) : null) : ''}
                                </div>
                                {/* Fecha fin: al final del segmento */}
                                {segDates[segIdx] ? (
                                  <div style={{ fontSize: '0.58rem', color: '#64748b', fontWeight: 500, textAlign: 'right' }}>
                                    {fmt(segDates[segIdx])}
                                  </div>
                                ) : <div />}
                              </div>
                            </div>
                          );
                        })}
                        {/* Gratuito permanente */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', paddingTop: '2px', minWidth: '36px' }}>
                          <span style={{ fontSize: '1rem', opacity: 0.7 }}>{segments[3].icon}</span>
                          <span style={{ fontSize: '0.55rem', color: '#94a3b8', fontWeight: 600, textAlign: 'center', lineHeight: 1.2, marginTop: '2px' }}>Gratis<br/>perm.</span>
                          {dateEsEnd && (
                            <div style={{ fontSize: '0.55rem', color: '#64748b', marginTop: '4px', textAlign: 'center', fontWeight: 500 }}>
                              {fmt(dateEsEnd)}
                            </div>
                          )}
                        </div>
                      </div>
                      {/* Leyenda */}
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8', textAlign: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '8px', marginTop: '10px' }}>
                        {profile?.esPrueba
                          ? '🎁 3 meses gratuitos · Premium → Avanzado → Esencial → Gratuito (permanente)'
                          : '🔄 Si no renuevas: → Avanzado (1 mes) → Esencial (1 mes) → Gratuito (permanente)'}
                      </div>
                    </div>
                  );
                })()}
              </div>
            );
          })()}

          <div style={{ marginTop: '16px', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            <button 
              type="button" 
              className="btn btn-primary"
              onClick={() => setShowPlanModal(true)}
            >
              ⚙️ Gestionar mi plan
            </button>
            <button 
              type="button" 
              className="btn btn-ghost"
              onClick={() => setShowCompareModal(true)}
            >
              📊 Comparar planes
            </button>
          </div>

          {/* ═══ MODAL: GESTIONAR PLAN ═══ */}
          {showPlanModal && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(2,6,23,0.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
              <div style={{ background: 'white', borderRadius: '20px', width: '100%', maxWidth: '520px', overflow: 'hidden', boxShadow: '0 25px 60px rgba(0,0,0,0.35)' }}>
                {/* Header */}
                <div style={{ background: 'linear-gradient(135deg, #1e3a8a, #2563eb)', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ color: 'white', margin: 0, fontWeight: 800, fontSize: '1.1rem' }}>⚙️ Gestionar mi Plan</h3>
                  <button onClick={() => setShowPlanModal(false)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', borderRadius: '8px', padding: '4px 10px', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
                </div>
                {/* Body */}
                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* Plan actual */}
                  <div style={{ padding: '14px', background: '#f0f9ff', borderRadius: '12px', border: '1px solid #bae6fd', marginBottom: '4px' }}>
                    <div style={{ fontSize: '0.78rem', color: '#0369a1', fontWeight: 600, marginBottom: '4px' }}>PLAN ACTUAL</div>
                    <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0c4a6e' }}>{profile?.suscripcion || 'Gratuito'}{profile?.esPrueba ? ' (Prueba)' : ''}</div>
                    {profile?.fechaCaducidadSuscripcion && diasRestantes !== null && <small style={{ color: '#0369a1' }}>{diasRestantes >= 0 ? `Quedan ${diasRestantes} días` : 'Periodo finalizado'}</small>}
                  </div>
                  {/* Opciones de upgrade */}
                  {[{ plan: 'Esencial / Plus', price: '4,99 €/mes', icon: '🌱', color: '#059669', features: ['2 fotos de perfil', 'Calendario Lunar', '3 ofertas de semillas'] },
                    { plan: 'Avanzado / Pro', price: '9,99 €/mes', icon: '🌿', color: '#2563eb', features: ['3 fotos de perfil', 'Calendario Biod.', '10 ofertas de semillas'] },
                    { plan: 'Premium', price: '14,99 €/mes', icon: '🌳', color: '#d97706', features: ['5 fotos de perfil', 'Todos los calendarios', 'Ofertas ilimitadas', 'IA avanzada'] },
                  ].map(({ plan, price, icon, color, features }) => (
                    <div key={plan} style={{ padding: '14px', borderRadius: '12px', border: `1.5px solid ${color}30`, background: `${color}08`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                      <div>
                        <div style={{ fontWeight: 700, color, display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>{icon}</span> {plan}
                        </div>
                        <ul style={{ margin: '4px 0 0', padding: '0 0 0 16px', fontSize: '0.75rem', color: '#64748b' }}>
                          {features.map(f => <li key={f}>{f}</li>)}
                        </ul>
                      </div>
                      <button
                        style={{ background: color, color: 'white', border: 'none', borderRadius: '10px', padding: '8px 14px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', fontSize: '0.82rem' }}
                        onClick={() => { alert(`👄 Funcionalidad de pago en desarrollo. Plan: ${plan} — ${price}`); }}
                      >
                        {price}
                      </button>
                    </div>
                  ))}
                  {/* Cancelar (solo si es de pago) */}
                  {profile?.suscripcion && !profile.esPrueba && !['gratuito','free'].includes((profile.suscripcion || '').toLowerCase()) && (
                    <button style={{ background: 'none', border: '1px solid #fca5a5', color: '#ef4444', borderRadius: '10px', padding: '8px', cursor: 'pointer', fontSize: '0.8rem', marginTop: '4px' }}
                      onClick={() => { if (confirm('¿Seguro que quieres cancelar tu suscripción de pago?')) { alert('Solicitud enviada. El equipo de soporte procesará la cancelación.'); setShowPlanModal(false); } }}
                    >
                      Cancelar suscripción de pago
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ═══ MODAL: COMPARAR PLANES ═══ */}
          {showCompareModal && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(2,6,23,0.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
              <div style={{ background: 'white', borderRadius: '20px', width: '100%', maxWidth: '780px', maxHeight: '85vh', overflow: 'auto', boxShadow: '0 25px 60px rgba(0,0,0,0.35)' }}>
                <div style={{ background: 'linear-gradient(135deg, #1e3a8a, #2563eb)', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0 }}>
                  <h3 style={{ color: 'white', margin: 0, fontWeight: 800, fontSize: '1.1rem' }}>📊 Comparar Planes Verdantia</h3>
                  <button onClick={() => setShowCompareModal(false)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', borderRadius: '8px', padding: '4px 10px', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
                </div>
                <div style={{ padding: '24px', overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr>
                        {[{ label: 'Característica', color: '#f8fafc', textColor: '#64748b' },
                          { label: '🌰 Gratuito\n0 €', color: '#f8fafc', textColor: '#64748b' },
                          { label: '🌱 Esencial\n4,99 €/mes', color: '#f0fdf4', textColor: '#059669' },
                          { label: '🌿 Avanzado\n9,99 €/mes', color: '#eff6ff', textColor: '#2563eb' },
                          { label: '🌳 Premium\n14,99 €/mes', color: '#fffbeb', textColor: '#d97706' },
                        ].map(({ label, color, textColor }, i) => (
                          <th key={i} style={{ background: color, color: textColor, padding: '10px 12px', textAlign: i === 0 ? 'left' : 'center', fontWeight: 700, borderBottom: '2px solid #e2e8f0', whiteSpace: 'pre-line', fontSize: i === 0 ? '0.78rem' : '0.82rem' }}>{label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ['Fotos de perfil', '1', '2', '3', '5'],
                        ['Plantas activas', '10', '25', '50', 'Ilimitadas'],
                        ['Ofertas de semillas', '1', '3', '10', 'Ilimitadas'],
                        ['Calendario Normal', '✅', '✅', '✅', '✅'],
                        ['Calendario Lunar', '❌', '✅', '✅', '✅'],
                        ['Calendario Biod.', '❌', '❌', '✅', '✅'],
                        ['Generador IA imágenes', '❌', '❌', '5/mes', 'Ilimitado'],
                        ['Chat Comunidad', '✅', '✅', '✅', '✅'],
                        ['Soporte prioritario', '❌', '❌', '✅', '✅'],
                        ['Sin publicidad', '❌', '✅', '✅', '✅'],
                      ].map((row, i) => (
                        <tr key={i} style={{ background: i % 2 === 0 ? '#f8fafc' : 'white' }}>
                          {row.map((cell, j) => (
                            <td key={j} style={{ padding: '9px 12px', textAlign: j === 0 ? 'left' : 'center', borderBottom: '1px solid #f1f5f9', color: j === 0 ? '#1e293b' : (cell === '❌' ? '#94a3b8' : (cell === '✅' ? '#059669' : '#334155')), fontWeight: j === 4 ? 600 : (j === 0 ? 600 : 400) }}>{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div style={{ marginTop: '20px', padding: '14px', background: '#fffbeb', borderRadius: '10px', border: '1px solid #fde68a', fontSize: '0.82rem', color: '#92400e', lineHeight: 1.7 }}>
                    🎁 <strong>¡3 meses gratuitos al verificar tu correo!</strong> — Sin tarjeta de crédito.<br />
                    <span style={{ opacity: 0.85 }}>Mes 1: Premium completo · Mes 2: Avanzado · Mes 3: Esencial · Mes 4 en adelante: Gratuito permanente.</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </details>

      {/* ═══════════════════════════════════════════ */}
      {/* 5. POLÍTICA DE PRIVACIDAD (RGPD)             */}
      {/* ═══════════════════════════════════════════ */}
      <details open>
        <summary>📋 Política de Privacidad</summary>
        <div className="accordion-body">
          <div className="privacy-box">
            <label className="section-label">🛡️ Tratamiento de Datos Personales (RGPD)</label>
            <label className="privacy-check">
              <input
                type="checkbox"
                checked={privacidadAceptada}
                onChange={e => {
                  if (!e.target.checked) {
                    const confirmar = confirm('⚠️ ATENCIÓN: La aceptación de la Política de Privacidad es obligatoria para usar Verdantia.\n\nSi decides retirarla, tu cuenta debe ser cancelada inmediatamente por imperativo legal (RGPD).\n\n¿Deseas proceder con la cancelación de tu cuenta?');
                    if (!confirmar) { e.preventDefault(); return; }
                  }
                  setPrivacidadAceptada(e.target.checked);
                }}
              />
              <span>
                Acepto la <a href="/politica-privacidad" target="_blank" style={{ color: 'var(--storm-primary)', fontWeight: 600 }}>Política de Privacidad</a> y los Términos de Uso de Verdantia. Entiendo que mis datos serán tratados conforme a lo descrito.
              </span>
            </label>
            <div className="privacy-status signed">
              ✅ Firma electrónica registrada
            </div>
          </div>
        </div>
      </details>

      {/* ═══════════════════════════════════════════ */}
      {/* 6. ZONA DE PELIGRO — CANCELAR CUENTA         */}
      {/* ═══════════════════════════════════════════ */}
      <details>
        <summary className="danger-summary">⚠️ Zona de Peligro — Cancelar Cuenta</summary>
        <div className="accordion-body">
          <div className="danger-zone">
            <h4>🗑️ Eliminar mi cuenta permanentemente</h4>
            <p className="danger-text">
              Antes de irte, por favor indícanos el motivo:
            </p>

            <select
              className="form-input danger-select"
              value={motivoBaja}
              onChange={e => setMotivoBaja(e.target.value)}
            >
              <option value="" disabled>— Selecciona un motivo —</option>
              {MOTIVOS_BAJA.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>

            {motivoBaja === 'Otro' && (
              <textarea
                className="form-textarea"
                placeholder="Cuéntanos más para poder mejorar..."
                value={motivoLibre}
                onChange={e => setMotivoLibre(e.target.value)}
                style={{ marginTop: '12px', borderColor: '#fca5a5' }}
              />
            )}

            <ul className="danger-list">
              <li>Tu perfil se ocultará de inmediato.</li>
              <li>Tienes 30 días para reactivarla.</li>
              <li>Pasados 30 días, la eliminación es irreversible.</li>
            </ul>

            <button
              type="button"
              className="btn-danger"
              onClick={handleCancelAccount}
            >
              🗑️ Solicitar Borrado de Cuenta
            </button>
          </div>
        </div>
      </details>

      {/* El botón de guardar manual ha sido eliminado en favor del autoguardado */}

      {/* ═══════════════════════════════════════════ */}
      {/* MODAL EDITOR DE FOTOGRAFÍA                   */}
      {/* ═══════════════════════════════════════════ */}
      {editingPhoto && (
        <div className="photo-editor-overlay" onClick={() => setEditingPhoto(null)}>
          <div className="photo-editor-modal" onClick={e => e.stopPropagation()}>
            <div className="photo-editor-header">
              <h3>✏️ Editor de Fotografía</h3>
              <div className="photo-editor-header-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setEditingPhoto(null)}>Cancelar</button>
                <button 
                  type="button" 
                  className={`btn ${photoEditorSaveStatus === 'no-changes' ? '' : 'btn-primary'}`} 
                  style={{
                    backgroundColor: photoEditorSaveStatus === 'no-changes' ? '#10b981' : undefined,
                    borderColor: photoEditorSaveStatus === 'no-changes' ? '#10b981' : undefined,
                    color: photoEditorSaveStatus === 'no-changes' ? 'white' : undefined,
                    transition: 'all 0.3s ease',
                    minWidth: '175px'
                  }}
                  onClick={savePhotoEdits} 
                  disabled={photoEditorSaveStatus !== 'idle'}
                >
                  {photoEditorSaveStatus === 'saving' ? '⏳ Guardando...' : 
                   photoEditorSaveStatus === 'no-changes' ? '✓ Sin cambios' : 
                   '💾 Guardar Cambios'}
                </button>
              </div>
            </div>
            <div className="photo-editor-body">
              {/* Preview */}
              <div 
                className="photo-editor-preview"
                onMouseDown={onEditorMouseDown}
                onTouchStart={onEditorTouchStart}
                onTouchMove={onEditorTouchMove}
                style={{ cursor: editorZoom > 100 ? 'grab' : 'default' }}
              >
                <img
                  src={getMediaUrl(editingPhoto.ruta)}
                  alt="Preview"
                  crossOrigin="anonymous"
                  draggable={false}
                  style={{
                    objectPosition: `${editorX}% ${editorY}%`,
                    transformOrigin: `${editorX}% ${editorY}%`,
                    transform: editorZoom > 100 ? `scale(${editorZoom / 100})` : undefined,
                    filter: `${STYLE_FILTERS[editorStyle] === 'none' ? '' : (STYLE_FILTERS[editorStyle] || '')} brightness(${editorBrightness}%) contrast(${editorContrast}%)`.trim(),
                    pointerEvents: 'none'
                  }}
                />
                
                {/* Rejilla de Foto Carnet (3:4) superpuesta */}
                <div className="photo-editor-grid-overlay">
                  <div className="grid-line horizontal"></div>
                  <div className="grid-line horizontal bottom"></div>
                  <div className="grid-line vertical"></div>
                  <div className="grid-line vertical right"></div>
                </div>

              </div>

              {/* Panel lateral */}
              <div className="photo-editor-panel">
                <div className="editor-control">
                  <p className="text-sm text-gray-500 mb-4" style={{ fontStyle: 'italic' }}>
                    <small>💡 Arrastra la foto con el ratón para moverla.</small>
                  </p>
                </div>
                <div className="editor-control">
                  <label>Zoom — {editorZoom}%</label>
                  <input type="range" min="100" max="300" value={editorZoom}
                    onChange={e => setEditorZoom(Number(e.target.value))} />
                </div>
                
                <div className="editor-control">
                  <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Luminosidad — {editorBrightness}%</span>
                    {editorBrightness !== 100 && (
                      <button type="button" onClick={() => setEditorBrightness(100)} className="text-xs text-blue-500 hover:underline">Reset</button>
                    )}
                  </label>
                  <input type="range" min="50" max="150" value={editorBrightness}
                    onChange={e => setEditorBrightness(Number(e.target.value))} />
                </div>
                
                <div className="editor-control">
                  <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Contraste — {editorContrast}%</span>
                    {editorContrast !== 100 && (
                      <button type="button" onClick={() => setEditorContrast(100)} className="text-xs text-blue-500 hover:underline">Reset</button>
                    )}
                  </label>
                  <input type="range" min="50" max="150" value={editorContrast}
                    onChange={e => setEditorContrast(Number(e.target.value))} />
                </div>

                <div className="editor-control">
                  <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Transformación IA</span>
                    <small className="premium-badge">Premium</small>
                  </label>
                  <select value={editorStyle} onChange={e => setEditorStyle(e.target.value)} className="form-input">
                    <option value="">Sin filtro</option>
                    <option value="comic">Comic Suave</option>
                    <option value="manga">Manga B/N</option>
                    <option value="watercolor">Acuarela</option>
                    <option value="sketch">Boceto Lápiz</option>
                    <option value="pop">Pop Color</option>
                    <option value="vintage">Vintage Película</option>
                    <option value="cinematic">Cinemático Frío</option>
                    <option value="hdr">HDR Natural</option>
                  </select>
                </div>



                <div style={{ marginTop: 'auto' }}>
                  <button type="button" className="btn-danger" style={{ width: '100%' }}
                    onClick={() => { deletePhoto(editingPhoto.id); setEditingPhoto(null); }}>
                    🗑️ Eliminar Fotografía
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* MODAL DE LOGRO DESBLOQUEADO                 */}
      {/* ═══════════════════════════════════════════ */}
      {unlockedAchievement && (
        <div className="achievement-modal-overlay">
          <div className="achievement-modal">
            <div className="achievement-icon-wrapper">
              <span>🧑‍🌾</span>
            </div>
            <h2>¡Enhorabuena!</h2>
            <p>Has desbloqueado el logro <strong>{unlockedAchievement}</strong> al completar tu perfil.</p>
            <p className="achievement-desc">Ya no eres un simple Visitante. Ahora tienes permisos para empezar a registrar semillas y crear tus propios huertos. ¡Bienvenido oficialmente a Verdantia!</p>
            
            {isUnderage && (
              <div className="highlight-box highlight-amber" style={{ margin: '15px 0', textAlign: 'left', fontSize: '0.85rem' }}>
                <span style={{ fontSize: '1.2rem' }}>⚠️</span>
                <span><strong>Aviso legal:</strong> Al tener menos de 18 años, tu cuenta ha sido configurada con protección al menor. Tienes pleno acceso a la comunidad, pero <strong>no podrás adquirir suscripciones de pago</strong>.</span>
              </div>
            )}

            <button className="btn btn-primary" onClick={() => setUnlockedAchievement(null)} style={{ width: '100%', padding: '12px', fontSize: '1rem', marginTop: '10px' }}>
              ¡A cultivar!
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* MODAL DE LOGRO PERDIDO                      */}
      {/* ═══════════════════════════════════════════ */}
      {lostAchievement && (
        <div className="achievement-modal-overlay">
          <div className="achievement-modal" style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 4px rgba(239, 68, 68, 0.2)' }}>
            <div className="achievement-icon-wrapper" style={{ background: 'linear-gradient(135deg, #fee2e2, #fca5a5)', border: '4px solid #ef4444', boxShadow: '0 10px 25px rgba(239, 68, 68, 0.4)' }}>
              <span style={{ filter: 'grayscale(100%)' }}>🧳</span>
            </div>
            <h2 style={{ color: '#b91c1c' }}>Rango Perdido</h2>
            <p>Has perdido el logro <strong>{lostAchievement}</strong> al eliminar datos obligatorios de tu perfil.</p>
            <p className="achievement-desc" style={{ background: 'rgba(239, 68, 68, 0.1)' }}>Has vuelto a ser un Visitante. Para recuperar tus permisos de siembra y tus insignias, vuelve a rellenar tu Nombre y Fecha de Nacimiento.</p>
            <button className="btn btn-danger" onClick={() => setLostAchievement(null)} style={{ width: '100%', padding: '12px', fontSize: '1rem' }}>
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PerfilPage() {
  return (
    <Suspense fallback={<div className="loading-screen"><div className="loading-spinner"></div><p>Cargando perfil...</p></div>}>
      <PerfilContent />
    </Suspense>
  );
}

