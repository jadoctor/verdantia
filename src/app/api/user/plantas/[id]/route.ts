import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getUserByEmail } from '@/lib/auth';

// GET /api/user/plantas/[id] — Obtener planta con herencia COALESCE completa
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const email = request.headers.get('x-user-email');
  if (!email) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const user = await getUserByEmail(email);
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  try {
    const plantaId = resolvedParams.id;

    const [rows]: any = await pool.query(`
      SELECT 
        vu.idvariedades,
        vu.xvariedadesidvariedadorigen,
        vu.xvariedadesidespecies,
        e.idespecies,
        e.especiesnombre,
        e.especiesicono,
        COALESCE(vu.variedadespeso1000semillas, vg.variedadespeso1000semillas, e.especiespeso1000semillas) AS especiespeso1000semillas,
        vg.variedadesnombre AS nombre_gold,
        vg.variedadesesgenerica AS es_generica,
        vu.variedadesvisibilidadsino AS variedadesvisibilidadsino,
        vg.variedadesvisibilidadsino AS origen_visibilidad,

        -- Campos con herencia triple: usuario → gold → especie
        COALESCE(NULLIF(vu.variedadesnombre, ''), vg.variedadesnombre) AS nombre,
        vg.variedadesnombre AS h_nombre,

        COALESCE(NULLIF(vu.variedadesdescripcion, ''), vg.variedadesdescripcion, e.especiesdescripcion) AS descripcion,
        COALESCE(vg.variedadesdescripcion, e.especiesdescripcion) AS h_descripcion,

        COALESCE(NULLIF(vu.variedadescolor, ''), vg.variedadescolor, e.especiescolor) AS color,
        COALESCE(vg.variedadescolor, e.especiescolor) AS h_color,

        COALESCE(NULLIF(vu.variedadestamano, ''), vg.variedadestamano, e.especiestamano) AS tamano,
        COALESCE(vg.variedadestamano, e.especiestamano) AS h_tamano,

        COALESCE(vu.variedadesviabilidadsemilla, vg.variedadesviabilidadsemilla, e.especiesviabilidadsemilla) AS viabilidadsemilla,
        COALESCE(vg.variedadesviabilidadsemilla, e.especiesviabilidadsemilla) AS h_viabilidadsemilla,

        COALESCE(vu.variedadestemperaturaminima, vg.variedadestemperaturaminima, e.especiestemperaturaminima) AS temperaturaminima,
        COALESCE(vg.variedadestemperaturaminima, e.especiestemperaturaminima) AS h_temperaturaminima,

        COALESCE(vu.variedadestemperaturaoptima, vg.variedadestemperaturaoptima, e.especiestemperaturaoptima) AS temperaturaoptima,
        COALESCE(vg.variedadestemperaturaoptima, e.especiestemperaturaoptima) AS h_temperaturaoptima,

        COALESCE(vu.variedadestemperaturamaxima, vg.variedadestemperaturamaxima, e.especiestemperaturamaxima) AS temperaturamaxima,
        COALESCE(vg.variedadestemperaturamaxima, e.especiestemperaturamaxima) AS h_temperaturamaxima,

        COALESCE(vu.variedadesmarcoplantas, vg.variedadesmarcoplantas, e.especiesmarcoplantas) AS marcoplantas,
        COALESCE(vg.variedadesmarcoplantas, e.especiesmarcoplantas) AS h_marcoplantas,

        COALESCE(vu.variedadesmarcofilas, vg.variedadesmarcofilas, e.especiesmarcofilas) AS marcofilas,
        COALESCE(vg.variedadesmarcofilas, e.especiesmarcofilas) AS h_marcofilas,

        COALESCE(vu.variedadesmarcomargen, vg.variedadesmarcomargen, e.especiesmarcomargen) AS marcomargen,
        COALESCE(vg.variedadesmarcomargen, e.especiesmarcomargen) AS h_marcomargen,

        COALESCE(vu.variedadesprofundidadsiembra, vg.variedadesprofundidadsiembra, e.especiesprofundidadsiembra) AS profundidadsiembra,
        COALESCE(vg.variedadesprofundidadsiembra, e.especiesprofundidadsiembra) AS h_profundidadsiembra,

        COALESCE(vu.variedadesprofundidadtrasplante, vg.variedadesprofundidadtrasplante, e.especiesprofundidadtrasplante) AS profundidadtrasplante,
        COALESCE(vg.variedadesprofundidadtrasplante, e.especiesprofundidadtrasplante) AS h_profundidadtrasplante,

        COALESCE(vu.variedadeshistoria, vg.variedadeshistoria, e.especieshistoria) AS historia,
        COALESCE(vg.variedadeshistoria, e.especieshistoria) AS h_historia,

        COALESCE(vu.variedadessemillerodesde, vg.variedadessemillerodesde, e.especiesfechasemillerodesde) AS semillerodesde,
        COALESCE(vg.variedadessemillerodesde, e.especiesfechasemillerodesde) AS h_semillerodesde,

        COALESCE(vu.variedadessemillerohasta, vg.variedadessemillerohasta, e.especiesfechasemillerohasta) AS semillerohasta,
        COALESCE(vg.variedadessemillerohasta, e.especiesfechasemillerohasta) AS h_semillerohasta,

        COALESCE(vu.variedadessiembradirectadesde, vg.variedadessiembradirectadesde, e.especiesfechasiembradirectadesde) AS siembradirectadesde,
        COALESCE(vg.variedadessiembradirectadesde, e.especiesfechasiembradirectadesde) AS h_siembradirectadesde,

        COALESCE(vu.variedadessiembradirectahasta, vg.variedadessiembradirectahasta, e.especiesfechasiembradirectahasta) AS siembradirectahasta,
        COALESCE(vg.variedadessiembradirectahasta, e.especiesfechasiembradirectahasta) AS h_siembradirectahasta,

        COALESCE(vu.variedadestrasplantedesde, vg.variedadestrasplantedesde, e.especiestrasplantedesde) AS trasplantedesde,
        COALESCE(vg.variedadestrasplantedesde, e.especiestrasplantedesde) AS h_trasplantedesde,

        COALESCE(vu.variedadestrasplantehasta, vg.variedadestrasplantehasta, e.especiestrasplantehasta) AS trasplantehasta,
        COALESCE(vg.variedadestrasplantehasta, e.especiestrasplantehasta) AS h_trasplantehasta,

        COALESCE(vu.variedadesrecolecciondesde, vg.variedadesrecolecciondesde, e.especiesfecharecolecciondesde) AS recolecciondesde,
        COALESCE(vg.variedadesrecolecciondesde, e.especiesfecharecolecciondesde) AS h_recolecciondesde,

        COALESCE(vu.variedadesrecoleccionhasta, vg.variedadesrecoleccionhasta, e.especiesfecharecoleccionhasta) AS recoleccionhasta,
        COALESCE(vg.variedadesrecoleccionhasta, e.especiesfecharecoleccionhasta) AS h_recoleccionhasta,

        COALESCE(vu.variedadesautosuficiencia, vg.variedadesautosuficiencia, e.especiesautosuficiencia) AS autosuficiencia,
        COALESCE(vg.variedadesautosuficiencia, e.especiesautosuficiencia) AS h_autosuficiencia,

        COALESCE(vu.variedadesautosuficienciaparcial, vg.variedadesautosuficienciaparcial, e.especiesautosuficienciaparcial) AS autosuficienciaparcial,
        COALESCE(vg.variedadesautosuficienciaparcial, e.especiesautosuficienciaparcial) AS h_autosuficienciaparcial,

        COALESCE(vu.variedadesautosuficienciaconserva, vg.variedadesautosuficienciaconserva, e.especiesautosuficienciaconserva) AS autosuficienciaconserva,
        COALESCE(vg.variedadesautosuficienciaconserva, e.especiesautosuficienciaconserva) AS h_autosuficienciaconserva,

        COALESCE(vu.variedadesicono, vg.variedadesicono, e.especiesicono) AS icono,
        COALESCE(vg.variedadesicono, e.especiesicono) AS h_icono,

        COALESCE(vu.variedadesbiodinamicacategoria, vg.variedadesbiodinamicacategoria, e.especiesorganocomestible) AS biodinamicacategoria,
        COALESCE(vg.variedadesbiodinamicacategoria, e.especiesorganocomestible) AS h_biodinamicacategoria,

        COALESCE(vu.variedadesbiodinamicanotas, vg.variedadesbiodinamicanotas, e.especiesbiodinamicanotas) AS biodinamicanotas,
        COALESCE(vg.variedadesbiodinamicanotas, e.especiesbiodinamicanotas) AS h_biodinamicanotas,

        COALESCE(vu.variedadeslunarfasesiembra, vg.variedadeslunarfasesiembra, e.especieslunarfasesiembra) AS lunarfasesiembra,
        COALESCE(vg.variedadeslunarfasesiembra, e.especieslunarfasesiembra) AS h_lunarfasesiembra,

        COALESCE(vu.variedadestiposiembra, vg.variedadestiposiembra, e.especiestiposiembra) AS tiposiembra,
        COALESCE(vg.variedadestiposiembra, e.especiestiposiembra) AS h_tiposiembra,

        COALESCE(vu.variedadeslunarfasetrasplante, vg.variedadeslunarfasetrasplante, e.especieslunarfasetrasplante) AS lunarfasetrasplante,
        COALESCE(vg.variedadeslunarfasetrasplante, e.especieslunarfasetrasplante) AS h_lunarfasetrasplante,

        COALESCE(vu.variedadeslunarobservaciones, vg.variedadeslunarobservaciones, e.especieslunarobservaciones) AS lunarobservaciones,
        COALESCE(vg.variedadeslunarobservaciones, e.especieslunarobservaciones) AS h_lunarobservaciones,

        COALESCE(vu.variedadesbiodinamicafasesiembra, vg.variedadesbiodinamicafasesiembra, e.especiesbiodinamicafasesiembra) AS biodinamicafasesiembra,
        COALESCE(vg.variedadesbiodinamicafasesiembra, e.especiesbiodinamicafasesiembra) AS h_biodinamicafasesiembra,

        COALESCE(vu.variedadesbiodinamicafasetrasplante, vg.variedadesbiodinamicafasetrasplante, e.especiesbiodinamicafasetrasplante) AS biodinamicafasetrasplante,
        COALESCE(vg.variedadesbiodinamicafasetrasplante, e.especiesbiodinamicafasetrasplante) AS h_biodinamicafasetrasplante,

        COALESCE(vu.variedadesphsuelo, vg.variedadesphsuelo, CONCAT(e.especiesphminimosuelo, ' - ', e.especiesphmaximosuelo)) AS phsuelo,
        COALESCE(vg.variedadesphsuelo, CONCAT(e.especiesphminimosuelo, ' - ', e.especiesphmaximosuelo)) AS h_phsuelo,

        COALESCE(vu.variedadesnecesidadriego, vg.variedadesnecesidadriego, e.especiesnecesidadriego) AS necesidadriego,
        COALESCE(vg.variedadesnecesidadriego, e.especiesnecesidadriego) AS h_necesidadriego,

        COALESCE(vu.variedadesvolumenmaceta, vg.variedadesvolumenmaceta, e.especiesvolumenmaceta) AS volumenmaceta,
        COALESCE(vg.variedadesvolumenmaceta, e.especiesvolumenmaceta) AS h_volumenmaceta,

        COALESCE(vu.variedadesluzsolar, vg.variedadesluzsolar, e.especiesluzsolar) AS luzsolar,
        COALESCE(vg.variedadesluzsolar, e.especiesluzsolar) AS h_luzsolar,

        COALESCE(vu.variedadescaracteristicassuelo, vg.variedadescaracteristicassuelo, e.especiescaracteristicassuelo) AS caracteristicassuelo,
        COALESCE(vg.variedadescaracteristicassuelo, e.especiescaracteristicassuelo) AS h_caracteristicassuelo,

        COALESCE(vu.variedadesdificultad, vg.variedadesdificultad, e.especiesdificultad) AS dificultad,
        COALESCE(vg.variedadesdificultad, e.especiesdificultad) AS h_dificultad,

        -- Campos adicionales de variedades que sí existen en la tabla
        COALESCE(NULLIF(vu.variedadesnombrecientifico, ''), vg.variedadesnombrecientifico, e.especiesnombrecientifico) AS nombrecientifico,
        COALESCE(vg.variedadesnombrecientifico, e.especiesnombrecientifico) AS h_nombrecientifico,

        COALESCE(NULLIF(vu.variedadesfamilia, ''), vg.variedadesfamilia, e.especiesfamilia) AS familia,
        COALESCE(vg.variedadesfamilia, e.especiesfamilia) AS h_familia,

        COALESCE(NULLIF(vu.variedadestipo, ''), vg.variedadestipo, e.especiestipo) AS tipo,
        COALESCE(vg.variedadestipo, e.especiestipo) AS h_tipo,

        COALESCE(NULLIF(vu.variedadesciclo, ''), vg.variedadesciclo, e.especiesciclo) AS ciclo,
        COALESCE(vg.variedadesciclo, e.especiesciclo) AS h_ciclo,

        -- Duraciones desde especiesfases (solo herencia, sin override de usuario por ahora)
        ef_germ.especiesfasesduraciondias AS diasgerminacion,
        ef_fruct.especiesfasesduraciondias AS diashastafructificacion,
        ef_trasp.especiesfasesduraciondias AS diashastatrasplante,
        ef_cosecha.especiesfasesduraciondias AS diashastarecoleccion,

        -- Campos de especie solo lectura (sin override de usuario)
        e.especiesresistenciahelada,
        e.especiesnecesidadtutoraje,
        e.especiesporteplanta,
        e.especiesrendimientoestimado,
        e.especiespartecosechable,
        e.especiesgerminaroscuridad,

        -- Flags de personalización (para UI: saber qué viene del usuario)
        vu.variedadesnombre IS NOT NULL AS _p_nombre,
        vu.variedadesdescripcion IS NOT NULL AS _p_descripcion,
        vu.variedadescolor IS NOT NULL AS _p_color,
        vu.variedadestamano IS NOT NULL AS _p_tamano,
        vu.variedadesviabilidadsemilla IS NOT NULL AS _p_viabilidadsemilla,
        vu.variedadestemperaturaminima IS NOT NULL AS _p_temperaturaminima,
        vu.variedadestemperaturaoptima IS NOT NULL AS _p_temperaturaoptima,
        vu.variedadestemperaturamaxima IS NOT NULL AS _p_temperaturamaxima,
        vu.variedadesmarcoplantas IS NOT NULL AS _p_marcoplantas,
        vu.variedadesmarcofilas IS NOT NULL AS _p_marcofilas,
        vu.variedadesmarcomargen IS NOT NULL AS _p_marcomargen,
        vu.variedadesprofundidadsiembra IS NOT NULL AS _p_profundidadsiembra,
        vu.variedadesprofundidadtrasplante IS NOT NULL AS _p_profundidadtrasplante,
        vu.variedadeshistoria IS NOT NULL AS _p_historia,
        vu.variedadessemillerodesde IS NOT NULL AS _p_semillerodesde,
        vu.variedadessemillerohasta IS NOT NULL AS _p_semillerohasta,
        vu.variedadessiembradirectadesde IS NOT NULL AS _p_siembradirectadesde,
        vu.variedadessiembradirectahasta IS NOT NULL AS _p_siembradirectahasta,
        vu.variedadestrasplantedesde IS NOT NULL AS _p_trasplantedesde,
        vu.variedadestrasplantehasta IS NOT NULL AS _p_trasplantehasta,
        vu.variedadesrecolecciondesde IS NOT NULL AS _p_recolecciondesde,
        vu.variedadesrecoleccionhasta IS NOT NULL AS _p_recoleccionhasta,
        vu.variedadesautosuficiencia IS NOT NULL AS _p_autosuficiencia,
        vu.variedadesautosuficienciaparcial IS NOT NULL AS _p_autosuficienciaparcial,
        vu.variedadesautosuficienciaconserva IS NOT NULL AS _p_autosuficienciaconserva,
        vu.variedadesicono IS NOT NULL AS _p_icono,
        vu.variedadesbiodinamicacategoria IS NOT NULL AS _p_biodinamicacategoria,
        vu.variedadesbiodinamicanotas IS NOT NULL AS _p_biodinamicanotas,
        vu.variedadeslunarfasesiembra IS NOT NULL AS _p_lunarfasesiembra,
        vu.variedadeslunarfasetrasplante IS NOT NULL AS _p_lunarfasetrasplante,
        vu.variedadeslunarobservaciones IS NOT NULL AS _p_lunarobservaciones,
        vu.variedadesbiodinamicafasesiembra IS NOT NULL AS _p_biodinamicafasesiembra,
        vu.variedadesbiodinamicafasetrasplante IS NOT NULL AS _p_biodinamicafasetrasplante,
        vu.variedadesphsuelo IS NOT NULL AS _p_phsuelo,
        vu.variedadesnecesidadriego IS NOT NULL AS _p_necesidadriego,
        vu.variedadesvolumenmaceta IS NOT NULL AS _p_volumenmaceta,
        vu.variedadesluzsolar IS NOT NULL AS _p_luzsolar,
        vu.variedadescaracteristicassuelo IS NOT NULL AS _p_caracteristicassuelo,
        vu.variedadesdificultad IS NOT NULL AS _p_dificultad,
        vu.variedadesnombrecientifico IS NOT NULL AS _p_nombrecientifico,
        vu.variedadesfamilia IS NOT NULL AS _p_familia,
        vu.variedadestipo IS NOT NULL AS _p_tipo,
        vu.variedadesciclo IS NOT NULL AS _p_ciclo

      FROM variedades vu
      JOIN variedades vg ON vu.xvariedadesidvariedadorigen = vg.idvariedades
      JOIN especies e ON vg.xvariedadesidespecies = e.idespecies
      LEFT JOIN especiesfases ef_germ ON ef_germ.xespeciesfasesidespecies = e.idespecies AND ef_germ.xespeciesfasesidfasescultivo = (SELECT idfasescultivo FROM fasescultivo WHERE fasescultivoclave = 'germinacion' LIMIT 1)
      LEFT JOIN especiesfases ef_trasp ON ef_trasp.xespeciesfasesidespecies = e.idespecies AND ef_trasp.xespeciesfasesidfasescultivo = (SELECT idfasescultivo FROM fasescultivo WHERE fasescultivoclave = 'trasplante' LIMIT 1)
      LEFT JOIN especiesfases ef_fruct ON ef_fruct.xespeciesfasesidespecies = e.idespecies AND ef_fruct.xespeciesfasesidfasescultivo = (SELECT idfasescultivo FROM fasescultivo WHERE fasescultivoclave = 'floracion' LIMIT 1)
      LEFT JOIN especiesfases ef_cosecha ON ef_cosecha.xespeciesfasesidespecies = e.idespecies AND ef_cosecha.xespeciesfasesidfasescultivo = (SELECT idfasescultivo FROM fasescultivo WHERE fasescultivoclave = 'cosecha' LIMIT 1)
      WHERE vu.idvariedades = ? AND vu.xvariedadesidusuarios = ?
    `, [plantaId, user.id]);

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: 'Planta no encontrada' }, { status: 404 });
    }

    return NextResponse.json({ planta: rows[0] });
  } catch (error: any) {
    console.error('Error fetching planta:', error);
    return NextResponse.json({ error: 'Error al obtener la planta' }, { status: 500 });
  }
}

