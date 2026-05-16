import pool from '../src/lib/db';

async function run() {
  try {
    console.log("Añadiendo columna contenedoresclasificacion...");
    
    // Check if column exists to avoid duplicate errors
    const [columns]: any = await pool.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'contenedores' AND COLUMN_NAME = 'contenedoresclasificacion'
    `);

    if (columns.length === 0) {
      await pool.query(`
        ALTER TABLE contenedores 
        ADD COLUMN contenedoresclasificacion VARCHAR(50) NOT NULL DEFAULT 'ambos'
      `);
      console.log("Columna añadida con éxito.");
    }

    // Update existing records based on their type
    console.log("Actualizando la clasificación de los registros existentes...");
    
    // Bandejas y jiffys = 'semillero'
    await pool.query(`
      UPDATE contenedores 
      SET contenedoresclasificacion = 'semillero' 
      WHERE contenedorestipo IN ('bandeja_alveolos', 'pastilla_turba', 'bandeja_plana')
    `);

    // Macetas grandes y jardineras = 'maceta'
    await pool.query(`
      UPDATE contenedores 
      SET contenedoresclasificacion = 'maceta' 
      WHERE contenedorestipo IN ('maceta_mediana', 'maceta_grande', 'jardinera', 'mesa_cultivo')
    `);

    // Macetas individuales pequeñas / biodegradables = 'ambos'
    await pool.query(`
      UPDATE contenedores 
      SET contenedoresclasificacion = 'ambos' 
      WHERE contenedorestipo IN ('maceta_individual', 'biodegradable')
    `);

    console.log("Clasificaciones actualizadas con éxito.");
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}
run();
