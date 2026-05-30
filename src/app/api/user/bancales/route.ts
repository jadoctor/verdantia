import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getUserByEmail } from '@/lib/auth';

// Helper to determine max cultivation space based on subscription plan name
export function getPlanMaxSpace(suscripcionName: string): number {
  const cleanName = suscripcionName?.toLowerCase() || '';
  if (cleanName.includes('premium')) return 1000;
  if (cleanName.includes('avanzado')) return 200;
  if (cleanName.includes('esencial')) return 50;
  return 10; // Gratuito / Básica
}

// Helper to calculate area of active crops
async function getSpaceUsage(userId: number) {
  const [crops]: any[] = await pool.query(`
    SELECT 
      c.idcultivos,
      c.cultivoscantidad,
      c.xcultivosidbancales,
      COALESCE(e.especiesmarcoplantas, 30) AS especiesmarcoplantas,
      COALESCE(e.especiesmarcofilas, 30) AS especiesmarcofilas
    FROM cultivos c
    JOIN variedades vu ON c.xcultivosidvariedades = vu.idvariedades
    LEFT JOIN variedades vg ON vu.xvariedadesidvariedadorigen = vg.idvariedades
    JOIN especies e ON vg.xvariedadesidespecies = e.idespecies OR vu.xvariedadesidespecies = e.idespecies
    WHERE c.xcultivosidusuarios = ? 
      AND c.cultivosactivosino = 1 
      AND c.cultivosestado NOT IN ('finalizado', 'perdido')
  `, [userId]);

  let totalUsed = 0;
  const usedPerBancal: Record<string | number, number> = {};

  for (const crop of crops) {
    // Area in square meters = cantidad * (marcoplantas/100) * (marcofilas/100)
    const area = crop.cultivoscantidad * (crop.especiesmarcoplantas / 100) * (crop.especiesmarcofilas / 100);
    totalUsed += area;

    const key = crop.xcultivosidbancales || 'estandar';
    usedPerBancal[key] = (usedPerBancal[key] || 0) + area;
  }

  return {
    totalUsed: Math.round(totalUsed * 100) / 100,
    usedPerBancal
  };
}

// GET /api/user/bancales — Listar bancales y consultar límites
export async function GET(request: Request) {
  const email = request.headers.get('x-user-email');
  if (!email) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const user = await getUserByEmail(email);
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  try {
    // Obtener los bancales reales
    const [bancales]: any[] = await pool.query(
      `SELECT * FROM bancales WHERE xbancalesidusuarios = ? ORDER BY idbancales ASC`,
      [user.id]
    );

    const maxSpace = getPlanMaxSpace(user.suscripcion);
    const { totalUsed, usedPerBancal } = await getSpaceUsage(user.id);

    return NextResponse.json({
      bancales,
      maxSpace,
      usedSpace: totalUsed,
      usedPerBancal,
      suscripcion: user.suscripcion
    });
  } catch (error: any) {
    console.error('Error fetching bancales:', error);
    return NextResponse.json({ error: 'Error al obtener bancales' }, { status: 500 });
  }
}

