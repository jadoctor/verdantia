import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'srv2070.hstgr.io',
  user: 'u117557593_Verdantia',
  password: 'Hostingerja0334&',
  database: 'u117557593_Verdantia',
  waitForConnections: true,
  connectionLimit: 2,
  connectTimeout: 10000,
});

async function run() {
  const conn = await pool.getConnection();
  
  // Check for triggers on especies table
  const [triggers] = await conn.query(`SHOW TRIGGERS WHERE \`Table\` = 'especies'`);
  console.log('Triggers on especies:', JSON.stringify(triggers, null, 2));

  conn.release();
  await pool.end();
}

run();
