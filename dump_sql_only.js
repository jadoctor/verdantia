const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function doSqlBackup() {
  console.log('Iniciando volcado SQL local...');
  const pool = mysql.createPool({
    host: 'srv2070.hstgr.io',
    user: 'u117557593_Verdantia',
    password: 'Hostingerja0334&',
    database: 'u117557593_Verdantia',
    waitForConnections: true,
    connectionLimit: 5
  });

  const [tablesResult] = await pool.query('SHOW TABLES');
  const key = Object.keys(tablesResult[0])[0];
  const tableNames = tablesResult.map(row => row[key]);

  let sqlDump = `-- Verdantia Database Backup\n-- Date: ${new Date().toLocaleString('es-ES')}\n\n`;
  sqlDump += `SET FOREIGN_KEY_CHECKS = 0;\n\n`;

  for (const tableName of tableNames) {
    const [createTableResult] = await pool.query(`SHOW CREATE TABLE \`${tableName}\``);
    const createTableSql = createTableResult[0]['Create Table'];
    sqlDump += `DROP TABLE IF EXISTS \`${tableName}\`;\n`;
    sqlDump += `${createTableSql};\n\n`;

    const [rows] = await pool.query(`SELECT * FROM \`${tableName}\``);
    if (rows.length > 0) {
      const columns = Object.keys(rows[0]).map(col => `\`${col}\``).join(', ');
      sqlDump += `INSERT INTO \`${tableName}\` (${columns}) VALUES\n`;
      const valueStrings = rows.map(row => {
        const values = Object.values(row).map(val => {
          if (val === null) return 'NULL';
          if (typeof val === 'number') return val;
          if (val instanceof Date) {
            const pad = n => String(n).padStart(2, '0');
            return `'${val.getFullYear()}-${pad(val.getMonth() + 1)}-${pad(val.getDate())} ${pad(val.getHours())}:${pad(val.getMinutes())}:${pad(val.getSeconds())}'`;
          }
          if (typeof val === 'string') {
            const escaped = val.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '\\r');
            return `'${escaped}'`;
          }
          if (Buffer.isBuffer(val)) {
            return `X'${val.toString('hex')}'`;
          }
          return `'${String(val).replace(/'/g, "\\'")}'`;
        }).join(', ');
        return `(${values})`;
      }).join(',\n');
      sqlDump += `${valueStrings};\n\n`;
    }
  }
  sqlDump += `SET FOREIGN_KEY_CHECKS = 1;\n`;
  
  await pool.end();

  // Create local backups folder if it doesn't exist
  const destDir = path.join('C:\\Users\\jaill\\Documents', 'VERDANTIA COPIAS SEGURIDAD');
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const timeStr = `${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
  const fileName = `verdantia-backup-local-${dateStr}_${timeStr}.sql`;
  
  const sqlFile = path.join(destDir, fileName);
  fs.writeFileSync(sqlFile, sqlDump, 'utf8');
  console.log('SQL generado y guardado localmente en:', sqlFile);
}

doSqlBackup().catch(console.error);
