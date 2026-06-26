import React, { useState, useEffect } from 'react';

interface TratamientoHealthCheckProps {
  formData: any;
  tratamientoId: string;
  userEmail: string;
  onNavigateTab: (tab: string) => void;
  refreshTrigger?: number;
}

export default function TratamientoHealthCheck({ formData, tratamientoId, userEmail, onNavigateTab, refreshTrigger = 0 }: TratamientoHealthCheckProps) {
  const [photosCount, setPhotosCount] = useState(0);
  const [pdfsCount, setPdfsCount] = useState(0);
  const [blogsCount, setBlogsCount] = useState(0);

  useEffect(() => {
    if (tratamientoId && tratamientoId !== 'nuevo' && userEmail) {
      // Fetch stats
      fetch(`/api/admin/tratamientos/${tratamientoId}/photos`, { headers: { 'x-user-email': userEmail } })
        .then(r => r.json()).then(d => setPhotosCount(d.photos?.length || 0)).catch(e => console.error(e));
      fetch(`/api/admin/tratamientos/${tratamientoId}/pdfs`, { headers: { 'x-user-email': userEmail } })
        .then(r => r.json()).then(d => setPdfsCount(d.pdfs?.length || 0)).catch(e => console.error(e));
      fetch(`/api/admin/tratamientos/${tratamientoId}/blogs`, { headers: { 'x-user-email': userEmail } })
        .then(r => r.json()).then(d => setBlogsCount(d.blogs?.length || 0)).catch(e => console.error(e));
    }
  }, [tratamientoId, userEmail, refreshTrigger]);

  const FIELDS = [
    { id: 'tratamientosnombre', label: 'Nombre del Tratamiento', tab: 'detalles' },
    { id: 'tratamientostipo', label: 'Naturaleza / Origen', tab: 'detalles' },
    { id: 'tratamientosaccion', label: 'Modo de Acción', tab: 'detalles' },
    { id: 'tratamientosdosis', label: 'Dosis Recomendada', tab: 'detalles' },
    { id: 'tratamientosfrecuencia', label: 'Frecuencia', tab: 'detalles' },
    { id: 'tratamientoscarencia', label: 'Plazo de Seguridad', tab: 'detalles' },
    { id: 'tratamientosmecanismo', label: 'Mecanismo de Acción', tab: 'detalles' },
    { id: 'tratamientosdescripcion', label: 'Descripción General', tab: 'detalles' },
    { id: 'tratamientospreparacion', label: 'Preparación y Uso', tab: 'detalles' },
    { id: 'tratamientosprecauciones', label: 'Precauciones / Toxicidad', tab: 'detalles' },
    { id: 'partes', label: 'Vías de Aplicación', tab: 'detalles' }
  ];

  let points = 0;
  const missingItems: { label: string, type: 'field' | 'media', tab: string, targetId?: string }[] = [];

  // Check Fields
  FIELDS.forEach(f => {
    let hasValue = false;
    if (f.id === 'partes') {
      hasValue = formData.partes && formData.partes.length > 0;
    } else {
      hasValue = formData[f.id] && String(formData[f.id]).trim().length > 0;
    }

    if (hasValue) {
      points += 1;
    } else {
      missingItems.push({ label: f.label, type: 'field', tab: f.tab, targetId: f.id });
    }
  });

  // Check Media
  const photoPts = Math.min(photosCount, 4);
  const pdfPts = Math.min(pdfsCount, 4);
  const blogPts = Math.min(blogsCount, 4);
  
  points += photoPts + pdfPts + blogPts;

  if (photoPts < 4) missingItems.push({ label: `Faltan ${4 - photoPts} fotos`, type: 'media', tab: 'fotos' });
  if (pdfPts < 4) missingItems.push({ label: `Faltan ${4 - pdfPts} PDFs`, type: 'media', tab: 'pdfs' });
  if (blogPts < 4) missingItems.push({ label: `Faltan ${4 - blogPts} Blogs IA`, type: 'media', tab: 'blogs' });

  const TOTAL_POINTS = 23;
  const percentage = Math.round((points / TOTAL_POINTS) * 100);

  const getColor = (pct: number) => {
    if (pct < 40) return '#ef4444'; // Red
    if (pct < 75) return '#f59e0b'; // Orange
    if (pct < 100) return '#10b981'; // Green
    return '#8b5cf6'; // Purple/Gold
  };

  const handleItemClick = (item: any) => {
    onNavigateTab(item.tab);
    if (item.type === 'field' && item.targetId) {
      setTimeout(() => {
        const el = (document.getElementById(item.targetId) || document.querySelector(`[name="${item.targetId}"]`)) as HTMLElement;
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.focus();
          // Highlight effect
          const originalOutline = el.style.outline;
          const originalTransition = el.style.transition;
          el.style.transition = 'all 0.3s ease';
          el.style.outline = '3px solid #f59e0b';
          el.style.outlineOffset = '2px';
          setTimeout(() => {
            el.style.outline = originalOutline;
          }, 2000);
        }
      }, 100); // small delay to let tab render
    }
  };

  return (
    <div style={{ background: '#f8fafc', border: `2px solid ${getColor(percentage)}`, borderRadius: '12px', padding: '16px', marginBottom: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
        
        {/* Progress Ring */}
        <div style={{ position: 'relative', width: '80px', height: '80px', flexShrink: 0 }}>
          <svg width="100%" height="100%" viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }}>
            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e2e8f0" strokeWidth="3" />
            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={getColor(percentage)} strokeWidth="3" strokeDasharray={`${percentage}, 100`} />
          </svg>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1rem', color: getColor(percentage) }}>
            {percentage}%
          </div>
        </div>

        {/* Text and Actions */}
        <div style={{ flex: 1, minWidth: '250px' }}>
          <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', color: '#1e293b' }}>
            Nivel de Completitud {percentage === 100 && '🏆'}
          </h3>
          <p style={{ margin: '0 0 12px 0', fontSize: '0.85rem', color: '#64748b' }}>
            {percentage === 100 
              ? '¡Registro Perfecto! Este tratamiento cumple con todos los estándares premium.'
              : 'Completa los siguientes campos para enriquecer la calidad de la base de datos:'}
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {missingItems.map((item, idx) => (
              <button 
                key={idx} 
                onClick={() => handleItemClick(item)}
                title="Hacer clic para ir"
                style={{ 
                  background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '20px', 
                  padding: '4px 10px', fontSize: '0.75rem', color: '#475569', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '4px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#3b82f6'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#cbd5e1'}
              >
                <span style={{ color: '#ef4444' }}>❌</span> Falta: {item.label}
              </button>
            ))}
            {percentage === 100 && (
              <span style={{ background: '#d1fae5', color: '#059669', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                ¡Todo completo!
              </span>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
