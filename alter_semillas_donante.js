import pool from './src/lib/db.js';

async function run() {
  try {
    console.log("Añadiendo columnas de donante a la tabla semillas...");
    await pool.query(`
      ALTER TABLE semillas
      ADD COLUMN semillasdonante VARCHAR(255) NULL,
      ADD COLUMN xsemillasidusuariodonante INT NULL,
      ADD CONSTRAINT fk_semillas_usuariodonante FOREIGN KEY (xsemillasidusuariodonante) REFERENCES usuarios(idusuarios) ON DELETE SET NULL
    `);
    console.log("Columnas añadidas correctamente.");
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log("Las columnas ya existen. Ignorando.");
    } else {
      console.error("Error al alterar la tabla:", err);
    }
  } finally {
    process.exit(0);
  }
}

run();
