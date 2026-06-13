'use client';
import React, { useMemo } from 'react';

interface CultivoAgenda7DiasProps {
  cultivo: any;
  formData: any;
}

interface AgendaItem {
  fecha: Date;
  tipo: 'tarea' | 'fase' | 'alerta';
  icon: string;
  titulo: string;
  color: string;
}

export default function CultivoAgenda7Dias({ cultivo, formData }: CultivoAgenda7DiasProps) {
  const dias = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      return d;
    });
  }, []);

  const agendaItems: AgendaItem[] = useMemo(() => {
    const items: AgendaItem[] = [];
    const DAY_MS = 86400000;
    const now = Date.now();

    // Tareas que vencen en los próximos 7 días
    const alertas = (cultivo?.avisos?.alertasPendientes || []).filter((a: any) => a.tipo !== 'estancamiento');
    for (const alerta of alertas) {
      const emision = new Date(alerta.fechaEmision);
      emision.setHours(0, 0, 0, 0);
      const diff = Math.floor((emision.getTime() - Date.now()) / DAY_MS);
      if (diff >= -1 && diff <= 6) {
        const nombre = alerta.pauta?.laboresnombre || 'Tarea';
        const getNombreIcon = (n: string) => {
          if (n.includes('Riego')) return '💧';
          if (n.includes('Abono') || n.includes('Fertiliz')) return '🌿';
          if (n.includes('Poda')) return '✂️';
          if (n.includes('Trasplante')) return '🪴';
          return '🌾';
        };
        items.push({ fecha: emision, tipo: 'tarea', icon: getNombreIcon(nombre), titulo: nombre, color: '#10b981' });
      }
    }

    // Transiciones de fase estimadas
    const tSiembra = formData.cultivosfechainicio ? new Date(formData.cultivosfechainicio).getTime() : null;
    if (tSiembra) {
      const addPhaseEstimate = (days: number, icon: string, label: string, color: string) => {
        if (!days) return;
        const estDate = new Date(tSiembra + days * DAY_MS);
        estDate.setHours(0, 0, 0, 0);
        const diff = Math.floor((estDate.getTime() - now) / DAY_MS);
        if (diff >= 0 && diff <= 6) {
          items.push({ fecha: estDate, tipo: 'fase', icon, titulo: `Estimado: ${label}`, color });
        }
      };
      if (!formData.cultivosfechagerminacion) addPhaseEstimate(cultivo?.dias_germinacion, '🌱', 'Germinación', '#3b82f6');
      if (!formData.cultivosfechacrecimiento) addPhaseEstimate(cultivo?.dias_crecimiento, '🌿', 'Crecimiento firme', '#22c55e');
      if (!formData.cultivosfechafructificacion) addPhaseEstimate(cultivo?.dias_fructificacion, '🌸', 'Floración', '#ec4899');
      if (!formData.cultivosfecharecoleccion) addPhaseEstimate(cultivo?.dias_recoleccion, '🧺', 'Recolección', '#f97316');
    }

    return items;
  }, [cultivo, formData]);

  const getItemsForDay = (day: Date) =>
    agendaItems.filter(item => item.fecha.toDateString() === day.toDateString());

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const hasAnyEvent = agendaItems.length > 0;

  return (
    <div style={{
      background: 'white', borderRadius: '16px',
      border: '1px solid #e2e8f0', padding: '20px',
      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', marginBottom: '24px'
    }}>
      <h3 style={{ margin: '0 0 16px', fontSize: '1rem', color: '#1e293b', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
        📅 Próximos 7 Días
      </h3>

      {!hasAnyEvent ? (
        <div style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🌤️</div>
          <p style={{ margin: 0, fontSize: '0.9rem' }}>Sin eventos previstos esta semana. ¡Todo tranquilo!</p>
        </div>
      ) : (
        <div className="cultivo-agenda-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
          {dias.map((dia, idx) => {
            const eventos = getItemsForDay(dia);
            const isToday = dia.toDateString() === today.toDateString();
            const dayName = dia.toLocaleDateString('es-ES', { weekday: 'short' });
            const dayNum = dia.getDate();

            return (
              <div key={idx} style={{
                borderRadius: '12px',
                padding: '10px 6px',
                background: isToday ? '#f0fdf4' : '#f8fafc',
                border: isToday ? '2px solid #10b981' : '1px solid #e2e8f0',
                minHeight: '90px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px'
              }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: isToday ? '#10b981' : '#94a3b8', textTransform: 'capitalize' }}>
                  {dayName}
                </div>
                <div style={{
                  width: '28px', height: '28px', borderRadius: '50%',
                  background: isToday ? '#10b981' : 'transparent',
                  color: isToday ? 'white' : '#1e293b',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: '0.85rem'
                }}>
                  {dayNum}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', width: '100%', marginTop: '4px' }}>
                  {eventos.length === 0 ? (
                    <div style={{ height: '4px', background: '#f1f5f9', borderRadius: '4px', margin: '4px 0' }} />
                  ) : eventos.map((e, ei) => (
                    <div key={ei} title={e.titulo} style={{
                      background: `${e.color}20`,
                      border: `1px solid ${e.color}40`,
                      borderRadius: '6px', padding: '3px 4px',
                      fontSize: '0.65rem', fontWeight: 600,
                      color: e.color, textAlign: 'center',
                      lineHeight: 1.2,
                      display: 'flex', alignItems: 'center', gap: '3px'
                    }}>
                      <span>{e.icon}</span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '52px' }}>
                        {e.titulo.replace('Estimado: ', '')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
