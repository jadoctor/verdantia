import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getUserByEmail } from '@/lib/auth';

// GET /api/user/cultivos — Listar cultivos del usuario
export async function GET(request: Request) {
  const email = request.headers.get('x-user-email');
  if (!email) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const user = await getUserByEmail(email);
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  const url = new URL(request.url);
  const variedadId = url.searchParams.get('variedadId');

  try {
    let sql = `
      SELECT 
        c.idcultivos,
        c.xcultivosidloteorigen,
        c.xcultivosidvariedades,
        c.xcultivosidsemillas,
        c.xcultivosidbancales,
        c.cultivosposicionx,
        c.cultivosposiciony,
        c.cultivosnumerocoleccion,
        c.cultivosorigen,
        c.cultivosmetodo,
        c.cultivosestado,
        c.cultivosfechainicio,
        c.cultivosfechagerminacion,
        c.cultivosfechatrasplante,
        c.cultivosfecharecoleccion,
        c.cultivosfechafinalizacion,
        c.cultivoscantidad,
        c.cultivosubicacion,
        c.cultivosobservaciones,
        COALESCE(NULLIF(vu.variedadesnombre, ''), vg.variedadesnombre) AS variedad_nombre,
        e.especiesnombre,
        e.especiesicono,
        COALESCE(vu.variedadesmarcoplantas, vg.variedadesmarcoplantas, e.especiesmarcoplantas) AS especiesmarcoplantas,
        COALESCE(vu.variedadesmarcofilas, vg.variedadesmarcofilas, e.especiesmarcofilas) AS especiesmarcofilas,
        COALESCE(vu.variedadesmarcomargen, vg.variedadesmarcomargen, e.especiesmarcomargen) AS especiesmarcomargen,
        -- Foto de la variedad o especie

        COALESCE(
          (SELECT datosadjuntosruta FROM datosadjuntos 
           WHERE xdatosadjuntosidcultivos = c.idcultivos AND datosadjuntostipo = 'imagen' AND datosadjuntosactivo = 1 ORDER BY datosadjuntosesprincipal DESC LIMIT 1),
          (SELECT datosadjuntosruta FROM datosadjuntos 
           WHERE xdatosadjuntosidvariedades = vu.idvariedades AND datosadjuntostipo = 'imagen' AND datosadjuntosactivo = 1 ORDER BY datosadjuntosesprincipal DESC LIMIT 1),
          (SELECT datosadjuntosruta FROM datosadjuntos 
           WHERE xdatosadjuntosidvariedades = vg.idvariedades AND datosadjuntostipo = 'imagen' AND datosadjuntosactivo = 1 ORDER BY datosadjuntosesprincipal DESC LIMIT 1),
          (SELECT datosadjuntosruta FROM datosadjuntos 
           WHERE xdatosadjuntosidespecies = e.idespecies AND datosadjuntostipo = 'imagen' AND datosadjuntosactivo = 1 ORDER BY datosadjuntosesprincipal DESC LIMIT 1)
        ) AS foto
      FROM cultivos c
      JOIN variedades vu ON c.xcultivosidvariedades = vu.idvariedades
      LEFT JOIN variedades vg ON vu.xvariedadesidvariedadorigen = vg.idvariedades
      JOIN especies e ON vg.xvariedadesidespecies = e.idespecies OR vu.xvariedadesidespecies = e.idespecies
      WHERE c.xcultivosidusuarios = ? AND c.cultivosactivosino = 1
    `;
    
    const params: any[] = [user.id];

    if (variedadId) {
      sql += ` AND (c.xcultivosidvariedades = ? OR c.xcultivosidvariedades = (SELECT xvariedadesidvariedadorigen FROM variedades WHERE idvariedades = ? AND xvariedadesidusuarios = ? LIMIT 1))`;
      params.push(variedadId, variedadId, user.id);
    }

    sql += `
      ORDER BY 
        CASE c.cultivosestado 
          WHEN 'finalizado' THEN 1
          WHEN 'perdido' THEN 1
          ELSE 0
        END,
        c.cultivosfechainicio DESC
    `;

    const [cultivos] = await pool.query(sql, params);

    // Auto-fix: detectar y corregir números de colección duplicados silenciosamente
    if (!variedadId) {
      const activeCultivos = (cultivos as any[]).filter(
        (c: any) => c.cultivosestado !== 'finalizado' && c.cultivosestado !== 'perdido'
      );
      
      // Agrupar por año
      const byYear: Record<number, any[]> = {};
      for (const c of activeCultivos) {
        const year = c.cultivosfechainicio 
          ? new Date(c.cultivosfechainicio).getFullYear() 
          : new Date().getFullYear();
        if (!byYear[year]) byYear[year] = [];
        byYear[year].push(c);
      }

      // Para cada año, detectar duplicados y corregir
      for (const [, crops] of Object.entries(byYear)) {
        const usedNumbers = new Set<number>();
        const toFix: { id: number, newNum: number }[] = [];

        for (const crop of crops) {
          const num = crop.cultivosnumerocoleccion;
          if (num && usedNumbers.has(num)) {
            toFix.push({ id: crop.idcultivos, newNum: 0 });
          } else if (num) {
            usedNumbers.add(num);
          }
        }

        if (toFix.length > 0) {
          for (const fix of toFix) {
            let nextNum = 1;
            while (usedNumbers.has(nextNum)) nextNum++;
            fix.newNum = nextNum;
            usedNumbers.add(nextNum);
          }
          // Aplicar correcciones y actualizar los datos en memoria
          for (const fix of toFix) {
            await pool.query(
              `UPDATE cultivos SET cultivosnumerocoleccion = ? WHERE idcultivos = ?`,
              [fix.newNum, fix.id]
            );
            const crop = (cultivos as any[]).find((c: any) => c.idcultivos === fix.id);
            if (crop) crop.cultivosnumerocoleccion = fix.newNum;
          }
        }
      }
    }

    // Fetch ubicaciones
    const cropIds = (cultivos as any[]).map((c: any) => c.idcultivos);
    if (cropIds.length > 0) {
      const [ubicacionesRows]: any = await pool.query(
        `SELECT * FROM cultivosubicaciones WHERE xcultivosubicacionesidcultivos IN (?)`,
        [cropIds]
      );
      
      const ubiMap: Record<number, any[]> = {};
      for (const u of ubicacionesRows) {
        if (!ubiMap[u.xcultivosubicacionesidcultivos]) {
          ubiMap[u.xcultivosubicacionesidcultivos] = [];
        }
        ubiMap[u.xcultivosubicacionesidcultivos].push(u);
      }
      
      for (const c of (cultivos as any[])) {
        c.ubicaciones = ubiMap[c.idcultivos] || [];
      }
    }

    return NextResponse.json({ cultivos });
  } catch (error: any) {
    console.error('Error fetching cultivos:', error);
    return NextResponse.json({ error: 'Error al obtener cultivos' }, { status: 500 });
  }
}

