import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getUserByEmail } from '@/lib/auth';

// POST /api/user/cultivos/fix-numeros — Re-numerar cultivos con números duplicados
export async function POST(request: Request) {
  const email = request.headers.get('x-user-email');
  if (!email) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const user = await getUserByEmail(email);
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  try {
    // Obtener todos los cultivos activos del usuario, ordenados por año y fecha de inicio
    const [cultivos]: any = await pool.query(
      `SELECT idcultivos, cultivosnumerocoleccion, cultivosfechainicio
       FROM cultivos 
       WHERE xcultivosidusuarios = ? 
         AND cultivosactivosino = 1
         AND cultivosestado NOT IN ('finalizado', 'perdido')
       ORDER BY cultivosfechainicio ASC, idcultivos ASC`,
      [user.id]
    );

    // Agrupar por año
    const byYear: Record<number, any[]> = {};
    for (const c of cultivos) {
      const year = c.cultivosfechainicio 
        ? new Date(c.cultivosfechainicio).getFullYear() 
        : new Date().getFullYear();
      if (!byYear[year]) byYear[year] = [];
      byYear[year].push(c);
    }

    let totalFixed = 0;

    // Para cada año, re-asignar números secuenciales sin duplicados
    for (const [year, crops] of Object.entries(byYear)) {
      const usedNumbers = new Set<number>();
      const toFix: { id: number, newNum: number }[] = [];

      // First pass: find duplicates
      for (const crop of crops) {
        const num = crop.cultivosnumerocoleccion;
        if (num && usedNumbers.has(num)) {
          // Duplicate found - needs new number
          toFix.push({ id: crop.idcultivos, newNum: 0 });
        } else if (num) {
          usedNumbers.add(num);
        }
      }

      // Second pass: assign new unique numbers to duplicates
      for (const fix of toFix) {
        let nextNum = 1;
        while (usedNumbers.has(nextNum)) {
          nextNum++;
        }
        fix.newNum = nextNum;
        usedNumbers.add(nextNum);
      }

      // Apply fixes
      for (const fix of toFix) {
        await pool.query(
          `UPDATE cultivos SET cultivosnumerocoleccion = ? WHERE idcultivos = ?`,
          [fix.newNum, fix.id]
        );
        totalFixed++;
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Se corrigieron ${totalFixed} cultivos con números duplicados.`,
      totalFixed
    });
  } catch (error: any) {
    console.error('Error fixing numeros:', error);
    return NextResponse.json({ error: 'Error al corregir números' }, { status: 500 });
  }
}
