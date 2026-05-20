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

export async function PUT(request: Request, { params }: { params: Promise<{ id: string, idPauta: string }> }) {
  const resolvedParams = await params;
  const user = await authenticateSuperadmin(request);
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const idlaborespauta = resolvedParams.idPauta;
    const body = await request.json();
    const { xlaborespautaidlabores, laborespautafase, laborespautafrecuenciadias, laborespautaoffset, laborespautametodo, laborespautanotasia, laborespautaactivosino } = body;

    const query = `
      UPDATE laborespauta SET
        xlaborespautaidlabores = ?, laborespautafase = ?, laborespautafrecuenciadias = ?, 
        laborespautaoffset = ?, laborespautametodo = ?, laborespautanotasia = ?, laborespautaactivosino = ?
      WHERE idlaborespauta = ? AND xlaborespautaidespecies = ?
    `;

    const queryParams = [
      xlaborespautaidlabores, laborespautafase, laborespautafrecuenciadias || null, 
      laborespautaoffset || 0, laborespautametodo || 'ambos', laborespautanotasia || null, laborespautaactivosino, idlaborespauta, resolvedParams.id
    ];

    await pool.query(query, queryParams);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating pauta:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: 'Ya existe una pauta para esta labor en esta fase.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error al actualizar la pauta' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string, idPauta: string }> }) {
  const resolvedParams = await params;
  const user = await authenticateSuperadmin(request);
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const idlaborespauta = resolvedParams.idPauta;
    
    // First check if the pauta is used by any crop of this species
    let isUsed = false;
    try {
      // Get pauta details
      const [pautas]: any = await pool.query('SELECT * FROM laborespauta WHERE idlaborespauta = ? LIMIT 1', [idlaborespauta]);
      if (pautas && pautas.length > 0) {
        const pauta = pautas[0];
        
        // Fetch crops
        const [crops]: any = await pool.query(`
          SELECT c.idcultivos, c.cultivosfechacreacion, c.cultivosfechainicio 
          FROM cultivos c 
          JOIN variedades vu ON c.xcultivosidvariedades = vu.idvariedades
          LEFT JOIN variedades vg ON vu.xvariedadesidvariedadorigen = vg.idvariedades
          WHERE (vu.xvariedadesidespecies = ? OR vg.xvariedadesidespecies = ?)
        `, [resolvedParams.id, resolvedParams.id]);

        // Fetch completed
        const [real]: any = await pool.query(`
          SELECT 1 
          FROM laboresrealizadas lr
          JOIN cultivos c ON lr.xlaboresrealizadasidcultivos = c.idcultivos
          JOIN variedades vu ON c.xcultivosidvariedades = vu.idvariedades
          LEFT JOIN variedades vg ON vu.xvariedadesidvariedadorigen = vg.idvariedades
          WHERE (vu.xvariedadesidespecies = ? OR vg.xvariedadesidespecies = ?)
          AND lr.xlaboresrealizadasidlabores = ?
          LIMIT 1
        `, [resolvedParams.id, resolvedParams.id, pauta.xlaborespautaidlabores]);

        if (real && real.length > 0) {
          isUsed = true;
        } else if (crops && crops.length > 0) {
          const now = Date.now();
          const DAY_MS = 86400000;
          for (const c of crops) {
            const tRegistro = new Date(c.cultivosfechacreacion).getTime();
            const baseTs = c.cultivosfechainicio ? new Date(c.cultivosfechainicio).getTime() : tRegistro;
            const pautaTs = Math.max(tRegistro, baseTs + (pauta.laborespautaoffset || 0) * DAY_MS);
            if (now >= pautaTs) {
              isUsed = true;
              break;
            }
          }
        }
      }
    } catch (e) {
      console.error('Error checking precise crop usage for DELETE:', e);
      isUsed = true; // Fallback safely to prevent accidental hard deletes
    }

    if (isUsed) {
      // Soft delete: set to inactive instead of physically deleting
      await pool.query('UPDATE laborespauta SET laborespautaactivosino = 0 WHERE idlaborespauta = ? AND xlaborespautaidespecies = ?', [idlaborespauta, resolvedParams.id]);
      return NextResponse.json({ success: true, message: 'La labor está en uso y ha sido marcada como inactiva.' });
    } else {
      // Hard delete
      await pool.query('DELETE FROM laborespauta WHERE idlaborespauta = ? AND xlaborespautaidespecies = ?', [idlaborespauta, resolvedParams.id]);
      return NextResponse.json({ success: true });
    }
  } catch (error: any) {
    console.error('Error deleting pauta:', error);
    return NextResponse.json({ error: 'Error al eliminar la pauta' }, { status: 500 });
  }
}
