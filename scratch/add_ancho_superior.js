const mysql = require('mysql2/promise');

async function run() {
  const conn = await mysql.createConnection({
    host: 'srv2070.hstgr.io',
    user: 'u117557593_Verdantia',
    password: 'Hostingerja0334&',
    database: 'u117557593_Verdantia'
  });

  try {
    console.log('Altering bancales table to add trapezoid top width...');
    const [cols] = await conn.query("SHOW COLUMNS FROM bancales");
    const fields = cols.map(c => c.Field);

    if (!fields.includes('bancalesanchosuperior')) {
      console.log('Adding bancalesanchosuperior column...');
      await conn.query(`
        ALTER TABLE bancales 
        ADD COLUMN bancalesanchosuperior float DEFAULT NULL
      `);
      console.log('Column bancalesanchosuperior added successfully.');
    } else {
      console.log('Column bancalesanchosuperior already exists.');
    }
    console.log('Database altered successfully!');
  } catch (error) {
    console.error('Error altering table:', error);
  } finally {
    await conn.end();
  }
}

run();
