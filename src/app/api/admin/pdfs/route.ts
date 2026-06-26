import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getUserByEmail } from '@/lib/auth';

export async function GET(request: Request) {
  const email = request.headers.get('x-user-email');
  if (!email) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  
  const user = await getUserByEmail(email);
  if (!user || !user.roles?.includes('superadministrador')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const query = `
      SELECT 
        d.iddatosadjuntos as id,
        d.datosadjuntosruta as ruta,
        d.datosadjuntostitulo as titulo,
        d.datosadjuntosnombreoriginal as nombreOriginal,
        d.datosadjuntosactivo as activo,
        d.datosadjuntosfechacreacion as fecha,
        d.datosadjuntosportada as portada,
        e.idespecies, e.especiesnombre as especieNombre,
        v.idvariedades, v.variedadesnombre as variedadNombre,
        l.idlabores, l.laboresnombre as laborNombre,
        a.idafecciones, a.afeccionesnombre as afeccionNombre,
        t.idtratamientos, t.tratamientosnombre as tratamientoNombre,
        p.idplantasparte, p.plantaspartenombre as plantaParteNombre,
        (SELECT COUNT(*) FROM blog b WHERE JSON_UNQUOTE(JSON_EXTRACT(b.blogcontenido, '$.pdf_source_id')) = d.iddatosadjuntos) as blogsAsociados
      FROM datosadjuntos d
      LEFT JOIN especies e ON d.xdatosadjuntosidespecies = e.idespecies
      LEFT JOIN variedades v ON d.xdatosadjuntosidvariedades = v.idvariedades
      LEFT JOIN labores l ON d.xdatosadjuntosidlabores = l.idlabores
      LEFT JOIN afecciones a ON d.xdatosadjuntosidafecciones = a.idafecciones
      LEFT JOIN tratamientos t ON d.xdatosadjuntosidtratamientos = t.idtratamientos
      LEFT JOIN plantasparte p ON d.xdatosadjuntosidplantasparte = p.idplantasparte
      WHERE d.datosadjuntostipo = 'documento'
      ORDER BY d.datosadjuntosfechacreacion DESC
    `;
    
    const [rows] = await pool.query(query);
    
    const pdfs = (rows as any[]).map(r => {
      let entityType = 'Desconocido';
      let entityName = 'Desconocido';
      let entityId = null;
      let urlContext = '';

      if (r.idespecies) {
        entityType = 'Especie';
        entityName = r.especieNombre;
        entityId = r.idespecies;
        urlContext = `/dashboard/admin/especies/${r.idespecies}?tab=pdfs`;
      } else if (r.idvariedades) {
        entityType = 'Variedad';
        entityName = r.variedadNombre;
        entityId = r.idvariedades;
        urlContext = `/dashboard/admin/variedades/${r.idvariedades}?tab=pdfs`;
      } else if (r.idlabores) {
        entityType = 'Labor';
        entityName = r.laborNombre;
        entityId = r.idlabores;
        urlContext = `/dashboard/admin/labores/${r.idlabores}?tab=pdfs`;
      } else if (r.idafecciones) {
        entityType = 'Afección';
        entityName = r.afeccionNombre;
        entityId = r.idafecciones;
        urlContext = `/dashboard/admin/afecciones/${r.idafecciones}?tab=pdfs`;
      } else if (r.idtratamientos) {
        entityType = 'Tratamiento';
        entityName = r.tratamientoNombre;
        entityId = r.idtratamientos;
        urlContext = `/dashboard/admin/tratamientos/${r.idtratamientos}?tab=pdfs`;
      } else if (r.idplantasparte) {
        entityType = 'Planta Parte';
        entityName = r.plantaParteNombre;
        entityId = r.idplantasparte;
        urlContext = `/dashboard/admin/tareas/plantasparte/${r.idplantasparte}?tab=pdfs`;
      }

      return {
        id: r.id,
        ruta: r.ruta,
        titulo: r.titulo || r.nombreOriginal || 'Sin título',
        nombreOriginal: r.nombreOriginal,
        portada: r.portada,
        activo: r.activo === 1,
        fecha: r.fecha,
        entityType,
        entityName,
        entityId,
        urlContext,
        blogsAsociados: r.blogsAsociados
      };
    });

    return NextResponse.json({ pdfs });
  } catch (error: any) {
    console.error('Error fetching global PDFs:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const email = request.headers.get('x-user-email');
  if (!email) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  
  const user = await getUserByEmail(email);
  if (!user || !user.roles?.includes('superadministrador')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const { id, action } = await request.json();

    if (!id || !action) {
      return NextResponse.json({ error: 'ID y action requeridos' }, { status: 400 });
    }

    if (action === 'toggleActive') {
      await pool.query('UPDATE datosadjuntos SET datosadjuntosactivo = NOT datosadjuntosactivo WHERE iddatosadjuntos = ? AND datosadjuntostipo = "documento"', [id]);
      return NextResponse.json({ success: true, message: 'Estado actualizado' });
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
  } catch (error: any) {
    console.error('Error updating PDF status:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const email = request.headers.get('x-user-email');
  if (!email) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  
  const user = await getUserByEmail(email);
  if (!user || !user.roles?.includes('superadministrador')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const pdfId = searchParams.get('id');

  if (!pdfId) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });

  try {
    const [rows] = await pool.query(
      'SELECT datosadjuntosruta, datosadjuntosportada FROM datosadjuntos WHERE iddatosadjuntos = ? AND datosadjuntostipo = "documento"',
      [pdfId]
    );
    
    if ((rows as any[]).length > 0) {
      const file = (rows as any[])[0];
      const { deleteFromStorage } = await import('@/lib/firebase/storage');
      
      // Delete PDF from storage
      if (file.datosadjuntosruta && file.datosadjuntosruta.startsWith('uploads/')) {
        await deleteFromStorage(file.datosadjuntosruta);
      }
      
      // Delete Cover from storage
      if (file.datosadjuntosportada && file.datosadjuntosportada.startsWith('uploads/')) {
        await deleteFromStorage(file.datosadjuntosportada);
      }
    }

    await pool.query(
      'DELETE FROM datosadjuntos WHERE iddatosadjuntos = ? AND datosadjuntostipo = "documento"',
      [pdfId]
    );
    
    return NextResponse.json({ success: true, message: 'PDF eliminado físicamente' });
  } catch (error: any) {
    console.error('Error deleting PDF:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
