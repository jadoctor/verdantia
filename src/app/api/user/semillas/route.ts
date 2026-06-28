import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getUserByEmail } from '@/lib/auth';
import { checkAndUpgradeRank } from '@/lib/logros';

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
        s.xsemillasidvariedadesvegetales,
        COALESCE(vu.xvariedadesvegetalesidvariedadorigen, vu.idvariedadesvegetales) AS global_variedad_id,
        s.semillasnumerocoleccion,
        s.semillasorigen,
        s.semillasmarca,
        s.semillasfechaorigen,
        s.semillasprecio,
        s.semillaslugarcompra,
        s.semillasfechacaducidad,
        s.semillaslote,
        s.semillasstockinicial,
        s.semillasstockactual,
        s.semillasunidadmedida,
        s.semillasobservaciones,
        s.semillascoleccion,
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
        COALESCE(NULLIF(vu.variedadesvegetalesnombre, ''), vg.variedadesvegetalesnombre) AS variedad_nombre,
        e.especiesvegetalesnombre,
        e.especiesvegetalesicono,
        -- Foto del sobre/semilla, luego variedad, luego especie
        COALESCE(
          (SELECT datosadjuntosruta FROM datosadjuntos 
           WHERE xdatosadjuntosidsemillas = s.idsemillas AND datosadjuntostipo = 'imagen' AND datosadjuntosactivo = 1 ORDER BY datosadjuntosesprincipal DESC, iddatosadjuntos ASC LIMIT 1),
          (SELECT datosadjuntosruta FROM datosadjuntos 
           WHERE xdatosadjuntosidvariedadesvegetales = vu.idvariedadesvegetales AND datosadjuntostipo = 'imagen' AND datosadjuntosactivo = 1 ORDER BY datosadjuntosesprincipal DESC LIMIT 1),
          (SELECT datosadjuntosruta FROM datosadjuntos 
           WHERE xdatosadjuntosidvariedadesvegetales = vg.idvariedadesvegetales AND datosadjuntostipo = 'imagen' AND datosadjuntosactivo = 1 ORDER BY datosadjuntosesprincipal DESC LIMIT 1),
          (SELECT datosadjuntosruta FROM datosadjuntos 
           WHERE xdatosadjuntosidespeciesvegetales = e.idespeciesvegetales AND datosadjuntostipo = 'imagen' AND datosadjuntosactivo = 1 ORDER BY datosadjuntosesprincipal DESC LIMIT 1)
        ) AS foto
      FROM semillas s
      JOIN variedadesvegetales vu ON s.xsemillasidvariedadesvegetales = vu.idvariedadesvegetales
      LEFT JOIN variedadesvegetales vg ON vu.xvariedadesvegetalesidvariedadorigen = vg.idvariedadesvegetales
      JOIN especiesvegetales e ON vg.xvariedadesvegetalesidespeciesvegetales = e.idespeciesvegetales OR vu.xvariedadesvegetalesidespeciesvegetales = e.idespeciesvegetales
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
      xsemillasidvariedadesvegetales, 
      semillasorigen, 
      semillasfechaorigen, 
      semillasfechacaducidad, 
      semillaslote, 
      semillasstockinicial,
      semillasstockactual, 
      semillasunidadmedida,
      semillasobservaciones,
      semillascoleccion,
      semillasnumerocoleccion,
      semillasmarca,
      semillasdonante,
      semillascompartir,
      customVarietyName
    } = body;

    if (!xsemillasidvariedadesvegetales) {
      return NextResponse.json({ error: 'La variedad es obligatoria' }, { status: 400 });
    }

    let finalNumero = semillasnumerocoleccion;
    if (!finalNumero) {
      const u = semillascoleccion || '';
      let query = '';
      let queryParams = [];

      if (u.trim() === '') {
        query = `
          SELECT semillasnumerocoleccion 
          FROM semillas 
          WHERE xsemillasidusuarios = ? 
            AND (semillascoleccion IS NULL OR TRIM(semillascoleccion) = '')
            AND semillasnumerocoleccion IS NOT NULL
        `;
        queryParams = [user.id];
      } else {
        query = `
          SELECT semillasnumerocoleccion 
          FROM semillas 
          WHERE xsemillasidusuarios = ? 
            AND TRIM(semillascoleccion) = ?
            AND semillasnumerocoleccion IS NOT NULL
        `;
        queryParams = [user.id, u.trim()];
      }

      const [rowsNum]: any = await pool.query(query, queryParams);

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

    let finalVariedadId = xsemillasidvariedadesvegetales;

    if (customVarietyName) {
      const [espRows]: any = await pool.query(`
        SELECT xvariedadesvegetalesidespeciesvegetales FROM variedadesvegetales WHERE idvariedadesvegetales = ? LIMIT 1
      `, [xsemillasidvariedadesvegetales]);
      
      const especieId = espRows.length > 0 ? espRows[0].xvariedadesvegetalesidespeciesvegetales : null;

      if (especieId) {
        const [varResult]: any = await pool.query(`
          INSERT INTO variedadesvegetales (
            xvariedadesvegetalesidespeciesvegetales,
            xvariedadesvegetalesidusuarios,
            xvariedadesvegetalesidvariedadorigen,
            variedadesvegetalesnombre,
            variedadesvegetalesesgenerica
          ) VALUES (?, ?, ?, ?, 0)
        `, [especieId, user.id, xsemillasidvariedadesvegetales, customVarietyName]);
        
        finalVariedadId = varResult.insertId;
      }
    }

    const [result]: any = await pool.query(
      `INSERT INTO semillas (
        xsemillasidusuarios, 
        xsemillasidvariedadesvegetales, 
        semillasnumerocoleccion,
        semillasorigen, 
        semillasmarca,
        semillaslugarcompra,
        semillasfechaorigen, 
        semillasprecio,
        semillasfechacaducidad, 
        semillaslote, 
        semillasstockinicial,
        semillasstockactual, 
        semillasunidadmedida,
        semillasobservaciones,
        semillascoleccion,
        semillasdonante,
        xsemillasidusuariodonante,
        semillascompartir
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user.id, 
        finalVariedadId, 
        finalNumero,
        semillasorigen || 'sobre_comprado',
        semillasmarca || null,
        body.semillaslugarcompra || null,
        semillasfechaorigen || null,
        body.semillasprecio || null,
        semillasfechacaducidad || null,
        semillaslote || null,
        semillasstockinicial || null,
        semillasstockactual || null,
        semillasunidadmedida || 'unidades',
        semillasobservaciones || null,
        semillascoleccion || null,
        finalDonante,
        finalUsuarioDonanteId,
        semillascompartir ? 1 : 0
      ]
    );

    const newSeedId = result.insertId;

    // GUARDAR IMÁGENES ESCANEADAS SI EXISTEN
    const inputImages = body.scannedImagesBase64 || (body.scannedImageBase64 ? [body.scannedImageBase64] : []);
    
    if (inputImages.length > 0) {
      const { uploadToStorage } = await import('@/lib/firebase/storage');
      
      for (let i = 0; i < inputImages.length; i++) {
        try {
          let base64Data = inputImages[i];
          let mimeType = 'image/jpeg';
          let extension = 'jpg';

          if (base64Data.startsWith('data:')) {
            const parts = base64Data.split(',');
            const match = parts[0].match(/:(.*?);/);
            if (match) {
              mimeType = match[1];
              extension = mimeType.split('/')[1] || 'jpg';
            }
            base64Data = parts[1];
          }

          const buffer = Buffer.from(base64Data, 'base64');
          const filename = `semilla_${newSeedId}_${Date.now()}_${i}.${extension}`;
          const destination = `uploads/usuarios/${user.id}/semillas/${filename}`;

          await uploadToStorage(buffer, destination, mimeType);

          await pool.query(`
            INSERT INTO datosadjuntos (
              xdatosadjuntosidusuarios,
              xdatosadjuntosidsemillas,
              datosadjuntosruta,
              datosadjuntostipo,
              datosadjuntosnombreoriginal,
              datosadjuntosmime,
              datosadjuntospesobytes,
              datosadjuntosactivo,
              datosadjuntosesprincipal,
              datosadjuntosvalidado
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, 0)
          `, [user.id, newSeedId, destination, 'imagen', filename, mimeType, buffer.byteLength, i === 0 ? 1 : 0]);
        } catch (imgError) {
          console.error(`Error guardando la imagen ${i}:`, imgError);
        }
      }
    }

    // AUTO-ASIGNAR VARIEDAD Y ESPECIE
    try {
      const [varRows]: any = await pool.query(`
        SELECT 
          v.idvariedadesvegetales, 
          v.xvariedadesvegetalesidespeciesvegetales AS especie_id_var,
          v.xvariedadesvegetalesidusuarios,
          vg.xvariedadesvegetalesidespeciesvegetales AS especie_id_gen
        FROM variedadesvegetales v
        LEFT JOIN variedadesvegetales vg ON v.xvariedadesvegetalesidvariedadorigen = vg.idvariedadesvegetales
        WHERE v.idvariedadesvegetales = ?
      `, [finalVariedadId]);

      if (varRows.length > 0) {
        const variedadInfo = varRows[0];
        const especieId = variedadInfo.especie_id_gen || variedadInfo.especie_id_var;

        // 1. Asignar Variedad si no la tiene en la tabla cruzada variedadesvegetalesusuarios
        const [userVarRows]: any = await pool.query(`
          SELECT idvariedadesvegetalesusuarios FROM variedadesvegetalesusuarios 
          WHERE Xvariedadesvegetalesusuariosidusuarios = ? AND xvariedadesvegetalesusuariosidvariedadesvegetales = ?
        `, [user.id, finalVariedadId]);

        if (userVarRows.length === 0) {
          await pool.query(`
            INSERT INTO variedadesvegetalesusuarios (Xvariedadesvegetalesusuariosidusuarios, xvariedadesvegetalesusuariosidvariedadesvegetales)
            VALUES (?, ?)
          `, [user.id, finalVariedadId]);
        }

        // 2. Adquirir la variedad en la tabla 'variedades' (como planta propia del usuario para que aparezca en "Mis Plantas") si no la tiene ya
        if (especieId && (!variedadInfo.xvariedadesvegetalesidusuarios || variedadInfo.xvariedadesvegetalesidusuarios !== user.id)) {
          const [userOwnedVarCheck]: any = await pool.query(`
            SELECT idvariedadesvegetales, variedadesvegetalesvisibilidadsino FROM variedadesvegetales 
            WHERE xvariedadesvegetalesidusuarios = ? AND xvariedadesvegetalesidvariedadorigen = ?
          `, [user.id, finalVariedadId]);

          if (userOwnedVarCheck.length === 0) {
            await pool.query(`
              INSERT INTO variedadesvegetales (
                xvariedadesvegetalesidespeciesvegetales, 
                xvariedadesvegetalesidusuarios, 
                xvariedadesvegetalesidvariedadorigen, 
                variedadesvegetalesesgenerica
              ) VALUES (?, ?, ?, 0)
            `, [especieId, user.id, finalVariedadId]);
          } else if (userOwnedVarCheck[0].variedadesvegetalesvisibilidadsino === 0) {
            await pool.query(`
              UPDATE variedadesvegetales SET variedadesvegetalesvisibilidadsino = 1 WHERE idvariedadesvegetales = ?
            `, [userOwnedVarCheck[0].idvariedadesvegetales]);
          }
        }

        // 3. Asignar Especie si no la tiene en especiesusuarios
        if (especieId) {
          const [userEspRows]: any = await pool.query(`
            SELECT idespeciesvegetalesusuarios FROM especiesusuarios 
            WHERE xespeciesvegetalesusuariosidusuarios = ? AND xespeciesvegetalesusuariosidespeciesvegetales = ?
          `, [user.id, especieId]);

          if (userEspRows.length === 0) {
            const [espInfo]: any = await pool.query(`SELECT especiesvegetalesnombre FROM especiesvegetales WHERE idespeciesvegetales = ?`, [especieId]);
            const nombreEspecie = espInfo.length > 0 ? espInfo[0].especiesvegetalesnombre : '';

            await pool.query(`
              INSERT INTO especiesusuarios (
                xespeciesvegetalesusuariosidusuarios, 
                xespeciesvegetalesusuariosidespeciesvegetales, 
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

    // Evaluar rango asíncronamente
    let variedadNombre = 'sus semillas';
    try {
      const [vRows]: any = await pool.query(
        'SELECT COALESCE(NULLIF(v.variedadesvegetalesnombre, ""), vg.variedadesvegetalesnombre, e.especiesvegetalesnombre) AS nombre FROM variedadesvegetales v LEFT JOIN variedadesvegetales vg ON v.xvariedadesvegetalesidvariedadorigen = vg.idvariedadesvegetales LEFT JOIN especiesvegetales e ON v.xvariedadesvegetalesidespeciesvegetales = e.idespeciesvegetales OR vg.xvariedadesvegetalesidespeciesvegetales = e.idespeciesvegetales WHERE v.idvariedadesvegetales = ? LIMIT 1',
        [finalVariedadId]
      );
      if (vRows.length > 0 && vRows[0].nombre) variedadNombre = vRows[0].nombre;
    } catch(e) {}

    checkAndUpgradeRank(user.id, {
      type: 'semilla',
      data: { variedad: variedadNombre, compartir: semillascompartir ? 1 : 0 }
    }).catch(console.error);

    const [newSemilla]: any = await pool.query(
      'SELECT idsemillas FROM semillas WHERE idsemillas = ? AND xsemillasidusuarios = ?',
      [result.insertId, user.id]
    );

    return NextResponse.json({ 
      success: true, 
      semilla: newSemilla[0],
      message: 'Semillas añadidas al inventario'
    });
  } catch (error: any) {
    console.error('Error añadiendo semillas:', error);
    return NextResponse.json({ error: 'Error al guardar las semillas' }, { status: 500 });
  }
}
