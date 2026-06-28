import React from 'react';
import VariedadVegetalMediaManager from '@/components/admin/VariedadVegetalMediaManager';

interface TratamientoMediaTabsProps {
  activeTab: string;
  id: string;
  userEmail: string;
  formData: any;
  refreshPhotos: () => void;
  triggerMediaRefresh: () => void;
  mediaRefreshTrigger: number;
  editPdfParam: string | null;
}

const EmptyTabMessage = ({ text }: { text: string }) => (
  <div style={{ padding: '40px', textAlign: 'center', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1', color: '#64748b' }}>
    {text}
  </div>
);

export function TratamientoMediaTabs({
  activeTab,
  id,
  userEmail,
  formData,
  refreshPhotos,
  triggerMediaRefresh,
  mediaRefreshTrigger,
  editPdfParam
}: TratamientoMediaTabsProps) {
  const isNew = id === 'nuevo';
  const apiBase = `/api/admin/tratamientos/${id}`;

  return (
    <>
      {/* TAB: Fotos */}
      <div style={{ display: activeTab === 'fotos' ? 'block' : 'none' }}>
        {isNew ? (
          <EmptyTabMessage text="Guarda un nombre para el tratamiento primero antes de poder subir fotos." />
        ) : (
          <VariedadVegetalMediaManager 
            variedadId={id} 
            userEmail={userEmail} 
            variedadNombre={formData.tratamientosnombre}
            especieNombre="Tratamiento"
            apiBasePath={apiBase}
            section="photos"
            onMediaChange={() => { refreshPhotos(); triggerMediaRefresh(); }}
            entityType="tratamientos"
          />
        )}
      </div>

      {/* TAB: PDFs */}
      <div style={{ display: activeTab === 'pdfs' ? 'block' : 'none' }}>
        {isNew ? (
          <EmptyTabMessage text="Guarda un nombre para el tratamiento primero antes de poder subir documentos." />
        ) : (
          <VariedadVegetalMediaManager 
            variedadId={id} 
            userEmail={userEmail} 
            variedadNombre={formData.tratamientosnombre}
            especieNombre="Tratamiento"
            apiBasePath={apiBase}
            section="pdfs"
            onMediaChange={triggerMediaRefresh}
            entityType="tratamientos"
            initialEditPdfId={editPdfParam ? parseInt(editPdfParam, 10) : null}
          />
        )}
      </div>

      {/* TAB: Blogs */}
      <div style={{ display: activeTab === 'blogs' ? 'block' : 'none' }}>
        {isNew ? (
          <EmptyTabMessage text="Guarda un nombre para el tratamiento primero antes de poder gestionar blogs." />
        ) : (
          <VariedadVegetalMediaManager 
            variedadId={id} 
            userEmail={userEmail} 
            variedadNombre={formData.tratamientosnombre}
            especieNombre="Tratamiento"
            apiBasePath={apiBase}
            section="blogs"
            onMediaChange={triggerMediaRefresh}
            entityType="tratamientos"
          />
        )}
      </div>
    </>
  );
}
