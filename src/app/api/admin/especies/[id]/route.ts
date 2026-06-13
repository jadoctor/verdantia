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
    
    const especie = rows[0];
    const [fases]: any = await pool.query('SELECT xespeciesfasesidfasescultivo as idFase, especiesfasesduraciondias as duracion FROM especiesfases WHERE xespeciesfasesidespecies = ?', [resolvedParams.id]);
    
    // Transform array to a map for easy frontend usage: { "1": 15, "2": 5 }
    especie.fases_duracion = {};
    for (const f of fases) {
      especie.fases_duracion[f.idFase] = f.duracion;
    }

    return NextResponse.json({ especie });
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

    if (Object.keys(body).length === 0) {
      return NextResponse.json({ success: true });
    }

    const setClauses: string[] = [];
    const queryParams: any[] = [];

    for (const [key, value] of Object.entries(body)) {
      setClauses.push(`${key} = ?`);
      if (Array.isArray(value)) {
        queryParams.push(value.join(','));
      } else {
        queryParams.push(value === '' ? null : value);
      }
    }
    queryParams.push(idespecies);

    const query = `UPDATE especies SET ${setClauses.join(', ')} WHERE idespecies = ?`;
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

    // Check if the species has non-generic varieties
    const [vars]: any = await pool.query(
      'SELECT 1 FROM variedades WHERE xvariedadesidespecies = ? AND variedadesesgenerica = 0 LIMIT 1',
      [idespecies]
    );

    // Check if the species has any seeds associated with its varieties
    const [seeds]: any = await pool.query(
      'SELECT 1 FROM semillas s JOIN variedades v ON s.xsemillasidvariedades = v.idvariedades WHERE v.xvariedadesidespecies = ? LIMIT 1',
      [idespecies]
    );

    // Check if the species has any crops associated with its varieties
    const [cultivos]: any = await pool.query(
      'SELECT 1 FROM cultivos c JOIN variedades v ON c.xcultivosidvariedades = v.idvariedades WHERE v.xvariedadesidespecies = ? LIMIT 1',
      [idespecies]
    );

    // Check if the species belongs directly to a user
    const [owner]: any = await pool.query(
      'SELECT 1 FROM especies WHERE idespecies = ? AND xespeciesidusuarios IS NOT NULL LIMIT 1',
      [idespecies]
    );

    // Check if the species is customized by any user in especiesusuarios
    const [espUsers]: any = await pool.query(
      'SELECT 1 FROM especiesusuarios WHERE xespeciesusuariosidespecies = ? LIMIT 1',
      [idespecies]
    );

    // Check if any varieties of the species are customized in variedadesusuarios
    const [varUsers]: any = await pool.query(
      'SELECT 1 FROM variedadesusuarios vu JOIN variedades v ON vu.xvariedadesusuariosidvariedades = v.idvariedades WHERE v.xvariedadesidespecies = ? LIMIT 1',
      [idespecies]
    );

    // Check if the species has any associated pests
    const [plagas]: any = await pool.query(
      'SELECT 1 FROM especiesplagas WHERE xespeciesplagasidespecies = ? LIMIT 1',
      [idespecies]
    );

    // Check if the species has any beneficial associations
    const [beneficiosas]: any = await pool.query(
      'SELECT 1 FROM asociacionesbeneficiosas WHERE xasociacionesbeneficiosasidespecieorigen = ? OR xasociacionesbeneficiosasidespeciedestino = ? LIMIT 1',
      [idespecies]
    );

    // Check if the species has any harmful associations
    const [perjudiciales]: any = await pool.query(
      'SELECT 1 FROM asociacionesperjudiciales WHERE xasociacionesperjudicialesidespecieorigen = ? OR xasociacionesperjudicialesidespeciedestino = ? LIMIT 1',
      [idespecies]
    );

    if (
      vars.length > 0 || 
      seeds.length > 0 || 
      cultivos.length > 0 || 
      owner.length > 0 || 
      espUsers.length > 0 || 
      varUsers.length > 0 || 
      plagas.length > 0 || 
      beneficiosas.length > 0 || 
      perjudiciales.length > 0
    ) {
      // Inactivate instead of physical delete
      await pool.query('UPDATE especies SET especiesvisibilidadsino = 0 WHERE idespecies = ?', [idespecies]);
      return NextResponse.json({ 
        success: true, 
        inactivated: true, 
        message: 'La especie cuenta con dependencias activas (variedades, semillas, cultivos, personalizaciones de usuarios, plagas o asociaciones), por lo que ha sido inhabilitada en lugar de eliminada.' 
      });
    }

    // Delete associated generic varieties first to satisfy foreign key constraints
    await pool.query('DELETE FROM variedades WHERE xvariedadesidespecies = ?', [idespecies]);

    // Otherwise, perform physical delete
    await pool.query('DELETE FROM especies WHERE idespecies = ?', [idespecies]);
    return NextResponse.json({ success: true, inactivated: false, message: 'Especie eliminada correctamente.' });
  } catch (error: any) {
    console.error('Error deleting especie:', error);
    return NextResponse.json({ error: 'Error al eliminar especie. Posible violación de integridad referencial.' }, { status: 500 });
  }
}
