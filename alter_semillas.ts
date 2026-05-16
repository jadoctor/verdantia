import pool from './src/lib/db';

async function migrate() {
  console.log('Alterando tabla semillas...');
  
  const connection = await pool.getConnection();
  
  try {
    await connection.query(`
      ALTER TABLE \`semillas\`
      ADD COLUMN \`semillaslugarcompra\` varchar(150) DEFAULT NULL AFTER \`semillasorigen\`,
      ADD COLUMN \`semillasmarca\` varchar(150) DEFAULT NULL AFTER \`semillaslugarcompra\`,
      ADD COLUMN \`semillasfechaenvasado\` date DEFAULT NULL AFTER \`semillasfecharecoleccion\`;
    `);
    console.log('✅ Columnas añadidas exitosamente.');
  } catch (error: any) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('Las columnas ya existen.');
    } else {
      console.error('❌ Error:', error);
    }
  } finally {
    connection.release();
    process.exit(0);
  }
}

migrate();
