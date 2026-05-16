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
        vg.variedadesnombre AS nombre_gold,
        vg.variedadesesgenerica AS es_generica,

        -- Campos con herencia triple: usuario → gold → especie
        COALESCE(vu.variedadesnombre, vg.variedadesnombre) AS nombre,
        COALESCE(vu.variedadesdescripcion, vg.variedadesdescripcion, e.especiesdescripcion) AS descripcion,
        COALESCE(vu.variedadescolor, vg.variedadescolor, e.especiescolor) AS color,
        COALESCE(vu.variedadestamano, vg.variedadestamano, e.especiestamano) AS tamano,
        COALESCE(vu.variedadesdiasgerminacion, vg.variedadesdiasgerminacion, e.especiesdiasgerminacion) AS diasgerminacion,
        COALESCE(vu.variedadesviabilidadsemilla, vg.variedadesviabilidadsemilla, e.especiesviabilidadsemilla) AS viabilidadsemilla,
        COALESCE(vu.variedadesdiashastafructificacion, vg.variedadesdiashastafructificacion, e.especiesdiashastafructificacion) AS diashastafructificacion,
        COALESCE(vu.variedadestemperaturaminima, vg.variedadestemperaturaminima, e.especiestemperaturaminima) AS temperaturaminima,
        COALESCE(vu.variedadestemperaturaoptima, vg.variedadestemperaturaoptima, e.especiestemperaturaoptima) AS temperaturaoptima,
        COALESCE(vu.variedadestemperaturamaxima, vg.variedadestemperaturamaxima, e.especiestemperaturamaxima) AS temperaturamaxima,
        COALESCE(vu.variedadesmarcoplantas, vg.variedadesmarcoplantas, e.especiesmarcoplantas) AS marcoplantas,
        COALESCE(vu.variedadesmarcofilas, vg.variedadesmarcofilas, e.especiesmarcofilas) AS marcofilas,
        COALESCE(vu.variedadesprofundidadsiembra, vg.variedadesprofundidadsiembra, e.especiesprofundidadsiembra) AS profundidadsiembra,
        COALESCE(vu.variedadesprofundidadtrasplante, vg.variedadesprofundidadtrasplante, e.especiesprofundidadtrasplante) AS profundidadtrasplante,
        COALESCE(vu.variedadeshistoria, vg.variedadeshistoria, e.especieshistoria) AS historia,
        COALESCE(vu.variedadessemillerodesde, vg.variedadessemillerodesde, e.especiesfechasemillerodesde) AS semillerodesde,
        COALESCE(vu.variedadessemillerohasta, vg.variedadessemillerohasta, e.especiesfechasemillerohasta) AS semillerohasta,
        COALESCE(vu.variedadessiembradirectadesde, vg.variedadessiembradirectadesde, e.especiesfechasiembradirectadesde) AS siembradirectadesde,
        COALESCE(vu.variedadessiembradirectahasta, vg.variedadessiembradirectahasta, e.especiesfechasiembradirectahasta) AS siembradirectahasta,
        COALESCE(vu.variedadestrasplantedesde, vg.variedadestrasplantedesde, e.especiestrasplantedesde) AS trasplantedesde,
        COALESCE(vu.variedadestrasplantehasta, vg.variedadestrasplantehasta, e.especiestrasplantehasta) AS trasplantehasta,
        COALESCE(vu.variedadesrecolecciondesde, vg.variedadesrecolecciondesde, e.especiesfecharecolecciondesde) AS recolecciondesde,
        COALESCE(vu.variedadesrecoleccionhasta, vg.variedadesrecoleccionhasta, e.especiesfecharecoleccionhasta) AS recoleccionhasta,
        COALESCE(vu.variedadesautosuficiencia, vg.variedadesautosuficiencia, e.especiesautosuficiencia) AS autosuficiencia,
        COALESCE(vu.variedadesautosuficienciaparcial, vg.variedadesautosuficienciaparcial, e.especiesautosuficienciaparcial) AS autosuficienciaparcial,
        COALESCE(vu.variedadesautosuficienciaconserva, vg.variedadesautosuficienciaconserva, e.especiesautosuficienciaconserva) AS autosuficienciaconserva,
        COALESCE(vu.variedadesdiashastatrasplante, vg.variedadesdiashastatrasplante, e.especiesdiashastatrasplante) AS diashastatrasplante,
        COALESCE(vu.variedadesdiashastarecoleccion, vg.variedadesdiashastarecoleccion, e.especiesdiashastarecoleccion) AS diashastarecoleccion,
        COALESCE(vu.variedadesicono, vg.variedadesicono, e.especiesicono) AS icono,
        COALESCE(vu.variedadesbiodinamicacategoria, vg.variedadesbiodinamicacategoria, e.especiesbiodinamicacategoria) AS biodinamicacategoria,
        COALESCE(vu.variedadesbiodinamicanotas, vg.variedadesbiodinamicanotas, e.especiesbiodinamicanotas) AS biodinamicanotas,
        COALESCE(vu.variedadeslunarfasesiembra, vg.variedadeslunarfasesiembra, e.especieslunarfasesiembra) AS lunarfasesiembra,
        COALESCE(vu.variedadeslunarfasetrasplante, vg.variedadeslunarfasetrasplante, e.especieslunarfasetrasplante) AS lunarfasetrasplante,
        COALESCE(vu.variedadeslunarobservaciones, vg.variedadeslunarobservaciones, e.especieslunarobservaciones) AS lunarobservaciones,
        COALESCE(vu.variedadesbiodinamicafasesiembra, vg.variedadesbiodinamicafasesiembra, e.especiesbiodinamicafasesiembra) AS biodinamicafasesiembra,
        COALESCE(vu.variedadesbiodinamicafasetrasplante, vg.variedadesbiodinamicafasetrasplante, e.especiesbiodinamicafasetrasplante) AS biodinamicafasetrasplante,
        COALESCE(vu.variedadesphsuelo, vg.variedadesphsuelo, e.especiesphsuelo) AS phsuelo,
        COALESCE(vu.variedadesnecesidadriego, vg.variedadesnecesidadriego, e.especiesnecesidadriego) AS necesidadriego,
        COALESCE(vu.variedadestiposiembra, vg.variedadestiposiembra, e.especiestiposiembra) AS tiposiembra,
        COALESCE(vu.variedadesvolumenmaceta, vg.variedadesvolumenmaceta, e.especiesvolumenmaceta) AS volumenmaceta,
        COALESCE(vu.variedadesluzsolar, vg.variedadesluzsolar, e.especiesluzsolar) AS luzsolar,
        COALESCE(vu.variedadescaracteristicassuelo, vg.variedadescaracteristicassuelo, e.especiescaracteristicassuelo) AS caracteristicassuelo,
        COALESCE(vu.variedadesdificultad, vg.variedadesdificultad, e.especiesdificultad) AS dificultad,

        -- Flags de personalización (para UI: saber qué viene del usuario)
        vu.variedadesnombre IS NOT NULL AS _p_nombre,
        vu.variedadesdescripcion IS NOT NULL AS _p_descripcion,
        vu.variedadescolor IS NOT NULL AS _p_color,
        vu.variedadestamano IS NOT NULL AS _p_tamano,
        vu.variedadesdiasgerminacion IS NOT NULL AS _p_diasgerminacion,
        vu.variedadestemperaturaminima IS NOT NULL AS _p_temperaturaminima,
        vu.variedadestemperaturaoptima IS NOT NULL AS _p_temperaturaoptima,
        vu.variedadestemperaturamaxima IS NOT NULL AS _p_temperaturamaxima,
        vu.variedadessemillerodesde IS NOT NULL AS _p_semillerodesde,
        vu.variedadessemillerohasta IS NOT NULL AS _p_semillerohasta,
        vu.variedadessiembradirectadesde IS NOT NULL AS _p_siembradirectadesde,
        vu.variedadessiembradirectahasta IS NOT NULL AS _p_siembradirectahasta,
        vu.variedadestrasplantedesde IS NOT NULL AS _p_trasplantedesde,
        vu.variedadestrasplantehasta IS NOT NULL AS _p_trasplantehasta,
        vu.variedadesrecolecciondesde IS NOT NULL AS _p_recolecciondesde,
        vu.variedadesrecolecciondesde IS NOT NULL AS _p_recolecciondesde,
        vu.variedadesrecoleccionhasta IS NOT NULL AS _p_recoleccionhasta,
        vu.variedadeslunarfasesiembra IS NOT NULL AS _p_lunarfasesiembra,
        vu.variedadeslunarfasetrasplante IS NOT NULL AS _p_lunarfasetrasplante,
        vu.variedadeslunarobservaciones IS NOT NULL AS _p_lunarobservaciones,
        vu.variedadesbiodinamicacategoria IS NOT NULL AS _p_biodinamicacategoria,
        vu.variedadesbiodinamicafasesiembra IS NOT NULL AS _p_biodinamicafasesiembra,
        vu.variedadesbiodinamicafasetrasplante IS NOT NULL AS _p_biodinamicafasetrasplante,
        vu.variedadesbiodinamicanotas IS NOT NULL AS _p_biodinamicanotas

      FROM variedades vu
      JOIN variedades vg ON vu.xvariedadesidvariedadorigen = vg.idvariedades
      JOIN especies e ON vg.xvariedadesidespecies = e.idespecies
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
      'variedadesdiasgerminacion', 'variedadesviabilidadsemilla', 'variedadesdiashastafructificacion',
      'variedadestemperaturaminima', 'variedadestemperaturaoptima', 'variedadestemperaturamaxima',
      'variedadesmarcoplantas', 'variedadesmarcofilas', 'variedadesprofundidadsiembra',
      'variedadesprofundidadtrasplante', 'variedadeshistoria',
      'variedadessemillerodesde', 'variedadessemillerohasta',
      'variedadessiembradirectadesde', 'variedadessiembradirectahasta',
      'variedadestrasplantedesde', 'variedadestrasplantehasta',
      'variedadesrecolecciondesde', 'variedadesrecoleccionhasta',
      'variedadesautosuficiencia', 'variedadesautosuficienciaparcial', 'variedadesautosuficienciaconserva',
      'variedadesdiashastatrasplante', 'variedadesdiashastarecoleccion',
      'variedadesicono', 'variedadesbiodinamicacategoria', 'variedadesbiodinamicanotas',
      'variedadesphsuelo', 'variedadesnecesidadriego', 'variedadestiposiembra',
      'variedadesvolumenmaceta', 'variedadesluzsolar', 'variedadescaracteristicassuelo',
      'variedadesdificultad',
      'variedadeslunarfasesiembra', 'variedadeslunarfasetrasplante', 'variedadeslunarobservaciones',
      'variedadesbiodinamicafasesiembra', 'variedadesbiodinamicafasetrasplante'
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
      `SELECT idvariedades FROM variedades WHERE idvariedades = ? AND xvariedadesidusuarios = ?`,
      [plantaId, user.id]
    );
    if (ownerCheck.length === 0) {
      return NextResponse.json({ error: 'Planta no encontrada o no te pertenece' }, { status: 404 });
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

    return NextResponse.json({ success: true, message: 'Planta eliminada de tu huerto' });
  } catch (error: any) {
    console.error('Error deleting planta:', error);
    return NextResponse.json({ error: 'Error al eliminar la planta' }, { status: 500 });
  }
}
