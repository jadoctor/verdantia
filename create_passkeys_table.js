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
    CREATE TABLE IF NOT EXISTS usuarios_passkeys (
      id INT AUTO_INCREMENT PRIMARY KEY,
      userEmail VARCHAR(255) NOT NULL,
      credentialID VARCHAR(500) NOT NULL,
      publicKey TEXT NOT NULL,
      counter BIGINT NOT NULL DEFAULT 0,
      transports VARCHAR(255),
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY (credentialID(255))
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;
  await conn.query(query);
  console.log('Table usuarios_passkeys created!');
  await conn.end();
}
run();
