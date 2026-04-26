const mysql = require('mysql2/promise');

async function migrate() {
  try {
    const conn = await mysql.createConnection({
      host: '34.175.111.133',
      user: 'root',
      password: 'Verdantiaja0334&',
      database: 'semillas_db',
      ssl: { rejectUnauthorized: false }
    });
    
    console.log('Connected to DB. Attempting to add columns...');
    try {
      await conn.query('ALTER TABLE especies ADD COLUMN especiesbiodinamicacategoria VARCHAR(50) DEFAULT NULL AFTER especiesicono');
      console.log('Column especiesbiodinamicacategoria added.');
    } catch(e) {
      if (e.code === 'ER_DUP_FIELDNAME') console.log('Column especiesbiodinamicacategoria already exists.');
      else throw e;
    }
    
    try {
      await conn.query('ALTER TABLE especies ADD COLUMN especiesbiodinamicanotas TEXT DEFAULT NULL AFTER especiesbiodinamicacategoria');
      console.log('Column especiesbiodinamicanotas added.');
    } catch(e) {
      if (e.code === 'ER_DUP_FIELDNAME') console.log('Column especiesbiodinamicanotas already exists.');
      else throw e;
    }
    
    await conn.end();
    console.log('Migration completed successfully.');
  } catch(e) {
    console.error('Migration failed:', e);
  }
}
migrate();
