import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

/**
 * POST /api/admin/usuarios/[id]/fix-trial
 * Corrige la fecha de caducidad del plan de suscripción activo de un usuario
 * en la tabla usuariossuscripciones (no en columnas directas de usuarios).
 * Solo para uso administrativo.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { fechaCaducidad, suscripcion } = await req.json();

    if (!fechaCaducidad) {
      return NextResponse.json({ error: 'fechaCaducidad requerida' }, { status: 400 });
    }

    // Actualizar la fecha de fin del plan activo en usuariossuscripciones
    const [result]: any = await pool.query(
      `UPDATE usuariossuscripciones
       SET usuariossuscripcionesfechafin = ?
       WHERE xusuariossuscripcionesidusuarios = ?
       AND usuariossuscripcionesestado IN ('activa','degradacion_fase1','degradacion_fase2','degradacion_fase3')
       ORDER BY idusuariossuscripciones DESC
       LIMIT 1`,
      [fechaCaducidad, id]
    );

    // Si también se indica suscripcion, actualizar el plan en la tabla suscripciones
    if (suscripcion) {
      const [planRows] = await pool.query(
        `SELECT idsuscripciones FROM suscripciones WHERE suscripcionesnombre = ? LIMIT 1`,
        [suscripcion]
      );
      const planId = (planRows as any[])[0]?.idsuscripciones;
      if (planId) {
        await pool.query(
          `UPDATE usuariossuscripciones
           SET xusuariossuscripcionesidsuscripciones = ?
           WHERE xusuariossuscripcionesidusuarios = ?
           AND usuariossuscripcionesestado IN ('activa','degradacion_fase1','degradacion_fase2','degradacion_fase3')
           ORDER BY idusuariossuscripciones DESC
           LIMIT 1`,
          [planId, id]
        );
      }
    }

    return NextResponse.json({
      success: true,
      rowsAffected: result.affectedRows,
      nuevaFecha: fechaCaducidad,
    });
  } catch (error: any) {
    console.error('[fix-trial]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
