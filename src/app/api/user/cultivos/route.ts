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
      sql += ` AND c.xcultivosidvariedades = ?`;
      params.push(variedadId);
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
      cultivosobservaciones
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
      const [rows]: any = await pool.query(
        `SELECT cultivosnumerocoleccion 
         FROM cultivos 
         WHERE xcultivosidusuarios = ? 
           AND cultivosnumerocoleccion IS NOT NULL 
           AND cultivosactivosino = 1
         ORDER BY cultivosnumerocoleccion ASC`,
         [user.id]
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
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
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

    return NextResponse.json({ 
      success: true, 
      id: result.insertId,
      message: 'Cultivo iniciado correctamente'
    });
  } catch (error: any) {
    console.error('Error iniciando cultivo:', error);
    return NextResponse.json({ error: 'Error al iniciar el cultivo' }, { status: 500 });
  }
}
