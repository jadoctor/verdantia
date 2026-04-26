import pool from './src/lib/db';

async function run() {
  try {
    const query = `
      CREATE TABLE IF NOT EXISTS \`usuarios_logros\` (
        \`id_registro\` int NOT NULL AUTO_INCREMENT,
        \`idusuarios\` int NOT NULL,
        \`nombre_logro\` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
        \`fecha_desbloqueo\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id_registro\`),
        UNIQUE KEY \`user_logro_unique\` (\`idusuarios\`, \`nombre_logro\`),
        CONSTRAINT \`fk_logros_usuarios\` FOREIGN KEY (\`idusuarios\`) REFERENCES \`usuarios\` (\`idusuarios\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    await pool.query(query);
    console.log('Table usuarios_logros created successfully.');
  } catch (err) {
    console.error('Error creating table:', err);
  } finally {
    process.exit(0);
  }
}

run();
