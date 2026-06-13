const mysql = require('mysql2');

const pool = mysql.createPool({
  host: 'srv2070.hstgr.io',
  user: 'u117557593_Verdantia',
  password: 'Hostingerja0334&',
  database: 'u117557593_Verdantia',
}).promise();

async function main() {
  const [tablesResult] = await pool.query('SHOW TABLES');
  const dbName = 'u117557593_Verdantia';
  const tableKey = `Tables_in_${dbName}`;
  const tables = tablesResult.map(r => r[tableKey]);
  
  for (const t of tables) {
    try {
      const [cols] = await pool.query(`SHOW COLUMNS FROM \`${t}\``);
      const charCols = cols.filter(c => c.Type.includes('char') || c.Type.includes('text') || c.Type.includes('int')).map(c => c.Field);
      for (const col of charCols) {
        const [rows] = await pool.query(`SELECT COUNT(*) as count FROM \`${t}\` WHERE \`${col}\` = 'postsiembra'`);
        if (rows[0].count > 0) {
          console.log(`Table ${t}, Column ${col}: ${rows[0].count} references to 'postsiembra'`);
        }
      }
    } catch(e) {
      // ignore
    }
  }
  await pool.end();
}

main().catch(console.error);
