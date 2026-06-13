import mysql from 'mysql2/promise';

async function run() {
  const connection = await mysql.createConnection({
    host: '34.175.111.133',
    user: 'root',
    password: 'Verdantiaja0334&',
    database: 'semillas_db',
    port: 3306,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const [especies] = await connection.execute('SHOW COLUMNS FROM especies');
    console.log('--- ESPECIES TABLE COLUMNS ---');
    especies.forEach(col => {
      if (col.Field.includes('dias') || col.Field.includes('fase') || col.Field.includes('duracion') || col.Field.includes('tiempo')) {
        console.log(`${col.Field}: ${col.Type}`);
      }
    });

    const [fases] = await connection.execute('SHOW COLUMNS FROM fases_cultivo');
    console.log('\n--- FASES_CULTIVO TABLE COLUMNS ---');
    fases.forEach(col => console.log(`${col.Field}: ${col.Type}`));

  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

run();
