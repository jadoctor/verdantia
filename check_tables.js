const mysql = require('mysql2/promise');

async function check() {
  try {
    const conn = await mysql.createConnection({
      host: '34.175.111.133',
      user: 'root',
      password: 'Verdantiaja0334&',
      database: 'semillas_db',
      ssl: { rejectUnauthorized: false }
    });
    
    const [tables] = await conn.query('SHOW TABLES');
    console.log(tables);
    
    // Check structure of any document/attachment table
    for (let row of tables) {
      const tableName = Object.values(row)[0];
      if (tableName.includes('doc') || tableName.includes('adjunt') || tableName.includes('pdf')) {
        const [desc] = await conn.query('DESCRIBE ' + tableName);
        console.log('TABLE:', tableName);
        console.log(desc);
      }
    }
    
    await conn.end();
  } catch(e) {
    console.error(e);
  }
}
check();
