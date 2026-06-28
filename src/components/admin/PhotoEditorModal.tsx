'use client';
import React, { useState, useEffect, useRef } from 'react';
import './EspecieVegetalForm.css';
import PremiumSlider from '@/components/ui/PremiumSlider';

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

interface PhotoEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  photoUrl: string;
  fileName?: string;
  initialMetadata?: any;
  onSave: (metadata: any) => Promise<void>;
  saveStatus?: 'idle' | 'saving' | 'no-changes';
}

export default function PhotoEditorModal({ isOpen, onClose, photoUrl, fileName = 'imagen.jpg', initialMetadata = {}, onSave, saveStatus = 'idle' }: PhotoEditorModalProps) {
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
  }, [isOpen, initialMetadata]);

  const handleSave = () => {
    const currentState = JSON.stringify({ x: editorX, y: editorY, zoom: editorZoom, brightness: editorBrightness, contrast: editorContrast, style: editorStyle, seo_alt: editorSeoAlt });
    if (currentState === editorInitialState) {
      onSave({ noChanges: true });
      return;
    }
    
    // Al guardar, el estado actual pasa a ser el nuevo estado inicial
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

  // Auto-save debounce (Regla 8 adaptada a modal)
  useEffect(() => {
    if (!isOpen || !hasChanges) return;
    const timer = setTimeout(() => {
      handleSave();
    }, 1000);
    return () => clearTimeout(timer);
  }, [editorX, editorY, editorZoom, editorBrightness, editorContrast, editorStyle, editorSeoAlt, isOpen, hasChanges]);

  if (!isOpen) return null;

  return (
    <div className="photo-editor-overlay">
      <div className="photo-editor-content">
        <div className="photo-editor-header" style={{ padding: '12px 20px' }}>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: 0 }}>Ajustar Fotografía</h3>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            { (saveStatus === 'saving' || hasChanges) && (
              <span style={{ fontSize: '0.8rem', color: saveStatus === 'saving' ? '#d97706' : '#64748b', fontWeight: 600, marginRight: '8px' }}>
                {saveStatus === 'saving' ? '⏳ Guardando...' : '✏️ Editando...'}
              </span>
            )}
            <button
              type="button"
              className="btn-premium-reset"
              onClick={() => {
                setEditorBrightness(100);
                setEditorContrast(100);
                setEditorStyle('');
                setEditorZoom(100);
                setEditorX(50);
                setEditorY(50);
              }}
            >
              <span style={{ fontSize: '1.1rem' }}>↻</span> Reset
            </button>
            <button 
              type="button" 
              className="btn-premium-close"
              onClick={onClose} 
            >
              ✖ Cerrar
            </button>
          </div>
        </div>
        
        <div className="photo-editor-body">
          <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <h4 style={{ margin: '0 0 4px 0', color: '#1e293b', fontSize: '0.95rem' }}>Nombre del Archivo</h4>
            <div style={{ color: '#475569', fontSize: '0.85rem', wordBreak: 'break-all' }}>📄 {fileName}</div>
          </div>

          <div 
            className="photo-editor-preview-container"
            onMouseDown={onEditorMouseDown}
            onTouchStart={onEditorTouchStart}
            onTouchMove={onEditorTouchMove}
          >
            <div className="photo-editor-preview-mask" style={{ margin: '0 auto' }}>
              <img 
                src={photoUrl} 
                alt="preview" 
                className="photo-editor-image"
                draggable="false"
                style={{
                  objectPosition: `${editorX}% ${editorY}%`,
                  transformOrigin: `${editorX}% ${editorY}%`,
                  transform: `scale(${editorZoom / 100})`,
                  filter: `brightness(${editorBrightness}%) contrast(${editorContrast}%) ${editorStyle ? STYLE_FILTERS[editorStyle] : ''}`.trim()
                }}
                crossOrigin="anonymous"
              />
            </div>
            <div className="photo-editor-hint" style={{ justifyContent: 'center', width: '100%' }}>
              <span>Arrastra para encuadrar</span>
            </div>
          </div>

          <div className="photo-editor-controls">
            <PremiumSlider
              label="Zoom"
              icon="🔍"
              min={100}
              max={300}
              value={editorZoom}
              onChange={setEditorZoom}
            />
            
            <PremiumSlider
              label="Brillo"
              icon="☀️"
              min={50}
              max={150}
              value={editorBrightness}
              onChange={setEditorBrightness}
            />

            <PremiumSlider
              label="Contraste"
              icon="🌗"
              min={50}
              max={150}
              value={editorContrast}
              onChange={setEditorContrast}
            />

            <div className="editor-control-group">
              <label>
                <span className="control-label">🎨 Estilos y Filtros de IA</span>
              </label>
              <select
                value={editorStyle}
                onChange={e => setEditorStyle(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', color: '#334155', background: 'white' }}
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

            <div className="editor-control-group">
              <label>
                <span className="control-label">🌐 Texto Alternativo SEO (Alt)</span>
              </label>
              <textarea
                value={editorSeoAlt}
                onChange={e => setEditorSeoAlt(e.target.value)}
                placeholder="Describe la foto para buscadores y accesibilidad..."
                rows={2}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', resize: 'vertical' }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
