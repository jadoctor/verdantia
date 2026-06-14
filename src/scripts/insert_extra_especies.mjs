import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'srv2070.hstgr.io',
  user: 'u117557593_Verdantia',
  password: 'Hostingerja0334&',
  database: 'u117557593_Verdantia',
});

async function run() {
  try {
    const nuevasEspecies = [
      { nombre: 'Romero', familiaId: 11, tipo: 'aromatica' }, // Lamiáceas
      { nombre: 'Mostaza', familiaId: 4, tipo: 'aromatica' }, // Crucíferas
      { nombre: 'Albahaca', familiaId: 11, tipo: 'aromatica' }, // Lamiáceas
      { nombre: 'Hisopo', familiaId: 11, tipo: 'aromatica' }, // Lamiáceas
      { nombre: 'Girasol', familiaId: 5, tipo: 'flor' }, // Compuestas
      { nombre: 'Eneldo', familiaId: 8, tipo: 'aromatica' }, // Apiáceas
      { nombre: 'Frambuesa', familiaId: 12, tipo: 'fruta' }, // Rosáceas
      { nombre: 'Nabo', familiaId: 4, tipo: 'hortaliza' }, // Crucíferas
    ];

    console.log("Iniciando inserción de nuevas especies complementarias...");
    let count = 0;

    for (const esp of nuevasEspecies) {
      const [rows] = await pool.query('SELECT idespecies FROM especies WHERE especiesnombre = ?', [esp.nombre]);
      
      if (rows.length === 0) {
        await pool.query(
          'INSERT INTO especies (especiesnombre, xespeciesidfamilias, especiestipo, especiesvisibilidadsino) VALUES (?, ?, ?, 0)',
          [esp.nombre, esp.familiaId, esp.tipo]
        );
        console.log(`✅ Insertada: ${esp.nombre} (Familia ID: ${esp.familiaId}, Tipo: ${esp.tipo}, Inactivada)`);
        count++;
      } else {
        console.log(`⚠️ Ya existe: ${esp.nombre}`);
      }
    }

    console.log(`\\nProceso completado. Se añadieron ${count} nuevas especies.`);
    
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}

run();
