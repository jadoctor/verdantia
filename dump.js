const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const { execSync } = require('child_process');

async function doBackup() {
  console.log('Iniciando backup...');
  // 1. Conectar a la DB
  const pool = mysql.createPool({
    host: 'srv2070.hstgr.io',
    user: 'u117557593_Verdantia',
    password: 'Hostingerja0334&',
    database: 'u117557593_Verdantia',
    waitForConnections: true,
    connectionLimit: 5
  });

  // 2. Generar SQL
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

  // 3. Crear carpeta en OneDrive
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const timeStr = `${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
  const folderName = `Copia_${dateStr}_${timeStr}`;
  const destDir = path.join('C:\\Users\\Public\\OneDrive\\PROYECTOS\\VERDANTIA', folderName);
  
  fs.mkdirSync(destDir, { recursive: true });
  console.log('Carpeta creada:', destDir);

  // 4. Guardar SQL
  const sqlFile = path.join(destDir, 'verdantia-backup.sql');
  fs.writeFileSync(sqlFile, sqlDump, 'utf8');
  console.log('SQL generado y guardado:', sqlFile);

  // 5. Comprimir a ZIP
  const zipFile = path.join(destDir, 'verdantia-codigo.zip');
  console.log('Comprimiendo ZIP...');
  const cwd = process.cwd();
  execSync(`powershell -Command "Compress-Archive -Path (Get-ChildItem -Path '${cwd}' -Exclude 'node_modules', '.next', '.git', '.vercel', '.firebase', 'dump.js') -DestinationPath '${zipFile}' -Force"`);
  console.log('ZIP creado y guardado:', zipFile);

  console.log('Copia de seguridad completada con éxito.');
}

doBackup().catch(console.error);
