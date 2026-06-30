import React from 'react'; // Hot-reload trigger for moving edit button
import { getMediaUrl } from '@/lib/media-url';
import VariedadVegetalMediaManager from '../../VariedadVegetalMediaManager';

interface PhotoItem {
  id: string | number;
  ruta: string;
  esPrincipal: boolean;
  resumen?: string | any;
}

interface MediaTabProps {
  especieId: string | null;
  userEmail: string | null;
  photos: PhotoItem[];
  uploadingPhotos: boolean;
  dragOverPhotos: boolean;
  setDragOverPhotos: React.Dispatch<React.SetStateAction<boolean>>;
  setDraggedPhotoIndex: React.Dispatch<React.SetStateAction<number | null>>;
  setDraggedOverPhotoIndex: React.Dispatch<React.SetStateAction<number | null>>;
  handlePhotoReorder: () => void;
  handleSetPrimaryPhoto: (id: string | number) => void;
  setDeleteConfirm: React.Dispatch<React.SetStateAction<any>>;
  openPhotoEditor: (photo: PhotoItem) => void;
  handleFileUpload: (e: any, type: any) => Promise<void> | void;
  setShowAiImageModal: React.Dispatch<React.SetStateAction<boolean>>;
  formData: any;
  activeTab: string;
  pdfs: any[];
  setPdfs: React.Dispatch<React.SetStateAction<any[]>>;
  editPdfParam: string | null;
  STYLE_FILTERS: Record<string, string>;
}

