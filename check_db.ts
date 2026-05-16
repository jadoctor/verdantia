import pool from './src/lib/db';

async function check() {
  const connection = await pool.getConnection();
  try {
    const [rows]: any = await connection.query('DESCRIBE cultivos');
    console.log(rows);
  } catch (error) {
    console.error(error);
  } finally {
    connection.release();
    process.exit(0);
  }
}
check();
