import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'srv2070.hstgr.io',
  user: 'u117557593_Verdantia',
  password: 'Hostingerja0334&',
  database: 'u117557593_Verdantia',
});

async function run() {
  try {
    const [res1] = await pool.query('SELECT COUNT(*) as total FROM especies');
    const [res2] = await pool.query('SELECT COUNT(*) as con_familia FROM especies WHERE xespeciesidfamilias IS NOT NULL');
    const [res3] = await pool.query('SELECT especiesnombre, especiesfamilia FROM especies WHERE xespeciesidfamilias IS NULL');
    
    console.log(`Total especies: ${res1[0].total}`);
    console.log(`Con familia: ${res2[0].con_familia}`);
    console.log(`Sin familia: ${res1[0].total - res2[0].con_familia}`);
    
    if (res3.length > 0) {
      console.log('\\nListado de especies SIN familia asociada (campo texto original entre paréntesis):');
      res3.forEach(r => console.log(`- ${r.especiesnombre} (${r.especiesfamilia})`));
    }
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
run();
