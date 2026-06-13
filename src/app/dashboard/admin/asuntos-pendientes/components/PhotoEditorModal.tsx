'use client';
import React from 'react';
import { getMediaUrl } from '@/lib/media-url';
import '@/components/admin/EspecieForm.css';

interface EditorProps {
  editingPhoto: any;
  editorX: number; editorY: number; editorZoom: number;
  editorBrightness: number; editorContrast: number; editorStyle: string;
  editorSeoAlt: string;
  STYLE_FILTERS: Record<string, string>;
  saveStatus: 'idle' | 'saving' | 'no-changes';
  setEditorZoom: (v: number) => void;
  setEditorBrightness: (v: number) => void;
  setEditorContrast: (v: number) => void;
  setEditorStyle: (v: string) => void;
  setEditorSeoAlt: (v: string) => void;
  setEditorX: (v: number) => void;
  setEditorY: (v: number) => void;
  onMouseDown: (e: React.MouseEvent) => void;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onSave: () => void;
  onClose: () => void;
}

export function PhotoEditorModal({
  editingPhoto, editorX, editorY, editorZoom, editorBrightness, editorContrast,
  editorStyle, editorSeoAlt, STYLE_FILTERS, saveStatus,
  setEditorZoom, setEditorBrightness, setEditorContrast, setEditorStyle,
  setEditorSeoAlt, setEditorX, setEditorY,
  onMouseDown, onTouchStart, onTouchMove, onSave, onClose,
}: EditorProps) {
  return (
    <div className="photo-editor-overlay">
      <div className="photo-editor-content" onClick={e => e.stopPropagation()}>
        <div className="photo-editor-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0 }}>Ajustar Fotografía y SEO</h3>
            <small style={{ color: '#64748b', fontSize: '0.75rem', display: 'block', marginTop: '4px' }}>📄 {editingPhoto.ruta.split('/').pop()}</small>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button type="button" onClick={onClose} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white', color: '#475569', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer' }}>Cerrar</button>
            <button type="button" onClick={onSave} disabled={saveStatus === 'saving'}
              className={`btn-primary ${saveStatus === 'no-changes' ? 'success' : ''}`} style={{ padding: '8px 16px', fontSize: '0.9rem', margin: 0 }}>
              {saveStatus === 'saving' ? '⏳ Guardando...' : saveStatus === 'no-changes' ? '✓ Sin cambios' : '💾 Guardar Cambios'}
            </button>
          </div>
        </div>

        <div className="photo-editor-body">
          <div className="photo-editor-preview-container" onMouseDown={onMouseDown} onTouchStart={onTouchStart} onTouchMove={onTouchMove}>
            <div className="photo-editor-preview-mask" style={{ borderRadius: '12px', aspectRatio: '3/4', width: '220px', overflow: 'hidden' }}>
              <img src={getMediaUrl(editingPhoto.ruta)} alt="preview" className="photo-editor-image" draggable="false"
                style={{
                  objectPosition: `${editorX}% ${editorY}%`,
                  transformOrigin: `${editorX}% ${editorY}%`,
                  transform: `scale(${editorZoom / 100})`,
                  filter: `brightness(${editorBrightness}%) contrast(${editorContrast}%) ${editorStyle ? STYLE_FILTERS[editorStyle] : ''}`.trim(),
                }}
                crossOrigin="anonymous"
              />
            </div>
            <div className="photo-editor-hint"><span>Arrastra para encuadrar</span></div>
          </div>

          <div className="photo-editor-controls">
            <div className="editor-control-group">
              <label><span className="control-label">🔍 Zoom ({editorZoom}%)</span><button type="button" className="reset-btn" onClick={() => setEditorZoom(100)}>↻</button></label>
              <input type="range" min="100" max="300" value={editorZoom} onChange={e => setEditorZoom(Number(e.target.value))} />
            </div>
            <div className="editor-control-group">
              <label><span className="control-label">☀️ Brillo ({editorBrightness}%)</span></label>
              <input type="range" min="50" max="150" value={editorBrightness} onChange={e => setEditorBrightness(Number(e.target.value))} />
            </div>
            <div className="editor-control-group">
              <label><span className="control-label">🌗 Contraste ({editorContrast}%)</span></label>
              <input type="range" min="50" max="150" value={editorContrast} onChange={e => setEditorContrast(Number(e.target.value))} />
            </div>
            <div style={{ marginBottom: '15px', display: 'flex', gap: '8px' }}>
              <button type="button" onClick={() => { setEditorBrightness(110); setEditorContrast(115); setEditorStyle(''); }}
                style={{ flex: 1, padding: '10px', background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>✨ Auto Color</button>
              <button type="button" onClick={() => { setEditorBrightness(100); setEditorContrast(100); setEditorStyle(''); setEditorZoom(100); setEditorX(50); setEditorY(38); }}
                style={{ padding: '10px 15px', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>↺ Reset</button>
            </div>
            <div className="editor-control-group" style={{ marginBottom: '15px' }}>
              <label><span className="control-label">🎨 Filtros</span></label>
              <select value={editorStyle} onChange={e => setEditorStyle(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', color: '#334155', background: 'white' }}>
                <option value="">Sin Filtro (Original)</option>
                <option value="vintage">Vintage (Cálido)</option>
                <option value="vivid">Saturado (Vivid)</option>
                <option value="dramatic">Dramático</option>
                <option value="cool">Frío (Cool)</option>
              </select>
            </div>
            <div className="editor-control-group">
              <label><span className="control-label">🏷️ Descripción SEO (Alt Text)</span></label>
              <input type="text" value={editorSeoAlt} onChange={e => setEditorSeoAlt(e.target.value)} placeholder="Ej. Tomates cherry maduros en la planta"
                style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.9rem' }} />
              <small style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>Ayuda al posicionamiento en buscadores.</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
