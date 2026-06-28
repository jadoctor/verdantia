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
        vu.idvariedadesvegetales,
        vu.xvariedadesvegetalesidvariedadorigen,
        vu.xvariedadesvegetalesidespeciesvegetales,
        e.idespeciesvegetales,
        e.especiesvegetalesnombre,
        e.especiesvegetalesicono,
        COALESCE(vu.variedadespeso1000semillas, vg.variedadespeso1000semillas, e.especiesvegetalespeso1000semillas) AS especiespeso1000semillas,
        vg.variedadesvegetalesnombre AS nombre_gold,
        vg.variedadesvegetalesesgenerica AS es_generica,
        vu.variedadesvegetalesvisibilidadsino AS variedadesvegetalesvisibilidadsino,
        vg.variedadesvegetalesvisibilidadsino AS origen_visibilidad,

        -- Campos con herencia triple: usuario → gold → especie
        COALESCE(NULLIF(vu.variedadesvegetalesnombre, ''), vg.variedadesvegetalesnombre) AS nombre,
        vg.variedadesvegetalesnombre AS h_nombre,

        COALESCE(NULLIF(vu.variedadesdescripcion, ''), vg.variedadesdescripcion, e.especiesvegetalesdescripcion) AS descripcion,
        COALESCE(vg.variedadesdescripcion, e.especiesvegetalesdescripcion) AS h_descripcion,

        COALESCE(NULLIF(vu.variedadescolor, ''), vg.variedadescolor, e.especiesvegetalescolor) AS color,
        COALESCE(vg.variedadescolor, e.especiesvegetalescolor) AS h_color,

        COALESCE(NULLIF(vu.variedadestamano, ''), vg.variedadestamano, e.especiesvegetalestamano) AS tamano,
        COALESCE(vg.variedadestamano, e.especiesvegetalestamano) AS h_tamano,

        COALESCE(vu.variedadesviabilidadsemilla, vg.variedadesviabilidadsemilla, e.especiesvegetalesviabilidadsemilla) AS viabilidadsemilla,
        COALESCE(vg.variedadesviabilidadsemilla, e.especiesvegetalesviabilidadsemilla) AS h_viabilidadsemilla,

        COALESCE(vu.variedadestemperaturaminima, vg.variedadestemperaturaminima, e.especiesvegetalestemperaturaminima) AS temperaturaminima,
        COALESCE(vg.variedadestemperaturaminima, e.especiesvegetalestemperaturaminima) AS h_temperaturaminima,

        COALESCE(vu.variedadestemperaturaoptima, vg.variedadestemperaturaoptima, e.especiesvegetalestemperaturaoptima) AS temperaturaoptima,
        COALESCE(vg.variedadestemperaturaoptima, e.especiesvegetalestemperaturaoptima) AS h_temperaturaoptima,

        COALESCE(vu.variedadestemperaturamaxima, vg.variedadestemperaturamaxima, e.especiesvegetalestemperaturamaxima) AS temperaturamaxima,
        COALESCE(vg.variedadestemperaturamaxima, e.especiesvegetalestemperaturamaxima) AS h_temperaturamaxima,

        COALESCE(vu.variedadesmarcoplantas, vg.variedadesmarcoplantas, e.especiesvegetalesmarcoplantas) AS marcoplantas,
        COALESCE(vg.variedadesmarcoplantas, e.especiesvegetalesmarcoplantas) AS h_marcoplantas,

        COALESCE(vu.variedadesmarcofilas, vg.variedadesmarcofilas, e.especiesvegetalesmarcofilas) AS marcofilas,
        COALESCE(vg.variedadesmarcofilas, e.especiesvegetalesmarcofilas) AS h_marcofilas,

        COALESCE(vu.variedadesmarcomargen, vg.variedadesmarcomargen, e.especiesvegetalesmarcomargen) AS marcomargen,
        COALESCE(vg.variedadesmarcomargen, e.especiesvegetalesmarcomargen) AS h_marcomargen,

        COALESCE(vu.variedadesprofundidadsiembra, vg.variedadesprofundidadsiembra, e.especiesvegetalesprofundidadsiembra) AS profundidadsiembra,
        COALESCE(vg.variedadesprofundidadsiembra, e.especiesvegetalesprofundidadsiembra) AS h_profundidadsiembra,

        COALESCE(vu.variedadesprofundidadtrasplante, vg.variedadesprofundidadtrasplante, e.especiesvegetalesprofundidadtrasplante) AS profundidadtrasplante,
        COALESCE(vg.variedadesprofundidadtrasplante, e.especiesvegetalesprofundidadtrasplante) AS h_profundidadtrasplante,

        COALESCE(vu.variedadeshistoria, vg.variedadeshistoria, e.especiesvegetaleshistoria) AS historia,
        COALESCE(vg.variedadeshistoria, e.especiesvegetaleshistoria) AS h_historia,

        COALESCE(vu.variedadessemillerodesde, vg.variedadessemillerodesde, e.especiesvegetalesfechasemillerodesde) AS semillerodesde,
        COALESCE(vg.variedadessemillerodesde, e.especiesvegetalesfechasemillerodesde) AS h_semillerodesde,

        COALESCE(vu.variedadessemillerohasta, vg.variedadessemillerohasta, e.especiesvegetalesfechasemillerohasta) AS semillerohasta,
        COALESCE(vg.variedadessemillerohasta, e.especiesvegetalesfechasemillerohasta) AS h_semillerohasta,

        COALESCE(vu.variedadessiembradirectadesde, vg.variedadessiembradirectadesde, e.especiesvegetalesfechasiembradirectadesde) AS siembradirectadesde,
        COALESCE(vg.variedadessiembradirectadesde, e.especiesvegetalesfechasiembradirectadesde) AS h_siembradirectadesde,

        COALESCE(vu.variedadessiembradirectahasta, vg.variedadessiembradirectahasta, e.especiesvegetalesfechasiembradirectahasta) AS siembradirectahasta,
        COALESCE(vg.variedadessiembradirectahasta, e.especiesvegetalesfechasiembradirectahasta) AS h_siembradirectahasta,

        COALESCE(vu.variedadestrasplantedesde, vg.variedadestrasplantedesde, e.especiesvegetalestrasplantedesde) AS trasplantedesde,
        COALESCE(vg.variedadestrasplantedesde, e.especiesvegetalestrasplantedesde) AS h_trasplantedesde,

        COALESCE(vu.variedadestrasplantehasta, vg.variedadestrasplantehasta, e.especiesvegetalestrasplantehasta) AS trasplantehasta,
        COALESCE(vg.variedadestrasplantehasta, e.especiesvegetalestrasplantehasta) AS h_trasplantehasta,

        COALESCE(vu.variedadesrecolecciondesde, vg.variedadesrecolecciondesde, e.especiesvegetalesfecharecolecciondesde) AS recolecciondesde,
        COALESCE(vg.variedadesrecolecciondesde, e.especiesvegetalesfecharecolecciondesde) AS h_recolecciondesde,

        COALESCE(vu.variedadesrecoleccionhasta, vg.variedadesrecoleccionhasta, e.especiesvegetalesfecharecoleccionhasta) AS recoleccionhasta,
        COALESCE(vg.variedadesrecoleccionhasta, e.especiesvegetalesfecharecoleccionhasta) AS h_recoleccionhasta,

        COALESCE(vu.variedadesautosuficiencia, vg.variedadesautosuficiencia, e.especiesvegetalesautosuficiencia) AS autosuficiencia,
        COALESCE(vg.variedadesautosuficiencia, e.especiesvegetalesautosuficiencia) AS h_autosuficiencia,

        COALESCE(vu.variedadesautosuficienciaparcial, vg.variedadesautosuficienciaparcial, e.especiesvegetalesautosuficienciaparcial) AS autosuficienciaparcial,
        COALESCE(vg.variedadesautosuficienciaparcial, e.especiesvegetalesautosuficienciaparcial) AS h_autosuficienciaparcial,

        COALESCE(vu.variedadesautosuficienciaconserva, vg.variedadesautosuficienciaconserva, e.especiesvegetalesautosuficienciaconserva) AS autosuficienciaconserva,
        COALESCE(vg.variedadesautosuficienciaconserva, e.especiesvegetalesautosuficienciaconserva) AS h_autosuficienciaconserva,

        COALESCE(vu.variedadesicono, vg.variedadesicono, e.especiesvegetalesicono) AS icono,
        COALESCE(vg.variedadesicono, e.especiesvegetalesicono) AS h_icono,

        COALESCE(vu.variedadesbiodinamicacategoria, vg.variedadesbiodinamicacategoria, e.especiesvegetalesorganocomestible) AS biodinamicacategoria,
        COALESCE(vg.variedadesbiodinamicacategoria, e.especiesvegetalesorganocomestible) AS h_biodinamicacategoria,

        COALESCE(vu.variedadesbiodinamicanotas, vg.variedadesbiodinamicanotas, e.especiesvegetalesbiodinamicanotas) AS biodinamicanotas,
        COALESCE(vg.variedadesbiodinamicanotas, e.especiesvegetalesbiodinamicanotas) AS h_biodinamicanotas,

        COALESCE(vu.variedadeslunarfasesiembra, vg.variedadeslunarfasesiembra, e.especiesvegetaleslunarfasesiembra) AS lunarfasesiembra,
        COALESCE(vg.variedadeslunarfasesiembra, e.especiesvegetaleslunarfasesiembra) AS h_lunarfasesiembra,

        COALESCE(vu.variedadestiposiembra, vg.variedadestiposiembra, e.especiesvegetalestiposiembra) AS tiposiembra,
        COALESCE(vg.variedadestiposiembra, e.especiesvegetalestiposiembra) AS h_tiposiembra,

        COALESCE(vu.variedadeslunarfasetrasplante, vg.variedadeslunarfasetrasplante, e.especiesvegetaleslunarfasetrasplante) AS lunarfasetrasplante,
        COALESCE(vg.variedadeslunarfasetrasplante, e.especiesvegetaleslunarfasetrasplante) AS h_lunarfasetrasplante,

        COALESCE(vu.variedadeslunarobservaciones, vg.variedadeslunarobservaciones, e.especiesvegetaleslunarobservaciones) AS lunarobservaciones,
        COALESCE(vg.variedadeslunarobservaciones, e.especiesvegetaleslunarobservaciones) AS h_lunarobservaciones,

        COALESCE(vu.variedadesbiodinamicafasesiembra, vg.variedadesbiodinamicafasesiembra, e.especiesvegetalesbiodinamicafasesiembra) AS biodinamicafasesiembra,
        COALESCE(vg.variedadesbiodinamicafasesiembra, e.especiesvegetalesbiodinamicafasesiembra) AS h_biodinamicafasesiembra,

        COALESCE(vu.variedadesbiodinamicafasetrasplante, vg.variedadesbiodinamicafasetrasplante, e.especiesvegetalesbiodinamicafasetrasplante) AS biodinamicafasetrasplante,
        COALESCE(vg.variedadesbiodinamicafasetrasplante, e.especiesvegetalesbiodinamicafasetrasplante) AS h_biodinamicafasetrasplante,

        COALESCE(vu.variedadesphsuelo, vg.variedadesphsuelo, CONCAT(e.especiesvegetalesphminimosuelo, ' - ', e.especiesvegetalesphmaximosuelo)) AS phsuelo,
        COALESCE(vg.variedadesphsuelo, CONCAT(e.especiesvegetalesphminimosuelo, ' - ', e.especiesvegetalesphmaximosuelo)) AS h_phsuelo,

        COALESCE(vu.variedadesnecesidadriego, vg.variedadesnecesidadriego, e.especiesvegetalesnecesidadriego) AS necesidadriego,
        COALESCE(vg.variedadesnecesidadriego, e.especiesvegetalesnecesidadriego) AS h_necesidadriego,

        COALESCE(vu.variedadesvolumenmaceta, vg.variedadesvolumenmaceta, e.especiesvegetalesvolumenmaceta) AS volumenmaceta,
        COALESCE(vg.variedadesvolumenmaceta, e.especiesvegetalesvolumenmaceta) AS h_volumenmaceta,

        COALESCE(vu.variedadesluzsolar, vg.variedadesluzsolar, e.especiesvegetalesluzsolar) AS luzsolar,
        COALESCE(vg.variedadesluzsolar, e.especiesvegetalesluzsolar) AS h_luzsolar,

        COALESCE(vu.variedadescaracteristicassuelo, vg.variedadescaracteristicassuelo, e.especiesvegetalescaracteristicassuelo) AS caracteristicassuelo,
        COALESCE(vg.variedadescaracteristicassuelo, e.especiesvegetalescaracteristicassuelo) AS h_caracteristicassuelo,

        COALESCE(vu.variedadesdificultad, vg.variedadesdificultad, e.especiesvegetalesdificultad) AS dificultad,
        COALESCE(vg.variedadesdificultad, e.especiesvegetalesdificultad) AS h_dificultad,

        -- Campos adicionales de variedades que sí existen en la tabla
        COALESCE(NULLIF(vu.variedadesvegetalesnombrecientifico, ''), vg.variedadesvegetalesnombrecientifico, e.especiesvegetalesnombrecientifico) AS nombrecientifico,
        COALESCE(vg.variedadesvegetalesnombrecientifico, e.especiesvegetalesnombrecientifico) AS h_nombrecientifico,

        COALESCE(NULLIF(vu.variedadesfamilia, ''), vg.variedadesfamilia, e.especiesvegetalesfamilia) AS familia,
        COALESCE(vg.variedadesfamilia, e.especiesvegetalesfamilia) AS h_familia,

        COALESCE(NULLIF(vu.variedadestipo, ''), vg.variedadestipo, e.especiesvegetalestipo) AS tipo,
        COALESCE(vg.variedadestipo, e.especiesvegetalestipo) AS h_tipo,

        COALESCE(NULLIF(vu.variedadesciclo, ''), vg.variedadesciclo, e.especiesvegetalesciclo) AS ciclo,
        COALESCE(vg.variedadesciclo, e.especiesvegetalesciclo) AS h_ciclo,

        -- Duraciones desde especiesfases (solo herencia, sin override de usuario por ahora)
        ef_germ.especiesfasesduraciondias AS diasgerminacion,
        ef_fruct.especiesfasesduraciondias AS diashastafructificacion,
        ef_trasp.especiesfasesduraciondias AS diashastatrasplante,
        ef_cosecha.especiesfasesduraciondias AS diashastarecoleccion,

        -- Campos de especie solo lectura (sin override de usuario)
        e.especiesvegetalesresistenciahelada,
        e.especiesvegetalesnecesidadtutoraje,
        e.especiesvegetalesporteplanta,
        e.especiesvegetalesrendimientoestimado,
        e.especiesvegetalespartecosechable,
        e.especiesvegetalesgerminaroscuridad,

        -- Flags de personalización (para UI: saber qué viene del usuario)
        vu.variedadesvegetalesnombre IS NOT NULL AS _p_nombre,
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
        vu.variedadesvegetalesnombrecientifico IS NOT NULL AS _p_nombrecientifico,
        vu.variedadesfamilia IS NOT NULL AS _p_familia,
        vu.variedadestipo IS NOT NULL AS _p_tipo,
        vu.variedadesciclo IS NOT NULL AS _p_ciclo

      FROM variedadesvegetales vu
      JOIN variedadesvegetales vg ON vu.xvariedadesvegetalesidvariedadorigen = vg.idvariedadesvegetales
      JOIN especiesvegetales e ON vg.xvariedadesvegetalesidespeciesvegetales = e.idespeciesvegetales
      LEFT JOIN especiesfases ef_germ ON ef_germ.xespeciesvegetalesfasesidespeciesvegetales = e.idespeciesvegetales AND ef_germ.xespeciesvegetalesfasesidfasescultivo = (SELECT idfasescultivo FROM fasescultivo WHERE fasescultivoclave = 'germinacion' LIMIT 1)
      LEFT JOIN especiesfases ef_trasp ON ef_trasp.xespeciesvegetalesfasesidespeciesvegetales = e.idespeciesvegetales AND ef_trasp.xespeciesvegetalesfasesidfasescultivo = (SELECT idfasescultivo FROM fasescultivo WHERE fasescultivoclave = 'trasplante' LIMIT 1)
      LEFT JOIN especiesfases ef_fruct ON ef_fruct.xespeciesvegetalesfasesidespeciesvegetales = e.idespeciesvegetales AND ef_fruct.xespeciesvegetalesfasesidfasescultivo = (SELECT idfasescultivo FROM fasescultivo WHERE fasescultivoclave = 'floracion' LIMIT 1)
      LEFT JOIN especiesfases ef_cosecha ON ef_cosecha.xespeciesvegetalesfasesidespeciesvegetales = e.idespeciesvegetales AND ef_cosecha.xespeciesvegetalesfasesidfasescultivo = (SELECT idfasescultivo FROM fasescultivo WHERE fasescultivoclave = 'cosecha' LIMIT 1)
      WHERE vu.idvariedadesvegetales = ? AND vu.xvariedadesvegetalesidusuarios = ?
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
      `SELECT idvariedadesvegetales FROM variedadesvegetales WHERE idvariedadesvegetales = ? AND xvariedadesvegetalesidusuarios = ?`,
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
      'variedadesvegetalesnombre', 'variedadesdescripcion', 'variedadescolor', 'variedadestamano',
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
      'variedadesvegetalesnombrecientifico', 'variedadesfamilia', 'variedadestipo', 'variedadesciclo',
      'variedadespeso1000semillas',
      'variedadesvegetalesvisibilidadsino'
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
      `UPDATE variedadesvegetales SET ${setClauses.join(', ')} WHERE idvariedadesvegetales = ? AND xvariedadesvegetalesidusuarios = ?`,
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
      `SELECT idvariedadesvegetales, xvariedadesvegetalesidvariedadorigen FROM variedadesvegetales WHERE idvariedadesvegetales = ? AND xvariedadesvegetalesidusuarios = ?`,
      [plantaId, user.id]
    );
    if (ownerCheck.length === 0) {
      return NextResponse.json({ error: 'Planta no encontrada o no te pertenece' }, { status: 404 });
    }

    const { idvariedadesvegetales, xvariedadesvegetalesidvariedadorigen } = ownerCheck[0];

    // Verificar si tiene cultivos asociados
    const [cropsCheck]: any = await pool.query(
      `SELECT idcultivos FROM cultivos WHERE xcultivosidvariedadesvegetales = ? AND xcultivosidusuarios = ? AND cultivosactivosino = 1 LIMIT 1`,
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
       WHERE (xsemillasidvariedadesvegetales = ? OR xsemillasidvariedadesvegetales = ?) 
         AND xsemillasidusuarios = ? 
         AND semillasactivosino = 1 LIMIT 1`,
      [idvariedadesvegetales, xvariedadesvegetalesidvariedadorigen, user.id]
    );

    if (seedsCheck.length > 0 || forceInactivate) {
      // Si tiene semillas o se solicita inactivación, no se elimina físicamente, se inactiva (variedadesvegetalesvisibilidadsino = 0)
      await pool.query(
        `UPDATE variedadesvegetales SET variedadesvegetalesvisibilidadsino = 0 WHERE idvariedadesvegetales = ? AND xvariedadesvegetalesidusuarios = ?`,
        [plantaId, user.id]
      );
      return NextResponse.json({ success: true, message: 'Planta inactivada de tu huerto.', inactivated: true });
    }

    // Eliminar overrides de pautas del usuario para esta planta
    await pool.query(
      `DELETE FROM laborespauta WHERE xlaborespautaidvariedadesvegetales = ? AND xlaborespautaidusuarios = ?`,
      [plantaId, user.id]
    );

    // Eliminar la variedad del usuario
    await pool.query(
      `DELETE FROM variedadesvegetales WHERE idvariedadesvegetales = ? AND xvariedadesvegetalesidusuarios = ?`,
      [plantaId, user.id]
    );

    return NextResponse.json({ success: true, message: 'Planta eliminada de tu huerto', inactivated: false });
  } catch (error: any) {
    console.error('Error deleting planta:', error);
    return NextResponse.json({ error: 'Error al eliminar la planta' }, { status: 500 });
  }
}
