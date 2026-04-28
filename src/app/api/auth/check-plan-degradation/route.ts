import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

/**
 * POST /api/auth/check-plan-degradation
 * Verificación lazy del plan de suscripción.
 * Se llama al cargar el perfil. Si la suscripción activa ha caducado,
 * avanza al siguiente nivel del trial progresivo:
 *   Premium (30d) → Avanzado (30d) → Esencial (30d) → Gratuito (permanente)
 *
 * Retorna el plan actual actualizado.
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();
    if (!userId) return NextResponse.json({ error: 'userId requerido' }, { status: 400 });

    const now = new Date();

    // Obtener la suscripción activa del usuario
    const [subRows] = await pool.query(
      `SELECT 
        us.idusuariossuscripciones,
        us.usuariossuscripcionesestado,
        us.usuariossuscripcionesfechafin,
        s.suscripcionesnombre AS planActual
       FROM usuariossuscripciones us
       JOIN suscripciones s ON us.xusuariossuscripcionesidsuscripciones = s.idsuscripciones
       WHERE us.xusuariossuscripcionesidusuarios = ?
       AND us.usuariossuscripcionesestado IN ('activa','degradacion_fase1','degradacion_fase2','degradacion_fase3')
       ORDER BY us.idusuariossuscripciones DESC
       LIMIT 1`,
      [userId]
    );

    const sub = (subRows as any[])[0];
    if (!sub) {
      return NextResponse.json({ planActual: 'Gratuito', degraded: false });
    }

    // Si no ha caducado, no hacer nada
    const fechaFin = new Date(sub.usuariossuscripcionesfechafin);
    if (fechaFin > now) {
      return NextResponse.json({ planActual: sub.planActual, degraded: false });
    }

    // Ha caducado — determinar siguiente nivel
    const degradationMap: Record<string, { nextPlan: string; nextState: string; daysMore: number | null }> = {
      'Premium':  { nextPlan: 'Avanzado', nextState: 'degradacion_fase1', daysMore: 30 },
      'Avanzado': { nextPlan: 'Esencial', nextState: 'degradacion_fase2', daysMore: 30 },
      'Esencial': { nextPlan: 'Gratuito', nextState: 'degradacion_fase3', daysMore: null },
    };

    const step = degradationMap[sub.planActual];

    if (!step) {
      // Ya en Gratuito o estado desconocido — nada que hacer
      return NextResponse.json({ planActual: sub.planActual, degraded: false });
    }

    if (step.daysMore === null) {
      // Degradar a Gratuito de forma permanente — cerrar la suscripción
      await pool.query(
        `UPDATE usuariossuscripciones SET usuariossuscripcionesestado = 'degradacion_fase3'
         WHERE idusuariossuscripciones = ?`,
        [sub.idusuariossuscripciones]
      );
      return NextResponse.json({ planActual: 'Gratuito', degraded: true, newPlan: 'Gratuito' });
    }

    // Buscar el ID del plan siguiente
    const [nextPlanRows] = await pool.query(
      `SELECT idsuscripciones FROM suscripciones WHERE suscripcionesnombre = ? LIMIT 1`,
      [step.nextPlan]
    );
    const nextPlanId = (nextPlanRows as any[])[0]?.idsuscripciones;

    if (!nextPlanId) {
      return NextResponse.json({ planActual: sub.planActual, degraded: false, error: 'Plan siguiente no encontrado' });
    }

    // Actualizar la suscripción actual con el nuevo plan y nueva fecha de fin
    const newFechaFin = new Date();
    newFechaFin.setDate(newFechaFin.getDate() + step.daysMore);

    await pool.query(
      `UPDATE usuariossuscripciones SET 
        xusuariossuscripcionesidsuscripciones = ?,
        usuariossuscripcionesfechafin = ?,
        usuariossuscripcionesestado = ?
       WHERE idusuariossuscripciones = ?`,
      [nextPlanId, newFechaFin, step.nextState, sub.idusuariossuscripciones]
    );

    return NextResponse.json({
      planActual: step.nextPlan,
      degraded: true,
      newPlan: step.nextPlan,
      newExpiry: newFechaFin.toISOString(),
    });

  } catch (error: any) {
    console.error('[check-plan-degradation] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
