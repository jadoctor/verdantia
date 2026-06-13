'use client';
import React, { useRef, useState } from 'react';
import { getMediaUrl } from '@/lib/media-url';

interface CultivoShareCardProps {
  cultivo: any;
  formData: any;
}

export default function CultivoShareCard({ cultivo, formData }: CultivoShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [generating, setGenerating] = useState(false);
  const [showCard, setShowCard] = useState(false);

  const DAY_MS = 86400000;
  const tSiembra = formData.cultivosfechainicio ? new Date(formData.cultivosfechainicio).getTime() : null;
  const durTotal = cultivo?.duracion_total || 0;
  const diasTranscurridos = tSiembra ? Math.floor((Date.now() - tSiembra) / DAY_MS) : 0;
  const pctAvance = durTotal > 0 ? Math.min(100, Math.round((diasTranscurridos / durTotal) * 100)) : null;

  const harvestMatch = (formData.cultivosobservaciones || '').match(/\[🏆 Cosecha: ([^\]]+)\]/);
  const ratingMatch = (formData.cultivosobservaciones || '').match(/\[⭐ (\d)\/5\]/);

  const estadoLabels: Record<string, string> = {
    'en_espera': '⏳ En espera',
    'germinacion': '🌱 Germinando',
    'crecimiento_inicial': '🌿 Crecimiento inicial',
    'crecimiento': '💪 Crecimiento firme',
    'fructificacion': '🌸 Floración',
    'recoleccion': '🧺 Recolección',
    'finalizado': '🏆 Finalizado',
    'perdido': '💀 Perdido'
  };

  const heroPhoto = (() => {
    const fotos = cultivo?.fotosLabores || [];
    const sorted = [...fotos].sort((a: any, b: any) => (b.esPrincipal || 0) - (a.esPrincipal || 0));
    if (sorted.length > 0) return getMediaUrl(sorted[0].ruta);
    if (cultivo?.foto) return getMediaUrl(cultivo.foto);
    return null;
  })();

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setGenerating(true);
    try {
      // Usar html2canvas dinámico
      // @ts-ignore - html2canvas is optional peer dependency
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: null,
        useCORS: true,
        logging: false
      });
      const link = document.createElement('a');
      link.download = `cultivo-${cultivo.cultivosnumerocoleccion || cultivo.idcultivos}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) {
      // Fallback: copiar al portapapeles como texto
      const text = `🌱 Mi Cultivo #${cultivo.cultivosnumerocoleccion || cultivo.idcultivos}\n${cultivo.especiesnombre} - ${cultivo.variedad_nombre}\n${estadoLabels[formData.cultivosestado] || formData.cultivosestado}\nDía ${diasTranscurridos}${durTotal > 0 ? ` de ~${durTotal}` : ''}\n\n— Verdantia 🌿`;
      try {
        await navigator.clipboard.writeText(text);
        alert('Tarjeta copiada como texto al portapapeles');
      } catch (_) {
        alert('No se pudo generar la imagen. Instala html2canvas para esta función.');
      }
    } finally {
      setGenerating(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowCard(!showCard)}
        style={{
          padding: '6px 14px', background: '#7c3aed', color: 'white',
          border: 'none', borderRadius: '8px', cursor: 'pointer',
          fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px',
          fontSize: '0.85rem'
        }}
      >
        🎴 {showCard ? 'Ocultar' : 'Compartir'}
      </button>

      {showCard && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowCard(false); }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', maxWidth: '380px', width: '100%' }}>
            {/* La tarjeta */}
            <div ref={cardRef} style={{
              width: '360px',
              background: 'linear-gradient(160deg, #0f172a 0%, #1e3a5f 40%, #0f766e 100%)',
              borderRadius: '24px',
              padding: '28px',
              color: 'white',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Decoración de fondo */}
              <div style={{ position: 'absolute', top: '-30px', right: '-30px', fontSize: '8rem', opacity: 0.06 }}>🌱</div>
              <div style={{ position: 'absolute', bottom: '-20px', left: '-20px', fontSize: '6rem', opacity: 0.06 }}>🌿</div>

              {/* Foto */}
              {heroPhoto && (
                <div style={{ width: '100%', height: '200px', borderRadius: '16px', overflow: 'hidden', marginBottom: '20px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
                  <img src={heroPhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} crossOrigin="anonymous" />
                </div>
              )}

              {/* Info */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: '4px' }}>CULTIVO Nº {cultivo.cultivosnumerocoleccion || cultivo.idcultivos}</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{cultivo.especiesnombre}</div>
                {cultivo.variedad_nombre !== cultivo.especiesnombre && (
                  <div style={{ fontSize: '1rem', opacity: 0.8 }}>{cultivo.variedad_nombre}</div>
                )}
              </div>

              {/* Estado */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <span style={{ background: 'rgba(255,255,255,0.15)', padding: '6px 14px', borderRadius: '20px', fontSize: '0.9rem', fontWeight: 600 }}>
                  {estadoLabels[formData.cultivosestado] || formData.cultivosestado}
                </span>
                {tSiembra && (
                  <span style={{ fontSize: '0.85rem', opacity: 0.7 }}>
                    Día {diasTranscurridos}{durTotal > 0 ? ` / ${durTotal}` : ''}
                  </span>
                )}
              </div>

              {/* Barra de progreso */}
              {pctAvance !== null && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '6px', opacity: 0.7 }}>
                    <span>Progreso del ciclo</span>
                    <span style={{ fontWeight: 700 }}>{pctAvance}%</span>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '6px', height: '8px', overflow: 'hidden' }}>
                    <div style={{ width: `${pctAvance}%`, height: '100%', background: 'linear-gradient(to right, #34d399, #10b981)', borderRadius: '6px' }} />
                  </div>
                </div>
              )}

              {/* Cosecha */}
              {harvestMatch && (
                <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '12px', padding: '10px 14px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '1.5rem' }}>🏆</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1rem' }}>{harvestMatch[1]}</div>
                    {ratingMatch && <div style={{ fontSize: '0.9rem' }}>{'⭐'.repeat(parseInt(ratingMatch[1]))}</div>}
                  </div>
                </div>
              )}

              {/* Footer */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>🌿 Verdantia</span>
                <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>{new Date().toLocaleDateString('es-ES')}</span>
              </div>
            </div>

            {/* Botones */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleDownload}
                disabled={generating}
                style={{
                  padding: '10px 24px', background: generating ? '#64748b' : 'white', color: '#0f172a',
                  border: 'none', borderRadius: '12px', cursor: generating ? 'wait' : 'pointer',
                  fontWeight: 700, fontSize: '0.95rem'
                }}
              >
                {generating ? '⏳ Generando...' : '📥 Descargar PNG'}
              </button>
              <button
                onClick={() => setShowCard(false)}
                style={{
                  padding: '10px 24px', background: 'rgba(255,255,255,0.15)', color: 'white',
                  border: '1px solid rgba(255,255,255,0.3)', borderRadius: '12px', cursor: 'pointer',
                  fontWeight: 600, fontSize: '0.95rem'
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
