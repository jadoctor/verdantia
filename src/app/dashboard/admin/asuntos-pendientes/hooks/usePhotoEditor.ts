import { useState, useRef } from 'react';

const STYLE_FILTERS: Record<string, string> = {
  '': '',
  vintage: 'sepia(40%) contrast(110%) saturate(120%)',
  vivid: 'saturate(150%) contrast(110%)',
  dramatic: 'contrast(130%) saturate(80%) brightness(90%)',
  cool: 'hue-rotate(15deg) saturate(110%)',
};

export function usePhotoEditor(onSaved: () => void) {
  const [editingPhoto, setEditingPhoto] = useState<any>(null);
  const [editorX, setEditorX] = useState(50);
  const [editorY, setEditorY] = useState(50);
  const [editorZoom, setEditorZoom] = useState(100);
  const [editorBrightness, setEditorBrightness] = useState(100);
  const [editorContrast, setEditorContrast] = useState(100);
  const [editorStyle, setEditorStyle] = useState('');
  const [editorSeoAlt, setEditorSeoAlt] = useState('');
  const [editorInitialState, setEditorInitialState] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'no-changes'>('idle');

  const dragRef = useRef<{ dragging: boolean; startX: number; startY: number; startPosX: number; startPosY: number }>({
    dragging: false, startX: 0, startY: 0, startPosX: 50, startPosY: 50,
  });

  const open = (photo: any) => {
    try {
      const meta = typeof photo.resumen === 'string' ? JSON.parse(photo.resumen || '{}') : (photo.resumen || {});
      const initial = {
        x: meta.profile_object_x ?? 50, y: meta.profile_object_y ?? 50,
        zoom: meta.profile_object_zoom ?? 100, brightness: meta.profile_brightness ?? 100,
        contrast: meta.profile_contrast ?? 100, style: meta.profile_style ?? '', seo_alt: meta.seo_alt ?? '',
      };
      setEditorX(initial.x); setEditorY(initial.y); setEditorZoom(initial.zoom);
      setEditorBrightness(initial.brightness); setEditorContrast(initial.contrast);
      setEditorStyle(initial.style); setEditorSeoAlt(initial.seo_alt);
      setEditorInitialState(JSON.stringify(initial));
    } catch {
      setEditorX(50); setEditorY(50); setEditorZoom(100);
      setEditorBrightness(100); setEditorContrast(100); setEditorStyle(''); setEditorSeoAlt('');
      setEditorInitialState(JSON.stringify({ x: 50, y: 50, zoom: 100, brightness: 100, contrast: 100, style: '', seo_alt: '' }));
    }
    setEditingPhoto(photo);
    setSaveStatus('idle');
  };

  const close = () => setEditingPhoto(null);

  const save = async () => {
    if (!editingPhoto) return;
    const currentState = JSON.stringify({ x: editorX, y: editorY, zoom: editorZoom, brightness: editorBrightness, contrast: editorContrast, style: editorStyle, seo_alt: editorSeoAlt });
    if (currentState === editorInitialState) {
      setSaveStatus('no-changes');
      setTimeout(() => setSaveStatus('idle'), 2000);
      return;
    }
    setSaveStatus('saving');
    try {
      const res = await fetch('/api/admin/asuntos-pendientes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photoId: editingPhoto.id || editingPhoto.photoId, action: 'updateMeta',
          resumen: JSON.stringify({ profile_object_x: editorX, profile_object_y: editorY, profile_object_zoom: editorZoom, profile_brightness: editorBrightness, profile_contrast: editorContrast, profile_style: editorStyle, seo_alt: editorSeoAlt }),
        }),
      });
      if (!res.ok) throw new Error('Error al guardar');
      setEditingPhoto(null);
      onSaved();
    } catch (e) {
      console.error(e);
      alert('❌ Error guardando ajustes');
    } finally {
      setSaveStatus('idle');
    }
  };

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    dragRef.current = { dragging: true, startX: e.clientX, startY: e.clientY, startPosX: editorX, startPosY: editorY };
    const onMove = (ev: MouseEvent) => {
      if (!dragRef.current.dragging) return;
      const sensitivity = 0.15 * (100 / Math.max(editorZoom, 100));
      setEditorX(Math.max(0, Math.min(100, dragRef.current.startPosX - (ev.clientX - dragRef.current.startX) * sensitivity)));
      setEditorY(Math.max(0, Math.min(100, dragRef.current.startPosY - (ev.clientY - dragRef.current.startY) * sensitivity)));
    };
    const onUp = () => { dragRef.current.dragging = false; window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    dragRef.current = { dragging: true, startX: t.clientX, startY: t.clientY, startPosX: editorX, startPosY: editorY };
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!dragRef.current.dragging) return;
    const t = e.touches[0];
    const sensitivity = 0.15 * (100 / Math.max(editorZoom, 100));
    setEditorX(Math.max(0, Math.min(100, dragRef.current.startPosX - (t.clientX - dragRef.current.startX) * sensitivity)));
    setEditorY(Math.max(0, Math.min(100, dragRef.current.startPosY - (t.clientY - dragRef.current.startY) * sensitivity)));
  };

  return {
    editingPhoto, editorX, editorY, editorZoom, editorBrightness, editorContrast,
    editorStyle, editorSeoAlt, saveStatus, STYLE_FILTERS,
    setEditorX, setEditorY, setEditorZoom, setEditorBrightness, setEditorContrast,
    setEditorStyle, setEditorSeoAlt,
    open, close, save, onMouseDown, onTouchStart, onTouchMove,
  };
}
