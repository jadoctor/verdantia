import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getUserByEmail } from '@/lib/auth';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

async function authenticateSuperadmin(request: Request) {
  const email = request.headers.get('x-user-email');
  if (!email) return null;
  const user = await getUserByEmail(email);
  if (!user || !user.roles?.includes('superadministrador')) return null;
  return user;
}

function stampVersion() {
  const pagePath = path.join(process.cwd(), 'src', 'app', 'page.tsx');
  if (!fs.existsSync(pagePath)) return;
  let content = fs.readFileSync(pagePath, 'utf8');
  
  const dateStr = new Date().toLocaleString('es-ES', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit' 
  }).replace(',', '');
  
  // Reemplazar: Verificado:</span> XX/XX/XXXX XX:XX
  content = content.replace(
    /Verificado:<\/span>\s*\d{2}\/\d{2}\/\d{4}\s*\d{2}:\d{2}/,
    `Verificado:</span> ${dateStr}`
  );
  
  fs.writeFileSync(pagePath, content, 'utf8');
}

async function runCommand(cmd: string, cwd: string): Promise<{ success: boolean; output: string }> {
  try {
    const { stdout, stderr } = await execAsync(cmd, { cwd });
    return {
      success: true,
      output: (stdout + '\n' + stderr).trim()
    };
  } catch (error: any) {
    return {
      success: false,
      output: (error.stdout || '') + '\n' + (error.stderr || '') + '\n' + (error.message || '')
    };
  }
}

