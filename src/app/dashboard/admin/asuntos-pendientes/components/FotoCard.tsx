'use client';
import React from 'react';
import { getMediaUrl } from '@/lib/media-url';

interface Photo {
  id: number;
  ruta: string;
  fecha: string;
  nombreOriginal: string;
  motivoRechazo?: string;
  motivoRecurso?: string;
}

interface Props {
  foto: Photo;
  tab: 'pendientes' | 'recursos';
  processing: number | null;
  onValidar: (id: number) => void;
  onRechazar: (id: number) => void;
  onRestaurar: (id: number, foto: Photo) => void;
  onRechazarRecurso: (id: number, foto: Photo) => void;
  onEditar: (foto: Photo) => void;
  onLightbox: (url: string) => void;
}

export function FotoCard({ foto, tab, processing, onValidar, onRechazar, onRestaurar, onRechazarRecurso, onEditar, onLightbox }: Props) {
  const formatDate = (d: string) => {
    try { return new Date(d).toLocaleString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
    catch { return d; }
  };

  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'all 0.2s', opacity: processing === foto.id ? 0.5 : 1 }}>
      {/* Imagen */}
      <div style={{ height: '220px', background: '#f1f5f9', position: 'relative', cursor: 'pointer' }} onClick={() => onLightbox(getMediaUrl(foto.ruta))}>
        <img src={getMediaUrl(foto.ruta)} alt={foto.nombreOriginal} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '4px' }} crossOrigin="anonymous" />
        <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(0,0,0,0.6)', color: 'white', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}>{formatDate(foto.fecha)}</div>
        {tab === 'pendientes' && <div style={{ position: 'absolute', top: 8, right: 8, background: '#fef3c7', color: '#92400e', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>PENDIENTE</div>}
      </div>

      {/* Body */}
      <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        {tab === 'recursos' && (
          <div style={{ marginBottom: '12px', background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <p style={{ margin: '0 0 4px', fontSize: '0.75rem', color: '#ef4444', fontWeight: 600 }}>MOTIVO RECHAZO ORIGINAL:</p>
            <p style={{ margin: '0 0 8px', fontSize: '0.85rem', color: '#334155' }}>{foto.motivoRechazo}</p>
            <p style={{ margin: '0 0 4px', fontSize: '0.75rem', color: '#8b5cf6', fontWeight: 600 }}>ALEGACIÓN DEL USUARIO:</p>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#334155', fontStyle: 'italic' }}>{foto.motivoRecurso || 'Sin alegación'}</p>
          </div>
        )}
        {/* Botones */}
        <div style={{ display: 'flex', gap: '6px', marginTop: 'auto', flexWrap: 'wrap' }}>
          {tab === 'pendientes' ? (<>
            <button onClick={() => onValidar(foto.id)} disabled={processing !== null} style={{ flex: 1, background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', padding: '8px', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}>✅ Validar</button>
            <button onClick={() => onRechazar(foto.id)} disabled={processing !== null} style={{ flex: 1, background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', padding: '8px', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}>❌ Denegar</button>
          </>) : (<>
            <button onClick={() => onRestaurar(foto.id, foto)} disabled={processing !== null} style={{ flex: 1, background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', padding: '8px', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}>✅ Restaurar</button>
            <button onClick={() => onRechazarRecurso(foto.id, foto)} disabled={processing !== null} style={{ flex: 1, background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', padding: '8px', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}>❌ Denegar</button>
          </>)}
          <button onClick={() => onEditar(foto)} style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '8px', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}>✏️</button>
        </div>
      </div>
    </div>
  );
}
