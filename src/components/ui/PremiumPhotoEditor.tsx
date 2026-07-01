'use client'; // Hot reload for React dependency cycle bug
import React, { useState, useEffect, useRef } from 'react';
import PremiumModal from './PremiumModal';
import PremiumModalHeader from './PremiumModalHeader';
import PremiumSlider from './PremiumSlider';
import PremiumExitButton from './PremiumExitButton';
import PremiumUndoButton from './PremiumUndoButton';
import PremiumDeleteButton from './PremiumDeleteButton';
import PremiumAutoEnhanceButton from './PremiumAutoEnhanceButton';
import PremiumAiButton from './PremiumAiButton';
import styles from './PremiumPhotoEditor.module.css';

const STYLE_FILTERS: Record<string, string> = {
  '': 'none',
  comic: 'contrast(1.45) saturate(1.55) brightness(1.08)',
  vintage: 'sepia(0.4) contrast(1.1) brightness(0.9) saturate(0.8)',
  cinematic: 'contrast(1.3) saturate(1.2) brightness(0.9) hue-rotate(-5deg)',
  bnw: 'grayscale(1) contrast(1.2) brightness(1.05)',
  fade: 'contrast(0.9) brightness(1.1) saturate(0.7)',
  cool: 'saturate(1.2) hue-rotate(15deg) brightness(1.05)',
  warm: 'saturate(1.3) hue-rotate(-15deg) contrast(1.1)',
  dramatic: 'contrast(1.5) saturate(0.8) brightness(0.8)',
};

interface PremiumPhotoEditorProps {
  isOpen: boolean;
  onClose: () => void;
  photoUrl: string;
  fileName?: string;
  initialMetadata?: any;
  onSave: (metadata: any) => Promise<boolean | void> | boolean | void;
  onDelete?: () => void;
  onRecreateAi?: () => void;
  saveStatus?: 'idle' | 'saving' | 'no-changes';
}

