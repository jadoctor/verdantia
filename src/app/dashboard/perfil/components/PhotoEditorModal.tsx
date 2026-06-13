import React from 'react';
import { getMediaUrl } from '@/lib/media-url';
import { STYLE_FILTERS } from '../constants/profileConstants';
import { useProfilePhotos } from '../hooks/useProfilePhotos';

interface PhotoEditorModalProps {
  photosData: ReturnType<typeof useProfilePhotos>;
}

export function PhotoEditorModal({ photosData }: PhotoEditorModalProps) {
  const {
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
    savePhotoEdits,
    onEditorMouseDown,
    onEditorTouchStart,
    onEditorTouchMove,
    deletePhoto
  } = photosData;
  return (
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
              src={getMediaUrl(editingPhoto.ruta)}
              alt="Preview"
              crossOrigin="anonymous"
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
                onClick={() => { deletePhoto(editingPhoto.id).then(() => setEditingPhoto(null)); }}>
                🗑️ Eliminar Fotografía
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
