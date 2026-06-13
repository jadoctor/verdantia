'use client';
import React, { useMemo } from 'react';

interface CultivoDiarioVisualProps {
  observaciones: string;
}

interface EntradaDiario {
  fecha: string;
  icon: string;
  tipo: string;
  raw: string;
  color: string;
  bg: string;
}

const ENTRY_COLORS: Record<string, { color: string; bg: string }> = {
  '💧': { color: '#0369a1', bg: '#e0f2fe' },
  '🌿': { color: '#15803d', bg: '#dcfce7' },
  '✂️': { color: '#374151', bg: '#f3f4f6' },
  '🐛': { color: '#dc2626', bg: '#fee2e2' },
  '🌧️': { color: '#4f46e5', bg: '#ede9fe' },
  '☀️': { color: '#b45309', bg: '#fef3c7' },
  '🏆': { color: '#b45309', bg: '#fef9c3' },
  '⭐': { color: '#a16207', bg: '#fefce8' },
  '🔁': { color: '#0891b2', bg: '#cffafe' },
};

const DEFAULT_COLORS = { color: '#475569', bg: '#f8fafc' };

export default function CultivoDiarioVisual({ observaciones }: CultivoDiarioVisualProps) {
  const entradas: EntradaDiario[] = useMemo(() => {
    if (!observaciones) return [];

    const lines = observaciones.split('\n').map(l => l.trim()).filter(Boolean);
    const result: EntradaDiario[] = [];

    for (const line of lines) {
      // Detectar entradas con timestamp: [DD mes] 💧 texto
      // También soporta formato [12 jun] y [🏆 Cosecha:...] y [⭐ X/5]
      const fechaMatch = line.match(/^\[(\d{1,2}\s+\w+)\]\s+(.+)$/);
      if (fechaMatch) {
        const fechaStr = fechaMatch[1];
        const contenido = fechaMatch[2];

        // Detectar emoji al inicio del contenido
        const emojiMatch = contenido.match(/^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)\s*(.+)$/u);
        const icon = emojiMatch ? emojiMatch[1] : '📝';
        const texto = emojiMatch ? emojiMatch[2] : contenido;
        const colorPair = ENTRY_COLORS[icon] || DEFAULT_COLORS;

        result.push({
          fecha: fechaStr,
          icon,
          tipo: texto,
          raw: line,
          color: colorPair.color,
          bg: colorPair.bg
        });
        continue;
      }

      // Detectar Insignia de Cosecha: [🏆 Cosecha: ...] [⭐ X/5]
      if (line.includes('[🏆 Cosecha:')) {
        const cosechaMatch = line.match(/\[🏆 Cosecha: ([^\]]+)\]/);
        const ratingMatch = line.match(/\[⭐ (\d)\/5\]/);
        result.push({
          fecha: '—',
          icon: '🏆',
          tipo: `Cosecha registrada: ${cosechaMatch?.[1] || ''}${ratingMatch ? ` · ${'⭐'.repeat(parseInt(ratingMatch[1]))}` : ''}`,
          raw: line,
          color: '#b45309',
          bg: '#fef9c3'
        });
        continue;
      }

      // Detectar notas de fase completada: [DD/MM/AAAA] Fase de X completada
      const faseMatch = line.match(/^\[(\d{1,2}\/\d{1,2}\/\d{4})\]\s+Fase de (.+)/);
      if (faseMatch) {
        result.push({
          fecha: faseMatch[1],
          icon: '✅',
          tipo: `Fase de ${faseMatch[2]}`,
          raw: line,
          color: '#15803d',
          bg: '#dcfce7'
        });
        continue;
      }
    }

    return result;
  }, [observaciones]);

  if (entradas.length === 0) return null;

  return (
    <div style={{ marginTop: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          🗒️ Diario de Actividad
        </span>
        <span style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{entradas.length} entradas</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {entradas.map((entrada, idx) => (
          <div key={idx} style={{
            background: entrada.bg,
            border: `1px solid ${entrada.color}30`,
            borderRadius: '10px',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            animation: 'fadeIn 0.3s ease'
          }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%',
              background: `${entrada.color}20`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.2rem', flexShrink: 0
            }}>
              {entrada.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontWeight: 600, color: entrada.color,
                fontSize: '0.875rem',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
              }}>
                {entrada.tipo}
              </div>
            </div>
            <div style={{
              fontSize: '0.75rem', color: '#94a3b8',
              flexShrink: 0, fontFamily: 'monospace'
            }}>
              {entrada.fecha}
            </div>
          </div>
        ))}
      </div>

      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
}