export default function PremiumPhotoEditor({ 
  isOpen, 
  onClose, 
  photoUrl, 
  fileName = 'imagen.jpg', 
  initialMetadata = {}, 
  onSave,
  onDelete,
  onRecreateAi,
  saveStatus = 'idle' 
}: PremiumPhotoEditorProps) {
  const [editorZoom, setEditorZoom] = useState(100);
  const [editorX, setEditorX] = useState(50);
  const [editorY, setEditorY] = useState(50);
  const [editorBrightness, setEditorBrightness] = useState(100);
  const [editorContrast, setEditorContrast] = useState(100);
  const [editorStyle, setEditorStyle] = useState('');
  const [editorSeoAlt, setEditorSeoAlt] = useState('');
  const [editorInitialState, setEditorInitialState] = useState('');
  
  const editorDragRef = useRef<{ isDragging: boolean, startX: number, startY: number, startPosX: number, startPosY: number }>({
    isDragging: false, startX: 0, startY: 0, startPosX: 50, startPosY: 50
  });

  useEffect(() => {
    if (isOpen) {
      const meta = initialMetadata || {};
      setEditorX(meta.profile_object_x ?? 50);
      setEditorY(meta.profile_object_y ?? 50);
      setEditorZoom(meta.profile_object_zoom ?? 100);
      setEditorBrightness(meta.profile_brightness ?? 100);
      setEditorContrast(meta.profile_contrast ?? 100);
      setEditorStyle(meta.profile_style || '');
      setEditorSeoAlt(meta.seo_alt || '');
      
      setEditorInitialState(JSON.stringify({
        x: meta.profile_object_x ?? 50,
        y: meta.profile_object_y ?? 50,
        zoom: meta.profile_object_zoom ?? 100,
        brightness: meta.profile_brightness ?? 100,
        contrast: meta.profile_contrast ?? 100,
        style: meta.profile_style || '',
        seo_alt: meta.seo_alt || ''
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, JSON.stringify(initialMetadata)]);

  const handleSave = () => {
    const currentState = JSON.stringify({ x: editorX, y: editorY, zoom: editorZoom, brightness: editorBrightness, contrast: editorContrast, style: editorStyle, seo_alt: editorSeoAlt });
    if (currentState === editorInitialState) {
      onSave({ noChanges: true });
      return;
    }
    
    setEditorInitialState(currentState);
    
    onSave({
      profile_object_x: editorX,
      profile_object_y: editorY,
      profile_object_zoom: editorZoom,
      profile_brightness: editorBrightness,
      profile_contrast: editorContrast,
      profile_style: editorStyle,
      seo_alt: editorSeoAlt
    });
  };

  const onEditorMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    editorDragRef.current = {
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      startPosX: editorX,
      startPosY: editorY
    };
    const upListener = () => {
      editorDragRef.current.isDragging = false;
      document.removeEventListener('mouseup', upListener);
      document.removeEventListener('mousemove', moveListener);
    };
    const moveListener = (evt: MouseEvent) => {
      if (!editorDragRef.current.isDragging) return;
      const dx = evt.clientX - editorDragRef.current.startX;
      const dy = evt.clientY - editorDragRef.current.startY;
      const sensitivity = 0.5 * (100 / editorZoom);
      setEditorX(Math.max(0, Math.min(100, editorDragRef.current.startPosX - dx * sensitivity)));
      setEditorY(Math.max(0, Math.min(100, editorDragRef.current.startPosY - dy * sensitivity)));
    };
    document.addEventListener('mouseup', upListener);
    document.addEventListener('mousemove', moveListener);
  };

  const onEditorTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    editorDragRef.current = {
      isDragging: true,
      startX: touch.clientX,
      startY: touch.clientY,
      startPosX: editorX,
      startPosY: editorY
    };
  };

  const onEditorTouchMove = (e: React.TouchEvent) => {
    if (!editorDragRef.current.isDragging) return;
    const touch = e.touches[0];
    const dx = touch.clientX - editorDragRef.current.startX;
    const dy = touch.clientY - editorDragRef.current.startY;
    const sensitivity = 0.5 * (100 / editorZoom);
    setEditorX(Math.max(0, Math.min(100, editorDragRef.current.startPosX - dx * sensitivity)));
    setEditorY(Math.max(0, Math.min(100, editorDragRef.current.startPosY - dy * sensitivity)));
  };

  const currentState = JSON.stringify({ x: editorX, y: editorY, zoom: editorZoom, brightness: editorBrightness, contrast: editorContrast, style: editorStyle, seo_alt: editorSeoAlt });
  const hasChanges = currentState !== editorInitialState;
  
  const isOriginalState = editorX === 50 && editorY === 50 && editorZoom === 100 && editorBrightness === 100 && editorContrast === 100 && editorStyle === '';

  // Auto-save removed as per request. Save is now triggered manually on exit.

  const handleClose = async () => {
    if (hasChanges) {
      const metadata = {
        profile_object_x: editorX,
        profile_object_y: editorY,
        profile_object_zoom: editorZoom,
        profile_brightness: editorBrightness,
        profile_contrast: editorContrast,
        profile_style: editorStyle,
        seo_alt: editorSeoAlt
      };
      // Esperamos a que termine de guardar. En caso de error, el hook mostrará un alert.
      // Si onSave devuelve boolean o undefined, cerramos el modal si todo fue bien.
      const success = await onSave(metadata);
      if (success === false) {
        // Hubo error y el usuario fue notificado, no cerramos el modal para no perder datos.
        return;
      }
    } else {
      // Si no hay cambios pero le dio a salir y guardar, podemos simplemente cerrar.
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <PremiumModal isOpen={isOpen} onClose={handleClose} maxWidth="600px" zIndex={10000}>
      <PremiumModalHeader 
        title="" 
        gradient="linear-gradient(135deg, #0d9488, #047857)"
        actions={
          <>
            <PremiumAutoEnhanceButton 
              onClick={() => {
                setEditorBrightness(110);
                setEditorContrast(115);
                setEditorZoom(100);
                setEditorX(50);
                setEditorY(50);
                setEditorStyle('');
              }} 
            />
            <PremiumUndoButton 
              text={hasChanges ? 'Deshacer Cambios' : 'Volver al original'}
              disabled={!hasChanges && isOriginalState}
              onClick={() => {
                if (hasChanges) {
                  const meta = initialMetadata || {};
                  setEditorBrightness(meta.profile_brightness ?? 100);
                  setEditorContrast(meta.profile_contrast ?? 100);
                  setEditorStyle(meta.profile_style || '');
                  setEditorZoom(meta.profile_object_zoom ?? 100);
                  setEditorX(meta.profile_object_x ?? 50);
                  setEditorY(meta.profile_object_y ?? 50);
                  if (meta.seo_alt) setEditorSeoAlt(meta.seo_alt);
                } else {
                  setEditorBrightness(100);
                  setEditorContrast(100);
                  setEditorStyle('');
                  setEditorZoom(100);
                  setEditorX(50);
                  setEditorY(50);
                }
              }} 
            />
            {onDelete && (
              <PremiumDeleteButton onClick={onDelete} />
            )}
            <PremiumExitButton onClick={handleClose} isSaving={saveStatus === 'saving'} hasChanges={hasChanges} />
          </>
        }
      />
import styles from './PremiumPhotoEditor.module.css';

// ... (in JSX return block) ...
      <div className={styles.bodyContainer}>
        
        <div className={styles.fileInfoBox}>
          <h4 className={styles.fileInfoTitle}>Nombre del Archivo</h4>
          <div className={styles.fileInfoText}>📄 {fileName}</div>
        </div>

        <div 
          className={styles.previewArea}
          onMouseDown={onEditorMouseDown}
          onTouchStart={onEditorTouchStart}
          onTouchMove={onEditorTouchMove}
        >
          <div className={styles.previewFrame}>
            <img 
              src={photoUrl} 
              alt="preview" 
              draggable="false"
              className={styles.previewImg}
              style={{
                objectPosition: `${editorX}% ${editorY}%`,
                transformOrigin: `${editorX}% ${editorY}%`,
                transform: `scale(${editorZoom / 100})`,
                filter: `brightness(${editorBrightness}%) contrast(${editorContrast}%) ${editorStyle ? STYLE_FILTERS[editorStyle] : ''}`.trim()
              }}
              crossOrigin="anonymous"
            />
          </div>
          {fileName && fileName.includes('temp-ai-') && onRecreateAi && (
            <div className={styles.recreateAiContainer}>
              <PremiumAiButton 
                onClick={() => {
                  onClose();
                  onRecreateAi();
                }}
                text="Volver a crear"
                style={{ width: '100%', marginBottom: '12px' }}
              />
            </div>
          )}
        </div>

        <div className={styles.controlsContainer}>
          <PremiumSlider label="Zoom" icon="🔍" min={100} max={300} value={editorZoom} onChange={setEditorZoom} />
          <PremiumSlider label="Brillo" icon="☀️" min={50} max={150} value={editorBrightness} onChange={setEditorBrightness} />
          <PremiumSlider label="Contraste" icon="🌗" min={50} max={150} value={editorContrast} onChange={setEditorContrast} />

          <div className={styles.controlGroup}>
            <label className={styles.controlLabel}>
              <span>🎨 Estilos y Filtros de IA</span>
            </label>
            <select
              value={editorStyle}
              onChange={e => setEditorStyle(e.target.value)}
              className={styles.controlInput}
            >
              <option value="">Sin Filtro (Original)</option>
              <option value="comic">Saturado (Vibrant)</option>
              <option value="vintage">Vintage (Cálido)</option>
              <option value="cinematic">Cinemático (Dramatic)</option>
              <option value="bnw">Blanco y Negro (Clásico)</option>
              <option value="fade">Deslavado (Fade)</option>
              <option value="cool">Frío (Cool)</option>
              <option value="warm">Cálido Intenso (Warm)</option>
              <option value="dramatic">Oscuro Dramático (Dramatic)</option>
            </select>
          </div>

          <div className={styles.controlGroup}>
            <label className={styles.controlLabel}>
              <span>🌐 Texto Alternativo SEO (Alt)</span>
            </label>
            <textarea
              value={editorSeoAlt}
              onChange={e => setEditorSeoAlt(e.target.value)}
              placeholder="Describe la foto para buscadores y accesibilidad..."
              rows={2}
              className={styles.controlTextarea}
            />
          </div>
        </div>
      </div>
    </PremiumModal>
  );
}
