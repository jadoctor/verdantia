const fs = require('fs');
const mysql = require('mysql2/promise');

async function check() {
  const envContent = fs.readFileSync('.env.local', 'utf-8');
  const env = {};
  envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if(parts.length >= 2) env[parts[0].trim()] = parts[1].trim();
  });

  try {
    const conn = await mysql.createConnection({
      host: env.DB_HOST,
      user: env.DB_USER,
      password: env.DB_PASSWORD,
      database: env.DB_NAME
    });
    
    try {
      await conn.query('SELECT especiesbiodinamicacategoria FROM especies LIMIT 1');
      console.log('Columns exist!');
    } catch (e) {
      console.log('Error:', e.message);
      
      console.log('Attempting to create columns...');
      await conn.query('ALTER TABLE especies ADD COLUMN especiesbiodinamicacategoria VARCHAR(50) DEFAULT NULL AFTER especiesicono');
      await conn.query('ALTER TABLE especies ADD COLUMN especiesbiodinamicanotas TEXT DEFAULT NULL AFTER especiesbiodinamicacategoria');
      console.log('Columns created successfully!');
    }
    
    await conn.end();
  } catch(e) {
    console.error('Connection error:', e);
  }
}
check();
