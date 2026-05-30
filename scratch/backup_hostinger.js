const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function dump() {
  const conn = await mysql.createConnection({
    host: 'srv2070.hstgr.io',
    user: 'u117557593_Verdantia',
    password: 'Hostingerja0334&',
    database: 'u117557593_Verdantia',
    dateStrings: true  // Keep dates as strings, avoid Invalid Date errors
  });

  const [tables] = await conn.query('SHOW TABLES');
  let sql = '-- Verdantia DB Dump (Hostinger) - ' + new Date().toISOString() + '\n';
  sql += 'SET FOREIGN_KEY_CHECKS=0;\nSET NAMES utf8mb4;\n\n';

  for (const t of tables) {
    const tname = Object.values(t)[0];
    console.log('Exportando tabla: ' + tname);

    // Get CREATE TABLE
    const [[create]] = await conn.query('SHOW CREATE TABLE ??', [tname]);
    sql += 'DROP TABLE IF EXISTS `' + tname + '`;\n';
    sql += Object.values(create)[1] + ';\n\n';

    // Get rows
    const [rows] = await conn.query('SELECT * FROM ??', [tname]);
    if (rows.length > 0) {
      for (const row of rows) {
        const vals = Object.values(row).map(v => {
          if (v === null) return 'NULL';
          if (typeof v === 'number' || typeof v === 'bigint') return String(v);
          if (Buffer.isBuffer(v)) return "X'" + v.toString('hex') + "'";
          // Escape strings (dates come as strings too with dateStrings:true)
          const escaped = String(v)
            .replace(/\\/g, '\\\\')
            .replace(/'/g, "\\'")
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r');
          return "'" + escaped + "'";
        }).join(',');
        sql += 'INSERT INTO `' + tname + '` VALUES(' + vals + ');\n';
      }
      sql += '\n';
    }
  }

  sql += 'SET FOREIGN_KEY_CHECKS=1;\n';
  
  const backupFilename = 'semillas_db_backup.sql';
  fs.writeFileSync(backupFilename, sql, 'utf8');
  const stats = fs.statSync(backupFilename);
  console.log('\n✅ Backup completado con éxito!');
  console.log('📂 Archivo: ' + path.resolve(backupFilename));
  console.log('📊 Tamaño: ' + (stats.size / 1024).toFixed(1) + ' KB');
  console.log('📈 Tablas exportadas: ' + tables.length);
  await conn.end();
}

dump().catch(e => {
  console.error('❌ Error durante el backup:', e.message);
  process.exit(1);
});
