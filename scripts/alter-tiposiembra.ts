import pool from '../src/lib/db';

async function run() {
  try {
    await pool.query("ALTER TABLE especies MODIFY especiestiposiembra VARCHAR(255)");
    await pool.query("ALTER TABLE variedades MODIFY variedadestiposiembra VARCHAR(255)");
    
    // Convert 'ambas' to 'directa,semillero'
    await pool.query("UPDATE especies SET especiestiposiembra = 'directa,semillero' WHERE especiestiposiembra = 'ambas'");
    await pool.query("UPDATE variedades SET variedadestiposiembra = 'directa,semillero' WHERE variedadestiposiembra = 'ambas'");

    console.log("Database schema altered and migrated.");
  } catch (e) {
    console.log(e);
  } finally {
    process.exit(0);
  }
}
run();
