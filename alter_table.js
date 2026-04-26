const mysql = require('C:/Users/jaill/Documents/SEMILLAS_15_04_2026/verdantia-nextjs/node_modules/mysql2/promise');

async function run() {
  try {
    const connection = await mysql.createConnection({
      host: '34.175.111.133',
      user: 'root',
      password: 'Verdantiaja0334&',
      database: 'semillas_db',
      ssl: {
        rejectUnauthorized: false
      }
    });
    // Ignorar error si ya existe
    try {
      await connection.execute("ALTER TABLE usuarios ADD COLUMN usuariostipocalendario ENUM('Normal', 'Lunar', 'Biodinámico') DEFAULT 'Normal'");
      console.log('Columna añadida con éxito');
    } catch(e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('La columna ya existe');
      } else {
        throw e;
      }
    }
    await connection.end();
  } catch(e) {
    console.log('Error:', e.message);
  }
}
run();
