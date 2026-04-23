import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: '34.175.111.133',
  user: 'root',
  password: 'Verdantiaja0334&',
  database: 'semillas_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: {
    rejectUnauthorized: false
  }
});

export default pool;
