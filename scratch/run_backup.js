const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

const dbConfig = {
  host: 'srv2070.hstgr.io',
  user: 'u117557593_Verdantia',
  password: 'Hostingerja0334&',
  database: 'u117557593_Verdantia',
  waitForConnections: true,
  connectionLimit: 1,
  connectTimeout: 10000,
};

async function generateSqlDump() {
  console.log('Connecting to database to generate SQL dump...');
  const connection = await mysql.createConnection(dbConfig);
  try {
    const [tablesResult] = await connection.query('SHOW TABLES');
    if (!tablesResult || tablesResult.length === 0) {
      throw new Error('No se encontraron tablas en la base de datos.');
    }
    
    const key = Object.keys(tablesResult[0])[0];
    const tableNames = tablesResult.map((row) => row[key]);

    let sqlDump = `-- Verdantia Database Backup\n-- Date: ${new Date().toLocaleString('es-ES')}\n\n`;
    sqlDump += `SET FOREIGN_KEY_CHECKS = 0;\n\n`;

    for (const tableName of tableNames) {
      console.log(`Dumping table: ${tableName}`);
      const [createTableResult] = await connection.query(`SHOW CREATE TABLE \`${tableName}\``);
      const createTableSql = createTableResult[0]['Create Table'];
      sqlDump += `DROP TABLE IF EXISTS \`${tableName}\`;\n`;
      sqlDump += `${createTableSql};\n\n`;

      const [rows] = await connection.query(`SELECT * FROM \`${tableName}\``);
      if (rows.length > 0) {
        const columns = Object.keys(rows[0]).map(col => `\`${col}\``).join(', ');
        
        sqlDump += `INSERT INTO \`${tableName}\` (${columns}) VALUES\n`;
        const valueStrings = rows.map((row) => {
          const values = Object.values(row).map((val) => {
            if (val === null) return 'NULL';
            if (typeof val === 'number') return val;
            if (val instanceof Date) {
              const pad = (n) => String(n).padStart(2, '0');
              const y = val.getFullYear();
              const m = pad(val.getMonth() + 1);
              const d = pad(val.getDate());
              const h = pad(val.getHours());
              const min = pad(val.getMinutes());
              const s = pad(val.getSeconds());
              return `'${y}-${m}-${d} ${h}:${min}:${s}'`;
            }
            if (typeof val === 'string') {
              const escaped = val
                .replace(/\\/g, '\\\\')
                .replace(/'/g, "\\'")
                .replace(/\n/g, '\\n')
                .replace(/\r/g, '\\r');
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
    return sqlDump;
  } finally {
    await connection.end();
  }
}

async function main() {
  try {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const timeStr = `${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
    const folderName = `Copia_${dateStr}_${timeStr}`;

    const localBackupDir = path.join('C:\\Users\\jaill\\Documents\\VERDANTIA COPIAS SEGURIDAD', folderName);
    const oneDriveBackupDir = path.join('C:\\Users\\Public\\OneDrive\\PROYECTOS\\VERDANTIA', folderName);

    console.log(`Creating local backup directory: ${localBackupDir}`);
    fs.mkdirSync(localBackupDir, { recursive: true });

    console.log(`Creating OneDrive backup directory: ${oneDriveBackupDir}`);
    fs.mkdirSync(oneDriveBackupDir, { recursive: true });

    // Generate SQL dump
    const sqlContent = await generateSqlDump();
    const localSqlPath = path.join(localBackupDir, 'verdantia-backup.sql');
    fs.writeFileSync(localSqlPath, sqlContent, 'utf8');
    console.log(`Saved SQL backup to: ${localSqlPath}`);

    // Compress project code
    const cwd = process.cwd();
    const localZipPath = path.join(localBackupDir, 'verdantia-codigo.zip');
    console.log('Compressing project code via PowerShell...');
    
    const zipCmd = `powershell -Command "Compress-Archive -Path (Get-ChildItem -Path '${cwd}' -Exclude 'node_modules', '.next', '.git', '.vercel', '.firebase') -DestinationPath '${localZipPath}' -Force"`;
    const { stdout, stderr } = await execAsync(zipCmd);
    if (stderr && stderr.trim()) {
      console.warn('Zip warning:', stderr);
    }
    console.log(`Saved ZIP backup to: ${localZipPath}`);

    // Copy to OneDrive folder
    console.log('Copying backups to OneDrive folder...');
    fs.copyFileSync(localSqlPath, path.join(oneDriveBackupDir, 'verdantia-backup.sql'));
    fs.copyFileSync(localZipPath, path.join(oneDriveBackupDir, 'verdantia-codigo.zip'));
    console.log('Backups copied to OneDrive successfully!');

    console.log('SUCCESS: All backups completed!');
  } catch (err) {
    console.error('ERROR during backup process:', err);
    process.exit(1);
  }
}

main();
