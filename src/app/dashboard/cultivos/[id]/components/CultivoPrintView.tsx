import React, { useEffect, useState } from 'react';
import { getMediaUrl } from '@/lib/media-url';

interface CultivoPrintViewProps {
  cultivo: any;
  formData: any;
  userEmail: string;
}

export default function CultivoPrintView({ cultivo, formData, userEmail }: CultivoPrintViewProps) {
  const [photos, setPhotos] = useState<any[]>([]);

  useEffect(() => {
    if (cultivo?.idcultivos && userEmail) {
      fetch(`/api/user/cultivos/${cultivo.idcultivos}/photos`, { headers: { 'x-user-email': userEmail } })
        .then(res => res.json())
        .then(data => setPhotos(data.photos || []))
        .catch(e => console.error('Error fetching photos for print:', e));
    }
  }, [cultivo, userEmail]);

  if (!cultivo) return null;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '---';
    return new Date(dateStr).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  const calculateDays = (start: string, end: string) => {
    if (!start || !end) return 0;
    const s = new Date(start).getTime();
    const e = new Date(end).getTime();
    return Math.floor((e - s) / (1000 * 60 * 60 * 24));
  };

  const totalDays = calculateDays(formData.cultivosfechainicio, formData.cultivosfecharecoleccion || formData.cultivosfechafinalizacion || new Date().toISOString());

  // Dividir observaciones en líneas
  const observations = (formData.cultivosobservaciones || '').split('\\n').filter((l: string) => l.trim() !== '');

  return (
    <div className="print-only-container" style={{ display: 'none', padding: '2cm', background: 'white', color: 'black' }}>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-only-container, .print-only-container * { visibility: visible; }
          .print-only-container { display: block !important; position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 2cm; background: white; }
          @page { size: A4; margin: 0; }
          .print-break-inside-avoid { break-inside: avoid; page-break-inside: avoid; }
        }
      `}</style>

      {/* Cabecera */}
      <div style={{ textAlign: 'center', borderBottom: '2px solid #10b981', paddingBottom: '1rem', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', margin: '0 0 0.5rem', color: '#064e3b' }}>
          Diario de Cultivo
        </h1>
        <h2 style={{ fontSize: '1.5rem', margin: 0, color: '#047857' }}>
          {cultivo.nombreVariedad || 'Variedad Desconocida'} ({cultivo.nombreEspecie || 'Especie'})
        </h2>
        <p style={{ marginTop: '0.5rem', color: '#475569', fontSize: '1.1rem' }}>
          Cultivo #{cultivo.cultivosnumerocoleccion || cultivo.idcultivos} • {formatDate(formData.cultivosfechainicio)}
        </p>
      </div>

      {/* Ficha Técnica */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
        <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 1rem', color: '#1e293b', borderBottom: '1px solid #cbd5e1', paddingBottom: '0.5rem' }}>Ficha Técnica</h3>
          <p><strong>Método:</strong> {cultivo.cultivosmetodo === 'semillero' ? 'Semillero' : cultivo.cultivosmetodo === 'siembra_directa' ? 'Siembra Directa' : 'Trasplante Directo'}</p>
          <p><strong>Origen:</strong> {cultivo.cultivosorigen.replace('_', ' ')}</p>
          <p><strong>Cantidad:</strong> {formData.cultivoscantidad} unidades</p>
          <p><strong>Ubicación:</strong> {formData.cultivosubicacion || 'No especificada'}</p>
          <p><strong>Estado Final:</strong> {formData.cultivosestado.toUpperCase().replace('_', ' ')}</p>
          <p><strong>Días Totales de Ciclo:</strong> {totalDays} días</p>
        </div>

        {/* Fechas Clave */}
        <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 1rem', color: '#1e293b', borderBottom: '1px solid #cbd5e1', paddingBottom: '0.5rem' }}>Línea de Tiempo</h3>
          <ul style={{ listStyleType: 'none', padding: 0, margin: 0, lineHeight: '1.8' }}>
            <li>🌱 <strong>Siembra:</strong> {formatDate(formData.cultivosfechainicio)}</li>
            {formData.cultivosfechagerminacion && <li>🌿 <strong>Germinación:</strong> {formatDate(formData.cultivosfechagerminacion)} (+{calculateDays(formData.cultivosfechainicio, formData.cultivosfechagerminacion)} días)</li>}
            {formData.cultivosfechatrasplante && <li>🪴 <strong>Trasplante:</strong> {formatDate(formData.cultivosfechatrasplante)}</li>}
            {formData.cultivosfechacrecimiento && <li>📏 <strong>Crecimiento:</strong> {formatDate(formData.cultivosfechacrecimiento)}</li>}
            {formData.cultivosfechafructificacion && <li>🌸 <strong>Floración/Fructificación:</strong> {formatDate(formData.cultivosfechafructificacion)}</li>}
            {formData.cultivosfecharecoleccion && <li>✂️ <strong>Recolección:</strong> {formatDate(formData.cultivosfecharecoleccion)}</li>}
          </ul>
        </div>
      </div>

      {/* Historial de Notas */}
      {observations.length > 0 && (
        <div className="print-break-inside-avoid" style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.5rem', color: '#064e3b', borderBottom: '2px solid #10b981', paddingBottom: '0.5rem' }}>Historial y Observaciones</h3>
          <div style={{ padding: '1rem', background: '#f1f5f9', borderRadius: '12px' }}>
            {observations.map((obs: string, idx: number) => {
              const isHarvest = obs.includes('[🏆 Cosecha:');
              return (
                <p key={idx} style={{ 
                  margin: '0 0 0.8rem', 
                  padding: isHarvest ? '1rem' : '0', 
                  background: isHarvest ? '#dcfce7' : 'transparent',
                  border: isHarvest ? '2px solid #22c55e' : 'none',
                  borderRadius: '8px',
                  fontWeight: isHarvest ? 'bold' : 'normal'
                }}>
                  {obs}
                </p>
              );
            })}
          </div>
        </div>
      )}

      {/* Galería Fotográfica */}
      {photos.length > 0 && (
        <div className="print-break-inside-avoid">
          <h3 style={{ fontSize: '1.5rem', color: '#064e3b', borderBottom: '2px solid #10b981', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>Galería de Evolución</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            {photos.slice().reverse().map((photo, idx) => {
              let meta: any = {};
              try { meta = JSON.parse(photo.resumen || '{}'); } catch(e){}
              
              return (
                <div key={photo.id} style={{ breakInside: 'avoid', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.5rem', background: '#fff' }}>
                  <img 
                    src={getMediaUrl(photo.ruta)} 
                    alt="Foto cultivo" 
                    style={{ 
                      width: '100%', height: '200px', objectFit: 'cover', borderRadius: '4px',
                      objectPosition: `${meta.profile_object_x || 50}% ${meta.profile_object_y || 50}%`
                    }}
                    crossOrigin="anonymous"
                  />
                  <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', textAlign: 'center', color: '#475569' }}>
                    {meta.fase ? `${meta.fase} - ` : ''}{formatDate(photo.datosadjuntosfechacreacion || photo.fecha)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      <div style={{ textAlign: 'center', marginTop: '3rem', color: '#94a3b8', fontSize: '0.9rem' }}>
        <p>Diario generado automáticamente desde <strong>Verdantia</strong></p>
      </div>
    </div>
  );
}
