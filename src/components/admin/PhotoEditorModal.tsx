'use client';
import React, { useState, useEffect, useRef } from 'react';
import './EspecieForm.css';

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
      setEditorX(initialMetadata.profile_object_x ?? 50);
      setEditorY(initialMetadata.profile_object_y ?? 50);
      setEditorZoom(initialMetadata.profile_object_zoom ?? 100);
      setEditorBrightness(initialMetadata.profile_brightness ?? 100);
      setEditorContrast(initialMetadata.profile_contrast ?? 100);
      setEditorStyle(initialMetadata.profile_style || '');
      setEditorSeoAlt(initialMetadata.seo_alt || '');
      
      setEditorInitialState(JSON.stringify({
        x: initialMetadata.profile_object_x ?? 50,
        y: initialMetadata.profile_object_y ?? 50,
        zoom: initialMetadata.profile_object_zoom ?? 100,
        brightness: initialMetadata.profile_brightness ?? 100,
        contrast: initialMetadata.profile_contrast ?? 100,
        style: initialMetadata.profile_style || '',
        seo_alt: initialMetadata.seo_alt || ''
      }));
    }
  }, [isOpen, initialMetadata]);

  if (!isOpen) return null;

  const handleSave = () => {
    const currentState = JSON.stringify({ x: editorX, y: editorY, zoom: editorZoom, brightness: editorBrightness, contrast: editorContrast, style: editorStyle, seo_alt: editorSeoAlt });
    if (currentState === editorInitialState) {
      onSave({ noChanges: true });
      return;
    }
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

  return (
    <div className="photo-editor-overlay">
      <div className="photo-editor-content">
        <div className="photo-editor-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0 }}>Ajustar Fotografía y SEO</h3>
            <small style={{ color: '#64748b', fontSize: '0.75rem', display: 'block', marginTop: '4px' }}>
              📄 {fileName}
            </small>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button type="button" onClick={onClose} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white', color: '#475569', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>Cerrar</button>
            {hasChanges && (
              <button
                type="button"
                onClick={handleSave}
                className={`btn-primary ${saveStatus === 'no-changes' ? 'success' : ''}`}
                style={{ padding: '8px 16px', fontSize: '0.9rem', margin: 0 }}
                disabled={saveStatus === 'saving'}
              >
                {saveStatus === 'saving' ? '⏳ Guardando...' : saveStatus === 'no-changes' ? '✓ Sin cambios' : '💾 Guardar Cambios'}
              </button>
            )}
          </div>
        </div>
        
        <div className="photo-editor-body">
          <div 
            className="photo-editor-preview-container"
            onMouseDown={onEditorMouseDown}
            onTouchStart={onEditorTouchStart}
            onTouchMove={onEditorTouchMove}
          >
            <div className="photo-editor-preview-mask" style={{ borderRadius: '12px', aspectRatio: '3/4', width: '220px', overflow: 'hidden' }}>
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
            <div className="photo-editor-hint">
              <span>Arrastra para encuadrar</span>
            </div>
          </div>

          <div className="photo-editor-controls">
            <div className="editor-control-group">
              <label>
                <span className="control-label">🔍 Zoom ({editorZoom}%)</span>
                <button type="button" className="reset-btn" onClick={() => setEditorZoom(100)}>↻</button>
              </label>
              <input type="range" min="100" max="300" value={editorZoom} onChange={e => setEditorZoom(Number(e.target.value))} />
            </div>
            
            <div className="editor-control-group">
              <label>
                <span className="control-label">☀️ Brillo ({editorBrightness}%)</span>
              </label>
              <input type="range" min="50" max="150" value={editorBrightness} onChange={e => setEditorBrightness(Number(e.target.value))} />
            </div>

            <div className="editor-control-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ margin: 0 }}>
                  <span className="control-label" style={{ margin: 0 }}>🌗 Contraste ({editorContrast}%)</span>
                </label>
              </div>
              <input type="range" min="50" max="150" value={editorContrast} onChange={e => setEditorContrast(Number(e.target.value))} />
            </div>

            <div style={{ marginBottom: '15px', display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => {
                  setEditorBrightness(110);
                  setEditorContrast(115);
                  setEditorStyle('');
                }}
                style={{ flex: 1, padding: '10px', background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)' }}
              >
                ✨ Auto Color
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditorBrightness(100);
                  setEditorContrast(100);
                  setEditorStyle('');
                  setEditorZoom(100);
                  setEditorX(50);
                  setEditorY(50);
                }}
                style={{ padding: '10px 15px', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                ↻ Reset
              </button>
            </div>

            <div className="editor-control-group" style={{ marginBottom: '15px' }}>
              <label>
                <span className="control-label">🎨 Estilos y Filtros de IA</span>
              </label>
              <select
                value={editorStyle}
                onChange={e => setEditorStyle(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', color: '#334155', background: 'white' }}
              >
                <option value="">Sin Filtro (Original)</option>
                <option value="vibrant">Saturado (Vibrant)</option>
                <option value="vintage">Vintage (Cálido)</option>
                <option value="cinematic">Cinemático (Dramatic)</option>
                <option value="bnw">Blanco y Negro (Clásico)</option>
                <option value="fade">Deslavado (Fade)</option>
                <option value="cool">Frío (Cool)</option>
                <option value="warm">Cálido Intenso (Warm)</option>
                <option value="dramatic">Oscuro Dramático (Dramatic)</option>
              </select>
            </div>

            <div className="editor-control-group" style={{ marginBottom: '0' }}>
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
