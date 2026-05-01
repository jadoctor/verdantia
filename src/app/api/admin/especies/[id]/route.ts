import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getUserByEmail } from '@/lib/auth';

async function authenticateSuperadmin(request: Request) {
  const email = request.headers.get('x-user-email');
  if (!email) return null;
  const user = await getUserByEmail(email);
  if (!user || !user.roles?.includes('superadministrador')) return null;
  return user;
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const user = await authenticateSuperadmin(request);
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const [rows]: any = await pool.query('SELECT * FROM especies WHERE idespecies = ?', [resolvedParams.id]);
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Especie no encontrada' }, { status: 404 });
    }
    return NextResponse.json({ especie: rows[0] });
  } catch (error: any) {
    console.error('Error fetching especie:', error);
    return NextResponse.json({ error: 'Error al obtener especie' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const user = await authenticateSuperadmin(request);
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const idespecies = resolvedParams.id;
    const body = await request.json();
    const {
      especiesnombre,
      especiesnombrecientifico,
      especiesfamilia,
      especiestipo,
      especiesciclo,
      especiesdiasgerminacion,
      especiesdiashastatrasplante,
      especiesviabilidadsemilla,
      especiesdiashastafructificacion,
      especiestemperaturaminima,
      especiestemperaturaoptima,
      especiesmarcoplantas,
      especiesmarcofilas,
      especiesprofundidadsiembra,
      especieshistoria,
      especiesdescripcion,
      especiescolor,
      especiestamano,
      especiesfechasemillerodesde,
      especiesfechasemillerohasta,
      especiesfechasiembradirectadesde,
      especiesfechasiembradirectahasta,
      especiestrasplantedesde,
      especiestrasplantehasta,
      especiesfecharecolecciondesde,
      especiesfecharecoleccionhasta,
      especiesvisibilidadsino,
      especiesfuentesinformacion,
      especiesautosuficiencia,
      especiesautosuficienciaconserva,
      especiesicono,
      especiesbiodinamicacategoria,
      especiesbiodinamicanotas,
      especiesprofundidadtrasplante,
      especiesphsuelo,
      especiesnecesidadriego,
      especiestiposiembra,
      especiesvolumenmaceta,
      especiesluzsolar,
      especiescaracteristicassuelo,
      especiesdificultad,
      especiestemperaturamaxima
    } = body;

    if (!especiesnombre) {
      return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 });
    }

    const query = `
      UPDATE especies SET
        especiesnombre = ?, especiesnombrecientifico = ?, especiesfamilia = ?, especiestipo = ?, especiesciclo = ?, 
        especiesdiasgerminacion = ?, especiesdiashastatrasplante = ?, especiesviabilidadsemilla = ?, especiesdiashastafructificacion = ?, 
        especiestemperaturaminima = ?, especiestemperaturaoptima = ?, especiesmarcoplantas = ?, especiesmarcofilas = ?, 
        especiesprofundidadsiembra = ?, especieshistoria = ?, especiesdescripcion = ?, especiescolor = ?, especiestamano = ?, 
        especiesfechasemillerodesde = ?, especiesfechasemillerohasta = ?, especiesfechasiembradirectadesde = ?, 
        especiesfechasiembradirectahasta = ?, especiestrasplantedesde = ?, especiestrasplantehasta = ?, 
        especiesfecharecolecciondesde = ?, especiesfecharecoleccionhasta = ?, especiesvisibilidadsino = ?, 
        especiesfuentesinformacion = ?, especiesautosuficiencia = ?, especiesautosuficienciaconserva = ?, especiesicono = ?,
        especiesbiodinamicacategoria = ?, especiesbiodinamicanotas = ?,
        especiesprofundidadtrasplante = ?, especiesphsuelo = ?, especiesnecesidadriego = ?, especiestiposiembra = ?,
        especiesvolumenmaceta = ?, especiesluzsolar = ?, especiescaracteristicassuelo = ?, especiesdificultad = ?,
        especiestemperaturamaxima = ?
      WHERE idespecies = ?
    `;

    const queryParams = [
      especiesnombre,
      especiesnombrecientifico || null,
      especiesfamilia || null,
      Array.isArray(especiestipo) ? especiestipo.join(',') : (especiestipo || null),
      Array.isArray(especiesciclo) ? especiesciclo.join(',') : (especiesciclo || null),
      especiesdiasgerminacion || null,
      especiesdiashastatrasplante || null,
      especiesviabilidadsemilla || null,
      especiesdiashastafructificacion || null,
      especiestemperaturaminima || null,
      especiestemperaturaoptima || null,
      especiesmarcoplantas || null,
      especiesmarcofilas || null,
      especiesprofundidadsiembra || null,
      especieshistoria || null,
      especiesdescripcion || null,
      especiescolor || null,
      especiestamano || 'mediano',
      especiesfechasemillerodesde || null,
      especiesfechasemillerohasta || null,
      especiesfechasiembradirectadesde || null,
      especiesfechasiembradirectahasta || null,
      especiestrasplantedesde || null,
      especiestrasplantehasta || null,
      especiesfecharecolecciondesde || null,
      especiesfecharecoleccionhasta || null,
      especiesvisibilidadsino !== undefined ? especiesvisibilidadsino : 1,
      especiesfuentesinformacion || null,
      especiesautosuficiencia || null,
      especiesautosuficienciaconserva || null,
      especiesicono || null,
      especiesbiodinamicacategoria || null,
      especiesbiodinamicanotas || null,
      especiesprofundidadtrasplante || null,
      especiesphsuelo || null,
      especiesnecesidadriego || null,
      especiestiposiembra || null,
      especiesvolumenmaceta || null,
      especiesluzsolar || null,
      especiescaracteristicassuelo || null,
      especiesdificultad || null,
      especiestemperaturamaxima || null,
      idespecies
    ];

    await pool.query(query, queryParams);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating especie:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: 'Ya existe una especie con ese nombre.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error al actualizar especie' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const user = await authenticateSuperadmin(request);
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const idespecies = resolvedParams.id;
    // La base de datos asume borrado en cascada para variedades y datos adjuntos 
    // o deberíamos borrarlos a mano si no existe la restricción en la base de datos.
    await pool.query('DELETE FROM especies WHERE idespecies = ?', [idespecies]);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting especie:', error);
    return NextResponse.json({ error: 'Error al eliminar especie. Posible violación de integridad referencial.' }, { status: 500 });
  }
}