export default function MediaTab({
  especieId,
  userEmail,
  photos,
  uploadingPhotos,
  dragOverPhotos,
  setDragOverPhotos,
  setDraggedPhotoIndex,
  setDraggedOverPhotoIndex,
  handlePhotoReorder,
  handleSetPrimaryPhoto,
  setDeleteConfirm,
  openPhotoEditor,
  handleFileUpload,
  setShowAiImageModal,
  formData,
  activeTab,
  pdfs,
  setPdfs,
  editPdfParam,
  STYLE_FILTERS
}: MediaTabProps) {
  return (
    <>
      {/* FOTOS */}
      <div style={{ display: activeTab === 'photos' ? 'block' : 'none' }}>
        {!especieId && (
          <div style={{ padding: '20px', background: '#fef3c7', borderRadius: '12px', color: '#92400e', fontSize: '0.85rem', fontWeight: 600, width: '100%' }}>
            💡 Guarda la especie primero para poder añadir fotos.
          </div>
        )}

        {especieId && (
          <>
            <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px' }}>📷 Fotos</span>
              <span style={{ fontSize: '0.82rem', color: photos.length >= 4 ? '#ef4444' : '#64748b', fontWeight: 600 }}>{photos.length} / 4 permitidas</span>
            </div>

            {((photos.length > 0) || (photos.length < 4)) && (
              <div className="gallery">
                {photos.map((photo, index) => {
                  let parsedResumen: any = {};
                  try {
                    parsedResumen = typeof photo.resumen === 'string'
                      ? JSON.parse(photo.resumen)
                      : (photo.resumen || {});
                  } catch (e) {
                    console.error('Error parseando resumen foto:', e);
                  }

                  const styleFilter = STYLE_FILTERS[parsedResumen.profile_style || ''] || '';
                  const brightness = parsedResumen.profile_brightness ?? 100;
                  const contrast = parsedResumen.profile_contrast ?? 100;
                  const fullFilter = `${styleFilter === 'none' ? '' : styleFilter} brightness(${brightness}%) contrast(${contrast}%)`.trim();
                  
                  const objectPosition = `${parsedResumen.profile_object_x ?? 50}% ${parsedResumen.profile_object_y ?? 50}%`;
                  const transformOrigin = `${parsedResumen.profile_object_x ?? 50}% ${parsedResumen.profile_object_y ?? 50}%`;
                  const transform = parsedResumen.profile_object_zoom > 100 ? `scale(${parsedResumen.profile_object_zoom / 100})` : 'scale(1)';

                  return (
                    <div
                      key={photo.id}
                      className={`gallery-item ${photo.esPrincipal ? 'is-preferred' : ''}`}
                      draggable
                      onDragStart={() => setDraggedPhotoIndex(index)}
                      onDragOver={(e) => { e.preventDefault(); setDraggedOverPhotoIndex(index); }}
                      onDrop={handlePhotoReorder}
                    >
                      <img
                        src={getMediaUrl(photo.ruta)}
                        alt={parsedResumen.seo_alt || formData.especiesvegetalesnombre || 'Foto de Especie'}
                        crossOrigin="anonymous"
                        style={{ 
                          filter: fullFilter,
                          objectPosition,
                          transformOrigin,
                          transform
                        }}
                      />
                      <div className="photo-actions">

                        <button
                          type="button"
                          className="photo-action-btn btn-photo-edit"
                          onClick={() => openPhotoEditor(photo)}
                          title="Editar imagen y SEO"
                        >
                          ✏️
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Inline Dropzone (only if less than 4 photos) */}
                {photos.length < 4 && (
                  <div
                    onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setDragOverPhotos(true); }}
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragOverPhotos(true); }}
                    onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDragOverPhotos(false); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDragOverPhotos(false);
                      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                        handleFileUpload({ target: { files: e.dataTransfer.files } }, 'photos');
                      }
                    }}
                    className={`custom-file-upload drop-zone inline-drop-zone ${dragOverPhotos ? 'drag-over' : ''}`}
                    style={{ cursor: 'default' }}
                  >
                    <input
                      type="file"
                      id="upload-photos"
                      multiple
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'photos')}
                      style={{ display: 'none' }}
                      disabled={uploadingPhotos}
                    />

                    {uploadingPhotos ? (
                      <div className="drop-zone-content">
                        <span style={{ fontSize: '1.5rem', animation: 'spin 2s linear infinite', display: 'inline-block' }}>⏳</span>
                        <span style={{ color: '#3b82f6', fontWeight: 'bold', fontSize: '0.75rem', textAlign: 'center' }}>Procesando...</span>
                      </div>
                    ) : (
                      <div className="drop-zone-content" style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                        <div className="drop-zone-buttons" style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', alignItems: 'center' }}>
                          <label
                            htmlFor="upload-photos"
                            className="btn-upload primary"
                            style={{
                              background: 'white',
                              border: '1px solid #cbd5e1',
                              color: '#475569',
                              padding: '6px 12px',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontWeight: 600,
                              fontSize: '0.75rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                              margin: 0
                            }}
                          >
                            📁 Seleccionar
                          </label>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowAiImageModal(true);
                            }}
                            className="btn-upload"
                            style={{
                              background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
                              color: 'white',
                              border: 'none',
                              padding: '6px 12px',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontWeight: 600,
                              fontSize: '0.75rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                              margin: 0
                            }}
                          >
                            ✨ Generar IA
                          </button>
                        </div>
                        <span className="drop-hint" style={{ fontSize: '0.65rem', color: '#94a3b8', textAlign: 'center', lineHeight: '1.2' }}>
                          Arrastra o pega<br />aquí
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* PDFs */}
      <div style={{ display: activeTab === 'pdfs' ? 'block' : 'none' }}>
        {!especieId ? (
          <div style={{ padding: '40px', textAlign: 'center', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1', color: '#64748b' }}>
            Guarda la especie primero antes de poder gestionar documentos.
          </div>
        ) : (
          <VariedadVegetalMediaManager 
            variedadId={especieId.toString()} 
            userEmail={userEmail!} 
            variedadNombre={formData.especiesvegetalesnombre}
            especieNombre="Especie"
            especieNombreCientifico={formData.especiesvegetalesnombrecientifico}
            apiBasePath={`/api/admin/especiesvegetales/${especieId}`}
            section="pdfs"
            onMediaChange={async () => {
              try {
                const dRes = await fetch(`/api/admin/especiesvegetales/${especieId}/pdfs`, { headers: { 'x-user-email': userEmail || '' } });
                if (dRes.ok) {
                  const dData = await dRes.json();
                  setPdfs(dData.pdfs || []);
                }
              } catch (e) { console.error('Error refetching PDFs in EspecieVegetalForm:', e); }
            }}
            entityType="especies"
            initialEditPdfId={editPdfParam ? parseInt(editPdfParam, 10) : null}
          />
        )}
      </div>
    </>
  );
}
