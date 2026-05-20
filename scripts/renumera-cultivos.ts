import pool from '../src/lib/db';

async function main() {
  try {
    // Primero, limpiar los números de los cultivos inactivos para evitar conflictos
    await pool.query('UPDATE cultivos SET cultivosnumerocoleccion = NULL WHERE cultivosactivosino = 0');

    // Obtener solo los cultivos activos ordenados por usuario y fecha
    const [cultivos]: any = await pool.query(
      `SELECT idcultivos, xcultivosidusuarios 
       FROM cultivos 
       WHERE cultivosactivosino = 1
       ORDER BY xcultivosidusuarios ASC, idcultivos ASC`
    );

    let currentUserId = null;
    let currentNum = 1;
    let updated = 0;

    for (const c of cultivos) {
      if (c.xcultivosidusuarios !== currentUserId) {
        currentUserId = c.xcultivosidusuarios;
        currentNum = 1;
      }

      await pool.query(
        'UPDATE cultivos SET cultivosnumerocoleccion = ? WHERE idcultivos = ?',
        [currentNum, c.idcultivos]
      );
      
      currentNum++;
      updated++;
    }

    console.log(`Renumerados ${updated} cultivos activos a nivel de usuario con éxito.`);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit(0);
  }
}

main();
