import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execAsync = promisify(exec);

/**
 * Script de copia de seguridad automatizada (Gold Standard).
 * Exporta la base de datos MySQL (Hostinger/CloudSQL) a un archivo .sql
 * y puede ser programado en un cronjob de GitHub Actions.
 */
async function backupDatabase() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFilename = `verdantia-backup-${timestamp}.sql`;
  const backupDir = path.join(process.cwd(), 'backups');

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir);
  }

  const backupPath = path.join(backupDir, backupFilename);

  // Estas variables deben existir en el entorno (.env o GitHub Secrets)
  const dbUser = process.env.DB_USER || 'root';
  const dbPass = process.env.DB_PASSWORD || '';
  const dbHost = process.env.DB_HOST || 'localhost';
  const dbName = process.env.DB_NAME || 'verdantia';

  console.log(`[Backup] Iniciando volcado de la base de datos: ${dbName}...`);

  // Omitimos warnings sobre passwords en linea de comandos para limpieza del log
  const command = `mysqldump -u ${dbUser} -p"${dbPass}" -h ${dbHost} ${dbName} > "${backupPath}" 2> /dev/null`;

  try {
    await execAsync(command);
    console.log(`✅ [Backup Exitoso] Guardado en: ${backupPath}`);
    // Aquí se podría añadir lógica para subir el backupPath a Firebase Storage
  } catch (error) {
    console.error(`❌ [Error de Backup] Falló la exportación:`, error);
    process.exit(1);
  }
}

// Permitir ejecución directa
if (require.main === module) {
  backupDatabase();
}

export default backupDatabase;
