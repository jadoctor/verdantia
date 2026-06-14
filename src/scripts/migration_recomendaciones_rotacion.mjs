import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'srv2070.hstgr.io',
  user: 'u117557593_Verdantia',
  password: 'Hostingerja0334&',
  database: 'u117557593_Verdantia',
  waitForConnections: true,
  connectionLimit: 2,
  connectTimeout: 10000,
});

async function run() {
  const conn = await pool.getConnection();
  console.log('✅ Conectado a la BD\n');

  try {
    const [cols] = await conn.query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'u117557593_Verdantia' AND TABLE_NAME = 'familias' AND COLUMN_NAME = 'familiasprecedentes'
    `);

    if (cols.length === 0) {
      await conn.query(`
        ALTER TABLE familias 
        ADD COLUMN familiasprecedentes JSON DEFAULT NULL,
        ADD COLUMN familiassucesores JSON DEFAULT NULL
      `);
      console.log('✅ Columnas JSON familiasprecedentes y familiassucesores añadidas a familias.');
    } else {
      console.log('⏭️ Las columnas ya existen.');
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
    throw err;
  } finally {
    conn.release();
    await pool.end();
  }
}

run();
