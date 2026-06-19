const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({
    host: 'srv2070.hstgr.io',
    user: 'u117557593_Verdantia',
    password: 'Hostingerja0334&',
    database: 'u117557593_Verdantia',
    port: 3306
  });

  const [res] = await conn.query(`
    UPDATE plantasparte 
    SET plantaspartedescripcion = 'Toda la planta' 
    WHERE idplantasparte = 7 OR plantaspartenombre = 'Toda la planta'
  `);
  console.log(`Success: Updated description in database. Affected rows: ${res.affectedRows}`);

  await conn.end();
})().catch(e => console.error('Error:', e.message));
