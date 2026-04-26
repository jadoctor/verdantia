const mysql = require('mysql2/promise');

async function run() {
  const conn = await mysql.createConnection({
    host: '34.175.111.133',
    user: 'root',
    password: 'Verdantiaja0334&',
    database: 'semillas_db',
    ssl: { rejectUnauthorized: false }
  });
  
  const query = `
    CREATE TABLE IF NOT EXISTS webauthn_challenges (
      email VARCHAR(255) PRIMARY KEY,
      challenge VARCHAR(255) NOT NULL,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;
  await conn.query(query);
  console.log('Table webauthn_challenges created!');
  await conn.end();
}
run();
