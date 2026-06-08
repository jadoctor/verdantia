import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getUserByEmail } from '@/lib/auth';

// GET /api/user/semillas — Listar inventario de semillas del usuario
export async function GET(request: Request) {
  const email = request.headers.get('x-user-email');
  if (!email) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const user = await getUserByEmail(email);
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  try {
    const [semillas] = await pool.query(`
      SELECT 
        s.idsemillas,
        s.xsemillasidvariedades,
        COALESCE(vu.xvariedadesidvariedadorigen, vu.idvariedades) AS global_variedad_id,
        s.semillasnumerocoleccion,
        s.semillasorigen,
        s.semillaslugarcompra,
        s.semillasmarca,
        s.semillasfecharecoleccion,
        s.semillasfechaenvasado,
        s.semillasfechaadquisicion,
        s.semillasprecio,
        s.semillasfechacaducidad,
        s.semillaslote,
        s.semillasstockinicial,
        s.semillasstockactual,
        s.semillasobservaciones,
        s.semillasfechacreacion,
        s.semillasactivosino,
        s.semillascompartir,
        s.semillasdonante,
        s.xsemillasidusuariodonante,
        u.usuariosnombreusuario AS donante_nombreusuario,
        u.usuariosemail AS donante_email,
        (SELECT COUNT(*) FROM cultivos c WHERE c.xcultivosidsemillas = s.idsemillas AND c.cultivosactivosino = 1) AS cultivos_activos_count,
        (SELECT GROUP_CONCAT(CONCAT('Nº ', COALESCE(c.cultivosnumerocoleccion, c.idcultivos), ' (Iniciado el ', DATE_FORMAT(c.cultivosfechainicio, '%d/%m/%Y'), ' - Estado actual: ', 
          CASE COALESCE(c.cultivosestado, '')
            WHEN 'en_espera' THEN 'PENDIENTE DE PLANTACIÓN'
            WHEN 'germinacion' THEN 'GERMINACIÓN'
            WHEN 'crecimiento' THEN 'CRECIMIENTO'
            WHEN 'floracion' THEN 'FLORACIÓN'
            WHEN 'produccion' THEN 'PRODUCCIÓN'
            WHEN 'finalizado' THEN 'FINALIZADO'
            WHEN 'perdido' THEN 'PERDIDO'
            WHEN '' THEN 'PENDIENTE DE PLANTACIÓN'
            ELSE UPPER(REPLACE(c.cultivosestado, '_', ' '))
          END
        , ')') SEPARATOR '|') FROM cultivos c WHERE c.xcultivosidsemillas = s.idsemillas AND c.cultivosactivosino = 1) AS cultivos_activos_lista,
        COALESCE(NULLIF(vu.variedadesnombre, ''), vg.variedadesnombre) AS variedad_nombre,
        e.especiesnombre,
        e.especiesicono,
        -- Foto del sobre/semilla, luego variedad, luego especie
        COALESCE(
          (SELECT datosadjuntosruta FROM datosadjuntos 
           WHERE xdatosadjuntosidsemillas = s.idsemillas AND datosadjuntostipo = 'imagen' AND datosadjuntosactivo = 1 ORDER BY datosadjuntosesprincipal DESC, iddatosadjuntos ASC LIMIT 1),
          (SELECT datosadjuntosruta FROM datosadjuntos 
           WHERE xdatosadjuntosidvariedades = vu.idvariedades AND datosadjuntostipo = 'imagen' AND datosadjuntosactivo = 1 ORDER BY datosadjuntosesprincipal DESC LIMIT 1),
          (SELECT datosadjuntosruta FROM datosadjuntos 
           WHERE xdatosadjuntosidvariedades = vg.idvariedades AND datosadjuntostipo = 'imagen' AND datosadjuntosactivo = 1 ORDER BY datosadjuntosesprincipal DESC LIMIT 1),
          (SELECT datosadjuntosruta FROM datosadjuntos 
           WHERE xdatosadjuntosidespecies = e.idespecies AND datosadjuntostipo = 'imagen' AND datosadjuntosactivo = 1 ORDER BY datosadjuntosesprincipal DESC LIMIT 1)
        ) AS foto
      FROM semillas s
      JOIN variedades vu ON s.xsemillasidvariedades = vu.idvariedades
      LEFT JOIN variedades vg ON vu.xvariedadesidvariedadorigen = vg.idvariedades
      JOIN especies e ON vg.xvariedadesidespecies = e.idespecies OR vu.xvariedadesidespecies = e.idespecies
      LEFT JOIN usuarios u ON s.xsemillasidusuariodonante = u.idusuarios
      WHERE s.xsemillasidusuarios = ?
      ORDER BY s.semillasfechacreacion DESC
    `, [user.id]);

    return NextResponse.json({ semillas });
  } catch (error: any) {
    console.error('Error fetching semillas:', error);
    return NextResponse.json({ error: 'Error al obtener inventario de semillas' }, { status: 500 });
  }
}

