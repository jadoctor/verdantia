import pool from '../src/lib/db';

async function run() {
  try {
    // Check if semilleros exists
    const [tables]: any = await pool.query("SHOW TABLES LIKE 'semilleros'");
    if (tables.length > 0) {
      console.log("Renombrando tabla y columnas...");
      
      await pool.query(`
        ALTER TABLE semilleros
        CHANGE COLUMN idsemilleros idcontenedores INT AUTO_INCREMENT,
        CHANGE COLUMN semillerosnombre contenedoresnombre VARCHAR(255) NOT NULL,
        CHANGE COLUMN semillerostipo contenedorestipo VARCHAR(255) NOT NULL,
        CHANGE COLUMN semilleroscantidadalveolos contenedorescantidadalveolos INT DEFAULT 1,
        CHANGE COLUMN semillerosvolumenalveolocc contenedoresvolumenalveolocc INT DEFAULT 0,
        CHANGE COLUMN semillerosvolumentotallitros contenedoresvolumentotallitros DECIMAL(10,2) DEFAULT 0,
        CHANGE COLUMN semillerosdimensiones contenedoresdimensiones VARCHAR(255) DEFAULT '',
        CHANGE COLUMN semillerosformaalveolo contenedoresformaalveolo VARCHAR(100) DEFAULT '',
        CHANGE COLUMN semillerosantiespiralizacion contenedoresantiespiralizacion TINYINT(1) DEFAULT 0,
        CHANGE COLUMN semillerosmaterial contenedoresmaterial VARCHAR(255) DEFAULT '',
        CHANGE COLUMN semillerosreutilizable contenedoresreutilizable TINYINT(1) DEFAULT 1,
        CHANGE COLUMN semillerosobservaciones contenedoresobservaciones TEXT,
        RENAME TO contenedores;
      `);
      console.log("Migración completada con éxito.");
    } else {
      console.log("La tabla semilleros no existe o ya fue migrada.");
    }
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}
run();
