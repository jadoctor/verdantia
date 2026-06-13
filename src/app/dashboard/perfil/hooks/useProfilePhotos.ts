import React, { useState, useEffect, useCallback, useRef } from 'react';
import { perfilApi } from '../services/perfilApi';
import { getMaxPhotos } from '../constants/profileConstants';
import { UserProfile } from './useProfileData';

export function useProfilePhotos(profile: UserProfile | null, showToast: (msg: string) => void) {
  const [photos, setPhotos] = useState<any[]>([]);
  const [activeFotoId, setActiveFotoId] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // Photo Editor Modal States
  const [editingPhoto, setEditingPhoto] = useState<any>(null);
  const [editorX, setEditorX] = useState(50);
  const [editorY, setEditorY] = useState(38);
  const [editorZoom, setEditorZoom] = useState(100);
  const [editorBrightness, setEditorBrightness] = useState(100);
  const [editorContrast, setEditorContrast] = useState(100);
  const [editorStyle, setEditorStyle] = useState('');
  const [editorInitialState, setEditorInitialState] = useState('');
  const [photoEditorSaveStatus, setPhotoEditorSaveStatus] = useState<'idle' | 'saving' | 'no-changes'>('idle');

  const activeFoto = photos.find(f => f.id === activeFotoId) || photos.find(f => f.esPrincipal || f.esPrincipal === 1) || photos[0];

  const loadPhotos = useCallback(async (userId: number) => {
    try {
      const data = await perfilApi.loadPhotos(userId);
      setPhotos(data.photos || []);
    } catch (err: any) {
      console.error('Error cargando fotos:', err);
    }
  }, []);

  useEffect(() => {
    if (profile?.id) {
      loadPhotos(profile.id);
    }
  }, [profile?.id, loadPhotos]);

  useEffect(() => {
    if (photos && photos.length > 0) {
      const primary = photos.find(p => p.esPrincipal === 1 || p.esPrincipal) || photos[0];
      if (primary && activeFotoId === null) {
        setActiveFotoId(primary.id);
      }
    }
  }, [photos, activeFotoId]);

  const detectFaceCenter = async (imageSource: Blob | File): Promise<{x: number, y: number} | null> => {
    return new Promise(async (resolve) => {
      try {
        const img = new Image();
        const url = URL.createObjectURL(imageSource);
        img.src = url;
        await new Promise<void>((r, rej) => { img.onload = () => r(); img.onerror = () => rej(); });
        URL.revokeObjectURL(url);

        if (!img.naturalWidth || !img.naturalHeight) { resolve(null); return; }

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
      let processedBlob: Blob = file;
      
      if (isMobile) {
        showToast('🚀 Subida rápida móvil: saltando limpieza de fondo...');
      } else {
        showToast('🤖 IA procesando: quitando fondo...');
        try {
          const { removeBackground } = await import('@imgly/background-removal');
          
          const resultBlob = await Promise.race([
            removeBackground(file, { output: { format: 'image/png' } }),
            new Promise<null>((_, reject) => setTimeout(() => reject(new Error('timeout')), 15000))
          ]);

          if (resultBlob) {
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

      let faceX = 50, faceY = 38, autoZoom = 100;
      try {
        const faceResult = await detectFaceCenter(processedBlob);
        if (faceResult) {
          faceX = faceResult.x;
          faceY = faceResult.y;

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
      }

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

      const data = await perfilApi.uploadPhoto({
        userId: profile.id,
        storagePath,
        faceX: Math.round(faceX),
        faceY: Math.round(faceY),
        faceZoom: autoZoom,
        nombreOriginal: file.name
      });

      if (data.success) {
        showToast('✅ Foto subida correctamente. Recuerda que debe ser aprobada antes de mostrarse.');
        loadPhotos(profile.id);
        
        const pData = await perfilApi.loadUserProfile(profile.email);
        const channel = new BroadcastChannel('verdantia_profile');
        channel.postMessage({ 
          fotoPreferida: pData.profile.fotoPreferida,
          fotoPreferidaMeta: pData.profile.fotoPreferidaMeta
        });
        channel.close();
      } else {
        showToast('❌ Error: ' + data.error);
      }
    } catch (err: any) {
      showToast('❌ Error subiendo foto: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const setPhotoPrimary = async (photoId: number) => {
    if (!profile) return;

    const targetPhoto = photos.find(p => p.id === photoId);
    const previousPhotos = [...photos];
    if (targetPhoto) {
      const newPhotos = [
        { ...targetPhoto, esPrincipal: true },
        ...photos.filter(p => p.id !== photoId).map(p => ({ ...p, esPrincipal: false }))
      ];
      setPhotos(newPhotos);
    }

    try {
      const data = await perfilApi.setPhotoPrimary(photoId, profile.id);
      if (!data.success) {
        console.error('[Photos] Error al cambiar foto principal:', data);
        showToast('❌ Error al guardar foto preferida: ' + (data.error || 'Error desconocido'));
        setPhotos(previousPhotos);
        return;
      }

      showToast('⭐ Foto preferida actualizada');
      
      const pData = await perfilApi.loadUserProfile(profile.email);
      const updateData = { 
        fotoPreferida: pData.profile.fotoPreferida,
        fotoPreferidaMeta: pData.profile.fotoPreferidaMeta,
        icono: null 
      };
      const channel = new BroadcastChannel('verdantia_profile');
      channel.postMessage(updateData);
      channel.close();
      window.dispatchEvent(new CustomEvent('profile_updated', { detail: updateData }));
    } catch (err: any) {
      console.error('[Photos] Error de red al cambiar foto principal:', err);
      showToast('❌ Error de conexión al guardar foto preferida');
      setPhotos(previousPhotos);
    }
  };

  const deletePhoto = async (photoId: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta foto?')) return;
    try {
      await perfilApi.deletePhoto(photoId);
      showToast('🗑️ Foto eliminada');
      
      if (profile) {
        loadPhotos(profile.id);
        
        const pData = await perfilApi.loadUserProfile(profile.email);
        const updateData = { 
          fotoPreferida: pData.profile.fotoPreferida,
          fotoPreferidaMeta: pData.profile.fotoPreferidaMeta
        };
        const channel = new BroadcastChannel('verdantia_profile');
        channel.postMessage(updateData);
        channel.close();
        window.dispatchEvent(new CustomEvent('profile_updated', { detail: updateData }));
      }
    } catch (err) {
      showToast('❌ Error eliminando foto');
    }
  };

  // Drag & Drop
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragOver(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragOver(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadPhoto(file);
  };

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

    const newPhotos = [...photos];
    const [moved] = newPhotos.splice(sourceIdx, 1);
    newPhotos.splice(targetIdx, 0, moved);

    const wasAlreadyPrimary = moved.esPrincipal;

    if (targetIdx === 0) {
      newPhotos.forEach(p => p.esPrincipal = (p.id === moved.id));
    }

    setPhotos(newPhotos);
    setDraggingId(null);

    if (targetIdx === 0 && !wasAlreadyPrimary) {
      showToast('⭐️ Cambiando foto principal...');
      await setPhotoPrimary(moved.id);
    }
  };

  // Editor controls
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
      await perfilApi.savePhotoEdits(editingPhoto.id, profile.id, resumen);
      showToast('✅ Ajustes de foto guardados');
      setEditingPhoto(null);
      loadPhotos(profile.id);
    } catch { 
      showToast('❌ Error guardando ajustes'); 
    } finally {
      setPhotoEditorSaveStatus('idle');
    }
  };

  const autoCenterFromEditor = async () => {
    if (!editingPhoto) return;
    showToast('🎯 Detectando cara...');
    try {
      const { getMediaUrl } = await import('@/lib/media-url');
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

  const editorDragRef = useRef<{ dragging: boolean; startX: number; startY: number; startPosX: number; startPosY: number }>({
    dragging: false, startX: 0, startY: 0, startPosX: 50, startPosY: 38
  });

  const onEditorMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    editorDragRef.current = { dragging: true, startX: e.clientX, startY: e.clientY, startPosX: editorX, startPosY: editorY };
    const onMove = (ev: MouseEvent) => {
      if (!editorDragRef.current.dragging) return;
      const dx = ev.clientX - editorDragRef.current.startX;
      const dy = ev.clientY - editorDragRef.current.startY;
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

  return {
    photos,
    setPhotos,
    activeFotoId,
    setActiveFotoId,
    activeFoto,
    uploading,
    draggingId,
    dragOver,
    editingPhoto,
    setEditingPhoto,
    editorX,
    setEditorX,
    editorY,
    setEditorY,
    editorZoom,
    setEditorZoom,
    editorBrightness,
    setEditorBrightness,
    editorContrast,
    setEditorContrast,
    editorStyle,
    setEditorStyle,
    photoEditorSaveStatus,
    openPhotoEditor,
    savePhotoEdits,
    autoCenterFromEditor,
    onEditorMouseDown,
    onEditorTouchStart,
    onEditorTouchMove,
    uploadPhoto,
    deletePhoto,
    setPhotoPrimary,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handlePhotoDragStart,
    handlePhotoDragOver,
    handlePhotoDrop
  };
}