// POST /api/user/cultivos — Iniciar un nuevo cultivo
export async function POST(request: Request) {
  const email = request.headers.get('x-user-email');
  if (!email) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const user = await getUserByEmail(email);
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  try {
    const body = await request.json();
    const { 
      xcultivosidvariedades, 
      xcultivosidsemillas, 
      xcultivosidbancales,
      cultivosposicionx,
      cultivosposiciony,
      cultivosnumerocoleccion,
      cultivosorigen, 
      cultivosmetodo, 
      cultivosestado,
      cultivosfechainicio,
      cultivoscantidad,
      cultivosubicacion,
      cultivosobservaciones,
      xcultivosidloteorigen
    } = body;

    if (!xcultivosidvariedades) {
      return NextResponse.json({ error: 'La variedad es obligatoria' }, { status: 400 });
    }

    const cantidad = parseInt(cultivoscantidad) || 1;

    // 1. Obtener datos del marco de plantación para esta variedad/especie
    const [specieRows]: any[] = await pool.query(`
      SELECT 
        e.especiesnombre,
        COALESCE(e.especiesmarcoplantas, 30) AS especiesmarcoplantas,
        COALESCE(e.especiesmarcofilas, 30) AS especiesmarcofilas
      FROM variedades vu
      LEFT JOIN variedades vg ON vu.xvariedadesidvariedadorigen = vg.idvariedades
      JOIN especies e ON vg.xvariedadesidespecies = e.idespecies OR vu.xvariedadesidespecies = e.idespecies
      WHERE vu.idvariedades = ?
      LIMIT 1
    `, [xcultivosidvariedades]);

    if (specieRows.length === 0) {
      return NextResponse.json({ error: 'Variedad o especie no encontrada en el catálogo.' }, { status: 400 });
    }

    const especie = specieRows[0];
    const newCropArea = cantidad * (especie.especiesmarcoplantas / 100) * (especie.especiesmarcofilas / 100);

    // 2. Obtener el límite del plan del usuario y calcular espacio total ocupado
    const suscripcionName = user.suscripcion || '';
    const cleanName = suscripcionName.toLowerCase();
    let planMaxSpace = 10;
    if (cleanName.includes('premium')) planMaxSpace = 1000;
    else if (cleanName.includes('avanzado')) planMaxSpace = 200;
    else if (cleanName.includes('esencial')) planMaxSpace = 50;

    const [activeCrops]: any[] = await pool.query(`
      SELECT 
        c.cultivoscantidad,
        COALESCE(e.especiesmarcoplantas, 30) AS especiesmarcoplantas,
        COALESCE(e.especiesmarcofilas, 30) AS especiesmarcofilas
      FROM cultivos c
      JOIN variedades vu ON c.xcultivosidvariedades = vu.idvariedades
      LEFT JOIN variedades vg ON vu.xvariedadesidvariedadorigen = vg.idvariedades
      JOIN especies e ON vg.xvariedadesidespecies = e.idespecies OR vu.xvariedadesidespecies = e.idespecies
      WHERE c.xcultivosidusuarios = ? 
        AND c.cultivosactivosino = 1 
        AND c.cultivosestado NOT IN ('finalizado', 'perdido')
    `, [user.id]);

    let totalUsedSpace = 0;
    for (const crop of activeCrops) {
      totalUsedSpace += crop.cultivoscantidad * (crop.especiesmarcoplantas / 100) * (crop.especiesmarcofilas / 100);
    }

    if (totalUsedSpace + newCropArea > planMaxSpace) {
      return NextResponse.json({ 
        error: `Has alcanzado el límite de m² de tu plan (${planMaxSpace} m²). Ocupado: ${totalUsedSpace.toFixed(2)} m², Requerido: ${newCropArea.toFixed(2)} m². Por favor, amplía tu suscripción o finaliza cultivos activos.`
      }, { status: 400 });
    }

    // 3. Validación de límite físico del bancal si se especifica uno real
    let finalBancalId = xcultivosidbancales ? parseInt(xcultivosidbancales) : null;
    if (finalBancalId) {
      const [bancalRows]: any[] = await pool.query(
        `SELECT bancalesnombre, bancalesancho, bancalesanchosuperior, bancaleslargo, bancalesforma FROM bancales WHERE idbancales = ? AND xbancalesidusuarios = ?`,
        [finalBancalId, user.id]
      );

      if (bancalRows.length === 0) {
        return NextResponse.json({ error: 'El bancal seleccionado no es válido o no te pertenece.' }, { status: 400 });
      }

      const bancal = bancalRows[0];
      let bedTotalArea = bancal.bancalesancho * bancal.bancaleslargo;

      if (bancal.bancalesforma === 'trapezoidal') {
        const superior = bancal.bancalesanchosuperior !== null ? parseFloat(bancal.bancalesanchosuperior) : bancal.bancalesancho;
        bedTotalArea = ((bancal.bancalesancho + superior) / 2) * bancal.bancaleslargo;
      } else if (bancal.bancalesforma === 'circular') {
        // Área de elipse/círculo: pi * r1 * r2
        bedTotalArea = Math.PI * (bancal.bancalesancho / 2) * (bancal.bancaleslargo / 2);
      }

      // Calcular el espacio usado en este bancal específico
      const [bedCrops]: any[] = await pool.query(`
        SELECT 
          c.cultivoscantidad,
          COALESCE(e.especiesmarcoplantas, 30) AS especiesmarcoplantas,
          COALESCE(e.especiesmarcofilas, 30) AS especiesmarcofilas
        FROM cultivos c
        JOIN variedades vu ON c.xcultivosidvariedades = vu.idvariedades
        LEFT JOIN variedades vg ON vu.xvariedadesidvariedadorigen = vg.idvariedades
        JOIN especies e ON vg.xvariedadesidespecies = e.idespecies OR vu.xvariedadesidespecies = e.idespecies
        WHERE c.xcultivosidusuarios = ? 
          AND c.xcultivosidbancales = ? 
          AND c.cultivosactivosino = 1 
          AND c.cultivosestado NOT IN ('finalizado', 'perdido')
      `, [user.id, finalBancalId]);

      let bedUsedSpace = 0;
      for (const crop of bedCrops) {
        bedUsedSpace += crop.cultivoscantidad * (crop.especiesmarcoplantas / 100) * (crop.especiesmarcofilas / 100);
      }

      if (bedUsedSpace + newCropArea > bedTotalArea) {
        return NextResponse.json({
          error: `El bancal "${bancal.bancalesnombre}" no dispone de suficiente espacio libre. Área total: ${bedTotalArea.toFixed(2)} m², Ocupado: ${bedUsedSpace.toFixed(2)} m², Requerido para nueva plantación: ${newCropArea.toFixed(2)} m².`
        }, { status: 400 });
      }
    }

    // Calcular posición por defecto si no viene
    const posx = cultivosposicionx !== undefined && cultivosposicionx !== null 
      ? parseFloat(cultivosposicionx) 
      : (Math.random() * 70 + 15);
    const posy = cultivosposiciony !== undefined && cultivosposiciony !== null 
      ? parseFloat(cultivosposiciony) 
      : (Math.random() * 70 + 15);

    let nextNumero = cultivosnumerocoleccion;
    if (!nextNumero) {
      // El número de colección debe ser único por usuario y año
      const cropYear = cultivosfechainicio 
        ? new Date(cultivosfechainicio).getFullYear() 
        : new Date().getFullYear();
      
      const [rows]: any = await pool.query(
        `SELECT cultivosnumerocoleccion 
         FROM cultivos 
         WHERE xcultivosidusuarios = ? 
           AND cultivosnumerocoleccion IS NOT NULL 
           AND cultivosactivosino = 1
           AND YEAR(cultivosfechainicio) = ?
         ORDER BY cultivosnumerocoleccion ASC`,
         [user.id, cropYear]
      );
      
      nextNumero = 1;
      for (const row of rows) {
        if (row.cultivosnumerocoleccion === nextNumero) {
          nextNumero++;
        } else if (row.cultivosnumerocoleccion > nextNumero) {
          break; // Encontramos un hueco
        }
      }
    }

    const [result]: any = await pool.query(
      `INSERT INTO cultivos (
        xcultivosidloteorigen,
        xcultivosidusuarios, 
        xcultivosidvariedades, 
        xcultivosidsemillas, 
        xcultivosidbancales,
        cultivosposicionx,
        cultivosposiciony,
        cultivosnumerocoleccion,
        cultivosorigen, 
        cultivosmetodo, 
        cultivosestado,
        cultivosfechainicio,
        cultivoscantidad,
        cultivosubicacion,
        cultivosobservaciones
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        xcultivosidloteorigen || null,
        user.id, 
        xcultivosidvariedades, 
        xcultivosidsemillas || null,
        finalBancalId,
        posx,
        posy,
        nextNumero,
        cultivosorigen,
        cultivosmetodo,
        cultivosestado || 'germinacion',
        cultivosfechainicio || new Date().toISOString().split('T')[0],
        cantidad,
        cultivosubicacion || null,
        cultivosobservaciones || null
      ]
    );

    const newCropId = result.insertId;

    if (finalBancalId && posx !== undefined && posy !== undefined) {
      await pool.query(
        `INSERT INTO cultivosubicaciones (xcultivosubicacionesidcultivos, xcultivosubicacionesidbancales, cultivosubicacionesposicionx, cultivosubicacionesposiciony) 
         VALUES (?, ?, ?, ?)`,
        [newCropId, finalBancalId, posx, posy]
      );
    }

    return NextResponse.json({ 
      success: true, 
      id: newCropId,
      message: 'Cultivo iniciado correctamente'
    });
  } catch (error: any) {
    console.error('Error iniciando cultivo:', error);
    return NextResponse.json({ error: 'Error al iniciar el cultivo' }, { status: 500 });
  }
}
