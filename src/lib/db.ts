import type { Pool } from 'mysql2/promise';

// Bypass para evitar que Turbopack hashee el nombre del módulo en producción
const mysql = require('my' + 'sql2');

const pool: Pool = mysql.createPool({
  host: '34.175.111.133',
  user: 'root',
  password: 'Verdantiaja0334&',
  database: 'semillas_db',
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
  connectTimeout: 5000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  ssl: {
    rejectUnauthorized: false
  }
}).promise();

export default pool;
