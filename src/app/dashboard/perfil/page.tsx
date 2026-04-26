'use client';

import React, { useEffect, useState, useCallback, useRef, Suspense } from 'react';
import { auth } from '@/lib/firebase/config';
import { onAuthStateChanged, sendPasswordResetEmail } from 'firebase/auth';
import { useRouter, useSearchParams } from 'next/navigation';
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
}

const getMaxPhotos = (plan: string = 'Básica') => {
  if (plan === 'Premium') return 5;
  if (plan === 'Normal') return 3;
  return 1;
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

  // Location autocomplete
  const [cpSuggestions, setCpSuggestions] = useState<{cp: string; ciudad: string}[]>([]);
  const [ciudadSuggestions, setCiudadSuggestions] = useState<{cp: string; ciudad: string}[]>([]);
  const [showCpDropdown, setShowCpDropdown] = useState(false);
  const [showCiudadDropdown, setShowCiudadDropdown] = useState(false);
  const [showCpDropdownOpt, setShowCpDropdownOpt] = useState(false);
  const [showCiudadDropdownOpt, setShowCiudadDropdownOpt] = useState(false);
  const cpTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const ciudadTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
      showToast(`⚠️ Límite alcanzado: Tu plan ${profile.suscripcion || 'Básica'} permite un máximo de ${maxPhotos} foto(s).`);
      return;
    }

    if (!file.type.startsWith('image/')) {
      showToast('⚠️ Solo se permiten imágenes.');
      return;
    }
    setUploading(true);
    showToast('🤖 IA procesando: quitando fondo y centrando cara...');

    try {
      // ── Paso 1: Eliminar fondo y poner blanco ──
      let processedBlob: Blob = file;
      try {
        const { removeBackground } = await import('@imgly/background-removal');
        const resultBlob = await removeBackground(file, {
          output: { format: 'image/png' }
        });
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
      } catch (bgErr: any) {
        console.warn('[BG Removal] No disponible, subiendo original:', bgErr);
        showToast('⚠️ No se pudo quitar el fondo. Subiendo foto original...');
        processedBlob = file;
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

      // ── Paso 3: Subir la imagen (siempre se ejecuta) ──
      const formData = new FormData();
      const safeName = (file.name && file.name !== 'image.jpg' && file.name !== 'image.jpeg') 
        ? file.name.replace(/\.\w+$/, '.jpg') 
        : `foto_${Date.now()}.jpg`;
      formData.append('file', processedBlob, safeName);
      formData.append('userId', String(profile.id));
      formData.append('faceX', String(Math.round(faceX)));
      formData.append('faceY', String(Math.round(faceY)));
      formData.append('faceZoom', String(autoZoom));

      const res = await fetch('/api/perfil/photos', {
        method: 'POST',
        body: formData
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
    try {
      await fetch('/api/perfil/photos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoId, userId: profile.id, action: 'setPrincipal' })
      });
      showToast('⭐ Foto preferida actualizada');
      loadPhotos(profile.id);
    } catch { /* silencioso */ }
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
      const resp = await fetch(`/${editingPhoto.ruta}`);
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
  const autoSaveIcon = async (newIcon: string) => {
    if (!profile) return;
    setIcono(newIcon);
    
    // Live update de cabecera y sidebar
    const headerAvatar = document.querySelector('.profile-avatar');
    const sidebarAvatar = document.querySelector('.profile-icon');
    if (headerAvatar) headerAvatar.textContent = newIcon || '🌱';
    if (sidebarAvatar) sidebarAvatar.textContent = newIcon || '🌱';

    try {
      await fetch('/api/perfil', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: profile.email, icono: newIcon })
      });
      showToast('✅ Icono de perfil actualizado');
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
        // Actualizar nombre en la cabecera si cambió nombre/nombreUsuario
        if (fieldName === 'nombre' || fieldName === 'nombreUsuario') {
          const displayN = (fieldName === 'nombreUsuario' ? value : nombreUsuario) || (fieldName === 'nombre' ? value : nombre) || 'Agricultor';
          const headerName = document.querySelector('.header-greeting strong');
          const sidebarName = document.querySelector('.profile-name');
          if (headerName) headerName.textContent = displayN;
          if (sidebarName) sidebarName.textContent = displayN;
        }
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
      const res = await fetch('/api/perfil', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: profile.email, apellidos, nombreUsuario, poblacion, domicilio, telefono
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast('✅ Perfil actualizado correctamente');
        const headerName = document.querySelector('.header-greeting strong');
        const sidebarName = document.querySelector('.profile-name');
        const displayN = nombreUsuario || nombre || 'Agricultor';
        if (headerName) headerName.textContent = displayN;
        if (sidebarName) sidebarName.textContent = displayN;
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
      if (verifyRes.ok) alert('✅ ¡Huella o biometría registrada con éxito!');
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
    const newIcon = icono === icon ? '' : icon;
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
  const updateLiveHeaderName = () => {
    const displayN = nombreUsuario || nombre || 'Agricultor';
    const headerName = document.querySelector('.header-greeting strong');
    if (headerName) headerName.textContent = displayN;
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
        <summary>📸 Fotografía e Iconos</summary>
        <div className="accordion-body">
          {/* ── Galería de Fotos ── */}
          <label className="section-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Fotos de Perfil</span>
            <small style={{ color: photos.length >= getMaxPhotos(profile?.suscripcion) ? '#ef4444' : '#64748b' }}>
              {photos.length} / {getMaxPhotos(profile?.suscripcion)} permitidas ({profile?.suscripcion || 'Básica'})
            </small>
          </label>
          <div className={`photo-gallery-grid ${dragOver ? 'drag-over' : ''}`}>
            {[...photos]
              .sort((a, b) => (a.esPrincipal === b.esPrincipal ? 0 : a.esPrincipal ? -1 : 1))
              .map((photo, i) => {
              let meta: { profile_object_x: number; profile_object_y: number; profile_object_zoom: number; profile_style: string; profile_brightness?: number; profile_contrast?: number } = { profile_object_x: 50, profile_object_y: 38, profile_object_zoom: 100, profile_style: '' };
              try { meta = { ...meta, ...JSON.parse(photo.resumen || '{}') }; } catch {}
              
              const isLocked = i >= getMaxPhotos(profile?.suscripcion);
              
              return (
              <div
                key={photo.id}
                className={`photo-item ${photo.esPrincipal ? 'is-preferred' : ''} ${isLocked ? 'is-locked' : ''}`}
                style={{ position: 'relative' }}
              >
                <img
                  src={`/${photo.ruta}`}
                  alt="Foto de perfil"
                  onClick={() => !isLocked && openPhotoEditor(photo)}
                  style={{
                    cursor: isLocked ? 'not-allowed' : 'pointer',
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

            {/* Zona de Drop / Subir */}
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
                      if (profile?.suscripcion === 'Básica') {
                        showToast('❌ El calendario Lunar requiere un plan Normal o Premium');
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
                      cursor: profile?.suscripcion === 'Básica' ? 'not-allowed' : 'pointer',
                      background: tipoCalendario === 'Lunar' ? '#eff6ff' : (profile?.suscripcion === 'Básica' ? '#f8fafc' : '#ffffff'),
                      opacity: profile?.suscripcion === 'Básica' ? 0.6 : 1,
                      transition: 'all 0.2s ease',
                      position: 'relative'
                    }}
                  >
                    {profile?.suscripcion === 'Básica' && <div style={{ position: 'absolute', top: 10, right: 10, fontSize: '1.2rem' }}>🔒</div>}
                    <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🌔</div>
                    <h4 style={{ margin: '0 0 5px 0', color: '#1e3a8a' }}>Calendario Lunar</h4>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Añade la influencia gravitacional y fases de la luna para optimizar la savia.</p>
                    <span style={{ display: 'inline-block', marginTop: '8px', fontSize: '0.7rem', padding: '3px 8px', background: '#dbeafe', color: '#1d4ed8', borderRadius: '10px', fontWeight: 'bold' }}>Requiere Plan Normal</span>
                  </div>

                  {/* Biodinámico */}
                  <div 
                    onClick={() => {
                      if (profile?.suscripcion !== 'Premium') {
                        showToast('❌ El calendario Biodinámico es exclusivo para cuentas Premium');
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
                      cursor: profile?.suscripcion !== 'Premium' ? 'not-allowed' : 'pointer',
                      background: tipoCalendario === 'Biodinámico' ? '#f5f3ff' : (profile?.suscripcion !== 'Premium' ? '#f8fafc' : '#ffffff'),
                      opacity: profile?.suscripcion !== 'Premium' ? 0.6 : 1,
                      transition: 'all 0.2s ease',
                      position: 'relative'
                    }}
                  >
                    {profile?.suscripcion !== 'Premium' && <div style={{ position: 'absolute', top: 10, right: 10, fontSize: '1.2rem' }}>🔒</div>}
                    <div style={{ fontSize: '2rem', marginBottom: '8px' }}>✨</div>
                    <h4 style={{ margin: '0 0 5px 0', color: '#4c1d95' }}>Calendario Biodinámico</h4>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Cosmos, constelaciones y elementos (raíz, hoja, flor, fruto) según Maria Thun.</p>
                    <span style={{ display: 'inline-block', marginTop: '8px', fontSize: '0.7rem', padding: '3px 8px', background: '#ede9fe', color: '#6d28d9', borderRadius: '10px', fontWeight: 'bold' }}>Exclusivo Premium</span>
                  </div>

                </div>
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
              <label>Huella Digital o FaceID (Passkey)</label>
              <div className="password-reset-box" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                <p>Usa la biometría nativa de tu dispositivo para iniciar sesión sin contraseña, con la máxima seguridad y comodidad.</p>
                <button
                  type="button"
                  onClick={handleRegisterPasskey}
                  style={{ marginTop: '8px', padding: '8px 16px', background: '#f8fafc', color: '#1e293b', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  <span style={{ fontSize: '1.2rem' }}>👁️</span> Vincular Nueva Huella / Dispositivo
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
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: profile?.suscripcion === 'Premium' ? 'rgba(245, 158, 11, 0.1)' : profile?.suscripcion === 'Normal' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(148, 163, 184, 0.1)',
            border: `1px solid ${profile?.suscripcion === 'Premium' ? 'rgba(245, 158, 11, 0.3)' : profile?.suscripcion === 'Normal' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(148, 163, 184, 0.3)'}`,
            padding: '10px 16px',
            borderRadius: '12px',
            fontWeight: '600',
            color: profile?.suscripcion === 'Premium' ? '#d97706' : profile?.suscripcion === 'Normal' ? '#2563eb' : '#64748b'
          }}>
            <span style={{ fontSize: '1.2rem' }}>
              {profile?.suscripcion === 'Premium' ? '🌳' : profile?.suscripcion === 'Normal' ? '🌿' : '🌱'}
            </span>
            <span>Plan {profile?.suscripcion || 'Básica'} {profile?.suscripcion === 'Premium' && profile?.esPrueba && <small style={{ fontWeight: 'normal', opacity: 0.8 }}>(Prueba)</small>}</span>
          </div>

          {profile?.suscripcion !== 'Básica' && (
            <small className="help-text" style={{ marginTop: '10px', display: 'block', color: 'var(--text-secondary)' }}>
              {profile.esPrueba ? (
                <>
                  ⏳ Tu periodo de prueba gratuito finaliza el <strong>{profile.fechaCaducidadSuscripcion ? new Date(profile.fechaCaducidadSuscripcion).toLocaleDateString('es-ES') : 'final del periodo promocional'}</strong>
                  {diasRestantes !== null && diasRestantes >= 0 && <span> (te quedan <strong>{diasRestantes} días</strong>)</span>}. 
                  A partir de esa fecha, tu cuenta comenzará a degradarse al plan Básico.
                </>
              ) : (
                <>
                  💳 Próximo cobro y renovación automática programado para el <strong>{profile.fechaCaducidadSuscripcion ? new Date(profile.fechaCaducidadSuscripcion).toLocaleDateString('es-ES') : 'próximo ciclo de facturación'}</strong>
                  {diasRestantes !== null && diasRestantes >= 0 && <span> (en <strong>{diasRestantes} días</strong>)</span>}.
                </>
              )}
            </small>
          )}

          <div style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
            <button 
              type="button" 
              className="btn btn-primary"
              onClick={() => router.push('/dashboard/suscripcion')}
            >
              ⚙️ Gestionar mi plan
            </button>
            <button 
              type="button" 
              className="btn btn-ghost"
              onClick={() => router.push('/dashboard/suscripcion/comparativa')}
            >
              📊 Comparar planes
            </button>
          </div>
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
                  src={`/${editingPhoto.ruta}`}
                  alt="Preview"
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

