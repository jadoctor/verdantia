const mysql = require('mysql2/promise');

async function main() {
  const conn = await mysql.createConnection({
    host: 'srv2070.hstgr.io',
    user: 'u117557593_Verdantia',
    password: 'Hostingerja0334&',
    database: 'u117557593_Verdantia',
  });

  try {
    const [result] = await conn.query('ALTER TABLE especies ADD COLUMN xespecies_original_id INT(11) NULL AFTER idespecies');
    console.log('✅ Columna xespecies_original_id añadida exitosamente.', result);
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('La columna ya existe.');
    } else {
      console.error('Error:', error.message);
    }
  }

  await conn.end();
}

main();
