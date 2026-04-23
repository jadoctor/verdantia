'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { auth } from '@/lib/firebase/config';
import { onAuthStateChanged, sendPasswordResetEmail } from 'firebase/auth';
import { useRouter } from 'next/navigation';
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
}

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

export default function PerfilPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [nombre, setNombre] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [pais, setPais] = useState('');
  const [codigoPostal, setCodigoPostal] = useState('');
  const [poblacion, setPoblacion] = useState('');
  const [icono, setIcono] = useState('');

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

  // Privacy & Danger Zone
  const [privacidadAceptada, setPrivacidadAceptada] = useState(true);
  const [motivoBaja, setMotivoBaja] = useState('');
  const [motivoLibre, setMotivoLibre] = useState('');

  // Password
  const [passwordResetSent, setPasswordResetSent] = useState(false);

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
    } catch (err) {
      console.error('Error cargando fotos:', err);
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
          setFechaNacimiento(p.fechaNacimiento || '');
          setPais(p.pais || '');
          setCodigoPostal(p.codigoPostal || '');
          setPoblacion(p.poblacion || '');
          setIcono(p.icono || '');
          loadPhotos(p.id);
        }
      } catch (err) {
        console.error('Error cargando perfil:', err);
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [router, loadPhotos]);

  // ── Subir foto ──
  const uploadPhoto = async (file: File) => {
    if (!profile) return;
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
      } catch (bgErr) {
        console.warn('[BG Removal] No disponible, subiendo original:', bgErr);
        showToast('⚠️ No se pudo quitar el fondo, subiendo la original...');
      }

      // ── Paso 2: Detectar cara para centrado automático + zoom ──
      let faceX = 50, faceY = 38, autoZoom = 100;
      try {
        const faceResult = await detectFaceCenter(processedBlob);
        if (faceResult) {
          faceX = faceResult.x;
          faceY = faceResult.y;

          // Calcular zoom automático según la orientación de la imagen
          // Fotos apaisadas necesitan más zoom para que la cara se vea bien en retrato 3:4
          const tmpImg = new Image();
          const tmpUrl = URL.createObjectURL(processedBlob);
          await new Promise<void>((r) => { tmpImg.onload = () => r(); tmpImg.src = tmpUrl; });
          URL.revokeObjectURL(tmpUrl);
          const ratio = tmpImg.naturalWidth / tmpImg.naturalHeight;
          if (ratio > 1.3) {
            // Foto apaisada: zoom para que la cara no quede diminuta
            autoZoom = Math.min(200, Math.round(ratio * 110));
          } else if (ratio > 1.05) {
            autoZoom = Math.round(ratio * 105);
          }
          showToast(`🎯 Cara detectada (${Math.round(faceX)}%, ${Math.round(faceY)}%) zoom: ${autoZoom}%`);
        }
      } catch { /* usar defaults */ }

      // ── Paso 3: Subir la imagen procesada ──
      const formData = new FormData();
      formData.append('file', processedBlob, file.name.replace(/\.\w+$/, '.jpg'));
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
        showToast('✅ Foto subida y procesada por IA');
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
      } catch (err) {
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
      setEditorX(meta.profile_object_x ?? 50);
      setEditorY(meta.profile_object_y ?? 38);
      setEditorZoom(meta.profile_object_zoom ?? 100);
      setEditorBrightness(meta.profile_brightness ?? 100);
      setEditorContrast(meta.profile_contrast ?? 100);
      setEditorStyle(meta.profile_style ?? '');
    } catch {
      setEditorX(50); setEditorY(38); setEditorZoom(100); 
      setEditorBrightness(100); setEditorContrast(100); setEditorStyle('');
    }
    setEditingPhoto(photo);
  };

  // ── Guardar edición de foto ──
  const savePhotoEdits = async () => {
    if (!editingPhoto || !profile) return;
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
    } catch { showToast('❌ Error guardando ajustes'); }
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
  const autoSavePoblacion = async () => {
    if (!profile) return;
    try {
      await fetch('/api/perfil', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: profile.email, poblacion })
      });
    } catch { /* silencioso */ }
  };

  // ── Guardar todo el perfil ──
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
          email: profile.email, nombre, apellidos, nombreUsuario,
          fechaNacimiento, pais, codigoPostal, poblacion, icono
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast('✅ Perfil actualizado correctamente');
        // Actualizar nombre en la cabecera en tiempo real
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
    const nacimiento = new Date(fechaNacimiento);
    const hoy = new Date();
    let years = hoy.getFullYear() - nacimiento.getFullYear();
    const m = hoy.getMonth() - nacimiento.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) years--;
    return `📅 ${years} años`;
  };

  // Actualización en vivo del nombre en la cabecera
  const updateLiveHeaderName = () => {
    const displayN = nombreUsuario || nombre || 'Agricultor';
    const headerName = document.querySelector('.header-greeting strong');
    if (headerName) headerName.textContent = displayN;
  };

  if (loading) return <div className="loading-screen"><div className="loading-spinner"></div><p>Cargando perfil...</p></div>;
  if (!profile) return <p>No se pudo cargar el perfil.</p>;

  const roles = profile.roles.split(',').map(r => r.trim());
  const isFirebaseVerified = auth.currentUser?.emailVerified ?? false;

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
          <label className="section-label">Fotos de Perfil</label>
          <div className={`photo-gallery-grid ${dragOver ? 'drag-over' : ''}`}>
            {photos.map((photo) => {
              let meta = { profile_object_x: 50, profile_object_y: 38, profile_object_zoom: 100, profile_style: '' };
              try { meta = { ...meta, ...JSON.parse(photo.resumen || '{}') }; } catch {}
              return (
              <div
                key={photo.id}
                className={`photo-item ${photo.esPrincipal ? 'is-preferred' : ''}`}
              >
                <img
                  src={`/${photo.ruta}`}
                  alt="Foto de perfil"
                  onClick={() => openPhotoEditor(photo)}
                  style={{
                    cursor: 'pointer',
                    objectPosition: `${meta.profile_object_x}% ${meta.profile_object_y}%`,
                    transformOrigin: `${meta.profile_object_x}% ${meta.profile_object_y}%`,
                    transform: meta.profile_object_zoom > 100 ? `scale(${meta.profile_object_zoom / 100})` : undefined,
                    filter: `${STYLE_FILTERS[meta.profile_style] === 'none' ? '' : (STYLE_FILTERS[meta.profile_style] || '')} brightness(${meta.profile_brightness ?? 100}%) contrast(${meta.profile_contrast ?? 100}%)`.trim()
                  }}
                />

                <div className="photo-actions">
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
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                    onClick={() => fileInputRef.current?.click()}
                  >📁 Subir archivo</button>
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
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="nombre">Nombre *</label>
              <input id="nombre" type="text" className="form-input" value={nombre}
                onChange={e => { setNombre(e.target.value); }}
                onInput={updateLiveHeaderName}
                required placeholder="Tu nombre" />
            </div>
            <div className="form-group">
              <label htmlFor="apellidos">Apellidos *</label>
              <input id="apellidos" type="text" className="form-input" value={apellidos}
                onChange={e => setApellidos(e.target.value)} required placeholder="Tus apellidos" />
            </div>
            <div className="form-group">
              <label htmlFor="nombre_usuario">Nombre de Usuario</label>
              <input id="nombre_usuario" type="text" className="form-input" value={nombreUsuario}
                onChange={e => { setNombreUsuario(e.target.value); }}
                onInput={updateLiveHeaderName}
                placeholder="Nombre público visible" maxLength={100} />
              <small className="help-text">Nombre visible para los demás usuarios.</small>
            </div>
            <div className="form-group">
              <label htmlFor="fecha_nacimiento">Fecha de Nacimiento</label>
              <input id="fecha_nacimiento" type="date" className="form-input" value={fechaNacimiento}
                onChange={e => setFechaNacimiento(e.target.value)} />
              <small className="help-text">{calcularEdad() || 'Necesaria para verificar la mayoría de edad.'}</small>
            </div>
            <div className="form-group">
              <label htmlFor="pais">País</label>
              <input id="pais" type="text" className="form-input" value={pais}
                onChange={e => setPais(e.target.value)} placeholder="Ej: España" />
            </div>
            <div className="form-group">
              <label htmlFor="codigo_postal">Código Postal</label>
              <input id="codigo_postal" type="text" className="form-input" value={codigoPostal}
                onChange={e => setCodigoPostal(e.target.value)} placeholder="Tu código postal local" />
            </div>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label htmlFor="poblacion">Población (Ciudad / Municipio)</label>
              <input id="poblacion" type="text" className="form-input" value={poblacion}
                onChange={e => setPoblacion(e.target.value)}
                onBlur={autoSavePoblacion}
                placeholder="Para mayor precisión climática" />
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
            {/* Email + Badge de verificación */}
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <div className="email-label-row">
                <label>Correo Electrónico *</label>
                {isFirebaseVerified ? (
                  <span className="verification-badge verified">✅ Verificado</span>
                ) : (
                  <span className="verification-badge unverified">⚠️ No Verificado</span>
                )}
              </div>
              <input type="email" className="form-input" value={profile.email} readOnly
                style={{ background: '#f8fafc', cursor: 'not-allowed' }} />
              <small className="help-text">El correo electrónico no se puede modificar.</small>
            </div>

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
          <small className="help-text" style={{ marginTop: '10px' }}>
            Cualquier alta o baja en membresías debe cursarse desde la administración.
          </small>
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

      {/* ═══════════════════════════════════════════ */}
      {/* BOTÓN GUARDAR                                */}
      {/* ═══════════════════════════════════════════ */}
      <div className="perfil-save-bar">
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleSave}
          disabled={saving || !privacidadAceptada}
        >
          {saving ? '⏳ Guardando...' : '💾 Guardar Cambios del Perfil'}
        </button>
      </div>

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
                <button type="button" className="btn btn-primary" onClick={savePhotoEdits}>💾 Guardar Cambios</button>
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
    </div>
  );
}

