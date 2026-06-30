import React from 'react'; // Hot-reload trigger for delete close logic
import PremiumPhotoEditor from '@/components/ui/PremiumPhotoEditor';
import { getMediaUrl } from '@/lib/media-url';

interface PhotoEditorModalWrapperProps {
  editingPhoto: any;
  setEditingPhoto: (photo: any) => void;
  savePhotoEdits: (metadata: any) => Promise<void>;
  deletePhoto?: () => void;
  photoEditorSaveStatus: 'idle' | 'saving' | 'saved' | 'no-changes' | undefined;
  onRecreateAi?: () => void;
}

export default function PhotoEditorModalWrapper({
  editingPhoto,
  setEditingPhoto,
  savePhotoEdits,
  deletePhoto,
  photoEditorSaveStatus,
  onRecreateAi
}: PhotoEditorModalWrapperProps) {
  // Manejador seguro de guardado
  const handleSave = async (metadata: any) => {
    await savePhotoEdits(metadata);
  };

  return (
    <PremiumPhotoEditor
      isOpen={!!editingPhoto}
      onClose={() => setEditingPhoto(null)}
      photoUrl={editingPhoto ? getMediaUrl(editingPhoto.ruta) : ''}
      fileName={editingPhoto?.nombreOriginal || (editingPhoto?.ruta ? editingPhoto.ruta.split('/').pop() : '')}
      initialMetadata={editingPhoto?.resumen ? (typeof editingPhoto.resumen === 'string' ? JSON.parse(editingPhoto.resumen) : editingPhoto.resumen) : null}
      onSave={handleSave}
      onDelete={deletePhoto ? () => {
        deletePhoto();
      } : undefined}
      onRecreateAi={onRecreateAi}
      saveStatus={photoEditorSaveStatus === 'saved' ? 'no-changes' : (photoEditorSaveStatus as any)}
    />
  );
}