// PATCH /api/user/plantas/[id] — Personalizar campos (auto-save, parcial)
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const email = request.headers.get('x-user-email');
  if (!email) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const user = await getUserByEmail(email);
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  try {
    const plantaId = resolvedParams.id;
    const body = await request.json();

    // Verificar propiedad
    const [ownerCheck]: any = await pool.query(
      `SELECT idvariedades FROM variedades WHERE idvariedades = ? AND xvariedadesidusuarios = ?`,
      [plantaId, user.id]
    );
    if (ownerCheck.length === 0) {
      return NextResponse.json({ error: 'Planta no encontrada o no te pertenece' }, { status: 404 });
    }

    if (Object.keys(body).length === 0) {
      return NextResponse.json({ success: true });
    }

    // Campos permitidos (solo los de variedades, nunca las FK)
    const allowedFields = [
      'variedadesnombre', 'variedadesdescripcion', 'variedadescolor', 'variedadestamano',
      'variedadesviabilidadsemilla',
      'variedadestemperaturaminima', 'variedadestemperaturaoptima', 'variedadestemperaturamaxima',
      'variedadesmarcoplantas', 'variedadesmarcofilas', 'variedadesmarcomargen', 'variedadesprofundidadsiembra',
      'variedadesprofundidadtrasplante', 'variedadeshistoria',
      'variedadessemillerodesde', 'variedadessemillerohasta',
      'variedadessiembradirectadesde', 'variedadessiembradirectahasta',
      'variedadestrasplantedesde', 'variedadestrasplantehasta',
      'variedadesrecolecciondesde', 'variedadesrecoleccionhasta',
      'variedadesautosuficiencia', 'variedadesautosuficienciaparcial', 'variedadesautosuficienciaconserva',
      'variedadesicono', 'variedadesbiodinamicacategoria', 'variedadesbiodinamicanotas',
      'variedadesphsuelo', 'variedadesnecesidadriego', 'variedadestiposiembra',
      'variedadesvolumenmaceta', 'variedadesluzsolar', 'variedadescaracteristicassuelo',
      'variedadesdificultad',
      'variedadeslunarfasesiembra', 'variedadeslunarfasetrasplante', 'variedadeslunarobservaciones',
      'variedadesbiodinamicafasesiembra', 'variedadesbiodinamicafasetrasplante',
      'variedadesnombrecientifico', 'variedadesfamilia', 'variedadestipo', 'variedadesciclo',
      'variedadespeso1000semillas',
      'variedadesvisibilidadsino'
    ];

    const setClauses: string[] = [];
    const queryParams: any[] = [];

    for (const [key, value] of Object.entries(body)) {
      if (allowedFields.includes(key)) {
        setClauses.push(`${key} = ?`);
        // Si el valor es vacío o '__inherit__', poner NULL para que herede
        queryParams.push(value === '' || value === '__inherit__' ? null : value);
      }
    }

    if (setClauses.length === 0) {
      return NextResponse.json({ success: true });
    }

    queryParams.push(plantaId, user.id);

    await pool.query(
      `UPDATE variedades SET ${setClauses.join(', ')} WHERE idvariedades = ? AND xvariedadesidusuarios = ?`,
      queryParams
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating planta:', error);
    return NextResponse.json({ error: 'Error al actualizar la planta' }, { status: 500 });
  }
}

