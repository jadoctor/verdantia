import pool from './src/lib/db';

async function main() {
  try {
    console.log('Alterando tabla semillas para añadir fecha de adquisición y precio...');
    await pool.query(`
      ALTER TABLE \`semillas\`
      ADD COLUMN \`semillasfechaadquisicion\` date DEFAULT NULL AFTER \`semillasfechaenvasado\`,
      ADD COLUMN \`semillasprecio\` decimal(10,2) DEFAULT NULL AFTER \`semillasfechaadquisicion\`;
    `);
    console.log('Columnas añadidas correctamente.');
  } catch (error: any) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('Las columnas ya existen.');
    } else {
      console.error('Error alterando la tabla:', error);
    }
  } finally {
    process.exit(0);
  }
}

main();
