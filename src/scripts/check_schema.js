const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function checkSchema() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
  });

  try {
    const [especies] = await connection.execute('SHOW COLUMNS FROM especies');
    console.log('--- ESPECIES TABLE COLUMNS ---');
    especies.forEach(col => {
      if (col.Field.includes('dias') || col.Field.includes('fase') || col.Field.includes('duracion')) {
        console.log(`${col.Field}: ${col.Type}`);
      }
    });

    const [fases] = await connection.execute('SHOW COLUMNS FROM fases_cultivo');
    console.log('\n--- FASES_CULTIVO TABLE COLUMNS ---');
    fases.forEach(col => console.log(`${col.Field}: ${col.Type}`));

    const [cultivos] = await connection.execute('SHOW COLUMNS FROM cultivos');
    console.log('\n--- CULTIVOS TABLE COLUMNS ---');
    cultivos.forEach(col => {
       if (col.Field.includes('fecha') || col.Field.includes('dias') || col.Field.includes('fase')) {
          console.log(`${col.Field}: ${col.Type}`);
       }
    });

  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

checkSchema();