// POST /api/user/semillas — Añadir un nuevo sobre de semillas
export async function POST(request: Request) {
  const email = request.headers.get('x-user-email');
  if (!email) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const user = await getUserByEmail(email);
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  try {
    const body = await request.json();
    const { 
      xsemillasidvariedades, 
      semillasorigen, 
      semillasfecharecoleccion, 
      semillasfechaenvasado,
      semillasfechacaducidad, 
      semillaslote, 
      semillasstockinicial,
      semillasstockactual, 
      semillasobservaciones,
      semillasnumerocoleccion,
      semillaslugarcompra,
      semillasmarca,
      semillasdonante,
      semillascompartir
    } = body;

    if (!xsemillasidvariedades) {
      return NextResponse.json({ error: 'La variedad es obligatoria' }, { status: 400 });
    }

    let finalNumero = semillasnumerocoleccion;
    if (!finalNumero) {
      const currentYear = new Date().getFullYear();
      const [rowsNum]: any = await pool.query(`
        SELECT semillasnumerocoleccion 
        FROM semillas 
        WHERE xsemillasidusuarios = ? 
          AND YEAR(semillasfechacreacion) = ?
          AND semillasnumerocoleccion IS NOT NULL
      `, [user.id, currentYear]);

      const numbers = rowsNum
        .map((r: any) => parseInt(r.semillasnumerocoleccion))
        .filter((n: number) => !isNaN(n))
        .sort((a: number, b: number) => a - b);

      let nextNum = 1;
      for (const num of numbers) {
        if (num === nextNum) {
          nextNum++;
        } else if (num > nextNum) {
          break;
        }
      }
      finalNumero = nextNum;
    }

    let finalDonante = semillasdonante || null;
    let finalUsuarioDonanteId = null;

    if (semillasdonante && semillasdonante.trim() !== '') {
      const searchTerm = semillasdonante.trim();
      const searchUsername = searchTerm.replace(/^@/, '');
      
      const [userRows]: any = await pool.query(
        'SELECT idusuarios FROM usuarios WHERE usuariosemail = ? OR usuariosnombreusuario = ? LIMIT 1',
        [searchTerm, searchUsername]
      );
      
      if (userRows.length > 0) {
        finalUsuarioDonanteId = userRows[0].idusuarios;
        finalDonante = null; 
      }
    }

    const [result]: any = await pool.query(
      `INSERT INTO semillas (
        xsemillasidusuarios, 
        xsemillasidvariedades, 
        semillasnumerocoleccion,
        semillasorigen, 
        semillaslugarcompra,
        semillasmarca,
        semillasfecharecoleccion, 
        semillasfechaenvasado,
        semillasfechaadquisicion,
        semillasprecio,
        semillasfechacaducidad, 
        semillaslote, 
        semillasstockinicial,
        semillasstockactual, 
        semillasobservaciones,
        semillasdonante,
        xsemillasidusuariodonante,
        semillascompartir
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user.id, 
        xsemillasidvariedades, 
        finalNumero,
        semillasorigen || 'sobre_comprado',
        semillaslugarcompra || null,
        semillasmarca || null,
        semillasfecharecoleccion || null,
        semillasfechaenvasado || null,
        body.semillasfechaadquisicion || null,
        body.semillasprecio || null,
        semillasfechacaducidad || null,
        semillaslote || null,
        semillasstockinicial || null,
        semillasstockactual || null,
        semillasobservaciones || null,
        finalDonante,
        finalUsuarioDonanteId,
        semillascompartir ? 1 : 0
      ]
    );

    // AUTO-ASIGNAR VARIEDAD Y ESPECIE
    try {
      const [varRows]: any = await pool.query(`
        SELECT 
          v.idvariedades, 
          v.xvariedadesidespecies AS especie_id_var,
          vg.xvariedadesidespecies AS especie_id_gen
        FROM variedades v
        LEFT JOIN variedades vg ON v.xvariedadesidvariedadorigen = vg.idvariedades
        WHERE v.idvariedades = ?
      `, [xsemillasidvariedades]);

      if (varRows.length > 0) {
        const variedadInfo = varRows[0];
        const especieId = variedadInfo.especie_id_gen || variedadInfo.especie_id_var;

        // 1. Asignar Variedad si no la tiene en la tabla cruzada variedadesusuarios
        const [userVarRows]: any = await pool.query(`
          SELECT idvariedadesusuarios FROM variedadesusuarios 
          WHERE Xvariedadesusuariosidusuarios = ? AND xvariedadesusuariosidvariedades = ?
        `, [user.id, xsemillasidvariedades]);

        if (userVarRows.length === 0) {
          await pool.query(`
            INSERT INTO variedadesusuarios (Xvariedadesusuariosidusuarios, xvariedadesusuariosidvariedades)
            VALUES (?, ?)
          `, [user.id, xsemillasidvariedades]);
        }

        // 2. Adquirir la variedad en la tabla 'variedades' (como planta propia del usuario para que aparezca en "Mis Plantas") si no la tiene ya
        if (especieId) {
          const [userOwnedVarCheck]: any = await pool.query(`
            SELECT idvariedades, variedadesvisibilidadsino FROM variedades 
            WHERE xvariedadesidusuarios = ? AND xvariedadesidvariedadorigen = ?
          `, [user.id, xsemillasidvariedades]);

          if (userOwnedVarCheck.length === 0) {
            await pool.query(`
              INSERT INTO variedades (
                xvariedadesidespecies, 
                xvariedadesidusuarios, 
                xvariedadesidvariedadorigen, 
                variedadesesgenerica
              ) VALUES (?, ?, ?, 0)
            `, [especieId, user.id, xsemillasidvariedades]);
          } else if (userOwnedVarCheck[0].variedadesvisibilidadsino === 0) {
            await pool.query(`
              UPDATE variedades SET variedadesvisibilidadsino = 1 WHERE idvariedades = ?
            `, [userOwnedVarCheck[0].idvariedades]);
          }
        }

        // 3. Asignar Especie si no la tiene en especiesusuarios
        if (especieId) {
          const [userEspRows]: any = await pool.query(`
            SELECT idespeciesusuarios FROM especiesusuarios 
            WHERE xespeciesusuariosidusuarios = ? AND xespeciesusuariosidespecies = ?
          `, [user.id, especieId]);

          if (userEspRows.length === 0) {
            const [espInfo]: any = await pool.query(`SELECT especiesnombre FROM especies WHERE idespecies = ?`, [especieId]);
            const nombreEspecie = espInfo.length > 0 ? espInfo[0].especiesnombre : '';

            await pool.query(`
              INSERT INTO especiesusuarios (
                xespeciesusuariosidusuarios, 
                xespeciesusuariosidespecies, 
                especiesusuariosnombre,
                especiesusuariosactivosino
              ) VALUES (?, ?, ?, 1)
            `, [user.id, especieId, nombreEspecie]);
          }
        }
      }
    } catch (autoAssignErr) {
      console.error('Error auto-asignando variedad/especie:', autoAssignErr);
      // No bloqueamos la creación de la semilla si falla la auto-asignación
    }

    return NextResponse.json({ 
      success: true, 
      id: result.insertId,
      message: 'Semillas añadidas al inventario'
    });
  } catch (error: any) {
    console.error('Error añadiendo semillas:', error);
    return NextResponse.json({ error: 'Error al guardar las semillas' }, { status: 500 });
  }
}
