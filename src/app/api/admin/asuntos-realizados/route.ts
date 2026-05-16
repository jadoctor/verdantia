import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [rows]: any = await pool.query(`
      SELECT * FROM (
        SELECT 
          da.iddatosadjuntos AS id,
          da.datosadjuntosruta AS ruta,
          da.datosadjuntosnombreoriginal AS nombreOriginal,
          da.datosadjuntosfechacreacion AS fechaSubida,
          da.datosadjuntosfechavalidacion AS fechaValidacion,
          da.datosadjuntosresultadovalidacion AS resultado,
          inc.incidenciasmotivo AS motivo,
          da.datosadjuntosactivo AS activo,
          da.datosadjuntosfechaeliminacion AS fechaEliminacion,
          v.idvariedades AS variedadId,
          v.variedadesnombre AS variedadNombre,
          e.especiesnombre AS especieNombre,
          u.usuariosnombre AS usuarioPropietario,
          u.usuariosemail AS emailPropietario,
          u.idusuarios AS idPropietario,
          admin.usuariosnombre AS adminNombre,
          admin.usuariosemail AS adminEmail,
          'planta' AS fotoTipo
        FROM datosadjuntos da
        LEFT JOIN variedades v ON da.xdatosadjuntosidvariedades = v.idvariedades
        LEFT JOIN variedades vg ON v.xvariedadesidvariedadorigen = vg.idvariedades
        LEFT JOIN especies e ON (vg.xvariedadesidespecies = e.idespecies OR v.xvariedadesidespecies = e.idespecies)
        LEFT JOIN usuarios u ON v.xvariedadesidusuarios = u.idusuarios
        LEFT JOIN usuarios admin ON da.xdatosadjuntosidusuariovalidador = admin.idusuarios
        LEFT JOIN incidencias inc ON inc.incidenciasreferenciaid = da.iddatosadjuntos AND inc.incidenciastipo IN ('foto_rechazada', 'foto_sancionada')
        WHERE da.datosadjuntosresultadovalidacion IS NOT NULL
          AND da.datosadjuntostipo IN ('imagen', 'sancionada')
          AND da.xdatosadjuntosidvariedades IS NOT NULL

        UNION ALL

        SELECT
          da.iddatosadjuntos AS id,
          da.datosadjuntosruta AS ruta,
          da.datosadjuntosnombreoriginal AS nombreOriginal,
          da.datosadjuntosfechacreacion AS fechaSubida,
          da.datosadjuntosfechavalidacion AS fechaValidacion,
          da.datosadjuntosresultadovalidacion AS resultado,
          inc.incidenciasmotivo AS motivo,
          da.datosadjuntosactivo AS activo,
          da.datosadjuntosfechaeliminacion AS fechaEliminacion,
          NULL AS variedadId,
          NULL AS variedadNombre,
          'Foto de Perfil' AS especieNombre,
          u.usuariosnombre AS usuarioPropietario,
          u.usuariosemail AS emailPropietario,
          u.idusuarios AS idPropietario,
          admin.usuariosnombre AS adminNombre,
          admin.usuariosemail AS adminEmail,
          'perfil' AS fotoTipo
        FROM datosadjuntos da
        JOIN usuarios u ON da.xdatosadjuntosidusuarios = u.idusuarios
        LEFT JOIN usuarios admin ON da.xdatosadjuntosidusuariovalidador = admin.idusuarios
        LEFT JOIN incidencias inc ON inc.incidenciasreferenciaid = da.iddatosadjuntos AND inc.incidenciastipo IN ('foto_rechazada', 'foto_sancionada')
        WHERE da.datosadjuntosresultadovalidacion IS NOT NULL
          AND da.datosadjuntostipo IN ('imagen', 'sancionada')
          AND da.xdatosadjuntosidusuarios IS NOT NULL
          AND da.xdatosadjuntosidvariedades IS NULL
      ) AS realizados
      ORDER BY fechaValidacion DESC
      LIMIT 100
    `);

    return NextResponse.json({ realizados: rows });
  } catch (error: any) {
    console.error('[asuntos-realizados GET]', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
