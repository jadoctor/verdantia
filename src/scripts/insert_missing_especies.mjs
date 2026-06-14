import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'srv2070.hstgr.io',
  user: 'u117557593_Verdantia',
  password: 'Hostingerja0334&',
  database: 'u117557593_Verdantia',
});

async function run() {
  try {
    // 1. Insertar familia Convolvuláceas si no existe
    const [existingFam] = await pool.query('SELECT idfamilias FROM familias WHERE familiasnombre = ?', ['Convolvuláceas']);
    let convolvulaceasId;
    if (existingFam.length === 0) {
      const [resFam] = await pool.query(`
        INSERT INTO familias (familiasnombre, familiasgruporotacion, familiasemoji, familiascolor)
        VALUES (?, ?, ?, ?)
      `, ['Convolvuláceas', 'Tubérculos', '🍠', '#9333ea']);
      convolvulaceasId = resFam.insertId;
      console.log(`Familia Convolvuláceas creada con ID: ${convolvulaceasId}`);
    } else {
      convolvulaceasId = existingFam[0].idfamilias;
    }

    // 2. Preparar especies a insertar
    const especies = [
      { nombre: 'Berenjena', familia: 1, tipo: 'hortaliza' },
      { nombre: 'Melón', familia: 2, tipo: 'fruta,hortaliza' },
      { nombre: 'Sandía', familia: 2, tipo: 'fruta,hortaliza' },
      { nombre: 'Puerro', familia: 3, tipo: 'hortaliza' },
      { nombre: 'Coliflor', familia: 4, tipo: 'hortaliza' },
      { nombre: 'Alcachofa', familia: 5, tipo: 'hortaliza' },
      { nombre: 'Escarola', familia: 5, tipo: 'hortaliza' },
      { nombre: 'Acelga', familia: 6, tipo: 'hortaliza' },
      { nombre: 'Haba', familia: 7, tipo: 'leguminosa' },
      { nombre: 'Apio', familia: 8, tipo: 'hortaliza' },
      { nombre: 'Boniato', familia: convolvulaceasId, tipo: 'hortaliza' },
    ];

    console.log("Insertando especies (inactivadas)...");
    let insertCount = 0;

    for (const esp of especies) {
      // Check if exists
      const [existing] = await pool.query('SELECT idespecies FROM especies WHERE especiesnombre = ?', [esp.nombre]);
      if (existing.length === 0) {
        await pool.query(`
          INSERT INTO especies (especiesnombre, xespeciesidfamilias, especiestipo, especiesvisibilidadsino)
          VALUES (?, ?, ?, 0)
        `, [esp.nombre, esp.familia, esp.tipo]);
        console.log(`✅ ${esp.nombre} insertada correctamente.`);
        insertCount++;
      } else {
        console.log(`⚠️ ${esp.nombre} ya existía.`);
      }
    }

    console.log(`Proceso finalizado. Se han añadido ${insertCount} nuevas especies.`);
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
run();
