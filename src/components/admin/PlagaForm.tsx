'use client';

import React, { useState, useEffect } from 'react';
import { storage } from '@/lib/firebase/config';
import { getMediaUrl } from '@/lib/media-url';
import './EspecieForm.css';

interface PlagaFormProps {
  plagaId: string | null;
  userEmail: string;
  onClose: () => void;
}

const defaultFormData = {
  plagasnombre: '',
  plagasnombrecientifico: '',
  plagastipo: 'insecto',
  plagasdescripcion: '',
  plagascontrolorganico: ''
};

const STYLE_FILTERS: Record<string, string> = {
  vintage: 'sepia(40%) contrast(110%) saturate(120%) brightness(95%) hue-rotate(-5deg)',
  cinematic: 'contrast(120%) saturate(110%) brightness(90%) sepia(20%) hue-rotate(180deg) hue-rotate(-180deg)',
  vibrant: 'saturate(150%) contrast(105%) brightness(105%)',
  bnw: 'grayscale(100%) contrast(120%) brightness(105%)',
  fade: 'contrast(85%) brightness(110%) saturate(80%) sepia(10%)',
  none: 'none'
};

export default function PlagaForm({ plagaId, userEmail, onClose }: PlagaFormProps) {
  const [formData, setFormData] = useState<any>(defaultFormData);
  const [initialData, setInitialData] = useState<any>(defaultFormData);
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'no-changes'>('idle');

  const isDirty = JSON.stringify(formData) !== JSON.stringify(initialData);

  const [activeTab, setActiveTab] = useState('detalles');

  // Photos State
  const [photos, setPhotos] = useState<any[]>([]);
  const [dragOverPhotos, setDragOverPhotos] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [heroIndex, setHeroIndex] = useState(0);

  // Editor State
  const [editingPhoto, setEditingPhoto] = useState<any>(null);
  const [editorX, setEditorX] = useState(50);
  const [editorY, setEditorY] = useState(50);
  const [editorZoom, setEditorZoom] = useState(100);
  const [editorBrightness, setEditorBrightness] = useState(100);
  const [editorContrast, setEditorContrast] = useState(100);
  const [editorStyle, setEditorStyle] = useState('');
  const [editorSeoAlt, setEditorSeoAlt] = useState('');
  const [photoEditorSaveStatus, setPhotoEditorSaveStatus] = useState<'idle' | 'saving' | 'no-changes'>('idle');
  const [editorInitialState, setEditorInitialState] = useState('');

  useEffect(() => {
    if (plagaId) {
      fetchPlaga();
      loadPhotos(plagaId);
    }
  }, [plagaId]);

  const loadPhotos = async (id: string | number) => {
    try {
      const res = await fetch(`/api/admin/plagas/${id}/photos`, { headers: { 'x-user-email': userEmail } });
      const data = await res.json();
      setPhotos(data.photos || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchPlaga = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/plagas`, {
        headers: { 'x-user-email': userEmail }
      });
      if (res.ok) {
        const data = await res.json();
        const plaga = data.plagas?.find((p: any) => p.idplagas.toString() === plagaId);
        if (plaga) {
          const loadedData = {
            plagasnombre: plaga.plagasnombre || '',
            plagasnombrecientifico: plaga.plagasnombrecientifico || '',
            plagastipo: plaga.plagastipo || 'insecto',
            plagasdescripcion: plaga.plagasdescripcion || '',
            plagascontrolorganico: plaga.plagascontrolorganico || ''
          };
          setFormData(loadedData);
          setInitialData(loadedData);
        }
      }
    } catch (error) {
      console.error('Error fetching plaga:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent) => {
    if (!plagaId) {
      alert('Guarda la plaga antes de añadir fotos.');
      return;
    }
    let files: File[] = [];
    if ('files' in e.target && e.target.files) {
      files = Array.from(e.target.files);
    } else if ('dataTransfer' in e) {
      e.preventDefault();
      files = Array.from(e.dataTransfer.files);
    }
    if (files.length === 0) return;

    setUploadingPhotos(true);
    try {
      const { ref, uploadBytes } = await import('firebase/storage');
      const imageCompression = (await import('browser-image-compression')).default;

      for (const file of files) {
        const options = { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true };
        const compressedFile = await imageCompression(file, options);
        const storagePath = `uploads/plagas/${plagaId}-${Date.now()}-${file.name}`;
        const storageRef = ref(storage, storagePath);
        await uploadBytes(storageRef, compressedFile);

        await fetch(`/api/admin/plagas/${plagaId}/photos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail },
          body: JSON.stringify({ rawStoragePath: storagePath, plagaNombre: formData.plagasnombre })
        });
      }
      await loadPhotos(plagaId);
    } catch (error) {
      console.error('Error subiendo fotos:', error);
      alert('Error subiendo algunas fotos.');
    } finally {
      setUploadingPhotos(false);
      setDragOverPhotos(false);
    }
  };

  const handleDeletePhoto = async (photoId: number) => {
    if (!confirm('¿Seguro que quieres borrar esta foto?')) return;
    try {
      await fetch(`/api/admin/plagas/${plagaId}/photos?photoId=${photoId}`, {
        method: 'DELETE',
        headers: { 'x-user-email': userEmail }
      });
      setPhotos(photos.filter(p => p.id !== photoId));
      if (heroIndex >= photos.length - 1) setHeroIndex(0);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSetPrimary = async (photoId: number) => {
    try {
      await fetch(`/api/admin/plagas/${plagaId}/photos`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail },
        body: JSON.stringify({ photoId, action: 'setPrimary' })
      });
      if (plagaId) {
        await loadPhotos(plagaId);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const openPhotoEditor = (photo: any) => {
    const res = photo.resumen ? (typeof photo.resumen === 'string' ? JSON.parse(photo.resumen) : photo.resumen) : {};
    setEditingPhoto(photo);
    setEditorX(res.profile_object_x ?? 50);
    setEditorY(res.profile_object_y ?? 50);
    setEditorZoom(res.profile_object_zoom ?? 100);
    setEditorBrightness(res.profile_brightness ?? 100);
    setEditorContrast(res.profile_contrast ?? 100);
    setEditorStyle(res.profile_style ?? '');
    setEditorSeoAlt(res.seo_alt ?? '');
    
    const stateStr = JSON.stringify({
      x: res.profile_object_x ?? 50,
      y: res.profile_object_y ?? 50,
      z: res.profile_object_zoom ?? 100,
      b: res.profile_brightness ?? 100,
      c: res.profile_contrast ?? 100,
      s: res.profile_style ?? '',
      seo: res.seo_alt ?? ''
    });
    setEditorInitialState(stateStr);
    setPhotoEditorSaveStatus('idle');
  };

  const savePhotoEditor = async () => {
    const currentState = JSON.stringify({
      x: editorX, y: editorY, z: editorZoom, b: editorBrightness, c: editorContrast, s: editorStyle, seo: editorSeoAlt
    });
    if (currentState === editorInitialState) {
      setPhotoEditorSaveStatus('no-changes');
      setTimeout(() => setEditingPhoto(null), 800);
      return;
    }

    setPhotoEditorSaveStatus('saving');
    try {
      const res = editingPhoto.resumen ? (typeof editingPhoto.resumen === 'string' ? JSON.parse(editingPhoto.resumen) : editingPhoto.resumen) : {};
      const updatedResumen = {
        ...res,
        profile_object_x: editorX,
        profile_object_y: editorY,
        profile_object_zoom: editorZoom,
        profile_brightness: editorBrightness,
        profile_contrast: editorContrast,
        profile_style: editorStyle,
        seo_alt: editorSeoAlt
      };

      await fetch(`/api/admin/plagas/${plagaId}/photos`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail },
        body: JSON.stringify({ photoId: editingPhoto.id, action: 'updateMeta', resumen: updatedResumen })
      });
      if (plagaId) {
        await loadPhotos(plagaId);
      }
      setEditingPhoto(null);
    } catch (e) {
      console.error(e);
      alert('Error guardando cambios');
    } finally {
      setPhotoEditorSaveStatus('idle');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
    setSaveStatus('idle');
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isDirty && saveStatus !== 'saving') {
      setSaveStatus('no-changes');
      setTimeout(onClose, 800);
      return;
    }

    setSaveStatus('saving');
    try {
      const url = plagaId ? `/api/admin/plagas/${plagaId}` : '/api/admin/plagas';
      const method = plagaId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': userEmail
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setInitialData(formData);
        setSaveStatus('idle');
        onClose();
      } else {
        const err = await res.json();
        alert(err.error || 'Error al guardar');
        setSaveStatus('idle');
      }
    } catch (error) {
      console.error('Error saving plaga:', error);
      alert('Error de conexión');
      setSaveStatus('idle');
    }
  };

  return (
    <div style={{ padding: '24px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ margin: 0, color: '#1e293b' }}>
          {plagaId ? 'Editar Plaga/Enfermedad' : 'Nueva Plaga/Enfermedad'}
        </h2>
        <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}>×</button>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center' }}>Cargando datos...</div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="form-tabs">
            <button type="button" className={activeTab === 'detalles' ? 'active' : ''} onClick={() => setActiveTab('detalles')}>Detalles</button>
            <button type="button" className={activeTab === 'fotos' ? 'active' : ''} onClick={() => setActiveTab('fotos')}>Fotos ({photos.length})</button>
          </div>

          <div className="form-tab-content">
            {activeTab === 'detalles' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#475569' }}>Nombre Común *</label>
                    <input 
                      type="text" name="plagasnombre" required
                      value={formData.plagasnombre} onChange={handleChange}
                      style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem' }}
                      placeholder="Ej: Pulgón Verde"
                    />
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#475569' }}>Nombre Científico</label>
                    <input 
                      type="text" name="plagasnombrecientifico" 
                      value={formData.plagasnombrecientifico} onChange={handleChange}
                      style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', fontStyle: 'italic' }}
                      placeholder="Ej: Myzus persicae"
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#475569' }}>Tipo de Amenaza</label>
                  <select 
                    name="plagastipo" value={formData.plagastipo} onChange={handleChange}
                    style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem' }}
                  >
                    <option value="insecto">Insecto / Ácaro</option>
                    <option value="hongo">Hongo</option>
                    <option value="bacteria">Bacteria</option>
                    <option value="virus">Virus</option>
                    <option value="mamifero">Mamífero / Ave</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#475569' }}>Descripción / Cómo Detectarlo</label>
                  <textarea 
                    name="plagasdescripcion" rows={3}
                    value={formData.plagasdescripcion} onChange={handleChange}
                    style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', resize: 'vertical' }}
                    placeholder="Ej: Aparecen colonias en los brotes tiernos..."
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#475569' }}>Control Ecológico Recomendado</label>
                  <textarea 
                    name="plagascontrolorganico" rows={3}
                    value={formData.plagascontrolorganico} onChange={handleChange}
                    style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', resize: 'vertical' }}
                    placeholder="Ej: Aplicar jabón potásico al 2% al atardecer..."
                  />
                </div>
              </div>
            )}

            {activeTab === 'fotos' && (
              <div style={{ padding: '4px' }}>
                {/* Hero Carousel */}
                {photos.length > 0 && (
                  <div style={{ 
                    position: 'relative', height: '280px', borderRadius: '16px', overflow: 'hidden', 
                    marginBottom: '20px', background: '#000', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)' 
                  }}>
                    <img 
                      src={getMediaUrl(photos[heroIndex].ruta)} 
                      alt="Hero"
                      style={{ 
                        width: '100%', height: '100%', objectFit: 'cover',
                        filter: `${STYLE_FILTERS[JSON.parse(photos[heroIndex].resumen || '{}').profile_style || 'none']} brightness(${JSON.parse(photos[heroIndex].resumen || '{}').profile_brightness || 100}%) contrast(${JSON.parse(photos[heroIndex].resumen || '{}').profile_contrast || 100}%)`
                      }}
                      crossOrigin="anonymous"
                    />
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '15px', background: 'linear-gradient(transparent, rgba(0,0,0,0.7))', display: 'flex', justifyContent: 'center', gap: '6px' }}>
                      {photos.map((_, idx) => (
                        <div key={idx} onClick={() => setHeroIndex(idx)} style={{ width: '8px', height: '8px', borderRadius: '50%', background: idx === heroIndex ? 'white' : 'rgba(255,255,255,0.4)', cursor: 'pointer' }} />
                      ))}
                    </div>
                  </div>
                )}

                <div 
                  className={`custom-file-upload drop-zone ${dragOverPhotos ? 'drag-over' : ''}`}
                  onDragOver={e => { e.preventDefault(); setDragOverPhotos(true); }}
                  onDragLeave={() => setDragOverPhotos(false)}
                  onDrop={handleFileUpload}
                >
                  <input type="file" id="photo-upload" multiple accept="image/*" onChange={handleFileUpload} />
                  <div className="drop-zone-content">
                    <span style={{ fontSize: '2rem' }}>📸</span>
                    {uploadingPhotos ? <span>Subiendo y procesando con IA...</span> : <span>Arrastra fotos aquí o haz clic para subir</span>}
                    <label htmlFor="photo-upload" className="btn-upload secondary">Seleccionar Archivos</label>
                  </div>
                </div>

                <div className="gallery" style={{ marginTop: '20px' }}>
                  {photos.map((p, idx) => (
                    <div key={p.id} className={`gallery-item ${p.esPrincipal ? 'is-preferred' : ''}`}>
                      <img src={getMediaUrl(p.ruta)} alt="Thumb" crossOrigin="anonymous" />
                      <div className="photo-actions">
                        <button type="button" className={`photo-action-btn btn-photo-primary ${p.esPrincipal ? 'is-active' : ''}`} onClick={() => handleSetPrimary(p.id)}>★</button>
                        <button type="button" className="photo-action-btn btn-photo-edit" onClick={() => openPhotoEditor(p)}>✏️</button>
                        <button type="button" className="photo-action-btn btn-photo-delete" onClick={() => handleDeletePhoto(p.id)}>×</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
            <button type="button" onClick={onClose} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white', cursor: 'pointer', fontWeight: '600' }}>
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={saveStatus === 'saving'}
              style={{ 
                padding: '10px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold', color: 'white',
                background: saveStatus === 'no-changes' ? '#10b981' : saveStatus === 'saving' ? '#94a3b8' : '#3b82f6',
                transition: 'all 0.2s'
              }}>
              {saveStatus === 'no-changes' ? '✓ Sin cambios' : saveStatus === 'saving' ? 'Guardando...' : 'Guardar Plaga'}
            </button>
          </div>
        </form>
      )}

      {/* Photo Editor Modal */}
      {editingPhoto && (
        <div className="photo-editor-overlay">
          <div className="photo-editor-modal">
            <div className="photo-editor-header">
              <h3>🎨 Editor de Foto</h3>
              <button onClick={() => setEditingPhoto(null)} className="close-editor">×</button>
            </div>
            
            <div className="photo-editor-layout">
              <div className="photo-preview-container">
                <div className="photo-preview-main">
                  <img 
                    src={getMediaUrl(editingPhoto.ruta)} 
                    alt="Editor Preview" 
                    crossOrigin="anonymous"
                    style={{
                      transform: `scale(${editorZoom/100}) translate(${(editorX-50)}%, ${(editorY-50)}%)`,
                      filter: `${STYLE_FILTERS[editorStyle || 'none']} brightness(${editorBrightness}%) contrast(${editorContrast}%)`
                    }}
                  />
                  <div className="preview-guide">CENTRO DEL OBJETO</div>
                </div>
                
                <div className="photo-preview-circular">
                  <div className="circular-inner">
                    <img 
                      src={getMediaUrl(editingPhoto.ruta)} 
                      alt="Circular Preview" 
                      crossOrigin="anonymous"
                      style={{
                        transform: `scale(${editorZoom/100}) translate(${(editorX-50)}%, ${(editorY-50)}%)`,
                        filter: `${STYLE_FILTERS[editorStyle || 'none']} brightness(${editorBrightness}%) contrast(${editorContrast}%)`
                      }}
                    />
                  </div>
                  <span className="circular-label">Vista Circular</span>
                </div>
              </div>

              <div className="photo-editor-controls">
                <div className="control-group">
                  <label>Posición Horizontal ({editorX}%)</label>
                  <input type="range" min="0" max="100" value={editorX} onChange={(e) => setEditorX(Number(e.target.value))} />
                </div>
                <div className="control-group">
                  <label>Posición Vertical ({editorY}%)</label>
                  <input type="range" min="0" max="100" value={editorY} onChange={(e) => setEditorY(Number(e.target.value))} />
                </div>
                <div className="control-group">
                  <label>Zoom ({editorZoom}%)</label>
                  <input type="range" min="50" max="250" value={editorZoom} onChange={(e) => setEditorZoom(Number(e.target.value))} />
                </div>
                
                <div className="control-divider" />

                <div className="control-group">
                  <label>Brillo ({editorBrightness}%)</label>
                  <input type="range" min="50" max="150" value={editorBrightness} onChange={(e) => setEditorBrightness(Number(e.target.value))} />
                </div>
                <div className="control-group">
                  <label>Contraste ({editorContrast}%)</label>
                  <input type="range" min="50" max="150" value={editorContrast} onChange={(e) => setEditorContrast(Number(e.target.value))} />
                </div>

                <div className="control-group">
                  <label>Estilo Visual</label>
                  <div className="style-grid">
                    {Object.keys(STYLE_FILTERS).map(s => (
                      <button 
                        key={s} 
                        type="button"
                        className={`style-btn ${editorStyle === s ? 'active' : ''}`}
                        onClick={() => setEditorStyle(s)}
                      >
                        {s === 'none' ? 'Normal' : s.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="control-divider" />

                <div className="control-group">
                  <label>Descripción SEO (IA)</label>
                  <textarea 
                    value={editorSeoAlt} 
                    onChange={(e) => setEditorSeoAlt(e.target.value)}
                    placeholder="Describe la foto para buscadores..."
                    rows={2}
                  />
                </div>

                <div className="editor-footer">
                  <button onClick={() => setEditingPhoto(null)} className="btn-cancel">Cancelar</button>
                  <button 
                    onClick={savePhotoEditor} 
                    className={`btn-save ${photoEditorSaveStatus === 'no-changes' ? 'success' : ''}`}
                    disabled={photoEditorSaveStatus === 'saving'}
                  >
                    {photoEditorSaveStatus === 'saving' ? 'Guardando...' : 
                     photoEditorSaveStatus === 'no-changes' ? '✓ Sin cambios' : 'Guardar Cambios'}
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
