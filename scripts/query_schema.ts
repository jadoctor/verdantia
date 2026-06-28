import pool from '../src/lib/db';

async function querySchema() {
  const connection = await pool.getConnection();
  try {
    const [especies] = await connection.query('DESCRIBE especies');
    const [variedades] = await connection.query('DESCRIBE variedades');
    const [plantasespeciesanimales] = await connection.query('DESCRIBE plantasespeciesanimales');
    const [tables] = await connection.query('SHOW TABLES');

    console.log('--- ESPECIES ---');
    console.log(especies);
    
    console.log('--- VARIEDADES ---');
    console.log(variedades);
    
    console.log('--- PLANTA-ANIMAL ---');
    console.log(plantasespeciesanimales);

    console.log('--- TABLAS ---');
    console.log(tables);
  } finally {
    connection.release();
    process.exit(0);
  }
}

querySchema();