async function generateSqlDump(): Promise<string> {
  const [tablesResult]: any = await pool.query('SHOW TABLES');
  if (!tablesResult || tablesResult.length === 0) {
    throw new Error('No se encontraron tablas en la base de datos.');
  }
  
  const key = Object.keys(tablesResult[0])[0];
  const tableNames = tablesResult.map((row: any) => row[key]);

  let sqlDump = `-- Verdantia Database Backup\n-- Date: ${new Date().toLocaleString('es-ES')}\n\n`;
  sqlDump += `SET FOREIGN_KEY_CHECKS = 0;\n\n`;

  for (const tableName of tableNames) {
    // Obtener estructura CREATE TABLE
    const [createTableResult]: any = await pool.query(`SHOW CREATE TABLE \`${tableName}\``);
    const createTableSql = createTableResult[0]['Create Table'];
    sqlDump += `DROP TABLE IF EXISTS \`${tableName}\`;\n`;
    sqlDump += `${createTableSql};\n\n`;

    // Obtener todos los registros
    const [rows]: any = await pool.query(`SELECT * FROM \`${tableName}\``);
    if (rows.length > 0) {
      const columns = Object.keys(rows[0]).map(col => `\`${col}\``).join(', ');
      
      sqlDump += `INSERT INTO \`${tableName}\` (${columns}) VALUES\n`;
      const valueStrings = rows.map((row: any) => {
        const values = Object.values(row).map((val: any) => {
          if (val === null) return 'NULL';
          if (typeof val === 'number') return val;
          if (val instanceof Date) {
            const pad = (n: number) => String(n).padStart(2, '0');
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
}

function incrementVersion(): string {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  if (!fs.existsSync(packageJsonPath)) return '0.1.0';
  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const parts = pkg.version.split('.').map(Number);
  parts[2] += 1; // Incrementa el parche (PATCH)
  pkg.version = parts.join('.');
  fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2), 'utf8');
  return pkg.version;
}

function reflectInUserGuide(title: string, addedList: string[], modifiedList: string[]) {
  const guidePath = path.join(process.cwd(), 'src', 'app', 'dashboard', 'admin', 'guia-usuario', 'page.tsx');
  if (!fs.existsSync(guidePath)) return;
  let content = fs.readFileSync(guidePath, 'utf8');

  // Evitar duplicar el mismo registro exacto de hoy si se ejecuta consecutivamente
  const cleanTitle = title.replace(/"/g, '');
  if (content.includes(cleanTitle)) {
    return;
  }

  const dateStr = new Date().toLocaleString('es-ES', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit' 
  }).replace(',', '');

  const filesAddedStr = addedList.length > 0 
    ? addedList.map(f => `                  <li style={{ marginBottom: '8px' }}><strong>[NUEVO]</strong> <code>${f}</code>: Creado y configurado.</li>`).join('\n')
    : '                  <li style={{ marginBottom: "8px" }}>Sin archivos nuevos.</li>';
  const filesModStr = modifiedList.length > 0
    ? modifiedList.map(f => `                  <li style={{ marginBottom: '8px' }}><strong>[MODIFICADO]</strong> <code>${f}</code>: Actualizado con mejoras y correcciones.</li>`).join('\n')
    : '                  <li style={{ marginBottom: "8px" }}>Sin archivos modificados.</li>';

  const newEntry = `            <li style={{ marginBottom: '24px' }}>
              <strong>${dateStr} – ${cleanTitle}</strong>
              <h5 style={{ color: '#166534', marginTop: '12px', marginBottom: '8px', fontSize: '1.1rem', borderBottom: '1px solid #bbf7d0', paddingBottom: '4px' }}>A. Problemas detectados</h5>
              <div style={{ background: '#ffffff', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px' }}>
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                  <li style={{ marginBottom: '8px' }}>Necesidad de salvaguardar el estado actual del código y sincronizar la base de datos de manera automatizada.</li>
                  <li style={{ marginBottom: '8px' }}>Requisito de documentar y registrar de forma síncrona en el histórico de la guía de usuario cada cambio y despliegue a producción.</li>
                </ul>
              </div>
              <h5 style={{ color: '#166534', marginTop: '16px', marginBottom: '8px', fontSize: '1.1rem', borderBottom: '1px solid #bbf7d0', paddingBottom: '4px' }}>B. Modificaciones realizadas</h5>
              <div style={{ background: '#ffffff', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px' }}>
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
${filesAddedStr}
${filesModStr}
                </ul>
              </div>
              <h5 style={{ color: '#166534', marginTop: '16px', marginBottom: '8px', fontSize: '1.1rem', borderBottom: '1px solid #bbf7d0', paddingBottom: '4px' }}>C. Problemas resueltos</h5>
              <div style={{ background: '#ffffff', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px 16px', marginBottom: '8px' }}>
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                  <li>Control de versiones y despliegue actualizados. Historial de cambios registrado con éxito.</li>
                </ul>
              </div>
            </li>`;

  const targetTag = `<ol style={{ color: '#14532d', margin: 0, paddingLeft: '20px', lineHeight: 1.5 }}>`;
  content = content.replace(targetTag, `${targetTag}\n${newEntry}`);

  fs.writeFileSync(guidePath, content, 'utf8');
}

async function getChangesInfo(cwd: string): Promise<{ added: string[]; modified: string[]; deleted: string[]; commitMessage: string }> {
  const { output } = await runCommand('git status --porcelain', cwd);
  if (!output.trim()) {
    return { added: [], modified: [], deleted: [], commitMessage: 'Backup: Sin cambios pendientes' };
  }

  const lines = output.split('\n');
  const modified: string[] = [];
  const added: string[] = [];
  const deleted: string[] = [];

  for (const line of lines) {
    if (line.length < 3) continue;
    const status = line.slice(0, 2);
    const filePath = line.slice(3).trim();
    if (!filePath) continue;

    // Solo rastreamos cambios dentro de la carpeta 'src/' (excluye scripts y scratch)
    if (!filePath.startsWith('src/')) continue;

    const cleanPath = filePath.replace(/\\/g, '/');

    if (status.includes('M')) {
      modified.push(cleanPath);
    } else if (status.includes('A') || status.includes('?')) {
      added.push(cleanPath);
    } else if (status.includes('D')) {
      deleted.push(cleanPath);
    }
  }

  const summary: string[] = [];
  if (modified.length > 0) {
    const list = modified.slice(0, 5).join(', ');
    const extra = modified.length > 5 ? ` (+${modified.length - 5} más)` : '';
    summary.push(`[MODIFICADO] ${list}${extra}`);
  }
  if (added.length > 0) {
    const list = added.slice(0, 5).join(', ');
    const extra = added.length > 5 ? ` (+${added.length - 5} más)` : '';
    summary.push(`[NUEVO] ${list}${extra}`);
  }
  if (deleted.length > 0) {
    const list = deleted.slice(0, 5).join(', ');
    const extra = deleted.length > 5 ? ` (+${deleted.length - 5} más)` : '';
    summary.push(`[ELIMINADO] ${list}${extra}`);
  }

  const commitMessage = `Mantenimiento: ${summary.join(' | ')}`;
  return { added, modified, deleted, commitMessage };
}

export async function GET(request: Request) {
  const user = await authenticateSuperadmin(request);
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const cwd = process.cwd();
    const info = await getChangesInfo(cwd);
    
    // Obtener la versión actual de package.json
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    let currentVersion = '0.1.0';
    if (fs.existsSync(packageJsonPath)) {
      const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      currentVersion = pkg.version;
    }

    // Calcular la versión que sería tras el despliegue (+1 parche)
    const parts = currentVersion.split('.').map(Number);
    parts[2] += 1;
    const nextVersion = parts.join('.');

    return NextResponse.json({
      ...info,
      currentVersion,
      nextVersion
    });
  } catch (error: any) {
    console.error('Error fetching git changes info:', error);
    return NextResponse.json({ error: 'Error al obtener estado de los cambios' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await authenticateSuperadmin(request);
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const { action } = await request.json();
    const cwd = process.cwd();

    if (action === 'local_backup') {
      const sqlContent = await generateSqlDump();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      
      return new NextResponse(sqlContent, {
        headers: {
          'Content-Type': 'application/sql',
          'Content-Disposition': `attachment; filename="verdantia-backup-${timestamp}.sql"`,
        },
      });
    }

    if (action === 'git_only') {
      const logs: string[] = [];
      logs.push(`> Iniciando subida a GitHub (solo repositorio)`);
      
      // 1. Obtener información de cambios y generar commit message
      const { added, modified, commitMessage } = await getChangesInfo(cwd);
      
      if (added.length === 0 && modified.length === 0) {
        logs.push(`> El directorio de trabajo está limpio. No hay cambios para commit.`);
        logs.push(`> Ejecutando git push por si hay commits locales pendientes...`);
        const pushRes = await runCommand('git push', cwd);
        logs.push(pushRes.output);
        return NextResponse.json({ success: pushRes.success, log: logs.join('\n') });
      }

      // 2. Reflejar cambios en la guía de usuario antes de hacer git add
      logs.push(`> Registrando modificaciones en la Guía de Usuario...`);
      try {
        reflectInUserGuide("Copia de seguridad en GitHub", added, modified);
        logs.push(`> Guía de Usuario actualizada con éxito.`);
      } catch (err: any) {
        logs.push(`> Advertencia al actualizar guía: ${err.message}`);
      }

      // 3. Agregar cambios
      logs.push(`> Agregando cambios a git...`);
      const addRes = await runCommand('git add .', cwd);
      logs.push(addRes.output);

      // 4. Crear commit con mensaje auto-generado
      logs.push(`> Creando commit auto-generado: "${commitMessage}"...`);
      const commitRes = await runCommand(`git commit -m "${commitMessage.replace(/"/g, '\\"')}"`, cwd);
      logs.push(commitRes.output);

      // 5. Push
      logs.push(`> Subiendo a GitHub...`);
      const pushRes = await runCommand('git push', cwd);
      logs.push(pushRes.output);

      return NextResponse.json({ success: commitRes.success && pushRes.success, log: logs.join('\n') });
    }

    if (action === 'git_and_deploy') {
      const logs: string[] = [];
      logs.push(`> Iniciando subida a GitHub y Despliegue en Red`);
      
      // 1. Obtener información de cambios y generar commit message
      const { added, modified, commitMessage } = await getChangesInfo(cwd);

      // 2. Modificar número de versión en package.json
      logs.push(`> Modificando número de versión en package.json...`);
      let newVersion = '0.1.0';
      try {
        newVersion = incrementVersion();
        logs.push(`> Versión incrementada con éxito a v${newVersion}.`);
      } catch (err: any) {
        logs.push(`> Error al incrementar versión: ${err.message}`);
        return NextResponse.json({ success: false, log: logs.join('\n') });
      }
      
      // 3. Reflejar cambios en la guía de usuario
      logs.push(`> Registrando modificaciones en la Guía de Usuario...`);
      try {
        reflectInUserGuide(`Despliegue v${newVersion} - Mantenimiento y Copias`, added, modified);
        logs.push(`> Guía de Usuario actualizada con éxito.`);
      } catch (err: any) {
        logs.push(`> Advertencia al actualizar guía: ${err.message}`);
      }

      // 4. Fase 0: Estampado de versión
      logs.push(`> Fase 0: Estampando fecha y hora de versión en src/app/page.tsx...`);
      try {
        stampVersion();
        logs.push(`> Fecha y hora actualizadas con éxito.`);
      } catch (err: any) {
        logs.push(`> Error estampando versión: ${err.message}`);
        return NextResponse.json({ success: false, log: logs.join('\n') });
      }

      // 5. Fase 1: Compilación local de validación
      logs.push(`> Fase 1: Ejecutando test de fuego de compilación (npm run build)...`);
      const buildRes = await runCommand('npm run build', cwd);
      logs.push(buildRes.output);
      if (!buildRes.success) {
        logs.push(`> ❌ Compilación fallida. Se aborta la subida.`);
        return NextResponse.json({ success: false, log: logs.join('\n') });
      }

      // 6. Fase 2: Control de versiones
      logs.push(`> Fase 2: Agregando cambios a git...`);
      const addRes = await runCommand('git add .', cwd);
      logs.push(addRes.output);

      const fullCommitMsg = `Despliegue v${newVersion}: ${commitMessage}`;
      logs.push(`> Creando commit de despliegue: "${fullCommitMsg}"...`);
      const commitRes = await runCommand(`git commit -m "${fullCommitMsg.replace(/"/g, '\\"')}"`, cwd);
      logs.push(commitRes.output);

      logs.push(`> Enviando commits a GitHub...`);
      const pushRes = await runCommand('git push', cwd);
      logs.push(pushRes.output);

      // 7. Fase 3: Despliegue Firebase
      logs.push(`> Fase 3: Iniciando despliegue final (firebase deploy)...`);
      const deployRes = await runCommand('firebase deploy', cwd);
      logs.push(deployRes.output);

      return NextResponse.json({ 
        success: buildRes.success && commitRes.success && pushRes.success && deployRes.success, 
        log: logs.join('\n') 
      });
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
  } catch (error: any) {
    console.error('Error en endpoint de mantenimiento:', error);
    return NextResponse.json({ error: 'Error interno de servidor', details: error.message }, { status: 500 });
  }
}