// DELETE /api/user/plantas/[id] — Eliminar planta del usuario
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const email = request.headers.get('x-user-email');
  if (!email) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const user = await getUserByEmail(email);
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  try {
    const plantaId = resolvedParams.id;

    // Verificar propiedad antes de borrar
    const [ownerCheck]: any = await pool.query(
      `SELECT idvariedades, xvariedadesidvariedadorigen FROM variedades WHERE idvariedades = ? AND xvariedadesidusuarios = ?`,
      [plantaId, user.id]
    );
    if (ownerCheck.length === 0) {
      return NextResponse.json({ error: 'Planta no encontrada o no te pertenece' }, { status: 404 });
    }

    const { idvariedades, xvariedadesidvariedadorigen } = ownerCheck[0];

    // Verificar si tiene cultivos asociados
    const [cropsCheck]: any = await pool.query(
      `SELECT idcultivos FROM cultivos WHERE xcultivosidvariedades = ? AND xcultivosidusuarios = ? AND cultivosactivosino = 1 LIMIT 1`,
      [plantaId, user.id]
    );
    if (cropsCheck.length > 0) {
      return NextResponse.json({ error: 'No se puede eliminar la planta porque tiene cultivos activos. Elimina o finaliza los cultivos primero.' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const forceInactivate = searchParams.get('inactivate') === 'true';

    // Verificar si tiene semillas asociadas
    const [seedsCheck]: any = await pool.query(
      `SELECT idsemillas FROM semillas 
       WHERE (xsemillasidvariedades = ? OR xsemillasidvariedades = ?) 
         AND xsemillasidusuarios = ? 
         AND semillasactivosino = 1 LIMIT 1`,
      [idvariedades, xvariedadesidvariedadorigen, user.id]
    );

    if (seedsCheck.length > 0 || forceInactivate) {
      // Si tiene semillas o se solicita inactivación, no se elimina físicamente, se inactiva (variedadesvisibilidadsino = 0)
      await pool.query(
        `UPDATE variedades SET variedadesvisibilidadsino = 0 WHERE idvariedades = ? AND xvariedadesidusuarios = ?`,
        [plantaId, user.id]
      );
      return NextResponse.json({ success: true, message: 'Planta inactivada de tu huerto.', inactivated: true });
    }

    // Eliminar overrides de pautas del usuario para esta planta
    await pool.query(
      `DELETE FROM laborespauta WHERE xlaborespautaidvariedades = ? AND xlaborespautaidusuarios = ?`,
      [plantaId, user.id]
    );

    // Eliminar la variedad del usuario
    await pool.query(
      `DELETE FROM variedades WHERE idvariedades = ? AND xvariedadesidusuarios = ?`,
      [plantaId, user.id]
    );

    return NextResponse.json({ success: true, message: 'Planta eliminada de tu huerto', inactivated: false });
  } catch (error: any) {
    console.error('Error deleting planta:', error);
    return NextResponse.json({ error: 'Error al eliminar la planta' }, { status: 500 });
  }
}
