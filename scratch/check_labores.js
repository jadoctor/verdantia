const mysql = require('mysql2/promise');

(async () => {
  const pool = mysql.createPool({
    host: '34.175.111.133',
    user: 'root',
    password: 'Verdantiaja0334&',
    database: 'semillas_db',
    ssl: { rejectUnauthorized: false }
  });

  // 1. Tables related to labores
  const [tables] = await pool.query("SHOW TABLES LIKE 'labores%'");
  console.log('=== TABLES ===');
  console.log(JSON.stringify(tables, null, 2));

  // 2. Labores catalog
  const [labores] = await pool.query('SELECT * FROM labores ORDER BY idlabores');
  console.log('\n=== LABORES CATALOG ===');
  console.log(JSON.stringify(labores, null, 2));

  // 3. Schema of laboresrealizadas
  try {
    const [desc] = await pool.query('DESCRIBE laboresrealizadas');
    console.log('\n=== LABORESREALIZADAS SCHEMA ===');
    console.log(JSON.stringify(desc, null, 2));

    const [count] = await pool.query('SELECT COUNT(*) as total FROM laboresrealizadas');
    console.log('\n=== LABORESREALIZADAS COUNT ===', count[0].total);

    const [sample] = await pool.query('SELECT * FROM laboresrealizadas LIMIT 5');
    console.log('\n=== LABORESREALIZADAS SAMPLE ===');
    console.log(JSON.stringify(sample, null, 2));
  } catch (e) {
    console.log('laboresrealizadas not found:', e.message);
  }

  await pool.end();
})();