// POST /api/user/bancales — Crear un nuevo bancal real
export async function POST(request: Request) {
  const email = request.headers.get('x-user-email');
  if (!email) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const user = await getUserByEmail(email);
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  try {
    // Verificar límite estricto de 4 bancales reales
    const [countRows]: any[] = await pool.query(
      `SELECT COUNT(*) as count FROM bancales WHERE xbancalesidusuarios = ?`,
      [user.id]
    );
    if (countRows[0].count >= 4) {
      return NextResponse.json({ error: 'Límite alcanzado: solo puedes definir un máximo de 4 bancales reales.' }, { status: 400 });
    }

    const body = await request.json();
    const {
      bancalesnombre,
      bancalesancho,
      bancalesanchosuperior,
      bancaleslargo,
      bancalesforma,
      bancalessigpacprovincia,
      bancalessigpacmunicipio,
      bancalessigpacpoligono,
      bancalessigpacparcela,
      bancalessigpacrecinto,
      bancalessigpacsuperficie
    } = body;

    if (!bancalesnombre) {
      return NextResponse.json({ error: 'El nombre del bancal es obligatorio' }, { status: 400 });
    }

    const ancho = parseFloat(bancalesancho);
    const anchoSuperior = bancalesanchosuperior ? parseFloat(bancalesanchosuperior) : null;
    const largo = parseFloat(bancaleslargo);
    if (isNaN(ancho) || ancho <= 0 || isNaN(largo) || largo <= 0) {
      return NextResponse.json({ error: 'El ancho y largo del bancal deben ser mayores que cero' }, { status: 400 });
    }

    const [result]: any = await pool.query(
      `INSERT INTO bancales (
        xbancalesidusuarios,
        bancalesnombre,
        bancalesancho,
        bancalesanchosuperior,
        bancaleslargo,
        bancalesforma,
        bancalessigpacprovincia,
        bancalessigpacmunicipio,
        bancalessigpacpoligono,
        bancalessigpacparcela,
        bancalessigpacrecinto,
        bancalessigpacsuperficie
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user.id,
        bancalesnombre,
        ancho,
        anchoSuperior,
        largo,
        bancalesforma || 'rectangular',
        bancalessigpacprovincia || null,
        bancalessigpacmunicipio || null,
        bancalessigpacpoligono || null,
        bancalessigpacparcela || null,
        bancalessigpacrecinto || null,
        bancalessigpacsuperficie ? parseFloat(bancalessigpacsuperficie) : null
      ]
    );

    return NextResponse.json({
      success: true,
      id: result.insertId,
      message: 'Bancal creado correctamente'
    });
  } catch (error: any) {
    console.error('Error creating bancal:', error);
    return NextResponse.json({ error: 'Error al crear el bancal' }, { status: 500 });
  }
}

// PUT /api/user/bancales — Actualizar un bancal real
export async function PUT(request: Request) {
  const email = request.headers.get('x-user-email');
  if (!email) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const user = await getUserByEmail(email);
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  try {
    const body = await request.json();
    const {
      idbancales,
      bancalesnombre,
      bancalesancho,
      bancalesanchosuperior,
      bancaleslargo,
      bancalesforma,
      bancalessigpacprovincia,
      bancalessigpacmunicipio,
      bancalessigpacpoligono,
      bancalessigpacparcela,
      bancalessigpacrecinto,
      bancalessigpacsuperficie
    } = body;

    if (!idbancales) {
      return NextResponse.json({ error: 'El idbancales es obligatorio' }, { status: 400 });
    }

    // Verificar pertenencia
    const [checkRows]: any[] = await pool.query(
      `SELECT * FROM bancales WHERE idbancales = ? AND xbancalesidusuarios = ?`,
      [idbancales, user.id]
    );
    if (checkRows.length === 0) {
      return NextResponse.json({ error: 'Bancal no encontrado o no pertenece a tu usuario' }, { status: 404 });
    }

    if (!bancalesnombre) {
      return NextResponse.json({ error: 'El nombre del bancal es obligatorio' }, { status: 400 });
    }

    const ancho = parseFloat(bancalesancho);
    const anchoSuperior = bancalesanchosuperior ? parseFloat(bancalesanchosuperior) : null;
    const largo = parseFloat(bancaleslargo);
    if (isNaN(ancho) || ancho <= 0 || isNaN(largo) || largo <= 0) {
      return NextResponse.json({ error: 'El ancho y largo del bancal deben ser mayores que cero' }, { status: 400 });
    }

    await pool.query(
      `UPDATE bancales SET
        bancalesnombre = ?,
        bancalesancho = ?,
        bancalesanchosuperior = ?,
        bancaleslargo = ?,
        bancalesforma = ?,
        bancalessigpacprovincia = ?,
        bancalessigpacmunicipio = ?,
        bancalessigpacpoligono = ?,
        bancalessigpacparcela = ?,
        bancalessigpacrecinto = ?,
        bancalessigpacsuperficie = ?
      WHERE idbancales = ? AND xbancalesidusuarios = ?`,
      [
        bancalesnombre,
        ancho,
        anchoSuperior,
        largo,
        bancalesforma || 'rectangular',
        bancalessigpacprovincia || null,
        bancalessigpacmunicipio || null,
        bancalessigpacpoligono || null,
        bancalessigpacparcela || null,
        bancalessigpacrecinto || null,
        bancalessigpacsuperficie ? parseFloat(bancalessigpacsuperficie) : null,
        idbancales,
        user.id
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Bancal actualizado correctamente'
    });
  } catch (error: any) {
    console.error('Error updating bancal:', error);
    return NextResponse.json({ error: 'Error al actualizar el bancal' }, { status: 500 });
  }
}

// DELETE /api/user/bancales — Eliminar un bancal real
export async function DELETE(request: Request) {
  const email = request.headers.get('x-user-email');
  if (!email) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const user = await getUserByEmail(email);
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  try {
    const url = new URL(request.url);
    let idbancales = url.searchParams.get('idbancales');

    // Intentar leer del body si no está en query params
    if (!idbancales) {
      try {
        const body = await request.json();
        idbancales = body.idbancales;
      } catch {}
    }

    if (!idbancales) {
      return NextResponse.json({ error: 'El idbancales es obligatorio' }, { status: 400 });
    }

    // Verificar pertenencia
    const [checkRows]: any[] = await pool.query(
      `SELECT * FROM bancales WHERE idbancales = ? AND xbancalesidusuarios = ?`,
      [idbancales, user.id]
    );
    if (checkRows.length === 0) {
      return NextResponse.json({ error: 'Bancal no encontrado o no pertenece a tu usuario' }, { status: 404 });
    }

    // El ON DELETE SET NULL de la clave foránea se encargará de desacoplar los cultivos sin eliminarlos.
    await pool.query(
      `DELETE FROM bancales WHERE idbancales = ? AND xbancalesidusuarios = ?`,
      [idbancales, user.id]
    );

    return NextResponse.json({
      success: true,
      message: 'Bancal eliminado correctamente. Los cultivos asociados se han movido al Bancal Estándar.'
    });
  } catch (error: any) {
    console.error('Error deleting bancal:', error);
    return NextResponse.json({ error: 'Error al eliminar el bancal' }, { status: 500 });
  }
}
