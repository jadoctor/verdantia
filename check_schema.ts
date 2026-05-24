import pool from '@/lib/db';

async function test() {
    const [rows] = await pool.query('DESCRIBE usuarios_logros');
    console.log(rows);
    process.exit(0);
}

test();
