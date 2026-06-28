import { useState } from 'react';

export function usePhotoEditor(onSaved: () => void) {
  const [editingPhoto, setEditingPhoto] = useState<any>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'no-changes'>('idle');

  const open = (photo: any) => {
    setEditingPhoto(photo);
    setSaveStatus('idle');
  };

  const close = () => setEditingPhoto(null);

  const save = async (metadata: any) => {
    if (!editingPhoto) return;
    if (metadata.noChanges) {
      setSaveStatus('no-changes');
      return;
    }
    setSaveStatus('saving');
    try {
      const currentRes = editingPhoto.resumen ? (typeof editingPhoto.resumen === 'string' ? JSON.parse(editingPhoto.resumen) : editingPhoto.resumen) : {};
      const newRes = { ...currentRes, ...metadata };

      const res = await fetch('/api/admin/asuntos-pendientes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photoId: editingPhoto.id || editingPhoto.photoId, action: 'updateMeta',
          resumen: JSON.stringify(newRes),
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

  return {
    editingPhoto, saveStatus,
    open, close, save,
  };
}
