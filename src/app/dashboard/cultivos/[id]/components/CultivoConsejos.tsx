'use client';
import React, { useMemo } from 'react';

interface CultivoConsejosProps {
  cultivo: any;
  formData: any;
}

interface Consejo {
  icon: string;
  titulo: string;
  texto: string;
  color: string;
  urgente?: boolean;
}

export default function CultivoConsejos({ cultivo, formData }: CultivoConsejosProps) {
  const consejos: Consejo[] = useMemo(() => {
    const result: Consejo[] = [];
    const DAY_MS = 86400000;
    const now = Date.now();

    const estado = formData.cultivosestado || '';
    const esFinalizado = ['finalizado', 'recoleccion', 'perdido'].includes(estado);
    if (esFinalizado) return [];

    const tSiembra = formData.cultivosfechainicio ? new Date(formData.cultivosfechainicio).getTime() : null;
    const tGerm = formData.cultivosfechagerminacion ? new Date(formData.cultivosfechagerminacion).getTime() : null;
    const tCrec = formData.cultivosfechacrecimiento ? new Date(formData.cultivosfechacrecimiento).getTime() : null;
    const tFruc = formData.cultivosfechafructificacion ? new Date(formData.cultivosfechafructificacion).getTime() : null;

    const diasDesdeUltimaFase = (() => {
      const ultima = tFruc || tCrec || tGerm || tSiembra;
      return ultima ? Math.floor((now - ultima) / DAY_MS) : null;
    })();

    const estancamientos = (cultivo?.avisos?.alertasPendientes || []).filter((a: any) => a.tipo === 'estancamiento');
    const tareasVencidas = (cultivo?.avisos?.alertasPendientes || []).filter((a: any) => {
      if (a.tipo === 'estancamiento') return false;
      const diff = Math.floor((now - new Date(a.fechaEmision).getTime()) / DAY_MS);
      return diff >= 7;
    });

    const mes = new Date().getMonth(); // 0-11
    const esVerano = mes >= 5 && mes <= 8;
    const esInvierno = mes === 11 || mes <= 1;
    const esPrimavera = mes >= 2 && mes <= 4;

    const especie = (cultivo?.especiesnombre || '').toLowerCase();
    const duracionTotal = cultivo?.duracion_total || 0;

    // ── REGLAS DE CONSEJOS ────────────────────────────────────────

    // 1. Alerta de estancamiento activa
    if (estancamientos.length > 0) {
      result.push({
        icon: '🚨',
        titulo: 'Fase estancada — revisión urgente',
        texto: `Tu ${cultivo?.especiesnombre || 'cultivo'} lleva ${diasDesdeUltimaFase} días en la fase actual sin avanzar. Comprueba el riego, las plagas y la temperatura. Si todo está bien, actualiza la fase manualmente.`,
        color: '#dc2626',
        urgente: true
      });
    }

    // 2. Tareas muy vencidas
    if (tareasVencidas.length > 0) {
      result.push({
        icon: '📋',
        titulo: `${tareasVencidas.length} tarea${tareasVencidas.length > 1 ? 's' : ''} vencida${tareasVencidas.length > 1 ? 's' : ''}`,
        texto: `Tienes labores pendientes con más de 7 días de retraso. Ir a la pestaña "Tareas" para completarlas o ignorarlas. Las tareas no atendidas pueden afectar al desarrollo del cultivo.`,
        color: '#d97706',
        urgente: true
      });
    }

    // 3. Consejo estacional
    if (esVerano && !['perdido'].includes(estado)) {
      if (especie.includes('tomate') || especie.includes('pimiento') || especie.includes('berenjena')) {
        result.push({
          icon: '🔥',
          titulo: 'Alerta de calor veraniego',
          texto: 'Con temperaturas altas, riega al amanecer o al atardecer para reducir la evaporación. Los frutos sensibles al calor pueden necesitar sombra parcial entre las 12h y las 16h.',
          color: '#ea580c'
        });
      } else {
        result.push({
          icon: '☀️',
          titulo: 'Manejo de calor en verano',
          texto: 'Aumenta la frecuencia de riego y considera el uso de acolchado para conservar la humedad del suelo. Evita aplicar fertilizantes foliares en las horas de máximo sol.',
          color: '#ea580c'
        });
      }
    }

    if (esInvierno && estado !== 'en_espera') {
      result.push({
        icon: '❄️',
        titulo: 'Riesgo de heladas nocturnas',
        texto: 'Protege las plantas sensibles con tela antiheladas o llévalas al interior si están en maceta. Reduce el riego ya que el suelo retiene más la humedad con frío.',
        color: '#3b82f6'
      });
    }

    if (esPrimavera && estado === 'en_espera') {
      result.push({
        icon: '🌱',
        titulo: '¡Momento ideal para comenzar!',
        texto: 'La primavera es el mejor momento para iniciar la siembra de la mayoría de hortalizas. Las temperaturas suaves y las lluvias regulares favorecen la germinación.',
        color: '#16a34a'
      });
    }

    // 4. Consejo de fase específica
    if (estado === 'germinacion') {
      result.push({
        icon: '💧',
        titulo: 'Fase de germinación — riegos suaves',
        texto: 'Mantén el sustrato húmedo pero no encharcado. Los riegos finos y frecuentes (con pulverizador) son ideales para no arrastrar las semillas. Temperatura ideal: 18–24°C.',
        color: '#0ea5e9'
      });
    } else if (estado === 'fructificacion') {
      result.push({
        icon: '🌸',
        titulo: 'Floración — potencia la polinización',
        texto: 'Sacude suavemente las flores o usa un pincel para transferir el polen entre flores. Evita riegos excesivos que puedan pudrir la base de las flores. Aplica potasio para flores más robustas.',
        color: '#ec4899'
      });
    } else if (estado === 'recoleccion') {
      result.push({
        icon: '🧺',
        titulo: 'En recolección — cosecha escalonada',
        texto: 'Recolecta regularmente para estimular la producción de nuevos frutos. No dejes los frutos madurar en exceso en la planta, ya que detienen la producción.',
        color: '#f97316'
      });
    } else if (estado === 'crecimiento' || estado === 'crecimiento_inicial') {
      result.push({
        icon: '🌿',
        titulo: 'Fase de crecimiento — abonado nitrogenado',
        texto: 'Es el momento de mayor demanda de nitrógeno. Aplica un abono equilibrado NPK (o rico en N) cada 15 días para potenciar el desarrollo vegetativo. Un buen crecimiento ahora = mayor cosecha después.',
        color: '#22c55e'
      });
    }

    // 5. Cercanía a cosecha
    if (tSiembra && duracionTotal > 0) {
      const diasTranscurridos = Math.floor((now - tSiembra) / DAY_MS);
      const pctAvance = (diasTranscurridos / duracionTotal) * 100;
      if (pctAvance >= 75 && pctAvance < 100 && !formData.cultivosfecharecoleccion) {
        result.push({
          icon: '⏳',
          titulo: `Cosecha estimada en ~${Math.max(0, duracionTotal - diasTranscurridos)} días`,
          texto: `Tu cultivo ha completado el ${Math.round(pctAvance)}% de su ciclo esperado. Empieza a preparar los recipientes de recolección y revisa que la planta no tenga carencias nutricionales en esta fase final.`,
          color: '#7c3aed'
        });
      }
    }

    // 6. Sin foto reciente
    const fotosLabores = cultivo?.fotosLabores || [];
    if (fotosLabores.length === 0 && tSiembra && Math.floor((now - tSiembra) / DAY_MS) > 7) {
      result.push({
        icon: '📸',
        titulo: 'Sin fotos del cultivo',
        texto: 'Documenta el estado actual con una fotografía. Ve a la pestaña "📷 Fotos" y sube una imagen. En el futuro podrás ver el timelapse de evolución completo.',
        color: '#64748b'
      });
    }

    return result.slice(0, 3); // máximo 3 consejos
  }, [cultivo, formData]);

  if (consejos.length === 0) return null;

  return (
    <div style={{ marginBottom: '24px' }}>
      <h3 style={{ margin: '0 0 14px', fontSize: '1rem', color: '#475569', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
        💡 Recomendaciones para este cultivo
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {consejos.map((c, i) => (
          <div key={i} style={{
            background: 'white',
            border: `1px solid ${c.color}40`,
            borderLeft: `4px solid ${c.color}`,
            borderRadius: '12px',
            padding: '14px 18px',
            display: 'flex',
            gap: '14px',
            alignItems: 'flex-start',
            boxShadow: c.urgente ? `0 2px 8px ${c.color}20` : 'none'
          }}>
            <div style={{ fontSize: '1.6rem', flexShrink: 0, lineHeight: 1 }}>{c.icon}</div>
            <div>
              <div style={{ fontWeight: 700, color: '#1e293b', marginBottom: '4px', fontSize: '0.95rem' }}>
                {c.titulo}
                {c.urgente && <span style={{ marginLeft: '8px', background: c.color, color: 'white', fontSize: '0.65rem', padding: '2px 6px', borderRadius: '8px', verticalAlign: 'middle' }}>URGENTE</span>}
              </div>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.875rem', lineHeight: 1.6 }}>{c.texto}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
